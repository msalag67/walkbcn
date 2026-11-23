# Shared Mystery: añadir las narraciones grabadas (ElevenLabs u otra herramienta)

La revelación final de cada aventura tiene un relato escrito en 7 idiomas. Mientras no haya grabación, la página lo lee con la voz del dispositivo. Para añadir una grabación **no hay que tocar el código** del juego, solo dos cosas: el archivo de audio y una línea en `data/shared-mystery-audio.js`.

Aventuras (identificador estable): `sm-barcino-layers` (Barcelona antigua), `sm-modernisme-secret` (Modernismo), `sm-poblenou-factories` (Barcelona industrial), `sm-port-sea` (Barcelona marítima).
Idiomas: `ca`, `es`, `en`, `fr`, `de`, `it`, `zh`. Son 28 grabaciones posibles; se pueden añadir de una en una.

## Pasos

1. **Copiar el texto exacto** que hay que grabar:
   ```
   node scripts/sm-audio.mjs --text sm-port-sea es
   ```
   Se graba el relato (el título de la primera línea es opcional). No cambies el texto al grabar: la grabación tiene que decir lo mismo que se ve en pantalla.
2. **Grabar** con la voz elegida y exportar en **MP3** (vale también M4A/AAC). Guardar como
   `audio/shared-mystery/<aventura>.<idioma>.mp3`, por ejemplo `audio/shared-mystery/sm-port-sea.es.mp3`.
   Recomendado: mono, 64–96 kbps (un relato de 2–3 min ocupa 1–2 MB).
3. **Ver el textHash** de ese texto:
   ```
   node scripts/sm-audio.mjs
   ```
4. **Añadir la entrada** en `data/shared-mystery-audio.js`:
   ```js
   window.WALKBCN_SM_AUDIO = {
     'sm-port-sea': {
       es: { file: 'audio/shared-mystery/sm-port-sea.es.mp3', textHash: '<el de la tabla>',
             source: 'ElevenLabs', voice: '<nombre de la voz>', licence: '<plan / condiciones de uso comercial>',
             by: '<quién la generó>', added: '2026-12-01' },
     },
   };
   ```
   `source` y `licence` son obligatorios (lo comprueba `node scripts/check.mjs`): anota con qué herramienta y plan se generó y si permite uso comercial.
5. Ejecutar `node scripts/stamp-versions.mjs` y `node scripts/check.mjs`. Abrir una aventura en la DEMO, terminarla y pulsar «Escuchar»: debe decir «Narración grabada».

## Cómo se comporta la página

- Solo usa la grabación si existe la entrada **y** su `textHash` coincide con el texto actual. Si alguien cambia el relato, el hash cambia: la página vuelve a la voz del dispositivo (nunca reproduce un audio que no coincide con el texto) y `node scripts/sm-audio.mjs` marca esa grabación como **OUTDATED** para regrabarla.
- Si el archivo falta o no carga, lee el texto con la voz del dispositivo. El texto siempre está en pantalla.
- Solo suena una narración a la vez: al pulsar «Escuchar» se para la audioguía de Explorar, y al cambiar de pestaña, de idioma o salir de la partida se para la narración.
- Los audios se sirven como el resto de la web (hosting estático) y se guardan en caché como las audioguías.

## Qué no hace

No llama a ElevenLabs ni a ninguna API, no genera voz por su cuenta y no necesita claves. Las grabaciones se generan fuera de la web y se añaden como archivos.
