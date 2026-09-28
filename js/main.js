/* =====================================================================
   KineSaúde Carballo · main.js
   Motion: Lenis (único motor de scroll suave) + GSAP ScrollTrigger.
   Dos banderas distintas: gsapReady (hay librería) y motion (además no hay
   prefers-reduced-motion). El movimiento se apaga; el contenido no.
   ===================================================================== */
(function () {
  "use strict";
  const html = document.documentElement;
  html.classList.remove("no-js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const motion = gsapReady && !reduce;
  if (gsapReady) gsap.registerPlugin(ScrollTrigger);
  if (motion) html.classList.add("con-movimiento");
  const wide = () => window.matchMedia("(min-width: 56rem)").matches;
  /* [MANDO DE MAQUETA] la función sobria() se borra con el mando (o se deja devolviendo false) */
  const sobria = () => html.classList.contains("densidad-sobria");

  /* ---------- Lenis (smooth scroll) ---------- */
  let lenis = null;
  if (motion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.18, wheelMultiplier: 1, smoothWheel: true });
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

  /* Lo que debe esperar a que la cortina se abra (intro del hero) */
  function alAbrirse(fn) {
    const cort = document.getElementById("cortina");
    if (cort && motion && !cort.classList.contains("fuera")) document.addEventListener("cortina-abriendose", fn, { once: true });
    else fn();
  }

  /* ---------- Cortina «sintonizar» ----------
     Ruido que se afina hasta ser una onda limpia, nombre, la onda se aplana
     y la pantalla se abre en dos por esa línea. Retirada garantizada. */
  (function cortina() {
    const cort = document.getElementById("cortina");
    if (!cort) return;
    let hecho = false, abierta = false, tick = null;
    const abriendose = () => {
      if (abierta) return;
      abierta = true;
      document.dispatchEvent(new CustomEvent("cortina-abriendose"));
    };
    const retirar = () => {
      if (hecho) return;
      hecho = true;
      abriendose();
      cort.classList.add("fuera");
      html.classList.remove("cortina-activa");
      if (tick && gsapReady) gsap.ticker.remove(tick);
      if (lenis) lenis.start();
      if (gsapReady) ScrollTrigger.refresh();
      document.dispatchEvent(new CustomEvent("cortina-retirada"));
    };
    if (!motion) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, reduce ? 200 : 120);
      return;
    }
    html.classList.add("cortina-activa");
    if (lenis) lenis.stop();

    const arriba = document.getElementById("cortina-arriba");
    const abajo = document.getElementById("cortina-abajo");
    const labioA = document.getElementById("cortina-labio-arriba");
    const labioB = document.getElementById("cortina-labio-abajo");
    const centro = document.getElementById("cortina-centro");
    const poly = document.getElementById("cortina-onda");
    const marca = cort.querySelector(".cortina__marca");
    const nombre = Array.prototype.slice.call(cort.querySelectorAll(".cortina__nombre b"));
    const pie = document.getElementById("cortina-pie");
    const st = { ruido: 1, amp: 0 };
    const N = 160;
    tick = function dibujar() {
      const t = performance.now() / 1000;
      const pts = new Array(N + 1);
      for (let i = 0; i <= N; i++) {
        const x = (i * 1000) / N;
        let y = 100 + Math.sin(x / 85 + t * 2.2) * 34 * st.amp + Math.sin(x / 31 - t * 3.1) * 8 * st.amp;
        y += (Math.random() - 0.5) * 90 * st.ruido;
        pts[i] = x.toFixed(1) + "," + y.toFixed(1);
      }
      poly.setAttribute("points", pts.join(" "));
    };
    gsap.ticker.add(tick);

    const tl = gsap.timeline({ onComplete: retirar });
    tl.to(st, { amp: 1, duration: 0.7, ease: "power2.out" }, 0)
      .to(st, { ruido: 0, duration: 1.15, ease: "power3.out" }, 0.1)
      .to(nombre, { y: 0, yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.12 }, 0.5)
      .to(pie, { opacity: 1, duration: 0.5 }, 1.05)
      .to(marca, { opacity: 0, y: -12, duration: 0.35, ease: "power2.in" }, 1.8)
      .to(st, { amp: 0, duration: 0.5, ease: "power2.inOut" }, 1.85)
      .add(abriendose, 2.25)
      .to(centro, { opacity: 0, duration: 0.3 }, 2.25)
      .to(arriba, { yPercent: -100, duration: 1.05, ease: "expo.inOut" }, 2.25)
      .to(abajo, { yPercent: 100, duration: 1.05, ease: "expo.inOut" }, 2.25)
      /* los labios se abomban mientras se separan y se aplanan al final */
      .to(labioA, { attr: { d: "M0 0H100V0Q50 10 0 0Z" }, duration: 0.5, ease: "power2.in" }, 2.25)
      .to(labioA, { attr: { d: "M0 0H100V0Q50 0 0 0Z" }, duration: 0.55, ease: "power2.out" }, 2.75)
      .to(labioB, { attr: { d: "M0 10H100V10Q50 0 0 10Z" }, duration: 0.5, ease: "power2.in" }, 2.25)
      .to(labioB, { attr: { d: "M0 10H100V10Q50 10 0 10Z" }, duration: 0.55, ease: "power2.out" }, 2.75);

    /* red de seguridad: pase lo que pase, a los 7 s la cortina se va */
    setTimeout(retirar, 7000);
  })();

  /* ---------- Cursor propio: punto + aro ---------- */
  (function cursor() {
    if (!motion || !finePointer) return;
    const c = document.createElement("div");
    const p = document.createElement("div");
    const t = document.createElement("span");
    c.className = "cursor";
    p.className = "cursor-punto";
    t.className = "cursor__texto";
    t.textContent = "sintoniza";
    c.appendChild(t);
    [c, p].forEach((n) => { n.setAttribute("aria-hidden", "true"); document.body.appendChild(n); });
    const aX = gsap.quickTo(c, "x", { duration: 0.28, ease: "power3.out" });
    const aY = gsap.quickTo(c, "y", { duration: 0.28, ease: "power3.out" });
    const mostrar = (si) => { c.classList.toggle("cursor--vivo", si); p.classList.toggle("cursor--vivo", si); };
    /* el estado (enlace / hero) se decide por el elemento bajo el puntero en cada
       movimiento, solo cuando cambia: no depende de que llegue pointerover */
    let ultimo = null;
    function estado(target) {
      if (target === ultimo || !target || !target.closest) return;
      ultimo = target;
      const sobre = !!target.closest("a, button, .map-consent, [data-dialog]");
      const hero = !sobre && !sobria() && !!target.closest(".hero");
      c.classList.toggle("cursor--activo", sobre);
      c.classList.toggle("cursor--sintoniza", hero);
      p.classList.toggle("cursor-punto--activo", sobre || hero);
    }
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (!c.classList.contains("cursor--vivo")) {
        gsap.set(c, { x: e.clientX, y: e.clientY });
        html.classList.add("con-cursor"); /* el del sistema se oculta cuando el propio ya se ve */
        mostrar(true);
      }
      gsap.set(p, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
      estado(e.target);
    }, { passive: true });
    html.addEventListener("mouseleave", () => mostrar(false));
    html.addEventListener("mouseenter", () => { if (html.classList.contains("con-cursor")) mostrar(true); });
    document.addEventListener("pointerover", (e) => estado(e.target));
  })();

  /* ---------- Cabecera: fondo al bajar, se esconde bajando y vuelve subiendo ---------- */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const toggle = document.querySelector(".nav-toggle");
  let lastY = window.scrollY;
  function updateHeader() {
    if (!header) return;
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    const menuOpen = toggle && toggle.getAttribute("aria-expanded") === "true";
    if (!menuOpen && y > 240 && y > lastY + 4) header.classList.add("is-hidden");
    else if (y < lastY - 4 || y <= 240 || menuOpen) header.classList.remove("is-hidden");
    lastY = y;
    if (progress) {
      const max = html.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
    }
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Menú móvil ---------- */
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
      header && header.classList.remove("is-hidden");
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
    if (!done) { banner.hidden = false; html.classList.add("cookies-visibles"); }
    ack.addEventListener("click", () => {
      banner.hidden = true;
      html.classList.remove("cookies-visibles");
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

  /* ---------- Revelado de fotos: recorte desde abajo + la foto se acerca ---------- */
  if (motion) {
    document.querySelectorAll(".revela").forEach((fig) => {
      const img = fig.querySelector("img");
      ScrollTrigger.create({
        trigger: fig, start: "top 84%", once: true,
        onEnter: () => {
          gsap.to(fig, { clipPath: "inset(0% 0 0 0)", duration: 1.3, ease: "expo.out" });
          /* las fotos de la pila ya llevan su propio paralaje de escala */
          if (img && !fig.classList.contains("panel-media")) gsap.to(img, { scale: 1, duration: 1.7, ease: "expo.out" });
        },
      });
    });
  }

  /* ---------- Divisores de señal (stroke reveal) ---------- */
  document.querySelectorAll(".signal-divider path").forEach((path) => {
    if (!motion) return;
    const len = path.getTotalLength();
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
    const sr = document.createElement("span");
    sr.className = "sr-only"; sr.textContent = text;
    const vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    /* conserva <strong>: cada palabra dentro de él sigue dentro de un <strong> */
    Array.prototype.slice.call(el.childNodes).forEach((node) => {
      const strong = node.nodeType === 1 && /^(STRONG|EM|B)$/.test(node.tagName);
      const holder = strong ? document.createElement(node.tagName.toLowerCase()) : vis;
      const words = node.textContent.split(/(\s+)/);
      words.forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { holder.appendChild(document.createTextNode(" ")); return; }
        const wd = document.createElement("span"); wd.className = "wd";
        Array.from(w).forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; wd.appendChild(s); });
        holder.appendChild(wd);
      });
      if (strong) vis.appendChild(holder);
    });
    el.replaceChildren(sr, vis);
    return Array.prototype.slice.call(vis.querySelectorAll(".ch"));
  }
  document.querySelectorAll("[data-split]").forEach((el) => {
    if (!motion) return;
    const chars = splitChars(el);
    el.classList.add("chars");
    gsap.set(chars, { yPercent: 110, opacity: 0 });
    const play = () => gsap.to(chars, {
      yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out",
      stagger: { each: 0.014, from: "start" },
    });
    if (el.closest(".hero")) alAbrirse(() => setTimeout(play, 250));
    else ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: play });
  });

  /* ---------- Contadores animados ---------- */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = el.dataset.count.includes(".") ? el.dataset.count.split(".")[1].length : 0;
    if (!motion) { el.textContent = target.toFixed(decimals).replace(".", ","); return; }
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
  if (finePointer && motion) {
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

  /* ---------- Hero: intro tras la cortina, salida con scrub, etiquetas que flotan ---------- */
  if (motion) {
    const hero = document.querySelector(".hero");
    const content = document.querySelector(".hero-content");
    const canvas = document.querySelector(".hero-canvas");
    const tags = Array.prototype.slice.call(document.querySelectorAll(".hero-tags .tag"));
    const intro = Array.prototype.slice.call(document.querySelectorAll(".hero-actions .btn, .hero-readout span, .hero-tags .tag, .hero .kicker, .hero-lead"));
    gsap.set(intro, { y: 18, opacity: 0 });
    alAbrirse(() => {
      gsap.to(intro, {
        y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: "power3.out", delay: 0.45,
        onComplete: () => {
          /* flotan solo cuando la intro ha soltado la propiedad y */
          tags.forEach((tag, i) => gsap.to(tag, { y: 12 + i * 3, duration: 3.2 + i * 0.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.4 }));
        },
      });
    });
    if (hero && content) {
      const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
      gsap.to(content, {
        yPercent: 22, opacity: 0, ease: "none",
        scrollTrigger: Object.assign({ onUpdate: (self) => { if (window.kineOnda) window.kineOnda.setScroll(self.progress); } }, st),
      });
      if (canvas) gsap.to(canvas, { scale: 1.1, ease: "none", scrollTrigger: st });
    }
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

  /* ---------- Tratamientos: sticky stack ----------
     El texto de cada panel entra escalonado al activarse. Escala y velo solo
     desde 56rem: en móvil los paneles no caben y se desapilan por CSS. */
  (function initStack() {
    const panels = Array.prototype.slice.call(document.querySelectorAll(".stack .panel"));
    const dots = Array.prototype.slice.call(document.querySelectorAll(".stack-rail li"));
    if (!panels.length) return;
    if (!motion) { panels.forEach((p) => p.classList.add("is-active")); return; }
    panels.forEach((p, i) => {
      const items = p.querySelectorAll(".panel-text > *");
      gsap.set(items, { y: 28, opacity: 0 });
      ScrollTrigger.create({
        trigger: p, start: "top 60%",
        onEnter: () => {
          if (!p.classList.contains("is-active")) {
            p.classList.add("is-active");
            gsap.to(items, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.08 });
          }
          dots.forEach((d, j) => d.classList.toggle("is-on", j === i));
        },
        onEnterBack: () => dots.forEach((d, j) => d.classList.toggle("is-on", j === i)),
      });
      const img = p.querySelector(".panel-media img");
      if (img) gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true } });
    });
    const mm = gsap.matchMedia();
    mm.add("(min-width: 56rem)", () => {
      panels.forEach((p, i) => {
        const next = panels[i + 1];
        if (!next) return;
        gsap.to(p, { scale: 0.94, ease: "none", scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true } });
        ScrollTrigger.create({
          trigger: next, start: "top bottom", end: "top top", scrub: true,
          onUpdate: (self) => p.style.setProperty("--veil", (self.progress * 0.55).toFixed(3)),
        });
      });
    });
  })();

  /* ---------- Tecnología: galería horizontal (pin por CSS sticky + scrub GSAP) ----------
     Título dentro del bloque fijado, tarjetas que se acercan al centro, firma
     de onda que se dibuja, rejilla con paralaje propio y lectura «0N / 09». */
  (function initTecnologia() {
    const pin = document.querySelector(".tec-pin");
    const sticky = document.querySelector(".tec-sticky");
    const track = document.querySelector(".tec-track");
    const bar = document.querySelector(".tec-progress-bar");
    const readout = document.querySelector(".tec-readout");
    const grid = document.querySelector(".tec-grid");
    if (!pin || !sticky || !track) return;

    const waves = Array.prototype.slice.call(document.querySelectorAll(".tec-wave path"));
    const cards = Array.prototype.slice.call(track.querySelectorAll(".tec-card"));
    waves.forEach((path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
    });
    const dibujadas = () => waves.forEach((path) => { path.style.strokeDashoffset = 0; });
    if (!motion) { dibujadas(); return; }
    /* [MANDO DE MAQUETA] en la sobria la cuadrícula no se desplaza: las firmas van dibujadas */
    document.addEventListener("densidad-cambiada", (e) => {
      if (e.detail === "sobria") { dibujadas(); cards.forEach((c) => c.classList.remove("is-center")); }
    });

    const mm = gsap.matchMedia();
    mm.add("(max-width: 55.99rem)", () => {
      /* móvil: carril con scroll nativo, las ondas ya dibujadas */
      dibujadas();
      cards.forEach((c) => c.classList.remove("is-center"));
    });
    mm.add("(min-width: 56rem)", () => {
      waves.forEach((path) => { path.style.strokeDashoffset = path.style.strokeDasharray; });
      const amount = () => Math.max(0, track.scrollWidth - sticky.clientWidth);
      let centro = -1;
      const tween = gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: {
          trigger: pin, start: "top top", end: "bottom bottom", scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (bar) bar.style.width = `${(p * 100).toFixed(1)}%`;
            if (grid) gsap.set(grid, { x: -p * 260 });
            /* tarjeta más cercana al centro, por geometría estática (sin medir el DOM) */
            const mid = sticky.clientWidth / 2 + amount() * p;
            let best = 0, bestD = Infinity;
            cards.forEach((c, i) => {
              const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
              if (d < bestD) { bestD = d; best = i; }
            });
            if (best !== centro) {
              centro = best;
              cards.forEach((c, i) => c.classList.toggle("is-center", i === best));
              if (readout) readout.textContent = `${String(best + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
            }
          },
        },
      });
      cards.forEach((card) => {
        gsap.timeline({ scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 100%", end: "right 0%", scrub: true } })
          .fromTo(card, { scale: 0.88, opacity: 0.42 }, { scale: 1, opacity: 1, ease: "none", duration: 1 })
          .to(card, { scale: 0.88, opacity: 0.42, ease: "none", duration: 1 });
      });
      waves.forEach((path) => {
        gsap.to(path, {
          strokeDashoffset: 0, ease: "none",
          scrollTrigger: {
            trigger: path.closest(".tec-card"), containerAnimation: tween,
            start: "left 90%", end: "left 45%", scrub: true,
          },
        });
      });
    });
  })();

  /* ---------- Reseñas: entran escalonadas e inclinan levemente con el ratón ---------- */
  (function initResenas() {
    const cards = Array.prototype.slice.call(document.querySelectorAll(".resena-card"));
    if (!cards.length || !motion) return;
    gsap.set(cards, { y: 34, opacity: 0 });
    ScrollTrigger.batch(cards, {
      start: "top 88%", once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.12 }),
    });
    if (!finePointer) return;
    cards.forEach((card) => {
      const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
      const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 9); rx(-py * 9);
      });
      card.addEventListener("pointerleave", () => { ry(0); rx(0); });
    });
  })();

  /* ---------- Refresh tras fuentes/imágenes ---------- */
  if (gsapReady) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* =======================================================================
     [MANDO DE MAQUETA] — SOLO INTERNO. Borrar esta función entera, la
     función sobria() de arriba, el <div class="mando"> del HTML y la parte de
     densidad del script del <head>. Ver README.
     ======================================================================= */
  (function mandoMaqueta() {
    const mando = document.getElementById("mando");
    if (!mando) return;
    if (!/[?&]revision\b/.test(location.search)) return; /* el enlace del cliente sale limpio */
    mando.hidden = false;
    const botones = Array.prototype.slice.call(mando.querySelectorAll("[data-densidad]"));
    function aplicar(d) {
      html.classList.remove("densidad-onda", "densidad-sobria");
      html.classList.add("densidad-" + d);
      botones.forEach((b) => b.setAttribute("aria-pressed", b.dataset.densidad === d ? "true" : "false"));
      try { localStorage.setItem("kinesaude-densidad", d); } catch (e) {}
      if (window.kineOnda) { if (d === "sobria") window.kineOnda.pause(); else window.kineOnda.resume(); }
      if (gsapReady) requestAnimationFrame(() => ScrollTrigger.refresh());
      document.dispatchEvent(new CustomEvent("densidad-cambiada", { detail: d }));
    }
    const actual = sobria() ? "sobria" : "onda";
    botones.forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.densidad === actual ? "true" : "false");
      b.addEventListener("click", () => aplicar(b.dataset.densidad));
    });
  })();
  /* ── fin del bloque [MANDO DE MAQUETA] ── */

  /* ---------- Diagnóstico de rendimiento (?perf) ---------- */
  if (/[?&]perf\b/.test(location.search) && "PerformanceObserver" in window) {
    try {
      const po = new PerformanceObserver((list) => list.getEntries().forEach((e) => console.warn(`[longtask] ${Math.round(e.duration)}ms @${Math.round(e.startTime)}`)));
      po.observe({ entryTypes: ["longtask"] });
      console.info("[perf] observando longtasks");
    } catch (e) {}
  }
})();
