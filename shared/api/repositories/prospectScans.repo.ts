import { createRuntimeRepositoryAdapter } from '@/lib/env';
import { prospectScansMockAdapter } from '../mock/prospectScans.mock';
import { prospectScansRealAdapter } from '../real/prospectScans.real';
import type {
  MarkOutreachSentPayload,
  ProspectInputsPatch,
  ProspectOperatorFactPayload,
  ProspectScanDetail,
  ProspectScanListItem,
  ProspectScanSpend,
  ProspectScanSummary,
  ProspectSubmission,
  ProspectSubmitResult,
} from '@/shared/types/prospectScans';

const adapter = createRuntimeRepositoryAdapter(prospectScansMockAdapter, prospectScansRealAdapter);

export const prospectScansRepository = {
  /** Prospects scanned or waiting, oldest first. */
  async list(query: { batchId?: string; status?: string }): Promise<ProspectScanListItem[]> {
    return adapter.list(query);
  },

  /** How a batch came out, with its fact rate. */
  async summary(batchId?: string): Promise<ProspectScanSummary> {
    return adapter.summary(batchId);
  },

  /** Today's scan spend against its own daily cap. */
  async spend(): Promise<ProspectScanSpend> {
    return adapter.spend();
  },

  /** One prospect: checks, what it needs from the operator, the email, outreach history. */
  async get(scanId: string): Promise<ProspectScanDetail> {
    return adapter.get(scanId);
  },

  async submit(prospects: ProspectSubmission[]): Promise<ProspectSubmitResult> {
    return adapter.submit(prospects);
  },

  /** A reading the operator made by hand, checked like any other. */
  async addFact(scanId: string, payload: ProspectOperatorFactPayload): Promise<ProspectScanDetail> {
    return adapter.addFact(scanId, payload);
  },

  async updateInputs(
    scanId: string,
    patch: ProspectInputsPatch,
  ): Promise<ProspectScanDetail & { rescanNeeded: boolean }> {
    return adapter.updateInputs(scanId, patch);
  },

  async rescan(scanId: string): Promise<void> {
    return adapter.rescan(scanId);
  },

  async recheck(scanId: string): Promise<void> {
    return adapter.recheck(scanId);
  },

  /** Records that the operator sent the current email. */
  async markSent(scanId: string, payload: MarkOutreachSentPayload): Promise<void> {
    return adapter.markSent(scanId, payload);
  },

  async exportCsv(batchId?: string): Promise<string> {
    return adapter.exportCsv(batchId);
  },
};
