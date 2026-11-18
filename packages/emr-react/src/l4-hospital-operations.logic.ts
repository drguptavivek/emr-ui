import type {
  AppointmentCalendarItem,
  AppointmentCalendarViewMode,
  AppointmentResourceColumn,
  AppointmentStatus,
  EmrAppointmentCalendarIntent,
  EmrAppointmentCalendarViewModel,
  EmrBadge,
  EmrSbarHandoverIntent,
  EmrSbarHandoverViewModel,
  EmrWaitlistQueueIntent,
  EmrWaitlistQueueViewModel,
  EmrWardBedBoardIntent,
  EmrWardBedBoardViewModel,
  SbarActionItem,
  SbarIllnessSeverity,
  SbarSectionKey,
  WaitlistPriorityTier,
  WaitlistQueueEntry,
  WaitlistQueueFilter,
  WaitlistQueueStatus,
  WardBedCell,
  WardBedStatus,
  WardBedStatusFilter,
  WardIsolationPrecaution,
} from '@drguptavivek/emr-controller';

export type {
  AppointmentCalendarItem,
  AppointmentCalendarViewMode,
  AppointmentResourceColumn,
  AppointmentStatus,
  EmrAppointmentCalendarIntent,
  EmrAppointmentCalendarViewModel,
  EmrBadge,
  EmrSbarHandoverIntent,
  EmrSbarHandoverViewModel,
  EmrWaitlistQueueIntent,
  EmrWaitlistQueueViewModel,
  EmrWardBedBoardIntent,
  EmrWardBedBoardViewModel,
  SbarActionItem,
  SbarIllnessSeverity,
  SbarSectionKey,
  WaitlistPriorityTier,
  WaitlistQueueEntry,
  WaitlistQueueFilter,
  WaitlistQueueStatus,
  WardBedCell,
  WardBedStatus,
  WardBedStatusFilter,
  WardIsolationPrecaution,
};

// ===========================================================================
// 1. EmrAppointmentCalendar — Multi-resource clinic & OT scheduling calendar
// ===========================================================================

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  'booked',
  'checked-in',
  'in-room',
  'completed',
  'cancelled',
  'no-show',
];

export const CALENDAR_VIEW_MODE_OPTIONS: readonly {
  readonly id: AppointmentCalendarViewMode;
  readonly label: string;
}[] = [
  { id: 'day', label: 'Day View' },
  { id: 'week', label: 'Week View' },
  { id: 'resource-grid', label: 'Resource Grid' },
];

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

export const WAITLIST_FILTER_OPTIONS: readonly {
  readonly id: WaitlistQueueFilter;
  readonly label: string;
}[] = [
  { id: 'all', label: 'All Patients' },
  { id: 'stat', label: 'STAT Only' },
  { id: 'breached', label: 'SLA Breached' },
  { id: 'waiting', label: 'Waiting' },
];

export const WAITLIST_PRIORITY_OPTIONS: readonly WaitlistPriorityTier[] = [
  'stat',
  'urgent',
  'routine',
];

export const WAITLIST_STATUS_OPTIONS: readonly WaitlistQueueStatus[] = [
  'waiting',
  'called',
  'in-service',
  'on-hold',
];

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

export function filterWaitlistEntries(
  vm: EmrWaitlistQueueViewModel,
): readonly WaitlistQueueEntry[] {
  const filter = vm.activeFilter ?? 'all';
  if (filter === 'stat') {
    return vm.entries.filter((e) => e.priority === 'stat');
  }
  if (filter === 'breached') {
    return vm.entries.filter((e) => e.waitMinutes > e.slaTargetMinutes);
  }
  if (filter === 'waiting') {
    return vm.entries.filter((e) => e.status === 'waiting');
  }
  return vm.entries;
}

// ===========================================================================
// 3. EmrWardBedBoard — Real-time inpatient ADT ward bed census board
// ===========================================================================

export const WARD_STATUS_FILTER_OPTIONS: readonly {
  readonly id: WardBedStatusFilter;
  readonly label: string;
}[] = [
  { id: 'all', label: 'All Beds' },
  { id: 'occupied', label: 'Occupied' },
  { id: 'available', label: 'Available' },
  { id: 'housekeeping-dirty', label: 'Housekeeping Dirty' },
  { id: 'isolation', label: 'Isolation' },
];

export const WARD_BED_STATUS_OPTIONS: readonly WardBedStatus[] = [
  'occupied',
  'available',
  'housekeeping-dirty',
  'isolation',
  'reserved-transfer',
  'blocked',
];

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

export function filterWardBeds(
  vm: EmrWardBedBoardViewModel,
): readonly WardBedCell[] {
  const filter = vm.activeStatusFilter ?? 'all';
  if (filter === 'all') return vm.beds;
  return vm.beds.filter((b) => b.status === filter);
}

// ===========================================================================
// 4. EmrSbarHandover — Structured SBAR clinical shift handover card
// ===========================================================================

export const SBAR_SEVERITY_CHOICES: readonly {
  readonly id: SbarIllnessSeverity;
  readonly label: string;
}[] = [
  { id: 'stable', label: 'Stable' },
  { id: 'watcher', label: 'Watcher' },
  { id: 'unstable-critical', label: 'Unstable / Critical' },
];

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
