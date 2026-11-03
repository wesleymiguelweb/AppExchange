import { useState } from 'react';
import { useI18n } from '../i18n/useI18n.js';
import { useUI } from '../context/UIContext.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import styles from './SupportView.module.css';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'];
const MAP_KEYS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'];

const SHORTCUTS = [
  { id: 'search', keys: ['Ctrl', 'K'], alt: ['/'] },
  { id: 'close', keys: ['Esc'] },
];

export default function SupportView() {
  const { t } = useI18n();
  const { openSearch, openEntry, navigate } = useUI();
  const [openFaq, setOpenFaq] = useState('q1');

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow={t('support.eyebrow')}
        title={t('support.title')}
        description={t('support.subtitle')}
        actions={
          <>
            <Button variant="secondary" icon="search" onClick={openSearch}>
              {t('search.openPalette')}
            </Button>
            <Button icon="plus" onClick={() => openEntry(null)}>
              {t('dashboard.addPosition')}
            </Button>
          </>
        }
      />

      <div className={styles.layout}>
        <section className={styles.card}>
          <header className={styles.cardHead}>
            <span className={styles.cardIcon} aria-hidden="true">
              <Icon name="help" size={17} />
            </span>
            <div>
              <h2 className={styles.cardTitle}>{t('support.faqTitle')}</h2>
              <p className={styles.cardSubtitle}>{t('support.subtitle')}</p>
            </div>
          </header>

          <ul className={styles.faqList}>
            {FAQ_KEYS.map((key) => {
              const open = openFaq === key;
              const panelId = `faq-panel-${key}`;
              const buttonId = `faq-button-${key}`;

              return (
                <li key={key} className={open ? `${styles.faqItem} ${styles.faqOpen}` : styles.faqItem}>
                  <button
                    id={buttonId}
                    type="button"
                    className={styles.faqButton}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenFaq(open ? null : key)}
                  >
                    <span>{t(`support.${key}`)}</span>
                    <span className={styles.faqChevron} aria-hidden="true">
                      <Icon name={open ? 'minus' : 'plus'} size={15} />
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={styles.faqAnswer}
                    hidden={!open}
                  >
                    <p>{t(`support.a${key.slice(1)}`)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className={styles.aside}>
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.cardIcon} aria-hidden="true">
                <Icon name="panel" size={17} />
              </span>
              <div>
                <h2 className={styles.cardTitle}>{t('support.shortcutsTitle')}</h2>
                <p className={styles.cardSubtitle}>{t('support.shortcutsHint')}</p>
              </div>
            </header>

            <ul className={styles.shortcutList}>
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.id} className={styles.shortcutRow}>
                  <span className={styles.shortcutLabel}>
                    {t(`support.shortcut${shortcut.id.charAt(0).toUpperCase()}${shortcut.id.slice(1)}`)}
                  </span>
                  <span className={styles.keys}>
                    {shortcut.keys.map((key) => (
                      <kbd key={key} className={styles.key}>
                        {key}
                      </kbd>
                    ))}
                    {shortcut.alt ? (
                      <span className={styles.keyAlt}>
                        {t('common.or')} <kbd className={styles.key}>{shortcut.alt[0]}</kbd>
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>

            <div className={styles.shortcutActions}>
              <Button variant="secondary" size="sm" icon="search" onClick={openSearch}>
                {t('search.openPalette')}
              </Button>
              <Button variant="secondary" size="sm" icon="wallet" onClick={() => navigate('portfolio')}>
                {t('nav.portfolio')}
              </Button>
            </div>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.cardIcon} aria-hidden="true">
                <Icon name="info" size={17} />
              </span>
              <div>
                <h2 className={styles.cardTitle}>{t('support.aboutTitle')}</h2>
                <p className={styles.cardSubtitle}>HERMES · 3.0</p>
              </div>
            </header>

            <p className={styles.aboutText}>{t('support.aboutText')}</p>

            <div className={styles.sourceBox}>
              <strong>{t('support.sourceTitle')}</strong>
              <p>{t('support.sourceText')}</p>
              <div className={styles.sourceLinks}>
                <a href="https://frankfurter.dev" target="_blank" rel="noreferrer">
                  frankfurter.dev
                  <Icon name="external" size={12} />
                </a>
                <button type="button" onClick={() => navigate('settings')}>
                  {t('settings.title')}
                  <Icon name="arrowRight" size={12} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <span className={styles.cardIcon} aria-hidden="true">
            <Icon name="panel" size={17} />
          </span>
          <div>
            <h2 className={styles.cardTitle}>{t('support.mapTitle')}</h2>
            <p className={styles.cardSubtitle}>{t('support.mapIntro')}</p>
          </div>
        </header>

        <div className={styles.mapWrap}>
          <table className={styles.mapTable}>
            <thead>
              <tr>
                <th scope="col">{t('support.mapColumns.reference')}</th>
                <th scope="col">{t('support.mapColumns.hermes')}</th>
                <th scope="col">{t('support.mapColumns.why')}</th>
              </tr>
            </thead>
            <tbody>
              {MAP_KEYS.map((key) => (
                <tr key={key}>
                  <td className={styles.mapReference}>{t(`support.mapRows.${key}.reference`)}</td>
                  <td>
                    <span className={styles.mapDestination}>
                      {t(`support.mapRows.${key}.hermes`)}
                    </span>
                  </td>
                  <td className={styles.mapWhy}>{t(`support.mapRows.${key}.why`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
