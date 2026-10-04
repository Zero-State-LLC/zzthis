import { describe, expect, it } from "vitest";
import { formatCode, parseCode, type ParseFailure } from "../src/lib/grammar";

const letters32 = "a".repeat(32);
const letters33 = "a".repeat(33);

const successes: readonly {
  input: string;
  kind: "plain" | "handle" | "name" | "bare";
  canonical: string;
  tag?: string;
  handle?: string;
  qualifiers?: readonly string[];
}[] = [
  {
    input: "zz-copper-lantern-sky-zz",
    kind: "plain",
    canonical: "zz-copper-lantern-sky-zz",
  },
  {
    input: "ZZ COPPER LANTERN SKY ZZ",
    kind: "plain",
    canonical: "zz-copper-lantern-sky-zz",
  },
  {
    input: "zz-copper\tlantern-zz",
    kind: "plain",
    canonical: "zz-copper-lantern-zz",
  },
  {
    input: "zz\u2212copper\u2212lantern\u2212zz",
    kind: "plain",
    canonical: "zz-copper-lantern-zz",
  },
  {
    input: "(zz) camp bravo zz",
    kind: "plain",
    canonical: "zz-camp-bravo-zz",
  },
  {
    input: "(zz)camp bravo(zz)",
    kind: "plain",
    canonical: "zz-camp-bravo-zz",
  },
  { input: "zz-buzz-zz", kind: "plain", canonical: "zz-buzz-zz" },
  {
    input: "Zz-Copper--lantern  sky-zZ",
    kind: "plain",
    canonical: "zz-copper-lantern-sky-zz",
  },
  {
    input: "zz-copper\nlantern-sky-zz",
    kind: "plain",
    canonical: "zz-copper-lantern-sky-zz",
  },
  {
    input: "zz\u2013copper\u2013lantern\u2013zz",
    kind: "plain",
    canonical: "zz-copper-lantern-zz",
  },
  {
    input: "(zz) camp bravo four two (zz)",
    kind: "plain",
    canonical: "zz-camp-bravo-four-two-zz",
  },
  { input: "zz-hello-zz", kind: "plain", canonical: "zz-hello-zz" },
  { input: "zz-b2-smith-1-zz", kind: "plain", canonical: "zz-b2-smith-1-zz" },
  { input: "zz-1234ABCD-zz", kind: "plain", canonical: "zz-1234abcd-zz" },
  {
    input: "zz Guest WiFi connect zz",
    kind: "plain",
    canonical: "zz-guest-wifi-connect-zz",
  },
  {
    input: "zz-fn-pay-agentsmith-zz",
    kind: "plain",
    canonical: "zz-fn-pay-agentsmith-zz",
  },
  {
    input: "zz-@agentsmith-zz",
    kind: "handle",
    canonical: "zz-@agentsmith-zz",
    handle: "@agentsmith",
    qualifiers: [],
  },
  {
    input: "zz-@AgentSmith.eth-zz",
    kind: "handle",
    canonical: "zz-@agentsmith.eth-zz",
    handle: "@agentsmith.eth",
  },
  {
    input: "zz-@acme_support-zz",
    kind: "handle",
    canonical: "zz-@acme_support-zz",
    handle: "@acme_support",
  },
  {
    input: "zz@-agentsmith-zz",
    kind: "handle",
    canonical: "zz-@agentsmith-zz",
    handle: "@agentsmith",
  },
  {
    input: "zz@agentsmith-zz",
    kind: "handle",
    canonical: "zz-@agentsmith-zz",
    handle: "@agentsmith",
  },
  {
    input: `zz-@${letters32}-zz`,
    kind: "handle",
    canonical: `zz-@${letters32}-zz`,
    handle: `@${letters32}`,
  },
  {
    input: "zz-@agentsmith-neo-zz",
    kind: "handle",
    canonical: "zz-@agentsmith-neo-zz",
    handle: "@agentsmith",
    qualifiers: ["neo"],
  },
  {
    input: "zz@-AgentSmith-neo-zz",
    kind: "handle",
    canonical: "zz-@agentsmith-neo-zz",
    handle: "@agentsmith",
    qualifiers: ["neo"],
  },
  {
    input: "zz-ai@-agentsmith-zz",
    kind: "handle",
    canonical: "zz-ai-@agentsmith-zz",
    tag: "ai",
    handle: "@agentsmith",
  },
  {
    input: "zz-ai@ agentsmith-zz",
    kind: "handle",
    canonical: "zz-ai-@agentsmith-zz",
    tag: "ai",
    handle: "@agentsmith",
  },
  {
    input: "zz-vitalik.eth-zz",
    kind: "name",
    canonical: "zz-vitalik.eth-zz",
    qualifiers: [],
  },
  {
    input: "zz-Vitalik.ETH-zz",
    kind: "name",
    canonical: "zz-vitalik.eth-zz",
  },
  {
    input: "zz-vitalik.eth-wallet-zz",
    kind: "name",
    canonical: "zz-vitalik.eth-wallet-zz",
    qualifiers: ["wallet"],
  },
  {
    input: "zz-one-two-three-four-five-six-zz",
    kind: "plain",
    canonical: "zz-one-two-three-four-five-six-zz",
  },
  {
    input: "zz-bravo-smith-one-two-three-four-zz",
    kind: "plain",
    canonical: "zz-bravo-smith-one-two-three-four-zz",
  },
  { input: "zz", kind: "bare", canonical: "zz" },
  { input: "(zz)", kind: "bare", canonical: "zz" },
  { input: "ZZ", kind: "bare", canonical: "zz" },
  { input: "(ZZ)", kind: "bare", canonical: "zz" },
];

const failures: readonly { input: string; reason: ParseFailure }[] = [
  { input: "zz-zz", reason: "no-content" },
  { input: "(zz) (zz)", reason: "no-content" },
  { input: "zz-", reason: "no-closing-marker" },
  { input: "", reason: "empty" },
  { input: "   ", reason: "empty" },
  { input: " ".repeat(300), reason: "empty" },
  { input: "copper", reason: "no-marker" },
  { input: "zzcopper-lantern-zz", reason: "no-marker" },
  { input: "zzz-x-zz", reason: "no-marker" },
  { input: "( zz ) camp ( zz )", reason: "no-marker" },
  { input: "zz-copper-lantern-sky", reason: "no-closing-marker" },
  { input: "zz-@agentsmith", reason: "no-closing-marker" },
  { input: "zz-zz-zz", reason: "marker-in-body" },
  { input: "zz-구리-등불-zz", reason: "unsupported-script" },
  { input: "zz-#tag-zz", reason: "reserved-symbol" },
  { input: "zz-pay-$5-zz", reason: "reserved-symbol" },
  { input: "zz-a/b-zz", reason: "reserved-symbol" },
  { input: "zz-x:y-zz", reason: "reserved-symbol" },
  { input: "zz-ai-agent-@smith-zz", reason: "misplaced-at" },
  { input: "zz-@agentsmith-@neo-zz", reason: "misplaced-at" },
  { input: "zz-a@b@c-zz", reason: "misplaced-at" },
  { input: "zz-hello-x@y-zz", reason: "misplaced-at" },
  { input: "zz-1.2-@smith-zz", reason: "misplaced-at" },
  { input: "zz-@-zz", reason: "invalid-handle" },
  { input: "zz-@.agent-zz", reason: "invalid-handle" },
  { input: "zz-@agent.-zz", reason: "invalid-handle" },
  { input: "zz-@agent..smith-zz", reason: "invalid-handle" },
  { input: "zz-@_-zz", reason: "invalid-handle" },
  { input: `zz-@${letters33}-zz`, reason: "invalid-handle" },
  { input: "zz-acme_support-zz", reason: "invalid-character" },
  { input: "zz-example.com-zz", reason: "invalid-character" },
  { input: "zz-1.2-zz", reason: "invalid-character" },
  { input: "zz-.eth-zz", reason: "invalid-character" },
  { input: "zz-@agentsmith-neo!-zz", reason: "invalid-character" },
  { input: "zz-vitalik.eth-wallet!-zz", reason: "invalid-character" },
  { input: "x".repeat(257), reason: "too-long" },
];

describe("parseCode G9", () => {
  for (const row of successes) {
    it(`accepts ${row.canonical} from ${JSON.stringify(row.input)}`, () => {
      const parsed = parseCode(row.input);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      expect(parsed.kind).toBe(row.kind);
      expect(parsed.canonical).toBe(row.canonical);
      if (row.tag !== undefined) expect(parsed.tag).toBe(row.tag);
      if (row.handle !== undefined) expect(parsed.handle).toBe(row.handle);
      if (row.qualifiers !== undefined) {
        expect(parsed.qualifiers).toEqual(row.qualifiers);
      }
    });
  }

  for (const row of failures) {
    it(`rejects ${JSON.stringify(row.input)} as ${row.reason}`, () => {
      expect(parseCode(row.input)).toEqual({ ok: false, reason: row.reason });
    });
  }

  it("records circled and dash variants", () => {
    const circled = parseCode("(zz) camp bravo (zz)");
    const dashed = parseCode("zz-hello-zz");
    const bareDash = parseCode("zz");
    const bareCircled = parseCode("(zz)");
    expect(circled.ok && circled.variant).toBe("circled");
    expect(dashed.ok && dashed.variant).toBe("dash");
    expect(bareDash.ok && bareDash.variant).toBe("dash");
    expect(bareCircled.ok && bareCircled.variant).toBe("circled");
  });
});

describe("formatCode", () => {
  it("wraps words in dash markers", () => {
    expect(formatCode(["copper", "lantern", "sky"])).toBe(
      "zz-copper-lantern-sky-zz",
    );
  });
});
