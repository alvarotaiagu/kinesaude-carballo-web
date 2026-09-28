/* Comprueba contra los archivos que el mando de maqueta ya no está.
   La receta del README no se escribe de memoria: se comprueba.

   node scripts/comprobar-borrado.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const rastros = [
  ['index.html',    /\[MANDO DE MAQUETA\]/,  'comentarios [MANDO DE MAQUETA]'],
  ['index.html',    /id="mando"/,            'el <div class="mando">'],
  ['index.html',    /kinesaude-densidad/,    'el script bloqueante del <head> y el párrafo del diálogo de cookies'],
  ['index.html',    /densidad-onda/,         'la clase densidad-onda del <html>'],
  ['index.html',    /hero-cifras/,           'las cifras del hero (solo existen para la sobria)'],
  ['index.html',    /franja-datos/,          'la franja de datos (solo existe para la sobria)'],
  ['css/style.css', /\[MANDO DE MAQUETA\]/,  'el bloque CSS del mando'],
  ['css/style.css', /densidad-sobria/,       'las reglas de la densidad sobria'],
  ['js/main.js',    /\[MANDO DE MAQUETA\]/,  'el bloque JS del mando'],
  ['js/main.js',    /mandoMaqueta/,          'la función mandoMaqueta()'],
  ['js/main.js',    /densidad-sobria/,       'la función sobria()'],
  ['js/main.js',    /densidad-cambiada/,     'las escuchas del evento densidad-cambiada'],
  ['js/scene-onda.js', /densidad-sobria/,    'la comprobación de densidad al arrancar la onda'],
];

let quedan = 0;
console.log('Rastros del mando de maqueta');
console.log('-'.repeat(70));
for (const [archivo, patron, que] of rastros) {
  const texto = fs.readFileSync(path.join(raiz, archivo), 'utf8');
  const hay = patron.test(texto);
  if (hay) quedan++;
  console.log((hay ? 'QUEDA ' : 'limpio') + '  ' + archivo.padEnd(18) + que);
}
console.log('-'.repeat(70));
if (quedan) {
  console.log(quedan + ' rastro(s). No entregar todavía.');
  process.exitCode = 1;
} else {
  console.log('Sin rastros del mando. Se puede entregar.');
}
