import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { createFormatters } from '../utils/format.js';
import { DEFAULT_LOCALE, LOCALES, translations } from './translations.js';

const STORAGE_KEY = 'hermes.locale';
const SUPPORTED = new Set(LOCALES.map((locale) => locale.id));

export const I18nContext = createContext(null);

function getMessage(messages, path) {
  return path.split('.').reduce((current, key) => (current == null ? undefined : current[key]), messages);
}

function interpolate(template, variables) {
  if (!variables) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match,
  );
}

function readStoredLocale() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && SUPPORTED.has(stored) ? stored : null;
  } catch {
    return null;
  }
}

function detectLocale() {
  const language = typeof navigator !== 'undefined' ? navigator.language : '';
  if (!language) return DEFAULT_LOCALE;
  if (language.toLowerCase().startsWith('pt')) return 'pt-BR';
  if (language.toLowerCase().startsWith('es')) return 'es';
  if (language.toLowerCase().startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }) {
  // Idioma inicial: preferência salva → idioma do navegador → pt-BR.
  const [locale, setLocale] = useState(() => readStoredLocale() ?? detectLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* localStorage indisponível (modo privado) — segue sem persistir */
    }
  }, [locale]);

  const changeLocale = useCallback((nextLocale) => {
    if (SUPPORTED.has(nextLocale)) setLocale(nextLocale);
  }, []);

  const value = useMemo(() => {
    const messages = translations[locale] ?? translations[DEFAULT_LOCALE];
    const fallback = translations[DEFAULT_LOCALE];
    const formatters = createFormatters(locale);

    const t = (path, variables) => {
      const template = getMessage(messages, path) ?? getMessage(fallback, path) ?? path;
      return interpolate(template, variables);
    };

    return { locale, setLocale: changeLocale, t, formatters, locales: LOCALES };
  }, [locale, changeLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

I18nProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
