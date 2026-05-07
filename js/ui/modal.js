// =============================================================
// js/ui/modal.js
// SOLID — Single Responsibility: SOLO controla el modal global.
// =============================================================

import { $, clear, el } from './dom.js';

const root = $('[data-modal]');
const mediaSlot = $('[data-modal-media]');
const titleSlot = $('[data-modal-title]');
const metaSlot = $('[data-modal-meta]');
const bodySlot = $('[data-modal-body]');

function close() {
  if (!root) return;
  root.classList.remove('is-open');
  root.setAttribute('aria-hidden', 'true');
  document.body.style.removeProperty('overflow');
}

// Listener delegado: cubre el botón ✕ aunque cambie el DOM o se
// reasigne. Más robusto que el handler directo en un elemento concreto.
document.addEventListener('click', (e) => {
  const closer = e.target.closest('[data-modal-close]');
  if (closer) {
    e.preventDefault();
    e.stopPropagation();
    close();
  }
});

// Click en el backdrop (fuera del diálogo).
if (root) {
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });
}

// Escape para cerrar.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && root?.classList.contains('is-open')) close();
});

/**
 * Abre el modal con media (image/iframe), título y cuerpo.
 * @param {object} payload
 * @param {string} payload.title
 * @param {string} [payload.imageUrl]
 * @param {string} [payload.videoUrl] iframe (e.g. youtube embed)
 * @param {string[]} [payload.meta] líneas de metadatos
 * @param {string} [payload.html] cuerpo en HTML seguro
 */
export function openModal({ title, imageUrl, videoUrl, meta = [], html = '' } = {}) {
  if (!root) return;
  clear(mediaSlot);
  if (videoUrl) {
    mediaSlot.append(el('iframe', {
      src: videoUrl, allowfullscreen: 'true', loading: 'lazy', title: title || 'media',
    }));
  } else if (imageUrl) {
    mediaSlot.append(el('img', { src: imageUrl, alt: title || '', loading: 'lazy' }));
  }

  titleSlot.textContent = title || '';
  clear(metaSlot);
  meta.filter(Boolean).forEach((line) => metaSlot.append(el('span', {}, line)));
  bodySlot.innerHTML = html || '';

  root.classList.add('is-open');
  root.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
