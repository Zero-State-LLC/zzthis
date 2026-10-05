import type { components } from "../generated/api.ts";
import openapi from "../generated/openapi.json";
import type { AppContext } from "../http/context.ts";
import { json } from "../http/respond.ts";
import { limitIp } from "../limits/enforce.ts";

type Discovery = components["schemas"]["Discovery"];

// FR-033: auth_providers lists only what this deployment accepts. dev is
// listed only when it works (FR-022), and production refuses it at the
// settings check.
export function authProviders(c: AppContext): Discovery["auth_providers"] {
  const settings = c.get("settings");
  const providers: Discovery["auth_providers"] = [];
  if (settings.apple !== null) providers.push("apple");
  if (settings.googleClientIds !== null) providers.push("google");
  if (settings.devAuth) providers.push("dev");
  return providers;
}

// GET /v1 (FR-005, FR-033).
export async function getDiscovery(c: AppContext): Promise<Response> {
  await limitIp(c, "discovery");
  const settings = c.get("settings");
  const body: Discovery = {
    contract: "1",
    free_public: settings.freePublic,
    auth_providers: authProviders(c),
    scopes: settings.freePublic
      ? ["enterprise", "logistics", "free_public"]
      : ["enterprise", "logistics"],
    wordlist_version: settings.wordlistVersion,
    photo_reads: settings.photoReads && c.get("deps").photoReader !== null,
  };
  return json(200, body);
}

// GET /v1/openapi.json (FR-002), from the module generated from openapi.yaml.
export async function getOpenApi(c: AppContext): Promise<Response> {
  await limitIp(c, "discovery");
  return json(200, openapi);
}
