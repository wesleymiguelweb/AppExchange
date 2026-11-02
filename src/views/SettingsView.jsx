import { useState } from 'react';
import PropTypes from 'prop-types';
import { useI18n } from '../i18n/useI18n.js';
import { useMarketData } from '../context/MarketDataContext.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { usePanels } from '../context/PanelsContext.jsx';
import { useInspector } from '../context/InspectorContext.jsx';
import { useToastContext } from '../context/ToastContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { FONT_OPTIONS } from '../constants/fonts.js';
import { cx } from '../utils/cx.js';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import Panel from '../components/ui/Panel.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ConfirmDialog from '../components/overlays/ConfirmDialog.jsx';
import styles from './SettingsView.module.css';

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx(styles.switch, checked && styles.switchOn)}
      onClick={onChange}
    >
      <span className={styles.switchThumb} aria-hidden="true" />
    </button>
  );
}

Switch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export default function SettingsView({ theme, onThemeChange }) {
  const { t, locale, setLocale, locales, formatters } = useI18n();
  const {
    baseCode,
    setBaseCode,
    currencies,
    currenciesLoading,
    currenciesError,
    retryCurrencies,
  } = useMarketData();
  const { positionsCount, resetPortfolio, clearPortfolio } = usePortfolio();
  const {
    state: panelState,
    panels,
    togglePanel,
    cyclePanelSize,
    resetPanels,
  } = usePanels();
  const { enabled: inspectorEnabled, toggle: toggleInspector, openFinder } = useInspector();
  const { showToast } = useToastContext();
  const { navigate, font, setFont } = useUI();

  const [confirmKind, setConfirmKind] = useState(null);

  function handleTheme(nextTheme) {
    if (nextTheme === theme) return;
    onThemeChange(nextTheme);
    showToast(t(nextTheme === 'dark' ? 'toast.themeDark' : 'toast.themeLight'));
  }

  function handleBaseChange(event) {
    setBaseCode(event.target.value);
  }

  function handleResetPanels() {
    resetPanels();
    showToast(t('toast.panelsReset'));
  }

  function handleConfirm() {
    if (confirmKind === 'reset') {
      resetPortfolio();
      showToast(t('toast.portfolioReset'));
    } else if (confirmKind === 'clear') {
      clearPortfolio();
      showToast(t('toast.portfolioCleared'));
    }
    setConfirmKind(null);
  }

  const confirmContent =
    confirmKind === 'clear'
      ? {
          title: t('settings.clearTitle'),
          message: t('settings.clearMessage'),
          confirmLabel: t('settings.clear'),
          tone: 'danger',
        }
      : {
          title: t('settings.resetTitle'),
          message: t('settings.resetMessage'),
          confirmLabel: t('settings.resetDemo'),
          tone: 'primary',
        };

  return (
    <div className={styles.page} data-view-id="settings.page" data-view-name={t('settings.title')}>
      <PageHeader
        viewId="settings.header"
        eyebrow={t('settings.eyebrow')}
        title={t('settings.title')}
        description={t('settings.subtitle')}
      />

      <div className={styles.grid}>
        <Panel
          viewId="settings.appearance"
          icon="sun"
          title={t('settings.appearance')}
          subtitle={t('settings.themeHint')}
          className={styles.panel}
        >
          <div className={styles.themeGrid}>
            {[
              { id: 'dark', label: t('settings.dark'), hint: t('settings.darkHint') },
              { id: 'light', label: t('settings.light'), hint: t('settings.lightHint') },
            ].map((option) => {
              const active = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={cx(styles.themeCard, active && styles.themeCardActive)}
                  aria-pressed={active}
                  onClick={() => handleTheme(option.id)}
                >
                  <span className={styles.themePreview} data-theme={option.id} aria-hidden="true">
                    <span className={styles.previewSidebar}>
                      <span className={styles.previewLogo} />
                      <span className={styles.previewNav} />
                      <span className={styles.previewNav} />
                      <span className={styles.previewNavShort} />
                    </span>
                    <span className={styles.previewMain}>
                      <span className={styles.previewHeader} />
                      <span className={styles.previewStats}>
                        <span className={styles.previewCard} />
                        <span className={styles.previewCard} />
                      </span>
                      <span className={styles.previewChart} />
                    </span>
                  </span>

                  <span className={styles.themeMeta}>
                    <span className={styles.themeTitle}>
                      {option.label}
                      {active ? (
                        <span className={styles.activeDot}>
                          <Icon name="check" size={11} />
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.themeHint}>{option.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          viewId="settings.language"
          icon="globe"
          title={t('settings.language')}
          subtitle={t('settings.languageHint')}
          className={styles.panel}
        >
          <SegmentedControl
            options={locales.map((item) => ({
              id: item.id,
              label: item.short,
              title: item.label,
            }))}
            value={locale}
            onChange={setLocale}
            label={t('settings.language')}
          />
          <p className={styles.currentLine}>
            {locales.find((item) => item.id === locale)?.label}
          </p>

          <div className={styles.separator} />

          <div className={styles.settingRow}>
            <div className={styles.settingText}>
              <strong>{t('settings.base')}</strong>
              <p>{t('settings.baseHint')}</p>
            </div>
            <span className={styles.baseValue}>{baseCode}</span>
          </div>

          {currenciesError ? (
            <div className={styles.inlineError}>
              <span>{t('errors.currencies')}</span>
              <Button size="sm" variant="secondary" icon="refresh" onClick={retryCurrencies}>
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <span className={styles.selectWrap}>
              <select
                className={styles.select}
                value={baseCode}
                onChange={handleBaseChange}
                disabled={currenciesLoading}
                aria-label={t('settings.base')}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} · {formatters.currencyName(currency.code, currency.name)}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" size={15} className={styles.selectIcon} />
            </span>
          )}
        </Panel>

        <Panel
          viewId="settings.typography"
          icon="sparkles"
          title={t('settings.typography')}
          subtitle={t('settings.fontHint')}
          className={styles.panel}
        >
          <div className={styles.fontGrid}>
            {FONT_OPTIONS.map((option) => {
              const active = font === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={cx(styles.fontCard, active && styles.fontCardActive)}
                  style={{ fontFamily: `'${option.label}', var(--font-sans)` }}
                  aria-pressed={active}
                  onClick={() => {
                    if (active) return;
                    setFont(option.id);
                    showToast(t('toast.fontChanged', { font: option.label }));
                  }}
                >
                  <span className={styles.fontSample}>Aa</span>
                  <span className={styles.fontMeta}>
                    <span className={styles.fontName}>{option.label}</span>
                    <span className={styles.fontNote}>{t(option.noteKey)}</span>
                  </span>
                  {active ? (
                    <span className={styles.fontCheck} aria-hidden="true">
                      <Icon name="check" size={11} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          viewId="settings.portfolio"
          icon="wallet"
          title={t('settings.portfolio')}
          subtitle={t('portfolio.subtitle', { currency: baseCode })}
          className={styles.panel}
        >
          <div className={styles.statLine}>
            <span>{t('portfolio.positions')}</span>
            <strong>{formatters.formatNumber(positionsCount)}</strong>
          </div>

          <div className={styles.actionList}>
            <div className={styles.settingRow}>
              <div className={styles.settingText}>
                <strong>{t('settings.resetDemo')}</strong>
                <p>{t('settings.resetDemoHint')}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon="reset"
                onClick={() => setConfirmKind('reset')}
              >
                {t('common.reset')}
              </Button>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingText}>
                <strong>{t('settings.clear')}</strong>
                <p>{t('settings.clearHint')}</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon="trash"
                onClick={() => setConfirmKind('clear')}
              >
                {t('settings.clear')}
              </Button>
            </div>
          </div>
        </Panel>

        <Panel
          viewId="settings.dashboard"
          icon="panel"
          title={t('settings.dashboard')}
          subtitle={t('settings.resetPanelsHint')}
          className={cx(styles.panel, styles.panelWide)}
          actions={
            <Button
              variant="ghost"
              size="sm"
              iconRight="arrowRight"
              onClick={() => navigate('dashboard')}
            >
              {t('common.open')}
            </Button>
          }
        >
          <ul className={styles.panelList}>
            {panels.map((panel) => {
              const visible = !panelState.hidden.includes(panel.id);
              return (
                <li key={panel.id} className={styles.panelItem}>
                  <span className={styles.panelIdentity}>
                    <span className={styles.panelIcon} aria-hidden="true">
                      <Icon name={panel.icon} size={15} />
                    </span>
                    <span className={styles.panelText}>
                      <strong>{t(panel.labelKey)}</strong>
                      <span>{t(panel.descriptionKey)}</span>
                    </span>
                  </span>

                  <span className={styles.panelControls}>
                    {panel.sizes.length > 1 ? (
                      <button
                        type="button"
                        className={styles.sizeChip}
                        onClick={() => cyclePanelSize(panel.id)}
                        title={t('dashboard.size')}
                      >
                        {t(`dashboard.sizes.${panelState.sizes[panel.id] ?? panel.defaultSize}`)}
                      </button>
                    ) : null}
                    <Switch
                      checked={visible}
                      onChange={() => togglePanel(panel.id)}
                      label={`${t('dashboard.visible')}: ${t(panel.labelKey)}`}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <div className={styles.panelFooter}>
            <Button variant="secondary" size="sm" icon="reset" onClick={handleResetPanels}>
              {t('settings.resetPanels')}
            </Button>
          </div>
        </Panel>

        <Panel
          viewId="settings.inspector"
          icon="inspect"
          title={t('settings.inspector')}
          subtitle={t('settings.inspectorHint')}
          className={styles.panel}
        >
          <div className={styles.settingRow}>
            <div className={styles.settingText}>
              <strong>{inspectorEnabled ? t('settings.disableInspector') : t('settings.enableInspector')}</strong>
              <p>{t('settings.shortcut', { keys: t('inspector.shortcut') })}</p>
            </div>
            <Switch
              checked={inspectorEnabled}
              onChange={toggleInspector}
              label={t('settings.inspector')}
            />
          </div>

          <div className={styles.inspectorActions}>
            <Button variant="secondary" size="sm" icon="search" onClick={openFinder}>
              {t('inspector.finder')}
            </Button>
            <code className={styles.kbd}>Ctrl + Shift + E</code>
          </div>
        </Panel>

        <Panel
          viewId="settings.about"
          icon="info"
          title={t('settings.about')}
          subtitle={t('settings.dataSourceHint')}
          className={styles.panel}
        >
          <dl className={styles.aboutList}>
            <div>
              <dt>{t('settings.dataSource')}</dt>
              <dd>
                <a href="https://frankfurter.dev" target="_blank" rel="noreferrer">
                  Frankfurter · BCE
                  <Icon name="external" size={12} />
                </a>
              </dd>
            </div>
            <div>
              <dt>{t('settings.version')}</dt>
              <dd>{t('settings.versionValue')}</dd>
            </div>
            <div>
              <dt>{t('settings.base')}</dt>
              <dd>{baseCode}</dd>
            </div>
            <div>
              <dt>{t('settings.language')}</dt>
              <dd>{locales.find((item) => item.id === locale)?.label}</dd>
            </div>
          </dl>

          <p className={styles.privacy}>
            <Icon name="info" size={14} />
            {t('support.q3')}
          </p>
        </Panel>
      </div>

      <ConfirmDialog
        open={Boolean(confirmKind)}
        title={confirmContent.title}
        message={confirmContent.message}
        confirmLabel={confirmContent.confirmLabel}
        tone={confirmContent.tone}
        onConfirm={handleConfirm}
        onClose={() => setConfirmKind(null)}
      />
    </div>
  );
}

SettingsView.propTypes = {
  theme: PropTypes.oneOf(['dark', 'light']).isRequired,
  onThemeChange: PropTypes.func.isRequired,
};
