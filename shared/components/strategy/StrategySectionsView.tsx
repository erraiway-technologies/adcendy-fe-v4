'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SafeMarkdown } from '@/shared/markdown/SafeMarkdown';
import type { ApprovedStrategySection, StrategySectionLike } from './approved-strategy-sections';

// Strategy sections as the deliverables state them: the section markdown,
// with a numbered index beside it for jumping between sections.
export function StrategySectionsView({
  sections,
}: {
  sections: ApprovedStrategySection<StrategySectionLike>[];
}) {
  const showMarkets = new Set(sections.map((section) => section.marketId).filter(Boolean)).size > 1;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <nav className="lg:col-span-1" aria-label="Strategy sections">
        <div className="sticky top-20 space-y-1">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Sections</h2>
          {sections.map((section, index) => (
            <a
              key={section.sectionReviewTaskId}
              href={`#section-${section.sectionReviewTaskId}`}
              className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <span className="w-5 shrink-0 text-right tabular-nums">{index + 1}.</span>
              <span>
                {section.title}
                {showMarkets && section.marketId ? ` (${section.marketId})` : ''}
              </span>
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-4 lg:col-span-3">
        {sections.map((section) => (
          <Card
            key={section.sectionReviewTaskId}
            id={`section-${section.sectionReviewTaskId}`}
            className="scroll-mt-24 border border-border bg-card p-6"
          >
            {showMarkets && section.marketId && (
              <Badge variant="outline" className="mb-3">
                {section.marketId}
              </Badge>
            )}
            <SafeMarkdown markdown={section.content} className="markdown-prose" />
          </Card>
        ))}
      </div>
    </div>
  );
}
