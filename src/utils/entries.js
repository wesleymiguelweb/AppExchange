import { parseAmount, parseNonNegative } from './validation.js';

/**
 * Preço de 1 unidade de `code` em BRL, a partir das taxas relativas à base.
 *
 * A Frankfurter expressa as taxas como `1 base = rate code`. Valorizando tudo
 * na moeda base:
 *   cotação(code) = 1 base / rate code     (1 unidade de `code` em base)
 *   cotação(BRL)  = 1 base / rate BRL      (1 real em base)
 *   preço em BRL  = cotação(code) / cotação(BRL)
 *
 * Vale para qualquer base configurada — com base BRL o resultado é o usual
 * `1 / rate`. BRL custa exatamente 1 BRL e não aparece no mapa de taxas.
 */
export function priceInBrl(code, baseCode, rates) {
  if (!code) return null;
  if (code === 'BRL') return 1;

  const codeUnitInBase = code === baseCode ? 1 : rates?.[code] > 0 ? 1 / rates[code] : null;
  const brlUnitInBase = baseCode === 'BRL' ? 1 : rates?.BRL > 0 ? 1 / rates.BRL : null;

  if (codeUnitInBase === null || brlUnitInBase === null || brlUnitInBase === 0) return null;
  return codeUnitInBase / brlUnitInBase;
}

/** Uma saída reduz a posição; qualquer outro tipo é tratado como entrada. */
export function isOutflow(entry) {
  // `sell` é aceito apenas na migração do modelo antigo (v2).
  return entry?.type === 'out' || entry?.type === 'sell';
}

/**
 * Entrada do formulário → movimentação validada.
 *
 * O custo (`price`) é sempre registrado em BRL por unidade, independentemente
 * da moeda base escolhida: assim trocar a base não corrompe o histórico.
 *
 * `priceRaw` vazio significa "usar a cotação atual" — e a cotação fica gravada
 * na movimentação, formando um retrato do momento do registro.
 */
export function parseEntryInput({ type, quantityRaw, priceRaw, feeRaw, date, referencePrice }, locale) {
  const errors = {};
  const quantity = parseAmount(quantityRaw, locale);
  const fee = feeRaw === '' || feeRaw === undefined ? { value: 0 } : parseNonNegative(feeRaw, locale);

  if (type !== 'in' && type !== 'out') errors.type = 'type';
  if (quantity.value === null) errors.quantity = 'quantity';
  if (fee.value === null) errors.fee = 'fee';

  let price = null;
  if (priceRaw === '' || priceRaw === undefined) {
    if (!Number.isFinite(referencePrice) || referencePrice <= 0) errors.price = 'missingRate';
    else price = referencePrice;
  } else {
    const parsedPrice = parseAmount(priceRaw, locale);
    if (parsedPrice.value === null) errors.price = 'price';
    else price = parsedPrice.value;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ''))) errors.date = 'date';

  if (Object.keys(errors).length > 0) return { errors };

  return {
    entry: {
      type,
      quantity: quantity.value,
      price,
      priceSource: priceRaw === '' || priceRaw === undefined ? 'market' : 'manual',
      fee: fee.value ?? 0,
      date,
    },
  };
}

/**
 * Recalcula quantidade e custo médio aplicando as movimentações em ordem
 * cronológica. Saídas reduzem a posição mantendo o custo médio das unidades
 * que restaram; uma nova entrada após zerar a carteira inicia outro ciclo.
 */
export function summarizeEntries(entries) {
  const chronological = [...(entries ?? [])].sort((a, b) => {
    if (a.date === b.date) return String(a.createdAt).localeCompare(String(b.createdAt));
    return a.date < b.date ? -1 : 1;
  });

  let quantity = 0;
  let cost = 0;

  chronological.forEach((entry) => {
    if (!isOutflow(entry)) {
      quantity += entry.quantity;
      cost += entry.quantity * entry.price + (entry.fee ?? 0);
      return;
    }

    const removed = Math.min(entry.quantity, quantity);
    const unitCost = quantity > 0 ? cost / quantity : entry.price;
    quantity -= removed;
    cost = Math.max(cost - removed * unitCost, 0);
  });

  return {
    quantity,
    cost,
    avgCost: quantity > 1e-9 ? cost / quantity : null,
  };
}

/** Quantidade acumulada até uma certa data (movimentações anteriores à janela). */
export function quantityBefore(entries, date) {
  return (entries ?? []).reduce((total, entry) => {
    if (entry.date >= date) return total;
    return total + (isOutflow(entry) ? -entry.quantity : entry.quantity);
  }, 0);
}

/** Lista de movimentações ordenada da mais recente para a mais antiga. */
export function sortEntriesDesc(entries) {
  return [...(entries ?? [])].sort((a, b) => {
    if (a.date === b.date) return String(b.createdAt).localeCompare(String(a.createdAt));
    return a.date < b.date ? 1 : -1;
  });
}

/** Movimentações no intervalo [start, end]; datas ISO são comparáveis como texto. */
export function entriesBetween(entries, start, end) {
  return (entries ?? []).filter(
    (entry) => (!start || entry.date >= start) && (!end || entry.date <= end),
  );
}

/** Total de unidades que entraram menos as que saíram. */
export function sumQuantity(entries) {
  return (entries ?? []).reduce(
    (total, entry) => total + (isOutflow(entry) ? -entry.quantity : entry.quantity),
    0,
  );
}

/** Total aportado (entradas) ou resgatado (saídas) em BRL, incluindo taxas. */
export function sumBrl(entries) {
  return (entries ?? []).reduce((total, entry) => {
    const gross = entry.quantity * entry.price;
    const fee = entry.fee ?? 0;
    return total + (isOutflow(entry) ? gross - fee : gross + fee);
  }, 0);
}

/** Soma dias a uma data ISO (AAAA-MM-DD). */
export function shiftIsoDate(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
