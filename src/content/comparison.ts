export type ComparisonRowKey = "create" | "read" | "connects" | "remember";

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
  { key: "remember", label: "Easy to say and remember" },
];

export const comparisonColumns: readonly ComparisonColumn[] = [
  {
    name: "Barcode",
    accent: false,
    cells: {
      create: "Print",
      read: "Scanner",
      connects: "Item to data",
      remember: "No",
    },
  },
  {
    name: "QR code",
    accent: false,
    cells: {
      create: "Print or display",
      read: "Camera",
      connects: "Surface to digital content",
      remember: "No",
    },
  },
  {
    name: "Alphanumeric code",
    accent: false,
    cells: {
      create: "Print or handwrite",
      read: "Person, scanner, or typing",
      connects: "Shipment or item to its tracking status",
      remember: "Hard (8 to 22 random characters)",
    },
  },
  {
    name: "zzThis",
    accent: true,
    cells: {
      create: "Write, draw, print, or display: words, numbers, or symbols",
      read: "Person or typing; on-device camera recognition planned for v1",
      connects: "Physical thing to its authorized digital record",
      remember: "Yes (2 to 4 words, or short words and numbers)",
    },
  },
];

export const comparisonNote =
  "Alphanumeric example: an 8-character handwritten postage code (Deutsche Post) or a 14–22-character parcel tracking number. zz-codes can be words, numbers, or simple hand-drawn symbols such as a smiley or tally marks, and can be read even when written inside a sentence.";
