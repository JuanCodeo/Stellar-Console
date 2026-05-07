// =============================================================
// js/views/neo.view.js
// SOLID — Single Responsibility: SOLO la vista de Near-Earth Objects.
// =============================================================

import * as neo from '../services/neo.service.js';
import { $, clear, el } from '../ui/dom.js';
import { renderError, renderEmpty, renderLoading } from '../ui/states.js';
import { formatDate, formatInteger, formatNumber, toIsoDate, addDays } from '../utils/format.js';

const form = $('[data-neo-form]');
const startInput = $('[data-neo-start]');
const endInput = $('[data-neo-end]');
const list = $('[data-neo-list]');
const summary = $('[data-neo-summary]');
const rangeEl = $('[data-neo-range]');
const countEl = $('[data-neo-count]');
const hazardousEl = $('[data-neo-hazardous]');
const closestEl = $('[data-neo-closest]');
const fastestEl = $('[data-neo-fastest]');

function buildItem(item) {
  const variantClass = item.hazardous ? 'neo__item--hazard' : 'neo__item--safe';
  const badgeClass = item.hazardous ? 'badge--danger' : 'badge--safe';
  const badgeLabel = item.hazardous ? 'Potencialmente peligroso' : 'No peligroso';

  return el('article', { class: `neo__item ${variantClass}` }, [
    el('div', { class: 'neo__item-header' }, [
      el('a', { class: 'neo__item-name', href: item.nasaUrl, target: '_blank', rel: 'noopener' }, item.name || `Asteroide ${item.id}`),
      el('span', { class: `badge ${badgeClass}` }, [
        el('span', { class: 'badge__dot', 'aria-hidden': 'true' }),
        badgeLabel,
      ]),
    ]),
    el('div', { class: 'neo__item-grid' }, [
      el('span', { class: 'neo__item-label' }, 'Aproximación'),
      el('span', { class: 'neo__item-value' }, formatDate(item.approachDate)),
      el('span', { class: 'neo__item-label' }, 'Distancia'),
      el('span', { class: 'neo__item-value' }, `${formatNumber(item.missDistanceKm, { decimals: 0 })} km · ${formatNumber(item.missDistanceLunar, { decimals: 1 })} LD`),
      el('span', { class: 'neo__item-label' }, 'Velocidad relativa'),
      el('span', { class: 'neo__item-value' }, `${formatNumber(item.velocityKmh, { decimals: 0 })} km/h`),
      el('span', { class: 'neo__item-label' }, 'Diámetro est.'),
      el('span', { class: 'neo__item-value' }, `${formatNumber(item.diameterMinKm, { decimals: 2 })} – ${formatNumber(item.diameterMaxKm, { decimals: 2 })} km`),
    ]),
  ]);
}

function renderSummary(items, range) {
  const stats = neo.summarize(items);
  if (!stats || !summary) return;
  summary.hidden = false;
  rangeEl.textContent = `${formatDate(range.start)} → ${formatDate(range.end)}`;
  countEl.textContent = formatInteger(stats.total);
  hazardousEl.textContent = formatInteger(stats.hazardous);
  closestEl.textContent = formatNumber(stats.closest.missDistanceKm, { decimals: 0 });
  fastestEl.textContent = formatNumber(stats.fastest.velocityKmh, { decimals: 0 });
}

async function loadFeed() {
  if (!list) return;
  const start = startInput.value;
  const end = endInput.value;
  renderLoading(list, 'Consultando NeoWs…');
  if (summary) summary.hidden = true;
  try {
    const data = await neo.getFeed({ start_date: start, end_date: end });
    const items = neo.flattenFeed(data);
    if (!items.length) {
      renderEmpty(list, { title: 'Sin objetos en el rango' });
      return;
    }
    renderSummary(items, { start, end });
    clear(list);
    items.forEach((it) => list.append(buildItem(it)));
  } catch (err) {
    renderError(list, err);
  }
}

export function initNeoView() {
  if (!form) return;

  // Defaults: hoy → +6 días.
  const today = new Date();
  if (!startInput.value) startInput.value = toIsoDate(today);
  if (!endInput.value) endInput.value = toIsoDate(addDays(today, 6));

  // Validación del rango (≤ 7 días) en cliente.
  startInput.addEventListener('change', () => {
    const start = new Date(startInput.value);
    if (!Number.isNaN(start.getTime())) {
      endInput.min = startInput.value;
      endInput.max = toIsoDate(addDays(start, 7));
      if (new Date(endInput.value) > addDays(start, 7) || new Date(endInput.value) < start) {
        endInput.value = toIsoDate(addDays(start, 6));
      }
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadFeed();
  });

  loadFeed();
}
