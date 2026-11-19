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
  EmrDateTimeDisplayFormat,
  EmrDateTimeWireFormat,
  EmrDurationUnit,
  EmrFieldDefinition,
  EmrFileSelectionItem,
  EmrImageCropResult,
  EmrOption,
  EmrPartialDate,
  EmrQuantityNumericMode,
  EmrQuantitySize,
  EmrSegmentedOption,
  EmrSignaturePoint,
  EmrSignatureStroke,
  EmrTimeHourCycle,
  EmrTimePrecision,
  EmrTone,
  EmrUploadedImageItem,
  EmrValidationMessage,
  FieldFrameIntent,
  FieldFrameLayout,
  ImageFieldIntent,
  ImageFieldViewModel,
  PairedFieldIntent,
  PairedFieldMode,
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
import {
  EmrDateInputComponent,
  EmrDateTimeInputComponent,
  EmrQuantityInputComponent,
  EmrTimeInputComponent,
} from '../primitives/emr-inputs.component';
import { emptyToNull } from '../primitives/emr-inputs.logic';
import { EmrLikertAnchor, EmrLikertComponent } from '../primitives/emr-likert.component';
import { EmrFileTriggerComponent } from '../primitives/emr-specialized-inputs.component';
import { EmrVasAnchor, EmrVasComponent } from '../primitives/emr-vas.component';
import { DEFAULT_ASPECT_PRESETS } from '../primitives/emr-wave2.logic';
import { EmrFieldFrameComponent } from './emr-field-frame.component';
import {
  extractDurationPartValidation,
  formatSignatureAttestation,
  hasSignatureValidationState,
  isSignaturePadLocked,
  mapPointerToSignaturePoint,
  normalizeFieldLayout,
  parsePairedNumberDraft,
  resolveDurationFieldConfig,
  resolvePairedNumberStep,
  resolvePairedSideMode,
  resolvePairedSideValidation,
  resolveRangeFieldMessages,
  resolveRangeNumericMode,
  resolveRangeSideValidation,
  resolveSignatureCanvasGeometry,
  sanitizePairedNumberText,
  stepPairedNumber,
} from './emr-fields.logic';

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
    @let sv = sideValidation();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [required]="effectiveRequired()"
      [readOnly]="effectiveReadOnly()"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div class="cf-stack">
        <div
          class="pf-row"
          [class.pf-row--lg]="resolvedSize() === 'lg'"
          role="group"
          [attr.aria-labelledby]="groupLabelledBy()"
          [attr.aria-label]="resolvedLabel()"
        >
          <div class="pf-cell">
            <label class="pf-sub" [for]="resolvedId() + '-first'">
              {{ m.firstLabel }}
              @if (firstReq()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </label>
            @if (showSteppers() && firstMode() !== 'text') {
              <div
                class="emr-input-affix pf-affix"
                [attr.data-invalid]="sv.firstHasError ? 'true' : null"
                [attr.data-warning]="!sv.firstHasError && sv.firstHasWarning ? 'true' : null"
                [attr.data-readonly]="firstLocked() ? 'true' : null"
              >
                <button
                  type="button"
                  class="emr-input-affix__btn emr-input-affix__btn--leading"
                  [disabled]="firstLocked() || !canDecrement('first')"
                  [attr.aria-label]="'Decrease ' + m.firstLabel"
                  (click)="stepPart('first', -1)"
                >
                  −
                </button>
                <input
                  #firstEl
                  class="emr-input-affix__field emr-input-affix__field--centered"
                  [id]="resolvedId() + '-first'"
                  type="text"
                  role="spinbutton"
                  [attr.inputmode]="firstMode() === 'integer' ? 'numeric' : 'decimal'"
                  [value]="firstDomValue()"
                  [placeholder]="m.firstPlaceholder ?? ''"
                  [attr.maxlength]="firstMaxLength() ?? null"
                  [attr.aria-valuemin]="firstMin() ?? null"
                  [attr.aria-valuemax]="firstMax() ?? null"
                  [attr.aria-valuenow]="firstNumericValue()"
                  [required]="firstReq()"
                  [readOnly]="firstLocked()"
                  [attr.aria-required]="firstReq() ? 'true' : null"
                  [attr.aria-readonly]="firstLocked() ? 'true' : null"
                  [attr.aria-invalid]="sv.firstHasError ? 'true' : null"
                  [attr.data-warning]="!sv.firstHasError && sv.firstHasWarning ? 'true' : null"
                  [attr.aria-describedby]="describedBy()"
                  (wheel)="onWheel('first', $event)"
                  (keydown)="onPartKeydown('first', $event)"
                  (input)="onPartInput('first', $event)"
                  (focus)="onPartFocus()"
                  (blur)="onPartBlur('first')"
                />
                <button
                  type="button"
                  class="emr-input-affix__btn"
                  [disabled]="firstLocked() || !canIncrement('first')"
                  [attr.aria-label]="'Increase ' + m.firstLabel"
                  (click)="stepPart('first', 1)"
                >
                  +
                </button>
              </div>
            } @else {
              <input
                #firstEl
                class="emr-control"
                [id]="resolvedId() + '-first'"
                type="text"
                [attr.role]="firstMode() !== 'text' ? 'spinbutton' : null"
                [attr.inputmode]="firstMode() === 'integer' ? 'numeric' : firstMode() === 'decimal' ? 'decimal' : null"
                [value]="firstDomValue()"
                [placeholder]="m.firstPlaceholder ?? ''"
                [attr.maxlength]="firstMaxLength() ?? null"
                [attr.aria-valuemin]="firstMode() !== 'text' ? (firstMin() ?? null) : null"
                [attr.aria-valuemax]="firstMode() !== 'text' ? (firstMax() ?? null) : null"
                [attr.aria-valuenow]="firstMode() !== 'text' ? firstNumericValue() : null"
                [required]="firstReq()"
                [readOnly]="firstLocked()"
                [attr.aria-required]="firstReq() ? 'true' : null"
                [attr.aria-readonly]="firstLocked() ? 'true' : null"
                [attr.aria-invalid]="sv.firstHasError ? 'true' : null"
                [attr.data-warning]="!sv.firstHasError && sv.firstHasWarning ? 'true' : null"
                [attr.aria-describedby]="describedBy()"
                (wheel)="onWheel('first', $event)"
                (keydown)="onPartKeydown('first', $event)"
                (input)="onPartInput('first', $event)"
                (focus)="onPartFocus()"
                (blur)="onPartBlur('first')"
              />
            }
          </div>
          <span class="pf-sep" aria-hidden="true">{{ m.separator ?? '/' }}</span>
          <div class="pf-cell">
            <label class="pf-sub" [for]="resolvedId() + '-second'">
              {{ m.secondLabel }}
              @if (secondReq()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </label>
            @if (showSteppers() && secondMode() !== 'text') {
              <div
                class="emr-input-affix pf-affix"
                [attr.data-invalid]="sv.secondHasError ? 'true' : null"
                [attr.data-warning]="!sv.secondHasError && sv.secondHasWarning ? 'true' : null"
                [attr.data-readonly]="secondLocked() ? 'true' : null"
              >
                <button
                  type="button"
                  class="emr-input-affix__btn emr-input-affix__btn--leading"
                  [disabled]="secondLocked() || !canDecrement('second')"
                  [attr.aria-label]="'Decrease ' + m.secondLabel"
                  (click)="stepPart('second', -1)"
                >
                  −
                </button>
                <input
                  #secondEl
                  class="emr-input-affix__field emr-input-affix__field--centered"
                  [id]="resolvedId() + '-second'"
                  type="text"
                  role="spinbutton"
                  [attr.inputmode]="secondMode() === 'integer' ? 'numeric' : 'decimal'"
                  [value]="secondDomValue()"
                  [placeholder]="m.secondPlaceholder ?? ''"
                  [attr.maxlength]="secondMaxLength() ?? null"
                  [attr.aria-valuemin]="secondMin() ?? null"
                  [attr.aria-valuemax]="secondMax() ?? null"
                  [attr.aria-valuenow]="secondNumericValue()"
                  [required]="secondReq()"
                  [readOnly]="secondLocked()"
                  [attr.aria-required]="secondReq() ? 'true' : null"
                  [attr.aria-readonly]="secondLocked() ? 'true' : null"
                  [attr.aria-invalid]="sv.secondHasError ? 'true' : null"
                  [attr.data-warning]="!sv.secondHasError && sv.secondHasWarning ? 'true' : null"
                  [attr.aria-describedby]="describedBy()"
                  (wheel)="onWheel('second', $event)"
                  (keydown)="onPartKeydown('second', $event)"
                  (input)="onPartInput('second', $event)"
                  (focus)="onPartFocus()"
                  (blur)="onPartBlur('second')"
                />
                <button
                  type="button"
                  class="emr-input-affix__btn"
                  [disabled]="secondLocked() || !canIncrement('second')"
                  [attr.aria-label]="'Increase ' + m.secondLabel"
                  (click)="stepPart('second', 1)"
                >
                  +
                </button>
              </div>
            } @else {
              <input
                #secondEl
                class="emr-control"
                [id]="resolvedId() + '-second'"
                type="text"
                [attr.role]="secondMode() !== 'text' ? 'spinbutton' : null"
                [attr.inputmode]="secondMode() === 'integer' ? 'numeric' : secondMode() === 'decimal' ? 'decimal' : null"
                [value]="secondDomValue()"
                [placeholder]="m.secondPlaceholder ?? ''"
                [attr.maxlength]="secondMaxLength() ?? null"
                [attr.aria-valuemin]="secondMode() !== 'text' ? (secondMin() ?? null) : null"
                [attr.aria-valuemax]="secondMode() !== 'text' ? (secondMax() ?? null) : null"
                [attr.aria-valuenow]="secondMode() !== 'text' ? secondNumericValue() : null"
                [required]="secondReq()"
                [readOnly]="secondLocked()"
                [attr.aria-required]="secondReq() ? 'true' : null"
                [attr.aria-readonly]="secondLocked() ? 'true' : null"
                [attr.aria-invalid]="sv.secondHasError ? 'true' : null"
                [attr.data-warning]="!sv.secondHasError && sv.secondHasWarning ? 'true' : null"
                [attr.aria-describedby]="describedBy()"
                (wheel)="onWheel('second', $event)"
                (keydown)="onPartKeydown('second', $event)"
                (input)="onPartInput('second', $event)"
                (focus)="onPartFocus()"
                (blur)="onPartBlur('second')"
              />
            }
          </div>
          @if (resolvedUnit(); as unitText) {
            <span class="pf-unit" aria-hidden="true">{{ unitText }}</span>
          }
          @if (showClearButton()) {
            <button
              type="button"
              class="pf-clear"
              data-emr-print="hide"
              [attr.aria-label]="'Clear ' + resolvedLabel()"
              (click)="onClear()"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          }
        </div>
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
        flex: 1 1 88px;
        min-width: 88px;
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
      .pf-unit {
        font-size: var(--emr-text-sm);
        font-weight: var(--emr-weight-medium);
      }
      .pf-affix {
        width: 100%;
      }
      .pf-clear {
        min-width: 44px;
        min-height: 44px;
        width: var(--emr-control-height, 44px);
        height: var(--emr-control-height, 44px);
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        background: var(--emr-surface);
        color: var(--emr-text-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        cursor: pointer;
      }
      .pf-clear:hover {
        border-color: var(--emr-focus);
        color: var(--emr-text);
        background: var(--emr-surface-soft);
      }
      .pf-clear:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
        outline-offset: 2px;
      }
      .pf-row--lg .emr-control,
      .pf-row--lg .emr-input-affix,
      .pf-row--lg .emr-input-affix__btn,
      .pf-row--lg .pf-clear,
      .pf-row--lg .pf-sep,
      .pf-row--lg .pf-unit {
        min-height: 48px;
        height: 48px;
      }
    `,
  ],
})
export class EmrPairedFieldComponent implements AfterViewChecked {
  readonly model = input.required<PairedFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly clearable = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly intent = output<PairedFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-paired-field-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedUnit = computed(
    () => this.model().unit ?? this.resolvedDefinition()?.presentation?.unitDisplay,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly resolvedSize = computed<'sm' | 'md' | 'lg'>(() => this.size() ?? this.model().size ?? 'md');
  protected readonly resolvedClearable = computed(() => this.clearable() ?? this.model().clearable ?? false);

  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly firstLocked = computed(() => this.effectiveReadOnly() || Boolean(this.model().firstReadOnly));
  protected readonly secondLocked = computed(() => this.effectiveReadOnly() || Boolean(this.model().secondReadOnly));

  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly firstReq = computed(() => Boolean(this.model().firstRequired ?? this.effectiveRequired()));
  protected readonly secondReq = computed(() => Boolean(this.model().secondRequired ?? this.effectiveRequired()));

  protected readonly firstMode = computed<PairedFieldMode>(() =>
    resolvePairedSideMode(this.model().firstMode, this.model().mode, this.resolvedDefinition()),
  );
  protected readonly secondMode = computed<PairedFieldMode>(() =>
    resolvePairedSideMode(this.model().secondMode, this.model().mode, this.resolvedDefinition()),
  );

  protected readonly firstMin = computed(() => this.model().firstMin ?? this.model().min);
  protected readonly firstMax = computed(() => this.model().firstMax ?? this.model().max);
  protected readonly secondMin = computed(() => this.model().secondMin ?? this.model().min);
  protected readonly secondMax = computed(() => this.model().secondMax ?? this.model().max);
  protected readonly firstPrecision = computed(() => this.model().firstPrecision ?? this.model().precision);
  protected readonly secondPrecision = computed(() => this.model().secondPrecision ?? this.model().precision);
  protected readonly firstStep = computed(() => this.model().firstStep ?? this.model().step);
  protected readonly secondStep = computed(() => this.model().secondStep ?? this.model().step);
  protected readonly firstMaxLength = computed(() => this.model().firstMaxLength ?? this.model().maxLength);
  protected readonly secondMaxLength = computed(() => this.model().secondMaxLength ?? this.model().maxLength);
  protected readonly showSteppers = computed(() => this.model().showSteppers === true);

  protected readonly firstDomValue = computed(() => {
    const v = this.model().value?.first;
    return v === null || v === undefined ? '' : String(v);
  });
  protected readonly secondDomValue = computed(() => {
    const v = this.model().value?.second;
    return v === null || v === undefined ? '' : String(v);
  });
  protected readonly firstNumericValue = computed(() => {
    const v = this.model().value?.first;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  });
  protected readonly secondNumericValue = computed(() => {
    const v = this.model().value?.second;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  });

  protected readonly sideValidation = computed(() => resolvePairedSideValidation(this.model().messages));
  protected readonly describedBy = computed(() =>
    hasFieldMessages(this.model().hint, this.model().messages)
      ? `${this.resolvedId()}-message`
      : null,
  );
  protected readonly groupLabelledBy = computed(() =>
    this.headingId() || (!this.labelHidden() && this.resolvedLabel() ? `${this.resolvedId()}-label` : null),
  );
  protected readonly showClearButton = computed(() => {
    if (!this.resolvedClearable() || this.effectiveReadOnly()) return false;
    const v = this.model().value;
    const hasFirst = !this.firstLocked() && v?.first !== null && v?.first !== undefined && v?.first !== '';
    const hasSecond = !this.secondLocked() && v?.second !== null && v?.second !== undefined && v?.second !== '';
    return hasFirst || hasSecond;
  });

  private readonly firstRef = viewChild<ElementRef<HTMLInputElement>>('firstEl');
  private readonly secondRef = viewChild<ElementRef<HTMLInputElement>>('secondEl');
  private needsDomSync = false;
  private firstDrafting = false;
  private secondDrafting = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onWheel(part: 'first' | 'second', event: WheelEvent): void {
    const mode = part === 'first' ? this.firstMode() : this.secondMode();
    if (mode !== 'text') {
      (event.currentTarget as HTMLInputElement).blur();
    }
  }

  protected canDecrement(part: 'first' | 'second'): boolean {
    const mode = part === 'first' ? this.firstMode() : this.secondMode();
    if (mode === 'text') return false;
    const min = part === 'first' ? this.firstMin() : this.secondMin();
    const cur = part === 'first' ? this.firstNumericValue() : this.secondNumericValue();
    if (min === undefined || cur === null) return true;
    const step = resolvePairedNumberStep({
      mode,
      precision: part === 'first' ? this.firstPrecision() : this.secondPrecision(),
      step: part === 'first' ? this.firstStep() : this.secondStep(),
    });
    return cur - step >= min - 1e-9;
  }

  protected canIncrement(part: 'first' | 'second'): boolean {
    const mode = part === 'first' ? this.firstMode() : this.secondMode();
    if (mode === 'text') return false;
    const max = part === 'first' ? this.firstMax() : this.secondMax();
    const cur = part === 'first' ? this.firstNumericValue() : this.secondNumericValue();
    if (max === undefined || cur === null) return true;
    const step = resolvePairedNumberStep({
      mode,
      precision: part === 'first' ? this.firstPrecision() : this.secondPrecision(),
      step: part === 'first' ? this.firstStep() : this.secondStep(),
    });
    return cur + step <= max + 1e-9;
  }

  protected stepPart(part: 'first' | 'second', delta: -1 | 1): void {
    const locked = part === 'first' ? this.firstLocked() : this.secondLocked();
    const mode = part === 'first' ? this.firstMode() : this.secondMode();
    if (locked || mode === 'text') return;
    const next = stepPairedNumber({
      current: part === 'first' ? this.firstNumericValue() : this.secondNumericValue(),
      delta,
      mode,
      step: part === 'first' ? this.firstStep() : this.secondStep(),
      precision: part === 'first' ? this.firstPrecision() : this.secondPrecision(),
      min: part === 'first' ? this.firstMin() : this.secondMin(),
      max: part === 'first' ? this.firstMax() : this.secondMax(),
    });
    if (part === 'first') {
      this.firstDrafting = false;
      this.scheduleSync();
      this.intent.emit({ type: 'firstChangeRequested', value: next });
    } else {
      this.secondDrafting = false;
      this.scheduleSync();
      this.intent.emit({ type: 'secondChangeRequested', value: next });
    }
  }

  protected onPartKeydown(part: 'first' | 'second', event: KeyboardEvent): void {
    const mode = part === 'first' ? this.firstMode() : this.secondMode();
    const locked = part === 'first' ? this.firstLocked() : this.secondLocked();
    if (locked || mode === 'text') return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.stepPart(part, 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepPart(part, -1);
    }
  }

  protected onPartInput(part: 'first' | 'second', event: Event): void {
    const target = event.target as HTMLInputElement;
    const locked = part === 'first' ? this.firstLocked() : this.secondLocked();
    if (locked) {
      this.syncDom();
      return;
    }

    const mode = part === 'first' ? this.firstMode() : this.secondMode();
    let parsedValue: string | number | null;
    if (mode === 'text') {
      if (part === 'first') this.firstDrafting = false;
      else this.secondDrafting = false;
      parsedValue = emptyToNull(target.value);
    } else {
      const clean = sanitizePairedNumberText(target.value, mode);
      if (target.value !== clean) {
        target.value = clean;
      }
      const parsed = parsePairedNumberDraft(clean, mode);
      if (!parsed.complete) {
        if (part === 'first') this.firstDrafting = true;
        else this.secondDrafting = true;
        return;
      }
      if (part === 'first') this.firstDrafting = false;
      else this.secondDrafting = false;
      parsedValue = parsed.value;
    }

    this.scheduleSync();
    if (part === 'first') {
      this.intent.emit({ type: 'firstChangeRequested', value: parsedValue });
    } else {
      this.intent.emit({ type: 'secondChangeRequested', value: parsedValue });
    }
  }

  protected onPartFocus(): void {
    this.focused.emit();
  }

  protected onPartBlur(part: 'first' | 'second'): void {
    if (part === 'first') this.firstDrafting = false;
    else this.secondDrafting = false;
    this.syncDom();
    this.blurred.emit();
  }

  protected onClear(): void {
    if (this.effectiveReadOnly()) return;
    this.firstDrafting = false;
    this.secondDrafting = false;
    this.scheduleSync();
    this.intent.emit({ type: 'clearRequested' });
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected syncDom(): void {
    const firstEl = this.firstRef()?.nativeElement;
    if (firstEl && !this.firstDrafting && firstEl.value !== this.firstDomValue()) {
      firstEl.value = this.firstDomValue();
    }
    const secondEl = this.secondRef()?.nativeElement;
    if (secondEl && !this.secondDrafting && secondEl.value !== this.secondDomValue()) {
      secondEl.value = this.secondDomValue();
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
  imports: [EmrFieldFrameComponent, EmrQuantityInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let cfg = resolvedConfig();
    @let pv = partValidation();
    <emr-field-frame
      [label]="cfg.label"
      [controlId]="resolvedId()"
      [labelHidden]="cfg.labelHidden"
      [labelNamesControl]="false"
      [layout]="cfg.layout"
      [showMetadata]="cfg.showMetadata"
      [required]="cfg.required"
      [readOnly]="cfg.readOnly"
      [hint]="cfg.hint"
      [warning]="warning()"
      [error]="error()"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div
        class="cf-stack"
        role="group"
        [attr.aria-labelledby]="groupLabelledBy()"
        [attr.aria-label]="cfg.label || null"
      >
        <emr-quantity-input
          [controlId]="resolvedId()"
          [label]="cfg.label"
          [labelHidden]="true"
          [ariaDescribedBy]="describedBy()"
          [value]="m.value?.amount ?? null"
          [unit]="m.value?.unit ?? null"
          [units]="unitSelectOptions()"
          [mode]="cfg.mode"
          [precision]="cfg.precision"
          [min]="cfg.min"
          [max]="cfg.max"
          [step]="cfg.step"
          [allowNegative]="cfg.allowNegative"
          [showSteppers]="cfg.showSteppers"
          [size]="cfg.size"
          [clearable]="cfg.clearable"
          [clearEmitsChanges]="false"
          [placeholder]="cfg.placeholder"
          [unitPlaceholder]="cfg.unitPlaceholder"
          [unitLabel]="cfg.unitLabel"
          [required]="cfg.required"
          [readOnly]="cfg.readOnly"
          [valueError]="pv.amountError"
          [unitError]="pv.unitError"
          [valueWarning]="pv.amountWarning"
          [unitWarning]="pv.unitWarning"
          (valueChange)="onAmountChange($event)"
          (unitChange)="onUnitChange($event)"
          (cleared)="onClear()"
          (focused)="focused.emit()"
          (blurred)="blurred.emit()"
          (submitted)="submitted.emit()"
        />
      </div>
    </emr-field-frame>
  `,
  styles: [SHARED_FIELD_STYLES],
})
export class EmrDurationInputComponent {
  readonly model = input.required<DurationFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly size = input<EmrQuantitySize>();
  readonly clearable = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly showSteppers = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly mode = input<EmrQuantityNumericMode>();
  readonly precision = input<number>();
  readonly placeholder = input<string>();
  readonly unitPlaceholder = input<string>();
  readonly hint = input<string>();
  readonly warning = input<string>();
  readonly error = input<string>();

  readonly intent = output<DurationFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly cleared = output<void>();
  readonly submitted = output<void>();

  private readonly fallbackId = `emr-duration-input-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly resolvedConfig = computed(() =>
    resolveDurationFieldConfig(this.model(), {
      definition: this.definition(),
      layout: this.layout(),
      showMetadata: this.showMetadata(),
      readOnly: this.readOnly(),
      size: this.size(),
      clearable: this.clearable(),
      showSteppers: this.showSteppers(),
      mode: this.mode(),
      precision: this.precision(),
      placeholder: this.placeholder(),
      unitPlaceholder: this.unitPlaceholder(),
      hint: this.hint(),
      labelHidden: this.labelHidden(),
    }),
  );

  protected readonly partValidation = computed(() =>
    extractDurationPartValidation(this.model().messages, {
      error: this.error(),
      warning: this.warning(),
    }),
  );

  protected readonly unitSelectOptions = computed<readonly EmrOption[]>(() =>
    this.model().unitOptions.map((u) => ({ value: u.value, label: u.label })),
  );

  protected readonly describedBy = computed(() => {
    const m = this.model();
    const cfg = this.resolvedConfig();
    const hasAny = Boolean(
      cfg.hint ||
        this.warning() ||
        this.error() ||
        (m.messages && m.messages.length > 0),
    );
    return hasAny ? `${this.resolvedId()}-message` : null;
  });

  protected readonly groupLabelledBy = computed(() => {
    const cfg = this.resolvedConfig();
    return this.headingId() || (!cfg.labelHidden && cfg.label ? `${this.resolvedId()}-label` : null);
  });

  protected onAmountChange(amount: number | null): void {
    if (this.resolvedConfig().readOnly) return;
    this.intent.emit({ type: 'amountChangeRequested', amount });
  }

  protected onUnitChange(unit: string | null): void {
    if (this.resolvedConfig().readOnly) return;
    if (unit === null) {
      this.intent.emit({ type: 'clearRequested' });
      this.cleared.emit();
      return;
    }
    this.intent.emit({ type: 'unitChangeRequested', unit: unit as EmrDurationUnit });
  }

  protected onClear(): void {
    if (this.resolvedConfig().readOnly) return;
    this.intent.emit({ type: 'clearRequested' });
    this.cleared.emit();
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.resolvedConfig().readOnly) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 6. EmrRangeFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-range-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrDateInputComponent, EmrTimeInputComponent, EmrDateTimeInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let sv = sideValidation();
    @let isLocked = locked();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [unit]="resolvedUnit()"
      [readOnly]="isLocked"
      [required]="resolvedRequired()"
      [hint]="resolvedHint()"
      [messages]="resolvedMessages()"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div class="cf-stack">
        <div
          class="rf-row"
          [class.rf-row--lg]="resolvedSize() === 'lg'"
          role="group"
          [attr.aria-labelledby]="groupLabelledBy()"
          [attr.aria-label]="resolvedLabel()"
          (focusin)="onGroupFocusIn()"
          (focusout)="onGroupFocusOut($event)"
        >
          <div class="rf-cell" [class.rf-cell--datetime]="m.kind === 'datetime'">
            <label class="rf-sub" [for]="lowLabelFor()">
              {{ lowLabel() }}
              @if (lowReq()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </label>
            @switch (m.kind) {
              @case ('date') {
                <emr-date-input
                  [controlId]="resolvedId() + '-low'"
                  [label]="lowLabel()"
                  [labelHidden]="true"
                  [ariaLabel]="resolvedLabel() + ', ' + lowLabel()"
                  [ariaDescribedBy]="describedBy() ?? undefined"
                  [value]="lowStringValue()"
                  [min]="lowMinStr()"
                  [max]="lowMaxStr()"
                  [placeholder]="m.lowPlaceholder ?? ''"
                  [size]="resolvedSize()"
                  [required]="lowReq()"
                  [readOnly]="isLocked"
                  [invalid]="sv.lowInvalid"
                  [warning]="sv.lowWarning ? 'warning' : ''"
                  (valueChange)="onTemporalChange('low', $event)"
                  (submitted)="onChildSubmitted()"
                />
              }
              @case ('time') {
                <emr-time-input
                  [controlId]="resolvedId() + '-low'"
                  [label]="lowLabel()"
                  [labelHidden]="true"
                  [ariaLabel]="resolvedLabel() + ', ' + lowLabel()"
                  [ariaDescribedBy]="describedBy() ?? undefined"
                  [fullWidth]="true"
                  [value]="lowStringValue()"
                  [precision]="resolvedTimePrecision()"
                  [hourCycle]="resolvedHourCycle()"
                  [min]="lowMinStr()"
                  [max]="lowMaxStr()"
                  [step]="resolvedStep()"
                  [placeholder]="m.lowPlaceholder ?? ''"
                  [size]="resolvedSize()"
                  [clearable]="false"
                  [required]="lowReq()"
                  [readOnly]="isLocked"
                  [invalid]="sv.lowInvalid"
                  [warning]="sv.lowWarning ? 'warning' : ''"
                  (valueChange)="onTemporalChange('low', $event)"
                  (submitted)="onChildSubmitted()"
                />
              }
              @case ('datetime') {
                <emr-datetime-input
                  [controlId]="resolvedId() + '-low'"
                  [label]="lowLabel()"
                  [labelHidden]="true"
                  [ariaLabel]="resolvedLabel() + ', ' + lowLabel()"
                  [ariaDescribedBy]="describedBy() ?? undefined"
                  [value]="lowStringValue()"
                  [displayFormat]="resolvedDisplayFormat()"
                  [timePrecision]="resolvedTimePrecision()"
                  [hourCycle]="resolvedHourCycle()"
                  [wireFormat]="resolvedWireFormat()"
                  [min]="lowMinStr()"
                  [max]="lowMaxStr()"
                  [size]="resolvedSize()"
                  [clearable]="false"
                  [required]="lowReq()"
                  [readOnly]="isLocked"
                  [invalid]="sv.lowInvalid"
                  [warning]="sv.lowWarning ? 'warning' : ''"
                  (valueChange)="onTemporalChange('low', $event)"
                  (submitted)="onChildSubmitted()"
                />
              }
              @default {
                @if (resolvedShowSteppers()) {
                  <div
                    class="emr-input-affix rf-affix"
                    [attr.data-invalid]="sv.lowInvalid ? 'true' : null"
                    [attr.data-warning]="sv.lowWarning ? 'true' : null"
                    [attr.data-readonly]="isLocked ? 'true' : null"
                  >
                    <button
                      type="button"
                      class="emr-input-affix__btn emr-input-affix__btn--leading"
                      [disabled]="isLocked || !canDecrement('low')"
                      [attr.aria-label]="'Decrease ' + lowLabel()"
                      (click)="stepBound('low', -1)"
                    >
                      −
                    </button>
                    <input
                      #lowEl
                      class="emr-input-affix__field emr-input-affix__field--centered"
                      [id]="resolvedId() + '-low'"
                      type="text"
                      role="spinbutton"
                      [attr.inputmode]="resolvedNumericMode() === 'integer' ? 'numeric' : 'decimal'"
                      [value]="lowDomValue()"
                      [placeholder]="m.lowPlaceholder ?? 'Min'"
                      [attr.aria-label]="resolvedLabel() + ', ' + lowLabel()"
                      [attr.aria-valuemin]="lowMinNum() ?? null"
                      [attr.aria-valuemax]="lowMaxNum() ?? null"
                      [attr.aria-valuenow]="lowNumericValue()"
                      [required]="lowReq()"
                      [readOnly]="isLocked"
                      [attr.aria-required]="lowReq() ? 'true' : null"
                      [attr.aria-readonly]="isLocked ? 'true' : null"
                      [attr.aria-invalid]="sv.lowInvalid ? 'true' : null"
                      [attr.data-warning]="sv.lowWarning ? 'true' : null"
                      [attr.aria-describedby]="describedBy()"
                      (wheel)="onWheel($event)"
                      (keydown)="onNumberKeydown('low', $event)"
                      (input)="onNumberInput('low', $event)"
                      (blur)="onNumberBlur('low')"
                    />
                    <button
                      type="button"
                      class="emr-input-affix__btn"
                      [disabled]="isLocked || !canIncrement('low')"
                      [attr.aria-label]="'Increase ' + lowLabel()"
                      (click)="stepBound('low', 1)"
                    >
                      +
                    </button>
                  </div>
                } @else {
                  <input
                    #lowEl
                    class="emr-control rf-input"
                    [class.emr-control--sm]="resolvedSize() === 'sm'"
                    [class.emr-control--lg]="resolvedSize() === 'lg'"
                    [id]="resolvedId() + '-low'"
                    type="text"
                    role="spinbutton"
                    [attr.inputmode]="resolvedNumericMode() === 'integer' ? 'numeric' : 'decimal'"
                    [value]="lowDomValue()"
                    [placeholder]="m.lowPlaceholder ?? 'Min'"
                    [attr.aria-label]="resolvedLabel() + ', ' + lowLabel()"
                    [attr.aria-valuemin]="lowMinNum() ?? null"
                    [attr.aria-valuemax]="lowMaxNum() ?? null"
                    [attr.aria-valuenow]="lowNumericValue()"
                    [required]="lowReq()"
                    [readOnly]="isLocked"
                    [attr.aria-required]="lowReq() ? 'true' : null"
                    [attr.aria-readonly]="isLocked ? 'true' : null"
                    [attr.aria-invalid]="sv.lowInvalid ? 'true' : null"
                    [attr.data-warning]="sv.lowWarning ? 'true' : null"
                    [attr.aria-describedby]="describedBy()"
                    (wheel)="onWheel($event)"
                    (keydown)="onNumberKeydown('low', $event)"
                    (input)="onNumberInput('low', $event)"
                    (blur)="onNumberBlur('low')"
                  />
                }
              }
            }
          </div>

          <span class="rf-sep" aria-hidden="true">–</span>

          <div class="rf-cell" [class.rf-cell--datetime]="m.kind === 'datetime'">
            <label class="rf-sub" [for]="highLabelFor()">
              {{ highLabel() }}
              @if (highReq()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </label>
            @switch (m.kind) {
              @case ('date') {
                <emr-date-input
                  [controlId]="resolvedId() + '-high'"
                  [label]="highLabel()"
                  [labelHidden]="true"
                  [ariaLabel]="resolvedLabel() + ', ' + highLabel()"
                  [ariaDescribedBy]="describedBy() ?? undefined"
                  [value]="highStringValue()"
                  [min]="highMinStr()"
                  [max]="highMaxStr()"
                  [placeholder]="m.highPlaceholder ?? ''"
                  [size]="resolvedSize()"
                  [required]="highReq()"
                  [readOnly]="isLocked"
                  [invalid]="sv.highInvalid"
                  [warning]="sv.highWarning ? 'warning' : ''"
                  (valueChange)="onTemporalChange('high', $event)"
                  (submitted)="onChildSubmitted()"
                />
              }
              @case ('time') {
                <emr-time-input
                  [controlId]="resolvedId() + '-high'"
                  [label]="highLabel()"
                  [labelHidden]="true"
                  [ariaLabel]="resolvedLabel() + ', ' + highLabel()"
                  [ariaDescribedBy]="describedBy() ?? undefined"
                  [fullWidth]="true"
                  [value]="highStringValue()"
                  [precision]="resolvedTimePrecision()"
                  [hourCycle]="resolvedHourCycle()"
                  [min]="highMinStr()"
                  [max]="highMaxStr()"
                  [step]="resolvedStep()"
                  [placeholder]="m.highPlaceholder ?? ''"
                  [size]="resolvedSize()"
                  [clearable]="false"
                  [required]="highReq()"
                  [readOnly]="isLocked"
                  [invalid]="sv.highInvalid"
                  [warning]="sv.highWarning ? 'warning' : ''"
                  (valueChange)="onTemporalChange('high', $event)"
                  (submitted)="onChildSubmitted()"
                />
              }
              @case ('datetime') {
                <emr-datetime-input
                  [controlId]="resolvedId() + '-high'"
                  [label]="highLabel()"
                  [labelHidden]="true"
                  [ariaLabel]="resolvedLabel() + ', ' + highLabel()"
                  [ariaDescribedBy]="describedBy() ?? undefined"
                  [value]="highStringValue()"
                  [displayFormat]="resolvedDisplayFormat()"
                  [timePrecision]="resolvedTimePrecision()"
                  [hourCycle]="resolvedHourCycle()"
                  [wireFormat]="resolvedWireFormat()"
                  [min]="highMinStr()"
                  [max]="highMaxStr()"
                  [size]="resolvedSize()"
                  [clearable]="false"
                  [required]="highReq()"
                  [readOnly]="isLocked"
                  [invalid]="sv.highInvalid"
                  [warning]="sv.highWarning ? 'warning' : ''"
                  (valueChange)="onTemporalChange('high', $event)"
                  (submitted)="onChildSubmitted()"
                />
              }
              @default {
                @if (resolvedShowSteppers()) {
                  <div
                    class="emr-input-affix rf-affix"
                    [attr.data-invalid]="sv.highInvalid ? 'true' : null"
                    [attr.data-warning]="sv.highWarning ? 'true' : null"
                    [attr.data-readonly]="isLocked ? 'true' : null"
                  >
                    <button
                      type="button"
                      class="emr-input-affix__btn emr-input-affix__btn--leading"
                      [disabled]="isLocked || !canDecrement('high')"
                      [attr.aria-label]="'Decrease ' + highLabel()"
                      (click)="stepBound('high', -1)"
                    >
                      −
                    </button>
                    <input
                      #highEl
                      class="emr-input-affix__field emr-input-affix__field--centered"
                      [id]="resolvedId() + '-high'"
                      type="text"
                      role="spinbutton"
                      [attr.inputmode]="resolvedNumericMode() === 'integer' ? 'numeric' : 'decimal'"
                      [value]="highDomValue()"
                      [placeholder]="m.highPlaceholder ?? 'Max'"
                      [attr.aria-label]="resolvedLabel() + ', ' + highLabel()"
                      [attr.aria-valuemin]="highMinNum() ?? null"
                      [attr.aria-valuemax]="highMaxNum() ?? null"
                      [attr.aria-valuenow]="highNumericValue()"
                      [required]="highReq()"
                      [readOnly]="isLocked"
                      [attr.aria-required]="highReq() ? 'true' : null"
                      [attr.aria-readonly]="isLocked ? 'true' : null"
                      [attr.aria-invalid]="sv.highInvalid ? 'true' : null"
                      [attr.data-warning]="sv.highWarning ? 'true' : null"
                      [attr.aria-describedby]="describedBy()"
                      (wheel)="onWheel($event)"
                      (keydown)="onNumberKeydown('high', $event)"
                      (input)="onNumberInput('high', $event)"
                      (blur)="onNumberBlur('high')"
                    />
                    <button
                      type="button"
                      class="emr-input-affix__btn"
                      [disabled]="isLocked || !canIncrement('high')"
                      [attr.aria-label]="'Increase ' + highLabel()"
                      (click)="stepBound('high', 1)"
                    >
                      +
                    </button>
                  </div>
                } @else {
                  <input
                    #highEl
                    class="emr-control rf-input"
                    [class.emr-control--sm]="resolvedSize() === 'sm'"
                    [class.emr-control--lg]="resolvedSize() === 'lg'"
                    [id]="resolvedId() + '-high'"
                    type="text"
                    role="spinbutton"
                    [attr.inputmode]="resolvedNumericMode() === 'integer' ? 'numeric' : 'decimal'"
                    [value]="highDomValue()"
                    [placeholder]="m.highPlaceholder ?? 'Max'"
                    [attr.aria-label]="resolvedLabel() + ', ' + highLabel()"
                    [attr.aria-valuemin]="highMinNum() ?? null"
                    [attr.aria-valuemax]="highMaxNum() ?? null"
                    [attr.aria-valuenow]="highNumericValue()"
                    [required]="highReq()"
                    [readOnly]="isLocked"
                    [attr.aria-required]="highReq() ? 'true' : null"
                    [attr.aria-readonly]="isLocked ? 'true' : null"
                    [attr.aria-invalid]="sv.highInvalid ? 'true' : null"
                    [attr.data-warning]="sv.highWarning ? 'true' : null"
                    [attr.aria-describedby]="describedBy()"
                    (wheel)="onWheel($event)"
                    (keydown)="onNumberKeydown('high', $event)"
                    (input)="onNumberInput('high', $event)"
                    (blur)="onNumberBlur('high')"
                  />
                }
              }
            }
          </div>

          @if (showClearButton()) {
            <button
              type="button"
              class="rf-clear"
              data-emr-print="hide"
              [attr.aria-label]="'Clear ' + resolvedLabel()"
              (click)="onClear()"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          }
        </div>
      </div>
    </emr-field-frame>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .rf-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 8px;
        min-width: 0;
      }
      .rf-cell {
        flex: 1 1 132px;
        min-width: 0;
        display: grid;
        gap: 4px;
      }
      .rf-cell--datetime {
        flex: 1 1 240px;
      }
      .rf-sub {
        font-size: var(--emr-text-xs);
        font-weight: var(--emr-weight-medium);
        color: var(--emr-text-muted);
      }
      .rf-input {
        width: 100%;
        min-width: 0;
      }
      .rf-affix {
        width: 100%;
      }
      .rf-sep {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        color: var(--emr-text-muted);
        font-weight: var(--emr-weight-bold);
      }
      .rf-clear {
        min-width: 44px;
        min-height: 44px;
        width: var(--emr-control-height, 44px);
        height: var(--emr-control-height, 44px);
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        background: var(--emr-surface);
        color: var(--emr-text-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        cursor: pointer;
      }
      .rf-clear:hover {
        border-color: var(--emr-focus);
        color: var(--emr-text);
        background: var(--emr-surface-soft);
      }
      .rf-clear:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
        outline-offset: 2px;
      }
      .rf-row--lg .emr-control,
      .rf-row--lg .emr-input-affix,
      .rf-row--lg .emr-input-affix__btn,
      .rf-row--lg .rf-clear,
      .rf-row--lg .rf-sep {
        min-height: 48px;
        height: 48px;
      }
    `,
  ],
})
export class EmrRangeFieldComponent implements AfterViewChecked {
  readonly model = input.required<RangeFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md' | 'lg'>();
  readonly clearable = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly showSteppers = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });
  readonly displayFormat = input<EmrDateTimeDisplayFormat>();
  readonly timePrecision = input<EmrTimePrecision>();
  readonly hourCycle = input<EmrTimeHourCycle>();
  readonly wireFormat = input<EmrDateTimeWireFormat>();

  readonly intent = output<RangeFieldIntent>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
  readonly submitted = output<void>();

  private readonly fallbackId = `emr-range-field-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedUnit = computed(
    () => this.model().unit ?? this.resolvedDefinition()?.presentation?.unitDisplay,
  );
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly resolvedSize = computed<'sm' | 'md' | 'lg'>(() => this.size() ?? this.model().size ?? 'md');
  protected readonly resolvedClearable = computed(() => this.clearable() ?? this.model().clearable ?? true);
  protected readonly resolvedShowSteppers = computed(() => this.showSteppers() ?? this.model().showSteppers ?? false);
  protected readonly resolvedDisplayFormat = computed<EmrDateTimeDisplayFormat>(
    () => this.displayFormat() ?? this.model().displayFormat ?? 'dd-mm-yyyy',
  );
  protected readonly resolvedTimePrecision = computed<EmrTimePrecision>(
    () => this.timePrecision() ?? this.model().timePrecision ?? 'minute',
  );
  protected readonly resolvedHourCycle = computed<EmrTimeHourCycle>(
    () => this.hourCycle() ?? this.model().hourCycle ?? '24',
  );
  protected readonly resolvedWireFormat = computed<EmrDateTimeWireFormat>(
    () => this.wireFormat() ?? this.model().wireFormat ?? 'utc',
  );
  protected readonly locked = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly resolvedRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly lowReq = computed(() => Boolean(this.model().lowRequired ?? this.resolvedRequired()));
  protected readonly highReq = computed(() => Boolean(this.model().highRequired ?? this.resolvedRequired()));

  protected readonly lowLabel = computed(
    () => this.model().lowLabel ?? (this.model().kind === 'number' ? 'Low' : 'From'),
  );
  protected readonly highLabel = computed(
    () => this.model().highLabel ?? (this.model().kind === 'number' ? 'High' : 'To'),
  );
  protected readonly lowLabelFor = computed(() =>
    this.model().kind === 'datetime' ? `${this.resolvedId()}-low-date` : `${this.resolvedId()}-low`,
  );
  protected readonly highLabelFor = computed(() =>
    this.model().kind === 'datetime' ? `${this.resolvedId()}-high-date` : `${this.resolvedId()}-high`,
  );

  protected readonly resolvedNumericMode = computed(() =>
    resolveRangeNumericMode(this.model().numericMode, this.resolvedPrecision(), this.resolvedDefinition()),
  );
  protected readonly resolvedPrecision = computed(
    () => this.model().precision ?? this.resolvedDefinition()?.presentation?.precision,
  );
  protected readonly resolvedStep = computed(
    () => this.model().step ?? this.resolvedDefinition()?.presentation?.step,
  );

  protected readonly lowMinNum = computed(() => {
    const raw = this.model().lowMin ?? this.model().min ?? this.resolvedDefinition()?.presentation?.min;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
  });
  protected readonly lowMaxNum = computed(() => {
    const raw = this.model().lowMax ?? this.model().max ?? this.resolvedDefinition()?.presentation?.max;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
  });
  protected readonly highMinNum = computed(() => {
    const raw = this.model().highMin ?? this.model().min ?? this.resolvedDefinition()?.presentation?.min;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
  });
  protected readonly highMaxNum = computed(() => {
    const raw = this.model().highMax ?? this.model().max ?? this.resolvedDefinition()?.presentation?.max;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
  });

  protected readonly lowMinStr = computed(() => {
    const raw = this.model().lowMin ?? this.model().min;
    return typeof raw === 'string' && raw ? raw : undefined;
  });
  protected readonly lowMaxStr = computed(() => {
    const raw = this.model().lowMax ?? this.model().max;
    return typeof raw === 'string' && raw ? raw : undefined;
  });
  protected readonly highMinStr = computed(() => {
    const raw = this.model().highMin ?? this.model().min;
    return typeof raw === 'string' && raw ? raw : undefined;
  });
  protected readonly highMaxStr = computed(() => {
    const raw = this.model().highMax ?? this.model().max;
    return typeof raw === 'string' && raw ? raw : undefined;
  });

  protected readonly lowDomValue = computed(() => {
    const v = this.model().value?.low;
    return v === null || v === undefined ? '' : String(v);
  });
  protected readonly highDomValue = computed(() => {
    const v = this.model().value?.high;
    return v === null || v === undefined ? '' : String(v);
  });
  protected readonly lowStringValue = computed(() => {
    const v = this.model().value?.low;
    return typeof v === 'string' ? v : null;
  });
  protected readonly highStringValue = computed(() => {
    const v = this.model().value?.high;
    return typeof v === 'string' ? v : null;
  });
  protected readonly lowNumericValue = computed(() => {
    const v = this.model().value?.low;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  });
  protected readonly highNumericValue = computed(() => {
    const v = this.model().value?.high;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  });

  protected readonly resolvedMessages = computed(() => resolveRangeFieldMessages(this.model()));
  protected readonly sideValidation = computed(() => resolveRangeSideValidation(this.resolvedMessages()));
  protected readonly describedBy = computed(() =>
    hasFieldMessages(this.resolvedHint(), this.resolvedMessages()) ? `${this.resolvedId()}-message` : null,
  );
  protected readonly groupLabelledBy = computed(() =>
    this.headingId() || (!this.labelHidden() && this.resolvedLabel() ? `${this.resolvedId()}-label` : null),
  );
  protected readonly showClearButton = computed(() => {
    if (!this.resolvedClearable() || this.locked()) return false;
    const v = this.model().value;
    const hasLow = v?.low !== null && v?.low !== undefined && v?.low !== '';
    const hasHigh = v?.high !== null && v?.high !== undefined && v?.high !== '';
    return hasLow || hasHigh;
  });

  private readonly lowRef = viewChild<ElementRef<HTMLInputElement>>('lowEl');
  private readonly highRef = viewChild<ElementRef<HTMLInputElement>>('highEl');
  private needsDomSync = false;
  private lowDrafting = false;
  private highDrafting = false;
  private focusInside = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onGroupFocusIn(): void {
    if (!this.focusInside) {
      this.focusInside = true;
      this.focused.emit();
    }
  }

  protected onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const cur = event.currentTarget as HTMLElement | null;
    if (next && cur?.contains(next)) return;
    if (this.focusInside) {
      this.focusInside = false;
      this.blurred.emit();
    }
  }

  protected onWheel(event: WheelEvent): void {
    if (this.model().kind === 'number') {
      (event.currentTarget as HTMLInputElement).blur();
    }
  }

  protected canDecrement(bound: 'low' | 'high'): boolean {
    const min = bound === 'low' ? this.lowMinNum() : this.highMinNum();
    const cur = bound === 'low' ? this.lowNumericValue() : this.highNumericValue();
    if (min === undefined || cur === null) return true;
    const step = resolvePairedNumberStep({
      mode: this.resolvedNumericMode(),
      precision: this.resolvedPrecision(),
      step: this.resolvedStep(),
    });
    return cur - step >= min - 1e-9;
  }

  protected canIncrement(bound: 'low' | 'high'): boolean {
    const max = bound === 'low' ? this.lowMaxNum() : this.highMaxNum();
    const cur = bound === 'low' ? this.lowNumericValue() : this.highNumericValue();
    if (max === undefined || cur === null) return true;
    const step = resolvePairedNumberStep({
      mode: this.resolvedNumericMode(),
      precision: this.resolvedPrecision(),
      step: this.resolvedStep(),
    });
    return cur + step <= max + 1e-9;
  }

  protected stepBound(bound: 'low' | 'high', delta: -1 | 1): void {
    if (this.locked() || this.model().kind !== 'number') return;
    const cur = bound === 'low' ? this.lowNumericValue() : this.highNumericValue();
    const next = stepPairedNumber({
      current: cur,
      delta,
      mode: this.resolvedNumericMode(),
      step: this.resolvedStep(),
      precision: this.resolvedPrecision(),
      min: bound === 'low' ? this.lowMinNum() : this.highMinNum(),
      max: bound === 'low' ? this.lowMaxNum() : this.highMaxNum(),
    });
    if (bound === 'low') {
      this.lowDrafting = false;
      this.intent.emit({ type: 'lowChangeRequested', low: next });
    } else {
      this.highDrafting = false;
      this.intent.emit({ type: 'highChangeRequested', high: next });
    }
  }

  protected onNumberKeydown(bound: 'low' | 'high', event: KeyboardEvent): void {
    if (this.locked()) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.stepBound(bound, 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepBound(bound, -1);
    } else if (event.key === 'Enter') {
      this.submitted.emit();
    }
  }

  protected onNumberInput(bound: 'low' | 'high', event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.locked()) {
      this.syncDom();
      return;
    }
    const mode = this.resolvedNumericMode();
    const cleaned = sanitizePairedNumberText(target.value, mode);
    if (target.value !== cleaned) {
      target.value = cleaned;
    }
    const parsed = parsePairedNumberDraft(cleaned, mode);
    if (!parsed.complete) {
      if (bound === 'low') this.lowDrafting = true;
      else this.highDrafting = true;
      return;
    }
    if (bound === 'low') this.lowDrafting = false;
    else this.highDrafting = false;

    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });

    if (bound === 'low') {
      this.intent.emit({ type: 'lowChangeRequested', low: parsed.value });
    } else {
      this.intent.emit({ type: 'highChangeRequested', high: parsed.value });
    }
  }

  protected onNumberBlur(bound: 'low' | 'high'): void {
    if (bound === 'low') this.lowDrafting = false;
    else this.highDrafting = false;
    this.syncDom();
  }

  protected onTemporalChange(bound: 'low' | 'high', val: string | null): void {
    if (this.locked()) return;
    if (bound === 'low') {
      this.intent.emit({ type: 'lowChangeRequested', low: val });
    } else {
      this.intent.emit({ type: 'highChangeRequested', high: val });
    }
  }

  protected onChildSubmitted(): void {
    if (!this.locked()) {
      this.submitted.emit();
    }
  }

  protected onClear(): void {
    if (this.locked()) return;
    this.lowDrafting = false;
    this.highDrafting = false;
    this.intent.emit({ type: 'clearRequested' });
    this.cleared.emit();
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.locked()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected syncDom(): void {
    const lowEl = this.lowRef()?.nativeElement;
    if (lowEl && !this.lowDrafting && lowEl.value !== this.lowDomValue()) {
      lowEl.value = this.lowDomValue();
    }
    const highEl = this.highRef()?.nativeElement;
    if (highEl && !this.highDrafting && highEl.value !== this.highDomValue()) {
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
    @let geom = geometry();
    @let isLocked = locked();
    @let vState = validation();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="resolvedLabelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [readOnly]="isLocked"
      [required]="resolvedRequired()"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      [hint]="resolvedHint()"
      [messages]="m.messages ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div class="cf-stack">
        <div class="sig-pad-wrap">
          <svg
            class="emr-signature-pad sig-pad"
            [id]="resolvedId()"
            [attr.viewBox]="'0 0 ' + geom.width + ' ' + geom.height"
            preserveAspectRatio="xMidYMid meet"
            [style.width]="'100%'"
            [style.height.px]="geom.height"
            [attr.tabindex]="0"
            [attr.role]="isLocked ? 'img' : 'region'"
            [attr.aria-roledescription]="isLocked ? null : 'signature pad'"
            [attr.aria-labelledby]="labelledBy()"
            [attr.aria-label]="labelledBy() ? null : resolvedLabel() + ' signature pad'"
            [attr.aria-invalid]="vState.hasError ? 'true' : null"
            [attr.data-warning]="vState.hasWarning ? 'true' : null"
            [attr.aria-required]="!isLocked && resolvedRequired() ? 'true' : null"
            [attr.aria-readonly]="isLocked ? 'true' : null"
            [attr.data-readonly]="isLocked ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            (pointerdown)="onPointerDown($event)"
            (pointermove)="onPointerMove($event)"
            (pointerup)="onPointerUp($event)"
            (pointercancel)="onPointerCancel($event)"
            (keydown)="onKeyDown($event)"
            (focusin)="focused.emit()"
            (focusout)="blurred.emit()"
          >
            <line
              [attr.x1]="geom.baselineInset"
              [attr.y1]="geom.baselineY"
              [attr.x2]="geom.width - geom.baselineInset"
              [attr.y2]="geom.baselineY"
              stroke="var(--emr-border)"
              stroke-width="1"
              stroke-dasharray="4 4"
            />
            @for (stroke of m.strokes; track $index) {
              @if (stroke.points.length === 1) {
                <circle
                  [attr.cx]="stroke.points[0].x"
                  [attr.cy]="stroke.points[0].y"
                  [attr.r]="dotRadius()"
                  fill="var(--emr-text)"
                />
              } @else if (stroke.points.length > 1) {
                <polyline
                  fill="none"
                  stroke="var(--emr-text)"
                  [attr.stroke-width]="penWidth()"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  [attr.points]="toSvgPoints(stroke.points)"
                />
              }
            }
            @if (draftPoints().length === 1) {
              <circle
                [attr.cx]="draftPoints()[0].x"
                [attr.cy]="draftPoints()[0].y"
                [attr.r]="dotRadius()"
                fill="var(--emr-primary)"
              />
            } @else if (draftPoints().length > 1) {
              <polyline
                fill="none"
                stroke="var(--emr-primary)"
                [attr.stroke-width]="penWidth()"
                stroke-linecap="round"
                stroke-linejoin="round"
                [attr.points]="toSvgPoints(draftPoints())"
              />
            }
          </svg>
          @if (isEmptyPad()) {
            <div class="emr-signature-empty sig-empty" aria-hidden="true">
              {{ emptyPromptText() }}
            </div>
          }
        </div>

        <div class="sig-footer">
          <div class="sig-meta">
            <span>{{ attestationText() }}</span>
          </div>
          @if (!isLocked && (canUndo() || canClear())) {
            <div class="sig-actions" data-emr-print="hide">
              @if (canUndo()) {
                <button
                  type="button"
                  class="emr-button emr-button--outline emr-button--small sig-btn"
                  [disabled]="m.strokes.length === 0"
                  [attr.aria-label]="'Undo last stroke on ' + resolvedLabel()"
                  (click)="emitUndo()"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                  </svg>
                  <span>Undo</span>
                </button>
              }
              @if (canClear()) {
                <button
                  type="button"
                  class="emr-button emr-button--outline emr-button--small sig-btn"
                  [disabled]="m.strokes.length === 0"
                  [attr.aria-label]="'Clear ' + resolvedLabel()"
                  (click)="emitClear()"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Clear</span>
                </button>
              }
            </div>
          }
        </div>
      </div>
    </emr-field-frame>
  `,
  styles: [
    SHARED_FIELD_STYLES,
    `
      .sig-pad-wrap {
        position: relative;
        min-width: 0;
      }
      .sig-pad {
        color: var(--emr-text);
        cursor: crosshair;
      }
      .sig-pad[data-readonly='true'] {
        cursor: default;
      }
      .sig-empty {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        text-align: center;
        pointer-events: none;
        color: var(--emr-text-muted);
        font-size: var(--emr-text-sm);
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
      .sig-actions {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .sig-btn {
        min-width: 44px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
    `,
  ],
})
export class EmrSignatureCaptureFieldComponent {
  readonly model = input.required<SignatureCaptureViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });

  readonly intent = output<SignatureCaptureIntent>();
  readonly valueChange = output<readonly EmrSignatureStroke[]>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-signature-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedLabelHidden = computed(
    () => this.labelHidden() || Boolean(this.model().labelHidden),
  );
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly locked = computed(() =>
    isSignaturePadLocked(
      { readOnly: this.model().readOnly, definition: this.resolvedDefinition() },
      this.readOnly(),
    ),
  );
  protected readonly resolvedRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly geometry = computed(() =>
    resolveSignatureCanvasGeometry(this.model().width, this.model().height),
  );
  protected readonly padWidth = computed(() => this.geometry().width);
  protected readonly padHeight = computed(() => this.geometry().height);
  protected readonly penWidth = computed(() => {
    const pw = this.model().penWidth;
    return typeof pw === 'number' && Number.isFinite(pw) && pw > 0 ? pw : 2.25;
  });
  protected readonly dotRadius = computed(() =>
    Number(Math.max(1.25, this.penWidth() * 0.78).toFixed(2)),
  );
  protected readonly validation = computed(() => hasSignatureValidationState(this.model().messages));
  protected readonly hasError = computed(() => this.validation().hasError);
  protected readonly describedBy = computed(() =>
    hasFieldMessages(this.resolvedHint(), this.model().messages)
      ? `${this.resolvedId()}-message`
      : null,
  );
  protected readonly labelledBy = computed(
    () =>
      this.headingId() ||
      (!this.resolvedLabelHidden() && this.resolvedLabel() ? `${this.resolvedId()}-label` : null),
  );
  protected readonly attestationText = computed(() => formatSignatureAttestation(this.model()));
  protected readonly emptyPromptText = computed(() => {
    const custom = this.model().emptyPrompt?.trim();
    if (custom) return custom;
    return this.locked() ? 'No signature captured' : 'Sign here with stylus, mouse, or finger';
  });
  protected readonly isEmptyPad = computed(
    () => this.model().strokes.length === 0 && this.draftPoints().length === 0,
  );
  protected readonly canUndo = computed(
    () => !this.locked() && this.model().undoable !== false,
  );
  protected readonly canClear = computed(
    () => !this.locked() && this.model().clearable !== false,
  );

  /** Transient pointer gesture buffer only while actively drawing one stroke. */
  protected readonly draftPoints = signal<readonly EmrSignaturePoint[]>([]);
  private activePointerId: number | null = null;

  protected toSvgPoints(points: readonly EmrSignaturePoint[]): string {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.locked()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const svg = event.currentTarget as SVGSVGElement;
    const pid = typeof event.pointerId === 'number' ? event.pointerId : 0;
    if (typeof event.pointerId === 'number' && typeof svg.setPointerCapture === 'function') {
      svg.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    if (typeof svg.focus === 'function') {
      svg.focus({ preventScroll: true });
    }
    this.activePointerId = pid;
    this.draftPoints.set([this.pointFromEvent(event, svg)]);
  }

  protected onPointerMove(event: PointerEvent): void {
    const pid = typeof event.pointerId === 'number' ? event.pointerId : 0;
    if (this.locked() || this.activePointerId !== pid) return;
    const svg = event.currentTarget as SVGSVGElement;
    event.preventDefault();
    const nextPt = this.pointFromEvent(event, svg);
    this.draftPoints.update((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.x === nextPt.x && last.y === nextPt.y) return prev;
      return [...prev, nextPt];
    });
  }

  protected onPointerUp(event: PointerEvent): void {
    const pid = typeof event.pointerId === 'number' ? event.pointerId : 0;
    if (this.activePointerId !== pid) return;
    const svg = event.currentTarget as SVGSVGElement;
    if (
      typeof event.pointerId === 'number' &&
      typeof svg.hasPointerCapture === 'function' &&
      svg.hasPointerCapture(event.pointerId) &&
      typeof svg.releasePointerCapture === 'function'
    ) {
      svg.releasePointerCapture(event.pointerId);
    }
    const completed = this.draftPoints();
    this.activePointerId = null;
    this.draftPoints.set([]);
    if (!this.locked() && completed.length > 0) {
      const stroke: EmrSignatureStroke = { points: completed };
      this.intent.emit({ type: 'strokeAdded', stroke });
      this.valueChange.emit([...this.model().strokes, stroke]);
    }
  }

  protected onPointerCancel(event: PointerEvent): void {
    const pid = typeof event.pointerId === 'number' ? event.pointerId : 0;
    if (this.activePointerId !== pid) return;
    this.cancelActiveStroke(event.currentTarget as SVGSVGElement, event.pointerId);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && (this.activePointerId !== null || this.draftPoints().length > 0)) {
      event.preventDefault();
      this.cancelActiveStroke(event.currentTarget as SVGSVGElement, this.activePointerId);
      return;
    }
    if (this.locked()) return;
    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      this.canClear() &&
      this.model().strokes.length > 0
    ) {
      event.preventDefault();
      this.emitClear();
      return;
    }
    if (
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      event.key.toLowerCase() === 'z' &&
      this.canUndo() &&
      this.model().strokes.length > 0
    ) {
      event.preventDefault();
      this.emitUndo();
    }
  }

  protected emitUndo(): void {
    if (this.locked() || this.model().strokes.length === 0) return;
    this.intent.emit({ type: 'undoRequested' });
    this.valueChange.emit(this.model().strokes.slice(0, -1));
  }

  protected emitClear(): void {
    if (this.locked() || this.model().strokes.length === 0) return;
    this.intent.emit({ type: 'clearRequested' });
    this.valueChange.emit([]);
    this.cleared.emit();
  }

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.locked()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  private cancelActiveStroke(svg: SVGSVGElement, pointerId: number | null): void {
    if (
      typeof pointerId === 'number' &&
      typeof svg.hasPointerCapture === 'function' &&
      svg.hasPointerCapture(pointerId) &&
      typeof svg.releasePointerCapture === 'function'
    ) {
      svg.releasePointerCapture(pointerId);
    }
    this.activePointerId = null;
    this.draftPoints.set([]);
  }

  private pointFromEvent(event: PointerEvent, svg: SVGSVGElement): EmrSignaturePoint {
    const geom = this.geometry();
    return mapPointerToSignaturePoint(
      event.clientX,
      event.clientY,
      svg.getBoundingClientRect(),
      geom.width,
      geom.height,
    );
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
    @let isLocked = locked();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="resolvedLabelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [readOnly]="isLocked"
      [required]="resolvedRequired()"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="resolvedStatusOptions()"
      [hint]="resolvedHint()"
      [messages]="m.messages ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div
        class="cf-stack"
        [attr.aria-labelledby]="headingId() || null"
        (focusin)="focused.emit()"
        (focusout)="blurred.emit()"
      >
        <emr-image-upload
          [controlId]="resolvedId() + '-upload'"
          [label]="resolvedLabel()"
          [labelHidden]="true"
          [items]="m.items"
          [accept]="resolvedAccept()"
          [multiple]="resolvedMultiple()"
          [maxFiles]="m.maxFiles"
          [maxSizeBytes]="m.maxSizeBytes"
          [allowCamera]="!!m.allowCamera"
          [aspectPresets]="resolvedPresets()"
          [required]="resolvedRequired()"
          [readOnly]="isLocked"
          [invalid]="hasError()"
          (filesSelected)="onFilesSelected($event)"
          (nativeFilesSelected)="onNativeFilesSelected($event)"
          (itemsChange)="onItemsChange($event)"
          (imageCropped)="onImageCropped($event)"
          (captionChange)="onCaptionChange($event)"
          (removeRequested)="onItemRemove($event)"
          (captureRequested)="onCaptureRequested($event)"
        />
      </div>
    </emr-field-frame>
  `,
  styles: [SHARED_FIELD_STYLES],
})
export class EmrImageFieldComponent {
  readonly model = input.required<ImageFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });

  readonly intent = output<ImageFieldIntent>();
  readonly nativeFilesSelected = output<readonly File[]>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-image-field-${++nextContractFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedLabelHidden = computed(
    () => this.labelHidden() || Boolean(this.model().labelHidden),
  );
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly locked = computed(() =>
    Boolean(
      this.readOnly() ||
        this.model().readOnly ||
        this.resolvedDefinition()?.contract?.readOnly,
    ),
  );
  protected readonly resolvedRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly resolvedMultiple = computed(() => {
    const explicit = this.model().multiple;
    if (explicit !== undefined) return explicit;
    const maxCard = this.resolvedDefinition()?.contract?.cardinality?.max;
    return maxCard === undefined || maxCard !== 1;
  });
  protected readonly resolvedAccept = computed(() => this.model().accept ?? 'image/*');
  protected readonly resolvedPresets = computed(() => {
    const presets = this.model().aspectPresets;
    return presets && presets.length > 0 ? presets : DEFAULT_ASPECT_PRESETS;
  });
  protected readonly resolvedStatusOptions = computed<readonly ClinicalAssessmentStatusOption[]>(
    () => this.model().statusOptions ?? [],
  );
  protected readonly hasError = computed(() => Boolean(firstErrorMessage(this.model().messages)));

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.locked()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected onFilesSelected(files: readonly EmrFileSelectionItem[]): void {
    if (this.locked()) return;
    this.intent.emit({ type: 'filesSelected', files });
  }

  protected onNativeFilesSelected(files: readonly File[]): void {
    if (this.locked()) return;
    this.nativeFilesSelected.emit(files);
  }

  protected onItemsChange(items: readonly EmrUploadedImageItem[]): void {
    if (this.locked()) return;
    this.intent.emit({ type: 'itemsChangeRequested', items });
  }

  protected onImageCropped(evt: { readonly id: string; readonly result: EmrImageCropResult }): void {
    if (this.locked()) return;
    this.intent.emit({ type: 'imageCropped', id: evt.id, result: evt.result });
  }

  protected onCaptionChange(evt: { readonly id: string; readonly caption: string }): void {
    if (this.locked()) return;
    this.intent.emit({ type: 'captionChangeRequested', id: evt.id, caption: evt.caption });
  }

  protected onItemRemove(id: string): void {
    if (this.locked()) return;
    this.intent.emit({ type: 'itemRemoveRequested', id });
  }

  protected onCaptureRequested(mode: 'camera'): void {
    if (this.locked()) return;
    this.intent.emit({ type: 'captureRequested', mode });
  }
}
