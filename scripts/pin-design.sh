#!/bin/sh
# Copy a pinned zzThis design/ tree into a consumer checkout.
# Usage: scripts/pin-design.sh <dest-dir> <full-commit-sha>
# Example from zzthat: sh scripts/pin-design.sh vendor/zzthis-design <sha>
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: pin-design.sh <dest-dir> <full-commit-sha>" >&2
  exit 2
fi

dest=$1
pin=$2
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

curl -fsSL "https://codeload.github.com/Zero-State-LLC/zzthis/tar.gz/${pin}" -o "$tmp/src.tgz"
tar -xzf "$tmp/src.tgz" -C "$tmp"
root=$(find "$tmp" -mindepth 1 -maxdepth 1 -type d | head -n 1)

if [ ! -d "$root/design" ]; then
  echo "design/ was not in the archive for ${pin}" >&2
  exit 1
fi

rm -rf "$dest"
mkdir -p "$(dirname "$dest")"
cp -R "$root/design" "$dest"
printf '%s\n' "$pin" > "$dest/PIN"
echo "pinned ${pin} at ${dest}"
