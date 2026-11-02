import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import { cx } from '../../utils/cx.js';
import styles from './PeriodSummary.module.css';

export default function PeriodSummary({ summary }) {
  const { t, formatters } = useI18n();

  if (!summary) return null;

  const isPositive = summary.variation >= 0;

  const items = [
    { key: 'current', label: t('chart.stats.current'), value: formatters.formatRate(summary.last) },
    { key: 'min', label: t('chart.stats.min'), value: formatters.formatRate(summary.min) },
    { key: 'max', label: t('chart.stats.max'), value: formatters.formatRate(summary.max) },
    { key: 'average', label: t('chart.stats.average'), value: formatters.formatRate(summary.average) },
    {
      key: 'variation',
      label: t('chart.stats.variation'),
      value: formatters.formatPercent(summary.variation),
      tone: isPositive ? 'up' : 'down',
    },
  ];

  return (
    <dl className={styles.summary}>
      {items.map((item) => (
        <div key={item.key} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={cx(styles.value, item.tone === 'up' && styles.up, item.tone === 'down' && styles.down)}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

PeriodSummary.propTypes = {
  summary: PropTypes.shape({
    last: PropTypes.number.isRequired,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    average: PropTypes.number.isRequired,
    variation: PropTypes.number.isRequired,
  }),
};
