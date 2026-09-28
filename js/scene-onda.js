/* =====================================================================
   KineSaúde · scene-onda.js
   Hero: siete sinusoides superpuestas en salvia. Sin blur ni shadowBlur por
   fotograma (ver feedback_canvas_blur_perf): el «brillo» es el mismo trazo
   pintado dos veces, ancho y tenue debajo, fino y nítido encima.
   Respira despacio, se modula con el cursor (x: dónde sintoniza; y: hacia
   dónde se dobla) y reacciona al scroll (se hunde y se apaga al salir).
   API: window.kineOnda = { setScroll(p), pause(), resume() }
   ===================================================================== */
(function () {
  "use strict";
  const canvas = document.querySelector(".hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0, h = 0, dpr = 1;
  let mouseX = 0.5, targetMouseX = 0.5;
  let mouseY = 0.5, targetMouseY = 0.5;
  let scroll = 0;
  let raf = null, t0 = performance.now(), paused = false;

  const LAYERS = [
    { amp: 44, wl: 640, speed: 0.26, phase: 0.0, yBase: 0.44, width: 2.2, alpha: 0.72 },
    { amp: 28, wl: 430, speed: -0.36, phase: 1.4, yBase: 0.52, width: 1.6, alpha: 0.52 },
    { amp: 60, wl: 820, speed: 0.18, phase: 3.1, yBase: 0.6, width: 2.6, alpha: 0.58 },
    { amp: 18, wl: 300, speed: 0.55, phase: 2.1, yBase: 0.48, width: 1.2, alpha: 0.4 },
    { amp: 78, wl: 1040, speed: -0.13, phase: 0.6, yBase: 0.68, width: 2.4, alpha: 0.34 },
    { amp: 36, wl: 560, speed: 0.31, phase: 4.2, yBase: 0.38, width: 1.4, alpha: 0.32 },
    { amp: 100, wl: 1400, speed: 0.09, phase: 5.0, yBase: 0.74, width: 3.0, alpha: 0.2 },
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

  function strokeWave(layer, time, boost, yOff) {
    const step = 6;
    const bendY = (mouseY - 0.5) * h * 0.16;
    ctx.beginPath();
    for (let x = 0; x <= w + step; x += step) {
      const nearness = Math.max(0, 1 - Math.min(1, Math.abs(x / w - mouseX) / 0.24));
      const local = nearness * boost;
      const amp = layer.amp * (1 + local * 0.9);
      const y =
        h * layer.yBase + yOff +
        Math.sin(x / layer.wl + time * layer.speed + layer.phase) * amp +
        bendY * nearness * nearness;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const mx = Math.max(0, Math.min(1, mouseX));
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(Math.max(0, mx - 0.24), `rgba(108,140,126,${layer.alpha})`);
    grad.addColorStop(mx, `rgba(189,208,200,${Math.min(1, layer.alpha + boost * 0.35)})`);
    grad.addColorStop(Math.min(1, mx + 0.24), `rgba(143,168,155,${layer.alpha})`);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    /* brillo: el mismo trazo, ancho y tenue */
    ctx.lineWidth = layer.width * 4.5;
    ctx.strokeStyle = `rgba(143,168,155,${(layer.alpha * 0.14).toFixed(3)})`;
    ctx.stroke();
    /* trazo nítido */
    ctx.lineWidth = layer.width;
    ctx.strokeStyle = grad;
    ctx.stroke();
  }

  function drawStatic() {
    resize();
    ctx.clearRect(0, 0, w, h);
    LAYERS.forEach((layer) => strokeWave(layer, 0, 0, 0));
  }

  function loop(now) {
    const time = (now - t0) / 1000;
    mouseX += (targetMouseX - mouseX) * 0.06;
    mouseY += (targetMouseY - mouseY) * 0.06;
    const breathe = 0.85 + Math.sin(time * 0.18) * 0.15;
    const s = Math.max(0, Math.min(1, scroll));
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1 - s * 0.85;
    const yOff = s * h * 0.22;
    LAYERS.forEach((layer) => {
      const boosted = { ...layer, amp: layer.amp * breathe * (1 + s * 0.5) };
      strokeWave(boosted, time, 0.85, yOff);
    });
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(loop);
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return; /* canvas oculto (densidad sobria): nada que sintonizar */
    targetMouseX = (e.clientX - rect.left) / rect.width;
    targetMouseY = (e.clientY - rect.top) / rect.height;
  }
  function onTouch(e) {
    if (!e.touches || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    targetMouseX = (e.touches[0].clientX - rect.left) / rect.width;
    targetMouseY = (e.touches[0].clientY - rect.top) / rect.height;
  }

  function start() {
    if (raf || paused || reduce || document.hidden) return;
    if (!w || !h) resize();
    if (!Number.isFinite(mouseX) || !Number.isFinite(mouseY)) { mouseX = targetMouseX = 0.5; mouseY = targetMouseY = 0.5; }
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (reduce) drawStatic();
      else resize();
    }, 150);
  });

  window.kineOnda = {
    setScroll(p) { scroll = p; },
    pause() { paused = true; stop(); },
    resume() { paused = false; resize(); start(); },
  };

  if (reduce) {
    drawStatic();
    return;
  }

  resize();
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  if (!document.documentElement.classList.contains("densidad-sobria")) start();
  else paused = true;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
})();
