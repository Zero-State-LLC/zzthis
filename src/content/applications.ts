import type { ImageId } from "./images";

export type ApplicationId = "field" | "parcel" | "community" | "aliases";

export interface ApplicationGalleryItem {
  image: ImageId;
  numeral?: string;
  title?: string;
}

export interface ApplicationGallery {
  heading?: string;
  intro?: readonly string[];
  label: "group" | "standalone";
  columns: "2" | "3" | "4";
  ordered?: boolean;
  frame: string;
  /** [MICHAEL 2026-10-20] Crop every image in the gallery to this aspect ratio so a side-by-side pair matches. */
  crop?: string;
  lead?: ImageId;
  items: readonly ApplicationGalleryItem[];
  closing?: readonly string[];
}

export interface Application {
  id: ApplicationId;
  title: string;
  /** Omitted when the Applications page should show no status line. */
  status?: string;
  /** Omitted when neither the Home card nor the Applications page shows a story. */
  story?: string;
  pageExtra?: string;
  homeImages: readonly ImageId[];
  pageImages: readonly ImageId[];
  homeWideOnly: boolean;
  pageGalleries?: readonly ApplicationGallery[];
}

export const applications: readonly Application[] = [
  {
    id: "field",
    title: "Field logistics",
    // [MICHAEL 2026-10-20] B7 status line removed; story and extra are his wording.
    story:
      "Field workflow to use handwritten codes on bags, crates, pallets, and mixed goods to connect items to existing identifiers and prepare tasks and inventory work.",
    pageExtra:
      "Future structured profiles and private dictionaries would assign authorized, versioned meanings only after recognition and canonicalization.",
    homeImages: ["j"],
    pageImages: ["a", "c", "alt-b", "d", "e", "f", "j", "k", "l", "m", "n"],
    homeWideOnly: true,
  },
  {
    id: "parcel",
    title: "Postal and parcel",
    // [MICHAEL 2026-10-20] B8 status line removed; story is his wording.
    story:
      "Future postal or parcel workflow, batch work, or project can have optional reference code words to be used for identity before a final parcel code is chosen.",
    homeImages: ["o", "g"],
    pageImages: ["o", "g"],
    homeWideOnly: false,
    pageGalleries: [
      {
        // [MICHAEL 2026-10-06 change list] Same size as the two photos above,
        // with the three-letter postage image added beside it.
        label: "standalone",
        columns: "2",
        frame: "268 / 200",
        items: [
          { image: "app-super-identifier" },
          { image: "app-postage-letters" },
        ],
        closing: [
          "By appending a single 'super identifier' to legacy systems, we create a unified data node system to give current analog logistics the new digital-smart AI solutions and network. In the above, in theory, a FedEx overnight shipper can only put the zz-Code ID on the package and its deliverer in the fulfillment chain in anonymous, until the final touch with the receiver.",
        ],
      },
      {
        heading: "End-to-end anonymous concept use cases",
        intro: [
          "The merchant never receives the customer's personal data or payment details, only a zz-code and a security code. Nothing personal appears on the outside of the package. The customer picks it up at a drop-off store by giving a secret code or signing with a private key.",
        ],
        label: "group",
        columns: "4",
        ordered: true,
        frame: "4 / 5",
        items: [
          {
            image: "app-delivery-1",
            numeral: "Step 1",
            title: "Anonymous customer orders online",
          },
          {
            image: "app-delivery-2",
            numeral: "Step 2",
            title: "Merchant ships only with the zz-Code",
          },
          {
            image: "app-delivery-3",
            numeral: "Step 3",
            title: "Delivery man only knows drop-off address",
          },
          {
            image: "app-delivery-4",
            numeral: "Step 4",
            title: "Anonymous customer gives matching secret code or signature",
          },
        ],
        closing: [
          "This is an example of end-to-end anonymous delivery to a drop store and anonymous pickup. The receiver would pick up by identification using private-key to the package’s public key.",
          "This reduces potential for customer data breach by keeping customer information including payment account from the merchants’ applications.",
        ],
      },
    ],
  },
  {
    id: "community",
    // [MICHAEL 2026-10-20] Heading renamed; the B9 status line and the story
    // are removed from the Applications page and the Home card (the images
    // carry it).
    title: "Everyday, community, and public",
    homeImages: ["h"],
    pageImages: [],
    homeWideOnly: false,
    pageGalleries: [
      {
        // [MICHAEL 2026-10-20] Lost cat and the trail marker side by side,
        // same proportions, edges aligned with the galleries below.
        label: "standalone",
        columns: "2",
        frame: "16 / 9",
        crop: "16 / 9",
        items: [{ image: "h" }, { image: "app-trail-marker" }],
      },
      {
        label: "group",
        columns: "3",
        frame: "6 / 5",
        items: [
          { image: "app-for-sale" },
          { image: "app-help-wanted" },
          { image: "app-event-cancelled" },
        ],
      },
      {
        label: "group",
        columns: "3",
        frame: "9 / 10",
        items: [
          { image: "app-connect" },
          { image: "app-shop-pay" },
          { image: "app-donate" },
        ],
      },
      {
        label: "group",
        columns: "3",
        frame: "4 / 5",
        items: [
          { image: "app-share" },
          { image: "app-community" },
          { image: "app-handwritten-works" },
        ],
      },
      {
        heading: "Businesses",
        intro: [
          "Businesses can convert their product names with the scannable zz-Codes.",
        ],
        label: "group",
        columns: "2",
        frame: "4 / 3",
        items: [{ image: "app-tape-before" }, { image: "app-tape-after" }],
      },
      {
        intro: [
          "A commercial moving truck signage has a zz mark added to it, and people can scan it for the information.",
        ],
        label: "group",
        columns: "2",
        frame: "342 / 281",
        items: [{ image: "app-truck-before" }, { image: "app-truck-after" }],
      },
      {
        // [MICHAEL 2026-10-20] U-Haul concept pair, last on the page and
        // larger than the before/after pairs above (portrait images).
        label: "standalone",
        columns: "2",
        frame: "3 / 4",
        crop: "3 / 4",
        items: [{ image: "app-uhaul-door" }, { image: "app-uhaul-scan" }],
      },
    ],
  },
  {
    id: "aliases",
    title: "Digital aliases",
    // [MICHAEL 2026-10-20] B16 status line, the story (page and Home card),
    // and the "not v1 resolver" extra removed.
    homeImages: ["i"],
    pageImages: [],
    homeWideOnly: false,
    pageGalleries: [
      {
        // [MICHAEL 2026-10-20] Agent alias and wallet address side by side,
        // sized like the Lost cat / Trail marker pair.
        label: "standalone",
        columns: "2",
        frame: "16 / 9",
        crop: "16 / 9",
        items: [{ image: "i" }, { image: "app-wallet-ens" }],
      },
    ],
  },
];

export const applicationsHome = {
  heading: "More applications",
  intro: "The same writable code works in other settings.",
  linkText: "All applications",
};

export const applicationsPage = {
  title: "Applications",
  // [MICHAEL 2026-10-20] The visible intro ("These are product directions...")
  // is removed. This line is only the page's search/meta description.
  description:
    "Ways to use zzThis handwritten codes: field logistics, postal and parcel, everyday and public uses, and digital aliases.",
};
