import { useEffect, useState } from 'react';

const THEME_KEY = 'hermes.theme';
const DEFAULT_THEME = 'dark';

function readTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === null) return DEFAULT_THEME;
    try {
      const parsed = JSON.parse(stored);
      if (parsed === 'light' || parsed === 'dark') return parsed;
    } catch {
      if (stored === 'light' || stored === 'dark') return stored;
    }
    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Tema claro (HERMES original) e escuro (evolução RIA).
 * O atributo é aplicado no <html> para que os tokens resolvam globalmente.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    } catch {
      /* sem persistência: mantém o tema na sessão */
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F7F7F5' : '#08090D');
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, toggleTheme };
}
