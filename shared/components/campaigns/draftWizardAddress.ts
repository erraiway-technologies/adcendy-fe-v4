/**
 * The draft wizard is open exactly while the address names the draft
 * (V3-369, 2026-11-15).
 *
 * Closing the wizard clears it and replaces the address, but for a moment the
 * old address still names the draft; the page used to reopen it from that
 * address, and nothing closed it once the address changed, so a closed
 * wizard stayed on screen. This decides, for each address the page sees,
 * what the page does with a draft wizard before its other checks:
 * - `ignore`: the address names the draft being closed - never reopen it;
 * - `close`: the address named the open draft and no longer names any;
 * - `none`: the address names no draft, and the open wizard (if any) was not
 *   opened from one - a new campaign's wizard, or a draft whose address has
 *   not arrived yet, stays as it is;
 * - `continue`: the address names a draft - go on to open it.
 *
 * Pure, no imports, so `node --test` can run it directly.
 */
export type DraftWizardAddressStepV2 = 'ignore' | 'close' | 'none' | 'continue';

export function draftWizardAddressStepV2(input: {
  /** The draft the address names; null when it names none. */
  draftCampaignId: string | null;
  /** The draft whose wizard was just closed; null when none is closing. */
  closingDraftId: string | null;
  /** The campaign the open wizard holds; null for none or a new campaign. */
  openDraftId: string | null;
  /** The draft the address named the last time the page looked; null for none. */
  previousDraftCampaignId: string | null;
}): DraftWizardAddressStepV2 {
  if (!input.draftCampaignId) {
    return input.openDraftId !== null && input.previousDraftCampaignId === input.openDraftId ? 'close' : 'none';
  }
  if (input.closingDraftId !== null && input.draftCampaignId === input.closingDraftId) {
    return 'ignore';
  }
  return 'continue';
}
