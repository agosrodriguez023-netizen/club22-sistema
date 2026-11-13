# Manual de marca y sistema de diseño · Club 22

**Alcance:** este manual define la identidad visual y el sistema de diseño del **sistema de gestión** de Club 22 (ventas, caja, stock, usuarios). No cubre redes sociales ni cartelería del local.
**Contexto de uso:** salón y barra con poca luz, pantallas tipo tablet/notebook, uso rápido y repetido. Por eso el sistema es **oscuro por defecto**.
**Equipo:** Guadalupe Martínez, Agostina Fandiño Rodríguez · **Versión:** 1.0 · 13/11/2026
**Archivo de tokens:** [`tokens.css`](./tokens.css) (todas las variables `:root` de este manual).

---

## 1. Logotipo

Archivo de referencia: [`marca/logo-club22.jpg`](./marca/logo-club22.jpg) (imagen cuadrada de perfil, fondo bordo plano).

### 1.1 Descripción de su construcción
El logo es una composición **centrada y apilada en tres niveles**, en **blanco sobre bordo plano**. En la imagen original se ve recortado en círculo (con dos aros finísimos, casi invisibles, como guía de recorte); el bordo es el fondo, no un dibujo aparte.

1. **"Club"**: palabra en **script de pincel**, trazo grueso y cursiva, con la "C" inicial muy grande y la "b" final con rúbrica que sube. Es el elemento protagonista y lleva una **sombra suave** hacia abajo y a la derecha. Ocupa casi el 60 % del ancho útil.
2. **"22"**: en una **serif fina de alto contraste** (estilo "Didot"/"Bodoni"), de gran tamaño y trazo delgado. No es script. Va **debajo de "Club" y se superpone**: los trazos de la "u" y la "b" del script bajan y se montan sobre la parte superior de los dos números. Es la pieza que da la sensación de "sello".
3. **"VINERIA"**: **sans-serif de mayúsculas, trazo fino y tracking muy amplio**, mucho más chica que el resto y centrada al pie, más angosta que el "22". Se escribe **sin tilde** en el logo; se respeta así.

Contraste de ideas: el pincel aporta calidez y movimiento; los números finos aportan elegancia; la sans espaciada aporta orden. De ahí sale el sistema: títulos con carácter (Playfair Display, serif de alto contraste como el "22"), interfaz neutra y legible (Inter).

Color del fondo en la imagen: bordo muy cercano a `#6B0F0A` (el token `--bordo`). **[A CONFIRMAR]** con el cliente el valor exacto en el archivo original. Se generó una **vectorización automática** del JPG en `marca/` (`logo-club22-principal.svg`, `-sobre-oscuro.svg`, `-blanco.svg`, `-negro.svg`): sirve para la demo, pero pierde la sombra y suaviza detalles; **[A CONFIRMAR]** pedir el archivo original al diseñador para la versión definitiva.

### 1.2 Versiones

| Versión | Cuándo se usa | Composición |
|---|---|---|
| **Principal** | Pantalla de ingreso, encabezado en escritorio, tickets en pantalla | "Club" + "22" + "VINERIA" apilados, blancos, sobre bordo `#6B0F0A`. Sobre el fondo oscuro de la aplicación (`#111111`) se enmarca en un **círculo bordo con aro blanco de 2 px**, porque el bordo solo sobre negro tiene apenas 1,53:1 y el logo se "pierde". |
| **Monocromática** | Impresión en un color, sellos, fondos que no admiten bordo | Todo en **blanco** sobre fondo oscuro, o todo en **negro** `#111111` sobre blanco. Sin sombra. |
| **Reducida** | Favicon, pestaña, encabezado móvil, ícono de app | Solo **"22"** en blanco (serif fina, engrosada un poco para que se lea) sobre círculo bordo. Se usa cuando el ancho disponible es menor a 96 px, donde "VINERIA" deja de leerse. |

### 1.3 Área de protección
Llamamos **X** a la altura del "22". Alrededor del logo debe quedar libre **½ X por cada lado** como mínimo (1 X recomendado). Dentro de esa zona no va texto, borde, ícono ni otro logo.
**Tamaños mínimos:** versión principal **96 px** de ancho en pantalla (25 mm impreso); versión reducida **24 px**.

### 1.4 Cuatro usos incorrectos
1. **Deformarlo**: estirarlo o aplastarlo; las proporciones entre "Club", "22" y "VINERIA" no se tocan.
2. **Cambiar los colores**: textos que no sean blanco o negro, fondos verdes, azules o con degradé.
3. **Ponerlo sobre fondos que lo hacen ilegible**: bordo sobre bordo, fotos recargadas, o sobre negro sin el círculo con aro.
4. **Rehacer o separar los textos**: reescribir "Club" o "22" con otra tipografía, quitar la superposición, cambiar el espaciado de "VINERIA" o agregarle contornos o brillos.

---

## 2. Paleta

Colores permitidos por el cliente: **bordo, blanco, negro y gris**. Los semánticos (éxito, alerta, error, informativo) son los únicos colores adicionales y existen solo para comunicar estados.

### 2.1 Primario, secundario, acento y neutros

| Rol | Nombre / token | HEX | RGB | Uso |
|---|---|---|---|---|
| **Primario** | Bordo `--bordo` | `#6B0F0A` | 107, 15, 10 | Botón primario, logo, encabezado, selección |
| Primario (hover) | `--bordo-hover` | `#8A1A13` | 138, 26, 19 | Hover del botón primario |
| Primario (presionado) | `--bordo-activo` | `#A32219` | 163, 34, 25 | Estado presionado |
| **Secundario** | Blanco `--blanco` | `#FFFFFF` | 255, 255, 255 | Texto principal, íconos, foco |
| **Acento** | Bordo claro `--bordo-claro` | `#E8827A` | 232, 130, 122 | Enlaces, ítem activo del menú, ícono destacado. Es el bordo "aclarado" para que se lea sobre fondo oscuro |
| Acento (tinte) | `--bordo-fondo` | `#2B0A08` | 43, 10, 8 | Fondo de fila/ítem seleccionado |
| **Neutro** · fondo | Negro `--negro` | `#111111` | 17, 17, 17 | Fondo de la aplicación |
| Neutro · superficie 1 | `--superficie-1` | `#1C1C1C` | 28, 28, 28 | Tarjetas, tabla, menú lateral |
| Neutro · superficie 2 | `--superficie-2` | `#262626` | 38, 38, 38 | Modal, campos, elementos elevados |
| Neutro · divisor | `--divisor` | `#3A3A3A` | 58, 58, 58 | Líneas decorativas |
| Neutro · borde de control | `--borde-control` | `#808080` | 128, 128, 128 | Borde de campos y controles |
| Neutro · texto tenue | `--gris-texto-tenue` | `#9A9A9A` | 154, 154, 154 | Ayudas, placeholders |
| Neutro · texto secundario | `--gris-texto` | `#C9C9C9` | 201, 201, 201 | Texto de apoyo |

**Por qué el acento es un bordo claro:** el bordo puro `#6B0F0A` sirve como *relleno* (con texto blanco encima), pero como *texto o línea* sobre fondo oscuro no se lee (1,53:1). Para esos casos se usa `--bordo-claro`, que sigue siendo de la misma familia cromática.

### 2.2 Colores semánticos (conviven con el bordo)
Se eligieron **más claros y con tono propio** (verde, ámbar, rojo salmón, celeste) para que no se confundan con el bordo. Regla: **nunca comunicar un estado solo con color**; siempre ícono + texto.

| Estado | Texto/ícono | RGB | Fondo tintado | RGB | Relleno sólido |
|---|---|---|---|---|---|
| Éxito | `--exito` `#5FD08A` | 95, 208, 138 | `--exito-fondo` `#12261A` | 18, 38, 26 | `#5FD08A` (texto negro encima) |
| Alerta | `--alerta` `#F2B84B` | 242, 184, 75 | `--alerta-fondo` `#2A2108` | 42, 33, 8 | `#F2B84B` (texto negro encima) |
| Error | `--error` `#FF8A80` | 255, 138, 128 | `--error-fondo` `#2E1210` | 46, 18, 16 | `--error-solido` `#B3261E` (texto blanco encima) |
| Informativo | `--info` `#6FB3F2` | 111, 179, 242 | `--info-fondo` `#0F1E2E` | 15, 30, 46 | `#6FB3F2` (texto negro encima) |

El error y el bordo claro son de la misma zona cálida: por eso el error **siempre** lleva el ícono de advertencia y la palabra "Error" o un mensaje claro, y el bordo claro nunca se usa para mensajes de estado.

### 2.3 Fórmula usada para los contrastes
Relación de contraste WCAG 2.x: `(L1 + 0,05) / (L2 + 0,05)`, con L1 la luminancia relativa mayor y L2 la menor.
Luminancia: `L = 0,2126·R + 0,7152·G + 0,0722·B`, donde cada canal `c = canal/255` se linealiza: si `c ≤ 0,03928` → `c/12,92`; si no → `((c + 0,055)/1,055)^2,4`.
Los valores de abajo se calcularon con un script que aplica esa fórmula (no son estimaciones). Umbrales: **4,5:1** texto normal, **3:1** texto grande (≥ 24 px, o ≥ 18,66 px en negrita) y elementos de interfaz (bordes de controles, íconos).

### 2.4 Tabla de contrastes (texto sobre fondo)

| # | Texto | Fondo | Relación | ≥ 4,5:1 |
|---|---|---|---|---|
| 1 | Blanco `#FFFFFF` | Negro `#111111` | **18,88:1** | Sí |
| 2 | Blanco `#FFFFFF` | Superficie 1 `#1C1C1C` | **17,04:1** | Sí |
| 3 | Blanco `#FFFFFF` | Superficie 2 `#262626` | **15,13:1** | Sí |
| 4 | Gris texto `#C9C9C9` | Negro `#111111` | **11,40:1** | Sí |
| 5 | Gris texto `#C9C9C9` | Superficie 1 `#1C1C1C` | **10,29:1** | Sí |
| 6 | Gris texto `#C9C9C9` | Superficie 2 `#262626` | **9,14:1** | Sí |
| 7 | Gris tenue `#9A9A9A` | Negro `#111111` | **6,71:1** | Sí |
| 8 | Gris tenue `#9A9A9A` | Superficie 1 `#1C1C1C` | **6,06:1** | Sí |
| 9 | Gris tenue `#9A9A9A` | Superficie 2 `#262626` | **5,38:1** | Sí |
| 10 | Blanco `#FFFFFF` | Bordo `#6B0F0A` (botón primario) | **12,37:1** | Sí |
| 11 | Blanco `#FFFFFF` | Bordo hover `#8A1A13` | **9,38:1** | Sí |
| 12 | Blanco `#FFFFFF` | Bordo presionado `#A32219` | **7,50:1** | Sí |
| 13 | Bordo claro `#E8827A` | Negro `#111111` | **7,11:1** | Sí |
| 14 | Bordo claro `#E8827A` | Superficie 1 `#1C1C1C` | **6,42:1** | Sí |
| 15 | Bordo claro `#E8827A` | Superficie 2 `#262626` | **5,70:1** | Sí |
| 16 | Bordo claro `#E8827A` | Bordo fondo `#2B0A08` | **6,88:1** | Sí |
| 17 | Éxito `#5FD08A` | Éxito fondo `#12261A` | **8,25:1** | Sí |
| 18 | Alerta `#F2B84B` | Alerta fondo `#2A2108` | **8,89:1** | Sí |
| 19 | Error `#FF8A80` | Error fondo `#2E1210` | **7,60:1** | Sí |
| 20 | Info `#6FB3F2` | Info fondo `#0F1E2E` | **7,55:1** | Sí |
| 21 | Éxito `#5FD08A` | Negro `#111111` | **9,78:1** | Sí |
| 22 | Alerta `#F2B84B` | Negro `#111111` | **10,55:1** | Sí |
| 23 | Error `#FF8A80` | Negro `#111111` | **8,27:1** | Sí |
| 24 | Info `#6FB3F2` | Negro `#111111` | **8,46:1** | Sí |
| 25 | Negro `#111111` | Éxito sólido `#5FD08A` | **9,78:1** | Sí |
| 26 | Negro `#111111` | Alerta sólido `#F2B84B` | **10,55:1** | Sí |
| 27 | Blanco `#FFFFFF` | Error sólido `#B3261E` | **6,54:1** | Sí |
| 28 | Negro `#111111` | Info sólido `#6FB3F2` | **8,46:1** | Sí |
| 29 | Gris `#9A9A9A` | Deshabilitado `#2E2E2E` | **4,83:1** | Sí (los deshabilitados están exentos, pero igual cumplen) |

**Combinaciones prohibidas para texto** (no cumplen):
- Bordo `#6B0F0A` sobre negro `#111111`: **1,53:1**. Sobre superficie 1: **1,38:1**.
- Gris `#6B6B6B` sobre negro: **3,54:1** (sirve solo para elementos no textuales).
- Gris `#4A4A4A` sobre negro: **2,13:1**.

### 2.5 Contraste de elementos no textuales (mínimo 3:1)

| Elemento | Color | Fondo | Relación |
|---|---|---|---|
| Borde de campo `#808080` | sobre Negro | `#111111` | **4,78:1** |
| Borde de campo `#808080` | sobre Superficie 1 | `#1C1C1C` | **4,32:1** |
| Borde de campo `#808080` | sobre Superficie 2 | `#262626` | **3,83:1** |
| Anillo de foco blanco `#FFFFFF` | sobre Negro | `#111111` | **18,88:1** |

El divisor `#3A3A3A` (1,66:1 sobre negro) es **solo decorativo**: nunca marca el límite de un control.

---

## 3. Tipografía

Dos familias de **Google Fonts**, ambas con soporte completo de caracteres del español (tildes, ñ, ¿ ¡):

| Uso | Familia | Por qué | Pesos |
|---|---|---|---|
| **Títulos** | **Playfair Display** (serif de contraste alto) | Hereda la calidez y el aire "de vinería" del script del logo, pero es mucho más legible que un script en pantalla. Solo para títulos y cifras destacadas. | 600, 700 |
| **Interfaz** | **Inter** (sans-serif) | Pensada para pantallas; cifras claras y de ancho parejo, ideal para precios y totales; se parece en carácter a la sans espaciada de "VINERIA". | 400, 500, 600, 700 |

Alternativa de respaldo si falla la carga: `Georgia, serif` para títulos y `system-ui, sans-serif` para interfaz (ya está en `tokens.css`).

Importación:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3.1 Escala tipográfica

| Nivel | Token | Familia | Peso | Tamaño | Interlineado | Uso |
|---|---|---|---|---|---|---|
| Display | `--t-display` | Playfair | 700 | 40 px (2,5 rem) | 48 px | Pantalla de ingreso |
| H1 | `--t-h1` | Playfair | 700 | 32 px (2 rem) | 40 px | Título de pantalla |
| H2 | `--t-h2` | Playfair | 600 | 24 px (1,5 rem) | 32 px | Secciones, título de modal |
| H3 | `--t-h3` | Inter | 600 | 20 px (1,25 rem) | 28 px | Subsecciones, título de tarjeta |
| Número | `--t-numero` | Inter | 700 | 28 px (1,75 rem) | 36 px | Total de venta, montos de caja |
| Cuerpo | `--t-cuerpo` | Inter | 400 | 16 px (1 rem) | 24 px | Texto general, campos, botones (peso 600) |
| Cuerpo chico | `--t-cuerpo-s` | Inter | 400 / 500 | 14 px (0,875 rem) | 20 px | Tablas densas, ayudas, mensajes de campo |
| Etiqueta | `--t-etiqueta` | Inter | 600 | 13 px (0,8125 rem) | 18 px | Etiquetas de estado, encabezados de tabla |

Reglas: mínimo **13 px** en cualquier texto; largo de línea de lectura máximo ~70 caracteres; no usar cursiva ni subrayado para decorar (el subrayado solo para enlaces); cifras con `font-variant-numeric: tabular-nums` en tablas y totales para que los montos se alineen.

---

## 4. Grilla y espaciado

- **Unidad base: 4 px.** Todos los espacios son múltiplos: 4, 8, 16, 24, 32, 48, 64 (tokens `--esp-1` a `--esp-7`).
- **Grilla:** 12 columnas con *gutter* de **24 px** (`--grilla-gutter`) y ancho máximo de contenido de **1280 px**.
- **Márgenes de pantalla:** **16 px** en móvil y tablet vertical; **32 px** en escritorio (≥ 1024 px). Menú lateral fijo de **240 px**; en pantallas angostas se colapsa a barra superior.
- **Separaciones típicas:** entre campos de un formulario 16 px; padding interno de tarjeta 24 px; entre secciones 32–48 px; entre ícono y texto 8 px.
- **Objetivo táctil:** alto mínimo **44 px** para botones, campos y filas clickeables, con 8 px de separación entre ellos (se usa con poca luz y manos ocupadas).
- **Radios de esquina:**

| Token | Valor | Dónde |
|---|---|---|
| `--radio-s` | 4 px | Etiquetas/chips |
| `--radio` | 8 px | Botones, campos, tarjetas, mensajes |
| `--radio-l` | 12 px | Ventana modal |
| `--radio-pleno` | 999 px | Solo el círculo del logo y avatares |

Bordes de control de **2 px**. Elevación: sombra sutil en tarjetas (`--sombra`) y marcada en modal (`--sombra-modal`); en tema oscuro la elevación también se marca aclarando la superficie (1 → 2).

---

## 5. Componentes base y estados

Todos usan los tokens de `tokens.css`. Estado por defecto = **normal**. Regla común: **el foco es siempre visible** (anillo blanco de 3 px con separación de 2 px y halo celeste), nunca se quita sin reemplazo.

### 5.1 Botón
Altura 44 px, padding 8 × 16 px, texto 16 px peso 600, radio 8 px, borde 2 px.

| Estado | Primario | Secundario | Peligro |
|---|---|---|---|
| Normal | Fondo `#6B0F0A`, texto blanco | Fondo transparente, borde y texto `#E8827A` | Fondo `#B3261E`, texto blanco |
| Hover | Fondo `#8A1A13` | Fondo `#2B0A08` | Fondo más claro `#C52E24` (texto blanco 5,54:1) |
| Foco | Anillo blanco 3 px + halo celeste | Ídem | Ídem |
| Deshabilitado | Fondo `#2E2E2E`, texto `#9A9A9A`, cursor `not-allowed` | Borde `#3A3A3A`, texto `#9A9A9A` | Ídem primario |
| Error | No aplica al botón: se muestra el mensaje junto a la acción. Si falló la acción, el botón vuelve a Normal y aparece el mensaje de error. | | |

Un solo botón primario por pantalla o por modal. El peligro siempre pide confirmación (sección 8.4).

### 5.2 Campo de formulario
Etiqueta visible arriba (14 px, peso 600, blanco), campo de 44 px de alto, fondo `#262626`, borde 2 px `#808080`, texto blanco, placeholder `#9A9A9A`, ayuda debajo en 14 px `#C9C9C9`.

| Estado | Aspecto |
|---|---|
| Normal | Borde `#808080` |
| Hover | Borde `#C9C9C9` |
| Foco | Borde blanco + anillo de foco |
| Deshabilitado | Fondo `#2E2E2E`, texto `#9A9A9A`, sin borde marcado |
| Error | Borde `#FF8A80`, ícono de advertencia y mensaje debajo en `#FF8A80`, 14 px, peso 600 (ej.: "Ingresá un monto mayor a 0"). El campo recibe el foco al enviar |

### 5.3 Tarjeta
Fondo `#1C1C1C`, radio 8 px, padding 24 px, sombra `--sombra`. Título H3 y contenido; acciones abajo a la derecha.

| Estado | Aspecto |
|---|---|
| Normal | Sin borde |
| Hover (si es clickeable) | Fondo `#262626`, cursor pointer |
| Foco | Anillo de foco |
| Deshabilitada | Contenido en `#9A9A9A`, sin hover |
| Error | Borde izquierdo de 4 px `#FF8A80` + ícono + mensaje dentro de la tarjeta |

### 5.4 Tabla
Encabezado con fondo `#262626`, texto etiqueta (13 px, 600, blanco), alineado a la izquierda (montos a la derecha, tabulares). Filas de 44 px mínimo, separadas por línea `#3A3A3A`; fondo de fila `#1C1C1C`.

| Estado | Aspecto |
|---|---|
| Normal | Fila `#1C1C1C` |
| Hover de fila | Fondo `#262626` |
| Foco | Anillo de foco sobre la fila o el control de la fila |
| Seleccionada | Fondo `#2B0A08` + borde izquierdo 4 px `#E8827A` |
| Deshabilitada / inactiva | Texto `#9A9A9A` + etiqueta "Inactivo" |
| Error | Etiqueta o ícono de error en la fila, ej. "Stock negativo" |
| Vacía | Mensaje centrado: "Todavía no hay ventas hoy." |

### 5.5 Ventana modal
Fondo `#262626`, radio 12 px, padding 24 px, ancho máximo 520 px, sombra `--sombra-modal`, telón `rgba(0,0,0,0.72)`. Título H2, texto, acciones a la derecha (secundaria a la izquierda, primaria a la derecha). Se cierra con Esc y con la X; al abrir, el foco va al primer control; al cerrar, vuelve a quien la abrió.

| Estado | Aspecto |
|---|---|
| Normal | Como se describe |
| Hover | En botones y en la X de cierre (fondo `#3A3A3A`) |
| Foco | El foco queda atrapado dentro de la modal |
| Deshabilitado | Botón de confirmar deshabilitado hasta que el formulario sea válido |
| Error | Mensaje de error arriba del contenido, dentro de la modal; la modal no se cierra |

### 5.6 Mensajes del sistema
Bloque con fondo tintado, borde izquierdo de 6 px, **ícono + texto** (nunca solo color), radio 8 px, padding 8 × 16 px. Texto con el color semántico (contrastes 7,5:1 a 8,9:1).

| Tipo | Fondo / texto / borde | Ícono | Comportamiento |
|---|---|---|---|
| Éxito | `#12261A` / `#5FD08A` | Tilde en círculo | Se oculta solo a los 5 s |
| Alerta | `#2A2108` / `#F2B84B` | Triángulo con "!" | Queda hasta que se resuelve o se cierra |
| Error | `#2E1210` / `#FF8A80` | Círculo con "!" | Queda hasta que se corrige; el lector de pantalla lo anuncia (`role="alert"`) |
| Informativo | `#0F1E2E` / `#6FB3F2` | Círculo con "i" | Se puede cerrar |

Estados: normal; hover y foco solo sobre el botón de cerrar (anillo de foco); deshabilitado no aplica; error = tipo "Error".

---

## 6. Iconografía

- **Familia recomendada: Lucide** (Lucide Icons, licencia ISC, libre uso). Íconos de línea, trazo uniforme, set grande y consistente; hay paquete oficial para React (`lucide-react`). Alternativa equivalente: Material Symbols (Google), variante *Outlined*.
- **Tamaños:** 16 px (dentro de etiquetas y tablas densas), **20 px** (estándar, junto a texto de 16 px), 24 px (menú lateral y botones de acción), 32 px (estados vacíos y pantalla de resultado). Siempre múltiplos de 4.
- **Trazo:** 2 px en todos, sin mezclar íconos rellenos con de línea.
- **Color:** hereda el color del texto (`currentColor`). Acento (`#E8827A`) solo para el ítem activo del menú; semánticos solo en mensajes y etiquetas de estado.
- **Reglas de uso:**
  1. Un ícono **acompaña** al texto, no lo reemplaza, salvo en acciones universales con `aria-label` y tooltip (cerrar, buscar).
  2. Un mismo ícono significa siempre lo mismo en todo el sistema (consistencia).
  3. Alineados verticalmente al centro del texto, con 8 px de separación.
  4. Los decorativos llevan `aria-hidden="true"`; los que informan llevan texto accesible.
  5. Área clickeable mínima de 44 × 44 px aunque el dibujo sea de 20 px.
  6. No inventar íconos propios sin necesidad: elegir del set. Ejemplos sugeridos: `shopping-cart` (venta), `wallet` (caja), `package` (stock), `users` (usuarios), `triangle-alert` (alerta), `circle-check` (éxito), `circle-x` (error), `info`, `log-out`, `wifi-off` (sin conexión).

---

## 7. Voz y tono

**Voz:** cercana y directa, español rioplatense con **voseo** ("ingresá", "confirmá", "revisá"). Frases cortas, sin tecnicismos ni códigos de error, sin mayúsculas gritadas ni signos de exclamación en errores. Dice **qué pasó** y **qué hacer**. Tono sereno incluso en errores: la persona está atendiendo con la barra llena.

Seis ejemplos:

| # | Situación | Mensaje |
|---|---|---|
| 1 | **Éxito** (venta registrada) | "Venta registrada. Total cobrado: $ 12.500." |
| 2 | **Error** (datos inválidos) | "No pudimos registrar la venta. Revisá que el monto recibido cubra el total." |
| 3 | **Confirmación** (acción delicada) | "¿Cerrar la caja de hoy? Después no vas a poder cargar más ventas en este turno." Botones: **Cerrar caja** / Cancelar |
| 4 | **Alerta de stock** | "Quedan 3 botellas de Malbec Reserva. Conviene reponer pronto." |
| 5 | **Sin conexión** | "Estás sin internet. Podés seguir vendiendo: guardamos las ventas y las enviamos cuando vuelva la conexión." |
| 6 | **Permiso denegado** | "Tu usuario no puede anular ventas. Pedile a un administrador que lo haga." |

Palabras a usar: "venta", "caja", "ingresar", "cobrar". A evitar: "ID", "null", "excepción", "inválido" a secas, "operación abortada".

---

## 8. Reglas de UX/UI aplicadas al sistema

### 8.1 Consistencia
Mismos componentes, mismo lugar y mismo nombre para la misma acción en todas las pantallas.
**Ejemplo Club 22:** el botón para confirmar siempre es el primario bordo, a la derecha y se llama igual ("Cobrar", "Guardar", "Cerrar caja"); la acción de cancelar siempre es secundaria, a su izquierda. Un cajero que aprendió a cobrar sabe cómo cerrar caja.

### 8.2 Jerarquía
Lo más importante es lo más grande, contrastado y arriba; lo secundario se atenúa.
**Ejemplo Club 22:** en la pantalla de venta, el **total a cobrar** va en 28 px peso 700 y blanco, en la parte superior del panel de cobro; debajo, el botón "Cobrar" es el único primario; los datos de apoyo (hora, cajero) van en 14 px gris `#C9C9C9`.

### 8.3 Retroalimentación
Toda acción tiene respuesta visible en menos de 1 segundo; si tarda, se muestra progreso.
**Ejemplo Club 22:** al tocar "Cobrar" el botón pasa a "Cobrando…" y se deshabilita para evitar doble cobro; al terminar aparece el mensaje verde "Venta registrada" con ícono de tilde y se muestra el ticket. Con el wifi caído, un indicador permanente "Sin conexión · 2 ventas pendientes de envío" informa el estado de sincronización.

### 8.4 Prevención de errores
Diseñar para que el error sea difícil: validar antes, restringir opciones, confirmar lo irreversible.
**Ejemplo Club 22:** el botón "Cobrar" queda deshabilitado mientras el carrito esté vacío o el monto recibido sea menor al total; el campo de cantidad no acepta negativos ni letras; "Cerrar caja" y "Desactivar usuario" abren una modal de confirmación con la consecuencia explicada, y la acción de peligro nunca es el botón por defecto.

### 8.5 Accesibilidad
Contraste mínimo 4,5:1 (verificado en la sección 2.4), foco visible, uso con teclado, etiquetas asociadas a cada campo, objetivos de 44 px, nunca solo color, texto escalable y respeto de `prefers-reduced-motion`.
**Ejemplo Club 22:** el lector de código de barras funciona como teclado, pero el campo "Buscar producto" también se puede completar a mano; los errores se anuncian con `role="alert"` y llevan ícono y texto, así que se entienden aunque el usuario no distinga el rojo del bordo en una sala oscura.

### 8.6 Carga cognitiva
Mostrar solo lo necesario para la tarea del momento, agrupar, usar reconocimiento antes que memoria y valores por defecto razonables.
**Ejemplo Club 22:** la pantalla de venta muestra solo buscador, carrito y total; el medio de pago viene preseleccionado con el más usado (efectivo); los productos más vendidos aparecen como accesos rápidos para no tener que buscar; el cajero solo ve su menú (Venta, Mis ventas, Cierre) y el administrador ve además Stock, Usuarios y Auditoría.

---

## Apéndice · Migración del frontend del día 1 al tema oscuro

**Decisión del equipo (13/11/2026): la demo migra al tema oscuro.** El `tokens.css` del día 1 era claro; ya está reemplazado. Se mantienen el bordo `#6B0F0A`, el radio de 8 px, la escala `--esp-1..5` y los alias `--fuente`, `--texto-s/m/l/xl`, `--radio`, `--sombra`, `--foco`.

Archivos migrados en `/mnt/project-files/demo/codigo/`:
- `frontend-dia1/src/estilos/tokens.css` (igual a `demo/tokens.css`), `src/index.css` y `src/App.css` (reescritos con los tokens nuevos).
- `arreglo-pantalla-blanca/App.css-agregar.css` (layout y login oscuros) y los `dia2-*/App.css-agregar.css` que usaban grises.
- **Fuentes:** falta agregar los `<link>` de Google Fonts en el `index.html` del repo (están en el comentario de `tokens.css`).

Equivalencias de tokens viejos:

| Día 1 | Ahora |
|---|---|
| `--gris-100` (fondo) | `--fondo` / `--superficie-2` |
| `--gris-300` (bordes, líneas) | `--divisor` |
| `--gris-500` (borde de campo) | `--borde-control` |
| `--gris-700` (texto de apoyo) | `--texto-secundario` |
| `--bordo-suave` | `--bordo-fondo` |
| `--bordo-oscuro` | `--bordo-hover` |
| `--bordo` como texto/enlace | `--enlace` (`--bordo-claro`) |
| `--blanco` como fondo de superficie | `--superficie-1` o `--superficie-2` |
| `--negro` como texto | `--texto` |

Cuidado con dos cosas: el **ticket impreso** va siempre negro sobre blanco (agregado en `dia2-ticket/App.css-agregar.css` con `@media print`), y los semánticos ahora son **claros** sobre fondo oscuro. Si un componente nuevo usa `--exito`/`--error` como *fondo* con texto blanco, usar los `*-solido` (ver §2.2).
