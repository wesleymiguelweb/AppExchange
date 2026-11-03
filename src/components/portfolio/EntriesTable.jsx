import PropTypes from 'prop-types';
import { useI18n } from '../../i18n/useI18n.js';
import { cx } from '../../utils/cx.js';
import { isOutflow, sortEntriesDesc } from '../../utils/entries.js';
import Icon from '../ui/Icon.jsx';
import CurrencyBadge from '../ui/CurrencyBadge.jsx';
import styles from './EntriesTable.module.css';

/**
 * Tabela do histórico de movimentações (entradas e saídas).
 *
 * Cada linha é uma entrada ou saída registrada com data, quantidade, preço por
 * unidade (BRL), taxa e total. O componente é usado tanto na página de
 * Carteira (com a coluna de ativo) quanto no detalhe do ativo (sem ela).
 */
export default function EntriesTable({ entries, showCode = false, onRemove, empty }) {
  const { t, formatters } = useI18n();

  const rows = sortEntriesDesc(entries ?? []);

  if (rows.length === 0) {
    return <p className={styles.empty}>{empty ?? t('entries.historyEmpty')}</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="sr-only">{t('entries.historyTitle')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('entries.columns.date')}</th>
            <th scope="col">{t('entries.columns.type')}</th>
            {showCode ? <th scope="col">{t('entries.columns.asset')}</th> : null}
            <th scope="col" className={styles.numeric}>
              {t('entries.columns.quantity')}
            </th>
            <th scope="col" className={styles.numeric}>
              {t('entries.columns.price')}
            </th>
            <th scope="col" className={styles.numeric}>
              {t('entries.columns.fee')}
            </th>
            <th scope="col" className={styles.numeric}>
              {t('entries.columns.total')}
            </th>
            {onRemove ? (
              <th scope="col" className={styles.actionsColumn}>
                <span className="sr-only">{t('entries.columns.actions')}</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const out = isOutflow(entry);
            const gross = entry.quantity * entry.price;
            const fee = entry.fee ?? 0;
            const total = out ? gross - fee : gross + fee;

            return (
              <tr key={entry.id}>
                <td data-label={t('entries.columns.date')}>
                  <time dateTime={entry.date} className={styles.date}>
                    {formatters.formatDate(entry.date)}
                  </time>
                </td>
                <td data-label={t('entries.columns.type')}>
                  <span className={cx(styles.badge, out ? styles.outBadge : styles.inBadge)}>
                    <Icon name={out ? 'arrowUpRight' : 'arrowDownRight'} size={12} />
                    {out ? t('entries.outBadge') : t('entries.inBadge')}
                  </span>
                </td>
                {showCode ? (
                  <td data-label={t('entries.columns.asset')}>
                    <span className={styles.asset}>
                      <CurrencyBadge code={entry.code} size="sm" />
                      <strong>{entry.code}</strong>
                    </span>
                  </td>
                ) : null}
                <td className={styles.numeric} data-label={t('entries.columns.quantity')}>
                  {formatters.formatQuantity(entry.quantity)}
                </td>
                <td className={styles.numeric} data-label={t('entries.columns.price')}>
                  {formatters.formatMoney(entry.price, 'BRL')}
                </td>
                <td className={styles.numeric} data-label={t('entries.columns.fee')}>
                  {fee > 0 ? formatters.formatMoney(fee, 'BRL') : '—'}
                </td>
                <td
                  className={cx(styles.numeric, styles.total, out ? styles.outTotal : styles.inTotal)}
                  data-label={t('entries.columns.total')}
                >
                  {out ? '−' : '+'}
                  {formatters.formatMoney(Math.abs(total), 'BRL')}
                </td>
                {onRemove ? (
                  <td className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => onRemove(entry)}
                      title={t('entries.removeEntry')}
                      aria-label={t('entries.removeEntryLabel', {
                        date: formatters.formatDate(entry.date),
                        type: out ? t('entries.outBadge') : t('entries.inBadge'),
                        code: entry.code,
                      })}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

EntriesTable.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['in', 'out']).isRequired,
      quantity: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
      fee: PropTypes.number,
      date: PropTypes.string.isRequired,
      createdAt: PropTypes.string,
    }),
  ),
  showCode: PropTypes.bool,
  onRemove: PropTypes.func,
  empty: PropTypes.node,
};
