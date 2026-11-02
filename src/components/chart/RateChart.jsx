import PropTypes from 'prop-types';
import { useId, useState } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth.js';
import { useI18n } from '../../i18n/useI18n.js';
import { cx } from '../../utils/cx.js';
import styles from './RateChart.module.css';

const PADDING = { top: 18, right: 14, bottom: 30, left: 58 };

function buildPath(points, scaleX, scaleY) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${scaleX(index).toFixed(2)},${scaleY(point.rate).toFixed(2)}`)
    .join(' ');
}

export default function RateChart({ points, fromCode, toCode }) {
  const { t, formatters } = useI18n();
  const [containerRef, width] = useElementWidth(760);
  const [activeIndex, setActiveIndex] = useState(null);
  const hintId = useId();

  const height = width < 560 ? 230 : 300;
  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 40);
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const rates = points.map((point) => point.rate);
  const rawMin = Math.min(...rates);
  const rawMax = Math.max(...rates);
  const span = rawMax - rawMin;
  const breathing = span === 0 ? Math.abs(rawMax) * 0.01 || 0.0001 : span * 0.12;
  const min = rawMin - breathing;
  const max = rawMax + breathing;

  const scaleX = (index) =>
    points.length === 1
      ? PADDING.left + plotWidth / 2
      : PADDING.left + (index / (points.length - 1)) * plotWidth;
  const scaleY = (rate) =>
    PADDING.top + (1 - (rate - min) / (max - min)) * plotHeight;

  const safeIndex = activeIndex === null ? null : Math.min(activeIndex, points.length - 1);
  const activePoint = safeIndex === null ? null : points[safeIndex];

  const linePath = buildPath(points, scaleX, scaleY);
  const areaPath =
    points.length > 1
      ? `${linePath} L${scaleX(points.length - 1).toFixed(2)},${height - PADDING.bottom} L${PADDING.left},${height - PADDING.bottom} Z`
      : '';

  const yTicks = Array.from({ length: 4 }, (_, index) => min + ((max - min) / 3) * index);
  const tickCount = width < 560 ? 3 : 5;
  const xTickIndexes = Array.from({ length: tickCount }, (_, index) =>
    Math.round((index / (tickCount - 1)) * (points.length - 1)),
  ).filter((value, index, array) => array.indexOf(value) === index);

  const summaryLabel = t('chart.chartLabel', {
    from: fromCode,
    to: toCode,
    start: formatters.formatDate(points[0]?.date),
    end: formatters.formatDate(points[points.length - 1]?.date),
    min: formatters.formatRate(rawMin),
    max: formatters.formatRate(rawMax),
  });

  function handlePointerMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relative = event.clientX - bounds.left;
    const ratio = Math.min(Math.max((relative - PADDING.left) / plotWidth, 0), 1);
    setActiveIndex(Math.round(ratio * (points.length - 1)));
  }

  function handleKeyDown(event) {
    const last = points.length - 1;
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
      : Math.min(Math.max(scaleX(safeIndex), 80), Math.max(width - 80, 80));

  return (
    <figure className={styles.figure} ref={containerRef}>
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
        onFocus={() => setActiveIndex((value) => value ?? points.length - 1)}
        onBlur={() => setActiveIndex(null)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActiveIndex(null)}
      >
        <title>{summaryLabel}</title>

        {yTicks.map((tick) => {
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
              <text x={PADDING.left - 10} y={y + 4} textAnchor="end" className={styles.axisLabel}>
                {formatters.formatRate(tick)}
              </text>
            </g>
          );
        })}

        {xTickIndexes.map((index) => (
          <text
            key={`x-${points[index].date}`}
            x={scaleX(index)}
            y={height - 8}
            textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
            className={styles.axisLabel}
          >
            {formatters.formatShortDate(points[index].date)}
          </text>
        ))}

        {areaPath ? <path d={areaPath} className={styles.area} /> : null}
        <path d={linePath} className={styles.line} />

        {points.length === 1 ? (
          <circle cx={scaleX(0)} cy={scaleY(points[0].rate)} r={4} className={styles.lastDot} />
        ) : null}
        <circle
          cx={scaleX(points.length - 1)}
          cy={scaleY(points[points.length - 1].rate)}
          r={4.5}
          className={styles.lastDot}
        />

        {activePoint ? (
          <g className={styles.cursor}>
            <line
              x1={scaleX(safeIndex)}
              x2={scaleX(safeIndex)}
              y1={PADDING.top}
              y2={height - PADDING.bottom}
              className={styles.crosshair}
            />
            <circle cx={scaleX(safeIndex)} cy={scaleY(activePoint.rate)} r={5} className={styles.cursorDot} />
          </g>
        ) : null}
      </svg>

      {activePoint ? (
        <div
          className={styles.tooltip}
          style={{ left: tooltipLeft, top: Math.max(scaleY(activePoint.rate) - 64, 0) }}
          aria-hidden="true"
        >
          <span className={styles.tooltipDate}>{formatters.formatDate(activePoint.date)}</span>
          <span className={styles.tooltipValue}>
            {t('converter.rateLine', {
              from: fromCode,
              rate: formatters.formatRate(activePoint.rate),
              to: toCode,
            })}
          </span>
        </div>
      ) : null}

      <p id={hintId} className={cx('sr-only')}>
        {t('chart.keyboardHint')}
      </p>
      <p className="sr-only" aria-live="polite">
        {activePoint
          ? t('chart.pointLabel', {
              date: formatters.formatDate(activePoint.date),
              rate: formatters.formatRate(activePoint.rate),
            })
          : ''}
      </p>
    </figure>
  );
}

RateChart.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      rate: PropTypes.number.isRequired,
    }),
  ).isRequired,
  fromCode: PropTypes.string.isRequired,
  toCode: PropTypes.string.isRequired,
};
