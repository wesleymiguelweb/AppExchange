import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18n } from '../i18n/useI18n.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useMarketData } from '../context/MarketDataContext.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { useToastContext } from '../context/ToastContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { buildCsvFilename, downloadCsv, toCsv } from '../utils/csv.js';
import { todayIso } from '../utils/dates.js';
import { isOutflow, sortEntriesDesc } from '../utils/entries.js';
import Button from '../components/ui/Button.jsx';
import ChangeBadge from '../components/ui/ChangeBadge.jsx';
import CurrencyBadge from '../components/ui/CurrencyBadge.jsx';
import Icon from '../components/ui/Icon.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ConfirmDialog from '../components/overlays/ConfirmDialog.jsx';
import EntriesTable from '../components/portfolio/EntriesTable.jsx';
import styles from './PortfolioView.module.css';

const PAGE_SIZES = ['5', '10', '20'];

const SORT_OPTIONS = [
  { id: 'valueDesc', labelKey: 'portfolio.sortValueDesc' },
  { id: 'valueAsc', labelKey: 'portfolio.sortValueAsc' },
  { id: 'pnlDesc', labelKey: 'portfolio.sortPnlDesc' },
  { id: 'pnlAsc', labelKey: 'portfolio.sortPnlAsc' },
  { id: 'code', labelKey: 'portfolio.sortCode' },
];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function sortRows(rows, sortId) {
  const sorted = [...rows];

  switch (sortId) {
    case 'valueAsc':
      return sorted.sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
    case 'pnlDesc':
      return sorted.sort((a, b) => (b.pnl ?? -Infinity) - (a.pnl ?? -Infinity));
    case 'pnlAsc':
      return sorted.sort((a, b) => (a.pnl ?? Infinity) - (b.pnl ?? Infinity));
    case 'code':
      return sorted.sort((a, b) => a.code.localeCompare(b.code));
    case 'valueDesc':
    default:
      return sorted.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  }
}

function StatCard({ label, value, hint, tone }) {
  return (
    <article className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={tone ? `${styles.statValue} ${styles[tone]}` : styles.statValue}>
        {value}
      </strong>
      {hint ? <span className={styles.statHint}>{hint}</span> : null}
    </article>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  hint: PropTypes.node,
  tone: PropTypes.oneOf(['positive', 'negative']),
};

export default function PortfolioView() {
  const { t, formatters } = useI18n();
  const { baseCode, currencyName } = useMarketData();
  const {
    positions,
    rows,
    totalValue,
    totalCost,
    totalPnl,
    pnlPercent,
    positionsCount,
    entriesCount,
    isReady,
    removePosition,
    removeEntry,
    resetPortfolio,
  } = usePortfolio();
  const { showToast } = useToastContext();
  const { openEntry, openAsset } = useUI();

  const [query, setQuery] = useState('');
  const [sortId, setSortId] = useState('valueDesc');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [historyQuery, setHistoryQuery] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query, 160);

  const allEntries = useMemo(
    () => positions.flatMap((position) => position.entries.map((entry) => ({ ...entry, code: position.code }))),
    [positions],
  );

  const historyEntries = useMemo(() => {
    const filtered = historyQuery === 'all'
      ? allEntries
      : allEntries.filter((entry) => entry.code === historyQuery);
    return sortEntriesDesc(filtered);
  }, [allEntries, historyQuery]);

  const historyPageSize = 8;
  const historyPageCount = Math.max(1, Math.ceil(historyEntries.length / historyPageSize));
  const safeHistoryPage = Math.min(historyPage, historyPageCount);
  const visibleHistory = historyEntries.slice(
    (safeHistoryPage - 1) * historyPageSize,
    safeHistoryPage * historyPageSize,
  );

  const historyCurrencies = useMemo(
    () => [...new Set(positions.map((position) => position.code))].sort(),
    [positions],
  );

  const filteredRows = useMemo(() => {
    const term = normalize(debouncedQuery);
    const searched = term
      ? rows.filter((row) =>
          normalize(
            `${row.code} ${formatters.currencyName(row.code, currencyName(row.code, row.code))}`,
          ).includes(term),
        )
      : rows;
    return sortRows(searched, sortId);
  }, [rows, debouncedQuery, sortId, currencyName, formatters]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortId, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function handleExport() {
    if (filteredRows.length === 0) {
      showToast(t('portfolio.exportEmpty'), 'error');
      return;
    }

    try {
      const columns = [
        { label: t('portfolio.columns.asset'), value: (row) => row.code },
        { label: t('portfolio.columns.quantity'), value: (row) => String(row.quantity) },
        { label: t('portfolio.columns.avgCost'), value: (row) => String(row.avgCost) },
        {
          label: t('portfolio.columns.unitValue'),
          value: (row) => (Number.isFinite(row.unitValue) ? String(row.unitValue) : ''),
        },
        {
          label: t('portfolio.columns.value'),
          value: (row) => (Number.isFinite(row.value) ? String(row.value) : ''),
        },
        {
          label: t('portfolio.columns.pnl'),
          value: (row) => (Number.isFinite(row.pnl) ? String(row.pnl) : ''),
        },
        {
          label: t('portfolio.columns.weight'),
          value: (row) => (row.share * 100).toFixed(2),
        },
      ];

      const content = toCsv(columns, filteredRows);
      const filename = buildCsvFilename(`hermes-carteira-${baseCode}`, todayIso());
      downloadCsv(filename, content);
      showToast(t('portfolio.exportSuccess', { count: filteredRows.length }));
    } catch (error) {
      console.error('[Hermes] falha ao exportar a carteira', error);
      showToast(t('csv.error'), 'error');
    }
  }

  function handleExportHistory() {
    if (historyEntries.length === 0) {
      showToast(t('entries.exportEmpty'), 'error');
      return;
    }

    try {
      const columns = [
        { label: t('entries.columns.date'), value: (entry) => entry.date },
        {
          label: t('entries.columns.type'),
          value: (entry) => (isOutflow(entry) ? t('entries.outBadge') : t('entries.inBadge')),
        },
        { label: t('entries.columns.asset'), value: (entry) => entry.code },
        { label: t('entries.columns.quantity'), value: (entry) => String(entry.quantity) },
        { label: t('entries.columns.price'), value: (entry) => String(entry.price) },
        { label: t('entries.columns.fee'), value: (entry) => String(entry.fee ?? 0) },
        {
          label: t('entries.columns.total'),
          value: (entry) =>
            String(
              entry.quantity * entry.price +
                (isOutflow(entry) ? -(entry.fee ?? 0) : (entry.fee ?? 0)),
            ),
        },
      ];

      const content = toCsv(columns, historyEntries);
      const filename = buildCsvFilename('hermes-movimentacoes', todayIso());
      downloadCsv(filename, content);
      showToast(t('entries.exportSuccess', { count: historyEntries.length }));
    } catch (error) {
      console.error('[Hermes] falha ao exportar movimentações', error);
      showToast(t('csv.error'), 'error');
    }
  }

  function handleConfirm() {
    if (!confirm) return;

    if (confirm.type === 'remove') {
      removePosition(confirm.row.id);
      showToast(t('portfolio.removed'));
    } else if (confirm.type === 'removeEntry') {
      removeEntry(confirm.entry.code, confirm.entry.id);
      showToast(t('entries.removed'));
    } else {
      resetPortfolio();
      showToast(t('portfolio.resetDone'));
    }
    setConfirm(null);
  }

  const confirmConfig =
    confirm?.type === 'remove'
      ? {
          title: t('portfolio.removeTitle'),
          message: t('portfolio.removeMessage', { code: confirm.row.code }),
          confirmLabel: t('portfolio.removeConfirm'),
          tone: 'danger',
        }
      : confirm?.type === 'removeEntry'
        ? {
            title: t('entries.removeTitle'),
            message: t('entries.removeMessage', {
              type: isOutflow(confirm.entry) ? t('entries.outBadge') : t('entries.inBadge'),
              code: confirm.entry.code,
              date: formatters.formatDate(confirm.entry.date),
            }),
            confirmLabel: t('entries.removeConfirm'),
            tone: 'danger',
          }
        : {
            title: t('portfolio.resetTitle'),
            message: t('portfolio.resetMessage'),
            confirmLabel: t('portfolio.resetConfirm'),
            tone: 'primary',
          };

  const hasRows = filteredRows.length > 0;
  const isEmptyPortfolio = positions.length === 0;

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow={t('portfolio.eyebrow')}
        title={t('portfolio.title')}
        description={t('portfolio.subtitle', { currency: baseCode })}
        actions={
          <>
            <Button
              variant="secondary"
              icon="reset"
              onClick={() => setConfirm({ type: 'reset' })}
            >
              {t('portfolio.resetConfirm')}
            </Button>
            <Button variant="secondary" icon="download" onClick={handleExport}>
              {t('portfolio.export')}
            </Button>
            <Button variant="secondary" icon="minus" onClick={() => openEntry({ type: 'out' })}>
              {t('portfolio.addOut')}
            </Button>
            <Button icon="plus" onClick={() => openEntry({ type: 'in' })}>
              {t('portfolio.addIn')}
            </Button>
          </>
        }
      />

      <div className={styles.stats}>
        <StatCard
          label={t('portfolio.totalValue')}
          value={isReady ? formatters.formatMoney(totalValue, baseCode) : '—'}
          hint={t('dashboard.baseLine', { currency: baseCode })}
        />
        <StatCard
          label={t('portfolio.totalCost')}
          value={isReady ? formatters.formatMoney(totalCost, baseCode) : '—'}
          hint={t('portfolio.costHint')}
        />
        <StatCard
          label={t('portfolio.pnl')}
          value={
            isReady ? (
              <span className={styles.pnlValue}>
                {formatters.formatMoney(totalPnl, baseCode)}
                <ChangeBadge value={pnlPercent ?? undefined} size="sm" />
              </span>
            ) : (
              '—'
            )
          }
          tone={totalPnl >= 0 ? 'positive' : 'negative'}
          hint={t('portfolio.positions')}
        />
        <StatCard
          label={t('portfolio.positions')}
          value={formatters.formatNumber(positionsCount)}
          hint={t('entries.count', { count: entriesCount })}
        />
      </div>

      <section className={styles.board}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              className={styles.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('portfolio.searchPlaceholder')}
              aria-label={t('portfolio.searchPlaceholder')}
              spellCheck="false"
            />
            {query ? (
              <button
                type="button"
                className={styles.clear}
                onClick={() => setQuery('')}
                aria-label={t('common.clearSearch')}
              >
                <Icon name="close" size={14} />
              </button>
            ) : null}
          </div>

          <div className={styles.controls}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('portfolio.sortLabel')}</span>
              <span className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={sortId}
                  onChange={(event) => setSortId(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={14} className={styles.selectIcon} />
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('common.pageSize')}</span>
              <span className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={String(pageSize)}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={14} className={styles.selectIcon} />
              </span>
            </label>
          </div>
        </div>

        {!hasRows ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <Icon name={isEmptyPortfolio ? 'wallet' : 'search'} size={24} />
            </span>
            <h2 className={styles.emptyTitle}>
              {isEmptyPortfolio ? t('portfolio.emptyTitle') : t('portfolio.emptyFilter')}
            </h2>
            <p className={styles.emptyText}>
              {isEmptyPortfolio ? t('portfolio.empty') : t('portfolio.searchPlaceholder')}
            </p>
            <div className={styles.emptyActions}>
              {isEmptyPortfolio ? (
                <Button icon="plus" onClick={() => openEntry({ type: 'in' })}>
                  {t('portfolio.emptyCta')}
                </Button>
              ) : (
                <Button variant="secondary" icon="close" onClick={() => setQuery('')}>
                  {t('common.clear')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{t('portfolio.columns.asset')}</th>
                    <th scope="col" className={styles.numeric}>
                      {t('portfolio.columns.quantity')}
                    </th>
                    <th scope="col" className={styles.numeric}>
                      {t('portfolio.columns.avgCost')}
                    </th>
                    <th scope="col" className={styles.numeric}>
                      {t('portfolio.columns.unitValue')}
                    </th>
                    <th scope="col" className={styles.numeric}>
                      {t('portfolio.columns.value')}
                    </th>
                    <th scope="col" className={styles.numeric}>
                      {t('portfolio.columns.pnl')}
                    </th>
                    <th scope="col" className={styles.weightColumn}>
                      {t('portfolio.columns.weight')}
                    </th>
                    <th scope="col" className={styles.actionsColumn}>
                      <span className="sr-only">{t('portfolio.columns.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const name = formatters.currencyName(row.code, currencyName(row.code, row.code));
                    const positive = (row.pnl ?? 0) >= 0;

                    return (
                      <tr
                        key={row.id}
                      >
                        <th scope="row" className={styles.assetCell}>
                          <button
                            type="button"
                            className={styles.assetButton}
                            onClick={() => openAsset(row.code)}
                            aria-label={t('portfolio.viewAsset', { code: row.code })}
                          >
                            <CurrencyBadge code={row.code} size="sm" />
                            <span className={styles.assetText}>
                              <strong>{row.code}</strong>
                              <span>{name}</span>
                            </span>
                          </button>
                        </th>

                        <td className={styles.numeric} data-label={t('portfolio.columns.quantity')}>
                          {formatters.formatQuantity(row.quantity)}
                        </td>
                        <td className={styles.numeric} data-label={t('portfolio.columns.avgCost')}>
                          {formatters.formatMoney(row.avgCost, 'BRL')}
                        </td>
                        <td className={styles.numeric} data-label={t('portfolio.columns.unitValue')}>
                          {Number.isFinite(row.unitValue)
                            ? `${formatters.formatRate(row.unitValue)} ${baseCode}`
                            : '—'}
                        </td>
                        <td className={styles.numeric} data-label={t('portfolio.columns.value')}>
                          <strong>{formatters.formatMoney(row.value, baseCode)}</strong>
                        </td>
                        <td
                          className={`${styles.numeric} ${positive ? styles.positive : styles.negative}`}
                          data-label={t('portfolio.columns.pnl')}
                        >
                          <span className={styles.pnlCell}>
                            <strong>{formatters.formatMoney(row.pnl, baseCode)}</strong>
                            <ChangeBadge value={row.pnlPercent ?? undefined} size="sm" />
                          </span>
                        </td>
                        <td className={styles.weightColumn} data-label={t('portfolio.columns.weight')}>
                          <div className={styles.weight}>
                            <span className={styles.weightTrack} aria-hidden="true">
                              <span
                                className={styles.weightBar}
                                style={{ width: `${Math.min(row.share * 100, 100).toFixed(2)}%` }}
                              />
                            </span>
                            <span className={styles.weightValue}>
                              {formatters.formatPercent(row.share * 100)}
                            </span>
                          </div>
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.rowAction}
                              onClick={() => openAsset(row.code)}
                              title={t('portfolio.viewAsset', { code: row.code })}
                              aria-label={t('portfolio.viewAsset', { code: row.code })}
                            >
                              <Icon name="eye" size={15} />
                            </button>
                            <button
                              type="button"
                              className={styles.rowAction}
                              onClick={() => openEntry({ code: row.code, type: 'in' })}
                              title={t('entries.addInFor', { code: row.code })}
                              aria-label={t('entries.addInFor', { code: row.code })}
                            >
                              <Icon name="plus" size={15} />
                            </button>
                            <button
                              type="button"
                              className={styles.rowAction}
                              onClick={() => openEntry({ code: row.code, type: 'out' })}
                              title={t('entries.addOutFor', { code: row.code })}
                              aria-label={t('entries.addOutFor', { code: row.code })}
                            >
                              <Icon name="minus" size={15} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.rowAction} ${styles.rowActionDanger}`}
                              onClick={() => setConfirm({ type: 'remove', row })}
                              title={t('common.remove')}
                              aria-label={`${t('common.remove')} ${row.code}`}
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.boardFooter}>
              <span className={styles.boardCount}>
                {t('common.showing', { count: filteredRows.length, total: rows.length })}
              </span>
              <Pagination
                page={safePage}
                pageCount={pageCount}
                onChange={setPage}
                label={t('portfolio.positions')}
              />
            </div>
          </>
        )}
      </section>

      <section className={styles.history}>
        <header className={styles.historyHead}>
          <div>
            <h2 className={styles.historyTitle}>
              <Icon name="list" size={17} />
              {t('entries.historyTitle')}
            </h2>
            <p className={styles.historySubtitle}>{t('entries.historySubtitle')}</p>
          </div>
          <div className={styles.historyControls}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('entries.filterLabel')}</span>
              <span className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={historyQuery}
                  onChange={(event) => {
                    setHistoryQuery(event.target.value);
                    setHistoryPage(1);
                  }}
                  aria-label={t('entries.filterLabel')}
                >
                  <option value="all">{t('entries.allAssets')}</option>
                  {historyCurrencies.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={14} className={styles.selectIcon} />
              </span>
            </label>
            <Button variant="secondary" icon="download" onClick={handleExportHistory}>
              {t('entries.exportHistory')}
            </Button>
          </div>
        </header>

        <EntriesTable
          entries={visibleHistory}
          showCode
          onRemove={(entry) => setConfirm({ type: 'removeEntry', entry })}
          empty={t('entries.historyEmpty')}
        />

        {historyEntries.length > historyPageSize ? (
          <div className={styles.historyFooter}>
            <span className={styles.boardCount}>
              {t('common.showing', { count: visibleHistory.length, total: historyEntries.length })}
            </span>
            <Pagination
              page={safeHistoryPage}
              pageCount={historyPageCount}
              onChange={setHistoryPage}
              label={t('entries.historyTitle')}
            />
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        tone={confirmConfig.tone}
        onConfirm={handleConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
