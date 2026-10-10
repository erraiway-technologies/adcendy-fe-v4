/**
 * Money in the wizard (v3 P1): an amount the client types, in the campaign
 * currency. The form keeps the amount as the text typed; the backend
 * converts it to US dollars and keeps the rate, so nothing here converts.
 */

export type MoneyAnswer = { amount: number; currency: string };

/** Indian grouping (1,00,000) for rupees; Western grouping otherwise. */
export function moneyLocale(currency: string | null | undefined): string {
  return currency === 'INR' ? 'en-IN' : 'en-GB';
}

/** "£", "₹", "US$" - from the platform, so no table to keep. */
export function currencySymbol(currency: string): string {
  try {
    const part = new Intl.NumberFormat(moneyLocale(currency), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((entry) => entry.type === 'currency');
    return part?.value ?? currency;
  } catch {
    return currency;
  }
}

/**
 * The amount in typed text: "2,500", "2500.50", " 1,00,000 ". Null when the
 * text is empty or not an amount; a negative amount is not one.
 */
export function parseAmountText(text: string | null | undefined): number | null {
  const cleaned = (text ?? '').replace(/[\s,]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

/** An amount with the currency's grouping and no symbol: "1,00,000". */
export function formatAmountText(amount: number, currency: string | null | undefined): string {
  return new Intl.NumberFormat(moneyLocale(currency), { maximumFractionDigits: 2 }).format(amount);
}

/** An amount as the client reads it: "£2,500". */
export function formatMoney(money: Partial<MoneyAnswer> | null | undefined): string | null {
  if (!money || typeof money.amount !== 'number' || !money.currency) {
    return null;
  }
  return `${currencySymbol(money.currency)}${formatAmountText(money.amount, money.currency)}`;
}

/** The answer to send, or undefined when nothing (or no amount) was typed. */
export function toMoneyAnswer(
  text: string | null | undefined,
  currency: string | null | undefined,
): MoneyAnswer | undefined {
  const amount = parseAmountText(text);
  return amount === null || !currency ? undefined : { amount, currency };
}

/** A saved answer ({ amount, currency, ... }) as the text the form edits. */
export function amountTextFromSaved(value: unknown): string {
  if (value && typeof value === 'object' && 'amount' in value) {
    const amount = (value as { amount: unknown }).amount;
    return typeof amount === 'number' && Number.isFinite(amount) ? String(amount) : '';
  }
  return '';
}

/** A saved answer's currency, when it has one. */
export function currencyFromSaved(value: unknown): string | null {
  if (value && typeof value === 'object' && 'currency' in value) {
    const currency = (value as { currency: unknown }).currency;
    return typeof currency === 'string' && /^[A-Z]{3}$/.test(currency) ? currency : null;
  }
  return null;
}
