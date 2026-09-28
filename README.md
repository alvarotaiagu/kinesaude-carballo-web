# KineSaúde · Carballo — web estática

Plantilla nº 3 de la familia **fisioterapia** de la librería WEBS NEGOCIOS
(junto a AURA Carballo y Fisioterapia Javi Teijeiro), y estructuralmente
distinta de ambas: concepto **"Sintoniza con el bienestar"** — señal,
frecuencia, onda. Grafito + un verde salvia + un acento terracota (paleta
tomada del logo real del cliente, ver "Logo" abajo), tipografía Outfit +
JetBrains Mono, hero de canvas con una malla de puntos que respira y se enciende cerca
del cursor (no partículas, no pinceladas, no agua), galería horizontal fijada para los 9 equipos de
electroterapia con una "firma de onda" SVG distinta por aparato, y la
Terapia Diamagnética como sección protagonista propia.

- HTML/CSS/JS estático, sin frameworks ni build. `node scripts/servir.mjs` → http://127.0.0.1:8931/ (por HTTP, no con doble clic).
- Responsive desde 360 px. Sin cookies de terceros (el mapa de Google solo se carga al pulsar "Ver mapa").
- Motion: Lenis (único motor de scroll suave) + GSAP ScrollTrigger vía CDN (mismas versiones que el resto de la librería). Dos banderas: `gsapReady` (hay librería) y `motion` (además no hay `prefers-reduced-motion`); se apaga el movimiento, no el contenido. Con el CDN caído la página se ve entera.
- Verificado con Playwright (`node scripts/verify.js`, levanta su propio servidor): cortina a medias y en las tres pasadas, 0 errores JS, 0 longtasks >50 ms en el hero y en el scroll completo, cursor, cabecera, cookies, mapa, pila paso a paso, galería, dos densidades, reduced-motion, sin JS, sin GSAP y tres móviles. Ver `scripts/verify-report.json` y `screenshots/`.
- Antes de cada commit que toque CSS o JS: `node scripts/versionar.mjs` (huella `?v=` contra la caché de 10 min de Pages).

## Revisión 2026-09-28: más moderna y premium

La clienta quería actualizar la web. Se mantuvo la estructura y todos los
datos; se cambió el acabado y el movimiento:

- **Arreglos.** Tres títulos de sección (Diamagnética, Tratamientos,
  Tecnología) salían al tamaño por defecto del navegador: ahora todos los
  `h2.display` comparten escala. En móvil los paneles de tratamientos no
  cabían en pantalla y la foto quedaba cortada: se desapilan por debajo de
  56rem (CSS `position: relative` + `gsap.matchMedia` sin escala ni velo).
- **Cortina «sintonizar».** Fondo salvia oscuro (`--cortina`, distinto del
  grafito del hero): una línea de osciloscopio con ruido se afina hasta ser
  una onda limpia, aparece el nombre, la onda se aplana y la pantalla se abre
  en dos mitades por esa línea, con los labios abombados en `expo.inOut`.
  Retirada garantizada: `.fuera` con `!important`, sin JS no existe, con
  movimiento reducido no aparece, y red de seguridad de 8 s en el `<head>`.
  La intro del hero espera al evento `cortina-abriendose`.
- **Cursor propio.** Punto salvia + aro; sobre el hero el aro crece y dice
  «sintoniza», sobre enlaces y botones se rellena. El del sistema se oculta
  solo cuando el propio ya se ve (`html.con-cursor`); nada en táctil.
- **Hero.** Primero se reforzaron las ondas (siete, con brillo simulado);
  la clienta no acabó convencida y el mismo día se sustituyeron por la
  **malla de puntos** (`js/scene-puntos.js`): retícula salvia de 34 px con
  una ola lenta, puntos que se encienden y crecen cerca del cursor, y que se
  hunde y apaga con el scroll (`kineOnda.setScroll`, misma API que tenía la
  onda). Los otros seis bocetos y las ondas originales están en
  `../kinesaude-carballo-bocetos`. Titular más grande y apretado con
  «bienestar» en degradado vertical (por letra, para que el corte del
  char-reveal no se note), etiquetas que flotan y salida con scrub.
- **Secciones.** Fotos con revelado por recorte (`clip-path`) y acercamiento;
  paneles con número gigante como marca de agua y texto escalonado al
  activarse; galería de tecnología con el título dentro del bloque fijado,
  tarjetas con índice grande y borde luminoso que se encogen lejos del
  centro y se marcan (`is-center`) al llegar, lectura «0N / 09», rejilla de
  osciloscopio con paralaje propio; reseñas con comillas, entrada escalonada
  e inclinación 3D sutil; chips de seguros con barrido salvia; caja de
  reserva con halo.
- **Global.** Grano fijo a 5,5 % (SVG `feTurbulence` en un `data:` URI, sin
  blend), cabecera que se esconde al bajar y vuelve al subir con barra de
  progreso, y el mando de dos densidades de abajo.

## Reemplazando la web anterior

Sustituye a la web actual en Aruba SuperSite (kinesaude.com). Solo se ha
reutilizado el contenido/datos listados abajo, ninguna estructura ni estilo
de esa web.

## Datos reales usados (tal cual, facilitados por el cliente)

| Dato | Valor |
|---|---|
| Nombre | KineSaúde · Clínica de Fisioterapia & Centro Diamagnético |
| Tagline | "Sintoniza con el bienestar" |
| Dirección | Rúa Luis Calvo, 27, bajo, 15102 Carballo, A Coruña |
| Teléfono | 668 52 89 69 |
| Email | info@kinesaude.com |
| Google | 5,0 ★ · 19 reseñas |
| Horario | Lunes a viernes 9:00–14:00 y 16:00–21:00 · Sábado y domingo cerrado |
| Registro Sanitario | C-15-004970 |
| Seguros | Sanitas, Occidental, Mapfre (+ otros, sin listar) |
| Reserva online | mnprogram.net (enlace exacto a la agenda pendiente) |
| Redes | Instagram @Kinesaudecarballo, Facebook "Kinesaude Carballo", YouTube @KinesaudeCarballo |

Tratamientos y equipos (fisioterapia manual, tratamiento deportivo,
rehabilitación funcional, mecanoterapia; TecnoSix, EPT, magnetoterapia,
termoterapia profunda, ultrasonido, ondas de choque, TENS, presoterapia,
tratamiento invasivo eco-guiado; Terapia Diamagnética con Bomba CTU Mega 20
y sus 5 ventajas; diatermia vista en el escaparate) son los que facilitó el
cliente — no se ha ampliado ni inventado ninguno. Las indicaciones de cada
equipo en la sección "Tecnología" son descripciones generales y conocidas
de cada técnica de electroterapia, no afirmaciones específicas de la clínica.

## Logo

El cliente envió una muestra más clara del logo real el 15-09-2026: círculo
en tinta con wordmark fino "Kine" / "Saúde" apilado, un punto **verde
salvia** sobre la "i" de "Kine" y un guion **terracota** junto a "carballo"
en minúsculas. Al no venir como archivo vectorial (era una imagen de trazo
irregular, tipo dibujo a mano), se ha rehecho limpio manteniendo la misma
idea: un anillo fino que se "abre" en la parte superior por donde cruza una
pequeña onda de señal, con un punto de sintonía en el mismo verde salvia
muestreado del original (`#6C8C7E`); el guion junto a "carballo" usa el
terracota real (`#9C7364`). Wordmark recompuesto en Outfit (peso ligero +
"Saúde" en semibold) en vez de trazar la tipografía redondeada original.

**Estos dos colores (verde salvia `#6C8C7E` y terracota `#9C7364`), tomados
directamente por muestreo de píxeles del logo real, sustituyen a la pareja
teal/ámbar usada en la primera versión de la web** — toda la web (botones,
subrayados, ondas del hero, firmas de onda de los equipos, chips, etc.) se
recoloreó para ir acorde con el logo real, no al revés. El grafito de fondo
y el blanco-niebla de las secciones informativas se mantienen igual.

`assets/img/logo/mark.svg` es el símbolo; `scripts/generate_brand.js`
(Playwright) genera los favicons (fondo claro, como el logo real sobre
papel) y la imagen Open Graph a partir de él.

## Fotografía

El brief pedía fotografía generada, pero este entorno no tiene herramienta
de generación de imagen, así que se usan fotografías con licencia Pexels
(uso comercial libre), elegidas por concepto (detalle de equipo, manos de
terapeuta, movilización, sala minimalista) y gradadas por script
(`scripts/process_photos.py`) hacia una paleta grafito + teal muy
desaturada para que convivan como una sola familia visual. Ninguna es una
foto real de KineSaúde; la web las etiqueta como "fotografía de ambiente"
en cada `figcaption`. IDs de Pexels usados: equipo `7789605`, manos
`20860604`, deporte `20860607`, movilización `20860612`, sala `10521232`.

## Estructura (propia, no calcada de AURA ni de Javi Teijeiro)

1. **Hero** (`#inicio`): canvas con una malla de puntos salvia que respira
   con una ola lenta y se enciende cerca del cursor ("sintonizar"), y que se
   hunde con el scroll; titular con char-reveal y degradado, etiquetas mono
   que flotan y CTA magnético "Reservar online".
2. **Terapia Diamagnética** (`#diamagnetica`, protagonista): las 5 ventajas
   reales listadas por el cliente, contador animado, foto de equipo.
3. **Tratamientos manuales** (`#tratamientos`): sticky-stack de 4 paneles
   (fisioterapia manual, deportivo, rehabilitación funcional, mecanoterapia).
4. **Tecnología** (`#tecnologia`): galería horizontal fijada (pin por CSS
   `position:sticky` + scrub de GSAP ScrollTrigger, con fallback a scroll
   nativo con snap en móvil/reduced-motion) con los 9 equipos de
   electroterapia, cada uno con su propia firma de onda SVG revelada por
   `stroke-dashoffset` al entrar en el track. El título viaja dentro del
   bloque fijado; las tarjetas se encogen lejos del centro y la central se
   marca; lectura «0N / 09» y rejilla de fondo con paralaje.
5. **Seguros** (`#seguros`): chips Sanitas / Occidental / Mapfre + "otras compañías".
6. **Reseñas** (`#resenas`): 5,0 ★ / 19 reseñas reales como dato grande;
   3 reseñas reales de Google (texto tal cual, solo limpieza ligera de
   erratas), con el nombre del cliente anonimizado a nombre + inicial
   (salvo una dejada por un negocio, "Ferretería Maneiro", que se
   mantiene completo por no ser el nombre de una persona).
7. **Contacto** (`#contacto`): datos, horario semanal con calculadora de
   abierto/cerrado en vivo (Europe/Madrid, dos franjas por día laborable),
   bloque de reserva online (mnprogram.net), mapa de Google por consentimiento,
   redes sociales.
8. **Footer**: Registro Sanitario C-15-004970, enlaces legales (placeholders honestos).

Divisor recurrente: una línea de señal SVG entre secciones que se aplana
("calma") o se agita ("tecnología") según el contenido que sigue.

## Quitar el mando de maqueta antes de entregar

El mando **solo aparece si la URL lleva `?revision`**. El enlace que se manda
a la clienta, sin el parámetro, sale limpio, y sin `?revision` tampoco se
aplica una densidad guardada.

Dos densidades:

- **Onda**: la onda en todas partes: canvas del hero, divisores de señal,
  marquee, cursor «sintoniza», galería fijada, paneles apilados, grano.
- **Sobria**: la onda solo donde significa algo (la firma de cada equipo).
  Intercambia dibujo por dato: cifras reales en el hero (5,0 ★, 19 reseñas,
  9 equipos, 4 tratamientos manuales), franja de datos de contacto en vez
  del marquee, tecnología en cuadrícula quieta, paneles desapilados, sin
  divisores ni grano.

Pasos para borrarlo. Están comprobados por `scripts/comprobar-borrado.mjs`,
que falla si queda algún rastro:

1. `index.html`:
   - En el `<script>` del `<head>`, borrar desde `/* la densidad guardada solo cuenta…` hasta el `} catch (e) {}` del final, y la mención `[MANDO DE MAQUETA]` de su comentario. **La red de seguridad de la cortina (`setTimeout` de 8 s) se queda.**
   - Borrar el `<div class="mando">` del final con su comentario y el párrafo marcado en el diálogo de cookies.
   - Quitar `densidad-onda` de la clase del `<html>`.
   - Si la clienta elige **Onda**: borrar el `<ul class="hero-cifras">` y el `<div class="franja-datos">`.
   - Si elige **Sobria**: antes de borrar, pasar sus reglas a CSS normal (quitar el prefijo `.densidad-sobria` en `style.css`), borrar el canvas del hero, el marquee, los divisores y el grano, y dejar cifras y franja.
2. `css/style.css`: borrar todo lo que hay entre `[MANDO DE MAQUETA]` y `fin del bloque [MANDO DE MAQUETA]`.
3. `js/main.js`: borrar la función `mandoMaqueta()` entre los mismos comentarios, la escucha de `densidad-cambiada` en `initTecnologia()`, la función `sobria()` con su uso en el cursor (o dejarla devolviendo `false`).
4. `js/scene-onda.js`: la comprobación de `densidad-sobria` al arrancar (dejar solo `start()`).
5. Pasar `node scripts/comprobar-borrado.mjs`.

## Antes de publicar como web de la clínica

- [ ] Resolver los pendientes de abajo (reserva, razón social/NIF, diatermia, aseguradoras).
- [ ] Borrar el mando y pasar `comprobar-borrado.mjs`.
- [ ] Quitar el `noindex` y cambiar `canonical`/`og:url` al dominio real.
- [ ] `node scripts/versionar.mjs` y `node scripts/verify.js`.

## Lo que falta por confirmar con la clínica

- **Enlace exacto de reserva** en mnprogram.net (de momento el botón lleva a `mnprogram.net`, su plataforma, no a la agenda concreta de KineSaúde).
- **Nombres y titulaciones del equipo** (no hay sección de equipo hasta tener estos datos).
- **Fotografía real** de la clínica y del equipo (Bomba CTU Mega 20 incluida) para sustituir la fotografía de ambiente.
- **Precios** de cualquier tratamiento (no se ha mostrado ninguno).
- **Indicaciones exactas de la Diatermia** (solo confirmada por aparecer en el cartel del escaparate).
- **Lista completa de aseguradoras** más allá de Sanitas, Occidental y Mapfre.
- **Razón social y NIF** para el aviso legal y el footer.
- **Archivo vectorial del logo original**, si existe, para sustituir la reconstrucción en Outfit.
