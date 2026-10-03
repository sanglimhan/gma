(() => {
  "use strict";
  const poster = document.querySelector(".poster");
  const rows = [...document.querySelectorAll(".marquee")];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  rows.forEach(row => {
    const copy = row.querySelector(".copy");
    const phrase = copy.textContent;
    const fragment = document.createDocumentFragment();
    const characters = [...phrase];
    let spacingPair;
    for (const [index, character] of characters.entries()) {
      if (index % 2 === 0) {
        spacingPair = {
          shift: index + 1 < characters.length ? .035 + Math.random() * .055 : 0,
          duration: (3 + Math.random() * 5).toFixed(2) + "s",
          delay: (-Math.random() * 16).toFixed(2) + "s"
        };
      }
      const glyph = document.createElement("span");
      glyph.className = "glyph";
      glyph.textContent = character;
      // Adjacent gaps expand/contract in opposite phases, keeping the loop width constant.
      glyph.style.setProperty("--spacing-shift", String(spacingPair.shift * (index % 2 ? -1 : 1)) + "em");
      glyph.style.setProperty("--spacing-duration", spacingPair.duration);
      glyph.style.setProperty("--spacing-delay", spacingPair.delay);
      glyph.style.setProperty("--weight", String(100 + Math.floor(Math.random() * 601)));
      glyph.style.setProperty("--spacing", ((Math.random() * .24) - .10).toFixed(3) + "em");
      glyph.style.setProperty("--weight-duration", (2.5 + Math.random() * 5).toFixed(2) + "s");
      glyph.style.setProperty("--weight-delay", (-Math.random() * 15).toFixed(2) + "s");
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
