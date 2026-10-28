const API_BASE = 'https://api.frankfurter.dev/v1';

// Centraliza fetch, valida HTTP/JSON e recebe AbortSignal para cancelar consultas antigas.
async function request(path, signal) {
  const response = await fetch(`${API_BASE}${path}`, { signal });
  if (!response.ok) throw new Error('Não foi possível carregar os dados de câmbio. Tente novamente.');
  const data = await response.json();
  if (!data || typeof data !== 'object') throw new Error('A resposta da API veio em um formato inesperado.');
  return data;
}

export function getCurrencies(signal) {
  // Exemplo: GET /currencies retorna um objeto { USD: "United States Dollar", ... }.
  return request('/currencies', signal);
}

export function getLatestRate(base, quote, signal) {
  // Exemplo: getLatestRate('USD', 'BRL') consulta uma taxa específica para o conversor.
  return request(`/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quote)}`, signal);
}

export function getLatestRates(base, signal) {
  // Retorna as taxas para todas as moedas com a mesma moeda-base; alimenta a ordenação da tabela.
  return request(`/latest?base=${encodeURIComponent(base)}`, signal);
}

export function getHistoricalRates(base, quote, from, to, signal) {
  // Exemplo: /2026-01-01..2026-01-31?base=USD&symbols=BRL retorna a série histórica filtrada.
  return request(`/${from}..${to}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quote)}`, signal);
}
