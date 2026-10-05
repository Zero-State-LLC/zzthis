import { DurableObject } from "cloudflare:workers";

export interface Take {
  readonly allowed: boolean;
  // Whole seconds until the window ends, at least 1, when refused.
  readonly retryAfter: number;
  // Calls counted in this window, this one included when allowed.
  readonly count: number;
}

interface Window {
  readonly start: number;
  readonly end: number;
  readonly count: number;
}

// Storage is cleared one window length after the window ends. The alarm
// runs on the runtime clock while windows use the request's clock, so the
// margin keeps a cleanup from ever landing inside a live window.
function clearAt(window: Window): number {
  return window.end + (window.end - window.start);
}

const KEY = "window";

// One instance per limiter key, fixed windows (spec 005 plan). The count
// lives in the object's storage, so an evicted object keeps its window.
// The caller passes the time, so every limit uses the request's clock.
export class Limiter extends DurableObject {
  async take(limit: number, windowMs: number, now: number): Promise<Take> {
    const start = now - (now % windowMs);
    const end = start + windowMs;
    const stored = await this.ctx.storage.get<Window>(KEY);
    const count = stored?.start === start ? stored.count : 0;
    if (count >= limit) {
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((end - now) / 1000)),
        count,
      };
    }
    const window = { start, end, count: count + 1 };
    await this.ctx.storage.put<Window>(KEY, window);
    if (count === 0) await this.ctx.storage.setAlarm(clearAt(window));
    return { allowed: true, retryAfter: 0, count: count + 1 };
  }

  // Clears a finished window, so a key that goes quiet stores nothing.
  async alarm(): Promise<void> {
    const stored = await this.ctx.storage.get<Window>(KEY);
    if (stored !== undefined && clearAt(stored) > Date.now()) {
      await this.ctx.storage.setAlarm(clearAt(stored));
      return;
    }
    await this.ctx.storage.deleteAll();
  }
}
