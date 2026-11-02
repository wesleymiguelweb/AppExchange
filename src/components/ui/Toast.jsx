import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import Icon from './Icon.jsx';
import styles from './Toast.module.css';

export default function Toast({ toast, onDismiss, dismissLabel }) {
  if (!toast) return null;

  const isError = toast.tone === 'error';

  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="false">
      <div
        key={toast.id}
        className={cx(styles.toast, isError ? styles.error : styles.success)}
        role={isError ? 'alert' : 'status'}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon name={isError ? 'alert' : 'check'} size={18} />
        </span>
        <p className={styles.message}>{toast.message}</p>
        <button
          type="button"
          className={styles.close}
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.number,
    message: PropTypes.string,
    tone: PropTypes.oneOf(['success', 'error']),
  }),
  onDismiss: PropTypes.func.isRequired,
  dismissLabel: PropTypes.string.isRequired,
};
