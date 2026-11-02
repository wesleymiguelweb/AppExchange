import PropTypes from 'prop-types';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import styles from './Header.module.css';

export default function Header({ appName, kicker, locale, locales, onChangeLocale, languageLabel }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href="#conteudo" aria-label={`${appName} — ${kicker}`}>
          <span className={styles.mark} aria-hidden="true">
            <svg viewBox="0 0 32 32" width="32" height="32" focusable="false">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path
                d="M11 9.5v13M21 9.5v13M11 16h10"
                stroke="var(--paper)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className={styles.wordmark}>
            <span className={styles.name}>{appName}</span>
            <span className={styles.kicker}>{kicker}</span>
          </span>
        </a>

        <LanguageSwitcher
          locale={locale}
          locales={locales}
          onChange={onChangeLocale}
          label={languageLabel}
        />
      </div>
    </header>
  );
}

Header.propTypes = {
  appName: PropTypes.string.isRequired,
  kicker: PropTypes.string.isRequired,
  locale: PropTypes.string.isRequired,
  locales: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      short: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChangeLocale: PropTypes.func.isRequired,
  languageLabel: PropTypes.string.isRequired,
};
