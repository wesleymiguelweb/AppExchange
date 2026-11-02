import { useCallback, useEffect, useState } from 'react';
import { getTimeSeries } from '../services/frankfurterApi.js';
import { isAbortError } from '../services/http.js';
import { getPeriodRange } from '../utils/dates.js';

const EMPTY_STATE = { points: [], range: null, isLoading: false, error: null };

/**
 * Série histórica do par no período escolhido.
 * Depende de from/to/dias — trocar de período cancela a requisição anterior.
 */
export function useHistoricalRates(fromCode, toCode, period) {
  const [state, setState] = useState(EMPTY_STATE);
  const [attempt, setAttempt] = useState(0);

  const periodDays = period?.days ?? 0;

  useEffect(() => {
    if (!fromCode || !toCode || fromCode === toCode || !periodDays) {
      setState(EMPTY_STATE);
      return undefined;
    }

    const controller = new AbortController();
    const range = getPeriodRange({ days: periodDays });

    setState({ points: [], range, isLoading: true, error: null });

    getTimeSeries({
      from: fromCode,
      to: toCode,
      start: range.start,
      end: range.end,
      signal: controller.signal,
    })
      .then((result) => {
        setState({ points: result.points, range, isLoading: false, error: null });
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setState({ points: [], range, isLoading: false, error });
      });

    return () => controller.abort();
  }, [fromCode, toCode, periodDays, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
