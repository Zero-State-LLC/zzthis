// [MICHAEL 2026-10-11] Two clickable five-image walkthroughs on the
// Applications page, placed between Field logistics and Postal and parcel:
// header, lead, explainer, a thumbnail strip, then the large image.
// The caption text is burned into each image, so there is no caption below.

export type WalkthroughId = "smart-automation" | "smart-packing";

export interface WalkthroughFrame {
  src: string;
  thumb: string;
  width: number;
  height: number;
  /** Short name for the thumbnail button and the counter. */
  label: string;
  /** Describes the scene and repeats the caption text burned into the image. */
  alt: string;
}

export interface Walkthrough {
  id: WalkthroughId;
  title: string;
  lead: string;
  explainer: string;
  frames: readonly WalkthroughFrame[];
}

const frame = (name: string, label: string, alt: string): WalkthroughFrame => ({
  src: `images/walkthroughs/${name}.webp`,
  thumb: `images/walkthroughs/${name}-thumb.webp`,
  width: 1600,
  height: 900,
  label,
  alt,
});

export const walkthroughs: readonly Walkthrough[] = [
  {
    id: "smart-automation",
    title: "Smart force-multiplier automation",
    lead: "Multiply your work, time, and attention. Point your camera at a group of items and the work to be done; your AI assistant identifies each one and drafts the task list, while you confirm, correct, and add notes. Then tie the whole work to one hand-written code: an on-demand smart force multiplier in your pocket.",
    explainer:
      "Automation starts with the work, not at your desk. No printer, no manual look-ups, and no scale. Your AI assistant helps recognize each item, pull its weight and handling notes from your records or the web, and draft the work list while the crew keeps working; you confirm, correct, comment, or ask by voice or tap instead of typing. Smart assistance, with a person deciding every step. The common ledger carries the memory: once the work and items are wrapped and marked, every touch (built, moved, handed off, received) can be logged as a time-stamped event. That record can live on a private blockchain or a permissioned supply-chain ledger shared only among authorized partners, or be anchored to a public blockchain when open, independent proof matters. Write the code once, scan it anywhere, and the handoffs, the condition of the items, and the history follow the load: a digital twin of the physical.",
    frames: [
      frame(
        "pallet-01-the-pile",
        "The pile",
        "A generator, a water pump with hoses, a tool chest, and folded field cots on a warehouse floor beside an empty pallet. Caption: Four items to ship. No scale, no printer. zzThis identifies each one, estimates its weight, and advises on handling.",
      ),
      frame(
        "pallet-02-generator",
        "Generator",
        "Hands hold a tablet that frames the generator in an orange box labeled Generator, 130 lb. Caption: Generator, about 130 lb. Drain the fuel first. Two-person lift.",
      ),
      frame(
        "pallet-03-water-pump",
        "Water pump",
        "The tablet frames the water pump and its hoses in an orange box labeled Water pump, 55 lb. Caption: Water pump, about 55 lb. Drain the water and cap the ports.",
      ),
      frame(
        "pallet-04-all-four",
        "All four",
        "The tablet shows all four items in orange boxes: generator 130 lb, water pump 55 lb, tool chest 200 lb, field cots 90 lb. Caption: All four in one view. 475 lb in all. Safe to ship together.",
      ),
      frame(
        "pallet-05-ready-to-move",
        "Ready to move",
        "The four items wrapped and strapped on one pallet, marked zz-BRAVO-PALLET-7-zz on blue tape, with a pallet jack beside it. Caption: One pallet, wrapped and marked by hand. Anyone can scan the code and know what's inside.",
      ),
    ],
  },
  {
    id: "smart-packing",
    title: "Smart packing and handling",
    lead: "Work smarter and save time and effort. Your AI assistant helps identify or look up and organize your items, while you confirm, correct, and add notes. Then mark each box or group with a hand-written code. No printer, no scale, no guesswork.",
    explainer:
      "Whether you're moving, storing, shipping, or donating, the work starts where the things are. Go room to room; your AI assistant helps identify each item and suggest handling, and you instruct where it goes and how it's grouped. Write the code on the tape with a marker; scan it later to see what's inside, where it goes, any special handling, and photos of how it was packed. Movers, family, and the donation center can each scan the same code, and every handoff (packed, loaded, delivered, unpacked) can be logged with condition notes, useful for insurance claims. Depending on the work, the record can stay private, be shared with the people handling it, or, optionally, be anchored to a blockchain ledger for independent proof, which shippers and insurers may increasingly ask for, and which can lower insurance and overall work costs. Write it once, scan it anywhere: your things, remembered.",
    frames: [
      frame(
        "household-01-the-room",
        "The room",
        "A half-packed living room with open boxes, a kettle and six mugs on a table, a floor lamp, a stack of books, blue tape, and a marker. Caption: The room. A room full of things, and work to be done.",
      ),
      frame(
        "household-02-point-and-tell",
        "Point and tell",
        "A woman's hands hold a phone that frames the kettle and mugs in orange boxes and lists Kettle, 2.6 lb, fragile and Mugs (6), 4 lb, fragile, with a spoken instruction: To kitchen. Caption: Point and tell. AI helps you identify each item and suggests handling; you instruct where it goes: “To kitchen.”",
      ),
      frame(
        "household-03-keep-or-donate",
        "Keep or donate",
        "The phone frames the floor lamp and the books in orange boxes and lists Floor lamp, 9 lb and Books (12), 20 lb, with a typed instruction: To donation. Caption: Keep or donate. Instruct the AI how to organize the work, group things, and what to do with them: “To donation.”",
      ),
      frame(
        "household-04-mark-it",
        "Mark it",
        "A hand writes zz-Main-kitchen-zz on blue tape across a box; three boxes behind it are marked zz-for-donation-zz. Caption: Mark it. A hand-written code per box or group.",
      ),
      frame(
        "household-05-loaded",
        "Loaded and tracked",
        "At a moving truck, a mover in gloves labeled zz-ACME-MOVERS-zz scans the zz-Main-kitchen-zz box; the phone shows Kettle, mugs (6), 6.6 lb, Kitchen, fragile, and Loaded. Caption: Loaded and tracked. The movers scan any box and see any special-handling instructions, where it goes, and that it's loaded.",
      ),
    ],
  },
];
