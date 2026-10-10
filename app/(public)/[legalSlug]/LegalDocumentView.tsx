'use client';

import { notFound } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { legalRepository } from '@/shared/api/repositories';
import { queryKeys } from '@/shared/api/queryKeys';
import { LegalMarkdown } from '@/shared/legal/LegalMarkdown';

const LEGAL_PATH_PATTERN = /^(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/;

/**
 * A published policy or consent page. Only the paths in LEGAL_PAGES and
 * CONSENT_PAGES get here (their page.tsx 404s the rest on the server); this
 * shows whatever the Backend has active at the path, and 404s if the Backend
 * does not publish it.
 */
export function LegalDocumentView({ path }: { path: string }) {
  const validSlug = LEGAL_PATH_PATTERN.test(path);

  const documentQuery = useQuery({
    queryKey: queryKeys.legal.documentByPath(path),
    queryFn: () => legalRepository.getPublicDocumentByPath(path),
    enabled: validSlug,
    refetchOnWindowFocus: false,
  });

  if (!validSlug || documentQuery.data === null) notFound();

  const document = documentQuery.data;

  return (
    <main className="mx-auto max-w-[1280px] px-10 pt-[160px] max-sm:px-6">
      <article className="max-w-[72ch]">
        <span className="font-geist-mono text-xs tracking-[.06em] text-(--home-text-4) uppercase">Legal</span>
        {documentQuery.isLoading ? (
          <p className="mt-6 text-base text-(--home-text-3)">Loading…</p>
        ) : documentQuery.isError || !document ? (
          <p className="mt-6 text-base text-(--home-text-3)">This policy could not be loaded. Please refresh the page.</p>
        ) : (
          <>
            <title>{`${document.title} | AdCendy`}</title>
            <h1 className="mt-4 text-[clamp(36px,4vw,56px)] leading-[1.05] font-medium tracking-[-.025em] text-balance">
              {document.title}
            </h1>
            <LegalMarkdown markdown={document.content} className="legal-prose mt-12" />
          </>
        )}
      </article>
    </main>
  );
}
