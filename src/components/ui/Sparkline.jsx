import PropTypes from 'prop-types';
import { useId } from 'react';
import { cx } from '../../utils/cx.js';
import styles from './Sparkline.module.css';

const WIDTH = 120;
const HEIGHT = 36;
const PADDING = 3;

function buildPoints(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) || 1;
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: values.length > 1 ? index * step : WIDTH / 2,
    y: PADDING + (1 - (value - min) / span) * (HEIGHT - PADDING * 2),
  }));
}

/**
 * Mini gráfico de linha sem eixos, usado em cartões de mercado e listas.
 * O tom acompanha a variação (alta/baixa) e pode ser forçado pela prop `tone`.
 */
export default function Sparkline({
  values,
  label,
  tone = 'auto',
  className,
  strokeWidth = 1.6,
}) {
  const gradientId = useId().replace(/[:]/g, '');
  const safeValues = Array.isArray(values) ? values.filter((value) => Number.isFinite(value)) : [];

  if (safeValues.length === 0) {
    return <span className={cx(styles.empty, className)} aria-hidden="true" />;
  }

  const points = buildPoints(safeValues);
  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ');

  const area = `${line} L${points[points.length - 1].x.toFixed(2)},${HEIGHT} L${points[0].x.toFixed(
    2,
  )},${HEIGHT} Z`;

  const resolvedTone =
    tone === 'auto'
      ? safeValues[safeValues.length - 1] >= safeValues[0]
        ? 'positive'
        : 'negative'
      : tone;

  return (
    <span
      className={cx(styles.wrap, styles[resolvedTone], className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          className={styles.line}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}

Sparkline.propTypes = {
  values: PropTypes.arrayOf(PropTypes.number),
  label: PropTypes.string,
  tone: PropTypes.oneOf(['auto', 'positive', 'negative', 'neutral', 'brand']),
  className: PropTypes.string,
  strokeWidth: PropTypes.number,
};
