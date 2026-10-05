// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import copy from "../../../design/copy.json";
import {
  byId,
  canShare,
  queryParam,
  renderCode,
  returnPath,
  say,
  share,
  show,
} from "../src/lib/dom.ts";
import { browserEnv } from "../src/lib/page.ts";
import { t } from "../src/lib/strings.ts";

describe("strings from design/copy.json (FR-014)", () => {
  it("returns each key's text and fills placeholders", () => {
    expect(t("resolve.not_found")).toBe(copy.strings["resolve.not_found"].text);
    expect(t("account.signed_in_with", { provider: "Developer" })).toBe(
      "Signed in with Developer",
    );
    expect(t("account.support")).toBe("Questions: ");
  });
});

describe("dom helpers", () => {
  it("finds elements by id, and says what is missing", () => {
    document.body.innerHTML = '<p id="here"></p>';
    expect(byId(document, "here").id).toBe("here");
    expect(() => byId(document, "gone")).toThrow("#gone is missing");
  });

  it("shows one sentence or none", () => {
    document.body.innerHTML = '<p id="m" hidden></p>';
    const message = byId(document, "m");
    say(message, "type.empty");
    expect(message.textContent).toBe("Type a zz code.");
    expect(message.hidden).toBe(false);
    say(message, null);
    expect(message.textContent).toBe("");
    expect(message.hidden).toBe(true);
    show(message);
    expect(message.hidden).toBe(false);
  });

  it("wraps the check word in place, as text only", () => {
    document.body.innerHTML = '<p id="c"></p>';
    const target = byId(document, "c");
    renderCode(document, target, "zz-copper-lantern-sky-zz", "sky", "label");
    expect(target.textContent).toBe("zz-copper-lantern-sky-zz");
    const check = target.querySelector(".check-word");
    expect(check?.textContent).toBe("sky");
    expect(check?.getAttribute("aria-describedby")).toBe("label");
    renderCode(document, target, "zz-copper-lantern-sky-zz", "sky");
    expect(
      target.querySelector(".check-word")?.hasAttribute("aria-describedby"),
    ).toBe(false);
    renderCode(document, target, "zz-@bob-zz", null);
    expect(target.querySelector(".check-word")).toBeNull();
    renderCode(document, target, "zz-<b>x</b>-zz", "other");
    expect(target.querySelector("b")).toBeNull();
  });

  it("reads query parameters and returns only to an internal path", () => {
    expect(queryParam({ search: "?id=a%20b" }, "id")).toBe("a b");
    expect(queryParam({ search: "" }, "id")).toBeNull();
    expect(returnPath({ search: "?next=/create/" }, "/codes/")).toBe(
      "/create/",
    );
    for (const search of [
      "",
      "?next=//evil.example/",
      "?next=https://evil.example/",
      "?next=create",
    ]) {
      expect(returnPath({ search }, "/codes/")).toBe("/codes/");
    }
  });

  it("offers share only with a share sheet, and sends the code as text", async () => {
    expect(canShare({} as Navigator)).toBe(false);
    const sheet = vi.fn().mockResolvedValue(undefined);
    expect(canShare({ share: sheet } as unknown as Navigator)).toBe(true);
    await share({ share: sheet } as unknown as Navigator, "zz-a-b-c-zz");
    expect(sheet).toHaveBeenCalledWith({ text: "zz-a-b-c-zz" });
    const closed = vi
      .fn()
      .mockRejectedValue(new DOMException("closed", "AbortError"));
    await expect(
      share({ share: closed } as unknown as Navigator, "x"),
    ).resolves.toBeUndefined();
  });
});

describe("browserEnv", () => {
  it("builds the page environment from a window", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const assign = vi.fn();
    const fake = {
      document,
      fetch,
      navigator: { locks: undefined },
      location: { search: "?id=x", pathname: "/code/", assign },
    } as unknown as Window;
    const env = browserEnv(fake);
    expect(env.doc).toBe(document);
    expect(env.location.search).toBe("?id=x");
    env.go("/codes/");
    expect(assign).toHaveBeenCalledWith("/codes/");
    await env.api.discovery().catch(() => undefined);
    expect(fetch).toHaveBeenCalledWith(
      "/v1",
      expect.objectContaining({ method: "GET" }),
    );
    expect(env.win).toBe(fake);
    expect(browserEnv().doc).toBe(window.document);
  });
});
