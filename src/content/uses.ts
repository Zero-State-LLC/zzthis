// [MICHAEL 2026-10-02] zz- modification to web home page.docx

export interface TopWay {
  numeral: string;
  title: string;
  codes: readonly string[];
  /** Omitted: [MICHAEL 2026-10-20] the roadmap status lines are removed. */
  status?: string;
  text: string;
}

export interface TopWaysContent {
  heading: string;
  items: readonly TopWay[];
}

// [MICHAEL 2026-10-20] Hedges dropped: no status lines; item 05 is his wording,
// the others follow the same "Future ..." style.
export const topWays: TopWaysContent = {
  heading: "Potential use cases and explorations",
  items: [
    {
      numeral: "01",
      title: "Logistics",
      codes: ["zz-copper-lantern-sky-zz", "zz-fastfreight-c4821-123-zz"],
      text: "Future workflows to identify and hand off items with handwritten codes, connected to shipping, customs, payment services, and shared ledgers.",
    },
    {
      numeral: "02",
      title: "Postal",
      codes: ["zz-post-rock-river-sky-zz"],
      text: "Future postal and parcel workflows using handwritten codes as references.",
    },
    {
      numeral: "03",
      title: "Everyday use: zzThat",
      codes: ["zz-kathy-lost-cat-zz", "zz-moving-box-kitchen-3-zz"],
      text: "Community examples include a lost-pet flyer, a moving box, or a garage-sale item. The zzThat Android and iOS apps are live.",
    },
    {
      numeral: "04",
      title: "AI agents",
      codes: ["zz-acme-support-agent-zz", "zz-@agentsmith-zz"],
      text: "Future integrations to give agents short, readable aliases.",
    },
    {
      numeral: "05",
      title: "Blockchain addresses",
      codes: ["zz-btc-harbor-violet-nine-zz", "zz-harbor-violet-nine-zz"],
      text: "Future integrations to map readable codes to wallets, accounts, smart-contracts, NFTs, agent addresses, and oracles.",
    },
    {
      numeral: "06",
      title: "Macros",
      codes: ["zz-fn-pay-agentsmith-zz", "zz-run-reorder-water-zz"],
      text: "Future authorized actions to let a code refer to a command, subject to separate authentication, authorization, and confirmation. The code itself carries no authority.",
    },
  ],
};
