(() => {
  "use strict";
  const poster = document.querySelector(".poster");
  const rows = [...document.querySelectorAll(".marquee")];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  rows.forEach(row => {
    const copy = row.querySelector(".copy");
    const phrase = copy.textContent.replace(/[\s\u00a0]+/g, " ").trim();
    const fragment = document.createDocumentFragment();
    for (const character of phrase) {
      const glyph = document.createElement("span");
      const isSpace = character === " ";
      glyph.className = isSpace ? "glyph space" : "glyph";
      glyph.textContent = character;
      if (!isSpace) {
        // Move every character symmetrically without changing the measured loop width.
        glyph.style.setProperty("--sway", (.18 + Math.random() * .20).toFixed(3) + "em");
        glyph.style.setProperty("--sway-duration", (1.1 + Math.random() * 1.7).toFixed(2) + "s");
        glyph.style.setProperty("--sway-delay", (-Math.random() * 8).toFixed(2) + "s");
        glyph.style.setProperty("--weight", String(100 + Math.floor(Math.random() * 601)));
        glyph.style.setProperty("--spacing", (-.03 + Math.random() * .07).toFixed(3) + "em");
        glyph.style.setProperty("--weight-duration", (2.5 + Math.random() * 5).toFixed(2) + "s");
        glyph.style.setProperty("--weight-delay", (-Math.random() * 15).toFixed(2) + "s");
      }
      fragment.appendChild(glyph);
    }
    copy.replaceChildren(fragment);
    // Expose the phrase once instead of individual letters to screen readers.
    copy.setAttribute("aria-label", phrase);
    [...copy.children].forEach(glyph => glyph.setAttribute("aria-hidden", "true"));
    const duplicate = copy.cloneNode(true);
    duplicate.removeAttribute("aria-label");
    duplicate.setAttribute("aria-hidden", "true");
    row.querySelector(".track").appendChild(duplicate);
  });

  function measure() {
    const speed = Math.max(12, Math.min(24, innerWidth * .02));
    rows.forEach((row, index) => {
      const duration = row.querySelector(".copy").getBoundingClientRect().width / speed;
      row.style.setProperty("--duration", duration + "s");
      row.style.setProperty("--delay", (-duration * ((index * .173) % 1)) + "s");
    });
    poster.classList.add("ready");
  }
  function sync() {
    poster.classList.toggle("paused", document.hidden);
    rows.forEach((row, index) => row.setAttribute("aria-label",
      "Lab identity, row " + (index + 1) + (motion.matches
        ? ". Scroll horizontally to read."
        : ". Focus to pause.")));
    measure();
  }
  addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", sync);
  if (motion.addEventListener) motion.addEventListener("change", sync);
  else motion.addListener(sync);
  if (document.fonts) document.fonts.ready.then(measure);
  sync();
})();
