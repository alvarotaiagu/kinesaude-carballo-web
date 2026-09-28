/* =====================================================================
   KineSaúde · scene-puntos.js
   Hero: malla de puntos salvia que respira. Una ola lenta recorre la
   retícula y los puntos se encienden y crecen cerca del cursor
   («sintonizar»). Con el scroll la malla se hunde y se apaga.
   Sin blur ni shadowBlur por fotograma (ver feedback_canvas_blur_perf).
   Sustituye a las ondas (scene-onda.js, guardado en kinesaude-carballo-bocetos)
   el 2026-09-28 a petición de la clienta vía Álvaro: boceto 2 del tablero.
   API (la misma que tenía la onda, main.js no cambia):
   window.kineOnda = { setScroll(p), pause(), resume() }
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
  const GAP = 34;           /* paso de la retícula en px CSS */
  const RADIO = 150;        /* alcance del cursor en px */

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(time) {
    const s = Math.max(0, Math.min(1, scroll));
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1 - s * 0.85;
    const mx = mouseX * w, my = mouseY * h;
    const sig2 = 2 * RADIO * RADIO;
    const yOff = s * h * 0.16;
    /* la retícula parte del centro para que quede simétrica a cualquier ancho */
    const x0 = ((w % GAP) / 2) + GAP / 2, y0 = ((h % GAP) / 2) + GAP / 2;
    ctx.fillStyle = "rgb(189,208,200)";
    for (let y = y0; y < h + GAP; y += GAP) {
      for (let x = x0; x < w; x += GAP) {
        const wave = 0.5 + 0.5 * Math.sin(x * 0.011 - time * 1.1 + y * 0.005) * Math.sin(y * 0.009 + time * 0.6);
        const dx = x - mx, dy = y + yOff - my;
        const near = Math.exp(-(dx * dx + dy * dy) / sig2);
        const r = 0.9 + wave * 1.2 + near * 2.6;
        const a = 0.14 + wave * 0.3 + near * 0.6;
        ctx.globalAlpha = (1 - s * 0.85) * a;
        ctx.beginPath();
        ctx.arc(x, y + yOff, r, 0, 6.2832);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawStatic() { resize(); draw(0); }

  function loop(now) {
    const time = (now - t0) / 1000;
    mouseX += (targetMouseX - mouseX) * 0.07;
    mouseY += (targetMouseY - mouseY) * 0.07;
    draw(time);
    raf = requestAnimationFrame(loop);
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return; /* canvas oculto (densidad sobria) */
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
  function onLeave() { targetMouseX = 0.5; targetMouseY = 0.5; }

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
    resizeTimer = setTimeout(() => { if (reduce) drawStatic(); else resize(); }, 150);
  });

  window.kineOnda = {
    setScroll(p) { scroll = p; },
    pause() { paused = true; stop(); },
    resume() { paused = false; resize(); start(); },
  };

  if (reduce) { drawStatic(); return; }

  resize();
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  document.documentElement.addEventListener("mouseleave", onLeave);
  /* [MANDO DE MAQUETA] en la densidad sobria el canvas está oculto: no se anima */
  if (!document.documentElement.classList.contains("densidad-sobria")) start();
  else paused = true;

  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
})();
