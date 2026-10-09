import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ReportChapter, ReportPageContent } from '../../content/sample-report';

const MONO = 'font-geist-mono';
const INSIGHT = 'border-l-2 border-(--home-ink) pl-3.5 text-[15px] leading-normal text-(--home-ink-3)';
const PAGE_TITLE = 'text-[34px] tracking-[-.02em]';

/** One sample page on paper: the report's running header, then the chapter's excerpt. */
export function ReportPage({
  chapter,
  number,
  company,
  market,
}: {
  chapter: ReportChapter;
  number: string;
  company: string;
  market: string;
}) {
  const { page } = chapter;
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-[4px] bg-(--home-paper) px-10 py-9 text-(--home-ink) shadow-[0_40px_80px_rgba(0,0,0,.35)] max-sm:px-6 max-sm:py-7',
        PAGE_GAP[page.kind],
      )}
    >
      <div className={cn(MONO, 'flex justify-between gap-4 text-[11px] tracking-[.04em] text-(--home-ink-2) uppercase')}>
        <span>
          {company} · {market}
        </span>
        <span>
          {number} · p. {chapter.pageNumber}
        </span>
      </div>
      <PageBody page={page} />
    </div>
  );
}

const PAGE_GAP: Record<ReportPageContent['kind'], string> = {
  snapshot: 'gap-7',
  competitors: 'gap-6',
  positioning: 'gap-6',
  channels: 'gap-[26px]',
  plan: 'gap-[22px]',
};

function PageBody({ page }: { page: ReportPageContent }): ReactNode {
  switch (page.kind) {
    case 'snapshot':
      return (
        <>
          <h3 className={PAGE_TITLE}>{page.title}</h3>
          <div className="grid grid-cols-3 gap-5 border-t border-(--home-ink)/12 pt-5">
            {page.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <span className="text-[40px] tracking-[-.03em] max-sm:text-[30px]">{stat.value}</span>
                <span className="text-sm text-(--home-ink-2)">{stat.label}</span>
              </div>
            ))}
          </div>
          <div
            role="img"
            aria-label={`${page.demandTrendLabel}, rising from ${page.demandTrend[0]} to ${page.demandTrend.at(-1)} (relative)`}
            className="flex min-h-[110px] flex-1 items-end gap-1.5"
          >
            {page.demandTrend.map((height, i) => (
              <span
                key={i}
                className="flex-1 rounded-t-[2px] bg-(--home-ink) opacity-85"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <p className={INSIGHT}>{page.insight}</p>
        </>
      );

    case 'competitors':
      return (
        <>
          <h3 className={PAGE_TITLE}>{page.title}</h3>
          <table className="w-full table-fixed border-collapse text-left text-[15px]">
            <colgroup>
              <col className="w-[28.6%]" />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-(--home-ink)/15 text-xs text-(--home-ink-2)">
                {['Competitor', 'Leads on', 'Main channel', 'Ad activity'].map((heading) => (
                  <th key={heading} scope="col" className="py-2.5 pr-3 font-normal last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.competitors.map((competitor) => (
                <tr key={competitor.name} className="border-b border-(--home-ink)/8">
                  <th scope="row" className="py-3.5 pr-3 font-normal">
                    {competitor.name}
                  </th>
                  <td className="py-3.5 pr-3">{competitor.leadsOn}</td>
                  <td className="py-3.5 pr-3">{competitor.mainChannel}</td>
                  <td className="py-3.5">
                    <span className="flex items-center gap-[3px]" role="img" aria-label={`${competitor.adActivity} of 3`}>
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className={cn(
                            'size-2 rounded-full',
                            dot < competitor.adActivity ? 'bg-(--home-ink)' : 'bg-(--home-ink)/15',
                          )}
                        />
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={cn(INSIGHT, 'mt-auto')}>{page.insight}</p>
        </>
      );

    case 'positioning':
      return (
        <>
          <p className="text-sm text-(--home-ink-2)">{page.label}</p>
          <h3 className="text-[clamp(48px,5vw,72px)] leading-none tracking-[-.035em]">{page.position}</h3>
          <div className="mt-auto grid grid-cols-3 gap-4 max-sm:grid-cols-1">
            {page.proofPoints.map((point) => (
              <div key={point.title} className="flex flex-col gap-2 border-t border-(--home-ink) pt-3.5">
                <span className="text-[17px]">{point.title}</span>
                <span className="text-[13px] leading-normal text-(--home-ink-2)">{point.detail}</span>
              </div>
            ))}
          </div>
        </>
      );

    case 'channels':
      return (
        <>
          <h3 className={PAGE_TITLE}>{page.title}</h3>
          <div className="flex flex-col gap-[22px]">
            {page.channels.map((channel) => (
              <div key={channel.name} className="grid grid-cols-[110px_1fr_48px] items-center gap-4 max-sm:grid-cols-[80px_1fr_40px] max-sm:gap-3">
                <span className="text-base">{channel.name}</span>
                <div className="flex flex-col gap-1.5">
                  <div className="h-1.5 rounded-[3px] bg-(--home-ink)/10">
                    <div className="h-full rounded-[3px] bg-(--home-ink)" style={{ width: `${channel.share}%` }} />
                  </div>
                  <span className="text-[13px] text-(--home-ink-2)">{channel.rationale}</span>
                </div>
                <span className={cn(MONO, 'text-right text-sm')}>{channel.share}%</span>
              </div>
            ))}
          </div>
        </>
      );

    case 'plan':
      return (
        <>
          <h3 className={PAGE_TITLE}>{page.title}</h3>
          <div className="flex flex-col">
            {page.weeks.map((week) => (
              <div
                key={week.label}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-t border-(--home-ink)/12 py-4 max-sm:grid-cols-[56px_1fr] max-sm:gap-y-1"
              >
                <span className={cn(MONO, 'text-[13px] text-(--home-ink-2)')}>{week.label}</span>
                <span className="text-[17px]">{week.task}</span>
                <span className="text-[13px] whitespace-nowrap text-(--home-ink-2) max-sm:col-start-2">{week.target}</span>
              </div>
            ))}
          </div>
        </>
      );
  }
}
