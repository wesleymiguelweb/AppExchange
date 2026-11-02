import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import { useMarketData } from '../../context/MarketDataContext.jsx';
import { usePortfolio } from '../../context/PortfolioContext.jsx';
import { useToastContext } from '../../context/ToastContext.jsx';
import { parseAmount, sanitizeAmountInput } from '../../utils/validation.js';
import Button from '../ui/Button.jsx';
import CurrencySelect from '../converter/CurrencySelect.jsx';
import Field from '../ui/Field.jsx';
import Modal from '../ui/Modal.jsx';
import styles from './PositionModal.module.css';

function toInput(value, locale) {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits: 6,
  }).format(value);
}

export default function PositionModal({ open, initial, onClose }) {
  const { t, locale, formatters } = useI18n();
  const { currencies, baseCode } = useMarketData();
  const { positions, addPosition, updatePosition } = usePortfolio();
  const { showToast } = useToastContext();

  const editing = Boolean(initial?.id);
  const [code, setCode] = useState('');
  const [quantityRaw, setQuantityRaw] = useState('');
  const [costRaw, setCostRaw] = useState('');
  const [errors, setErrors] = useState({});
  const quantityRef = useRef(null);

  const defaultCode = useMemo(() => {
    const available = currencies.find(
      (currency) => !positions.some((position) => position.code === currency.code),
    );
    return available?.code ?? currencies[0]?.code ?? 'USD';
  }, [currencies, positions]);

  useEffect(() => {
    if (!open) return;

    if (initial?.code) {
      setCode(initial.code);
    } else {
      setCode(defaultCode);
    }

    setQuantityRaw(initial?.quantity ? toInput(initial.quantity, locale) : '');
    setCostRaw(initial?.avgCost ? toInput(initial.avgCost, locale) : '');
    setErrors({});
  }, [open, initial, defaultCode, locale]);

  const availableCurrencies = useMemo(() => {
    if (!code || currencies.some((currency) => currency.code === code)) return currencies;
    return [{ code, name: code }, ...currencies];
  }, [currencies, code]);

  function handleSubmit(event) {
    event.preventDefault();
    const quantity = parseAmount(quantityRaw, locale);
    const cost = parseAmount(costRaw, locale);
    const nextErrors = {};

    if (!code) nextErrors.code = t('position.errors.currency');
    if (quantity.value === null) nextErrors.quantity = t('position.errors.quantity');
    if (cost.value === null) nextErrors.avgCost = t('position.errors.avgCost');

    const duplicate = positions.some(
      (position) => position.code === code && position.id !== initial?.id,
    );
    if (!editing && duplicate) nextErrors.code = t('position.errors.duplicate');

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (editing) {
      updatePosition(initial.id, { quantity: quantity.value, avgCost: cost.value });
      showToast(t('portfolio.updated'));
    } else {
      addPosition({ code, quantity: quantity.value, avgCost: cost.value });
      showToast(t('portfolio.added'));
    }

    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={t('portfolio.eyebrow')}
      title={editing ? t('position.editTitle') : t('position.addTitle')}
      subtitle={editing ? t('position.editSubtitle') : t('position.addSubtitle')}
      size="sm"
      viewId="position.modal"
      initialFocusRef={quantityRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="position-form" icon="check">
            {editing ? t('position.saveEdit') : t('position.saveAdd')}
          </Button>
        </>
      }
    >
      <form id="position-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          id="position-currency"
          label={t('position.currency')}
          error={errors.code}
          errorId="position-currency-error"
        >
          {({ describedBy, invalid }) => (
            <CurrencySelect
              id="position-currency"
              value={code}
              onChange={(nextCode) => {
                setCode(nextCode);
                setErrors((current) => ({ ...current, code: undefined }));
              }}
              currencies={availableCurrencies}
              formatters={formatters}
              disabled={editing}
              invalid={invalid}
              describedBy={describedBy}
            />
          )}
        </Field>

        <Field
          id="position-quantity"
          label={t('position.quantity')}
          error={errors.quantity}
          errorId="position-quantity-error"
        >
          {({ describedBy, invalid }) => (
            <input
              ref={quantityRef}
              id="position-quantity"
              className={styles.input}
              value={quantityRaw}
              onChange={(event) => {
                setQuantityRaw(sanitizeAmountInput(event.target.value));
                setErrors((current) => ({ ...current, quantity: undefined }));
              }}
              inputMode="decimal"
              autoComplete="off"
              spellCheck="false"
              placeholder="0,00"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <Field
          id="position-cost"
          label={t('position.avgCost')}
          hint={t('position.avgCostHint')}
          error={errors.avgCost}
          errorId="position-cost-error"
        >
          {({ describedBy, invalid }) => (
            <div className={styles.moneyField}>
              <span className={styles.prefix} aria-hidden="true">
                R$
              </span>
              <input
                id="position-cost"
                className={styles.input}
                value={costRaw}
                onChange={(event) => {
                  setCostRaw(sanitizeAmountInput(event.target.value));
                  setErrors((current) => ({ ...current, avgCost: undefined }));
                }}
                inputMode="decimal"
                autoComplete="off"
                spellCheck="false"
                placeholder="0,00"
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
              />
            </div>
          )}
        </Field>

        <p className={styles.note}>
          {t('portfolio.costHint')} · {t('dashboard.baseLine', { currency: baseCode })}
        </p>
      </form>
    </Modal>
  );
}

PositionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  initial: PropTypes.shape({
    id: PropTypes.string,
    code: PropTypes.string,
    quantity: PropTypes.number,
    avgCost: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
};
