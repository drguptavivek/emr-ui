// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  EmrAppointmentCalendarElement,
  EmrSbarHandoverElement,
  EmrWaitlistQueueElement,
  EmrWardBedBoardElement,
  registerL4HospitalOperationsElements,
  type EmrAppointmentCalendarViewModel,
  type EmrSbarHandoverViewModel,
  type EmrWaitlistQueueViewModel,
  type EmrWardBedBoardViewModel,
} from './l4-hospital-operations.js';

function makeCalendarModel(): EmrAppointmentCalendarViewModel {
  return {
    id: 'cal-1',
    title: 'Multi-Resource Outpatient & OT Schedule',
    activeDate: '2026-11-12',
    viewMode: 'resource-grid',
    resources: [
      {
        id: 'res-1',
        name: 'Dr. Vivek Gupta',
        roleOrLocation: 'Cornea Suite 1',
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
        mrn: 'MRN-88210',
        visitType: 'Cataract Biometry Workup',
        status: 'checked-in',
        conflictFlag: true,
      },
    ],
  };
}

function makeWaitlistModel(): EmrWaitlistQueueViewModel {
  return {
    id: 'wq-1',
    title: 'Live Clinic Token Queue',
    activeFilter: 'all',
    entries: [
      {
        id: 'wq-1',
        tokenNumber: 'STAT-04',
        patientName: 'Devika Krishnan',
        priority: 'stat',
        departmentOrRoom: 'Acute Eye Emergency Bay 1',
        waitMinutes: 19,
        slaTargetMinutes: 10,
        status: 'waiting',
      },
    ],
  };
}

function makeWardModel(): EmrWardBedBoardViewModel {
  return {
    id: 'ward-1',
    title: 'Inpatient Ward Bed Census Board',
    wardName: 'Ward 4B — Ophthalmic Surgery',
    activeStatusFilter: 'all',
    beds: [
      {
        id: 'b-1',
        bedNumber: '4B-01',
        roomLabel: 'Suite 401',
        status: 'occupied',
        patientName: 'Rajesh Khanna',
        mrn: 'MRN-44912',
        ewsScore: 1,
        dischargePlannedToday: true,
      },
      {
        id: 'b-2',
        bedNumber: '4B-02',
        status: 'isolation',
        isolationType: 'contact',
        patientName: 'Fatima Begum',
        ewsScore: 5,
      },
    ],
  };
}

function makeSbarModel(): EmrSbarHandoverViewModel {
  return {
    id: 'sbar-1',
    title: 'Structured SBAR Clinical Shift Handover',
    shiftLabel: 'Night → Morning Shift (07:00)',
    patientName: 'Fatima Begum',
    bedLabel: 'Bed 4B-02',
    illnessSeverity: 'watcher',
    situation: '62F inpatient day 4 for severe central Pseudomonas corneal ulcer OD.',
    background: 'On hourly fortified Tobramycin + Ceftazidime.',
    assessment: 'Hypopyon reduced to 0.8 mm; Seidel negative.',
    recommendation: 'Repeat AS-OCT pachymetry at 10:00.',
    actionItems: [
      {
        id: 'act-1',
        label: 'Perform Anterior Segment OCT measurement',
        dueByLabel: '10:00',
        completed: false,
        priority: 'stat',
      },
    ],
    outgoingClinician: 'Dr. Neha Kulkarni',
    incomingClinician: 'Dr. Rohan Nair',
    acknowledged: false,
  };
}

describe('Lit L4 Hospital Operations Custom Elements', () => {
  it('registers all 4 custom elements via registerL4HospitalOperationsElements()', () => {
    registerL4HospitalOperationsElements();
    for (const tag of [
      'emr-appointment-calendar',
      'emr-waitlist-queue',
      'emr-ward-bed-board',
      'emr-sbar-handover',
    ]) {
      expect(customElements.get(tag)).toBeDefined();
    }
  });

  it('renders EmrAppointmentCalendarElement and emits viewModeChanged, slotBookRequested, and appointmentStatusChanged', async () => {
    registerL4HospitalOperationsElements();
    const el = document.createElement(
      'emr-appointment-calendar',
    ) as EmrAppointmentCalendarElement;
    el.model = makeCalendarModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Dr. Vivek Gupta');
      expect(el.shadowRoot!.textContent).toContain('OVERBOOK CONFLICT');

      const dayBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Day View',
      )!;
      dayBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'viewModeChanged',
        viewMode: 'day',
      });

      const slotBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('+ 09:30'),
      )!;
      slotBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'slotBookRequested',
        resourceId: 'res-1',
        startTime: '09:30',
      });

      const inRoomBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'in-room',
      )!;
      inRoomBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'appointmentStatusChanged',
        appointmentId: 'apt-1',
        status: 'in-room',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrWaitlistQueueElement and emits filterChanged, patientCalled, and entryStatusChanged', async () => {
    registerL4HospitalOperationsElements();
    const el = document.createElement(
      'emr-waitlist-queue',
    ) as EmrWaitlistQueueElement;
    el.model = makeWaitlistModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('STAT-04');
      expect(el.shadowRoot!.textContent).toContain('SLA Breached: 1');

      const filterBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'SLA Breached',
      )!;
      filterBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'filterChanged',
        filter: 'breached',
      });

      const callBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Call STAT-04'),
      )!;
      callBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'patientCalled',
        entryId: 'wq-1',
        tokenNumber: 'STAT-04',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrWardBedBoardElement and emits statusFilterChanged, bedStatusChanged, and transferRequested', async () => {
    registerL4HospitalOperationsElements();
    const el = document.createElement(
      'emr-ward-bed-board',
    ) as EmrWardBedBoardElement;
    el.model = makeWardModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('4B-01');
      expect(el.shadowRoot!.textContent).toContain('ISO: contact');

      const filterBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Isolation',
      )!;
      filterBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'statusFilterChanged',
        filter: 'isolation',
      });

      const transferBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Transfer',
      )!;
      transferBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'transferRequested',
        fromBedId: 'b-1',
      });
    } finally {
      el.remove();
    }
  });

  it('renders EmrSbarHandoverElement and emits illnessSeverityChanged, actionItemToggled, and handoverAcknowledged', async () => {
    registerL4HospitalOperationsElements();
    const el = document.createElement(
      'emr-sbar-handover',
    ) as EmrSbarHandoverElement;
    el.model = makeSbarModel();
    const intents: unknown[] = [];
    el.addEventListener('intent', (e) => intents.push((e as CustomEvent).detail));
    document.body.append(el);
    try {
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain('Fatima Begum');
      expect(el.shadowRoot!.textContent).toContain('Severity: watcher');

      const sevBtn = [...el.shadowRoot!.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Unstable / Critical',
      )!;
      sevBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'illnessSeverityChanged',
        severity: 'unstable-critical',
      });

      const actBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Perform Anterior Segment OCT measurement'),
      )!;
      actBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'actionItemToggled',
        itemId: 'act-1',
        completed: true,
      });

      const ackBtn = [...el.shadowRoot!.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Acknowledge SBAR Handover'),
      )!;
      ackBtn.click();
      expect(intents.at(-1)).toEqual({
        type: 'handoverAcknowledged',
        incomingClinician: 'Dr. Rohan Nair',
      });
    } finally {
      el.remove();
    }
  });
});
