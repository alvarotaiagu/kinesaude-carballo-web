/* Servidor estático para revisar la maqueta en el navegador.
   Hace falta servirla por HTTP (no con doble clic) para que localStorage y el
   404 funcionen de verdad.

   node scripts/servir.mjs          → http://127.0.0.1:8931/
   node scripts/servir.mjs 5000     → otro puerto
   Mando de densidades: http://127.0.0.1:8931/index.html?revision
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const puerto = Number(process.argv[2]) || 8931;
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json'
};

export function crearServidor() {
  return http.createServer((req, res) => {
    const limpia = decodeURIComponent(req.url.split('?')[0]);
    const destino = path.join(raiz, limpia === '/' ? 'index.html' : limpia);
    if (!destino.startsWith(raiz)) { res.writeHead(403); res.end('no'); return; }
    if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(raiz, '404.html')));
      return;
    }
    res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(destino));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  crearServidor().listen(puerto, () => console.log(`http://127.0.0.1:${puerto}/  (Ctrl+C para parar)`));
}
