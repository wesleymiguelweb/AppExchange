import { useEffect, useState } from 'react';

/** Atrasa a atualização de um valor — usado na busca da tabela. */
export function useDebouncedValue(value, delayMs = 180) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}
