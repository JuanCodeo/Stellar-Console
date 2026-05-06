# Actividad de Profundización — Front-End

Proyecto de la **Actividad de Aprendizaje No. 3** del curso *Desarrollo De
Software Web Front-End* (UCompensar — Ingeniería de Software).

> Portafolio personal construido con **HTML semántico** y **Sass**, aplicando
> **principios SOLID** a la arquitectura de estilos.

---

## Estructura del proyecto

```
actividad-profundizacion-frontend/
├── index.html                  # Markup semántico
├── css/
│   └── styles.css              # CSS compilado (entregable final)
├── scss/                       # Arquitectura 7-1 simplificada
│   ├── abstracts/              # Tokens y herramientas (sin CSS)
│   │   ├── _variables.scss     # 5+ variables Sass
│   │   ├── _functions.scss     # space(), bp()
│   │   └── _mixins.scss        # button-base, card-surface, space-side
│   ├── base/
│   │   ├── _reset.scss
│   │   └── _typography.scss
│   ├── components/             # Una responsabilidad por archivo
│   │   ├── _button.scss
│   │   ├── _navbar.scss
│   │   ├── _card.scss
│   │   └── _form.scss
│   ├── layout/
│   │   ├── _hero.scss
│   │   ├── _section.scss
│   │   └── _footer.scss
│   ├── pages/
│   │   └── _home.scss
│   └── main.scss               # Composition root (sólo @import)
├── package.json
└── README.md
```

---

## Aplicación de principios SOLID

| Principio | Cómo se aplica en este proyecto |
| --- | --- |
| **S — Single Responsibility** | Cada partial `.scss` tiene una sola responsabilidad: `_variables.scss` solo declara tokens, `_button.scss` solo el botón, `_navbar.scss` solo la barra, etc. |
| **O — Open/Closed** | Para añadir una nueva variante de botón (ej. `danger`) basta con agregar una clave al mapa `$button-variants` en `_variables.scss`. **No se modifica `_button.scss`**. |
| **L — Liskov Substitution** | Cualquier `.btn--<variante>` (`primary`, `secondary`, `accent`, `ghost`) es intercambiable donde se use `.btn`, sin romper el layout. |
| **I — Interface Segregation** | Mixins pequeños y específicos (`button-base`, `card-surface`, `respond-above`, `space-side`) en lugar de uno monolítico. Los componentes solo dependen de lo que usan. |
| **D — Dependency Inversion** | Los componentes consumen funciones (`space()`, `bp()`) en lugar de leer los mapas directamente. `main.scss` depende de abstracciones (partials), no de reglas concretas. |

---

## Requisitos de la tarea cubiertos

### a) 5 variables Sass (`scss/abstracts/_variables.scss`)
1. `$primary-color`
2. `$secondary-color`
3. `$base-font-family`
4. `$base-font-size`
5. `$base-radius`

### b) Anidación de selectores
Aparece en múltiples componentes. Ejemplos:
- `scss/components/_navbar.scss` — `.navbar { &__container { ... } &__link { &:hover { ... } &--active { ... } } }`
- `scss/components/_button.scss` — `.btn { &:disabled { ... } &--ghost { &:hover { ... } } }`
- `scss/components/_card.scss` — `.card { &:hover { ... } &__title { ... } }`

### c) 2 casos de interpolación

**Caso 1** — Interpolación del nombre de propiedad CSS
(`scss/abstracts/_mixins.scss`):
```scss
@mixin space-side($side, $key) {
  margin-#{$side}: space($key);
}
```
Uso: `@include space-side('bottom', 'lg');` → `margin-bottom: 2.5rem;`

**Caso 2** — Interpolación de selectores con `@each`
(`scss/components/_button.scss`):
```scss
@each $name, $color in $button-variants {
  &--#{$name} {
    background-color: $color;
    /* ... */
  }
}
```
Genera `.btn--primary`, `.btn--secondary`, `.btn--accent`.

---

## Cómo ejecutar el proyecto

### Opción A — abrir directamente
El CSS ya está compilado en `css/styles.css`. Abre `index.html` en el navegador.

### Opción B — recompilar Sass (Node.js)
```bash
npm install
npm run sass     # compila una vez
npm run watch    # recompila al guardar
```

### Opción C — Live Sass Compiler en VS Code
Instala la extensión *Live Sass Compiler* y haz click en **Watch Sass**.

---

## Datos de la entrega

- **Estudiante:** Juan José Guerrero
- **Programa:** Ingeniería de Software
- **Curso:** Desarrollo De Software Web Front-End
- **Institución:** Fundación Universitaria Compensar (UCompensar)
