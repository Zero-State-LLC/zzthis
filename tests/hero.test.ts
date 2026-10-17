import { describe, expect, it } from "vitest";
import { consumerHow, featured, hero, heroMore } from "../src/content/hero";

// Moved from content.test.ts for the max-lines rule.
describe("hero and featured statement (spec 3.2, home top 2026-10-14)", () => {
  it("matches the hero copy", () => {
    // [MICHAEL 2026-10-14] New home top: eyebrow, headline, the barcode/QR
    // comparison sub-headline, two photos, no hero buttons, and the roadmap
    // caveats removed from the hero body.
    expect(hero.eyebrow).toBe("The next evolution of the barcode");
    expect(hero.title).toBe("A barcode/QR code you can write by hand");
    const sub = hero.subline;
    expect(sub.code).toBe("zz-Kathy-found-dog-zz");
    expect(sub.before + sub.code + sub.after).toBe(
      "Barcodes use bars. QR codes use dots. zzThis uses everyday words. Just wrap your words in double z’s - like zz-Kathy-found-dog-zz - write it on anything with a marker, and scan it to open its digital record. The “zz” ends tell our scanner exactly where to look, just like the start and end bars on a barcode and the three corner squares on a QR code.",
    );
    const { lead, before, code, after } = hero.paragraph;
    expect(lead + before + code + after).toBe(
      "zzThis is a human-readable, human-writable code for the physical world. Write a zz-code on tape, a crate, a parcel, an envelope, or a sign, or embed it in text or program code. zzThis makes things readable-writable-smart.",
    );
    expect(code).toBe("zz-code");
    expect(hero.photos.map((photo) => photo.src)).toEqual([
      "images/hero/kathy-corkboard.webp",
      "images/hero/kathy-phone-record.webp",
    ]);
    // [MICHAEL 2026-10-15] Buttons restored, How it works first.
    expect(hero.actions.map((action) => action.label)).toEqual([
      "How it works",
      "See field logistics",
    ]);
  });

  it("matches the consumer how-it-works block", () => {
    expect(consumerHow.eyebrow).toBe("Physical-to-digital addressing");
    expect(consumerHow.heading).toBe("Skip the printer. Grab a marker.");
    expect(consumerHow.steps.map((step) => step.title)).toEqual([
      "Create it.",
      "Write it.",
      "Look it up.",
    ]);
  });

  it("matches the featured statement", () => {
    expect(featured.heading).toBe(
      "The shortest, smartest distance between a physical thing, its digital record, and the work that comes next.",
    );
    expect(featured.text).toBe(
      "A zz code gives people a way to create the mark themselves, wherever the work happens. Future AI-assisted workflows could help identify what a camera sees, count what remains, suggest how an item should be handled, and prepare the next task; those capabilities are explorations, not shipped v1 behavior. The same visible code connects the item, its history, and the people responsible for it. It bridges physical things and their digital control. AI may serve as an interface and connector, not as the authority that defines or resolves a zz code.",
    );
  });

  // [MICHAEL 2026-10-17] Two paragraphs after the hero body.
  it("adds the versatility and blockchain/AI/macros paragraphs", () => {
    expect(heroMore.map((block) => block.lead)).toEqual([
      "Versatile, custom, any language.",
      "Blockchain, AI, and macros.",
    ]);
    const parts = heroMore.flatMap((block) => block.parts);
    expect(parts.filter((part) => part.kind === "zz").length).toBe(2);
    expect(parts.some((part) => part.kind === "picture")).toBe(true);
    const text = parts
      .map((part) => ("text" in part ? part.text : ""))
      .join("");
    expect(text).toContain("Even offline with no phone");
    expect(text).toContain("runs only after an authorized person confirms it");
  });
});
