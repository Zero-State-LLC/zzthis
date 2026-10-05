import { Validator, type Schema } from "@cfworker/json-schema";
import { expect } from "vitest";
import openapi from "../../src/generated/openapi.json";
import { TIMESTAMP } from "../../src/lib/time.ts";

// The generated openapi.json is the wire contract. Ajv compiles with
// new Function, which workerd refuses, so this uses @cfworker/json-schema
// (spec 005 plan, Technical context).
const BASE = "https://zzthis.test/openapi.json";

type Json = Record<string, unknown>;

const doc = openapi as unknown as Json;

function pointer(ref: string): Json {
  let node: unknown = doc;
  for (const part of ref.replace(/^#\//, "").split("/")) {
    node = (node as Json)[part.replace(/~1/g, "/").replace(/~0/g, "~")];
  }
  return node as Json;
}

function deref(node: Json): Json {
  let out = node;
  while (typeof out.$ref === "string") out = pointer(out.$ref);
  return out;
}

// Local $refs point into the whole document, which the validator knows as
// BASE, so an inline schema can still reach #/components/schemas.
function absolute(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(absolute);
  if (node === null || typeof node !== "object") return node;
  const out: Json = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] =
      key === "$ref" && typeof value === "string" && value.startsWith("#")
        ? `${BASE}${value}`
        : absolute(value);
  }
  return out;
}

function validate(schema: unknown, value: unknown, where: string): void {
  const validator = new Validator(absolute(schema) as Schema, "2020-12", false);
  validator.addSchema(doc as Schema, BASE);
  const result = validator.validate(value);
  expect(
    result.valid,
    `${where}: ${JSON.stringify(result.errors.slice(0, 3))}`,
  ).toBe(true);
}

function operation(operationId: string): Json {
  for (const item of Object.values(doc.paths as Json)) {
    for (const op of Object.values(item as Json)) {
      if ((op as Json).operationId === operationId) return op as Json;
    }
  }
  throw new Error(`no operation ${operationId} in openapi.json`);
}

// Every timestamp in a response is RFC 3339 UTC with exactly three
// fractional digits and Z (spec 005 Data model).
export function expectTimestamps(value: unknown, key = ""): void {
  if (Array.isArray(value)) {
    for (const item of value) expectTimestamps(item, key);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [name, inner] of Object.entries(value))
      expectTimestamps(inner, name);
    return;
  }
  if (key.endsWith("_at") && typeof value === "string") {
    expect(value, key).toMatch(TIMESTAMP);
  }
}

// The one schema helper (spec 005 plan, Tests): the status must be one the
// operation declares, and the declared headers and body must match. Returns
// the parsed body.
export async function expectMatchesSchema<T = Json>(
  response: Response,
  operationId: string,
  status: number,
): Promise<T> {
  expect(response.status, `${operationId} status`).toBe(status);
  const responses = operation(operationId).responses as Json;
  const declared = responses[String(status)] as Json | undefined;
  if (declared === undefined) {
    expect.fail(`${operationId} does not declare status ${status}`);
  }
  const spec = deref(declared);
  for (const [name, header] of Object.entries((spec.headers ?? {}) as Json)) {
    const h = deref(header as Json);
    const value = response.headers.get(name);
    if (h.required === true)
      expect(value, `${operationId} ${status} ${name}`).not.toBeNull();
    if (value === null) continue;
    const schema = h.schema as Json;
    validate(
      schema,
      schema.type === "integer" ? Number(value) : value,
      `${operationId} ${status} ${name}`,
    );
  }
  const content = (spec.content as Json | undefined)?.["application/json"] as
    Json | undefined;
  const text = await response.clone().text();
  if (content === undefined) {
    expect(text, `${operationId} ${status} has no body`).toBe("");
    return undefined as T;
  }
  expect(response.headers.get("Content-Type")).toBe("application/json");
  const body: unknown = JSON.parse(text);
  validate(content.schema, body, `${operationId} ${status} body`);
  expectTimestamps(body);
  return body as T;
}

// Every path and method in the contract, for the tests that call them all.
export function contractOperations(): {
  method: string;
  path: string;
  operationId: string;
}[] {
  const out: { method: string; path: string; operationId: string }[] = [];
  for (const [path, item] of Object.entries(doc.paths as Json)) {
    for (const [method, op] of Object.entries(item as Json)) {
      out.push({
        method: method.toUpperCase(),
        path,
        operationId: (op as Json).operationId as string,
      });
    }
  }
  return out;
}
