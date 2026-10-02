import type { ImageMeta } from "../content/types";

export function objectPosition(focal: ImageMeta["focal"]): string {
  return `${focal.x * 100}% ${focal.y * 100}%`;
}
