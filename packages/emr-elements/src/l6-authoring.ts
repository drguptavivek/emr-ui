import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import {
  DEFAULT_EMR_CUSTOM_THEME,
  EMR_DENSITY_MAP,
  EMR_FONT_STACKS,
  EMR_PALETTE_PRESETS,
  EMR_RADIUS_MAP,
  EmrLitElement,
  applyEmrCustomTheme,
  defineEmrElement,
  emrShadowStyles,
  type EmrCustomThemeConfig,
  type EmrDensityPresetId,
  type EmrFontScaleId,
  type EmrFontStackId,
  type EmrRadiusPresetId,
  type EmrThemePresetId,
} from './foundations.js';
import { EmrControlledDomainElement } from './l4-domain.js';

export class EmrFieldGeneratorElement extends EmrControlledDomainElement {
  protected override surfaceTitle = 'Field Generator';
}
export class EmrTerminologySearchElement extends EmrControlledDomainElement {
  protected override surfaceTitle = 'Terminology Search';
}
export class EmrValidationRuleEditorElement extends EmrControlledDomainElement {
  protected override surfaceTitle = 'Validation Rule Editor';
}
export class EmrFieldLibraryPickerElement extends EmrControlledDomainElement {
  protected override surfaceTitle = 'Field Library Picker';
}
export class EmrTemplateComposerElement extends EmrControlledDomainElement {
  protected override surfaceTitle = 'EHR Template Composer';
}
export class EmrTemplatePreviewElement extends EmrControlledDomainElement {
  protected override surfaceTitle = 'Template Preview';
}

const customizerStyles = css`
  .customizer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 12px;
  }
  .pill-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
`;

export class EmrThemeCustomizerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, customizerStyles];
  @property({ attribute: false }) config: EmrCustomThemeConfig = { ...DEFAULT_EMR_CUSTOM_THEME };

  private updateConfig(patch: Partial<EmrCustomThemeConfig>): void {
    this.config = { ...this.config, ...patch };
    applyEmrCustomTheme(this.config);
    this.emitValueChange(this.config);
    this.emitIntent({ type: 'themeConfigChanged', config: this.config });
  }

  override render() {
    const c = this.config;
    return html`<section class="emr-card" part="customizer">
      <header class="emr-header">
        <div>
          <h3 class="emr-title">End-User Design & Typography Customizer</h3>
          <p class="emr-muted">Customize brand palette, border radius, control density, clinical font stack, and text scale at runtime.</p>
        </div>
      </header>
      <div class="customizer-grid">
        <div class="emr-field">
          <span class="emr-label">Brand Palette</span>
          <div class="pill-row">
            ${(Object.keys(EMR_PALETTE_PRESETS) as EmrThemePresetId[]).map((id) => {
              const p = EMR_PALETTE_PRESETS[id].light;
              return html`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:34px;height:34px;padding:0 10px;"
                aria-pressed=${c.preset === id}
                @click=${() => this.updateConfig({ preset: id })}
              >
                <span class="swatch" style="background:${p.primary};"></span>
                ${p.label}
              </button>`;
            })}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Corner Shape (Radius)</span>
          <div class="pill-row">
            ${(Object.keys(EMR_RADIUS_MAP) as EmrRadiusPresetId[]).map(
              (r) => html`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:34px;height:34px;padding:0 10px;"
                aria-pressed=${c.radius === r}
                @click=${() => this.updateConfig({ radius: r })}
              >${EMR_RADIUS_MAP[r].label}</button>`,
            )}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Control Density</span>
          <div class="pill-row">
            ${(Object.keys(EMR_DENSITY_MAP) as EmrDensityPresetId[]).map(
              (d) => html`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:34px;height:34px;padding:0 10px;"
                aria-pressed=${c.density === d}
                @click=${() => this.updateConfig({ density: d })}
              >${EMR_DENSITY_MAP[d].label}</button>`,
            )}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Typography & Font Scale</span>
          <div class="pill-row">
            ${(Object.keys(EMR_FONT_STACKS) as EmrFontStackId[]).map(
              (f) => html`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:34px;height:34px;padding:0 10px;"
                aria-pressed=${c.fontStack === f}
                @click=${() => this.updateConfig({ fontStack: f })}
              >${EMR_FONT_STACKS[f].label}</button>`,
            )}
          </div>
          <div class="pill-row" style="margin-top:4px;">
            ${(['0.9', '1', '1.1', '1.2'] as EmrFontScaleId[]).map(
              (s) => html`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:30px;height:30px;padding:0 10px;"
                aria-pressed=${c.fontScale === s}
                @click=${() => this.updateConfig({ fontScale: s })}
              >${Math.round(Number(s) * 100)}%</button>`,
            )}
          </div>
        </div>
      </div>
    </section>`;
  }
}

export function registerL6Elements(): void {
  defineEmrElement('emr-field-generator', EmrFieldGeneratorElement);
  defineEmrElement('emr-terminology-search', EmrTerminologySearchElement);
  defineEmrElement('emr-validation-rule-editor', EmrValidationRuleEditorElement);
  defineEmrElement('emr-field-library-picker', EmrFieldLibraryPickerElement);
  defineEmrElement('emr-template-composer', EmrTemplateComposerElement);
  defineEmrElement('emr-template-preview', EmrTemplatePreviewElement);
  defineEmrElement('emr-theme-customizer', EmrThemeCustomizerElement);
}
