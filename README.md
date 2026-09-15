# KineSaúde · Carballo — web estática

Plantilla nº 3 de la familia **fisioterapia** de la librería WEBS NEGOCIOS
(junto a AURA Carballo y Fisioterapia Javi Teijeiro), y estructuralmente
distinta de ambas: concepto **"Sintoniza con el bienestar"** — señal,
frecuencia, onda. Grafito + un verde salvia + un acento terracota (paleta
tomada del logo real del cliente, ver "Logo" abajo), tipografía Outfit +
JetBrains Mono, hero de canvas con sinusoides interactivas (no partículas,
no pinceladas, no agua), galería horizontal fijada para los 9 equipos de
electroterapia con una "firma de onda" SVG distinta por aparato, y la
Terapia Diamagnética como sección protagonista propia.

- HTML/CSS/JS estático, sin frameworks ni build. Sirve la carpeta o abre `index.html`.
- Responsive desde 360 px. Sin cookies de terceros (el mapa de Google solo se carga al pulsar "Ver mapa").
- Motion: Lenis (único motor de scroll suave) + GSAP ScrollTrigger vía CDN (mismas versiones que el resto de la librería), con bypass completo bajo `prefers-reduced-motion`.
- Verificado con Playwright (`scripts/verify.js`): 0 errores JS, 0 longtasks >50ms durante ~2s de la onda del hero y durante el scroll completo, cookies/mapa/menú/sticky-stack/galería funcionando, reduced-motion, sin-JS, y sin scroll horizontal a 1440/400/360 px. Ver `scripts/verify-report.json` y las capturas en `screenshots/`.

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

1. **Hero** (`#inicio`): canvas de sinusoides superpuestas en teal que
   respiran despacio y se modulan por la posición del cursor (gradiente que
   vira a ámbar cerca del puntero — "sintonizar"), titular con char-reveal,
   etiquetas mono flotantes y CTA magnético "Reservar online".
2. **Terapia Diamagnética** (`#diamagnetica`, protagonista): las 5 ventajas
   reales listadas por el cliente, contador animado, foto de equipo.
3. **Tratamientos manuales** (`#tratamientos`): sticky-stack de 4 paneles
   (fisioterapia manual, deportivo, rehabilitación funcional, mecanoterapia).
4. **Tecnología** (`#tecnologia`): galería horizontal fijada (pin por CSS
   `position:sticky` + scrub de GSAP ScrollTrigger, con fallback a scroll
   nativo con snap en móvil/reduced-motion) con los 9 equipos de
   electroterapia, cada uno con su propia firma de onda SVG revelada por
   `stroke-dashoffset` al entrar en el track.
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

## Lo que falta por confirmar con la clínica

- **Enlace exacto de reserva** en mnprogram.net (de momento el botón lleva a `mnprogram.net`, su plataforma, no a la agenda concreta de KineSaúde).
- **Nombres y titulaciones del equipo** (no hay sección de equipo hasta tener estos datos).
- **Fotografía real** de la clínica y del equipo (Bomba CTU Mega 20 incluida) para sustituir la fotografía de ambiente.
- **Precios** de cualquier tratamiento (no se ha mostrado ninguno).
- **Indicaciones exactas de la Diatermia** (solo confirmada por aparecer en el cartel del escaparate).
- **Lista completa de aseguradoras** más allá de Sanitas, Occidental y Mapfre.
- **Razón social y NIF** para el aviso legal y el footer.
- **Archivo vectorial del logo original**, si existe, para sustituir la reconstrucción en Outfit.
