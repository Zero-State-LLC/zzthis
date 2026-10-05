import { parseCode, resolveMatchKey, type ParseSuccess } from "@zzthis/zz-core";
import { ApiError, malformed } from "../http/respond.ts";
import { codePoints } from "../lib/text.ts";
import type { Blocklist } from "../moderation/blocklist.ts";

// spec 002 FR-019 seed lists. Brand names wait for verification, so none
// are listed. Offensive terms come from ZZ_BLOCKLIST, outside the repo.
const SYSTEM_NAMES = [
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "security",
  "official",
  "zz",
  "zzthis",
  "zzthat",
  "zzthing",
  "zerostate",
];
const GOVERNMENT_NAMES = ["usps", "army", "irs"];

const MIN_HANDLE_LENGTH = 3;

function handleKey(name: string): string | null {
  const parsed = parseCode(`zz-@${name}-zz`);
  return parsed.ok && parsed.kind === "handle" ? resolveMatchKey(parsed) : null;
}

const reservedKeys = new WeakMap<Blocklist, ReadonlySet<string>>();

// Reserved handles compare on the G10 key, so @adm1n counts as @admin.
function reserved(blocklist: Blocklist): ReadonlySet<string> {
  let keys = reservedKeys.get(blocklist);
  if (keys === undefined) {
    const names = [...SYSTEM_NAMES, ...GOVERNMENT_NAMES, ...blocklist.terms];
    keys = new Set(
      names.map(handleKey).filter((key): key is string => key !== null),
    );
    reservedKeys.set(blocklist, keys);
  }
  return keys;
}

// A requested handle, as "@name" or as the whole code. The server
// canonicalizes it with the grammar and never substitutes another name.
// In contract 1 the server issues the handle alone: a tag or qualifier
// part is refused as malformed (INFERRED).
export function requestedHandle(
  raw: string | undefined,
  blocklist: Blocklist,
): ParseSuccess {
  if (raw === undefined) throw malformed();
  let parsed = parseCode(raw);
  if (!parsed.ok && parsed.reason === "no-marker") {
    parsed = parseCode(`zz-${raw}-zz`);
  }
  if (!parsed.ok) throw malformed(parsed.reason);
  if (parsed.kind !== "handle" || parsed.words.length !== 1) throw malformed();
  const name = (parsed.handle as string).slice(1);
  if (
    codePoints(name) < MIN_HANDLE_LENGTH ||
    reserved(blocklist).has(resolveMatchKey(parsed))
  ) {
    throw new ApiError(422, "reserved-handle");
  }
  return parsed;
}
