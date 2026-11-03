import { isOutflow, sortEntriesDesc, summarizeEntries } from './entries.js';
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
 * Enriquece cada moeda da carteira com o valor de mercado, o custo e o
 * resultado.
 *
 * O custo vem do histórico de movimentações (custo médio ponderado em BRL),
 * e não de um campo editável: cada entrada e saída altera a quantidade e o
 * preço médio da mesma posição. Posições migradas de versões antigas sem
 * movimentações usam o `avgCost` antigo como preço de referência.
 */
export function buildPortfolioRows(positions, baseCode, rates) {
  const brlRate = brlToBase(baseCode, rates);

  return (positions ?? []).map((position) => {
    const unitValue = unitValueInBase(position.code, baseCode, rates);
    const quantity = Number.isFinite(position.quantity) ? position.quantity : 0;
    const value = unitValue !== null ? quantity * unitValue : null;

    const summary = summarizeEntries(position.entries);
    const avgCost = summary.avgCost ?? (Number.isFinite(position.avgCost) ? position.avgCost : null);
    const cost = avgCost !== null ? quantity * avgCost : null;
    const costBase = brlRate !== null && cost !== null ? cost * brlRate : null;

    const pnl = value !== null && costBase !== null ? value - costBase : null;
    const pnlPercent =
      costBase !== null && costBase > 0 && pnl !== null ? (pnl / costBase) * 100 : null;

    return {
      ...position,
      quantity,
      avgCost,
      unitValue,
      value,
      cost: costBase,
      pnl,
      pnlPercent,
      share: 0,
      entries: sortEntriesDesc(position.entries),
      entriesCount: position.entries?.length ?? 0,
    };
  });
}

/**
 * Situação da carteira em uma data de referência: aplica ao estado inicial
 * (movimentações anteriores à janela) as movimentações do período.
 */
function quantityAt(entries, initialQuantity, upTo) {
  return (entries ?? []).reduce((total, entry) => {
    if (entry.date > upTo) return total;
    return total + (isOutflow(entry) ? -entry.quantity : entry.quantity);
  }, initialQuantity);
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
 *
 * Quando as posições têm movimentações, a quantidade de cada dia respeita as
 * entradas e saídas registradas — o gráfico mostra a evolução real do
 * patrimônio, não a carteira atual projetada no passado.
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
      const quantity = position.entries
        ? quantityAt(position.entries, position.quantityAtStart ?? 0, date)
        : position.quantity;
      if (!Number.isFinite(quantity) || quantity <= 0) return;

      if (position.code === baseCode) {
        total += quantity;
        return;
      }
      const rate = lastKnown.get(position.code);
      if (!Number.isFinite(rate) || rate <= 0) return;
      total += quantity / rate;
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

/**
 * Série + variação percentual por moeda, a partir de um mapa multi-símbolos.
 * Os pontos chegam no formato da série do Frankfurter (1 base = rate code).
 */
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

