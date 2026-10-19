'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { prospectScansRepository } from '@/shared/api/repositories';
import type {
  MarkOutreachSentPayload,
  ProspectInputsPatch,
  ProspectOperatorFactPayload,
  ProspectScanDetail,
  ProspectSubmission,
} from '@/shared/types/prospectScans';

/** Scans in progress are re-read until the worker has finished them. */
const IN_PROGRESS = new Set(['PENDING', 'SCANNING', 'RECHECK_PENDING']);
const POLL_MS = 15_000;

export function useProspectScans(query: { batchId?: string; status?: string }, enabled = true) {
  return useQuery({
    queryKey: queryKeys.prospectScans.list({ ...query }),
    queryFn: () => prospectScansRepository.list(query),
    enabled,
    refetchInterval: (state) =>
      state.state.data?.some((scan) => IN_PROGRESS.has(scan.status)) ? POLL_MS : false,
  });
}

export function useProspectScanSummary(batchId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.prospectScans.summary(batchId ?? 'all'),
    queryFn: () => prospectScansRepository.summary(batchId),
    enabled,
  });
}

export function useProspectScanSpend(enabled = true) {
  return useQuery({
    queryKey: queryKeys.prospectScans.spend(),
    queryFn: () => prospectScansRepository.spend(),
    enabled,
  });
}

export function useProspectScan(scanId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.prospectScans.detail(scanId),
    queryFn: () => prospectScansRepository.get(scanId),
    enabled: enabled && Boolean(scanId),
    refetchInterval: (state) =>
      state.state.data && IN_PROGRESS.has(state.state.data.status) ? POLL_MS : false,
  });
}

function useRefreshProspectScans() {
  const queryClient = useQueryClient();
  return (scanId?: string, detail?: ProspectScanDetail) => {
    if (scanId && detail) {
      queryClient.setQueryData(queryKeys.prospectScans.detail(scanId), detail);
    }
    return queryClient.invalidateQueries({ queryKey: queryKeys.prospectScans.all });
  };
}

export function useSubmitProspects() {
  const refresh = useRefreshProspectScans();
  return useMutation({
    mutationFn: (prospects: ProspectSubmission[]) => prospectScansRepository.submit(prospects),
    onSuccess: () => refresh(),
  });
}

export function useAddProspectFact(scanId: string) {
  const refresh = useRefreshProspectScans();
  return useMutation({
    mutationFn: (payload: ProspectOperatorFactPayload) =>
      prospectScansRepository.addFact(scanId, payload),
    onSuccess: (detail) => refresh(scanId, detail),
  });
}

export function useUpdateProspectInputs(scanId: string) {
  const refresh = useRefreshProspectScans();
  return useMutation({
    mutationFn: (patch: ProspectInputsPatch) => prospectScansRepository.updateInputs(scanId, patch),
    onSuccess: (detail) => refresh(scanId, detail),
  });
}

export function useRescanProspect(scanId: string) {
  const refresh = useRefreshProspectScans();
  return useMutation({
    mutationFn: () => prospectScansRepository.rescan(scanId),
    onSuccess: () => refresh(),
  });
}

export function useRecheckProspect(scanId: string) {
  const refresh = useRefreshProspectScans();
  return useMutation({
    mutationFn: () => prospectScansRepository.recheck(scanId),
    onSuccess: () => refresh(),
  });
}

export function useMarkOutreachSent(scanId: string) {
  const refresh = useRefreshProspectScans();
  return useMutation({
    mutationFn: (payload: MarkOutreachSentPayload) =>
      prospectScansRepository.markSent(scanId, payload),
    onSuccess: () => refresh(),
  });
}
