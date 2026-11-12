import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { EmrLitElement, emrShadowStyles } from './foundations.js';

/** Shared presentation mechanics for typed workflow surfaces. */
export abstract class EmrModelElement<Model, Intent> extends EmrLitElement {
  static override styles = [emrShadowStyles, css`
    .emr-stack { display: grid; gap: 10px; }
    .emr-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .emr-scroll { overflow: auto; }
    .emr-table { width: 100%; border-collapse: collapse; }
    .emr-table th, .emr-table td {
      padding: 8px;
      text-align: start;
      vertical-align: top;
      border-bottom: 1px solid var(--emr-border);
    }
  `];
  @property({ attribute: false }) model?: Model;
  @property({ type: String }) headingId = '';

  protected panel(title: string, content: TemplateResult) {
    return html`<section class="emr-card emr-stack" aria-labelledby=${this.headingId || nothing}>
      <h3 class="emr-title" id=${this.headingId || nothing}>${title}</h3>
      ${content}
    </section>`;
  }

  protected send(intent: Intent): void {
    this.emitIntent(intent);
  }

  protected action(label: string, intent: Intent, enabled: () => boolean = () => true) {
    return html`<button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!enabled()}
      @click=${() => { if (enabled()) this.send(intent); }}>${label}</button>`;
  }
}
