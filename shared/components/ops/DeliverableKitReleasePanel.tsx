'use client';

import { useState } from 'react';
import { Download, FileWarning, Send } from 'lucide-react';
import {
  useAdminDeliverableKitReview,
  useReleaseAdminDeliverableKit,
} from '@/hooks/useOpsV2';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/shared/api/errors';
import { opsV2Repository } from '@/shared/api/repositories';
import type {
  DeliverableKitFileV2,
  DeliverableKitReleaseReviewV2,
} from '@/shared/types/opsV2';
import { downloadFileFromUrl, resolveDownloadFilename, triggerBlobDownload } from '@/lib/download';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatOpsDateTime } from './opsUtils';

interface DeliverableKitReleasePanelProps {
  runId: string | null;
}

type KitDocumentV2 = DeliverableKitReleaseReviewV2['documents'][number];

/** V3-448: how each stored format is named on its button. */
const FORMAT_LABELS_V2: Record<DeliverableKitFileV2['format'], string> = {
  pdf: 'PDF',
  markdown: 'Markdown',
  notion: 'Notion',
  csv: 'CSV',
};

/**
 * The release gate (V3-285). An assembled kit is not sent to the client: it
 * waits here with its kit check findings, and goes out only when an admin has
 * read them and releases it. The sheet is shown before the button on purpose -
 * a finding nobody reads before the client does is no check.
 */
export function DeliverableKitReleasePanel({ runId }: DeliverableKitReleasePanelProps) {
  const reviewQuery = useAdminDeliverableKitReview(runId);
  const releaseMutation = useReleaseAdminDeliverableKit(runId);
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const review = reviewQuery.data;

  if (!runId) {
    return null;
  }

  // V3-448: the kit's files, released or not, so it can be read before release.
  const handleFileDownload = async (document: KitDocumentV2, file: DeliverableKitFileV2) => {
    const key = `${document.deliverableKey}:${document.market}:${file.format}`;
    setDownloading(key);
    try {
      const link = await opsV2Repository.getAdminDeliverableKitFileDownload(runId, {
        deliverableKey: document.deliverableKey,
        market: document.market,
        format: file.format,
      });
      downloadFileFromUrl(new URL(link.url), link.fileName);
    } catch (error) {
      toast({
        title: 'The file did not download',
        description: error instanceof ApiError ? error.message : 'Try again after reloading the page.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleArchiveDownload = async () => {
    setDownloading('archive');
    try {
      const archive = await opsV2Repository.downloadAdminDeliverableKitArchive(runId);
      triggerBlobDownload(
        archive.blob,
        resolveDownloadFilename(archive.filename, `kit-${runId}`, archive.contentType ?? 'application/zip'),
      );
    } catch (error) {
      toast({
        title: 'The kit did not download',
        description: error instanceof ApiError ? error.message : 'Try again after reloading the page.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleRelease = async () => {
    try {
      const released = await releaseMutation.mutateAsync(review?.kitGenerationId ?? null);
      setIsConfirmOpen(false);
      toast({
        title: 'Kit released',
        description: `${released.publishedDocumentCount} documents published${released.ownerNotified ? ', and the owner was emailed' : ''}.`,
      });
    } catch (error) {
      toast({
        title: 'The kit was not released',
        description: error instanceof ApiError ? error.message : 'Try again after reloading the sheet.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileWarning className="h-4 w-4" />
          Kit release
        </CardTitle>
        <CardDescription>
          An assembled kit waits here. Read its findings, then release it to the campaign owner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviewQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading the kit…</p>
        ) : reviewQuery.error || !review ? (
          <p className="text-sm text-destructive">The kit’s release state could not be loaded.</p>
        ) : review.state === 'none' ? (
          <p className="text-sm text-muted-foreground">No kit has been assembled for the latest run.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span className="font-medium">
                {review.state === 'released'
                  ? `Released ${review.releasedAt ? formatOpsDateTime(review.releasedAt) : ''}`
                  : 'Awaiting release'}
              </span>
              <span className="text-muted-foreground">
                {review.findingCount === 0
                  ? 'No findings'
                  : `${review.findingCount} finding${review.findingCount === 1 ? '' : 's'}`}
                {review.notCheckableCount > 0 ? `, ${review.notCheckableCount} not checked` : ''}
              </span>
              <span className="text-muted-foreground">
                {review.documents.length} document{review.documents.length === 1 ? '' : 's'}
                {review.assembledAt ? `, assembled ${formatOpsDateTime(review.assembledAt)}` : ''}
              </span>
            </div>
            {review.documents.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Documents</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleArchiveDownload()}
                    disabled={downloading !== null}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {downloading === 'archive' ? 'Preparing…' : 'Download all (.zip)'}
                  </Button>
                </div>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {review.documents.map((document) => (
                    <li
                      key={`${document.deliverableKey}:${document.market}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                    >
                      <span className="text-sm">
                        {document.title}
                        <span className="ml-2 text-xs text-muted-foreground">{document.market}</span>
                      </span>
                      <span className="flex flex-wrap gap-1">
                        {document.files.map((file) => {
                          const key = `${document.deliverableKey}:${document.market}:${file.format}`;
                          return (
                            <Button
                              key={file.format}
                              variant="ghost"
                              size="sm"
                              aria-label={`Download ${document.title} as ${FORMAT_LABELS_V2[file.format]}`}
                              onClick={() => void handleFileDownload(document, file)}
                              disabled={downloading !== null}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              {downloading === key ? '…' : FORMAT_LABELS_V2[file.format]}
                            </Button>
                          );
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <pre
              aria-label="Kit check findings"
              className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-4 text-xs leading-relaxed"
            >
              {review.sheetMarkdown}
            </pre>
            {review.state === 'awaiting_release' ? (
              <Button
                onClick={() => setIsConfirmOpen(true)}
                disabled={releaseMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Release to client
              </Button>
            ) : null}
          </>
        )}
      </CardContent>

      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!releaseMutation.isPending) {
            setIsConfirmOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release this kit to the client?</DialogTitle>
            <DialogDescription>
              Its documents are published to the campaign owner, and the delivery email goes out if the kit
              asked for one. You read {review?.findingCount ?? 0} finding
              {review?.findingCount === 1 ? '' : 's'} above. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={releaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleRelease()} disabled={releaseMutation.isPending}>
              {releaseMutation.isPending ? 'Releasing…' : 'Release to client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
