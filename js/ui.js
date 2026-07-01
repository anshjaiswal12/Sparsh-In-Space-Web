/** Shared UI helpers for mobile/desktop detection and input debouncing */

export function isMobileDevice() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
}

/** Prevent touchstart + click from firing the same UI action twice */
export function guardRapidAction(fn, cooldownMs = 400) {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last < cooldownMs) return;
    last = now;
    return fn(...args);
  };
}
