import { parseCode } from "@zzthis/zz-core/grammar";
import { ApiFailure, type ReportReason } from "../lib/api.ts";
import { byId, canShare, say, share, show } from "../lib/dom.ts";
import { messageFor } from "../lib/errors.ts";
import type { PageEnv } from "../lib/page.ts";

const REASONS: readonly string[] = [
  "spam",
  "harassment",
  "personal-data",
  "other",
];

// Report (design/UX.md): a sheet from Resolve. The answer is report.sent
// whether or not the code exists.
function mountReport(env: PageEnv, canonical: () => string | null): void {
  const { doc, api } = env;
  const open = byId<HTMLButtonElement>(doc, "report-open");
  const dialog = byId<HTMLDialogElement>(doc, "report-dialog");
  const form = byId<HTMLFormElement>(doc, "report-form");
  const note = byId<HTMLTextAreaElement>(doc, "report-note");
  const message = byId(doc, "report-message");
  const sent = byId(doc, "report-sent");
  open.addEventListener("click", () => {
    form.reset();
    show(form);
    show(sent, false);
    say(message, null);
    dialog.showModal();
  });
  for (const id of ["report-cancel", "report-done"]) {
    byId(doc, id).addEventListener("click", () => dialog.close());
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const reason = new FormData(form).get("reason");
    const code = canonical();
    if (
      typeof reason !== "string" ||
      !REASONS.includes(reason) ||
      code === null
    )
      return;
    try {
      await api.report(code, reason as ReportReason, note.value);
      show(form, false);
      say(message, null);
      show(sent);
    } catch (error) {
      say(message, messageFor(error, "write"));
    }
  });
}

// Type and resolve (spec 005 Web client, /). Typing only. This page sends
// no bearer token and never refreshes (FR-008).
export function mountResolve(env: PageEnv): void {
  const { doc, api } = env;
  const form = byId<HTMLFormElement>(doc, "type-form");
  const input = byId<HTMLInputElement>(doc, "code-input");
  const message = byId(doc, "type-message");
  const result = byId(doc, "result");
  const shareButton = byId<HTMLButtonElement>(doc, "result-share");
  const reportOpen = byId(doc, "report-open");
  let canonical: string | null = null;
  let shareText = "";

  async function open(text: string): Promise<void> {
    show(result, false);
    show(reportOpen, false);
    canonical = null;
    const typed = text.trim();
    if (typed === "") return say(message, "type.empty");
    const parsed = parseCode(typed);
    if (!parsed.ok) return say(message, "type.malformed");
    if (parsed.kind === "bare") return say(message, "scan.bare");
    canonical = parsed.canonical;
    say(message, "common.loading");
    try {
      const found = await api.resolve(parsed.canonical);
      say(message, null);
      byId(doc, "result-title").textContent = found.record.title;
      byId(doc, "result-body").textContent = found.record.body;
      shareText = found.share.text;
      show(shareButton, canShare(env.nav));
      show(result);
      show(reportOpen);
    } catch (error) {
      say(message, messageFor(error, "resolve"));
      // A code that reached the lookup can be reported even with no match.
      show(reportOpen, error instanceof ApiFailure && error.status === 404);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void open(input.value);
  });
  shareButton.addEventListener("click", () => void share(env.nav, shareText));
  mountReport(env, () => canonical);
}
