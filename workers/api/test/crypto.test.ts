import { describe, expect, it } from "vitest";
import {
  AES_KEY_INFO,
  deriveDataKeys,
  derivedKeyBytes,
  HMAC_KEY_INFO,
  hkdfSha256,
  hmacTag,
  open,
  seal,
} from "../src/lib/crypto.ts";
import {
  fromBase64,
  fromBase64url,
  toBase64,
  toBase64url,
} from "../src/lib/encoding.ts";

function bytes(hexText: string): Uint8Array {
  return new Uint8Array(
    (hexText.match(/../g) ?? []).map((pair) => parseInt(pair, 16)),
  );
}

function hex(data: Uint8Array): string {
  return [...data].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("HKDF-SHA-256 (RFC 5869)", () => {
  it("matches the RFC's SHA-256 test case 1", async () => {
    const okm = await hkdfSha256(
      bytes("0b".repeat(22)),
      bytes("000102030405060708090a0b0c"),
      bytes("f0f1f2f3f4f5f6f7f8f9"),
      42,
    );
    expect(hex(okm)).toBe(
      "3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865",
    );
  });

  it("matches the RFC's test case 3, with an empty salt and info", async () => {
    const okm = await hkdfSha256(
      bytes("0b".repeat(22)),
      new Uint8Array(),
      new Uint8Array(),
      42,
    );
    expect(hex(okm)).toBe(
      "8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8",
    );
  });
});

describe("keys derived from ZZ_DATA_KEY (D-2026-10-05-04)", () => {
  const dataKey = crypto.getRandomValues(new Uint8Array(32));

  it("uses two distinct, fixed info labels", () => {
    expect(AES_KEY_INFO).toBe("zzthis ZZ_DATA_KEY aes-gcm v1");
    expect(HMAC_KEY_INFO).toBe("zzthis ZZ_DATA_KEY hmac-sha256 v1");
  });

  it("derives two 32-byte keys that differ from each other and from the raw key", async () => {
    const aes = await derivedKeyBytes(dataKey, AES_KEY_INFO);
    const hmac = await derivedKeyBytes(dataKey, HMAC_KEY_INFO);
    expect(aes).toHaveLength(32);
    expect(hmac).toHaveLength(32);
    expect(hex(aes)).not.toBe(hex(hmac));
    expect(hex(aes)).not.toBe(hex(dataKey));
    expect(hex(hmac)).not.toBe(hex(dataKey));
    // The same input always derives the same keys.
    expect(hex(await derivedKeyBytes(dataKey, AES_KEY_INFO))).toBe(hex(aes));
  });

  it("signs with the derived HMAC key, not the raw key", async () => {
    const keys = await deriveDataKeys(dataKey);
    const tag = await hmacTag(keys, "limiter-ip", "203.0.113.7");
    const rawKey = await crypto.subtle.importKey(
      "raw",
      dataKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const raw = await crypto.subtle.sign(
      "HMAC",
      rawKey,
      new TextEncoder().encode("limiter-ip\n203.0.113.7"),
    );
    expect(tag).not.toBe(toBase64url(new Uint8Array(raw)));
    // The label keeps the uses apart.
    expect(await hmacTag(keys, "match-key", "203.0.113.7")).not.toBe(tag);
    expect(await hmacTag(keys, "limiter-ip", "203.0.113.7")).toBe(tag);
  });

  it("seals with the derived AES key, bound to its context", async () => {
    const keys = await deriveDataKeys(dataKey);
    const sealed = await seal(keys, "apple refresh value", "com.example.app");
    expect(sealed).not.toContain("apple refresh value");
    expect(await open(keys, sealed, "com.example.app")).toBe(
      "apple refresh value",
    );
    await expect(open(keys, sealed, "com.example.other")).rejects.toThrow();
    const other = await deriveDataKeys(
      crypto.getRandomValues(new Uint8Array(32)),
    );
    await expect(open(other, sealed, "com.example.app")).rejects.toThrow();
    await expect(open(keys, "not base64url!", "x")).rejects.toThrow(
      /not readable/,
    );
    await expect(open(keys, "AAAA", "x")).rejects.toThrow(/not readable/);
  });
});

describe("base64 and base64url", () => {
  it("round-trips bytes", () => {
    const data = crypto.getRandomValues(new Uint8Array(33));
    expect(fromBase64(toBase64(data))).toEqual(data);
    expect(fromBase64url(toBase64url(data))).toEqual(data);
    expect(toBase64url(new Uint8Array([0xfb, 0xff]))).toBe("-_8");
  });

  it("refuses text outside the alphabet or with misplaced padding", () => {
    expect(fromBase64("a+b/c=")).toBeNull();
    expect(fromBase64("ab$c")).toBeNull();
    expect(fromBase64url("ab+c")).toBeNull();
    expect(fromBase64("a")).toBeNull();
    expect(fromBase64("")).toEqual(new Uint8Array());
  });
});
