import { useId } from 'react';
import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import Icon from './Icon.jsx';
import styles from './Panel.module.css';

/**
 * Superfície base dos painéis da RIA. Mais leve que o Card original e com
 * suporte a ícone, ações e um slot de rodapé.
 */
export default function Panel({
  id,
  title,
  subtitle,
  icon,
  actions,
  footer,
  className,
  bodyClassName,
  viewId,
  viewName,
  children,
}) {
  const titleId = useId();

  return (
    <section
      id={id}
      className={cx(styles.panel, className)}
      aria-labelledby={titleId}
      data-view-id={viewId}
      data-view-name={viewName ?? (typeof title === 'string' ? title : undefined)}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          {icon ? (
            <span className={styles.icon} aria-hidden="true">
              <Icon name={icon} size={17} />
            </span>
          ) : null}
          <div className={styles.titles}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>

      <div className={cx(styles.body, bodyClassName)}>{children}</div>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </section>
  );
}

Panel.propTypes = {
  id: PropTypes.string,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  icon: PropTypes.string,
  actions: PropTypes.node,
  footer: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  viewId: PropTypes.string,
  viewName: PropTypes.string,
  children: PropTypes.node.isRequired,
};
