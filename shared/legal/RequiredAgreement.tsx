'use client';

import { Fragment } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { separatorsForList } from './legal-flow-utils';

export type RequiredAgreementItem = { key: string; label: string; href: string | null };

function LinkedList({ items }: { items: RequiredAgreementItem[] }) {
  const separators = separatorsForList(items.length);
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {separators[index]}
          {item.href ? (
            <a className="text-primary hover:underline" href={item.href} target="_blank" rel="noreferrer">
              {item.label}
            </a>
          ) : (
            item.label
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * Every required document and consent of a flow, agreed to with one tick.
 * Each one is linked and opens in a new tab, so the form is kept while it is
 * read. Optional consents are never part of this box.
 */
export function RequiredAgreement({
  documents,
  consents,
  consentPurpose,
  checked,
  onCheckedChange,
  testId,
}: {
  documents: RequiredAgreementItem[];
  consents: RequiredAgreementItem[];
  /** Why the consents are needed, printed after them. */
  consentPurpose?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  testId?: string;
}) {
  if (documents.length === 0 && consents.length === 0) return null;
  return (
    <label data-testid={testId} className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-3">
      <Checkbox checked={checked} onCheckedChange={(next) => onCheckedChange(next === true)} className="mt-0.5" />
      <span className="text-sm text-foreground/90">
        {documents.length > 0 ? (
          <>
            I agree to the <LinkedList items={documents} />
          </>
        ) : null}
        {consents.length > 0 ? (
          <>
            {documents.length > 0 ? ', and consent to ' : 'I consent to '}
            <LinkedList items={consents} />
            {consentPurpose ? ` - ${consentPurpose}` : null}
          </>
        ) : null}
        .
      </span>
    </label>
  );
}
