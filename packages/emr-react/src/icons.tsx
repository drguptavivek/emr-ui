'use client';

import { createElement } from 'react';
import { Platform, Text, View } from 'react-native';

export type EmrIconName =
  | 'calendar'
  | 'clock'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'unlock'
  | 'hand'
  | 'cursor'
  | 'message'
  | 'plus'
  | 'minus'
  | 'check'
  | 'close'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'search'
  | 'warning'
  | 'info'
  | 'danger'
  | 'star'
  | 'trash'
  | 'undo'
  | 'redo'
  | 'zoom-in'
  | 'zoom-out'
  | 'maximize'
  | 'download'
  | 'upload'
  | 'camera'
  | 'paperclip'
  | 'phone'
  | 'mic'
  | 'pen'
  | 'sliders';

export type IconName = EmrIconName;

/**
 * Standard 24x24 Lucide / Heroicons 1.75px monochrome stroke SVG paths (`stroke="currentColor"`).
 * Renders identical vector geometry across Chrome, Safari, Firefox, macOS, Windows, iOS, and Android.
 */
const ICON_PATHS: Record<EmrIconName, readonly string[]> = {
  calendar: [
    'M8 2v4',
    'M16 2v4',
    'M3 10h18',
    'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ],
  clock: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 6v6l4 2',
  ],
  eye: [
    'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ],
  'eye-off': [
    'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49',
    'M14.084 14.158a3 3 0 0 1-4.242-4.242',
    'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143',
    'M2 2l20 20',
  ],
  lock: [
    'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
    'M7 11V7a5 5 0 0 1 10 0v4',
  ],
  unlock: [
    'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
    'M7 11V7a5 5 0 0 1 9.9-1',
  ],
  hand: [
    'M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2',
    'M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6',
    'M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8',
    'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
  ],
  cursor: [
    'M4 4l7.07 17 2.51-7.39L21 11.07z',
  ],
  message: [
    'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
  ],
  plus: ['M5 12h14', 'M12 5v14'],
  minus: ['M5 12h14'],
  check: ['M20 6 9 17l-5-5'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  'chevron-up': ['m18 15-6-6-6 6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.3-4.3'],
  warning: [
    'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
    'M12 9v4',
    'M12 17h.01',
  ],
  info: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 16v-4',
    'M12 8h.01',
  ],
  danger: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'm15 9-6 6',
    'm9 9 6 6',
  ],
  star: [
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  ],
  trash: [
    'M3 6h18',
    'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
    'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
  ],
  undo: ['M3 7v6h6', 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13'],
  redo: ['M21 7v6h-6', 'M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7'],
  'zoom-in': ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.35-4.35', 'M11 8v6', 'M8 11h6'],
  'zoom-out': ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.35-4.35', 'M8 11h6'],
  maximize: ['M15 3h6v6', 'M9 21H3v-6', 'M21 3l-7 7', 'M3 21l7-7'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  camera: [
    'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z',
    'M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ],
  paperclip: ['m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'],
  phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'],
  mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3'],
  pen: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'],
  sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M2 14h4', 'M10 8h4', 'M18 16h4'],
};

const NATIVE_FALLBACK: Record<EmrIconName, string> = {
  calendar: '⊞',
  clock: '◷',
  eye: '◉',
  'eye-off': '⊘',
  lock: '▣',
  unlock: '▢',
  hand: '✥',
  cursor: '↖',
  message: '□',
  plus: '+',
  minus: '−',
  check: '✓',
  close: '×',
  'chevron-up': '▴',
  'chevron-down': '▾',
  'chevron-left': '‹',
  'chevron-right': '›',
  search: '⌕',
  warning: '!',
  info: 'i',
  danger: '×',
  star: '☆',
  trash: '×',
  undo: '↶',
  redo: '↷',
  'zoom-in': '+',
  'zoom-out': '−',
  maximize: '⤢',
  download: '↓',
  upload: '↑',
  camera: '◎',
  paperclip: '◈',
  phone: '☏',
  mic: '●',
  pen: '✎',
  sliders: '≡',
};

export function isEmrIconName(value: string): value is EmrIconName {
  return Object.prototype.hasOwnProperty.call(ICON_PATHS, value);
}

/**
 * Lightweight monochrome SVG icon primitive (Lucide 24x24 geometry, 1.75px stroke).
 * Never uses multi-colour OS emojis.
 */
export function SvgIcon({
  name,
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.75,
}: {
  name: EmrIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const paths = ICON_PATHS[name];
  if (Platform.OS === 'web') {
    return createElement(
      'svg' as unknown as React.ComponentType<Record<string, unknown>>,
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block', flexShrink: 0 },
      },
      ...paths.map((d, i) =>
        createElement('path' as unknown as React.ComponentType<Record<string, unknown>>, { key: i, d }),
      ),
    );
  }
  return (
    <View aria-hidden style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: size * 0.85, lineHeight: size }}>{NATIVE_FALLBACK[name]}</Text>
    </View>
  );
}
