'use client';

import { useCallback, useRef } from 'react';

export function useHaptic() {
  const lastTickRef = useRef(0);

  const vibrate = useCallback((ms: number = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    if (now - lastTickRef.current > 50) {
      lastTickRef.current = now;
      vibrate(5);
    }
  }, [vibrate]);

  const snap = useCallback(() => vibrate(20), [vibrate]);
  const heavy = useCallback(() => vibrate(30), [vibrate]);
  const warning = useCallback(() => vibrate(40), [vibrate]);

  return { vibrate, tick, snap, heavy, warning };
}
