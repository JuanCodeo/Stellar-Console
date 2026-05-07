// =============================================================
// js/services/donki.service.js
// SOLID — Single Responsibility: SOLO Space Weather (DONKI).
// Documentación: https://api.nasa.gov  →  DONKI
//   Base: /DONKI/{type}?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Tipos soportados aquí:
//   FLR  — Solar Flare
//   CME  — Coronal Mass Ejection
//   GST  — Geomagnetic Storm
//   notifications — boletines NOAA/NASA
// =============================================================

import apiClient from '../core/apiClient.js';
import config from '../config.js';

export const EVENT_TYPES = Object.freeze({
  FLR: { id: 'FLR', label: 'Solar Flares', endpoint: '/DONKI/FLR' },
  CME: { id: 'CME', label: 'CMEs', endpoint: '/DONKI/CME' },
  GST: { id: 'GST', label: 'Tormentas geomagnéticas', endpoint: '/DONKI/GST' },
  NOTIFICATIONS: { id: 'NOTIFICATIONS', label: 'Notificaciones', endpoint: '/DONKI/notifications' },
});

const VALID_IDS = new Set(Object.values(EVENT_TYPES).map((t) => t.id));

function assertType(typeId) {
  if (!VALID_IDS.has(typeId)) {
    throw new Error(`Tipo DONKI inválido: ${typeId}.`);
  }
}

/**
 * Consulta eventos DONKI por tipo y rango de fechas.
 * @param {object} opts
 * @param {string} opts.type     uno de EVENT_TYPES.*.id
 * @param {string} opts.start    YYYY-MM-DD
 * @param {string} opts.end      YYYY-MM-DD
 */
export async function getEvents({ type, start, end }) {
  assertType(type);
  if (!start || !end) throw new Error('Faltan fechas start/end.');
  if (new Date(end) < new Date(start)) throw new Error('end no puede ser anterior a start.');

  const def = Object.values(EVENT_TYPES).find((t) => t.id === type);
  const cacheKey = `donki::${type}::${start}::${end}`;
  const data = await apiClient.request({
    base: 'nasa',
    path: def.endpoint,
    params: { startDate: start, endDate: end },
    cacheKey,
    cacheTtl: config.cacheTtl.donki,
  });
  return Array.isArray(data) ? data : [];
}

// =============================================================
// Normalización por tipo. Cada normalizador recibe un evento
// y devuelve la "vista" (campos uniformes) que la UI consumirá.
// SOLID — Open/Closed: un nuevo tipo se añade aquí sin tocar
// la vista.
// =============================================================
export const NORMALIZERS = Object.freeze({
  FLR: (e) => ({
    id: e.flrID,
    title: `Erupción ${e.classType || ''}`.trim(),
    primary: e.classType || '—',
    primaryLabel: 'Clase',
    when: e.beginTime,
    whenLabel: 'Inicio',
    rows: [
      ['Pico', e.peakTime || '—'],
      ['Fin', e.endTime || '—'],
      ['Región activa', e.activeRegionNum ?? '—'],
      ['Fuente', e.sourceLocation || '—'],
    ],
    severity: classifyFlare(e.classType),
    link: e.link,
  }),
  CME: (e) => ({
    id: e.activityID,
    title: 'Eyección de masa coronal',
    primary: extractCmeSpeed(e),
    primaryLabel: 'Velocidad',
    when: e.startTime,
    whenLabel: 'Inicio',
    rows: [
      ['Tipo', e.cmeAnalyses?.[0]?.type || '—'],
      ['Latitud', e.cmeAnalyses?.[0]?.latitude ?? '—'],
      ['Longitud', e.cmeAnalyses?.[0]?.longitude ?? '—'],
      ['Fuente', e.sourceLocation || '—'],
    ],
    severity: 'info',
    link: e.link,
  }),
  GST: (e) => ({
    id: e.gstID,
    title: 'Tormenta geomagnética',
    primary: extractMaxKp(e),
    primaryLabel: 'Kp máx',
    when: e.startTime,
    whenLabel: 'Inicio',
    rows: [
      ['Observaciones', e.allKpIndex?.length ?? 0],
      ['Última fuente', e.allKpIndex?.[e.allKpIndex.length - 1]?.source || '—'],
    ],
    severity: classifyKp(extractMaxKp(e)),
    link: e.link,
  }),
  NOTIFICATIONS: (e) => ({
    id: e.messageID,
    title: e.messageType || 'Notificación',
    primary: e.messageType || '—',
    primaryLabel: 'Tipo',
    when: e.messageIssueTime,
    whenLabel: 'Emitida',
    rows: [
      ['ID', e.messageID || '—'],
    ],
    severity: 'neutral',
    link: e.messageURL,
    body: e.messageBody,
  }),
});

function classifyFlare(classType) {
  if (!classType) return 'neutral';
  const c = classType[0]?.toUpperCase();
  if (c === 'X') return 'danger';
  if (c === 'M') return 'warn';
  if (c === 'C') return 'info';
  return 'safe';
}

function classifyKp(kp) {
  const n = Number(kp);
  if (!Number.isFinite(n)) return 'neutral';
  if (n >= 7) return 'danger';
  if (n >= 5) return 'warn';
  if (n >= 4) return 'info';
  return 'safe';
}

function extractCmeSpeed(e) {
  const a = e.cmeAnalyses?.[0];
  if (!a || a.speed == null) return '—';
  return `${a.speed} km/s`;
}

function extractMaxKp(e) {
  const indices = e.allKpIndex || [];
  if (!indices.length) return '—';
  return indices.reduce((max, i) => Math.max(max, Number(i.kpIndex) || 0), 0);
}
