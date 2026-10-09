'use client';

import { SAMPLE_REPORT } from '../../content/sample-report';
import { ReportReader } from './ReportReader';

/** The sample report page: the homepage's reader, opening the page. */
export function SampleReportView() {
  return (
    <main className="pt-[60px]">
      <h1 className="sr-only">Sample report</h1>
      <ReportReader report={SAMPLE_REPORT} />
    </main>
  );
}
