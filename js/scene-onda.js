/* =====================================================================
   KineSaúde · scene-onda.js
   Hero: varias sinusoides superpuestas en teal, trazos finos, sin blur ni
   shadowBlur por frame (ver feedback_canvas_blur_perf). Respira despacio y
   se modula con la posición del cursor — "sintonizar" la señal.
   ===================================================================== */
(function () {
  "use strict";
  const canvas = document.querySelector(".hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0, h = 0, dpr = 1;
  let mouseX = 0.5, targetMouseX = 0.5;
  let raf = null, t0 = performance.now();

  const LAYERS = [
    { amp: 34, wl: 620, speed: 0.28, phase: 0.0, yBase: 0.42, width: 1.6, alpha: 0.55 },
    { amp: 22, wl: 420, speed: -0.38, phase: 1.4, yBase: 0.5, width: 1.3, alpha: 0.42 },
    { amp: 46, wl: 780, speed: 0.19, phase: 3.1, yBase: 0.58, width: 1.4, alpha: 0.38 },
    { amp: 14, wl: 300, speed: 0.55, phase: 2.1, yBase: 0.47, width: 1, alpha: 0.3 },
    { amp: 60, wl: 980, speed: -0.14, phase: 0.6, yBase: 0.66, width: 1.6, alpha: 0.22 },
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function strokeWave(layer, time, boost) {
    const step = 6;
    ctx.beginPath();
    for (let x = 0; x <= w + step; x += step) {
      const nearness = 1 - Math.min(1, Math.abs(x / w - mouseX) / 0.22);
      const local = Math.max(0, nearness) * boost;
      const amp = layer.amp * (1 + local * 0.9);
      const y =
        h * layer.yBase +
        Math.sin(x / layer.wl + time * layer.speed + layer.phase) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    const mx = Math.max(0, Math.min(1, mouseX));
    grad.addColorStop(Math.max(0, mx - 0.22), `rgba(42,124,146,${layer.alpha})`);
    grad.addColorStop(mx, `rgba(217,160,102,${Math.min(1, layer.alpha + boost * 0.5)})`);
    grad.addColorStop(Math.min(1, mx + 0.22), `rgba(100,156,176,${layer.alpha})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = layer.width * dpr === layer.width ? layer.width : layer.width; // dpr handled by transform
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function drawStatic() {
    resize();
    ctx.clearRect(0, 0, w, h);
    LAYERS.forEach((layer) => strokeWave(layer, 0, 0));
  }

  function loop(now) {
    const time = (now - t0) / 1000;
    mouseX += (targetMouseX - mouseX) * 0.06;
    const breathe = 0.85 + Math.sin(time * 0.18) * 0.15;
    ctx.clearRect(0, 0, w, h);
    LAYERS.forEach((layer) => {
      const boosted = { ...layer, amp: layer.amp * breathe };
      strokeWave(boosted, time, 0.85);
    });
    raf = requestAnimationFrame(loop);
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    targetMouseX = (e.clientX - rect.left) / rect.width;
  }
  function onTouch(e) {
    if (!e.touches || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    targetMouseX = (e.touches[0].clientX - rect.left) / rect.width;
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (reduce) drawStatic();
      else resize();
    }, 150);
  });

  if (reduce) {
    drawStatic();
    return;
  }

  resize();
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  raf = requestAnimationFrame(loop);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
    else if (!document.hidden && !raf) { t0 = performance.now(); raf = requestAnimationFrame(loop); }
  });
})();
