import { useEffect, useState } from 'react';

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem('hermes-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('hermes-theme', theme); } catch { /* O tema segue ativo durante esta sessão. */ }
  }, [theme]);
  return { theme, toggleTheme: () => setTheme((current) => current === 'light' ? 'dark' : 'light') };
}
