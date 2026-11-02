import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import { cx } from '../../utils/cx.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Field from '../ui/Field.jsx';
import Icon from '../ui/Icon.jsx';
import CurrencySelect from './CurrencySelect.jsx';
import styles from './ConverterCard.module.css';

export default function ConverterCard({
  amountRaw,
  onAmountChange,
  amountError,
  convertedValue,
  fromCode,
  toCode,
  onFromChange,
  onToChange,
  onSwap,
  currencies,
  currenciesLoading,
  currenciesError,
  onRetryCurrencies,
  rate,
  rateDate,
  rateLoading,
  rateError,
  onRetryRate,
  sectionRef,
}) {
  const { t, formatters } = useI18n();
  const amountErrorId = 'amount-error';
  const hasRate = Number.isFinite(rate);
  const canSwap = !currenciesLoading && !rateLoading && !currenciesError;

  return (
    <Card
      id="conversor"
      titleId="converter-title"
      title={t('converter.title')}
      subtitle={t('converter.subtitle')}
      className={styles.card}
    >
      <div ref={sectionRef} className={styles.layout}>
        <div className={styles.panel}>
          <Field
            id="converter-amount"
            label={t('converter.amountLabel', { currency: fromCode })}
            error={amountError}
            errorId={amountErrorId}
          >
            {({ describedBy, invalid }) => (
              <div className={cx(styles.amountRow, invalid && styles.invalid)}>
                <input
                  id="converter-amount"
                  className={styles.amountInput}
                  value={amountRaw}
                  onChange={(event) => onAmountChange(event.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="0,00"
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                />
                <span className={styles.amountCode} aria-hidden="true">
                  {fromCode}
                </span>
              </div>
            )}
          </Field>

          <div className={styles.divider} />

          <Field id="converter-from" label={t('converter.from')}>
            {({ describedBy, invalid }) => (
              <CurrencySelect
                id="converter-from"
                value={fromCode}
                onChange={onFromChange}
                currencies={currencies}
                excludeCode={toCode}
                formatters={formatters}
                disabled={currenciesLoading || Boolean(currenciesError)}
                invalid={invalid}
                describedBy={describedBy}
              />
            )}
          </Field>
        </div>

        <div className={styles.swapColumn}>
          <Button
            variant="secondary"
            size="sm"
            icon="swap"
            onClick={onSwap}
            disabled={!canSwap}
            className={styles.swapButton}
            aria-label={t('converter.swap')}
            title={t('converter.swap')}
          >
            {t('converter.swapShort')}
          </Button>
        </div>

        <div className={cx(styles.panel, styles.outputPanel)}>
          <div className={styles.outputField}>
            <span className={styles.outputLabel}>
              {t('converter.outputLabel', { currency: toCode })}
            </span>
            <div className={styles.amountRow}>
              <output
                className={cx(styles.amountInput, styles.output, !convertedValue && styles.muted)}
                aria-live="polite"
                aria-atomic="true"
                htmlFor="converter-amount"
              >
                {convertedValue === null
                  ? '—'
                  : formatters.formatMoney(convertedValue, toCode)}
              </output>
              <span className={styles.amountCode} aria-hidden="true">
                {toCode}
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          <Field id="converter-to" label={t('converter.to')}>
            {({ describedBy, invalid }) => (
              <CurrencySelect
                id="converter-to"
                value={toCode}
                onChange={onToChange}
                currencies={currencies}
                excludeCode={fromCode}
                formatters={formatters}
                disabled={currenciesLoading || Boolean(currenciesError)}
                invalid={invalid}
                describedBy={describedBy}
              />
            )}
          </Field>
        </div>
      </div>

      <div className={styles.footer}>
        {currenciesError ? (
          <InlineError
            message={t('errors.currencies')}
            onRetry={onRetryCurrencies}
            retryLabel={t('common.retry')}
          />
        ) : null}

        {rateError ? (
          <InlineError
            message={t('errors.rate')}
            onRetry={onRetryRate}
            retryLabel={t('common.retry')}
          />
        ) : null}

        {!rateError && !currenciesError ? (
          <div className={styles.rateMeta}>
            <p className={styles.rateLine}>
              {rateLoading || !hasRate ? (
                <span className={styles.loadingText}>
                  <span className={styles.pulseDot} aria-hidden="true" />
                  {t('converter.updating')}
                </span>
              ) : (
                <>
                  <span className={styles.rateStrong}>
                    {t('converter.rateLine', {
                      from: fromCode,
                      rate: formatters.formatRate(rate),
                      to: toCode,
                    })}
                  </span>
                  {rateDate ? (
                    <span className={styles.quoteDate}>
                      <Icon name="calendar" size={15} />
                      {t('converter.quoteDate', { date: formatters.formatDate(rateDate) })}
                    </span>
                  ) : null}
                </>
              )}
            </p>
            <p className={styles.hint}>
              {t('converter.hint')}
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function InlineError({ message, onRetry, retryLabel }) {
  return (
    <div className={styles.inlineError} role="alert">
      <span className={styles.errorIcon} aria-hidden="true">
        <Icon name="alert" size={16} />
      </span>
      <p>{message}</p>
      <button type="button" className={styles.retryLink} onClick={onRetry}>
        {retryLabel}
      </button>
    </div>
  );
}

InlineError.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
  retryLabel: PropTypes.string.isRequired,
};

ConverterCard.propTypes = {
  amountRaw: PropTypes.string.isRequired,
  onAmountChange: PropTypes.func.isRequired,
  amountError: PropTypes.string,
  convertedValue: PropTypes.number,
  fromCode: PropTypes.string.isRequired,
  toCode: PropTypes.string.isRequired,
  onFromChange: PropTypes.func.isRequired,
  onToChange: PropTypes.func.isRequired,
  onSwap: PropTypes.func.isRequired,
  currencies: PropTypes.arrayOf(
    PropTypes.shape({ code: PropTypes.string, name: PropTypes.string }),
  ).isRequired,
  currenciesLoading: PropTypes.bool,
  currenciesError: PropTypes.object,
  onRetryCurrencies: PropTypes.func.isRequired,
  rate: PropTypes.number,
  rateDate: PropTypes.string,
  rateLoading: PropTypes.bool,
  rateError: PropTypes.object,
  onRetryRate: PropTypes.func.isRequired,
  sectionRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};
