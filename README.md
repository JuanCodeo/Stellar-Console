# Stellar Console — Sistema de Investigación Espacial

Cliente web que consume la **API pública de NASA** (`https://api.nasa.gov`) para
explorar el universo desde el navegador. Es la **Actividad de Profundización**
del curso *Desarrollo de Software Web Front-End* (UCompensar — Ingeniería de
Software), reorientada a un dominio real y robusto **manteniendo la
arquitectura Sass 7-1 con principios SOLID**.

> Stack: HTML semántico · Sass (7-1) · JavaScript modular vanilla (ES2022) · Fetch API.

---

## Módulos / endpoints integrados

| Módulo | Endpoint | Propósito |
| --- | --- | --- |
| **APOD** | `GET /planetary/apod` | Imagen astronómica del día + archivo histórico + aleatorio |
| **DONKI · Space Weather** | `GET /DONKI/{FLR\|CME\|GST\|notifications}` | Erupciones solares, eyecciones de masa coronal, tormentas geomagnéticas y boletines |
| **NeoWs** | `GET /neo/rest/v1/feed` | Asteroides cercanos en rangos de hasta 7 días |
| **NASA Image Library** | `GET https://images-api.nasa.gov/search` | Buscador del archivo multimedia |

Documentación oficial: <https://api.nasa.gov>.

> Nota: La API de Mars Rover Photos y Earth de NASA fueron archivadas en
> 2024–2025; este proyecto las sustituyó por **DONKI** (clima espacial),
> que sigue activa en `api.nasa.gov`.

---

## Estructura del proyecto

```
actividad-profundizacion-frontend/
├── index.html                    # Markup semántico
├── css/
│   └── styles.css                # CSS compilado (entregable final)
├── scss/                         # Arquitectura 7-1 con SOLID
│   ├── abstracts/
│   │   ├── _variables.scss       # Tokens (colores, spacing, breakpoints, mapas)
│   │   ├── _functions.scss       # space(), bp(), status(), z()
│   │   └── _mixins.scss          # button-base, card-surface, respond-above, space-side, glow…
│   ├── base/
│   │   ├── _reset.scss
│   │   └── _typography.scss
│   ├── components/
│   │   ├── _badge.scss           # Píldoras de estado generadas por interpolación
│   │   ├── _button.scss          # Variantes generadas por interpolación
│   │   ├── _card.scss
│   │   ├── _form.scss
│   │   ├── _loader.scss          # Spinner, skeleton, empty-state
│   │   ├── _modal.scss
│   │   ├── _navbar.scss
│   │   ├── _panel.scss
│   │   └── _tabs.scss
│   ├── layout/
│   │   ├── _hero.scss
│   │   ├── _section.scss
│   │   └── _footer.scss
│   ├── pages/
│   │   ├── _apod.scss
│   │   ├── _donki.scss
│   │   ├── _home.scss
│   │   ├── _images.scss
│   │   └── _neo.scss
│   └── main.scss                 # Composition root (sólo @import)
├── js/                           # Cliente modular (ES Modules)
│   ├── config.js                 # API key, endpoints, TTL de caché, timeouts
│   ├── core/
│   │   ├── apiClient.js          # fetch + timeouts + retry + cache + rate-limit
│   │   ├── cache.js              # localStorage con TTL (fallback en memoria)
│   │   └── errors.js             # ApiError, TimeoutError, RateLimitError
│   ├── services/                 # Una responsabilidad por servicio
│   │   ├── apod.service.js
│   │   ├── donki.service.js
│   │   ├── images.service.js
│   │   └── neo.service.js
│   ├── ui/
│   │   ├── dom.js                # Helpers DOM puros
│   │   ├── modal.js              # Modal global accesible
│   │   └── states.js             # Loading / Empty / Error
│   ├── utils/
│   │   └── format.js             # Fechas, números, sanitizado
│   ├── views/                    # Una vista por sección
│   │   ├── apod.view.js
│   │   ├── donki.view.js
│   │   ├── images.view.js
│   │   └── neo.view.js
│   └── app.js                    # Composition root (no contiene lógica)
├── package.json
└── README.md
```

---

## Aplicación de principios SOLID

### En SCSS

| Principio | Aplicación |
| --- | --- |
| **S — Single Responsibility** | Cada partial tiene una única responsabilidad: `_variables.scss` sólo tokens, `_button.scss` sólo el botón, `_badge.scss` sólo badges, etc. |
| **O — Open/Closed** | Para añadir una variante de botón o un nivel de hazard basta con agregar una clave a `$button-variants` o `$status-levels`. **No se modifica** `_button.scss` ni `_badge.scss`. |
| **L — Liskov Substitution** | Cualquier `.btn--*` (`primary`, `secondary`, `accent`, `nebula`, `ghost`) o `.badge--*` (`safe`, `info`, `warn`, `danger`, `neutral`) es intercambiable. |
| **I — Interface Segregation** | Mixins pequeños y específicos: `button-base`, `card-surface`, `respond-above`, `space-side`, `clamp-lines`, `data-text`, `glow`. |
| **D — Dependency Inversion** | Los componentes consumen funciones (`space()`, `bp()`, `status()`, `z()`) en lugar de leer mapas directamente. `main.scss` depende de abstracciones (partials), no de reglas concretas. |

### En JavaScript

| Principio | Aplicación |
| --- | --- |
| **S** | Servicios independientes (`apod.service.js`, `mars.service.js`, …), vistas independientes (`*.view.js`), `cache.js` sólo persiste, `apiClient.js` sólo HTTP, `format.js` sólo formato. |
| **O** | Añadir un nuevo módulo de NASA = nuevo servicio + nueva vista; no se modifican los existentes. |
| **L** | Todos los servicios devuelven datos consumibles del mismo modo por sus vistas; el `request()` del cliente acepta cualquier endpoint. |
| **I** | El cliente expone una API mínima (`request`, `onRateLimitChange`); las vistas sólo importan lo que usan. |
| **D** | Las vistas dependen de los servicios; los servicios dependen del `apiClient`; `apiClient` depende de `config` y `cache`. Nadie llama a `fetch` directo (excepto `getAsset`, que es un caso aparte). |

---

## Requisitos académicos cubiertos

### a) 5 variables Sass (`scss/abstracts/_variables.scss`)
1. `$primary-color`
2. `$secondary-color`
3. `$base-font-family`
4. `$base-font-size`
5. `$base-radius`

(Y muchas más adicionales: paleta espacial, mapas de spacing, breakpoints, z-index, hazard.)

### b) Anidación de selectores
- `_navbar.scss` → `.navbar { &__container { … } &__link { &:hover { … } &--active { … } } }`
- `_button.scss` → `.btn { &:disabled { … } &--ghost { &:hover { … } } }`
- `_card.scss`, `_modal.scss`, `_panel.scss`, `_neo.scss`, `_apod.scss`, etc.

### c) Casos de interpolación

**Caso 1** — Interpolación del **nombre de propiedad CSS** (`scss/abstracts/_mixins.scss`):
```scss
@mixin space-side($side, $key) {
  margin-#{$side}: space($key);
}
```
Uso: `@include space-side('bottom', 'md');` → `margin-bottom: 1.5rem;`

**Caso 2** — Interpolación de **selectores con `@each`** (`scss/components/_button.scss`):
```scss
@each $name, $color in $button-variants {
  &--#{$name} {
    background-color: $color;
    /* ... */
  }
}
```
Genera `.btn--primary`, `.btn--secondary`, `.btn--accent`, `.btn--nebula`.

**Caso 3** — Misma técnica aplicada a badges (`scss/components/_badge.scss`):
```scss
@each $name, $color in $status-levels {
  &--#{$name} { color: $color; border-color: rgba($color, 0.35); }
}
```
Genera `.badge--safe`, `.badge--info`, `.badge--warn`, `.badge--danger`, `.badge--neutral`.

---

## Robustez del cliente

- **Caché con TTL** por servicio (`localStorage` con fallback en memoria).
- **Timeouts** configurables (`config.requestTimeout`).
- **Reintentos exponenciales** para errores de red (no para 4xx/429).
- **Errores tipados**: `ApiError`, `TimeoutError`, `RateLimitError`.
- **Estados de UI dedicados**: skeleton, loading, empty, error.
- **Rate-limit visible**: la cabecera `X-RateLimit-Remaining` se muestra en el hero.
- **Validaciones del lado cliente**: NeoWs limita a 7 días, APOD respeta el rango histórico, DONKI valida tipo de evento permitido y rango de fechas.
- **Accesibilidad**: roles ARIA, `aria-live`, `aria-selected`, focus visible, modal con cierre por `Escape` y por click en backdrop.

---

## Cómo ejecutar el proyecto

### Opción A — abrir directo (más simple)
El CSS ya está compilado. Sin embargo, los módulos ES requieren un servidor.
Cualquier servidor estático funciona. En VS Code: extensión **Live Server**.

### Opción B — servidor local con Node
```bash
# Servir el directorio actual en http://localhost:5173
npm run serve
```

### Opción C — recompilar Sass
```bash
npm install
npm run sass     # compila una vez
npm run watch    # recompila al guardar
```

### Cambiar la API key de NASA
1. Regístrate en <https://api.nasa.gov> (la respuesta llega por email al instante).
2. Abre `js/config.js` y reemplaza `'DEMO_KEY'` por tu clave.
3. Esto sube el rate-limit de 30 req/hora a 1000 req/hora.

---

## Datos de la entrega

- **Estudiante:** Juan José Guerrero
- **Programa:** Ingeniería de Software
- **Curso:** Desarrollo De Software Web Front-End
- **Institución:** Fundación Universitaria Compensar (UCompensar)
- **Datos:** cortesía de NASA Open APIs.
