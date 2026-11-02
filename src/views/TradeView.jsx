import { useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18n } from '../i18n/useI18n.js';
import { useMarketData } from '../context/MarketDataContext.jsx';
import { useToastContext } from '../context/ToastContext.jsx';
import { useExchangeRate } from '../hooks/useExchangeRate.js';
import { useHistoricalRates } from '../hooks/useHistoricalRates.js';
import { DEFAULT_PERIOD_ID, findPeriod } from '../constants/periods.js';
import { summarizeSeries } from '../utils/series.js';
import { parseAmount, sanitizeAmountInput } from '../utils/validation.js';
import { buildCsvFilename, downloadCsv, toCsv } from '../utils/csv.js';
import { todayIso } from '../utils/dates.js';
import { cx } from '../utils/cx.js';
import Icon from '../components/ui/Icon.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ConverterCard from '../components/converter/ConverterCard.jsx';
import ChartCard from '../components/chart/ChartCard.jsx';
import RatesCard from '../components/rates/RatesCard.jsx';
import styles from './TradeView.module.css';

const QUICK_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'BRL'];

export default function TradeView({ pair, onPairChange }) {
  const { t, locale, formatters } = useI18n();
  const {
    baseCode,
    currencies,
    currenciesLoading,
    currenciesError,
    retryCurrencies,
    rates: baseRates,
    rateDate: baseRateDate,
    ratesLoading: baseRatesLoading,
    ratesError: baseRatesError,
    retryRates: retryBaseRates,
    currencyName,
  } = useMarketData();
  const { showToast } = useToastContext();

  const [amountRaw, setAmountRaw] = useState('1000');
  const [periodId, setPeriodId] = useState(DEFAULT_PERIOD_ID);
  const converterRef = useRef(null);

  const fromCode = pair.from;
  const toCode = pair.to;
  const usingBase = fromCode === baseCode;

  // Quando a origem já é a moeda base, reaproveita a resposta compartilhada;
  // caso contrário busca apenas o par escolhido.
  const exchange = useExchangeRate(usingBase ? null : fromCode, toCode);
  const sourceRates = usingBase ? baseRates : exchange.rates;

  const rate =
    fromCode === toCode
      ? 1
      : Number.isFinite(sourceRates?.[toCode])
        ? sourceRates[toCode]
        : null;
  const quoteDate = usingBase ? baseRateDate : exchange.date;
  const rateLoading = usingBase ? baseRatesLoading : exchange.isLoading;
  const rateError = usingBase ? (baseRates ? null : baseRatesError) : exchange.error;
  const retryRate = usingBase ? retryBaseRates : exchange.retry;

  const period = findPeriod(periodId);
  const history = useHistoricalRates(fromCode, toCode, period);
  const parsedAmount = useMemo(() => parseAmount(amountRaw, locale), [amountRaw, locale]);
  const amountError = parsedAmount.errorKey
    ? t(`converter.amountErrors.${parsedAmount.errorKey}`)
    : null;
  const convertedValue =
    parsedAmount.value !== null && Number.isFinite(rate) ? parsedAmount.value * rate : null;
  const summary = useMemo(() => summarizeSeries(history.points), [history.points]);

  const tableRows = useMemo(() => {
    if (!sourceRates) return [];

    return Object.entries(sourceRates)
      .filter(([code, value]) => code !== fromCode && Number.isFinite(value) && value > 0)
      .map(([code, value]) => ({
        code,
        name: currencyName(code, code),
        rate: value,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [sourceRates, fromCode, currencyName]);

  const quickPairs = useMemo(() => {
    const available = new Set(currencies.map((currency) => currency.code));
    const candidates = [
      [baseCode, 'USD'],
      [baseCode, 'EUR'],
      [baseCode, 'GBP'],
      ['USD', 'BRL'],
      ['EUR', 'BRL'],
      ['GBP', 'USD'],
      ...QUICK_CODES.slice(0, 3).map((code) => [baseCode, code]),
    ];

    const seen = new Set();
    return candidates
      .filter(([from, to]) => from && to && from !== to && available.has(from) && available.has(to))
      .filter(([from, to]) => {
        const key = `${from}${to}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [baseCode, currencies]);

  const handleAmountChange = useCallback((value) => {
    setAmountRaw(sanitizeAmountInput(value));
  }, []);

  const handleFromChange = useCallback(
    (code) => {
      onPairChange({ from: code, to: code === toCode ? fromCode : toCode });
    },
    [onPairChange, toCode, fromCode],
  );

  const handleToChange = useCallback(
    (code) => {
      onPairChange({ from: code === fromCode ? toCode : fromCode, to: code });
    },
    [onPairChange, fromCode, toCode],
  );

  const handleSwap = useCallback(() => {
    onPairChange({ from: toCode, to: fromCode });
  }, [onPairChange, fromCode, toCode]);

  const handleSelectCurrency = useCallback(
    (code) => {
      onPairChange({ from: fromCode, to: code });
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      converterRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    },
    [onPairChange, fromCode],
  );

  const handleExport = useCallback(
    (rowsToExport) => {
      if (!rowsToExport || rowsToExport.length === 0) {
        showToast(t('csv.empty'), 'error');
        return;
      }

      try {
        const amount = parsedAmount.value;
        const columns = [
          { label: t('csv.headers.date'), value: () => quoteDate ?? todayIso() },
          { label: t('csv.headers.base'), value: () => fromCode },
          { label: t('csv.headers.target'), value: (row) => row.code },
          {
            label: t('csv.headers.name'),
            value: (row) => formatters.currencyName(row.code, row.name),
          },
          { label: t('csv.headers.rate'), value: (row) => String(row.rate) },
          {
            label: t('csv.headers.converted'),
            value: (row) => (amount === null ? '' : (amount * row.rate).toFixed(2)),
          },
        ];

        const content = toCsv(columns, rowsToExport);
        const filename = buildCsvFilename(
          `hermes-${fromCode}-${toCode}`,
          quoteDate ?? todayIso(),
        );

        downloadCsv(filename, content);
        showToast(
          t(rowsToExport.length === 1 ? 'csv.successOne' : 'csv.success', {
            count: rowsToExport.length,
          }),
        );
      } catch (error) {
        console.error('[Hermes] falha ao exportar CSV', error);
        showToast(t('csv.error'), 'error');
      }
    },
    [quoteDate, fromCode, toCode, parsedAmount.value, formatters, showToast, t],
  );

  return (
    <div className={styles.page} data-view-id="trade.page" data-view-name={t('trade.title')}>
      <PageHeader
        viewId="trade.header"
        eyebrow={t('trade.eyebrow')}
        title={t('trade.title')}
        description={t('trade.subtitle')}
        actions={
          <span className={styles.basePill}>
            <Icon name="swap" size={14} />
            {t('trade.pair', { from: fromCode, to: toCode })}
          </span>
        }
      />

      <section className={styles.quick} data-view-id="trade.quick">
        <span className={styles.quickLabel}>
          <Icon name="sparkles" size={15} />
          {t('trade.quick')}
        </span>
        <div className={styles.quickChips}>
          {quickPairs.map(([from, to]) => {
            const active = from === fromCode && to === toCode;
            return (
              <button
                key={`${from}-${to}`}
                type="button"
                className={cx(styles.chip, active && styles.chipActive)}
                aria-pressed={active}
                onClick={() => onPairChange({ from, to })}
              >
                <span className={styles.chipFrom}>{from}</span>
                <Icon name="arrowRight" size={12} />
                <span className={styles.chipTo}>{to}</span>
              </button>
            );
          })}
        </div>
        <span className={styles.quickNote}>{t('trade.notes')}</span>
      </section>

      <div className={styles.converter} data-view-id="trade.converter">
        <ConverterCard
          amountRaw={amountRaw}
          onAmountChange={handleAmountChange}
          amountError={amountError}
          convertedValue={convertedValue}
          fromCode={fromCode}
          toCode={toCode}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          onSwap={handleSwap}
          currencies={currencies}
          currenciesLoading={currenciesLoading}
          currenciesError={currenciesError}
          onRetryCurrencies={retryCurrencies}
          rate={rate ?? undefined}
          rateDate={quoteDate ?? undefined}
          rateLoading={rateLoading}
          rateError={rateError}
          onRetryRate={retryRate}
          sectionRef={converterRef}
        />
      </div>

      <div className={styles.chart} data-view-id="trade.chart">
        <ChartCard
          fromCode={fromCode}
          toCode={toCode}
          periodId={periodId}
          onPeriodChange={setPeriodId}
          points={history.points}
          summary={summary}
          range={history.range}
          isLoading={history.isLoading}
          error={history.error}
          onRetry={history.retry}
        />
      </div>

      <div className={styles.rates} data-view-id="trade.rates">
        <RatesCard
          baseCode={fromCode}
          amount={parsedAmount.value}
          rows={tableRows}
          quoteDate={quoteDate}
          isLoading={rateLoading}
          error={fromCode === toCode ? null : rateError}
          onRetry={retryRate}
          selectedCode={toCode}
          onSelectCurrency={handleSelectCurrency}
          onExport={handleExport}
        />
      </div>

      <div className={styles.footnote}>
        <Icon name="info" size={14} />
        <p>{t('converter.hint')}</p>
      </div>
    </div>
  );
}

TradeView.propTypes = {
  pair: PropTypes.shape({
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }).isRequired,
  onPairChange: PropTypes.func.isRequired,
};
