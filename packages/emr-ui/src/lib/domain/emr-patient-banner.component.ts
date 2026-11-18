import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type {
  EmrBadge,
  PatientAlert,
  PatientBannerIntent,
  PatientBannerViewModel,
  PatientVitalSparkline,
} from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroChevronDown, heroChevronUp } from '@ng-icons/heroicons/outline';

/** English fallbacks for built-in strings. Every key is overridable via the component's `labels` input. */
export const BANNER_DEFAULTS = {
  currentPatient: 'Current patient',
  patientStatus: 'Patient status',
  safetyAlerts: 'Safety alerts',
  weight: 'Weight',
  showDetails: 'Show patient details',
  hideDetails: 'Hide patient details',
  currentEncounter: 'Current encounter',
  admitted: 'Admitted',
  admittingClinician: 'Admitting clinician',
  chronicDiseases: 'Chronic diseases',
  additionalAlerts: 'Additional alerts',
  alertsNotSupplied: 'Additional alert status not supplied.',
};

export type EmrPatientBannerLabels = typeof BANNER_DEFAULTS;

export function resolveBannerPrimaryIdentifier(model: PatientBannerViewModel): string {
  return model.identifiers[0]?.value ?? model.patientId;
}

export function resolveBannerCombinedAlerts(model: PatientBannerViewModel): readonly PatientAlert[] {
  return [...model.allergies, ...model.alerts];
}

export function resolveBannerCriticalBadges(model: PatientBannerViewModel): readonly EmrBadge[] {
  return [model.criticality, model.vip, model.codeStatus, model.isolation, model.allergyStatus].filter(
    (b): b is EmrBadge => !!b,
  );
}

export function resolveBannerInspectedAlert(model: PatientBannerViewModel): PatientAlert | undefined {
  if (!model.activeInspectId) return undefined;
  return [...model.allergies, ...model.alerts, ...model.chronicDiseases].find((a) => a.id === model.activeInspectId);
}

export function resolveBannerInspectedVital(model: PatientBannerViewModel): PatientVitalSparkline | undefined {
  if (!model.activeInspectId) return undefined;
  return model.vitals?.find((v) => v.id === model.activeInspectId);
}

export function computeSparklineBars(
  points: readonly number[],
): readonly { readonly heightPx: number; readonly opacity: number }[] {
  if (!points.length) return [];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);
  return points.map((pt, idx) => ({
    heightPx: Math.max(4, Math.round(((pt - min) / range) * 14) + 4),
    opacity: idx === points.length - 1 ? 1 : Number((0.45 + (idx / points.length) * 0.4).toFixed(2)),
  }));
}

/**
 * L4. Patient banner & Epic Storyboard surface (`emr-patient-banner`).
 * All wording and tone come from the model (including allergy prefix, overflow,
 * inline vitals micro-sparklines, and provenance drilldown); nothing is derived.
 */
@Component({
  selector: 'emr-patient-banner',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroChevronDown, heroChevronUp })],
  template: `
    @let m = model();
    @let l = text();
    <section
      class="emr-patient-banner"
      [class.emr-patient-banner--compact]="isCompact()"
      [class.emr-patient-banner--storyboard]="isStoryboard()"
      [attr.aria-label]="l.currentPatient + ': ' + m.displayName"
    >
      @if (isCompact()) {
        <div class="emr-patient-banner__compact">
          <div class="emr-patient-banner__compact-content">
            <h2 class="emr-patient-banner__name">{{ m.displayName }}</h2>
            <span class="emr-patient-banner__demographics">
              {{ m.ageLabel }} · {{ m.sexLabel }} · {{ primaryIdentifier() }}
            </span>
            @for (b of criticalBadges(); track b.label) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">
                {{ b.label }}@if (b.assistiveText) { <span class="emr-sr-only"> {{ b.assistiveText }}</span> }
              </span>
            }
          </div>
          <button
            class="emr-icon-button"
            type="button"
            [attr.aria-expanded]="m.expanded"
            [attr.aria-controls]="m.expanded ? detailsElementId() : null"
            [attr.aria-label]="m.expanded ? l.hideDetails : l.showDetails"
            (click)="intent.emit({ type: 'expandedChangeRequested', expanded: !m.expanded })"
          >
            <ng-icon [name]="m.expanded ? 'heroChevronUp' : 'heroChevronDown'" size="20" aria-hidden="true" />
          </button>
        </div>
      } @else {
        <div class="emr-patient-banner__primary" [class.emr-patient-banner__primary--storyboard]="isStoryboard()">
          <div class="emr-patient-banner__identity">
            <h2 class="emr-patient-banner__name">{{ m.displayName }}</h2>
            <div class="emr-patient-banner__demographics">
              {{ primaryIdentifier() }} · {{ m.ageLabel }} · {{ m.sexLabel }}@if (m.weightLabel) { · {{ l.weight }} {{ m.weightLabel }} }
            </div>
            @if (m.bedLabel || m.wardLabel || m.lengthOfStayLabel) {
              <div class="emr-patient-banner__location">
                @if (m.bedLabel) { <strong>{{ m.bedLabel }}</strong> }
                @if (m.wardLabel) { <span>{{ m.wardLabel }}</span> }
                @if (m.lengthOfStayLabel) { <span>{{ m.lengthOfStayLabel }}</span> }
              </div>
            }
          </div>
          <div class="emr-patient-banner__badges" [attr.aria-label]="l.patientStatus">
            @if (m.criticality) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.criticality.tone">{{ m.criticality.label }}</span>
            }
            @if (m.vip) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.vip.tone">{{ m.vip.label }}</span>
            }
            <span class="emr-badge emr-tone-info">{{ m.careSettingLabel }}</span>
          </div>
          <div class="emr-patient-banner__safety" [attr.aria-label]="l.safetyAlerts">
            @if (m.codeStatus) {
              <span [class]="'emr-badge emr-tone-' + m.codeStatus.tone">{{ m.codeStatus.label }}@if (m.codeStatus.assistiveText) { <span class="emr-sr-only"> {{ m.codeStatus.assistiveText }}</span> }</span>
            }
            @if (m.isolation) {
              <span [class]="'emr-badge emr-tone-' + m.isolation.tone">{{ m.isolation.label }}@if (m.isolation.assistiveText) { <span class="emr-sr-only"> {{ m.isolation.assistiveText }}</span> }</span>
            }
            @if (m.allergyStatus) {
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.allergyStatus.tone">{{ m.allergyStatus.label }}</span>
            }
            @if (m.allergies.length) {
              @for (allergy of m.allergies.slice(0, 2); track allergy.id) {
                <button
                  type="button"
                  class="emr-patient-banner__allergy-btn"
                  [attr.aria-pressed]="m.activeInspectId === allergy.id"
                  (click)="toggleInspect(allergy.id)"
                >
                  <span class="emr-badge" [class]="'emr-badge emr-tone-' + allergy.tone">{{ m.allergyChipPrefix }}{{ m.allergyChipPrefix ? ' ' : '' }}{{ allergy.label }}</span>
                </button>
              }
              @if (m.allergies.length > 2 && m.allergyOverflow) {
                <span [class]="'emr-badge emr-tone-' + m.allergyOverflow.tone">{{ m.allergyOverflow.label }}</span>
              }
            }
          </div>
          <button
            class="emr-icon-button"
            type="button"
            [attr.aria-expanded]="m.expanded"
            [attr.aria-controls]="m.expanded ? detailsElementId() : null"
            [attr.aria-label]="m.expanded ? l.hideDetails : l.showDetails"
            (click)="intent.emit({ type: 'expandedChangeRequested', expanded: !m.expanded })"
          >
            <ng-icon [name]="m.expanded ? 'heroChevronUp' : 'heroChevronDown'" size="20" aria-hidden="true" />
          </button>
        </div>

        @if (m.vitals?.length) {
          <div class="emr-patient-banner__vitals" role="group" aria-label="Vital signs">
            @for (v of m.vitals!; track v.id) {
              <button
                type="button"
                class="emr-patient-banner__vital-btn"
                [class.emr-patient-banner__vital-btn--active]="m.activeInspectId === v.id"
                [attr.aria-pressed]="m.activeInspectId === v.id"
                (click)="toggleInspect(v.id)"
              >
                <span class="emr-patient-banner__vital-meta">
                  <span class="emr-patient-banner__vital-label">{{ v.label }}</span>
                  <span class="emr-patient-banner__vital-reading">
                    <strong class="emr-patient-banner__vital-val">{{ v.valueLabel }}</strong>
                    @if (v.unit) { <span class="emr-patient-banner__vital-unit">{{ v.unit }}</span> }
                    @if (v.deltaLabel) {
                      <span class="emr-patient-banner__vital-delta" [class]="'emr-patient-banner__vital-delta emr-tone-' + (v.tone ?? 'info')">{{ v.deltaLabel }}</span>
                    }
                  </span>
                </span>
                @if (v.trendPoints?.length) {
                  <span class="emr-patient-banner__sparkline" aria-hidden="true">
                    @for (bar of sparklineBars(v.trendPoints); track $index) {
                      <span
                        class="emr-patient-banner__sparkline-bar"
                        [style.height.px]="bar.heightPx"
                        [style.opacity]="bar.opacity"
                      ></span>
                    }
                  </span>
                }
              </button>
            }
          </div>
        }

        @if (inspectedAlert() || inspectedVital()) {
          @let alert = inspectedAlert();
          @let vital = inspectedVital();
          @let inspectorTitle = alert ? alert.label : (vital?.label + ': ' + vital?.valueLabel + (vital?.unit ? ' ' + vital?.unit : ''));
          @let inspectorTone = alert ? alert.tone : (vital?.tone ?? 'info');
          <div
            class="emr-patient-banner__provenance"
            [class]="'emr-patient-banner__provenance emr-tone-' + inspectorTone"
            role="region"
            [attr.aria-label]="'Clinical provenance for ' + inspectorTitle"
          >
            <div class="emr-patient-banner__provenance-body">
              <div class="emr-patient-banner__provenance-head">
                <span class="emr-badge" [class]="'emr-badge emr-tone-' + inspectorTone">Clinical Provenance &amp; Safety Record</span>
                <strong>{{ inspectorTitle }}</strong>
              </div>
              @if (alert?.reactionLabel) {
                <div>Reaction / Manifestation: <strong>{{ alert!.reactionLabel }}</strong></div>
              }
              @if (alert?.detail) {
                <div>{{ alert!.detail }}</div>
              }
              <div class="emr-field__hint">
                {{ alert?.provenanceLabel ?? vital?.provenanceLabel ?? 'Verified in hospital EHR' }}@if (alert?.recordedAtLabel) { · Recorded {{ alert!.recordedAtLabel }} }
              </div>
            </div>
            <button
              type="button"
              class="emr-button emr-button--small emr-button--ghost"
              (click)="closeInspect()"
            >
              Close
            </button>
          </div>
        }
      }

      @if (m.expanded) {
        <div class="emr-patient-banner__secondary" [id]="detailsElementId()">
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">{{ l.currentEncounter }}</span>
            <strong>{{ m.careSettingLabel }} · {{ m.locationLabel }}</strong>
            @if (m.encounterLabel) { <div>{{ m.encounterLabel }}</div> }
            @if (m.admittedOnLabel) { <div class="emr-field__hint">{{ l.admitted }}: {{ m.admittedOnLabel }}</div> }
            @if (m.admittingClinicianLabel) { <div class="emr-field__hint">{{ l.admittingClinician }}: {{ m.admittingClinicianLabel }}</div> }
            @for (identifier of m.identifiers; track identifier.label) {
              <div class="emr-field__hint">{{ identifier.label }}: {{ identifier.value }}</div>
            }
          </div>
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">{{ l.chronicDiseases }}</span>
            <div class="emr-chip-row">
              @if (m.chronicDiseaseStatus) {
                <span class="emr-badge" [class]="'emr-badge emr-tone-' + m.chronicDiseaseStatus.tone">{{ m.chronicDiseaseStatus.label }}</span>
              }
              @for (item of m.chronicDiseases; track item.id) {
                <span class="emr-chip" [class]="'emr-chip emr-tone-' + item.tone">{{ item.label }}</span>
              }
            </div>
          </div>
          <div class="emr-summary-group">
            <span class="emr-summary-group__label">{{ l.additionalAlerts }}</span>
            <div class="emr-chip-row">
              @for (item of combinedAlerts(); track item.id) {
                <span class="emr-chip" [class]="'emr-chip emr-tone-' + item.tone">{{ item.label }}</span>
              }
              @if (!combinedAlerts().length) {
                <span class="emr-field__hint">{{ l.alertsNotSupplied }}</span>
              }
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-patient-banner--storyboard { max-width: 360px; }
    .emr-patient-banner__primary--storyboard { flex-direction: column; align-items: stretch; }
    .emr-patient-banner__compact { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 14px; }
    .emr-patient-banner__compact-content { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; flex: 1; min-width: 0; }
    .emr-patient-banner__allergy-btn { border: 0; padding: 0; background: transparent; cursor: pointer; font: inherit; }
    .emr-patient-banner__vitals { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 16px 12px; border-top: 1px solid var(--emr-border); }
    .emr-patient-banner__vital-btn { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface-soft); color: var(--emr-text); font: inherit; cursor: pointer; text-align: left; }
    .emr-patient-banner__vital-btn--active { border-color: var(--emr-primary); background: var(--emr-primary-soft); }
    .emr-patient-banner__vital-meta { display: grid; gap: 2px; }
    .emr-patient-banner__vital-label { color: var(--emr-text-muted); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-patient-banner__vital-reading { display: inline-flex; align-items: baseline; gap: 4px; }
    .emr-patient-banner__vital-val { font-family: var(--emr-font-mono); font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-patient-banner__vital-unit { color: var(--emr-text-muted); font-size: var(--emr-text-2xs); }
    .emr-patient-banner__vital-delta { font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); padding: 0 4px; border-radius: 4px; }
    .emr-patient-banner__sparkline { display: inline-flex; align-items: flex-end; gap: 2px; height: 18px; }
    .emr-patient-banner__sparkline-bar { width: 3px; border-radius: 1.5px; background: var(--emr-primary); }
    .emr-patient-banner__provenance { margin: 0 16px 12px; padding: 12px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface-raised); display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .emr-patient-banner__provenance-body { display: grid; gap: 4px; flex: 1; }
    .emr-patient-banner__provenance-head { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrPatientBannerComponent {
  readonly model = input.required<PatientBannerViewModel>();
  readonly idPrefix = input('emr-patient-banner');
  readonly compact = input<boolean>(false);
  readonly labels = input<Partial<EmrPatientBannerLabels>>({});
  readonly intent = output<PatientBannerIntent>();

  readonly text = computed<EmrPatientBannerLabels>(() => ({ ...BANNER_DEFAULTS, ...this.labels() }));
  readonly detailsElementId = computed(() => `${this.idPrefix()}-details`);
  readonly primaryIdentifier = computed(() => resolveBannerPrimaryIdentifier(this.model()));
  readonly combinedAlerts = computed<readonly PatientAlert[]>(() => resolveBannerCombinedAlerts(this.model()));
  readonly criticalBadges = computed(() => resolveBannerCriticalBadges(this.model()).slice(0, 3));
  readonly isCompact = computed(() => this.compact() || this.model().layoutMode === 'compact');
  readonly isStoryboard = computed(() => !this.compact() && this.model().layoutMode === 'storyboard');
  readonly inspectedAlert = computed(() => resolveBannerInspectedAlert(this.model()));
  readonly inspectedVital = computed(() => resolveBannerInspectedVital(this.model()));

  sparklineBars(points?: readonly number[]) {
    return computeSparklineBars(points ?? []);
  }

  toggleInspect(id: string): void {
    const current = this.model().activeInspectId;
    this.intent.emit({ type: 'alertInspectRequested', alertId: current === id ? null : id });
  }

  closeInspect(): void {
    this.intent.emit({ type: 'alertInspectRequested', alertId: null });
  }
}
