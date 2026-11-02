import { createContext, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useCurrencies } from '../hooks/useCurrencies.js';
import { useLatestRates } from '../hooks/useLatestRates.js';
import { useLocalStorageState } from '../hooks/useLocalStorageState.js';

const MarketDataContext = createContext(null);

const BASE_KEY = 'hermes.base.v1';

/**
 * Fonte única de moedas, moeda base e taxas mais recentes.
 * A carteira, o mercado e o cabeçalho compartilham a mesma resposta — trocar a
 * base dispara exatamente uma requisição `/latest`.
 */
export function MarketDataProvider({ children }) {
  const [baseCode, setBaseCode] = useLocalStorageState(BASE_KEY, 'BRL');
  const currenciesState = useCurrencies();
  const latest = useLatestRates(baseCode);

  // Se a base salva não existir mais na API, volta para BRL (ou a primeira moeda).
  useEffect(() => {
    if (currenciesState.currencies.length === 0) return;
    const exists = currenciesState.currencies.some((currency) => currency.code === baseCode);
    if (exists) return;

    const fallback = currenciesState.currencies.some((currency) => currency.code === 'BRL')
      ? 'BRL'
      : currenciesState.currencies[0].code;
    setBaseCode(fallback);
  }, [currenciesState.currencies, baseCode, setBaseCode]);

  const value = useMemo(() => {
    const nameByCode = new Map(
      currenciesState.currencies.map((currency) => [currency.code, currency.name]),
    );

    return {
      baseCode,
      setBaseCode,
      currencies: currenciesState.currencies,
      currenciesLoading: currenciesState.isLoading,
      currenciesError: currenciesState.error,
      retryCurrencies: currenciesState.retry,
      rates: latest.rates,
      rateDate: latest.date,
      ratesLoading: latest.isLoading,
      ratesError: latest.error,
      retryRates: latest.retry,
      currencyName: (code, fallback) => nameByCode.get(code) ?? fallback ?? code,
    };
  }, [
    baseCode,
    setBaseCode,
    currenciesState.currencies,
    currenciesState.isLoading,
    currenciesState.error,
    currenciesState.retry,
    latest.rates,
    latest.date,
    latest.isLoading,
    latest.error,
    latest.retry,
  ]);

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

MarketDataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData precisa estar dentro de <MarketDataProvider>.');
  }
  return context;
}
