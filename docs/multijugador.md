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
- **Pendiente: prueba real con dos móviles** en el proyecto Supabase real: crear sala en uno, unirse con el enlace en el otro, preparados, empezar, completar misiones (con GPS real en la calle), recargar a mitad, abandonar, ver la clasificación final.
