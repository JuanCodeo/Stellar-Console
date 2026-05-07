// =============================================================
// js/ui/states.js
// SOLID — Single Responsibility: render de estados (loading,
// empty, error). No conoce el dominio.
// =============================================================

import { clear, el } from './dom.js';

export function renderLoading(container, message = 'Consultando NASA…') {
  if (!container) return;
  clear(container);
  container.append(
    el('div', { class: 'loader loader--block' }, [
      el('span', { class: 'loader__spinner', 'aria-hidden': 'true' }),
      el('span', {}, message),
    ]),
  );
}

export function renderError(container, error) {
  if (!container) return;
  clear(container);
  const message = error?.message || 'Ocurrió un error inesperado.';
  container.append(
    el('div', { class: 'empty-state empty-state--error', role: 'alert' }, [
      el('div', { class: 'empty-state__icon' }, '⚠'),
      el('p', { class: 'empty-state__title' }, 'No se pudo cargar la información'),
      el('p', { class: 'empty-state__text' }, message),
    ]),
  );
}

export function renderEmpty(container, { title = 'Sin resultados', text = '' } = {}) {
  if (!container) return;
  clear(container);
  container.append(
    el('div', { class: 'empty-state' }, [
      el('div', { class: 'empty-state__icon' }, '✦'),
      el('p', { class: 'empty-state__title' }, title),
      text ? el('p', { class: 'empty-state__text' }, text) : null,
    ]),
  );
}

export function renderSkeletonGrid(container, { count = 8, itemClass = '' } = {}) {
  if (!container) return;
  clear(container);
  for (let i = 0; i < count; i += 1) {
    container.append(
      el('div', { class: `card ${itemClass}`.trim() }, [
        el('div', { class: 'skeleton skeleton--media' }),
        el('div', { class: 'skeleton skeleton--text' }),
        el('div', { class: 'skeleton skeleton--text-sm' }),
      ]),
    );
  }
}
