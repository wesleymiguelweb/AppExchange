import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import Icon from './Icon.jsx';
import styles from './Pagination.module.css';

function pageWindow(page, pageCount, span = 5) {
  const size = Math.min(span, pageCount);
  let start = Math.max(1, page - Math.floor(size / 2));
  if (start + size - 1 > pageCount) start = pageCount - size + 1;
  return Array.from({ length: size }, (_, index) => start + index);
}

export default function Pagination({ page, pageCount, onChange, label, className }) {
  const { t } = useI18n();

  if (!Number.isFinite(pageCount) || pageCount <= 1) return null;

  const pages = pageWindow(page, pageCount);

  return (
    <nav className={className ? `${styles.nav} ${className}` : styles.nav} aria-label={label}>
      <span className={styles.status}>
        {t('common.page')} <strong>{page}</strong> {t('common.of')} {pageCount}
      </span>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label={t('common.previous')}
        >
          <Icon name="chevronLeft" size={16} />
        </button>

        {pages[0] > 1 ? (
          <>
            <button
              type="button"
              className={styles.button}
              onClick={() => onChange(1)}
              aria-label={`${t('common.page')} 1`}
            >
              1
            </button>
            {pages[0] > 2 ? <span className={styles.ellipsis}>…</span> : null}
          </>
        ) : null}

        {pages.map((number) => (
          <button
            key={number}
            type="button"
            className={number === page ? `${styles.button} ${styles.active}` : styles.button}
            onClick={() => onChange(number)}
            aria-label={`${t('common.page')} ${number}`}
            aria-current={number === page ? 'page' : undefined}
          >
            {number}
          </button>
        ))}

        {pages[pages.length - 1] < pageCount ? (
          <>
            {pages[pages.length - 1] < pageCount - 1 ? (
              <span className={styles.ellipsis}>…</span>
            ) : null}
            <button
              type="button"
              className={styles.button}
              onClick={() => onChange(pageCount)}
              aria-label={`${t('common.page')} ${pageCount}`}
            >
              {pageCount}
            </button>
          </>
        ) : null}

        <button
          type="button"
          className={styles.button}
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={t('common.next')}
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </nav>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
};
