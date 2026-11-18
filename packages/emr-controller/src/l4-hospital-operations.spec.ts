import { describe, expect, it } from 'vitest';
import {
  APPOINTMENT_STATUSES,
  computeWardCensusOccupancy,
  evaluateWaitlistSlaSummary,
  summarizeSbarReadiness,
  summarizeScheduleUtilization,
  type EmrAppointmentCalendarViewModel,
  type EmrSbarHandoverViewModel,
  type EmrWaitlistQueueViewModel,
  type EmrWardBedBoardViewModel,
} from './l4-hospital-operations.models.js';

describe('L4 Hospital Operations models & pure helpers', () => {
  describe('summarizeScheduleUtilization', () => {
    it('computes total, checked-in/in-room/completed, conflict, and no-show counts accurately', () => {
      const summary = summarizeScheduleUtilization([
        {
          id: 'apt-1',
          resourceId: 'res-1',
          startTime: '09:00',
          durationMinutes: 30,
          patientName: 'Aarav Sharma',
          visitType: 'Cataract Pre-Op',
          status: 'checked-in',
        },
        {
          id: 'apt-2',
          resourceId: 'res-1',
          startTime: '09:30',
          durationMinutes: 30,
          patientName: 'Meera Patel',
          visitType: 'Retina OCT Follow-up',
          status: 'in-room',
          conflictFlag: true,
        },
        {
          id: 'apt-3',
          resourceId: 'res-2',
          startTime: '10:00',
          durationMinutes: 15,
          patientName: 'Rohan Verma',
          visitType: 'Glaucoma Visual Field',
          status: 'no-show',
        },
        {
          id: 'apt-4',
          resourceId: 'res-2',
          startTime: '10:30',
          durationMinutes: 30,
          patientName: 'Kavita Iyer',
          visitType: 'Post-Op Day 1',
          status: 'booked',
        },
      ]);

      expect(summary).toEqual({
        totalCount: 4,
        checkedInCount: 2,
        conflictCount: 1,
        noShowCount: 1,
      });
      expect(APPOINTMENT_STATUSES).toContain('checked-in');
    });
  });

  describe('evaluateWaitlistSlaSummary', () => {
    it('evaluates waiting count, SLA breaches, and maximum wait time in minutes', () => {
      const summary = evaluateWaitlistSlaSummary([
        {
          id: 'wq-1',
          tokenNumber: 'OPD-104',
          patientName: 'Suresh Menon',
          priority: 'stat',
          departmentOrRoom: 'Acute Triage Bay 1',
          waitMinutes: 22,
          slaTargetMinutes: 15,
          status: 'waiting',
        },
        {
          id: 'wq-2',
          tokenNumber: 'OPD-105',
          patientName: 'Lakshmi Nair',
          priority: 'urgent',
          departmentOrRoom: 'Diagnostics OCT Room 2',
          waitMinutes: 18,
          slaTargetMinutes: 25,
          status: 'called',
        },
        {
          id: 'wq-3',
          tokenNumber: 'OPD-106',
          patientName: 'Vikram Singh',
          priority: 'routine',
          departmentOrRoom: 'Refraction Cubicle 4',
          waitMinutes: 46,
          slaTargetMinutes: 30,
          status: 'on-hold',
        },
      ]);

      expect(summary).toEqual({
        waitingCount: 2,
        breachedCount: 2,
        maxWaitMinutes: 46,
      });
    });
  });

  describe('computeWardCensusOccupancy', () => {
    it('calculates total beds, occupied/isolation beds, available beds, dirty beds, and occupancy percentage', () => {
      const census = computeWardCensusOccupancy([
        {
          id: 'bed-1',
          bedNumber: '4A-01',
          status: 'occupied',
          patientName: 'Rajesh Khanna',
          ewsScore: 2,
        },
        {
          id: 'bed-2',
          bedNumber: '4A-02',
          status: 'isolation',
          isolationType: 'droplet',
          patientName: 'Fatima Begum',
          ewsScore: 6,
        },
        {
          id: 'bed-3',
          bedNumber: '4A-03',
          status: 'available',
        },
        {
          id: 'bed-4',
          bedNumber: '4A-04',
          status: 'housekeeping-dirty',
        },
      ]);

      expect(census).toEqual({
        totalBeds: 4,
        occupiedBeds: 2,
        availableBeds: 1,
        dirtyBeds: 1,
        occupancyPct: 50,
      });

      expect(computeWardCensusOccupancy([])).toEqual({
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
        dirtyBeds: 0,
        occupancyPct: 0,
      });
    });
  });

  describe('summarizeSbarReadiness', () => {
    it('evaluates open/completed action items and readiness to acknowledge SBAR handover', () => {
      const sbarVm: EmrSbarHandoverViewModel = {
        id: 'sbar-1',
        shiftLabel: 'Night → Morning Shift (07:00)',
        patientName: 'Ananya Deshmukh',
        bedLabel: 'ICU-04',
        illnessSeverity: 'watcher',
        situation: 'Post-op pars plana vitrectomy with elevated IOP 32 mmHg at 05:00.',
        background: '64F with proliferative diabetic retinopathy; underwent PPV + endolaser yesterday.',
        assessment: 'IOP responded to IV Mannitol + topical Dorzolamide-Timolol; currently 21 mmHg.',
        recommendation: 'Recheck applanation IOP at 09:00 and review anterior chamber gas fill.',
        actionItems: [
          {
            id: 'act-1',
            label: 'Repeat Goldmann IOP check at 09:00',
            dueByLabel: '09:00',
            completed: false,
            priority: 'stat',
          },
          {
            id: 'act-2',
            label: 'Administer Acetazolamide 250 mg PO morning dose',
            dueByLabel: '08:00',
            completed: true,
            priority: 'urgent',
          },
        ],
        outgoingClinician: 'Dr. Neha Kulkarni',
        incomingClinician: 'Dr. Arjun Rao',
        acknowledged: false,
      };

      expect(summarizeSbarReadiness(sbarVm)).toEqual({
        openActionCount: 1,
        completedActionCount: 1,
        isReadyToAcknowledge: true,
      });

      expect(
        summarizeSbarReadiness({
          ...sbarVm,
          acknowledged: true,
        }).isReadyToAcknowledge,
      ).toBe(false);
    });
  });

  describe('ViewModel contracts for all 4 Hospital Operations components', () => {
    it('constructs valid ViewModels for AppointmentCalendar, WaitlistQueue, WardBedBoard, and SbarHandover', () => {
      const calendarVm: EmrAppointmentCalendarViewModel = {
        id: 'cal-1',
        title: 'Outpatient & Minor OT Resource Schedule',
        activeDate: '2026-11-12',
        viewMode: 'resource-grid',
        resources: [
          {
            id: 'res-1',
            name: 'Dr. Vivek Gupta',
            roleOrLocation: 'Cornea & Refractive Suite 1',
            utilizationPct: 88,
          },
        ],
        slots: ['09:00', '09:30', '10:00'],
        appointments: [
          {
            id: 'apt-1',
            resourceId: 'res-1',
            startTime: '09:00',
            durationMinutes: 30,
            patientName: 'Aarav Sharma',
            mrn: 'MRN-88210',
            visitType: 'Cataract Biometry Workup',
            status: 'checked-in',
            conflictFlag: false,
          },
        ],
      };

      const waitlistVm: EmrWaitlistQueueViewModel = {
        id: 'wq-1',
        title: 'Live Clinic & Diagnostics Token Queue',
        activeFilter: 'all',
        entries: [
          {
            id: 'e-1',
            tokenNumber: 'T-204',
            patientName: 'Suresh Menon',
            priority: 'stat',
            departmentOrRoom: 'OCT Suite A',
            waitMinutes: 19,
            slaTargetMinutes: 15,
            status: 'waiting',
          },
        ],
      };

      const wardVm: EmrWardBedBoardViewModel = {
        id: 'ward-1',
        wardName: 'Ophthalmic & Surgical Inpatient Ward 3B',
        activeStatusFilter: 'all',
        beds: [
          {
            id: 'b-1',
            bedNumber: '3B-01',
            roomLabel: 'Room 301',
            status: 'occupied',
            isolationType: 'none',
            patientName: 'Rajesh Khanna',
            mrn: 'MRN-44912',
            attendingDoctor: 'Dr. Vivek Gupta',
            losDays: 2,
            ewsScore: 1,
            dischargePlannedToday: true,
          },
        ],
      };

      expect(calendarVm.viewMode).toBe('resource-grid');
      expect(waitlistVm.entries[0]?.tokenNumber).toBe('T-204');
      expect(wardVm.beds[0]?.dischargePlannedToday).toBe(true);
    });
  });
});
