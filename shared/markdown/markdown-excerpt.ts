import { Lexer, type Token } from 'marked';

function plainText(tokens: Token[] | undefined): string {
  return (tokens ?? [])
    .map((token) => {
      if ('tokens' in token && Array.isArray(token.tokens)) {
        return plainText(token.tokens);
      }
      return 'text' in token && typeof token.text === 'string' ? token.text : '';
    })
    .join('');
}

// The first prose paragraph of a markdown document, as plain text. Headings,
// tables and lists are skipped, as are lead-in labels that are only bold text
// ("**Winning Angle**"), so a section previews with what it actually says.
export function markdownExcerpt(markdown: string, maxLength = 280): string | null {
  for (const token of new Lexer({ gfm: true }).lex(markdown)) {
    if (token.type !== 'paragraph') {
      continue;
    }
    const inner = token.tokens ?? [];
    if (inner.length === 1 && inner[0].type === 'strong') {
      continue;
    }
    const text = plainText(inner).replace(/\s+/g, ' ').trim();
    if (!text) {
      continue;
    }
    return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
  }
  return null;
}
