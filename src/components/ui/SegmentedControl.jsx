import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import styles from './SegmentedControl.module.css';

/**
 * Grupo de botões mutuamente exclusivo — usado em períodos, filtros e
 * preferências. Mantém semântica de botão com `aria-pressed`.
 */
export default function SegmentedControl({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}) {
  return (
    <div className={cx(styles.group, styles[size], className)} role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            className={cx(styles.option, active && styles.active)}
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            title={option.title}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

SegmentedControl.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      title: PropTypes.string,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
};
