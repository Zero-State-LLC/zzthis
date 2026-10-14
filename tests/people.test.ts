import { describe, expect, it } from "vitest";
import { advisors } from "../src/content/people";

// [MICHAEL 2026-10-13] Aaron Godbout: card title, bio, and headshot as given.
describe("Aaron Godbout advisor card", () => {
  const aaron = advisors.find((person) => person.name === "Aaron Godbout");

  it("uses the title, bio, and headshot Michael chose", () => {
    expect(aaron?.role).toBe("AI transformation and custom AI agents");
    expect(aaron?.bio).toMatch(
      /^Aaron is a founder-operator and AI transformation leader/,
    );
    expect(aaron?.photo?.src).toBe("images/people/aaron-godbout.webp");
    expect(aaron?.profileUrl).toBeUndefined();
  });
});
