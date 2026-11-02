import { useCallback, useEffect, useState } from 'react';

/**
 * Toast com auto-dismiss. `tone` controla o contraste (success | error).
 */
export function useToast(durationMs = 4_000) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(null), durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [toast, durationMs]);

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, showToast, dismiss };
}
