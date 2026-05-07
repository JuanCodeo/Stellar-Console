// =============================================================
// js/app.js  —  Composition root del cliente
// SOLID — Dependency Inversion:
//   este archivo SOLO compone módulos. No contiene lógica de
//   dominio ni de UI específica.
// =============================================================

import config from './config.js';
import { onRateLimitChange } from './core/apiClient.js';
import { $, $$ } from './ui/dom.js';
import { initApodView } from './views/apod.view.js';
import { initDonkiView } from './views/donki.view.js';
import { initNeoView } from './views/neo.view.js';
import { initImagesView } from './views/images.view.js';

function initApiStatus() {
  const keyEl = $('[data-api-key]');
  const rateEl = $('[data-api-rate]');
  const resetEl = $('[data-api-reset]');
  if (keyEl) keyEl.textContent = config.apiKey === 'DEMO_KEY' ? 'DEMO_KEY (limitada)' : 'Personal';
  if (rateEl) rateEl.textContent = '—';
  if (resetEl) resetEl.textContent = '—';

  // Estado del rate-limit. La API de NASA usa una ventana móvil de 1 h:
  // cada petición caduca 60 min después de hacerse. Estimamos el tiempo
  // hasta que la primera petición de la ventana actual expire.
  const ROLLING_WINDOW_MS = 60 * 60 * 1000;
  let firstDecrementAt = null;
  let lastRemaining = null;
  let lastLimit = null;

  function formatCountdown(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return 'liberado';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  }

  function paintReset() {
    if (!resetEl) return;
    if (lastRemaining === null) { resetEl.textContent = '—'; return; }
    if (lastLimit && Number(lastRemaining) >= Number(lastLimit)) {
      resetEl.textContent = 'no necesario';
      return;
    }
    if (!firstDecrementAt) { resetEl.textContent = '—'; return; }
    const remainingMs = (firstDecrementAt + ROLLING_WINDOW_MS) - Date.now();
    if (remainingMs <= 0) {
      // Cerramos la ventana: si aún hay decrementos, comenzaremos a contar
      // de nuevo cuando llegue otra cabecera.
      firstDecrementAt = null;
      resetEl.textContent = 'sincronizando…';
      return;
    }
    resetEl.textContent = formatCountdown(remainingMs);
  }

  onRateLimitChange(({ remaining, limit }) => {
    const r = Number(remaining);
    const l = Number(limit);
    if (rateEl) rateEl.textContent = Number.isFinite(l) ? `${r} / ${l}` : `${r}`;

    // Si subió respecto al último valor, una request anterior expiró:
    // la ventana se "movió" → reiniciamos el ancla del contador.
    if (lastRemaining !== null && r > lastRemaining) {
      firstDecrementAt = Number.isFinite(l) && r < l ? Date.now() : null;
    }
    // Si bajó respecto al último valor (o es la primera observación con r < l),
    // y no había ancla, fijamos "ahora" como inicio de la ventana actual.
    if ((lastRemaining === null || r < lastRemaining) && Number.isFinite(l) && r < l && !firstDecrementAt) {
      firstDecrementAt = Date.now();
    }
    // Si llega al máximo, no hace falta reset.
    if (Number.isFinite(l) && r >= l) firstDecrementAt = null;

    lastRemaining = r;
    lastLimit = l;
    paintReset();
  });

  // Tick cada segundo para refrescar el countdown.
  setInterval(paintReset, 1000);
}

function initActiveNav() {
  const links = $$('.navbar__link');
  if (!links.length) return;

  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle('navbar__link--active', a.getAttribute('href') === `#${id}`));
  };

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75] });

    sections.forEach((s) => observer.observe(s));
  }
}

function boot() {
  initApiStatus();
  initActiveNav();
  initApodView();
  initDonkiView();
  initNeoView();
  initImagesView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
