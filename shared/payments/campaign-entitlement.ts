import type { UserProfile } from '@/shared/types/user-profile';

export const CAMPAIGN_PLAN_ROUTE =
  '/app/checkout?reason=campaign-entitlement';

/** V3-371: the server's code when the open-draft cap is reached. */
export const WIZARD_DRAFT_LIMIT_CODE = 'WIZARD_DRAFT_LIMIT_V2';

/** Checkout, then straight back to the draft being submitted. */
export function campaignPlanRouteForDraft(campaignId: string | null | undefined): string {
  if (!campaignId) return CAMPAIGN_PLAN_ROUTE;
  const back = `/app/campaigns?draftCampaignId=${campaignId}&wizardStep=7`;
  return `${CAMPAIGN_PLAN_ROUTE}&returnTo=${encodeURIComponent(back)}`;
}

/**
 * Where checkout may send the client after paying: only a path inside the
 * app, never another site. Anything else returns to the dashboard.
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value) return '/app';
  if (!value.startsWith('/app') || value.startsWith('//') || value.includes('\\') || /[\r\n]/.test(value)) {
    return '/app';
  }
  const next = value.charAt(4);
  return next === '' || next === '/' || next === '?' ? value : '/app';
}

export function hasCampaignEntitlement(
  profile: UserProfile | null | undefined,
): boolean {
  return Boolean(
    profile &&
      (profile.billing.creditBalance > 0 ||
        (profile.billing.subscription.available &&
          profile.billing.subscription.status === 'ACTIVE')),
  );
}
