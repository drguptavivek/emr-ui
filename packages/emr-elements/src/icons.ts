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
  | 'upload'
  | 'camera'
  | 'scanner'
  | 'mic'
  | 'phone'
  | 'file'
  | 'user'
  | 'pen'
  | 'copy'
  | 'crop'
  | 'rotate-ccw'
  | 'rotate-cw'
  | 'flip-h'
  | 'flip-v';

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
      case 'upload':
        return svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />`;
      case 'download':
        return svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />`;
      case 'camera':
        return svg`<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />`;
      case 'scanner':
        return svg`<polyline points="4 7 4 4 7 4" /><polyline points="17 4 20 4 20 7" /><polyline points="20 17 20 20 17 20" /><polyline points="7 20 4 20 4 17" /><line x1="3" y1="12" x2="21" y2="12" />`;
      case 'mic':
        return svg`<rect x="9" y="2" width="6" height="11" rx="3" /><path d="M19 10a7 7 0 0 1-14 0" /><line x1="12" y1="19" x2="12" y2="22" />`;
      case 'phone':
        return svg`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />`;
      case 'file':
        return svg`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />`;
      case 'user':
        return svg`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />`;
      case 'pen':
        return svg`<path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />`;
      case 'copy':
        return svg`<rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />`;
      case 'crop':
        return svg`<path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" />`;
      case 'rotate-ccw':
        return svg`<polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />`;
      case 'rotate-cw':
        return svg`<polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />`;
      case 'flip-h':
        return svg`<line x1="12" y1="3" x2="12" y2="21" /><polygon points="8 7 3 12 8 17 8 7" /><polygon points="16 7 21 12 16 17 16 7" />`;
      case 'flip-v':
        return svg`<line x1="3" y1="12" x2="21" y2="12" /><polygon points="7 8 12 3 17 8 7 8" /><polygon points="7 16 12 21 17 16 7 16" />`;
      case 'zoom-in':
        return svg`<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />`;
      case 'zoom-out':
        return svg`<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" /><line x1="8" y1="11" x2="14" y2="11" />`;
      case 'maximize':
        return svg`<polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />`;
      default:
        return svg`<circle cx="12" cy="12" r="8" />`;
    }
  })();

  return svg`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}
