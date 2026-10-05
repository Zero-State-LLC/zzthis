import { importPKCS8 } from "jose";
import {
  isWordlistVersion,
  loadWordlist,
  type Wordlist,
  type WordlistVersion,
} from "@zzthis/zz-core";
import type { Limiter } from "./limits/limiter.ts";
import { deriveDataKeys, type DataKeys } from "./lib/crypto.ts";
import { fromBase64, fromBase64url } from "./lib/encoding.ts";
import { parseBlocklist, type Blocklist } from "./moderation/blocklist.ts";

// spec 005 Environment. Bindings come from wrangler.toml. Every setting is
// read as text that may be missing, whatever the generated types say,
// because a deploy can leave any of them out.
export interface WorkerEnv {
  readonly ZZ_DB: D1Database;
  readonly ZZ_PHOTOS: R2Bucket;
  readonly ZZ_LIMITER: DurableObjectNamespace<Limiter>;
  readonly ASSETS: Fetcher;
  readonly [setting: string]: unknown;
}

export type DeployEnv = "local" | "staging" | "production";

export interface AppleSettings {
  readonly teamId: string;
  readonly keyId: string;
  readonly privateKey: CryptoKey;
  readonly bundleId: string;
  readonly servicesId: string;
  readonly webRedirectUri: string;
}

export interface Settings {
  readonly env: DeployEnv;
  readonly freePublic: boolean;
  readonly mintEnabled: boolean;
  readonly wordlistVersion: WordlistVersion;
  readonly wordlist: Wordlist;
  readonly photoReads: boolean;
  readonly devAuth: boolean;
  readonly tokenSecret: Uint8Array;
  // Derived from ZZ_DATA_KEY with HKDF; the raw key is not kept.
  readonly dataKeys: DataKeys;
  readonly signingKey: CryptoKey;
  readonly signingKeyId: string;
  readonly blocklist: Blocklist;
  readonly apple: AppleSettings | null;
  readonly googleClientIds: readonly string[] | null;
}

export type SettingsResult =
  | { readonly ok: true; readonly settings: Settings }
  | { readonly ok: false; readonly problems: readonly string[] };

const BINDINGS = ["ZZ_DB", "ZZ_PHOTOS", "ZZ_LIMITER", "ASSETS"];

const APPLE_GROUP = [
  "APPLE_TEAM_ID",
  "APPLE_KEY_ID",
  "APPLE_PRIVATE_KEY",
  "APPLE_BUNDLE_ID",
  "APPLE_SERVICES_ID",
  "APPLE_WEB_REDIRECT_URI",
];

const DEPLOY_ENVS: readonly string[] = ["local", "staging", "production"];

// Collects problems by setting name. Values never reach the log.
class Reader {
  readonly problems = new Set<string>();

  constructor(private readonly env: WorkerEnv) {}

  text(name: string): string | undefined {
    const value = this.env[name];
    return typeof value === "string" && value !== "" ? value : undefined;
  }

  // Always required: missing or empty fails closed.
  required(name: string): string {
    const value = this.text(name);
    if (value === undefined) this.problems.add(name);
    return value ?? "";
  }

  // A var with a default of false. Any value other than true or false is a
  // mistake, so it fails closed rather than being read as either.
  flag(name: string): boolean {
    const value = this.text(name) ?? "false";
    if (value !== "true" && value !== "false") this.problems.add(name);
    return value === "true";
  }

  check(name: string, ok: boolean): void {
    if (!ok) this.problems.add(name);
  }

  // A base64url secret whose decoded length passes the check.
  secret(name: string, valid: (length: number) => boolean): Uint8Array {
    const decoded = fromBase64url(this.required(name)) ?? new Uint8Array();
    if (this.text(name) !== undefined) this.check(name, valid(decoded.length));
    return decoded;
  }
}

async function signingKey(reader: Reader): Promise<CryptoKey | null> {
  const name = "ZZ_RECORD_SIGNING_KEY";
  const der = fromBase64(reader.required(name)) ?? new Uint8Array();
  try {
    return await crypto.subtle.importKey(
      "pkcs8",
      der,
      { name: "Ed25519" },
      false,
      ["sign"],
    );
  } catch {
    if (reader.text(name) !== undefined) reader.check(name, false);
    return null;
  }
}

function isHttpsUrl(text: string): boolean {
  return URL.canParse(text) && new URL(text).protocol === "https:";
}

async function appleSettings(reader: Reader): Promise<AppleSettings | null> {
  const missing = APPLE_GROUP.filter((name) => reader.text(name) === undefined);
  if (missing.length === APPLE_GROUP.length) return null;
  // All or none: a partly set group fails closed (spec 005 Environment).
  for (const name of missing) reader.check(name, false);
  if (missing.length > 0) return null;
  const value = (name: string) => reader.text(name) as string;
  const redirect = value("APPLE_WEB_REDIRECT_URI");
  reader.check("APPLE_WEB_REDIRECT_URI", isHttpsUrl(redirect));
  try {
    return {
      teamId: value("APPLE_TEAM_ID"),
      keyId: value("APPLE_KEY_ID"),
      privateKey: await importPKCS8(value("APPLE_PRIVATE_KEY"), "ES256"),
      bundleId: value("APPLE_BUNDLE_ID"),
      servicesId: value("APPLE_SERVICES_ID"),
      webRedirectUri: redirect,
    };
  } catch {
    reader.check("APPLE_PRIVATE_KEY", false);
    return null;
  }
}

function googleClientIds(reader: Reader): readonly string[] | null {
  const value = reader.text("GOOGLE_CLIENT_IDS");
  if (value === undefined) return null;
  const ids = value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");
  reader.check("GOOGLE_CLIENT_IDS", ids.length > 0);
  return ids;
}

function deployEnv(reader: Reader): DeployEnv {
  const value = reader.required("ZZ_ENV");
  if (value !== "") reader.check("ZZ_ENV", DEPLOY_ENVS.includes(value));
  return value as DeployEnv;
}

function wordlistVersion(reader: Reader, env: DeployEnv): WordlistVersion {
  const value = reader.required("ZZ_WORDLIST_VERSION");
  const known = isWordlistVersion(value);
  if (value !== "") {
    // Production refuses fixture-7 (spec 003, Prototype defaults).
    const refused = env === "production" && value === "fixture-7";
    reader.check("ZZ_WORDLIST_VERSION", known && !refused);
  }
  return known ? value : "fixture-7";
}

async function readSettingsNow(env: WorkerEnv): Promise<SettingsResult> {
  const reader = new Reader(env);
  for (const name of BINDINGS) {
    reader.check(name, typeof env[name] === "object" && env[name] !== null);
  }
  const deploy = deployEnv(reader);
  const contract = reader.required("ZZ_CONTRACT");
  if (contract !== "") reader.check("ZZ_CONTRACT", contract === "1");
  const version = wordlistVersion(reader, deploy);
  const devAuth = reader.flag("ZZ_DEV_AUTH");
  // FR-022: developer sign-in in production is a configuration error.
  reader.check("ZZ_DEV_AUTH", !(devAuth && deploy === "production"));
  const blocklist = parseBlocklist(reader.text("ZZ_BLOCKLIST"));
  reader.check(
    "ZZ_BLOCKLIST",
    deploy !== "production" || blocklist.terms.length > 0,
  );
  const settings = {
    env: deploy,
    freePublic: reader.flag("ZZ_FREE_PUBLIC"),
    mintEnabled: reader.flag("ZZ_MINT_ENABLED"),
    wordlistVersion: version,
    wordlist: loadWordlist(version),
    photoReads: reader.flag("ZZ_PHOTO_READS"),
    devAuth,
    tokenSecret: reader.secret("ZZ_TOKEN_SECRET", (length) => length >= 32),
    signingKeyId: reader.required("ZZ_RECORD_SIGNING_KEY_ID"),
    blocklist,
    googleClientIds: googleClientIds(reader),
  };
  const dataKey = reader.secret("ZZ_DATA_KEY", (length) => length === 32);
  const key = await signingKey(reader);
  const apple = await appleSettings(reader);
  if (key === null || reader.problems.size > 0) {
    return { ok: false, problems: [...reader.problems] };
  }
  return {
    ok: true,
    settings: {
      ...settings,
      dataKeys: await deriveDataKeys(dataKey),
      signingKey: key,
      apple,
    },
  };
}

// One check per env object: the bindings object is stable for an isolate,
// so key imports run once, not on every request.
const checked = new WeakMap<WorkerEnv, Promise<SettingsResult>>();

export function readSettings(env: WorkerEnv): Promise<SettingsResult> {
  let result = checked.get(env);
  if (result === undefined) {
    result = readSettingsNow(env);
    checked.set(env, result);
  }
  return result;
}
