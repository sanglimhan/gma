(() => {
  "use strict";
  const poster = document.querySelector(".poster");
  const rows = [...document.querySelectorAll(".marquee")];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  rows.forEach(row => {
    const copy = row.querySelector(".copy");
    const phrase = copy.textContent;
    const fragment = document.createDocumentFragment();
    for (const character of phrase) {
      const glyph = document.createElement("span");
      glyph.className = "glyph";
      glyph.textContent = character;
      // Choose once per character; retain weights while moving and resizing.
      glyph.style.setProperty("--weight", String(100 + Math.floor(Math.random() * 601)));
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
    const speed = Math.max(55, Math.min(110, innerWidth * .09));
    rows.forEach((row, index) => {
      const duration = row.querySelector(".copy").getBoundingClientRect().width / speed;
      row.style.setProperty("--duration", duration + "s");
      row.style.setProperty("--delay", (-duration * [0, .28, .57][index]) + "s");
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
