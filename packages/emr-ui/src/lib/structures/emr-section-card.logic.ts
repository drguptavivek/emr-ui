import type {
  EmrSectionCardHeadingLevel,
  EmrSectionCardPadding,
  EmrSectionCardToggleLabels,
  EmrSectionCardVariant,
  EmrTone,
} from '@drguptavivek/emr-controller';

const VALID_VARIANTS = new Set<EmrSectionCardVariant>(['outlined', 'elevated', 'filled', 'subtle']);
const VALID_PADDINGS = new Set<EmrSectionCardPadding>(['none', 'sm', 'md', 'lg']);
const VALID_TONES = new Set<EmrTone>(['neutral', 'info', 'success', 'warning', 'danger']);

const SECTION_CARD_ICON_PATHS: Readonly<Record<string, readonly string[]>> = {
  calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  eye: [
    'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 16v-4', 'M12 8h.01'],
  warning: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  danger: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'm15 9-6 6', 'm9 9 6 6'],
  check: ['M20 6 9 17l-5-5'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  unlock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 9.9-1'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.3-4.3'],
  plus: ['M5 12h14', 'M12 5v14'],
  minus: ['M5 12h14'],
  pen: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'],
  copy: ['M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M2 14h4', 'M10 8h4', 'M18 16h4'],
  message: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  star: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
  camera: ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', 'M12 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  scanner: ['M3 7V5a2 2 0 0 1 2-2h2', 'M17 3h2a2 2 0 0 1 2 2v2', 'M21 17v2a2 2 0 0 1-2 2h-2', 'M7 21H5a2 2 0 0 1-2-2v-2', 'M3 12h18'],
  mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  undo: ['M3 7v6h6', 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13'],
  redo: ['M21 7v6h-6', 'M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7'],
};

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

export function resolveSectionCardIconPaths(name?: string): readonly string[] {
  if (!name) return [];
  return SECTION_CARD_ICON_PATHS[name] ?? [];
}
