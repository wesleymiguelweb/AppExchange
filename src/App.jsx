import { useCallback, useMemo, useRef, useState } from 'react';
import { useCurrencies } from './hooks/useCurrencies.js';
import { useExchangeRate } from './hooks/useExchangeRate.js';
import { useHistoricalRates } from './hooks/useHistoricalRates.js';
import { useToast } from './hooks/useToast.js';
import { useI18n } from './i18n/useI18n.js';
import { DEFAULT_PERIOD_ID, findPeriod } from './constants/periods.js';
import { summarizeSeries } from './utils/series.js';
import { parseAmount, sanitizeAmountInput } from './utils/validation.js';
import { buildCsvFilename, downloadCsv, toCsv } from './utils/csv.js';
import { todayIso } from './utils/dates.js';
import Header from './components/layout/Header.jsx';
import ConverterCard from './components/converter/ConverterCard.jsx';
import ChartCard from './components/chart/ChartCard.jsx';
import RatesCard from './components/rates/RatesCard.jsx';
import Toast from './components/ui/Toast.jsx';
import styles from './App.module.css';

export default function App() {
  const { t, locale, setLocale, formatters, locales } = useI18n();

  // Estado compartilhado (Lifting State Up): o App é a única fonte de verdade do
  // valor, do par de moedas e do período. Conversor, gráfico e tabela recebem
  // esses dados por props e devolvem eventos.
  const [amountRaw, setAmountRaw] = useState('1000');
  const [fromCode, setFromCode] = useState('BRL');
  const [toCode, setToCode] = useState('USD');
  const [periodId, setPeriodId] = useState(DEFAULT_PERIOD_ID);

  const converterRef = useRef(null);
  const period = findPeriod(periodId);

  const currenciesState = useCurrencies();
  const exchange = useExchangeRate(fromCode, toCode);
  const history = useHistoricalRates(fromCode, toCode, period);
  const { toast, showToast, dismiss } = useToast();

  const parsedAmount = useMemo(() => parseAmount(amountRaw, locale), [amountRaw, locale]);
  const amountError = parsedAmount.errorKey
    ? t(`converter.amountErrors.${parsedAmount.errorKey}`)
    : null;
  const convertedValue =
    parsedAmount.value !== null && Number.isFinite(exchange.rate)
      ? parsedAmount.value * exchange.rate
      : null;

  const nameByCode = useMemo(
    () => new Map(currenciesState.currencies.map((currency) => [currency.code, currency.name])),
    [currenciesState.currencies],
  );

  // Manipulação de objeto → array: o mapa { USD: 0.187 } vira linhas de tabela.
  const tableRows = useMemo(() => {
    if (!exchange.rates) return [];

    return Object.entries(exchange.rates)
      .filter(([code, rate]) => code !== fromCode && Number.isFinite(rate) && rate > 0)
      .map(([code, rate]) => ({
        code,
        name: nameByCode.get(code) ?? code,
        rate,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [exchange.rates, fromCode, nameByCode]);

  const summary = useMemo(() => summarizeSeries(history.points), [history.points]);

  const handleAmountChange = useCallback((value) => {
    setAmountRaw(sanitizeAmountInput(value));
  }, []);

  const handleSwap = useCallback(() => {
    setFromCode(toCode);
    setToCode(fromCode);
  }, [fromCode, toCode]);

  const handleSelectCurrency = useCallback((code) => {
    setToCode(code);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    converterRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  }, []);

  // Exportação CSV: recebe as linhas já filtradas/ordenadas pela tabela.
  const handleExport = useCallback(
    (rowsToExport) => {
      if (!rowsToExport || rowsToExport.length === 0) {
        showToast(t('csv.empty'), 'error');
        return;
      }

      try {
        const amount = parsedAmount.value;
        const columns = [
          { label: t('csv.headers.date'), value: () => exchange.date ?? todayIso() },
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
          exchange.date ?? todayIso(),
        );

        downloadCsv(filename, content);
        showToast(
          t(rowsToExport.length === 1 ? 'csv.successOne' : 'csv.success', {
            count: rowsToExport.length,
          }),
          'success',
        );
      } catch (error) {
        console.error('[Hermes] falha ao exportar CSV', error);
        showToast(t('csv.error'), 'error');
      }
    },
    [exchange.date, fromCode, toCode, parsedAmount.value, formatters, showToast, t],
  );

  return (
    <div className={styles.app}>
      <a className={styles.skipLink} href="#conteudo">
        {t('common.skipToContent')}
      </a>

      <Header
        appName={t('app.name')}
        kicker={t('app.kicker')}
        locale={locale}
        locales={locales}
        onChangeLocale={setLocale}
        languageLabel={t('language.label')}
      />

      <main id="conteudo" className={styles.main} tabIndex={-1}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {t('page.eyebrow')}
          </p>
          <h1 className={styles.title}>{t('page.title')}</h1>
          <p className={styles.description}>{t('page.description')}</p>
        </div>

        <div className={styles.stack}>
          <ConverterCard
            amountRaw={amountRaw}
            onAmountChange={handleAmountChange}
            amountError={amountError}
            convertedValue={convertedValue}
            fromCode={fromCode}
            toCode={toCode}
            onFromChange={setFromCode}
            onToChange={setToCode}
            onSwap={handleSwap}
            currencies={currenciesState.currencies}
            currenciesLoading={currenciesState.isLoading}
            currenciesError={currenciesState.error}
            onRetryCurrencies={currenciesState.retry}
            rate={exchange.rate ?? undefined}
            rateDate={exchange.date ?? undefined}
            rateLoading={exchange.isLoading}
            rateError={exchange.error}
            onRetryRate={exchange.retry}
            sectionRef={converterRef}
          />

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

          <RatesCard
            baseCode={fromCode}
            amount={parsedAmount.value}
            rows={tableRows}
            quoteDate={exchange.date}
            isLoading={exchange.isLoading}
            error={exchange.error}
            onRetry={exchange.retry}
            selectedCode={toCode}
            onSelectCurrency={handleSelectCurrency}
            onExport={handleExport}
          />
        </div>

        <footer className={styles.footer}>
          <p>
            {t('footer.source')} ·{' '}
            <a className={styles.footerLink} href="https://frankfurter.dev" target="_blank" rel="noreferrer">
              frankfurter.dev
            </a>
          </p>
          <p>{t('footer.disclaimer')}</p>
          <p>{t('footer.builtWith')}</p>
        </footer>
      </main>

      <Toast toast={toast} onDismiss={dismiss} dismissLabel={t('common.close')} />
    </div>
  );
}
