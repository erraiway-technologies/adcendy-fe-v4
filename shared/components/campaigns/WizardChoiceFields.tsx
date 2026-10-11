'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type WizardChoiceOption = { value: string; label: string };

/**
 * Multi-pick chips (v3 P6: age ranges, existing assets, peak seasons). An
 * `exclusiveValue` ("none") clears the others when picked, and is cleared by
 * any other pick.
 */
export function ChipToggleGroup({
  options,
  value,
  onChange,
  testId,
  exclusiveValue,
  columns = 3,
}: {
  options: WizardChoiceOption[];
  value: string[];
  onChange: (next: string[]) => void;
  testId: string;
  exclusiveValue?: string;
  columns?: 2 | 3;
}) {
  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((entry) => entry !== option));
    } else if (option === exclusiveValue) {
      onChange([option]);
    } else {
      onChange([...value.filter((entry) => entry !== exclusiveValue), option]);
    }
  };
  return (
    <div className={cn('grid gap-2', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            data-testid={`${testId}-${option.value}`}
            aria-pressed={selected}
            onClick={() => toggle(option.value)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition',
              'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35',
              selected
                ? 'border-white/55 bg-white/10 text-foreground'
                : 'border-border/70 bg-card/95 text-foreground/85 hover:border-white/45',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded border',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border/80 bg-transparent',
              )}
            >
              {selected ? <Check className="h-3 w-3" /> : null}
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A single pick from a short list, empty until chosen (v3 rule 5). */
export function OptionSelect({
  options,
  value,
  onChange,
  testId,
  placeholder,
  className,
}: {
  options: WizardChoiceOption[];
  value: string | null | undefined;
  onChange: (next: string) => void;
  testId: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <Select onValueChange={onChange} value={value || undefined}>
      <SelectTrigger data-testid={testId} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
