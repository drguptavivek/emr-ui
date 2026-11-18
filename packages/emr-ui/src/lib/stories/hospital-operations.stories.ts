import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import {
  EmrAppointmentCalendarComponent,
  EmrSbarHandoverComponent,
  EmrWaitlistQueueComponent,
  EmrWardBedBoardComponent,
  type EmrAppointmentCalendarViewModel,
  type EmrSbarHandoverViewModel,
  type EmrWaitlistQueueViewModel,
  type EmrWardBedBoardViewModel,
} from '../domain/emr-hospital-operations.component';

export const appointmentCalendarMultiResourceFixture: EmrAppointmentCalendarViewModel = {
  id: 'cal-ops-01',
  title: 'Multi-Resource Outpatient Clinic & Minor OT Schedule',
  subtitle: 'Ophthalmology & Surgical Specialty Suites · 15/30-min Slot Grid',
  activeDate: '2026-11-12',
  viewMode: 'resource-grid',
  selectedAppointmentId: 'apt-02',
  resources: [
    {
      id: 'res-cornea-1',
      name: 'Dr. Vivek Gupta',
      roleOrLocation: 'Cornea & Refractive Suite 1',
      utilizationPct: 92,
    },
    {
      id: 'res-retina-2',
      name: 'Dr. Ananya Sen',
      roleOrLocation: 'Vitreoretinal & OCT Injection Suite 2',
      utilizationPct: 85,
    },
    {
      id: 'res-ot-1',
      name: 'Modular OT Theatre A',
      roleOrLocation: 'Phaco & Anterior Segment Surgery',
      utilizationPct: 96,
    },
  ],
  slots: ['09:00', '09:30', '10:00', '10:30'],
  appointments: [
    {
      id: 'apt-01',
      resourceId: 'res-cornea-1',
      startTime: '09:00',
      durationMinutes: 30,
      patientName: 'Aarav Sharma',
      mrn: 'MRN-88210',
      visitType: 'Swept-Source Biometry & Toric IOL Workup',
      status: 'completed',
      badge: { label: 'Toric Candidate', tone: 'info' },
    },
    {
      id: 'apt-02',
      resourceId: 'res-cornea-1',
      startTime: '09:30',
      durationMinutes: 30,
      patientName: 'Meera Patel',
      mrn: 'MRN-88402',
      visitType: 'Pentacam Keratoconus Progression Review',
      status: 'in-room',
      conflictFlag: true,
      badge: { label: 'Double-Booked Add-On', tone: 'warning' },
    },
    {
      id: 'apt-03',
      resourceId: 'res-retina-2',
      startTime: '09:30',
      durationMinutes: 30,
      patientName: 'Suresh Menon',
      mrn: 'MRN-77190',
      visitType: 'Intravitreal Faricimab Injection (OD)',
      status: 'checked-in',
      badge: { label: 'Anti-VEGF #5', tone: 'success' },
    },
    {
      id: 'apt-04',
      resourceId: 'res-ot-1',
      startTime: '10:00',
      durationMinutes: 45,
      patientName: 'Rajesh Khanna',
      mrn: 'MRN-44912',
      visitType: 'Micro-Incisional Phaco + Toric PCIOL (OD)',
      status: 'booked',
    },
  ],
};

export const waitlistQueueLiveTokenFixture: EmrWaitlistQueueViewModel = {
  id: 'wq-ops-01',
  title: 'Live Clinic, Diagnostics & Minor OT Token Queue',
  subtitle: 'Real-Time SLA Tracking · Priority Triage & Room Calling',
  activeFilter: 'all',
  selectedEntryId: 'wq-01',
  entries: [
    {
      id: 'wq-01',
      tokenNumber: 'STAT-04',
      patientName: 'Devika Krishnan',
      mrn: 'MRN-90112',
      priority: 'stat',
      departmentOrRoom: 'Acute Eye Emergency Bay 1',
      waitMinutes: 19,
      slaTargetMinutes: 10,
      status: 'waiting',
      notes: 'Acute angle-closure suspect · IOP 54 mmHg OD',
      badge: { label: 'IOP Crisis', tone: 'danger' },
    },
    {
      id: 'wq-02',
      tokenNumber: 'OCT-218',
      patientName: 'Suresh Menon',
      mrn: 'MRN-77190',
      priority: 'urgent',
      departmentOrRoom: 'Diagnostics OCT & Biometry Room 2',
      waitMinutes: 28,
      slaTargetMinutes: 20,
      status: 'called',
      notes: 'Pre-injection macular OCT cube scan',
    },
    {
      id: 'wq-03',
      tokenNumber: 'OPD-412',
      patientName: 'Vikramaditya Joshi',
      mrn: 'MRN-61208',
      priority: 'routine',
      departmentOrRoom: 'Refraction Cubicle 3',
      waitMinutes: 14,
      slaTargetMinutes: 30,
      status: 'in-service',
    },
  ],
};

export const wardBedBoardInpatientCensusFixture: EmrWardBedBoardViewModel = {
  id: 'ward-ops-01',
  title: 'Real-Time Inpatient ADT Ward Bed Census Board',
  subtitle: 'Surgical & Ophthalmic Inpatient Unit · Isolation & EWS Monitoring',
  wardName: 'Ward 4B — Ophthalmic & Craniofacial Surgery',
  activeStatusFilter: 'all',
  selectedBedId: 'bed-4b-02',
  beds: [
    {
      id: 'bed-4b-01',
      bedNumber: '4B-01',
      roomLabel: 'Suite 401',
      status: 'occupied',
      isolationType: 'none',
      patientName: 'Rajesh Khanna',
      mrn: 'MRN-44912',
      attendingDoctor: 'Dr. Vivek Gupta',
      losDays: 1,
      ewsScore: 1,
      dischargePlannedToday: true,
      badge: { label: 'POD-1 Phaco Toric', tone: 'success' },
    },
    {
      id: 'bed-4b-02',
      bedNumber: '4B-02',
      roomLabel: 'Negative Pressure 402',
      status: 'isolation',
      isolationType: 'contact',
      patientName: 'Fatima Begum',
      mrn: 'MRN-55301',
      attendingDoctor: 'Dr. Vivek Gupta',
      losDays: 4,
      ewsScore: 5,
      dischargePlannedToday: false,
      badge: { label: 'Pseudomonas Keratitis', tone: 'danger' },
    },
    {
      id: 'bed-4b-03',
      bedNumber: '4B-03',
      roomLabel: 'Suite 403',
      status: 'available',
      isolationType: 'none',
    },
    {
      id: 'bed-4b-04',
      bedNumber: '4B-04',
      roomLabel: 'Suite 404',
      status: 'housekeeping-dirty',
      isolationType: 'none',
    },
  ],
};

export const sbarHandoverClinicalShiftFixture: EmrSbarHandoverViewModel = {
  id: 'sbar-ops-01',
  title: 'Structured SBAR Clinical Shift Handover',
  subtitle: 'I-PASS / SBAR High-Acuity Surgical Handover & Sign-Off',
  shiftLabel: 'Night → Morning Shift (07:00 IST)',
  patientName: 'Fatima Begum',
  bedLabel: 'Bed 4B-02 (Contact Isolation)',
  illnessSeverity: 'watcher',
  situation:
    '62F inpatient day 4 for severe central Pseudomonas aeruginosa corneal ulcer OD; perforation watch.',
  background:
    'Presented with 4.2 x 3.8 mm stromal infiltrate + 1.8 mm hypopyon; on hourly fortified Tobramycin 1.4% + Ceftazidime 5%.',
  assessment:
    'Epithelial defect consolidating; hypopyon reduced to 0.8 mm; anterior chamber deep, Seidel negative, IOP 16 mmHg.',
  recommendation:
    'Step down fortified drops to q2h daytime; repeat AS-OCT pachymetry at 10:00 to verify stromal bed thickness.',
  actionItems: [
    {
      id: 'sbar-act-1',
      label: 'Review microbiology sensitivity final report & corneal scraping KOH/culture',
      dueByLabel: '09:30',
      completed: true,
      priority: 'urgent',
    },
    {
      id: 'sbar-act-2',
      label: 'Perform Anterior Segment OCT thinnest stromal bed measurement',
      dueByLabel: '10:00',
      completed: false,
      priority: 'stat',
    },
    {
      id: 'sbar-act-3',
      label: 'Re-prescribe preservative-free lubricants & cycloplegic homatropine 2% BD',
      dueByLabel: '11:00',
      completed: false,
      priority: 'routine',
    },
  ],
  outgoingClinician: 'Dr. Neha Kulkarni (Senior Resident, Night Duty)',
  incomingClinician: 'Dr. Rohan Nair (Cornea Fellow, Day Team)',
  acknowledged: false,
};

const meta: Meta = {
  title: 'EMR / Hospital Operations / Scheduling, Queue, Ward & SBAR',
  decorators: [
    moduleMetadata({
      imports: [
        EmrAppointmentCalendarComponent,
        EmrWaitlistQueueComponent,
        EmrWardBedBoardComponent,
        EmrSbarHandoverComponent,
      ],
    }),
  ],
};

export default meta;

export const AppointmentCalendarMultiResource: StoryObj = {
  render: () => ({
    props: { model: appointmentCalendarMultiResourceFixture },
    template: `<emr-appointment-calendar [model]="model" />`,
  }),
};

export const WaitlistQueueLiveToken: StoryObj = {
  render: () => ({
    props: { model: waitlistQueueLiveTokenFixture },
    template: `<emr-waitlist-queue [model]="model" />`,
  }),
};

export const WardBedBoardInpatientCensus: StoryObj = {
  render: () => ({
    props: { model: wardBedBoardInpatientCensusFixture },
    template: `<emr-ward-bed-board [model]="model" />`,
  }),
};

export const SbarHandoverClinicalShift: StoryObj = {
  render: () => ({
    props: { model: sbarHandoverClinicalShiftFixture },
    template: `<emr-sbar-handover [model]="model" />`,
  }),
};
