// Sample A · Tape. Three small jobs: write the hero code, reveal stages once, theme + menu.
document.documentElement.classList.add("js");

// 1. Split each handwritten code into words and characters so it can be "written".
for (const el of document.querySelectorAll("[data-write]")) {
  const text = el.textContent.trim();
  el.textContent = "";
  let i = 0;
  // Break after each hyphen, the way the field photos wrap a long code on tape.
  for (const part of text.split(/(?<=-)/)) {
    const word = document.createElement("span");
    word.className = "w";
    for (const ch of part) {
      const span = document.createElement("span");
      span.className = "ch";
      span.style.setProperty("--i", String(i++));
      span.textContent = ch;
      word.append(span);
    }
    el.append(word, document.createElement("wbr"));
  }
  el.setAttribute("aria-hidden", "true");
  el.classList.add("is-writing");
}

// 2. Stages sweep in once; after that the page just stays put.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      // Also settle anything already scrolled past (anchor jumps skip it otherwise).
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add("is-in");
        reveal.unobserve(entry.target);
      }
    }
  },
  { rootMargin: "0px 0px -10% 0px" },
);
for (const el of document.querySelectorAll("[data-reveal]")) reveal.observe(el);

// 3. Theme toggle (no storage: the spec resets it on reload) and the mobile menu.
const root = document.documentElement;
const toggle = document.querySelector("[data-theme-toggle]");
const isDark = () =>
  root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
const label = () => toggle?.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
label();
toggle?.addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
  label();
});

const menu = document.querySelector("[data-menu]");
const nav = document.getElementById("nav");
menu?.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
});
nav?.addEventListener("click", (e) => {
  if (e.target.closest("a") && menu?.getAttribute("aria-expanded") === "true") menu.click();
});
