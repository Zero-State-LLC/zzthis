#!/bin/sh
# Copy a pinned zzThis design/ tree into a consumer checkout.
# Usage: scripts/pin-design.sh <dest-dir> <full-commit-sha>
# Example from zzthat: sh scripts/pin-design.sh vendor/zzthis-design <sha>
# The sha is the full 40 hex characters. A branch name is rejected.
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: pin-design.sh <dest-dir> <full-commit-sha>" >&2
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

if [ ! -d "$root/design" ]; then
  echo "design/ was not in the archive for ${pin}" >&2
  exit 1
fi

links=$(find "$root/design" -type l || true)
if [ -n "$links" ]; then
  echo "design/ contains a symlink" >&2
  exit 1
fi

mkdir -p "$(dirname "$dest")"
rm -rf "$dest"
cp -R "$root/design" "$dest"
printf '%s\n' "$pin" > "$dest/PIN"
echo "pinned ${pin} at ${dest}"
