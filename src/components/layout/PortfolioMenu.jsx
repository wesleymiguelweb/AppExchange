import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useMarketData } from '../../context/MarketDataContext.jsx';
import { usePortfolio } from '../../context/PortfolioContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { currencyColor } from '../ui/CurrencyBadge.jsx';
import ChangeBadge from '../ui/ChangeBadge.jsx';
import CurrencyBadge from '../ui/CurrencyBadge.jsx';
import Icon from '../ui/Icon.jsx';

/**
 * Menu inteligente da carteira no topbar. Resume o patrimônio, mostra a
 * alocação real e sugere a próxima ação com base na concentração atual.
 * É um popover — não bloqueia a página, fecha com Esc e clique fora.
 */
export default function PortfolioMenu() {
  const { t, formatters } = useI18n();
  const { baseCode } = useMarketData();
  const { rows, totalValue, totalPnl, pnlPercent, positionsCount, isReady } = usePortfolio();
  const { navigate, openAsset, openPosition, openTrade } = useUI();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const { segments, topRows, insight } = useMemo(() => {
    const sorted = [...rows]
      .filter((row) => Number.isFinite(row.value) && row.value > 0)
      .sort((a, b) => b.value - a.value);

    const top = sorted.slice(0, 3);
    const first = sorted[0];
    const concentration = first ? first.share * 100 : 0;

    let hint = t('walletMenu.empty');
    if (first) {
      hint =
        concentration >= 45
          ? t('walletMenu.concentration', {
              code: first.code,
              value: formatters.formatPercent(concentration),
            })
          : t('walletMenu.balanced', { count: sorted.length });
    }

    return {
      topRows: top,
      insight: hint,
      segments: sorted.slice(0, 5).map((row) => ({
        code: row.code,
        width: Math.max(row.share * 100, 2),
        color: currencyColor(row.code),
      })),
    };
  }, [rows, t, formatters]);

  function run(action) {
    setOpen(false);
    action();
  }

  return (
    <div ref={wrapperRef} className="relative max-md:static">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('walletMenu.title')}
        title={t('walletMenu.title')}
        data-inspector-ui
        className="group flex h-[38px] items-center gap-2 rounded-[10px] border border-line bg-transparent px-2.5 text-muted transition-colors duration-150 hover:bg-[var(--hover-bg)] hover:text-ink"
      >
        <span className="grid size-[22px] place-items-center rounded-md bg-brand-soft text-brand">
          <Icon name="wallet" size={14} />
        </span>
        <span className="hidden text-[11.5px] font-semibold tabular-nums sm:inline">
          {isReady ? formatters.formatMoneyCompact(totalValue, baseCode) : '—'}
        </span>
        <Icon
          name="chevronDown"
          size={13}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t('walletMenu.title')}
          className="glass-strong glass-sheet liquid-border menu-pop absolute right-0 top-[calc(100%+12px)] z-[70] w-[min(92vw,378px)] overflow-hidden rounded-[20px] p-4 shadow-float max-md:right-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-faint">
                {t('walletMenu.title')}
              </p>
              <p className="mt-0.5 text-[11px] text-faint">{t('walletMenu.subtitle')}</p>
            </div>
            <span className="rounded-full border border-line bg-panel-2 px-2 py-0.5 text-[9.5px] font-bold tracking-[0.06em] text-muted-strong">
              {baseCode}
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-[27px] font-semibold leading-none tracking-[-0.05em] text-ink tabular-nums">
              {isReady ? formatters.formatMoney(totalValue, baseCode) : '—'}
            </p>
            <ChangeBadge value={Number.isFinite(totalPnl) ? pnlPercent : undefined} size="sm" />
          </div>

          <p className="mt-1 text-[10.5px] text-faint">
            {isReady
              ? `${formatters.formatMoney(totalPnl, baseCode)} · ${t('portfolio.positions')}: ${positionsCount}`
              : t('common.loading')}
          </p>

          <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-panel-3">
            {segments.map((segment) => (
              <span
                key={segment.code}
                title={segment.code}
                style={{ width: `${segment.width}%`, background: segment.color }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>

          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-line bg-panel-2 px-2.5 py-2 text-[10.5px] leading-relaxed text-muted">
            <Icon name="sparkles" size={13} className="mt-px shrink-0 text-brand" />
            {insight}
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
                {t('walletMenu.top')}
              </p>
              <button
                type="button"
                onClick={() => run(() => navigate('portfolio'))}
                className="text-[10px] font-semibold text-brand hover:underline"
              >
                {t('walletMenu.viewAll')}
              </button>
            </div>

            {topRows.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] text-faint">
                {t('dashboard.positions.empty')}
              </p>
            ) : (
              <ul className="mt-1.5 space-y-0.5">
                {topRows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => run(() => openAsset(row.code))}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-[var(--hover-bg)]"
                    >
                      <CurrencyBadge code={row.code} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-semibold text-ink">{row.code}</span>
                        <span className="block text-[10px] text-faint tabular-nums">
                          {formatters.formatQuantity(row.quantity)}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-0.5">
                        <span className="text-[11.5px] font-semibold text-ink tabular-nums">
                          {formatters.formatMoney(row.value, baseCode)}
                        </span>
                        <ChangeBadge value={row.pnlPercent ?? undefined} size="sm" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => run(() => openPosition(null))}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand text-[11.5px] font-semibold text-brand-contrast transition-transform hover:-translate-y-px"
            >
              <Icon name="plus" size={14} />
              {t('portfolio.add')}
            </button>
            <button
              type="button"
              onClick={() => run(() => openTrade(baseCode, baseCode === 'USD' ? 'EUR' : 'USD'))}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel-2 text-[11.5px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <Icon name="swap" size={14} />
              {t('trade.title')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
