import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { EmrBadge } from '@drguptavivek/emr-controller';

// ===========================================================================
// Types & Pure Helpers (local to avoid runtime imports from emr-controller)
// ===========================================================================

export type AppointmentCalendarViewMode = 'day' | 'week' | 'resource-grid';

export type AppointmentStatus =
  | 'booked'
  | 'checked-in'
  | 'in-room'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  'booked',
  'checked-in',
  'in-room',
  'completed',
  'cancelled',
  'no-show',
];

export const CALENDAR_VIEW_MODES: readonly {
  readonly id: AppointmentCalendarViewMode;
  readonly label: string;
}[] = [
  { id: 'day', label: 'Day View' },
  { id: 'week', label: 'Week View' },
  { id: 'resource-grid', label: 'Resource Grid' },
];

export interface AppointmentResourceColumn {
  id: string;
  name: string;
  roleOrLocation?: string;
  utilizationPct?: number;
}

export interface AppointmentCalendarItem {
  id: string;
  resourceId: string;
  startTime: string;
  durationMinutes: number;
  patientName: string;
  mrn?: string;
  visitType: string;
  status: AppointmentStatus;
  conflictFlag?: boolean;
  badge?: EmrBadge;
}

export interface EmrAppointmentCalendarViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  activeDate: string;
  viewMode?: AppointmentCalendarViewMode;
  resources: readonly AppointmentResourceColumn[];
  slots: readonly string[];
  appointments: readonly AppointmentCalendarItem[];
  selectedAppointmentId?: string;
  readOnly?: boolean;
}

export type EmrAppointmentCalendarIntent =
  | { type: 'viewModeChanged'; viewMode: AppointmentCalendarViewMode }
  | { type: 'appointmentSelected'; appointmentId: string }
  | { type: 'appointmentStatusChanged'; appointmentId: string; status: AppointmentCalendarItem['status'] }
  | { type: 'slotBookRequested'; resourceId: string; startTime: string };

export function summarizeScheduleUtilization(
  appointments: readonly AppointmentCalendarItem[],
): {
  totalCount: number;
  checkedInCount: number;
  conflictCount: number;
  noShowCount: number;
} {
  let checkedInCount = 0;
  let conflictCount = 0;
  let noShowCount = 0;
  for (const appt of appointments) {
    if (
      appt.status === 'checked-in' ||
      appt.status === 'in-room' ||
      appt.status === 'completed'
    ) {
      checkedInCount += 1;
    }
    if (appt.conflictFlag) {
      conflictCount += 1;
    }
    if (appt.status === 'no-show') {
      noShowCount += 1;
    }
  }
  return {
    totalCount: appointments.length,
    checkedInCount,
    conflictCount,
    noShowCount,
  };
}

export type WaitlistPriorityTier = 'stat' | 'urgent' | 'routine';

export type WaitlistQueueStatus = 'waiting' | 'called' | 'in-service' | 'on-hold';

export type WaitlistQueueFilter = 'all' | 'stat' | 'breached' | 'waiting';

export const WAITLIST_FILTERS: readonly {
  readonly id: WaitlistQueueFilter;
  readonly label: string;
}[] = [
  { id: 'all', label: 'All Patients' },
  { id: 'stat', label: 'STAT Only' },
  { id: 'breached', label: 'SLA Breached' },
  { id: 'waiting', label: 'Waiting' },
];

export const WAITLIST_PRIORITIES: readonly WaitlistPriorityTier[] = [
  'stat',
  'urgent',
  'routine',
];

export const WAITLIST_STATUSES: readonly WaitlistQueueStatus[] = [
  'waiting',
  'called',
  'in-service',
  'on-hold',
];

export interface WaitlistQueueEntry {
  id: string;
  tokenNumber: string;
  patientName: string;
  mrn?: string;
  priority: WaitlistPriorityTier;
  departmentOrRoom: string;
  waitMinutes: number;
  slaTargetMinutes: number;
  status: WaitlistQueueStatus;
  notes?: string;
  badge?: EmrBadge;
}

export interface EmrWaitlistQueueViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  activeFilter?: WaitlistQueueFilter;
  entries: readonly WaitlistQueueEntry[];
  selectedEntryId?: string;
  readOnly?: boolean;
}

export type EmrWaitlistQueueIntent =
  | { type: 'filterChanged'; filter: WaitlistQueueFilter }
  | { type: 'patientCalled'; entryId: string; tokenNumber: string }
  | { type: 'entryStatusChanged'; entryId: string; status: WaitlistQueueEntry['status'] }
  | { type: 'priorityChanged'; entryId: string; priority: WaitlistQueueEntry['priority'] };

export function evaluateWaitlistSlaSummary(
  entries: readonly WaitlistQueueEntry[],
): {
  waitingCount: number;
  breachedCount: number;
  maxWaitMinutes: number;
} {
  let waitingCount = 0;
  let breachedCount = 0;
  let maxWaitMinutes = 0;
  for (const entry of entries) {
    if (entry.status === 'waiting' || entry.status === 'on-hold') {
      waitingCount += 1;
    }
    if (entry.waitMinutes > entry.slaTargetMinutes) {
      breachedCount += 1;
    }
    if (entry.waitMinutes > maxWaitMinutes) {
      maxWaitMinutes = entry.waitMinutes;
    }
  }
  return {
    waitingCount,
    breachedCount,
    maxWaitMinutes,
  };
}

export type WardBedStatus =
  | 'occupied'
  | 'available'
  | 'housekeeping-dirty'
  | 'isolation'
  | 'reserved-transfer'
  | 'blocked';

export type WardIsolationPrecaution =
  | 'none'
  | 'contact'
  | 'droplet'
  | 'airborne'
  | 'neutropenic';

export type WardBedStatusFilter =
  | 'all'
  | 'occupied'
  | 'available'
  | 'housekeeping-dirty'
  | 'isolation';

export const WARD_STATUS_FILTERS: readonly {
  readonly id: WardBedStatusFilter;
  readonly label: string;
}[] = [
  { id: 'all', label: 'All Beds' },
  { id: 'occupied', label: 'Occupied' },
  { id: 'available', label: 'Available' },
  { id: 'housekeeping-dirty', label: 'Housekeeping Dirty' },
  { id: 'isolation', label: 'Isolation' },
];

export const WARD_BED_STATUSES: readonly WardBedStatus[] = [
  'occupied',
  'available',
  'housekeeping-dirty',
  'isolation',
  'reserved-transfer',
  'blocked',
];

export interface WardBedCell {
  id: string;
  bedNumber: string;
  roomLabel?: string;
  status: WardBedStatus;
  isolationType?: WardIsolationPrecaution;
  patientName?: string;
  mrn?: string;
  attendingDoctor?: string;
  losDays?: number;
  ewsScore?: number;
  dischargePlannedToday?: boolean;
  badge?: EmrBadge;
}

export interface EmrWardBedBoardViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  wardName: string;
  activeStatusFilter?: WardBedStatusFilter;
  beds: readonly WardBedCell[];
  selectedBedId?: string;
  readOnly?: boolean;
}

export type EmrWardBedBoardIntent =
  | { type: 'statusFilterChanged'; filter: WardBedStatusFilter }
  | { type: 'bedSelected'; bedId: string }
  | { type: 'bedStatusChanged'; bedId: string; status: WardBedCell['status'] }
  | { type: 'transferRequested'; fromBedId: string };

export function computeWardCensusOccupancy(
  beds: readonly WardBedCell[],
): {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  dirtyBeds: number;
  occupancyPct: number;
} {
  let occupiedBeds = 0;
  let availableBeds = 0;
  let dirtyBeds = 0;
  for (const bed of beds) {
    if (bed.status === 'occupied' || bed.status === 'isolation') {
      occupiedBeds += 1;
    } else if (bed.status === 'available') {
      availableBeds += 1;
    } else if (bed.status === 'housekeeping-dirty') {
      dirtyBeds += 1;
    }
  }
  const totalBeds = beds.length;
  const occupancyPct =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 1000) / 10 : 0;
  return {
    totalBeds,
    occupiedBeds,
    availableBeds,
    dirtyBeds,
    occupancyPct,
  };
}

export type SbarIllnessSeverity = 'stable' | 'watcher' | 'unstable-critical';

export type SbarSectionKey =
  | 'situation'
  | 'background'
  | 'assessment'
  | 'recommendation';

export const SBAR_SEVERITY_OPTIONS: readonly {
  readonly id: SbarIllnessSeverity;
  readonly label: string;
}[] = [
  { id: 'stable', label: 'Stable' },
  { id: 'watcher', label: 'Watcher' },
  { id: 'unstable-critical', label: 'Unstable / Critical' },
];

export interface SbarActionItem {
  id: string;
  label: string;
  dueByLabel?: string;
  completed: boolean;
  priority?: 'stat' | 'urgent' | 'routine';
}

export interface EmrSbarHandoverViewModel {
  id: string;
  title?: string;
  subtitle?: string;
  shiftLabel: string;
  patientName: string;
  bedLabel?: string;
  illnessSeverity: SbarIllnessSeverity;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  actionItems: readonly SbarActionItem[];
  outgoingClinician: string;
  incomingClinician?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  readOnly?: boolean;
}

export type EmrSbarHandoverIntent =
  | { type: 'illnessSeverityChanged'; severity: EmrSbarHandoverViewModel['illnessSeverity'] }
  | { type: 'actionItemToggled'; itemId: string; completed: boolean }
  | { type: 'sectionEdited'; section: SbarSectionKey; text: string }
  | { type: 'handoverAcknowledged'; incomingClinician?: string };

export function summarizeSbarReadiness(
  model: EmrSbarHandoverViewModel,
): {
  openActionCount: number;
  completedActionCount: number;
  isReadyToAcknowledge: boolean;
} {
  let openActionCount = 0;
  let completedActionCount = 0;
  for (const item of model.actionItems) {
    if (item.completed) {
      completedActionCount += 1;
    } else {
      openActionCount += 1;
    }
  }
  const hasAllNarratives =
    model.situation.trim().length > 0 &&
    model.background.trim().length > 0 &&
    model.assessment.trim().length > 0 &&
    model.recommendation.trim().length > 0;
  const isReadyToAcknowledge =
    hasAllNarratives &&
    model.outgoingClinician.trim().length > 0 &&
    !model.acknowledged;
  return {
    openActionCount,
    completedActionCount,
    isReadyToAcknowledge,
  };
}

const SHARED_OPS_STYLES = `
  :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
  .emr-ops-card { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; display: grid; gap: 14px; padding: 16px; }
  .emr-ops-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--emr-border); padding-bottom: 12px; }
  .emr-ops-title-wrap { display: grid; gap: 4px; }
  .emr-ops-tag { display: inline-block; width: fit-content; padding: 2px 8px; border-radius: 6px; background: var(--emr-primary-soft); color: var(--emr-primary); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); letter-spacing: 0.05em; }
  .emr-ops-title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
  .emr-ops-sub { margin: 0; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
  .emr-ops-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .emr-ops-chip { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; }
  .emr-ops-chip[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary); }
  .emr-ops-chip:disabled { opacity: 0.6; cursor: not-allowed; }
  .emr-ops-badge { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--emr-border); background: var(--emr-surface-soft); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
  .emr-ops-badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); border-color: var(--emr-warning); }
  .emr-ops-badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); border-color: var(--emr-danger); }
  .emr-ops-badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); border-color: var(--emr-success); }
  .emr-ops-badge[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); border-color: var(--emr-info); }
  .emr-ops-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
  .emr-ops-panel { border: 1px solid var(--emr-border); border-radius: 10px; background: var(--emr-surface-raised); padding: 12px; display: grid; gap: 10px; min-width: 0; }
  .emr-ops-panel[data-selected="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); }
  .emr-ops-row-between { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
  .emr-ops-kv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin: 0; }
  .emr-ops-kv { padding: 6px 8px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface); }
  .emr-ops-kv dt { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); text-transform: uppercase; font-weight: var(--emr-weight-bold); }
  .emr-ops-kv dd { margin: 2px 0 0; font-family: var(--emr-font-mono); font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
  .emr-ops-table-wrap { overflow-x: auto; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); }
  .emr-ops-table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-xs); }
  .emr-ops-table th, .emr-ops-table td { padding: 6px 8px; border-bottom: 1px solid var(--emr-border); text-align: left; }
  .emr-ops-table thead th { background: var(--emr-surface-soft); color: var(--emr-text-muted); font-weight: var(--emr-weight-bold); text-transform: uppercase; font-size: var(--emr-text-2xs); }
  .emr-ops-input { min-height: var(--emr-compact-height); padding: 4px 8px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font-family: var(--emr-font-family); font-size: var(--emr-text-xs); }
  .emr-ops-alert { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--emr-warning); background: var(--emr-warning-soft); color: var(--emr-text); font-size: var(--emr-text-xs); font-weight: var(--emr-weight-medium); }
  :host-context(.emr-print) .emr-ops-chip { border-color: var(--emr-border); }
`;

// ===========================================================================
// 1. EmrAppointmentCalendarComponent (`emr-appointment-calendar`)
// ===========================================================================

@Component({
  selector: 'emr-appointment-calendar',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let summary = utilizationSummary();
    <section
      class="emr-ops-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Appointment Calendar & Resource Schedule')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-ops-head">
        <div class="emr-ops-title-wrap">
          <span class="emr-ops-tag">MULTI-RESOURCE CLINIC &amp; OT SCHEDULE · {{ m.activeDate }}</span>
          <h3 class="emr-ops-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Outpatient Clinic & Operating Theatre Schedule' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-ops-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-ops-chips">
          <span class="emr-ops-badge" data-tone="info">Total: {{ summary.totalCount }}</span>
          <span class="emr-ops-badge" data-tone="success">Checked-In / Active: {{ summary.checkedInCount }}</span>
          @if (summary.conflictCount > 0) {
            <span class="emr-ops-badge" data-tone="danger">Conflicts: {{ summary.conflictCount }}</span>
          }
          @if (summary.noShowCount > 0) {
            <span class="emr-ops-badge" data-tone="warning">No-Show: {{ summary.noShowCount }}</span>
          }
        </div>
      </header>

      <div class="emr-ops-row-between">
        <div class="emr-ops-chips" role="group" aria-label="Calendar view mode">
          @for (mode of viewModes; track mode.id) {
            <button
              type="button"
              class="emr-ops-chip"
              [attr.aria-pressed]="(m.viewMode ?? 'resource-grid') === mode.id"
              [disabled]="!!m.readOnly"
              (click)="setViewMode(mode.id)"
            >
              {{ mode.label }}
            </button>
          }
        </div>
      </div>

      <div class="emr-ops-grid">
        @for (res of m.resources; track res.id) {
          <article class="emr-ops-panel" [attr.aria-label]="'Resource column ' + res.name">
            <header class="emr-ops-row-between">
              <div>
                <strong>{{ res.name }}</strong>
                @if (res.roleOrLocation) {
                  <div class="emr-ops-sub">{{ res.roleOrLocation }}</div>
                }
              </div>
              @if (res.utilizationPct !== undefined) {
                <span class="emr-ops-badge" [attr.data-tone]="res.utilizationPct >= 90 ? 'warning' : 'info'">
                  {{ res.utilizationPct }}% Utilized
                </span>
              }
            </header>

            <div class="emr-ops-chips" role="group" [attr.aria-label]="'Time slots ' + res.name">
              @for (slot of m.slots; track slot) {
                <button
                  type="button"
                  class="emr-ops-chip"
                  [disabled]="!!m.readOnly"
                  (click)="requestSlotBook(res.id, slot)"
                >
                  + {{ slot }}
                </button>
              }
            </div>

            @for (apt of appointmentsForResource(res.id); track apt.id) {
              <div
                class="emr-ops-panel"
                [attr.data-selected]="m.selectedAppointmentId === apt.id"
              >
                <div class="emr-ops-row-between">
                  <button
                    type="button"
                    class="emr-ops-chip"
                    [attr.aria-pressed]="m.selectedAppointmentId === apt.id"
                    (click)="selectAppointment(apt.id)"
                  >
                    {{ apt.startTime }} ({{ apt.durationMinutes }}m) · {{ apt.patientName }}
                  </button>
                  <div class="emr-ops-chips">
                    <span class="emr-ops-badge" [attr.data-tone]="apt.status === 'cancelled' || apt.status === 'no-show' ? 'danger' : 'info'">
                      {{ apt.status }}
                    </span>
                    @if (apt.conflictFlag) {
                      <span class="emr-ops-badge" data-tone="danger">OVERBOOK CONFLICT</span>
                    }
                    @if (apt.badge) {
                      <span class="emr-ops-badge" [attr.data-tone]="apt.badge.tone">{{ apt.badge.label }}</span>
                    }
                  </div>
                </div>
                <div class="emr-ops-sub">
                  {{ apt.visitType }}{{ apt.mrn ? ' · ' + apt.mrn : '' }}
                </div>
                <div class="emr-ops-chips" role="group" [attr.aria-label]="'Status actions ' + apt.patientName">
                  @for (st of appointmentStatuses; track st) {
                    <button
                      type="button"
                      class="emr-ops-chip"
                      [attr.aria-pressed]="apt.status === st"
                      [disabled]="!!m.readOnly"
                      (click)="setAppointmentStatus(apt.id, st)"
                    >
                      {{ st }}
                    </button>
                  }
                </div>
              </div>
            }
          </article>
        }
      </div>
    </section>
  `,
  styles: [SHARED_OPS_STYLES],
})
export class EmrAppointmentCalendarComponent {
  readonly model = input.required<EmrAppointmentCalendarViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrAppointmentCalendarIntent>();

  readonly viewModes = CALENDAR_VIEW_MODES;
  readonly appointmentStatuses = APPOINTMENT_STATUSES;

  utilizationSummary() {
    return summarizeScheduleUtilization(this.model().appointments);
  }

  appointmentsForResource(resourceId: string): readonly AppointmentCalendarItem[] {
    return this.model().appointments.filter((a) => a.resourceId === resourceId);
  }

  setViewMode(viewMode: AppointmentCalendarViewMode): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'viewModeChanged', viewMode });
  }

  selectAppointment(appointmentId: string): void {
    this.intent.emit({ type: 'appointmentSelected', appointmentId });
  }

  setAppointmentStatus(
    appointmentId: string,
    status: AppointmentCalendarItem['status'],
  ): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'appointmentStatusChanged', appointmentId, status });
  }

  requestSlotBook(resourceId: string, startTime: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'slotBookRequested', resourceId, startTime });
  }
}

// ===========================================================================
// 2. EmrWaitlistQueueComponent (`emr-waitlist-queue`)
// ===========================================================================

@Component({
  selector: 'emr-waitlist-queue',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let sla = slaSummary();
    <section
      class="emr-ops-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Live Waitlist & Token Queue')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-ops-head">
        <div class="emr-ops-title-wrap">
          <span class="emr-ops-tag">LIVE CLINIC &amp; DIAGNOSTICS TOKEN QUEUE</span>
          <h3 class="emr-ops-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Patient Waitlist & Token Queue' }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-ops-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-ops-chips">
          <span class="emr-ops-badge" data-tone="info">Waiting: {{ sla.waitingCount }}</span>
          <span class="emr-ops-badge" [attr.data-tone]="sla.breachedCount > 0 ? 'danger' : 'success'">
            SLA Breached: {{ sla.breachedCount }}
          </span>
          <span class="emr-ops-badge" data-tone="warning">Max Wait: {{ sla.maxWaitMinutes }}m</span>
        </div>
      </header>

      <div class="emr-ops-chips" role="group" aria-label="Waitlist queue filter">
        @for (flt of filters; track flt.id) {
          <button
            type="button"
            class="emr-ops-chip"
            [attr.aria-pressed]="(m.activeFilter ?? 'all') === flt.id"
            [disabled]="!!m.readOnly"
            (click)="setFilter(flt.id)"
          >
            {{ flt.label }}
          </button>
        }
      </div>

      <div class="emr-ops-table-wrap">
        <table class="emr-ops-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Priority</th>
              <th>Station / Room</th>
              <th>Wait / SLA</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of visibleEntries(); track entry.id) {
              <tr>
                <td><strong>{{ entry.tokenNumber }}</strong></td>
                <td>
                  <strong>{{ entry.patientName }}</strong>
                  @if (entry.mrn) {
                    <div class="emr-ops-sub">{{ entry.mrn }}</div>
                  }
                </td>
                <td>
                  <div class="emr-ops-chips">
                    @for (prio of priorities; track prio) {
                      <button
                        type="button"
                        class="emr-ops-chip"
                        [attr.aria-pressed]="entry.priority === prio"
                        [disabled]="!!m.readOnly"
                        (click)="setPriority(entry.id, prio)"
                      >
                        {{ prio }}
                      </button>
                    }
                  </div>
                </td>
                <td>{{ entry.departmentOrRoom }}</td>
                <td>
                  <span
                    class="emr-ops-badge"
                    [attr.data-tone]="entry.waitMinutes > entry.slaTargetMinutes ? 'danger' : 'success'"
                  >
                    {{ entry.waitMinutes }}m / {{ entry.slaTargetMinutes }}m
                    {{ entry.waitMinutes > entry.slaTargetMinutes ? ' (BREACH)' : '' }}
                  </span>
                </td>
                <td>{{ entry.status }}</td>
                <td>
                  <div class="emr-ops-chips">
                    <button
                      type="button"
                      class="emr-ops-chip"
                      [disabled]="!!m.readOnly"
                      (click)="callPatient(entry)"
                    >
                      Call {{ entry.tokenNumber }}
                    </button>
                    @for (st of statuses; track st) {
                      <button
                        type="button"
                        class="emr-ops-chip"
                        [attr.aria-pressed]="entry.status === st"
                        [disabled]="!!m.readOnly"
                        (click)="setEntryStatus(entry.id, st)"
                      >
                        {{ st }}
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [SHARED_OPS_STYLES],
})
export class EmrWaitlistQueueComponent {
  readonly model = input.required<EmrWaitlistQueueViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrWaitlistQueueIntent>();

  readonly filters = WAITLIST_FILTERS;
  readonly priorities = WAITLIST_PRIORITIES;
  readonly statuses = WAITLIST_STATUSES;

  slaSummary() {
    return evaluateWaitlistSlaSummary(this.model().entries);
  }

  visibleEntries(): readonly WaitlistQueueEntry[] {
    const m = this.model();
    const filter = m.activeFilter ?? 'all';
    if (filter === 'stat') {
      return m.entries.filter((e) => e.priority === 'stat');
    }
    if (filter === 'breached') {
      return m.entries.filter((e) => e.waitMinutes > e.slaTargetMinutes);
    }
    if (filter === 'waiting') {
      return m.entries.filter((e) => e.status === 'waiting');
    }
    return m.entries;
  }

  setFilter(filter: WaitlistQueueFilter): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'filterChanged', filter });
  }

  callPatient(entry: WaitlistQueueEntry): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'patientCalled',
      entryId: entry.id,
      tokenNumber: entry.tokenNumber,
    });
  }

  setEntryStatus(entryId: string, status: WaitlistQueueEntry['status']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'entryStatusChanged', entryId, status });
  }

  setPriority(entryId: string, priority: WaitlistQueueEntry['priority']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'priorityChanged', entryId, priority });
  }
}

// ===========================================================================
// 3. EmrWardBedBoardComponent (`emr-ward-bed-board`)
// ===========================================================================

@Component({
  selector: 'emr-ward-bed-board',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let census = censusSummary();
    <section
      class="emr-ops-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? m.wardName)"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-ops-head">
        <div class="emr-ops-title-wrap">
          <span class="emr-ops-tag">INPATIENT ADT WARD BED CENSUS · {{ m.wardName }}</span>
          <h3 class="emr-ops-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? m.wardName }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-ops-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-ops-chips">
          <span class="emr-ops-badge" data-tone="info">
            Occupancy: {{ census.occupiedBeds }}/{{ census.totalBeds }} ({{ census.occupancyPct }}%)
          </span>
          <span class="emr-ops-badge" data-tone="success">Available: {{ census.availableBeds }}</span>
          @if (census.dirtyBeds > 0) {
            <span class="emr-ops-badge" data-tone="warning">Dirty: {{ census.dirtyBeds }}</span>
          }
        </div>
      </header>

      <div class="emr-ops-chips" role="group" aria-label="Ward bed status filter">
        @for (flt of statusFilters; track flt.id) {
          <button
            type="button"
            class="emr-ops-chip"
            [attr.aria-pressed]="(m.activeStatusFilter ?? 'all') === flt.id"
            [disabled]="!!m.readOnly"
            (click)="setStatusFilter(flt.id)"
          >
            {{ flt.label }}
          </button>
        }
      </div>

      <div class="emr-ops-grid">
        @for (bed of visibleBeds(); track bed.id) {
          <article
            class="emr-ops-panel"
            [attr.data-selected]="m.selectedBedId === bed.id"
            [attr.aria-label]="'Bed ' + bed.bedNumber"
          >
            <header class="emr-ops-row-between">
              <button
                type="button"
                class="emr-ops-chip"
                [attr.aria-pressed]="m.selectedBedId === bed.id"
                (click)="selectBed(bed.id)"
              >
                {{ bed.bedNumber }}{{ bed.roomLabel ? ' · ' + bed.roomLabel : '' }}
              </button>
              <div class="emr-ops-chips">
                <span
                  class="emr-ops-badge"
                  [attr.data-tone]="bed.status === 'available' ? 'success' : bed.status === 'isolation' ? 'danger' : 'info'"
                >
                  {{ bed.status }}
                </span>
                @if (bed.isolationType && bed.isolationType !== 'none') {
                  <span class="emr-ops-badge" data-tone="danger">ISO: {{ bed.isolationType }}</span>
                }
                @if (bed.dischargePlannedToday) {
                  <span class="emr-ops-badge" data-tone="warning">Discharge Today</span>
                }
              </div>
            </header>

            @if (bed.patientName) {
              <div>
                <strong>{{ bed.patientName }}</strong>
                <div class="emr-ops-sub">
                  {{ bed.mrn ?? '' }}
                  {{ bed.attendingDoctor ? ' · ' + bed.attendingDoctor : '' }}
                  {{ bed.losDays !== undefined ? ' · LOS ' + bed.losDays + 'd' : '' }}
                  {{ bed.ewsScore !== undefined ? ' · EWS ' + bed.ewsScore : '' }}
                </div>
              </div>
            } @else {
              <div class="emr-ops-sub">Unoccupied Bed</div>
            }

            <div class="emr-ops-chips" role="group" [attr.aria-label]="'Bed status ' + bed.bedNumber">
              @for (st of bedStatuses; track st) {
                <button
                  type="button"
                  class="emr-ops-chip"
                  [attr.aria-pressed]="bed.status === st"
                  [disabled]="!!m.readOnly"
                  (click)="setBedStatus(bed.id, st)"
                >
                  {{ st }}
                </button>
              }
              <button
                type="button"
                class="emr-ops-chip"
                [disabled]="!!m.readOnly"
                (click)="requestTransfer(bed.id)"
              >
                Transfer
              </button>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [SHARED_OPS_STYLES],
})
export class EmrWardBedBoardComponent {
  readonly model = input.required<EmrWardBedBoardViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrWardBedBoardIntent>();

  readonly statusFilters = WARD_STATUS_FILTERS;
  readonly bedStatuses = WARD_BED_STATUSES;

  censusSummary() {
    return computeWardCensusOccupancy(this.model().beds);
  }

  visibleBeds(): readonly WardBedCell[] {
    const m = this.model();
    const filter = m.activeStatusFilter ?? 'all';
    if (filter === 'all') return m.beds;
    return m.beds.filter((b) => b.status === filter);
  }

  setStatusFilter(filter: WardBedStatusFilter): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'statusFilterChanged', filter });
  }

  selectBed(bedId: string): void {
    this.intent.emit({ type: 'bedSelected', bedId });
  }

  setBedStatus(bedId: string, status: WardBedCell['status']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'bedStatusChanged', bedId, status });
  }

  requestTransfer(fromBedId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'transferRequested', fromBedId });
  }
}

// ===========================================================================
// 4. EmrSbarHandoverComponent (`emr-sbar-handover`)
// ===========================================================================

@Component({
  selector: 'emr-sbar-handover',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let readiness = readinessSummary();
    <section
      class="emr-ops-card"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'SBAR Clinical Shift Handover')"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-ops-head">
        <div class="emr-ops-title-wrap">
          <span class="emr-ops-tag">SBAR CLINICAL SHIFT HANDOVER · {{ m.shiftLabel }}</span>
          <h3 class="emr-ops-title" [attr.id]="headingId() ?? null">
            {{ m.title ?? (m.patientName + (m.bedLabel ? ' · ' + m.bedLabel : '')) }}
          </h3>
          @if (m.subtitle) {
            <p class="emr-ops-sub">{{ m.subtitle }}</p>
          }
        </div>
        <div class="emr-ops-chips">
          <span
            class="emr-ops-badge"
            [attr.data-tone]="m.illnessSeverity === 'unstable-critical' ? 'danger' : m.illnessSeverity === 'watcher' ? 'warning' : 'success'"
          >
            Severity: {{ m.illnessSeverity }}
          </span>
          <span class="emr-ops-badge" data-tone="info">
            Actions: {{ readiness.completedActionCount }}/{{ m.actionItems.length }} Done ({{ readiness.openActionCount }} Open)
          </span>
        </div>
      </header>

      <div class="emr-ops-chips" role="group" aria-label="Illness severity classification">
        @for (sev of severityOptions; track sev.id) {
          <button
            type="button"
            class="emr-ops-chip"
            [attr.aria-pressed]="m.illnessSeverity === sev.id"
            [disabled]="!!m.readOnly"
            (click)="setIllnessSeverity(sev.id)"
          >
            {{ sev.label }}
          </button>
        }
      </div>

      <div class="emr-ops-grid">
        <article class="emr-ops-panel" aria-label="Situation">
          <strong>S — Situation</strong>
          <input
            type="text"
            class="emr-ops-input"
            aria-label="Situation narrative"
            [value]="m.situation"
            [disabled]="!!m.readOnly"
            (change)="editSection('situation', $any($event.target).value)"
          />
        </article>
        <article class="emr-ops-panel" aria-label="Background">
          <strong>B — Background</strong>
          <input
            type="text"
            class="emr-ops-input"
            aria-label="Background narrative"
            [value]="m.background"
            [disabled]="!!m.readOnly"
            (change)="editSection('background', $any($event.target).value)"
          />
        </article>
        <article class="emr-ops-panel" aria-label="Assessment">
          <strong>A — Assessment</strong>
          <input
            type="text"
            class="emr-ops-input"
            aria-label="Assessment narrative"
            [value]="m.assessment"
            [disabled]="!!m.readOnly"
            (change)="editSection('assessment', $any($event.target).value)"
          />
        </article>
        <article class="emr-ops-panel" aria-label="Recommendation">
          <strong>R — Recommendation</strong>
          <input
            type="text"
            class="emr-ops-input"
            aria-label="Recommendation narrative"
            [value]="m.recommendation"
            [disabled]="!!m.readOnly"
            (change)="editSection('recommendation', $any($event.target).value)"
          />
        </article>
      </div>

      <article class="emr-ops-panel" aria-label="Pending shift action items">
        <strong>Actionable Pending To-Do Checklist</strong>
        <div class="emr-ops-chips">
          @for (item of m.actionItems; track item.id) {
            <button
              type="button"
              class="emr-ops-chip"
              [attr.aria-pressed]="item.completed"
              [disabled]="!!m.readOnly"
              (click)="toggleActionItem(item)"
            >
              {{ item.completed ? '✓ ' : '○ ' }}{{ item.label }}{{ item.dueByLabel ? ' (' + item.dueByLabel + ')' : '' }}
            </button>
          }
        </div>
      </article>

      <footer class="emr-ops-row-between">
        <div class="emr-ops-sub">
          Outgoing: <strong>{{ m.outgoingClinician }}</strong>
          @if (m.incomingClinician) {
            · Incoming: <strong>{{ m.incomingClinician }}</strong>
          }
          @if (m.acknowledgedAt) {
            · Signed {{ m.acknowledgedAt }}
          }
        </div>
        <button
          type="button"
          class="emr-ops-chip"
          [attr.aria-pressed]="m.acknowledged"
          [disabled]="!!m.readOnly || m.acknowledged"
          (click)="acknowledgeHandover()"
        >
          {{ m.acknowledged ? '✓ Handover Acknowledged' : 'Acknowledge SBAR Handover' }}
        </button>
      </footer>
    </section>
  `,
  styles: [SHARED_OPS_STYLES],
})
export class EmrSbarHandoverComponent {
  readonly model = input.required<EmrSbarHandoverViewModel>();
  readonly headingId = input<string | undefined>(undefined);
  readonly intent = output<EmrSbarHandoverIntent>();

  readonly severityOptions = SBAR_SEVERITY_OPTIONS;

  readinessSummary() {
    return summarizeSbarReadiness(this.model());
  }

  setIllnessSeverity(severity: EmrSbarHandoverViewModel['illnessSeverity']): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'illnessSeverityChanged', severity });
  }

  toggleActionItem(item: SbarActionItem): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'actionItemToggled',
      itemId: item.id,
      completed: !item.completed,
    });
  }

  editSection(section: SbarSectionKey, text: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'sectionEdited', section, text });
  }

  acknowledgeHandover(incomingClinician?: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'handoverAcknowledged',
      incomingClinician: incomingClinician ?? this.model().incomingClinician,
    });
  }
}
