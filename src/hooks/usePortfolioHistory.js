import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTimeSeriesForSymbols } from '../services/frankfurterApi.js';
import { isAbortError } from '../services/http.js';
import { getPeriodRange } from '../utils/dates.js';
import { quantityBefore } from '../utils/entries.js';
import { buildPortfolioSeries, buildSeriesMap } from '../utils/portfolio.js';

const EMPTY = { ratesByDate: null, range: null, isLoading: false, error: null };

/**
 * Histórico da carteira: busca uma única série multi-símbolos e recalcula o
 * valor dia a dia no cliente. Alterar quantidades não refaz a requisição.
 *
 * Retorna também a variação de cada moeda no período e a série de retorno da
 * carteira (considerando a variação de preço das posições que já existiam no
 * início da janela), usadas pelos painéis do dashboard.
 */
export function usePortfolioHistory(positions, baseCode, days = 30) {
  const [state, setState] = useState(EMPTY);
  const [attempt, setAttempt] = useState(0);

  const positionsKey = useMemo(
    () => (positions ?? []).map((position) => `${position.id}:${position.code}`).join('|'),
    [positions],
  );

  const symbolsKey = useMemo(
    () =>
      [...new Set((positions ?? []).map((position) => position.code))]
        .filter((code) => code && code !== baseCode)
        .sort()
        .join(','),
    [positions, baseCode],
  );

  useEffect(() => {
    if (!baseCode || !symbolsKey) {
      setState(EMPTY);
      return undefined;
    }

    const controller = new AbortController();
    const range = getPeriodRange({ days });

    setState((previous) => ({
      ...previous,
      range,
      isLoading: true,
      error: null,
    }));

    getTimeSeriesForSymbols({
      base: baseCode,
      symbols: symbolsKey.split(','),
      start: range.start,
      end: range.end,
      signal: controller.signal,
    })
      .then((result) => {
        setState({
          ratesByDate: result.rates,
          range,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setState({ ratesByDate: null, range, isLoading: false, error });
      });

    return () => controller.abort();
  }, [baseCode, symbolsKey, days, attempt]);

  const { points, seriesByCode, rangeStart } = useMemo(() => {
    if (!state.ratesByDate) {
      return { points: [], seriesByCode: {}, rangeStart: state.range?.start ?? null };
    }

    const start = state.range?.start ?? null;
    const withOpening = (positions ?? []).map((position) => ({
      ...position,
      quantityAtStart: start ? quantityBefore(position.entries, start) : 0,
    }));

    return {
      points: buildPortfolioSeries(state.ratesByDate, withOpening, baseCode),
      seriesByCode: buildSeriesMap(state.ratesByDate, symbolsKey ? symbolsKey.split(',') : []),
      rangeStart: start,
    };
  }, [state.ratesByDate, state.range, positions, baseCode, symbolsKey, positionsKey]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, points, seriesByCode, rangeStart, retry };
}
