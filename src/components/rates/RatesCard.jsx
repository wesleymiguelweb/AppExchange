import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { useI18n } from '../../i18n/useI18n.js';
import { describeError } from '../../utils/errorMessages.js';
import Card from '../ui/Card.jsx';
import StateBlock from '../ui/StateBlock.jsx';
import RatesTable from './RatesTable.jsx';
import TableToolbar from './TableToolbar.jsx';
import styles from './RatesCard.module.css';

const DEFAULT_SORT = { key: 'code', direction: 'asc' };

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function RatesCard({
  baseCode,
  amount,
  rows,
  quoteDate,
  isLoading,
  error,
  onRetry,
  selectedCode,
  onSelectCurrency,
  onExport,
}) {
  const { t, locale, formatters } = useI18n();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const debouncedQuery = useDebouncedValue(query, 180);
  const errorInfo = describeError(error);

  const visibleRows = useMemo(() => {
    const term = normalize(debouncedQuery);

    const filtered = term
      ? rows.filter((row) => {
          const name = formatters.currencyName(row.code, row.name);
          return normalize(`${row.code} ${row.name} ${name}`).includes(term);
        })
      : rows;

    const factor = sort.direction === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (sort.key === 'rate') return (a.rate - b.rate) * factor;
      if (sort.key === 'name') {
        return formatters.currencyName(a.code, a.name).localeCompare(
          formatters.currencyName(b.code, b.name),
          locale,
        ) * factor;
      }
      return a.code.localeCompare(b.code) * factor;
    });
  }, [rows, debouncedQuery, sort, formatters, locale]);

  function handleSort(column) {
    setSort((current) =>
      current.key === column
        ? { key: column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key: column, direction: column === 'rate' ? 'desc' : 'asc' },
    );
  }

  const subtitle = quoteDate
    ? t('rates.subtitleWithDate', {
        base: baseCode,
        date: formatters.formatDate(quoteDate),
      })
    : t('rates.subtitle', { base: baseCode });

  return (
    <Card
      id="cotacoes"
      titleId="rates-title"
      title={t('rates.title')}
      subtitle={subtitle}
      className={styles.card}
    >
      {error ? (
        <StateBlock
          variant="error"
          title={t('errors.title')}
          message={t(errorInfo.key, errorInfo.vars)}
          onRetry={onRetry}
          retryLabel={t('common.retry')}
        />
      ) : isLoading ? (
        <StateBlock variant="loading" title={t('errors.loading')} />
      ) : rows.length === 0 ? (
        <StateBlock variant="empty" title={t('rates.emptyTitle')} message={t('rates.emptyNoData')} />
      ) : (
        <>
          <TableToolbar
            query={query}
            onQueryChange={setQuery}
            count={visibleRows.length}
            onExport={() => onExport(visibleRows)}
            exportDisabled={visibleRows.length === 0}
            sort={sort}
            onSortChange={setSort}
          />

          {visibleRows.length === 0 ? (
            <StateBlock
              variant="empty"
              title={t('rates.emptyTitle')}
              message={t('rates.empty', { query })}
            />
          ) : (
            <RatesTable
              rows={visibleRows}
              baseCode={baseCode}
              amount={amount}
              selectedCode={selectedCode}
              sort={sort}
              onSort={handleSort}
              onSelect={onSelectCurrency}
            />
          )}
        </>
      )}
    </Card>
  );
}

RatesCard.propTypes = {
  baseCode: PropTypes.string.isRequired,
  amount: PropTypes.number,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rate: PropTypes.number.isRequired,
    }),
  ).isRequired,
  quoteDate: PropTypes.string,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onRetry: PropTypes.func.isRequired,
  selectedCode: PropTypes.string.isRequired,
  onSelectCurrency: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
};
