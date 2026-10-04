// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consoleCopy } from "../src/content/console";
import { mountConsole } from "../src/console/mount";

const fixture = `
<section data-console>
  <div role="tablist">
    <button role="tab" id="tab-camera" aria-controls="panel-camera" aria-selected="true" data-tab="camera" type="button">Camera</button>
    <button role="tab" id="tab-typing" aria-controls="panel-typing" aria-selected="false" data-tab="typing" type="button">Typing</button>
    <button role="tab" id="tab-voice" aria-controls="panel-voice" aria-selected="false" data-tab="voice" type="button">Voice</button>
  </div>
  <div id="panel-camera">
    <figure data-cam>
      <img alt="" data-cam-img />
      <div class="cam__roi"></div>
      <canvas data-dither width="256" height="112"></canvas>
    </figure>
    <div data-readout hidden></div>
    <button type="button" data-read>Photograph</button>
  </div>
  <div id="panel-typing" hidden>
    <input data-input value="zz-hello-zz" />
  </div>
  <div id="panel-voice" hidden>
    <button type="button" data-voice>Voice</button>
    <p data-heard hidden>heard</p>
  </div>
  <ol data-tokens></ol>
  <p data-status></p>
  <div data-result></div>
  <button type="button" data-lookup>Look up</button>
</section>`;

function tab(name: string): HTMLButtonElement {
  const node = document.querySelector(`[data-tab="${name}"]`);
  if (!(node instanceof HTMLButtonElement)) throw new Error(name);
  return node;
}

function status(): string {
  return document.querySelector("[data-status]")?.textContent ?? "";
}

function result(): string {
  return document.querySelector("[data-result]")?.textContent ?? "";
}

describe("pending camera scan", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = fixture;
    location.hash = "";
    mountConsole(document);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("starts a scan that can still resolve while Camera stays selected", () => {
    expect(
      document.querySelector("[data-cam]")?.classList.contains("is-scanning"),
    ).toBe(true);
    vi.advanceTimersByTime(950);
    expect(result()).toContain("zz-copper-lantern-sky-zz");
    expect(
      document.querySelector("[data-cam]")?.classList.contains("is-scanning"),
    ).toBe(false);
  });

  it("does not overwrite Typing when the 950 ms scan was already pending", () => {
    tab("typing").click();
    const typed = status();
    expect(typed).toContain("zz-hello-zz");
    vi.advanceTimersByTime(950);
    expect(status()).toBe(typed);
    expect(result()).toBe("");
    expect(
      document.querySelector("[data-cam]")?.classList.contains("is-scanning"),
    ).toBe(false);
  });

  it("does not overwrite Voice when the 950 ms scan was already pending", () => {
    tab("voice").click();
    expect(status()).toBe(consoleCopy.voiceWaiting);
    expect(document.querySelector("[data-heard]")?.hasAttribute("hidden")).toBe(
      true,
    );
    vi.advanceTimersByTime(950);
    expect(status()).toBe(consoleCopy.voiceWaiting);
    expect(result()).toBe("");
    expect(
      document.querySelector("[data-readout]")?.hasAttribute("hidden"),
    ).toBe(true);
  });
});
