#!/bin/sh
# Copy the zzThis files that zzThat pins, all at one commit (spec 005 plan,
# What zzThat pins). Repo paths are kept under <dest-dir>, and PIN holds
# the sha.
# Usage: scripts/pin-zzthis.sh <dest-dir> <full-commit-sha>
# Example from zzthat: sh pin-zzthis.sh .zzthis-pin <sha>
# The sha is the full 40 hex characters. A branch name is rejected. A
# missing path fails the run, so a pin never ships a partial copy.
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: pin-zzthis.sh <dest-dir> <full-commit-sha>" >&2
  exit 2
fi

dest=$1
pin=$2

if ! printf '%s' "$pin" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "pin must be a full 40-character lowercase commit sha" >&2
  exit 2
fi

# dest is a relative path inside the consumer checkout. No absolute path,
# no parent segments, so rm -rf cannot leave that tree.
case $dest in
  "" | . | .. | /* | *..*)
    echo "dest must be a relative path with no .. segments" >&2
    exit 2
    ;;
esac
case $dest in
  *[!A-Za-z0-9._/-]*)
    echo "dest has unsupported characters" >&2
    exit 2
    ;;
esac

# The plan.md table. The wordlists are added below: every
# packages/zz-core/wordlists/*.txt, not the source folder.
paths="design/generated/Tokens.swift
design/generated/Tokens.kt
design/brand
design/fonts
design/copy.json
specs/005-v1-api/openapi.yaml
specs/003-wordlist-checkword/vectors.json
NOTICE"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

curl --proto =https --fail --silent --show-error --location \
  "https://codeload.github.com/Zero-State-LLC/zzthis/tar.gz/${pin}" \
  -o "$tmp/src.tgz"

tar -tzf "$tmp/src.tgz" > "$tmp/list"
while IFS= read -r entry; do
  case $entry in
    /* | *..*)
      echo "archive path is not safe: ${entry}" >&2
      exit 1
      ;;
  esac
done < "$tmp/list"

if tar -tvzf "$tmp/src.tgz" | grep -E '^[lh]'; then
  echo "archive contains a link; refusing to extract" >&2
  exit 1
fi

tar -xzf "$tmp/src.tgz" -C "$tmp"
root="$tmp/zzthis-${pin}"
out="$tmp/out"
mkdir -p "$out"

copy() {
  if [ ! -e "$root/$1" ]; then
    echo "$1 is not in zzThis at ${pin}" >&2
    exit 1
  fi
  mkdir -p "$out/$(dirname "$1")"
  cp -R "$root/$1" "$out/$1"
}

for path in $paths; do
  copy "$path"
done

lists=$(cd "$root" && find packages/zz-core/wordlists -maxdepth 1 -type f \
  -name '*.txt' | sort)
if [ -z "$lists" ]; then
  echo "packages/zz-core/wordlists/*.txt is not in zzThis at ${pin}" >&2
  exit 1
fi
for list in $lists; do
  copy "$list"
done

printf '%s\n' "$pin" > "$out/PIN"
mkdir -p "$(dirname "$dest")"
rm -rf "$dest"
cp -R "$out" "$dest"
echo "pinned ${pin} at ${dest}"
