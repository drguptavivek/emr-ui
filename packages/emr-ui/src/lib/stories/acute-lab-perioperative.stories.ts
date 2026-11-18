import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import {
  EmrAnaesthesiaRecordComponent,
  EmrEdTrackBoardComponent,
  EmrFluidBalanceChartComponent,
  EmrLabCumulativeGridComponent,
  EmrMicrobiologyAntibiogramComponent,
  EmrResuscitationEventLogComponent,
  EmrSpecimenCollectionBarComponent,
  EmrSurgicalImplantLogComponent,
  EmrTriageAssessmentCardComponent,
  type EmrAnaesthesiaRecordViewModel,
  type EmrEdTrackBoardViewModel,
  type EmrFluidBalanceChartViewModel,
  type EmrLabCumulativeGridViewModel,
  type EmrMicrobiologyAntibiogramViewModel,
  type EmrResuscitationEventLogViewModel,
  type EmrSpecimenCollectionBarViewModel,
  type EmrSurgicalImplantLogViewModel,
  type EmrTriageAssessmentCardViewModel,
} from '../domain/emr-acute-lab-perioperative.component';

export const edTrackBoardFixture: EmrEdTrackBoardViewModel = {
  id: 'ed-track-01',
  title: 'Emergency Department Real-Time Bay Census & Flow Board',
  subtitle: 'Trauma Level 1 · 18 Active Bays · 4-Hour Target Monitoring',
  activeAcuityFilter: 'all',
  selectedPatientId: 'ed-pt-1',
  patients: [
    {
      id: 'ed-pt-1',
      bayLabel: 'Resus-1',
      patientName: 'Arjun Singhania',
      ageSexLabel: '64M',
      esiLevel: 1,
      chiefComplaint: 'Anterior STEMI · Cardiogenic shock',
      losMinutes: 38,
      pendingLabsCount: 1,
      pendingImagingCount: 0,
      disposition: 'in-assessment',
      providerName: 'Dr. R. Menon',
      badge: { label: 'Cath Lab Activated', tone: 'danger' },
    },
    {
      id: 'ed-pt-2',
      bayLabel: 'Acute-3',
      patientName: 'Kavita Deshmukh',
      ageSexLabel: '52F',
      esiLevel: 2,
      chiefComplaint: 'Urosepsis with hyperlactatemia (Lactate 4.6)',
      losMinutes: 258,
      pendingLabsCount: 2,
      pendingImagingCount: 1,
      disposition: 'boarding-admit',
      providerName: 'Dr. S. Kulkarni',
      badge: { label: 'ICU Bed Assigned', tone: 'warning' },
    },
    {
      id: 'ed-pt-3',
      bayLabel: 'FastTrack-2',
      patientName: 'Rohan Malhotra',
      ageSexLabel: '29M',
      esiLevel: 4,
      chiefComplaint: 'Distal radius buckle injury after fall',
      losMinutes: 84,
      pendingLabsCount: 0,
      pendingImagingCount: 0,
      disposition: 'ready-discharge',
      providerName: 'NP A. Varma',
    },
  ],
};

export const triageAssessmentCardFixture: EmrTriageAssessmentCardViewModel = {
  id: 'triage-01',
  title: 'Emergency Triage & Primary Survey Card',
  subtitle: 'Emergency Severity Index (ESI v4) · High-Risk Red Flag Screening',
  arrivalMode: 'ALS Ambulance',
  chiefComplaint: 'Sudden-onset tearing chest and interscapular back pain',
  esiLevel: 2,
  painScore: 9,
  redFlags: [
    'Pulse deficit right vs left radial (24 mmHg systolic differential)',
    'Diaphoresis & acute aortic syndrome suspicion',
  ],
  vitalsSummary: [
    { label: 'HR', value: '112 bpm', abnormal: true },
    { label: 'BP (R)', value: '188/104 mmHg', abnormal: true },
    { label: 'BP (L)', value: '164/92 mmHg', abnormal: true },
    { label: 'SpO2', value: '96% on 2L NC' },
  ],
  isolationRequired: false,
  triageNurse: 'RN Sunita Rao',
  finalized: true,
};

export const resuscitationEventLogFixture: EmrResuscitationEventLogViewModel = {
  id: 'resus-01',
  title: 'ACLS Code Blue & Resuscitation Event Recorder',
  subtitle: 'Resuscitation Bay 1 · Defibrillator Synced',
  codeStatus: 'active',
  elapsedSeconds: 375,
  currentRhythm: 'VF/pVT',
  cprCycles: 3,
  shockCount: 2,
  epinephrineDoses: 2,
  events: [
    {
      id: 'ev-1',
      timestampLabel: '00:00:15',
      category: 'rhythm',
      description: 'Coarse Ventricular Fibrillation identified on pads',
      clinician: 'Dr. R. Menon',
    },
    {
      id: 'ev-2',
      timestampLabel: '00:00:30',
      category: 'shock',
      description: 'Biphasic defibrillation 200 J delivered; immediate CPR resumed',
      clinician: 'Dr. R. Menon',
    },
    {
      id: 'ev-3',
      timestampLabel: '00:02:35',
      category: 'medication',
      description: 'Epinephrine 1 mg IV push + 20 mL NS flush',
      clinician: 'RN D. Matthew',
    },
    {
      id: 'ev-4',
      timestampLabel: '00:04:40',
      category: 'airway',
      description: 'Video laryngoscopy 7.5 mm ETT secured at 22 cm, waveform EtCO2 28 mmHg',
      clinician: 'Dr. K. Iyer',
    },
  ],
};

export const specimenCollectionBarFixture: EmrSpecimenCollectionBarViewModel = {
  id: 'spec-01',
  title: 'Phlebotomy & Specimen Barcode Verification Bar',
  subtitle: 'Two-Identifier Bedside Wristband Scan · Positive Patient Identification',
  orderAccession: 'ACC-2026-90418',
  patientVerified: true,
  containers: [
    {
      id: 'cont-1',
      barcode: 'BC-90418-01',
      tubeType: 'EDTA Lavender',
      testsSummary: 'CBC with Automated Differential, Reticulocyte Count',
      volumeMl: 4,
      stat: true,
      status: 'scanned-collected',
    },
    {
      id: 'cont-2',
      barcode: 'BC-90418-02',
      tubeType: 'SST Gold',
      testsSummary: 'Comprehensive Metabolic Panel, High-Sensitivity Troponin I',
      volumeMl: 5,
      stat: true,
      status: 'received-lab',
    },
    {
      id: 'cont-3',
      barcode: 'BC-90418-03',
      tubeType: 'Citrate Blue',
      testsSummary: 'PT / INR, aPTT, Fibrinogen',
      volumeMl: 2.7,
      stat: false,
      status: 'pending',
    },
  ],
};

export const labCumulativeGridFixture: EmrLabCumulativeGridViewModel = {
  id: 'lab-grid-01',
  title: 'Longitudinal Clinical Laboratory Flowsheet Matrix',
  subtitle: 'Critical Value Read-Back & Delta-Check Surveillance',
  panelName: 'Renal, Electrolytes & Cardiac Biomarkers',
  columns: [
    { id: 'c1', dateLabel: '12 Nov 04:00' },
    { id: 'c2', dateLabel: '12 Nov 10:00' },
    { id: 'c3', dateLabel: '12 Nov 16:00' },
  ],
  rows: [
    {
      id: 'potassium',
      analyteName: 'Potassium (Serum)',
      unit: 'mmol/L',
      referenceRange: '3.5 - 5.1',
      values: {
        c1: { value: '6.4', flag: 'critical-high' },
        c2: { value: '5.4', flag: 'high' },
        c3: { value: '4.6', flag: 'normal' },
      },
    },
    {
      id: 'creatinine',
      analyteName: 'Creatinine (eGFR)',
      unit: 'mg/dL',
      referenceRange: '0.7 - 1.3',
      values: {
        c1: { value: '2.1', flag: 'high' },
        c2: { value: '1.8', flag: 'high' },
        c3: { value: '1.4', flag: 'high' },
      },
    },
    {
      id: 'hemoglobin',
      analyteName: 'Hemoglobin',
      unit: 'g/dL',
      referenceRange: '13.0 - 17.0',
      values: {
        c1: { value: '6.6', flag: 'critical-low' },
        c2: { value: '8.9', flag: 'low' },
        c3: { value: '9.4', flag: 'low' },
      },
    },
  ],
};

export const microbiologyAntibiogramFixture: EmrMicrobiologyAntibiogramViewModel = {
  id: 'micro-01',
  title: 'Culture & Sensitivity (C&S) Antibiogram Matrix',
  subtitle: 'CLSI M100 Breakpoints · Antimicrobial Stewardship Guidance',
  specimenSource: 'Blood Culture (Aerobic & Anaerobic Paired Bottles)',
  collectionDate: '2026-11-10 08:30',
  gramStainSummary: 'Gram-negative bacilli in both aerobic bottles @ 11h',
  selectedAntibioticId: 'meropenem',
  isolates: [
    {
      id: 'iso-ecoli',
      organismName: 'Escherichia coli',
      colonyCount: 'Positive @ 11.2h',
      resistanceMechanism: 'CTX-M ESBL Positive',
    },
    {
      id: 'iso-kleb',
      organismName: 'Klebsiella pneumoniae',
      colonyCount: '10^5 CFU/mL (Urine Source)',
    },
  ],
  rows: [
    {
      antibioticId: 'ceftriaxone',
      antibioticName: 'Ceftriaxone',
      classLabel: '3rd-Gen Cephalosporin',
      resultsByIsolate: {
        'iso-ecoli': { interpretation: 'R', micLabel: '>= 64' },
        'iso-kleb': { interpretation: 'S', micLabel: '<= 1' },
      },
    },
    {
      antibioticId: 'pip-tazo',
      antibioticName: 'Piperacillin-Tazobactam',
      classLabel: 'Beta-Lactam / Inhibitor',
      resultsByIsolate: {
        'iso-ecoli': { interpretation: 'I', micLabel: '16/4' },
        'iso-kleb': { interpretation: 'S', micLabel: '<= 4/4' },
      },
    },
    {
      antibioticId: 'meropenem',
      antibioticName: 'Meropenem',
      classLabel: 'Carbapenem',
      stewardshipPreferred: true,
      resultsByIsolate: {
        'iso-ecoli': { interpretation: 'S', micLabel: '<= 0.25' },
        'iso-kleb': { interpretation: 'S', micLabel: '<= 0.25' },
      },
    },
  ],
};

export const anaesthesiaRecordFixture: EmrAnaesthesiaRecordViewModel = {
  id: 'anaes-01',
  title: 'Intra-Operative Anaesthesia & Physiological Record',
  subtitle: 'OR Theatre 4 · Laparoscopic Anterior Resection',
  asaClass: 'II',
  mallampatiClass: 2,
  technique: 'General Endotracheal Balanced Anaesthesia + TAP Block',
  airwayDevice: '7.5 mm Cuffed ETT @ 21 cm (Cormack-Lehane Grade 1)',
  activePhase: 'maintenance',
  checkpoints: [
    {
      id: 'cp-1',
      timeLabel: '08:45',
      hrBpm: 78,
      bpLabel: '124/76',
      spo2Pct: 99,
      etco2MmHg: 37,
      macPct: 0.9,
    },
    {
      id: 'cp-2',
      timeLabel: '09:00',
      hrBpm: 71,
      bpLabel: '116/70',
      spo2Pct: 100,
      etco2MmHg: 35,
      macPct: 1.1,
    },
  ],
  medications: [
    { id: 'm1', drugName: 'Fentanyl', doseLabel: '100 mcg IV', timeLabel: '08:38' },
    { id: 'm2', drugName: 'Propofol', doseLabel: '160 mg IV', timeLabel: '08:39' },
    { id: 'm3', drugName: 'Rocuronium', doseLabel: '50 mg IV', timeLabel: '08:40' },
  ],
};

export const fluidBalanceChartFixture: EmrFluidBalanceChartViewModel = {
  id: 'fluid-01',
  title: '24-Hour Intake & Output (I/O) Fluid Balance Chart',
  subtitle: 'Surgical ICU Bed 6 · Target Even Net Balance',
  periodLabel: '24h Shift (07:00 – 07:00)',
  patientWeightKg: 72,
  targetNetBalanceMl: 0,
  intakes: [
    {
      id: 'in-1',
      category: 'IV Crystalloid',
      routeOrSite: 'Plasmalyte-A @ 75 mL/h',
      volumeMl: 1450,
      timeLabel: 'Continuous',
    },
    {
      id: 'in-2',
      category: 'IV Antibiotic Piggyback',
      routeOrSite: 'Meropenem in 100 mL NS q8h',
      volumeMl: 300,
      timeLabel: 'q8h',
    },
  ],
  outputs: [
    {
      id: 'out-1',
      category: 'Urine Output',
      routeOrSite: 'Foley Catheter (0.85 mL/kg/h)',
      volumeMl: 1470,
      timeLabel: '24h Cumulative',
    },
    {
      id: 'out-2',
      category: 'Surgical Drain',
      routeOrSite: 'Pelvic Blake Drain #1 (Serosanguinous)',
      volumeMl: 160,
      timeLabel: '24h Cumulative',
    },
  ],
};

export const surgicalImplantLogFixture: EmrSurgicalImplantLogViewModel = {
  id: 'implant-01',
  title: 'Perioperative Prosthesis & Implant UDI Traceability Log',
  subtitle: 'OR Theatre 2 · Unique Device Identification & Count Reconciliation',
  procedureName: 'Right Cementless Total Hip Arthroplasty (Posterior Approach)',
  countsReconciled: true,
  selectedImplantId: 'imp-1',
  implants: [
    {
      id: 'imp-1',
      deviceName: 'Trident II Tritanium Hemispherical Acetabular Shell 52mm',
      manufacturer: 'Stryker Orthopaedics',
      lotNumber: 'LOT-884120',
      serialNumber: 'SN-2026-99104',
      udiCode: '(01)00884400123456(17)301231(21)SN202699104',
      expiryDate: '2030-12-31',
      anatomicalSite: 'Right Acetabulum',
      sterileVerified: true,
    },
    {
      id: 'imp-2',
      deviceName: 'Accolade II Wedge Femoral Stem Size 4 (127° Neck Angle)',
      manufacturer: 'Stryker Orthopaedics',
      lotNumber: 'LOT-884305',
      serialNumber: 'SN-2026-77412',
      udiCode: '(01)00884400654321(17)301130(21)SN202677412',
      expiryDate: '2030-11-30',
      anatomicalSite: 'Right Proximal Femur',
      sterileVerified: true,
    },
  ],
};

const meta: Meta<EmrEdTrackBoardComponent> = {
  title: 'EMR/L4 Acute Care, Lab & Perioperative',
  component: EmrEdTrackBoardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EmrEdTrackBoardComponent,
        EmrTriageAssessmentCardComponent,
        EmrResuscitationEventLogComponent,
        EmrSpecimenCollectionBarComponent,
        EmrLabCumulativeGridComponent,
        EmrMicrobiologyAntibiogramComponent,
        EmrAnaesthesiaRecordComponent,
        EmrFluidBalanceChartComponent,
        EmrSurgicalImplantLogComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<EmrEdTrackBoardComponent>;

export const EdTrackBoard: Story = {
  args: {
    model: edTrackBoardFixture,
  },
};

export const TriageAssessmentCard: StoryObj<EmrTriageAssessmentCardComponent> = {
  render: () => ({
    template: `<emr-triage-assessment-card [model]="model" />`,
    props: { model: triageAssessmentCardFixture },
  }),
};

export const ResuscitationEventLog: StoryObj<EmrResuscitationEventLogComponent> = {
  render: () => ({
    template: `<emr-resuscitation-event-log [model]="model" />`,
    props: { model: resuscitationEventLogFixture },
  }),
};

export const SpecimenCollectionBar: StoryObj<EmrSpecimenCollectionBarComponent> = {
  render: () => ({
    template: `<emr-specimen-collection-bar [model]="model" />`,
    props: { model: specimenCollectionBarFixture },
  }),
};

export const LabCumulativeGrid: StoryObj<EmrLabCumulativeGridComponent> = {
  render: () => ({
    template: `<emr-lab-cumulative-grid [model]="model" />`,
    props: { model: labCumulativeGridFixture },
  }),
};

export const MicrobiologyAntibiogram: StoryObj<EmrMicrobiologyAntibiogramComponent> = {
  render: () => ({
    template: `<emr-microbiology-antibiogram [model]="model" />`,
    props: { model: microbiologyAntibiogramFixture },
  }),
};

export const AnaesthesiaRecord: StoryObj<EmrAnaesthesiaRecordComponent> = {
  render: () => ({
    template: `<emr-anaesthesia-record [model]="model" />`,
    props: { model: anaesthesiaRecordFixture },
  }),
};

export const FluidBalanceChart: StoryObj<EmrFluidBalanceChartComponent> = {
  render: () => ({
    template: `<emr-fluid-balance-chart [model]="model" />`,
    props: { model: fluidBalanceChartFixture },
  }),
};

export const SurgicalImplantLog: StoryObj<EmrSurgicalImplantLogComponent> = {
  render: () => ({
    template: `<emr-surgical-implant-log [model]="model" />`,
    props: { model: surgicalImplantLogFixture },
  }),
};
