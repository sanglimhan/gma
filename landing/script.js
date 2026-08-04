(() => {
  "use strict";

  const root = document.documentElement;
  const stage = document.querySelector(".signal");
  const canvas = document.querySelector("#noise");
  const context = canvas.getContext("2d", { alpha: true });
  const lines = [...document.querySelectorAll(".signal-line")];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let active = !document.hidden;
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;
  let targetEnergy = 0.08;
  let energy = 0.08;
  let lastX = pointerX;
  let lastY = pointerY;
  let lastMove = performance.now();
  let frame = 0;
  let lastNoise = 0;
  let flashTimer;

  function resizeNoise() {
    const scale = reducedMotion.matches ? 0.12 : 0.2;
    canvas.width = Math.max(80, Math.floor(innerWidth * scale));
    canvas.height = Math.max(60, Math.floor(innerHeight * scale));
  }

  function drawNoise(time) {
    if (!active) return;
    if (time - lastNoise > (reducedMotion.matches ? 650 : 85)) {
      const image = context.createImageData(canvas.width, canvas.height);
      const pixels = new Uint32Array(image.data.buffer);
      for (let i = 0; i < pixels.length; i += 1) {
        const value = Math.random() > 0.5 ? 255 : 0;
        const alpha = 50 + Math.floor(Math.random() * 55);
        pixels[i] = (alpha << 24) | (value << 16) | (value << 8) | value;
      }
      context.putImageData(image, 0, 0);
      const tearY = Math.floor((pointerY / innerHeight) * canvas.height);
      const tearHeight = Math.max(1, Math.floor(1 + energy * 5));
      const sourceY = Math.max(0, Math.min(canvas.height - 1, tearY - tearHeight));
      const sourceHeight = Math.min(tearHeight * 2, canvas.height - sourceY);
      const tear = context.getImageData(0, sourceY, canvas.width, sourceHeight);
      context.putImageData(tear, Math.round((pointerX / innerWidth - .5) * energy * 22), sourceY);
      lastNoise = time;
    }
    energy += (targetEnergy - energy) * .14;
    targetEnergy = Math.max(.08, targetEnergy * .94);
    root.style.setProperty("--energy", energy.toFixed(3));
    root.style.setProperty("--rgb-shift", `${(1.5 + energy * 10).toFixed(2)}px`);
    root.style.setProperty("--noise-opacity", (.1 + energy * .16).toFixed(3));
    root.style.setProperty("--interference-opacity", (.12 + energy * .55).toFixed(3));
    root.style.setProperty("--scan-bend", `${(energy * 1.1).toFixed(2)}deg`);
    frame = requestAnimationFrame(drawNoise);
  }

  function updatePointer(x, y, time = performance.now()) {
    const elapsed = Math.max(8, time - lastMove);
    const speed = Math.hypot(x - lastX, y - lastY) / elapsed;
    pointerX = x;
    pointerY = y;
    lastX = x;
    lastY = y;
    lastMove = time;
    targetEnergy = Math.min(1, .18 + speed * .24);

    if (!reducedMotion.matches) {
      root.style.setProperty("--cursor-x", `${(x / innerWidth * 100).toFixed(2)}%`);
      root.style.setProperty("--cursor-y", `${(y / innerHeight * 100).toFixed(2)}%`);
      root.style.setProperty("--scan-shift", `${((y / innerHeight - .5) * targetEnergy * 7).toFixed(2)}px`);
      lines.forEach((line, index) => {
        const rect = line.getBoundingClientRect();
        const distance = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
        const influence = Math.max(0, 1 - distance / Math.max(260, innerWidth * .3)) * targetEnergy;
        const direction = index % 2 ? 1 : -1;
        line.style.setProperty("--line-x", `${(direction * influence * 12).toFixed(2)}px`);
        line.style.setProperty("--line-y", `${((y - rect.top - rect.height / 2) * influence * .025).toFixed(2)}px`);
        line.style.setProperty("--line-scale", (1 + direction * influence * .035).toFixed(3));
        line.style.setProperty("--line-skew", `${(direction * influence * 2.5).toFixed(2)}deg`);
      });
      if (speed > 1.1 && Math.random() < .2) neonFlash();
    }
  }

  function neonFlash() {
    clearTimeout(flashTimer);
    stage.classList.add("flash");
    flashTimer = setTimeout(() => stage.classList.remove("flash"), 70);
  }

  addEventListener("pointermove", (event) => updatePointer(event.clientX, event.clientY, event.timeStamp), { passive: true });
  addEventListener("resize", resizeNoise, { passive: true });
  document.addEventListener("visibilitychange", () => {
    active = !document.hidden;
    cancelAnimationFrame(frame);
    if (active) frame = requestAnimationFrame(drawNoise);
  });
  reducedMotion.addEventListener?.("change", resizeNoise);

  resizeNoise();
  frame = requestAnimationFrame(drawNoise);
})();
