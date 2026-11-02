import { createContext, useContext } from 'react';

/**
 * Ações globais da casca da aplicação. Evita passar callbacks por todas as
 * views: qualquer tela pode abrir um modal, navegar ou iniciar uma conversão.
 */
export const UIContext = createContext(null);

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI precisa estar dentro de <UIContext.Provider>.');
  }
  return context;
}
