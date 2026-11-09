
function setLang(l) {
  document.documentElement.lang = l;
  document.querySelectorAll("[data-lang]").forEach(s => { s.hidden = s.dataset.lang !== l; });
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.l === l)));
}
document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.l)));
setLang((navigator.language || "en").toLowerCase().startsWith("nl") ? "nl" : "en");
