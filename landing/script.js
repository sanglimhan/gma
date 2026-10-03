(() => {
  "use strict";
  const stage = document.querySelector(".marquee");
  const copy = document.querySelector(".copy");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  function measure() {
    const speed = Math.max(70, Math.min(160, innerWidth * .12));
    stage.style.setProperty("--duration", (copy.getBoundingClientRect().width / speed) + "s");
    stage.classList.add("ready");
  }
  function sync() {
    stage.classList.toggle("paused", document.hidden);
    stage.setAttribute("aria-label", motion.matches
      ? "Lab identity. Scroll horizontally to read."
      : "Scrolling lab identity. Focus to pause.");
    measure();
  }
  addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", sync);
  if (motion.addEventListener) motion.addEventListener("change", sync);
  else motion.addListener(sync);
  if (document.fonts) document.fonts.ready.then(measure);
  sync();
})();
