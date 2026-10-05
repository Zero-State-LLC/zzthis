import type { OwnedCode, OwnerRecord } from "../lib/api.ts";
import { byId, queryParam, say, show } from "../lib/dom.ts";
import { messageFor } from "../lib/errors.ts";
import type { PageEnv } from "../lib/page.ts";

export interface Owned {
  readonly id: string;
  readonly code: OwnedCode;
  readonly record: OwnerRecord;
}

// Code detail and Edit record take a code id, find its row by following
// GET /v1/me/codes, then read its record. No row after the last page, or a
// 404 record read, is the one not-found state (spec 005 Web client).
// Null when the page has nothing to show; the reason is already on screen.
export async function loadOwned(
  env: PageEnv,
  signedOutId: string,
): Promise<Owned | null> {
  const { doc, api } = env;
  const status = byId(doc, "status");
  const id = queryParam(env.location, "id");
  say(status, "common.loading");
  if (id === null || id === "") {
    say(status, "resolve.not_found");
    return null;
  }
  try {
    if ((await api.ensureSession()) === null) {
      say(status, null);
      const signIn = byId<HTMLAnchorElement>(doc, `${signedOutId}-link`);
      signIn.href = `/signin/?next=${encodeURIComponent(`${env.location.pathname}?id=${id}`)}`;
      show(byId(doc, signedOutId));
      return null;
    }
    const code = await api.findCode(id);
    if (code === null) {
      say(status, "resolve.not_found");
      return null;
    }
    const record = await api.record(code.record_id);
    say(status, null);
    return { id, code, record };
  } catch (error) {
    say(status, messageFor(error, "read"));
    return null;
  }
}
