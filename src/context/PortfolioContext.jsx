import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useLocalStorageState } from '../hooks/useLocalStorageState.js';
import { summarizeEntries } from '../utils/entries.js';
import { buildPortfolioRows, computePortfolioTotals } from '../utils/portfolio.js';
import { useMarketData } from './MarketDataContext.jsx';

const PortfolioContext = createContext(null);

// Prefixo das chaves de armazenamento de cada versão do modelo.
const STORAGE_KEY = 'hermes.portfolio.v3';
const LEGACY_KEYS = ['hermes.portfolio.v2', 'hermes.portfolio.v1'];

/**
 * Carteira de demonstração. Cada moeda tem seu próprio histórico de
 * movimentações: entradas e saídas ao longo do tempo; a posição (quantidade e
 * preço médio) é sempre derivada desse histórico.
 */
export const DEMO_POSITIONS = [
  { id: 'demo-usd', code: 'USD', quantity: 4200, avgCost: 5.15 },
  { id: 'demo-eur', code: 'EUR', quantity: 1800, avgCost: 6.05 },
  { id: 'demo-gbp', code: 'GBP', quantity: 950, avgCost: 7.1 },
  { id: 'demo-jpy', code: 'JPY', quantity: 250000, avgCost: 0.036 },
  { id: 'demo-brl', code: 'BRL', quantity: 8500, avgCost: 1 },
];

function makeToken() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makePositionId(code) {
  return `pos-${String(code).toLowerCase()}-${makeToken()}`;
}

function makeEntryId() {
  return `ent-${makeToken()}`;
}

function createDemoPortfolio() {
  return DEMO_POSITIONS.map((position) => {
    // Data antiga o suficiente para não cair nas janelas do dashboard.
    const date = '2023-01-02';
    return {
      id: position.id,
      code: position.code,
      entries: [
        {
          id: makeEntryId(),
          type: 'in',
          quantity: position.quantity,
          price: position.avgCost,
          priceSource: 'manual',
          fee: 0,
          date,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });
}

function normalizeType(type) {
  // `buy`/`sell` são aceitos apenas na migração do modelo v2.
  return type === 'out' || type === 'sell' ? 'out' : 'in';
}

function isValidEntry(entry) {
  return (
    entry &&
    (entry.type === 'in' ||
      entry.type === 'out' ||
      entry.type === 'buy' ||
      entry.type === 'sell') &&
    Number.isFinite(entry.quantity) &&
    entry.quantity > 0 &&
    Number.isFinite(entry.price) &&
    entry.price > 0 &&
    typeof entry.date === 'string'
  );
}

/** Reconstrói o histórico de uma posição salva (ou entrada inicial da v1). */
function sanitizePosition(position) {
  if (!position || typeof position.code !== 'string' || !/^[A-Z]{3}$/.test(position.code)) {
    return null;
  }

  const id = typeof position.id === 'string' ? position.id : makePositionId(position.code);

  if (Array.isArray(position.entries)) {
    const entries = position.entries.filter(isValidEntry).map((entry) => ({
      id: typeof entry.id === 'string' ? entry.id : makeEntryId(),
      type: normalizeType(entry.type),
      quantity: entry.quantity,
      price: entry.price,
      priceSource: entry.priceSource === 'manual' ? 'manual' : 'market',
      fee: Number.isFinite(entry.fee) && entry.fee >= 0 ? entry.fee : 0,
      date: entry.date,
      createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
    }));
    return entries.length > 0 ? { id, code: position.code, entries } : null;
  }

  // Posição da v1 (quantidade + custo médio, sem histórico): vira a entrada
  // inicial para preservar o que o usuário já tinha cadastrado.
  if (
    Number.isFinite(position.quantity) &&
    position.quantity > 0 &&
    Number.isFinite(position.avgCost) &&
    position.avgCost > 0
  ) {
    return {
      id,
      code: position.code,
      entries: [
        {
          id: makeEntryId(),
          type: 'in',
          quantity: position.quantity,
          price: position.avgCost,
          priceSource: 'manual',
          fee: 0,
          date: '2023-01-02',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  return null;
}

function sanitizePositions(value) {
  if (!Array.isArray(value)) return null;
  return value.map(sanitizePosition).filter(Boolean);
}

/** Lê a versão mais nova válida e converte automaticamente os modelos antigos. */
function readStoredPortfolio() {
  for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      const sanitized = sanitizePositions(JSON.parse(raw));
      if (sanitized) return sanitized;
    } catch {
      /* chave corrompida: tenta a próxima */
    }
  }
  return null;
}

/** Ajusta o tipo de cada movimentação (a entrada vem do formulário). */
function normalizeEntry(entry) {
  return {
    id: makeEntryId(),
    type: normalizeType(entry.type),
    quantity: Number(entry.quantity),
    price: Number(entry.price),
    priceSource: entry.priceSource === 'manual' ? 'manual' : 'market',
    fee: Number(entry.fee ?? 0),
    date: entry.date,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Carteira multi-moeda persistida.
 *
 * Modelo de dados: cada posição guarda apenas as **movimentações** (entradas e
 * saídas). A quantidade em carteira e o preço médio são derivados do histórico
 * (`summarizeEntries`), então uma nova entrada no mesmo par recalcula o custo
 * médio automaticamente e cada saída registra o resgate com data e preço.
 */
export function PortfolioProvider({ children }) {
  const market = useMarketData();
  const [positions, setPositions] = useLocalStorageState(
    STORAGE_KEY,
    // v3 primeiro; se não existir, importa v2 (compra/venda) ou v1 (quantidade
    // + custo médio), convertendo o histórico para entradas e saídas.
    () => readStoredPortfolio() ?? createDemoPortfolio(),
  );

  useEffect(() => {
    // Primeira sincronização: grava no formato novo e remove as chaves antigas.
    try {
      LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      /* modo privado: segue sem persistir */
    }
  }, []);

  useEffect(() => {
    if (positions.length === 0) return;
    const sanitized = sanitizePositions(positions);
    if (!sanitized || sanitized.length !== positions.length) setPositions(sanitized ?? []);
  }, [positions, setPositions]);

  const addEntry = useCallback(
    (code, input) => {
      const entry = normalizeEntry(input);
      const normalizedCode = String(code ?? input.code).toUpperCase();

      setPositions((current) => {
        const existing = current.find((position) => position.code === normalizedCode);
        if (existing) {
          return current.map((position) =>
            position.id === existing.id
              ? { ...position, entries: [...position.entries, entry] }
              : position,
          );
        }
        return [...current, { id: makePositionId(normalizedCode), code: normalizedCode, entries: [entry] }];
      });

      return entry;
    },
    [setPositions],
  );

  const updateEntry = useCallback(
    (code, entryId, patch) => {
      setPositions((current) =>
        current.map((position) =>
          position.code === code
            ? {
                ...position,
                entries: position.entries.map((entry) =>
                  entry.id === entryId
                    ? {
                        ...entry,
                        ...patch,
                        type: normalizeType(patch.type ?? entry.type),
                        quantity: Number(patch.quantity ?? entry.quantity),
                        price: Number(patch.price ?? entry.price),
                        fee: Number(patch.fee ?? entry.fee ?? 0),
                      }
                    : entry,
                ),
              }
            : position,
        ),
      );
    },
    [setPositions],
  );

  const removeEntry = useCallback(
    (code, entryId) => {
      setPositions((current) =>
        current
          .map((position) =>
            position.code === code
              ? { ...position, entries: position.entries.filter((entry) => entry.id !== entryId) }
              : position,
          )
          .filter((position) => position.entries.length > 0),
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
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignora indisponibilidade */
    }
    setPositions(createDemoPortfolio());
  }, [setPositions]);

  const value = useMemo(() => {
    const enriched = positions.map((position) => {
      const summary = summarizeEntries(position.entries);
      return {
        ...position,
        quantity: summary.quantity,
        cost: summary.cost,
        avgCost: summary.avgCost,
        entries: [...position.entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
      };
    });

    // Moedas zeradas saem da carteira ativa (mas o histórico continua no menu).
    const active = enriched.filter((position) => position.quantity > 1e-9);

    const rows = buildPortfolioRows(active, market.baseCode, market.rates);
    const totals = computePortfolioTotals(rows);

    const totalEntries = positions.reduce((sum, position) => sum + position.entries.length, 0);

    return {
      positions,
      activePositions: active,
      rows: totals.rows,
      totalValue: totals.totalValue,
      totalCost: totals.totalCost,
      totalPnl: totals.totalPnl,
      pnlPercent: totals.pnlPercent,
      positionsCount: totals.positionsCount,
      entriesCount: totalEntries,
      isReady: !market.ratesLoading && !market.ratesError && market.rates !== null,
      addEntry,
      updateEntry,
      removeEntry,
      removePosition,
      clearPortfolio,
      resetPortfolio,
      hasPosition: (code) => active.some((position) => position.code === code),
      getPosition: (code) => active.find((position) => position.code === code) ?? null,
      getPortfolio: (code) => positions.find((position) => position.code === code) ?? null,
    };
  }, [
    positions,
    market.baseCode,
    market.rates,
    market.ratesLoading,
    market.ratesError,
    addEntry,
    updateEntry,
    removeEntry,
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
