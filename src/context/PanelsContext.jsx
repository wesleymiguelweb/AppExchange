import { createContext, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  DEFAULT_PANEL_ORDER,
  PANEL_CATALOG,
  createDefaultPanelState,
  findPanel,
} from '../constants/panels.js';
import { useLocalStorageState } from '../hooks/useLocalStorageState.js';

const PanelsContext = createContext(null);

const STORAGE_KEY = 'hermes.panels.v1';

function normalizePanels(raw) {
  const defaults = createDefaultPanelState();
  if (!raw || typeof raw !== 'object') return defaults;

  const known = new Set(DEFAULT_PANEL_ORDER);
  const storedOrder = Array.isArray(raw.order) ? raw.order.filter((id) => known.has(id)) : [];
  const order = [...storedOrder, ...DEFAULT_PANEL_ORDER.filter((id) => !storedOrder.includes(id))];

  const hidden = Array.isArray(raw.hidden)
    ? raw.hidden.filter((id) => known.has(id))
    : defaults.hidden;

  const sizes = { ...defaults.sizes };
  PANEL_CATALOG.forEach((panel) => {
    const requested = raw.sizes?.[panel.id];
    if (panel.sizes.includes(requested)) sizes[panel.id] = requested;
  });

  return { order, hidden, sizes };
}

/**
 * Layout personalizável do dashboard: ordem, visibilidade e tamanho de cada
 * painel. A preferência sobrevive ao reload e pode ser restaurada.
 */
export function PanelsProvider({ children }) {
  const [state, setState] = useLocalStorageState(STORAGE_KEY, createDefaultPanelState);

  const normalized = useMemo(() => normalizePanels(state), [state]);

  const togglePanel = useCallback(
    (panelId) => {
      if (!findPanel(panelId)) return;
      setState((current) => {
        const hidden = current.hidden.includes(panelId)
          ? current.hidden.filter((id) => id !== panelId)
          : [...current.hidden, panelId];
        return { ...current, hidden };
      });
    },
    [setState],
  );

  const setPanelSize = useCallback(
    (panelId, size) => {
      const panel = findPanel(panelId);
      if (!panel || !panel.sizes.includes(size)) return;
      setState((current) => ({
        ...current,
        sizes: { ...current.sizes, [panelId]: size },
      }));
    },
    [setState],
  );

  const cyclePanelSize = useCallback(
    (panelId) => {
      const panel = findPanel(panelId);
      if (!panel) return;
      setState((current) => {
        const currentSize = current.sizes[panelId] ?? panel.defaultSize;
        const index = panel.sizes.indexOf(currentSize);
        const next = panel.sizes[(index + 1) % panel.sizes.length];
        return { ...current, sizes: { ...current.sizes, [panelId]: next } };
      });
    },
    [setState],
  );

  const movePanel = useCallback(
    (sourceId, targetId) => {
      if (!sourceId || !targetId || sourceId === targetId) return;
      setState((current) => {
        const order = current.order.filter((id) => id !== sourceId);
        const targetIndex = order.indexOf(targetId);
        if (targetIndex === -1) return current;
        order.splice(targetIndex, 0, sourceId);
        return { ...current, order };
      });
    },
    [setState],
  );

  const movePanelBy = useCallback(
    (panelId, direction) => {
      if (!panelId || !direction) return;
      setState((current) => {
        const order = [...current.order];
        const index = order.indexOf(panelId);
        const next = index + direction;
        if (index === -1 || next < 0 || next >= order.length) return current;
        [order[index], order[next]] = [order[next], order[index]];
        return { ...current, order };
      });
    },
    [setState],
  );

  const resetPanels = useCallback(() => setState(createDefaultPanelState()), [setState]);

  const value = useMemo(() => {
    const visiblePanels = normalized.order
      .filter((id) => !normalized.hidden.includes(id))
      .map((id) => {
        const panel = findPanel(id);
        return panel ? { ...panel, size: normalized.sizes[id] ?? panel.defaultSize } : null;
      })
      .filter(Boolean);

    return {
      state: normalized,
      panels: PANEL_CATALOG,
      visiblePanels,
      isVisible: (panelId) => !normalized.hidden.includes(panelId),
      getSize: (panelId) => normalized.sizes[panelId] ?? findPanel(panelId)?.defaultSize,
      togglePanel,
      setPanelSize,
      cyclePanelSize,
      movePanel,
      movePanelBy,
      resetPanels,
    };
  }, [normalized, togglePanel, setPanelSize, cyclePanelSize, movePanel, movePanelBy, resetPanels]);

  return <PanelsContext.Provider value={value}>{children}</PanelsContext.Provider>;
}

PanelsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function usePanels() {
  const context = useContext(PanelsContext);
  if (!context) {
    throw new Error('usePanels precisa estar dentro de <PanelsProvider>.');
  }
  return context;
}
