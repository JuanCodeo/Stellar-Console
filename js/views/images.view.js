// =============================================================
// js/views/images.view.js
// SOLID — Single Responsibility: SOLO la vista del buscador
// de la NASA Image and Video Library.
// =============================================================

import * as images from '../services/images.service.js';
import { $, clear, el } from '../ui/dom.js';
import { renderError, renderEmpty, renderSkeletonGrid } from '../ui/states.js';
import { openModal } from '../ui/modal.js';
import { formatDate, escapeHtml } from '../utils/format.js';

const form = $('[data-images-form]');
const qInput = $('[data-images-q]');
const typeSel = $('[data-images-type]');
const grid = $('[data-images-grid]');

async function openItemModal(item) {
  let imageUrl = item.thumbnail;
  let videoUrl = '';
  try {
    if (item.mediaType === 'image' && item.assetHref) {
      const list = await images.getAsset(item.assetHref);
      const big = list.find((u) => /~orig|~large/.test(u));
      if (big) imageUrl = big;
    } else if (item.mediaType === 'video' && item.assetHref) {
      const list = await images.getAsset(item.assetHref);
      videoUrl = list.find((u) => /\.mp4$/.test(u)) || '';
    }
  } catch { /* ignore — usamos thumbnail como fallback */ }

  const meta = [
    item.dateCreated ? `Fecha: ${formatDate(item.dateCreated)}` : null,
    item.photographer ? `Crédito: ${item.photographer}` : null,
    item.mediaType ? `Tipo: ${item.mediaType}` : null,
    item.id ? `NASA ID: ${item.id}` : null,
  ].filter(Boolean);

  openModal({
    title: item.title,
    imageUrl: videoUrl ? '' : imageUrl,
    videoUrl,
    meta,
    html: item.description ? `<p>${escapeHtml(item.description)}</p>` : '',
  });
}

function buildCard(item) {
  const node = el('article', {
    class: 'images__item',
    tabindex: '0',
    role: 'button',
    'aria-label': item.title || 'Asset NASA',
  }, [
    el('img', { src: item.thumbnail, alt: item.title || '', loading: 'lazy', referrerpolicy: 'no-referrer' }),
    el('div', { class: 'images__item-body' }, [
      el('span', { class: 'images__item-title' }, item.title || '—'),
      el('span', { class: 'images__item-date' }, formatDate(item.dateCreated)),
    ]),
  ]);
  const open = () => openItemModal(item);
  node.addEventListener('click', open);
  node.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  return node;
}

async function search() {
  if (!grid) return;
  renderSkeletonGrid(grid, { count: 8 });
  try {
    const results = await images.search({ q: qInput.value.trim(), media_type: typeSel.value });
    if (!results.length) {
      renderEmpty(grid, { title: 'Sin resultados', text: 'Prueba con otra palabra clave.' });
      return;
    }
    clear(grid);
    results.slice(0, 60).forEach((it) => {
      // Si no hay thumbnail, omitir.
      if (!it.thumbnail) return;
      grid.append(buildCard(it));
    });
  } catch (err) {
    renderError(grid, err);
  }
}

export function initImagesView() {
  if (!form) return;
  if (!qInput.value) qInput.value = 'nebula';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search();
  });
  search();
}
