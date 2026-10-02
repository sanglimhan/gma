(() => {
  "use strict";
  const stage = document.querySelector(".signal");
  const canvas = document.querySelector("#noise");
  const ctx = canvas.getContext("2d");
  const button = document.querySelector(".remix");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let x = 0, y = 0, tx = 0, ty = 0, energy = 0;
  let frame = 0, last = 0, lastNoise = 0, image;
  function resize() {
    canvas.width = Math.min(240, Math.max(64, Math.round(stage.clientWidth / 8)));
    canvas.height = Math.min(160, Math.max(48, Math.round(stage.clientHeight / 8)));
    if (ctx) image = ctx.createImageData(canvas.width, canvas.height);
    drawNoise();
  }
  function drawNoise() {
    if (!ctx || !image) return;
    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.random() * 255;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
      image.data[i + 3] = 100;
    }
    ctx.putImageData(image, 0, 0);
  }
  function pointer(event) {
    if (motion.matches) return;
    const point = event.touches?.[0] || event;
    if (point.clientX == null) return;
    const bounds = stage.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, (point.clientX - bounds.left) / bounds.width * 2 - 1));
    ty = Math.max(-1, Math.min(1, (point.clientY - bounds.top) / bounds.height * 2 - 1));
    energy = 1;
  }
  function animate(time) {
    frame = 0;
    if (document.hidden || motion.matches) return;
    const ease = 1 - Math.exp(-Math.min(64, time - (last || time - 16)) / 100);
    last = time;
    x += (tx - x) * ease; y += (ty - y) * ease;
    energy *= 1 - ease * .4;
    stage.style.setProperty("--px", x.toFixed(3));
    stage.style.setProperty("--py", y.toFixed(3));
    stage.style.setProperty("--energy", energy.toFixed(3));
    if (time - lastNoise > 100) { drawNoise(); lastNoise = time; }
    frame = requestAnimationFrame(animate);
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (motion.matches) {
      x = y = tx = ty = energy = 0;
      ["--px", "--py", "--energy"].forEach(name => stage.style.setProperty(name, "0"));
      drawNoise();
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
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", syncMotion);
  if (motion.addEventListener) motion.addEventListener("change", syncMotion);
  else motion.addListener(syncMotion);
  resize(); syncMotion();
})();
