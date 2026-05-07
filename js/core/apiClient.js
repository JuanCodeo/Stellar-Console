// =============================================================
// js/core/apiClient.js
// SOLID:
//   - Single Responsibility → wrapper único sobre fetch.
//   - Open/Closed           → los servicios extienden vía
//                             parámetros sin modificar este file.
//   - Dependency Inversion  → los servicios dependen de esta
//                             abstracción, no de fetch directo.
// Responsabilidades:
//   · Compone URLs con la API key.
//   · Maneja timeout, reintentos, errores tipados.
//   · Caché transparente con TTL por endpoint.
//   · Expone rate-limit (X-RateLimit-Remaining) por callback.
// =============================================================

import config from '../config.js';
import cache from './cache.js';
import { ApiError, RateLimitError, TimeoutError } from './errors.js';

const rateLimitListeners = new Set();

function emitRateLimit(remaining, limit) {
  rateLimitListeners.forEach((fn) => {
    try { fn({ remaining, limit }); } catch { /* noop */ }
  });
}

export function onRateLimitChange(listener) {
  rateLimitListeners.add(listener);
  return () => rateLimitListeners.delete(listener);
}

function buildUrl(base, path, params, withApiKey) {
  const url = new URL(path, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  if (withApiKey) {
    url.searchParams.set('api_key', config.apiKey);
  }
  return url.toString();
}

async function fetchWithTimeout(url, { timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new TimeoutError(url);
    throw new ApiError('Error de red al contactar la API.', { url, cause: err });
  } finally {
    clearTimeout(timer);
  }
}

async function performRequest(url, attempt = 1) {
  let response;
  try {
    response = await fetchWithTimeout(url, { timeoutMs: config.requestTimeout });
  } catch (err) {
    if (err instanceof TimeoutError) throw err;
    if (attempt < config.retry.attempts) {
      await new Promise((r) => setTimeout(r, config.retry.backoffMs * attempt));
      return performRequest(url, attempt + 1);
    }
    throw err;
  }

  // Rate limit headers (NASA expone X-RateLimit-Remaining/Limit).
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');
  if (remaining !== null) emitRateLimit(remaining, limit);

  if (response.status === 429) {
    throw new RateLimitError(url);
  }

  if (!response.ok) {
    let message = `Error ${response.status} al consultar la API.`;
    try {
      const data = await response.json();
      if (data && (data.error?.message || data.msg)) {
        message = data.error?.message || data.msg;
      }
    } catch { /* body no-JSON */ }
    throw new ApiError(message, { status: response.status, url });
  }

  // Algunos endpoints pueden devolver no-JSON (improbable aquí).
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return response.text();
  }
  return response.json();
}

/**
 * Solicitud principal. Acepta:
 *   - base: 'nasa' | 'images' | URL absoluta
 *   - path: ruta relativa
 *   - params: query string
 *   - cacheKey: string opcional para activar caché
 *   - cacheTtl: ms
 *   - withApiKey: añadir api_key (true para api.nasa.gov)
 */
export async function request({
  base = 'nasa',
  path = '',
  params = null,
  cacheKey = null,
  cacheTtl = 0,
  withApiKey = true,
} = {}) {
  if (cacheKey && cacheTtl > 0) {
    const hit = cache.get(cacheKey);
    if (hit !== null) return hit;
  }

  const baseUrl = config.endpoints[base] || base;
  const url = buildUrl(baseUrl, path, params, withApiKey);

  const data = await performRequest(url);

  if (cacheKey && cacheTtl > 0) {
    cache.set(cacheKey, data, cacheTtl);
  }
  return data;
}

export const apiClient = { request, onRateLimitChange };
export default apiClient;
