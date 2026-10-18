'use client';

import { SafeMarkdown } from '@/shared/markdown/SafeMarkdown';

export function LegalMarkdown({ markdown, className }: { markdown: string; className?: string }) {
  return <SafeMarkdown markdown={markdown} className={className} />;
}
