// =============================================================
// js/views/donki.view.js
// SOLID — Single Responsibility: SOLO la vista de Space Weather.
// =============================================================

import { EVENT_TYPES, NORMALIZERS, getEvents } from '../services/donki.service.js';
import { $, $$, clear, el } from '../ui/dom.js';
import { renderError, renderEmpty, renderLoading } from '../ui/states.js';
import { openModal } from '../ui/modal.js';
import { formatDate, formatInteger, toIsoDate, addDays, escapeHtml } from '../utils/format.js';

const tabs = $('[data-donki-tabs]');
const form = $('[data-donki-form]');
const startInput = $('[data-donki-start]');
const endInput = $('[data-donki-end]');
const list = $('[data-donki-list]');

const summary = $('[data-donki-summary]');
const summaryTitle = $('[data-donki-summary-title]');
const summaryCount = $('[data-donki-count]');
const summaryRange = $('[data-donki-range]');
const summarySevere = $('[data-donki-severe]');
const summaryLatest = $('[data-donki-latest]');

const state = { type: 'FLR' };

function setActiveTab(typeId) {
  $$('button', tabs).forEach((btn) => {
    const active = btn.dataset.type === typeId;
    btn.classList.toggle('tabs__btn--active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function buildEventCard(view, raw) {
  const node = el('article', {
    class: `neo__item neo__item--${view.severity || 'neutral'}`,
    tabindex: '0',
    role: 'button',
  }, [
    el('div', { class: 'neo__item-header' }, [
      el('span', { class: 'neo__item-name' }, view.title || '—'),
      el('span', { class: `badge badge--${view.severity || 'neutral'}` }, [
        el('span', { class: 'badge__dot', 'aria-hidden': 'true' }),
        view.primary ?? '—',
      ]),
    ]),
    el('div', { class: 'neo__item-grid' }, [
      el('span', { class: 'neo__item-label' }, view.whenLabel || 'Fecha'),
      el('span', { class: 'neo__item-value' }, formatDate(view.when)),
      el('span', { class: 'neo__item-label' }, view.primaryLabel || 'Valor'),
      el('span', { class: 'neo__item-value' }, view.primary ?? '—'),
      ...view.rows.flatMap(([label, value]) => [
        el('span', { class: 'neo__item-label' }, label),
        el('span', { class: 'neo__item-value' }, String(value ?? '—')),
      ]),
    ]),
  ]);

  const open = () => openModal({
    title: view.title || 'Evento DONKI',
    meta: [
      view.when ? `${view.whenLabel}: ${formatDate(view.when)}` : null,
      view.primary ? `${view.primaryLabel}: ${view.primary}` : null,
      view.id ? `ID: ${view.id}` : null,
      view.link ? null : null,
    ].filter(Boolean),
    html: [
      view.body ? `<p>${escapeHtml(view.body)}</p>` : '',
      view.link ? `<p><a href="${escapeHtml(view.link)}" target="_blank" rel="noopener">Ver en NASA HSWS ↗</a></p>` : '',
      `<details style="margin-top:1rem;color:#8a93b8;"><summary>JSON original</summary><pre style="white-space:pre-wrap;font-size:0.75rem;">${escapeHtml(JSON.stringify(raw, null, 2))}</pre></details>`,
    ].join(''),
  });
  node.addEventListener('click', open);
  node.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  return node;
}

function renderSummary(views, range) {
  if (!summary) return;
  summary.hidden = false;
  const def = Object.values(EVENT_TYPES).find((t) => t.id === state.type);
  summaryTitle.textContent = def ? `Resumen — ${def.label}` : 'Resumen';
  summaryRange.textContent = `${formatDate(range.start)} → ${formatDate(range.end)}`;
  summaryCount.textContent = formatInteger(views.length);
  const severeCount = views.filter((v) => v.severity === 'danger' || v.severity === 'warn').length;
  summarySevere.textContent = formatInteger(severeCount);
  const latest = views.reduce((acc, v) => (acc?.when && new Date(acc.when) > new Date(v.when) ? acc : v), null);
  summaryLatest.textContent = latest?.when ? formatDate(latest.when) : '—';
}

async function load() {
  if (!list) return;
  const start = startInput.value;
  const end = endInput.value;
  renderLoading(list, 'Consultando DONKI…');
  if (summary) summary.hidden = true;
  try {
    const events = await getEvents({ type: state.type, start, end });
    const normalize = NORMALIZERS[state.type];
    const views = events.map((e) => ({ raw: e, view: normalize(e) }));

    if (!views.length) {
      renderEmpty(list, {
        title: 'Sin eventos en el rango',
        text: 'Prueba con un rango más amplio o cambia de tipo.',
      });
      return;
    }
    renderSummary(views.map((v) => v.view), { start, end });
    clear(list);
    views.forEach(({ view, raw }) => list.append(buildEventCard(view, raw)));
  } catch (err) {
    renderError(list, err);
  }
}

export function initDonkiView() {
  if (!form) return;

  // Defaults: últimos 30 días.
  const today = new Date();
  if (!startInput.value) startInput.value = toIsoDate(addDays(today, -30));
  if (!endInput.value) endInput.value = toIsoDate(today);

  if (tabs) {
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-type]');
      if (!btn) return;
      state.type = btn.dataset.type;
      setActiveTab(state.type);
      load();
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    load();
  });

  setActiveTab(state.type);
  load();
}
