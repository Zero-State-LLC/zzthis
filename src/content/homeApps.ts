import {
  applications,
  type Application,
  type ApplicationId,
} from "./applications";
import { images } from "./images";
import type { ImageMeta } from "./types";

export interface HomeAppEntry {
  id: ApplicationId;
  title: string;
  story: string;
  wideOnly: boolean;
  images: readonly ImageMeta[];
}

export function homeAppEntries(
  apps: readonly Application[] = applications,
): readonly HomeAppEntry[] {
  const entries: HomeAppEntry[] = [];
  for (const app of apps) {
    const shots = app.homeImages.map((id) => images[id]);
    if (shots.length === 0) continue;
    entries.push({
      id: app.id,
      title: app.title,
      story: app.story,
      wideOnly: app.homeWideOnly,
      images: shots,
    });
  }
  return entries;
}
