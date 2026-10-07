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
    story:
      "Hand-mark bags, crates, pallets, and mixed goods; read or relay a code; connect it to existing identifiers. Then photograph loose items, prepare a turn-in, compare inventory, and use touch-first actions.",
    pageExtra:
      "Under the hood, the mark stays simple while its meaning is controlled. In a planned structured profile, zz-X1-X2-X3-zz, the first word selects a schema that sets how the other two are read: X2 as a place or target, X3 as a state or discriminator. Each organization keeps its own versioned dictionary, so the same three words can mean electrical equipment, Building 4, inspection required to authorized users and nothing to anyone else. Recognition runs on the device first and is kept separate from interpretation, which the resolver grants only after authentication and authorization. Each resolution can return a signed receipt, and handoff events can be anchored to a distributed ledger for chain of custody. Merkle-committed dictionaries and zero-knowledge proofs are on the research roadmap.",
    homeImages: ["j"],
    pageImages: ["a", "c", "alt-b", "d", "e", "f", "j", "k", "l", "m", "n"],
    homeWideOnly: true,
  },
  {
    id: "parcel",
    title: "Postal and parcel",
    story:
      "Write a reference directly on a parcel; photograph loose items and receive packing guidance before choosing a parcel code.",
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
    story:
      "A handwritten code on a lost-cat flyer or other public surface can lead to a useful page.",
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
    story:
      "A short human-readable code can stand in for a long machine address used by software agents.",
    pageExtra: "Deeper blockchain/AI architecture can grow into a later page.",
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
    "One writable code serves five kinds of use: field and enterprise logistics, postal and parcel, free everyday use with zzThat, digital aliases for blockchain addresses and AI agents, and AI-assisted work across all of them. Three AI principles guide the design. AI is the new UI: a photo, a few spoken words, or a tap replaces forms. AI is the new connector: agents link systems on the fly where a formal integration was once needed. AI flattens the stack: a phone and a marker can do work that once took printers, scanners, and back-office software.",
};
