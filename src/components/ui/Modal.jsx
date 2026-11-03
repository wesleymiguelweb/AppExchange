import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import { useI18n } from '../../i18n/useI18n.js';
import Icon from './Icon.jsx';
import styles from './Modal.module.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal acessível: portal, foco preso, ESC, restauração de foco e bloqueio de
 * scroll do body. Serve de base para detalhe do ativo, posição e busca global.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  size = 'md',
  footer,
  initialFocusRef,
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const previousFocus = useRef(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return undefined;

    previousFocus.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const target =
        initialFocusRef?.current ?? dialog.querySelector(FOCUSABLE) ?? dialog;
      target.focus?.();
    }, 20);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={cx(styles.dialog, styles[size])}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={t('common.closeDialog')}
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  eyebrow: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  footer: PropTypes.node,
  initialFocusRef: PropTypes.shape({ current: PropTypes.any }),
  children: PropTypes.node.isRequired,
};
