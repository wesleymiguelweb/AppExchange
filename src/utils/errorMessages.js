/**
 * Traduz o erro normalizado da camada de rede em chave de i18n + variáveis.
 * Mantém a mensagem exibida consistente entre conversor, gráfico e tabela.
 */
export function describeError(error) {
  if (!error) return null;

  switch (error.type) {
    case 'network':
      return { key: 'errors.network', vars: {} };
    case 'http':
      return { key: 'errors.http', vars: { status: error.status ?? '—' } };
    case 'invalid':
      return { key: 'errors.invalid', vars: {} };
    default:
      return { key: 'errors.generic', vars: {} };
  }
}
