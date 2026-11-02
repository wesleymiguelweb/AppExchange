/** Junta classes condicionalmente sem dependências externas. */
export function cx(...values) {
  return values.filter(Boolean).join(' ');
}
