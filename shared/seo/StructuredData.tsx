/**
 * Schema.org data for search engines, as JSON-LD in the server's HTML. `<` is
 * escaped so no value can close the script element.
 */
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll('<', '\u003c') }}
    />
  );
}
