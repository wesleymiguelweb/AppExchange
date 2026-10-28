import { useEffect, useMemo, useRef, useState } from 'react';
import { CurrencyTable, ConverterCard, HistoryCard, InsightCard, RateCard } from './components/DashboardCards.jsx';
import Icon from './components/Icon.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { useCurrencies } from './hooks/useCurrencies.js';
import { useCurrentTime } from './hooks/useCurrentTime.js';
import { useDebounce } from './hooks/useDebounce.js';
import { useActiveSection } from './hooks/useActiveSection.js';
import { useMarketData } from './hooks/useMarketData.js';
import { useLatestRates } from './hooks/useLatestRates.js';
import { useTheme } from './hooks/useTheme.js';
import { exportConversionCsv } from './utils/exportCsv.js';
import { formatBrasiliaTime } from './utils/formatters.js';

const PERIODS = [{ label: '7 dias', days: 7 }, { label: '30 dias', days: 30 }, { label: '90 dias', days: 90 }, { label: '1 ano', days: 365 }];
const NAV_ITEMS = [['Visão geral', '#inicio'], ['Conversor', '#conversor'], ['Histórico', '#historico'], ['Moedas', '#moedas']];
const SECTION_IDS = NAV_ITEMS.map(([, href]) => href.slice(1));

function Brand() {
  return <a className="flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white" href="#inicio" aria-label="Hermes, início"><span className="grid h-8 w-8 place-items-center rounded-[10px] border-2 border-amber-500 text-lg leading-none text-amber-500">↗</span><span>hermes</span></a>;
}

function BrasiliaClock() {
  const currentTime = useCurrentTime();
  return <span className="hidden text-xs tabular-nums text-slate-400 md:inline">Brasília · {formatBrasiliaTime(currentTime)}</span>;
}

export default function App() {
  const currenciesObject = useCurrencies();
  const currencies = useMemo(() => Object.entries(currenciesObject).sort(([a], [b]) => a.localeCompare(b)), [currenciesObject]);
  // O estado do par, valor e período fica no componente pai para os cartões compartilharem as mesmas seleções.
  const [base, setBase] = useState('USD');
  const [quote, setQuote] = useState('BRL');
  const [amount, setAmount] = useState('100');
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [spotlightSection, setSpotlightSection] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const spotlightTimer = useRef(null);
  const debouncedSearch = useDebounce(search);
  const { theme, toggleTheme } = useTheme();
  const activeSection = useActiveSection(SECTION_IDS);
  const market = useMarketData(base, quote, days);
  const latestRates = useLatestRates(base);
  const validAmount = amount.trim() !== '' && Number.isFinite(Number(amount)) && Number(amount) >= 0;
  const converted = Number(amount) * (market.rate ?? 0);
  const filteredCurrencies = useMemo(() => currencies.filter(([code, name]) => `${code} ${name}`.toLowerCase().includes(debouncedSearch.toLowerCase())), [currencies, debouncedSearch]);
  const menuDetails = {
    inicio: { title: 'Visão geral', description: 'Resumo do par de moedas selecionado e do mercado.', detail: market.date ? `Cotação de ${market.date}` : 'Carregando a cotação de referência.', action: 'Ver painel' },
    conversor: { title: 'Conversor de moedas', description: 'Ajuste o valor, selecione as moedas ou inverta o par.', detail: `${amount || '0'} ${base} → ${market.rate === null ? 'aguardando cotação' : `${converted.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${quote}`}`, action: 'Abrir conversor' },
    historico: { title: 'Histórico da cotação', description: 'Explore a série diária e as métricas do período.', detail: `${days} dias · ${market.stats ? `${market.stats.change >= 0 ? '+' : ''}${market.stats.change.toFixed(2)}%` : 'dados carregando'}`, action: 'Ver gráfico' },
    moedas: { title: 'Lista de moedas', description: 'Pesquise, ordene e escolha uma moeda de destino.', detail: `${filteredCurrencies.length} moedas encontradas · base ${base}`, action: 'Ver moedas' },
  };
  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(''), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  useEffect(() => () => window.clearTimeout(spotlightTimer.current), []);
  useEffect(() => {
    if (!openMenu) return undefined;
    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) setOpenMenu(null);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpenMenu(null);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenu]);

  function handleNavigation(href) {
    setSpotlightSection(href.slice(1));
    window.clearTimeout(spotlightTimer.current);
    spotlightTimer.current = window.setTimeout(() => setSpotlightSection(''), 1800);
  }

  function handleExport() {
    if (market.rate === null || !validAmount) {
      setFeedback('Informe um valor igual ou maior que zero para exportar.');
      return;
    }
    exportConversionCsv({ date: market.date, base, quote, rate: market.rate, amount: Number(amount), converted });
    setFeedback('Arquivo CSV exportado com sucesso.');
  }

  return <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-7 lg:px-10">
    <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[30px] border border-white/80 bg-slate-50/95 p-4 shadow-[0_18px_70px_rgba(22,32,55,.08)] sm:p-6 lg:p-8 dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-black/30">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <Brand />
        <nav ref={menuRef} className="relative order-3 flex w-full flex-wrap items-center gap-1 sm:order-none sm:w-auto" aria-label="Navegação principal">
          {NAV_ITEMS.map(([label, href]) => {
            const sectionId = href.slice(1);
            const selected = activeSection === sectionId;
            const expanded = openMenu === sectionId;
            return <button key={href} type="button" onClick={() => setOpenMenu((current) => current === sectionId ? null : sectionId)} aria-current={selected ? 'location' : undefined} aria-haspopup="dialog" aria-expanded={expanded} aria-controls={expanded ? 'nav-menu-popover' : undefined} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition ${selected || expanded ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}>{label}</button>;
          })}
          {openMenu && <div id="nav-menu-popover" role="dialog" aria-label={menuDetails[openMenu].title} className="absolute left-0 top-full z-50 mt-3 w-[min(20rem,calc(100vw-3rem))] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_18px_50px_rgba(15,23,42,.18)] ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-indigo-500 dark:text-indigo-300">Acesso rápido</p><h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{menuDetails[openMenu].title}</h2></div><button type="button" onClick={() => setOpenMenu(null)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-lg leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Fechar menu">×</button></div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{menuDetails[openMenu].description}</p>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{menuDetails[openMenu].detail}</p>
            <a href={`#${openMenu}`} onClick={() => { handleNavigation(`#${openMenu}`); setOpenMenu(null); }} className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">{menuDetails[openMenu].action}</a>
          </div>}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:ml-0"><BrasiliaClock /><ThemeToggle theme={theme} onToggle={toggleTheme} /></div>
      </header>

      <section className={`flex flex-wrap items-end justify-between gap-4 rounded-2xl py-7 transition sm:py-9 ${spotlightSection === 'inicio' ? 'menu-spotlight px-3' : ''}`} id="inicio">
        <div><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />Mercado de câmbio · Frankfurter</p><h1 className="mt-2 text-3xl font-medium tracking-[-.045em] text-slate-950 sm:text-4xl dark:text-white">Visão geral</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Converta moedas e acompanhe a variação histórica.</p></div>
        <button type="button" onClick={handleExport} disabled={market.loading || market.rate === null} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 disabled:translate-y-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"><Icon name="download" size={16} /> Exportar CSV</button>
      </section>

      <section className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 sm:px-4 dark:border-slate-800 dark:bg-slate-900/60" aria-label="Filtros do histórico">
        <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-medium text-slate-500 dark:text-slate-400">Período</span><div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="group" aria-label="Período histórico">{PERIODS.map((period) => <button key={period.days} type="button" aria-pressed={days === period.days} onClick={() => setDays(period.days)} className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${days === period.days ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>{period.label}</button>)}</div></div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400"><span>{market.date ? `Cotação de ${market.date}` : 'Aguardando cotação'}</span><span className="hidden h-4 border-l border-slate-200 sm:block dark:border-slate-700" /><button type="button" onClick={market.refresh} disabled={market.loading} className="inline-flex items-center gap-1.5 font-medium text-indigo-600 transition hover:text-indigo-800 disabled:opacity-50 dark:text-indigo-300 dark:hover:text-indigo-200"><Icon name="refresh" size={14} /><span>{market.loading ? 'Atualizando…' : `Atualizar · ${formatBrasiliaTime(market.checkedAt || new Date())}`}</span></button></div>
      </section>

      {market.error && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/50 dark:text-rose-300" role="alert"><span>{market.error}</span><button type="button" onClick={market.refresh} className="font-semibold underline underline-offset-2">Tentar novamente</button></div>}
      {feedback && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300" role="status">{feedback}</p>}

      <section className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-12" aria-label="Painel de câmbio">
        {/* Props levam estado e callbacks aos campos controlados do conversor; o card não mantém cópias locais. */}
        <ConverterCard highlighted={spotlightSection === 'conversor'} amount={amount} onAmountChange={setAmount} base={base} quote={quote} currencies={currencies} onBaseChange={setBase} onQuoteChange={setQuote} onSwap={() => { setBase(quote); setQuote(base); }} rate={market.rate} date={market.date} converted={converted} loading={market.loading} amountValid={validAmount} />
        <RateCard points={market.history} base={base} quote={quote} rate={market.rate} change={market.stats?.change ?? null} days={days} loading={market.loading} />
        <HistoryCard highlighted={spotlightSection === 'historico'} points={market.history} base={base} quote={quote} days={days} stats={market.stats} loading={market.loading} />
        <CurrencyTable highlighted={spotlightSection === 'moedas'} currencies={filteredCurrencies} selectedQuote={quote} base={base} rates={latestRates.rates} search={search} onSearch={setSearch} onSelect={setQuote} />
        <InsightCard stats={market.stats} base={base} quote={quote} days={days} />
      </section>

      <footer className="mt-6 flex flex-col gap-1 border-t border-slate-200/80 pt-4 text-[10px] leading-relaxed text-slate-400 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-500"><span>Frankfurter API · taxas de referência diárias, não cotações intradiárias.</span><span>Atualização automática a cada minuto · Horário de Brasília.</span></footer>
    </div>
  </main>;
}
