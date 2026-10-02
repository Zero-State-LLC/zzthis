export interface TechnologySlot {
  status: "reserved";
  topics: readonly string[];
}

export const technologySlot: TechnologySlot = {
  status: "reserved",
  topics: [
    "Permissioned records",
    "Cryptographic logs",
    "Shared ledgers",
    "Smart contracts",
  ],
};
