import PropTypes from 'prop-types';
import { useI18n } from '../i18n/useI18n.js';
import { useUI } from '../context/UIContext.jsx';
import { describeError } from '../utils/errorMessages.js';
import { currencyColor } from '../components/ui/CurrencyBadge.jsx';
import Button from '../components/ui/Button.jsx';
import ChangeBadge from '../components/ui/ChangeBadge.jsx';
import CurrencyBadge from '../components/ui/CurrencyBadge.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import Icon from '../components/ui/Icon.jsx';
import Panel from '../components/ui/Panel.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import Sparkline from '../components/ui/Sparkline.jsx';
import ValueChart from '../components/ui/ValueChart.jsx';
import styles from './DashboardView.module.css';

const PERIOD_OPTIONS = [
  { id: '7', label: '7D' },
  { id: '30', label: '30D' },
  { id: '90', label: '90D' },
];

function periodChange(points) {
  if (!Array.isArray(points) || points.length < 2) return { amount: null, percent: null };
  const first = points[0].value;
  const last = points[points.length - 1].value;
  return {
    amount: last - first,
    percent: first > 0 ? ((last - first) / first) * 100 : null,
  };
}

function Empty({ children }) {
  return <p className={styles.empty}>{children}</p>;
}

Empty.propTypes = { children: PropTypes.node.isRequired };

export function SummaryPanel({
  baseCode,
  points,
  isLoading,
  error,
  onRetry,
  period,
  onPeriodChange,
  totalValue,
  totalCost,
  totalPnl,
  positionsCount,
  isReady,
  onAdd,
}) {
  const { t, formatters } = useI18n();
  const { navigate } = useUI();
  const change = periodChange(points);
  const errorInfo = describeError(error);

  return (
    <Panel
      viewId="dashboard.summary"
      icon="wallet"
      title={t('panels.summary.label')}
      subtitle={t('dashboard.summarySubtitle')}
      actions={
        <SegmentedControl
          options={PERIOD_OPTIONS}
          value={String(period)}
          onChange={(value) => onPeriodChange(Number(value))}
          label={t('dashboard.period')}
          size="sm"
        />
      }
    >
      <div className={styles.summary}>
        <div className={styles.summarySide}>
          <p className={styles.summaryLabel}>{t('dashboard.balance')}</p>
          <p className={styles.summaryValue}>
            {isReady ? formatters.formatMoney(totalValue, baseCode) : '—'}
          </p>
          <div className={styles.summaryMeta}>
            <ChangeBadge value={change.percent ?? undefined} />
            <span>{t('dashboard.baseLine', { currency: baseCode })}</span>
          </div>

          <dl className={styles.summaryFacts}>
            <div>
              <dt>{t('dashboard.invested')}</dt>
              <dd>{isReady ? formatters.formatMoney(totalCost, baseCode) : '—'}</dd>
            </div>
            <div>
              <dt>{t('dashboard.result')}</dt>
              <dd className={totalPnl >= 0 ? styles.positive : styles.negative}>
                {isReady ? formatters.formatMoney(totalPnl, baseCode) : '—'}
              </dd>
            </div>
            <div>
              <dt>{t('dashboard.stats.positions')}</dt>
              <dd>{positionsCount}</dd>
            </div>
          </dl>

          <div className={styles.summaryActions}>
            <Button size="sm" icon="plus" onClick={onAdd}>
              {t('dashboard.addPosition')}
            </Button>
            <Button size="sm" variant="secondary" icon="swap" onClick={() => navigate('trade')}>
              {t('dashboard.trade')}
            </Button>
          </div>
        </div>

        <div className={styles.summaryChart}>
          {error ? (
            <div className={styles.chartError}>
              <p>{t(errorInfo.key, errorInfo.vars)}</p>
              <button type="button" className={styles.retry} onClick={onRetry}>
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <ValueChart
              points={points}
              currency={baseCode}
              height={248}
              loading={isLoading}
              label={t('dashboard.summarySubtitle')}
            />
          )}
        </div>
      </div>
    </Panel>
  );
}

SummaryPanel.propTypes = {
  baseCode: PropTypes.string.isRequired,
  points: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onRetry: PropTypes.func.isRequired,
  period: PropTypes.number.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  totalValue: PropTypes.number.isRequired,
  totalCost: PropTypes.number.isRequired,
  totalPnl: PropTypes.number.isRequired,
  positionsCount: PropTypes.number.isRequired,
  isReady: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
};

export function PerformancePanel({ baseCode, points, rows, isLoading, totalPnl }) {
  const { t, formatters } = useI18n();
  const change = periodChange(points);
  const ranked = [...rows]
    .filter((row) => Number.isFinite(row.pnlPercent))
    .sort((a, b) => b.pnlPercent - a.pnlPercent);
  const best = ranked[0] ?? null;
  const worst = ranked[ranked.length - 1] ?? null;
  const values = points.map((point) => point.value);

  return (
    <Panel
      viewId="dashboard.performance"
      icon="trend"
      title={t('panels.performance.label')}
      subtitle={t('dashboard.performanceSubtitle')}
      actions={<span className={styles.chip}>30D</span>}
    >
      {rows.length === 0 ? (
        <Empty>{t('dashboard.performance.noData')}</Empty>
      ) : (
        <>
          <div className={styles.perfTop}>
            <div>
              <p className={styles.perfLabel}>{t('dashboard.performance.returnPeriod')}</p>
              <p className={styles.perfValue}>
                {isLoading ? '—' : formatters.formatMoney(change.amount ?? totalPnl, baseCode)}
              </p>
              <ChangeBadge value={change.percent ?? undefined} />
            </div>
            <div className={styles.perfChart}>
              <Sparkline values={values} tone="brand" />
              <span className={styles.perfChartHint}>{t('dashboard.watchlist.change')}</span>
            </div>
          </div>

          <div className={styles.perfGrid}>
            <div className={styles.perfCard}>
              <span className={styles.perfCardLabel}>{t('dashboard.performance.best')}</span>
              {best ? (
                <span className={styles.perfAsset}>
                  <CurrencyBadge code={best.code} size="sm" />
                  <span>
                    <strong>{best.code}</strong>
                    <ChangeBadge value={best.pnlPercent} size="sm" />
                  </span>
                </span>
              ) : (
                <span className={styles.perfCardEmpty}>—</span>
              )}
            </div>

            <div className={styles.perfCard}>
              <span className={styles.perfCardLabel}>{t('dashboard.performance.worst')}</span>
              {worst ? (
                <span className={styles.perfAsset}>
                  <CurrencyBadge code={worst.code} size="sm" />
                  <span>
                    <strong>{worst.code}</strong>
                    <ChangeBadge value={worst.pnlPercent} size="sm" />
                  </span>
                </span>
              ) : (
                <span className={styles.perfCardEmpty}>—</span>
              )}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}

PerformancePanel.propTypes = {
  baseCode: PropTypes.string.isRequired,
  points: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  totalPnl: PropTypes.number.isRequired,
};

export function AllocationPanel({ baseCode, rows, totalValue, isLoading }) {
  const { t, formatters } = useI18n();
  const valued = rows.filter((row) => Number.isFinite(row.value) && row.value > 0);
  const sorted = [...valued].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const otherValue = rest.reduce((sum, row) => sum + row.value, 0);

  const slices = top.map((row) => ({
    id: row.code,
    label: row.code,
    value: row.value,
    color: currencyColor(row.code),
  }));

  if (otherValue > 0) {
    slices.push({
      id: 'others',
      label: t('dashboard.allocation.others'),
      value: otherValue,
      color: 'var(--line-strong)',
    });
  }

  return (
    <Panel
      viewId="dashboard.allocation"
      icon="pie"
      title={t('panels.allocation.label')}
      subtitle={t('panels.allocation.description')}
    >
      {sorted.length === 0 ? (
        <Empty>{t('dashboard.allocation.empty')}</Empty>
      ) : isLoading ? (
        <Empty>{t('common.loading')}</Empty>
      ) : (
        <DonutChart
          slices={slices}
          centerValue={formatters.formatMoneyCompact(totalValue, baseCode)}
          centerLabel={baseCode}
          label={t('panels.allocation.label')}
        />
      )}
    </Panel>
  );
}

AllocationPanel.propTypes = {
  baseCode: PropTypes.string.isRequired,
  rows: PropTypes.array.isRequired,
  totalValue: PropTypes.number.isRequired,
  isLoading: PropTypes.bool,
};

export function PositionsPanel({ baseCode, rows, isReady, onAdd }) {
  const { t, formatters } = useI18n();
  const { navigate, openAsset } = useUI();
  const top = [...rows]
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <Panel
      viewId="dashboard.positions"
      icon="wallet"
      title={t('panels.positions.label')}
      subtitle={t('panels.positions.description')}
      actions={
        <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => navigate('portfolio')}>
          {t('dashboard.positions.viewAll')}
        </Button>
      }
    >
      {top.length === 0 ? (
        <div className={styles.emptyStack}>
          <p className={styles.empty}>{t('dashboard.positions.empty')}</p>
          <Button size="sm" icon="plus" onClick={onAdd}>
            {t('dashboard.addPosition')}
          </Button>
        </div>
      ) : (
        <ul className={styles.positionList}>
          {top.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className={styles.positionRow}
                onClick={() => openAsset(row.code)}
              >
                <CurrencyBadge code={row.code} size="sm" />
                <span className={styles.positionCode}>
                  <strong>{row.code}</strong>
                  <span>
                    {formatters.formatQuantity(row.quantity)} ·{' '}
                    {formatters.currencyName(row.code, row.code)}
                  </span>
                </span>
                <span className={styles.positionValue}>
                  <strong>
                    {isReady ? formatters.formatMoney(row.value, baseCode) : '—'}
                  </strong>
                  <ChangeBadge value={row.pnlPercent ?? undefined} size="sm" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

PositionsPanel.propTypes = {
  baseCode: PropTypes.string.isRequired,
  rows: PropTypes.array.isRequired,
  isReady: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
};

export function WatchlistPanel({ baseCode, codes, rates, series, isLoading }) {
  const { t, formatters } = useI18n();
  const { openAsset } = useUI();

  return (
    <Panel
      viewId="dashboard.watchlist"
      icon="market"
      title={t('panels.watchlist.label')}
      subtitle={t('markets.baseLine', { base: baseCode, count: codes.length })}
      actions={<span className={styles.chip}>{t('dashboard.watchlist.change')}</span>}
    >
      {isLoading ? (
        <Empty>{t('common.loading')}</Empty>
      ) : codes.length === 0 ? (
        <Empty>{t('dashboard.watchlist.empty')}</Empty>
      ) : (
        <ul className={styles.watchList}>
          {codes.map((code) => {
            const entry = series.seriesByCode?.[code];
            const rate = rates?.[code];
            const sparkValues = (entry?.points ?? []).map((point) => point.rate);

            return (
              <li key={code}>
                <button type="button" className={styles.watchRow} onClick={() => openAsset(code)}>
                  <CurrencyBadge code={code} size="sm" />
                  <span className={styles.watchCode}>
                    <strong>{code}</strong>
                    <span>{formatters.formatRate(rate)}</span>
                  </span>
                  <span className={styles.watchSpark} aria-hidden="true">
                    <Sparkline values={sparkValues} tone="auto" />
                  </span>
                  <ChangeBadge value={entry?.variation ?? undefined} size="sm" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

WatchlistPanel.propTypes = {
  baseCode: PropTypes.string.isRequired,
  codes: PropTypes.arrayOf(PropTypes.string).isRequired,
  rates: PropTypes.object,
  series: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
};

export function InsightsPanel({ baseCode, rows, codes, series }) {
  const { t, formatters } = useI18n();
  const total = rows.reduce((sum, row) => sum + (row.value ?? 0), 0);
  const top = [...rows]
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => b.value - a.value)[0];

  const ranked = codes
    .map((code) => ({
      code,
      variation: series.seriesByCode?.[code]?.variation,
      points: series.seriesByCode?.[code]?.points ?? [],
    }))
    .filter((entry) => Number.isFinite(entry.variation));

  const best = [...ranked].sort((a, b) => b.variation - a.variation)[0] ?? null;
  const worst = [...ranked].sort((a, b) => a.variation - b.variation)[0] ?? null;

  const amplitudes = ranked
    .map((entry) => {
      const values = entry.points.map((point) => point.rate);
      if (values.length < 2) return null;
      const min = Math.min(...values);
      const max = Math.max(...values);
      return min > 0 ? ((max - min) / min) * 100 : null;
    })
    .filter((value) => Number.isFinite(value));

  const averageAmplitude =
    amplitudes.length > 0
      ? amplitudes.reduce((sum, value) => sum + value, 0) / amplitudes.length
      : null;

  if (rows.length === 0 && ranked.length === 0) {
    return (
      <Panel
        viewId="dashboard.insights"
        icon="sparkles"
        title={t('panels.insights.label')}
        subtitle={t('panels.insights.description')}
      >
        <Empty>{t('dashboard.insights.empty')}</Empty>
      </Panel>
    );
  }

  const concentration = top && total > 0 ? (top.value / total) * 100 : null;

  return (
    <Panel
      viewId="dashboard.insights"
      icon="sparkles"
      title={t('panels.insights.label')}
      subtitle={t('panels.insights.description')}
    >
      <div className={styles.insightGrid}>
        <article className={styles.insightCard}>
          <span className={styles.insightIcon}>
            <Icon name="pie" size={16} />
          </span>
          <span className={styles.insightLabel}>{t('dashboard.insights.concentrationTitle')}</span>
          <strong className={styles.insightValue}>
            {concentration !== null ? formatters.formatPercent(concentration) : '—'}
          </strong>
          <p className={styles.insightText}>
            {top && concentration !== null
              ? t('dashboard.insights.concentration', {
                  code: top.code,
                  value: formatters.formatPercent(concentration),
                })
              : t('dashboard.insights.concentrationEmpty')}
          </p>
        </article>

        <article className={styles.insightCard}>
          <span className={styles.insightIcon}>
            <Icon name="trend" size={16} />
          </span>
          <span className={styles.insightLabel}>{t('dashboard.insights.bestPair')}</span>
          <strong className={styles.insightValue}>{best ? best.code : '—'}</strong>
          <p className={styles.insightText}>
            {best
              ? `${t('trade.pair', { from: baseCode, to: best.code })} · ${formatters.formatPercent(
                  best.variation,
                )}`
              : t('dashboard.insights.empty')}
          </p>
        </article>

        <article className={styles.insightCard}>
          <span className={styles.insightIcon}>
            <Icon name="arrowDownRight" size={16} />
          </span>
          <span className={styles.insightLabel}>{t('dashboard.insights.worstPair')}</span>
          <strong className={styles.insightValue}>{worst ? worst.code : '—'}</strong>
          <p className={styles.insightText}>
            {worst
              ? `${t('trade.pair', { from: baseCode, to: worst.code })} · ${formatters.formatPercent(
                  worst.variation,
                )}`
              : t('dashboard.insights.empty')}
          </p>
        </article>

        <article className={styles.insightCard}>
          <span className={styles.insightIcon}>
            <Icon name="market" size={16} />
          </span>
          <span className={styles.insightLabel}>{t('dashboard.insights.volatility')}</span>
          <strong className={styles.insightValue}>
            {averageAmplitude !== null ? formatters.formatPercent(averageAmplitude) : '—'}
          </strong>
          <p className={styles.insightText}>
            {averageAmplitude !== null
              ? t('dashboard.insights.volatilityValue', {
                  value: formatters.formatPercent(averageAmplitude),
                })
              : t('dashboard.insights.empty')}
          </p>
        </article>
      </div>

      <p className={styles.insightNote}>
        <Icon name="info" size={14} />
        {t('dashboard.insights.note')}
      </p>
    </Panel>
  );
}

InsightsPanel.propTypes = {
  baseCode: PropTypes.string.isRequired,
  rows: PropTypes.array.isRequired,
  codes: PropTypes.arrayOf(PropTypes.string).isRequired,
  series: PropTypes.object.isRequired,
};
