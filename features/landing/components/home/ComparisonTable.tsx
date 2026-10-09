import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { HOME_COMPARISON as C, type ComparisonValue } from '../../content/home';
import { Reveal } from './Reveal';
import { HomeSection, SectionHeader } from './primitives';

const MARKS: Record<string, { glyph: string; label: string }> = {
  yes: { glyph: '✓', label: C.legend.yes },
  maybe: { glyph: '–', label: C.legend.maybe },
  no: { glyph: '×', label: C.legend.no },
};

function Value({ value, ours }: { value: ComparisonValue; ours: boolean }) {
  const mark = MARKS[value];
  if (!mark) {
    return <span className={cn('text-sm', ours ? 'text-white' : 'text-(--home-text-3)')}>{value}</span>;
  }
  return (
    <span
      role="img"
      aria-label={mark.label}
      className={cn('text-lg', value === 'yes' ? 'text-white' : 'text-(--home-text-4)')}
    >
      {mark.glyph}
    </span>
  );
}

/** AdCendy against a freelancer and an agency: direction, hands, and the trade. */
export function ComparisonTable() {
  return (
    <HomeSection id="comparison">
      <SectionHeader title={C.heading} intro={C.intro} />
      <Reveal className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/14">
              <th scope="col" className="w-[40%] py-4 pr-4 align-bottom text-sm font-normal text-(--home-text-4)">
                {C.rowHeading}
              </th>
              {C.columns.map((column, i) => (
                <th
                  key={column.name}
                  scope="col"
                  className={cn(
                    'px-4 py-4 text-center align-bottom font-normal',
                    i === 0 && 'rounded-t-md bg-(--home-surface)',
                  )}
                >
                  <span className={cn('block text-[20px] tracking-[-.01em]', i === 0 ? 'text-white' : 'text-(--home-text-2)')}>
                    {column.name}
                  </span>
                  <span className="mt-1 block text-xs text-(--home-text-4)">{column.note}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {C.categories.map((category) => (
              <Fragment key={category.heading}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={C.columns.length + 1}
                    className="pt-9 pb-3 font-geist-mono text-xs font-normal tracking-[.06em] text-(--home-text-4) uppercase"
                  >
                    {category.heading}
                  </th>
                </tr>
                {category.rows.map((row) => (
                  <tr key={row.label} className="border-t border-white/8">
                    <th scope="row" className="py-4 pr-4 text-base font-normal text-(--home-nav-link)">
                      {row.label}
                    </th>
                    {row.values.map((value, i) => (
                      <td key={i} className={cn('px-4 py-4 text-center', i === 0 && 'bg-(--home-surface)')}>
                        <Value value={value} ours={i === 0} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Reveal>
      <Reveal className="mt-10 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-4">
        <p className="max-w-[44ch] text-[22px] leading-[1.35] tracking-[-.01em]">{C.verdict}</p>
        <p className="flex gap-5 font-geist-mono text-xs text-(--home-text-4)">
          {Object.values(MARKS).map((mark) => (
            <span key={mark.glyph}>
              {mark.glyph} {mark.label}
            </span>
          ))}
        </p>
      </Reveal>
    </HomeSection>
  );
}
