import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  ClinicalFormViewModel,
  TemplateArtifactFormat,
  TemplatePreviewIntent,
  TemplatePreviewViewModel,
} from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowDownTray,
  heroArrowUpTray,
  heroCheck,
  heroExclamationTriangle,
} from '@ng-icons/heroicons/outline';
import { EmrClinicalFormComponent } from '../structures/emr-clinical-form.component';
import {
  AUTHORING_ARTIFACT_FORMATS,
  TEMPLATE_PREVIEW_DEFAULTS,
  canAcceptTemplateImport,
  formatArtifactLabel,
  resolveAuthoringId,
  type EmrTemplatePreviewLabels,
} from './emr-authoring.logic';

@Component({
  selector: 'emr-template-preview',
  standalone: true,
  imports: [EmrClinicalFormComponent, NgIcon],
  providers: [
    ...provideIcons({
      heroArrowDownTray,
      heroArrowUpTray,
      heroCheck,
      heroExclamationTriangle,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    @let m = model();
    @let l = text();
    @let locked = effectiveReadOnly();
    <section
      class="emr-template-preview"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.data-emr-print]="'expand'"
    >
      <header class="emr-template-preview__header">
        <div>
          <p class="emr-template-eyebrow">{{ l.eyebrow }}</p>
          <h2 [id]="resolvedHeadingId()">{{ m.template.title || l.untitledTemplate }}</h2>
          <p>{{ m.template.description || l.defaultDescription }}</p>
        </div>
        <span class="emr-template-status">{{ m.template.status }}</span>
      </header>

      <div class="emr-template-preview__surface">
        <emr-clinical-form [model]="previewModel()" [idPrefix]="resolvedHeadingId()" />
      </div>

      <section class="emr-template-card emr-template-artifacts" [attr.aria-labelledby]="artifactHeadingId()">
        <div class="emr-template-card__heading">
          <div>
            <p class="emr-template-eyebrow">{{ l.interopEyebrow }}</p>
            <h3 [id]="artifactHeadingId()">{{ l.interopHeading }}</h3>
            <p>{{ l.interopDescription }}</p>
          </div>
          @if (m.loading) {
            <span class="emr-template-status" role="status">{{ l.working }}</span>
          }
        </div>

        <div class="emr-template-artifacts__controls">
          <label class="emr-template-label" [for]="formatId()">{{ l.formatLabel }}</label>
          <select
            class="emr-select"
            [id]="formatId()"
            [value]="format"
            [attr.aria-disabled]="(locked || m.loading) ? 'true' : null"
            (mousedown)="guardReadOnlySelect($event, locked || m.loading)"
            (keydown)="guardReadOnlySelectKey($event, locked || m.loading)"
            (change)="formatChanged($event)"
          >
            @for (option of formats; track option) {
              <option [value]="option" [selected]="option === format">{{ formatLabel(option) }}</option>
            }
          </select>
          <button
            class="emr-button emr-button--outline"
            type="button"
            data-emr-print="hide"
            [attr.aria-disabled]="(locked || m.loading) ? 'true' : null"
            (click)="exportRequested()"
          >
            <ng-icon name="heroArrowDownTray" size="16" aria-hidden="true" />
            <span>{{ l.exportButton }}</span>
          </button>
        </div>

        <label class="emr-template-label" [for]="serializedId()">{{ l.serializedLabel }}</label>
        <textarea
          class="emr-control emr-template-artifacts__text"
          [id]="serializedId()"
          rows="7"
          [value]="serialized"
          [readonly]="locked || m.loading"
          [placeholder]="l.serializedPlaceholder"
          (input)="serializedChanged($event)"
        ></textarea>

        <div class="emr-template-artifacts__actions" data-emr-print="hide">
          <button
            class="emr-button emr-button--secondary"
            type="button"
            [attr.aria-disabled]="(locked || m.loading || !serialized.trim()) ? 'true' : null"
            (click)="importRequested()"
          >
            <ng-icon name="heroArrowUpTray" size="16" aria-hidden="true" />
            <span>{{ l.importButton }}</span>
          </button>
          @if (canAcceptImport()) {
            <button
              class="emr-button emr-button--outline"
              type="button"
              [attr.aria-disabled]="(locked || m.loading) ? 'true' : null"
              (click)="acceptImportRequested()"
            >
              <ng-icon name="heroCheck" size="16" aria-hidden="true" />
              <span>{{ l.acceptImportButton }}</span>
            </button>
          }
        </div>

        @if (m.artifact; as art) {
          <div class="emr-template-artifacts__result" role="status">
            <strong>{{ formatLabel(art.format) }}{{ art.fhirVersion ? ' · FHIR ' + art.fhirVersion : '' }}</strong>
            <span>{{ art.serialized.length }} characters · {{ art.issues.length }} issue(s)</span>
            <pre>{{ art.serialized }}</pre>
          </div>
        }

        @if (m.importIssues?.length) {
          <div class="emr-template-artifacts__issues" role="alert">
            <strong class="emr-template-artifacts__issues-title">
              <ng-icon name="heroExclamationTriangle" size="16" aria-hidden="true" />
              <span>{{ l.reviewIssuesHeading }}</span>
            </strong>
            <ul>
              @for (issue of m.importIssues; track $index + '-' + issue.code + '-' + (issue.path ?? '')) {
                <li><b>{{ issue.severity }}</b> · {{ issue.message }}{{ issue.path ? ' · ' + issue.path : '' }}</li>
              }
            </ul>
          </div>
        }

        @if (m.error) {
          <p class="emr-template-note emr-template-note--error" role="alert">{{ m.error }}</p>
        }
      </section>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);container-type:inline-size;max-width:100%}
    .emr-template-preview{display:grid;gap:16px;font-family:var(--emr-font-family);min-width:0;max-width:100%}
    .emr-template-preview__header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;flex-wrap:wrap}
    .emr-template-preview h2{margin:2px 0 6px;font-size:var(--emr-text-xl)}
    .emr-template-preview__header p:not(.emr-template-eyebrow){margin:0;color:var(--emr-text-muted);line-height:1.45}
    .emr-template-eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .emr-template-status{padding:5px 9px;border:1px solid var(--emr-border);border-radius:999px;color:var(--emr-text-muted);font-size:var(--emr-text-xs);white-space:nowrap}
    .emr-template-preview__surface{padding:18px;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface-raised);min-width:0}
    .emr-template-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px;min-width:0}
    .emr-template-card__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap}
    .emr-template-card h3{margin:2px 0 6px;font-size:var(--emr-text-lg)}
    .emr-template-card__heading p:not(.emr-template-eyebrow){margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-md);line-height:1.4}
    .emr-template-artifacts{display:grid;gap:12px}
    .emr-template-label{display:block;color:var(--emr-text-muted);font-size:var(--emr-text-sm);font-weight:600}
    .emr-control,.emr-select,.emr-button{min-height:var(--emr-control-height,44px)}
    .emr-button{min-width:44px;display:inline-flex;align-items:center;gap:6px}
    .emr-button[aria-disabled="true"],.emr-select[aria-disabled="true"]{cursor:not-allowed;opacity:.55}
    .emr-template-artifacts__controls{display:flex;align-items:end;gap:10px;flex-wrap:wrap}
    .emr-template-artifacts__controls .emr-template-label{margin-right:-4px}
    .emr-template-artifacts__controls .emr-select{min-width:200px}
    .emr-template-artifacts__text{width:100%;resize:vertical;font-family:var(--emr-font-mono);font-size:var(--emr-text-sm)}
    .emr-template-artifacts__actions{display:flex;gap:8px;flex-wrap:wrap}
    .emr-template-artifacts__result,.emr-template-artifacts__issues{display:grid;gap:6px;padding:12px;border:1px solid var(--emr-border);border-radius:9px;background:var(--emr-surface-raised);min-width:0}
    .emr-template-artifacts__result span{font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .emr-template-artifacts__result pre{max-height:220px;margin:4px 0 0;overflow:auto;white-space:pre-wrap;word-break:break-word;font-family:var(--emr-font-mono);font-size:var(--emr-text-xs)}
    .emr-template-artifacts__issues{border-color:var(--emr-warning);background:var(--emr-warning-soft);color:var(--emr-warning)}
    .emr-template-artifacts__issues-title{display:inline-flex;align-items:center;gap:6px}
    .emr-template-artifacts__issues ul{margin:0;padding-left:20px;font-size:var(--emr-text-sm);line-height:1.5}
    .emr-template-note{margin:0;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised);color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-template-note--error{background:var(--emr-danger-soft);color:var(--emr-danger)}
    @container (max-width: 720px){
      .emr-template-preview__header,.emr-template-card__heading{display:grid;gap:9px}
      .emr-template-preview__surface,.emr-template-card{padding:14px}
      .emr-template-artifacts__controls{display:grid;align-items:stretch}
      .emr-template-artifacts__controls .emr-template-label{margin:0}
      .emr-template-artifacts__controls .emr-select{min-width:0}
    }
    @media (max-width: 640px){
      .emr-template-preview__header,.emr-template-card__heading{display:grid;gap:9px}
      .emr-template-preview__surface,.emr-template-card{padding:14px}
      .emr-template-artifacts__controls{display:grid;align-items:stretch}
      .emr-template-artifacts__controls .emr-template-label{margin:0}
      .emr-template-artifacts__controls .emr-select{min-width:0}
    }
    :host-context(.emr-print) [data-emr-print="hide"]{display:none !important}
    :host-context(.emr-print) .emr-template-artifacts__result pre{max-height:none !important;overflow:visible !important}
    @media print{
      [data-emr-print="hide"]{display:none !important}
      .emr-template-artifacts__result pre{max-height:none !important;overflow:visible !important}
    }
  `],
})
export class EmrTemplatePreviewComponent {
  readonly model = input.required<TemplatePreviewViewModel>();
  readonly headingId = input<string>('emr-template-preview-heading');
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrTemplatePreviewLabels>>({});

  readonly intent = output<TemplatePreviewIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  readonly formats = AUTHORING_ARTIFACT_FORMATS;
  format: TemplateArtifactFormat = 'fhir-r4-questionnaire';
  serialized = '';

  protected readonly text = computed(() => ({ ...TEMPLATE_PREVIEW_DEFAULTS, ...this.labels() }));
  protected readonly effectiveReadOnly = computed(() => !!this.model().readOnly);
  protected readonly resolvedHeadingId = computed(() =>
    resolveAuthoringId(this.idPrefix(), this.headingId().trim() || 'emr-template-preview-heading'),
  );
  protected readonly previewModel = computed<ClinicalFormViewModel>(() => ({
    ...this.model().preview,
    readOnly: true,
  }));

  artifactHeadingId(): string {
    return `${this.resolvedHeadingId()}-artifact`;
  }

  formatId(): string {
    return `${this.resolvedHeadingId()}-format`;
  }

  serializedId(): string {
    return `${this.resolvedHeadingId()}-serialized`;
  }

  guardReadOnlySelect(event: Event, locked: boolean): void {
    if (locked) event.preventDefault();
  }

  guardReadOnlySelectKey(event: KeyboardEvent, locked: boolean): void {
    if (locked && [' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }
  }

  serializedChanged(event: Event): void {
    if (this.effectiveReadOnly() || this.model().loading) return;
    this.serialized = (event.target as HTMLTextAreaElement).value;
  }

  formatChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.effectiveReadOnly() || this.model().loading) {
      select.value = this.format;
      return;
    }
    this.format = select.value as TemplateArtifactFormat;
  }

  exportRequested(): void {
    if (this.effectiveReadOnly() || this.model().loading) return;
    this.intent.emit({ type: 'artifactExportRequested', format: this.format });
  }

  importRequested(): void {
    if (this.effectiveReadOnly() || this.model().loading || !this.serialized.trim()) return;
    this.intent.emit({ type: 'artifactImportRequested', format: this.format, serialized: this.serialized });
  }

  acceptImportRequested(): void {
    if (this.effectiveReadOnly() || this.model().loading || !this.canAcceptImport()) return;
    this.intent.emit({ type: 'importAccepted' });
  }

  canAcceptImport(): boolean {
    return canAcceptTemplateImport(this.model().importIssues);
  }

  formatLabel(format: TemplateArtifactFormat): string {
    return formatArtifactLabel(format, this.text().formatLabels);
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.hostRef.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}
