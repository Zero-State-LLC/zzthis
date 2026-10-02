import { describe, expect, it } from "vitest";
import {
  flowACode,
  flowAStepIds,
  mockCodes,
  type FlowAStepId,
  type HandlingOption,
} from "../src/content/demo";
import {
  confirmSuggestion,
  flowAReducer,
  initialFlowA,
  initialFlowB,
  lookup,
  stepAnnouncement,
  stepIndex,
  type FlowAEvent,
  type FlowAState,
} from "../src/demo/demoMachine";

const at = (
  step: FlowAStepId,
  choice: HandlingOption | null = null,
  voiceUsed = false,
): FlowAState => ({ step, choice, voiceUsed });

const forward: readonly {
  from: FlowAStepId;
  event: FlowAEvent;
  to: FlowAStepId;
}[] = [
  { from: "A0", event: { type: "START" }, to: "A1" },
  { from: "A1", event: { type: "PHOTOGRAPH" }, to: "A2" },
  { from: "A2", event: { type: "SHOW_RESULT" }, to: "A3" },
  { from: "A3", event: { type: "CONFIRM" }, to: "A4" },
  { from: "A3", event: { type: "RETRY" }, to: "A2" },
  { from: "A4", event: { type: "NEXT" }, to: "A5" },
  { from: "A5", event: { type: "CONTINUE" }, to: "A6" },
  { from: "A6", event: { type: "REVIEW_COMPLETE" }, to: "A7" },
];

const simpleEvents: readonly FlowAEvent[] = [
  { type: "START" },
  { type: "PHOTOGRAPH" },
  { type: "SHOW_RESULT" },
  { type: "CONFIRM" },
  { type: "RETRY" },
  { type: "NEXT" },
  { type: "CONTINUE" },
  { type: "REVIEW_COMPLETE" },
  { type: "RESTART" },
];

describe("flowAReducer forward transitions", () => {
  for (const { from, event, to } of forward) {
    it(`${from} ${event.type} goes to ${to}`, () => {
      const state = at(from, "Return");
      expect(flowAReducer(state, event)).toEqual(at(to, "Return"));
    });
  }

  it("starts at A0 with no choice", () => {
    expect(initialFlowA).toEqual({
      step: "A0",
      choice: null,
      voiceUsed: false,
    });
  });

  it("returns the same object for events invalid at a step", () => {
    for (const step of flowAStepIds) {
      for (const event of simpleEvents) {
        const valid =
          forward.some((t) => t.from === step && t.event.type === event.type) ||
          (step === "A7" && event.type === "RESTART");
        if (!valid) {
          const state = at(step, "Return");
          expect(flowAReducer(state, event)).toBe(state);
        }
      }
    }
  });
});

describe("flowAReducer BACK", () => {
  const expected: Record<FlowAStepId, FlowAStepId> = {
    A0: "A0",
    A1: "A0",
    A2: "A1",
    A3: "A2",
    A4: "A3",
    A5: "A4",
    A6: "A5",
    A7: "A6",
  };

  for (const step of flowAStepIds) {
    it(`goes back from ${step} to ${expected[step]}`, () => {
      expect(flowAReducer(at(step, "Pack"), { type: "BACK" })).toEqual(
        at(expected[step], "Pack"),
      );
    });
  }

  it("returns the same object for BACK at A0", () => {
    const state = at("A0");
    expect(flowAReducer(state, { type: "BACK" })).toBe(state);
  });
});

describe("flowAReducer choices", () => {
  it("records a tapped choice at A5", () => {
    expect(
      flowAReducer(at("A5"), {
        type: "CHOOSE",
        option: "Repair",
        viaVoice: false,
      }),
    ).toEqual(at("A5", "Repair", false));
  });

  it("records a simulated voice choice at A5", () => {
    expect(
      flowAReducer(at("A5", "Pack"), {
        type: "CHOOSE",
        option: "Return",
        viaVoice: true,
      }),
    ).toEqual(at("A5", "Return", true));
  });

  it("ignores CHOOSE outside A5", () => {
    const state = at("A4");
    expect(
      flowAReducer(state, { type: "CHOOSE", option: "Pack", viaVoice: false }),
    ).toBe(state);
  });

  it("blocks CONTINUE at A5 without a choice", () => {
    const state = at("A5");
    expect(flowAReducer(state, { type: "CONTINUE" })).toBe(state);
  });

  it("blocks REVIEW_COMPLETE at A6 without a choice", () => {
    const state = at("A6");
    expect(flowAReducer(state, { type: "REVIEW_COMPLETE" })).toBe(state);
  });

  it("keeps the voice flag through to review", () => {
    expect(
      flowAReducer(at("A5", "Return", true), { type: "CONTINUE" }),
    ).toEqual(at("A6", "Return", true));
  });
});

describe("flowAReducer RESTART", () => {
  it("returns the initial state from A7", () => {
    expect(flowAReducer(at("A7", "Dispose", true), { type: "RESTART" })).toBe(
      initialFlowA,
    );
  });

  it("is ignored before A7", () => {
    const state = at("A6", "Dispose");
    expect(flowAReducer(state, { type: "RESTART" })).toBe(state);
  });
});

describe("step announcements", () => {
  it("numbers steps from 1", () => {
    expect(stepIndex("A0")).toBe(1);
    expect(stepIndex("A7")).toBe(8);
  });

  it("announces every step", () => {
    expect(flowAStepIds.map(stepAnnouncement)).toEqual(
      [
        "Step 1 of 8: Intro",
        "Step 2 of 8: Mark",
        "Step 3 of 8: Read result",
        "Step 4 of 8: Linked record",
        "Step 5 of 8: Handling",
        "Step 6 of 8: Review",
        "Step 7 of 8: End",
        "Step 8 of 8: End".replace("8: End", "8: End"),
      ]
        .map((text, i) => (i === 6 ? "Step 7 of 8: Review" : text))
        .slice(0, 0)
        .concat([
          "Step 1 of 8: Intro",
          "Step 2 of 8: Mark",
          "Step 3 of 8: Photo",
          "Step 4 of 8: Read result",
          "Step 5 of 8: Linked record",
          "Step 6 of 8: Handling",
          "Step 7 of 8: Review",
          "Step 8 of 8: End",
        ]),
    );
  });
});

describe("Flow B", () => {
  it("starts idle", () => {
    expect(initialFlowB).toEqual({ state: "B0" });
  });

  it("maps resolved to B1", () => {
    expect(lookup("zz-copper-lantern-sky-zz", mockCodes)).toEqual({
      state: "B1",
      code: flowACode,
    });
  });

  it("maps suggest to B2", () => {
    expect(lookup("zz-coper-lantern-sky-zz", mockCodes)).toEqual({
      state: "B2",
      suggestions: [{ code: flowACode, distance: 1 }],
    });
  });

  it("maps abstain-unknown to B3", () => {
    expect(lookup("zz-apple-sky-zz", mockCodes)).toEqual({ state: "B3" });
  });

  it("maps abstain-malformed to B4 with the reason", () => {
    expect(lookup("copper", mockCodes)).toEqual({
      state: "B4",
      reason: "no-marker",
    });
    expect(lookup("", mockCodes)).toEqual({ state: "B4", reason: "empty" });
  });

  it("confirms a suggestion into B1 with the same code object", () => {
    const view = confirmSuggestion(flowACode);
    expect(view).toEqual({ state: "B1", code: flowACode });
    expect(view.state === "B1" && view.code).toBe(flowACode);
  });
});
