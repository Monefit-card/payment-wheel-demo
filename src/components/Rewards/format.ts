/** `€1,234.56` — `formatEuro` with thousands separators, for savings balances. */
export function eur(amount: number, { sign = false }: { sign?: boolean } = {}): string {
  const body = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = amount < 0 ? '−' : sign ? '+' : '';
  return `${prefix}€${body}`;
}

/** `€1,500` — whole euros, for caps and round figures. */
export function eurWhole(amount: number): string {
  return `€${Math.round(amount).toLocaleString('en-US')}`;
}
