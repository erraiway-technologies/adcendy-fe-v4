'use client';

import { useMemo } from 'react';
import { Marked } from 'marked';

// Markdown arrives from the API (policy text, generated strategy sections).
// Raw HTML in it is dropped and link targets are limited to http(s), mailto
// and relative paths, so the rendered page can only ever contain
// markdown-produced markup.
const safeMarkdown = new Marked({
  gfm: true,
  async: false,
  renderer: {
    html() {
      return '';
    },
  },
  walkTokens(token) {
    if ((token.type === 'link' || token.type === 'image') && !/^(https?:|mailto:|\/(?!\/)|#)/i.test(token.href)) {
      token.href = '#';
    }
  },
});

export function SafeMarkdown({ markdown, className }: { markdown: string; className?: string }) {
  const html = useMemo(() => safeMarkdown.parse(markdown) as string, [markdown]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
