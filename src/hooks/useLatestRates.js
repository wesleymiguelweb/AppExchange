import { useEffect, useState } from 'react';
import { getLatestRates } from '../services/frankfurter.js';

const REFRESH_INTERVAL = 60_000;

export function useLatestRates(base) {
  // Guarda uma cotação por código para busca, exibição e ordenação por taxa.
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setRates({ [base]: 1 });
    async function loadRates() {
      setLoading(true);
      try {
        const response = await getLatestRates(base, controller.signal);
        const validRates = Object.fromEntries(Object.entries(response.rates || {}).filter(([, rate]) => Number.isFinite(rate)));
        if (active) setRates({ [base]: 1, ...validRates });
      } catch (error) {
        if (active && error.name !== 'AbortError') setRates({ [base]: 1 });
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRates();
    return () => { active = false; controller.abort(); };
  }, [base, refreshKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((key) => key + 1), REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, []);

  return { rates, loading };
}
