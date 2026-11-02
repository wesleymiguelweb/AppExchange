/**
 * Destinos da aplicação. A referência visual (Xfolio) expõe oito páginas no
 * menu; aqui elas foram consolidadas em seis destinos com modais para ações
 * rápidas (detalhe do ativo, nova posição, busca global).
 */
export const ROUTES = [
  { id: 'dashboard', icon: 'grid', labelKey: 'nav.dashboard', titleKey: 'dashboard.title' },
  { id: 'portfolio', icon: 'wallet', labelKey: 'nav.portfolio', titleKey: 'portfolio.title' },
  { id: 'markets', icon: 'market', labelKey: 'nav.markets', titleKey: 'markets.title' },
  { id: 'trade', icon: 'swap', labelKey: 'nav.trade', titleKey: 'trade.title' },
];

export const SECONDARY_ROUTES = [
  { id: 'settings', icon: 'settings', labelKey: 'nav.settings', titleKey: 'settings.title' },
  { id: 'support', icon: 'help', labelKey: 'nav.support', titleKey: 'support.title' },
];

export const ALL_ROUTES = [...ROUTES, ...SECONDARY_ROUTES];

export const DEFAULT_ROUTE = 'dashboard';

const ROUTE_IDS = new Set(ALL_ROUTES.map((route) => route.id));

/** Lê `#/portfolio` e devolve o id da rota; qualquer valor inválido cai no default. */
export function parseRoute(hash) {
  const clean = String(hash ?? '').replace(/^#\/?/, '').split('?')[0];
  return ROUTE_IDS.has(clean) ? clean : DEFAULT_ROUTE;
}

export function routeHash(routeId) {
  return `#/${ROUTE_IDS.has(routeId) ? routeId : DEFAULT_ROUTE}`;
}

export function findRoute(routeId) {
  return ALL_ROUTES.find((route) => route.id === routeId) ?? ALL_ROUTES[0];
}
