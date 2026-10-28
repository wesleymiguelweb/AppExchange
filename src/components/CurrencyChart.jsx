import { useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatDate, formatNumber } from '../utils/formatters.js';

const CHART = { width: 1000, height: 300, left: 86, right: 982, top: 30, bottom: 236 };

function createSmoothPath(points) {
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const before = points[index - 2] || previous;
    const next = points[index + 1] || point;
    const controlOneX = previous.x + (point.x - before.x) / 6;
    const controlOneY = Math.max(Math.min(previous.y, point.y), Math.min(Math.max(previous.y, point.y), previous.y + (point.y - before.y) / 6));
    const controlTwoX = point.x - (next.x - previous.x) / 6;
    const controlTwoY = Math.max(Math.min(previous.y, point.y), Math.min(Math.max(previous.y, point.y), point.y - (next.y - previous.y) / 6));
    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${point.x} ${point.y}`;
  }, '');
}

export default function CurrencyChart({ points, base, quote, height = 'h-40', compact = false }) {
  const gradientId = `exchange-chart-${useId().replaceAll(':', '')}`;
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const chartPoints = useMemo(() => {
    if (!points.length) return [];
    const values = points.map(({ rate }) => rate);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const rawSpan = maximum - minimum;
    const span = rawSpan || Math.max(Math.abs(maximum) * 0.004, 0.0001);
    const padding = span * 0.12;
    const domainMin = minimum - padding;
    const domainMax = maximum + padding;
    const firstTime = Date.parse(`${points[0].date}T12:00:00Z`);
    const lastTime = Date.parse(`${points.at(-1).date}T12:00:00Z`);
    const timeSpan = lastTime - firstTime;

    return points.map((point, index) => {
      const time = Date.parse(`${point.date}T12:00:00Z`);
      const timeRatio = timeSpan > 0 ? (time - firstTime) / timeSpan : (points.length === 1 ? 0.5 : index / (points.length - 1));
      return {
        ...point,
        x: CHART.left + timeRatio * (CHART.right - CHART.left),
        y: CHART.bottom - ((point.rate - domainMin) / (domainMax - domainMin)) * (CHART.bottom - CHART.top),
      };
    });
  }, [points]);

  if (!chartPoints.length) return <div className={`grid ${height} place-items-center text-sm text-slate-400`}>Sem dados para o período.</div>;

  const activeIndex = Math.min(selectedIndex ?? chartPoints.length - 1, chartPoints.length - 1);
  const active = chartPoints[activeIndex];
  const linePath = createSmoothPath(chartPoints);
  const baseline = CHART.bottom + 20;
  const areaPath = `${linePath} L ${chartPoints.at(-1).x} ${baseline} L ${chartPoints[0].x} ${baseline} Z`;
  const values = points.map(({ rate }) => rate);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min || Math.max(Math.abs(max) * 0.004, 0.0001)) * 0.12;
  const tickCount = compact ? 3 : 5;
  const gridTicks = Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / (tickCount - 1);
    return { y: CHART.top + ratio * (CHART.bottom - CHART.top), value: max + padding - ratio * ((max - min) + padding * 2) };
  });

  function selectPoint(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const pointerY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    const pointerChartX = ratio * CHART.width;
    const nearestIndex = chartPoints.reduce((closest, point, index) => Math.abs(point.x - pointerChartX) < Math.abs(chartPoints[closest].x - pointerChartX) ? index : closest, 0);
    setSelectedIndex((current) => current === nearestIndex ? current : nearestIndex);
    const x = Math.round(((ratio - 0.5) * 14) / 3) * 3;
    const y = Math.round(((pointerY - 0.5) * 8) / 3) * 3;
    setParallax((current) => current.x === x && current.y === y ? current : { x, y });
  }

  return <div className={`relative isolate ${height} w-full touch-pan-y overflow-hidden rounded-2xl`} onPointerMove={selectPoint} onPointerDown={selectPoint} onPointerLeave={() => { setSelectedIndex(null); setParallax({ x: 0, y: 0 }); }}>
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/65 via-white/30 to-cyan-50/50 dark:from-indigo-950/30 dark:via-slate-900/20 dark:to-blue-950/25" />
    <div className="chart-parallax-glow pointer-events-none absolute -right-8 -top-16 -z-10 h-48 w-48 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/15" style={{ transform: `translate3d(${parallax.x * -0.9}px, ${parallax.y * -0.7}px, 0)` }} />
    <div className="chart-parallax-glow pointer-events-none absolute -bottom-24 left-1/4 -z-10 h-40 w-56 rounded-full bg-cyan-300/20 blur-3xl dark:bg-blue-500/10" style={{ transform: `translate3d(${parallax.x * 0.55}px, ${parallax.y * 0.8}px, 0)` }} />
    <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} preserveAspectRatio="none" className="relative z-0 h-full w-full" role="img" aria-label={`Gráfico interativo da cotação de ${base} para ${quote}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6575ff" stopOpacity=".28" /><stop offset="72%" stopColor="#6575ff" stopOpacity=".08" /><stop offset="100%" stopColor="#6575ff" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${gradientId}-line`} x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#72a1ff" /><stop offset="52%" stopColor="#5967f2" /><stop offset="100%" stopColor="#29b5c9" /></linearGradient>
        <filter id={`${gradientId}-shadow`} x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      {gridTicks.map((tick, index) => <g key={tick.y}>
        <line x1={CHART.left} x2={CHART.right} y1={tick.y} y2={tick.y} className="chart-gridline" />
        {!compact && <text x="0" y={tick.y + 5} className="chart-axis-label">{formatNumber.format(tick.value)}</text>}
      </g>)}
      {!compact && <line x1={CHART.left} x2={CHART.right} y1={baseline} y2={baseline} className="chart-baseline" />}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke="#5967f2" strokeWidth="8" opacity=".22" filter={`url(#${gradientId}-shadow)`} vectorEffect="non-scaling-stroke" />
      <path d={linePath} fill="none" stroke={`url(#${gradientId}-line)`} strokeWidth="2.8" pathLength="1" strokeDasharray="1" strokeDashoffset="1" className="chart-line" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={active.x} x2={active.x} y1={CHART.top - 5} y2={baseline} className="chart-crosshair" />
      <circle cx={active.x} cy={active.y} r="9" fill="#6170f4" opacity=".12" />
      <circle cx={active.x} cy={active.y} r="5" fill="white" stroke="#5967f2" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      <rect x={CHART.left} y="0" width={CHART.right - CHART.left} height={CHART.height} fill="transparent" tabIndex="0" role="slider" aria-label="Explore a série histórica com as setas do teclado" aria-valuemin="0" aria-valuemax={chartPoints.length - 1} aria-valuenow={activeIndex} aria-valuetext={`${formatDate(active.date)} · ${formatNumber.format(active.rate)} ${quote}`} onFocus={() => setSelectedIndex(chartPoints.length - 1)} onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        setSelectedIndex(Math.max(0, Math.min(chartPoints.length - 1, activeIndex + (event.key === 'ArrowRight' ? 1 : -1))));
      }} />
    </svg>
    <div className="pointer-events-none absolute top-2 z-10 grid min-w-max -translate-x-1/2 gap-0.5 rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg shadow-indigo-950/10 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/85" style={{ left: `clamp(76px, ${(active.x / CHART.width) * 100}%, calc(100% - 76px))` }} aria-live="polite">
      <strong className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatNumber.format(active.rate)} <span className="text-[10px] font-medium text-slate-400">{quote}</span></strong>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(active.date)} · 1 {base}</span>
    </div>
  </div>;
}

CurrencyChart.propTypes = {
  points: PropTypes.arrayOf(PropTypes.shape({ date: PropTypes.string.isRequired, rate: PropTypes.number.isRequired })).isRequired,
  base: PropTypes.string.isRequired,
  quote: PropTypes.string.isRequired,
  height: PropTypes.string,
  compact: PropTypes.bool,
};
