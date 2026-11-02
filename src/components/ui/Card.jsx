import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import styles from './Card.module.css';

export default function Card({ id, titleId, title, subtitle, actions, className, bodyClassName, children }) {
  return (
    <section id={id} className={cx(styles.card, className)} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={cx(styles.body, bodyClassName)}>{children}</div>
    </section>
  );
}

Card.propTypes = {
  id: PropTypes.string,
  titleId: PropTypes.string.isRequired,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  children: PropTypes.node.isRequired,
};
