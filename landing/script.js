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
  let lastNoise = 0;
  let lastTear = 0;
  let nextIdleJolt = performance.now() + 1800;
  let frame = 0;
  let flashTimer = 0;

  function resizeNoise() {
    const scale = reducedMotion.matches ? 0.1 : 0.2;
    canvas.width = Math.max(72, Math.floor(innerWidth * scale));
    canvas.height = Math.max(54, Math.floor(innerHeight * scale));
  }

  function setPointer(event) {
    const point = event.touches?.[0] || event;
    if (point.clientX == null) return;

    const now = performance.now();
    const elapsed = Math.max(12, now - previousTime);
    const distance = Math.hypot(point.clientX - previousX, point.clientY - previousY);
    const speed = distance / elapsed;

    pointerX = point.clientX;
    pointerY = point.clientY;
    previousX = pointerX;
    previousY = pointerY;
    previousTime = now;
    targetIntensity = Math.min(1, 0.2 + speed * 0.48);

    if (speed > 1.15 && !reducedMotion.matches) triggerFlash();
  }

  function triggerFlash() {
    if (performance.now() - flashTimer < 170) return;
    flashTimer = performance.now();
    stage.classList.remove("flash");
    void stage.offsetWidth;
    stage.classList.add("flash");
  }

  function drawNoise(time) {
    if (!context || time - lastNoise < (reducedMotion.matches ? 700 : 48 - intensity * 24)) return;

    const image = context.createImageData(canvas.width, canvas.height);
    const pixels = new Uint32Array(image.data.buffer);
    const pointerCanvasX = (pointerX / innerWidth) * canvas.width;
    const pointerCanvasY = (pointerY / innerHeight) * canvas.height;
    const radius = Math.max(canvas.width, canvas.height) * 0.23;

    for (let i = 0; i < pixels.length; i += 1) {
      const x = i % canvas.width;
      const y = Math.floor(i / canvas.width);
      const local = Math.max(0, 1 - Math.hypot(x - pointerCanvasX, y - pointerCanvasY) / radius);
      const bright = Math.random() > 0.56 ? 255 : 75;
      const alpha = Math.floor(13 + Math.random() * (20 + local * intensity * 105));
      const cyanBias = local * intensity > Math.random() ? 35 : 0;
      pixels[i] = (alpha << 24) | (bright << 16) | (Math.min(255, bright + cyanBias) << 8) | Math.min(255, bright + cyanBias);
    }

    context.putImageData(image, 0, 0);
    lastNoise = time;
  }

  function animate(time) {
    if (!active) return;

    intensity += (targetIntensity - intensity) * 0.18;
    targetIntensity *= 0.92;
    if (targetIntensity < 0.012) targetIntensity = 0;

    root.style.setProperty("--pointer-x", `${pointerX.toFixed(1)}px`);
    root.style.setProperty("--pointer-y", `${pointerY.toFixed(1)}px`);
    root.style.setProperty("--intensity", reducedMotion.matches ? "0" : intensity.toFixed(3));

    if (!reducedMotion.matches && time - lastTear > 42) {
      const force = intensity * intensity;
      root.style.setProperty("--tear-a", `${((Math.random() - 0.5) * 42 * force).toFixed(1)}px`);
      root.style.setProperty("--tear-b", `${((Math.random() - 0.5) * 20 * force).toFixed(1)}px`);
      lastTear = time;
    }

    if (!reducedMotion.matches && time > nextIdleJolt && intensity < 0.08) {
      root.style.setProperty("--idle-jolt", `${Math.random() > 0.5 ? 1.5 : -1.5}px`);
      setTimeout(() => root.style.setProperty("--idle-jolt", "0px"), 70);
      nextIdleJolt = time + 1400 + Math.random() * 3200;
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
