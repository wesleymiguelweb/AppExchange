import { useContext } from 'react';
import { I18nContext } from './I18nProvider.jsx';

/** Acesso ao dicionário e aos formatadores do idioma ativo. */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n precisa estar dentro de <I18nProvider>.');
  }
  return context;
}
