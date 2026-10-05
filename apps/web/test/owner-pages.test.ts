// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { t } from "../src/lib/strings.ts";
import { mountCodes } from "../src/scripts/codes.ts";
import { mountDetail } from "../src/scripts/detail.ts";
import { mountEdit } from "../src/scripts/edit.ts";
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

function owned(
  id: string,
  status = "active",
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    canonical: `zz-${id}-lantern-sky-zz`,
    check_word: "sky",
    status,
    record_id: `rec-${id}`,
    scope: "free_public",
    rerolls_remaining: 3,
    created_at: "x",
    title: `Title ${id}`,
    ...extra,
  };
}

const RECORD = {
  id: "rec-a",
  version: 1,
  title: "Lost cat",
  body: "Answers to Kathy.",
  updated_at: "x",
};

function signedIn(extra: Handler): Handler {
  return (call) =>
    call.url === "/v1/auth/refresh" ? json(200, token(1)) : extra(call);
}

const signedOut: Handler = () => json(401, { error: "unauthorized" });

describe("My codes (/codes/)", () => {
  async function mount(handler: Handler) {
    loadPage("codes");
    const world = fakeEnv({ handler });
    await mountCodes(world.env);
    return world;
  }

  it("lists each code with its title, and a status word when it is not active", async () => {
    await mount(
      signedIn(() =>
        json(200, {
          codes: [owned("a"), owned("b", "revoked"), owned("c", "expired")],
          next_cursor: null,
        }),
      ),
    );
    const rows = [...document.querySelectorAll("#codes-list li a")];
    expect(rows.map((a) => a.getAttribute("href"))).toEqual([
      "/code/?id=a",
      "/code/?id=b",
      "/code/?id=c",
    ]);
    expect(rows.map((a) => a.querySelector(".code")?.textContent)).toEqual([
      "zz-a-lantern-sky-zz",
      "zz-b-lantern-sky-zz",
      "zz-c-lantern-sky-zz",
    ]);
    expect(
      rows.map((a) => a.querySelector(".row-status")?.textContent ?? null),
    ).toEqual([null, "Revoked", "Expired"]);
    expect(rows[0]?.querySelector(".row-title")?.textContent).toBe("Title a");
  });

  it("shows the empty and signed-out states, and a failure", async () => {
    await mount(signedIn(() => json(200, { codes: [], next_cursor: null })));
    expect(visibleText("codes-empty")).toBe("You have no codes yet.");
    await mount(signedOut);
    expect(el("codes-signed-out").hidden).toBe(false);
    expect(el("codes-list").hidden).toBe(true);
    await mount(signedIn(() => json(403, { error: "forbidden" })));
    expect(visibleText("status")).toBe("You cannot do that.");
  });
});

describe("Code detail (/code/?id=)", () => {
  async function mount(
    handler: Handler,
    search = "?id=a",
    share?: (data: ShareData) => Promise<void>,
  ) {
    loadPage("code");
    const world = fakeEnv({ handler, search, pathname: "/code/", share });
    const dialog = el<HTMLDialogElement>("revoke-dialog");
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    await mountDetail(world.env);
    return { ...world, dialog };
  }

  function rows(
    status = "active",
    revoke: () => Response = () => json(200, { status: "revoked" }),
  ): Handler {
    return signedIn((call) => {
      if (call.url.startsWith("/v1/me/codes"))
        return json(200, { codes: [owned("a", status)], next_cursor: null });
      if (call.url === "/v1/records/rec-a") return json(200, RECORD);
      return revoke();
    });
  }

  it("shows the code, the title, the body, and the actions for an active code", async () => {
    const sheet = vi.fn().mockResolvedValue(undefined);
    await mount(rows(), "?id=a", sheet);
    expect(el("detail").hidden).toBe(false);
    expect(el("detail-code").textContent).toBe("zz-a-lantern-sky-zz");
    expect(el("detail-title").textContent).toBe("Lost cat");
    expect(el("detail-body").textContent).toBe("Answers to Kathy.");
    expect(el("detail-state").hidden).toBe(true);
    expect(el<HTMLAnchorElement>("detail-edit").getAttribute("href")).toBe(
      "/edit/?id=a",
    );
    expect(el("detail-edit").hidden).toBe(false);
    expect(el("detail-revoke").hidden).toBe(false);
    expect(el("detail-saved").hidden).toBe(true);
    el("detail-share").click();
    expect(sheet).toHaveBeenCalledWith({ text: "zz-a-lantern-sky-zz" });
  });

  it("says Saved after an edit", async () => {
    await mount(rows(), "?id=a&saved=1");
    expect(visibleText("detail-saved")).toBe("Saved.");
  });

  it("revokes after the confirm, then shows the revoked note and no Edit or Revoke", async () => {
    const { calls, dialog } = await mount(rows());
    el("detail-revoke").click();
    expect(dialog.showModal).toHaveBeenCalled();
    el("revoke-cancel").click();
    expect(dialog.close).toHaveBeenCalledTimes(1);
    expect(calls.some((c) => c.url.endsWith("/revoke"))).toBe(false);
    el("revoke-confirm").click();
    await settle();
    expect(calls.at(-1)).toMatchObject({
      method: "POST",
      url: "/v1/codes/a/revoke",
    });
    expect(visibleText("detail-revoked")).toBe(
      "This code no longer opens anything.",
    );
    expect(el("detail-edit").hidden).toBe(true);
    expect(el("detail-revoke").hidden).toBe(true);
    expect(visibleText("detail-state")).toBe("Revoked");
  });

  it("shows a revoke failure in one sentence", async () => {
    await mount(rows("active", () => json(404, { error: "not-found" })));
    el("revoke-confirm").click();
    await settle();
    expect(visibleText("status")).toBe(
      "No match. Check the words and try again.",
    );
    expect(el("detail-revoke").hidden).toBe(false);
  });

  it("offers Edit but not Revoke for a used code, and neither for a revoked one", async () => {
    await mount(rows("used"));
    expect(visibleText("detail-state")).toBe("Used");
    expect(el("detail-edit").hidden).toBe(false);
    expect(el("detail-revoke").hidden).toBe(true);
    await mount(rows("revoked"));
    expect(el("detail-edit").hidden).toBe(true);
    expect(el("detail-revoked").hidden).toBe(false);
  });

  it("shows the one not-found state for no id, no matching row, or a missing record", async () => {
    for (const [search, handler] of [
      ["", rows()],
      ["?id=", rows()],
      ["?id=zzz", rows()],
      [
        "?id=a",
        signedIn((call) =>
          call.url.startsWith("/v1/me/codes")
            ? json(200, { codes: [owned("a")], next_cursor: null })
            : json(404, { error: "not-found" }),
        ),
      ],
    ] as const) {
      await mount(handler, search);
      expect(visibleText("status")).toBe(t("resolve.not_found"));
      expect(el("detail").hidden).toBe(true);
    }
  });

  it("asks a signed-out person to sign in and come back", async () => {
    await mount(signedOut, "?id=a");
    expect(el("detail-signed-out").hidden).toBe(false);
    expect(
      el<HTMLAnchorElement>("detail-signed-out-link").getAttribute("href"),
    ).toBe("/signin/?next=%2Fcode%2F%3Fid%3Da");
    await mount(() => Promise.reject(new TypeError("offline")), "?id=a");
    expect(visibleText("status")).toBe(t("error.no_connection"));
  });
});

describe("Edit record (/edit/?id=)", () => {
  async function mount(version: () => Response) {
    loadPage("edit");
    const world = fakeEnv({
      search: "?id=a",
      pathname: "/edit/",
      handler: signedIn((call) => {
        if (call.url.startsWith("/v1/me/codes"))
          return json(200, { codes: [owned("a")], next_cursor: null });
        if (call.url === "/v1/records/rec-a") return json(200, RECORD);
        return version();
      }),
    });
    await mountEdit(world.env);
    return world;
  }

  it("fills the fields, saves a version, and returns to Code detail with Saved", async () => {
    const world = await mount(() => json(201, { id: "v2", version: 2 }));
    expect(el<HTMLInputElement>("edit-title").value).toBe("Lost cat");
    expect(el<HTMLTextAreaElement>("edit-body").value).toBe(
      "Answers to Kathy.",
    );
    el<HTMLInputElement>("edit-title").value = "Found cat";
    submit(el<HTMLFormElement>("edit-form"));
    await settle();
    expect(world.calls.at(-1)).toMatchObject({
      method: "POST",
      url: "/v1/records/rec-a/versions",
      body: { title: "Found cat", body: "Answers to Kathy." },
    });
    expect(world.went).toEqual(["/code/?id=a&saved=1"]);
  });

  it("does not send a title of only spaces, and keeps the text when a save fails", async () => {
    const world = await mount(() => json(400, { error: "malformed" }));
    el<HTMLInputElement>("edit-title").value = "  ";
    submit(el<HTMLFormElement>("edit-form"));
    await settle();
    expect(visibleText("edit-message")).toBe("Add a title.");
    expect(world.calls.some((c) => c.url.endsWith("/versions"))).toBe(false);
    el<HTMLInputElement>("edit-title").value = "Found cat";
    submit(el<HTMLFormElement>("edit-form"));
    await settle();
    expect(visibleText("edit-message")).toBe("Nothing was saved.");
    expect(el<HTMLInputElement>("edit-title").value).toBe("Found cat");
    expect(world.went).toEqual([]);
    expect(el<HTMLButtonElement>("edit-save").disabled).toBe(false);
  });

  it("shows nothing to edit for a signed-out person", async () => {
    loadPage("edit");
    const world = fakeEnv({
      handler: signedOut,
      search: "?id=a",
      pathname: "/edit/",
    });
    await mountEdit(world.env);
    expect(el("edit-signed-out").hidden).toBe(false);
    expect(el("edit-form").hidden).toBe(true);
  });
});
