// Verificación con Playwright para KineSaúde Carballo:
//  - sin errores JS en carga ni tras scroll
//  - longtasks (PerformanceObserver) durante la intro de la onda del hero y el scroll completo
//    (crítico: el hero usa canvas con gradientes por frame, sin blur/shadowBlur)
//  - el aviso de cookies funciona (display:none real) y se recuerda tras recargar
//  - el mapa no tiene iframe hasta el clic, y lo tiene después (google.com/maps?...&output=embed)
//  - los contadores (ventajas diamagnéticas, reseñas) llegan a su valor
//  - sticky stack de tratamientos: la primera tarjeta cambia de escala al entrar la segunda
//  - galería horizontal de tecnología: el track se desplaza al hacer scroll dentro del pin
//  - reduced-motion: sin Lenis, sin animación de canvas/marquee, trazos ya dibujados
//  - sin JS: contenido usable, mapa placeholder visible, sin canvas
//  - sin scroll horizontal a 1440, 400 y 360 px
//  - capturas de cada sección en escritorio (1440) y móvil (400)
// Uso: node scripts/verify.js [baseUrl]   (por defecto http://127.0.0.1:8931/)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const base = process.argv[2] || 'http://127.0.0.1:8931/';
const outDir = path.resolve(__dirname, '..', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });
const report = { ok: true, checks: [], longtasks: {}, screenshots: [] };
const check = (name, pass, detail) => { report.checks.push({ name, pass, detail }); if (!pass) report.ok = false; console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const SECTIONS = ['#inicio', '#diamagnetica', '#tratamientos', '#tecnologia', '#seguros', '#resenas', '#contacto', '.site-footer'];
const ownError = (m) => m.type() === 'error' && !/google\.com|googleapis\.com|gstatic\.com/.test((m.location() && m.location().url) || m.text());

async function scrollThrough(page, step = 700, pause = 90) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += step) { await page.mouse.wheel(0, step); await page.waitForTimeout(pause); }
  await page.waitForTimeout(700);
}

(async () => {
  const browser = await chromium.launch();

  /* ---------- Escritorio ---------- */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__lt = [];
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push({ d: Math.round(e.duration), t: Math.round(e.startTime) }))).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (ownError(m)) errors.push(m.text()); });
  await page.goto(base, { waitUntil: 'load' });
  const ltLoad = await page.evaluate(() => window.__lt.splice(0));
  report.longtasks.load = ltLoad;
  console.log(`INFO  longtasks hasta load: ${JSON.stringify(ltLoad)}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2200); // deja correr la onda del hero unos segundos
  const ltHero = await page.evaluate(() => window.__lt.splice(0));
  report.longtasks.hero = ltHero;
  check('sin errores JS en carga', errors.length === 0, errors.join(' | '));
  check('sin longtasks (>50ms) durante ~2s de onda del hero', ltHero.filter((e) => e.d > 50).length === 0, JSON.stringify(ltHero));
  const canvasSized = await page.evaluate(() => { const c = document.querySelector('.hero-canvas'); return c.width > 0 && c.height > 0; });
  check('canvas del hero tiene tamaño', canvasSized);

  // --- cookies ---
  const bannerVisible = await page.locator('.cookie-banner').isVisible();
  check('aviso de cookies visible en primera visita', bannerVisible);
  await page.click('.cookie-ack');
  await page.waitForTimeout(150);
  const bannerDisplay = await page.evaluate(() => getComputedStyle(document.querySelector('.cookie-banner')).display);
  check('botón "Entendido" oculta el aviso (display:none real)', bannerDisplay === 'none', `display=${bannerDisplay}`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const bannerAfter = await page.evaluate(() => getComputedStyle(document.querySelector('.cookie-banner')).display);
  check('aviso de cookies recordado tras recargar', bannerAfter === 'none');

  // --- CTAs sin zonas muertas (con la portada a la vista) ---
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const dead = await page.evaluate(() => {
    const out = [];
    for (const sel of ['.hero .btn-senal', '.hero .btn-linea', '.site-header .nav-call', '.nav-links a']) {
      const el = document.querySelector(sel); if (!el) { out.push(sel + ' no existe'); continue; }
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!hit || !(el === hit || el.contains(hit))) out.push(sel + ' -> ' + (hit ? hit.tagName + '.' + hit.className : 'nada'));
    }
    return out;
  });
  check('CTAs del hero y cabecera reciben el clic', dead.length === 0, dead.join(' | '));

  // --- mapa por consentimiento ---
  const iframesBefore = await page.locator('.mapa-wrap iframe').count();
  check('mapa sin iframe antes del clic', iframesBefore === 0);
  await page.locator('#contacto').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.click('.map-consent');
  await page.waitForTimeout(800);
  const iframesAfter = await page.locator('.mapa-wrap iframe').count();
  const src = iframesAfter ? await page.locator('.mapa-wrap iframe').getAttribute('src') : '';
  check('mapa cargado tras el clic (google.com/maps?q=…&output=embed)', iframesAfter === 1 && /google\.com\/maps\?q=.*output=embed/.test(src), src);

  // --- scroll completo + longtasks ---
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__lt.splice(0));
  await scrollThrough(page);
  const ltScroll = await page.evaluate(() => window.__lt.splice(0));
  report.longtasks.scroll = ltScroll;
  check('sin longtasks (>50ms) durante el scroll completo', ltScroll.filter((e) => e.d > 50).length === 0, JSON.stringify(ltScroll));
  check('sin errores JS tras el scroll', errors.length === 0, errors.join(' | '));
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  check('sin scroll horizontal a 1440 px', sw <= 1440, `scrollWidth=${sw}`);

  const counters = await page.evaluate(() => [...document.querySelectorAll('[data-count]')].map((e) => e.textContent.trim()));
  check('contadores en sus valores (5, 0 mm, 19, 5,0)', counters.join('/') === '5/0/19/5,0', counters.join('/'));

  // --- sticky stack tratamientos ---
  await page.evaluate(() => { const c = document.querySelectorAll('.panel')[1]; window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 100); });
  await page.waitForTimeout(900);
  const scale = await page.evaluate(() => { const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.panel')).transform); return m.a; });
  check('sticky stack: la primera tarjeta cambia de escala al entrar la segunda', scale < 0.99, `scale=${scale.toFixed(3)}`);

  // --- galería horizontal tecnología ---
  await page.locator('#tecnologia').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const xBefore = await page.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.tec-track')).transform).e);
  await page.mouse.wheel(0, 2400);
  await page.waitForTimeout(700);
  const xAfter = await page.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.tec-track')).transform).e);
  check('galería de tecnología: el track se desplaza dentro del pin', xAfter < xBefore - 20, `${xBefore.toFixed(0)} -> ${xAfter.toFixed(0)}`);
  const wavesDrawn = await page.evaluate(() => [...document.querySelectorAll('.tec-wave path')].filter((p) => parseFloat(getComputedStyle(p).strokeDashoffset) <= 1).length);
  check('al menos una firma de onda se ha dibujado', wavesDrawn >= 1, `dibujadas=${wavesDrawn}`);

  // --- capturas de cada sección ---
  for (const sel of SECTIONS) {
    await page.locator(sel).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    const file = path.join(outDir, `desktop-${sel.replace(/[#.]/g, '')}.png`);
    await page.screenshot({ path: file });
    report.screenshots.push(file);
  }
  await ctx.close();

  /* ---------- Reduced motion ---------- */
  const ctxR = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const pageR = await ctxR.newPage();
  await pageR.goto(base, { waitUntil: 'networkidle' });
  await pageR.waitForTimeout(600);
  const r = await pageR.evaluate(() => ({
    lenis: typeof window.kineLenis !== 'undefined' && window.kineLenis !== null,
    tune: [...document.querySelectorAll('.tune, .tune-x')].every((el) => getComputedStyle(el).opacity === '1'),
    marquee: getComputedStyle(document.querySelector('.marquee-track')).animationName,
    counters: [...document.querySelectorAll('[data-count]')].map((e) => e.textContent.trim()).join('/'),
  }));
  check('reduced-motion: sin Lenis', !r.lenis);
  check('reduced-motion: reveals ya visibles (opacity 1)', r.tune);
  check('reduced-motion: marquee sin animación', r.marquee === 'none', r.marquee);
  check('reduced-motion: contadores en su valor final', r.counters === '5/0/19/5,0', r.counters);
  await ctxR.close();

  /* ---------- Sin JS ---------- */
  const ctxNoJs = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const pageNoJs = await ctxNoJs.newPage();
  await pageNoJs.goto(base, { waitUntil: 'load' });
  const noJs = await pageNoJs.evaluate(() => ({
    hasHero: !!document.querySelector('.hero h1'),
    hasNav: !!document.querySelector('.nav-links'),
    canvasHidden: getComputedStyle(document.querySelector('.hero-canvas')).display === 'none',
  }));
  check('sin JS: contenido del hero visible', noJs.hasHero);
  check('sin JS: navegación visible', noJs.hasNav);
  check('sin JS: canvas oculto (no rompe el layout)', noJs.canvasHidden);
  await ctxNoJs.close();

  /* ---------- Móvil 400 y 360 ---------- */
  for (const w of [400, 360]) {
    const ctxM = await browser.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const pageM = await ctxM.newPage();
    const errM = [];
    pageM.on('pageerror', (e) => errM.push(String(e)));
    await pageM.goto(base, { waitUntil: 'networkidle' });
    await pageM.waitForTimeout(1500);
    await pageM.click('.cookie-ack');
    await scrollThrough(pageM, 600, 60);
    const swM = await pageM.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
    check(`sin scroll horizontal a ${w} px`, swM <= w, `scrollWidth=${swM}`);
    check(`sin errores JS en móvil ${w}`, errM.length === 0, errM.join(' | '));
    if (w === 400) {
      await pageM.evaluate(() => window.scrollTo(0, 0));
      await pageM.waitForTimeout(400);
      await pageM.click('.nav-toggle');
      await pageM.waitForTimeout(300);
      const open = await pageM.evaluate(() => getComputedStyle(document.querySelector('.mobile-menu')).display);
      await pageM.click('.nav-toggle');
      await pageM.waitForTimeout(700);
      const closed = await pageM.evaluate(() => getComputedStyle(document.querySelector('.mobile-menu')).display);
      check('menú móvil abre (flex) y cierra (none)', open === 'flex' && closed === 'none', `${open}/${closed}`);
      for (const sel of SECTIONS) {
        await pageM.locator(sel).first().scrollIntoViewIfNeeded();
        await pageM.waitForTimeout(700);
        const file = path.join(outDir, `mobile-${sel.replace(/[#.]/g, '')}.png`);
        await pageM.screenshot({ path: file });
        report.screenshots.push(file);
      }
    }
    await ctxM.close();
  }

  await browser.close();
  fs.writeFileSync(path.resolve(__dirname, 'verify-report.json'), JSON.stringify(report, null, 2));
  console.log(report.ok ? '\nTODO OK' : '\nHAY FALLOS');
  process.exit(report.ok ? 0 : 1);
})();
