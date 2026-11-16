/** Step 20: a whole number of customers, or null; never a guess. */
export function normalizeWholeNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/,/g, '');
  return /^\d+$/.test(text) ? Number(text) : null;
}
