export const formatNumber = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 });

export function formatMoney(value, currency) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export function formatDate(date, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export function formatBrasiliaTime(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}
