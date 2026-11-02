import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_ROUTE, parseRoute, routeHash } from '../constants/routes.js';

/**
 * Roteador mínimo baseado em hash (#/dashboard, #/portfolio…).
 * Evita uma dependência de roteamento para uma SPA de uma única entrada e
 * mantém deep links compartilháveis.
 */
export function useHashRoute() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    window.addEventListener('hashchange', handleHashChange);

    if (!window.location.hash) {
      window.history.replaceState(null, '', routeHash(DEFAULT_ROUTE));
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((routeId) => {
    const nextHash = routeHash(routeId);
    if (window.location.hash === nextHash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }
    window.location.hash = nextHash;
  }, []);

  return { route, navigate };
}
