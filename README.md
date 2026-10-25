# WalkBCN — MVP

Guía de rutas a pie por Barcelona: eliges intereses → ruta de 4–6 paradas → mapa → historia en audio en cada parada.

Pestaña **Activities**: eliges categoría (restaurantes, nightlife) y preferencias → sitios seleccionados a mano → "See & book" abre el sitio en Google Maps (sin reservas ni pagos dentro de la web).

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

### Revisar antes de enseñarlo

Abre `content/review.md`: tiene todas las historias generadas y, para cada una, los datos (fechas, nombres, cifras) que conviene comprobar. Si cambias un texto, edita `content/stories.json` y ejecuta `npm run generate -- --audio` para volver a grabar solo lo que cambió.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La web (una sola página) |
| `data/stops.js` | Las 19 paradas: coordenadas, foto, historia base, consejo |
| `data/activities.js` | Activities: restaurantes y nightlife (filtros, sitios y descripciones). Para añadir un sitio o una categoría, se edita aquí |
| `content/stories.json` | Historias generadas (fuente) — `stories.js` es la copia que lee la web |
| `content/review.md` | Hoja de revisión de las historias |
| `audio/` | Audios generados |
| `scripts/generate.mjs` | El generador |
