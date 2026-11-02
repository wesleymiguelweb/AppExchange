import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import { usePortfolio } from '../../context/PortfolioContext.jsx';
import { useMarketData } from '../../context/MarketDataContext.jsx';
import { useInspector } from '../../context/InspectorContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { findRoute, routeHash, ROUTES, SECONDARY_ROUTES } from '../../constants/routes.js';
import { cx } from '../../utils/cx.js';
import Button from '../ui/Button.jsx';
import ChangeBadge from '../ui/ChangeBadge.jsx';
import Icon from '../ui/Icon.jsx';
import LiquidBackground from '../ui/LiquidBackground.jsx';
import PortfolioMenu from './PortfolioMenu.jsx';
import SystemMenu from './SystemMenu.jsx';
import styles from './AppShell.module.css';

function Brand() {
  const { t } = useI18n();

  return (
    <a className={styles.brand} href={routeHash('dashboard')} data-view-id="app.brand">
      <span className={styles.brandMark} aria-hidden="true">
        H
      </span>
      <span className={styles.brandText}>
        <span className={styles.brandName}>{t('app.name')}</span>
        <span className={styles.brandKicker}>Wealth</span>
      </span>
    </a>
  );
}

function NavLink({ route, active, onNavigate }) {
  const { t } = useI18n();
  const { positionsCount } = usePortfolio();
  const showBadge = route.id === 'portfolio' && positionsCount > 0;

  return (
    <a
      href={routeHash(route.id)}
      className={cx(styles.navLink, active && styles.navLinkActive)}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      data-view-id={`app.nav.${route.id}`}
      data-view-name={t(route.labelKey)}
    >
      <span className={styles.navIcon} aria-hidden="true">
        <Icon name={route.icon} size={18} />
      </span>
      <span className={styles.navLabel}>{t(route.labelKey)}</span>
      {showBadge ? <span className={styles.navCount}>{positionsCount}</span> : null}
    </a>
  );
}

NavLink.propTypes = {
  route: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    labelKey: PropTypes.string.isRequired,
  }).isRequired,
  active: PropTypes.bool.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

function Sidebar({ routeId, onNavigate }) {
  const { t, formatters } = useI18n();
  const { totalValue, totalPnl, pnlPercent, isReady } = usePortfolio();
  const { baseCode } = useMarketData();
  const { openPosition } = useUI();

  return (
    <aside className={styles.sidebar} data-view-id="app.sidebar" data-view-name="Sidebar">
      <div className={styles.sidebarTop}>
        <Brand />

        <nav className={styles.nav} aria-label={t('nav.menu')}>
          <p className={styles.navGroup}>{t('nav.groupMain')}</p>
          {ROUTES.map((item) => (
            <NavLink
              key={item.id}
              route={item}
              active={routeId === item.id}
              onNavigate={onNavigate}
            />
          ))}

          <p className={styles.navGroup}>{t('nav.groupOther')}</p>
          {SECONDARY_ROUTES.map((item) => (
            <NavLink
              key={item.id}
              route={item}
              active={routeId === item.id}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>

      <div className={styles.sidebarBottom}>
        <section className={styles.wallet} data-view-id="app.sidebar.wallet">
          <div className={styles.walletHead}>
            <span className={styles.walletLabel}>{t('dashboard.balance')}</span>
            <span className={styles.walletBase}>{baseCode}</span>
          </div>
          <p className={styles.walletValue}>
            {isReady ? formatters.formatMoney(totalValue, baseCode) : '—'}
          </p>
          <div className={styles.walletMeta}>
            <ChangeBadge value={Number.isFinite(totalPnl) ? pnlPercent : undefined} size="sm" />
            <span className={styles.walletPnl}>
              {isReady ? formatters.formatMoney(totalPnl, baseCode) : '—'}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon="plus"
            fullWidth
            className={styles.walletAction}
            onClick={() => openPosition(null)}
          >
            {t('dashboard.addPosition')}
          </Button>
        </section>

        <div className={styles.sidebarFooter}>
          <span className={styles.version}>HERMES · v2.0</span>
          <span>{t('markets.source')}</span>
        </div>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  routeId: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

function Topbar({ routeId, theme, onToggleTheme, onOpenMenu }) {
  const { t } = useI18n();
  const { baseCode } = useMarketData();
  const { enabled, toggle } = useInspector();
  const { openSearch, navigate } = useUI();
  const current = findRoute(routeId);

  return (
    <header className={styles.topbar} data-view-id="app.topbar" data-view-name="Topbar">
      <div className={styles.topbarLeft}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onOpenMenu}
          aria-label={t('topbar.openMenu')}
          data-inspector-ui
        >
          <Icon name="menu" size={19} />
        </button>

        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <a href={routeHash('dashboard')} className={styles.crumbHome}>
            {t('topbar.home')}
          </a>
          {routeId !== 'dashboard' ? (
            <>
              <span className={styles.crumbSep} aria-hidden="true">
                <Icon name="chevronRight" size={13} />
              </span>
              <span className={styles.crumbCurrent} aria-current="page">
                {t(current.labelKey)}
              </span>
            </>
          ) : null}
        </nav>
      </div>

      <div className={styles.topbarRight}>
        <button type="button" className={styles.searchButton} onClick={openSearch}>
          <Icon name="search" size={16} />
          <span className={styles.searchLabel}>{t('topbar.search')}</span>
          <kbd className={styles.kbd}>Ctrl K</kbd>
        </button>

        <PortfolioMenu />

        <button
          type="button"
          className={cx(styles.baseChip, styles.desktopOnly)}
          onClick={() => navigate('settings')}
          title={t('settings.base')}
        >
          <Icon name="globe" size={15} />
          <span>{baseCode}</span>
        </button>

        <button
          type="button"
          className={cx(styles.iconButton, enabled && styles.iconButtonActive)}
          onClick={toggle}
          aria-pressed={enabled}
          aria-label={enabled ? t('topbar.inspectorOn') : t('topbar.inspectorOff')}
          title={t('inspector.toggle')}
          data-inspector-ui
        >
          <Icon name="inspect" size={18} />
        </button>

        <button
          type="button"
          className={styles.iconButton}
          onClick={onToggleTheme}
          aria-label={t('topbar.theme')}
          title={t('topbar.theme')}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>

        <SystemMenu />
      </div>
    </header>
  );
}

Topbar.propTypes = {
  routeId: PropTypes.string.isRequired,
  theme: PropTypes.oneOf(['dark', 'light']).isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  onOpenMenu: PropTypes.func.isRequired,
};

export default function AppShell({ routeId, theme, onToggleTheme, children }) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [routeId]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const handleKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.shell}>
      <LiquidBackground />

      <a className={styles.skipLink} href="#conteudo">
        {t('common.skipToContent')}
      </a>

      <div className={cx(styles.drawer, menuOpen && styles.drawerOpen)}>
        <Sidebar routeId={routeId} onNavigate={closeMenu} />
      </div>

      {menuOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          onClick={closeMenu}
          aria-label={t('topbar.closeMenu')}
          data-inspector-ui
        />
      ) : null}

      <div className={styles.body}>
        <Topbar
          routeId={routeId}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main id="conteudo" className={styles.main} tabIndex={-1} data-view-id="app.content">
          {children}

          <footer className={styles.footer}>
            <p>
              {t('footer.source')} ·{' '}
              <a
                className={styles.footerLink}
                href="https://frankfurter.dev"
                target="_blank"
                rel="noreferrer"
              >
                frankfurter.dev
              </a>
            </p>
            <p>{t('footer.disclaimer')}</p>
            <p>{t('footer.builtWith')}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

AppShell.propTypes = {
  routeId: PropTypes.string.isRequired,
  theme: PropTypes.oneOf(['dark', 'light']).isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
