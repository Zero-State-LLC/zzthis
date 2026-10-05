import { resolveMatchKey, type ParseSuccess } from "@zzthis/zz-core";
import { requireActive } from "../auth/caller.ts";
import { readJson } from "../http/body.ts";
import type { AppContext } from "../http/context.ts";
import { ApiError, json, malformed, notReady } from "../http/respond.ts";
import { MintRequest, type MintBody } from "../http/schemas.ts";
import { cleanRecord } from "../lib/text.ts";
import { iso, parseTimestamp } from "../lib/time.ts";
import { refuseBlocked } from "../moderation/content.ts";
import { matchKeyTaken, withDrawnCode } from "./draw.ts";
import { requestedHandle } from "./handles.ts";
import { checkMintScope } from "./scope.ts";
import { newRecord, writeMint, type NewRecord } from "./store.ts";
import { codeBody, type CodeRow } from "./view.ts";

const PLAIN_REROLLS = 3;

interface MintOptions {
  readonly visibility: "public" | "private";
  readonly expiresAt: string | null;
  readonly handle: ParseSuccess | null;
}

// FR-035: visibility defaults to public, and free_public is always public.
// An expiry is the server's timestamp form, in the future.
function mintOptions(c: AppContext, request: MintBody): MintOptions {
  const visibility = request.visibility ?? "public";
  if (visibility === "private" && request.scope === "free_public") {
    throw malformed();
  }
  const expiresAt = request.expires_at ?? null;
  if (
    expiresAt !== null &&
    !((parseTimestamp(expiresAt) ?? 0) > c.get("now"))
  ) {
    throw malformed();
  }
  const handle =
    request.kind === "handle"
      ? requestedHandle(request.handle, c.get("settings").blocklist)
      : null;
  return { visibility, expiresAt, handle };
}

// US2 acceptance 5: the canonical handle or 409 taken, never a substitute.
// The body does not name the owner.
async function writeHandle(
  c: AppContext,
  record: NewRecord,
  request: MintBody,
  options: MintOptions & { handle: ParseSuccess },
): Promise<CodeRow> {
  const matchKey = resolveMatchKey(options.handle);
  try {
    return await writeMint(c, record, {
      scope: request.scope,
      canonical: options.handle.canonical,
      matchKey,
      kind: "handle",
      checkWord: null,
      listVersion: null,
      singleUse: request.single_use,
      expiresAt: options.expiresAt,
      rerolls: 0,
    });
  } catch (error) {
    if (await matchKeyTaken(c.env.ZZ_DB, matchKey)) {
      throw new ApiError(409, "taken");
    }
    throw error;
  }
}

// POST /v1/codes, the steps in spec 005 Mint.
export async function mintCode(c: AppContext): Promise<Response> {
  const caller = await requireActive(c, "code.mint", "mint");
  const request = await readJson(c, MintRequest);
  await checkMintScope(c, caller, request.scope);
  if (request.kind === "plain" && !c.get("settings").mintEnabled) {
    throw notReady();
  }
  const options = mintOptions(c, request);
  const text = cleanRecord(request.record.title, request.record.body);
  if (text === null) throw malformed();
  await refuseBlocked(c, caller, text, "code.mint", {
    type: "scope",
    id: request.scope,
  });
  const record = await newRecord(c, caller.id, options.visibility, text);
  const row =
    options.handle === null
      ? await withDrawnCode(c, (code) =>
          writeMint(c, record, {
            scope: request.scope,
            ...code,
            kind: "plain",
            singleUse: request.single_use,
            expiresAt: options.expiresAt,
            rerolls: PLAIN_REROLLS,
          }),
        )
      : await writeHandle(c, record, request, {
          ...options,
          handle: options.handle,
        });
  return json(201, codeBody(row, iso(c.get("now"))));
}
