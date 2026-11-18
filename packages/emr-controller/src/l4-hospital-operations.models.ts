import type { EmrBadge } from './models.js';

// ===========================================================================
// 1. EmrAppointmentCalendar — Multi-resource clinic & OT scheduling calendar
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

/**
 * Summarizes schedule utilization counts across all appointments in the view.
 */
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

// ===========================================================================
// 2. EmrWaitlistQueue — Live clinic / OT / diagnostics waitlist & token queue
// ===========================================================================

export type WaitlistPriorityTier = 'stat' | 'urgent' | 'routine';

export type WaitlistQueueStatus = 'waiting' | 'called' | 'in-service' | 'on-hold';

export type WaitlistQueueFilter = 'all' | 'stat' | 'breached' | 'waiting';

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

/**
 * Evaluates live waitlist queue SLA breaches and maximum wait time.
 */
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

// ===========================================================================
// 3. EmrWardBedBoard — Real-time inpatient ADT ward bed census board
// ===========================================================================

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

/**
 * Computes inpatient ward bed census occupancy and housekeeping metrics.
 */
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

// ===========================================================================
// 4. EmrSbarHandover — Structured SBAR clinical shift handover card
// ===========================================================================

export type SbarIllnessSeverity = 'stable' | 'watcher' | 'unstable-critical';

export type SbarSectionKey =
  | 'situation'
  | 'background'
  | 'assessment'
  | 'recommendation';

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

/**
 * Summarizes SBAR handover action item completion and readiness for sign-off.
 */
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
