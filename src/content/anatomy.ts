// H.1b. The third label is Michael's v1.0 line. The other labels are prototype microcopy.

export const whyMarkers = {
  heading: "Why the zz markers matter",
  text: "The two zz markers frame the code. A planned on-device camera reader could use them as index marks to find the endpoints and bound the region to inspect. The words remain readable and writable by people.",
};

export const languagesHeading = "In any language";

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
