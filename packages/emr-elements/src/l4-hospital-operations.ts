import { css, html, nothing } from 'lit';
import type { EmrBadge } from '@drguptavivek/emr-controller';
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement, emrShadowStyles } from './foundations.js';

// ===========================================================================
// Types & Pure Helpers
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

const CALENDAR_VIEW_MODES: readonly {
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

const WAITLIST_FILTERS: readonly {
  readonly id: WaitlistQueueFilter;
  readonly label: string;
}[] = [
  { id: 'all', label: 'All Patients' },
  { id: 'stat', label: 'STAT Only' },
  { id: 'breached', label: 'SLA Breached' },
  { id: 'waiting', label: 'Waiting' },
];

const WAITLIST_PRIORITIES: readonly WaitlistPriorityTier[] = [
  'stat',
  'urgent',
  'routine',
];

const WAITLIST_STATUSES: readonly WaitlistQueueStatus[] = [
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

const WARD_STATUS_FILTERS: readonly {
  readonly id: WardBedStatusFilter;
  readonly label: string;
}[] = [
  { id: 'all', label: 'All Beds' },
  { id: 'occupied', label: 'Occupied' },
  { id: 'available', label: 'Available' },
  { id: 'housekeeping-dirty', label: 'Housekeeping Dirty' },
  { id: 'isolation', label: 'Isolation' },
];

const WARD_BED_STATUSES: readonly WardBedStatus[] = [
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

const SBAR_SEVERITY_OPTIONS: readonly {
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

const opsStyles = css`
  .ops-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }
  .ops-card {
    border: 1px solid var(--emr-border);
    border-radius: 10px;
    background: var(--emr-surface-raised, var(--emr-surface));
    padding: 12px;
    display: grid;
    gap: 10px;
  }
  .ops-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .ops-chip {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--emr-border);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    cursor: pointer;
  }
  .ops-chip[aria-pressed='true'] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
`;

// ===========================================================================
// 1. EmrAppointmentCalendarElement (`emr-appointment-calendar`)
// ===========================================================================

export class EmrAppointmentCalendarElement extends EmrModelElement<
  EmrAppointmentCalendarViewModel,
  EmrAppointmentCalendarIntent
> {
  static override styles = [emrShadowStyles, opsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const summary = summarizeScheduleUtilization(m.appointments);

    return this.panel(
      m.title ?? 'Outpatient Clinic & Operating Theatre Schedule',
      html`
        <div class="ops-row">
          <span class="emr-badge">Date: ${m.activeDate}</span>
          <span class="emr-badge">Total: ${summary.totalCount}</span>
          <span class="emr-badge">Checked-In / Active: ${summary.checkedInCount}</span>
          ${summary.conflictCount > 0
            ? html`<span class="emr-badge">Conflicts: ${summary.conflictCount}</span>`
            : nothing}
        </div>

        <div class="ops-row" role="group" aria-label="Calendar view mode">
          ${CALENDAR_VIEW_MODES.map(
            (mode) => html`
              <button
                type="button"
                class="ops-chip"
                aria-pressed=${(m.viewMode ?? 'resource-grid') === mode.id
                  ? 'true'
                  : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'viewModeChanged', viewMode: mode.id });
                  }
                }}
              >
                ${mode.label}
              </button>
            `,
          )}
        </div>

        <div class="ops-grid">
          ${m.resources.map((res) => {
            const appts = m.appointments.filter((a) => a.resourceId === res.id);
            return html`
              <article class="ops-card" aria-label=${`Resource column ${res.name}`}>
                <header class="ops-row">
                  <strong>${res.name}</strong>
                  ${res.roleOrLocation ? html`<span>${res.roleOrLocation}</span>` : nothing}
                  ${res.utilizationPct !== undefined
                    ? html`<span class="emr-badge">${res.utilizationPct}% Utilized</span>`
                    : nothing}
                </header>

                <div class="ops-row" role="group" aria-label=${`Slots ${res.name}`}>
                  ${m.slots.map(
                    (slot) => html`
                      <button
                        type="button"
                        class="ops-chip"
                        ?disabled=${readOnly}
                        @click=${() => {
                          if (!readOnly) {
                            this.send({
                              type: 'slotBookRequested',
                              resourceId: res.id,
                              startTime: slot,
                            });
                          }
                        }}
                      >
                        + ${slot}
                      </button>
                    `,
                  )}
                </div>

                ${appts.map(
                  (apt) => html`
                    <div class="ops-card">
                      <div class="ops-row">
                        <button
                          type="button"
                          class="ops-chip"
                          aria-pressed=${m.selectedAppointmentId === apt.id
                            ? 'true'
                            : 'false'}
                          @click=${() =>
                            this.send({
                              type: 'appointmentSelected',
                              appointmentId: apt.id,
                            })}
                        >
                          ${apt.startTime} (${apt.durationMinutes}m) · ${apt.patientName}
                        </button>
                        <span class="emr-badge">${apt.status}</span>
                        ${apt.conflictFlag
                          ? html`<span class="emr-badge">OVERBOOK CONFLICT</span>`
                          : nothing}
                      </div>
                      <p>${apt.visitType}${apt.mrn ? ` · ${apt.mrn}` : ''}</p>
                      <div class="ops-row">
                        ${APPOINTMENT_STATUSES.map(
                          (st) => html`
                            <button
                              type="button"
                              class="ops-chip"
                              aria-pressed=${apt.status === st ? 'true' : 'false'}
                              ?disabled=${readOnly}
                              @click=${() => {
                                if (!readOnly) {
                                  this.send({
                                    type: 'appointmentStatusChanged',
                                    appointmentId: apt.id,
                                    status: st,
                                  });
                                }
                              }}
                            >
                              ${st}
                            </button>
                          `,
                        )}
                      </div>
                    </div>
                  `,
                )}
              </article>
            `;
          })}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 2. EmrWaitlistQueueElement (`emr-waitlist-queue`)
// ===========================================================================

export class EmrWaitlistQueueElement extends EmrModelElement<
  EmrWaitlistQueueViewModel,
  EmrWaitlistQueueIntent
> {
  static override styles = [emrShadowStyles, opsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const sla = evaluateWaitlistSlaSummary(m.entries);

    return this.panel(
      m.title ?? 'Patient Waitlist & Token Queue',
      html`
        <div class="ops-row">
          <span class="emr-badge">Waiting: ${sla.waitingCount}</span>
          <span class="emr-badge">SLA Breached: ${sla.breachedCount}</span>
          <span class="emr-badge">Max Wait: ${sla.maxWaitMinutes}m</span>
        </div>

        <div class="ops-row" role="group" aria-label="Waitlist queue filter">
          ${WAITLIST_FILTERS.map(
            (flt) => html`
              <button
                type="button"
                class="ops-chip"
                aria-pressed=${(m.activeFilter ?? 'all') === flt.id
                  ? 'true'
                  : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'filterChanged', filter: flt.id });
                  }
                }}
              >
                ${flt.label}
              </button>
            `,
          )}
        </div>

        <table class="emr-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Priority</th>
              <th>Room</th>
              <th>Wait / SLA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${m.entries.map(
              (entry) => html`
                <tr>
                  <td><strong>${entry.tokenNumber}</strong></td>
                  <td>${entry.patientName}</td>
                  <td>
                    <div class="ops-row">
                      ${WAITLIST_PRIORITIES.map(
                        (prio) => html`
                          <button
                            type="button"
                            class="ops-chip"
                            aria-pressed=${entry.priority === prio
                              ? 'true'
                              : 'false'}
                            ?disabled=${readOnly}
                            @click=${() => {
                              if (!readOnly) {
                                this.send({
                                  type: 'priorityChanged',
                                  entryId: entry.id,
                                  priority: prio,
                                });
                              }
                            }}
                          >
                            ${prio}
                          </button>
                        `,
                      )}
                    </div>
                  </td>
                  <td>${entry.departmentOrRoom}</td>
                  <td>
                    ${entry.waitMinutes}m / ${entry.slaTargetMinutes}m
                    ${entry.waitMinutes > entry.slaTargetMinutes ? ' (BREACH)' : ''}
                  </td>
                  <td>
                    <div class="ops-row">
                      <button
                        type="button"
                        class="ops-chip"
                        ?disabled=${readOnly}
                        @click=${() => {
                          if (!readOnly) {
                            this.send({
                              type: 'patientCalled',
                              entryId: entry.id,
                              tokenNumber: entry.tokenNumber,
                            });
                          }
                        }}
                      >
                        Call ${entry.tokenNumber}
                      </button>
                      ${WAITLIST_STATUSES.map(
                        (st) => html`
                          <button
                            type="button"
                            class="ops-chip"
                            aria-pressed=${entry.status === st
                              ? 'true'
                              : 'false'}
                            ?disabled=${readOnly}
                            @click=${() => {
                              if (!readOnly) {
                                this.send({
                                  type: 'entryStatusChanged',
                                  entryId: entry.id,
                                  status: st,
                                });
                              }
                            }}
                          >
                            ${st}
                          </button>
                        `,
                      )}
                    </div>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      `,
    );
  }
}

// ===========================================================================
// 3. EmrWardBedBoardElement (`emr-ward-bed-board`)
// ===========================================================================

export class EmrWardBedBoardElement extends EmrModelElement<
  EmrWardBedBoardViewModel,
  EmrWardBedBoardIntent
> {
  static override styles = [emrShadowStyles, opsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const census = computeWardCensusOccupancy(m.beds);

    return this.panel(
      m.title ?? m.wardName,
      html`
        <div class="ops-row">
          <span class="emr-badge">
            Occupancy: ${census.occupiedBeds}/${census.totalBeds} (${census.occupancyPct}%)
          </span>
          <span class="emr-badge">Available: ${census.availableBeds}</span>
          ${census.dirtyBeds > 0
            ? html`<span class="emr-badge">Dirty: ${census.dirtyBeds}</span>`
            : nothing}
        </div>

        <div class="ops-row" role="group" aria-label="Ward bed status filter">
          ${WARD_STATUS_FILTERS.map(
            (flt) => html`
              <button
                type="button"
                class="ops-chip"
                aria-pressed=${(m.activeStatusFilter ?? 'all') === flt.id
                  ? 'true'
                  : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({ type: 'statusFilterChanged', filter: flt.id });
                  }
                }}
              >
                ${flt.label}
              </button>
            `,
          )}
        </div>

        <div class="ops-grid">
          ${m.beds.map(
            (bed) => html`
              <article class="ops-card" aria-label=${`Bed ${bed.bedNumber}`}>
                <header class="ops-row">
                  <button
                    type="button"
                    class="ops-chip"
                    aria-pressed=${m.selectedBedId === bed.id ? 'true' : 'false'}
                    @click=${() =>
                      this.send({ type: 'bedSelected', bedId: bed.id })}
                  >
                    ${bed.bedNumber}${bed.roomLabel ? ` · ${bed.roomLabel}` : ''}
                  </button>
                  <span class="emr-badge">${bed.status}</span>
                  ${bed.isolationType && bed.isolationType !== 'none'
                    ? html`<span class="emr-badge">ISO: ${bed.isolationType}</span>`
                    : nothing}
                  ${bed.dischargePlannedToday
                    ? html`<span class="emr-badge">Discharge Today</span>`
                    : nothing}
                </header>

                <p>
                  ${bed.patientName
                    ? `${bed.patientName}${bed.mrn ? ` (${bed.mrn})` : ''}${
                        bed.ewsScore !== undefined ? ` · EWS ${bed.ewsScore}` : ''
                      }`
                    : 'Unoccupied Bed'}
                </p>

                <div class="ops-row">
                  ${WARD_BED_STATUSES.map(
                    (st) => html`
                      <button
                        type="button"
                        class="ops-chip"
                        aria-pressed=${bed.status === st ? 'true' : 'false'}
                        ?disabled=${readOnly}
                        @click=${() => {
                          if (!readOnly) {
                            this.send({
                              type: 'bedStatusChanged',
                              bedId: bed.id,
                              status: st,
                            });
                          }
                        }}
                      >
                        ${st}
                      </button>
                    `,
                  )}
                  <button
                    type="button"
                    class="ops-chip"
                    ?disabled=${readOnly}
                    @click=${() => {
                      if (!readOnly) {
                        this.send({
                          type: 'transferRequested',
                          fromBedId: bed.id,
                        });
                      }
                    }}
                  >
                    Transfer
                  </button>
                </div>
              </article>
            `,
          )}
        </div>
      `,
    );
  }
}

// ===========================================================================
// 4. EmrSbarHandoverElement (`emr-sbar-handover`)
// ===========================================================================

export class EmrSbarHandoverElement extends EmrModelElement<
  EmrSbarHandoverViewModel,
  EmrSbarHandoverIntent
> {
  static override styles = [emrShadowStyles, opsStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const readOnly = !!m.readOnly;
    const readiness = summarizeSbarReadiness(m);

    return this.panel(
      m.title ?? `${m.patientName}${m.bedLabel ? ` · ${m.bedLabel}` : ''}`,
      html`
        <div class="ops-row">
          <strong>${m.patientName}${m.bedLabel ? ` · ${m.bedLabel}` : ''}</strong>
          <span class="emr-badge">Shift: ${m.shiftLabel}</span>
          <span class="emr-badge">Severity: ${m.illnessSeverity}</span>
          <span class="emr-badge">
            Actions: ${readiness.completedActionCount}/${m.actionItems.length} Done
          </span>
        </div>

        <div class="ops-row" role="group" aria-label="Illness severity classification">
          ${SBAR_SEVERITY_OPTIONS.map(
            (sev) => html`
              <button
                type="button"
                class="ops-chip"
                aria-pressed=${m.illnessSeverity === sev.id ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({
                      type: 'illnessSeverityChanged',
                      severity: sev.id,
                    });
                  }
                }}
              >
                ${sev.label}
              </button>
            `,
          )}
        </div>

        <div class="ops-grid">
          <label class="ops-card">
            <strong>S — Situation</strong>
            <input
              type="text"
              aria-label="Situation narrative"
              .value=${m.situation}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  this.send({
                    type: 'sectionEdited',
                    section: 'situation',
                    text: (e.target as HTMLInputElement).value,
                  });
                }
              }}
            />
          </label>
          <label class="ops-card">
            <strong>B — Background</strong>
            <input
              type="text"
              aria-label="Background narrative"
              .value=${m.background}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  this.send({
                    type: 'sectionEdited',
                    section: 'background',
                    text: (e.target as HTMLInputElement).value,
                  });
                }
              }}
            />
          </label>
          <label class="ops-card">
            <strong>A — Assessment</strong>
            <input
              type="text"
              aria-label="Assessment narrative"
              .value=${m.assessment}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  this.send({
                    type: 'sectionEdited',
                    section: 'assessment',
                    text: (e.target as HTMLInputElement).value,
                  });
                }
              }}
            />
          </label>
          <label class="ops-card">
            <strong>R — Recommendation</strong>
            <input
              type="text"
              aria-label="Recommendation narrative"
              .value=${m.recommendation}
              ?disabled=${readOnly}
              @change=${(e: Event) => {
                if (!readOnly) {
                  this.send({
                    type: 'sectionEdited',
                    section: 'recommendation',
                    text: (e.target as HTMLInputElement).value,
                  });
                }
              }}
            />
          </label>
        </div>

        <div class="ops-row" role="group" aria-label="Actionable pending to-do checklist">
          ${m.actionItems.map(
            (item) => html`
              <button
                type="button"
                class="ops-chip"
                aria-pressed=${item.completed ? 'true' : 'false'}
                ?disabled=${readOnly}
                @click=${() => {
                  if (!readOnly) {
                    this.send({
                      type: 'actionItemToggled',
                      itemId: item.id,
                      completed: !item.completed,
                    });
                  }
                }}
              >
                ${item.completed ? '✓ ' : '○ '}${item.label}
              </button>
            `,
          )}
        </div>

        <div class="ops-row">
          <span>
            Outgoing: ${m.outgoingClinician}
            ${m.incomingClinician ? ` · Incoming: ${m.incomingClinician}` : ''}
          </span>
          <button
            type="button"
            class="ops-chip"
            aria-pressed=${m.acknowledged ? 'true' : 'false'}
            ?disabled=${readOnly || m.acknowledged}
            @click=${() => {
              if (!readOnly && !m.acknowledged) {
                this.send({
                  type: 'handoverAcknowledged',
                  incomingClinician: m.incomingClinician,
                });
              }
            }}
          >
            ${m.acknowledged
              ? '✓ Handover Acknowledged'
              : 'Acknowledge SBAR Handover'}
          </button>
        </div>
      `,
    );
  }
}

export function registerL4HospitalOperationsElements(): void {
  defineEmrElement('emr-appointment-calendar', EmrAppointmentCalendarElement);
  defineEmrElement('emr-waitlist-queue', EmrWaitlistQueueElement);
  defineEmrElement('emr-ward-bed-board', EmrWardBedBoardElement);
  defineEmrElement('emr-sbar-handover', EmrSbarHandoverElement);
}
