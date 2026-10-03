// Sample B v1.0 · shared by every page: theme toggle, mobile menu, and the "/" shortcut off Home.
document.documentElement.classList.add("js");
const root = document.documentElement;

const toggle = document.querySelector("[data-theme-toggle]");
const isDark = () =>
  root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
const label = () => toggle.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
label();
toggle.addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
  label();
  document.dispatchEvent(new Event("themechange"));
});

const menu = document.querySelector("[data-menu]");
const nav = document.getElementById("nav");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
});
nav.addEventListener("click", (e) => {
  if (e.target.closest("a") && menu.getAttribute("aria-expanded") === "true") menu.click();
});

// Off Home there is no console, so "/" goes to it.
if (!document.querySelector("[data-console]")) {
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !e.target.closest("input, textarea")) {
      e.preventDefault();
      location.href = "index.html#lookup";
    }
  });
}
