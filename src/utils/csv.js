const DELIMITER = ';';
const LINE_BREAK = '\r\n';
const BOM = '\uFEFF';

function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  // RFC 4180: aspas duplicadas e campo entre aspas quando há separador, quebra ou aspas.
  return /["\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Gera CSV com BOM (Excel abre em UTF-8) e ';' como separador (padrão pt-BR).
 * Números vão com ponto decimal e datas em ISO — dados crus, não formatados para exibição.
 */
export function toCsv(columns, rows) {
  const header = columns.map((column) => escapeCell(column.label)).join(DELIMITER);
  const lines = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(DELIMITER),
  );

  return `${BOM}${header}${LINE_BREAK}${lines.join(LINE_BREAK)}${LINE_BREAK}`;
}

export function buildCsvFilename(prefix, isoDate) {
  return `${prefix}-${isoDate || 'dados'}.csv`;
}

/** Dispara o download no navegador sem bibliotecas externas. */
export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoga depois do clique para o navegador concluir o download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
