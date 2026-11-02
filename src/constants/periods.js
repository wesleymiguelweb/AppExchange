/**
 * Períodos do gráfico — exatamente os do wireframe (7D, 15D, 30D, 3M, 6M, 1A, 5A, 10A).
 * `days` alimenta a janela de datas enviada à Frankfurter.
 */
export const PERIODS = [
  { id: '7D', days: 7 },
  { id: '15D', days: 15 },
  { id: '30D', days: 30 },
  { id: '3M', days: 90 },
  { id: '6M', days: 180 },
  { id: '1A', days: 365 },
  { id: '5A', days: 1825 },
  { id: '10A', days: 3650 },
];

export const DEFAULT_PERIOD_ID = '30D';

export function findPeriod(periodId) {
  return PERIODS.find((period) => period.id === periodId) ?? PERIODS[2];
}
