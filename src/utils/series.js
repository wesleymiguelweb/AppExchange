/** Transforma o mapa { "2026-10-20": { USD: 0.19 } } em pontos ordenados. */
export function toSeries(ratesByDate, targetCode) {
  if (!ratesByDate || typeof ratesByDate !== 'object') return [];

  return Object.entries(ratesByDate)
    .map(([date, rates]) => ({ date, rate: rates?.[targetCode] }))
    .filter((point) => Number.isFinite(point.rate) && point.rate > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Resume o período: atual, mínima, máxima, média e variação percentual. */
export function summarizeSeries(points) {
  if (!Array.isArray(points) || points.length === 0) return null;

  const rates = points.map((point) => point.rate);
  const first = rates[0];
  const last = rates[rates.length - 1];
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const average = rates.reduce((total, rate) => total + rate, 0) / rates.length;

  return {
    first,
    last,
    min,
    max,
    average,
    variation: first > 0 ? ((last - first) / first) * 100 : 0,
    count: points.length,
    startDate: points[0].date,
    endDate: points[points.length - 1].date,
  };
}

/**
 * Reduz a série para caber no gráfico (10 anos ≈ 2.600 pontos).
 * Mantém sempre o primeiro e o último ponto.
 */
export function downsampleSeries(points, maxPoints = 180) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points ?? [];

  const lastIndex = points.length - 1;
  const step = lastIndex / (maxPoints - 1);
  const sampled = [];

  for (let index = 0; index < maxPoints; index += 1) {
    sampled.push(points[Math.round(index * step)]);
  }

  return sampled.filter(
    (point, index) => index === 0 || point.date !== sampled[index - 1].date,
  );
}
