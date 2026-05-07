// =============================================================
// js/core/errors.js
// SOLID — Single Responsibility: SOLO definir tipos de error.
// =============================================================

export class ApiError extends Error {
  constructor(message, { status = 0, url = '', cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.cause = cause;
  }
}

export class TimeoutError extends ApiError {
  constructor(url) {
    super('La solicitud tardó demasiado en responder.', { url, status: 0 });
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends ApiError {
  constructor(url) {
    super('Has alcanzado el límite de la API. Intenta más tarde o usa una clave personal.', { url, status: 429 });
    this.name = 'RateLimitError';
  }
}
