// =============================================================
// js/core/cache.js
// SOLID — Single Responsibility: SOLO almacenamiento con TTL.
//   Wrapper sobre localStorage con expiración. Si localStorage
//   falla (modo privado, lleno) hace fallback a un Map en RAM.
// =============================================================

const NAMESPACE = 'stellar-console::v1::';
const memory = new Map();

const safeStore = {
  get(key) {
    try { return localStorage.getItem(key); }
    catch { return memory.has(key) ? memory.get(key) : null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); }
    catch { memory.set(key, value); }
  },
  remove(key) {
    try { localStorage.removeItem(key); }
    catch { memory.delete(key); }
  },
};

export const cache = {
  /**
   * Recupera un valor JSON. Devuelve null si expiró o no existe.
   */
  get(key) {
    const raw = safeStore.get(NAMESPACE + key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        safeStore.remove(NAMESPACE + key);
        return null;
      }
      return parsed.value;
    } catch {
      return null;
    }
  },

  /**
   * Guarda un valor con TTL en ms. Si serializar falla, ignora silenciosamente.
   */
  set(key, value, ttlMs) {
    try {
      const payload = JSON.stringify({
        value,
        expiresAt: Date.now() + (Number.isFinite(ttlMs) ? ttlMs : 0),
      });
      safeStore.set(NAMESPACE + key, payload);
    } catch { /* noop */ }
  },

  remove(key) {
    safeStore.remove(NAMESPACE + key);
  },
};

export default cache;
