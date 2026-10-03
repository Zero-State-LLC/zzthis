export type PanelStatus = "concept" | "real-photo" | "demo-mock" | "logo";

export type Destination = "home" | "how" | "applications" | "about" | "demo";

export interface ImageMeta {
  id: string;
  src: string;
  width: number;
  height: number;
  title: string;
  shortCopy: string;
  alt: string;
  caption: string;
  focal: { x: number; y: number };
  destination: Array<Destination>;
  status: PanelStatus;
  sourceTag: "BRIEF" | "WIRE" | "ASSETS" | "MICHAEL";
}
