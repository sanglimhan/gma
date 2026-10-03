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
        glyph.style.setProperty("--sway", (.06 + Math.random() * .04).toFixed(3) + "em");
        glyph.style.setProperty("--sway-duration", (.55 + Math.random() * .85).toFixed(2) + "s");
        glyph.style.setProperty("--sway-delay", (-Math.random() * 8).toFixed(2) + "s");
        glyph.style.setProperty("--weight", String(100 * (1 + Math.floor(Math.random() * 7))));
        glyph.style.setProperty("--spacing", (.16 + Math.random() * .02).toFixed(3) + "em");
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


  // Reserve each character's widest advance across every displayed weight.
  // Fixed slots preserve the loop width while discrete weights and sway change.
  function sizeCharacters() {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;
    const widths = new Map();
    poster.querySelectorAll(".glyph:not(.space)").forEach(glyph => {
      const character = glyph.textContent;
      if (!widths.has(character)) {
        let width = 0;
        for (let weight = 100; weight <= 700; weight += 100) {
          context.font = weight + ' 100px "IBM Plex Sans", Arial, sans-serif';
          const metrics = context.measureText(character);
          width = Math.max(width, metrics.width,
            (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || 0));
        }
        widths.set(character, (width / 100 + .02).toFixed(4) + "em");
      }
      glyph.style.setProperty("--advance", widths.get(character));
    });
    measure();
  }

  // Distinct spatial phases, independent of each row's travel direction.
  const phases = rows.map((_, index) => index / rows.length);
  for (let i = phases.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [phases[i], phases[j]] = [phases[j], phases[i]];
  }
  const states = rows.map((row, index) => ({
    row, track: row.querySelector(".track"), phase: phases[index],
    width: 0, direction: index % 2 ? 1 : -1,
    velocity: (index % 2 ? 1 : -1) * baseSpeed(),
    hovered: false, boostUntil: 0, tapTimer: 0
  }));
  let frame = 0;
  let lastTime = 0;
  function baseSpeed() { return Math.max(28, Math.min(48, innerWidth * .04)); }
  function draw(state) {
    state.track.style.transform = motion.matches ? "none"
      : "translate3d(" + (-state.phase * state.width) + "px,0,0)";
  }
  function measure() {
    states.forEach(state => {
      const copies = [...state.track.querySelectorAll(".copy")];
      copies.slice(2).forEach(copy => copy.remove());
      state.width = copies[0].getBoundingClientRect().width;
      // Cover even extremely wide, short viewports throughout a full loop.
      if (state.width > 0 && !motion.matches) {
        const count = Math.max(2, Math.ceil(state.row.clientWidth / state.width) + 1);
        for (let i = 2; i < count; i++) state.track.appendChild(copies[1].cloneNode(true));
      }
      draw(state);
    });
  }
  function tick(now) {
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
    lastTime = now;
    states.forEach(state => {
      const boost = 1 + 1.2 * Math.max(0, Math.min(1, (state.boostUntil - now) / 1100));
      // Let the click impulse remain visible even while the pointer stays on the row.
      const hoverFactor = state.hovered && now >= state.boostUntil ? .22 : 1;
      const target = state.direction * baseSpeed() * hoverFactor * boost;
      state.velocity += (target - state.velocity) * (1 - Math.exp(-dt / .18));
      if (state.width > 0) {
        state.phase = ((state.phase - state.velocity * dt / state.width) % 1 + 1) % 1;
        draw(state);
      }
    });
    frame = requestAnimationFrame(tick);
  }
  states.forEach(state => {
    state.row.addEventListener("pointerenter", event => {
      if (event.pointerType === "touch") return;
      state.hovered = true;
      state.row.classList.add("is-hovered");
    });
    const leave = () => {
      state.hovered = false;
      state.row.classList.remove("is-hovered");
    };
    state.row.addEventListener("pointerleave", leave);
    state.row.addEventListener("pointercancel", leave);
    state.row.addEventListener("click", () => {
      state.direction *= -1;
      state.boostUntil = performance.now() + 1100;
      state.row.classList.add("is-tapped");
      clearTimeout(state.tapTimer);
      state.tapTimer = setTimeout(() => state.row.classList.remove("is-tapped"), 650);
    });
  });
  function sync() {
    cancelAnimationFrame(frame);
    lastTime = 0;
    poster.classList.toggle("paused", document.hidden);
    states.forEach((state, index) => {
      if (document.hidden) {
        state.hovered = false;
        state.row.classList.remove("is-hovered");
      }
      state.row.setAttribute("aria-label", "Lab identity, row " + (index + 1) +
        (motion.matches ? ". Scroll horizontally to read." : ""));
      draw(state);
    });
    if (!document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
  }
  addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", sync);
  const motionChanged = () => { measure(); sync(); };
  if (motion.addEventListener) motion.addEventListener("change", motionChanged);
  else motion.addListener(motionChanged);
  sizeCharacters();
  sync();
  if (document.fonts) {
    Promise.all(Array.from({ length: 7 }, (_, i) =>
      document.fonts.load((i + 1) * 100 + ' 100px "IBM Plex Sans"')))
      .then(sizeCharacters).catch(() => document.fonts.ready.then(sizeCharacters));
  }
})();
