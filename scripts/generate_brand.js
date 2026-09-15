// Genera favicons (PNG) y la imagen Open Graph para KineSaúde Carballo
// a partir de la marca (anillo + onda + wordmark Outfit) con Playwright.
// Uso: node scripts/generate_brand.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..');

// Colores reales tomados de la muestra de logo que envió el cliente:
// anillo y trazo en tinta (grafito/negro), punto de la "i" en verde salvia,
// guion junto a "carballo" en terracota.
const markColored = `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path d="M129.4,19.2 A86,86 0 1,1 70.6,19.2" fill="none" stroke="#15191C" stroke-width="4"/>
  <path d="M66,20 C76,1 84,1 94,20 C104,39 112,39 122,20 C127,10.5 131,10.5 134,20" fill="none" stroke="#15191C" stroke-width="4.4" stroke-linecap="round"/>
  <circle cx="80.2" cy="1.4" r="4.6" fill="#6C8C7E"/>
</svg>`;

// El favicon usa fondo claro (como el logo real, sobre papel blanco) para
// que el anillo en tinta se lea; el resto de la web es oscura, pero el
// icono de marca no tiene por qué serlo.
const iconHtml = (size) => `<!doctype html><body style="margin:0;width:${size}px;height:${size}px;background:#f6f6f6;display:grid;place-items:center">
<div style="width:${Math.round(size * 0.86)}px;height:${Math.round(size * 0.86)}px">${markColored}</div></body>`;

const ogHtml = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;600;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
body{margin:0;width:1200px;height:630px;background:#15191c;color:#f6f6f6;font-family:Outfit,sans-serif;position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(50% 60% at 18% 30%,rgba(108,140,126,.45),transparent 70%),radial-gradient(45% 55% at 82% 75%,rgba(156,115,100,.24),transparent 70%)}
.brand{position:absolute;left:80px;top:70px;display:flex;align-items:center;gap:14px}
.brand .mark{width:54px;height:54px;background:#f6f6f6;border-radius:50%;padding:7px;box-sizing:border-box}
.brand .word{font-weight:300;font-size:30px}
.brand .word b{font-weight:600}
h1{position:absolute;right:80px;top:150px;width:640px;margin:0;font-weight:300;font-size:78px;line-height:1.02;letter-spacing:-.02em;text-align:right}
h1 b{font-weight:600;color:#bdd0c8}
.tag{position:absolute;left:84px;top:150px;font-family:"JetBrains Mono",monospace;font-size:16px;letter-spacing:.08em;text-transform:uppercase;color:#bdd0c8}
.foot{position:absolute;left:80px;right:80px;bottom:56px;display:flex;justify-content:space-between;font-family:"JetBrains Mono",monospace;font-size:18px;letter-spacing:.03em;opacity:.85;border-top:1px solid rgba(246,246,246,.2);padding-top:22px}
</style></head><body><div class="bg"></div>
<div class="brand"><div class="mark">${markColored}</div><span class="word">Kine<b>Saúde</b></span></div>
<span class="tag">clínica de fisioterapia · carballo</span>
<h1>Sintoniza con el <b>bienestar</b></h1>
<div class="foot"><span>Rúa Luis Calvo, 27 · Carballo</span><span>5,0 ★ Google · 668 52 89 69</span></div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const size of [96, 180, 192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(iconHtml(size));
    await page.screenshot({ path: path.join(root, `assets/img/logo/icon-${size}.png`), clip: { x: 0, y: 0, width: size, height: size } });
  }
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(ogHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(root, 'assets/img/web/og-image.jpg'), type: 'jpeg', quality: 88 });
  await browser.close();
  console.log('brand assets ok');
})();
