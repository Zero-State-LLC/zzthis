// Q14 [MICHAEL 2026-10-02]: do not publish an empty Technology page. This is
// Michael's public draft wording. The page stays unbuilt and out of navigation
// until it has this explanation plus supporting examples.
export interface TechnologyDraft {
  status: "unpublished";
  text: string;
  topics: readonly string[];
}

export const technologyDraft: TechnologyDraft = {
  status: "unpublished",
  text: "zzThis starts with a short code a person can write on a physical thing. A camera, typed entry, or voice reads that code and opens its linked digital record. The code stays simple while the record can describe an item, shipment, document, or next action. Our research extends this interface with AI-assisted recognition, permissioned records, cryptographic logs, shared ledgers, and smart contracts, connecting physical handoffs to verifiable digital work.",
  topics: [
    "AI-assisted recognition",
    "Permissioned records",
    "Cryptographic logs",
    "Shared ledgers",
    "Smart contracts",
  ],
};
