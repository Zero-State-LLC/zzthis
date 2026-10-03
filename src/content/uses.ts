// [MICHAEL 2026-10-02] zz- modification to web home page.docx

export interface TopWay {
  numeral: string;
  title: string;
  codes: readonly string[];
  text: string;
}

export interface TopWaysContent {
  heading: string;
  items: readonly TopWay[];
}

export const topWays: TopWaysContent = {
  heading: "Top ways zzThis is used",
  items: [
    {
      numeral: "01",
      title: "Logistics",
      codes: ["zz-copper-lantern-sky-zz", "zz-fastfreight-c4821-123-zz"],
      text: "Easier handling: mark crates, bags, and parts, then read, link, and hand them off with a phone camera or a few spoken words. For shipping, including across borders, the zz-code can be the shipment's shared identity and hub, where customs, carriers, and payment services find the same information, and its ID on the shared ledger used by every service that handles the goods.",
    },
    {
      numeral: "02",
      title: "Postal",
      codes: ["zz-post-rock-river-sky-zz"],
      text: "A handwritten zz-code can serve as proof of postage and a trackable reference: write it in the stamp corner of a letter or parcel, and it links to postage, routing, and tracking.",
    },
    {
      numeral: "03",
      title: "Everyday use: zzThat",
      codes: ["zz-kathy-lost-cat-zz", "zz-moving-box-kitchen-3-zz"],
      text: "Free for everyone. Write a code on a lost-pet flyer, a moving box, a garage-sale item, or a note, and anyone can scan it, like a QR code you can write by hand. Endless imaginative uses. The zzThat app is coming to Android, iOS, and the web at zzthat.com.",
    },
    {
      numeral: "04",
      title: "AI agents",
      codes: ["zz-acme-support-agent-zz", "zz-@agentsmith-zz"],
      text: "AI agents need identities people can easily know and recognize by name, and enterprises need to name and brand their agents, on the everyday web as well as on blockchains. A zz-code gives an agent a short name people can write, say, and verify, linked to who runs it and what it is allowed to do.",
    },
    {
      numeral: "05",
      title: "Blockchain addresses",
      codes: ["zz-btc-harbor-violet-nine-zz", "zz-harbor-violet-nine-zz"],
      text: "Wallet, account, smart-contract, and agent addresses on networks such as Bitcoin and Ethereum are long strings of random characters. A zz-code is a readable alias for any of them: easier to write, say, and check on screen before you send.",
    },
    {
      numeral: "06",
      title: "Macros",
      codes: ["zz-fn-pay-agentsmith-zz", "zz-run-reorder-water-zz"],
      text: "A zz-code can also call a function: a short, human-writable command that asks a system to do something, such as reorder supplies, pay an agent, or open a work order. A macro runs only for an authenticated, authorized user who confirms it; the code itself carries no authority.",
    },
  ],
};
