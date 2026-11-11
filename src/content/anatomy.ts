// H.1b. The third label is Michael's v1.0 line. The other labels are prototype microcopy.

// [MICHAEL 2026-10-18] Home-page copy: lede plus three points.
export const whyMarkers = {
  heading: "Why the zz markers matter",
  text: "The zz markers are to zzThis what the start and stop bars are to a barcode, or the corner squares are to a QR code: a fixed frame that tells people and machines that a code exists and where it begins and ends.",
  points: [
    {
      label: "Human-friendly:",
      text: "The two zz marks are a memorable, distinctive anchor. People quickly learn to spot them as the boundaries of a written code.",
    },
    {
      label: "Machine-friendly:",
      text: "Almost no words begin with \u201czz,\u201d and a phrase framed by zz at both ends almost never occurs in ordinary text, signage, or software. This rare frame keeps false matches low, lets a planned camera scanner find the endpoints and bound the region to inspect, and is friendly to machines.",
    },
    {
      label: "The result:",
      text: "A simple bridge between physical things and their digital records, where the code stays fully readable and writable by people.",
    },
  ],
} as const;

// [MICHAEL 2026-10-07 change list] Dashes between the words.
export const languagesHeading = "In - any - language";

export interface LanguageExample {
  name: string;
  code: string;
  lang: string;
  gloss?: string;
  rtl?: string;
}

export const languageExamples: readonly LanguageExample[] = [
  { name: "Korean", code: "zz-구리-등불-하늘-zz", lang: "ko" },
  {
    name: "Japanese",
    code: "zz-さくら-ねこ-そら-zz",
    lang: "ja",
    gloss: "(cherry blossom, cat, sky)",
  },
  { name: "German", code: "zz-kupfer-laterne-himmel-zz", lang: "de" },
  { name: "French", code: "zz-cuivre-lanterne-ciel-zz", lang: "fr" },
  {
    name: "Aramaic",
    code: "zz-נהורא-שמיא-zz",
    lang: "arc",
    gloss: "(light, sky)",
    rtl: "נהורא-שמיא",
  },
  // [MICHAEL 2026-10-19] Sixth example: copper, lantern, sky.
  { name: "Russian", code: "zz-медь-фонарь-небо-zz", lang: "ru" },
];

export const specimenLabel = "zz-copper-lantern-sky-zz";

export interface SpecimenPart {
  text: string;
  marker: boolean;
  anchor: string;
  label: string;
  low: boolean;
}

export const specimenParts: readonly SpecimenPart[] = [
  {
    text: "zz",
    marker: true,
    anchor: "--p1",
    label: "opening marker",
    low: true,
  },
  { text: "copper", marker: false, anchor: "--p2", label: "word", low: false },
  {
    text: "lantern",
    marker: false,
    anchor: "--p3",
    label: "word",
    low: false,
  },
  {
    text: "sky",
    marker: false,
    anchor: "--p4",
    label: "word or check word",
    low: true,
  },
  {
    text: "zz",
    marker: true,
    anchor: "--p5",
    label: "closing marker",
    low: false,
  },
];

export const codeForms: readonly { name: string; code: string }[] = [
  { name: "Word code", code: "zz-copper-lantern-sky-zz" },
  { name: "Field code", code: "zz-b2-smith-1-zz" },
  { name: "Handle", code: "zz-@agentsmith-zz" },
  { name: "Circled marker", code: "(zz) camp bravo four two (zz)" },
];
