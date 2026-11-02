import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import { cx } from '../../utils/cx.js';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import styles from './RatesTable.module.css';

const SORTABLE = ['code', 'name', 'rate'];

function SortButton({ column, label, sort, onSort }) {
  const isActive = sort.key === column;

  return (
    <button
      type="button"
      className={cx(styles.sortButton, isActive && styles.sortActive)}
      onClick={() => onSort(column)}
    >
      <span>{label}</span>
      <span className={styles.sortIcon} aria-hidden="true">
        {isActive ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

SortButton.propTypes = {
  column: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sort: PropTypes.shape({
    key: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
  }).isRequired,
  onSort: PropTypes.func.isRequired,
};

export default function RatesTable({ rows, baseCode, amount, selectedCode, sort, onSort, onSelect }) {
  const { t, formatters } = useI18n();
  const hasAmount = Number.isFinite(amount) && amount > 0;

  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <caption className="sr-only">{t('rates.title')}</caption>
        <thead>
          <tr>
            {SORTABLE.map((column) => (
              <th
                key={column}
                scope="col"
                className={cx(column === 'rate' && styles.numeric, column === 'name' && styles.nameColumn)}
                aria-sort={
                  sort.key === column
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <SortButton
                  column={column}
                  label={t(`rates.columns.${column}`)}
                  sort={sort}
                  onSort={onSort}
                />
              </th>
            ))}
            <th scope="col" className={styles.numeric}>
              {t('rates.columns.converted')}
            </th>
            <th scope="col" className={styles.actionColumn}>
              <span className="sr-only">{t('rates.columns.action')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = row.code === selectedCode;
            const converted = hasAmount ? amount * row.rate : null;

            return (
              <tr key={row.code} className={cx(isSelected && styles.selectedRow)}>
                <th scope="row" className={styles.codeCell} data-label={t('rates.columns.code')}>
                  <span className={styles.code}>{row.code}</span>
                </th>
                <td className={styles.nameCell} data-label={t('rates.columns.name')}>
                  {formatters.currencyName(row.code, row.name)}
                </td>
                <td className={styles.numeric} data-label={t('rates.columns.rate')}>
                  {formatters.formatRate(row.rate)}
                </td>
                <td className={styles.numeric} data-label={t('rates.columns.converted')}>
                  {converted === null ? '—' : formatters.formatMoney(converted, row.code)}
                </td>
                <td className={styles.actionCell} data-label={t('rates.columns.action')}>
                  {isSelected ? (
                    <span className={styles.selectedBadge}>
                      <Icon name="check" size={14} />
                      {t('rates.selected')}
                    </span>
                  ) : (
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => onSelect(row.code)}
                      aria-label={t('rates.useLabel', { code: row.code })}
                      title={t('rates.useLabel', { code: row.code })}
                    >
                      {t('rates.use')}
                      <Icon name="arrowRight" size={14} />
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.footnote}>
        {t('rates.footnote', { base: baseCode })}
      </p>
    </div>
  );
}

RatesTable.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rate: PropTypes.number.isRequired,
    }),
  ).isRequired,
  baseCode: PropTypes.string.isRequired,
  amount: PropTypes.number,
  selectedCode: PropTypes.string.isRequired,
  sort: PropTypes.shape({
    key: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
  }).isRequired,
  onSort: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};
