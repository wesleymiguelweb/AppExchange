import { useCallback, useEffect, useState } from 'react';
import { getCurrencies } from '../services/frankfurterApi.js';
import { isAbortError } from '../services/http.js';

const INITIAL_STATE = { currencies: [], isLoading: true, error: null };

/**
 * Carrega a lista de moedas suportadas uma única vez.
 * `retry` permite repetir a requisição sem recarregar a página.
 */
export function useCurrencies() {
  const [state, setState] = useState(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    getCurrencies({ signal: controller.signal })
      .then((currencies) => {
        setState({ currencies, isLoading: false, error: null });
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setState({ currencies: [], isLoading: false, error });
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
