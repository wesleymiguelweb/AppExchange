import { useLatestRates } from './useLatestRates.js';

/**
 * Taxa do par selecionado. Reaproveita o mapa completo de `useLatestRates`
 * para não fazer uma segunda requisição — conversor e tabela compartilham os dados.
 */
export function useExchangeRate(fromCode, toCode) {
  const latest = useLatestRates(fromCode);
  const rate = latest.rates && toCode ? (latest.rates[toCode] ?? null) : null;

  return {
    ...latest,
    rate,
    isReady: Number.isFinite(rate) && !latest.isLoading && !latest.error,
  };
}
