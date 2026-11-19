import type { EmrTone, SectionCardIntent } from './models.js';

export type { SectionCardIntent };

export type EmrSectionCardVariant = 'outlined' | 'elevated' | 'filled' | 'subtle';
export type EmrSectionCardPadding = 'none' | 'sm' | 'md' | 'lg';
export type EmrSectionCardHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface EmrSectionCardToggleLabels {
  readonly show?: string;
  readonly hide?: string;
}

const VALID_VARIANTS = new Set<EmrSectionCardVariant>(['outlined', 'elevated', 'filled', 'subtle']);
const VALID_PADDINGS = new Set<EmrSectionCardPadding>(['none', 'sm', 'md', 'lg']);
const VALID_TONES = new Set<EmrTone>(['neutral', 'info', 'success', 'warning', 'danger']);

export function normalizeSectionCardVariant(variant?: unknown): EmrSectionCardVariant {
  return typeof variant === 'string' && VALID_VARIANTS.has(variant as EmrSectionCardVariant)
    ? (variant as EmrSectionCardVariant)
    : 'outlined';
}

export function normalizeSectionCardPadding(padding?: unknown): EmrSectionCardPadding {
  return typeof padding === 'string' && VALID_PADDINGS.has(padding as EmrSectionCardPadding)
    ? (padding as EmrSectionCardPadding)
    : 'md';
}

export function normalizeSectionCardTone(tone?: unknown): EmrTone {
  return typeof tone === 'string' && VALID_TONES.has(tone as EmrTone) ? (tone as EmrTone) : 'neutral';
}

export function normalizeSectionCardHeadingLevel(level?: unknown): EmrSectionCardHeadingLevel {
  if (level === 2 || level === 3 || level === 4 || level === 5 || level === 6) {
    return level;
  }
  return 2;
}

export function resolveSectionCardHeadingId(sectionId: string, headingId?: string | null): string {
  return headingId && headingId.trim() ? headingId.trim() : `emr-section-${sectionId}-heading`;
}

export function resolveSectionCardContentId(sectionId: string): string {
  return `emr-section-${sectionId}-content`;
}

export function resolveSectionCardToggleLabel(
  collapsed: boolean,
  label: string,
  labels?: EmrSectionCardToggleLabels,
): string {
  const action = collapsed ? (labels?.show ?? 'Show') : (labels?.hide ?? 'Hide');
  return `${action} ${label}`;
}
