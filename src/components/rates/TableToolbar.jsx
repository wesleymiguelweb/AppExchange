import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import styles from './TableToolbar.module.css';

const SORT_OPTIONS = [
  { value: 'code:asc', key: 'codeAsc' },
  { value: 'code:desc', key: 'codeDesc' },
  { value: 'name:asc', key: 'nameAsc' },
  { value: 'name:desc', key: 'nameDesc' },
  { value: 'rate:desc', key: 'rateDesc' },
  { value: 'rate:asc', key: 'rateAsc' },
];

export default function TableToolbar({
  query,
  onQueryChange,
  count,
  onExport,
  exportDisabled,
  sort,
  onSortChange,
}) {
  const { t, formatters } = useI18n();

  function handleSortChange(event) {
    const [key, direction] = event.target.value.split(':');
    onSortChange({ key, direction });
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.searchField}>
        <span className={styles.searchIcon} aria-hidden="true">
          <Icon name="search" size={17} />
        </span>
        <input
          id="rates-search"
          type="search"
          className={styles.search}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('rates.searchPlaceholder')}
          aria-label={t('rates.searchLabel')}
          autoComplete="off"
          spellCheck="false"
        />
        {query ? (
          <button
            type="button"
            className={styles.clear}
            onClick={() => onQueryChange('')}
            aria-label={t('common.clearSearch')}
            title={t('common.clearSearch')}
          >
            <Icon name="close" size={14} />
          </button>
        ) : null}
      </div>

      <div className={styles.sortField}>
        <label className="sr-only" htmlFor="rates-sort">
          {t('rates.sortMobileLabel')}
        </label>
        <select
          id="rates-sort"
          className={styles.sortSelect}
          value={`${sort.key}:${sort.direction}`}
          onChange={handleSortChange}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(`rates.sortOptions.${option.key}`)}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.count} aria-live="polite">
        {t(count === 1 ? 'rates.countOne' : 'rates.count', {
          count: formatters.formatNumber(count),
        })}
      </p>

      <div className={styles.exportField}>
        <Button
          variant="secondary"
          size="sm"
          icon="download"
          onClick={onExport}
          disabled={exportDisabled}
        >
          {t('csv.export')}
        </Button>
      </div>
    </div>
  );
}

TableToolbar.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  count: PropTypes.number.isRequired,
  onExport: PropTypes.func.isRequired,
  exportDisabled: PropTypes.bool,
  sort: PropTypes.shape({
    key: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
  }).isRequired,
  onSortChange: PropTypes.func.isRequired,
};
