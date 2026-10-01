import { ApiError } from '../errors';
import type {
  RevertSystemSettingPayload,
  SettingChange,
  SystemSetting,
  SystemSettingsListing,
  UpdateSystemSettingPayload,
} from '../../types/systemSettings';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const base = {
  unit: null,
  min: null,
  max: null,
  integer: false,
  allowed: null,
  lockedReason: null,
  isSet: true,
  updatedAt: '2026-10-01T00:00:00.000Z',
  lastChange: null,
} as const;

// Local fixtures shaped like the Backend's settings listing.
const settings: SystemSetting[] = [
  {
    ...base,
    key: 'pipeline_v2.provider_max_concurrency_per_provider',
    label: 'Parallel calls per data provider',
    category: 'providers',
    unit: 'calls',
    effect:
      'How many requests one run may have open at once against a single data provider. Higher finishes research sooner but risks the provider refusing requests for going over its rate limit; lower is slower and safer.',
    appliesWhen: 'new_runs',
    min: 1,
    max: 16,
    integer: true,
    editable: true,
    valueType: 'number',
    value: 4,
    defaultValue: 4,
    isDefault: true,
  },
  {
    ...base,
    key: 'pipeline_v2.competitive_review_collection_enabled',
    label: 'Collect competitor reviews',
    category: 'research',
    effect:
      'When on, research gathers public reviews of the competitors it finds and uses them in the competitive analysis. Off saves provider cost and time, and the strategy has less evidence about what customers say of competitors.',
    appliesWhen: 'new_runs',
    editable: true,
    valueType: 'boolean',
    value: true,
    defaultValue: true,
    isDefault: true,
  },
  {
    ...base,
    key: 'pipeline_v2.section_human_approval_required',
    label: 'Human approval of every section',
    category: 'review',
    effect:
      'Every generated strategy section waits for a reviewer to approve it before it can appear in a delivered document.',
    appliesWhen: 'new_runs',
    editable: false,
    lockedReason:
      'A product rule: no section reaches a client without a person approving it. It cannot be switched off from here.',
    valueType: 'boolean',
    value: true,
    defaultValue: true,
    isDefault: true,
  },
];

const history: SettingChange[] = [];

function listing(): SystemSettingsListing {
  return {
    categories: [
      { id: 'providers', label: 'Data providers', description: 'Limits on calls to search and crawling providers.' },
      { id: 'research', label: 'Research', description: 'What research gathers for each run.' },
      { id: 'review', label: 'Review and delivery', description: 'Rules for human review and the delivered document.' },
    ],
    settings: settings.map((setting) => ({ ...setting })),
  };
}

function apply(key: string, value: unknown, reason: string, kind: string, revertOf: string | null) {
  const setting = settings.find((candidate) => candidate.key === key);
  if (!setting) {
    throw new ApiError({ kind: 'NotFound', status: 404, message: 'There is no setting with that name.' });
  }
  if (!setting.editable) {
    throw new ApiError({ kind: 'Validation', status: 409, message: setting.lockedReason ?? 'Locked.' });
  }
  if (reason.trim().length < 10) {
    throw new ApiError({
      kind: 'Validation',
      status: 400,
      message: 'Say why the setting is changing (at least 10 characters).',
    });
  }
  const change: SettingChange = {
    id: `mock-change-${history.length + 1}`,
    key,
    previousValue: setting.value,
    newValue: value,
    changeKind: kind,
    reason: reason.trim(),
    revertOfChangeId: revertOf,
    changedBy: 'admin@adcendy.local',
    changedAt: new Date().toISOString(),
  };
  history.unshift(change);
  setting.value = value;
  setting.isDefault = JSON.stringify(value) === JSON.stringify(setting.defaultValue);
  setting.updatedAt = change.changedAt;
  setting.lastChange = change;
  return { ...setting };
}

export const systemSettingsMockAdapter = {
  async listSettings(): Promise<SystemSettingsListing> {
    await delay(150);
    return listing();
  },

  async listHistory(params: { key?: string; limit?: number } = {}): Promise<SettingChange[]> {
    await delay(100);
    return history.filter((change) => !params.key || change.key === params.key).slice(0, params.limit ?? 50);
  },

  async updateSetting(payload: UpdateSystemSettingPayload): Promise<SystemSetting> {
    await delay(150);
    return apply(payload.key, payload.value, payload.reason, 'update', null);
  },

  async revertChange(payload: RevertSystemSettingPayload): Promise<SystemSetting> {
    await delay(150);
    const change = history.find((candidate) => candidate.id === payload.changeId);
    if (!change) {
      throw new ApiError({ kind: 'NotFound', status: 404, message: 'That change does not exist.' });
    }
    return apply(change.key, change.previousValue, payload.reason, 'revert', change.id);
  },
};
