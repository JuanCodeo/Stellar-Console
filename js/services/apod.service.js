// =============================================================
// js/services/apod.service.js
// SOLID — Single Responsibility: SOLO Astronomy Picture of the Day.
// Documentación: https://api.nasa.gov  →  APOD
//   GET /planetary/apod
//   Query: date=YYYY-MM-DD | start_date+end_date | count=N | thumbs=true
// =============================================================

import apiClient from '../core/apiClient.js';
import config from '../config.js';
import { toIsoDate } from '../utils/format.js';

// APOD comenzó el 1995-06-16. Se usa para validar fechas.
export const APOD_MIN_DATE = '1995-06-16';

/**
 * Obtiene el APOD del día (o de una fecha dada).
 * @param {string} [date] Fecha ISO YYYY-MM-DD; por defecto hoy.
 */
export async function getApod(date = '') {
  const params = { thumbs: true };
  if (date) params.date = date;

  const cacheKey = `apod::${date || 'today'}`;
  return apiClient.request({
    base: 'nasa',
    path: '/planetary/apod',
    params,
    cacheKey,
    cacheTtl: config.cacheTtl.apod,
  });
}

/**
 * Devuelve un APOD aleatorio dentro del rango válido.
 */
export async function getRandomApod() {
  const data = await apiClient.request({
    base: 'nasa',
    path: '/planetary/apod',
    params: { count: 1, thumbs: true },
  });
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Hoy en formato ISO (zona horaria del navegador). Útil para inputs.
 */
export function getTodayIso() {
  return toIsoDate(new Date());
}
