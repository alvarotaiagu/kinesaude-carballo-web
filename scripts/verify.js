// Verificación con Playwright para KineSaúde Carballo (revisión 2026-09-28).
// Levanta su propio servidor (scripts/servir.mjs) y comprueba:
//  - cortina «sintonizar»: ruido → onda, nombre, se abre en dos mitades; color distinto del hero;
//    acaba en display:none en las tres pasadas (normal, sin GSAP, movimiento reducido); captura a medias
//  - sin errores JS; longtasks (>50 ms) durante ~2 s de onda del hero y durante el scroll completo
//  - los tres títulos de sección que antes salían a tamaño por defecto ahora son grandes
//  - cursor propio: aro + punto, sistema oculto, «sintoniza» sobre el hero, relleno sobre un botón
//  - cabecera que se esconde bajando y vuelve subiendo; barra de progreso
//  - hero con salida por scrub (el contenido se funde al bajar)
//  - cookies (display:none real, recordado); mapa solo bajo clic; contadores
//  - revelado de fotos (clip-path a 0); reseñas reveladas e inclinadas con el ratón
//  - pila de tratamientos paso a paso desde arriba: nadie se suelta antes, al acabar salen juntas
//  - galería de tecnología: título dentro del bloque fijado, track que se desplaza, lectura 0N / 09,
//    tarjeta central marcada, firma de onda dibujada
//  - mando de maqueta: oculto sin ?revision; con ?revision se aparta con las cookies, cambia a la
//    sobria de verdad (canvas fuera, cifras, cuadrícula), se recuerda al recargar, se puede volver,
//    y una densidad guardada NO se aplica sin ?revision
//  - movimiento reducido, sin JS, sin GSAP (CDN caído): la página se ve entera
//  - móvil 400 / 360 / 375×667: sin scroll horizontal, menú con la cabecera ya fija, hero sin solapes,
//    paneles desapilados con la foto entera
//  - capturas por sección en escritorio (1440) y móvil (400), más cortina y sobria
// Uso: node scripts/verify.js            (sirve en 8931)
//      node scripts/verify.js https://alvarotaiagu.github.io/kinesaude-carballo-web/   (contra Pages)
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require(path.resolve(__dirname, '..', '..', 'alvarotaiagu.github.io', 'node_modules', 'playwright'))); }

const PORT = 8931;
const remoto = process.argv[2];
const base = remoto || `http://127.0.0.1:${PORT}/`;
const outDir = path.resolve(__dirname, '..', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });
const report = { ok: true, checks: [], longtasks: {}, screenshots: [] };
const check = (name, pass, detail) => { report.checks.push({ name, pass, detail }); if (!pass) report.ok = false; console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const info = (m) => console.log('INFO  ' + m);
const foto = (n) => { const f = path.join(outDir, n); report.screenshots.push(f); return f; };
const SECTIONS = ['#inicio', '#diamagnetica', '#tratamientos', '#tecnologia', '#seguros', '#resenas', '#contacto', '.site-footer'];
const ownError = (m) => m.type() === 'error' && !/google\.com|googleapis\.com|gstatic\.com/.test((m.location() && m.location().url) || m.text());
const ltInit = () => {
  window.__lt = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push({ d: Math.round(e.duration), t: Math.round(e.startTime) }))).observe({ entryTypes: ['longtask'] }); } catch (e) {}
};
async function scrollThrough(page, step = 700, pause = 90) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += step) { await page.mouse.wheel(0, step); await page.waitForTimeout(pause); }
  await page.waitForTimeout(700);
}
async function irA(page, sel, offset = 0) {
  await page.evaluate(({ s, o }) => {
    const el = document.querySelector(s);
    const y = el.getBoundingClientRect().top + window.scrollY + o;
    if (window.kineLenis) window.kineLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
  }, { s: sel, o: offset });
  await page.waitForTimeout(900);
}
async function esperarCortina(page) {
  await page.waitForFunction(() => { const c = document.getElementById('cortina'); return !c || getComputedStyle(c).display === 'none'; }, null, { timeout: 12000 });
}

(async () => {
  let server = null;
  if (!remoto) {
    const { crearServidor } = await import('./servir.mjs');
    server = crearServidor();
    await new Promise((r) => server.listen(PORT, r));
  }
  const browser = await chromium.launch();

  /* ============ Escritorio ============ */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(ltInit);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (ownError(m)) errors.push(m.text()); });
  await page.goto(base, { waitUntil: 'domcontentloaded' }); /* la cortina arranca con main.js: muestrear desde el principio */

  /* --- cortina a medias: muestreo cada 120 ms durante 3,6 s --- */
  const muestras = [];
  for (let i = 0; i < 30; i++) {
    const s = await page.evaluate(() => {
      const c = document.getElementById('cortina');
      if (!c || getComputedStyle(c).display === 'none') return { fuera: true };
      const a = document.getElementById('cortina-arriba').getBoundingClientRect();
      const pts = document.getElementById('cortina-onda').getAttribute('points');
      const nombre = document.querySelector('.cortina__nombre b');
      return { fuera: false, arribaBottom: Math.round(a.bottom), pts: pts.slice(0, 400), nombreOp: getComputedStyle(nombre.closest('.cortina__marca')).opacity, color: getComputedStyle(document.getElementById('cortina-arriba')).backgroundColor, ruido: (() => { const ys = pts.split(' ').slice(0, 40).map((p) => parseFloat(p.split(',')[1])); let r = 0; for (let i = 1; i < ys.length - 1; i++) r += Math.abs(ys[i + 1] - 2 * ys[i] + ys[i - 1]); return r / (ys.length - 2); })() };
    });
    muestras.push(s);
    if (i === 5) await page.screenshot({ path: foto('00a-cortina-ruido.png') });
    if (i === 13) await page.screenshot({ path: foto('00b-cortina-nombre.png') });
    if (!s.fuera && s.arribaBottom < 380 && !muestras.abriendo) { muestras.abriendo = true; await page.screenshot({ path: foto('00c-cortina-se-abre.png') }); }
    await page.waitForTimeout(120);
  }
  const vivas = muestras.filter((m) => !m.fuera);
  const puntosDistintos = new Set(vivas.map((m) => m.pts)).size;
  const ruidoInicial = Math.max(...vivas.slice(0, 3).map((m) => m.ruido), 0);
  const ruidoFinal = vivas.length > 12 ? vivas[12].ruido : 0;
  check('cortina: la línea cambia fotograma a fotograma (osciloscopio vivo)', puntosDistintos >= 8, puntosDistintos + ' estados distintos');
  check('cortina: empieza con ruido y se afina', ruidoInicial > 12 && ruidoFinal < 2, `rugosidad ${ruidoInicial.toFixed(1)} → ${ruidoFinal.toFixed(1)}`);
  check('cortina: la mitad de arriba se retira hacia arriba (se abre en dos)', !!muestras.abriendo, JSON.stringify(vivas.slice(-3).map((m) => m.arribaBottom)));
  check('cortina: no es del color del hero que destapa', vivas.length && vivas[0].color === 'rgb(63, 92, 80)', vivas.length ? vivas[0].color : 'sin muestras');
  await esperarCortina(page);
  const trasCortina = await page.evaluate(() => ({ display: getComputedStyle(document.getElementById('cortina')).display, activa: document.documentElement.classList.contains('cortina-activa'), overflow: getComputedStyle(document.documentElement).overflow }));
  check('cortina: acaba en display:none y devuelve el scroll (pasada normal)', trasCortina.display === 'none' && !trasCortina.activa && trasCortina.overflow !== 'hidden', JSON.stringify(trasCortina));

  await page.evaluate(() => window.__lt.splice(0));
  await page.waitForTimeout(2200); // deja correr la onda del hero
  const ltHero = await page.evaluate(() => window.__lt.splice(0));
  report.longtasks.hero = ltHero;
  check('sin errores JS en carga', errors.length === 0, errors.join(' | '));
  check('sin longtasks (>50ms) durante ~2s de onda del hero', ltHero.filter((e) => e.d > 50).length === 0, JSON.stringify(ltHero));
  check('canvas del hero tiene tamaño', await page.evaluate(() => { const c = document.querySelector('.hero-canvas'); return c.width > 0 && c.height > 0; }));
  const h1Vis = await page.evaluate(() => { const c = document.querySelector('.hero h1 .ch'); return c ? parseFloat(getComputedStyle(c).opacity) : -1; });
  check('titular del hero revelado tras la cortina', h1Vis === 1, 'opacity de la primera letra = ' + h1Vis);

  /* --- títulos de sección: los tres que salían a tamaño por defecto --- */
  const titulos = await page.evaluate(() => ['#diamag-titulo', '#trat-titulo', '#tec-titulo', '#seguros-titulo', '#contacto-titulo'].map((s) => [s, Math.round(parseFloat(getComputedStyle(document.querySelector(s)).fontSize))]));
  check('títulos de sección grandes (≥ 56 px a 1440)', titulos.every(([, px]) => px >= 56), titulos.map((t) => t.join(':')).join(' '));

  /* --- cookies --- */
  check('aviso de cookies visible en primera visita', await page.locator('.cookie-banner').isVisible());
  check('html.cookies-visibles mientras el aviso está', await page.evaluate(() => document.documentElement.classList.contains('cookies-visibles')));
  await page.click('.cookie-ack');
  await page.waitForTimeout(150);
  const bannerDisplay = await page.evaluate(() => getComputedStyle(document.querySelector('.cookie-banner')).display);
  check('botón "Entendido" oculta el aviso (display:none real)', bannerDisplay === 'none', `display=${bannerDisplay}`);
  await page.reload({ waitUntil: 'networkidle' });
  await esperarCortina(page);
  check('aviso de cookies recordado tras recargar', (await page.evaluate(() => getComputedStyle(document.querySelector('.cookie-banner')).display)) === 'none');
  check('sin ?revision el mando de maqueta no se ve', await page.evaluate(() => { const m = document.getElementById('mando'); return m.hidden && getComputedStyle(m).display === 'none'; }));

  /* --- cursor propio --- */
  await page.mouse.move(900, 300);
  await page.waitForTimeout(80);
  await page.mouse.move(980, 560);
  await page.waitForTimeout(500);
  const cursorHero = await page.evaluate(() => ({
    sistema: getComputedStyle(document.body).cursor,
    aro: getComputedStyle(document.querySelector('.cursor')).opacity,
    punto: getComputedStyle(document.querySelector('.cursor-punto')).opacity,
    ancho: getComputedStyle(document.querySelector('.cursor')).width,
    texto: document.querySelector('.cursor__texto').textContent,
    clase: document.querySelector('.cursor').className, bajo: (() => { const e = document.elementFromPoint(980, 560); return e ? e.tagName + '.' + e.className : 'nada'; })(),
    textoOp: getComputedStyle(document.querySelector('.cursor__texto')).opacity,
  }));
  /* sobre el hero el punto se esconde a propósito (el aro grande lo sustituye) */
  check('cursor propio visible y el del sistema oculto', cursorHero.sistema === 'none' && cursorHero.aro === '1' && (cursorHero.punto === '1' || /cursor--sintoniza/.test(cursorHero.clase)), JSON.stringify(cursorHero));
  check('sobre el hero el aro crece y dice «sintoniza»', cursorHero.ancho === '84px' && cursorHero.texto === 'sintoniza' && cursorHero.textoOp === '1', JSON.stringify(cursorHero));
  await page.screenshot({ path: foto('01a-cursor-hero.png'), clip: { x: 880, y: 460, width: 220, height: 200 } });
  const boton = await page.locator('.hero .btn-senal').boundingBox();
  await page.mouse.move(boton.x + boton.width / 2, boton.y + boton.height / 2);
  await page.waitForTimeout(500);
  const cursorBoton = await page.evaluate(() => { const e = getComputedStyle(document.querySelector('.cursor')); return { fondo: e.backgroundColor, ancho: e.width, sistema: getComputedStyle(document.querySelector('.hero .btn-senal')).cursor }; });
  check('sobre un botón el aro se rellena, sin cursor del sistema', /rgba\(143, 168, 155, 0\.42\)/.test(cursorBoton.fondo) && cursorBoton.ancho === '56px' && cursorBoton.sistema === 'none', JSON.stringify(cursorBoton));
  await page.mouse.move(1300, 120);

  /* --- CTAs sin zonas muertas (con la portada a la vista) --- */
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

  /* --- hero: salida con scrub; cabecera que se esconde --- */
  await page.mouse.wheel(0, 450);
  await page.waitForTimeout(900);
  const heroScrub = await page.evaluate(() => ({ op: parseFloat(getComputedStyle(document.querySelector('.hero-content')).opacity), y: window.scrollY }));
  check('el contenido del hero se funde al bajar (scrub)', heroScrub.op < 0.75 && heroScrub.op > 0, JSON.stringify(heroScrub));
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(900);
  const oculta = await page.evaluate(() => ({ hidden: document.querySelector('.site-header').classList.contains('is-hidden'), progreso: getComputedStyle(document.querySelector('.scroll-progress')).transform }));
  check('la cabecera se esconde al bajar y lleva barra de progreso', oculta.hidden && oculta.progreso !== 'none' && !/matrix\(0,/.test(oculta.progreso), JSON.stringify(oculta));
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(700);
  check('la cabecera vuelve al subir', await page.evaluate(() => !document.querySelector('.site-header').classList.contains('is-hidden')));

  /* --- revelado de la foto diamagnética --- */
  await irA(page, '#diamagnetica', -80);
  await page.waitForTimeout(1600);
  const clip = await page.evaluate(() => ({ clip: getComputedStyle(document.querySelector('.diamag-media')).clipPath, escala: new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.diamag-media img')).transform).a }));
  check('la foto diamagnética se revela (clip a 0 %, escala vuelve a 1)', /^inset\(0(px|%)/.test(clip.clip) && Math.abs(clip.escala - 1) < 0.02, JSON.stringify(clip));

  /* --- mapa por consentimiento --- */
  check('mapa sin iframe antes del clic', (await page.locator('.mapa-wrap iframe').count()) === 0);
  await irA(page, '#contacto', -60);
  await page.click('.map-consent');
  await page.waitForTimeout(800);
  const iframesAfter = await page.locator('.mapa-wrap iframe').count();
  const src = iframesAfter ? await page.locator('.mapa-wrap iframe').getAttribute('src') : '';
  check('mapa cargado tras el clic (google.com/maps?q=…&output=embed)', iframesAfter === 1 && /google\.com\/maps\?q=.*output=embed/.test(src), src);

  /* --- scroll completo + longtasks --- */
  await page.evaluate(() => (window.kineLenis ? window.kineLenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0)));
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

  /* --- reseñas: reveladas e inclinadas --- */
  await irA(page, '#resenas', -40);
  await page.waitForTimeout(1400);
  const resenasOp = await page.evaluate(() => [...document.querySelectorAll('.resena-card')].map((c) => parseFloat(getComputedStyle(c).opacity)));
  check('las tres reseñas se han revelado', resenasOp.every((o) => o === 1), resenasOp.join('/'));
  const card = await page.locator('.resena-card').nth(1).boundingBox();
  await page.mouse.move(card.x + card.width * 0.85, card.y + card.height * 0.2);
  await page.waitForTimeout(700);
  const tilt = await page.evaluate(() => getComputedStyle(document.querySelectorAll('.resena-card')[1]).transform);
  check('una reseña se inclina con el ratón (3D)', /matrix3d/.test(tilt) && tilt !== 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)', tilt.slice(0, 60));
  await page.mouse.move(1300, 120);

  /* --- pila de tratamientos: paso a paso desde arriba --- */
  await irA(page, '.stack', -200);
  const vh = 900;
  let sueltas = [], posadas = new Set(), tops = [], salidaJunta = null, escalada = false;
  for (let i = 0; i < 60; i++) {
    await page.mouse.wheel(0, 90);
    await page.waitForTimeout(70);
    const s = await page.evaluate(() => [...document.querySelectorAll('.stack .panel')].map((p) => ({ top: Math.round(p.getBoundingClientRect().top), bottom: Math.round(p.getBoundingClientRect().bottom), scale: new DOMMatrixReadOnly(getComputedStyle(p).transform).a })));
    tops.push(s.map((p) => p.top));
    s.forEach((p, k) => { if (p.top <= 1) posadas.add(k); });
    /* nadie se suelta: un panel ya posado no puede volver a tener top > 1 mientras el siguiente no ha llegado arriba */
    s.forEach((p, k) => { if (posadas.has(k) && p.top > 1 && s[k + 1] && s[k + 1].top > 1) sueltas.push(`paso ${i} panel ${k + 1} top=${p.top}`); });
    if (s[1].top <= 1 && s[0].scale < 0.95) escalada = true;
    const stackBottom = await page.evaluate(() => Math.round(document.querySelector('.stack').getBoundingClientRect().bottom));
    if (stackBottom < vh - 40 && salidaJunta === null) salidaJunta = Math.max(...s.map((p) => p.top)) - Math.min(...s.map((p) => p.top));
    if (stackBottom < 0) break;
  }
  check('pila: ningún panel se suelta antes de que se pose el siguiente', sueltas.length === 0, sueltas.slice(0, 4).join(' | '));
  check('pila: la de debajo se encoge cuando se posa la siguiente', escalada);
  check('pila: al acabarse salen todas juntas', salidaJunta !== null && salidaJunta < 3, 'diferencia de tops ' + salidaJunta + ' px');
  check('pila: el texto del primer panel se ha revelado', await page.evaluate(() => [...document.querySelectorAll('.panel-a .panel-text h3')].every((e) => getComputedStyle(e).opacity === '1')));

  /* --- galería horizontal de tecnología --- */
  await irA(page, '.tec-pin', 0);
  await page.waitForTimeout(600);
  const xBefore = await page.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.tec-track')).transform).e);
  const readoutBefore = await page.evaluate(() => document.querySelector('.tec-readout').textContent);
  await page.mouse.wheel(0, 2400);
  await page.waitForTimeout(900);
  const tec = await page.evaluate(() => ({
    x: new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.tec-track')).transform).e,
    readout: document.querySelector('.tec-readout').textContent,
    tituloTop: Math.round(document.querySelector('#tec-titulo').getBoundingClientRect().top),
    centro: document.querySelectorAll('.tec-card.is-center').length,
    dibujadas: [...document.querySelectorAll('.tec-wave path')].filter((p) => parseFloat(getComputedStyle(p).strokeDashoffset) <= 1).length,
    rejilla: getComputedStyle(document.querySelector('.tec-grid')).transform,
    escalas: [...document.querySelectorAll('.tec-card')].map((c) => new DOMMatrixReadOnly(getComputedStyle(c).transform).a.toFixed(2)),
  }));
  check('galería: el track se desplaza dentro del pin', tec.x < xBefore - 20, `${xBefore.toFixed(0)} -> ${tec.x.toFixed(0)}`);
  check('galería: el título sigue a la vista dentro del bloque fijado', tec.tituloTop > 40 && tec.tituloTop < 320, 'top=' + tec.tituloTop);
  check('galería: la lectura 0N / 09 avanza', readoutBefore !== tec.readout && /^0[2-9] \/ 09$/.test(tec.readout), `${readoutBefore} -> ${tec.readout}`);
  check('galería: hay una tarjeta central marcada y las lejanas se encogen', tec.centro === 1 && new Set(tec.escalas).size > 1, tec.escalas.join(','));
  check('galería: firmas de onda dibujadas al pasar', tec.dibujadas >= 3, 'dibujadas=' + tec.dibujadas);
  check('galería: la rejilla tiene paralaje propio', tec.rejilla !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(tec.rejilla), tec.rejilla);
  await page.screenshot({ path: foto('desktop-tecnologia-mitad.png') });

  /* --- capturas de cada sección --- */
  for (const sel of SECTIONS) {
    await irA(page, sel, sel === '#inicio' ? 0 : -20);
    await page.waitForTimeout(900);
    await page.screenshot({ path: foto(`desktop-${sel.replace(/[#.]/g, '')}.png`) });
  }
  await ctx.close();

  /* ============ Mando de maqueta: dos densidades (?revision) ============ */
  {
    const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await c2.newPage();
    const err2 = [];
    p2.on('pageerror', (e) => err2.push(String(e)));
    await p2.goto(base + 'index.html?revision', { waitUntil: 'networkidle' });
    await esperarCortina(p2);
    check('mando: se aparta mientras el aviso de cookies está en pantalla', await p2.evaluate(() => getComputedStyle(document.getElementById('mando')).visibility === 'hidden'));
    await p2.click('.cookie-ack');
    await p2.waitForTimeout(500);
    check('mando: aparece al cerrar las cookies (lo enseña el JS)', await p2.evaluate(() => !document.getElementById('mando').hidden && getComputedStyle(document.getElementById('mando')).visibility === 'visible'));
    await p2.click('[data-densidad="sobria"]');
    await p2.waitForTimeout(900);
    const sob = await p2.evaluate(() => ({
      clase: document.documentElement.className,
      canvas: getComputedStyle(document.querySelector('.hero-canvas')).display,
      cifras: getComputedStyle(document.querySelector('.hero-cifras')).display,
      marquee: getComputedStyle(document.querySelector('.marquee')).display,
      franja: getComputedStyle(document.querySelector('.franja-datos')).display,
      pin: getComputedStyle(document.querySelector('.tec-sticky')).position,
      track: getComputedStyle(document.querySelector('.tec-track')).transform,
      panel: getComputedStyle(document.querySelector('.panel')).position,
      ondas: [...document.querySelectorAll('.tec-wave path')].filter((p) => parseFloat(getComputedStyle(p).strokeDashoffset) <= 1).length,
      pulsado: document.querySelector('[data-densidad="sobria"]').getAttribute('aria-pressed'),
      sw: document.documentElement.scrollWidth,
    }));
    check('sobria: clase en <html>, canvas fuera, cifras dentro, franja en vez de marquee', sob.clase.includes('densidad-sobria') && sob.canvas === 'none' && sob.cifras === 'grid' && sob.marquee === 'none' && sob.franja === 'block' && sob.pulsado === 'true', JSON.stringify(sob));
    check('sobria: tecnología en cuadrícula quieta con las nueve firmas dibujadas, paneles desapilados', sob.pin === 'static' && sob.track === 'none' && sob.panel === 'relative' && sob.ondas === 9, JSON.stringify({ pin: sob.pin, track: sob.track, panel: sob.panel, ondas: sob.ondas }));
    check('sobria: sin desbordamiento horizontal', sob.sw <= 1440, 'scrollWidth=' + sob.sw);
    await p2.screenshot({ path: foto('sobria-inicio.png') });
    await irA(p2, '#tecnologia', -20);
    await p2.screenshot({ path: foto('sobria-tecnologia.png') });
    await irA(p2, '#tratamientos', -20);
    await p2.screenshot({ path: foto('sobria-tratamientos.png') });
    await p2.reload({ waitUntil: 'load' });
    const claseAlCargar = await p2.evaluate(() => document.documentElement.className);
    check('sobria: la densidad elegida se aplica sin parpadeo al recargar', claseAlCargar.includes('densidad-sobria'), claseAlCargar);
    await esperarCortina(p2);
    await p2.click('[data-densidad="onda"]');
    await p2.waitForTimeout(900);
    const vuelta = await p2.evaluate(() => ({ clase: document.documentElement.className, canvas: getComputedStyle(document.querySelector('.hero-canvas')).display, pin: getComputedStyle(document.querySelector('.tec-sticky')).position }));
    check('se puede volver a la densidad Onda (canvas y galería fijada de vuelta)', vuelta.clase.includes('densidad-onda') && vuelta.canvas === 'block' && vuelta.pin === 'sticky', JSON.stringify(vuelta));
    check('sin errores JS con el mando', err2.length === 0, err2.join(' | '));
    await c2.close();
    /* sin ?revision, una densidad guardada NO se aplica: el enlace del cliente sale limpio */
    const c3 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await c3.addInitScript(() => { try { localStorage.setItem('kinesaude-densidad', 'sobria'); } catch (e) {} });
    const p3 = await c3.newPage();
    await p3.goto(base, { waitUntil: 'load' });
    check('sin ?revision una densidad guardada no se aplica', (await p3.evaluate(() => document.documentElement.className)).includes('densidad-onda'));
    await c3.close();
  }

  /* ============ Reduced motion ============ */
  {
    const ctxR = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const pageR = await ctxR.newPage();
    await pageR.goto(base, { waitUntil: 'networkidle' });
    await pageR.waitForTimeout(600);
    const r = await pageR.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      lenis: typeof window.kineLenis !== 'undefined' && window.kineLenis !== null,
      tune: [...document.querySelectorAll('.tune, .tune-x')].every((el) => getComputedStyle(el).opacity === '1'),
      marquee: getComputedStyle(document.querySelector('.marquee-track')).animationName,
      counters: [...document.querySelectorAll('[data-count]')].map((e) => e.textContent.trim()).join('/'),
      clip: getComputedStyle(document.querySelector('.diamag-media')).clipPath,
      h1: getComputedStyle(document.querySelector('.hero h1')).opacity,
      panelTexto: [...document.querySelectorAll('.panel-text h3')].every((e) => getComputedStyle(e).opacity === '1'),
      resenas: [...document.querySelectorAll('.resena-card')].every((e) => getComputedStyle(e).opacity === '1'),
    }));
    check('reduced-motion: la cortina no aparece', r.cortina === 'none');
    check('reduced-motion: sin Lenis', !r.lenis);
    check('reduced-motion: reveals ya visibles (opacity 1)', r.tune && r.h1 === '1' && r.panelTexto && r.resenas, JSON.stringify({ tune: r.tune, h1: r.h1, panelTexto: r.panelTexto, resenas: r.resenas }));
    check('reduced-motion: fotos sin recorte', r.clip === 'none', r.clip);
    check('reduced-motion: marquee sin animación', r.marquee === 'none', r.marquee);
    check('reduced-motion: contadores en su valor final', r.counters === '5/0/19/5,0', r.counters);
    await ctxR.close();
  }

  /* ============ Sin GSAP (CDN caído) ============ */
  {
    const ctxG = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctxG.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap/, (route) => route.abort());
    const pageG = await ctxG.newPage();
    const errG = [];
    pageG.on('pageerror', (e) => errG.push(String(e)));
    await pageG.goto(base, { waitUntil: 'networkidle' });
    await pageG.waitForTimeout(800);
    const g = await pageG.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      bloqueado: document.documentElement.classList.contains('cortina-activa'),
      h1: getComputedStyle(document.querySelector('.hero h1')).opacity,
      clip: getComputedStyle(document.querySelector('.diamag-media')).clipPath,
      panelTexto: [...document.querySelectorAll('.panel-text h3')].every((e) => getComputedStyle(e).opacity === '1'),
      ondas: [...document.querySelectorAll('.tec-wave path')].filter((p) => parseFloat(getComputedStyle(p).strokeDashoffset) <= 1).length,
      resenas: [...document.querySelectorAll('.resena-card')].every((e) => getComputedStyle(e).opacity === '1'),
      apagados: [...document.querySelectorAll('main *')].filter((n) => { const e = getComputedStyle(n); const r = n.getBoundingClientRect(); return parseFloat(e.opacity) < 0.15 && r.height > 0 && r.top < window.innerHeight && e.visibility !== 'hidden'; }).length,
    }));
    check('sin GSAP: la cortina se retira igual y el scroll queda libre', g.cortina === 'none' && !g.bloqueado, JSON.stringify({ cortina: g.cortina, bloqueado: g.bloqueado }));
    check('sin GSAP: la página se ve entera (titular, primera pantalla, fotos, paneles, firmas, reseñas)', g.h1 === '1' && g.clip === 'none' && g.panelTexto && g.ondas === 9 && g.resenas && g.apagados === 0, JSON.stringify(g));
    check('sin GSAP: sin errores JS', errG.length === 0, errG.join(' | '));
    await ctxG.close();
  }

  /* ============ Sin JS ============ */
  {
    const ctxNoJs = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const pageNoJs = await ctxNoJs.newPage();
    await pageNoJs.goto(base, { waitUntil: 'load' });
    const noJs = await pageNoJs.evaluate(() => ({
      hasHero: !!document.querySelector('.hero h1') && getComputedStyle(document.querySelector('.hero h1')).opacity === '1',
      hasNav: !!document.querySelector('.nav-links'),
      canvasHidden: getComputedStyle(document.querySelector('.hero-canvas')).display === 'none',
      cortina: getComputedStyle(document.getElementById('cortina')).display,
    }));
    check('sin JS: contenido del hero visible', noJs.hasHero);
    check('sin JS: navegación visible', noJs.hasNav);
    check('sin JS: canvas oculto y cortina inexistente', noJs.canvasHidden && noJs.cortina === 'none', noJs.cortina);
    await ctxNoJs.close();
  }

  /* ============ Móvil ============ */
  for (const [w, h] of [[400, 800], [360, 640], [375, 667]]) {
    const ctxM = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const pageM = await ctxM.newPage();
    const errM = [];
    pageM.on('pageerror', (e) => errM.push(String(e)));
    await pageM.goto(base, { waitUntil: 'networkidle' });
    await esperarCortina(pageM);
    await pageM.waitForTimeout(600);
    const solape = await pageM.evaluate(() => {
      const cab = document.querySelector('.site-header').getBoundingClientRect();
      const k = document.querySelector('.hero .kicker').getBoundingClientRect();
      const h1 = document.querySelector('.hero h1').getBoundingClientRect();
      const acciones = document.querySelector('.hero-actions').getBoundingClientRect();
      return { cab: Math.round(cab.bottom), kicker: Math.round(k.top), h1: Math.round(h1.top), acciones: Math.round(acciones.bottom), vh: window.innerHeight };
    });
    check(`hero a ${w}×${h}: el texto no se mete bajo la cabecera`, solape.kicker >= solape.cab && solape.h1 > solape.cab, JSON.stringify(solape));
    await pageM.click('.cookie-ack');
    await scrollThrough(pageM, 600, 60);
    const swM = await pageM.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
    check(`sin scroll horizontal a ${w} px`, swM <= w, `scrollWidth=${swM}`);
    check(`sin errores JS en móvil ${w}`, errM.length === 0, errM.join(' | '));
    const paneles = await pageM.evaluate(() => [...document.querySelectorAll('.stack .panel')].map((p) => {
      const f = p.querySelector('.panel-media').getBoundingClientRect(); const r = p.getBoundingClientRect();
      return { pos: getComputedStyle(p).position, dentro: f.top >= r.top - 1 && f.bottom <= r.bottom + 1 };
    }));
    check(`paneles desapilados y con la foto entera a ${w} px`, paneles.every((p) => p.pos === 'relative' && p.dentro), JSON.stringify(paneles));
    if (w === 400) {
      /* menú con la cabecera YA fija */
      await pageM.evaluate(() => window.scrollTo(0, 300));
      await pageM.waitForTimeout(500);
      await pageM.click('.nav-toggle');
      await pageM.waitForTimeout(750);
      const menu = await pageM.evaluate(() => { const m = document.querySelector('.mobile-menu'); const r = m.getBoundingClientRect(); return { display: getComputedStyle(m).display, alto: Math.round(r.height), vh: window.innerHeight, top: Math.round(r.top), cabFija: document.querySelector('.site-header').classList.contains('is-scrolled') }; });
      await pageM.screenshot({ path: foto('mobile-menu.png') });
      await pageM.click('.nav-toggle');
      await pageM.waitForTimeout(700);
      const closed = await pageM.evaluate(() => getComputedStyle(document.querySelector('.mobile-menu')).display);
      check('menú móvil abre a pantalla completa con la cabecera fija, y cierra', menu.display === 'flex' && menu.top === 0 && menu.alto >= menu.vh - 1 && menu.cabFija && closed === 'none', JSON.stringify(menu) + ' cerrado=' + closed);
      for (const sel of SECTIONS) {
        await pageM.locator(sel).first().scrollIntoViewIfNeeded();
        await pageM.waitForTimeout(700);
        await pageM.screenshot({ path: foto(`mobile-${sel.replace(/[#.]/g, '')}.png`) });
      }
    }
    await ctxM.close();
  }

  /* ============ Pendientes marcados (informativo) ============ */
  {
    const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
    const pend = (html.match(/class="pendiente"/g) || []).length;
    info(`marcas «pendiente» en index.html: ${pend} (reserva, razón social/NIF, diatermia; intencionadas)`);
  }

  await browser.close();
  if (server) server.close();
  fs.writeFileSync(path.resolve(__dirname, 'verify-report.json'), JSON.stringify(report, null, 2));
  console.log(report.ok ? '\nTODO OK' : '\nHAY FALLOS');
  process.exit(report.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
