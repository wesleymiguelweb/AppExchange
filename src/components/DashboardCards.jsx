import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from './Icon.jsx';
import CurrencyChart from './CurrencyChart.jsx';
import { formatDate, formatMoney, formatNumber } from '../utils/formatters.js';

export const cardClass = 'rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(26,35,58,0.035)] transition duration-200 hover:border-slate-300 hover:shadow-[0_12px_32px_rgba(26,35,58,0.07)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/10 dark:hover:border-slate-700';
const eyebrowClass = 'text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400 dark:text-slate-500';
const headingClass = 'mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100';
const inputClass = 'h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:bg-slate-950';

function CardHeading({ eyebrow, title, trailing }) {
  return <div className="flex items-start justify-between gap-3"><div><p className={eyebrowClass}>{eyebrow}</p><h2 className={headingClass}>{title}</h2></div>{trailing}</div>;
}
CardHeading.propTypes = { eyebrow: PropTypes.string.isRequired, title: PropTypes.string.isRequired, trailing: PropTypes.node };

export function ConverterCard({ amount, onAmountChange, base, quote, currencies, onBaseChange, onQuoteChange, onSwap, rate, date, converted, loading, amountValid, highlighted = false }) {
  return <article className={`${cardClass} scroll-mt-6 lg:col-span-7 ${highlighted ? 'menu-spotlight' : ''}`} id="conversor">
    <CardHeading eyebrow="Conversão" title="Conversor de moedas" trailing={<span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">Taxa diária</span>} />
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-end gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_44px_minmax(0,1fr)]">
      <label className="col-span-3 grid gap-2 sm:col-span-1"><span className="text-xs font-medium text-slate-500 dark:text-slate-400">Valor para converter</span><span className="relative"><input className={`${inputClass} pr-14 text-lg font-semibold tabular-nums`} type="number" min="0" step="any" value={amount} onChange={(event) => onAmountChange(event.target.value)} aria-label="Valor para conversão" aria-invalid={!amountValid} /><span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-semibold text-slate-400">{base}</span></span></label>
      <label className="grid min-w-0 gap-2"><span className="text-xs font-medium text-slate-500 dark:text-slate-400">De</span><select className={inputClass} value={base} onChange={(event) => onBaseChange(event.target.value)} aria-label="Moeda de origem">{currencies.map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}</select></label>
      <button type="button" onClick={onSwap} className="mb-1 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:rotate-180 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-400/10" aria-label="Inverter moedas"><Icon name="swap" size={17} /></button>
      <label className="grid min-w-0 gap-2"><span className="text-xs font-medium text-slate-500 dark:text-slate-400">Para</span><select className={inputClass} value={quote} onChange={(event) => onQuoteChange(event.target.value)} aria-label="Moeda de destino">{currencies.map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}</select></label>
    </div>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
      <div><p className="text-xs text-slate-500 dark:text-slate-400">Valor convertido</p><p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{loading && rate === null ? 'Calculando…' : amountValid && rate !== null ? formatMoney(converted, quote) : '—'}</p></div>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">1 {base} = {rate === null ? '—' : `${formatNumber.format(rate)} ${quote}`}</span>
    </div>
    <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">{date ? `Referência de ${formatDate(date)}. Cotações publicadas em dias úteis.` : 'Aguardando cotação disponível.'}</p>
    {!amountValid && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">Informe um valor numérico igual ou maior que zero.</p>}
  </article>;
}
const nullableNumber = PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]);
ConverterCard.propTypes = { amount: PropTypes.string.isRequired, onAmountChange: PropTypes.func.isRequired, base: PropTypes.string.isRequired, quote: PropTypes.string.isRequired, currencies: PropTypes.arrayOf(PropTypes.array).isRequired, onBaseChange: PropTypes.func.isRequired, onQuoteChange: PropTypes.func.isRequired, onSwap: PropTypes.func.isRequired, rate: nullableNumber, date: PropTypes.string.isRequired, converted: PropTypes.number.isRequired, loading: PropTypes.bool.isRequired, amountValid: PropTypes.bool.isRequired, highlighted: PropTypes.bool };

export function RateCard({ points, base, quote, rate, change, days, loading }) {
  const positive = (change ?? 0) >= 0;
  return <article className={`${cardClass} lg:col-span-5`}>
    <CardHeading eyebrow="Paridade atual" title={`${base} / ${quote}`} trailing={<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300'}`}>{change === null ? '—' : `${positive ? '+' : ''}${change.toFixed(2)}%`}</span>} />
    <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{rate === null ? '—' : formatNumber.format(rate)}<span className="ml-2 text-sm font-medium text-slate-400">{quote}</span></p>
    <div className="mt-2 h-28">{loading && !points.length ? <div className="grid h-full place-items-center text-xs text-slate-400">Carregando série…</div> : <CurrencyChart points={points} base={base} quote={quote} height="h-28" compact />}</div>
    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"><span>Variação em {days} dias</span><span className="font-medium">Série diária</span></div>
  </article>;
}
RateCard.propTypes = { points: PropTypes.array.isRequired, base: PropTypes.string.isRequired, quote: PropTypes.string.isRequired, rate: nullableNumber, change: nullableNumber, days: PropTypes.number.isRequired, loading: PropTypes.bool.isRequired };

export function HistoryCard({ points, base, quote, days, stats, loading, highlighted = false }) {
  return <article className={`${cardClass} scroll-mt-6 lg:col-span-7 ${highlighted ? 'menu-spotlight' : ''}`} id="historico">
    <CardHeading eyebrow="Análise histórica" title="Evolução da cotação" trailing={<span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{days} dias</span>} />
    <div className="mt-6 h-52 rounded-2xl bg-gradient-to-b from-indigo-50/70 to-transparent px-1 pt-2 dark:from-indigo-400/[.06]">{loading && !points.length ? <div className="grid h-48 place-items-center text-sm text-slate-400">Buscando cotações históricas…</div> : <CurrencyChart points={points} base={base} quote={quote} height="h-48" />}</div>
    <div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>{points[0] ? formatDate(points[0].date) : 'Início do período'}</span><span>{points.at(-1) ? formatDate(points.at(-1).date) : 'Data mais recente'}</span></div>
    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4 dark:border-slate-800">{[
      ['Mínima', stats ? formatNumber.format(stats.low) : '—'], ['Média', stats ? formatNumber.format(stats.average) : '—'], ['Máxima', stats ? formatNumber.format(stats.high) : '—'], ['Variação', stats ? `${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)}%` : '—'],
    ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70"><p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{value}</p></div>)}</div>
    <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500">Use o cursor ou as setas do teclado no gráfico para consultar cada data.</p>
  </article>;
}
HistoryCard.propTypes = { points: PropTypes.array.isRequired, base: PropTypes.string.isRequired, quote: PropTypes.string.isRequired, days: PropTypes.number.isRequired, stats: PropTypes.shape({ low: PropTypes.number, high: PropTypes.number, average: PropTypes.number, change: PropTypes.number }), loading: PropTypes.bool.isRequired, highlighted: PropTypes.bool };

const CURRENCY_PAGE_SIZE = 8;

export function CurrencyTable({ currencies, selectedQuote, base, rates, search, onSearch, onSelect, highlighted = false }) {
  const [sortBy, setSortBy] = useState('code');
  const [page, setPage] = useState(1);
  // Filtra primeiro no hook pai; esta cópia é ordenada sem mutar os dados recebidos por props.
  const sortedCurrencies = useMemo(() => [...currencies].sort(([codeA, nameA], [codeB, nameB]) => {
    if (sortBy === 'name') return nameA.localeCompare(nameB, 'pt-BR');
    if (sortBy === 'rate-asc') return (rates[codeA] ?? Number.POSITIVE_INFINITY) - (rates[codeB] ?? Number.POSITIVE_INFINITY);
    if (sortBy === 'rate-desc') return (rates[codeB] ?? Number.NEGATIVE_INFINITY) - (rates[codeA] ?? Number.NEGATIVE_INFINITY);
    return codeA.localeCompare(codeB);
  }), [currencies, rates, sortBy]);
  const pageCount = Math.max(1, Math.ceil(sortedCurrencies.length / CURRENCY_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageWindowStart = Math.max(1, Math.min(currentPage - 1, pageCount - 2));
  const visiblePages = Array.from({ length: Math.min(3, pageCount) }, (_, index) => pageWindowStart + index);
  const pageCurrencies = sortedCurrencies.slice((currentPage - 1) * CURRENCY_PAGE_SIZE, currentPage * CURRENCY_PAGE_SIZE);
  const firstItem = sortedCurrencies.length ? (currentPage - 1) * CURRENCY_PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(currentPage * CURRENCY_PAGE_SIZE, sortedCurrencies.length);

  useEffect(() => setPage(1), [currencies, sortBy]);

  return <article className={`${cardClass} scroll-mt-6 lg:col-span-5 lg:row-span-2 ${highlighted ? 'menu-spotlight' : ''}`} id="moedas">
    <CardHeading eyebrow="Mercado global" title="Moedas disponíveis" trailing={<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">{sortedCurrencies.length}</span>} />
    <label className="mt-5 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"><Icon name="search" size={16} /><input className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100" type="search" placeholder="Buscar por código ou nome" value={search} onChange={(event) => onSearch(event.target.value)} aria-label="Buscar moedas" /></label>
    <label className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500 dark:text-slate-400">Ordenar por</span><select className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Ordenar moedas"><option value="code">Código</option><option value="name">Nome</option><option value="rate-asc">Cotação crescente</option><option value="rate-desc">Cotação decrescente</option></select></label>
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-slate-100 px-1 pb-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800"><span>Moeda</span><span>1 {base} vale</span><span>Usar</span></div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">{pageCurrencies.map(([code, name]) => <div key={code} className={`grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-1 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${code === selectedQuote ? 'bg-indigo-50/60 dark:bg-indigo-400/[.06]' : ''}`}><span className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">{code.slice(0, 1)}</span><span className="min-w-0"><strong className="block text-xs text-slate-800 dark:text-slate-100">{code}</strong><small className="block truncate text-[10px] text-slate-400">{name}</small></span></span><span className="text-right text-[10px] tabular-nums text-slate-500 dark:text-slate-400">{rates[code] !== undefined ? formatNumber.format(rates[code]) : '—'}</span><button type="button" onClick={() => onSelect(code)} disabled={code === base} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300" aria-label={`Usar ${code} como moeda de destino`}>Usar</button></div>)}{!sortedCurrencies.length && <p className="py-8 text-center text-sm text-slate-400">Nenhuma moeda encontrada.</p>}</div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800"><span className="text-[10px] tabular-nums text-slate-400">{firstItem}–{lastItem} de {sortedCurrencies.length}</span><nav className="flex items-center gap-1" aria-label="Paginação das moedas"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-medium text-slate-600 transition hover:border-indigo-300 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300" aria-label="Página anterior">‹</button>{visiblePages.map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-label={`Ir para a página ${pageNumber}`} aria-current={pageNumber === currentPage ? 'page' : undefined} className={`h-7 min-w-7 rounded-lg border px-1.5 text-[10px] font-semibold tabular-nums transition ${pageNumber === currentPage ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 dark:border-indigo-400 dark:bg-indigo-500 dark:text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-400/10'}`}>{pageNumber}</button>)}<button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage >= pageCount} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-medium text-slate-600 transition hover:border-indigo-300 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300" aria-label="Próxima página">›</button></nav></div>
  </article>;
}
CurrencyTable.propTypes = { currencies: PropTypes.arrayOf(PropTypes.array).isRequired, selectedQuote: PropTypes.string.isRequired, base: PropTypes.string.isRequired, rates: PropTypes.objectOf(PropTypes.number).isRequired, search: PropTypes.string.isRequired, onSearch: PropTypes.func.isRequired, onSelect: PropTypes.func.isRequired, highlighted: PropTypes.bool };

export function InsightCard({ stats, base, quote, days }) {
  const change = stats?.change ?? 0;
  const positive = change >= 0;
  return <article className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white shadow-lg shadow-blue-950/10 lg:col-span-7 dark:from-indigo-700 dark:via-blue-800 dark:to-slate-800">
    <div className="absolute -right-10 -top-24 -z-10 h-64 w-64 rounded-full border border-white/20 shadow-[0_0_0_20px_rgba(255,255,255,.04),0_0_0_44px_rgba(255,255,255,.03)]" />
    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-blue-100">Resumo do período</p>
    <p className="mt-4 text-sm text-blue-50">{stats ? `${base}/${quote} no período de ${days} dias` : 'Aguardando dados históricos'}</p>
    <div className="mt-1 flex flex-wrap items-end justify-between gap-4"><strong className="text-4xl font-semibold tracking-tight">{stats ? `${positive ? '+' : ''}${change.toFixed(2)}%` : '—'}</strong><span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs">{positive ? 'Tendência de alta' : 'Tendência de baixa'}</span></div>
    <p className="mt-3 max-w-xl text-xs leading-relaxed text-blue-100">Variação observada entre o primeiro e o último registro disponível. Os dados representam cotações diárias.</p>
  </article>;
}
InsightCard.propTypes = { stats: PropTypes.shape({ change: PropTypes.number }), base: PropTypes.string.isRequired, quote: PropTypes.string.isRequired, days: PropTypes.number.isRequired };
