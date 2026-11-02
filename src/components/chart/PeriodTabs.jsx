import PropTypes from 'prop-types';
import { PERIODS } from '../../constants/periods.js';
import { cx } from '../../utils/cx.js';
import styles from './PeriodTabs.module.css';

export default function PeriodTabs({ value, onChange, label }) {
  return (
    <div className={styles.tabs} role="group" aria-label={label}>
      {PERIODS.map((period) => {
        const isActive = period.id === value;
        return (
          <button
            key={period.id}
            type="button"
            className={cx(styles.tab, isActive && styles.active)}
            onClick={() => onChange(period.id)}
            aria-pressed={isActive}
          >
            {period.id}
          </button>
        );
      })}
    </div>
  );
}

PeriodTabs.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};
