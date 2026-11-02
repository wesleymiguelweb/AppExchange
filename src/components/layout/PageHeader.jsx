import PropTypes from 'prop-types';
import styles from './PageHeader.module.css';

export default function PageHeader({ eyebrow, title, description, actions, viewId }) {
  return (
    <header
      className={styles.header}
      data-view-id={viewId}
      data-view-name={typeof title === 'string' ? title : undefined}
    >
      <div className={styles.text}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

PageHeader.propTypes = {
  eyebrow: PropTypes.node,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
  viewId: PropTypes.string,
};
