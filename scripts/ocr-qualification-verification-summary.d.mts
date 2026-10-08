export interface SigstoreSummary {
  status: "NOT_PERFORMED" | "FAILED" | "PARTIAL" | "VERIFIED_UNQUALIFIED";
  preRun: "NOT_PERFORMED" | "VERIFIED" | "FAILED";
  execution: "NOT_PERFORMED" | "VERIFIED" | "FAILED";
  preRunIntegratedTime: string | null;
  executionIntegratedTime: string | null;
  reasons: string[];
}

export function summarizeSigstoreVerifications(verifications?: {
  preRun?: {
    verified: boolean;
    reason?: string;
    integrated_time_utc?: string;
  };
  execution?: {
    verified: boolean;
    reason?: string;
    integrated_time_utc?: string;
  };
}): SigstoreSummary;
