const EMPTY = '—';

function safeLocale(locale) {
  return typeof locale === 'string' && locale.length > 0 ? locale : 'pt-BR';
}

function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Formatação centralizada por idioma (Intl).
 * Criado uma vez por locale no I18nProvider — nada de estado global mutável.
 */
export function createFormatters(locale) {
  const safe = safeLocale(locale);

  const moneyCache = new Map();
  const rateFormatters = [2, 4, 6].map(
    (digits) =>
      new Intl.NumberFormat(safe, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }),
  );

  const integer = new Intl.NumberFormat(safe, { maximumFractionDigits: 0 });

  const percent = new Intl.NumberFormat(safe, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  });

  const longDate = new Intl.DateTimeFormat(safe, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const shortDate = new Intl.DateTimeFormat(safe, {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });

  let displayNames = null;
  try {
    displayNames = new Intl.DisplayNames(safe, { type: 'currency' });
  } catch {
    displayNames = null;
  }

  function parseIso(isoDate) {
    if (!isoDate) return null;
    const date = new Date(`${isoDate}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return {
    /** Valor monetário com 2 casas (ex.: R$ 1.000,00). */
    formatMoney(value, currency) {
      if (!Number.isFinite(value) || !currency) return EMPTY;
      if (!moneyCache.has(currency)) {
        moneyCache.set(
          currency,
          new Intl.NumberFormat(safe, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        );
      }
      return moneyCache.get(currency).format(value);
    },

    /** Taxa de câmbio: mais casas quando o valor é pequeno (0,18701). */
    formatRate(value) {
      if (!Number.isFinite(value)) return EMPTY;
      const magnitude = Math.abs(value);
      const digits = magnitude >= 100 ? 2 : magnitude >= 1 ? 4 : 6;
      const formatter = digits === 2 ? rateFormatters[0] : digits === 4 ? rateFormatters[1] : rateFormatters[2];
      return formatter.format(value);
    },

    /** Variação percentual já em pontos percentuais (ex.: -1,23%). */
    formatPercent(value) {
      if (!Number.isFinite(value)) return EMPTY;
      return percent.format(value / 100);
    },

    formatNumber(value) {
      if (!Number.isFinite(value)) return EMPTY;
      return integer.format(value);
    },

    formatDate(isoDate) {
      const date = parseIso(isoDate);
      return date ? longDate.format(date) : EMPTY;
    },

    formatShortDate(isoDate) {
      const date = parseIso(isoDate);
      return date ? shortDate.format(date) : EMPTY;
    },

    /** Nome localizado da moeda via ISO 4217; usa o nome da API como fallback. */
    currencyName(code, fallbackName) {
      if (!code) return fallbackName ?? EMPTY;
      if (displayNames) {
        try {
          const localized = displayNames.of(code);
          if (localized && localized !== code) return capitalizeFirst(localized);
        } catch {
          /* código desconhecido — cai no fallback */
        }
      }
      return fallbackName ?? code;
    },
  };
}
