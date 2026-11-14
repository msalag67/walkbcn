# WalkBCN — MVP

Guía de rutas a pie por Barcelona: eliges intereses → ruta de 4–6 paradas → mapa → historia en audio en cada parada.

Pestaña **Activities**: eliges categoría (restaurantes, vida nocturna, museos, miradores, cafés, con niños, comercio local, deportes) y preferencias → sitios seleccionados a mano → "Ver en Google Maps" (sin reservas, pagos ni comisiones dentro de la web).

Cobertura: centro de Barcelona y Poblenou–Clot.

## Abrir la web

```bash
npm run serve
```
y abre http://localhost:8642 (también funciona haciendo doble clic en `index.html`).

## Contenido generado con IA

`scripts/generate.mjs` crea el contenido **antes**, no mientras se usa la web:

1. **Historias por interés** — Claude reescribe cada parada desde cada interés que tiene (p. ej. Casa Batlló para amantes de la arquitectura y para amantes del arte). La web muestra la versión que encaja con lo que eligió el usuario.
2. **Audio** — convierte cada historia en un archivo de audio (`audio/`). Gratis con la voz de macOS, o voz natural con ElevenLabs si hay clave.

Si falta algo, la web usa la historia original y la voz del navegador, así que nunca se rompe.

### Generar

```bash
npm install                                   # una vez
export ANTHROPIC_API_KEY=sk-ant-...           # clave de https://platform.claude.com
export ELEVENLABS_API_KEY=...                 # opcional, para voz natural
npm run generate
```

- Solo genera lo que falta; se puede parar y relanzar.
- `-- --force` lo rehace todo · `-- --only=casa-batllo` una sola parada · `-- --text` / `-- --audio` solo una parte.
- `-- --mock` prueba todo el proceso sin llamar a la IA.

### Idiomas y duraciones

`scripts/translate.mjs` crea las versiones corta y larga de cada historia y lo traduce todo (historias, consejos y Activities) al catalán, castellano, francés, alemán, italiano y chino. También graba el audio de la versión normal en cada idioma. Lo guarda en `content/i18n/`.

```bash
node scripts/translate.mjs               # todo lo que falte
node scripts/translate.mjs --lang=fr     # solo un idioma
node scripts/translate.mjs --audio       # solo grabar audio (sin clave)
```

El audio en castellano usa la voz de ElevenLabs `RxPoOxDaJiOdJGnMMaql` (en `.mp3`) si hay `ELEVENLABS_API_KEY`; si no, la voz Mónica de macOS. Para regrabarlo:

```bash
ELEVENLABS_API_KEY=... node scripts/translate.mjs --audio --lang=es
```

Los textos de la interfaz (botones, avisos…) están en `data/ui.js` y se editan a mano.

### Revisar antes de enseñarlo

Abre `content/review.md`: tiene todas las historias generadas y, para cada una, los datos (fechas, nombres, cifras) que conviene comprobar. Si cambias un texto, edita `content/stories.json` y ejecuta `npm run generate -- --audio` para volver a grabar solo lo que cambió.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La web (una sola página) |
| `data/stops.js` | Las 66 paradas: coordenadas, foto, historia base, consejo, zona; y `WALKBCN_NOTICES`, los avisos con fecha |
| `data/cards.js` | Generado: ficha práctica de cada parada (qué mirar, dónde escuchar, visita, sensibilidad, segunda foto, fuentes) y autor + licencia de cada foto |
| `data/activities.js` | Activities: filtros, sitios y descripciones. Los sitios nuevos llevan `why`, `priceEvidence` y `sources` con fecha |
| `content/manual/` | Contenido escrito por el equipo, sin IA: una parada por archivo (historia en 3 longitudes × 7 idiomas, consejo, ficha), `_cards.json`, `_tips.json`, `_activities.json`, `_photos.json` |
| `scripts/import-manual.mjs` | Pasa `content/manual/` a `content/i18n/`, `data/activities.js` y `data/cards.js` (`--photos` vuelve a consultar autor y licencia en Wikimedia Commons) |
| `data/tips.js` | Pestaña Consejos: los tips en los 7 idiomas y `formUrl`, el enlace al formulario de "Propón un consejo" (vacío = botón oculto). Para añadir un tip aprobado, se edita aquí |
| `content/stories.json` | Historias generadas (fuente) — `stories.js` es la copia que lee la web |
| `content/review.md` | Hoja de revisión de las historias |
| `audio/` | Audios generados |
| `scripts/generate.mjs` | El generador |
| `scripts/check.mjs` | Comprobaciones rápidas: textos en los 7 idiomas, paradas, avisos con fecha y fuente, audios y temas (`node scripts/check.mjs`) |
| `evals/audit-scenarios.js` | Los escenarios de la auditoría de noviembre de 2026, para pegar en la consola del navegador |
| `evals/evolution-scenarios.js` | 20 escenarios de la evolución del 14/11/2026 (Poblenou–Clot, zonas, imprescindibles, edición de ruta, filtros, lugares retirados, rutas antiguas, fotos, avisos de problemas) |

### Añadir una parada o un sitio (sin coste de IA)

1. Comprueba el lugar: nombre oficial, coordenadas (OpenStreetMap), si sigue abierto, condiciones de acceso y una foto de Wikimedia Commons con licencia libre.
2. Escribe `content/manual/<id>.json` (copia uno existente) y añade la parada en `data/stops.js` con la historia normal en inglés. Para Activities, edita `content/manual/_activities.json`.
3. `node scripts/import-manual.mjs --photos`
4. Graba el audio gratis con las voces del Mac: `node scripts/generate.mjs --audio --only=<id>` (inglés) y `node scripts/translate.mjs --audio --only=<id>` (los otros 6). Sin `ELEVENLABS_API_KEY` el castellano usa la voz Mónica.
5. `node scripts/check.mjs` y los escenarios de `evals/` en el navegador.

### Avisos con fecha en una parada

En `data/stops.js`, `WALKBCN_NOTICES` guarda avisos prácticos (obras, traslados, qué queda de un lugar) que solo se muestran entre `from` y `until`, con la fuente y el día en que se comprobó (`checked`). Reglas:

- `review`: fecha en la que hay que volver a comprobarlo. Pasada esa fecha el aviso se sigue viendo, pero marcado como "no comprobado desde…".
- `confirmed: false`: algo anunciado (una reapertura) que aún no hemos visto; la ficha dice "anunciado", nunca lo da por hecho.
- `at`: mientras el aviso está activo, la ruta y las indicaciones van a ese punto (p. ej. los puestos de un mercado provisional).
- `closed: true`: mientras está activo, la parada no entra en rutas nuevas.

### Comunicar un problema

Cada parada y cada sitio de Activities tiene "Comunicar un problema": abre el formulario de sugerencias que ya usamos para los consejos (`formUrl` de `data/tips.js`), rellenado con el lugar, el tipo de problema y el idioma. El correo es opcional. Nada se publica sin que el equipo lo revise. Si se cambia el formulario, hay que actualizar `REPORT_FIELD` en `index.html` (el identificador de la pregunta de texto).
