import type {
  EmrImageTemplatePickerLabels,
  ImageTemplateOption,
  ImageTemplatePickerViewModel,
} from '@drguptavivek/emr-controller';

/** Mirrors the controller's FAVOURITES_GROUP_ID without adding a runtime import in emr-ui (SSR-safe). */
export const FAVOURITES_GROUP_ID = 'favourites';

export const PICKER_NAV_KEYS: readonly string[] = [
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
];

export interface ResolvedImageTemplatePickerLabels {
  readonly close: string;
  readonly searchPlaceholder: string;
  readonly searchAria: (title: string) => string;
  readonly clearSearch: string;
  readonly filterAria: (title: string) => string;
  readonly favourites: string;
  readonly all: string;
  readonly allTemplates: string;
  readonly starHint: string;
  readonly showAll: string;
  readonly resetFilters: string;
  readonly addFavourite: (label: string) => string;
  readonly removeFavourite: (label: string) => string;
}

const DEFAULT_PICKER_LABELS: ResolvedImageTemplatePickerLabels = {
  close: 'Close',
  searchPlaceholder: 'Search by name, side or view',
  searchAria: (title: string) => `Search ${title}`,
  clearSearch: 'Clear search',
  filterAria: (title: string) => `Filter ${title}`,
  favourites: 'Favourites',
  all: 'All',
  allTemplates: 'All templates',
  starHint: 'Star a template to pin it here.',
  showAll: 'Show all',
  resetFilters: 'Reset filters',
  addFavourite: (label: string) => `Add ${label} to favourites`,
  removeFavourite: (label: string) => `Remove ${label} from favourites`,
};

export function resolveImageTemplatePickerLabels(
  labels?: EmrImageTemplatePickerLabels,
): ResolvedImageTemplatePickerLabels {
  return { ...DEFAULT_PICKER_LABELS, ...labels };
}

export function resolveImageTemplatePickerId(
  idPrefix = '',
  headingId?: string | null,
  fallbackId = 'emr-image-template-picker',
): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  if (prefix) return `${prefix}-emr-image-template-picker`;
  const heading = headingId?.trim();
  if (heading) return `${heading}-picker`;
  return fallbackId;
}

export function resolveImageTemplatePickerHeadingId(
  idPrefix = '',
  headingId?: string | null,
  fallbackId = 'emr-image-template-picker-heading',
): string {
  const heading = headingId?.trim();
  if (heading) return heading;
  const prefix = idPrefix.trim().replace(/-+$/, '');
  if (prefix) return `${prefix}-emr-image-template-picker-heading`;
  return fallbackId;
}

export function resolveImageTemplateSearchId(
  idPrefix = '',
  headingId?: string | null,
  fallbackId?: string,
): string {
  return `${resolveImageTemplatePickerId(idPrefix, headingId, fallbackId)}-q`;
}

export function resolveImageTemplateSectionId(
  section: 'fav' | 'all',
  idPrefix = '',
  headingId?: string | null,
  fallbackId?: string,
): string {
  return `${resolveImageTemplatePickerId(idPrefix, headingId, fallbackId)}-${section}`;
}

export interface PartitionedImageTemplates {
  readonly favs: readonly ImageTemplateOption[];
  readonly rest: readonly ImageTemplateOption[];
  readonly flat: readonly ImageTemplateOption[];
}

export function partitionImageTemplates(
  model: Pick<ImageTemplatePickerViewModel, 'options' | 'favouriteIds'>,
): PartitionedImageTemplates {
  const byId = new Map(model.options.map((o) => [o.id, o]));
  const favs = (model.favouriteIds ?? []).flatMap((id) => {
    const o = byId.get(id);
    return o ? [o] : [];
  });
  const favSet = new Set(favs.map((o) => o.id));
  const rest = model.options.filter((o) => !favSet.has(o.id));
  return { favs, rest, flat: [...favs, ...rest] };
}

export function canSelectImageTemplate(
  readOnly: boolean | undefined,
  option: Pick<ImageTemplateOption, 'id'> | undefined | null,
): boolean {
  return !readOnly && Boolean(option && option.id);
}

export function canToggleTemplateFavourite(
  model: Pick<ImageTemplatePickerViewModel, 'readOnly' | 'canEditFavourites'>,
  option: Pick<ImageTemplateOption, 'id'> | undefined | null,
  readOnlyOverride?: boolean,
): boolean {
  return !readOnlyOverride && !model.readOnly && Boolean(model.canEditFavourites) && Boolean(option && option.id);
}

export function canEditTemplateFavourites(
  model: Pick<ImageTemplatePickerViewModel, 'canEditFavourites' | 'readOnly'>,
  readOnlyOverride = false,
): boolean {
  return !readOnlyOverride && !model.readOnly && Boolean(model.canEditFavourites);
}

export function showFavouritesFilterChip(
  model: Pick<ImageTemplatePickerViewModel, 'favouriteIds' | 'canEditFavourites' | 'readOnly'>,
  readOnlyOverride = false,
): boolean {
  return Boolean(model.favouriteIds?.length) || canEditTemplateFavourites(model, readOnlyOverride);
}

export function showFavouritePinHint(
  model: Pick<ImageTemplatePickerViewModel, 'favouriteIds' | 'canEditFavourites' | 'readOnly'>,
  readOnlyOverride = false,
): boolean {
  return canEditTemplateFavourites(model, readOnlyOverride) && !model.favouriteIds?.length;
}

export function isTemplateFavourite(
  model: Pick<ImageTemplatePickerViewModel, 'favouriteIds'>,
  templateId: string,
): boolean {
  return Boolean(model.favouriteIds?.includes(templateId));
}

export function templateTileLabel(option: Pick<ImageTemplateOption, 'label' | 'badges'>): string {
  return option.badges?.length ? `${option.label}, ${option.badges.join(', ')}` : option.label;
}

export function resolvePickerTabStopId(
  flat: readonly Pick<ImageTemplateOption, 'id'>[],
  selectedId?: string,
  activeId?: string | null,
): string | undefined {
  const pick = (id?: string | null) => (id && flat.some((o) => o.id === id) ? id : undefined);
  return pick(activeId) ?? pick(selectedId) ?? flat[0]?.id;
}

export function templateGridNextIndex(
  key: string,
  currentIndex: number,
  totalCount: number,
  favCount: number,
  columns: number,
): number | null {
  if (totalCount <= 0 || currentIndex < 0 || currentIndex >= totalCount) return null;
  const cols = Math.max(1, columns);
  switch (key) {
    case 'ArrowRight':
      return Math.min(currentIndex + 1, totalCount - 1);
    case 'ArrowLeft':
      return Math.max(currentIndex - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return totalCount - 1;
    case 'ArrowDown':
      if (currentIndex < favCount) {
        if (currentIndex + cols < favCount) return currentIndex + cols;
        return favCount < totalCount
          ? favCount + Math.min(currentIndex % cols, totalCount - favCount - 1)
          : currentIndex;
      }
      return currentIndex + cols < totalCount ? currentIndex + cols : currentIndex;
    case 'ArrowUp':
      if (currentIndex >= favCount && currentIndex - cols < favCount) {
        return favCount > 0
          ? Math.min(Math.floor((favCount - 1) / cols) * cols + ((currentIndex - favCount) % cols), favCount - 1)
          : currentIndex;
      }
      return currentIndex - cols >= 0 ? currentIndex - cols : currentIndex;
    default:
      return null;
  }
}
