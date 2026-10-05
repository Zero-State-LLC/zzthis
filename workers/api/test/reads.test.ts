import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PhotoReader, ReadOutcome } from "../src/reads/reader.ts";
import { call, count, signIn } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

const DAY = 24 * 60 * 60 * 1000;
const MAX_PHOTO = 8388608;

afterEach(() => {
  vi.restoreAllMocks();
});

// The test port (spec 005 US5): it always abstains, and records its calls.
class AbstainReader implements PhotoReader {
  readonly calls: { size: number; canonical: string | null }[] = [];
  async read(
    photo: Uint8Array,
    canonical: string | null,
  ): Promise<ReadOutcome> {
    this.calls.push({ size: photo.length, canonical });
    return { canonical: null, band: "abstain", reason: null };
  }
}

function jpeg(size = 16): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
}

function form(
  photo: Uint8Array | string | null,
  type = "image/jpeg",
  canonical?: string,
): FormData {
  const data = new FormData();
  if (typeof photo === "string") data.set("photo", photo);
  else if (photo !== null)
    data.set("photo", new Blob([photo], { type }), "read.jpg");
  if (canonical !== undefined) data.set("canonical", canonical);
  return data;
}

let uploads = 0;

// Signed-out reads count 5 per hour per IP, so each upload here comes from
// its own address unless a test sets one.
function upload(
  w: World,
  body: BodyInit,
  token?: string,
  ip = `192.0.2.${(uploads += 1)}`,
): Promise<Response> {
  return call(w, "POST", "/v1/reads", {
    raw: body,
    ip,
    ...(token === undefined ? {} : { token }),
  });
}

async function stored(w: World): Promise<{ rows: number; objects: number }> {
  const objects = await w.env.ZZ_PHOTOS.list();
  return {
    rows: await count(w, "SELECT count(*) AS n FROM read_photos"),
    objects: objects.objects.length,
  };
}

async function readsWorld(
  reader = new AbstainReader(),
): Promise<{ w: World; reader: AbstainReader }> {
  return {
    w: await makeWorld({
      settings: { ZZ_PHOTO_READS: "true" },
      photoReader: reader,
    }),
    reader,
  };
}

describe("POST /v1/reads (US5, T017)", () => {
  it("is 503 not-ready and stores nothing while photo_reads is false", async () => {
    const off = await makeWorld({ photoReader: new AbstainReader() });
    const noReader = await makeWorld({ settings: { ZZ_PHOTO_READS: "true" } });
    for (const w of [off, noReader]) {
      const response = await upload(w, form(jpeg()));
      expect(await expectMatchesSchema(response, "submitRead", 503)).toEqual({
        error: "not-ready",
      });
      expect(await stored(w)).toEqual({ rows: 0, objects: 0 });
    }
  });

  it("stores the jpeg for 30 days for review of this read and returns the port's band", async () => {
    const { w, reader } = await readsWorld();
    const alice = await signIn(w);
    const response = await upload(
      w,
      form(jpeg(), "image/jpeg", "ZZ COPPER LANTERN SKY ZZ"),
      alice.access,
    );
    const body = await expectMatchesSchema(response, "submitRead", 200);
    expect(body).toEqual({ canonical: null, band: "abstain", reason: null });
    expect(reader.calls).toEqual([
      { size: 16, canonical: "zz-copper-lantern-sky-zz" },
    ]);
    const row = await env.ZZ_DB.prepare("SELECT * FROM read_photos").first<
      Record<string, string>
    >();
    expect(row).toMatchObject({
      account_id: alice.accountId,
      canonical: "zz-copper-lantern-sky-zz",
    });
    expect(
      Date.parse(row?.expires_at as string) -
        Date.parse(row?.created_at as string),
    ).toBe(30 * DAY);
    expect(row?.object_key).toBe(`reads/${row?.id}.jpg`);
    const object = await w.env.ZZ_PHOTOS.get(row?.object_key as string);
    expect(object?.httpMetadata?.contentType).toBe("image/jpeg");
    expect(
      new Uint8Array(await (object as R2ObjectBody).arrayBuffer()),
    ).toEqual(jpeg());
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'read.create' AND result = 'ok'",
      ),
    ).toBe(1);
  });

  it("accepts a signed-out read and one with no canonical", async () => {
    const { w, reader } = await readsWorld();
    expect((await upload(w, form(jpeg()))).status).toBe(200);
    expect(
      (await upload(w, form(jpeg(), "image/jpeg", ""), "unusable")).status,
    ).toBe(200);
    expect(reader.calls.map((c) => c.canonical)).toEqual([null, null]);
    const rows = await env.ZZ_DB.prepare(
      "SELECT account_id FROM read_photos",
    ).all<{ account_id: string | null }>();
    expect(rows.results.map((r) => r.account_id)).toEqual([null, null]);
  });

  it("refuses anything but a jpeg photo, checked by its signature", async () => {
    const { w } = await readsWorld();
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    for (const body of [
      form(png),
      form(jpeg(), "image/png"),
      form(null),
      form("not a file"),
      new Uint8Array([1, 2, 3]) as unknown as BodyInit,
      form(new Uint8Array([0xff, 0xd8])),
    ]) {
      const response = await upload(w, body);
      expect(await expectMatchesSchema(response, "submitRead", 400)).toEqual({
        error: "malformed",
      });
    }
    const badCode = await upload(w, form(jpeg(), "image/jpeg", "zz-copper"));
    expect(await expectMatchesSchema(badCode, "submitRead", 400)).toEqual({
      error: "malformed",
      reason: "no-closing-marker",
    });
    expect(await stored(w)).toEqual({ rows: 0, objects: 0 });
  });

  it("refuses a photo over 8 MiB with 413 before anything reaches R2", async () => {
    const { w, reader } = await readsWorld();
    const over = await upload(w, form(jpeg(MAX_PHOTO + 1)));
    expect(await expectMatchesSchema(over, "submitRead", 413)).toEqual({
      error: "payload-too-large",
    });
    const huge = await upload(w, form(jpeg(MAX_PHOTO + 128 * 1024)));
    expect(await expectMatchesSchema(huge, "submitRead", 413)).toEqual({
      error: "payload-too-large",
    });
    expect(reader.calls).toHaveLength(0);
    expect(await stored(w)).toEqual({ rows: 0, objects: 0 });
    expect((await upload(w, form(jpeg(MAX_PHOTO)))).status).toBe(200);
  });

  it("stores nothing when the reader fails", async () => {
    const failing = new AbstainReader();
    failing.read = () => Promise.reject(new Error("reader down"));
    const { w } = await readsWorld(failing);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await expectMatchesSchema(
        await upload(w, form(jpeg())),
        "submitRead",
        500,
      ),
    ).toEqual({ error: "failed" });
    expect(await stored(w)).toEqual({ rows: 0, objects: 0 });
  });

  it("deletes the stored photo when its row or audit event fails", async () => {
    const { w } = await readsWorld();
    await env.ZZ_DB.prepare(
      "CREATE TRIGGER audit_down BEFORE INSERT ON audit_events BEGIN SELECT RAISE (ABORT, 'audit down'); END",
    ).run();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await upload(w, form(jpeg()))).status).toBe(500);
    await env.ZZ_DB.prepare("DROP TRIGGER audit_down").run();
    expect(await stored(w)).toEqual({ rows: 0, objects: 0 });
  });
});
