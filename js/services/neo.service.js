// =============================================================
// js/services/neo.service.js
// SOLID — Single Responsibility: SOLO Near-Earth Objects (NeoWs).
// Documentación: https://api.nasa.gov  →  Asteroids - NeoWs
//   GET /neo/rest/v1/feed?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
//   Restricción: end_date - start_date ≤ 7 días.
// =============================================================

import apiClient from '../core/apiClient.js';
import config from '../config.js';

const MAX_RANGE_DAYS = 7;

function diffDays(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Feed semanal de objetos cercanos.
 * @param {object} opts
 * @param {string} opts.start_date YYYY-MM-DD
 * @param {string} opts.end_date   YYYY-MM-DD (≤ start + 7d)
 */
export async function getFeed({ start_date, end_date }) {
  if (!start_date || !end_date) throw new Error('Faltan fechas start_date/end_date.');
  const days = diffDays(start_date, end_date);
  if (days < 0) throw new Error('end_date no puede ser anterior a start_date.');
  if (days > MAX_RANGE_DAYS) {
    throw new Error(`El rango máximo permitido por NeoWs es ${MAX_RANGE_DAYS} días.`);
  }

  const cacheKey = `neo::${start_date}::${end_date}`;
  const data = await apiClient.request({
    base: 'nasa',
    path: '/neo/rest/v1/feed',
    params: { start_date, end_date },
    cacheKey,
    cacheTtl: config.cacheTtl.neo,
  });
  return data;
}

/**
 * Aplana la respuesta del feed (que viene agrupada por fecha) en una
 * sola lista ordenada por fecha de aproximación.
 */
export function flattenFeed(feed) {
  if (!feed?.near_earth_objects) return [];
  const all = [];
  Object.entries(feed.near_earth_objects).forEach(([date, objects]) => {
    objects.forEach((obj) => {
      const approach = (obj.close_approach_data || []).find((a) => a.close_approach_date === date)
        || obj.close_approach_data?.[0]
        || {};
      all.push({
        id: obj.id,
        name: obj.name,
        nasaUrl: obj.nasa_jpl_url,
        hazardous: !!obj.is_potentially_hazardous_asteroid,
        magnitude: obj.absolute_magnitude_h,
        diameterMinKm: obj.estimated_diameter?.kilometers?.estimated_diameter_min,
        diameterMaxKm: obj.estimated_diameter?.kilometers?.estimated_diameter_max,
        approachDate: approach.close_approach_date_full || approach.close_approach_date || date,
        velocityKmh: approach.relative_velocity?.kilometers_per_hour,
        missDistanceKm: approach.miss_distance?.kilometers,
        missDistanceLunar: approach.miss_distance?.lunar,
        orbitingBody: approach.orbiting_body,
      });
    });
  });
  return all.sort((a, b) => new Date(a.approachDate) - new Date(b.approachDate));
}

/**
 * Métricas resumidas del feed (para el panel).
 */
export function summarize(items) {
  if (!items.length) return null;
  let closest = items[0];
  let fastest = items[0];
  let hazardous = 0;
  for (const it of items) {
    if (it.hazardous) hazardous += 1;
    if (Number(it.missDistanceKm) < Number(closest.missDistanceKm)) closest = it;
    if (Number(it.velocityKmh) > Number(fastest.velocityKmh)) fastest = it;
  }
  return { total: items.length, hazardous, closest, fastest };
}
