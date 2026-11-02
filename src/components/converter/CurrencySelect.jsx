import PropTypes from 'prop-types';
import Icon from '../ui/Icon.jsx';
import styles from './CurrencySelect.module.css';

/**
 * Select nativo (teclado e leitores de tela vêm de graça) com aparência própria.
 * A moeda oposta é excluída para impedir conversão de uma moeda para ela mesma.
 */
export default function CurrencySelect({
  id,
  value,
  onChange,
  currencies,
  excludeCode,
  formatters,
  disabled = false,
  invalid = false,
  describedBy,
}) {
  const options = currencies.filter((currency) => currency.code !== excludeCode);
  const hasSelected = options.some((currency) => currency.code === value);
  const list = hasSelected ? options : [{ code: value, name: value }, ...options];

  return (
    <div className={styles.wrapper}>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      >
        {list.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} — {formatters.currencyName(currency.code, currency.name)}
          </option>
        ))}
      </select>
      <span className={styles.chevron} aria-hidden="true">
        <Icon name="chevronDown" size={16} />
      </span>
    </div>
  );
}

CurrencySelect.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  currencies: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  excludeCode: PropTypes.string,
  formatters: PropTypes.shape({
    currencyName: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
  invalid: PropTypes.bool,
  describedBy: PropTypes.string,
};
