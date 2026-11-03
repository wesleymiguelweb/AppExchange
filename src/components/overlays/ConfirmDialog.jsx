import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import Modal from '../ui/Modal.jsx';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onClose,
}) {
  const { t } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? t('confirm.title')}
      eyebrow={t('confirm.title')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={tone}
            icon={tone === 'danger' ? 'trash' : 'check'}
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <span className={styles.icon} aria-hidden="true">
          <Icon name={tone === 'danger' ? 'alert' : 'info'} size={22} />
        </span>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.node,
  confirmLabel: PropTypes.string,
  tone: PropTypes.oneOf(['danger', 'primary']),
  onConfirm: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};
