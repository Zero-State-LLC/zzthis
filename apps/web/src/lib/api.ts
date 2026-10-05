import type { components } from "../../../../workers/api/src/generated/api.ts";

type Schemas = components["schemas"];
export type Discovery = Schemas["Discovery"];
export type Code = Schemas["Code"];
export type OwnedCode = Schemas["OwnedCode"];
export type CodePage = Schemas["CodePage"];
export type OwnerRecord = Schemas["OwnerRecord"];
export type Resolved = Schemas["Resolve"];
export type Account = Schemas["Account"];
export type ReportReason = Schemas["ReportRequest"]["reason"];
type TokenResponse = Schemas["TokenResponse"];

// A refresh starts this long before the access token expires.
const SKEW_MS = 30_000;
// One lock name for every tab, so two tabs never send one refresh token
// at once (spec 005 Web session, FR-021).
export const REFRESH_LOCK = "zz-refresh";
// The developer sign-in subject for this client (FR-022). Local and test
// runs only; production refuses developer sign-in.
export const DEV_SUBJECT = "dev:web";

// A /v1 answer other than the expected status, with the contract's error
// code and reason.
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    readonly reason: string | null,
  ) {
    super(`${status} ${code ?? ""}`.trim());
  }
}

// The request never reached the server.
export class Offline extends Error {}

// No session: the refresh cookie is missing, expired, or revoked.
export class SignedOut extends Error {}

export interface Deps {
  readonly fetch: typeof fetch;
  readonly locks: LockManager | undefined;
  readonly now: () => number;
}

interface SendOptions {
  readonly body?: unknown;
  readonly bearer?: string;
  readonly noStore?: boolean;
}

function path(...parts: string[]): string {
  return parts.map(encodeURIComponent).join("/");
}

export function createApi(deps: Deps) {
  // The access token lives in memory only, never in web storage
  // (D-2026-10-05-02). A new page load gets a new one from the cookie.
  let token: string | null = null;
  let expiresAt = 0;
  let refreshing: Promise<string | null> | null = null;

  async function send(
    method: string,
    url: string,
    options: SendOptions = {},
  ): Promise<Response> {
    const headers: Record<string, string> = { "X-ZZ-Contract": "1" };
    if (options.body !== undefined)
      headers["Content-Type"] = "application/json";
    if (options.bearer !== undefined) {
      headers.Authorization = `Bearer ${options.bearer}`;
    }
    const init: RequestInit = { method, headers, credentials: "same-origin" };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);
    // The browser's HTTP cache never answers a resolve; the edge cache is
    // the only resolve cache for the web.
    if (options.noStore === true) init.cache = "no-store";
    try {
      return await deps.fetch(url, init);
    } catch {
      throw new Offline();
    }
  }

  async function expectStatus<T>(
    response: Response,
    status: number,
  ): Promise<T> {
    if (response.status !== status) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        reason?: string;
      };
      throw new ApiFailure(
        response.status,
        body.error ?? null,
        body.reason ?? null,
      );
    }
    return (status === 204 ? undefined : await response.json()) as T;
  }

  function remember(session: TokenResponse): void {
    token = session.access_token;
    expiresAt = deps.now() + session.expires_in * 1000;
  }

  function clear(): void {
    token = null;
    expiresAt = 0;
  }

  function current(): string | null {
    return token !== null && deps.now() < expiresAt - SKEW_MS ? token : null;
  }

  // Runs inside the lock, so it checks the in-memory token again: another
  // call may have refreshed while this one waited.
  async function refresh(): Promise<string | null> {
    const held = current();
    if (held !== null) return held;
    const response = await send("POST", "/v1/auth/refresh", { body: {} });
    if (response.status === 401) {
      clear();
      return null;
    }
    remember(await expectStatus<TokenResponse>(response, 200));
    return token;
  }

  // Before any call that sends a bearer token. One shared promise per page,
  // and the lock across tabs, make one refresh.
  function ensureSession(): Promise<string | null> {
    const held = current();
    if (held !== null) return Promise.resolve(held);
    refreshing ??= (
      deps.locks === undefined
        ? refresh()
        : deps.locks.request(REFRESH_LOCK, refresh)
    ).finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  // A 401 means the token was refused: refresh once and retry once. Only a
  // 401 from the refresh itself signs the person out (FR-021).
  async function authed(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<Response> {
    const first = await ensureSession();
    if (first === null) throw new SignedOut();
    const response = await send(method, url, { body, bearer: first });
    if (response.status !== 401) return response;
    if (token === first) clear();
    const second = await ensureSession();
    if (second === null) throw new SignedOut();
    return send(method, url, { body, bearer: second });
  }

  async function codePage(cursor: string | null): Promise<CodePage> {
    const query =
      cursor === null ? "" : `&cursor=${encodeURIComponent(cursor)}`;
    return expectStatus<CodePage>(
      await authed("GET", `/v1/me/codes?limit=50${query}`),
      200,
    );
  }

  async function allCodes(): Promise<OwnedCode[]> {
    const codes: OwnedCode[] = [];
    let cursor: string | null = null;
    do {
      const page: CodePage = await codePage(cursor);
      codes.push(...page.codes);
      cursor = page.next_cursor;
    } while (cursor !== null);
    return codes;
  }

  return {
    ensureSession,
    clear,
    async discovery(): Promise<Discovery> {
      return expectStatus<Discovery>(await send("GET", "/v1"), 200);
    },
    // No Authorization and no refresh: / never signs in (FR-008).
    async resolve(canonical: string): Promise<Resolved> {
      const response = await send("GET", `/v1/resolve/${path(canonical)}`, {
        noStore: true,
      });
      return expectStatus<Resolved>(response, 200);
    },
    async report(
      canonical: string,
      reason: ReportReason,
      note: string,
    ): Promise<void> {
      const response = await send("POST", "/v1/reports", {
        body: { canonical, reason, note },
      });
      await expectStatus<unknown>(response, 202);
    },
    async nonce(): Promise<string> {
      const body = await expectStatus<{ nonce: string }>(
        await send("POST", "/v1/auth/nonce"),
        200,
      );
      return body.nonce;
    },
    async signIn(
      provider: "apple" | "google" | "dev",
      idToken: string,
      nonce: string,
      authorizationCode?: string,
    ): Promise<void> {
      const body: Record<string, string> = {
        provider,
        client: "web",
        id_token: idToken,
        nonce,
      };
      if (authorizationCode !== undefined)
        body.authorization_code = authorizationCode;
      remember(
        await expectStatus<TokenResponse>(
          await send("POST", "/v1/auth/token", { body }),
          200,
        ),
      );
    },
    // The server clears the cookie; this clears the in-memory token.
    async signOut(): Promise<void> {
      const response = await send("POST", "/v1/auth/revoke", { body: {} });
      if (response.status !== 401) await expectStatus<void>(response, 204);
      clear();
    },
    async me(): Promise<Account> {
      return expectStatus<Account>(await authed("GET", "/v1/me"), 200);
    },
    async deleteMe(): Promise<void> {
      await expectStatus<void>(await authed("DELETE", "/v1/me"), 204);
      clear();
    },
    async mint(title: string, body: string): Promise<Code> {
      const request = {
        scope: "free_public",
        kind: "plain",
        record: { title, body },
      };
      return expectStatus<Code>(
        await authed("POST", "/v1/codes", request),
        201,
      );
    },
    async reroll(id: string): Promise<Code> {
      return expectStatus<Code>(
        await authed("POST", `/v1/codes/${path(id)}/reroll`),
        200,
      );
    },
    async revoke(id: string): Promise<void> {
      await expectStatus<unknown>(
        await authed("POST", `/v1/codes/${path(id)}/revoke`),
        200,
      );
    },
    allCodes,
    // Code detail and Edit record find the row by its code id, following
    // next_cursor (spec 005 Web client). Null when no row matches.
    async findCode(id: string): Promise<OwnedCode | null> {
      let cursor: string | null = null;
      do {
        const page: CodePage = await codePage(cursor);
        const found = page.codes.find((code) => code.id === id);
        if (found !== undefined) return found;
        cursor = page.next_cursor;
      } while (cursor !== null);
      return null;
    },
    async record(id: string): Promise<OwnerRecord> {
      return expectStatus<OwnerRecord>(
        await authed("GET", `/v1/records/${path(id)}`),
        200,
      );
    },
    async addVersion(
      recordId: string,
      title: string,
      body: string,
    ): Promise<void> {
      const response = await authed(
        "POST",
        `/v1/records/${path(recordId)}/versions`,
        { title, body },
      );
      await expectStatus<unknown>(response, 201);
    },
  };
}

export type Api = ReturnType<typeof createApi>;
