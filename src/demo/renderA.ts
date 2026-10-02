import {
  flowACode,
  flowACopy,
  flowASteps,
  handlingOptions,
  suggestedHandling,
  type HandlingOption,
} from "../content/demo";
import { url } from "../lib/url";
import {
  flowAReducer,
  initialFlowA,
  stepAnnouncement,
  type FlowAEvent,
  type FlowAState,
} from "./demoMachine";
import {
  badge,
  button,
  el,
  fieldList,
  mount,
  nextIndex,
  recordCard,
  stepImage,
} from "./dom";

type Dispatch = (event: FlowAEvent, focusKey?: string) => void;

interface Action {
  label: string;
  event: FlowAEvent;
  primary: boolean;
  disabled?: boolean;
}

function actionsFor(state: FlowAState): Action[] {
  switch (state.step) {
    case "A0":
      return [
        { label: flowACopy.start, event: { type: "START" }, primary: true },
      ];
    case "A1":
      return [
        {
          label: flowACopy.photograph,
          event: { type: "PHOTOGRAPH" },
          primary: true,
        },
      ];
    case "A2":
      return [
        {
          label: flowACopy.showResult,
          event: { type: "SHOW_RESULT" },
          primary: true,
        },
      ];
    case "A3":
      return [
        { label: flowACopy.confirm, event: { type: "CONFIRM" }, primary: true },
        { label: flowACopy.retry, event: { type: "RETRY" }, primary: false },
      ];
    case "A4":
      return [
        { label: flowACopy.next, event: { type: "NEXT" }, primary: true },
      ];
    case "A5":
      return [
        {
          label: flowACopy.continueToReview,
          event: { type: "CONTINUE" },
          primary: true,
          disabled: state.choice === null,
        },
      ];
    case "A6":
      return [
        {
          label: flowACopy.reviewComplete,
          event: { type: "REVIEW_COMPLETE" },
          primary: true,
        },
      ];
    case "A7":
      return [
        { label: flowACopy.restart, event: { type: "RESTART" }, primary: true },
      ];
  }
}

function optionButton(
  option: HandlingOption,
  index: number,
  state: FlowAState,
  dispatch: Dispatch,
): HTMLButtonElement {
  const checked = state.choice === option;
  const focusable = state.choice === null ? index === 0 : checked;
  const children: Node[] = [
    el("span", { className: "demo-option__name", text: option }),
  ];
  if (option === suggestedHandling.option) {
    children.push(
      el("span", {
        className: "demo-option__hint",
        text: flowACopy.suggestionLabel,
      }),
      el("span", {
        className: "demo-option__hint",
        text: suggestedHandling.reason,
      }),
    );
  }
  const node = el(
    "button",
    {
      className: "demo-option",
      attrs: {
        type: "button",
        role: "radio",
        "aria-checked": String(checked),
        tabindex: focusable ? "0" : "-1",
        "data-focus": option,
      },
    },
    children,
  );
  node.addEventListener("click", () => {
    dispatch({ type: "CHOOSE", option, viaVoice: false }, option);
  });
  node.addEventListener("keydown", (event) => {
    const target = nextIndex(event.key, index, handlingOptions.length);
    const nextOption = target === null ? undefined : handlingOptions[target];
    if (nextOption === undefined) {
      return;
    }
    event.preventDefault();
    dispatch(
      { type: "CHOOSE", option: nextOption, viaVoice: false },
      nextOption,
    );
  });
  return node;
}

function handlingBody(state: FlowAState, dispatch: Dispatch): Node[] {
  const labelId = "demo-handling-label";
  const group = el(
    "div",
    {
      className: "demo-options",
      attrs: { role: "radiogroup", "aria-labelledby": labelId },
    },
    handlingOptions.map((option, index) =>
      optionButton(option, index, state, dispatch),
    ),
  );
  const voice = button(flowACopy.voiceChip, () => {
    dispatch(
      { type: "CHOOSE", option: suggestedHandling.option, viaVoice: true },
      "voice",
    );
  });
  voice.classList.add("demo-chip");
  voice.dataset["focus"] = "voice";
  const nodes: Node[] = [
    el("p", {
      className: "eyebrow",
      text: flowACopy.handlingLabel,
      attrs: { id: labelId },
    }),
    group,
    voice,
  ];
  if (state.voiceUsed) {
    nodes.push(
      el("p", {
        className: "demo-voice",
        text: flowACopy.voiceResult,
        attrs: { role: "status" },
      }),
    );
  }
  return nodes;
}

function reviewForm(state: FlowAState): Node[] {
  return [
    el("p", { className: "eyebrow", text: flowACopy.formLabel }),
    fieldList([
      { label: flowACopy.chosenAction, value: `${state.choice ?? ""} (mock)` },
      { label: flowACopy.code, value: flowACode.code },
      { label: flowACopy.reason, value: suggestedHandling.reason },
      ...flowACode.fields,
    ]),
  ];
}

function stepBody(state: FlowAState, dispatch: Dispatch): Node[] {
  switch (state.step) {
    case "A0":
    case "A2":
      return [];
    case "A1":
      return [el("p", { className: "code demo-code", text: flowACode.code })];
    case "A3":
      return [
        el("p", { className: "code demo-code", text: flowACode.code }),
        el("p", { className: "code", text: flowACopy.confidence }),
        el("p", { className: "code", text: flowACopy.checksum }),
      ];
    case "A4":
      return [recordCard(flowACode, "h4")];
    case "A5":
      return handlingBody(state, dispatch);
    case "A6":
      return reviewForm(state);
    case "A7":
      return [
        el("p", {}, [
          el("a", { text: flowACopy.contact, attrs: { href: url("contact") } }),
        ]),
      ];
  }
}

function actionRow(state: FlowAState, dispatch: Dispatch): HTMLElement {
  const row = el(
    "div",
    { className: "demo-actions" },
    actionsFor(state).map((action) => {
      const node = button(
        action.label,
        () => dispatch(action.event),
        action.primary,
      );
      if (action.disabled === true) {
        node.setAttribute("aria-disabled", "true");
      }
      return node;
    }),
  );
  if (state.step !== "A0") {
    row.append(button(flowACopy.back, () => dispatch({ type: "BACK" })));
  }
  return row;
}

function renderStep(state: FlowAState, dispatch: Dispatch): HTMLElement {
  const meta = flowASteps[state.step];
  const badgeId = "demo-a-badge";
  const headingId = "demo-a-heading";
  const children: Node[] = [
    badge(badgeId),
    el("h3", {
      className: "demo-step__heading",
      text: meta.name,
      attrs: { id: headingId, tabindex: "-1" },
    }),
    stepImage(meta.image),
  ];
  if (meta.text !== "") {
    children.push(el("p", { className: "demo-step__text", text: meta.text }));
  }
  children.push(...stepBody(state, dispatch), actionRow(state, dispatch));
  return el(
    "section",
    {
      className: "demo-step",
      attrs: { "aria-labelledby": `${badgeId} ${headingId}` },
    },
    [mount(children)],
  );
}

export function createFlowA(): HTMLElement {
  const live = el("p", {
    className: "visually-hidden",
    attrs: { "aria-live": "polite" },
  });
  const holder = el("div");
  let state = initialFlowA;
  const dispatch: Dispatch = (event, focusKey) => {
    const next = flowAReducer(state, event);
    if (next === state) {
      return;
    }
    const stepChanged = next.step !== state.step;
    state = next;
    holder.replaceChildren(renderStep(state, dispatch));
    if (stepChanged) {
      live.textContent = stepAnnouncement(state.step);
      holder.querySelector<HTMLElement>(".demo-step__heading")?.focus();
    } else if (focusKey !== undefined) {
      holder.querySelector<HTMLElement>(`[data-focus="${focusKey}"]`)?.focus();
    }
  };
  holder.replaceChildren(renderStep(state, dispatch));
  return el("div", { className: "demo-flow" }, [live, holder]);
}
