'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOpsReviewerTasks, useOpsSectionReviews, useStartOpsSectionReview } from '@/hooks/useOpsV2';
import type { Role } from '@/features/auth/types';
import { isResearchSetupReviewItem } from '@/shared/components/ops/researchSetupReview';
import {
  getSectionReviewForbiddenMessage,
  inferSectionReviewForbiddenReason,
} from '@/shared/components/ops/reviewAccess';
import {
  filterInboxGroups,
  formatInboxTime,
  groupInboxItems,
  humanizeInboxValue,
  inboxClientName,
  reviewerTaskHeadline,
  type InboxGroup,
} from '@/shared/components/ops/reviewerInbox';
import type { OpsListFilters, ReviewerTaskItem, SectionReviewItem } from '@/shared/types/opsV2';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ReviewStatusFilter = 'ALL' | 'PENDING_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED';
type InboxTab = 'researchSetup' | 'blockers' | 'strategy';

const STATUS_OPTIONS: ReadonlyArray<{ value: ReviewStatusFilter; label: string }> = [
  { value: 'PENDING_REVIEW', label: 'Waiting for review' },
  { value: 'CHANGES_REQUESTED', label: 'Changes requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ALL', label: 'All' },
];
// The list endpoints return at most 200; the inbox shows everything waiting.
const INBOX_LIMIT = 200;
const REVIEWER_TASK_CAMPAIGN_MAP_KEY = 'adcendy_reviewer_task_campaign_map_v1';
const OUTPUT_CONSTRAINT_MODE = 'output_constraint_violation';

type BlockedSectionPreview = {
  issueId?: string | null;
  sectionId?: string | null;
  sectionLabel?: string | null;
  marketId?: string | null;
  audienceId?: string | null;
  violationSummary?: string | null;
  offendingSnippet?: string | null;
  preferredWording?: string | null;
  question?: string | null;
};

type OutputConstraintTaskContext = {
  blockedSectionCount: number | null;
  sectionId: string | null;
  sectionLabel: string | null;
  blockedSections: BlockedSectionPreview[];
  hasExplicitBlockedSections: boolean;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is Record<string, unknown> => toRecord(entry) !== null);
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeFailureMode(value: unknown): string | null {
  const mode = toNonEmptyString(value);
  return mode ? mode.toLowerCase().replace(/[\s-]+/g, '_') : null;
}

function isOutputConstraintMode(value: unknown): boolean {
  return normalizeFailureMode(value) === OUTPUT_CONSTRAINT_MODE;
}

function parseBlockedSectionsCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const intValue = Math.trunc(value);
    return intValue >= 0 ? intValue : null;
  }

  if (typeof value === 'string') {
    const intValue = Number.parseInt(value, 10);
    return Number.isFinite(intValue) && intValue >= 0 ? intValue : null;
  }

  return null;
}

function normalizeBlockedSection(item: Record<string, unknown>): BlockedSectionPreview {
  return {
    issueId: toNonEmptyString(item.issueId) ?? toNonEmptyString(item.issue_id),
    sectionId: toNonEmptyString(item.sectionId) ?? toNonEmptyString(item.section_id),
    sectionLabel: toNonEmptyString(item.sectionLabel) ?? toNonEmptyString(item.section_label),
    marketId: toNonEmptyString(item.marketId) ?? toNonEmptyString(item.market_id),
    audienceId: toNonEmptyString(item.audienceId) ?? toNonEmptyString(item.audience_id),
    violationSummary: toNonEmptyString(item.violationSummary) ?? toNonEmptyString(item.violation_summary),
    offendingSnippet: toNonEmptyString(item.offendingSnippet) ?? toNonEmptyString(item.offending_snippet),
    preferredWording: toNonEmptyString(item.preferredWording) ?? toNonEmptyString(item.preferred_wording),
    question: toNonEmptyString(item.question) ?? toNonEmptyString(item.questionText) ?? toNonEmptyString(item.question_text),
  };
}

function getOutputConstraintContext(task: ReviewerTaskItem): OutputConstraintTaskContext | null {
  if (!isOutputConstraintMode(task.failureMode)) {
    return null;
  }

  const questionPayload = toRecord(task.questionPayload);
  const questionContext =
    toRecord(questionPayload?.questionContext) ?? toRecord(questionPayload?.question_context) ?? questionPayload;
  const questionContextQuestions = Array.isArray(questionContext?.questions)
    ? questionContext.questions
        .map((entry) => {
          if (typeof entry === 'string') {
            return toNonEmptyString(entry);
          }

          const entryRecord = toRecord(entry);
          if (!entryRecord) {
            return null;
          }

          return (
            toNonEmptyString(entryRecord.question) ??
            toNonEmptyString(entryRecord.questionText) ??
            toNonEmptyString(entryRecord.question_text)
          );
        })
        .filter((question): question is string => Boolean(question))
    : [];

  const blockedSectionsFromPayload = toRecordArray(questionContext?.blockedSections ?? questionContext?.blocked_sections).map(
    (section, index) => {
      const normalized = normalizeBlockedSection(section);
      const fallbackQuestion = questionContextQuestions[index];

      if (!toNonEmptyString(normalized.question)) {
        return {
          ...normalized,
          question: fallbackQuestion ?? null,
        };
      }

      return normalized;
    },
  );
  const blockedSections = blockedSectionsFromPayload;
  const hasExplicitBlockedSections = blockedSections.length > 0;
  const blockedSectionCount = parseBlockedSectionsCount(
    questionContext?.blockedSectionCount ??
      questionContext?.blocked_section_count ??
      questionContext?.blockedSectionsCount ??
      questionContext?.blocked_sections_count,
  );

  if (!hasExplicitBlockedSections) {
    const fallbackSectionId = toNonEmptyString(questionContext?.sectionId) ?? toNonEmptyString(questionContext?.section_id);
    const fallbackSectionLabel =
      toNonEmptyString(questionContext?.sectionLabel) ??
      toNonEmptyString(questionContext?.section_label) ??
      fallbackSectionId;
    if (!fallbackSectionId && !fallbackSectionLabel) {
      return null;
    }

    return {
      blockedSectionCount: blockedSectionCount ?? 1,
      sectionId: fallbackSectionId,
      sectionLabel: fallbackSectionLabel,
      blockedSections: [
        {
          sectionId: fallbackSectionId,
          sectionLabel: fallbackSectionLabel,
          violationSummary: toNonEmptyString(questionContext?.violationSummary) ?? toNonEmptyString(questionContext?.violation_summary),
          question: questionContextQuestions[0] ?? null,
        },
      ],
      hasExplicitBlockedSections,
    };
  }

  return {
    blockedSectionCount,
    sectionId: toNonEmptyString(questionContext?.sectionId) ?? toNonEmptyString(questionContext?.section_id),
    sectionLabel: toNonEmptyString(questionContext?.sectionLabel) ?? toNonEmptyString(questionContext?.section_label),
    blockedSections,
    hasExplicitBlockedSections,
  };
}


/** "3 blocked sections: Asset Copy, Roadmap…" for an output-constraint blocker. */
function blockedSectionsLine(task: ReviewerTaskItem): string | null {
  const context = getOutputConstraintContext(task);
  if (!context) {
    return null;
  }
  const names = context.blockedSections
    .map((section) => section.sectionLabel ?? section.sectionId)
    .filter((name): name is string => Boolean(name));
  const count = context.blockedSectionCount ?? context.blockedSections.length;
  const head = count === 1 ? '1 blocked section' : `${count} blocked sections`;
  return names.length > 0 ? `${head}: ${[...new Set(names)].join(', ')}` : head;
}

function mapStatusFilterToBackend(status: ReviewStatusFilter): string | undefined {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'pending_review';
    case 'CHANGES_REQUESTED':
      return 'changes_requested';
    case 'APPROVED':
      return 'approved';
    default:
      return undefined;
  }
}

function rememberTaskCampaign(taskId: string, campaignId?: string | null) {
  if (typeof window === 'undefined') {
    return;
  }
  const normalizedCampaignId = typeof campaignId === 'string' ? campaignId.trim() : '';
  if (!normalizedCampaignId) {
    return;
  }
  try {
    const existingRaw = window.localStorage.getItem(REVIEWER_TASK_CAMPAIGN_MAP_KEY);
    const existingParsed: unknown = existingRaw ? JSON.parse(existingRaw) : {};
    const existingMap =
      existingParsed && typeof existingParsed === 'object' && !Array.isArray(existingParsed)
        ? (existingParsed as Record<string, unknown>)
        : {};
    const nextMap: Record<string, string> = Object.fromEntries(
      Object.entries(existingMap)
        .filter(([key, value]) => typeof key === 'string' && typeof value === 'string' && key.trim() && value.trim())
        .map(([key, value]) => [key, (value as string).trim()]),
    );
    nextMap[taskId] = normalizedCampaignId;
    window.localStorage.setItem(REVIEWER_TASK_CAMPAIGN_MAP_KEY, JSON.stringify(nextMap));
  } catch {
    // Ignore storage failures.
  }
}

/** Joins the known parts with a dot; unknown parts are left out. */
function Meta({ parts }: { parts: Array<string | null | undefined | false> }) {
  const known = parts.filter((part): part is string => Boolean(part));
  return known.length > 0 ? <p className="truncate text-xs text-muted-foreground">{known.join(' · ')}</p> : null;
}

function StatusChip({ status }: { status: string | null | undefined }) {
  if (!status || status.toLowerCase() === 'pending_review') {
    return null;
  }
  const tone =
    status.toLowerCase() === 'approved'
      ? 'border-emerald-500/40 text-emerald-400'
      : status.toLowerCase() === 'changes_requested'
        ? 'border-amber-500/40 text-amber-400'
        : 'border-border text-muted-foreground';
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {humanizeInboxValue(status)}
    </span>
  );
}

function GroupCard<T>({ group, children }: { group: InboxGroup<T>; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-baseline justify-between gap-3 border-b border-border/70 px-4 py-2.5">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {group.client}
          {group.market ? <span className="ml-2 text-xs font-normal text-muted-foreground">{group.market}</span> : null}
        </h2>
        {group.items.length > 1 ? (
          <span className="shrink-0 text-xs text-muted-foreground">{group.items.length} items</span>
        ) : null}
      </header>
      <ul className="divide-y divide-border/60">{children}</ul>
    </section>
  );
}

function ReviewerTaskLine({ task, required }: { task: ReviewerTaskItem; required: boolean }) {
  const href = task.campaignId
    ? `/app/reviewer/tasks/${task.id}?campaignId=${encodeURIComponent(task.campaignId)}`
    : `/app/reviewer/tasks/${task.id}`;
  const attempt = typeof task.attemptNumber === 'number' && task.attemptNumber > 1 ? `attempt ${task.attemptNumber}` : null;
  return (
    <li className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${required ? 'bg-sky-400' : 'bg-amber-400'}`}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <Link
          href={href}
          onClick={() => rememberTaskCampaign(task.id, task.campaignId)}
          className="block truncate text-sm font-medium text-foreground after:absolute after:inset-0"
        >
          {reviewerTaskHeadline(task)}
        </Link>
        <Meta parts={[blockedSectionsLine(task), formatInboxTime(task.updatedAt ?? task.createdAt), attempt]} />
      </div>
      <StatusChip status={task.status} />
      {task.pipelineRunId ? (
        <Link
          href={`/app/reviewer/runs/${task.pipelineRunId}`}
          className="relative z-10 shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          Run
        </Link>
      ) : null}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </li>
  );
}

function SectionReviewLine({ review, role }: { review: SectionReviewItem; role: Extract<Role, 'REVIEWER' | 'ADMIN'> }) {
  const router = useRouter();
  const { toast } = useToast();
  const startReviewMutation = useStartOpsSectionReview(review.pipelineRunId ?? null);
  const workspacePath = review.pipelineRunId
    ? role === 'ADMIN'
      ? `/app/admin/runs/${review.pipelineRunId}`
      : `/app/reviewer/runs/${review.pipelineRunId}`
    : null;
  const title =
    review.sectionTitle || (review.sectionId ? humanizeInboxValue(review.sectionId.replace(/^section(?:[_-]\d+)?[_-]+/i, '')) : 'Section');
  const revisions =
    typeof review.revisionCount === 'number' && review.revisionCount > 0
      ? review.revisionCount === 1
        ? '1 revision'
        : `${review.revisionCount} revisions`
      : null;

  const openWorkspace = async () => {
    if (!workspacePath) {
      toast({ title: 'Run missing', description: 'This review is not linked to a run.', variant: 'destructive' });
      return;
    }
    if (role === 'ADMIN') {
      router.push(workspacePath);
      return;
    }
    try {
      await startReviewMutation.mutateAsync();
      router.push(workspacePath);
    } catch (error) {
      const reason = inferSectionReviewForbiddenReason(error);
      const message = reason ? getSectionReviewForbiddenMessage(role, reason) : null;
      toast({
        title: message?.title ?? 'Unable to start review',
        description: message?.description ?? (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    }
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
      <span aria-hidden className="size-2 shrink-0 rounded-full bg-violet-400" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <Meta
          parts={[
            formatInboxTime(review.updatedAt ?? review.createdAt),
            revisions,
            review.latestRevisionSummary ? `latest: ${review.latestRevisionSummary}` : null,
          ]}
        />
      </div>
      <StatusChip status={review.status} />
      {role === 'ADMIN' ? (
        <Link
          href={`/app/reviewer/section-reviews/${review.id}`}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          Details
        </Link>
      ) : null}
      <Button
        size="sm"
        variant="secondary"
        className="h-7 shrink-0 px-3 text-xs"
        onClick={() => void openWorkspace()}
        disabled={!workspacePath || startReviewMutation.isPending}
      >
        {startReviewMutation.isPending ? 'Opening…' : role === 'ADMIN' ? 'Open' : 'Review'}
      </Button>
    </li>
  );
}

function QuietState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function TabBody<T>({
  query,
  error,
  groups,
  empty,
  filtered,
  render,
}: {
  query: { isLoading: boolean };
  error: unknown;
  groups: InboxGroup<T>[];
  empty: string;
  filtered: boolean;
  render: (group: InboxGroup<T>) => ReactNode;
}) {
  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((k) => (
          <div key={k} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error instanceof Error ? error.message : 'Could not load this list.'}
      </div>
    );
  }
  if (groups.length === 0) {
    return <QuietState>{filtered ? 'Nothing matches this filter.' : empty}</QuietState>;
  }
  // Client groups flow into columns on wide screens; a group never splits.
  return <div className="gap-3 lg:columns-2 2xl:columns-3 [&>section]:mb-3 [&>section]:break-inside-avoid">{groups.map(render)}</div>;
}

function TabLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <span
        className={`min-w-5 rounded-full px-1.5 text-[11px] font-semibold leading-5 ${
          count > 0 ? 'bg-foreground/10 text-current' : 'text-muted-foreground/60'
        }`}
      >
        {count}
      </span>
    </span>
  );
}

const TAB_TRIGGER_CLASS =
  'flex-none rounded-md px-3 py-1.5 text-sm text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm';

export default function ReviewerStrategyReviewsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialStatus = (searchParams.get('status')?.toUpperCase() ?? 'PENDING_REVIEW') as ReviewStatusFilter;
  const [status, setStatus] = useState<ReviewStatusFilter>(
    STATUS_OPTIONS.some((o) => o.value === initialStatus) ? initialStatus : 'PENDING_REVIEW',
  );
  const pipelineRunId = searchParams.get('pipelineRunId')?.trim() || '';
  const [search, setSearch] = useState(searchParams.get('marketId') ?? '');
  const [tab, setTab] = useState<InboxTab | null>(null);

  const isOpsRole = user?.role === 'REVIEWER' || user?.role === 'ADMIN';

  const taskFilters = useMemo<OpsListFilters>(
    () => ({
      status: 'pending_review',
      pipelineRunId: pipelineRunId || undefined,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      limit: INBOX_LIMIT,
    }),
    [pipelineRunId],
  );
  const sectionFilters = useMemo<OpsListFilters>(
    () => ({ ...taskFilters, status: mapStatusFilterToBackend(status) }),
    [status, taskFilters],
  );

  const reviewerTasksQuery = useOpsReviewerTasks(taskFilters, isOpsRole);
  const sectionReviewsQuery = useOpsSectionReviews(sectionFilters, isOpsRole);

  // V3-329: required reviews (every run) apart from blockers (something went
  // wrong); the task's category decides, not its phase.
  const tasks = reviewerTasksQuery.data ?? [];
  const setupGroups = filterInboxGroups(groupInboxItems(tasks.filter(isResearchSetupReviewItem), inboxClientName), search);
  const blockerGroups = filterInboxGroups(
    groupInboxItems(
      tasks.filter((task) => !isResearchSetupReviewItem(task)),
      inboxClientName,
    ),
    search,
  );
  const strategyGroups = filterInboxGroups(
    groupInboxItems(sectionReviewsQuery.data ?? [], (review) => inboxClientName(review)),
    search,
  );
  const count = (groups: InboxGroup<unknown>[]) => groups.reduce((n, g) => n + g.items.length, 0);
  const counts: Record<InboxTab, number> = {
    researchSetup: count(setupGroups),
    blockers: count(blockerGroups),
    strategy: count(strategyGroups),
  };
  // Open on the first tab with something in it, until the reviewer picks one.
  const activeTab: InboxTab =
    tab ?? (counts.researchSetup > 0 ? 'researchSetup' : counts.blockers > 0 ? 'blockers' : counts.strategy > 0 ? 'strategy' : 'researchSetup');
  const filtered = search.trim().length > 0;
  const fetching = reviewerTasksQuery.isFetching || sectionReviewsQuery.isFetching;

  if (isAuthLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading reviewer inbox…</div>;
  }

  if (!isOpsRole) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">Permission denied</p>
              <p className="text-sm text-muted-foreground">This workspace is available to reviewer and admin users.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 p-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-space-grotesk text-2xl font-bold text-foreground">Reviewer Inbox</h1>
          <p className="text-sm text-muted-foreground">
            {counts.researchSetup + counts.blockers + counts.strategy === 0
              ? 'Nothing is waiting for you.'
              : 'Approvals runs are waiting on, grouped by client.'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            void reviewerTasksQuery.refetch();
            void sectionReviewsQuery.refetch();
          }}
          disabled={fetching}
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${fetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setTab(value as InboxTab)} className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList className="h-auto w-fit gap-1 rounded-lg bg-muted/40 p-1">
            <TabsTrigger value="researchSetup" className={TAB_TRIGGER_CLASS}>
              <TabLabel label="Research Setup" count={counts.researchSetup} />
            </TabsTrigger>
            <TabsTrigger value="blockers" className={TAB_TRIGGER_CLASS}>
              <TabLabel label="Blockers" count={counts.blockers} />
            </TabsTrigger>
            <TabsTrigger value="strategy" className={TAB_TRIGGER_CLASS}>
              <TabLabel label="Strategy" count={counts.strategy} />
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {activeTab === 'strategy' ? (
              <Select value={status} onValueChange={(value) => setStatus(value as ReviewStatusFilter)}>
                <SelectTrigger className="h-8 w-44 text-xs" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Client or market"
                aria-label="Filter by client or market"
                className="h-8 w-52 pl-8 text-xs"
              />
            </div>
          </div>
        </div>

        {pipelineRunId ? (
          <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-card py-1 pl-3 pr-1 text-xs text-muted-foreground">
            One run only: <span className="font-mono text-foreground">{pipelineRunId}</span>
            <button
              type="button"
              aria-label="Show all runs"
              className="rounded-full p-1 hover:bg-white/5 hover:text-foreground"
              onClick={() => router.replace('/app/reviewer/strategy-reviews')}
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}

        <TabsContent value="researchSetup" className="mt-0 space-y-3">
          <p className="text-xs text-muted-foreground">
            Required on every run: approve what competitor research is based on before it starts.
          </p>
          <TabBody
            query={reviewerTasksQuery}
            error={reviewerTasksQuery.error}
            groups={setupGroups}
            filtered={filtered}
            empty="No research setup reviews waiting."
            render={(group) => (
              <GroupCard key={group.key} group={group}>
                {group.items.map((task) => (
                  <ReviewerTaskLine key={task.id} task={task} required />
                ))}
              </GroupCard>
            )}
          />
        </TabsContent>

        <TabsContent value="blockers" className="mt-0 space-y-3">
          <p className="text-xs text-muted-foreground">A run stopped and needs your answer to continue.</p>
          <TabBody
            query={reviewerTasksQuery}
            error={reviewerTasksQuery.error}
            groups={blockerGroups}
            filtered={filtered}
            empty="No blocked runs."
            render={(group) => (
              <GroupCard key={group.key} group={group}>
                {group.items.map((task) => (
                  <ReviewerTaskLine key={task.id} task={task} required={false} />
                ))}
              </GroupCard>
            )}
          />
        </TabsContent>

        <TabsContent value="strategy" className="mt-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Every strategy section needs approval before delivery.</p>
            <Link href="/app/reviewer/section-reviews" className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
              Full strategy inbox →
            </Link>
          </div>
          <TabBody
            query={sectionReviewsQuery}
            error={sectionReviewsQuery.error}
            groups={strategyGroups}
            filtered={filtered}
            empty={status === 'PENDING_REVIEW' ? 'No sections waiting for review.' : 'No sections with this status.'}
            render={(group) => (
              <GroupCard key={group.key} group={group}>
                {group.items.map((review) => (
                  <SectionReviewLine key={review.id} review={review} role={isAdmin ? 'ADMIN' : 'REVIEWER'} />
                ))}
              </GroupCard>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
