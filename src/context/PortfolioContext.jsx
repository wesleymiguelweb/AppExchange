import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useLocalStorageState } from '../hooks/useLocalStorageState.js';
import { buildPortfolioRows, computePortfolioTotals } from '../utils/portfolio.js';
import { useMarketData } from './MarketDataContext.jsx';

const PortfolioContext = createContext(null);

const STORAGE_KEY = 'hermes.portfolio.v1';

/** Carteira de demonstração — custo médio em BRL por unidade. */
export const DEMO_POSITIONS = [
  { id: 'demo-usd', code: 'USD', quantity: 4200, avgCost: 5.15 },
  { id: 'demo-eur', code: 'EUR', quantity: 1800, avgCost: 6.05 },
  { id: 'demo-gbp', code: 'GBP', quantity: 950, avgCost: 7.1 },
  { id: 'demo-jpy', code: 'JPY', quantity: 250000, avgCost: 0.036 },
  { id: 'demo-brl', code: 'BRL', quantity: 8500, avgCost: 1 },
];

function createDemoPortfolio() {
  return DEMO_POSITIONS.map((position) => ({ ...position }));
}

function makeId(code) {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `pos-${String(code).toLowerCase()}-${random}`;
}

function sanitizePositions(value) {
  if (!Array.isArray(value)) return createDemoPortfolio();

  return value
    .filter(
      (position) =>
        position &&
        typeof position.code === 'string' &&
        /^[A-Z]{3}$/.test(position.code) &&
        Number.isFinite(position.quantity) &&
        position.quantity > 0 &&
        Number.isFinite(position.avgCost) &&
        position.avgCost > 0,
    )
    .map((position) => ({
      id: typeof position.id === 'string' ? position.id : makeId(position.code),
      code: position.code,
      quantity: position.quantity,
      avgCost: position.avgCost,
    }));
}

/**
 * Carteira multi-moeda persistida. As posições são armazenadas em quantidade e
 * custo médio (BRL); o valor de mercado é sempre derivado das taxas atuais.
 */
export function PortfolioProvider({ children }) {
  const market = useMarketData();
  const [positions, setPositions, resetStored] = useLocalStorageState(STORAGE_KEY, createDemoPortfolio);

  useEffect(() => {
    // Corrige dados antigos/corrompidos uma única vez.
    const sanitized = sanitizePositions(positions);
    if (sanitized.length !== positions.length) setPositions(sanitized);
  }, [positions, setPositions]);

  const addPosition = useCallback(
    ({ code, quantity, avgCost }) => {
      const next = {
        id: makeId(code),
        code: String(code).toUpperCase(),
        quantity: Number(quantity),
        avgCost: Number(avgCost),
      };
      setPositions((current) => [...current, next]);
      return next;
    },
    [setPositions],
  );

  const updatePosition = useCallback(
    (id, patch) => {
      setPositions((current) =>
        current.map((position) =>
          position.id === id
            ? {
                ...position,
                ...patch,
                quantity: Number(patch.quantity ?? position.quantity),
                avgCost: Number(patch.avgCost ?? position.avgCost),
              }
            : position,
        ),
      );
    },
    [setPositions],
  );

  const removePosition = useCallback(
    (id) => {
      setPositions((current) => current.filter((position) => position.id !== id));
    },
    [setPositions],
  );

  const clearPortfolio = useCallback(() => setPositions([]), [setPositions]);

  const resetPortfolio = useCallback(() => {
    resetStored();
    setPositions(createDemoPortfolio());
  }, [resetStored, setPositions]);

  const value = useMemo(() => {
    const rows = buildPortfolioRows(positions, market.baseCode, market.rates);
    const totals = computePortfolioTotals(rows);

    return {
      positions,
      rows: totals.rows,
      totalValue: totals.totalValue,
      totalCost: totals.totalCost,
      totalPnl: totals.totalPnl,
      pnlPercent: totals.pnlPercent,
      positionsCount: totals.positionsCount,
      isReady: !market.ratesLoading && !market.ratesError && market.rates !== null,
      addPosition,
      updatePosition,
      removePosition,
      clearPortfolio,
      resetPortfolio,
      hasPosition: (code) => positions.some((position) => position.code === code),
      getPosition: (code) => positions.find((position) => position.code === code) ?? null,
    };
  }, [
    positions,
    market.baseCode,
    market.rates,
    market.ratesLoading,
    market.ratesError,
    addPosition,
    updatePosition,
    removePosition,
    clearPortfolio,
    resetPortfolio,
  ]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

PortfolioProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio precisa estar dentro de <PortfolioProvider>.');
  }
  return context;
}
