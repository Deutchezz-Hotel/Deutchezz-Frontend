import { useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  return reduced;
}
