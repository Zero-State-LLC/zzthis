import { createExecutionContext } from "cloudflare:test";
import { env as poolEnv } from "cloudflare:workers";
import { cryptoUint32, type RandomUint32 } from "@zzthis/zz-core";
import {
  LIMITER_TIMEOUT_MS,
  OUTBOUND_TIMEOUT_MS,
  type Deps,
} from "../../src/deps.ts";
import type { WorkerEnv } from "../../src/env.ts";
import type { PhotoReader } from "../../src/reads/reader.ts";
import { createWorker } from "../../src/worker.ts";
import { deriveDataKeys, type DataKeys } from "../../src/lib/crypto.ts";
import {
  fromBase64url,
  toBase64,
  toBase64url,
} from "../../src/lib/encoding.ts";
import { makeAppleSigningKey, makeIdp, type TestIdp } from "./idp.ts";

export const APPLE_BUNDLE_ID = "com.example.zzthat";
export const APPLE_SERVICES_ID = "com.example.zzthat.web";
export const APPLE_REDIRECT = "https://zz.example.test/signin/";
export const GOOGLE_WEB_ID = "web-client.apps.example.test";
export const GOOGLE_IOS_ID = "ios-client.apps.example.test";

interface Secrets {
  readonly tokenSecret: string;
  readonly dataKey: string;
  readonly signingKey: string;
  readonly applePem: string;
  readonly applePublicKey: CryptoKey;
  // The public half of ZZ_RECORD_SIGNING_KEY, to check record signatures.
  readonly signingPublicKey: CryptoKey;
}

async function generateSecrets(): Promise<Secrets> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const pkcs8 = (await crypto.subtle.exportKey(
    "pkcs8",
    pair.privateKey,
  )) as ArrayBuffer;
  const apple = await makeAppleSigningKey();
  return {
    tokenSecret: toBase64url(crypto.getRandomValues(new Uint8Array(32))),
    dataKey: toBase64url(crypto.getRandomValues(new Uint8Array(32))),
    signingKey: toBase64(new Uint8Array(pkcs8)),
    applePem: apple.pem,
    applePublicKey: apple.publicKey,
    signingPublicKey: pair.publicKey,
  };
}

let secrets: Promise<Secrets> | undefined;

// Every key is generated at run time, once per test file.
export function testSecrets(): Promise<Secrets> {
  secrets ??= generateSecrets();
  return secrets;
}

// The keys the server derives from the test ZZ_DATA_KEY.
export async function testDataKeys(): Promise<DataKeys> {
  const raw = fromBase64url((await testSecrets()).dataKey) as Uint8Array;
  return deriveDataKeys(raw);
}

// A stand-in for the web client's files, so asset tests do not depend on
// an apps/web build.
export const stubAssets = {
  async fetch(input: RequestInfo | URL): Promise<Response> {
    const url = new URL(input instanceof Request ? input.url : String(input));
    return new Response(`<!doctype html><title>${url.pathname}</title>`, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
} as unknown as Fetcher;

export type Settings = Record<string, unknown>;

// The local settings from .dev.vars.example with generated secrets. An
// override of undefined removes that setting.
export async function makeEnv(overrides: Settings = {}): Promise<WorkerEnv> {
  const s = await testSecrets();
  const merged: Settings = {
    ZZ_DB: poolEnv.ZZ_DB,
    ZZ_PHOTOS: poolEnv.ZZ_PHOTOS,
    ZZ_LIMITER: poolEnv.ZZ_LIMITER,
    ASSETS: stubAssets,
    ZZ_ENV: "local",
    ZZ_CONTRACT: "1",
    ZZ_DEV_AUTH: "true",
    ZZ_FREE_PUBLIC: "true",
    ZZ_MINT_ENABLED: "true",
    ZZ_WORDLIST_VERSION: "fixture-7",
    ZZ_PHOTO_READS: "false",
    ZZ_RECORD_SIGNING_KEY_ID: "test-1",
    ZZ_BLOCKLIST: "",
    ZZ_TOKEN_SECRET: s.tokenSecret,
    ZZ_DATA_KEY: s.dataKey,
    ZZ_RECORD_SIGNING_KEY: s.signingKey,
    ...overrides,
  };
  for (const [name, value] of Object.entries(merged)) {
    if (value === undefined) delete merged[name];
  }
  return merged as unknown as WorkerEnv;
}

export async function appleSettings(): Promise<Settings> {
  const s = await testSecrets();
  return {
    APPLE_TEAM_ID: "TEAM123456",
    APPLE_KEY_ID: "KEY1234567",
    APPLE_PRIVATE_KEY: s.applePem,
    APPLE_BUNDLE_ID,
    APPLE_SERVICES_ID,
    APPLE_WEB_REDIRECT_URI: APPLE_REDIRECT,
  };
}

export const googleSettings: Settings = {
  GOOGLE_CLIENT_IDS: `${GOOGLE_WEB_ID}, ${GOOGLE_IOS_ID}`,
};

export interface OutboundCall {
  readonly url: string;
  readonly form: URLSearchParams;
}

// Apple's token and revoke endpoints, stubbed. Each test sets the replies.
export class AppleStub {
  readonly calls: OutboundCall[] = [];
  token: () => Response | Promise<Response> = () =>
    Response.json({
      refresh_token: toBase64url(crypto.getRandomValues(new Uint8Array(24))),
    });
  revoke: () => Response | Promise<Response> = () =>
    new Response(null, { status: 200 });

  readonly fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = String(input);
    this.calls.push({
      url,
      form: new URLSearchParams(String(init?.body ?? "")),
    });
    if (url === "https://appleid.apple.com/auth/token") return this.token();
    if (url === "https://appleid.apple.com/auth/revoke") return this.revoke();
    throw new Error(`unexpected outbound call to ${url}`);
  };
}

export class Clock {
  constructor(public ms: number = Date.now()) {}
  advance(ms: number): void {
    this.ms += ms;
  }
}

export interface World {
  readonly env: WorkerEnv;
  readonly deps: Deps;
  readonly clock: Clock;
  readonly apple: TestIdp;
  readonly google: TestIdp;
  readonly appleStub: AppleStub;
  readonly worker: ReturnType<typeof createWorker>;
}

export interface WorldOptions {
  readonly settings?: Settings;
  readonly random?: RandomUint32;
  readonly photoReader?: PhotoReader | null;
  readonly outboundTimeoutMs?: number;
  readonly limiterTimeoutMs?: number;
}

let idps: Promise<[TestIdp, TestIdp]> | undefined;

// RSA key generation is slow, so the two providers are made once per file.
function testIdps(): Promise<[TestIdp, TestIdp]> {
  idps ??= Promise.all([
    makeIdp("https://appleid.apple.com"),
    makeIdp("https://accounts.google.com"),
  ]);
  return idps;
}

export async function makeWorld(options: WorldOptions = {}): Promise<World> {
  const [apple, google] = await testIdps();
  const clock = new Clock();
  const appleStub = new AppleStub();
  const deps: Deps = {
    now: () => clock.ms,
    random: options.random ?? cryptoUint32,
    appleKeys: apple.keys,
    googleKeys: google.keys,
    fetch: appleStub.fetch,
    outboundTimeoutMs: options.outboundTimeoutMs ?? OUTBOUND_TIMEOUT_MS,
    limiterTimeoutMs: options.limiterTimeoutMs ?? LIMITER_TIMEOUT_MS,
    photoReader: options.photoReader ?? null,
  };
  return {
    env: await makeEnv(options.settings),
    deps,
    clock,
    apple,
    google,
    appleStub,
    worker: createWorker(deps),
  };
}

export function executionContext(): ExecutionContext {
  return createExecutionContext();
}
