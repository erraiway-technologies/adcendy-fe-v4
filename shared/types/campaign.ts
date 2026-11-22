import type { ID, ISODateTime } from './common';

export const CAMPAIGN_STATUS_VALUES = [
  'DRAFT',
  'RESEARCHING',
  'STRATEGY_GENERATION',
  'SUBMITTED_FOR_REVIEW',
  'ON_HOLD',
  'IN_REVIEW',
  'GENERATING_DELIVERABLES',
  'READY_FOR_RELEASE',
  'DELIVERABLE_GENERATION_FAILED',
  'ACTIVE',
  'FAILED',
  'STOPPED',
  'ARCHIVED',
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUS_VALUES)[number];

/**
 * V3-449: what the client reads. The status follows the campaign's latest
 * run, so each stage - including a hold, a finished kit awaiting release and
 * a stopped run - has its own words.
 */
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'In setup',
  RESEARCHING: 'Researching your market',
  STRATEGY_GENERATION: 'Writing your strategy',
  SUBMITTED_FOR_REVIEW: 'Writing your strategy',
  ON_HOLD: 'Being checked by our team',
  IN_REVIEW: 'Strategy under review',
  GENERATING_DELIVERABLES: 'Preparing your files',
  READY_FOR_RELEASE: 'Final checks',
  DELIVERABLE_GENERATION_FAILED: 'Needs attention',
  ACTIVE: 'Delivered',
  FAILED: 'Needs attention',
  STOPPED: 'Stopped',
  ARCHIVED: 'Archived',
};

/**
 * V3-449: the backend's campaign statuses as the admin reads them - what
 * the team has to do, not what the client is told. Keyed by the backend's
 * own values, so the admin list filters by them.
 */
export const ADMIN_CAMPAIGN_STATUS_VALUES = [
  'WIZARD_DRAFT',
  'RESEARCHING',
  'STRATEGY_GENERATION',
  'ON_HOLD',
  'IN_REVIEW',
  'GENERATING_DELIVERABLES',
  'READY_FOR_RELEASE',
  'ACTIVE',
  'FAILED',
  'DELIVERABLE_GENERATION_FAILED',
  'STOPPED',
  'ARCHIVED',
] as const;

export type AdminCampaignStatus = (typeof ADMIN_CAMPAIGN_STATUS_VALUES)[number];

export const ADMIN_CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  WIZARD_DRAFT: 'In setup',
  DRAFT: 'In setup',
  RESEARCHING: 'Researching',
  STRATEGY_GENERATION: 'Writing strategy',
  SUBMITTED_FOR_REVIEW: 'Sections in review',
  ON_HOLD: 'On hold: needs review',
  IN_REVIEW: 'Sections in review',
  GENERATING_DELIVERABLES: 'Assembling kit',
  READY_FOR_RELEASE: 'Ready to release',
  ACTIVE: 'Delivered',
  FAILED: 'Failed: see run',
  DELIVERABLE_GENERATION_FAILED: 'Kit failed: see run',
  STOPPED: 'Cancelled',
  ARCHIVED: 'Archived',
};

export const BUSINESS_TYPE_VALUES = [
  'SERVICE',
  'PRODUCT',
  'ECOMMERCE',
  'SAAS',
  'LOCAL',
  'COACH',
] as const;

export const BUSINESS_MODEL_VALUES = ['B2B', 'B2C', 'D2C', 'MARKETPLACE', 'HYBRID'] as const;

export const MARKET_SCOPE_VALUES = ['LOCAL', 'REGIONAL', 'NATIONAL', 'GLOBAL'] as const;

export type BusinessType = (typeof BUSINESS_TYPE_VALUES)[number];
export type BusinessModel = (typeof BUSINESS_MODEL_VALUES)[number];
export type MarketScope = (typeof MARKET_SCOPE_VALUES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  SERVICE: 'Service',
  PRODUCT: 'Product',
  ECOMMERCE: 'E-Commerce',
  SAAS: 'SaaS',
  LOCAL: 'Local',
  COACH: 'Coach',
};

export const BUSINESS_MODEL_LABELS: Record<BusinessModel, string> = {
  B2B: 'B2B',
  B2C: 'B2C',
  D2C: 'D2C',
  MARKETPLACE: 'Marketplace',
  HYBRID: 'Hybrid',
};

export const MARKET_SCOPE_LABELS: Record<MarketScope, string> = {
  LOCAL: 'Local',
  REGIONAL: 'Regional',
  NATIONAL: 'National',
  GLOBAL: 'Global',
};

export const BUSINESS_TYPE_OPTIONS = BUSINESS_TYPE_VALUES.map((value) => ({
  value,
  label: BUSINESS_TYPE_LABELS[value],
}));

export const BUSINESS_MODEL_OPTIONS = BUSINESS_MODEL_VALUES.map((value) => ({
  value,
  label: BUSINESS_MODEL_LABELS[value],
}));

export const MARKET_SCOPE_OPTIONS = MARKET_SCOPE_VALUES.map((value) => ({
  value,
  label: MARKET_SCOPE_LABELS[value],
}));

function formatCampaignEnumValue<T extends string>(
  value: T | null | undefined,
  labels: Record<string, string>,
) {
  if (!value) {
    return null;
  }

  return labels[value] ?? value;
}

export function formatBusinessType(value: BusinessType | string | null | undefined) {
  return formatCampaignEnumValue(value, BUSINESS_TYPE_LABELS);
}

export function formatBusinessModel(value: BusinessModel | string | null | undefined) {
  return formatCampaignEnumValue(value, BUSINESS_MODEL_LABELS);
}

export function formatMarketScope(value: MarketScope | string | null | undefined) {
  return formatCampaignEnumValue(value, MARKET_SCOPE_LABELS);
}

export function formatCampaignStatus(value: CampaignStatus | string | null | undefined) {
  return formatCampaignEnumValue(value, CAMPAIGN_STATUS_LABELS);
}

/** V3-449: a campaign status in the admin's words. */
export function formatAdminCampaignStatus(value: string | null | undefined) {
  return formatCampaignEnumValue(value, ADMIN_CAMPAIGN_STATUS_LABELS);
}

/** V3-371: whether the client may start another (free) draft now. */
export interface DraftAllowance {
  canStart: boolean;
  openDrafts: number;
  maxOpenDrafts: number;
  /** Why not, in the client's words; null when they can. */
  message: string | null;
}

export interface Campaign {
  id: ID;
  title: string;
  // Legacy alias retained for existing UI and wizard flows.
  name: string;
  city: string;
  niche: string;
  businessType?: BusinessType | null;
  businessModel?: BusinessModel | null;
  marketScope?: MarketScope | null;
  website?: string | null;
  status: CampaignStatus;
  currentStep: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  v2SourceType?: string | null;
  v2PrimaryMarket?: string | null;
  v2TargetMarkets?: string[];
  v2BusinessName?: string | null;
  v2IndustryCategory?: string | null;
  v2PrimaryOfferings?: string[];
  v2PrimaryGoal?: string | null;
}

export interface CreateCampaignPayload {
  title: string;
  marketLocation: string;
  businessType: BusinessType;
  businessModel: BusinessModel;
  marketScope: MarketScope;
  websiteUrl?: string | null;
}

export interface UpdateCampaignPayload {
  title?: string;
  marketLocation?: string;
  businessType?: BusinessType;
  businessModel?: BusinessModel;
  marketScope?: MarketScope;
  websiteUrl?: string | null;
}
