import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import styles from './StateBlock.module.css';

/**
 * Estados de carregamento / erro / vazio compartilhados por gráfico e tabela.
 */
export default function StateBlock({
  variant = 'loading',
  title,
  message,
  onRetry,
  retryLabel,
  compact = false,
  className,
}) {
  if (variant === 'loading') {
    return (
      <div className={cx(styles.block, styles.loading, compact && styles.compact, className)} role="status">
        <span className="sr-only">{title}</span>
        <div className={styles.skeletonChart} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className={styles.skeletonRows} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const isError = variant === 'error';

  return (
    <div
      className={cx(styles.block, isError ? styles.error : styles.empty, compact && styles.compact, className)}
      role={isError ? 'alert' : 'status'}
    >
      <span className={styles.icon} aria-hidden="true">
        <Icon name={isError ? 'alert' : 'search'} size={20} />
      </span>
      <p className={styles.title}>{title}</p>
      {message ? <p className={styles.message}>{message}</p> : null}
      {isError && onRetry ? (
        <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry} className={styles.retry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

StateBlock.propTypes = {
  variant: PropTypes.oneOf(['loading', 'error', 'empty']),
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  compact: PropTypes.bool,
  className: PropTypes.string,
};
