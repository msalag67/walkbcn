# Prueba con turistas reales

WalkBCN es una web: no hace falta que sea una app oficial ni que esté en una tienda. Un turista solo necesita abrir el enlace o escanear un QR. Que esté en GitHub Pages no cambia nada para quien la usa. Funciona en cualquier móvil y, si guarda el paseo, también sin conexión.

## Qué queremos saber

1. **¿Les sirve?** ¿Terminan un paseo y escuchan las historias?
2. **¿Volverían a usarla o la recomendarían?** Esto es lo que mide el encaje con el mercado (*product-market fit*).
3. **¿Dónde se pierden?** Formulario, mapa, audio, idioma.

## Material

- `docs/tarjetas-qr.pdf`: 6 tarjetas por A4 con tres QR distintos (`qr1`, `qr2`, `qr3`). Usa un QR distinto en cada sitio o cada día. Así, en el recuento anónimo y en la encuesta se ve de dónde vienen las visitas.
- El enlace con el código: `https://msalag67.github.io/walkbcn/?src=qr1`
- Al terminar el paseo, la web ofrece la encuesta de 4 preguntas (la misma de la sesión 9).

## Dónde encontrar turistas (sin molestar)

- **Recepciones de hostales y albergues** (Gràcia, Poble-sec, Poblenou). Pide permiso para dejar tarjetas o para estar 30 minutos en la zona común. Suelen aceptar si es un proyecto de estudiantes y gratuito.
- **Puntos de encuentro de los *free tours***, al acabar el tour. No durante, y sin competir con el guía.
- **Conocidos de conocidos que estén de viaje**, o compañeros de intercambio que reciban visitas.
- **Grupos de viajeros** (Couchsurfing Barcelona, foros de viajes). Primero lee sus normas; algunos no permiten promoción.

**Evita** abordar a gente en monumentos, colas o terrazas. Es justo lo que WalkBCN pide no hacer.

## Dos formatos

**A. Prueba acompañada (20–30 min, 3–5 personas).** La que más enseña.

1. Pide permiso: "Somos estudiantes de Esade y probamos una web gratuita de paseos con audio. ¿Nos ayudas 20 minutos? No guardamos tu nombre."
2. Dales solo el QR y una situación: "Tienes una hora libre por aquí. Haz lo que harías de verdad."
3. No expliques nada. Si te preguntan, contesta "¿qué harías tú?" y apúntalo.
4. Acompáñalos hasta la primera o segunda parada y observa: ¿entienden el mapa?, ¿encuentran el audio?, ¿cambian de idioma?
5. Al final: encuesta en la web y tres preguntas abiertas: ¿qué usarías hoy en su lugar?, ¿qué te sobró?, ¿qué te faltó?

**B. Prueba suelta (tarjetas).** Dejas tarjetas y no estás presente. Mide el uso real, sin tu influencia. Necesita el recuento anónimo activado (abajo) y paciencia: espera pocas respuestas por cada 50 tarjetas.

## Hoja para apuntar (una fila por persona)

| # | Fecha y lugar (QR) | Turista / residente, de dónde, edad aprox. | Idioma | Intereses y tiempo elegidos | ¿Llegó a la 1.ª parada? | ¿Escuchó el audio? ¿Hasta el final? | Dónde dudó (palabras exactas) | ¿Lo usaría en su próximo viaje? ¿En lugar de qué? | ¿Contestó la encuesta? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | |

**Reglas:** apunta lo que hacen y sus palabras exactas, no tu interpretación. "Está chulo" no cuenta como prueba; "lo usaría en vez del free tour" sí.

## Privacidad y respeto

- No pidas nombres ni correos, salvo que quieran que les escribas, y en ese caso guárdalos aparte.
- No grabes voz ni caras sin permiso explícito.
- No compartas los datos fuera del equipo.
- La encuesta ya pregunta "¿Quién eres?", así que podremos separar turistas de amigos, como en la sesión 9.

## Activar el recuento anónimo (opcional, recomendado para el formato B)

La web ya está preparada, pero no envía nada hasta que lo actives.

1. Crea una cuenta gratuita en GoatCounter (goatcounter.com) con el código `walkbcn`. Es gratis para proyectos no comerciales, no usa cookies y no guarda datos personales.
2. Dime el código y lo pongo en `index.html` (`ANALYTICS.goatcounter`). La ventana de privacidad lo explicará y se puede desactivar.
3. Verás eventos como `Walk finished`, `Directions opened`, `Survey opened`, `Walk saved offline`, con el `src` del QR.

## Qué hacer con los resultados

- 5 personas bastan para ver los problemas de uso. Para el porcentaje de "muy decepcionados" hacen falta unas 40 respuestas: **dilo si son menos**.
- Pásame la hoja y las respuestas. Las convierto en cambios concretos y en el registro de `architecturedoc.md`.
