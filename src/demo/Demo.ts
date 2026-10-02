import { flowATitle, flowBTitle } from "../content/demo";
import { el, nextIndex } from "./dom";
import { createFlowA } from "./renderA";
import { createFlowB } from "./renderB";

const flows = [
  { id: "a", title: flowATitle, build: createFlowA },
  { id: "b", title: flowBTitle, build: createFlowB },
] as const;

function buildTabs(): HTMLElement {
  const tabs = flows.map((flow) =>
    el("button", {
      className: "demo-tab",
      text: flow.title,
      attrs: {
        type: "button",
        role: "tab",
        id: `demo-tab-${flow.id}`,
        "aria-controls": `demo-panel-${flow.id}`,
      },
    }),
  );
  const panels = flows.map((flow) =>
    el(
      "div",
      {
        className: "demo-panel",
        attrs: {
          role: "tabpanel",
          id: `demo-panel-${flow.id}`,
          "aria-labelledby": `demo-tab-${flow.id}`,
        },
      },
      [el("h2", { text: flow.title }), flow.build()],
    ),
  );
  const select = (index: number, focus: boolean): void => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) {
        tab.focus();
      }
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, false));
    tab.addEventListener("keydown", (event) => {
      const target = nextIndex(event.key, i, tabs.length);
      if (target === null) {
        return;
      }
      event.preventDefault();
      select(target, true);
    });
  });
  select(0, false);
  return el("div", { className: "demo-tabs" }, [
    el(
      "div",
      {
        className: "demo-tablist",
        attrs: { role: "tablist", "aria-label": "Demo flows" },
      },
      tabs,
    ),
    ...panels,
  ]);
}

function mountDemo(): void {
  const app = document.getElementById("demo-app");
  if (app === null) {
    return;
  }
  document.getElementById("demo-fallback")?.remove();
  app.replaceChildren(buildTabs());
  app.hidden = false;
}

mountDemo();
