import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  viewChildren,
} from '@angular/core';
import type {
  EmrAcuityCorrection,
  EmrAcuityNotation,
  EmrFieldDefinition,
  EmrLateralityCode,
  EmrRefractionPart,
  EmrSegmentedOption,
  EmrSegmentedSize,
  EmrSelectValue,
  FieldFrameIntent,
  FieldFrameLayout,
  LateralityFieldIntent,
  LateralityFieldViewModel,
  RefractionFieldIntent,
  RefractionFieldViewModel,
  RefractionPartValidationState,
  VisualAcuityFieldIntent,
  VisualAcuityFieldViewModel,
} from '@drguptavivek/emr-controller';
import { EmrSegmentedControlComponent } from '../primitives/emr-action-controls.component';
import { EmrCheckboxComponent } from '../primitives/emr-choice.component';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrSelectComponent } from '../primitives/emr-inputs.component';
import { EmrFieldFrameComponent } from './emr-field-frame.component';
import {
  DEFAULT_LATERALITY_CONFIRMATION_LABEL,
  REFRACTION_DEFAULT_BOUNDS,
  formatRefractionPartDisplay,
  hasRefractionValue,
  normalizeFieldLayout,
  parsePairedNumberDraft,
  resolveLateralityOptions,
  resolveLateralityValidation,
  resolveRefractionEyeDescription,
  resolveRefractionPartValidation,
  resolveVisualAcuityEyeDescription,
  resolveVisualAcuityPartValidation,
  sanitizePairedNumberText,
  stepRefractionPart,
} from './emr-fields.logic';

let nextSpecialtyFieldId = 0;

const SPECIALTY_STYLES = `
  :host {
    display: block;
    min-width: 0;
  }
  .spf-stack {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .spf-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
  }
  .spf-cell {
    flex: 1 1 128px;
    min-width: 0;
    display: grid;
    gap: 4px;
  }
  .spf-sub {
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    color: var(--emr-text-muted);
  }
  .spf-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .spf-status__select {
    width: auto;
    max-width: 100%;
    min-width: 0;
  }
`;

// ─────────────────────────────────────────────────────────────
// 11. EmrLateralityFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-laterality-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrSegmentedControlComponent, EmrCheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let locked = effectiveReadOnly();
    @let vs = validation();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [unit]="resolvedUnit()"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="resolvedHint()"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div
        class="spf-stack"
        (focusin)="onGroupFocusIn()"
        (focusout)="onGroupFocusOut($event)"
      >
        <emr-segmented-control
          [controlId]="resolvedId() + '-control'"
          [ariaLabel]="resolvedLabel()"
          [ariaLabelledBy]="groupLabelledBy()"
          [ariaDescribedBy]="describedBy()"
          [options]="segmentedOptions()"
          [value]="m.value"
          [size]="resolvedSize()"
          [orientation]="resolvedOrientation()"
          [clearable]="resolvedClearable()"
          [allowDeselect]="false"
          [required]="effectiveRequired()"
          [readOnly]="locked"
          [invalid]="vs.groupHasError"
          [hasWarning]="vs.groupHasWarning"
          (valueChange)="onSelect($event)"
          (cleared)="onCleared()"
        />

        @if (m.requiresConfirmation) {
          <emr-checkbox
            [controlId]="resolvedId() + '-confirm'"
            [label]="resolvedConfirmationLabel()"
            [checked]="!!m.confirmed"
            [readOnly]="locked"
            [required]="effectiveRequired()"
            [invalid]="vs.confirmationHasError"
            [hasWarning]="vs.confirmationHasWarning"
            [ariaDescribedBy]="describedBy()"
            (checkedChange)="onConfirmToggle($event)"
          />
        }
      </div>
    </emr-field-frame>
  `,
  styles: [SPECIALTY_STYLES],
})
export class EmrLateralityFieldComponent {
  readonly model = input.required<LateralityFieldViewModel>();
  readonly definition = input<EmrFieldDefinition>();
  readonly controlId = input<string>();
  readonly headingId = input<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly layout = input<FieldFrameLayout>();
  readonly showMetadata = input(true, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly size = input<EmrSegmentedSize>();
  readonly clearable = input<boolean | undefined, unknown>(undefined, {
    transform: (v) => (v === undefined || v === null ? undefined : booleanAttribute(v)),
  });

  readonly intent = output<LateralityFieldIntent>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-laterality-${++nextSpecialtyFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  private focusInside = false;

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedUnit = computed(() => this.resolvedDefinition()?.presentation?.unitDisplay);
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly resolvedSize = computed<EmrSegmentedSize>(
    () => this.size() ?? this.model().size ?? 'md',
  );
  protected readonly resolvedClearable = computed(
    () => this.clearable() ?? this.model().clearable ?? !this.effectiveRequired(),
  );
  protected readonly resolvedOrientation = computed(
    () => this.model().orientation ?? 'horizontal',
  );
  protected readonly resolvedConfirmationLabel = computed(
    () => this.model().confirmationLabel || DEFAULT_LATERALITY_CONFIRMATION_LABEL,
  );

  protected readonly segmentedOptions = computed<readonly EmrSegmentedOption[]>(() =>
    resolveLateralityOptions(this.model()).map((opt) => ({
      value: opt.code,
      label: opt.label,
      badge: opt.shortLabel,
      description: opt.description,
      icon: opt.icon,
      ariaLabel: opt.ariaLabel,
      readOnly: opt.readOnly,
      disabled: opt.disabled,
      tone: opt.tone,
    })),
  );

  protected readonly validation = computed(() =>
    resolveLateralityValidation(this.model().messages),
  );

  protected readonly describedBy = computed(() =>
    this.resolvedHint() || (this.model().messages && this.model().messages!.length > 0)
      ? `${this.resolvedId()}-message`
      : null,
  );

  protected readonly groupLabelledBy = computed(() =>
    this.headingId() || (!this.labelHidden() && this.resolvedLabel() ? `${this.resolvedId()}-label` : null),
  );

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

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected onSelect(code: string | null): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({
      type: 'lateralitySelected',
      code: (code as EmrLateralityCode | null) ?? null,
    });
  }

  protected onCleared(): void {
    if (this.effectiveReadOnly()) return;
    this.cleared.emit();
  }

  protected onConfirmToggle(confirmed: boolean): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'confirmationChangeRequested', confirmed });
  }
}

// ─────────────────────────────────────────────────────────────
// 12. EmrVisualAcuityFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-visual-acuity-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrSegmentedControlComponent, EmrSelectComponent, EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let locked = effectiveReadOnly();
    @let pv = partValidation();
    <emr-field-frame
      [label]="resolvedLabel()"
      [controlId]="resolvedId()"
      [labelHidden]="labelHidden()"
      [labelNamesControl]="false"
      [layout]="resolvedLayout()"
      [showMetadata]="resolvedShowMetadata()"
      [unit]="resolvedUnit()"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="resolvedHint()"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div
        class="spf-stack"
        role="group"
        [attr.aria-labelledby]="groupLabelledBy()"
        [attr.aria-label]="resolvedLabel()"
        [attr.aria-describedby]="describedBy()"
        (focusin)="onGroupFocusIn()"
        (focusout)="onGroupFocusOut($event)"
      >
        @if (m.eye || m.derivedDisplay) {
          <div class="va-context">
            @if (m.eye) {
              <emr-badge
                tone="info"
                icon="eye"
                [label]="m.eye"
                [assistiveText]="eyeDescription()"
              />
            }
            @if (m.derivedDisplay) {
              <emr-badge
                class="va-tabular"
                [tone]="m.derivedTone ?? 'neutral'"
                [label]="m.derivedDisplay"
                [assistiveText]="derivedAssistiveText()"
              />
            }
          </div>
        }

        @if (m.notationOptions.length > 0 || m.correctionOptions.length > 0) {
          <div class="va-modifiers">
            @if (m.notationOptions.length > 0) {
              <div class="va-modifier">
                <span class="va-sub" [id]="resolvedId() + '-notation-label'">{{ notationLabel() }}</span>
                <emr-segmented-control
                  [controlId]="resolvedId() + '-notation'"
                  [ariaLabel]="resolvedLabel() + ' ' + notationLabel()"
                  [ariaLabelledBy]="resolvedId() + '-notation-label'"
                  [ariaDescribedBy]="describedBy()"
                  [options]="m.notationOptions"
                  [value]="m.notation"
                  [size]="resolvedSize()"
                  [allowDeselect]="false"
                  [readOnly]="locked"
                  [invalid]="pv.notationHasError"
                  [hasWarning]="pv.notationHasWarning"
                  (valueChange)="onNotationChange($event)"
                />
              </div>
            }

            @if (m.correctionOptions.length > 0) {
              <div class="va-modifier">
                <span class="va-sub" [id]="resolvedId() + '-correction-label'">{{ correctionLabel() }}</span>
                <emr-segmented-control
                  [controlId]="resolvedId() + '-correction'"
                  [ariaLabel]="resolvedLabel() + ' ' + correctionLabel()"
                  [ariaLabelledBy]="resolvedId() + '-correction-label'"
                  [ariaDescribedBy]="describedBy()"
                  [options]="m.correctionOptions"
                  [value]="m.correction"
                  [size]="resolvedSize()"
                  [allowDeselect]="false"
                  [readOnly]="locked"
                  [invalid]="pv.correctionHasError"
                  [hasWarning]="pv.correctionHasWarning"
                  (valueChange)="onCorrectionChange($event)"
                />
              </div>
            }
          </div>
        }

        <div class="va-grid" [class.va-grid--paired]="!!m.showPinhole">
          <div class="va-cell">
            <label class="va-sub" [for]="resolvedId() + '-value'">
              {{ valueLabel() }}
              @if (effectiveRequired()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </label>
            <emr-select
              [controlId]="resolvedId() + '-value'"
              [label]="resolvedLabel() + ' ' + valueLabel()"
              [labelHidden]="true"
              [options]="m.valueOptions"
              [value]="m.value"
              [placeholder]="valuePlaceholder()"
              [size]="resolvedSize()"
              [clearable]="resolvedClearable()"
              [clearLabel]="clearLabel()"
              [required]="effectiveRequired()"
              [readOnly]="locked"
              [invalid]="pv.valueHasError"
              [hasWarning]="pv.valueHasWarning"
              [ariaDescribedBy]="describedBy()"
              [tabularNums]="true"
              (valueChange)="onValueChange($event)"
            />
          </div>

          @if (m.showPinhole) {
            <div class="va-cell">
              <label class="va-sub" [for]="resolvedId() + '-pinhole'">
                {{ pinholeLabel() }}
                @if (m.pinholeRequired) {
                  <span class="emr-field__required" aria-hidden="true">*</span>
                }
              </label>
              <emr-select
                [controlId]="resolvedId() + '-pinhole'"
                [label]="resolvedLabel() + ' ' + pinholeLabel()"
                [labelHidden]="true"
                [options]="pinholeOptions()"
                [value]="m.pinholeValue ?? null"
                [placeholder]="pinholePlaceholder()"
                [size]="resolvedSize()"
                [clearable]="resolvedClearable()"
                [clearLabel]="clearLabel()"
                [required]="!!m.pinholeRequired"
                [readOnly]="locked"
                [invalid]="pv.pinholeHasError"
                [hasWarning]="pv.pinholeHasWarning"
                [ariaDescribedBy]="describedBy()"
                [tabularNums]="true"
                (valueChange)="onPinholeChange($event)"
              />
            </div>
          }
        </div>
      </div>
    </emr-field-frame>
  `,
  styles: [
    SPECIALTY_STYLES,
    `
      .va-context {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
      }
      .va-modifiers {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 10px 16px;
        min-width: 0;
      }
      .va-modifier {
        display: grid;
        gap: 4px;
        flex: 1 1 220px;
        min-width: 0;
        max-width: 100%;
      }
      .va-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
        min-width: 0;
      }
      .va-grid--paired {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 640px) {
        .va-grid--paired {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .va-cell {
        display: grid;
        gap: 4px;
        min-width: 0;
      }
      .va-sub {
        font-size: var(--emr-text-sm);
        font-weight: var(--emr-weight-medium);
        color: var(--emr-text-muted);
      }
      .va-tabular {
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class EmrVisualAcuityFieldComponent {
  readonly model = input.required<VisualAcuityFieldViewModel>();
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

  readonly intent = output<VisualAcuityFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-visual-acuity-${++nextSpecialtyFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  private focusInside = false;

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || '',
  );
  protected readonly resolvedUnit = computed(() => this.resolvedDefinition()?.presentation?.unitDisplay);
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly resolvedSize = computed<'sm' | 'md' | 'lg'>(
    () => this.size() ?? this.model().size ?? 'md',
  );
  protected readonly resolvedClearable = computed(
    () => this.clearable() ?? this.model().clearable ?? true,
  );

  protected readonly partValidation = computed(() =>
    resolveVisualAcuityPartValidation(this.model().messages),
  );

  protected readonly describedBy = computed(() => {
    const m = this.model();
    return this.resolvedHint() || (m.messages && m.messages.length > 0)
      ? `${this.resolvedId()}-message`
      : null;
  });

  protected readonly groupLabelledBy = computed(() =>
    this.headingId() || (!this.labelHidden() && this.resolvedLabel() ? `${this.resolvedId()}-label` : null),
  );

  protected readonly eyeDescription = computed(() => {
    const eye = this.model().eye;
    return eye ? resolveVisualAcuityEyeDescription(eye, this.model().labels) : '';
  });

  protected readonly derivedAssistiveText = computed(() => {
    const m = this.model();
    if (!m.derivedDisplay) return '';
    const prefix = m.labels?.derivedLabel ?? 'Equivalent';
    return `${prefix}: ${m.derivedDisplay}`;
  });

  protected readonly notationLabel = computed(() => this.model().labels?.notationLabel ?? 'Notation');
  protected readonly correctionLabel = computed(() => this.model().labels?.correctionLabel ?? 'Correction');
  protected readonly valueLabel = computed(() => this.model().labels?.valueLabel ?? 'Acuity');
  protected readonly pinholeLabel = computed(() => this.model().labels?.pinholeLabel ?? 'Pinhole (PH)');
  protected readonly valuePlaceholder = computed(() => this.model().valuePlaceholder ?? 'Select acuity');
  protected readonly pinholePlaceholder = computed(() => this.model().pinholePlaceholder ?? 'Not tested');
  protected readonly clearLabel = computed(() => this.model().labels?.clearLabel ?? 'Clear');
  protected readonly pinholeOptions = computed(
    () => this.model().pinholeOptions ?? this.model().valueOptions,
  );

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

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected onNotationChange(notation: string | null): void {
    if (this.effectiveReadOnly() || !notation) return;
    this.intent.emit({ type: 'notationChangeRequested', notation: notation as EmrAcuityNotation });
  }

  protected onCorrectionChange(correction: string | null): void {
    if (this.effectiveReadOnly() || !correction) return;
    this.intent.emit({ type: 'correctionChangeRequested', correction: correction as EmrAcuityCorrection });
  }

  protected onValueChange(raw: EmrSelectValue): void {
    if (this.effectiveReadOnly()) return;
    const value = typeof raw === 'string' && raw !== '' ? raw : null;
    this.intent.emit({ type: 'valueChangeRequested', value });
  }

  protected onPinholeChange(raw: EmrSelectValue): void {
    if (this.effectiveReadOnly()) return;
    const value = typeof raw === 'string' && raw !== '' ? raw : null;
    this.intent.emit({ type: 'pinholeChangeRequested', value });
  }
}

// ─────────────────────────────────────────────────────────────
// 13. EmrRefractionFieldComponent
// ─────────────────────────────────────────────────────────────
interface RefractionPartRenderItem {
  readonly key: EmrRefractionPart;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly precision: number;
  readonly numericValue: number | null;
  readonly domValue: string;
  readonly canDecrement: boolean;
  readonly canIncrement: boolean;
  readonly validation: RefractionPartValidationState;
}

@Component({
  selector: 'emr-refraction-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrBadgeComponent],
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
      [unit]="resolvedUnit()"
      [required]="effectiveRequired()"
      [readOnly]="locked"
      [hint]="resolvedHint()"
      [messages]="m.messages ?? []"
      [assessmentStatus]="m.status"
      [assessmentStatusOptions]="m.statusOptions ?? []"
      (intent)="onFrameIntent($event)"
    >
      <div
        class="spf-stack"
        role="group"
        [attr.aria-labelledby]="groupLabelledBy()"
        [attr.aria-label]="groupAriaLabel()"
        [attr.aria-required]="effectiveRequired() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (focusin)="onGroupFocusIn()"
        (focusout)="onGroupFocusOut($event)"
      >
        @if (m.eye || m.formattedSummary || showClearButton()) {
          <div class="ref-header" [class.ref-header--lg]="resolvedSize() === 'lg'">
            @if (m.eye) {
              <emr-badge
                tone="info"
                icon="eye"
                [label]="m.eye"
                [assistiveText]="eyeDescription()"
              />
            }
            @if (m.formattedSummary) {
              <emr-badge
                class="ref-tabular"
                tone="neutral"
                [label]="m.formattedSummary"
                [assistiveText]="'Summary: ' + m.formattedSummary"
              />
            }
            @if (showClearButton()) {
              <button
                type="button"
                class="ref-clear"
                data-emr-print="hide"
                [attr.aria-label]="'Clear ' + resolvedLabel()"
                (click)="onClear()"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            }
          </div>
        }

        <div class="ref-grid" [class.ref-grid--lg]="resolvedSize() === 'lg'">
          @for (part of visibleParts(); track part.key) {
            <div class="ref-cell">
              <label class="ref-sub" [for]="resolvedId() + '-' + part.key">
                {{ part.label }}
              </label>
              <div
                class="emr-input-affix ref-affix"
                [attr.data-invalid]="part.validation.hasError ? 'true' : null"
                [attr.data-warning]="!part.validation.hasError && part.validation.hasWarning ? 'true' : null"
                [attr.data-readonly]="locked ? 'true' : null"
              >
                <button
                  type="button"
                  class="emr-input-affix__btn emr-input-affix__btn--leading"
                  data-emr-print="hide"
                  [disabled]="locked || !part.canDecrement"
                  [attr.aria-label]="'Decrease ' + part.label"
                  (click)="stepPart(part.key, -1)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <input
                  #partEl
                  [attr.data-part]="part.key"
                  class="emr-input-affix__field emr-input-affix__field--centered ref-input"
                  [id]="resolvedId() + '-' + part.key"
                  type="text"
                  role="spinbutton"
                  [attr.inputmode]="part.precision === 0 ? 'numeric' : 'decimal'"
                  [value]="part.domValue"
                  [attr.aria-valuemin]="part.min"
                  [attr.aria-valuemax]="part.max"
                  [attr.aria-valuenow]="part.numericValue"
                  [required]="effectiveRequired()"
                  [readOnly]="locked"
                  [attr.aria-required]="effectiveRequired() ? 'true' : null"
                  [attr.aria-readonly]="locked ? 'true' : null"
                  [attr.aria-invalid]="part.validation.hasError ? 'true' : null"
                  [attr.data-warning]="!part.validation.hasError && part.validation.hasWarning ? 'true' : null"
                  [attr.aria-describedby]="describedBy()"
                  (wheel)="onWheel($event)"
                  (keydown)="onPartKeydown(part.key, $event)"
                  (input)="onPartInput(part.key, $event)"
                  (focus)="onPartFocus(part.key)"
                  (blur)="onPartBlur(part.key)"
                />
                <span class="emr-input-affix__unit ref-unit" aria-hidden="true">{{ part.unit }}</span>
                <button
                  type="button"
                  class="emr-input-affix__btn"
                  data-emr-print="hide"
                  [disabled]="locked || !part.canIncrement"
                  [attr.aria-label]="'Increase ' + part.label"
                  (click)="stepPart(part.key, 1)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </emr-field-frame>
  `,
  styles: [
    SPECIALTY_STYLES,
    `
      .ref-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .ref-tabular {
        font-variant-numeric: tabular-nums;
      }
      .ref-clear {
        margin-inline-start: auto;
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
      .ref-clear:hover {
        border-color: var(--emr-focus);
        color: var(--emr-text);
        background: var(--emr-surface-soft);
      }
      .ref-clear:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--emr-focus) 70%, transparent);
        outline-offset: 2px;
      }
      .ref-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(196px, 1fr));
        gap: 10px;
        min-width: 0;
      }
      .ref-cell {
        display: grid;
        gap: 4px;
        min-width: 0;
      }
      .ref-sub {
        font-size: var(--emr-text-xs);
        font-weight: var(--emr-weight-semibold);
        color: var(--emr-text-muted);
      }
      .ref-affix {
        width: 100%;
        min-width: 0;
        transition: border-color 120ms ease;
      }
      .ref-affix:hover:not([data-readonly="true"]):not([data-invalid="true"]):not([data-warning="true"]) {
        border-color: var(--emr-border-strong, var(--emr-focus));
      }
      .ref-input {
        font-size: var(--emr-text-md);
        font-variant-numeric: tabular-nums;
        padding-inline: 6px;
      }
      .ref-unit {
        padding: 0 7px;
        flex: 0 0 auto;
        white-space: nowrap;
      }
      .ref-grid--lg .emr-input-affix,
      .ref-grid--lg .emr-input-affix__btn {
        min-height: 48px;
        height: 48px;
      }
      .ref-grid--lg .emr-input-affix__btn {
        min-width: 48px;
      }
      .ref-header--lg .ref-clear {
        min-width: 48px;
        min-height: 48px;
        width: 48px;
        height: 48px;
      }
      :host-context(.emr-print) .ref-unit {
        background: transparent;
      }
    `,
  ],
})
export class EmrRefractionFieldComponent implements AfterViewChecked {
  readonly model = input.required<RefractionFieldViewModel>();
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

  readonly intent = output<RefractionFieldIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-refraction-${++nextSpecialtyFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  private focusInside = false;
  private draftingPart: EmrRefractionPart | null = null;
  private needsDomSync = false;

  private readonly partRefs = viewChildren<ElementRef<HTMLInputElement>>('partEl');

  protected readonly resolvedDefinition = computed(() => this.definition() ?? this.model().definition);
  protected readonly resolvedLabel = computed(
    () => this.model().label || this.resolvedDefinition()?.presentation?.label || 'Refraction',
  );
  protected readonly resolvedUnit = computed(() => this.resolvedDefinition()?.presentation?.unitDisplay);
  protected readonly resolvedHint = computed(
    () => this.model().hint ?? this.resolvedDefinition()?.presentation?.hint,
  );
  protected readonly resolvedLayout = computed<FieldFrameLayout>(() =>
    normalizeFieldLayout(this.layout() ?? this.model().layout),
  );
  protected readonly resolvedShowMetadata = computed(
    () => this.showMetadata() && this.model().showMetadata !== false,
  );
  protected readonly effectiveReadOnly = computed(() =>
    Boolean(this.readOnly() || this.model().readOnly || this.resolvedDefinition()?.contract?.readOnly),
  );
  protected readonly effectiveRequired = computed(() => {
    const min = this.resolvedDefinition()?.contract?.cardinality?.min;
    return Boolean(this.model().required || (min !== undefined && min >= 1));
  });
  protected readonly resolvedSize = computed<'sm' | 'md' | 'lg'>(
    () => this.size() ?? this.model().size ?? 'md',
  );
  protected readonly resolvedClearable = computed(
    () => this.clearable() ?? this.model().clearable ?? false,
  );
  protected readonly showClearButton = computed(
    () =>
      this.resolvedClearable() &&
      !this.effectiveReadOnly() &&
      hasRefractionValue(this.model().value, this.model().showNearAdd),
  );

  protected readonly eyeDescription = computed(() => {
    const eye = this.model().eye;
    return eye ? resolveRefractionEyeDescription(eye) : '';
  });

  protected readonly describedBy = computed(() => {
    const m = this.model();
    return this.resolvedHint() || (m.messages && m.messages.length > 0)
      ? `${this.resolvedId()}-message`
      : null;
  });

  protected readonly groupLabelledBy = computed(() =>
    this.headingId() || (!this.labelHidden() && this.resolvedLabel() ? `${this.resolvedId()}-label` : null),
  );

  protected readonly groupAriaLabel = computed(() => {
    const eye = this.model().eye;
    const lbl = this.resolvedLabel();
    return eye ? `${lbl} (${eye})` : lbl;
  });

  protected readonly visibleParts = computed<readonly RefractionPartRenderItem[]>(() => {
    const m = this.model();
    const keys: readonly EmrRefractionPart[] = m.showNearAdd
      ? ['sphere', 'cylinder', 'axis', 'nearAdd']
      : ['sphere', 'cylinder', 'axis'];

    return keys.map((key) => {
      const cfg = REFRACTION_DEFAULT_BOUNDS[key];
      const raw =
        key === 'sphere'
          ? m.value.sphere
          : key === 'cylinder'
            ? m.value.cylinder
            : key === 'axis'
              ? m.value.axis
              : (m.value.nearAdd ?? null);
      const min =
        key === 'sphere'
          ? (m.sphereMin ?? cfg.min)
          : key === 'cylinder'
            ? (m.cylinderMin ?? cfg.min)
            : key === 'axis'
              ? (m.axisMin ?? cfg.min)
              : (m.nearAddMin ?? cfg.min);
      const max =
        key === 'sphere'
          ? (m.sphereMax ?? cfg.max)
          : key === 'cylinder'
            ? (m.cylinderMax ?? cfg.max)
            : key === 'axis'
              ? (m.axisMax ?? cfg.max)
              : (m.nearAddMax ?? cfg.max);
      const step =
        key === 'sphere'
          ? (m.sphereStep ?? cfg.step)
          : key === 'cylinder'
            ? (m.cylinderStep ?? cfg.step)
            : key === 'axis'
              ? (m.axisStep ?? cfg.step)
              : (m.nearAddStep ?? cfg.step);
      const numericValue = typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
      return {
        key,
        label: cfg.label,
        unit: cfg.unit,
        min,
        max,
        step,
        precision: cfg.precision,
        numericValue,
        domValue: formatRefractionPartDisplay(numericValue, cfg.precision),
        canDecrement: numericValue === null || numericValue - step >= min - 1e-9,
        canIncrement: numericValue === null || numericValue + step <= max + 1e-9,
        validation: resolveRefractionPartValidation(m.messages, key),
      };
    });
  });

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

  protected onFrameIntent(ev: FieldFrameIntent): void {
    if (this.effectiveReadOnly()) return;
    if (ev.type === 'statusChangeRequested') {
      this.intent.emit({ type: 'statusChangeRequested', status: ev.status });
    }
  }

  protected onWheel(event: WheelEvent): void {
    (event.currentTarget as HTMLInputElement).blur();
  }

  protected stepPart(part: EmrRefractionPart, delta: -1 | 1): void {
    if (this.effectiveReadOnly()) return;
    const meta = this.visibleParts().find((p) => p.key === part);
    if (!meta) return;
    const next = stepRefractionPart({
      current: meta.numericValue,
      delta,
      part,
      step: meta.step,
      min: meta.min,
      max: meta.max,
    });
    this.draftingPart = null;
    this.scheduleSync();
    this.emitPartIntent(part, next);
  }

  protected onPartKeydown(part: EmrRefractionPart, event: KeyboardEvent): void {
    if (this.effectiveReadOnly()) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.stepPart(part, 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepPart(part, -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.draftingPart === part) this.draftingPart = null;
      this.syncPartDom(part);
    }
  }

  protected onPartInput(part: EmrRefractionPart, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.effectiveReadOnly()) {
      this.syncPartDom(part);
      return;
    }
    const mode: 'decimal' | 'integer' = part === 'axis' ? 'integer' : 'decimal';
    const clean = sanitizePairedNumberText(target.value, mode);
    if (target.value !== clean) {
      target.value = clean;
    }
    const parsed = parsePairedNumberDraft(clean, mode);
    this.draftingPart = part;
    if (!parsed.complete) return;
    this.emitPartIntent(part, parsed.value);
  }

  protected onPartFocus(_part: EmrRefractionPart): void {
    // Focus output is emitted by the group wrapper (`onGroupFocusIn`).
  }

  protected onPartBlur(part: EmrRefractionPart): void {
    if (this.draftingPart === part) {
      this.draftingPart = null;
    }
    this.syncPartDom(part);
  }

  protected onClear(): void {
    if (this.effectiveReadOnly()) return;
    this.draftingPart = null;
    this.scheduleSync();
    this.intent.emit({ type: 'clearRequested' });
  }

  private emitPartIntent(part: EmrRefractionPart, val: number | null): void {
    if (part === 'sphere') this.intent.emit({ type: 'sphereChangeRequested', sphere: val });
    else if (part === 'cylinder') this.intent.emit({ type: 'cylinderChangeRequested', cylinder: val });
    else if (part === 'axis') this.intent.emit({ type: 'axisChangeRequested', axis: val });
    else this.intent.emit({ type: 'nearAddChangeRequested', nearAdd: val });
  }

  private syncPartDom(part: EmrRefractionPart): void {
    const el = this.partRefs().find((r) => r.nativeElement.dataset['part'] === part)?.nativeElement;
    const meta = this.visibleParts().find((p) => p.key === part);
    if (!el || !meta) return;
    if (el.value !== meta.domValue) {
      el.value = meta.domValue;
    }
  }

  private syncDom(): void {
    for (const meta of this.visibleParts()) {
      if (this.draftingPart === meta.key) continue;
      this.syncPartDom(meta.key);
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
