'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { billingRepository } from '@/shared/api/repositories';
import { queryKeys } from '@/shared/api/queryKeys';
import { formatMinorAmount } from '@/shared/payments/razorpay';
import { billingDocumentLabel } from '@/shared/payments/invoice-billing';
import type { BillingDocument } from '@/shared/types/billing';

/**
 * R-14: the buyer's invoices and credit notes, each downloadable as a PDF.
 * A link is asked for at the moment of the click; it lasts minutes.
 */
export function InvoicesCard() {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const documentsQuery = useQuery({
    queryKey: queryKeys.billing.documents(),
    queryFn: () => billingRepository.listDocuments(),
    refetchOnWindowFocus: false,
  });
  const documents = documentsQuery.data ?? [];

  const download = async (document: BillingDocument) => {
    setDownloadError(null);
    setDownloadingId(document.documentId);
    try {
      const link = await billingRepository.getDocumentLink(document.documentId);
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } catch {
      setDownloadError(`Could not download ${document.number}. Please try again.`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Card id="invoices">
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documentsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading invoices…</p> : null}
        {documentsQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>Could not load your invoices.</AlertDescription>
          </Alert>
        ) : null}
        {documentsQuery.isSuccess && documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet. Your first one appears after your first payment.</p>
        ) : null}
        {documents.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border" data-testid="invoice-list">
            {documents.map((document) => (
              <li key={document.documentId} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{billingDocumentLabel(document)}</p>
                  <p className="text-xs text-muted-foreground">
                    {document.issuedOn} ·{' '}
                    {formatMinorAmount({ amountMinor: document.totalMinor, currency: document.currency })}
                    {document.taxMinor > 0
                      ? ` incl. ${formatMinorAmount({ amountMinor: document.taxMinor, currency: document.currency })} GST`
                      : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void download(document)}
                  disabled={downloadingId === document.documentId}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  {downloadingId === document.documentId ? 'Preparing…' : 'PDF'}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {downloadError ? <p className="text-sm text-destructive">{downloadError}</p> : null}
      </CardContent>
    </Card>
  );
}
