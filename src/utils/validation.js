export const MAX_AMOUNT = 1_000_000_000;

function isLatinCommaLocale(locale) {
  return /^(pt|es)(-|$)/i.test(locale ?? '');
}

/**
 * Aceita "1.234,56" (pt/es) ou "1,234.56" (en) e devolve um número finito > 0.
 * Retorna `errorKey` para a camada de i18n traduzir a mensagem.
 */
export function parseAmount(rawValue, locale = 'pt-BR') {
  const text = String(rawValue ?? '').trim().replace(/\s/g, '');
  if (!text) return { value: null, errorKey: 'required' };

  const normalized = isLatinCommaLocale(locale)
    ? text.replace(/\./g, '').replace(',', '.')
    : text.replace(/,/g, '');

  if (!/^\d*\.?\d+$/.test(normalized)) return { value: null, errorKey: 'invalid' };

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return { value: null, errorKey: 'invalid' };
  if (value > MAX_AMOUNT) return { value: null, errorKey: 'tooLarge' };

  return { value, errorKey: null };
}

/** Formata o valor digitado para exibição enquanto o usuário digita (sem forçar máscara). */
export function sanitizeAmountInput(rawValue) {
  return String(rawValue ?? '').replace(/[^\d.,]/g, '').slice(0, 18);
}
