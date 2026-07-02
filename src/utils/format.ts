export function formatPercent(percent: number): string {
  if (isNaN(percent) || percent === null || percent === undefined) return '0%';
  return `${percent}%`;
}

export function cleanInput(val: string): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/\s+/g, ' ');
}

export function formatPurity(purity: string): string {
  if (!purity) return '';
  return purity.toUpperCase().trim();
}
