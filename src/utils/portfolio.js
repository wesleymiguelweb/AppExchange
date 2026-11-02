import { toSeries } from './series.js';

/**
 * Quanto vale 1 unidade de `code` na moeda base.
 * A Frankfurter devolve `1 base = rate code`; portanto `1 code = 1 / rate base`.
 * A própria base vale 1 e não aparece no mapa.
 */
export function unitValueInBase(code, baseCode, rates) {
  if (!code) return null;
  if (code === baseCode) return 1;
  const rate = rates?.[code];
  return Number.isFinite(rate) && rate > 0 ? 1 / rate : null;
}

/** Converte um valor em BRL para a moeda base usando a taxa mais recente. */
export function brlToBase(baseCode, rates) {
  return unitValueInBase('BRL', baseCode, rates);
}

/**
 * Enriquece as posições com valor de mercado, custo e resultado.
 * O custo é armazenado em BRL (`avgCost` por unidade) para não se corromper
 * quando o usuário troca a moeda base.
 */
export function buildPortfolioRows(positions, baseCode, rates) {
  const brlRate = brlToBase(baseCode, rates);

  return (positions ?? []).map((position) => {
    const unitValue = unitValueInBase(position.code, baseCode, rates);
    const value =
      unitValue !== null && Number.isFinite(position.quantity)
        ? position.quantity * unitValue
        : null;

    const cost =
      brlRate !== null && Number.isFinite(position.quantity) && Number.isFinite(position.avgCost)
        ? position.quantity * position.avgCost * brlRate
        : null;

    const pnl = value !== null && cost !== null ? value - cost : null;
    const pnlPercent = cost !== null && cost > 0 && pnl !== null ? (pnl / cost) * 100 : null;

    return {
      ...position,
      unitValue,
      value,
      cost,
      pnl,
      pnlPercent,
      share: 0,
    };
  });
}

export function computePortfolioTotals(rows) {
  const valued = (rows ?? []).filter((row) => row.value !== null);
  const totalValue = valued.reduce((sum, row) => sum + row.value, 0);
  const totalCost = valued.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const totalPnl = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : null;

  const withShare = (rows ?? []).map((row) => ({
    ...row,
    share: totalValue > 0 && row.value !== null ? row.value / totalValue : 0,
  }));

  return {
    rows: withShare,
    totalValue,
    totalCost,
    totalPnl,
    pnlPercent,
    positionsCount: rows?.length ?? 0,
  };
}

/**
 * Reconstrói o valor da carteira dia a dia, carregando a última cotação
 * conhecida de cada moeda (fins de semana/feriados não têm publicação).
 */
export function buildPortfolioSeries(ratesByDate, positions, baseCode) {
  if (!ratesByDate || !Array.isArray(positions) || positions.length === 0) return [];

  const dates = Object.keys(ratesByDate).sort();
  const lastKnown = new Map();
  const points = [];

  dates.forEach((date) => {
    const dayRates = ratesByDate[date] ?? {};
    Object.entries(dayRates).forEach(([code, rate]) => {
      if (Number.isFinite(rate) && rate > 0) lastKnown.set(code, rate);
    });

    let total = 0;
    let complete = false;

    positions.forEach((position) => {
      if (!Number.isFinite(position.quantity)) return;
      if (position.code === baseCode) {
        total += position.quantity;
        return;
      }
      const rate = lastKnown.get(position.code);
      if (!Number.isFinite(rate) || rate <= 0) return;
      total += position.quantity / rate;
    });

    // Só considera o dia quando ao menos uma posição tinha cotação conhecida.
    complete = positions.some(
      (position) =>
        position.code === baseCode || Number.isFinite(lastKnown.get(position.code)),
    );

    if (complete) points.push({ date, value: total });
  });

  return points;
}

/** Série + variação percentual por moeda, a partir de um mapa multi-símbolos. */
export function buildSeriesMap(ratesByDate, codes) {
  const map = {};

  (codes ?? []).forEach((code) => {
    const points = toSeries(ratesByDate, code);
    const variation =
      points.length > 1
        ? ((points[points.length - 1].rate - points[0].rate) / points[0].rate) * 100
        : null;

    map[code] = { points, variation };
  });

  return map;
}
