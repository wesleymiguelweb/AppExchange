/**
 * Catálogo de painéis do dashboard. O usuário pode esconder, redimensionar e
 * reordenar; a preferência é persistida em localStorage.
 *
 * Tamanhos correspondem ao grid de 12 colunas no desktop:
 *  sm = 4 · md = 6 · lg = 12
 */
export const PANEL_CATALOG = [
  {
    id: 'summary',
    icon: 'grid',
    labelKey: 'panels.summary.label',
    descriptionKey: 'panels.summary.description',
    defaultSize: 'lg',
    sizes: ['lg'],
  },
  {
    id: 'performance',
    icon: 'trend',
    labelKey: 'panels.performance.label',
    descriptionKey: 'panels.performance.description',
    defaultSize: 'lg',
    sizes: ['md', 'lg'],
  },
  {
    id: 'allocation',
    icon: 'pie',
    labelKey: 'panels.allocation.label',
    descriptionKey: 'panels.allocation.description',
    defaultSize: 'sm',
    sizes: ['sm', 'md'],
  },
  {
    id: 'positions',
    icon: 'wallet',
    labelKey: 'panels.positions.label',
    descriptionKey: 'panels.positions.description',
    defaultSize: 'md',
    sizes: ['md', 'lg'],
  },
  {
    id: 'watchlist',
    icon: 'market',
    labelKey: 'panels.watchlist.label',
    descriptionKey: 'panels.watchlist.description',
    defaultSize: 'md',
    sizes: ['sm', 'md'],
  },
  {
    id: 'insights',
    icon: 'sparkles',
    labelKey: 'panels.insights.label',
    descriptionKey: 'panels.insights.description',
    defaultSize: 'lg',
    sizes: ['sm', 'md', 'lg'],
  },
];

export const DEFAULT_PANEL_ORDER = PANEL_CATALOG.map((panel) => panel.id);

export function createDefaultPanelState() {
  return {
    order: [...DEFAULT_PANEL_ORDER],
    hidden: [],
    sizes: Object.fromEntries(PANEL_CATALOG.map((panel) => [panel.id, panel.defaultSize])),
  };
}

export function findPanel(panelId) {
  return PANEL_CATALOG.find((panel) => panel.id === panelId) ?? null;
}
