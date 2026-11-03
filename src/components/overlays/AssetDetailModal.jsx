import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import { useMarketData } from '../../context/MarketDataContext.jsx';
import { usePortfolio } from '../../context/PortfolioContext.jsx';
import { useMarketSeries } from '../../hooks/useMarketSeries.js';
import { useUI } from '../../context/UIContext.jsx';
import { describeError } from '../../utils/errorMessages.js';
import { sortEntriesDesc } from '../../utils/entries.js';
import Button from '../ui/Button.jsx';
import ChangeBadge from '../ui/ChangeBadge.jsx';
import CurrencyBadge from '../ui/CurrencyBadge.jsx';
import Icon from '../ui/Icon.jsx';
import Modal from '../ui/Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import RateChart from '../chart/RateChart.jsx';
import EntriesTable from '../portfolio/EntriesTable.jsx';
import styles from './AssetDetailModal.module.css';

export default function AssetDetailModal({ code, onClose }) {
  const { t, formatters } = useI18n();
  const { baseCode, rates, rateDate, currencyName } = useMarketData();
  const { rows, getPosition, getPortfolio, removeEntry } = usePortfolio();
  const { openEntry, openTrade } = useUI();
  const [confirmRemove, setConfirmRemove] = useState(null);

  const series = useMarketSeries(baseCode, code ? [code] : [], 30);
  const isBase = code === baseCode;
  const rate = isBase ? 1 : rates?.[code];
  const points = code ? series.seriesByCode?.[code]?.points ?? [] : [];
  const row = rows.find((item) => item.code === code);
  const activePosition = getPosition(code);
  const rawPosition = getPortfolio(code);
  const entries = useMemo(
    () =>
      code
        ? sortEntriesDesc(rawPosition?.entries ?? []).map((entry) => ({ ...entry, code }))
        : [],
    [code, rawPosition],
  );

  const bounds = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((point) => point.rate);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, value) => sum + value, 0) / values.length,
    };
  }, [points]);

  const variation =
    points.length > 1
      ? ((points[points.length - 1].rate - points[0].rate) / points[0].rate) * 100
      : null;

  const name = code ? currencyName(code, code) : '';
  const errorInfo = describeError(series.error);

  function handleEntry(type) {
    onClose();
    openEntry({ code, type });
  }

  function handleTrade() {
    onClose();
    openTrade(baseCode, code);
  }

  return (
    <>
    <Modal
      open={Boolean(code)}
      onClose={onClose}
      eyebrow={t('asset.eyebrow')}
      title={t('asset.title', { code: code ?? '', name })}
      subtitle={t('asset.subtitle', { base: baseCode })}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.closeDialog')}
          </Button>
          <Button variant="secondary" icon="swap" onClick={handleTrade}>
            {t('asset.trade')}
          </Button>
          <Button variant="secondary" icon="minus" onClick={() => handleEntry('out')}>
            {t('portfolio.addOut')}
          </Button>
          <Button icon="plus" onClick={() => handleEntry('in')}>
            {t('portfolio.addIn')}
          </Button>
        </>
      }
    >
      <div className={styles.hero}>
        <div className={styles.identity}>
          <CurrencyBadge code={code ?? '—'} size="lg" />
          <div>
            <p className={styles.code}>{code}</p>
            <p className={styles.name}>{name}</p>
          </div>
        </div>

        <div className={styles.quote}>
          <span className={styles.quoteLabel}>{t('asset.rate')}</span>
          <span className={styles.quoteValue}>
            {Number.isFinite(rate) ? formatters.formatRate(rate) : '—'}
            <span className={styles.quoteCode}>{code}</span>
          </span>
          <span className={styles.quoteHint}>1 {baseCode}</span>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('asset.inverse')}</span>
          <span className={styles.statValue}>
            {Number.isFinite(rate) && rate > 0 ? formatters.formatRate(1 / rate) : '—'} {baseCode}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('asset.change')}</span>
          <ChangeBadge value={variation ?? undefined} />
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('asset.low')}</span>
          <span className={styles.statValue}>
            {bounds ? formatters.formatRate(bounds.min) : '—'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('asset.high')}</span>
          <span className={styles.statValue}>
            {bounds ? formatters.formatRate(bounds.max) : '—'}
          </span>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className={styles.positionCard}>
          <div className={styles.positionHead}>
            <span className={styles.positionTitle}>
              <Icon name="wallet" size={16} />
              {t('asset.inPortfolio', { quantity: formatters.formatQuantity(activePosition?.quantity ?? 0) })}
            </span>
            {Number.isFinite(row?.pnlPercent) ? <ChangeBadge value={row.pnlPercent} size="sm" /> : null}
          </div>
          <dl className={styles.positionStats}>
            <div>
              <dt>{t('asset.value')}</dt>
              <dd>{formatters.formatMoney(row?.value, baseCode)}</dd>
            </div>
            <div>
              <dt>{t('asset.pnl')}</dt>
              <dd>{formatters.formatMoney(row?.pnl, baseCode)}</dd>
            </div>
            <div>
              <dt>{t('portfolio.columns.avgCost')}</dt>
              <dd>{Number.isFinite(row?.avgCost) ? formatters.formatMoney(row.avgCost, 'BRL') : '—'}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className={styles.chartHead}>
        <p className={styles.chartTitle}>{t('markets.detail.variation')}</p>
        {rateDate ? (
          <span className={styles.chartMeta}>{t('asset.updated', { date: formatters.formatDate(rateDate) })}</span>
        ) : null}
      </div>

      {isBase || points.length === 0 ? (
        <div className={styles.chartState}>
          {series.isLoading ? t('common.loading') : series.error ? t(errorInfo.key, errorInfo.vars) : t('asset.noSeries')}
          {series.error ? (
            <button type="button" className={styles.retry} onClick={series.retry}>
              {t('common.retry')}
            </button>
          ) : null}
        </div>
      ) : (
        <RateChart points={points} fromCode={baseCode} toCode={code} />
      )}

      {bounds ? (
        <p className={styles.rangeLine}>
          {t('asset.range', {
            start: formatters.formatDate(points[0].date),
            end: formatters.formatDate(points[points.length - 1].date),
          })}
          <span aria-hidden="true"> · </span>
          {t('asset.avg')} {formatters.formatRate(bounds.avg)}
        </p>
      ) : null}

      <div className={styles.historyHead}>
        <p className={styles.chartTitle}>{t('entries.historyTitle')}</p>
        <span className={styles.historyCount}>
          {t('entries.count', { count: entries.length })}
        </span>
      </div>

      <EntriesTable
        entries={entries}
        onRemove={(entry) => setConfirmRemove(entry)}
        empty={t('entries.historyEmpty')}
      />
    </Modal>

    <ConfirmDialog
      open={Boolean(confirmRemove)}
      title={t('entries.removeTitle')}
      message={
        confirmRemove
          ? t('entries.removeMessage', {
              type: confirmRemove.type === 'out' ? t('entries.outBadge') : t('entries.inBadge'),
              code: confirmRemove.code,
              date: formatters.formatDate(confirmRemove.date),
            })
          : undefined
      }
      confirmLabel={t('entries.removeConfirm')}
      tone="danger"
      onConfirm={() => {
        if (confirmRemove) removeEntry(confirmRemove.code, confirmRemove.id);
      }}
      onClose={() => setConfirmRemove(null)}
    />
    </>
  );
}

AssetDetailModal.propTypes = {
  code: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
