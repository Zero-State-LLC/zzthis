import { b4Line, flowBCopy, mockCodes, type MockCode } from "../content/demo";
import { initialFlowB, lookup, type FlowBView } from "./demoMachine";
import { badge, button, el, mount, recordCard } from "./dom";

type Show = (view: FlowBView<MockCode>) => void;

function viewBody(view: FlowBView<MockCode>): Node[] {
  switch (view.state) {
    case "B0":
      return [];
    case "B1":
      return [recordCard(view.code, "h3")];
    case "B3":
      return [el("p", { text: flowBCopy.unknown })];
    case "B4":
      return [el("p", { text: b4Line(view.reason) })];
    case "B5":
      return [el("p", { text: flowBCopy.bare })];
  }
}

function renderView(view: FlowBView<MockCode>): HTMLElement {
  const badgeId = "demo-b-badge";
  return el(
    "section",
    { className: "demo-step", attrs: { "aria-labelledby": badgeId } },
    [mount([badge(badgeId), ...viewBody(view)])],
  );
}

export function createFlowB(): HTMLElement {
  const inputId = "demo-b-input";
  const input = el("input", {
    className: "demo-input code",
    attrs: {
      id: inputId,
      type: "text",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
    },
  });
  const results = el("div", {
    className: "demo-results",
    attrs: { "aria-live": "polite" },
  });
  const show: Show = (view) => {
    results.replaceChildren(renderView(view));
  };
  const run = (): void => show(lookup(input.value, mockCodes));
  const submit = el("button", {
    className: "btn btn--primary",
    text: flowBCopy.lookUp,
    attrs: { type: "submit" },
  });
  const form = el("form", { className: "demo-lookup" }, [
    el("label", { text: flowBCopy.inputLabel, attrs: { for: inputId } }),
    el("div", { className: "demo-lookup__row" }, [input, submit]),
  ]);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  const chipsLabelId = "demo-b-examples";
  const chips = el(
    "ul",
    { className: "demo-chips", attrs: { "aria-labelledby": chipsLabelId } },
    mockCodes.map((entry) => {
      const chip = button(entry.code, () => {
        input.value = entry.code;
        run();
      });
      chip.classList.add("demo-chip", "code");
      return el("li", {}, [chip]);
    }),
  );
  show(initialFlowB);
  return el("div", { className: "demo-flow" }, [
    form,
    el("p", {
      className: "eyebrow",
      text: flowBCopy.examplesLabel,
      attrs: { id: chipsLabelId },
    }),
    chips,
    results,
  ]);
}
