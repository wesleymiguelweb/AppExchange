import { ApiError, fetchJson } from './http.js';

export const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v1';

function assertRates(payload) {
  const { rates } = payload ?? {};
  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) {
    throw new ApiError('Resposta sem o mapa de taxas', { type: 'invalid' });
  }
  return rates;
}

function buildUrl(path, params = {}) {
  const url = new URL(`${FRANKFURTER_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

/**
 * GET /v1/currencies — { "BRL": "Brazilian Real", ... }
 * Normalizado para [{ code, name }] já ordenado por código.
 */
export async function getCurrencies({ signal } = {}) {
  const data = await fetchJson(buildUrl('/currencies'), { signal });

  const currencies = Object.entries(data)
    .filter(([code, name]) => typeof code === 'string' && typeof name === 'string')
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.code.localeCompare(b.code));

  if (currencies.length === 0) {
    throw new ApiError('O serviço não retornou moedas', { type: 'invalid' });
  }

  return currencies;
}

/**
 * GET /v1/latest?base=BRL — taxas do último dia útil contra a moeda base.
 */
export async function getLatestRates(base, { signal } = {}) {
  if (!base) throw new ApiError('Moeda base ausente', { type: 'invalid' });

  const data = await fetchJson(buildUrl('/latest', { base }), { signal });
  const rates = assertRates(data);

  return {
    base: typeof data.base === 'string' ? data.base : base,
    date: typeof data.date === 'string' ? data.date : null,
    rates,
  };
}

/**
 * GET /v1/{start}..{end}?base=BRL&symbols=USD — série temporal.
 * Devolve pontos ordenados por data, ignorando valores ausentes ou inválidos.
 */
export async function getTimeSeries({ from, to, start, end, signal }) {
  if (!from || !to || !start || !end) {
    throw new ApiError('Parâmetros insuficientes para a série histórica', { type: 'invalid' });
  }

  const data = await fetchJson(
    buildUrl(`/${start}..${end}`, { base: from, symbols: to }),
    { signal },
  );
  const rates = assertRates(data);

  const points = Object.entries(rates)
    .map(([date, dayRates]) => ({ date, rate: dayRates?.[to] }))
    .filter((point) => Number.isFinite(point.rate) && point.rate > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    startDate: typeof data.start_date === 'string' ? data.start_date : start,
    endDate: typeof data.end_date === 'string' ? data.end_date : end,
    points,
  };
}

/**
 * GET /v1/{start}..{end}?base=BRL&symbols=USD,EUR,GBP
 * Uma única chamada devolve a série de várias moedas — usado pela carteira,
 * pelos sparklines do mercado e pelo gráfico de performance.
 */
export async function getTimeSeriesForSymbols({ base, symbols, start, end, signal }) {
  const uniqueSymbols = [...new Set(symbols ?? [])].filter(
    (code) => typeof code === 'string' && code.length === 3 && code !== base,
  );

  if (!base || !start || !end) {
    throw new ApiError('Parâmetros insuficientes para a série histórica', { type: 'invalid' });
  }

  // Sem símbolos além da base não há série para buscar: a base vale 1 por definição.
  if (uniqueSymbols.length === 0) {
    return { startDate: start, endDate: end, base, rates: {} };
  }

  const data = await fetchJson(
    buildUrl(`/${start}..${end}`, { base, symbols: uniqueSymbols.join(',') }),
    { signal },
  );
  const rates = assertRates(data);

  return {
    startDate: typeof data.start_date === 'string' ? data.start_date : start,
    endDate: typeof data.end_date === 'string' ? data.end_date : end,
    base,
    rates,
  };
}
