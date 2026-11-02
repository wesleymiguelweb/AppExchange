import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n/useI18n.js';
import { useInspector } from '../../context/InspectorContext.jsx';
import { copyText } from '../../utils/clipboard.js';
import { cx } from '../../utils/cx.js';
import Modal from '../ui/Modal.jsx';
import Icon from '../ui/Icon.jsx';
import styles from './ViewFinder.module.css';

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function ViewFinder() {
  const { t } = useI18n();
  const { finderOpen, closeFinder, listViews, selectView, enable } = useInspector();
  const [views, setViews] = useState([]);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!finderOpen) {
      setQuery('');
      setCopiedId(null);
      return undefined;
    }

    const timer = window.setTimeout(() => setViews(listViews()), 30);
    return () => window.clearTimeout(timer);
  }, [finderOpen, listViews]);

  useEffect(() => {
    if (!finderOpen) return undefined;
    const handleHash = () => closeFinder();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [finderOpen, closeFinder]);

  useEffect(() => {
    if (!copiedId) return undefined;
    const timer = window.setTimeout(() => setCopiedId(null), 1_600);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const filtered = useMemo(() => {
    const term = normalize(query);
    if (!term) return views;
    return views.filter((view) =>
      normalize(`${view.id} ${view.name} ${view.component} ${view.tag}`).includes(term),
    );
  }, [views, query]);

  async function handleCopy(view) {
    const ok = await copyText(view.id);
    if (ok) setCopiedId(view.id);
  }

  function handleLocate(id) {
    enable();
    selectView(id);
    closeFinder();
  }

  return (
    <Modal
      open={finderOpen}
      onClose={closeFinder}
      title={t('inspector.finderTitle')}
      subtitle={t('inspector.finderSubtitle', { count: views.length })}
      eyebrow={t('inspector.inspectLabel')}
      size="lg"
      ignoreInspector
    >
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Icon name="search" size={16} />
          </span>
          <input
            className={styles.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('inspector.searchPlaceholder')}
            aria-label={t('inspector.searchPlaceholder')}
            autoFocus
            spellCheck="false"
          />
        </div>
        <span className={styles.count}>{t('inspector.views', { count: filtered.length })}</span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <Icon name="inspect" size={22} />
          </span>
          <p>{t('inspector.empty')}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((view) => (
            <li key={view.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowHeading}>
                  <code className={styles.viewId}>{view.id}</code>
                  <span className={cx(styles.visibility, view.visible ? styles.on : styles.off)}>
                    {view.visible ? t('inspector.visible') : t('inspector.hidden')}
                  </span>
                </div>
                <p className={styles.rowMeta}>
                  <span>{view.name}</span>
                  <span className={styles.metaDot} aria-hidden="true">
                    ·
                  </span>
                  <span>{view.component}</span>
                  <span className={styles.metaDot} aria-hidden="true">
                    ·
                  </span>
                  <span>
                    {view.rect.width} × {view.rect.height} px
                  </span>
                </p>
              </div>

              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => handleCopy(view)}
                  title={t('common.copyId')}
                  aria-label={`${t('common.copyId')}: ${view.id}`}
                >
                  <Icon name={copiedId === view.id ? 'check' : 'copy'} size={15} />
                  <span>{copiedId === view.id ? t('common.copied') : t('common.copy')}</span>
                </button>
                <button
                  type="button"
                  className={styles.locate}
                  onClick={() => handleLocate(view.id)}
                >
                  <Icon name="arrowRight" size={15} />
                  <span>{t('inspector.locate')}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
