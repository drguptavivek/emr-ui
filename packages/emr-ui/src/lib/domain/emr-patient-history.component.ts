import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type {
  EmrCataractEpisode,
  EmrCataractEpisodeIntent,
  EmrPatientHistoryIntent,
  EmrPatientHistoryModel,
  EmrPatientSnapshot,
} from '@drguptavivek/emr-controller';
import { EmrStageStepperComponent } from '../primitives/emr-stage-stepper.component';
import { EmrPatientIdentityCardComponent } from './emr-patient-identity-card.component';

const DEFAULT_EPISODE_LABELS = {
  title: 'Cataract episode',
  admitted: 'Admitted',
  operated: 'Surgery',
  stagesAria: 'Episode stages',
  followups: 'Follow-ups',
  done: 'Done',
  completeSurgery: 'Complete surgery',
  addFollowup: 'Add follow-up',
  open: 'Open',
};
export type EmrEpisodeLabels = typeof DEFAULT_EPISODE_LABELS;

const DEFAULT_HISTORY_LABELS = {
  ariaLabel: 'Patient history',
  summary: 'Summary',
  visits: 'Visits',
  newPatient: 'New patient',
  newPatientMessage: 'No visits or screenings recorded yet.',
  loading: 'Loading patient history',
  rx: 'Last spectacle prescription',
  glaucoma: 'Last glaucoma screen',
  dr: 'Last diabetic retinopathy screen',
  referrals: 'Open referrals',
  bookings: 'Open bookings',
  episodes: 'Open cataract episodes',
  od: 'OD',
  os: 'OS',
  re: 'RE',
  le: 'LE',
  sph: 'Sph',
  cyl: 'Cyl',
  axis: 'Axis',
  add: 'Add',
  iop: 'IOP',
  cdr: 'CDR',
  grade: 'Grade',
  maculopathy: 'Maculopathy',
  decision: 'Decision',
  pva: 'PVA',
  diagnosis: 'Diagnosis',
  advice: 'Advice',
};
export type EmrHistoryLabels = typeof DEFAULT_HISTORY_LABELS;

function present(...parts: readonly (string | undefined | false)[]): string[] {
  return parts.filter((x): x is string => Boolean(x && x.trim()));
}

function hasSummary(s: EmrPatientSnapshot['summary']): boolean {
  return Boolean(
    s.lastSpectacleRx ||
      s.lastGlaucomaScreen ||
      s.lastDrScreen ||
      s.openReferrals.length ||
      s.openBookings.length ||
      s.openEpisodes.length,
  );
}

/**
 * L4 Cataract episode card: read-only episode summary with stage stepper, follow-ups, and status-driven actions.
 */
@Component({
  selector: 'emr-cataract-episode-card',
  standalone: true,
  imports: [EmrStageStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let e = model();
    @let l = text();
    <section class="emr-ep-card" [attr.aria-label]="cardTitle()">
      <h4 class="emr-ep-card__title">{{ cardTitle() }}</h4>
      <div class="emr-ep-card__row">
        <span class="emr-badge" [class]="'emr-badge emr-tone-' + e.statusBadge.tone">{{ e.statusBadge.label }}</span>
        @if (datesText(); as dt) {
          <span class="emr-ep-card__muted">{{ dt }}</span>
        }
      </div>

      @if (e.stages.stages.length > 0) {
        <emr-stage-stepper
          [stages]="e.stages.stages"
          [activeId]="e.stages.activeId"
          [readOnly]="true"
          [ariaLabel]="l.stagesAria"
        />
      }

      @if (e.followups.length > 0) {
        <div class="emr-ep-card__followups" role="list" [attr.aria-label]="l.followups">
          <strong class="emr-ep-card__bold">{{ l.followups }}</strong>
          @for (f of e.followups; track $index) {
            <div class="emr-ep-card__followup" role="listitem">
              <span class="emr-ep-card__grow">{{ f.label }}</span>
              <span class="emr-ep-card__muted">{{ f.due }}</span>
              @if (f.done) {
                <span class="emr-chip emr-tone-success">{{ l.done }}</span>
              }
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + f.statusBadge.tone">{{ f.statusBadge.label }}</span>
            </div>
          }
        </div>
      }

      <div class="emr-ep-card__row">
        @if (!openOnly() && e.canCompleteSurgery) {
          <button type="button" class="emr-button" (click)="intent.emit({ type: 'completeSurgeryRequested', id: e.id })">
            {{ l.completeSurgery }}
          </button>
        }
        @if (!openOnly() && e.canAddFollowup) {
          <button type="button" class="emr-button" (click)="intent.emit({ type: 'addFollowupRequested', id: e.id })">
            {{ l.addFollowup }}
          </button>
        }
        <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'openRequested', id: e.id })">
          {{ l.open }}
        </button>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-ep-card {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
      min-width: 0;
    }
    .emr-ep-card__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-ep-card__bold { font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-ep-card__muted { font-size: var(--emr-text-sm); color: var(--emr-text-muted); }
    .emr-ep-card__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .emr-ep-card__grow { flex: 1; min-width: 0; font-size: var(--emr-text-sm); }
    .emr-ep-card__followups { display: grid; gap: 6px; }
    .emr-ep-card__followup {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding-top: 6px;
      border-top: 1px solid var(--emr-border);
    }
  `],
})
export class EmrCataractEpisodeCardComponent {
  readonly model = input.required<EmrCataractEpisode>();
  readonly openOnly = input(false);
  readonly labels = input<Partial<EmrEpisodeLabels>>({});
  readonly intent = output<EmrCataractEpisodeIntent>();

  protected readonly text = computed(() => ({ ...DEFAULT_EPISODE_LABELS, ...this.labels() }));
  protected readonly cardTitle = computed(() => {
    const e = this.model();
    const l = this.text();
    return e.eye ? `${l.title} · ${e.eye}` : l.title;
  });
  protected readonly datesText = computed(() => {
    const e = this.model();
    const l = this.text();
    return present(e.admissionDate && `${l.admitted} ${e.admissionDate}`, e.sxDate && `${l.operated} ${e.sxDate}`).join(' · ');
  });
}

/**
 * L4 Patient history timeline: compact identity card, pinned clinical summary blocks (spectacle Rx, glaucoma, DR,
 * open referrals, bookings, cataract episodes), and chronological visit list.
 */
@Component({
  selector: 'emr-patient-history-timeline',
  standalone: true,
  imports: [EmrPatientIdentityCardComponent, EmrCataractEpisodeCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    @if (m.loading) {
      <div class="emr-hist" role="status" aria-busy="true" [attr.aria-label]="l.loading">
        <div class="emr-hist__card"><p class="emr-hist__muted">{{ l.loading }}</p></div>
      </div>
    } @else {
      <section class="emr-hist" [attr.aria-label]="l.ariaLabel">
        @if (!hideIdentity()) {
          <emr-patient-identity-card [model]="m.patient" mode="compact" />
        }
        @if (isEmpty()) {
          <div class="emr-empty" role="status">
            <div>
              <strong>{{ l.newPatient }}</strong>
              <div>{{ l.newPatientMessage }}</div>
            </div>
          </div>
        }
        @if (showSummary()) {
          <div class="emr-hist__section" role="group" [attr.aria-label]="l.summary">
            <h3 class="emr-hist__heading">{{ l.summary }}</h3>
            <div class="emr-hist__summary-grid">
              @if (m.summary.lastSpectacleRx; as rx) {
                <div class="emr-hist__card" role="group" [attr.aria-label]="l.rx">
                  <div class="emr-hist__row">
                    <strong class="emr-hist__grow">{{ l.rx }}</strong>
                    <span class="emr-hist__muted">{{ rx.date }}</span>
                  </div>
                  <table class="emr-hist__rx-table" [attr.aria-label]="l.rx">
                    <thead>
                      <tr>
                        <th scope="col"><span class="emr-sr-only">Eye</span></th>
                        <th scope="col">{{ l.sph }}</th>
                        <th scope="col">{{ l.cyl }}</th>
                        <th scope="col">{{ l.axis }}</th>
                        <th scope="col">{{ l.add }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">{{ l.od }}</th>
                        <td>{{ rx.re.sph }}</td>
                        <td>{{ rx.re.cyl }}</td>
                        <td>{{ rx.re.axis }}</td>
                        <td>{{ rx.re.add }}</td>
                      </tr>
                      <tr>
                        <th scope="row">{{ l.os }}</th>
                        <td>{{ rx.le.sph }}</td>
                        <td>{{ rx.le.cyl }}</td>
                        <td>{{ rx.le.axis }}</td>
                        <td>{{ rx.le.add }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="emr-hist__row">
                    @if (rx.type) { <span class="emr-hist__muted">{{ rx.type }}</span> }
                    <span class="emr-badge" [class]="'emr-badge emr-tone-' + rx.statusBadge.tone">{{ rx.statusBadge.label }}</span>
                  </div>
                </div>
              }

              @if (m.summary.lastGlaucomaScreen; as gl) {
                <div class="emr-hist__card" role="group" [attr.aria-label]="l.glaucoma">
                  <div class="emr-hist__row">
                    <strong class="emr-hist__grow">{{ l.glaucoma }}</strong>
                    <span class="emr-hist__muted">{{ gl.date }}</span>
                  </div>
                  @if (glaucomaLine('re'); as reLine) {
                    <p class="emr-hist__line"><strong>{{ l.re }}</strong> {{ reLine }}</p>
                  }
                  @if (glaucomaLine('le'); as leLine) {
                    <p class="emr-hist__line"><strong>{{ l.le }}</strong> {{ leLine }}</p>
                  }
                  @if (gl.decision) {
                    <p class="emr-hist__line"><strong>{{ l.decision }}</strong> {{ gl.decision }}</p>
                  }
                </div>
              }

              @if (m.summary.lastDrScreen; as dr) {
                <div class="emr-hist__card" role="group" [attr.aria-label]="l.dr">
                  <div class="emr-hist__row">
                    <strong class="emr-hist__grow">{{ l.dr }}</strong>
                    <span class="emr-hist__muted">{{ dr.date }}</span>
                  </div>
                  @if (drLine('re'); as reLine) {
                    <p class="emr-hist__line"><strong>{{ l.re }}</strong> {{ reLine }}</p>
                  }
                  @if (drLine('le'); as leLine) {
                    <p class="emr-hist__line"><strong>{{ l.le }}</strong> {{ leLine }}</p>
                  }
                  @if (dr.decision) {
                    <p class="emr-hist__line"><strong>{{ l.decision }}</strong> {{ dr.decision }}</p>
                  }
                </div>
              }

              @if (m.summary.openReferrals.length > 0) {
                <div class="emr-hist__card" role="group" [attr.aria-label]="l.referrals">
                  <strong>{{ l.referrals }}</strong>
                  @for (r of m.summary.openReferrals; track r.id) {
                    <button
                      type="button"
                      class="emr-hist__row-btn"
                      [attr.aria-label]="r.purpose + ', ' + r.centreName + ', ' + r.date"
                      (click)="intent.emit({ type: 'referralSelected', id: r.id })"
                    >
                      <span class="emr-hist__row">
                        <strong class="emr-hist__grow">{{ r.purpose }}</strong>
                        <span class="emr-badge" [class]="'emr-badge emr-tone-' + r.statusBadge.tone">{{ r.statusBadge.label }}</span>
                      </span>
                      <span class="emr-hist__muted">{{ r.centreName }} · {{ r.date }}</span>
                    </button>
                  }
                </div>
              }

              @if (m.summary.openBookings.length > 0) {
                <div class="emr-hist__card" role="group" [attr.aria-label]="l.bookings">
                  <strong>{{ l.bookings }}</strong>
                  @for (b of m.summary.openBookings; track b.id) {
                    <button
                      type="button"
                      class="emr-hist__row-btn"
                      [attr.aria-label]="b.type + ', ' + b.date + ', ' + b.daysOpenLabel"
                      (click)="intent.emit({ type: 'bookingSelected', id: b.id })"
                    >
                      <span class="emr-hist__row">
                        <strong class="emr-hist__grow">{{ b.type }}</strong>
                        <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.paidBadge.tone">{{ b.paidBadge.label }}</span>
                        @if (b.overdueBadge; as ob) {
                          <span class="emr-badge" [class]="'emr-badge emr-tone-' + ob.tone">{{ ob.label }}</span>
                        }
                      </span>
                      <span class="emr-hist__muted">{{ b.date }} · {{ b.daysOpenLabel }}</span>
                    </button>
                  }
                </div>
              }

              @if (m.summary.openEpisodes.length > 0) {
                <div class="emr-hist__section" role="group" [attr.aria-label]="l.episodes">
                  @for (e of m.summary.openEpisodes; track e.id) {
                    <emr-cataract-episode-card
                      [model]="e"
                      [openOnly]="true"
                      (intent)="$event.type === 'openRequested' && intent.emit({ type: 'episodeSelected', id: $event.id })"
                    />
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (m.visits.length > 0) {
          <div class="emr-hist__section" role="list" [attr.aria-label]="l.visits">
            <h3 class="emr-hist__heading">{{ l.visits }}</h3>
            @for (v of m.visits; track v.id) {
              <div role="listitem">
                <button
                  type="button"
                  class="emr-hist__row-btn"
                  [attr.aria-label]="v.date + ', ' + v.centreName"
                  (click)="intent.emit({ type: 'visitSelected', id: v.id })"
                >
                  <span class="emr-hist__row">
                    <strong class="emr-hist__grow">{{ v.date }}</strong>
                    <span class="emr-hist__muted">{{ v.centreName }} · {{ v.teamName }}</span>
                  </span>
                  @if (visitPva(v); as pva) {
                    <span class="emr-hist__line"><strong>{{ l.pva }}</strong> {{ pva }}</span>
                  }
                  @if (v.diagnosis) {
                    <span class="emr-hist__line"><strong>{{ l.diagnosis }}</strong> {{ v.diagnosis }}</span>
                  }
                  @if (v.advice) {
                    <span class="emr-hist__muted">{{ l.advice }}: {{ v.advice }}</span>
                  }
                </button>
              </div>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-hist, .emr-hist__section { display: grid; gap: 10px; min-width: 0; }
    .emr-hist__summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; }
    .emr-hist__heading { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-hist__card {
      display: grid;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
      min-width: 0;
    }
    .emr-hist__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .emr-hist__grow { flex: 1; min-width: 0; }
    .emr-hist__muted { margin: 0; font-size: var(--emr-text-sm); color: var(--emr-text-muted); }
    .emr-hist__line { margin: 0; font-size: var(--emr-text-sm); }
    .emr-hist__rx-table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-sm); }
    .emr-hist__rx-table th, .emr-hist__rx-table td { padding: 4px 6px; border-top: 1px solid var(--emr-border); text-align: center; }
    .emr-hist__rx-table thead th { border-top: 0; color: var(--emr-text-muted); font-weight: var(--emr-weight-medium); }
    .emr-hist__rx-table tbody th { text-align: left; font-weight: var(--emr-weight-bold); }
    .emr-hist__row-btn {
      width: 100%;
      display: grid;
      gap: 6px;
      min-height: var(--emr-control-height);
      padding: 10px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
      color: var(--emr-text);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
    }
    .emr-hist__row-btn:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
  `],
})
export class EmrPatientHistoryTimelineComponent {
  readonly model = input.required<EmrPatientHistoryModel>();
  readonly hideIdentity = input(false);
  readonly labels = input<Partial<EmrHistoryLabels>>({});
  readonly intent = output<EmrPatientHistoryIntent>();

  protected readonly text = computed(() => ({ ...DEFAULT_HISTORY_LABELS, ...this.labels() }));
  protected readonly showSummary = computed(() => hasSummary(this.model().summary));
  protected readonly isEmpty = computed(() => this.model().visits.length === 0 && !this.showSummary());

  protected glaucomaLine(eye: 're' | 'le'): string {
    const gl = this.model().summary.lastGlaucomaScreen;
    if (!gl) return '';
    const l = this.text();
    const iop = eye === 're' ? gl.iopRe : gl.iopLe;
    const cdr = eye === 're' ? gl.cdrRe : gl.cdrLe;
    return present(iop && `${l.iop} ${iop}`, cdr && `${l.cdr} ${cdr}`).join(' · ');
  }

  protected drLine(eye: 're' | 'le'): string {
    const dr = this.model().summary.lastDrScreen;
    if (!dr) return '';
    const l = this.text();
    const grade = eye === 're' ? dr.gradeRe : dr.gradeLe;
    const mac = eye === 're' ? dr.maculopathyRe : dr.maculopathyLe;
    return present(grade && `${l.grade} ${grade}`, mac && `${l.maculopathy} ${mac}`).join(' · ');
  }

  protected visitPva(v: EmrPatientHistoryModel['visits'][number]): string {
    const l = this.text();
    return present(v.pvaRe && `${l.re} ${v.pvaRe}`, v.pvaLe && `${l.le} ${v.pvaLe}`).join(' · ');
  }
}
