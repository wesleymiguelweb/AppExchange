import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useMarketData } from '../../context/MarketDataContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { ROUTES, SECONDARY_ROUTES } from '../../constants/routes.js';
import { cx } from '../../utils/cx.js';
import CurrencyBadge from '../ui/CurrencyBadge.jsx';
import Icon from '../ui/Icon.jsx';
import Modal from '../ui/Modal.jsx';
import styles from './SearchPalette.module.css';

const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY'];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function SearchPalette() {
  const { t, formatters } = useI18n();
  const { currencies, baseCode, rates } = useMarketData();
  const { searchOpen, closeSearch, navigate, openAsset, openEntry, toggleTheme } = useUI();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [searchOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const groups = useMemo(() => {
    const term = normalize(query);
    const matches = (text) => !term || normalize(text).includes(term);

    const pages = [...ROUTES, ...SECONDARY_ROUTES]
      .filter((route) => matches(`${t(route.labelKey)} ${route.id}`))
      .map((route) => ({
        id: `page-${route.id}`,
        type: 'page',
        icon: route.icon,
        label: t(route.labelKey),
        description: `#/${route.id}`,
        run: () => navigate(route.id),
      }));

    const nameByCode = new Map(currencies.map((currency) => [currency.code, currency.name]));
    const pool = term
      ? currencies
      : POPULAR.map((code) => currencies.find((currency) => currency.code === code)).filter(
          Boolean,
        );

    const assets = pool
      .filter((currency) =>
        matches(
          `${currency.code} ${currency.name} ${formatters.currencyName(
            currency.code,
            nameByCode.get(currency.code),
          )}`,
        ),
      )
      .slice(0, term ? 8 : 6)
      .map((currency) => {
        const rate = rates?.[currency.code];
        return {
          id: `asset-${currency.code}`,
          type: 'asset',
          code: currency.code,
          label: `${currency.code} · ${formatters.currencyName(currency.code, currency.name)}`,
          description: Number.isFinite(rate)
            ? `1 ${baseCode} = ${formatters.formatRate(rate)} ${currency.code}`
            : t('asset.eyebrow'),
          run: () => openAsset(currency.code),
        };
      });

    const actions = [
      {
        id: 'action-add',
        type: 'action',
        icon: 'plus',
        label: t('search.addPosition'),
        description: t('portfolio.eyebrow'),
        run: () => openEntry(null),
      },
      {
        id: 'action-theme',
        type: 'action',
        icon: 'sun',
        label: t('search.toggleTheme'),
        description: t('settings.appearance'),
        run: toggleTheme,
      },
    ].filter((action) => matches(`${action.label} ${action.description}`));

    return [
      { id: 'pages', label: t('search.pages'), items: pages },
      { id: 'assets', label: t('search.currencies'), items: assets },
      { id: 'actions', label: t('search.actions'), items: actions },
    ].filter((group) => group.items.length > 0);
  }, [
    query,
    currencies,
    baseCode,
    rates,
    formatters,
    navigate,
    openAsset,
    openEntry,
    toggleTheme,
    t,
  ]);

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const safeIndex = flat.length === 0 ? -1 : Math.min(activeIndex, flat.length - 1);

  function select(item) {
    if (!item) return;
    closeSearch();
    item.run();
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (flat.length === 0 ? 0 : (Math.min(current, flat.length - 1) + 1) % flat.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        flat.length === 0 ? 0 : (Math.max(current, 0) - 1 + flat.length) % flat.length,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(flat[safeIndex]);
    }
  }

  return (
    <Modal
      open={searchOpen}
      onClose={closeSearch}
      title={t('search.title')}
      subtitle={t('search.hint')}
      size="md"
      initialFocusRef={inputRef}
    >
      <div className={styles.searchBar}>
        <span className={styles.searchIcon} aria-hidden="true">
          <Icon name="search" size={18} />
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          role="combobox"
          aria-expanded="true"
          aria-controls="search-results"
          aria-activedescendant={safeIndex >= 0 ? `search-result-${flat[safeIndex].id}` : undefined}
          autoComplete="off"
          spellCheck="false"
        />
        {query ? (
          <button
            type="button"
            className={styles.clear}
            onClick={() => setQuery('')}
            aria-label={t('common.clearSearch')}
          >
            <Icon name="close" size={15} />
          </button>
        ) : null}
      </div>

      <div id="search-results" className={styles.results} role="listbox">
        {flat.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <Icon name="search" size={22} />
            </span>
            <p className={styles.emptyTitle}>{t('search.empty', { query })}</p>
            <p className={styles.emptyHint}>{t('search.emptyHint')}</p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.id} className={styles.group} aria-label={group.label}>
              <p className={styles.groupLabel}>{group.label}</p>
              <ul className={styles.groupList}>
                {group.items.map((item) => {
                  const index = flat.findIndex((candidate) => candidate.id === item.id);
                  const active = index === safeIndex;

                  return (
                    <li key={item.id}>
                      <button
                        id={`search-result-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={cx(styles.result, active && styles.resultActive)}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => select(item)}
                      >
                        {item.code ? (
                          <CurrencyBadge code={item.code} size="sm" />
                        ) : (
                          <span className={styles.resultIcon} aria-hidden="true">
                            <Icon name={item.icon} size={16} />
                          </span>
                        )}
                        <span className={styles.resultText}>
                          <span className={styles.resultLabel}>{item.label}</span>
                          <span className={styles.resultDescription}>{item.description}</span>
                        </span>
                        <span className={styles.resultType}>
                          {item.type === 'page'
                            ? t('search.pages')
                            : item.type === 'asset'
                              ? t('asset.eyebrow')
                              : t('search.actions')}
                        </span>
                        <Icon name="arrowRight" size={15} className={styles.resultArrow} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <p className={styles.footer}>{t('search.footer')}</p>
    </Modal>
  );
}
