import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from './i18n/useI18n.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useTheme } from './hooks/useTheme.js';
import { useFont } from './hooks/useFont.js';
import { findRoute } from './constants/routes.js';
import { MarketDataProvider, useMarketData } from './context/MarketDataContext.jsx';
import { PortfolioProvider } from './context/PortfolioContext.jsx';
import { PanelsProvider } from './context/PanelsContext.jsx';
import { ToastProvider, useToastContext } from './context/ToastContext.jsx';
import { InspectorProvider, useInspector } from './context/InspectorContext.jsx';
import { UIContext } from './context/UIContext.jsx';
import AppShell from './components/layout/AppShell.jsx';
import AssetDetailModal from './components/overlays/AssetDetailModal.jsx';
import InspectorOverlay from './components/overlays/InspectorOverlay.jsx';
import PositionModal from './components/overlays/PositionModal.jsx';
import SearchPalette from './components/overlays/SearchPalette.jsx';
import ViewFinder from './components/overlays/ViewFinder.jsx';
import DashboardView from './views/DashboardView.jsx';
import MarketsView from './views/MarketsView.jsx';
import PortfolioView from './views/PortfolioView.jsx';
import SettingsView from './views/SettingsView.jsx';
import SupportView from './views/SupportView.jsx';
import TradeView from './views/TradeView.jsx';

function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
    ),
  );
}

function AppContent() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { font, setFont } = useFont();
  const { route, navigate } = useHashRoute();
  const { baseCode } = useMarketData();
  const { toggle: toggleInspector } = useInspector();
  const { showToast } = useToastContext();

  const [searchOpen, setSearchOpen] = useState(false);
  const [assetCode, setAssetCode] = useState(null);
  const [positionModal, setPositionModal] = useState({ open: false, initial: null });
  const [pair, setPair] = useState({ from: 'BRL', to: 'USD' });

  const previousBase = useRef(baseCode);

  // Acompanha a moeda base sem sobrescrever um par escolhido pelo usuário.
  useEffect(() => {
    if (previousBase.current === baseCode) return;
    const previous = previousBase.current;
    previousBase.current = baseCode;
    setPair((current) => (current.from === previous ? { ...current, from: baseCode } : current));
  }, [baseCode]);

  useEffect(() => {
    const current = findRoute(route);
    document.title = `${t(current.titleKey)} · ${t('app.name')}`;
  }, [route, t]);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const openAsset = useCallback((code) => {
    setSearchOpen(false);
    setAssetCode(code);
  }, []);

  const closeAsset = useCallback(() => setAssetCode(null), []);

  const openPosition = useCallback((initial) => {
    setSearchOpen(false);
    setPositionModal({ open: true, initial: initial ?? null });
  }, []);

  const closePosition = useCallback(() => {
    setPositionModal((current) => ({ ...current, open: false }));
  }, []);

  const openTrade = useCallback(
    (fromCode, toCode) => {
      const from = fromCode || baseCode;
      let to = toCode || (from === 'USD' ? 'EUR' : 'USD');
      if (to === from) to = from === 'USD' ? 'EUR' : 'USD';
      setPair({ from, to });
      setAssetCode(null);
      setSearchOpen(false);
      navigate('trade');
    },
    [baseCode, navigate],
  );

  const handleThemeChange = useCallback((nextTheme) => setTheme(nextTheme), [setTheme]);

  const handleToggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(t(nextTheme === 'dark' ? 'toast.themeDark' : 'toast.themeLight'));
  }, [theme, setTheme, showToast, t]);

  // Atalhos globais: busca (Ctrl+K ou /), inspetor (Ctrl+Shift+E).
  useEffect(() => {
    function handleKeyDown(event) {
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (modifier && event.shiftKey && key === 'e') {
        event.preventDefault();
        toggleInspector();
        return;
      }

      if ((modifier && key === 'k') || (event.key === '/' && !isTypingTarget(event.target))) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInspector]);

  const ui = useMemo(
    () => ({
      theme,
      font,
      searchOpen,
      openSearch,
      closeSearch,
      navigate,
      openAsset,
      closeAsset,
      openPosition,
      openTrade,
      toggleTheme: handleToggleTheme,
      setTheme: handleThemeChange,
      setFont,
    }),
    [
      theme,
      font,
      searchOpen,
      openSearch,
      closeSearch,
      navigate,
      openAsset,
      closeAsset,
      openPosition,
      openTrade,
      handleToggleTheme,
      handleThemeChange,
      setFont,
    ],
  );

  function renderRoute() {
    switch (route) {
      case 'portfolio':
        return <PortfolioView />;
      case 'markets':
        return <MarketsView />;
      case 'trade':
        return <TradeView pair={pair} onPairChange={setPair} />;
      case 'settings':
        return <SettingsView theme={theme} onThemeChange={handleThemeChange} />;
      case 'support':
        return <SupportView />;
      case 'dashboard':
      default:
        return <DashboardView />;
    }
  }

  return (
    <UIContext.Provider value={ui}>
      <AppShell routeId={route} theme={theme} onToggleTheme={handleToggleTheme}>
        {renderRoute()}
      </AppShell>

      <InspectorOverlay />
      <ViewFinder />
      <SearchPalette />
      <AssetDetailModal code={assetCode} onClose={closeAsset} />
      <PositionModal
        open={positionModal.open}
        initial={positionModal.initial}
        onClose={closePosition}
      />
    </UIContext.Provider>
  );
}

export default function App() {
  return (
    <MarketDataProvider>
      <PortfolioProvider>
        <PanelsProvider>
          <ToastProvider>
            <InspectorProvider>
              <AppContent />
            </InspectorProvider>
          </ToastProvider>
        </PanelsProvider>
      </PortfolioProvider>
    </MarketDataProvider>
  );
}
