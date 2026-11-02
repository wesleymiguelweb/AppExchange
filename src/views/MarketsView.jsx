import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/useI18n.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useMarketData } from '../context/MarketDataContext.jsx';
import { useMarketSeries } from '../hooks/useMarketSeries.js';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { useInspector } from '../context/InspectorContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { describeError } from '../utils/errorMessages.js';
import { cx } from '../utils/cx.js';
import Button from '../components/ui/Button.jsx';
import ChangeBadge from '../components/ui/ChangeBadge.jsx';
import CurrencyBadge from '../components/ui/CurrencyBadge.jsx';
import Icon from '../components/ui/Icon.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import Sparkline from '../components/ui/Sparkline.jsx';
import StateBlock from '../components/ui/StateBlock.jsx';
import TiltCard from '../components/ui/TiltCard.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import styles from './MarketsView.module.css';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { id: 'code', labelKey: 'markets.sort.code' },
  { id: 'name', labelKey: 'markets.sort.name' },
  { id: 'rate', labelKey: 'markets.sort.rate' },
  { id: 'change', labelKey: 'markets.sort.change' },
];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function MarketsView() {
  const { t, formatters, locale } = useI18n();
  const {
    baseCode,
    currencies,
    currenciesLoading,
    currenciesError,
    retryCurrencies,
    rates,
    rateDate,
    ratesLoading,
    ratesError,
    retryRates,
  } = useMarketData();
  const { hasPosition, getPosition } = usePortfolio();
  const { enable, selectView } = useInspector();
  const { openAsset, openPosition } = useUI();

  const [query, setQuery] = useState('');
  const [sortId, setSortId] = useState('code');
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query, 160);

  const codes = useMemo(
    () => currencies.map((currency) => currency.code).filter((code) => code !== baseCode),
    [currencies, baseCode],
  );

  const series = useMarketSeries(baseCode, codes, 7);

  const items = useMemo(() => {
    const term = normalize(debouncedQuery);
    const nameByCode = new Map(currencies.map((currency) => [currency.code, currency.name]));

    const mapped = codes.map((code) => {
      const rawName = nameByCode.get(code) ?? code;
      const entry = series.seriesByCode?.[code];
      return {
        code,
        name: formatters.currencyName(code, rawName),
        rawName,
        rate: code === baseCode ? 1 : rates?.[code] ?? null,
        variation: entry?.variation ?? null,
        values: (entry?.points ?? []).map((point) => point.rate),
      };
    });

    const searched = term
      ? mapped.filter((item) => normalize(`${item.code} ${item.name} ${item.rawName}`).includes(term))
      : mapped;

    const sorted = [...searched].sort((a, b) => {
      switch (sortId) {
        case 'name':
          return a.name.localeCompare(b.name, locale);
        case 'rate':
          return (b.rate ?? -Infinity) - (a.rate ?? -Infinity);
        case 'change':
          return (b.variation ?? -Infinity) - (a.variation ?? -Infinity);
        case 'code':
        default:
          return a.code.localeCompare(b.code);
      }
    });

    return sorted;
  }, [codes, currencies, rates, series.seriesByCode, debouncedQuery, sortId, formatters, locale, baseCode]);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortId]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const isLoading = (currenciesLoading || ratesLoading) && !rates;
  const loadError = currenciesError ?? (rates ? null : ratesError);
  const errorInfo = describeError(loadError);

  function inspect(code) {
    enable();
    selectView(view === 'grid' ? `market.card.${code}` : `market.row.${code}`);
  }

  function handleAdd(code) {
    const position = getPosition(code);
    openPosition(position ?? { code });
  }

  function renderActions(item, compact = false) {
    const position = getPosition(item.code);
    return (
      <div className={cx(styles.itemActions, compact && styles.itemActionsCompact)}>
        <button
          type="button"
          className={styles.inspectAction}
          onClick={() => inspect(item.code)}
          title={t('markets.inspect')}
          aria-label={`${t('markets.inspect')}: ${item.code}`}
          data-inspector-ui
        >
          <Icon name="inspect" size={15} />
          <span>{t('common.inspect')}</span>
        </button>
        <button
          type="button"
          className={styles.iconAction}
          onClick={() => handleAdd(item.code)}
          title={position ? t('common.edit') : t('markets.add')}
          aria-label={`${position ? t('common.edit') : t('markets.add')}: ${item.code}`}
        >
          <Icon name={position ? 'check' : 'plus'} size={16} />
        </button>
        <button
          type="button"
          className={styles.iconAction}
          onClick={() => openAsset(item.code)}
          title={t('common.open')}
          aria-label={`${t('common.open')}: ${item.code}`}
        >
          <Icon name="external" size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page} data-view-id="markets.page" data-view-name={t('markets.title')}>
      <PageHeader
        viewId="markets.header"
        eyebrow={t('markets.eyebrow')}
        title={t('markets.title')}
        description={t('markets.subtitle')}
        actions={
          <SegmentedControl
            options={[
              { id: 'grid', label: t('markets.viewGrid'), title: t('markets.viewGrid') },
              { id: 'list', label: t('markets.viewList'), title: t('markets.viewList') },
            ]}
            value={view}
            onChange={setView}
            label={t('markets.viewGrid')}
            size="sm"
          />
        }
      />

      <div className={styles.metaBar} data-view-id="markets.meta">
        <span className={styles.metaItem}>
          <Icon name="globe" size={15} />
          {t('markets.baseLine', { base: baseCode, count: items.length })}
        </span>
        <span className={styles.metaItem}>
          <Icon name="calendar" size={15} />
          {rateDate
            ? t('markets.updated', { date: formatters.formatDate(rateDate) })
            : t('common.loading')}
        </span>
        <span className={cx(styles.metaItem, styles.metaSource)}>
          <span className={styles.sourceDot} aria-hidden="true" />
          {t('markets.source')}
        </span>
      </div>

      <div className={styles.toolbar} data-view-id="markets.toolbar">
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Icon name="search" size={16} />
          </span>
          <input
            className={styles.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('markets.searchPlaceholder')}
            aria-label={t('markets.searchPlaceholder')}
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

        <div className={styles.toolbarRight}>
          <span className={styles.resultCount}>
            {items.length === 1
              ? t('common.resultsOne')
              : t('common.results', { count: items.length })}
          </span>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('markets.sortLabel')}</span>
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
        </div>
      </div>

      <p className={styles.inspectHint}>
        <Icon name="inspect" size={14} />
        {t('markets.inspectHint')}
      </p>

      {isLoading ? (
        <div className={styles.grid} aria-busy="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className={styles.skeleton} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <StateBlock
          variant="error"
          title={t('errors.title')}
          message={t(errorInfo.key, errorInfo.vars)}
          onRetry={currenciesError ? retryCurrencies : retryRates}
          retryLabel={t('common.retry')}
        />
      ) : items.length === 0 ? (
        <div className={styles.empty} data-view-id="markets.empty">
          <span className={styles.emptyIcon} aria-hidden="true">
            <Icon name="search" size={24} />
          </span>
          <h2 className={styles.emptyTitle}>{t('markets.emptyTitle')}</h2>
          <p className={styles.emptyText}>{t('markets.empty')}</p>
          <Button variant="secondary" icon="close" onClick={() => setQuery('')}>
            {t('common.clear')}
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className={styles.grid} data-view-id="markets.grid">
          {visibleItems.map((item) => {
            const position = getPosition(item.code);
            const inverse = Number.isFinite(item.rate) && item.rate > 0 ? 1 / item.rate : null;

            return (
              <TiltCard
                key={item.code}
                as="article"
                max={6}
                lift={4}
                className={styles.card}
                data-view-id={`market.card.${item.code}`}
                data-view-name={`${item.code} · ${item.name}`}
              >
                <div className={styles.cardHead}>
                  <button
                    type="button"
                    className={styles.identity}
                    onClick={() => openAsset(item.code)}
                  >
                    <CurrencyBadge code={item.code} size="md" />
                    <span className={styles.identityText}>
                      <strong>{item.code}</strong>
                      <span>{item.name}</span>
                    </span>
                    {position ? (
                      <span className={styles.owned} title={t('markets.added')}>
                        <Icon name="check" size={11} />
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className={styles.inspectButton}
                    onClick={() => inspect(item.code)}
                    title={t('markets.inspect')}
                    aria-label={`${t('markets.inspect')}: ${item.code}`}
                    data-inspector-ui
                  >
                    <Icon name="inspect" size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.rateBlock}
                  onClick={() => openAsset(item.code)}
                >
                  <span className={styles.rateLabel}>{t('markets.rate')}</span>
                  <span className={styles.rateValue}>
                    {formatters.formatRate(item.rate)}
                    <span className={styles.rateCode}>{item.code}</span>
                  </span>
                  <span className={styles.rateInverse}>
                    {t('markets.inverse')} ·{' '}
                    {inverse !== null ? `${formatters.formatRate(inverse)} ${baseCode}` : '—'}
                  </span>
                </button>

                <div className={styles.trend}>
                  <div className={styles.trendHead}>
                    <span className={styles.trendLabel}>{t('markets.change7d')}</span>
                    <ChangeBadge value={item.variation ?? undefined} size="sm" />
                  </div>
                  <Sparkline
                    values={item.values}
                    label={t('markets.sparkline', { code: item.code })}
                    tone="auto"
                  />
                </div>

                {renderActions(item)}
              </TiltCard>
            );
          })}
        </div>
      ) : (
        <div className={styles.listBoard} data-view-id="markets.list">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('markets.columns.asset')}</th>
                <th scope="col" className={styles.numeric}>
                  {t('markets.columns.rate')}
                </th>
                <th scope="col" className={styles.numeric}>
                  {t('markets.columns.change')}
                </th>
                <th scope="col" className={styles.trendColumn}>
                  {t('markets.columns.trend')}
                </th>
                <th scope="col" className={styles.actionsColumn}>
                  <span className="sr-only">{t('markets.columns.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr
                  key={item.code}
                  data-view-id={`market.row.${item.code}`}
                  data-view-name={`${item.code} · ${item.name}`}
                >
                  <th scope="row" className={styles.assetCell}>
                    <button
                      type="button"
                      className={styles.assetButton}
                      onClick={() => openAsset(item.code)}
                    >
                      <CurrencyBadge code={item.code} size="sm" />
                      <span className={styles.assetText}>
                        <strong>{item.code}</strong>
                        <span>{item.name}</span>
                      </span>
                    </button>
                  </th>
                  <td className={styles.numeric} data-label={t('markets.columns.rate')}>
                    <strong>{formatters.formatRate(item.rate)}</strong>
                  </td>
                  <td className={styles.numeric} data-label={t('markets.columns.change')}>
                    <ChangeBadge value={item.variation ?? undefined} size="sm" />
                  </td>
                  <td className={styles.trendColumn} data-label={t('markets.columns.trend')}>
                    <span className={styles.listSpark}>
                      <Sparkline values={item.values} label={t('markets.sparkline', { code: item.code })} />
                    </span>
                  </td>
                  <td className={styles.actionsCell}>{renderActions(item, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 ? (
        <div className={styles.pagination}>
          <span className={styles.pageCount}>
            {t('common.showing', {
              count: Math.min(PAGE_SIZE, items.length - (safePage - 1) * PAGE_SIZE),
              total: items.length,
            })}
          </span>
          <Pagination
            page={safePage}
            pageCount={pageCount}
            onChange={setPage}
            label={t('markets.title')}
          />
        </div>
      ) : null}
    </div>
  );
}
