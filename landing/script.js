(() => {
  "use strict";
  const stage = document.querySelector(".signal");
  const button = document.querySelector(".remix");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let x = 0, y = 0, tx = 0, ty = 0;
  let frame = 0, last = 0, phase = 0;
  function pointer(event) {
    if (motion.matches) return;
    const point = event.touches?.[0] || event;
    if (point.clientX == null) return;
    const bounds = stage.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, (point.clientX - bounds.left) / bounds.width * 2 - 1));
    ty = Math.max(-1, Math.min(1, (point.clientY - bounds.top) / bounds.height * 2 - 1));
  }
  function animate(time) {
    frame = 0;
    if (document.hidden || motion.matches) return;
    const ease = 1 - Math.exp(-Math.min(64, time - (last || time - 16)) / 100);
    last = time;
    x += (tx - x) * ease; y += (ty - y) * ease;
    stage.style.setProperty("--px", x.toFixed(3));
    stage.style.setProperty("--py", y.toFixed(3));
    phase += Math.min(64, time - (animate.previous || time)) / 2400;
    animate.previous = time;
    stage.style.setProperty("--drift", Math.sin(phase).toFixed(3));
    frame = requestAnimationFrame(animate);
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame = 0; last = 0; animate.previous = 0;
    if (motion.matches) {
      x = y = tx = ty = 0;
      ["--px", "--py", "--drift"].forEach(name => stage.style.setProperty(name, "0"));
    } else if (!document.hidden) frame = requestAnimationFrame(animate);
  }
  // Pointer Events already include touch. Touch listeners are legacy fallback only.
  if ("PointerEvent" in window) {
    stage.addEventListener("pointermove", pointer, { passive: true });
    stage.addEventListener("pointerdown", pointer, { passive: true });
    stage.addEventListener("pointerleave", () => { tx = ty = 0; });
    stage.addEventListener("pointerup", event => { if (event.pointerType !== "mouse") tx = ty = 0; });
    stage.addEventListener("pointercancel", () => { tx = ty = 0; });
  } else {
    stage.addEventListener("mousemove", pointer, { passive: true });
    stage.addEventListener("touchstart", pointer, { passive: true });
    stage.addEventListener("touchmove", pointer, { passive: true });
    stage.addEventListener("touchend", () => { tx = ty = 0; }, { passive: true });
    stage.addEventListener("touchcancel", () => { tx = ty = 0; }, { passive: true });
    stage.addEventListener("mouseleave", () => { tx = ty = 0; });
  }
  button.addEventListener("click", () => {
    const remixed = stage.classList.toggle("remixed");
    button.setAttribute("aria-pressed", String(remixed));
  });
  document.addEventListener("visibilitychange", syncMotion);
  if (motion.addEventListener) motion.addEventListener("change", syncMotion);
  else motion.addListener(syncMotion);
  syncMotion();
})();
