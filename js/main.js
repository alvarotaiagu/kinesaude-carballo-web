/* =====================================================================
   KineSaúde Carballo · main.js
   Motion: Lenis (único motor de scroll suave) + GSAP ScrollTrigger.
   Todo se salta con prefers-reduced-motion: estados finales al instante.
   ===================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (gsapReady) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis (smooth scroll) ---------- */
  let lenis = null;
  if (!reduce && gsapReady && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.kineLenis = lenis;
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        closeMenu();
        lenis.scrollTo(target, { offset: -56, duration: 1.4 });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- Cabecera ---------- */
  const header = document.querySelector(".site-header");
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Menú móvil ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, reduce ? 0 : 500);
    lenis && lenis.start();
  }
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (open) return closeMenu();
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
      toggle.setAttribute("aria-expanded", "true");
      lenis && lenis.stop();
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------- Aviso de cookies ---------- */
  (function initCookieBanner() {
    const banner = document.querySelector(".cookie-banner");
    const ack = document.querySelector(".cookie-ack");
    if (!banner || !ack) return;
    const KEY = "kinesaude-cookie-ack";
    let done = false;
    try { done = localStorage.getItem(KEY) === "1"; } catch (e) {}
    if (!done) banner.hidden = false;
    ack.addEventListener("click", () => {
      banner.hidden = true;
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
    });
  })();

  /* ---------- Diálogos legales ---------- */
  document.querySelectorAll("[data-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = document.getElementById(btn.dataset.dialog);
      if (!d) return;
      if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
      lenis && lenis.stop();
    });
  });
  document.querySelectorAll("dialog.legal").forEach((d) => {
    d.querySelectorAll(".legal-close").forEach((b) => b.addEventListener("click", () => d.close()));
    d.addEventListener("close", () => lenis && lenis.start());
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  });

  /* ---------- Mapa por consentimiento ---------- */
  document.querySelectorAll(".map-consent").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!btn.dataset.mapSrc) return;
      const iframe = document.createElement("iframe");
      iframe.title = btn.dataset.mapTitle || "Mapa";
      iframe.src = btn.dataset.mapSrc;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.setAttribute("allowfullscreen", "");
      btn.replaceWith(iframe);
    }, { once: true });
  });

  /* ---------- Horario en directo (Europe/Madrid) ----------
     L-V 9:00-14:00 y 16:00-21:00 · S-D cerrado (ficha del negocio, sept. 2026) */
  const HORARIO = {
    1: [[9, 14], [16, 21]], 2: [[9, 14], [16, 21]], 3: [[9, 14], [16, 21]],
    4: [[9, 14], [16, 21]], 5: [[9, 14], [16, 21]], 6: null, 0: null,
  };
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  function madridNow() {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t)?.value;
      const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get("weekday")];
      return { day: wd, h: parseInt(get("hour"), 10) % 24, m: parseInt(get("minute"), 10) };
    } catch (e) {
      const d = new Date(); return { day: d.getDay(), h: d.getHours(), m: d.getMinutes() };
    }
  }
  function fmt(h) { return `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`; }
  function nextOpening(day, dec) {
    for (let i = 0; i < 8; i++) {
      const d = (day + i) % 7, windows = HORARIO[d];
      if (!windows) continue;
      for (const win of windows) {
        if (i === 0 && dec >= win[0]) continue;
        return { day: d, open: win[0], today: i === 0, tomorrow: i === 1 };
      }
    }
    return null;
  }
  function estado() {
    const { day, h, m } = madridNow();
    const dec = h + m / 60;
    const windows = HORARIO[day];
    let open = false, msg = "", closeAt = null;
    if (windows) {
      for (const win of windows) {
        if (dec >= win[0] && dec < win[1]) { open = true; closeAt = win[1]; break; }
      }
    }
    if (open) {
      const left = closeAt - dec;
      msg = left <= 1 ? `Abierto ahora · cierra en ${Math.max(1, Math.round(left * 60))} min (${fmt(closeAt)})` : `Abierto ahora · hasta las ${fmt(closeAt)}`;
    } else {
      const nx = nextOpening(day, dec);
      if (nx) {
        const when = nx.today ? `hoy a las ${fmt(nx.open)}` : nx.tomorrow ? `mañana a las ${fmt(nx.open)}` : `el ${DIAS[nx.day]} a las ${fmt(nx.open)}`;
        msg = `Cerrado ahora · abrimos ${when}`;
      } else msg = "Cerrado ahora";
    }
    document.querySelectorAll("[data-estado]").forEach((el) => {
      el.classList.toggle("is-open", open);
      el.classList.toggle("is-closed", !open);
      const txt = el.querySelector("[data-estado-text]");
      if (txt) txt.textContent = msg;
    });
    document.querySelectorAll(".horario-tabla .fila").forEach((row) => row.classList.toggle("is-today", parseInt(row.dataset.day, 10) === day));
  }
  estado();
  setInterval(estado, 30000);

  /* ---------- Reveals (IntersectionObserver) ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }) : null;
  document.querySelectorAll(".tune, .tune-x").forEach((el) => {
    if (reduce || !io) { el.classList.add("is-in"); return; }
    io.observe(el);
  });

  /* ---------- Divisores de señal (stroke reveal) ---------- */
  document.querySelectorAll(".signal-divider path").forEach((path) => {
    const len = path.getTotalLength();
    if (reduce || !gsapReady) return;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    ScrollTrigger.create({
      trigger: path.closest(".signal-divider"), start: "top 85%", once: true,
      onEnter: () => gsap.to(path, { strokeDashoffset: 0, duration: 1.4, ease: "power2.out" }),
    });
  });

  /* ---------- Char reveal en titulares ---------- */
  function splitChars(el) {
    const text = el.textContent;
    const words = text.split(/(\s+)/);
    const sr = document.createElement("span");
    sr.className = "sr-only"; sr.textContent = text;
    const vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    words.forEach((w) => {
      if (/^\s+$/.test(w)) { vis.appendChild(document.createTextNode(" ")); return; }
      const wd = document.createElement("span"); wd.className = "wd";
      [...w].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; wd.appendChild(s); });
      vis.appendChild(wd);
    });
    el.replaceChildren(sr, vis);
    return [...vis.querySelectorAll(".ch")];
  }
  document.querySelectorAll("[data-split]").forEach((el) => {
    if (reduce || !gsapReady) return;
    const chars = splitChars(el);
    el.classList.add("chars");
    gsap.set(chars, { yPercent: 110, opacity: 0 });
    const play = () => gsap.to(chars, {
      yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out",
      stagger: { each: 0.014, from: "start" },
    });
    if (el.closest(".hero")) setTimeout(play, 300);
    else ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: play });
  });

  /* ---------- Contadores animados ---------- */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = el.dataset.count.includes(".") ? el.dataset.count.split(".")[1].length : 0;
    if (reduce || !gsapReady) { el.textContent = target.toFixed(decimals).replace(".", ","); return; }
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => gsap.to(obj, {
        v: target, duration: 1.6, ease: "power2.out",
        onUpdate: () => { el.textContent = obj.v.toFixed(decimals).replace(".", ","); },
      }),
    });
  });

  /* ---------- Botones magnéticos ---------- */
  if (finePointer && !reduce && gsapReady) {
    document.querySelectorAll(".btn, .nav-call").forEach((btn) => {
      const inner = btn.querySelector(".btn-inner") || btn;
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: x * 0.32, y: y * 0.32, duration: 0.5, ease: "power3.out" });
        if (inner !== btn) gsap.to(inner, { x: x * 0.12, y: y * 0.12, duration: 0.5, ease: "power3.out" });
      });
      btn.addEventListener("pointerleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
        if (inner !== btn) gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
      });
    });
  }

  /* ---------- Hero: intro ---------- */
  if (!reduce && gsapReady) {
    gsap.from(".hero-actions .btn, .hero-readout span, .hero-tags .tag", {
      y: 16, opacity: 0, duration: 0.8, stagger: 0.07, ease: "power3.out", delay: 0.5,
    });
  }

  /* ---------- Botón flotante de llamada ---------- */
  (function initFab() {
    const fab = document.querySelector(".call-fab");
    const hero = document.querySelector(".hero");
    const footer = document.querySelector(".site-footer");
    if (!fab || !hero) return;
    let pastHero = false, overFooter = false;
    const sync = () => fab.classList.toggle("is-visible", pastHero && !overFooter);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; sync(); }, { threshold: 0.15 }).observe(hero);
    if (footer) new IntersectionObserver(([e]) => { overFooter = e.isIntersecting; sync(); }, { threshold: 0.05 }).observe(footer);
  })();

  /* ---------- Tratamientos: sticky stack ---------- */
  (function initStack() {
    const panels = [...document.querySelectorAll(".stack .panel")];
    const dots = [...document.querySelectorAll(".stack-rail li")];
    if (!panels.length) return;
    if (reduce || !gsapReady) { panels.forEach((p) => p.classList.add("is-active")); return; }
    panels.forEach((p, i) => {
      const next = panels[i + 1];
      ScrollTrigger.create({
        trigger: p, start: "top 60%",
        onEnter: () => { p.classList.add("is-active"); dots.forEach((d, j) => d.classList.toggle("is-on", j === i)); },
        onEnterBack: () => dots.forEach((d, j) => d.classList.toggle("is-on", j === i)),
      });
      const img = p.querySelector(".panel-media img");
      if (img) gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true } });
      if (!next) return;
      gsap.to(p, { scale: 0.94, ease: "none", scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true } });
      ScrollTrigger.create({
        trigger: next, start: "top bottom", end: "top top", scrub: true,
        onUpdate: (self) => p.style.setProperty("--veil", (self.progress * 0.55).toFixed(3)),
      });
    });
  })();

  /* ---------- Tecnología: galería horizontal (pin por CSS sticky + scrub GSAP) ---------- */
  (function initTecnologia() {
    const pin = document.querySelector(".tec-pin");
    const sticky = document.querySelector(".tec-sticky");
    const track = document.querySelector(".tec-track");
    const bar = document.querySelector(".tec-progress-bar");
    if (!pin || !sticky || !track) return;

    const waves = [...document.querySelectorAll(".tec-wave path")];
    waves.forEach((path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
    });

    const narrow = window.matchMedia("(max-width: 56rem)").matches;
    if (reduce || !gsapReady || narrow) {
      waves.forEach((path) => { path.style.strokeDashoffset = 0; });
      return;
    }

    const amount = () => Math.max(0, track.scrollWidth - sticky.clientWidth);
    const tween = gsap.to(track, {
      x: () => -amount(),
      ease: "none",
      scrollTrigger: {
        trigger: pin, start: "top top", end: "bottom bottom", scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => { if (bar) bar.style.width = `${(self.progress * 100).toFixed(1)}%`; },
      },
    });

    waves.forEach((path) => {
      const len = path.getTotalLength();
      gsap.to(path, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: {
          trigger: path.closest(".tec-card"), containerAnimation: tween,
          start: "left 90%", end: "left 45%", scrub: true,
        },
      });
    });
  })();

  /* ---------- Refresh tras fuentes/imágenes ---------- */
  if (gsapReady) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ---------- Diagnóstico de rendimiento (?perf) ---------- */
  if (/[?&]perf\b/.test(location.search) && "PerformanceObserver" in window) {
    try {
      const po = new PerformanceObserver((list) => list.getEntries().forEach((e) => console.warn(`[longtask] ${Math.round(e.duration)}ms @${Math.round(e.startTime)}`)));
      po.observe({ entryTypes: ["longtask"] });
      console.info("[perf] observando longtasks");
    } catch (e) {}
  }
})();
