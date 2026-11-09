import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type {
  EmrArrivalLinkerIntent,
  EmrArrivalLinkerModel,
  EmrBookedFilters,
  EmrBookedNotDeliveredIntent,
  EmrBookedNotDeliveredModel,
  EmrSpectacleDeliveryIntent,
  EmrSpectacleDeliveryModel,
  IdentifierEntryView,
} from '@drguptavivek/emr-controller';
import { EmrIdentifierEntryComponent, type EmrIdentifierEntryEvent } from '../fields/emr-identifier-entry.component';
import { EmrRadioGroupComponent } from '../primitives/emr-choice.component';
import { EmrDateInputComponent, EmrSelectComponent } from '../primitives/emr-inputs.component';
import { EmrPatientIdentityCardComponent } from './emr-patient-identity-card.component';

const DEFAULT_DESK_LABELS = {
  purpose: 'Purpose of visit',
  referrals: 'Open referrals',
  noReferral: 'No referral / self',
  noOpenReferrals: 'No open referrals for this patient.',
  uhid: 'UHID',
  uhidUse: 'Use this UHID',
  uhidSkip: 'UHID not issued yet / skip',
  submit: 'Submit',
  cancel: 'Cancel',
  bookings: 'Spectacle bookings',
  noBookings: 'No bookings to deliver.',
  deliveryDate: 'Delivery date',
  listTitle: 'Booked, not delivered',
  centre: 'Centre',
  allCentres: 'All centres',
  bookedFrom: 'Booked from',
  bookedTo: 'Booked to',
  call: 'Call',
  previous: 'Previous',
  next: 'Next',
  loading: 'Loading bookings…',
  empty: 'No bookings match these filters.',
  errorTitle: 'Bookings could not be loaded',
  retry: 'Retry',
  patient: 'Patient',
  booked: 'Booked',
  type: 'Type',
  status: 'Status',
};
export type EmrDeskLabels = typeof DEFAULT_DESK_LABELS;

let nextDeskId = 0;

/**
 * L4 RPC desk arrival linker: purpose of visit, open referrals to link (or none), optional UHID, and Submit/Cancel.
 */
@Component({
  selector: 'emr-arrival-linker',
  standalone: true,
  imports: [EmrPatientIdentityCardComponent, EmrRadioGroupComponent, EmrIdentifierEntryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <form class="emr-desk" novalidate (submit)="$event.preventDefault()" [attr.aria-label]="m.patient.name">
      <emr-patient-identity-card [model]="m.patient" mode="compact" />
      <emr-radio-group
        [name]="uid + '-purpose'"
        [label]="l.purpose"
        [options]="purposeOptions()"
        [value]="m.selectedPurpose ?? null"
        (valueChange)="intent.emit({ type: 'purposeSelected', id: $event })"
      />

      <div class="emr-desk__group" role="group" [attr.aria-label]="l.referrals">
        <h4 class="emr-desk__heading">{{ l.referrals }}</h4>
        @if (m.openReferrals.length === 0) {
          <p class="emr-desk__muted">{{ l.noOpenReferrals }}</p>
        }
        @for (r of m.openReferrals; track r.id) {
          @let checked = m.selectedReferralIds.includes(r.id);
          <button
            type="button"
            role="checkbox"
            class="emr-desk__check-row"
            [class.emr-desk__check-row--checked]="checked"
            [attr.aria-checked]="checked"
            [attr.aria-label]="r.date + ', ' + r.centreName + ', ' + r.purpose"
            (click)="intent.emit({ type: 'referralToggled', id: r.id })"
          >
            <span class="emr-desk__check-box" aria-hidden="true">{{ checked ? '✓' : '' }}</span>
            <span class="emr-desk__check-body">
              <strong class="emr-desk__bold">{{ r.date }} · {{ r.centreName }}</strong>
              <span class="emr-desk__text">{{ r.purpose }}</span>
              @if (r.visitCountLabel || r.nextDueLabel) {
                <span class="emr-desk__muted">{{ referralMeta(r.visitCountLabel, r.nextDueLabel) }}</span>
              }
              <span class="emr-desk__row">
                @for (f of r.flags; track f) {
                  <span class="emr-chip emr-tone-neutral">{{ f }}</span>
                }
                <span class="emr-desk__muted">{{ r.daysSinceAdviceLabel }}</span>
                @if (r.overdueBadge; as b) {
                  <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.tone">{{ b.label }}</span>
                }
              </span>
            </span>
          </button>
        }
        <button
          type="button"
          role="checkbox"
          class="emr-desk__check-row"
          [class.emr-desk__check-row--checked]="m.noReferral"
          [attr.aria-checked]="m.noReferral"
          [attr.aria-label]="l.noReferral"
          (click)="intent.emit({ type: 'noReferralToggled' })"
        >
          <span class="emr-desk__check-box" aria-hidden="true">{{ m.noReferral ? '✓' : '' }}</span>
          <span class="emr-desk__check-body">
            <span class="emr-desk__text">{{ l.noReferral }}</span>
          </span>
        </button>
      </div>

      @if (m.uhid; as u) {
        @if (u.existing; as ex) {
          <div class="emr-desk__group">
            <span class="emr-desk__muted">{{ ex.label }}</span>
            <strong class="emr-desk__bold">{{ ex.display }}</strong>
          </div>
        } @else {
          <div class="emr-desk__group">
            <emr-identifier-entry [controlId]="uid + '-uhid'" [model]="uhidEntry()" (intent)="onUhidIntent($event)" />
            <div class="emr-desk__row">
              <button
                type="button"
                class="emr-button emr-button--small emr-button--outline"
                [disabled]="!hasUhidDraft()"
                (click)="intent.emit({ type: 'uhidProvided', raw: uhidDraft().trim() })"
              >
                {{ l.uhidUse }}
              </button>
              <button
                type="button"
                class="emr-button emr-button--small emr-button--ghost"
                (click)="intent.emit({ type: 'uhidSkipped' })"
              >
                {{ l.uhidSkip }}
              </button>
            </div>
          </div>
        }
      }

      <div class="emr-desk__row">
        <button type="button" class="emr-button" [disabled]="!m.canSubmit" (click)="intent.emit({ type: 'submitRequested' })">
          {{ l.submit }}
        </button>
        <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'cancelled' })">
          {{ l.cancel }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-desk, .emr-desk__group { display: grid; gap: 10px; min-width: 0; }
    .emr-desk__heading { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-desk__bold { font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); overflow-wrap: anywhere; }
    .emr-desk__text { font-size: var(--emr-text-md); overflow-wrap: anywhere; }
    .emr-desk__muted { margin: 0; font-size: var(--emr-text-sm); color: var(--emr-text-muted); overflow-wrap: anywhere; }
    .emr-desk__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .emr-desk__check-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      min-height: var(--emr-control-height);
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      color: var(--emr-text);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
    }
    .emr-desk__check-row--checked {
      border: 2px solid var(--emr-primary);
      background: var(--emr-primary-soft);
    }
    .emr-desk__check-row:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-desk__check-box {
      width: 24px;
      height: 24px;
      flex: none;
      margin-top: 2px;
      border: 2px solid var(--emr-border);
      border-radius: 4px;
      background: var(--emr-surface);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: var(--emr-text-sm);
      font-weight: var(--emr-weight-bold);
    }
    .emr-desk__check-row--checked .emr-desk__check-box {
      border-color: var(--emr-primary);
      background: var(--emr-primary);
      color: var(--emr-primary-contrast);
    }
    .emr-desk__check-body { display: grid; gap: 4px; flex: 1; min-width: 0; }
  `],
})
export class EmrArrivalLinkerComponent {
  readonly model = input.required<EmrArrivalLinkerModel>();
  readonly labels = input<Partial<EmrDeskLabels>>({});
  readonly intent = output<EmrArrivalLinkerIntent>();

  protected readonly uid = `emr-arrival-${++nextDeskId}`;
  protected readonly text = computed(() => ({ ...DEFAULT_DESK_LABELS, ...this.labels() }));
  protected readonly purposeOptions = computed(() =>
    this.model().purposeOptions.map((o) => ({ value: o.id, label: o.label })),
  );
  protected readonly uhidDraft = computed(() => this.model().uhid?.value ?? '');
  protected readonly hasUhidDraft = computed(() => this.uhidDraft().trim() !== '');
  protected readonly uhidEntry = computed<IdentifierEntryView>(() => ({
    label: this.text().uhid,
    value: this.uhidDraft(),
    normalisedValue: this.model().uhid?.normalisedValue,
    error: this.model().uhid?.error,
    warning: this.model().uhid?.warning,
  }));

  protected referralMeta(visitCount?: string, nextDue?: string): string {
    return [visitCount, nextDue].filter(Boolean).join(' · ');
  }

  protected onUhidIntent(event: EmrIdentifierEntryEvent): void {
    if (event.type === 'valueChanged') {
      this.intent.emit({ type: 'uhidChanged', raw: event.raw });
    } else if (event.type === 'scanRequested') {
      this.intent.emit({ type: 'scanRequested' });
    }
  }
}

/**
 * L4 Spectacle delivery form: select spectacle bookings handed over and record the delivery date.
 */
@Component({
  selector: 'emr-spectacle-delivery',
  standalone: true,
  imports: [EmrPatientIdentityCardComponent, EmrDateInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <form class="emr-spec-del" novalidate (submit)="$event.preventDefault()" [attr.aria-label]="m.patient.name">
      <emr-patient-identity-card [model]="m.patient" mode="compact" />
      <div class="emr-spec-del__group" role="group" [attr.aria-label]="l.bookings">
        <h4 class="emr-spec-del__heading">{{ l.bookings }}</h4>
        @if (m.bookings.length === 0) {
          <p class="emr-spec-del__muted">{{ l.noBookings }}</p>
        }
        @for (b of m.bookings; track b.id) {
          @let checked = m.selectedBookingIds.includes(b.id);
          <button
            type="button"
            role="checkbox"
            class="emr-spec-del__check-row"
            [class.emr-spec-del__check-row--checked]="checked"
            [attr.aria-checked]="checked"
            [attr.aria-label]="b.bookedDate + ', ' + b.type + ', ' + b.rxSummary"
            (click)="intent.emit({ type: 'bookingToggled', id: b.id })"
          >
            <span class="emr-spec-del__check-box" aria-hidden="true">{{ checked ? '✓' : '' }}</span>
            <span class="emr-spec-del__check-body">
              <strong class="emr-spec-del__bold">{{ b.bookedDate }} · {{ b.type }}</strong>
              <span class="emr-spec-del__text">{{ b.rxSummary }}</span>
              <span class="emr-spec-del__row">
                <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.paidBadge.tone">{{ b.paidBadge.label }}</span>
                <span class="emr-badge" [class]="'emr-badge emr-tone-' + b.statusBadge.tone">{{ b.statusBadge.label }}</span>
                <span class="emr-spec-del__muted">{{ b.daysOpenLabel }}</span>
              </span>
            </span>
          </button>
        }
      </div>
      <emr-date-input
        [controlId]="uid + '-date'"
        [label]="l.deliveryDate"
        [value]="m.deliveryDate || ''"
        (valueChange)="intent.emit({ type: 'deliveryDateChanged', iso: $event || null })"
      />
      <div class="emr-spec-del__row">
        <button type="button" class="emr-button" [disabled]="!m.canSubmit" (click)="intent.emit({ type: 'submitRequested' })">
          {{ l.submit }}
        </button>
        <button type="button" class="emr-button emr-button--outline" (click)="intent.emit({ type: 'cancelled' })">
          {{ l.cancel }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-spec-del, .emr-spec-del__group { display: grid; gap: 10px; min-width: 0; }
    .emr-spec-del__heading { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-spec-del__bold { font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); overflow-wrap: anywhere; }
    .emr-spec-del__text { font-size: var(--emr-text-md); overflow-wrap: anywhere; }
    .emr-spec-del__muted { margin: 0; font-size: var(--emr-text-sm); color: var(--emr-text-muted); overflow-wrap: anywhere; }
    .emr-spec-del__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .emr-spec-del__check-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      min-height: var(--emr-control-height);
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface);
      color: var(--emr-text);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
    }
    .emr-spec-del__check-row--checked {
      border: 2px solid var(--emr-primary);
      background: var(--emr-primary-soft);
    }
    .emr-spec-del__check-row:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-spec-del__check-box {
      width: 24px;
      height: 24px;
      flex: none;
      margin-top: 2px;
      border: 2px solid var(--emr-border);
      border-radius: 4px;
      background: var(--emr-surface);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: var(--emr-text-sm);
      font-weight: var(--emr-weight-bold);
    }
    .emr-spec-del__check-row--checked .emr-spec-del__check-box {
      border-color: var(--emr-primary);
      background: var(--emr-primary);
      color: var(--emr-primary-contrast);
    }
    .emr-spec-del__check-body { display: grid; gap: 4px; flex: 1; min-width: 0; }
  `],
})
export class EmrSpectacleDeliveryComponent {
  readonly model = input.required<EmrSpectacleDeliveryModel>();
  readonly labels = input<Partial<EmrDeskLabels>>({});
  readonly intent = output<EmrSpectacleDeliveryIntent>();

  protected readonly uid = `emr-spec-del-${++nextDeskId}`;
  protected readonly text = computed(() => ({ ...DEFAULT_DESK_LABELS, ...this.labels() }));
}

/**
 * L4 Booked-not-delivered work list: filter bar (centre, date range), responsive table/cards, call action, and pager.
 */
@Component({
  selector: 'emr-booked-not-delivered-list',
  standalone: true,
  imports: [EmrSelectComponent, EmrDateInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    @let f = m.filters;
    <section class="emr-bnd" [attr.aria-label]="l.listTitle" [attr.aria-busy]="m.state === 'loading' ? 'true' : null">
      <div class="emr-bnd__filters" role="group" [attr.aria-label]="l.listTitle">
        <emr-select
          [controlId]="uid + '-centre'"
          [label]="l.centre"
          [options]="centreOptions()"
          [value]="f.selectedCentreId ?? ''"
          (valueChange)="emitFilter({ centreId: $event || undefined })"
        />
        <div class="emr-bnd__dates">
          <emr-date-input
            [controlId]="uid + '-from'"
            [label]="l.bookedFrom"
            [value]="f.bookedFrom ?? ''"
            (valueChange)="emitFilter({ bookedFrom: $event || undefined })"
          />
          <emr-date-input
            [controlId]="uid + '-to'"
            [label]="l.bookedTo"
            [value]="f.bookedTo ?? ''"
            (valueChange)="emitFilter({ bookedTo: $event || undefined })"
          />
        </div>
      </div>

      @if (m.state === 'error') {
        <div class="emr-empty" role="alert">
          <div>
            <strong>{{ l.errorTitle }}</strong>
            @if (m.message) { <div>{{ m.message }}</div> }
            <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="intent.emit({ type: 'retryRequested' })">
              {{ l.retry }}
            </button>
          </div>
        </div>
      } @else if (m.state === 'loading' && m.rows.length === 0) {
        <div class="emr-empty" role="status"><strong>{{ m.message ?? l.loading }}</strong></div>
      } @else if (m.state === 'empty' || m.rows.length === 0) {
        <div class="emr-empty" role="status"><strong>{{ m.message ?? l.empty }}</strong></div>
      } @else {
        <div class="emr-bnd__table-wrap">
          <table class="emr-bnd__table" [attr.aria-label]="l.listTitle">
            <thead>
              <tr>
                <th scope="col">{{ l.patient }}</th>
                <th scope="col">{{ l.centre }}</th>
                <th scope="col">{{ l.booked }}</th>
                <th scope="col">{{ l.type }}</th>
                <th scope="col">{{ l.status }}</th>
                <th scope="col"><span class="emr-sr-only">{{ l.call }}</span></th>
              </tr>
            </thead>
            <tbody>
              @for (r of m.rows; track r.bookingId) {
                <tr>
                  <td>
                    <button
                      type="button"
                      class="emr-bnd__patient-btn"
                      [attr.aria-label]="r.primaryIdentifier + ', ' + r.patientName + ', ' + r.bookedDate + ', ' + r.type"
                      (click)="intent.emit({ type: 'rowSelected', bookingId: r.bookingId })"
                    >
                      <strong>{{ r.primaryIdentifier }}</strong>
                      <span>{{ r.patientName }}</span>
                      @if (r.phone) { <span class="emr-bnd__muted">{{ r.phone }}</span> }
                    </button>
                  </td>
                  <td>{{ r.centreName }}</td>
                  <td>
                    <div>{{ r.bookedDate }}</div>
                    <div class="emr-bnd__muted">{{ r.daysOpenLabel }}</div>
                  </td>
                  <td>{{ r.type }}</td>
                  <td>
                    <div class="emr-bnd__badges">
                      <span class="emr-badge" [class]="'emr-badge emr-tone-' + r.paidBadge.tone">{{ r.paidBadge.label }}</span>
                      @if (r.overdueBadge; as ob) {
                        <span class="emr-badge" [class]="'emr-badge emr-tone-' + ob.tone">{{ ob.label }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    @if (r.phone; as ph) {
                      <button
                        type="button"
                        class="emr-button emr-button--small emr-button--outline"
                        [attr.aria-label]="l.call + ' ' + r.patientName"
                        (click)="intent.emit({ type: 'callRequested', phone: ph })"
                      >
                        {{ l.call }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="emr-bnd__pager">
          <button
            type="button"
            class="emr-button emr-button--small emr-button--outline"
            [disabled]="m.page <= 1"
            (click)="intent.emit({ type: 'pageChanged', page: m.page - 1 })"
          >
            {{ l.previous }}
          </button>
          <span role="status" class="emr-bnd__muted">{{ m.pagingSummaryLabel }}</span>
          <button
            type="button"
            class="emr-button emr-button--small emr-button--outline"
            [disabled]="m.page >= m.pageCount"
            (click)="intent.emit({ type: 'pageChanged', page: m.page + 1 })"
          >
            {{ l.next }}
          </button>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-bnd, .emr-bnd__filters { display: grid; gap: 12px; min-width: 0; }
    .emr-bnd__dates { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
    .emr-bnd__table-wrap { overflow-x: auto; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); }
    .emr-bnd__table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-sm); }
    .emr-bnd__table th, .emr-bnd__table td { padding: 8px 12px; border-bottom: 1px solid var(--emr-border); text-align: left; vertical-align: middle; }
    .emr-bnd__table thead th { background: var(--emr-surface-slate); color: var(--emr-text-muted); font-weight: var(--emr-weight-semibold); }
    .emr-bnd__patient-btn {
      display: grid;
      gap: 2px;
      min-height: var(--emr-control-height);
      padding: 4px 0;
      border: 0;
      background: transparent;
      color: var(--emr-text);
      font-family: inherit;
      font-size: var(--emr-text-sm);
      text-align: left;
      cursor: pointer;
    }
    .emr-bnd__patient-btn:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; border-radius: 4px; }
    .emr-bnd__muted { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-bnd__badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .emr-bnd__pager { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  `],
})
export class EmrBookedNotDeliveredListComponent {
  readonly model = input.required<EmrBookedNotDeliveredModel>();
  readonly labels = input<Partial<EmrDeskLabels>>({});
  readonly intent = output<EmrBookedNotDeliveredIntent>();

  protected readonly uid = `emr-bnd-${++nextDeskId}`;
  protected readonly text = computed(() => ({ ...DEFAULT_DESK_LABELS, ...this.labels() }));
  protected readonly centreOptions = computed(() => [
    { value: '', label: this.text().allCentres },
    ...this.model().filters.centreOptions.map((o) => ({ value: o.id, label: o.label })),
  ]);

  protected emitFilter(patch: EmrBookedFilters): void {
    const f = this.model().filters;
    this.intent.emit({
      type: 'filterChanged',
      centreId: f.selectedCentreId,
      bookedFrom: f.bookedFrom,
      bookedTo: f.bookedTo,
      ...patch,
    });
  }
}
