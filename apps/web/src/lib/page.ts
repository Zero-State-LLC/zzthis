import { createApi, type Api } from "./api.ts";

// What a page controller touches, so a test can hand it a fake document,
// API, and navigation.
export interface PageEnv {
  readonly doc: Document;
  readonly api: Api;
  readonly location: Pick<Location, "search" | "pathname">;
  readonly go: (url: string) => void;
  readonly nav: Navigator;
  readonly win: Record<string, unknown>;
}

export function browserEnv(win: Window = window): PageEnv {
  return {
    doc: win.document,
    api: createApi({
      fetch: win.fetch.bind(win),
      locks: win.navigator.locks,
      now: Date.now,
    }),
    location: win.location,
    go: (url) => win.location.assign(url),
    nav: win.navigator,
    win: win as unknown as Record<string, unknown>,
  };
}
