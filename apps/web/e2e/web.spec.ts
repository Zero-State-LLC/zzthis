import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// spec 005 plan.md Tests, Web: Playwright against npm run dev:api -- --fresh
// with developer sign-in. Any securitypolicyviolation event, or any page
// error, fails the run.
const problems: string[] = [];

test.beforeEach(async ({ context }) => {
  problems.length = 0;
  await watch(context);
});

test.afterEach(() => {
  expect(
    problems,
    "content security policy violations and page errors",
  ).toEqual([]);
});

async function watch(context: BrowserContext): Promise<void> {
  await context.exposeBinding("zzReportViolation", (_source, line: string) => {
    problems.push(`securitypolicyviolation: ${line}`);
  });
  await context.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      const report = (
        window as unknown as { zzReportViolation: (line: string) => void }
      ).zzReportViolation;
      report(
        `${event.effectiveDirective} ${event.blockedURI} on ${location.pathname}`,
      );
    });
  });
  context.on("page", (page) => {
    page.on("pageerror", (error) =>
      problems.push(`pageerror on ${page.url()}: ${error.message}`),
    );
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text()))
        problems.push(`console: ${message.text()}`);
    });
  });
}

async function devSignIn(page: Page, next: string): Promise<void> {
  await page.goto(`/signin/?next=${next}`);
  await page.getByRole("button", { name: "Developer sign-in" }).click();
  // The sign-in page's own URL ends with next, so wait for the path itself.
  await page.waitForURL((url) => url.pathname === next);
}

async function open(page: Page, code: string): Promise<void> {
  await page.getByLabel("zz code").fill(code);
  await page.getByRole("button", { name: "Open", exact: true }).click();
}

test("sign in, create, re-roll to the cap, resolve, edit, revoke, report, delete", async ({
  page,
}) => {
  // Sign in and create.
  await devSignIn(page, "/create/");
  await page.getByLabel("Title").fill("Lost cat");
  await page.getByLabel("Message").fill("Answers to Kathy.");
  await page.getByRole("button", { name: "Get a code" }).click();
  const minted = page.locator("#minted-code");
  await expect(minted).toHaveText(/^zz-[a-z]+-[a-z]+-[a-z]+-zz$/);
  await expect(page.getByText("Check word", { exact: true })).toBeVisible();

  // Re-roll to the cap: three times, then the words stay.
  const reroll = page.getByRole("button", { name: "Get different words" });
  for (let i = 0; i < 3; i += 1) {
    const before = (await minted.textContent()) as string;
    await reroll.click();
    await expect(minted).not.toHaveText(before);
  }
  await expect(reroll).toBeHidden();
  await expect(page.getByText("These words stay.")).toBeVisible();
  const code = (await minted.textContent()) as string;

  // Sign out.
  await page.getByRole("link", { name: "Account" }).click();
  await expect(page.getByText("Signed in with Developer")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((url) => url.pathname === "/");

  // Resolve while signed out, typed in capitals with spaces.
  await open(page, code.toUpperCase().replaceAll("-", " "));
  await expect(page.locator("#result-title")).toHaveText("Lost cat");
  await expect(page.locator("#result-body")).toHaveText("Answers to Kathy.");
  await page.goto("/codes/");
  await expect(page.getByText("Sign in to see your codes.")).toBeVisible();

  // Sign in again and edit.
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Developer sign-in" }).click();
  await page.waitForURL((url) => url.pathname === "/codes/");
  await page.getByRole("link", { name: new RegExp(code) }).click();
  await expect(page.locator("#detail-title")).toHaveText("Lost cat");
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByLabel("Title")).toHaveValue("Lost cat");
  await page.getByLabel("Title").fill("Found cat");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await expect(page.locator("#detail-title")).toHaveText("Found cat");

  // Revoke, then the code is not found.
  await page.getByRole("button", { name: "Revoke code" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Revoke", exact: true })
    .click();
  await expect(
    page.getByText("This code no longer opens anything."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit" })).toBeHidden();
  await page.getByRole("link", { name: "Scan" }).click();
  await open(page, code);
  await expect(
    page.getByText("No match. Check the words and try again."),
  ).toBeVisible();

  // Report: the answer is the same whether or not the code exists.
  await page.getByRole("button", { name: "Report" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Spam").check();
  await sheet
    .getByLabel("Anything else we should know (optional)")
    .fill("Seen on a lamp post");
  await sheet.getByRole("button", { name: "Send report" }).click();
  await expect(sheet.getByText("Thanks. Your report was sent.")).toBeVisible();
  await sheet.getByRole("button", { name: "Done" }).click();

  // Delete the account.
  await page.getByRole("link", { name: "Account" }).click();
  await page.getByRole("button", { name: "Delete account" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete account" })
    .click();
  await page.waitForURL((url) => url.pathname === "/");
  await page.goto("/account/");
  await expect(page.getByText("Sign in to do this.")).toBeVisible();
});

test("two signed-in tabs at once both stay signed in", async ({ context }) => {
  const first = await context.newPage();
  await devSignIn(first, "/codes/");
  const second = await context.newPage();
  const signedIn = async (tab: Page) => {
    await expect(
      tab.locator("#codes-empty, #codes-list").first(),
    ).toBeVisible();
    await expect(tab.getByText("Sign in to see your codes.")).toBeHidden();
  };
  // Each page load refreshes from the one cookie, so both tabs refresh at
  // the same time; the lock makes them take turns.
  await Promise.all([first.goto("/codes/"), second.goto("/codes/")]);
  await Promise.all([signedIn(first), signedIn(second)]);
  await Promise.all([first.reload(), second.reload()]);
  await Promise.all([signedIn(first), signedIn(second)]);
  await Promise.all([first.goto("/account/"), second.goto("/account/")]);
  for (const tab of [first, second]) {
    await expect(tab.getByText("Signed in with Developer")).toBeVisible();
  }
});
