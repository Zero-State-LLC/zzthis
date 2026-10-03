// Sample C · Manifesto. Motion lives in CSS; this file only handles theme and menu.
const root = document.documentElement;
root.classList.add("js");

const toggle = document.querySelector("[data-theme-toggle]");
const isDark = () =>
  root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
const label = () => toggle.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
label();
toggle.addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
  label();
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
