(() => {
  "use strict";
  const stage = document.querySelector(".poster");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let x = 0, y = 0, tx = 0, ty = 0, frame = 0, previous = 0;
  function animate(time) {
    frame = 0;
    if (document.hidden || motion.matches) return;
    const dt = previous ? Math.min(64, time - previous) : 16;
    previous = time;
    const ease = 1 - Math.exp(-dt / 110);
    x += (tx - x) * ease;
    y += (ty - y) * ease;
    stage.style.setProperty("--px", x.toFixed(3));
    stage.style.setProperty("--py", y.toFixed(3));
    if (Math.abs(tx - x) + Math.abs(ty - y) > .001) {
      frame = requestAnimationFrame(animate);
    } else previous = 0;
  }
  function request() {
    if (!frame && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
  }
  function pointer(event) {
    if (motion.matches || event.isPrimary === false) return;
    const point = event.touches?.[0] || event;
    if (point.clientX == null) return;
    const rect = stage.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, (point.clientX - rect.left) / rect.width * 2 - 1));
    ty = Math.max(-1, Math.min(1, (point.clientY - rect.top) / rect.height * 2 - 1));
    request();
  }
  function reset() { tx = ty = 0; request(); }
  // Touch input follows one event family, avoiding duplicate delivery.
  if ("PointerEvent" in window) {
    stage.addEventListener("pointermove", pointer, { passive: true });
    stage.addEventListener("pointerdown", pointer, { passive: true });
    stage.addEventListener("pointerleave", reset);
    stage.addEventListener("pointercancel", reset);
    stage.addEventListener("pointerup", event => { if (event.pointerType !== "mouse") reset(); });
  } else {
    stage.addEventListener("mousemove", pointer, { passive: true });
    stage.addEventListener("mouseleave", reset);
    stage.addEventListener("touchstart", pointer, { passive: true });
    stage.addEventListener("touchmove", pointer, { passive: true });
    stage.addEventListener("touchend", reset, { passive: true });
    stage.addEventListener("touchcancel", reset, { passive: true });
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    stage.classList.toggle("paused", document.hidden);
    if (motion.matches) {
      x = y = tx = ty = 0;
      stage.style.setProperty("--px", "0");
      stage.style.setProperty("--py", "0");
    } else request();
  }
  document.addEventListener("visibilitychange", sync);
  if (motion.addEventListener) motion.addEventListener("change", sync);
  else motion.addListener(sync);
  sync();
})();
