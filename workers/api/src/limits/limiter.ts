import { DurableObject } from "cloudflare:workers";

export interface Take {
  readonly allowed: boolean;
  // Whole seconds until the window ends, at least 1, when refused.
  readonly retryAfter: number;
}

interface Window {
  readonly start: number;
  readonly end: number;
  readonly count: number;
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
      };
    }
    await this.ctx.storage.put<Window>(KEY, { start, end, count: count + 1 });
    if (count === 0) await this.ctx.storage.setAlarm(end);
    return { allowed: true, retryAfter: 0 };
  }

  // Clears a finished window, so a key that goes quiet stores nothing.
  async alarm(): Promise<void> {
    const stored = await this.ctx.storage.get<Window>(KEY);
    if (stored !== undefined && stored.end > Date.now()) {
      await this.ctx.storage.setAlarm(stored.end);
      return;
    }
    await this.ctx.storage.deleteAll();
  }
}
