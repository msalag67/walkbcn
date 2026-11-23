# Jugar con amigos (Speed Race): puesta en marcha

El multijugador usa **Supabase** (plan gratuito). No hay servidor propio: la web sigue en GitHub Pages y habla con Supabase desde el navegador. Mientras `data/multiplayer-config.js` esté vacío, «Jugar con amigos» dice que aún no está configurado y todo lo demás funciona igual.

## Configurar (una vez, unos 10 minutos)

1. Crea una cuenta y un proyecto gratuito en https://supabase.com (región Europa). Guarda la contraseña de la base de datos en un sitio seguro; no hace falta para la web.
2. **Authentication → Sign In / Providers → Anonymous sign-ins: activado.** Cada móvil entra como usuario anónimo, sin email ni cuenta.
   - Recomendado: en *Authentication → Attack Protection* activa el CAPTCHA o revisa los límites de registros anónimos si la web se hace pública a mucha gente.
3. **SQL Editor → New query →** pega todo `supabase/multiplayer.sql` → **Run**. Crea las tablas, las reglas de seguridad y las funciones. Se puede volver a ejecutar sin perder nada.
4. **Project Settings → API**: copia la *Project URL* y la clave **anon public** en `data/multiplayer-config.js`:
   ```js
   window.WALKBCN_MP = { url: 'https://xxxx.supabase.co', anonKey: 'eyJ...' };
   ```
   La clave *anon* es pública por diseño (va en la web). **Nunca** pongas la clave *service_role* (`check.mjs` falla si la ve).
5. Ejecuta `node scripts/stamp-versions.mjs` y publica.

## Seguridad (qué impide qué)

- Las tablas tienen RLS activado sin políticas y sin permisos directos: nadie puede leerlas ni escribirlas desde el navegador.
- Todo pasa por funciones (`mp_*`) que comprueban: que estás en la sala; que solo el anfitrión inicia; que la sala está esperando, tiene 2–5 jugadores y todos están preparados; que las misiones se completan en orden y una sola vez; que solo cambias tu propia fila.
- Los tiempos (inicio, llegada de cada jugador) los pone el reloj de la base de datos (`now()`), no el móvil.
- Penalización por pista y límites de jugadores: tabla `mp_modes` (un solo sitio).
- Salas: caducan a las 24 h; las antiguas se borran al crear salas nuevas.

**Límites honestos:** el GPS lo comprueba el móvil, y las respuestas están en la web; alguien con conocimientos podría falsear su posición o su progreso propio (nunca el de otros). Por eso las misiones hechas sin ubicación salen como «no verificado», y el ranking no debe tratarse como una competición con premios.

## Probar

- Local, sin Supabase: `python3 -m http.server 8642` y `PGLITE=<carpeta con @electric-sql/pglite> node evals/multiplayer-e2e.mjs` (dos navegadores contra el mismo SQL ejecutado en Postgres/PGlite).
- **Hecho (22 nov 2026): prueba real con dos móviles** en el proyecto Supabase real, en la calle: sala por enlace, preparados, inicio compartido, misiones con GPS real y clasificación final. Funcionó bien.

## Time Attack (fase 3C)

- Mismas salas, sala de espera, sincronización y GPS que Speed Race. El anfitrión elige 30, 60 o 90 minutos; todos tienen los mismos 7 objetivos de «Cazador modernista» y los hacen en el orden que quieran.
- Puntos por objetivo: 100 / 150 / 200 según la dificultad de la prueba; una pista extra resta 50 en ese objetivo (mínimo 50). Solo puntúan los objetivos con la ubicación comprobada. Desempate: más objetivos encontrados y, después, quién llegó antes a su puntuación. Todo se configura en `mp_modes` y `mp_challenges.points` (el servidor decide los puntos; `check.mjs` compara los puntos del SQL con `data/challenges.js`).
- El tiempo lo marca el servidor (`ends_at`): al pasar, `mp_ta_complete` rechaza respuestas (`time_up`) y la sala se cierra al consultarla.
- **DEMO** («Probar DEMO»): en un solo dispositivo, sin sala ni servidor; mismas misiones, preguntas y puntos, «Simular llegada», 3 rivales simulados con un horario fijo, +10 min, terminar y reiniciar. No envía ni guarda nada.
- **Para activarlo** hay que volver a ejecutar `supabase/multiplayer.sql` en el SQL Editor (añade columnas y funciones; sustituye `mp_create_room` por una versión con duración, compatible con Speed Race). Hacerlo **antes** de publicar la web nueva.
- Pruebas: `PGLITE=<carpeta> node evals/time-attack-e2e.mjs` (DEMO sin servidor + partida con dos navegadores contra el SQL en PGlite).

## Bingo Battle (fase 3D)

- De 2 a 5 jugadores. Mismas salas, invitaciones, sala de espera, reconexión, sincronización y GPS que los otros modos. Todos tienen el mismo tablero de 3 × 3 (las casillas de «Bingo de la Rambla y el Raval») y las hacen en el orden que quieran.
- **Gana la primera línea confirmada** (fila, columna o diagonal). Lo decide el servidor en `mp_bb_complete`: bloquea la sala (`select … for update`), apunta la casilla y, si completa una línea, cierra la partida con `winner_id` y `winner_line`. Dos casillas decisivas a la vez se procesan una detrás de otra: nunca hay dos ganadores.
- Solo cuentan las casillas con la ubicación comprobada y la respuesta correcta; una casilla repetida no cuenta dos veces.
- Duración: 60 minutos (`ends_at`). Si nadie hace línea, la partida termina **sin ganador** y se conservan las casillas de cada uno.
- Durante la partida solo se ve cuántas casillas lleva cada rival (nunca cuáles). Al terminar se muestra la línea ganadora.
- **DEMO**: en un solo dispositivo, sin sala ni servidor; «Simular llegada», 3 rivales simulados, «Avanzar a los rivales», «Rival cerca de hacer línea», terminar, reiniciar y salir. No envía ni guarda nada.
- **Para activarlo** hay que volver a ejecutar `supabase/multiplayer.sql` en el SQL Editor (añade el modo, el tablero, dos columnas en `mp_rooms` y la función `mp_bb_complete`; se puede ejecutar varias veces). Hacerlo **antes** de publicar la web nueva.
- Pruebas: `PGLITE=<carpeta> node evals/bingo-battle-e2e.mjs` (DEMO sin servidor + partida real con dos navegadores, línea ganadora y fin de tiempo sin ganador). `REAL=1` usa el proyecto real (sin la parte del fin de tiempo).
