import { SampleReportView } from '@/features/landing/components/home/SampleReportView';
import { pageMetadata } from '@/shared/seo/site';

// Placeholder excerpts until real report content replaces them
// (features/landing/content/sample-report.ts): linked to, but not a search result.
export const metadata = {
  ...pageMetadata('/sample-report', { title: 'Sample report' }),
  robots: { index: false, follow: true },
};

export default function SampleReportPage() {
  return <SampleReportView />;
}
