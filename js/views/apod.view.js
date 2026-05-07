// =============================================================
// js/views/apod.view.js
// SOLID — Single Responsibility: SOLO renderizar APOD.
// =============================================================

import * as apodService from '../services/apod.service.js';
import { $, clear, el } from '../ui/dom.js';
import { renderError } from '../ui/states.js';
import { openModal } from '../ui/modal.js';
import { formatDate, escapeHtml, toIsoDate } from '../utils/format.js';

const heroMedia = $('[data-apod-hero-media]');
const heroTitle = $('[data-apod-hero-title]');
const heroText = $('[data-apod-hero-text]');

const view = $('[data-apod-view]');
const form = $('[data-apod-form]');
const dateInput = $('[data-apod-date]');
const randomBtn = $('[data-apod-random]');

function buildMedia(data) {
  if (data.media_type === 'video') {
    return el('iframe', {
      src: data.url, title: data.title || 'APOD video',
      allowfullscreen: 'true', loading: 'lazy',
    });
  }
  return el('img', {
    src: data.hdurl || data.url,
    alt: data.title || 'Astronomy Picture of the Day',
    loading: 'lazy',
  });
}

function renderHero(data) {
  if (!heroMedia) return;
  clear(heroMedia);
  heroMedia.append(buildMedia(data));
  heroTitle.textContent = data.title || '';
  heroText.textContent = data.explanation
    ? data.explanation.slice(0, 240) + (data.explanation.length > 240 ? '…' : '')
    : '';
}

function renderDetail(data) {
  if (!view) return;
  clear(view);

  const media = el('div', { class: 'apod__media', tabindex: '0', role: 'button' }, [buildMedia(data)]);
  if (data.media_type !== 'video') {
    media.addEventListener('click', () => openModal({
      title: data.title,
      imageUrl: data.hdurl || data.url,
      meta: [`Fecha: ${formatDate(data.date)}`, data.copyright ? `© ${data.copyright}` : null].filter(Boolean),
      html: `<p>${escapeHtml(data.explanation || '')}</p>`,
    }));
  }

  const details = el('div', { class: 'apod__details' }, [
    el('p', { class: 'apod__date' }, formatDate(data.date)),
    el('h3', { class: 'apod__title' }, data.title || ''),
    el('p', { class: 'apod__explanation' }, data.explanation || ''),
    data.copyright ? el('p', { class: 'apod__copyright' }, `© ${data.copyright}`) : null,
  ].filter(Boolean));

  view.append(media, details);
}

async function loadApod(date = '') {
  try {
    const data = await apodService.getApod(date);
    renderHero(data);
    renderDetail(data);
    if (data.date && dateInput) dateInput.value = data.date;
  } catch (err) {
    renderError(view, err);
    if (heroTitle) heroTitle.textContent = 'No se pudo cargar la imagen del día';
    if (heroText) heroText.textContent = err.message || '';
  }
}

async function loadRandom() {
  try {
    const data = await apodService.getRandomApod();
    renderHero(data);
    renderDetail(data);
    if (data?.date && dateInput) dateInput.value = data.date;
  } catch (err) {
    renderError(view, err);
  }
}

export function initApodView() {
  // Configura input de fecha (rango válido).
  if (dateInput) {
    dateInput.min = apodService.APOD_MIN_DATE;
    dateInput.max = toIsoDate(new Date());
    dateInput.value = toIsoDate(new Date());
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      loadApod(dateInput?.value || '');
    });
  }

  if (randomBtn) {
    randomBtn.addEventListener('click', () => loadRandom());
  }

  loadApod();
}
