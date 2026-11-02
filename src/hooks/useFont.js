import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_FONT, isFontId } from '../constants/fonts.js';

const FONT_KEY = 'hermes.font.v1';

function readFont() {
  try {
    const stored = window.localStorage.getItem(FONT_KEY);
    if (!stored) return DEFAULT_FONT;
    try {
      const parsed = JSON.parse(stored);
      return isFontId(parsed) ? parsed : DEFAULT_FONT;
    } catch {
      return isFontId(stored) ? stored : DEFAULT_FONT;
    }
  } catch {
    return DEFAULT_FONT;
  }
}

/**
 * Fonte personalizável da interface, aplicada antes de qualquer paint pelo
 * script em index.html e mantida em sincronia por este hook.
 */
export function useFont() {
  const [font, setFont] = useState(readFont);

  useEffect(() => {
    document.documentElement.dataset.font = font;
    try {
      window.localStorage.setItem(FONT_KEY, JSON.stringify(font));
    } catch {
      /* sem persistência: mantém a fonte na sessão */
    }
  }, [font]);

  const resetFont = useCallback(() => setFont(DEFAULT_FONT), []);

  return { font, setFont, resetFont };
}
