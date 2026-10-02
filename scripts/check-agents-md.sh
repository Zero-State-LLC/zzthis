#!/usr/bin/env bash
# Fail closed if a product-repo AGENTS.md is missing, oversized, or has no
# Escalation heading. Ceiling matches templates/README.md (12 KB).
set -euo pipefail

MAX_BYTES="${AGENTS_MD_MAX_BYTES:-12288}"
TARGET="${1:-AGENTS.md}"

if [[ ! -f "$TARGET" ]]; then
  echo "error: $TARGET is missing" >&2
  exit 1
fi

size="$(wc -c < "$TARGET")"
if (( size > MAX_BYTES )); then
  echo "error: $TARGET is ${size} bytes; ceiling is ${MAX_BYTES}. Move gotchas to AGENT-GOTCHAS.md." >&2
  exit 1
fi

if ! grep -qE '^##[[:space:]]+Escalation[[:space:]]*$' "$TARGET"; then
  echo "error: $TARGET has no '## Escalation' heading" >&2
  exit 1
fi

echo "ok: $TARGET (${size} bytes) has Escalation and is under ${MAX_BYTES} bytes"
