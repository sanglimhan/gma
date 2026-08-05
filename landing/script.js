(() => {
  "use strict";

  const root = document.documentElement;
  const stage = document.querySelector(".signal");
  const canvas = document.querySelector("#noise");
  const context = canvas.getContext("2d", { alpha: true });
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  let active = !document.hidden;
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;
  let previousX = pointerX;
  let previousY = pointerY;
  let previousTime = performance.now();
  let targetIntensity = 0;
  let intensity = 0;
  let jellyX = 0;
  let jellyY = 0;
  let targetJellyX = 0;
  let targetJellyY = 0;
  let lastNoise = 0;
  let lastTear = 0;
  let nextIdleWobble = performance.now() + 1300;
  let frame = 0;
  let flashTimer = 0;

  function resizeNoise() {
    const scale = reducedMotion.matches ? 0.08 : 0.18;
    canvas.width = Math.max(72, Math.floor(innerWidth * scale));
    canvas.height = Math.max(54, Math.floor(innerHeight * scale));
  }

  function setPointer(event) {
    const point = event.touches?.[0] || event;
    if (point.clientX == null) return;

    const now = performance.now();
    const elapsed = Math.max(12, now - previousTime);
    const deltaX = point.clientX - previousX;
    const deltaY = point.clientY - previousY;
    const distance = Math.hypot(deltaX, deltaY);
    const speed = distance / elapsed;

    pointerX = point.clientX;
    pointerY = point.clientY;
    previousX = pointerX;
    previousY = pointerY;
    previousTime = now;
    targetIntensity = Math.min(1, 0.16 + speed * 0.42);
    targetJellyX = Math.max(-34, Math.min(34, deltaX * (0.36 + speed * 0.12)));
    targetJellyY = Math.max(-28, Math.min(28, deltaY * (0.3 + speed * 0.1)));

    if (speed > 1.18 && !reducedMotion.matches) triggerFlash();
  }

  function triggerFlash() {
    const now = performance.now();
    if (now - flashTimer < 180) return;
    flashTimer = now;
    stage.classList.remove("flash");
    void stage.offsetWidth;
    stage.classList.add("flash");
  }

  function drawNoise(time) {
    if (!context || time - lastNoise < (reducedMotion.matches ? 800 : 58 - intensity * 30)) return;

    const image = context.createImageData(canvas.width, canvas.height);
    const pixels = new Uint32Array(image.data.buffer);
    const pointerCanvasX = (pointerX / innerWidth) * canvas.width;
    const pointerCanvasY = (pointerY / innerHeight) * canvas.height;
    const radiusX = Math.max(canvas.width, canvas.height) * 0.28;
    const radiusY = radiusX * 0.74;

    for (let i = 0; i < pixels.length; i += 1) {
      const x = i % canvas.width;
      const y = Math.floor(i / canvas.width);
      const local = Math.max(0, 1 - Math.hypot((x - pointerCanvasX) / radiusX, (y - pointerCanvasY) / radiusY));
      const bright = Math.random() > 0.62 ? 250 : 120;
      const alpha = Math.floor(8 + Math.random() * (15 + local * intensity * 76));
      const warmBias = local * intensity > Math.random() ? 45 : 0;
      const blue = Math.min(255, bright + warmBias);
      const green = Math.min(255, bright + warmBias);
      const red = Math.min(255, bright + warmBias * 0.35);
      pixels[i] = (alpha << 24) | (blue << 16) | (green << 8) | red;
    }

    context.putImageData(image, 0, 0);
    lastNoise = time;
  }

  function animate(time) {
    if (!active) return;

    intensity += (targetIntensity - intensity) * 0.16;
    targetIntensity *= 0.925;
    if (targetIntensity < 0.01) targetIntensity = 0;

    jellyX += (targetJellyX - jellyX) * 0.14;
    jellyY += (targetJellyY - jellyY) * 0.14;
    targetJellyX *= 0.86;
    targetJellyY *= 0.86;

    root.style.setProperty("--pointer-x", `${pointerX.toFixed(1)}px`);
    root.style.setProperty("--pointer-y", `${pointerY.toFixed(1)}px`);
    root.style.setProperty("--intensity", reducedMotion.matches ? "0" : intensity.toFixed(3));
    root.style.setProperty("--jelly-x", reducedMotion.matches ? "0px" : `${jellyX.toFixed(2)}px`);
    root.style.setProperty("--jelly-y", reducedMotion.matches ? "0px" : `${jellyY.toFixed(2)}px`);

    if (!reducedMotion.matches && time - lastTear > 58) {
      const force = intensity * intensity;
      root.style.setProperty("--tear-a", `${((Math.random() - 0.5) * 28 * force + jellyX * 0.08).toFixed(1)}px`);
      root.style.setProperty("--tear-b", `${((Math.random() - 0.5) * 18 * force - jellyY * 0.05).toFixed(1)}px`);
      lastTear = time;
    }

    if (!reducedMotion.matches && time > nextIdleWobble && intensity < 0.07) {
      root.style.setProperty("--idle-wobble", `${(Math.random() > 0.5 ? 0.8 : -0.8).toFixed(1)}deg`);
      setTimeout(() => root.style.setProperty("--idle-wobble", "0deg"), 180);
      nextIdleWobble = time + 1200 + Math.random() * 2800;
    }

    drawNoise(time);
    frame = requestAnimationFrame(animate);
  }

  addEventListener("pointermove", setPointer, { passive: true });
  addEventListener("touchmove", setPointer, { passive: true });
  addEventListener("resize", resizeNoise, { passive: true });
  document.addEventListener("visibilitychange", () => {
    active = !document.hidden;
    cancelAnimationFrame(frame);
    if (active) frame = requestAnimationFrame(animate);
  });
  reducedMotion.addEventListener?.("change", resizeNoise);

  resizeNoise();
  if (context) {
    frame = requestAnimationFrame(animate);
  } else {
    canvas.hidden = true;
  }
})();
