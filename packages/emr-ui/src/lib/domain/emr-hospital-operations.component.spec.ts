import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type {
  EmrAppointmentCalendarIntent,
  EmrAppointmentCalendarViewModel,
  EmrSbarHandoverIntent,
  EmrSbarHandoverViewModel,
  EmrWaitlistQueueIntent,
  EmrWaitlistQueueViewModel,
  EmrWardBedBoardIntent,
  EmrWardBedBoardViewModel,
} from './emr-hospital-operations.component';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-hospital-operations.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

function loadHospitalOperationsModule() {
  const withoutDecorators = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class Emr)/g,
    '',
  );
  const transpiled = ts.transpileModule(withoutDecorators, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const makeSignal = <T>(initial: T) => {
    let val = initial;
    const sig = () => val;
    sig.set = (next: T) => {
      val = next;
    };
    return sig;
  };

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        Component: () => (cls: unknown) => cls,
        input: Object.assign(
          <T>(init?: T) => makeSignal<T | undefined>(init),
          { required: <T>() => makeSignal<T | undefined>(undefined) },
        ),
        output: <T>() => {
          const listeners: ((v: T) => void)[] = [];
          return {
            emit: (v: T) => listeners.forEach((l) => l(v)),
            subscribe: (l: (v: T) => void) => listeners.push(l),
          };
        },
      };
    }
    return {};
  };

  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(exportsObj, mockRequire, moduleObj);
  return moduleObj.exports as {
    EmrAppointmentCalendarComponent: new () => Record<string, any>;
    EmrWaitlistQueueComponent: new () => Record<string, any>;
    EmrWardBedBoardComponent: new () => Record<string, any>;
    EmrSbarHandoverComponent: new () => Record<string, any>;
    summarizeScheduleUtilization: (appts: readonly any[]) => {
      totalCount: number;
      checkedInCount: number;
      conflictCount: number;
      noShowCount: number;
    };
    evaluateWaitlistSlaSummary: (entries: readonly any[]) => {
      waitingCount: number;
      breachedCount: number;
      maxWaitMinutes: number;
    };
    computeWardCensusOccupancy: (beds: readonly any[]) => {
      totalBeds: number;
      occupiedBeds: number;
      availableBeds: number;
      dirtyBeds: number;
      occupancyPct: number;
    };
    summarizeSbarReadiness: (model: any) => {
      openActionCount: number;
      completedActionCount: number;
      isReadyToAcknowledge: boolean;
    };
  };
}

const mod = loadHospitalOperationsModule();

describe('L4 Hospital Operations Suite (Angular)', () => {
  it('enforces design-token-only styling, zero browser globals, and zero runtime controller imports', () => {
    expect(componentSource).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
    expect(componentSource).not.toMatch(
      /\b(?:window|document|navigator|localStorage|sessionStorage|fetch)\b/,
    );
    expect(componentSource).toContain('import type {');
    expect(componentSource).toContain("from '@drguptavivek/emr-controller';");
  });

  describe('EmrAppointmentCalendarComponent', () => {
    const calendarModel: EmrAppointmentCalendarViewModel = {
      id: 'cal-1',
      title: 'Outpatient & OT Resource Schedule',
      activeDate: '2026-11-12',
      viewMode: 'resource-grid',
      resources: [
        {
          id: 'res-1',
          name: 'Dr. Vivek Gupta',
          roleOrLocation: 'OPD Room 1',
          utilizationPct: 92,
        },
      ],
      slots: ['09:00', '09:30'],
      appointments: [
        {
          id: 'apt-1',
          resourceId: 'res-1',
          startTime: '09:00',
          durationMinutes: 30,
          patientName: 'Aarav Sharma',
          mrn: 'MRN-1001',
          visitType: 'Cataract Workup',
          status: 'checked-in',
          conflictFlag: true,
        },
        {
          id: 'apt-2',
          resourceId: 'res-1',
          startTime: '09:30',
          durationMinutes: 30,
          patientName: 'Meera Patel',
          visitType: 'Glaucoma Review',
          status: 'no-show',
        },
      ],
    };

    it('summarizes schedule utilization and emits viewModeChanged, appointmentSelected, appointmentStatusChanged, and slotBookRequested', () => {
      const instance = new mod.EmrAppointmentCalendarComponent();
      const emitted: EmrAppointmentCalendarIntent[] = [];
      instance.intent.subscribe((i: EmrAppointmentCalendarIntent) => emitted.push(i));
      instance.model.set(calendarModel);

      expect(instance.utilizationSummary()).toEqual({
        totalCount: 2,
        checkedInCount: 1,
        conflictCount: 1,
        noShowCount: 1,
      });
      expect(instance.appointmentsForResource('res-1')).toHaveLength(2);

      instance.setViewMode('day');
      expect(emitted.at(-1)).toEqual({ type: 'viewModeChanged', viewMode: 'day' });

      instance.selectAppointment('apt-1');
      expect(emitted.at(-1)).toEqual({
        type: 'appointmentSelected',
        appointmentId: 'apt-1',
      });

      instance.setAppointmentStatus('apt-1', 'in-room');
      expect(emitted.at(-1)).toEqual({
        type: 'appointmentStatusChanged',
        appointmentId: 'apt-1',
        status: 'in-room',
      });

      instance.requestSlotBook('res-1', '09:30');
      expect(emitted.at(-1)).toEqual({
        type: 'slotBookRequested',
        resourceId: 'res-1',
        startTime: '09:30',
      });
    });
  });

  describe('EmrWaitlistQueueComponent', () => {
    const waitlistModel: EmrWaitlistQueueViewModel = {
      id: 'wq-1',
      title: 'Live Clinic Token Queue',
      activeFilter: 'all',
      entries: [
        {
          id: 'e-1',
          tokenNumber: 'OPD-101',
          patientName: 'Suresh Menon',
          priority: 'stat',
          departmentOrRoom: 'Acute Triage 1',
          waitMinutes: 24,
          slaTargetMinutes: 15,
          status: 'waiting',
        },
        {
          id: 'e-2',
          tokenNumber: 'OPD-102',
          patientName: 'Lakshmi Nair',
          priority: 'routine',
          departmentOrRoom: 'Refraction 2',
          waitMinutes: 10,
          slaTargetMinutes: 20,
          status: 'called',
        },
      ],
    };

    it('evaluates SLA breaches and emits filterChanged, patientCalled, entryStatusChanged, and priorityChanged', () => {
      const instance = new mod.EmrWaitlistQueueComponent();
      const emitted: EmrWaitlistQueueIntent[] = [];
      instance.intent.subscribe((i: EmrWaitlistQueueIntent) => emitted.push(i));
      instance.model.set(waitlistModel);

      expect(instance.slaSummary()).toEqual({
        waitingCount: 1,
        breachedCount: 1,
        maxWaitMinutes: 24,
      });
      expect(instance.visibleEntries()).toHaveLength(2);

      instance.setFilter('breached');
      expect(emitted.at(-1)).toEqual({ type: 'filterChanged', filter: 'breached' });

      instance.callPatient(waitlistModel.entries[0]!);
      expect(emitted.at(-1)).toEqual({
        type: 'patientCalled',
        entryId: 'e-1',
        tokenNumber: 'OPD-101',
      });

      instance.setEntryStatus('e-1', 'in-service');
      expect(emitted.at(-1)).toEqual({
        type: 'entryStatusChanged',
        entryId: 'e-1',
        status: 'in-service',
      });

      instance.setPriority('e-2', 'urgent');
      expect(emitted.at(-1)).toEqual({
        type: 'priorityChanged',
        entryId: 'e-2',
        priority: 'urgent',
      });
    });
  });

  describe('EmrWardBedBoardComponent', () => {
    const wardModel: EmrWardBedBoardViewModel = {
      id: 'ward-1',
      wardName: 'Surgical Inpatient Ward 4A',
      activeStatusFilter: 'all',
      beds: [
        {
          id: 'b-1',
          bedNumber: '4A-01',
          status: 'occupied',
          patientName: 'Rajesh Khanna',
          ewsScore: 2,
          dischargePlannedToday: true,
        },
        {
          id: 'b-2',
          bedNumber: '4A-02',
          status: 'available',
        },
      ],
    };

    it('computes ward census occupancy and emits statusFilterChanged, bedSelected, bedStatusChanged, and transferRequested', () => {
      const instance = new mod.EmrWardBedBoardComponent();
      const emitted: EmrWardBedBoardIntent[] = [];
      instance.intent.subscribe((i: EmrWardBedBoardIntent) => emitted.push(i));
      instance.model.set(wardModel);

      expect(instance.censusSummary()).toEqual({
        totalBeds: 2,
        occupiedBeds: 1,
        availableBeds: 1,
        dirtyBeds: 0,
        occupancyPct: 50,
      });

      instance.setStatusFilter('available');
      expect(emitted.at(-1)).toEqual({
        type: 'statusFilterChanged',
        filter: 'available',
      });

      instance.selectBed('b-1');
      expect(emitted.at(-1)).toEqual({ type: 'bedSelected', bedId: 'b-1' });

      instance.setBedStatus('b-2', 'housekeeping-dirty');
      expect(emitted.at(-1)).toEqual({
        type: 'bedStatusChanged',
        bedId: 'b-2',
        status: 'housekeeping-dirty',
      });

      instance.requestTransfer('b-1');
      expect(emitted.at(-1)).toEqual({
        type: 'transferRequested',
        fromBedId: 'b-1',
      });
    });
  });

  describe('EmrSbarHandoverComponent', () => {
    const sbarModel: EmrSbarHandoverViewModel = {
      id: 'sbar-1',
      shiftLabel: 'Night → Morning Handover',
      patientName: 'Ananya Deshmukh',
      bedLabel: 'ICU-04',
      illnessSeverity: 'watcher',
      situation: 'Post-op PPV with elevated IOP 32 mmHg.',
      background: '64F diabetic vitrectomy yesterday.',
      assessment: 'IOP improved to 21 mmHg after IV Mannitol.',
      recommendation: 'Repeat IOP at 09:00 and check gas fill.',
      actionItems: [
        {
          id: 'act-1',
          label: 'Repeat Goldmann IOP at 09:00',
          dueByLabel: '09:00',
          completed: false,
          priority: 'stat',
        },
      ],
      outgoingClinician: 'Dr. Neha Kulkarni',
      incomingClinician: 'Dr. Arjun Rao',
      acknowledged: false,
    };

    it('summarizes SBAR readiness and emits illnessSeverityChanged, actionItemToggled, sectionEdited, and handoverAcknowledged', () => {
      const instance = new mod.EmrSbarHandoverComponent();
      const emitted: EmrSbarHandoverIntent[] = [];
      instance.intent.subscribe((i: EmrSbarHandoverIntent) => emitted.push(i));
      instance.model.set(sbarModel);

      expect(instance.readinessSummary()).toEqual({
        openActionCount: 1,
        completedActionCount: 0,
        isReadyToAcknowledge: true,
      });

      instance.setIllnessSeverity('unstable-critical');
      expect(emitted.at(-1)).toEqual({
        type: 'illnessSeverityChanged',
        severity: 'unstable-critical',
      });

      instance.toggleActionItem(sbarModel.actionItems[0]!);
      expect(emitted.at(-1)).toEqual({
        type: 'actionItemToggled',
        itemId: 'act-1',
        completed: true,
      });

      instance.editSection('recommendation', 'Recheck IOP q2h.');
      expect(emitted.at(-1)).toEqual({
        type: 'sectionEdited',
        section: 'recommendation',
        text: 'Recheck IOP q2h.',
      });

      instance.acknowledgeHandover();
      expect(emitted.at(-1)).toEqual({
        type: 'handoverAcknowledged',
        incomingClinician: 'Dr. Arjun Rao',
      });
    });
  });
});
