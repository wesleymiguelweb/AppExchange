import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useToast } from '../hooks/useToast.js';
import { useI18n } from '../i18n/useI18n.js';
import Toast from '../components/ui/Toast.jsx';

const ToastContext = createContext(null);

/** Toast global — qualquer view ou modal pode emitir feedback. */
export function ToastProvider({ children }) {
  const { toast, showToast, dismiss } = useToast();
  const { t } = useI18n();

  return (
    <ToastContext.Provider value={{ toast, showToast, dismiss }}>
      {children}
      <Toast toast={toast} onDismiss={dismiss} dismissLabel={t('common.close')} />
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext precisa estar dentro de <ToastProvider>.');
  }
  return context;
}
