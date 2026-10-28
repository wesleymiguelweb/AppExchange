export function exportConversionCsv({ date, base, quote, rate, amount, converted }) {
  // Cada linha do CSV é uma matriz: primeiro o cabeçalho, depois os valores da conversão.
  const rows = [
    ['data', 'moeda_base', 'moeda_destino', 'taxa', 'valor_base', 'valor_convertido'],
    [date, base, quote, rate, amount, converted.toFixed(4)],
  ];
  // BOM UTF-8 e separador ; melhoram a abertura em planilhas com configuração regional pt-BR.
  // Aspas internas são duplicadas para preservar campos CSV válidos.
  const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\r\n')}`;
  // Blob + URL temporária geram o arquivo no navegador sem biblioteca externa.
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `cambio-${base}-${quote}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoga a URL depois do início do download para liberar a memória do navegador.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
