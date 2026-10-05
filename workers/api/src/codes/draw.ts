import {
  issueWordCode,
  parseCode,
  resolveMatchKey,
  type ParseSuccess,
} from "@zzthis/zz-core";
import type { AppContext } from "../http/context.ts";
import { failed } from "../http/respond.ts";

export interface DrawnCode {
  readonly canonical: string;
  readonly matchKey: string;
  readonly checkWord: string;
  readonly listVersion: string;
}

// FR-032: on a match_key conflict the issuer draws again, up to 8 times,
// then the call is 500 failed.
const REDRAWS = 8;

// The spec 003 issuer, then the grammar again (FR-003), so the stored form
// is the canonical form the resolver will look up.
function drawPlain(c: AppContext): DrawnCode {
  const settings = c.get("settings");
  const issued = issueWordCode(settings.wordlist, c.get("deps").random);
  // The issuer only writes codes the grammar accepts as kind plain.
  const parsed = parseCode(issued.canonical) as ParseSuccess;
  return {
    canonical: parsed.canonical,
    matchKey: resolveMatchKey(parsed),
    checkWord: parsed.words[parsed.words.length - 1] as string,
    listVersion: settings.wordlistVersion,
  };
}

export async function matchKeyTaken(
  db: D1Database,
  matchKey: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS taken FROM codes WHERE match_key = ?")
    .bind(matchKey)
    .first();
  return row !== null;
}

// Runs the write with a freshly drawn code. A unique-key conflict is a
// statement error, so the whole batch rolled back; the code is drawn again.
// Any other error is not a conflict and goes to the error mapping.
export async function withDrawnCode<T>(
  c: AppContext,
  write: (code: DrawnCode) => Promise<T>,
): Promise<T> {
  for (let draw = 0; draw <= REDRAWS; draw += 1) {
    const code = drawPlain(c);
    try {
      return await write(code);
    } catch (error) {
      if (!(await matchKeyTaken(c.env.ZZ_DB, code.matchKey))) throw error;
    }
  }
  throw failed();
}
