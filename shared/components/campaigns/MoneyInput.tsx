'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { currencySymbol, formatAmountText, parseAmountText } from '@/shared/types/money';

/**
 * An amount in the campaign currency (v3 P1). The currency's symbol sits in
 * front and cannot be changed here - the currency is chosen once, on the
 * first step. The form keeps the text as typed; away from the field it is
 * shown grouped the way the currency is written (₹15,00,000, £1,500,000).
 */
export function MoneyInput({
  id,
  value,
  onChange,
  onBlur,
  currency,
  className,
  placeholder,
  testId,
  invalid = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  currency: string | null;
  className?: string;
  placeholder?: string;
  testId?: string;
  invalid?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const symbol = currency ? currencySymbol(currency) : '';
  const amount = parseAmountText(value);
  const shown = !focused && amount !== null ? formatAmountText(amount, currency) : value;

  return (
    <div className="relative">
      {symbol ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground/70"
        >
          {symbol}
        </span>
      ) : null}
      <Input
        id={id}
        data-testid={testId}
        inputMode="decimal"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        aria-label={currency ? `Amount in ${currency}` : undefined}
        disabled={!currency}
        className={cn(className)}
        style={symbol ? { paddingLeft: `calc(${symbol.length}ch + 1.25rem)` } : undefined}
        placeholder={currency ? placeholder : 'Choose the currency on the first step'}
        value={shown}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
