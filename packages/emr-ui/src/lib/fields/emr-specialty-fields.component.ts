import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import type {
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  EmrAcuityCorrection,
  EmrAcuityNotation,
  EmrLateralityCode,
  EmrSegmentedOption,
  LateralityFieldIntent,
  LateralityFieldViewModel,
  RefractionFieldIntent,
  RefractionFieldViewModel,
  VisualAcuityFieldIntent,
  VisualAcuityFieldViewModel,
} from '@drguptavivek/emr-controller';
import { EmrSegmentedControlComponent } from '../primitives/emr-action-controls.component';
import { EmrCheckboxComponent } from '../primitives/emr-choice.component';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import { EmrNumericStepperComponent } from '../primitives/emr-specialized-inputs.component';
import { EmrFieldFrameComponent } from './emr-field-frame.component';

let nextSpecialtyFieldId = 0;

function statusLabelFor(
  status: ClinicalAssessmentStatus | undefined,
  options?: readonly ClinicalAssessmentStatusOption[],
): string {
  if (!status) return '';
  return options?.find((o) => o.value === status)?.label ?? status.replaceAll('-', ' ');
}

function statusToneFor(
  status: ClinicalAssessmentStatus | undefined,
  options?: readonly ClinicalAssessmentStatusOption[],
): string {
  const tone = options?.find((o) => o.value === status)?.tone;
  return tone ? `emr-tone-${tone}` : 'emr-tone-neutral';
}

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
    <emr-field-frame
      [label]="m.label"
      [controlId]="resolvedId()"
      [required]="!!m.required"
      [hint]="m.hint"
      [messages]="m.messages ?? []"
    >
      <div class="spf-stack">
        <div class="spf-row">
          <emr-segmented-control
            [controlId]="resolvedId()"
            [label]="m.label"
            [labelHidden]="true"
            [options]="segmentedOptions()"
            [value]="m.value"
            [readOnly]="!!m.readOnly"
            [error]="errorText()"
            (valueChange)="onSelect($event)"
          />
          @if (!m.readOnly && !m.required && m.value !== null) {
            <button
              type="button"
              class="emr-button emr-button--ghost emr-button--small"
              (click)="intent.emit({ type: 'lateralitySelected', code: null })"
            >
              Clear
            </button>
          }
        </div>

        @if (m.requiresConfirmation) {
          <emr-checkbox
            [controlId]="resolvedId() + '-confirm'"
            [label]="m.confirmationLabel ?? 'Surgical site and laterality verified'"
            [checked]="!!m.confirmed"
            [readOnly]="!!m.readOnly"
            [required]="!!m.required"
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
  readonly controlId = input<string>();
  readonly intent = output<LateralityFieldIntent>();

  private readonly fallbackId = `emr-laterality-${++nextSpecialtyFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly segmentedOptions = computed<readonly EmrSegmentedOption[]>(() =>
    this.model().options.map((opt) => ({
      value: opt.code,
      label: opt.label,
      badge: opt.shortLabel,
    })),
  );

  protected readonly errorText = computed(
    () => this.model().messages?.find((m) => m.severity === 'error')?.message ?? '',
  );

  protected onSelect(code: string | null): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'lateralitySelected',
      code: (code as EmrLateralityCode | null) ?? null,
    });
  }

  protected onConfirmToggle(confirmed: boolean): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'confirmationChangeRequested', confirmed });
  }
}

// ─────────────────────────────────────────────────────────────
// 12. EmrVisualAcuityFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-visual-acuity-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrBadgeComponent],
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
      <div class="spf-stack" role="group" [attr.aria-label]="m.label">
        <div class="spf-row">
          @if (m.eye) {
            <emr-badge tone="info">{{ m.eye }}</emr-badge>
          }

          <div class="spf-cell">
            <label class="spf-sub" [for]="resolvedId() + '-notation'">Notation</label>
            <select
              #notationSelect
              class="emr-select"
              [id]="resolvedId() + '-notation'"
              [attr.aria-readonly]="m.readOnly || null"
              [value]="m.notation"
              (change)="onNotationChange($event)"
              (blur)="syncDom()"
            >
              @for (opt of m.notationOptions; track opt.value) {
                <option [value]="opt.value" [selected]="opt.value === m.notation">
                  {{ opt.label }}
                </option>
              }
            </select>
          </div>

          <div class="spf-cell">
            <label class="spf-sub" [for]="resolvedId() + '-correction'">Correction</label>
            <select
              #correctionSelect
              class="emr-select"
              [id]="resolvedId() + '-correction'"
              [attr.aria-readonly]="m.readOnly || null"
              [value]="m.correction"
              (change)="onCorrectionChange($event)"
              (blur)="syncDom()"
            >
              @for (opt of m.correctionOptions; track opt.value) {
                <option [value]="opt.value" [selected]="opt.value === m.correction">
                  {{ opt.label }}
                </option>
              }
            </select>
          </div>

          <div class="spf-cell">
            <label class="spf-sub" [for]="resolvedId()">Acuity</label>
            <select
              #valueSelect
              class="emr-select"
              [id]="resolvedId()"
              [attr.aria-readonly]="m.readOnly || null"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              [value]="m.value ?? ''"
              (change)="onValueChange($event)"
              (blur)="syncDom()"
            >
              <option value="" [selected]="!m.value">Select acuity</option>
              @for (opt of m.valueOptions; track opt.value) {
                <option
                  [value]="opt.value"
                  [selected]="opt.value === m.value"
                  [disabled]="opt.disabled"
                >
                  {{ opt.label }}
                </option>
              }
            </select>
          </div>

          @if (m.showPinhole) {
            <div class="spf-cell">
              <label class="spf-sub" [for]="resolvedId() + '-pinhole'">Pinhole (PH)</label>
              <select
                #pinholeSelect
                class="emr-select"
                [id]="resolvedId() + '-pinhole'"
                [attr.aria-readonly]="m.readOnly || null"
                [value]="m.pinholeValue ?? ''"
                (change)="onPinholeChange($event)"
                (blur)="syncDom()"
              >
                <option value="" [selected]="!m.pinholeValue">Not tested</option>
                @for (opt of m.valueOptions; track opt.value) {
                  <option
                    [value]="opt.value"
                    [selected]="opt.value === m.pinholeValue"
                    [disabled]="opt.disabled"
                  >
                    {{ opt.label }}
                  </option>
                }
              </select>
            </div>
          }

          @if (m.derivedDisplay) {
            <emr-badge tone="neutral">{{ m.derivedDisplay }}</emr-badge>
          }
        </div>

        @if (m.status || (m.statusOptions?.length && !m.readOnly)) {
          <div class="spf-status">
            @if (m.status) {
              <span [class]="'emr-badge ' + statusTone()" role="status">{{ statusText() }}</span>
            }
            @if (m.statusOptions?.length && !m.readOnly) {
              <select
                #statusSelect
                class="emr-select spf-status__select"
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
  styles: [SPECIALTY_STYLES],
})
export class EmrVisualAcuityFieldComponent implements AfterViewChecked {
  readonly model = input.required<VisualAcuityFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<VisualAcuityFieldIntent>();

  private readonly fallbackId = `emr-visual-acuity-${++nextSpecialtyFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly hasError = computed(() =>
    Boolean(this.model().messages?.some((m) => m.severity === 'error')),
  );
  protected readonly describedBy = computed(() => {
    const m = this.model();
    return m.hint || (m.messages && m.messages.length > 0)
      ? `${this.resolvedId()}-message`
      : null;
  });
  protected readonly statusText = computed(() =>
    statusLabelFor(this.model().status, this.model().statusOptions),
  );
  protected readonly statusTone = computed(() =>
    statusToneFor(this.model().status, this.model().statusOptions),
  );

  private readonly notationRef = viewChild<ElementRef<HTMLSelectElement>>('notationSelect');
  private readonly correctionRef = viewChild<ElementRef<HTMLSelectElement>>('correctionSelect');
  private readonly valueRef = viewChild<ElementRef<HTMLSelectElement>>('valueSelect');
  private readonly pinholeRef = viewChild<ElementRef<HTMLSelectElement>>('pinholeSelect');
  private readonly statusRef = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onNotationChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const notation = (event.target as HTMLSelectElement).value as EmrAcuityNotation;
    this.scheduleSync();
    this.intent.emit({ type: 'notationChangeRequested', notation });
  }

  protected onCorrectionChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const correction = (event.target as HTMLSelectElement).value as EmrAcuityCorrection;
    this.scheduleSync();
    this.intent.emit({ type: 'correctionChangeRequested', correction });
  }

  protected onValueChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const raw = (event.target as HTMLSelectElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'valueChangeRequested', value: raw === '' ? null : raw });
  }

  protected onPinholeChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncDom();
      return;
    }
    const raw = (event.target as HTMLSelectElement).value;
    this.scheduleSync();
    this.intent.emit({ type: 'pinholeChangeRequested', value: raw === '' ? null : raw });
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
    const m = this.model();
    const sync = (el: HTMLSelectElement | undefined, expected: string): void => {
      if (el && el.value !== expected) el.value = expected;
    };
    sync(this.notationRef()?.nativeElement, m.notation);
    sync(this.correctionRef()?.nativeElement, m.correction);
    sync(this.valueRef()?.nativeElement, m.value ?? '');
    sync(this.pinholeRef()?.nativeElement, m.pinholeValue ?? '');
    sync(this.statusRef()?.nativeElement, m.status ?? '');
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
// 13. EmrRefractionFieldComponent
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'emr-refraction-field',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrNumericStepperComponent, EmrBadgeComponent],
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
      <div class="spf-stack" role="group" [attr.aria-label]="m.label">
        <div class="spf-row">
          @if (m.eye) {
            <emr-badge tone="info">{{ m.eye }}</emr-badge>
          }
          @if (m.formattedSummary) {
            <emr-badge tone="neutral">{{ m.formattedSummary }}</emr-badge>
          }
        </div>

        <div class="ref-grid">
          <emr-numeric-stepper
            [controlId]="resolvedId()"
            label="Sphere (SPH)"
            [value]="m.value.sphere"
            [min]="-30"
            [max]="30"
            [step]="m.sphereStep ?? 0.25"
            [precision]="2"
            unit="D"
            [readOnly]="!!m.readOnly"
            (valueChange)="onSphereChange($event)"
          />

          <emr-numeric-stepper
            [controlId]="resolvedId() + '-cyl'"
            label="Cylinder (CYL)"
            [value]="m.value.cylinder"
            [min]="-15"
            [max]="15"
            [step]="m.cylinderStep ?? 0.25"
            [precision]="2"
            unit="D"
            [readOnly]="!!m.readOnly"
            (valueChange)="onCylinderChange($event)"
          />

          <emr-numeric-stepper
            [controlId]="resolvedId() + '-axis'"
            label="Axis"
            [value]="m.value.axis"
            [min]="1"
            [max]="180"
            [step]="1"
            [precision]="0"
            unit="°"
            [readOnly]="!!m.readOnly"
            (valueChange)="onAxisChange($event)"
          />

          @if (m.showNearAdd) {
            <emr-numeric-stepper
              [controlId]="resolvedId() + '-add'"
              label="Near Add"
              [value]="m.value.nearAdd ?? null"
              [min]="0"
              [max]="6"
              [step]="0.25"
              [precision]="2"
              unit="D"
              [readOnly]="!!m.readOnly"
              (valueChange)="onNearAddChange($event)"
            />
          }
        </div>

        @if (m.status || (m.statusOptions?.length && !m.readOnly)) {
          <div class="spf-status">
            @if (m.status) {
              <span [class]="'emr-badge ' + statusTone()" role="status">{{ statusText() }}</span>
            }
            @if (m.statusOptions?.length && !m.readOnly) {
              <select
                #statusSelect
                class="emr-select spf-status__select"
                [attr.aria-label]="m.label + ' assessment status'"
                [value]="m.status ?? ''"
                (change)="onStatusChange($event)"
                (blur)="syncStatus()"
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
    SPECIALTY_STYLES,
    `
      .ref-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(156px, 1fr));
        gap: 10px;
      }
    `,
  ],
})
export class EmrRefractionFieldComponent implements AfterViewChecked {
  readonly model = input.required<RefractionFieldViewModel>();
  readonly controlId = input<string>();
  readonly intent = output<RefractionFieldIntent>();

  private readonly fallbackId = `emr-refraction-${++nextSpecialtyFieldId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly statusText = computed(() =>
    statusLabelFor(this.model().status, this.model().statusOptions),
  );
  protected readonly statusTone = computed(() =>
    statusToneFor(this.model().status, this.model().statusOptions),
  );

  private readonly statusRef = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');
  private needsStatusSync = false;

  ngAfterViewChecked(): void {
    if (this.needsStatusSync) {
      this.needsStatusSync = false;
      this.syncStatus();
    }
  }

  protected onSphereChange(sphere: number | null): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'sphereChangeRequested', sphere });
  }

  protected onCylinderChange(cylinder: number | null): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'cylinderChangeRequested', cylinder });
  }

  protected onAxisChange(axis: number | null): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'axisChangeRequested', axis });
  }

  protected onNearAddChange(nearAdd: number | null): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'nearAddChangeRequested', nearAdd });
  }

  protected onStatusChange(event: Event): void {
    if (this.model().readOnly) {
      this.syncStatus();
      return;
    }
    const raw = (event.target as HTMLSelectElement).value as ClinicalAssessmentStatus | '';
    this.needsStatusSync = true;
    queueMicrotask(() => {
      if (this.needsStatusSync) {
        this.needsStatusSync = false;
        this.syncStatus();
      }
    });
    this.intent.emit({ type: 'statusChangeRequested', status: raw ? raw : undefined });
  }

  protected syncStatus(): void {
    const el = this.statusRef()?.nativeElement;
    if (!el) return;
    const expected = this.model().status ?? '';
    if (el.value !== expected) el.value = expected;
  }
}
