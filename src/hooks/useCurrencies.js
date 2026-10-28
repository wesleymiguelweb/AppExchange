import { useEffect, useState } from 'react';
import { getCurrencies } from '../services/frankfurter.js';

const FALLBACK_CURRENCIES = { AUD: 'Dólar australiano', BRL: 'Real brasileiro', CAD: 'Dólar canadense', CHF: 'Franco suíço', CNY: 'Yuan chinês', EUR: 'Euro', GBP: 'Libra esterlina', JPY: 'Iene japonês', USD: 'Dólar americano' };

export function useCurrencies() {
  // A lista reduzida permite usar os campos mesmo antes da API responder ou sem rede.
  const [currencies, setCurrencies] = useState(FALLBACK_CURRENCIES);
  useEffect(() => {
    const controller = new AbortController();
    async function loadCurrencies() {
      try {
        const data = await getCurrencies(controller.signal);
        if (!Array.isArray(data) && typeof data === 'object') {
          const validCurrencies = Object.fromEntries(Object.entries(data).filter(([code, name]) => /^[A-Z]{3}$/.test(code) && typeof name === 'string'));
          if (Object.keys(validCurrencies).length) setCurrencies(validCurrencies);
        }
      } catch (error) {
        if (error.name !== 'AbortError') { /* A lista reduzida mantém os campos utilizáveis sem rede. */ }
      }
    }
    loadCurrencies();
    return () => controller.abort();
  }, []);
  return currencies;
}
