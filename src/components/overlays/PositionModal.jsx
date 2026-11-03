import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import { useMarketData } from '../../context/MarketDataContext.jsx';
import { usePortfolio } from '../../context/PortfolioContext.jsx';
import { useToastContext } from '../../context/ToastContext.jsx';
import { parseEntryInput, priceInBrl } from '../../utils/entries.js';
import { unitValueInBase } from '../../utils/portfolio.js';
import { todayIso } from '../../utils/dates.js';
import {
  parseAmount,
  parseNonNegative,
  sanitizeAmountInput,
  sanitizeNumberInput,
} from '../../utils/validation.js';
import { cx } from '../../utils/cx.js';
import Button from '../ui/Button.jsx';
import CurrencySelect from '../converter/CurrencySelect.jsx';
import Field from '../ui/Field.jsx';
import Modal from '../ui/Modal.jsx';
import styles from './PositionModal.module.css';

function toInput(value, locale) {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits: 8,
  }).format(value);
}

const ERROR_KEYS = {
  type: 'entryErrors.type',
  currency: 'entryErrors.currency',
  quantity: 'entryErrors.quantity',
  price: 'entryErrors.price',
  missingRate: 'entryErrors.missingRate',
  fee: 'entryErrors.fee',
  date: 'entryErrors.date',
  insufficient: 'entryErrors.insufficient',
};

/**
 * Entrada/saída de moeda na carteira.
 *
 * Cada registro é uma movimentação (entrada ou saída) com quantidade, preço por
 * unidade, data e corretagem. Vários registros podem existir para a mesma moeda:
 * entradas somam ao custo médio e saídas reduzem a posição.
 */
export default function PositionModal({ open, initial, onClose }) {
  const { t, locale, formatters } = useI18n();
  const { currencies, baseCode, rates, currencyName } = useMarketData();
  const { positions, getPosition, addEntry } = usePortfolio();
  const { showToast } = useToastContext();

  const presetCode = typeof initial === 'string' ? initial : initial?.code ?? '';
  const presetType = typeof initial === 'object' && initial?.type === 'out' ? 'out' : 'in';

  const [type, setType] = useState('in');
  const [code, setCode] = useState('');
  const [quantityRaw, setQuantityRaw] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [feeRaw, setFeeRaw] = useState('');
  const [date, setDate] = useState(todayIso());
  const [errors, setErrors] = useState({});
  const quantityRef = useRef(null);

  const holdingQuantity = getPosition(code)?.quantity ?? 0;

  const defaultCode = useMemo(
    () =>
      positions.find((position) => position.code !== baseCode)?.code ??
      currencies[0]?.code ??
      'USD',
    [positions, currencies, baseCode],
  );

  const marketPrice = priceInBrl(code, baseCode, rates);
  const unitInBase = unitValueInBase(code, baseCode, rates);

  useEffect(() => {
    if (!open) return;

    setType(presetType);
    setCode(presetCode || defaultCode);
    setQuantityRaw('');
    setPriceRaw('');
    setFeeRaw('');
    setDate(todayIso());
    setErrors({});
  }, [open, presetCode, presetType, defaultCode]);

  const availableCurrencies = useMemo(() => {
    if (!code || currencies.some((currency) => currency.code === code)) return currencies;
    return [{ code, name: code }, ...currencies];
  }, [currencies, code]);

  const previewQuantity = parseAmount(quantityRaw, locale).value;
  const previewPrice =
    priceRaw === '' ? marketPrice : parseAmount(priceRaw, locale).value;
  const previewFee =
    feeRaw === '' ? 0 : parseNonNegative(feeRaw, locale).value;
  const totalBrl =
    (previewQuantity ?? 0) * (previewPrice ?? 0) +
    (type === 'out' ? -(previewFee ?? 0) : (previewFee ?? 0));

  function handleSubmit(event) {
    event.preventDefault();

    const { entry, errors: nextErrors } = parseEntryInput(
      { type, quantityRaw, priceRaw, feeRaw, date, referencePrice: marketPrice },
      locale,
    );

    if (nextErrors) {
      setErrors(
        Object.fromEntries(
          Object.entries(nextErrors).map(([field, key]) => [field, t(ERROR_KEYS[key] ?? key)]),
        ),
      );
      return;
    }

    if (!code) {
      setErrors({ code: t('entryErrors.currency') });
      return;
    }

    if (type === 'out' && entry.quantity > holdingQuantity + 1e-9) {
      setErrors({ quantity: t('entryErrors.insufficient') });
      return;
    }

    addEntry(code, entry);
    showToast(t(type === 'in' ? 'entries.addedIn' : 'entries.addedOut', { code }));
    onClose();
  }

  const isOut = type === 'out';

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={t('portfolio.eyebrow')}
      title={isOut ? t('entries.outTitle') : t('entries.inTitle')}
      subtitle={t('entries.subtitle', { currency: baseCode })}
      size="sm"
      initialFocusRef={quantityRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="position-form"
            variant={isOut ? 'danger' : 'primary'}
            icon={isOut ? 'minus' : 'plus'}
          >
            {isOut ? t('entries.outAction') : t('entries.inAction')}
          </Button>
        </>
      }
    >
      <form id="position-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.typeSwitch} role="group" aria-label={t('entries.type')}>
          {[
            { id: 'in', label: t('entries.in') },
            { id: 'out', label: t('entries.out') },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={cx(styles.typeButton, type === option.id && styles.typeButtonActive)}
              data-tone={option.id}
              aria-pressed={type === option.id}
              onClick={() => {
                setType(option.id);
                setErrors({});
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Field
          id="position-currency"
          label={t('entries.currency')}
          hint={
            holdingQuantity > 0
              ? t('entries.holding', {
                  quantity: formatters.formatQuantity(holdingQuantity),
                  code,
                })
              : t(isOut ? 'entries.noHolding' : 'entries.newHolding', { code })
          }
          error={errors.code}
          errorId="position-currency-error"
        >
          {({ describedBy, invalid }) => (
            <CurrencySelect
              id="position-currency"
              value={code}
              onChange={(nextCode) => {
                setCode(nextCode);
                setPriceRaw('');
                setErrors({});
              }}
              currencies={availableCurrencies}
              formatters={formatters}
              invalid={invalid}
              describedBy={describedBy}
            />
          )}
        </Field>

        <div className={styles.grid}>
          <Field
            id="position-quantity"
            label={t('entries.quantity')}
            error={errors.quantity}
            errorId="position-quantity-error"
          >
            {({ describedBy, invalid }) => (
              <div className={styles.moneyField}>
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
                <span className={styles.suffix} aria-hidden="true">
                  {code}
                </span>
              </div>
            )}
          </Field>

          <Field
            id="position-date"
            label={t('entries.date')}
            error={errors.date}
            errorId="position-date-error"
          >
            {({ describedBy, invalid }) => (
              <input
                id="position-date"
                type="date"
                className={styles.input}
                value={date}
                max={todayIso()}
                onChange={(event) => {
                  setDate(event.target.value);
                  setErrors((current) => ({ ...current, date: undefined }));
                }}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
              />
            )}
          </Field>
        </div>

        <Field
          id="position-price"
          label={t('entries.price', { code })}
          hint={t('entries.priceHint', { currency: baseCode })}
          error={errors.price}
          errorId="position-price-error"
        >
          {({ describedBy, invalid }) => (
            <div className={styles.moneyField}>
              <span className={styles.prefix} aria-hidden="true">
                R$
              </span>
              <input
                id="position-price"
                className={styles.input}
                value={priceRaw}
                onChange={(event) => {
                  setPriceRaw(sanitizeNumberInput(event.target.value));
                  setErrors((current) => ({ ...current, price: undefined }));
                }}
                inputMode="decimal"
                autoComplete="off"
                spellCheck="false"
                placeholder={
                  Number.isFinite(marketPrice) ? toInput(marketPrice, locale) : '0,00'
                }
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
              />
              {Number.isFinite(marketPrice) ? (
                <button
                  type="button"
                  className={styles.useMarket}
                  onClick={() => {
                    setPriceRaw('');
                    setErrors((current) => ({ ...current, price: undefined }));
                  }}
                  title={t('entries.useMarket')}
                >
                  {t('entries.todayQuote')}
                </button>
              ) : null}
            </div>
          )}
        </Field>

        <Field
          id="position-fee"
          label={t('entries.fee')}
          hint={t('entries.feeHint')}
          error={errors.fee}
          errorId="position-fee-error"
        >
          {({ describedBy, invalid }) => (
            <div className={styles.moneyField}>
              <span className={styles.prefix} aria-hidden="true">
                R$
              </span>
              <input
                id="position-fee"
                className={styles.input}
                value={feeRaw}
                onChange={(event) => {
                  setFeeRaw(sanitizeNumberInput(event.target.value));
                  setErrors((current) => ({ ...current, fee: undefined }));
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

        <div className={styles.summary}>
          <div>
            <span className={styles.summaryLabel}>{t('entries.totalShort')}</span>
            <strong className={isOut ? styles.outValue : styles.inValue}>
              {Number.isFinite(totalBrl) && (previewQuantity ?? 0) > 0
                ? formatters.formatMoney(totalBrl, 'BRL')
                : '—'}
            </strong>
          </div>
          {Number.isFinite(marketPrice) && Number.isFinite(unitInBase) ? (
            <p className={styles.marketLine}>
              {t('entries.marketLine', {
                code,
                name: currencyName(code, code),
                value: formatters.formatMoney(marketPrice, 'BRL'),
                base: baseCode,
                baseValue: formatters.formatRate(unitInBase),
              })}
            </p>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}

PositionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  initial: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      code: PropTypes.string,
      id: PropTypes.string,
      type: PropTypes.oneOf(['in', 'out']),
    }),
  ]),
  onClose: PropTypes.func.isRequired,
};
