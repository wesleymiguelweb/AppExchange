import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import { useI18n } from '../../i18n/useI18n.js';
import Icon from './Icon.jsx';
import styles from './ChangeBadge.module.css';

/** Variação percentual com seta e cor semântica (nunca só a cor). */
export default function ChangeBadge({ value, size = 'md', showIcon = true, className }) {
  const { formatters } = useI18n();
  const tone = !Number.isFinite(value) ? 'neutral' : value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  const icon = value > 0 ? 'arrowUpRight' : 'arrowDownRight';

  return (
    <span className={cx(styles.badge, styles[tone], styles[size], className)}>
      {showIcon && Number.isFinite(value) && value !== 0 ? (
        <Icon name={icon} size={size === 'sm' ? 12 : 14} strokeWidth={2} />
      ) : null}
      <span className={styles.value}>
        {Number.isFinite(value) ? formatters.formatPercent(value) : '—'}
      </span>
    </span>
  );
}

ChangeBadge.propTypes = {
  value: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md']),
  showIcon: PropTypes.bool,
  className: PropTypes.string,
};
