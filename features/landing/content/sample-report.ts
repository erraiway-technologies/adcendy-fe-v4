/**
 * The sample strategy the homepage's "Inside a strategy" reader shows: one
 * chapter per page, each page a typed excerpt the reader knows how to lay out.
 *
 * Everything here is a placeholder (Sample Co., Competitor A, 48k, £2.10...).
 * To show a real report, replace SAMPLE_REPORT with its excerpts: keep each
 * chapter's `page.kind` and fill its fields, and the reader renders it. A new
 * kind of page needs a layout in features/landing/components/home/ReportPage.tsx.
 */

export type ReportStat = {
  value: string;
  label: string;
};

export type ReportCompetitor = {
  name: string;
  leadsOn: string;
  mainChannel: string;
  /** Ad activity, 0–3 filled dots. */
  adActivity: 0 | 1 | 2 | 3;
};

export type ReportProofPoint = {
  title: string;
  detail: string;
};

export type ReportChannel = {
  name: string;
  /** Share of budget, 0–100. */
  share: number;
  rationale: string;
};

export type ReportWeek = {
  label: string;
  task: string;
  target: string;
};

/** The layouts a sample page can take, one per chapter today. */
export type ReportPageContent =
  | {
      kind: 'snapshot';
      title: string;
      stats: ReportStat[];
      /** Relative demand per period, each 0–100 (bar height in %). */
      demandTrend: number[];
      demandTrendLabel: string;
      insight: string;
    }
  | {
      kind: 'competitors';
      title: string;
      competitors: ReportCompetitor[];
      insight: string;
    }
  | {
      kind: 'positioning';
      label: string;
      position: string;
      proofPoints: ReportProofPoint[];
    }
  | {
      kind: 'channels';
      title: string;
      channels: ReportChannel[];
    }
  | {
      kind: 'plan';
      title: string;
      weeks: ReportWeek[];
    };

export type ReportChapter = {
  /** Shown in the chapter list. */
  title: string;
  summary: string;
  /** The page number this excerpt sits on in the full document. */
  pageNumber: number;
  page: ReportPageContent;
};

export type SampleReport = {
  /** Who the report is for and which market it covers: the page header. */
  company: string;
  market: string;
  chapters: ReportChapter[];
};

export const SAMPLE_REPORT: SampleReport = {
  company: 'Sample Co.',
  market: 'United Kingdom',
  chapters: [
    {
      title: 'Market snapshot',
      summary: 'Demand, growth and who is buying',
      pageNumber: 4,
      page: {
        kind: 'snapshot',
        title: 'Market snapshot',
        stats: [
          { value: '48k', label: 'monthly buyer searches' },
          { value: '+18%', label: 'demand, year on year' },
          { value: '23', label: 'active advertisers' },
        ],
        demandTrend: [28, 34, 31, 42, 47, 45, 55, 61, 58, 70, 82, 94],
        demandTrendLabel: 'Buyer search demand, last 12 months',
        insight: 'Demand is growing faster than ad competition — a window of roughly six to nine months.',
      },
    },
    {
      title: 'Competitor landscape',
      summary: 'How rivals position, advertise and rank',
      pageNumber: 9,
      page: {
        kind: 'competitors',
        title: 'Competitor landscape',
        competitors: [
          { name: 'Competitor A', leadsOn: 'Price', mainChannel: 'Search', adActivity: 3 },
          { name: 'Competitor B', leadsOn: 'Features', mainChannel: 'Search', adActivity: 2 },
          { name: 'Competitor C', leadsOn: 'Price', mainChannel: 'Social', adActivity: 3 },
          { name: 'Competitor D', leadsOn: 'Price', mainChannel: 'Content', adActivity: 1 },
        ],
        insight: 'Three of four competitors lead on price. No one leads on speed.',
      },
    },
    {
      title: 'Positioning',
      summary: 'The angle no one owns yet',
      pageNumber: 17,
      page: {
        kind: 'positioning',
        label: 'Recommended position',
        position: 'Lead on speed.',
        proofPoints: [
          { title: 'Live in a day', detail: 'Competitors quote 2–6 weeks onboarding.' },
          { title: 'No setup fees', detail: 'Removes the main objection in reviews.' },
          { title: 'Real human support', detail: 'The top complaint about competitor A.' },
        ],
      },
    },
    {
      title: 'Channel direction',
      summary: 'Where the budget goes, and why',
      pageNumber: 26,
      page: {
        kind: 'channels',
        title: 'Channel direction',
        channels: [
          { name: 'Search', share: 40, rationale: '12 high-intent terms with weak competition' },
          { name: 'LinkedIn', share: 30, rationale: 'Buyers are active; competitors are absent' },
          { name: 'Content', share: 20, rationale: 'Answer the questions rivals ignore' },
          { name: 'Partners', share: 10, rationale: 'Two adjacent tools share your audience' },
        ],
      },
    },
    {
      title: 'The first 30 days',
      summary: 'Weekly priorities and targets',
      pageNumber: 38,
      page: {
        kind: 'plan',
        title: 'The first 30 days',
        weeks: [
          { label: 'Week 1', task: 'Launch search on the 12 priority terms', target: 'CPC under £2.10' },
          { label: 'Week 2', task: 'Rewrite the homepage around speed', target: '+15% demo rate' },
          { label: 'Week 3', task: 'Test three LinkedIn angles', target: 'CTR above 0.6%' },
          { label: 'Week 4', task: 'Review numbers, cut the weakest channel', target: 'Written review' },
        ],
      },
    },
  ],
};

/** "01", "02"... as chapters are numbered in the list, the questions and the page header. */
export function chapterNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}
