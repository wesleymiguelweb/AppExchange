import { useCallback, useEffect, useState } from 'react';

/**
 * Estado persistido em localStorage, com leitura preguiçosa e fallback seguro.
 * Toda serialização é JSON — o valor inicial pode ser uma função (lazy).
 *
 * `key` deve ser versionada (ex.: hermes.portfolio.v1) para permitir migrações
 * futuras sem quebrar preferências antigas.
 */
export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    const fallback = typeof initialValue === 'function' ? initialValue() : initialValue;

    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) return fallback;
      return JSON.parse(stored);
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* modo privado / quota cheia: a sessão continua sem persistir */
    }
  }, [key, state]);

  const reset = useCallback(() => {
    const fallback = typeof initialValue === 'function' ? initialValue() : initialValue;
    setState(fallback);
  }, [initialValue]);

  return [state, setState, reset];
}
