import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  AttachmentFieldIntent,
  AttachmentFieldViewModel,
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  DurationFieldIntent,
  DurationFieldViewModel,
  EmrDurationUnit,
  EmrFieldDefinition,
  EmrFileSelectionItem,
  EmrImageCropResult,
  EmrPartialDate,
  EmrSegmentedOption,
  EmrSignaturePoint,
  EmrTone,
  EmrUploadedImageItem,
  EmrValidationMessage,
  FieldFrameIntent,
  FieldFrameLayout,
  ImageFieldIntent,
  ImageFieldViewModel,
  PairedFieldIntent,
  PairedFieldViewModel,
  PartialDateFieldIntent,
  PartialDateFieldViewModel,
  RangeFieldIntent,
  RangeFieldViewModel,
  ScaleFieldIntent,
  ScaleFieldViewModel,
  SignatureCaptureIntent,
  SignatureCaptureViewModel,
} from '@drguptavivek/emr-controller';
import { EmrSegmentedControlComponent } from '../primitives/emr-action-controls.component';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrImageUploadComponent } from '../primitives/emr-image.component';
import { EmrDateInputComponent } from '../primitives/emr-inputs.component';
import { emptyToNull } from '../primitives/emr-inputs.logic';
import { EmrLikertAnchor, EmrLikertComponent } from '../primitives/emr-likert.component';
import { EmrFileTriggerComponent } from '../primitives/emr-specialized-inputs.component';
import { EmrVasAnchor, EmrVasComponent } from '../primitives/emr-vas.component';
import { DEFAULT_ASPECT_PRESETS } from '../primitives/emr-wave2.logic';
import { EmrFieldFrameComponent } from './emr-field-frame.component';

let nextContractFieldId = 0;

function firstErrorMessage(messages?: readonly EmrValidationMessage[]): string {
  return messages?.find((m) => m.severity === 'error')?.message ?? '';
}

function firstWarningMessage(messages?: readonly EmrValidationMessage[]): string {
  return messages?.find((m) => m.severity === 'warning')?.message ?? '';
}

function hasFieldMessages(hint?: string, messages?: readonly EmrValidationMessage[]): boolean {
  return Boolean(hint || (messages && messages.length > 0));
}

function resolveStatusLabel(
  status: ClinicalAssessmentStatus | undefined,
  options?: readonly ClinicalAssessmentStatusOption[],
): string {
  if (!status) return '';
  return options?.find((o) => o.value === status)?.label ?? status.replaceAll('-', ' ');
}

function resolveStatusToneClass(
  status: ClinicalAssessmentStatus | undefined,
  options?: readonly ClinicalAssessmentStatusOption[],
): string {
  const tone = options?.find((o) => o.value === status)?.tone;
  return tone ? `emr-tone-${tone}` : 'emr-tone-neutral';
}

function formatByteSize(bytes?: number): string {
  if (bytes === undefined || bytes < 0 || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SHARED_FIELD_STYLES = `
  :host {
    display: block;
    min-width: 0;
  }
  .cf-stack {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .cf-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .cf-status__select {
    width: auto;
    max-width: 100%;
    min-width: 0;
  }
  .cf-inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
`;

// ─────────────────────────────────────────────────────────────
// 1. EmrScaleFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-scale-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrLikertComponent, EmrVasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let locked = effectiveReadOnly();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="layout()"
      [showMetadata]="showMetadata()"
      [unit]="m.unit ?? resolvedDefinition()?.presentation?.unitDisplay"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div class="cf-stack">
        @if (resolvedVariant() === 'vas') {
          <emr-vas
            [controlId]="resolvedId() + '-control'"
            [label]="resolvedLabel()"
            [labelHidden]="true"
            [ariaLabelledBy]="headingId() || (resolvedId() + '-label')"
            [ariaDescribedBy]="describedBy()"
            [min]="m.min"
            [max]="m.max"
            [step]="m.step"
            [majorInterval]="m.majorInterval ?? 10"
            [minorInterval]="m.minorInterval ?? 2"
            [orientation]="m.orientation ?? 'horizontal'"
            [value]="m.value"
            [anchors]="vasAnchors()"
            [tone]="resolvedTone()"
            [readOnly]="locked"
            [required]="effectiveRequired()"
            [error]="errorText()"
            [warning]="!errorText() ? warningText() : ''"
            (valueChange)="onValueChange($event)"
            (focused)="focused.emit()"
            (blurred)="blurred.emit()"
          />
        } @else {
          <emr-likert
            [controlId]="resolvedId() + '-control'"
            [label]="resolvedLabel()"
            [labelHidden]="true"
            [ariaDescribedBy]="describedBy()"
            [min]="m.min"
            [max]="m.max"
            [step]="m.step ?? 1"
            [value]="m.value"
            [anchors]="likertAnchors()"
            [tone]="resolvedTone()"
            [optionTones]="m.optionTones"
            [readOnly]="locked"
            [required]="effectiveRequired()"
            [error]="errorText()"
            [warning]="!errorText() ? warningText() : ''"
            (valueChange)="onValueChange($event)"
            (focused)="focused.emit()"
            (blurred)="blurred.emit()"
          />
        }

        @if (m.value !== null && !locked && m.clearable !== false) {
          <div class="cf-inline">
            <button
              type="button"
              class="emr-button emr-button--ghost emr-button--small"
              style="min-height:44px;min-width:44px;display:inline-flex;align-items:center;gap:6px"
              [attr.aria-label]="'Clear ' + resolvedLabel()"
              (click)="onValueChange(null)"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span>Clear</span>
            </button>
          </div>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [SHARED_FIELD_STYLES],
})
export class EmrScaleFieldComponent {
  readonly model = input.required<ScaleFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>('vertical');
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly intent = output<ScaleFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-scale-field-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(() => this.model().label || this.resolvedDefinition()?.presentation?.label || '');
  protected readonly resolvedVariant = computed<'likert' | 'vas'>(() => {
    const m = this.model();
    if (m.variant) return m.variant;
    return this.resolvedDefinition()?.presentation?.widget === 'vas' ? 'vas' : 'likert';
  });
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly resolvedTone = computed<EmrTone | undefined>(() => {
    const m = this.model();
    return (m.value !== null ? m.optionTones?.[m.value] : undefined) ?? m.tone;
  });

  protected readonly errorText = computed(() => firstErrorMessage(this.model().messages));
  protected readonly warningText = computed(() => firstWarningMessage(this.model().messages));
  protected readonly describedBy = computed(() => {
    const m = this.model();
    return m.hint || m.messages?.length ? `${this.resolvedId()}-message` : undefined;
  });

  protected readonly likertAnchors = computed<readonly EmrLikertAnchor[]>(() => {
    const m = this.model();
    const list: EmrLikertAnchor[] = [];
    if (m.anchors?.minLabel) list.push({ value: m.min, label: m.anchors.minLabel });
    if (m.anchors?.midLabel) {
      list.push({ value: Math.round((m.min + m.max) / 2), label: m.anchors.midLabel });
    }
    if (m.anchors?.maxLabel) list.push({ value: m.max, label: m.anchors.maxLabel });
    return list;
  });

  protected readonly vasAnchors = computed<readonly EmrVasAnchor[]>(() => {
    const m = this.model();
    const list: EmrVasAnchor[] = [];
    if (m.anchors?.minLabel) list.push({ value: m.min, label: m.anchors.minLabel });
    if (m.anchors?.midLabel) {
      list.push({ value: (m.min + m.max) / 2, label: m.anchors.midLabel });
    }
    if (m.anchors?.maxLabel) list.push({ value: m.max, label: m.anchors.maxLabel });
    return list;
  });

  protected onValueChange(value: number | null): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'valueChangeRequested', value });
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 2. EmrPartialDateFieldComponent
// ─────────────────────────────────────────────────────────────
const PARTIAL_DATE_PRECISION_OPTIONS: readonly EmrSegmentedOption<EmrPartialDate['precision']>[] = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Year & month' },
  { value: 'day', label: 'Full date' },
];

function adaptPartialDateLocal(
  current: EmrPartialDate | null,
  nextPrecision: EmrPartialDate['precision'],
): EmrPartialDate | null {
  if (!current || !current.value) return null;
  const parts = current.value.split('-');
  const y = parts[0];
  if (!y || !/^\d{4}$/.test(y)) return null;
  if (nextPrecision === 'year') return { value: y, precision: 'year' };
  const m = parts[1] && /^\d{2}$/.test(parts[1]) ? parts[1] : undefined;
  if (nextPrecision === 'month') return m ? { value: `${y}-${m}`, precision: 'month' } : null;
  const d = parts[2] && /^\d{2}$/.test(parts[2]) ? parts[2] : undefined;
  return m && d ? { value: `${y}-${m}-${d}`, precision: 'day' } : null;
}

@Component({
  selector: 'emr-partial-date-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrSegmentedControlComponent, EmrDateInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let locked = effectiveReadOnly();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="layout()"
      [showMetadata]="showMetadata()"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div class="cf-stack" (focusin)="focused.emit()" (focusout)="blurred.emit()">
        <emr-segmented-control
          [controlId]="resolvedId() + '-precision'"
          [ariaLabel]="resolvedLabel() + ' precision'"
          [labelHidden]="true"
          [options]="precisionOptions"
          [value]="activePrecision()"
          [readOnly]="locked"
          (valueChange)="onPrecisionChange($event)"
        />
        <div class="cf-inline">
          <emr-date-input
            [controlId]="resolvedId() + '-control'"
            [label]="resolvedLabel()"
            [labelHidden]="true"
            [precision]="activePrecision()"
            [value]="m.value?.value ?? null"
            [min]="m.min"
            [max]="m.max"
            [required]="effectiveRequired()"
            [readOnly]="locked"
            [error]="errorText()"
            (valueChange)="onDateChange($event)"
          />
          @if (m.value !== null && !locked && resolvedClearable()) {
            <button
              type="button"
              class="emr-button emr-button--ghost emr-button--small"
              style="min-height:44px;min-width:44px;display:inline-flex;align-items:center;gap:6px"
              [attr.aria-label]="'Clear ' + resolvedLabel()"
              (click)="onDateChange(null)"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span>Clear</span>
            </button>
          }
        </div>
      </div>
    </emr-field-frame>
  `,
  styles: [SHARED_FIELD_STYLES],
})
export class EmrPartialDateFieldComponent {
  readonly model = input.required<PartialDateFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>('vertical');
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly defaultPrecision = input<EmrPartialDate['precision']>('day');
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly intent = output<PartialDateFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  protected readonly precisionOptions = PARTIAL_DATE_PRECISION_OPTIONS;

  private readonly fallbackId = `emr-partial-date-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  private readonly draftPrecision = signal<EmrPartialDate['precision'] | null>(null);

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(() => this.model().label || this.resolvedDefinition()?.presentation?.label || '');
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly resolvedClearable = computed(() => this.model().clearable ?? this.clearable());

  protected readonly activePrecision = computed<EmrPartialDate['precision']>(
    () => this.model().value?.precision ?? this.draftPrecision() ?? this.model().defaultPrecision ?? this.defaultPrecision(),
  );
  protected readonly errorText = computed(() => firstErrorMessage(this.model().messages));

  protected onPrecisionChange(next: string | null): void {
    if (this.effectiveReadOnly() || !next) return;
    if (next === 'year' || next === 'month' || next === 'day') {
      this.draftPrecision.set(next);
      this.intent.emit({ type: 'precisionChangeRequested', precision: next });
      const cur = this.model().value;
      if (cur) {
        this.intent.emit({ type: 'valueChangeRequested', value: adaptPartialDateLocal(cur, next) });
      }
    }
  }

  protected onDateChange(raw: string | null): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({
      type: 'valueChangeRequested',
      value: raw === null ? null : { value: raw, precision: this.activePrecision() },
    });
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 3. EmrAttachmentFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-attachment-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrFileTriggerComponent, EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let locked = effectiveReadOnly();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div class="cf-stack" (focusin)="focused.emit()" (focusout)="blurred.emit()">
        @if (m.items.length > 0) {
          <ul class="af-list" [attr.aria-label]="resolvedLabel() + ' attachments'">
            @for (item of m.items; track item.id) {
              <li class="af-item">
                <button
                  type="button"
                  class="af-item__select"
                  [attr.aria-label]="'Open ' + item.title"
                  (click)="intent.emit({ type: 'itemSelected', id: item.id })"
                >
                  <svg class="af-item__icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span class="af-item__copy">
                    <span class="af-item__title">{{ item.title }}</span>
                    <span class="af-item__meta">
                      {{ item.contentType }}
                      @if (formatBytes(item.sizeBytes); as sizeText) {
                        · {{ sizeText }}
                      }
                      @if (item.uploadedAt) {
                        · {{ item.uploadedAt }}
                      }
                    </span>
                  </span>
                </button>
                @if (item.statusBadge; as badge) {
                  <emr-badge [tone]="badge.tone">{{ badge.label }}</emr-badge>
                }
                @if (!locked) {
                  <button
                    type="button"
                    data-emr-print="hide"
                    class="emr-button emr-button--ghost emr-button--small af-item__remove"
                    [attr.aria-label]="'Remove ' + item.title"
                    (click)="onRemoveItem(item.id)"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Remove</span>
                  </button>
                }
              </li>
            }
          </ul>
        } @else if (locked && !m.status) {
          <p class="af-empty">No attachments recorded.</p>
        }

        @if (!locked) {
          <div class="cf-stack" data-emr-print="hide">
            <emr-file-trigger
              [controlId]="resolvedId() + '-trigger'"
              [label]="resolvedLabel()"
              [labelHidden]="true"
              [accept]="m.accept"
              [multiple]="effectiveMultiple()"
              [disabled]="!canAddMore()"
              [dropHint]="capacityHint() || 'or drag and drop files here'"
              [error]="errorText()"
              (filesSelected)="onFiles($event)"
              (nativeFilesSelected)="onNativeFiles($event)"
            />
            @if (m.allowCamera) {
              <div class="cf-inline">
                <button
                  type="button"
                  class="emr-button emr-button--outline emr-button--small af-capture-btn"
                  [disabled]="!canAddMore()"
                  [attr.aria-label]="'Capture photo for ' + resolvedLabel()"
                  (click)="onCapture('camera')"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  class="emr-button emr-button--outline emr-button--small af-capture-btn"
                  [disabled]="!canAddMore()"
                  [attr.aria-label]="'Scan document for ' + resolvedLabel()"
                  (click)="onCapture('scanner')"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="4 7 4 4 7 4" />
                    <polyline points="17 4 20 4 20 7" />
                    <polyline points="20 17 20 20 17 20" />
                    <polyline points="7 20 4 20 4 17" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                  </svg>
                  <span>Scanner</span>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .af-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 6px;
      }
      .af-item {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        background: var(--emr-surface-soft);
      }
      .af-item__select {
        flex: 1 1 200px;
        min-width: 0;
        min-height: 44px;
        border: 0;
        background: transparent;
        color: var(--emr-text);
        text-align: left;
        font: inherit;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .af-item__icon {
        flex: 0 0 auto;
        color: var(--emr-primary);
      }
      .af-item__copy {
        display: grid;
        align-content: center;
        gap: 2px;
        min-width: 0;
      }
      .af-item__title {
        font-weight: var(--emr-weight-bold);
        overflow-wrap: anywhere;
      }
      .af-item__meta {
        font-size: var(--emr-text-xs);
        color: var(--emr-text-muted);
      }
      .af-item__remove,
      .af-capture-btn {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .af-capture-btn {
        background: var(--emr-surface);
        color: var(--emr-primary);
        border: 1px solid var(--emr-primary-border);
      }
      .af-capture-btn:hover:not(:disabled) {
        background: var(--emr-surface-soft);
      }
      .af-empty {
        margin: 0;
        color: var(--emr-text-muted);
        font-size: var(--emr-text-sm);
      }
    `,
  ],
})
export class EmrAttachmentFieldComponent {
  readonly model = input.required<AttachmentFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly intent = output<AttachmentFieldIntent>();
  readonly nativeFilesSelected = output<readonly File[]>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-attachment-field-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(() => this.model().label || this.resolvedDefinition()?.presentation?.label || '');
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() => this.layout() ?? this.model().layout ?? 'vertical');
  protected readonly resolvedShowMetadata = computed(() => this.showMetadata() || Boolean(this.model().showMetadata));
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly effectiveMaxItems = computed(() => {
    const max = this.resolvedDefinition()?.contract?.cardinality?.max;
    return this.model().maxItems ?? (typeof max === 'number' ? max : undefined);
  });
  protected readonly effectiveMultiple = computed(() => this.model().multiple ?? this.effectiveMaxItems() !== 1);
  protected readonly canAddMore = computed(() => {
    const max = this.effectiveMaxItems();
    return max === undefined || this.model().items.length < max;
  });
  protected readonly capacityHint = computed(() => {
    const max = this.effectiveMaxItems();
    return max !== undefined ? `${this.model().items.length} of ${max} attached` : '';
  });
  protected readonly errorText = computed(() => firstErrorMessage(this.model().messages));

  protected formatBytes(bytes?: number): string {
    return formatByteSize(bytes);
  }

  protected onFiles(files: readonly EmrFileSelectionItem[]): void {
    if (this.effectiveReadOnly() || !this.canAddMore()) return;
    this.intent.emit({ type: 'filesSelected', files });
  }

  protected onNativeFiles(files: readonly File[]): void {
    if (this.effectiveReadOnly() || !this.canAddMore()) return;
    this.nativeFilesSelected.emit(files);
  }

  protected onCapture(mode: 'camera' | 'scanner'): void {
    if (this.effectiveReadOnly() || !this.canAddMore()) return;
    this.intent.emit({ type: 'captureRequested', mode });
  }

  protected onRemoveItem(id: string): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'itemRemoveRequested', id });
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 4. EmrPairedFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-paired-field',
  standalone: true,
  imports: [EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="cf-stack">
        <div class="pf-row" role="group" [attr.aria-label]="m.label">
          <div class="pf-cell">
            <label class="pf-sub" [for]="resolvedId()">{{ m.firstLabel }}</label>
            <input
              #firstEl
              class="emr-control"
              [id]="resolvedId()"
              [attr.type]="inputType()"
              [attr.inputmode]="inputMode()"
              [value]="firstDomValue()"
              [placeholder]="m.firstPlaceholder ?? ''"
              [attr.min]="m.min ?? null"
              [attr.max]="m.max ?? null"
              [attr.step]="stepAttr()"
              [required]="!!m.required"
              [readOnly]="!!m.readOnly"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (wheel)="onWheel($event)"
              (input)="onPartInput('first', $event)"
              (blur)="syncDom()"
            />
          </div>
          <span class="pf-sep" aria-hidden="true">{{ m.separator ?? '/' }}</span>
          <div class="pf-cell">
            <label class="pf-sub" [for]="resolvedId() + '-second'">{{ m.secondLabel }}</label>
            <input
              #secondEl
              class="emr-control"
              [id]="resolvedId() + '-second'"
              [attr.type]="inputType()"
              [attr.inputmode]="inputMode()"
              [value]="secondDomValue()"
              [placeholder]="m.secondPlaceholder ?? ''"
              [attr.min]="m.min ?? null"
              [attr.max]="m.max ?? null"
              [attr.step]="stepAttr()"
              [required]="!!m.required"
              [readOnly]="!!m.readOnly"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (wheel)="onWheel($event)"
              (input)="onPartInput('second', $event)"
              (blur)="syncDom()"
            />
          </div>
          @if (m.unit) {
            <span class="pf-unit" aria-hidden="true">{{ m.unit }}</span>
          }
        </div>

        @if (m.status || (m.statusOptions?.length && !m.readOnly)) {
          <div class="cf-status">
            @if (m.status) {
              <span [class]="'emr-badge ' + statusTone()" role="status">{{ statusText() }}</span>
            }
            @if (m.statusOptions?.length && !m.readOnly) {
              <select
                #statusSelect
                class="emr-select cf-status__select"
                [attr.aria-label]="m.label + ' assessment status'"
                [value]="m.status ?? ''"
                (change)="onStatusChange($event)"
                (blur)="syncDom()"
              >
                <option value="" [selected]="!m.status">Status not set</option>
                @for (opt of m.statusOptions; track opt.value) {
                  <option [value]="opt.value" [selected]="opt.value === m.status">
                    {{ opt.label }}
                  </option>
                }
              </select>
            }
          </div>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .pf-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 8px;
      }
      .pf-cell {
        flex: 1 1 110px;
        min-width: 0;
        display: grid;
        gap: 4px;
      }
      .pf-sub {
        font-size: var(--emr-text-xs);
        font-weight: var(--emr-weight-medium);
        color: var(--emr-text-muted);
      }
      .pf-sep,
      .pf-unit {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        color: var(--emr-text-muted);
        font-weight: var(--emr-weight-bold);
      }
    `,
  ],
})
export class EmrPairedFieldComponent implements AfterViewChecked {
  readonly model = input.required<PairedFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<PairedFieldIntent>();

  private readonly fallbackId = `emr-paired-field-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly mode = computed(() => this.model().mode ?? 'decimal');
  protected readonly inputType = computed(() => (this.mode() === 'text' ? 'text' : 'number'));
  protected readonly inputMode = computed(() => {
    const mode = this.mode();
    return mode === 'integer' ? 'numeric' : mode === 'decimal' ? 'decimal' : null;
  });
  protected readonly stepAttr = computed(() => {
    const m = this.model();
    if (this.mode() === 'text') return null;
    if (m.step !== undefined) return m.step;
    return this.mode() === 'integer' ? 1 : 'any';
  });

  protected readonly firstDomValue = computed(() => {
    const v = this.model().value?.first;
    return v === null || v === undefined ? '' : String(v);
  });
  protected readonly secondDomValue = computed(() => {
    const v = this.model().value?.second;
    return v === null || v === undefined ? '' : String(v);
  });

  protected readonly hasError = computed(() => Boolean(firstErrorMessage(this.model().messages)));
  protected readonly describedBy = computed(() =>
    hasFieldMessages(this.model().hint, this.model().messages)
      ? `${this.resolvedId()}-message`
      : null,
  );
  protected readonly statusText = computed(() =>
    resolveStatusLabel(this.model().status, this.model().statusOptions),
  );
  protected readonly statusTone = computed(() =>
    resolveStatusToneClass(this.model().status, this.model().statusOptions),
  );

  private readonly firstRef = viewChild<ElementRef<HTMLInputElement>>('firstEl');
  private readonly secondRef = viewChild<ElementRef<HTMLInputElement>>('secondEl');
  private readonly statusRef = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onWheel(event: WheelEvent): void {
    if (this.mode() !== 'text') {
      (event.currentTarget as HTMLInputElement).blur();
    }
  }

  protected onPartInput(part: 'first' | 'second', event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    if (this.mode() !== 'text' && target.validity?.badInput) return;

    let parsed: string | number | null;
    if (this.mode() === 'text') {
      parsed = emptyToNull(target.value);
    } else {
      const trimmed = target.value.trim();
      if (trimmed === '') {
        parsed = null;
      } else {
        const num = Number(trimmed);
        if (!Number.isFinite(num)) {
          this.syncDom();
          return;
        }
        parsed = this.mode() === 'integer' ? Math.trunc(num) : num;
      }
    }

    this.scheduleSync();
    if (part === 'first') {
      this.intent.emit({ type: 'firstChangeRequested', value: parsed });
    } else {
      this.intent.emit({ type: 'secondChangeRequested', value: parsed });
    }
  }

  protected onStatusChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const raw = (event.target as HTMLSelectElement).value as ClinicalAssessmentStatus | '';
    this.scheduleSync();
    this.intent.emit({ type: 'statusChangeRequested', status: raw ? raw : undefined });
  }

  protected syncDom(): void {
    const firstEl = this.firstRef()?.nativeElement;
    if (firstEl && firstEl.value !== this.firstDomValue()) {
      firstEl.value = this.firstDomValue();
    }
    const secondEl = this.secondRef()?.nativeElement;
    if (secondEl && secondEl.value !== this.secondDomValue()) {
      secondEl.value = this.secondDomValue();
    }
    const statusEl = this.statusRef()?.nativeElement;
    const expectedStatus = this.model().status ?? '';
    if (statusEl && statusEl.value !== expectedStatus) {
      statusEl.value = expectedStatus;
    }
  }

  private scheduleSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 5. EmrDurationInputComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-duration-input',
  standalone: true,
  imports: [EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="cf-stack">
        <div class="emr-quantity">
          <input
            #amountEl
            class="emr-control"
            type="number"
            inputmode="decimal"
            [id]="resolvedId()"
            [value]="amountDomValue()"
            [attr.min]="m.min ?? 0"
            [attr.max]="m.max ?? null"
            [attr.step]="m.step ?? 1"
            [required]="!!m.required"
            [readOnly]="!!m.readOnly"
            [attr.aria-invalid]="hasError() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            (wheel)="onWheel($event)"
            (input)="onAmountInput($event)"
            (blur)="syncDom()"
          />
          <select
            #unitSelect
            class="emr-select"
            [attr.aria-label]="m.label + ' unit'"
            [attr.aria-readonly]="m.readOnly || null"
            [value]="activeUnit()"
            (change)="onUnitChange($event)"
            (blur)="syncDom()"
          >
            @for (opt of m.unitOptions; track opt.value) {
              <option [value]="opt.value" [selected]="opt.value === activeUnit()">
                {{ opt.label }}
              </option>
            }
          </select>
        </div>

        @if (m.status || (m.statusOptions?.length && !m.readOnly)) {
          <div class="cf-status">
            @if (m.status) {
              <span [class]="'emr-badge ' + statusTone()" role="status">{{ statusText() }}</span>
            }
            @if (m.statusOptions?.length && !m.readOnly) {
              <select
                #statusSelect
                class="emr-select cf-status__select"
                [attr.aria-label]="m.label + ' assessment status'"
                [value]="m.status ?? ''"
                (change)="onStatusChange($event)"
                (blur)="syncDom()"
              >
                <option value="" [selected]="!m.status">Status not set</option>
                @for (opt of m.statusOptions; track opt.value) {
                  <option [value]="opt.value" [selected]="opt.value === m.status">
                    {{ opt.label }}
                  </option>
                }
              </select>
            }
          </div>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [SHARED_FIELD_STYLES],
})
export class EmrDurationInputComponent implements AfterViewChecked {
  readonly model = input.required<DurationFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<DurationFieldIntent>();

  private readonly fallbackId = `emr-duration-input-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly amountDomValue = computed(() => {
    const amount = this.model().value?.amount;
    return amount === null || amount === undefined || Number.isNaN(amount) ? '' : String(amount);
  });

  protected readonly activeUnit = computed<EmrDurationUnit>(
    () => this.model().value?.unit ?? this.model().unitOptions[0]?.value ?? 'd',
  );

  protected readonly hasError = computed(() => Boolean(firstErrorMessage(this.model().messages)));
  protected readonly describedBy = computed(() =>
    hasFieldMessages(this.model().hint, this.model().messages)
      ? `${this.resolvedId()}-message`
      : null,
  );
  protected readonly statusText = computed(() =>
    resolveStatusLabel(this.model().status, this.model().statusOptions),
  );
  protected readonly statusTone = computed(() =>
    resolveStatusToneClass(this.model().status, this.model().statusOptions),
  );

  private readonly amountRef = viewChild<ElementRef<HTMLInputElement>>('amountEl');
  private readonly unitRef = viewChild<ElementRef<HTMLSelectElement>>('unitSelect');
  private readonly statusRef = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onWheel(event: WheelEvent): void {
    (event.currentTarget as HTMLInputElement).blur();
  }

  protected onAmountInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    if (target.validity?.badInput) return;
    const raw = target.value.trim();
    if (raw === '') {
      this.scheduleSync();
      this.intent.emit({ type: 'amountChangeRequested', amount: null });
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      this.syncDom();
      return;
    }
    this.scheduleSync();
    this.intent.emit({ type: 'amountChangeRequested', amount: parsed });
  }

  protected onUnitChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const unit = (event.target as HTMLSelectElement).value as EmrDurationUnit;
    this.scheduleSync();
    this.intent.emit({ type: 'unitChangeRequested', unit });
  }

  protected onStatusChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const raw = (event.target as HTMLSelectElement).value as ClinicalAssessmentStatus | '';
    this.scheduleSync();
    this.intent.emit({ type: 'statusChangeRequested', status: raw ? raw : undefined });
  }

  protected syncDom(): void {
    const amountEl = this.amountRef()?.nativeElement;
    if (amountEl && amountEl.value !== this.amountDomValue()) {
      amountEl.value = this.amountDomValue();
    }
    const unitEl = this.unitRef()?.nativeElement;
    if (unitEl && unitEl.value !== this.activeUnit()) {
      unitEl.value = this.activeUnit();
    }
    const statusEl = this.statusRef()?.nativeElement;
    const expectedStatus = this.model().status ?? '';
    if (statusEl && statusEl.value !== expectedStatus) {
      statusEl.value = expectedStatus;
    }
  }

  private scheduleSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 6. EmrRangeFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-range-field',
  standalone: true,
  imports: [EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="rf-row" role="group" [attr.aria-label]="m.label">
        <input
          #lowEl
          class="emr-control rf-input"
          [id]="resolvedId()"
          [attr.type]="m.kind === 'date' ? 'date' : 'number'"
          [attr.inputmode]="m.kind === 'number' ? 'decimal' : null"
          [value]="lowDomValue()"
          [placeholder]="m.lowPlaceholder ?? (m.kind === 'date' ? '' : 'Min')"
          [attr.min]="m.min ?? null"
          [attr.max]="m.max ?? null"
          [attr.step]="m.kind === 'number' ? (m.step ?? 'any') : null"
          [required]="!!m.required"
          [readOnly]="!!m.readOnly"
          [attr.aria-label]="m.label + ' minimum'"
          [attr.aria-invalid]="hasError() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (wheel)="onWheel($event)"
          (input)="onBoundInput('low', $event)"
          (blur)="syncDom()"
        />
        <span class="emr-field-row__separator" aria-hidden="true">–</span>
        <input
          #highEl
          class="emr-control rf-input"
          [id]="resolvedId() + '-high'"
          [attr.type]="m.kind === 'date' ? 'date' : 'number'"
          [attr.inputmode]="m.kind === 'number' ? 'decimal' : null"
          [value]="highDomValue()"
          [placeholder]="m.highPlaceholder ?? (m.kind === 'date' ? '' : 'Max')"
          [attr.min]="m.min ?? null"
          [attr.max]="m.max ?? null"
          [attr.step]="m.kind === 'number' ? (m.step ?? 'any') : null"
          [required]="!!m.required"
          [readOnly]="!!m.readOnly"
          [attr.aria-label]="m.label + ' maximum'"
          [attr.aria-invalid]="hasError() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (wheel)="onWheel($event)"
          (input)="onBoundInput('high', $event)"
          (blur)="syncDom()"
        />
        @if (m.unit) {
          <span class="rf-unit" aria-hidden="true">{{ m.unit }}</span>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .rf-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .rf-input {
        flex: 1 1 120px;
        min-width: 0;
      }
      .rf-unit {
        color: var(--emr-text-muted);
        font-size: var(--emr-text-sm);
        font-weight: var(--emr-weight-medium);
      }
    `,
  ],
})
export class EmrRangeFieldComponent implements AfterViewChecked {
  readonly model = input.required<RangeFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<RangeFieldIntent>();

  private readonly fallbackId = `emr-range-field-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly lowDomValue = computed(() => {
    const v = this.model().value?.low;
    return v === null || v === undefined ? '' : String(v);
  });
  protected readonly highDomValue = computed(() => {
    const v = this.model().value?.high;
    return v === null || v === undefined ? '' : String(v);
  });

  protected readonly hasError = computed(() => Boolean(firstErrorMessage(this.model().messages)));
  protected readonly describedBy = computed(() =>
    hasFieldMessages(this.model().hint, this.model().messages)
      ? `${this.resolvedId()}-message`
      : null,
  );

  private readonly lowRef = viewChild<ElementRef<HTMLInputElement>>('lowEl');
  private readonly highRef = viewChild<ElementRef<HTMLInputElement>>('highEl');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onWheel(event: WheelEvent): void {
    if (this.model().kind === 'number') {
      (event.currentTarget as HTMLInputElement).blur();
    }
  }

  protected onBoundInput(bound: 'low' | 'high', event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    if (this.model().kind === 'number' && target.validity?.badInput) return;

    let parsed: number | string | null;
    if (this.model().kind === 'date') {
      parsed = emptyToNull(target.value);
    } else {
      const trimmed = target.value.trim();
      if (trimmed === '') {
        parsed = null;
      } else {
        const num = Number(trimmed);
        if (!Number.isFinite(num)) {
          this.syncDom();
          return;
        }
        parsed = num;
      }
    }

    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });

    if (bound === 'low') {
      this.intent.emit({ type: 'lowChangeRequested', low: parsed });
    } else {
      this.intent.emit({ type: 'highChangeRequested', high: parsed });
    }
  }

  protected syncDom(): void {
    const lowEl = this.lowRef()?.nativeElement;
    if (lowEl && lowEl.value !== this.lowDomValue()) {
      lowEl.value = this.lowDomValue();
    }
    const highEl = this.highRef()?.nativeElement;
    if (highEl && highEl.value !== this.highDomValue()) {
      highEl.value = this.highDomValue();
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 7. EmrSignatureCaptureFieldComponent (SSR-safe SVG pointer pad)
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-signature-capture-field',
  standalone: true,
  imports: [EmrFieldFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="cf-stack">
        <svg
          class="emr-signature-pad sig-pad"
          [id]="resolvedId()"
          [attr.viewBox]="'0 0 ' + padWidth() + ' ' + padHeight()"
          [style.height.px]="padHeight()"
          [attr.data-readonly]="m.readOnly || null"
          role="img"
          [attr.aria-label]="m.label"
          [attr.aria-invalid]="hasError() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerCancel($event)"
        >
          @for (stroke of m.strokes; track $index) {
            <polyline
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              [attr.points]="toSvgPoints(stroke.points)"
            />
          }
          @if (draftPoints().length > 0) {
            <polyline
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              [attr.points]="toSvgPoints(draftPoints())"
            />
          }
        </svg>

        <div class="sig-footer">
          <div class="sig-meta">
            @if (m.signatoryName) {
              <strong>{{ m.signatoryName }}</strong>
            }
            @if (m.signatoryRole) {
              <span>{{ m.signatoryRole }}</span>
            }
            @if (m.signedAt) {
              <span>· {{ m.signedAt }}</span>
            }
          </div>
          @if (!m.readOnly) {
            <button
              type="button"
              class="emr-button emr-button--ghost emr-button--small"
              [disabled]="m.strokes.length === 0"
              (click)="intent.emit({ type: 'clearRequested' })"
            >
              Clear signature
            </button>
          }
        </div>
      </div>
    </emr-field-frame>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .sig-pad {
        color: var(--emr-text);
        cursor: crosshair;
      }
      .sig-pad[data-readonly='true'] {
        cursor: default;
      }
      .sig-footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .sig-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        font-size: var(--emr-text-xs);
        color: var(--emr-text-muted);
      }
    `,
  ],
})
export class EmrSignatureCaptureFieldComponent {
  readonly model = input.required<SignatureCaptureViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<SignatureCaptureIntent>();

  private readonly fallbackId = `emr-signature-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly padWidth = computed(() => this.model().width ?? 420);
  protected readonly padHeight = computed(() => this.model().height ?? 140);
  protected readonly hasError = computed(() => Boolean(firstErrorMessage(this.model().messages)));
  protected readonly describedBy = computed(() =>
    hasFieldMessages(this.model().hint, this.model().messages)
      ? `${this.resolvedId()}-message`
      : null,
  );

  /** Transient pointer gesture buffer only while actively drawing one stroke. */
  protected readonly draftPoints = signal<readonly EmrSignaturePoint[]>([]);
  private activePointerId: number | null = null;

  protected toSvgPoints(points: readonly EmrSignaturePoint[]): string {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.model().readOnly) return;
    const svg = event.currentTarget as SVGSVGElement;
    if (typeof svg.setPointerCapture === 'function') {
      svg.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.draftPoints.set([this.pointFromEvent(event, svg)]);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.model().readOnly || this.activePointerId !== event.pointerId) return;
    const svg = event.currentTarget as SVGSVGElement;
    event.preventDefault();
    const nextPt = this.pointFromEvent(event, svg);
    this.draftPoints.update((prev) => [...prev, nextPt]);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;
    const svg = event.currentTarget as SVGSVGElement;
    if (typeof svg.releasePointerCapture === 'function') {
      svg.releasePointerCapture(event.pointerId);
    }
    const completed = this.draftPoints();
    this.activePointerId = null;
    this.draftPoints.set([]);
    if (!this.model().readOnly && completed.length > 0) {
      this.intent.emit({ type: 'strokeAdded', stroke: { points: completed } });
    }
  }

  protected onPointerCancel(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;
    const svg = event.currentTarget as SVGSVGElement;
    if (typeof svg.releasePointerCapture === 'function') {
      svg.releasePointerCapture(event.pointerId);
    }
    this.activePointerId = null;
    this.draftPoints.set([]);
  }

  private pointFromEvent(event: PointerEvent, svg: SVGSVGElement): EmrSignaturePoint {
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width > 0 ? this.padWidth() / rect.width : 1;
    const scaleY = rect.height > 0 ? this.padHeight() / rect.height : 1;
    return {
      x: Number(((event.clientX - rect.left) * scaleX).toFixed(1)),
      y: Number(((event.clientY - rect.top) * scaleY).toFixed(1)),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 8. EmrImageFieldComponent (L2 Clinical Image Capture, Preview & Crop Field)
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-image-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrImageUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="cf-stack">
        <emr-image-upload
          [controlId]="resolvedId()"
          [label]="m.label"
          [labelHidden]="true"
          [items]="m.items"
          [multiple]="m.multiple ?? true"
          [maxFiles]="m.maxFiles"
          [maxSizeBytes]="m.maxSizeBytes"
          [allowCamera]="!!m.allowCamera"
          [aspectPresets]="m.aspectPresets ?? defaultPresets"
          [required]="!!m.required"
          [readOnly]="!!m.readOnly"
          [error]="firstError()"
          (filesSelected)="onFilesSelected($event)"
          (nativeFilesSelected)="nativeFilesSelected.emit($event)"
          (itemsChange)="onItemsChange($event)"
          (imageCropped)="onImageCropped($event)"
          (removeRequested)="onItemRemove($event)"
          (captureRequested)="onCaptureRequested($event)"
        />

        @if ((m.statusOptions && m.statusOptions.length > 0) || m.status) {
          <div class="cf-status">
            @if (m.status) {
              <span [class]="'emr-badge ' + statusToneClass()" role="status">
                {{ statusLabel() }}
              </span>
            }
            @if (m.statusOptions && m.statusOptions.length > 0) {
              <select
                class="emr-select cf-status__select"
                [attr.aria-label]="m.label + ' assessment status'"
                [attr.aria-readonly]="m.readOnly || null"
                [value]="m.status ?? ''"
                (change)="onStatusChange($event)"
              >
                <option value="" [selected]="!m.status">Status not set</option>
                @for (opt of m.statusOptions; track opt.value) {
                  <option [value]="opt.value" [selected]="opt.value === m.status">
                    {{ opt.label }}
                  </option>
                }
              </select>
            }
          </div>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [SHARED_FIELD_STYLES],
})
export class EmrImageFieldComponent {
  readonly model = input.required<ImageFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<ImageFieldIntent>();
  readonly nativeFilesSelected = output<readonly File[]>();

  protected readonly defaultPresets = DEFAULT_ASPECT_PRESETS;

  private readonly fallbackId = `emr-image-field-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly firstError = computed(() => firstErrorMessage(this.model().messages));
  protected readonly statusLabel = computed(() =>
    resolveStatusLabel(this.model().status, this.model().statusOptions),
  );
  protected readonly statusToneClass = computed(() =>
    resolveStatusToneClass(this.model().status, this.model().statusOptions),
  );

  protected onFilesSelected(files: readonly EmrFileSelectionItem[]): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'filesSelected', files });
  }

  protected onItemsChange(items: readonly EmrUploadedImageItem[]): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'itemsChangeRequested', items });
  }

  protected onImageCropped(evt: { readonly id: string; readonly result: EmrImageCropResult }): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'imageCropped', id: evt.id, result: evt.result });
  }

  protected onItemRemove(id: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'itemRemoveRequested', id });
  }

  protected onCaptureRequested(mode: 'camera'): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'captureRequested', mode });
  }

  protected onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.model().readOnly) {
      select.value = this.model().status ?? '';
      return;
    }
    const status = (select.value || undefined) as ClinicalAssessmentStatus | undefined;
    this.intent.emit({ type: 'statusChangeRequested', status });
  }
}
