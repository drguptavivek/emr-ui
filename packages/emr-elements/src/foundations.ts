import { LitElement, css, type CSSResultGroup } from 'lit';

export type EmrThemePresetId =
  | 'clinical-slate'
  | 'surgical-teal'
  | 'royal-blue'
  | 'forest-emerald'
  | 'ophthal-dark-room';

export type EmrFontStackId = 'inter' | 'ibm-plex' | 'atkinson' | 'system';
export type EmrRadiusPresetId = 'sharp' | 'crisp' | 'standard' | 'soft';
export type EmrDensityPresetId = 'compact' | 'standard' | 'touch';
export type EmrFontScaleId = '0.9' | '1' | '1.1' | '1.2';

export interface EmrCustomThemeConfig {
  preset: EmrThemePresetId;
  scheme: 'light' | 'dark';
  fontStack: EmrFontStackId;
  radius: EmrRadiusPresetId;
  density: EmrDensityPresetId;
  fontScale: EmrFontScaleId;
  customBrandHex?: string;
}

export const DEFAULT_EMR_CUSTOM_THEME: EmrCustomThemeConfig = {
  preset: 'clinical-slate',
  scheme: 'light',
  fontStack: 'inter',
  radius: 'standard',
  density: 'standard',
  fontScale: '1',
};

export const EMR_FONT_STACKS: Readonly<Record<EmrFontStackId, { label: string; sans: string; mono: string; features: string }>> = {
  inter: {
    label: 'Inter Variable (Clinical I/l + Tabular)',
    sans: "'Inter Variable', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    features: '"cv05" 1, "cv08" 1, "ss03" 1, "zero" 1',
  },
  'ibm-plex': {
    label: 'IBM Plex Sans + IBM Plex Mono',
    sans: "'IBM Plex Sans', 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    features: '"zero" 1, "ss01" 1',
  },
  atkinson: {
    label: 'Atkinson Hyperlegible (Low-Vision / Ophthal)',
    sans: "'Atkinson Hyperlegible', 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    features: '"zero" 1',
  },
  system: {
    label: 'System UI Native',
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    features: 'normal',
  },
};

export interface EmrPaletteTokens {
  label: string;
  primary: string;
  primaryHover: string;
  primaryContrast: string;
  primarySoft: string;
  primaryBorder: string;
  focus: string;
  background?: string;
  surface?: string;
  surfaceSoft?: string;
  surfaceRaised?: string;
  border?: string;
  text?: string;
  textMuted?: string;
}

export const EMR_PALETTE_PRESETS: Readonly<Record<EmrThemePresetId, { light: EmrPaletteTokens; dark: EmrPaletteTokens }>> = {
  'clinical-slate': {
    light: {
      label: 'Clinical Slate (Default)',
      primary: '#475f70',
      primaryHover: '#d4e0e6',
      primaryContrast: '#344b5a',
      primarySoft: '#e3ebef',
      primaryBorder: '#b2c4ce',
      focus: '#5f7f92',
    },
    dark: {
      label: 'Clinical Slate (Dark)',
      primary: '#c5d5df',
      primaryHover: '#435966',
      primaryContrast: '#e8eff3',
      primarySoft: '#334755',
      primaryBorder: '#708998',
      focus: '#8fb0c2',
    },
  },
  'surgical-teal': {
    light: {
      label: 'Surgical Teal',
      primary: '#0f766e',
      primaryHover: '#ccfbf1',
      primaryContrast: '#115e59',
      primarySoft: '#e6fffa',
      primaryBorder: '#5eead4',
      focus: '#0d9488',
    },
    dark: {
      label: 'Surgical Teal (Dark)',
      primary: '#5eead4',
      primaryHover: '#115e59',
      primaryContrast: '#ccfbf1',
      primarySoft: '#134e4a',
      primaryBorder: '#2dd4bf',
      focus: '#2dd4bf',
    },
  },
  'royal-blue': {
    light: {
      label: 'Hospital Blue',
      primary: '#1d4ed8',
      primaryHover: '#dbeafe',
      primaryContrast: '#1e3a8a',
      primarySoft: '#eff6ff',
      primaryBorder: '#93c5fd',
      focus: '#2563eb',
    },
    dark: {
      label: 'Hospital Blue (Dark)',
      primary: '#93c5fd',
      primaryHover: '#1e3a8a',
      primaryContrast: '#dbeafe',
      primarySoft: '#172554',
      primaryBorder: '#60a5fa',
      focus: '#60a5fa',
    },
  },
  'forest-emerald': {
    light: {
      label: 'Clinical Emerald',
      primary: '#15803d',
      primaryHover: '#dcfce7',
      primaryContrast: '#14532d',
      primarySoft: '#f0fdf4',
      primaryBorder: '#86efac',
      focus: '#16a34a',
    },
    dark: {
      label: 'Clinical Emerald (Dark)',
      primary: '#86efac',
      primaryHover: '#14532d',
      primaryContrast: '#dcfce7',
      primarySoft: '#052e16',
      primaryBorder: '#4ade80',
      focus: '#4ade80',
    },
  },
  'ophthal-dark-room': {
    light: {
      label: 'Ophthalmology Dark-Room (Low Glare)',
      primary: '#7dd3fc',
      primaryHover: '#1e293b',
      primaryContrast: '#e0f2fe',
      primarySoft: '#0f172a',
      primaryBorder: '#38bdf8',
      focus: '#38bdf8',
      background: '#050811',
      surface: '#0b1120',
      surfaceSoft: '#111827',
      surfaceRaised: '#1e293b',
      border: '#334155',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
    },
    dark: {
      label: 'Ophthalmology Dark-Room (Low Glare)',
      primary: '#7dd3fc',
      primaryHover: '#1e293b',
      primaryContrast: '#e0f2fe',
      primarySoft: '#0f172a',
      primaryBorder: '#38bdf8',
      focus: '#38bdf8',
      background: '#050811',
      surface: '#0b1120',
      surfaceSoft: '#111827',
      surfaceRaised: '#1e293b',
      border: '#334155',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
    },
  },
};

export const EMR_RADIUS_MAP: Readonly<Record<EmrRadiusPresetId, { label: string; px: number }>> = {
  sharp: { label: 'Sharp (0px)', px: 0 },
  crisp: { label: 'Crisp (6px)', px: 6 },
  standard: { label: 'Standard (8px)', px: 8 },
  soft: { label: 'Soft (12px)', px: 12 },
};

export const EMR_DENSITY_MAP: Readonly<Record<EmrDensityPresetId, { label: string; heightPx: number; compactPx: number }>> = {
  compact: { label: 'Compact (36px)', heightPx: 36, compactPx: 28 },
  standard: { label: 'Standard (44px)', heightPx: 44, compactPx: 32 },
  touch: { label: 'Touch (48px)', heightPx: 48, compactPx: 36 },
};

export function resolveEmrThemeVariables(config: EmrCustomThemeConfig): Record<string, string> {
  const effectiveScheme = config.preset === 'ophthal-dark-room' ? 'dark' : config.scheme;
  const pal = EMR_PALETTE_PRESETS[config.preset][effectiveScheme];
  const font = EMR_FONT_STACKS[config.fontStack];
  const rad = EMR_RADIUS_MAP[config.radius].px;
  const dens = EMR_DENSITY_MAP[config.density];
  const scale = Number(config.fontScale) || 1;
  const rem = (base: number) => `${Math.round(base * scale * 10000) / 10000}rem`;

  const vars: Record<string, string> = {
    '--emr-primary': config.customBrandHex || pal.primary,
    '--emr-primary-hover': pal.primaryHover,
    '--emr-primary-contrast': pal.primaryContrast,
    '--emr-primary-soft': pal.primarySoft,
    '--emr-primary-border': pal.primaryBorder,
    '--emr-focus': pal.focus,
    '--emr-font-family': font.sans,
    '--emr-font-mono': font.mono,
    '--emr-font-features': font.features,
    '--emr-radius': `${rad}px`,
    '--emr-radius-sm': `${Math.max(0, Math.round(rad * 0.65))}px`,
    '--emr-radius-lg': `${Math.round(rad * 1.4)}px`,
    '--emr-control-height': `${dens.heightPx}px`,
    '--emr-compact-height': `${dens.compactPx}px`,
    '--emr-text-2xs': rem(0.6875),
    '--emr-text-xs': rem(0.75),
    '--emr-text-sm': rem(0.8125),
    '--emr-text-md': rem(0.875),
    '--emr-text-lg': rem(1),
    '--emr-text-xl': rem(1.25),
    '--emr-text-2xl': rem(1.5),
    '--emr-weight-regular': '400',
    '--emr-weight-medium': '500',
    '--emr-weight-semibold': '600',
    '--emr-weight-bold': '700',
  };

  if (pal.background) vars['--emr-background'] = pal.background;
  if (pal.surface) vars['--emr-surface'] = pal.surface;
  if (pal.surfaceSoft) vars['--emr-surface-soft'] = pal.surfaceSoft;
  if (pal.surfaceRaised) vars['--emr-surface-raised'] = pal.surfaceRaised;
  if (pal.border) vars['--emr-border'] = pal.border;
  if (pal.text) vars['--emr-text'] = pal.text;
  if (pal.textMuted) vars['--emr-text-muted'] = pal.textMuted;

  return vars;
}

export function applyEmrCustomTheme(config: EmrCustomThemeConfig, root?: HTMLElement): void {
  if (typeof document === 'undefined') return;
  const target = root ?? document.documentElement;
  const vars = resolveEmrThemeVariables(config);
  for (const [k, v] of Object.entries(vars)) {
    target.style.setProperty(k, v);
  }
  target.style.fontFeatureSettings = EMR_FONT_STACKS[config.fontStack].features;
  target.style.fontVariantNumeric = 'tabular-nums';
}

/**
 * Shared Constructable Stylesheet adopted by every `<emr-*>` Lit Web Component.
 * Uses CSS Custom Properties (`--emr-*`) so host themes, dark mode, print context,
 * and end-user customization pierce Shadow DOM cleanly.
 */
export const emrShadowStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    color: var(--emr-text, #263847);
    font-family: var(--emr-font-family, 'Inter Variable', Inter, system-ui, sans-serif);
    font-feature-settings: var(--emr-font-features, "cv05" 1, "cv08" 1, "ss03" 1, "zero" 1);
    font-variant-numeric: tabular-nums;
    line-height: var(--emr-leading-normal, 1.45);
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .emr-card {
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius-lg, 12px);
    background: var(--emr-surface, #fffefa);
    padding: 16px;
    display: grid;
    gap: 12px;
  }

  .emr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .emr-title {
    margin: 0;
    font-size: var(--emr-text-lg, 1rem);
    font-weight: var(--emr-weight-bold, 700);
    color: var(--emr-text, #263847);
  }

  .emr-muted {
    margin: 0;
    font-size: var(--emr-text-sm, 0.8125rem);
    color: var(--emr-text-muted, #5c6c78);
  }

  .emr-control {
    min-height: var(--emr-control-height, 44px);
    height: var(--emr-control-height, 44px);
    padding: 0 12px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    font: inherit;
    font-size: var(--emr-text-md, 0.875rem);
    font-variant-numeric: tabular-nums;
    width: 100%;
  }

  .emr-control:focus-visible,
  .emr-btn:focus-visible,
  .emr-chip:focus-visible {
    outline: 2px solid var(--emr-focus, #5f7f92);
    outline-offset: -2px;
  }

  .emr-btn {
    min-height: var(--emr-control-height, 44px);
    height: var(--emr-control-height, 44px);
    padding: 0 16px;
    border: 1px solid var(--emr-primary-border, #b2c4ce);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-primary-soft, #e3ebef);
    color: var(--emr-primary-contrast, #344b5a);
    font: inherit;
    font-size: var(--emr-text-sm, 0.8125rem);
    font-weight: var(--emr-weight-semibold, 600);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    white-space: nowrap;
  }

  .emr-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover, #d4e0e6);
  }

  .emr-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .emr-btn--secondary {
    background: var(--emr-surface-soft, #f1f4f5);
    color: var(--emr-text, #263847);
    border-color: var(--emr-border, #c7d3da);
  }

  .emr-btn--outline {
    background: var(--emr-surface, #fffefa);
    color: var(--emr-primary, #475f70);
    border-color: var(--emr-primary-border, #b2c4ce);
  }

  .emr-btn--danger {
    background: var(--emr-danger-soft, #fcecec);
    color: var(--emr-danger, #a44949);
    border-color: var(--emr-danger, #a44949);
  }

  .emr-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid var(--emr-border, #c7d3da);
    background: var(--emr-neutral-soft, #e8eef1);
    color: var(--emr-text, #263847);
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-semibold, 600);
  }

  .emr-badge--info { background: var(--emr-info-soft, #e8f0f4); color: var(--emr-info, #486f86); border-color: var(--emr-info, #486f86); }
  .emr-badge--success { background: var(--emr-success-soft, #e8f5ec); color: var(--emr-success, #2b7650); border-color: var(--emr-success, #2b7650); }
  .emr-badge--warning { background: var(--emr-warning-soft, #fbf4de); color: var(--emr-warning, #8a651f); border-color: var(--emr-warning, #8a651f); }
  .emr-badge--danger { background: var(--emr-danger-soft, #fcecec); color: var(--emr-danger, #a44949); border-color: var(--emr-danger, #a44949); }

  .emr-field {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .emr-label {
    font-size: var(--emr-text-sm, 0.8125rem);
    font-weight: var(--emr-weight-semibold, 600);
    color: var(--emr-text, #263847);
  }

  .emr-hint {
    font-size: var(--emr-text-xs, 0.75rem);
    color: var(--emr-text-muted, #5c6c78);
  }

  .emr-error {
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-medium, 500);
    color: var(--emr-danger, #a44949);
  }
`;

export class EmrLitElement extends LitElement {
  static override styles: CSSResultGroup = [emrShadowStyles];

  public emitIntent<T>(detail: T): void {
    this.dispatchEvent(
      new CustomEvent<T>('intent', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  public emitValueChange<T>(detail: T): void {
    this.dispatchEvent(
      new CustomEvent<T>('valueChange', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

export function defineEmrElement(tagName: string, ctor: CustomElementConstructor): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, ctor);
  }
}
