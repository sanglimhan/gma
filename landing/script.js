(() => {
  "use strict";

  const root = document.documentElement;
  const stage = document.querySelector(".signal");
  const phrase = document.querySelector("#phrase");
  const canvas = document.querySelector("#noise");
  const context = canvas.getContext("2d", { alpha: true });
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const phrases = ["CAU GMA", "GENERATIVE SYSTEMS", "SYNTHETIC SIGNALS", "MEDIA AS PROCESS"];

  let active = !document.hidden;
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;
  let proximity = 0;
  let phraseIndex = 0;
  let frame = 0;
  let lastNoise = 0;
  let burstTimer;

  function resizeNoise() {
    const scale = reducedMotion.matches ? 0.12 : 0.2;
    canvas.width = Math.max(80, Math.floor(innerWidth * scale));
    canvas.height = Math.max(60, Math.floor(innerHeight * scale));
  }

  function drawNoise(time) {
    if (!active || !context) return;
    if (time - lastNoise > (reducedMotion.matches ? 650 : 85)) {
      const image = context.createImageData(canvas.width, canvas.height);
      const pixels = new Uint32Array(image.data.buffer);
      for (let i = 0; i < pixels.length; i += 1) {
        const value = Math.random() > 0.5 ? 255 : 0;
        const alpha = 50 + Math.floor(Math.random() * 55);
        pixels[i] = (alpha << 24) | (value << 16) | (value << 8) | value;
      }
      context.putImageData(image, 0, 0);
      lastNoise = time;
    }
    frame = requestAnimationFrame(drawNoise);
  }

  function updatePointer(x, y) {
    pointerX = x;
    pointerY = y;
    const xRatio = pointerX / innerWidth - 0.5;
    const yRatio = pointerY / innerHeight - 0.5;
    const distance = Math.hypot(xRatio, yRatio) / 0.707;
    proximity = Math.max(0, 1 - distance);

    if (!reducedMotion.matches) {
      root.style.setProperty("--shift-x", `${(xRatio * 5).toFixed(2)}px`);
      root.style.setProperty("--shift-y", `${(yRatio * 3).toFixed(2)}px`);
      root.style.setProperty("--proximity", proximity.toFixed(3));
    }
  }

  function glitchBurst() {
    if (reducedMotion.matches) return;
    clearTimeout(burstTimer);
    stage.classList.remove("burst");
    void stage.offsetWidth;
    stage.classList.add("burst");
    burstTimer = setTimeout(() => stage.classList.remove("burst"), 380);
  }

  function rotatePhrase() {
    if (!active) return;
    phrase.classList.add("out");
    setTimeout(() => {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      phrase.textContent = phrases[phraseIndex];
      phrase.classList.remove("out");
    }, reducedMotion.matches ? 0 : 140);
  }

  addEventListener("pointermove", (event) => updatePointer(event.clientX, event.clientY), { passive: true });
  addEventListener("pointerdown", (event) => {
    updatePointer(event.clientX, event.clientY);
    glitchBurst();
  }, { passive: true });
  addEventListener("resize", resizeNoise, { passive: true });
  document.addEventListener("visibilitychange", () => {
    active = !document.hidden;
    cancelAnimationFrame(frame);
    if (active) frame = requestAnimationFrame(drawNoise);
  });
  reducedMotion.addEventListener?.("change", resizeNoise);

  resizeNoise();
  if (context) {
    frame = requestAnimationFrame(drawNoise);
  } else {
    canvas.hidden = true;
  }
  setInterval(rotatePhrase, 4200);
})();
