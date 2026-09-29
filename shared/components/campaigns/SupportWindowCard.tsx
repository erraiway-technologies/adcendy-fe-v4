'use client';

import { format } from 'date-fns';
import { CalendarClock, ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCampaignDocuments } from '@/hooks/useCampaignDocuments';
import { BUSINESS_TERMS as TERMS } from '@/shared/marketing/business-terms';
import { CLIENT_BOOKING_LINKS, supportWindow } from '@/shared/support/support-window';

const dateLabel = (date: Date) => format(date, 'd MMMM yyyy');

/**
 * The support that comes with a delivered strategy (Terms of Service, section
 * 27): how to reach us, the revision deadline, and the walkthrough call - the
 * booking button only while the 30-day window is open. One campaign is one
 * market, so one walkthrough call per campaign.
 */
export function SupportWindowCard({ campaignId }: { campaignId: string }) {
  const documentsQuery = useCampaignDocuments(campaignId);
  const support = documentsQuery.data ? supportWindow(documentsQuery.data.items) : null;
  if (!support) return null;

  const supportEmail = (
    <a className="text-primary hover:underline" href={`mailto:${TERMS.contact.support}`}>
      {TERMS.contact.support}
    </a>
  );

  if (!support.open) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-space-grotesk text-lg">Support</CardTitle>
          <CardDescription>
            The {TERMS.support.windowDays}-day support window for this strategy ended on{' '}
            {dateLabel(support.endsAt)}. For your account, billing or data, write to {supportEmail}.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-space-grotesk text-lg">Your support, until {dateLabel(support.endsAt)}</CardTitle>
        <CardDescription>
          Delivered {dateLabel(support.deliveredAt)}. Everything below is included for{' '}
          {TERMS.support.windowDays} days.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarClock className="h-4 w-4" />
            Walkthrough call
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            One {TERMS.calls.walkthroughCallMinutes}-minute video call to go through this strategy.
            Book at least 48 hours ahead and add your questions when you book; we send a written
            summary afterwards.
          </p>
          <Button asChild className="w-full justify-between">
            <a href={CLIENT_BOOKING_LINKS.walkthroughCall} target="_blank" rel="noopener noreferrer">
              Book your walkthrough call
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4" />
            Questions and your revision
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Write to {supportEmail} with any question; we answer in writing within{' '}
            {TERMS.support.answerWithin}.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {support.revisionOpen
              ? `Your revision round: ask for it in writing by ${dateLabel(support.revisionRequestBy)}, and we deliver it within ${TERMS.support.revisionBusinessDays} business days.`
              : `The window to request your revision round closed on ${dateLabel(support.revisionRequestBy)}.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
