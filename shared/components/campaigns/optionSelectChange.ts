/**
 * A dropdown never clears its own value (V3-369, 2026-11-15).
 *
 * Radix Select keeps a hidden native select for forms. When a saved answer is
 * set before the dropdown's options exist, the native select cannot hold it,
 * sends a change with an empty value, and the saved answer was cleared - the
 * wizard's step 2 lost its price position this way. No option in our lists
 * has an empty value, so an empty change is never a choice and is ignored.
 *
 * Pure, no imports, so `node --test` can run it directly.
 */
export function optionSelectChange(next: string, onChange: (value: string) => void): void {
  if (next.length > 0) {
    onChange(next);
  }
}
