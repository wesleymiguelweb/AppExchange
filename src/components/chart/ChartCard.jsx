import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { describeError } from '../../utils/errorMessages.js';
import { downsampleSeries } from '../../utils/series.js';
import Card from '../ui/Card.jsx';
import StateBlock from '../ui/StateBlock.jsx';
import PeriodSummary from './PeriodSummary.jsx';
import PeriodTabs from './PeriodTabs.jsx';
import RateChart from './RateChart.jsx';
import styles from './ChartCard.module.css';

export default function ChartCard({
  fromCode,
  toCode,
  periodId,
  onPeriodChange,
  points,
  summary,
  range,
  isLoading,
  error,
  onRetry,
}) {
  const { t, formatters } = useI18n();
  const chartPoints = useMemo(() => downsampleSeries(points, 220), [points]);
  const errorInfo = describeError(error);

  const actions = (
    <PeriodTabs value={periodId} onChange={onPeriodChange} label={t('chart.periodsLabel')} />
  );

  return (
    <Card
      id="historico"
      titleId="chart-title"
      title={t('chart.title')}
      subtitle={t('chart.subtitle', { from: fromCode, to: toCode })}
      actions={actions}
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
        <StateBlock variant="loading" title={t('chart.loading')} />
      ) : chartPoints.length === 0 ? (
        <StateBlock
          variant="empty"
          title={t('chart.emptyTitle')}
          message={t('chart.empty')}
        />
      ) : (
        <>
          <div className={styles.meta}>
            <span className={styles.period}>
              {t('chart.periodLabel', {
                period: t(`chart.periodNames.${periodId}`),
              })}
            </span>
            {range ? (
              <span className={styles.range}>
                {t('common.range', {
                  start: formatters.formatDate(range.start),
                  end: formatters.formatDate(range.end),
                })}
              </span>
            ) : null}
          </div>

          <RateChart points={chartPoints} fromCode={fromCode} toCode={toCode} />

          <PeriodSummary summary={summary} />
        </>
      )}
    </Card>
  );
}

ChartCard.propTypes = {
  fromCode: PropTypes.string.isRequired,
  toCode: PropTypes.string.isRequired,
  periodId: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  points: PropTypes.arrayOf(
    PropTypes.shape({ date: PropTypes.string, rate: PropTypes.number }),
  ).isRequired,
  summary: PropTypes.object,
  range: PropTypes.shape({ start: PropTypes.string, end: PropTypes.string }),
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onRetry: PropTypes.func.isRequired,
};
