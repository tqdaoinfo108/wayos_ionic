import type { LookupItem } from '../services/billTrackingService';

export interface LookupOption {
  value: number | string;
  label: string;
}

const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== '';

export const resolveLookupOption = (
  item: LookupItem,
  valueKeys: string[],
  labelKeys: string[],
): LookupOption | null => {
  for (const valueKey of valueKeys) {
    if (!Object.prototype.hasOwnProperty.call(item, valueKey)) continue;
    const rawValue = item[valueKey];
    if (!hasValue(rawValue)) continue;

    for (const labelKey of labelKeys) {
      if (!Object.prototype.hasOwnProperty.call(item, labelKey)) continue;
      const rawLabel = item[labelKey];
      if (!hasValue(rawLabel)) continue;

      return {
        value: typeof rawValue === 'number' ? rawValue : Number(rawValue) || String(rawValue),
        label: String(rawLabel),
      };
    }
  }

  return null;
};

export const mapLookupOptions = (
  items: LookupItem[],
  valueKeys: string[],
  labelKeys: string[],
): LookupOption[] =>
  items
    .map((item) => resolveLookupOption(item, valueKeys, labelKeys))
    .filter((option): option is LookupOption => option !== null);

export const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};
