import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTimeSeriesForSymbols } from '../services/frankfurterApi.js';
import { isAbortError } from '../services/http.js';
import { getPeriodRange } from '../utils/dates.js';
import { buildSeriesMap } from '../utils/portfolio.js';

const EMPTY = { ratesByDate: null, range: null, isLoading: false, error: null };

/**
 * Série de várias moedas contra uma base — alimenta os sparklines e a variação
 * de 7 dias do navegador de mercado. Uma requisição para todas as moedas.
 */
export function useMarketSeries(baseCode, codes, days = 7) {
  const [state, setState] = useState(EMPTY);
  const [attempt, setAttempt] = useState(0);

  const symbolsKey = useMemo(
    () =>
      [...new Set(codes ?? [])]
        .filter((code) => code && code !== baseCode)
        .sort()
        .join(','),
    [codes, baseCode],
  );

  useEffect(() => {
    if (!baseCode || !symbolsKey) {
      setState(EMPTY);
      return undefined;
    }

    const controller = new AbortController();
    const range = getPeriodRange({ days });

    setState({ ratesByDate: null, range, isLoading: true, error: null });

    getTimeSeriesForSymbols({
      base: baseCode,
      symbols: symbolsKey.split(','),
      start: range.start,
      end: range.end,
      signal: controller.signal,
    })
      .then((result) => {
        setState({ ratesByDate: result.rates, range, isLoading: false, error: null });
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setState({ ratesByDate: null, range, isLoading: false, error });
      });

    return () => controller.abort();
  }, [baseCode, symbolsKey, days, attempt]);

  const seriesByCode = useMemo(
    () => buildSeriesMap(state.ratesByDate, symbolsKey ? symbolsKey.split(',') : []),
    [state.ratesByDate, symbolsKey],
  );

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, seriesByCode, retry };
}
