'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  buildOrderValueHoldAnswer,
  ORDER_VALUE_TEXT_MAX_LENGTH,
  type OrderValueHoldAnswer,
  type OrderValueHoldModel,
} from './orderValueHold';

type OrderValueHoldFormProps = {
  model: OrderValueHoldModel;
  /** The task no longer takes an answer. */
  readOnly: boolean;
  pending: boolean;
  /** Why the backend refused the last answer, in its own words. */
  refusal: string | null;
  onSubmit: (answer: OrderValueHoldAnswer) => void;
};

/**
 * The order-value hold (V3-266): the intake's order value does not fit the
 * client's price range or the market's currency. The reviewer confirms it as
 * given or corrects it to the order value in the market's currency, with the
 * reason.
 */
export function OrderValueHoldForm({ model, readOnly, pending, refusal, onSubmit }: OrderValueHoldFormProps) {
  const [decision, setDecision] = useState<'confirm' | 'correct' | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const disabled = readOnly || pending;

  const submit = () => {
    const built = buildOrderValueHoldAnswer({ decision, amount, reason });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setError(null);
    onSubmit(built.answer);
  };

  return (
    <Card className="border-white/14 bg-card">
      <CardHeader>
        <CardTitle>Check The Order Value</CardTitle>
        <CardDescription>
          The order value on the intake for {model.clientName ?? 'this client'} does not fit the client&apos;s own price
          range or the market&apos;s currency, and every money figure in the plan rests on it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="space-y-2 rounded-xl border border-border p-3">
          {model.diagnoses.map((diagnosis) => (
            <li key={diagnosis} className="text-sm text-foreground">
              {diagnosis}
            </li>
          ))}
        </ul>
        {model.orderValue || model.priceRange ? (
          <p className="text-xs text-muted-foreground">
            On the intake: order value {model.orderValue ?? 'not given'}, price range{' '}
            {model.priceRange?.replace('_', ' to ') ?? 'not given'}
            {model.marketCurrency ? ` (${model.marketCurrency})` : ''}.
          </p>
        ) : null}

        <RadioGroup
          value={decision ?? undefined}
          onValueChange={(value) => {
            setError(null);
            setDecision(value as 'confirm' | 'correct');
          }}
          disabled={disabled}
          className="gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="confirm" id="order-value-confirm" />
            <Label htmlFor="order-value-confirm">The figure is right as given</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="correct" id="order-value-correct" />
            <Label htmlFor="order-value-correct">Correct the order value</Label>
          </div>
        </RadioGroup>

        {decision === 'correct' ? (
          <div className="space-y-1.5">
            <Label htmlFor="order-value-amount">
              The order value{model.marketCurrency ? `, in ${model.marketCurrency}` : ''}
            </Label>
            <Input
              id="order-value-amount"
              inputMode="decimal"
              value={amount}
              disabled={disabled}
              placeholder="55"
              onChange={(event) => {
                setError(null);
                setAmount(event.target.value);
              }}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="order-value-reason">Reason</Label>
          <Textarea
            id="order-value-reason"
            value={reason}
            disabled={disabled}
            maxLength={ORDER_VALUE_TEXT_MAX_LENGTH}
            placeholder="Why the figure is right, or where the correct one comes from."
            onChange={(event) => {
              setError(null);
              setReason(event.target.value);
            }}
          />
        </div>

        {refusal ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm font-semibold text-destructive">The answer was refused</p>
            <p className="mt-1 text-sm text-foreground">{refusal}</p>
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            A correction is written into this intake as the order value. Research then starts again from client context
            assembly.
          </p>
          <Button type="button" disabled={disabled} onClick={submit}>
            {pending ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
