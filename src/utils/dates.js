const DAY_IN_MS = 86_400_000;

/** Data de hoje em UTC no formato ISO (YYYY-MM-DD). */
export function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** Soma dias em UTC — evita o deslocamento de fuso ao gerar as janelas da API. */
export function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/**
 * Janela fechada com `days` dias de calendário: "7" devolve exatamente 7 datas
 * (hoje e os 6 dias anteriores), para o rótulo do período bater com o intervalo.
 */
export function getPeriodRange(period, today = todayIso()) {
  const days = Math.max(Number(period?.days) || 0, 1);
  return {
    start: addDaysIso(today, -(days - 1)),
    end: today,
  };
}

export function daysBetweenIso(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  return Math.round((end - start) / DAY_IN_MS);
}
