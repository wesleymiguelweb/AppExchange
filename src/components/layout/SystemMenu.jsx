import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useMarketData } from '../../context/MarketDataContext.jsx';
import { useInspector } from '../../context/InspectorContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { FONT_OPTIONS } from '../../constants/fonts.js';
import { cx } from '../../utils/cx.js';
import Icon from '../ui/Icon.jsx';

/**
 * Menu do sistema: tema, tipografia, inspetor e atalhos de navegação.
 * Pensado para uso rápido no topbar, sem substituir a página de Ajustes.
 */
export default function SystemMenu() {
  const { t } = useI18n();
  const { baseCode } = useMarketData();
  const { enabled, toggle, openFinder } = useInspector();
  const { theme, setTheme, font, setFont, navigate } = useUI();

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

  function go(routeId) {
    setOpen(false);
    navigate(routeId);
  }

  return (
    <div ref={wrapperRef} className="relative max-md:static">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('topbar.profile')}
        title={t('systemMenu.title')}
        data-inspector-ui
        className={cx(
          'grid size-9 place-items-center rounded-full bg-[linear-gradient(140deg,var(--brand-strong),var(--brand))] text-[11.5px] font-bold tracking-[0.02em] text-white shadow-[0_0_0_2px_var(--bg),0_0_0_3px_var(--line-strong)] transition-transform hover:scale-105',
          open && 'ring-2 ring-brand ring-offset-2 ring-offset-[var(--bg)]',
        )}
      >
        HM
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t('systemMenu.title')}
          className="glass-strong glass-sheet liquid-border menu-pop absolute right-0 top-[calc(100%+12px)] z-[70] w-[min(92vw,344px)] overflow-hidden rounded-[20px] p-4 shadow-float max-md:right-4"
        >
          <div className="flex items-center gap-3 border-b border-line pb-3">
            <span className="grid size-10 place-items-center rounded-full bg-[linear-gradient(140deg,var(--brand-strong),var(--brand))] text-[13px] font-bold text-white">
              HM
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink">Hermes</p>
              <p className="text-[10.5px] text-faint">
                {t('systemMenu.subtitle')} · {baseCode}
              </p>
            </div>
            <span className="rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-[9px] font-semibold text-success">
              RIA
            </span>
          </div>

          <div className="mt-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
              {t('systemMenu.appearance')}
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {[
                { id: 'dark', label: t('settings.dark'), icon: 'moon' },
                { id: 'light', label: t('settings.light'), icon: 'sun' },
              ].map((option) => {
                const active = theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTheme(option.id)}
                    className={cx(
                      'flex h-9 items-center justify-center gap-1.5 rounded-lg border text-[11px] font-semibold transition-colors',
                      active
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-line bg-panel-2 text-muted hover:border-line-strong hover:text-ink',
                    )}
                  >
                    <Icon name={option.icon} size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
              {t('systemMenu.typography')}
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {FONT_OPTIONS.map((option) => {
                const active = font === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFont(option.id)}
                    style={{ fontFamily: `'${option.label}', var(--font-sans)` }}
                    className={cx(
                      'flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition-colors',
                      active
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-line bg-panel-2 text-muted hover:border-line-strong hover:text-ink',
                    )}
                  >
                    <span className="text-[15px] font-semibold leading-none">Aa</span>
                    <span className="w-full truncate text-center text-[8.5px] font-medium">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink">{t('systemMenu.inspector')}</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openFinder();
                }}
                className="text-[10px] font-medium text-brand hover:underline"
              >
                {t('systemMenu.finder')}
              </button>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={t('systemMenu.inspector')}
              onClick={toggle}
              className={cx(
                'relative h-[23px] w-10 shrink-0 rounded-full border transition-colors',
                enabled ? 'border-brand bg-brand' : 'border-line-strong bg-panel-3',
              )}
            >
              <span
                className={cx(
                  'absolute left-[3px] top-[3px] size-[15px] rounded-full transition-transform',
                  enabled
                    ? 'translate-x-[17px] bg-brand-contrast'
                    : 'bg-ink shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
                )}
              />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => go('settings')}
              className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel-2 text-[10.5px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <Icon name="settings" size={13} />
              {t('systemMenu.settings')}
            </button>
            <button
              type="button"
              onClick={() => go('support')}
              className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel-2 text-[10.5px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <Icon name="help" size={13} />
              {t('systemMenu.support')}
            </button>
          </div>

          <p className="mt-3 text-center text-[9px] tracking-[0.06em] text-faint">
            {t('systemMenu.version')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
