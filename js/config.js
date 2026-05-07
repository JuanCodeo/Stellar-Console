// =============================================================
// js/config.js
// SOLID — Single Responsibility:
//   ÚNICA fuente de verdad para configuración de la app.
//   No contiene lógica de red ni de UI. Todos los servicios
//   importan desde aquí (Dependency Inversion).
//
// Para usar tu propia API key registra en https://api.nasa.gov
// y reemplaza DEMO_KEY abajo. DEMO_KEY tiene 30 req/hora y
// 50 req/día. Una clave personal sube el límite a 1000 req/hora.
// =============================================================

export const config = Object.freeze({
  // Cambia este valor por tu key personal cuando la tengas.
  apiKey: 'I5o4tIGSALr15LwmravYqk4KhGjgvCwmh4Yzyq8z',

  endpoints: Object.freeze({
    nasa: 'https://api.nasa.gov',
    images: 'https://images-api.nasa.gov',
  }),

  // TTL de caché por servicio (en milisegundos).
  cacheTtl: Object.freeze({
    apod: 1000 * 60 * 30,        // 30 min
    donki: 1000 * 60 * 30,       // 30 min — eventos espaciales
    neo: 1000 * 60 * 30,
    images: 1000 * 60 * 15,
  }),

  // Tiempo máximo de espera para una request (ms).
  requestTimeout: 12_000,

  // Reintentos en caso de error de red (sin reintentar 4xx).
  retry: Object.freeze({
    attempts: 2,
    backoffMs: 700,
  }),
});

export default config;
