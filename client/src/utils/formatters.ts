/**
 * Formatea un monto numérico a formato de moneda con símbolo quetzal (GTQ)
 */
export function formatCurrency(amount: number = 0, currency: string = 'GTQ', locale: string = 'es-GT'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Formatea de manera segura una fecha (Date, string ISO o nula) a formato YYYY-MM-DD
 */
export function formatDate(date: string | Date | null | undefined, fallback: string = ''): string {
  if (!date) return fallback;
  if (typeof date === 'string') return date.split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return String(date);
}
