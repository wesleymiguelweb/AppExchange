import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/useI18n.js';
import { useInspector } from '../../context/InspectorContext.jsx';
import { copyText } from '../../utils/clipboard.js';
import { cx } from '../../utils/cx.js';
import Icon from '../ui/Icon.jsx';
import styles from './InspectorOverlay.module.css';

const POPUP_WIDTH = 330;
const POPUP_HEIGHT = 320;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function Highlight({ view, selected }) {
  if (!view?.visible) return null;
  const { rect } = view;

  return (
    <div
      className={cx(styles.box, selected ? styles.boxSelected : styles.boxHovered)}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      aria-hidden="true"
    />
  );
}

function Tag({ view }) {
  if (!view?.visible) return null;
  const { rect } = view;
  const top = rect.y > 24 ? rect.y - 20 : rect.y + 2;

  return (
    <span
      className={styles.tag}
      style={{ left: Math.max(rect.x, 4), top }}
      aria-hidden="true"
    >
      {view.id}
    </span>
  );
}

export default function InspectorOverlay() {
  const { t } = useI18n();
  const { enabled, hovered, selected, disable, openFinder, clearSelected } = useInspector();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    setCopied(false);
    setCopyFailed(false);
  }, [selected?.id]);

  useEffect(() => {
    if (!copied && !copyFailed) return undefined;
    const timer = window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 1_800);
    return () => window.clearTimeout(timer);
  }, [copied, copyFailed]);

  // Ctrl+C copia o id da view selecionada, sem sequestrar a cópia de texto.
  useEffect(() => {
    if (!enabled || !selected) return undefined;

    function handleKeyDown(event) {
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return;
      if (event.key.toLowerCase() !== 'c') return;

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
        )
      ) {
        return;
      }

      const selection = window.getSelection();
      if (selection && selection.toString().trim()) return;

      event.preventDefault();
      handleCopy();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, selected]);

  if (!enabled) return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const selectedLeft = selected
    ? clamp(selected.rect.x, 12, viewportWidth - POPUP_WIDTH - 12)
    : 0;
  const below = selected ? selected.rect.y + selected.rect.height + 10 : 0;
  const selectedTop = selected
    ? below + POPUP_HEIGHT > viewportHeight - 12
      ? Math.max(12, selected.rect.y - POPUP_HEIGHT - 10)
      : below
    : 0;

  async function handleCopy() {
    if (!selected) return;
    const ok = await copyText(selected.id);
    setCopied(ok);
    setCopyFailed(!ok);
  }

  return createPortal(
    <>
      <Highlight view={hovered} />
      {selected && selected.id !== hovered?.id ? <Highlight view={selected} selected /> : null}
      {hovered && !selected ? <Tag view={hovered} /> : null}
      {hovered && selected && hovered.id !== selected.id ? <Tag view={hovered} /> : null}

      {selected ? (
        <section
          className={styles.popup}
          style={{ left: selectedLeft, top: selectedTop }}
          data-inspector-ui
          aria-label={t('inspector.panelTitle')}
        >
          <header className={styles.popupHeader}>
            <div>
              <p className={styles.popupTitle}>{t('inspector.panelTitle')}</p>
              <p className={styles.popupSubtitle}>{selected.name}</p>
            </div>
            <button
              type="button"
              className={styles.popupClose}
              onClick={clearSelected}
              aria-label={t('inspector.close')}
            >
              <Icon name="close" size={15} />
            </button>
          </header>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>{t('inspector.id')}</dt>
              <dd className={styles.idRow}>
                <code>{selected.id}</code>
                <button
                  type="button"
                  className={cx(styles.copyButton, copied && styles.copySuccess)}
                  onClick={handleCopy}
                  title={t('common.copyId')}
                >
                  <Icon name={copied ? 'check' : 'copy'} size={13} />
                  <span>{copied ? t('common.copied') : t('common.copy')}</span>
                </button>
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>{t('inspector.component')}</dt>
              <dd>
                {selected.component} · <code>{selected.tag}</code>
              </dd>
            </div>
            {selected.role ? (
              <div className={styles.fact}>
                <dt>{t('inspector.role')}</dt>
                <dd>{selected.role}</dd>
              </div>
            ) : null}
            <div className={styles.fact}>
              <dt>{t('inspector.dimensions')}</dt>
              <dd>
                {selected.rect.width} × {selected.rect.height} px
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>{t('inspector.position')}</dt>
              <dd>
                x {selected.rect.x} · y {selected.rect.y}
              </dd>
            </div>
          </dl>

          <p className="sr-only" role="status">
            {copied ? t('inspector.copied') : copyFailed ? t('inspector.copyError') : ''}
          </p>
        </section>
      ) : null}

      <div className={styles.toolbar} data-inspector-ui>
        <span className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span className={styles.statusText}>{t('inspector.enabled')}</span>
        </span>
        <span className={styles.divider} aria-hidden="true" />
        <button type="button" className={styles.toolbarButton} onClick={openFinder}>
          <Icon name="search" size={15} />
          <span>{t('inspector.finder')}</span>
        </button>
        <button
          type="button"
          className={styles.toolbarIcon}
          onClick={disable}
          aria-label={t('inspector.close')}
          title={t('inspector.close')}
        >
          <Icon name="close" size={15} />
        </button>
      </div>
    </>,
    document.body,
  );
}
