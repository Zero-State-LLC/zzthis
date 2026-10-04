import {
  flowAStepIds,
  flowASteps,
  type FlowAStepId,
  type HandlingOption,
} from "../content/demo";
import type { ParseFailure } from "../lib/grammar";
import { resolve } from "../lib/resolver";

export interface FlowAState {
  step: FlowAStepId;
  choice: HandlingOption | null;
  voiceUsed: boolean;
}

export type FlowAEvent =
  | { type: "START" }
  | { type: "PHOTOGRAPH" }
  | { type: "SHOW_RESULT" }
  | { type: "CONFIRM" }
  | { type: "RETRY" }
  | { type: "NEXT" }
  | { type: "CHOOSE"; option: HandlingOption; viaVoice: boolean }
  | { type: "CONTINUE" }
  | { type: "REVIEW_COMPLETE" }
  | { type: "RESTART" }
  | { type: "BACK" };

export const initialFlowA: FlowAState = {
  step: "A0",
  choice: null,
  voiceUsed: false,
};

const backTargets: Record<FlowAStepId, FlowAStepId | null> = {
  A0: null,
  A1: "A0",
  A2: "A1",
  A3: "A2",
  A4: "A3",
  A5: "A4",
  A6: "A5",
  A7: "A6",
};

function move(
  state: FlowAState,
  from: FlowAStepId,
  to: FlowAStepId,
): FlowAState {
  return state.step === from ? { ...state, step: to } : state;
}

function back(state: FlowAState): FlowAState {
  const target = backTargets[state.step];
  return target === null ? state : { ...state, step: target };
}

function choose(
  state: FlowAState,
  option: HandlingOption,
  viaVoice: boolean,
): FlowAState {
  return state.step === "A5"
    ? { ...state, choice: option, voiceUsed: viaVoice }
    : state;
}

function withChoice(
  state: FlowAState,
  from: FlowAStepId,
  to: FlowAStepId,
): FlowAState {
  return state.choice === null ? state : move(state, from, to);
}

export function flowAReducer(state: FlowAState, event: FlowAEvent): FlowAState {
  switch (event.type) {
    case "START":
      return move(state, "A0", "A1");
    case "PHOTOGRAPH":
      return move(state, "A1", "A2");
    case "SHOW_RESULT":
      return move(state, "A2", "A3");
    case "CONFIRM":
      return move(state, "A3", "A4");
    case "RETRY":
      return move(state, "A3", "A2");
    case "NEXT":
      return move(state, "A4", "A5");
    case "CHOOSE":
      return choose(state, event.option, event.viaVoice);
    case "CONTINUE":
      return withChoice(state, "A5", "A6");
    case "REVIEW_COMPLETE":
      return withChoice(state, "A6", "A7");
    case "RESTART":
      return state.step === "A7" ? initialFlowA : state;
    case "BACK":
      return back(state);
  }
}

export function stepIndex(step: FlowAStepId): number {
  return flowAStepIds.indexOf(step) + 1;
}

export function stepAnnouncement(step: FlowAStepId): string {
  return `Step ${stepIndex(step)} of ${flowAStepIds.length}: ${flowASteps[step].name}`;
}

export type FlowBView<T> =
  | { state: "B0" }
  | { state: "B1"; code: T }
  | { state: "B3" }
  | { state: "B4"; reason: ParseFailure }
  | { state: "B5" };

export const initialFlowB: { state: "B0" } = { state: "B0" };

export function lookup<T extends { code: string }>(
  input: string,
  codes: readonly T[],
): FlowBView<T> {
  const result = resolve(input, codes);
  switch (result.kind) {
    case "resolved":
      return { state: "B1", code: result.code };
    case "abstain-unknown":
      return { state: "B3" };
    case "abstain-bare":
      return { state: "B5" };
    case "abstain-malformed":
      return { state: "B4", reason: result.reason };
  }
}
