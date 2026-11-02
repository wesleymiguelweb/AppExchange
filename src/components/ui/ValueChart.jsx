import PropTypes from 'prop-types';
import { useId, useState } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth.js';
import { useI18n } from '../../i18n/useI18n.js';
import { cx } from '../../utils/cx.js';
import styles from './ValueChart.module.css';

function buildLine(points, scaleX, scaleY) {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${scaleX(index).toFixed(2)},${scaleY(point.value).toFixed(2)}`,
    )
    .join(' ');
}

/**
 * Gráfico de área para valores monetários (patrimônio, série de um ativo).
 * SVG puro, responsivo, com leitura por teclado e tooltip.
 */
export default function ValueChart({
  points,
  currency,
  height = 280,
  minimal = false,
  label,
  loading = false,
  className,
}) {
  const { t, formatters } = useI18n();
  const [containerRef, width] = useElementWidth(720);
  const [activeIndex, setActiveIndex] = useState(null);
  const hintId = useId();
  const gradientId = useId().replace(/[:]/g, '');

  if (loading) {
    return (
      <div
        ref={containerRef}
        className={cx(styles.placeholder, className)}
        style={{ height }}
        role="status"
        aria-label={t('common.loading')}
      >
        <span className={styles.shimmer} />
      </div>
    );
  }

  const safePoints = (points ?? []).filter(
    (point) => point && Number.isFinite(point.value) && point.date,
  );

  if (safePoints.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cx(styles.placeholder, styles.empty, className)}
        style={{ height }}
      >
        <span>{t('common.noData')}</span>
      </div>
    );
  }

  const PADDING = minimal
    ? { top: 12, right: 8, bottom: 24, left: 10 }
    : { top: 18, right: 16, bottom: 30, left: 76 };

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 40);
  const plotHeight = Math.max(height - PADDING.top - PADDING.bottom, 40);

  const values = safePoints.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin;
  const breathing = span === 0 ? Math.abs(rawMax) * 0.02 || 1 : span * 0.14;
  const min = rawMin - breathing;
  const max = rawMax + breathing;

  const scaleX = (index) =>
    safePoints.length === 1
      ? PADDING.left + plotWidth / 2
      : PADDING.left + (index / (safePoints.length - 1)) * plotWidth;
  const scaleY = (value) => PADDING.top + (1 - (value - min) / (max - min)) * plotHeight;

  const safeIndex = activeIndex === null ? null : Math.min(activeIndex, safePoints.length - 1);
  const activePoint = safeIndex === null ? null : safePoints[safeIndex];
  const linePath = buildLine(safePoints, scaleX, scaleY);
  const areaPath = `${linePath} L${scaleX(safePoints.length - 1).toFixed(2)},${(
    height - PADDING.bottom
  ).toFixed(2)} L${PADDING.left},${(height - PADDING.bottom).toFixed(2)} Z`;

  const yTicks = Array.from({ length: 4 }, (_, index) => min + ((max - min) / 3) * index);
  const tickCount = width < 560 ? 3 : 5;
  const xTickIndexes = Array.from({ length: tickCount }, (_, index) =>
    Math.round((index / (tickCount - 1)) * (safePoints.length - 1)),
  ).filter((value, index, array) => array.indexOf(value) === index);

  const summaryLabel =
    label ??
    `${formatters.formatDate(safePoints[0].date)} – ${formatters.formatDate(
      safePoints[safePoints.length - 1].date,
    )}`;

  function handlePointerMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relative = event.clientX - bounds.left;
    const ratio = Math.min(Math.max((relative - PADDING.left) / plotWidth, 0), 1);
    setActiveIndex(Math.round(ratio * (safePoints.length - 1)));
  }

  function handleKeyDown(event) {
    const last = safePoints.length - 1;
    const current = safeIndex ?? last;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveIndex(Math.max(current - 1, 0));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveIndex(Math.min(current + 1, last));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(last);
    }
  }

  const tooltipLeft =
    activePoint === null
      ? 0
      : Math.min(Math.max(scaleX(safeIndex), 90), Math.max(width - 90, 90));

  return (
    <figure className={cx(styles.figure, className)} ref={containerRef}>
      <svg
        className={styles.chart}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summaryLabel}
        aria-describedby={hintId}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => setActiveIndex((value) => value ?? safePoints.length - 1)}
        onBlur={() => setActiveIndex(null)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActiveIndex(null)}
      >
        <title>{summaryLabel}</title>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {!minimal
          ? yTicks.map((tick) => {
              const y = scaleY(tick);
              return (
                <g key={`y-${tick}`}>
                  <line
                    x1={PADDING.left}
                    x2={width - PADDING.right}
                    y1={y}
                    y2={y}
                    className={styles.grid}
                  />
                  <text
                    x={PADDING.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className={styles.axisLabel}
                  >
                    {formatters.formatMoneyCompact(tick, currency)}
                  </text>
                </g>
              );
            })
          : null}

        {xTickIndexes.map((index) => (
          <text
            key={`x-${safePoints[index].date}`}
            x={scaleX(index)}
            y={height - 8}
            textAnchor={index === 0 ? 'start' : index === safePoints.length - 1 ? 'end' : 'middle'}
            className={styles.axisLabel}
          >
            {formatters.formatShortDate(safePoints[index].date)}
          </text>
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} className={styles.line} />

        <circle
          cx={scaleX(safePoints.length - 1)}
          cy={scaleY(safePoints[safePoints.length - 1].value)}
          r={4.5}
          className={styles.lastDot}
        />

        {activePoint ? (
          <g>
            <line
              x1={scaleX(safeIndex)}
              x2={scaleX(safeIndex)}
              y1={PADDING.top}
              y2={height - PADDING.bottom}
              className={styles.crosshair}
            />
            <circle
              cx={scaleX(safeIndex)}
              cy={scaleY(activePoint.value)}
              r={5}
              className={styles.cursorDot}
            />
          </g>
        ) : null}
      </svg>

      {activePoint ? (
        <div
          className={styles.tooltip}
          style={{ left: tooltipLeft, top: Math.max(scaleY(activePoint.value) - 62, 0) }}
          aria-hidden="true"
        >
          <span className={styles.tooltipDate}>{formatters.formatDate(activePoint.date)}</span>
          <span className={styles.tooltipValue}>
            {formatters.formatMoney(activePoint.value, currency)}
          </span>
        </div>
      ) : null}

      <p id={hintId} className="sr-only">
        {t('chart.keyboardHint')}
      </p>
      <p className="sr-only" aria-live="polite">
        {activePoint
          ? `${formatters.formatDate(activePoint.date)} · ${formatters.formatMoney(
              activePoint.value,
              currency,
            )}`
          : ''}
      </p>
    </figure>
  );
}

ValueChart.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    }),
  ),
  currency: PropTypes.string.isRequired,
  height: PropTypes.number,
  minimal: PropTypes.bool,
  label: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
};
