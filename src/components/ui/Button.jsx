import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import Icon from './Icon.jsx';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  isLoading = false,
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const hasLabel = children !== undefined && children !== null && children !== '';

  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isLoading && styles.loading,
        className,
      )}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {!isLoading && icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {hasLabel ? <span className={styles.label}>{children}</span> : null}
      {!isLoading && iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 18} /> : null}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'quiet', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.string,
  iconRight: PropTypes.string,
  isLoading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};
