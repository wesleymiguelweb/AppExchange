import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/useI18n.js';
import { useMarketData } from '../context/MarketDataContext.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { usePanels } from '../context/PanelsContext.jsx';
import { useToastContext } from '../context/ToastContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useMarketSeries } from '../hooks/useMarketSeries.js';
import { usePortfolioHistory } from '../hooks/usePortfolioHistory.js';
import { findPanel } from '../constants/panels.js';
import { cx } from '../utils/cx.js';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import {
  AllocationPanel,
  InsightsPanel,
  PerformancePanel,
  PositionsPanel,
  SummaryPanel,
  WatchlistPanel,
} from './DashboardPanels.jsx';
import styles from './DashboardView.module.css';

const WATCH_POOL = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'CNY', 'AUD'];

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 6) return 'greetingNight';
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

export default function DashboardView() {
  const { t } = useI18n();
  const { baseCode, rates } = useMarketData();
  const {
    positions,
    rows,
    totalValue,
    totalCost,
    totalPnl,
    positionsCount,
    isReady,
  } = usePortfolio();
  const {
    visiblePanels,
    state,
    togglePanel,
    cyclePanelSize,
    movePanel,
    movePanelBy,
    resetPanels,
  } = usePanels();
  const { openEntry } = useUI();
  const { showToast } = useToastContext();

  const [period, setPeriod] = useState(30);
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const history = usePortfolioHistory(positions, baseCode, period);

  const watchCodes = useMemo(
    () => WATCH_POOL.filter((code) => code !== baseCode).slice(0, 6),
    [baseCode],
  );

  const watchSeries = useMarketSeries(baseCode, watchCodes, 7);

  function handleReset() {
    resetPanels();
    showToast(t('toast.panelsReset'));
  }

  function handleDrop(targetId) {
    if (dragging && dragging !== targetId) {
      movePanel(dragging, targetId);
    }
    setDragging(null);
    setDragOver(null);
  }

  function renderPanel(panelId) {
    switch (panelId) {
      case 'summary':
        return (
          <SummaryPanel
            baseCode={baseCode}
            points={history.points}
            isLoading={history.isLoading}
            error={history.error}
            onRetry={history.retry}
            period={period}
            onPeriodChange={setPeriod}
            totalValue={totalValue}
            totalCost={totalCost}
            totalPnl={totalPnl}
            positionsCount={positionsCount}
            isReady={isReady}
            onAdd={() => openEntry(null)}
          />
        );
      case 'performance':
        return (
          <PerformancePanel
            baseCode={baseCode}
            points={history.points}
            rows={rows}
            isLoading={history.isLoading}
            period={period}
            totalPnl={totalPnl}
          />
        );
      case 'allocation':
        return (
          <AllocationPanel
            baseCode={baseCode}
            rows={rows}
            totalValue={totalValue}
            isLoading={!isReady}
          />
        );
      case 'positions':
        return (
          <PositionsPanel
            baseCode={baseCode}
            rows={rows}
            isReady={isReady}
            onAdd={() => openEntry(null)}
          />
        );
      case 'watchlist':
        return (
          <WatchlistPanel
            baseCode={baseCode}
            codes={watchCodes}
            rates={rates}
            series={watchSeries}
            isLoading={watchSeries.isLoading}
          />
        );
      case 'insights':
        return (
          <InsightsPanel
            baseCode={baseCode}
            rows={rows}
            codes={watchCodes}
            series={watchSeries}
          />
        );
      default:
        return null;
    }
  }

  const hiddenPanels = state.hidden.map(findPanel).filter(Boolean);

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow={t('dashboard.eyebrow')}
        title={`${t(`dashboard.${greetingKey()}`)}!`}
        description={t('dashboard.welcome')}
        actions={
          <>
            <span className={styles.basePill}>
              {t('dashboard.baseLine', { currency: baseCode })}
            </span>
            <Button
              variant={editMode ? 'primary' : 'secondary'}
              icon={editMode ? 'check' : 'panel'}
              onClick={() => setEditMode((current) => !current)}
            >
              {editMode ? t('dashboard.done') : t('dashboard.manage')}
            </Button>
            <Button icon="plus" onClick={() => openEntry(null)}>
              {t('dashboard.addPosition')}
            </Button>
          </>
        }
      />

      {editMode ? (
        <div className={styles.editBanner}>
          <span className={styles.editHint}>
            <Icon name="drag" size={16} />
            {t('dashboard.dragHint')}
          </span>

          {hiddenPanels.length > 0 ? (
            <div className={styles.hiddenChips}>
              <span className={styles.hiddenLabel}>{t('dashboard.hidden')}:</span>
              {hiddenPanels.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  className={styles.hiddenChip}
                  onClick={() => togglePanel(panel.id)}
                >
                  <Icon name="plus" size={12} />
                  {t(panel.labelKey)}
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.editActions}>
            <Button variant="secondary" size="sm" icon="reset" onClick={handleReset}>
              {t('dashboard.resetLayout')}
            </Button>
            <Button size="sm" icon="check" onClick={() => setEditMode(false)}>
              {t('dashboard.done')}
            </Button>
          </div>
        </div>
      ) : null}

      {visiblePanels.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <Icon name="eyeOff" size={24} />
          </span>
          <h2 className={styles.emptyTitle}>{t('dashboard.emptyTitle')}</h2>
          <p className={styles.emptyText}>{t('dashboard.empty')}</p>
          <div className={styles.emptyActions}>
            <Button icon="panel" onClick={() => setEditMode(true)}>
              {t('dashboard.manage')}
            </Button>
            <Button variant="secondary" icon="reset" onClick={handleReset}>
              {t('dashboard.resetLayout')}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {visiblePanels.map((panel) => (
            <div
              key={panel.id}
              className={cx(
                styles.cell,
                styles[`span-${panel.size}`],
                dragging === panel.id && styles.cellDragging,
                dragOver === panel.id && dragging !== panel.id && styles.cellDragOver,
              )}
              onDragOver={
                editMode
                  ? (event) => {
                      event.preventDefault();
                      setDragOver(panel.id);
                    }
                  : undefined
              }
              onDragLeave={editMode ? () => setDragOver(null) : undefined}
              onDrop={
                editMode
                  ? (event) => {
                      event.preventDefault();
                      handleDrop(panel.id);
                    }
                  : undefined
              }
            >
              {editMode ? (
                <div className={styles.editBar}>
                  <span
                    className={styles.dragHandle}
                    draggable
                    onDragStart={(event) => {
                      setDragging(panel.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', panel.id);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setDragOver(null);
                    }}
                    title={t('dashboard.dragHint')}
                    aria-label={t('dashboard.dragHint')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        movePanelBy(panel.id, -1);
                      } else if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        movePanelBy(panel.id, 1);
                      }
                    }}
                  >
                    <Icon name="drag" size={14} />
                  </span>
                  <span className={styles.editName}>{t(panel.labelKey)}</span>
                  {panel.sizes.length > 1 ? (
                    <button
                      type="button"
                      className={styles.editChip}
                      onClick={() => cyclePanelSize(panel.id)}
                      title={t('dashboard.size')}
                    >
                      {panel.size.toUpperCase()}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.editHide}
                    onClick={() => togglePanel(panel.id)}
                    title={t('dashboard.hidden')}
                    aria-label={`${t('dashboard.hidden')}: ${t(panel.labelKey)}`}
                  >
                    <Icon name="eyeOff" size={14} />
                  </button>
                </div>
              ) : null}

              {renderPanel(panel.id)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
