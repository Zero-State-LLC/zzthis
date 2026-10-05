// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { t } from "../src/lib/strings.ts";
import { mountCreate } from "../src/scripts/create.ts";
import {
  el,
  fakeEnv,
  json,
  loadPage,
  settle,
  submit,
  token,
  visibleText,
  type Handler,
} from "./helpers.ts";

const DISCOVERY = {
  contract: "1",
  free_public: true,
  auth_providers: ["dev"],
  scopes: ["free_public"],
  wordlist_version: "fixture-7",
  photo_reads: false,
};

function code(canonical: string, rerolls: number) {
  return {
    id: `id-${canonical}`,
    canonical,
    check_word: canonical.split("-").at(-2),
    status: "active",
    record_id: "r1",
    scope: "free_public",
    rerolls_remaining: rerolls,
    created_at: "x",
  };
}

// A signed-in session with free_public on, unless the handler says more.
function backend(extra: Handler = () => json(500)): Handler {
  return (call) => {
    if (call.url === "/v1/auth/refresh") return json(200, token(1));
    if (call.url === "/v1") return json(200, DISCOVERY);
    return extra(call);
  };
}

async function mount(
  handler: Handler,
  share?: (data: ShareData) => Promise<void>,
) {
  loadPage("create");
  const world = fakeEnv({ handler, share });
  await mountCreate(world.env);
  return world;
}

async function create(world: { env: unknown }, title: string, body = "") {
  el<HTMLInputElement>("create-title").value = title;
  el<HTMLTextAreaElement>("create-body").value = body;
  submit(el<HTMLFormElement>("create-form"));
  await settle();
  return world;
}

describe("Create (/create/)", () => {
  it("asks a signed-out person to sign in", async () => {
    await mount(() => json(401, { error: "unauthorized" }));
    expect(el("create-signed-out").hidden).toBe(false);
    expect(el("create-form").hidden).toBe(true);
    expect(el("status").hidden).toBe(true);
    expect(
      document.querySelector("#create-signed-out a")?.getAttribute("href"),
    ).toBe("/signin/?next=/create/");
  });

  it("stays on the unavailable state while free_public is off, and never shows a code", async () => {
    await mount((call) =>
      call.url === "/v1"
        ? json(200, { ...DISCOVERY, free_public: false })
        : json(200, token(1)),
    );
    expect(el("create-unavailable").hidden).toBe(false);
    expect(el("create-form").hidden).toBe(true);
    expect(el("minted").hidden).toBe(true);
  });

  it("shows a load failure in one sentence", async () => {
    await mount(() => Promise.reject(new TypeError("offline")));
    expect(visibleText("status")).toBe(t("error.no_connection"));
  });

  it("does not send a title of only spaces", async () => {
    const world = await mount(backend());
    await create(world, "   ");
    expect(visibleText("create-message")).toBe("Add a title.");
    expect(world.calls.some((c) => c.url === "/v1/codes")).toBe(false);
  });

  it("mints a code, shows it with its check word, and re-rolls to the cap", async () => {
    const rerolls = [
      code("zz-maple-harbor-falcon-zz", 2),
      code("zz-river-sky-copper-zz", 1),
      code("zz-lantern-sky-harbor-zz", 0),
    ];
    const world = await mount(
      backend((call) =>
        call.url === "/v1/codes"
          ? json(201, code("zz-copper-lantern-sky-zz", 3))
          : json(200, rerolls.shift()),
      ),
    );
    await create(world, "Lost cat", "Answers to Kathy.");
    expect(world.calls.find((c) => c.url === "/v1/codes")?.body).toEqual({
      scope: "free_public",
      kind: "plain",
      record: { title: "Lost cat", body: "Answers to Kathy." },
    });
    expect(el("create-form").hidden).toBe(true);
    expect(el("minted").hidden).toBe(false);
    expect(el("minted-code").textContent).toBe("zz-copper-lantern-sky-zz");
    expect(el("minted-code").querySelector(".check-word")?.textContent).toBe(
      "sky",
    );
    expect(
      el("minted-code")
        .querySelector(".check-word")
        ?.getAttribute("aria-describedby"),
    ).toBe("check-word-label");
    for (const expected of [
      "zz-maple-harbor-falcon-zz",
      "zz-river-sky-copper-zz",
      "zz-lantern-sky-harbor-zz",
    ]) {
      expect(el("reroll").hidden).toBe(false);
      el("reroll").click();
      await settle();
      expect(el("minted-code").textContent).toBe(expected);
    }
    expect(el("reroll").hidden).toBe(true);
    expect(visibleText("reroll-cap")).toBe("These words stay.");
    expect(
      world.calls.filter((c) => c.url.endsWith("/reroll")).map((c) => c.url),
    ).toEqual([
      "/v1/codes/id-zz-copper-lantern-sky-zz/reroll",
      "/v1/codes/id-zz-maple-harbor-falcon-zz/reroll",
      "/v1/codes/id-zz-river-sky-copper-zz/reroll",
    ]);
  });

  it("keeps the words when the server says reroll-cap, and reports other re-roll errors", async () => {
    let answer = json(403, { error: "reroll-cap" });
    const world = await mount(
      backend((call) =>
        call.url === "/v1/codes"
          ? json(201, code("zz-copper-lantern-sky-zz", 3))
          : answer,
      ),
    );
    await create(world, "Lost cat");
    el("reroll").click();
    await settle();
    expect(el("minted-code").textContent).toBe("zz-copper-lantern-sky-zz");
    expect(el("reroll").hidden).toBe(true);
    expect(el("reroll-cap").hidden).toBe(false);
    answer = json(429, { error: "rate-limited" });
    el("reroll").click();
    await settle();
    expect(visibleText("minted-message")).toBe(
      "Wait a moment, then try again.",
    );
    expect(el<HTMLButtonElement>("reroll").disabled).toBe(false);
  });

  it("shares the minted code as text when the browser can", async () => {
    const sheet = vi.fn().mockResolvedValue(undefined);
    const world = await mount(
      backend(() => json(201, code("zz-copper-lantern-sky-zz", 3))),
      sheet,
    );
    await create(world, "Lost cat");
    expect(el("minted-share").hidden).toBe(false);
    el("minted-share").click();
    expect(sheet).toHaveBeenCalledWith({ text: "zz-copper-lantern-sky-zz" });
  });

  it("keeps the fields as typed and says why when the mint fails", async () => {
    for (const [answer, sentence] of [
      [json(400, { error: "malformed" }), "Nothing was saved."],
      [json(422, { error: "content-refused" }), t("create.content_refused")],
      [
        json(403, { error: "scope-unavailable" }),
        "Create is not available yet.",
      ],
      [json(503, { error: "not-ready" }), "Create is not available yet."],
      [json(403, { error: "forbidden" }), "You cannot do that."],
    ] as const) {
      const world = await mount(backend(() => answer.clone()));
      await create(world, "Lost cat", "Body text");
      expect(visibleText("create-message")).toBe(sentence);
      expect(el<HTMLInputElement>("create-title").value).toBe("Lost cat");
      expect(el<HTMLTextAreaElement>("create-body").value).toBe("Body text");
      expect(el("minted").hidden).toBe(true);
      expect(el<HTMLButtonElement>("create-submit").disabled).toBe(false);
    }
  });
});
