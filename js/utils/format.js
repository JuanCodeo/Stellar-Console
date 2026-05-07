// =============================================================
// js/utils/format.js
// SOLID — Single Responsibility: SOLO funciones puras de formato.
// =============================================================

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric', month: 'short', day: '2-digit',
});

const numberFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

export function formatDate(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return dateFormatter.format(d);
}

export function formatNumber(value, { decimals = 2 } = {}) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: decimals }).format(n);
}

export function formatInteger(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return integerFormatter.format(n);
}

export function toIsoDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function clampDate(iso, { min, max } = {}) {
  if (!iso) return iso;
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
