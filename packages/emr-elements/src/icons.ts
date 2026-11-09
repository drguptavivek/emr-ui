import { svg, type SVGTemplateResult } from 'lit';

export type EmrLitIconName =
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
  | 'chevron-down'
  | 'chevron-up'
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
  | 'pen';

export function renderEmrSvgIcon(name: EmrLitIconName, size = 18): SVGTemplateResult {
  const inner = (() => {
    switch (name) {
      case 'calendar':
        return svg`<rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />`;
      case 'clock':
        return svg`<circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />`;
      case 'eye':
        return svg`<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />`;
      case 'eye-off':
        return svg`<path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.4 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" /><line x1="2" y1="2" x2="22" y2="22" />`;
      case 'lock':
        return svg`<rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />`;
      case 'unlock':
        return svg`<rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.8-1" />`;
      case 'plus':
        return svg`<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />`;
      case 'minus':
        return svg`<line x1="5" y1="12" x2="19" y2="12" />`;
      case 'check':
        return svg`<polyline points="20 6 9 17 4 12" />`;
      case 'close':
        return svg`<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />`;
      case 'chevron-down':
        return svg`<polyline points="6 9 12 15 18 9" />`;
      case 'chevron-up':
        return svg`<polyline points="18 15 12 9 6 15" />`;
      case 'chevron-left':
        return svg`<polyline points="15 18 9 12 15 6" />`;
      case 'chevron-right':
        return svg`<polyline points="9 18 15 12 9 6" />`;
      case 'search':
        return svg`<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" />`;
      case 'warning':
        return svg`<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />`;
      case 'info':
        return svg`<circle cx="12" cy="12" r="9" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />`;
      case 'danger':
        return svg`<circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />`;
      case 'trash':
        return svg`<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />`;
      default:
        return svg`<circle cx="12" cy="12" r="8" />`;
    }
  })();

  return svg`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}
