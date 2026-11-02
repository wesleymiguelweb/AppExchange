import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import { useI18n } from '../../i18n/useI18n.js';
import styles from './DonutChart.module.css';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2.4;

/**
 * Donut em SVG puro. Cada fatia recebe a cor via `color` (token CSS) e a
 * legenda textual fica fora do SVG para continuar acessível.
 */
export default function DonutChart({
  slices,
  centerValue,
  centerLabel,
  size = 176,
  thickness = 14,
  label,
  className,
}) {
  const { formatters } = useI18n();
  const safeSlices = (slices ?? []).filter((slice) => Number.isFinite(slice.value) && slice.value > 0);
  const total = safeSlices.reduce((sum, slice) => sum + slice.value, 0);

  let progress = 0;
  const arcs = safeSlices.map((slice) => {
    const fraction = total > 0 ? slice.value / total : 0;
    const length = Math.max(fraction * CIRCUMFERENCE - GAP, 0.6);
    const arc = {
      ...slice,
      fraction,
      dasharray: `${length} ${CIRCUMFERENCE - length}`,
      dashoffset: -progress,
    };
    progress += fraction * CIRCUMFERENCE;
    return arc;
  });

  return (
    <div className={cx(styles.wrap, className)}>
      <div className={styles.chart} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 120 120"
          className={styles.svg}
          role="img"
          aria-label={label}
          focusable="false"
        >
          <circle cx="60" cy="60" r={RADIUS} className={styles.track} strokeWidth={thickness} />
          <g transform="rotate(-90 60 60)">
            {arcs.map((arc) => (
              <circle
                key={arc.id}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={thickness}
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
                strokeLinecap="butt"
                className={styles.arc}
              />
            ))}
          </g>
        </svg>

        <div className={styles.center}>
          {centerValue ? <span className={styles.centerValue}>{centerValue}</span> : null}
          {centerLabel ? <span className={styles.centerLabel}>{centerLabel}</span> : null}
        </div>
      </div>

      <ul className={styles.legend}>
        {arcs.map((arc) => (
          <li key={arc.id} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: arc.color }} aria-hidden="true" />
            <span className={styles.legendLabel}>{arc.label}</span>
            <span className={styles.legendValue}>{formatters.formatPercent(arc.fraction * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

DonutChart.propTypes = {
  slices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string,
    }),
  ).isRequired,
  centerValue: PropTypes.node,
  centerLabel: PropTypes.node,
  size: PropTypes.number,
  thickness: PropTypes.number,
  label: PropTypes.string,
  className: PropTypes.string,
};
