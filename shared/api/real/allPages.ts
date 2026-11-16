/**
 * V3-371: a list endpoint answers in pages; a caller that wants the whole
 * list reads every page. Stops when the server says there is no next page, a
 * page comes back empty, or the page limit is reached (never loops forever).
 */
export async function readAllPages<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; hasNext: boolean }>,
  maxPages = 50,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const { items, hasNext } = await fetchPage(page);
    all.push(...items);
    if (!hasNext || items.length === 0) break;
  }
  return all;
}
