/**
 * System settings as the Backend's admin settings screen serves them
 * (`/api/v2/admin/pipeline-v2/config`): each setting's value and default, the
 * plain-language effect of changing it, its bounds, and whether it may be
 * changed here at all.
 */

export type SettingValueType = 'string' | 'number' | 'boolean' | 'array' | 'object';
export type SettingAppliesWhen = 'new_runs' | 'live';

export interface SettingCategory {
  id: string;
  label: string;
  description: string;
}

export interface SettingChange {
  id: string;
  key: string;
  previousValue: unknown;
  newValue: unknown;
  changeKind: 'update' | 'revert' | string;
  reason: string;
  revertOfChangeId: string | null;
  changedBy: string | null;
  changedAt: string;
}

export interface SystemSetting {
  key: string;
  label: string;
  category: string;
  unit: string | null;
  effect: string;
  appliesWhen: SettingAppliesWhen;
  min: number | null;
  max: number | null;
  integer: boolean;
  allowed: string[] | null;
  editable: boolean;
  lockedReason: string | null;
  valueType: SettingValueType | null;
  value: unknown;
  defaultValue: unknown;
  isDefault: boolean;
  isSet: boolean;
  updatedAt: string | null;
  lastChange: SettingChange | null;
}

export interface SystemSettingsListing {
  categories: SettingCategory[];
  settings: SystemSetting[];
}

export interface UpdateSystemSettingPayload {
  key: string;
  value: unknown;
  reason: string;
}

export interface RevertSystemSettingPayload {
  changeId: string;
  reason: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const nullableText = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;
const nullableNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const VALUE_TYPES: SettingValueType[] = ['string', 'number', 'boolean', 'array', 'object'];

export function normalizeSettingChange(value: unknown): SettingChange | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }
  return {
    id: value.id,
    key: text(value.key),
    previousValue: value.previousValue ?? null,
    newValue: value.newValue ?? null,
    changeKind: text(value.changeKind),
    reason: text(value.reason),
    revertOfChangeId: nullableText(value.revertOfChangeId),
    changedBy: nullableText(value.changedBy),
    changedAt: text(value.changedAt),
  };
}

export function normalizeSystemSetting(value: unknown): SystemSetting | null {
  if (!isRecord(value) || typeof value.key !== 'string') {
    return null;
  }
  const valueType = VALUE_TYPES.find((type) => type === value.valueType) ?? null;
  return {
    key: value.key,
    label: text(value.label) || value.key,
    category: text(value.category),
    unit: nullableText(value.unit),
    effect: text(value.effect),
    appliesWhen: value.appliesWhen === 'live' ? 'live' : 'new_runs',
    min: nullableNumber(value.min),
    max: nullableNumber(value.max),
    integer: value.integer === true,
    allowed: Array.isArray(value.allowed)
      ? value.allowed.filter((item): item is string => typeof item === 'string')
      : null,
    editable: value.editable === true,
    lockedReason: nullableText(value.lockedReason),
    valueType,
    value: value.value ?? null,
    defaultValue: value.defaultValue ?? null,
    isDefault: value.isDefault === true,
    isSet: value.isSet === true,
    updatedAt: nullableText(value.updatedAt),
    lastChange: normalizeSettingChange(value.lastChange),
  };
}

export function normalizeSystemSettingsListing(value: unknown): SystemSettingsListing {
  const record = isRecord(value) ? value : {};
  const categories = Array.isArray(record.categories)
    ? record.categories.filter(isRecord).map((category) => ({
        id: text(category.id),
        label: text(category.label),
        description: text(category.description),
      }))
    : [];
  const settings = Array.isArray(record.settings)
    ? record.settings
        .map(normalizeSystemSetting)
        .filter((setting): setting is SystemSetting => setting !== null)
    : [];
  return { categories, settings };
}

export function normalizeSettingHistory(value: unknown): SettingChange[] {
  const record = isRecord(value) ? value : {};
  return Array.isArray(record.changes)
    ? record.changes
        .map(normalizeSettingChange)
        .filter((change): change is SettingChange => change !== null)
    : [];
}
