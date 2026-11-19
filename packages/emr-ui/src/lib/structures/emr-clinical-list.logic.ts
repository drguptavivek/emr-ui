import type {
  ClinicalListItem,
  ClinicalListViewModel,
  EmrClinicalListHeadingLevel,
  EmrClinicalListLabels,
  EmrClinicalListVariant,
  EmrTone,
} from '@drguptavivek/emr-controller';

export type ClinicalListIconName = 'list' | 'plus' | 'pen' | 'trash' | 'alert' | 'refresh';

export interface ResolvedClinicalListLabels {
  readonly title: string;
  readonly add: string;
  readonly edit: string;
  readonly remove: string;
  readonly retry: string;
  readonly loading: string;
  readonly emptyMessage: string;
  readonly errorTitle: string;
  readonly readOnlyItem: string;
}

const DEFAULT_CLINICAL_LIST_LABELS: ResolvedClinicalListLabels = {
  title: 'Clinical information',
  add: 'Add',
  edit: 'Edit',
  remove: 'Remove',
  retry: 'Retry',
  loading: 'Loading…',
  emptyMessage: 'Status not supplied.',
  errorTitle: 'Unable to load entries',
  readOnlyItem: 'Read-only',
};

const VALID_VARIANTS = new Set<EmrClinicalListVariant>(['outlined', 'elevated', 'filled', 'subtle']);
const VALID_TONES = new Set<EmrTone>(['neutral', 'info', 'success', 'warning', 'danger']);

export const CLINICAL_LIST_ICON_PATHS: Readonly<Record<ClinicalListIconName, readonly string[]>> = {
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  plus: ['M5 12h14', 'M12 5v14'],
  pen: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'],
  trash: [
    'M3 6h18',
    'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
    'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
  ],
  alert: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 8v4', 'M12 16h.01'],
  refresh: [
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
    'M21 3v5h-5',
    'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
    'M3 21v-5h5',
  ],
};

export function resolveClinicalListIconPaths(name: ClinicalListIconName): readonly string[] {
  return CLINICAL_LIST_ICON_PATHS[name];
}

export function normalizeClinicalListVariant(variant?: unknown): EmrClinicalListVariant {
  return typeof variant === 'string' && VALID_VARIANTS.has(variant as EmrClinicalListVariant)
    ? (variant as EmrClinicalListVariant)
    : 'outlined';
}

export function normalizeClinicalListHeadingLevel(level?: unknown): EmrClinicalListHeadingLevel {
  if (level === 2 || level === 3 || level === 4 || level === 5 || level === 6) {
    return level;
  }
  return 2;
}

export function normalizeClinicalListTone(tone?: unknown): EmrTone {
  return typeof tone === 'string' && VALID_TONES.has(tone as EmrTone) ? (tone as EmrTone) : 'neutral';
}

export function canAddClinicalListItem(
  model?: Pick<ClinicalListViewModel, 'readOnly' | 'allowAdd'>,
): boolean {
  return Boolean(model && !model.readOnly && model.allowAdd !== false);
}

export function canEditClinicalListItem(
  model?: Pick<ClinicalListViewModel, 'readOnly'>,
  item?: Pick<ClinicalListItem, 'readOnly' | 'canEdit'>,
): boolean {
  return Boolean(model && item && !model.readOnly && !item.readOnly && item.canEdit !== false);
}

export function canRemoveClinicalListItem(
  model?: Pick<ClinicalListViewModel, 'readOnly'>,
  item?: Pick<ClinicalListItem, 'readOnly' | 'canRemove'>,
): boolean {
  return Boolean(model && item && !model.readOnly && !item.readOnly && item.canRemove !== false);
}

export function isClinicalListItemSelectable(item?: Pick<ClinicalListItem, 'selectable'>): boolean {
  return Boolean(item && item.selectable !== false);
}

export function resolveClinicalListHeadingId(
  headingId?: string | null,
  fallback = 'emr-clinical-list-title',
): string {
  return headingId && headingId.trim() ? headingId.trim() : fallback;
}

export function resolveClinicalListLabels(
  labels?: Partial<EmrClinicalListLabels>,
): ResolvedClinicalListLabels {
  return {
    title: labels?.title ?? DEFAULT_CLINICAL_LIST_LABELS.title,
    add: labels?.add ?? DEFAULT_CLINICAL_LIST_LABELS.add,
    edit: labels?.edit ?? DEFAULT_CLINICAL_LIST_LABELS.edit,
    remove: labels?.remove ?? DEFAULT_CLINICAL_LIST_LABELS.remove,
    retry: labels?.retry ?? DEFAULT_CLINICAL_LIST_LABELS.retry,
    loading: labels?.loading ?? DEFAULT_CLINICAL_LIST_LABELS.loading,
    emptyMessage: labels?.emptyMessage ?? DEFAULT_CLINICAL_LIST_LABELS.emptyMessage,
    errorTitle: labels?.errorTitle ?? DEFAULT_CLINICAL_LIST_LABELS.errorTitle,
    readOnlyItem: labels?.readOnlyItem ?? DEFAULT_CLINICAL_LIST_LABELS.readOnlyItem,
  };
}
