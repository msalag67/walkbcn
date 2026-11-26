# Cuentas de WalkBCN: cómo activarlas

La cuenta es **opcional**. Sirve para guardar el progreso (historias escuchadas, retos,
preferencias e idioma) y recuperarlo en otro móvil u ordenador. Sin cuenta, todo sigue
funcionando igual.

Usa el mismo proyecto de Supabase que «Jugar con amigos». El código ya está en la web; solo
falta configurar Supabase. Hasta que lo hagas, el botón «Inicia sesión» aparece, pero iniciar
sesión no funcionará.

Formas de entrar:

| Forma | Coste | Qué hay que hacer |
|---|---|---|
| Código por correo | Gratis | Pasos 1, 2, 3 y 4 |
| Correo y contraseña | Gratis | Pasos 1, 2 y 3 (y el 4 para recuperar la contraseña) |
| Google | Gratis | Paso 5 |
| Apple | 99 USD al año (Apple Developer Program) | Paso 6 |

---

## 1. Crear la tabla (una vez)

1. Entra en https://supabase.com/dashboard y abre el proyecto de WalkBCN.
2. Menú izquierdo: **SQL Editor** → **New query**.
3. Copia todo el contenido de `supabase/accounts.sql`, pégalo y pulsa **Run**.
4. Debe salir «Success. No rows returned».

Crea la tabla `user_progress` (una fila por persona, que solo puede leer y escribir ella misma)
y la función para «Borrar mi cuenta».

## 2. Direcciones permitidas

**Authentication → URL Configuration**:

- **Site URL**: `https://msalag67.github.io/walkbcn/`
- **Redirect URLs** → **Add URL**: `https://msalag67.github.io/walkbcn/`
  (y, para probar en local, `http://localhost:8773/`)

Si algún día tenéis dominio propio, añadid también la dirección nueva.

## 3. Correo: activar y enviar con vuestro propio servicio

**Authentication → Sign In / Providers → Email**: que esté **activado**.
Deja activado «Confirm email» (al crear cuenta con contraseña, se confirma el correo).

**Importante:** el envío de correos que trae Supabase de serie solo sirve para pruebas: manda muy
pocos correos por hora y solo a las direcciones del equipo del proyecto. Para que llegue a
cualquier visitante hay que conectar un servicio de envío (SMTP). Hay opciones gratuitas, por
ejemplo Resend o Brevo:

1. Crea la cuenta en el servicio y verifica un remitente (para usar un dominio propio
   necesitarás añadir registros DNS; si no tenéis dominio, usad el remitente que os dé el servicio).
2. Copia los datos SMTP que te da (servidor, puerto, usuario, contraseña).
3. En Supabase: **Project Settings → Authentication → SMTP Settings** → **Enable Custom SMTP**,
   pégalos y pon como remitente «WalkBCN».

## 4. Que el correo lleve un código (y no solo un enlace)

**Authentication → Emails → Templates → Magic Link**. Cambia el asunto y el cuerpo por:

Asunto:

```
Tu código de WalkBCN: {{ .Token }}
```

Cuerpo:

```html
<h2>Tu código de WalkBCN</h2>
<p>Escribe este código en la app para iniciar sesión:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>O abre este enlace en el mismo dispositivo: <a href="{{ .ConfirmationURL }}">iniciar sesión</a></p>
<p>Si no has pedido este correo, ignóralo.</p>
```

Haz lo mismo en la plantilla **Confirm signup** si quieres que el primer correo también traiga
el código. Las plantillas **Reset Password** y **Confirm signup** pueden quedarse como están: sus
enlaces vuelven a la web y la app los entiende.

## 5. Google (gratis)

1. https://console.cloud.google.com → crea un proyecto «WalkBCN».
2. **APIs & Services → OAuth consent screen**: tipo «External», nombre «WalkBCN», tu correo de
   soporte, y como dominio autorizado `supabase.co`. Publica la app («Publish app»).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → tipo
   «Web application».
   - **Authorized redirect URIs**: `https://bbeeuykvrmpixztjtvod.supabase.co/auth/v1/callback`
4. Copia el **Client ID** y el **Client secret**.
5. En Supabase: **Authentication → Sign In / Providers → Google** → actívalo y pega los dos valores.
6. En `data/multiplayer-config.js`, cambia `providers: []` por `providers: ['google']`
   (o pídeselo a Claude) y sube el cambio. Entonces aparece el botón «Continuar con Google».

## 6. Apple (de pago)

Sign in with Apple exige una cuenta del **Apple Developer Program (99 USD al año)**.

1. En https://developer.apple.com → **Certificates, Identifiers & Profiles**:
   - crea un **App ID** con «Sign in with Apple» activado,
   - crea un **Services ID** (será el «Client ID»), activa «Sign in with Apple» y configura:
     dominio `bbeeuykvrmpixztjtvod.supabase.co` y Return URL
     `https://bbeeuykvrmpixztjtvod.supabase.co/auth/v1/callback`,
   - crea una **Key** con «Sign in with Apple» y descarga el archivo `.p8`.
2. En Supabase: **Authentication → Sign In / Providers → Apple** → actívalo y sigue sus
   instrucciones para generar el «secret» con la Key, el Team ID y el Services ID.
   Apple obliga a renovar ese secret cada 6 meses.
3. En `data/multiplayer-config.js`: `providers: ['google', 'apple']` y sube el cambio.

## Comprobar que funciona

1. Abre la web en el móvil → **Inicia sesión** → escribe tu correo → **Envíame un código**.
2. Escribe el código del correo. Debe salir «Has iniciado sesión».
3. Escucha una historia. En otro dispositivo, inicia sesión con el mismo correo: la parada debe
   salir como escuchada.
4. En Supabase → **Table Editor → user_progress** verás una fila por cuenta.

## Qué se guarda y qué no

- Se guarda: correo (en Supabase Auth) y, en `user_progress`, historias escuchadas, el
  aprendizaje (intereses elegidos, historias reproducidas y terminadas, 👍/👎, y si lo has
  desactivado), el progreso de los retos y el idioma.
- No se guarda: ubicación, rutas, búsquedas ni analítica.
- «Borrar mis datos» en «Tus datos y privacidad» también borra la copia de la cuenta.
- «Borrar mi cuenta» elimina la cuenta y su progreso del servidor.
