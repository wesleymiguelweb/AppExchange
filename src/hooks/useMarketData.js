import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHistoricalRates, getLatestRate } from '../services/frankfurter.js';
import { toIsoDate } from '../utils/formatters.js';

const REFRESH_INTERVAL = 60_000;

export function useMarketData(base, quote, days) {
  // Hook reúne estado de carregamento, erros, taxa atual e série compartilhada pelos cartões.
  const [data, setData] = useState({ base: '', quote: '', days: 0, rate: null, date: '', history: [], checkedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    const timer = window.setInterval(refresh, REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (base === quote) {
      setData({ base, quote, days, rate: null, date: '', history: [], checkedAt: null });
      setError('Escolha duas moedas diferentes para consultar o câmbio.');
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const end = new Date();
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - days);
    setLoading(true);
    setError('');
    async function loadMarketData() {
      try {
        // A cotação atual e o histórico são independentes; um problema no gráfico não bloqueia o conversor.
        const [latestResult, seriesResult] = await Promise.allSettled([
          getLatestRate(base, quote, controller.signal),
          getHistoricalRates(base, quote, toIsoDate(start), toIsoDate(end), controller.signal),
        ]);
        if (latestResult.status === 'rejected') throw latestResult.reason;
        if (seriesResult.status === 'rejected' && seriesResult.reason.name === 'AbortError') return;
        const latest = latestResult.value;
        const rate = latest?.rates?.[quote];
        if (!Number.isFinite(rate)) throw new Error('A API não retornou uma cotação válida para este par.');
        const latestDate = typeof latest.date === 'string' && Number.isFinite(Date.parse(`${latest.date}T12:00:00Z`)) ? latest.date : '';
        const series = seriesResult.status === 'fulfilled' ? seriesResult.value : null;
        const history = Object.entries(series?.rates || {})
          .map(([date, rates]) => ({ date, rate: rates?.[quote] }))
          .filter((point) => Number.isFinite(point.rate) && Number.isFinite(Date.parse(`${point.date}T12:00:00Z`)))
          .sort((a, b) => a.date.localeCompare(b.date));
        if (!history.length && latestDate) history.push({ date: latestDate, rate });
        setData({ base, quote, days, rate, date: latestDate, history, checkedAt: new Date() });
        if (seriesResult.status === 'rejected') setError('A cotação atual carregou, mas o histórico está indisponível. Tente atualizar novamente.');
      } catch (reason) {
        if (reason.name !== 'AbortError') setError(reason.message || 'Falha ao consultar as taxas.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadMarketData();
    return () => controller.abort();
  }, [base, quote, days, refreshKey]);

  const stats = useMemo(() => {
    // Métricas derivadas da série; useMemo evita recalcular até os pontos históricos mudarem.
    const rates = data.history.map(({ rate }) => rate);
    if (!rates.length) return null;
    return {
      low: Math.min(...rates),
      high: Math.max(...rates),
      average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
      change: rates.length > 1 ? ((rates.at(-1) / rates[0]) - 1) * 100 : 0,
    };
  }, [data.history]);

  const samePair = data.base === base && data.quote === quote;
  const samePeriod = samePair && data.days === days;
  return {
    rate: samePair ? data.rate : null,
    date: samePair ? data.date : '',
    history: samePeriod ? data.history : [],
    checkedAt: samePair ? data.checkedAt : null,
    stats: samePeriod ? stats : null,
    loading,
    error,
    refresh,
  };
}
