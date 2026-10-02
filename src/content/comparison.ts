export type ComparisonRowKey = "create" | "read" | "connects";

export interface ComparisonRow {
  key: ComparisonRowKey;
  label: string;
}

export interface ComparisonColumn {
  name: string;
  accent: boolean;
  cells: Record<ComparisonRowKey, string>;
}

export const comparisonHeading = "How zzThis compares";

export const comparisonRows: readonly ComparisonRow[] = [
  { key: "create", label: "Create the mark" },
  { key: "read", label: "Read the mark" },
  { key: "connects", label: "What it connects" },
];

export const comparisonColumns: readonly ComparisonColumn[] = [
  {
    name: "Barcode",
    accent: false,
    cells: { create: "Print", read: "Scanner", connects: "Item to data" },
  },
  {
    name: "QR code",
    accent: false,
    cells: {
      create: "Print or display",
      read: "Camera",
      connects: "Surface to digital content",
    },
  },
  {
    name: "zzThis",
    accent: true,
    cells: {
      create: "Write, print, or display",
      read: "Person, camera, typing, or voice",
      connects: "Thing to its record and next action",
    },
  },
];
