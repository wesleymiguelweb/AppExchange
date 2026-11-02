import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher({ locale, locales, onChange, label }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
      <div className={styles.group} role="group" aria-label={label}>
        {locales.map((item) => {
          const isActive = item.id === locale;
          return (
            <button
              key={item.id}
              type="button"
              className={cx(styles.option, isActive && styles.active)}
              onClick={() => onChange(item.id)}
              aria-pressed={isActive}
              aria-label={item.label}
              lang={item.id}
            >
              {item.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

LanguageSwitcher.propTypes = {
  locale: PropTypes.string.isRequired,
  locales: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      short: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};
