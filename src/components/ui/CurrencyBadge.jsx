import PropTypes from 'prop-types';
import { cx } from '../../utils/cx.js';
import styles from './CurrencyBadge.module.css';

const SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  BRL: 'R$',
  CHF: '₣',
  CNY: '¥',
  INR: '₹',
  KRW: '₩',
  RUB: '₽',
  TRY: '₺',
  THB: '฿',
  VND: '₫',
  ILS: '₪',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  ISK: 'kr',
  ZAR: 'R',
  MXN: 'Mex$',
  AUD: 'A$',
  NZD: 'NZ$',
  CAD: 'C$',
  HKD: 'HK$',
  SGD: 'S$',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
};

export function currencySymbol(code) {
  return SYMBOLS[code] ?? code?.slice(0, 2) ?? '—';
}

/** Índice estável (1–8) para a cor da moeda em gráficos e badges. */
export function currencyColorIndex(code) {
  return ([...String(code ?? '')].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 8) + 1;
}

export function currencyColor(code) {
  return `var(--coin-${currencyColorIndex(code)})`;
}

export default function CurrencyBadge({ code, size = 'md', className }) {
  const index = currencyColorIndex(code);
  const label = currencySymbol(code);

  return (
    <span
      className={cx(styles.badge, styles[size], className)}
      style={{ '--badge-color': `var(--coin-${index})` }}
      aria-hidden="true"
    >
      <span className={styles.symbol}>{label}</span>
    </span>
  );
}

CurrencyBadge.propTypes = {
  code: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};
