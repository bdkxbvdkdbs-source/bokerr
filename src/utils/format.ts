export function formatSYP(amount: number): string {
  return new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 0 }).format(amount);
}

export function syp(amount: number): string {
  return `${formatSYP(amount)} ل.س`;
}
