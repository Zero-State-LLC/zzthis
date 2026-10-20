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
  // [MICHAEL 2026-10-19] Optional: only Postal and parcel keeps a line.
  status?: string;
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
    // [MICHAEL 2026-10-19] Status line and profiles note removed.
    story:
      "Handwritten codes on bags, crates, pallets, and mixed goods connect items to existing identifiers and prepare inventory work.",
    homeImages: ["j"],
    pageImages: ["a", "c", "alt-b", "d", "e", "f", "j", "k", "l", "m", "n"],
    homeWideOnly: true,
  },
  {
    id: "parcel",
    title: "Postal and parcel",
    // [MICHAEL 2026-10-19] Status and story (node, digital twin, shared layer).
    status: "The postal, parcel, and carrier workflows are illustrative.",
    story:
      "One zz-code turns a parcel into a node with a digital twin. Shipper, carrier, sorting center, post office, and drop-off store each use their own systems, yet all read and update the same record, the same shared naming layer that lets relief organizations work from one set of words.",
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
    // [MICHAEL 2026-10-19] Renamed; status line removed.
    title: "Personal and community uses",
    story: "A handwritten code is linked to its online page or resource.",
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
    // [MICHAEL 2026-10-19] Status line and integrations note removed.
    story:
      "Just as domain names stand in for IP addresses, a zz-code stands in for a long machine address, such as an AI agent ID or a wallet address. And just as HTTPS is the verified form of HTTP, an \u201c@\u201d in the code, as in zz-AI@-Agentsmith-zz, marks a trusted alias backed by identification and authentication.",
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
  // [MICHAEL 2026-10-19] The visible intro and the page concept note are
  // removed. This line is the page meta description only.
  description:
    "zzThis applications: field logistics, postal and parcel, personal and community uses, and digital aliases.",
};
