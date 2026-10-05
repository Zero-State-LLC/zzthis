// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountResolve } from "../src/scripts/resolve.ts";
import { t } from "../src/lib/strings.ts";
import {
  el,
  fakeEnv,
  json,
  loadPage,
  settle,
  submit,
  visibleText,
  type Handler,
} from "./helpers.ts";

const RECORD = {
  view: "public",
  canonical: "zz-copper-lantern-sky-zz",
  record: {
    title: "Lost cat",
    body: "Answers to Kathy.\nCall the shop.",
    updated_at: "x",
  },
  share: { text: "zz-copper-lantern-sky-zz", url: null },
};

beforeEach(() => loadPage(""));

async function open(
  handler: Handler,
  text: string,
  share?: (data: ShareData) => Promise<void>,
) {
  loadPage("");
  const world = fakeEnv({ handler, share });
  mountResolve(world.env);
  el<HTMLInputElement>("code-input").value = text;
  submit(el<HTMLFormElement>("type-form"));
  await settle();
  return world;
}

describe("Type and resolve (/)", () => {
  it("shows the record for any spelling of the code, with no bearer token", async () => {
    const world = await open(
      () => json(200, RECORD),
      "  ZZ COPPER LANTERN SKY ZZ ",
    );
    expect(world.calls.map((c) => c.url)).toEqual([
      "/v1/resolve/zz-copper-lantern-sky-zz",
    ]);
    expect(world.calls[0]?.headers.Authorization).toBeUndefined();
    expect(visibleText("result-title")).toBe("Lost cat");
    expect(el("result-body").textContent).toBe(
      "Answers to Kathy.\nCall the shop.",
    );
    expect(el("type-message").hidden).toBe(true);
    // No share sheet in this browser, so no Share button.
    expect(el("result-share").hidden).toBe(true);
    expect(el("report-open").hidden).toBe(false);
  });

  it("shares the canonical code as text when the browser has a share sheet", async () => {
    const sheet = vi.fn().mockResolvedValue(undefined);
    await open(() => json(200, RECORD), "zz-copper-lantern-sky-zz", sheet);
    expect(el("result-share").hidden).toBe(false);
    el("result-share").click();
    expect(sheet).toHaveBeenCalledWith({ text: "zz-copper-lantern-sky-zz" });
  });

  it("checks the typed text before asking the server", async () => {
    for (const [text, key] of [
      ["", "type.empty"],
      ["   ", "type.empty"],
      ["hello", "type.malformed"],
      ["zz-copper", "type.malformed"],
      ["zz", "scan.bare"],
      ["(zz)", "scan.bare"],
    ] as const) {
      const world = await open(() => json(500), text);
      expect(world.calls).toHaveLength(0);
      expect(visibleText("type-message")).toBe(t(key));
      expect(el("result").hidden).toBe(true);
    }
  });

  it("shows the one not-found sentence and offers a report", async () => {
    await open(
      () => json(404, { error: "not-found" }),
      "zz-copper-lantern-sky-zz",
    );
    expect(visibleText("type-message")).toBe(
      "No match. Check the words and try again.",
    );
    expect(el("result").hidden).toBe(true);
    expect(el("report-open").hidden).toBe(false);
  });

  it("asks to confirm a check-word mismatch and hides the report for other errors", async () => {
    await open(
      () => json(400, { error: "malformed", reason: "check-mismatch" }),
      "zz-copper-lantern-maple-zz",
    );
    expect(visibleText("type-message")).toBe(t("scan.check_mismatch"));
    expect(el("report-open").hidden).toBe(true);
    await open(
      () => Promise.reject(new TypeError("offline")),
      "zz-copper-lantern-sky-zz",
    );
    expect(visibleText("type-message")).toBe(t("resolve.not_on_device"));
    expect(el("report-open").hidden).toBe(true);
  });
});

describe("Report (design/UX.md)", () => {
  async function openReport(reportAnswer: () => Response | Promise<Response>) {
    const world = await open(
      (call) =>
        call.url === "/v1/reports" ? reportAnswer() : json(200, RECORD),
      "zz-copper-lantern-sky-zz",
    );
    const dialog = el<HTMLDialogElement>("report-dialog");
    dialog.showModal = vi.fn(() => dialog.setAttribute("open", ""));
    dialog.close = vi.fn(() => dialog.removeAttribute("open"));
    el("report-open").click();
    return { world, dialog };
  }

  it("sends a reason and an optional note, and always answers report.sent", async () => {
    const { world, dialog } = await openReport(() => json(202, { id: "r1" }));
    expect(dialog.showModal).toHaveBeenCalled();
    el<HTMLInputElement>("report-note").value = "Seen on a lamp post";
    (
      document.querySelector('input[value="personal-data"]') as HTMLInputElement
    ).checked = true;
    submit(el<HTMLFormElement>("report-form"));
    await settle();
    expect(world.calls.at(-1)).toMatchObject({
      url: "/v1/reports",
      body: {
        canonical: "zz-copper-lantern-sky-zz",
        reason: "personal-data",
        note: "Seen on a lamp post",
      },
    });
    expect(world.calls.at(-1)?.headers.Authorization).toBeUndefined();
    expect(el("report-form").hidden).toBe(true);
    expect(visibleText("report-sent")).toContain(
      "Thanks. Your report was sent.",
    );
    el("report-done").click();
    expect(dialog.close).toHaveBeenCalled();
  });

  it("sends nothing without a reason, keeps the note on a failure, and cancels", async () => {
    const { world, dialog } = await openReport(() =>
      json(400, { error: "malformed" }),
    );
    const sent = world.calls.length;
    submit(el<HTMLFormElement>("report-form"));
    await settle();
    expect(world.calls.length).toBe(sent);
    el<HTMLInputElement>("report-note").value = "keep me";
    (
      document.querySelector('input[value="spam"]') as HTMLInputElement
    ).checked = true;
    submit(el<HTMLFormElement>("report-form"));
    await settle();
    expect(visibleText("report-message")).toBe("Nothing was saved.");
    expect(el<HTMLInputElement>("report-note").value).toBe("keep me");
    el("report-cancel").click();
    expect(dialog.close).toHaveBeenCalled();
  });

  it("does not send when no code is open", async () => {
    const world = fakeEnv({ handler: () => json(202, { id: "r" }) });
    mountResolve(world.env);
    (
      document.querySelector('input[value="spam"]') as HTMLInputElement
    ).checked = true;
    submit(el<HTMLFormElement>("report-form"));
    await settle();
    expect(world.calls).toHaveLength(0);
  });
});
