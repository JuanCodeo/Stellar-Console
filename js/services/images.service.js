// =============================================================
// js/services/images.service.js
// SOLID — Single Responsibility: SOLO NASA Image and Video Library.
// Documentación: https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf
//   Base: https://images-api.nasa.gov
//   GET /search?q=&media_type=image|video|audio&page=
//   GET /asset/{nasa_id}  → variantes de un activo
// Importante: este endpoint NO requiere api_key.
// =============================================================

import apiClient from '../core/apiClient.js';
import config from '../config.js';

/**
 * Busca medios por palabra clave.
 */
export async function search({ q, media_type = 'image', page = 1 }) {
  if (!q || !q.trim()) throw new Error('La búsqueda requiere una palabra clave.');
  const cacheKey = `images::${media_type}::${q}::${page}`;
  const data = await apiClient.request({
    base: 'images',
    path: '/search',
    params: { q, media_type, page },
    withApiKey: false,
    cacheKey,
    cacheTtl: config.cacheTtl.images,
  });
  return normalizeSearch(data);
}

function normalizeSearch(data) {
  const items = data?.collection?.items ?? [];
  return items.map((item) => {
    const meta = item.data?.[0] ?? {};
    const preview = item.links?.find((l) => l.rel === 'preview')?.href || '';
    return {
      id: meta.nasa_id,
      title: meta.title,
      description: meta.description,
      mediaType: meta.media_type,
      dateCreated: meta.date_created,
      photographer: meta.photographer,
      keywords: meta.keywords || [],
      thumbnail: preview,
      assetHref: item.href, // JSON con variantes (orig, large, medium, small)
    };
  });
}

/**
 * Resuelve la URL "grande" o "original" de un asset (cuando hace falta).
 */
export async function getAsset(href) {
  if (!href) return [];
  // El href del search apunta a un JSON con un array de URLs.
  const res = await fetch(href);
  if (!res.ok) return [];
  const list = await res.json();
  return Array.isArray(list) ? list : [];
}
