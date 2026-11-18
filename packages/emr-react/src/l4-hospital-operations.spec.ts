import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('react-native', () => import('react-native-web'));

import {
  EmrAppointmentCalendar,
  EmrSbarHandover,
  EmrWaitlistQueue,
  EmrWardBedBoard,
  type EmrAppointmentCalendarViewModel,
  type EmrSbarHandoverViewModel,
  type EmrWaitlistQueueViewModel,
  type EmrWardBedBoardViewModel,
} from './l4-hospital-operations';
import {
  computeWardCensusOccupancy,
  evaluateWaitlistSlaSummary,
  filterWaitlistEntries,
  filterWardBeds,
  summarizeSbarReadiness,
  summarizeScheduleUtilization,
} from './l4-hospital-operations.logic';

const calendarModel: EmrAppointmentCalendarViewModel = {
  id: 'cal-1',
  title: 'Multi-Resource Outpatient & OT Schedule',
  activeDate: '2026-11-12',
  viewMode: 'resource-grid',
  selectedAppointmentId: 'apt-1',
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

const waitlistModel: EmrWaitlistQueueViewModel = {
  id: 'wq-1',
  title: 'Live Clinic & Diagnostics Token Queue',
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

const wardModel: EmrWardBedBoardViewModel = {
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
      attendingDoctor: 'Dr. Vivek Gupta',
      losDays: 1,
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

const sbarModel: EmrSbarHandoverViewModel = {
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

describe('React / React Native L4 Hospital Operations Suite', () => {
  it('enforces use client and type-only @drguptavivek/emr-controller imports in .tsx', () => {
    const tsxPath = join(
      process.cwd(),
      'packages/emr-react/src/l4-hospital-operations.tsx',
    );
    const tsxText = readFileSync(tsxPath, 'utf8');
    expect(tsxText.trimStart().startsWith("'use client';")).toBe(true);
    expect(tsxText).not.toMatch(
      /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]@drguptavivek\/emr-controller['"]/,
    );
    expect(tsxText).not.toContain('role="listbox"');
  });

  it('evaluates pure logic helpers accurately', () => {
    expect(summarizeScheduleUtilization(calendarModel.appointments)).toEqual({
      totalCount: 1,
      checkedInCount: 1,
      conflictCount: 1,
      noShowCount: 0,
    });
    expect(evaluateWaitlistSlaSummary(waitlistModel.entries)).toEqual({
      waitingCount: 1,
      breachedCount: 1,
      maxWaitMinutes: 19,
    });
    expect(filterWaitlistEntries(waitlistModel)).toHaveLength(1);
    expect(computeWardCensusOccupancy(wardModel.beds)).toEqual({
      totalBeds: 2,
      occupiedBeds: 2,
      availableBeds: 0,
      dirtyBeds: 0,
      occupancyPct: 100,
    });
    expect(filterWardBeds(wardModel)).toHaveLength(2);
    expect(summarizeSbarReadiness(sbarModel)).toEqual({
      openActionCount: 1,
      completedActionCount: 0,
      isReadyToAcknowledge: true,
    });
  });

  it('renders EmrAppointmentCalendar with resource columns, utilization, and conflict badges', () => {
    const html = renderToStaticMarkup(
      createElement(EmrAppointmentCalendar, { model: calendarModel }),
    );
    expect(html).toContain('Multi-Resource Outpatient &amp; OT Schedule');
    expect(html).toContain('Dr. Vivek Gupta');
    expect(html).toContain('92% Utilized');
    expect(html).toContain('OVERBOOK CONFLICT');
  });

  it('renders EmrWaitlistQueue with token numbers, SLA breach badges, and call actions', () => {
    const html = renderToStaticMarkup(
      createElement(EmrWaitlistQueue, { model: waitlistModel }),
    );
    expect(html).toContain('Live Clinic &amp; Diagnostics Token Queue');
    expect(html).toContain('STAT-04');
    expect(html).toContain('Devika Krishnan');
    expect(html).toContain('19m / 10m (BREACH)');
  });

  it('renders EmrWardBedBoard with bed cards, isolation tags, and discharge flags', () => {
    const html = renderToStaticMarkup(
      createElement(EmrWardBedBoard, { model: wardModel }),
    );
    expect(html).toContain('Inpatient Ward Bed Census Board');
    expect(html).toContain('4B-01');
    expect(html).toContain('ISO: contact');
    expect(html).toContain('Discharge Today');
  });

  it('renders EmrSbarHandover with illness severity, SBAR sections, and checklist items', () => {
    const html = renderToStaticMarkup(
      createElement(EmrSbarHandover, { model: sbarModel }),
    );
    expect(html).toContain('Structured SBAR Clinical Shift Handover');
    expect(html).toContain('Severity: watcher');
    expect(html).toContain('Perform Anterior Segment OCT measurement');
    expect(html).toContain('Acknowledge SBAR Handover');
  });
});
