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
    homeImages: ["j"],
    pageImages: ["a", "alt-b", "c", "d", "e", "f", "j", "k", "l", "m", "n"],
    homeWideOnly: true,
  },
  {
    id: "parcel",
    title: "Postal and parcel",
    story:
      "Write a reference directly on a parcel; photograph loose items and receive packing guidance before choosing a parcel code.",
    homeImages: ["g", "o"],
    pageImages: ["g", "o"],
    homeWideOnly: false,
    pageGalleries: [
      {
        label: "standalone",
        columns: "2",
        frame: "268 / 200",
        items: [{ image: "app-super-identifier" }],
        closing: [
          "By appending a single 'super identifier' to legacy systems, we create a unified data node system to give current analog logistics the new digital-smart AI solutions and network. In the above, in theory, a FedEx overnight shipper can only put the zz-Code ID on the package and its deliverer in the fulfillment chain in anonymous, until the final touch with the receiver.",
        ],
      },
      {
        heading: "Coupang concept use cases",
        intro: [
          "One human-readable public reference. Sensitive data is revealed only to authorized systems and people.",
        ],
        label: "group",
        columns: "4",
        ordered: true,
        frame: "4 / 5",
        lead: "app-delivery-overview",
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
            title: "Delivery man only knows pickup address",
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
  intro:
    "AI belongs across field logistics and parcel workflows. Digital aliases are a separate application.",
};
