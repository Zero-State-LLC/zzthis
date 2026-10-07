// [MICHAEL 2026-10-02] zz- modification to web home page.docx

export interface TopWay {
  numeral: string;
  title: string;
  codes: readonly string[];
  status: string;
  text: string;
}

export interface TopWaysContent {
  heading: string;
  items: readonly TopWay[];
}

export const topWays: TopWaysContent = {
  heading: "Potential use cases and explorations",
  items: [
    {
      numeral: "01",
      title: "Logistics",
      codes: ["zz-copper-lantern-sky-zz", "zz-fastfreight-c4821-123-zz"],
      status:
        "Exploration: field/enterprise workflows are queued in B7; carrier and ledger integrations are not v1 features.",
      text: "A future workflow could use a handwritten code to help identify and hand off items. The pictured shipping, customs, payment-service, and shared-ledger connections are concepts, not available integrations.",
    },
    {
      numeral: "02",
      title: "Postal",
      codes: ["zz-post-rock-river-sky-zz"],
      status:
        "Exploration: postal/parcel workflows are queued in B8; postage, carrier, routing, and tracking integrations are not v1 services.",
      text: "A future postal or parcel workflow could use a handwritten code as a reference. This concept is not proof of postage and does not provide routing or tracking.",
    },
    {
      numeral: "03",
      title: "Everyday use: zzThat",
      codes: ["zz-kathy-lost-cat-zz", "zz-moving-box-kitchen-3-zz"],
      status:
        "Consumer/community uses are queued in B9. zzThat is a working prototype; Android, iOS, and web releases are planned, not shipped.",
      text: "Community examples include a lost-pet flyer, a moving box, or a garage-sale item. The zzThat scanner/creator is a working prototype; its consumer releases remain planned.",
    },
    {
      numeral: "04",
      title: "AI agents",
      codes: ["zz-acme-support-agent-zz", "zz-@agentsmith-zz"],
      status:
        "Exploration: agent/ledger integrations are shadowed in B16; no v1 agent identity or authorization integration.",
      text: "A future integration could give an agent a short, readable alias. Linking that alias to an operator or permissions is not a v1 capability.",
    },
    {
      numeral: "05",
      title: "Blockchain addresses",
      codes: ["zz-btc-harbor-violet-nine-zz", "zz-harbor-violet-nine-zz"],
      status:
        "Exploration: blockchain integration is shadowed in B16 for v2+; it is not a v1 dependency or capability.",
      text: "A future integration could map a readable code to a wallet, account, smart-contract, or agent address. No blockchain alias integration is available in v1.",
    },
    {
      numeral: "06",
      title: "Macros",
      codes: ["zz-fn-pay-agentsmith-zz", "zz-run-reorder-water-zz"],
      status:
        "Exploration: authorized actions/macros are shadowed in B14; code-triggered actions are not a v1 feature.",
      text: "A future authorized-actions design could let a code refer to a command, subject to separate authentication, authorization, and confirmation. The code itself carries no authority, and v1 does not execute macros.",
    },
  ],
};
