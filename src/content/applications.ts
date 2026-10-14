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
  lead?: ImageId;
  items: readonly ApplicationGalleryItem[];
  closing?: readonly string[];
}

export interface Application {
  id: ApplicationId;
  title: string;
  status: string;
  story: string;
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
    status:
      "Exploration: field/enterprise workflows are queued in B7 for v1.x, not shipped v1 capabilities.",
    story:
      "A future field workflow could use handwritten codes on bags, crates, pallets, and mixed goods to help connect items to existing identifiers and prepare inventory work.",
    pageExtra:
      "Structured profiles and private dictionaries are B10 shadow exploration for v2 / Contract 2. If advanced, they would assign authorized, versioned meanings only after recognition and canonicalization; the camera reader does not decide them.",
    homeImages: ["j"],
    pageImages: ["a", "c", "alt-b", "d", "e", "f", "j", "k", "l", "m", "n"],
    homeWideOnly: true,
  },
  {
    id: "parcel",
    title: "Postal and parcel",
    status:
      "Exploration: postal/parcel integration is queued in B8 for v1.x; no carrier service is claimed.",
    story:
      "A future postal/parcel workflow could use a written reference and help prepare items before a parcel code is chosen.",
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
    title: "Everyday and community",
    status: "Exploration: free/community use cases are queued in B9 for v1.x.",
    story:
      "A future community use could place a handwritten code on a lost-pet flyer or other public surface and link it to a useful page.",
    homeImages: ["h"],
    pageImages: ["h"],
    homeWideOnly: false,
    pageGalleries: [
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
        label: "standalone",
        columns: "2",
        frame: "812 / 431",
        items: [{ image: "app-trail-marker" }],
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
    ],
  },
  {
    id: "aliases",
    title: "Digital aliases",
    status:
      "Exploration: agent/ledger/blockchain integrations are shadowed in B16 for v2+.",
    story:
      "A future integration could map a short human-readable code to a longer machine address used by software agents.",
    pageExtra:
      "These optional integrations are not v1 resolver capabilities or dependencies.",
    homeImages: ["i"],
    pageImages: ["i"],
    homeWideOnly: false,
    pageGalleries: [
      {
        label: "standalone",
        columns: "2",
        frame: "733 / 436",
        items: [{ image: "app-wallet-ens" }],
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
  // [MICHAEL 2026-10-06 change list] Lead with the kinds of use, then the AI principles.
  intro:
    "These are product directions, not a list of shipped v1 integrations: field/enterprise (B7), postal/parcel (B8), community/free uses (B9), AI-assisted inventory (B7), and agent/ledger/blockchain integrations (B16). AI may be an interface or connector, not the authority that defines or resolves a zz code.",
};
