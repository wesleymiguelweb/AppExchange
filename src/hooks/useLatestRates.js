import { useCallback, useEffect, useState } from 'react';
import { getLatestRates } from '../services/frankfurterApi.js';
import { isAbortError } from '../services/http.js';

/**
 * Taxas mais recentes para uma moeda base (todas as moedas de destino de uma vez).
 * Uma requisição por base — o conversor e a tabela compartilham o mesmo resultado.
 */
export function useLatestRates(base) {
  const [state, setState] = useState({
    rates: null,
    date: null,
    isLoading: Boolean(base),
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!base) {
      setState({ rates: null, date: null, isLoading: false, error: null });
      return undefined;
    }

    const controller = new AbortController();
    // Limpa as taxas ao trocar a base para nunca exibir par de moedas inconsistente.
    setState({ rates: null, date: null, isLoading: true, error: null });

    getLatestRates(base, { signal: controller.signal })
      .then((result) => {
        setState({ rates: result.rates, date: result.date, isLoading: false, error: null });
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setState({ rates: null, date: null, isLoading: false, error });
      });

    return () => controller.abort();
  }, [base, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
