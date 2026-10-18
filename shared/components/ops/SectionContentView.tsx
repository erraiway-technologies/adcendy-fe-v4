'use client';

import { SafeMarkdown } from '@/shared/markdown/SafeMarkdown';
import { toJsonPreview } from '@/shared/components/ops/opsUtils';

// A generated section's content is the markdown the report is built from, so
// it is rendered as such; anything that is not a string is shown as JSON.
export function SectionContentView({ content }: { content: unknown }) {
  if (typeof content === 'string' && content.trim().length > 0) {
    return (
      <SafeMarkdown
        markdown={content}
        className="markdown-prose max-h-[560px] overflow-auto rounded-md border border-border bg-background p-4"
      />
    );
  }

  return (
    <pre className="max-h-[420px] overflow-auto rounded-md border border-border bg-background p-3 text-xs">
      {toJsonPreview(content)}
    </pre>
  );
}
