import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import styles from './Field.module.css';

export default function Field({ id, label, hint, error, errorId, className, children }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [error ? errorId : null, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children({ describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

Field.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  error: PropTypes.string,
  errorId: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.func.isRequired,
};
