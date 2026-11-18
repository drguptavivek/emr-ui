import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import type {
  EncounterSummaryPrintViewModel,
  InpatientMarViewModel,
  PacsViewerViewModel,
  SpecialtyExamMatrixViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrEncounterSummaryPrintComponent,
  EmrInpatientMarComponent,
  EmrPacsViewerComponent,
  EmrSpecialtyExamMatrixComponent,
} from '../domain/emr-encounter-surfaces.component';

export const pacsViewerFixture: PacsViewerViewModel = {
  title: 'Multi-Viewport PACS & Ophthalmic OCT / Fundus Compare Viewer',
  activeStudyId: 'st-oct-od',
  compareStudyId: 'st-oct-os',
  layoutMode: '2-up-od-os',
  syncScroll: true,
  studies: [
    {
      id: 'st-oct-od',
      accessionNumber: 'ACC-2026-8841',
      dateLabel: '12 Nov 2026 09:30',
      modality: 'OCT',
      bodyPart: 'Macula OD',
      title: 'Spectral-Domain Macular Cube 512x128 (OD)',
      status: 'Final Report',
      pacsEndpointLabel: 'DICOMweb · ORTHANC-OPHTH-01',
      sliceCount: 128,
      currentSlice: 64,
      windowPreset: 'Retina/OCT',
      zoomPercent: 100,
      inverted: false,
      caliperMeasurementLabel: 'CST 412 µm (+98 µm vs baseline)',
      radiologistImpression: 'Centre-involving diabetic macular oedema OD with subfoveal neurosensory detachment.',
      keyFindings: ['CST 412 µm', 'Subfoveal fluid pocket', 'IS/OS junction intact'],
    },
    {
      id: 'st-oct-os',
      accessionNumber: 'ACC-2026-8842',
      dateLabel: '12 Nov 2026 09:32',
      modality: 'OCT',
      bodyPart: 'Macula OS',
      title: 'Spectral-Domain Macular Cube 512x128 (OS)',
      status: 'Final Report',
      pacsEndpointLabel: 'DICOMweb · ORTHANC-OPHTH-01',
      sliceCount: 128,
      currentSlice: 64,
      windowPreset: 'Retina/OCT',
      zoomPercent: 100,
      inverted: false,
      caliperMeasurementLabel: 'CST 268 µm (normal foveal contour)',
      radiologistImpression: 'Normal foveal depression OS; no intraretinal or subretinal fluid.',
      keyFindings: ['CST 268 µm', 'Normal foveal contour'],
    },
  ],
  pinnedKeyImages: [
    {
      id: 'pin-1',
      studyId: 'st-oct-od',
      modality: 'OCT',
      slice: 64,
      label: 'OCT Slice 64 (CST 412 µm)',
    },
  ],
};

export const specialtyExamMatrixFixture: SpecialtyExamMatrixViewModel = {
  title: 'Multi-Specialty Structured Examination & Dosing Matrix',
  activeSpecialty: 'ophthalmology',
  ophthalmicRows: [
    {
      id: 'cornea',
      segment: 'Anterior Segment',
      structureLabel: 'Cornea & Tear Film',
      odValue: 'Clear, no fluorescein staining',
      osValue: 'Superficial punctate keratitis (inferior 1/3)',
      normalDefault: 'Clear, lustre normal',
      quickChips: ['Clear', 'SPK +1', 'Stromal haze', 'KP +1'],
    },
    {
      id: 'lens',
      segment: 'Anterior Segment',
      structureLabel: 'Crystalline Lens / IOL',
      odValue: 'PCIOL well-centred in bag',
      osValue: 'Nuclear sclerosis Grade II + PSC',
      normalDefault: 'Clear',
      quickChips: ['Clear', 'NS Gr II', 'PCIOL in situ', 'PCO +1'],
    },
    {
      id: 'fundus',
      segment: 'Posterior Segment',
      structureLabel: 'Macula & Optic Disc',
      odValue: 'CDR 0.4, hard exudates + CSME',
      osValue: 'CDR 0.4, foveal reflex bright',
      normalDefault: 'CDR 0.3, flat macula',
      quickChips: ['CDR 0.3', 'CSME', 'Drusen', 'ERM'],
    },
  ],
  pediatrics: {
    weightKg: 14,
    heightCm: 96,
    bsaM2: '0.62',
    weightCentileLabel: '50th centile (WHO)',
    heightCentileLabel: '55th centile (WHO)',
    targetDrugLabel: 'Amoxicillin Oral Suspension',
    mgPerKgPerDose: 15,
    concentrationMgPer5Ml: 250,
    calculatedMgPerDose: 210,
    calculatedMlPerDose: 4.2,
    maxDailyMgLabel: 'Max 1500 mg/day (90 mg/kg/day)',
  },
  dermatology: {
    morphologyLabel: 'Well-demarcated erythematous scaly plaques with silvery scale',
    regions: [
      { id: 'scalp', regionLabel: 'Scalp', bsaPercent: 4.5, ftuPerDose: 3, active: true },
      { id: 'trunk-ant', regionLabel: 'Anterior Trunk', bsaPercent: 18, ftuPerDose: 7, active: true },
      { id: 'upper-limbs', regionLabel: 'Both Upper Limbs', bsaPercent: 9, ftuPerDose: 4, active: false },
    ],
    totalBsaPercent: 22.5,
    totalFtuPerApp: 10,
    totalGramsPerApp: 5,
    totalGramsFor14DaysBd: 140,
  },
  oncology: {
    regimenName: 'FOLFOX-6 Adjuvant',
    cycleNumber: 4,
    cycleDayLabel: 'Day 1 of 14',
    ecogScore: 1,
    bsaM2: 1.72,
    ancCountLabel: '2,140 /µL',
    plateletCountLabel: '148,000 /µL',
    safetyGatePassed: true,
    safetyGateBadge: { label: 'ANC & Platelets Cleared for Cycle 4', tone: 'success' },
    doseReductionPercent: 100,
    agents: [
      { id: 'oxali', drugName: 'Oxaliplatin', standardMgPerM2: 85, calculatedDoseMg: 146, routeLabel: 'IV infusion over 2h' },
      { id: '5fu', drugName: 'Fluorouracil (5-FU)', standardMgPerM2: 400, calculatedDoseMg: 688, routeLabel: 'IV bolus' },
    ],
  },
};

export const inpatientMarFixture: InpatientMarViewModel = {
  title: 'Inpatient Electronic Medication Administration Record (eMAR)',
  wardBedLabel: 'Ophthalmic & Medical Ward 4 · Bed 18',
  shiftLabel: 'Morning/Day Shift (07:00–19:00)',
  nurseLabel: 'RN Kavita Menon',
  timeColumns: [
    { id: '0800', timeLabel: '08:00', slotLabel: 'Morning' },
    { id: '1400', timeLabel: '14:00', slotLabel: 'Afternoon' },
    { id: '1800', timeLabel: '18:00', slotLabel: 'Evening' },
    { id: '2200', timeLabel: '22:00', slotLabel: 'Night' },
  ],
  orders: [
    {
      id: 'mar-ord-1',
      drugName: 'Prednisolone Acetate',
      strength: '1% w/v',
      formLabel: 'Ophthalmic Suspension',
      formularyCode: 'FORM-OPH-014',
      doseLabel: '1 drop',
      routeLabel: 'Topical Ophthalmic',
      siteLabel: 'OD',
      frequencyCode: 'QID',
      stepPhase: 'step-down',
      stepLabel: '↘ Step-Down Wk 2',
      administrations: [
        { slotId: '0800', scheduledTime: '08:00', status: 'given', administeredAtLabel: '08:04', bcmaScanned: true },
        { slotId: '1400', scheduledTime: '14:00', status: 'due' },
        { slotId: '1800', scheduledTime: '18:00', status: 'not-due' },
        { id: '2200', slotId: '2200', scheduledTime: '22:00', status: 'not-due' } as any,
      ],
    },
    {
      id: 'mar-ord-2',
      drugName: 'Insulin Regular (Human)',
      strength: '100 IU/mL',
      formLabel: 'Subcutaneous Injection',
      formularyCode: 'FORM-END-002',
      doseLabel: '8 units',
      routeLabel: 'Subcutaneous',
      siteLabel: 'Abdomen',
      frequencyCode: 'TDS AC',
      highAlert: true,
      dualSignVerified: false,
      administrations: [
        { slotId: '0800', scheduledTime: '08:00', status: 'given', administeredAtLabel: '07:55', bcmaScanned: true },
        { slotId: '1400', scheduledTime: '14:00', status: 'held', holdReason: 'Pre-meal RBS 68 mg/dL' },
        { slotId: '1800', scheduledTime: '18:00', status: 'due' },
        { slotId: '2200', scheduledTime: '22:00', status: 'not-due' },
      ],
    },
  ],
};

export const encounterSummaryPrintFixture: EncounterSummaryPrintViewModel = {
  documentMode: 'opd-rx',
  facilityName: 'Dr. Rajendra Prasad Centre for Ophthalmic Sciences',
  facilityDepartment: 'Vitreoretinal & Ocular Oncology Service · Unit II',
  encounterDateLabel: '12 Nov 2026',
  encounterId: 'ENC-2026-99201',
  patientName: 'Ananya Sharma',
  patientAgeSex: '58y / Female',
  patientIdentifiers: [
    { label: 'UHID', value: 'UHID-2026-44109' },
    { label: 'ABHA', value: '91-4421-8802-1194' },
  ],
  careSettingLabel: 'OPD Specialty Clinic',
  allergiesSummary: ['Sulfonamides (Maculopapular rash)'],
  chronicConditionsSummary: ['Type 2 Diabetes Mellitus (12 yrs)', 'Primary Open-Angle Glaucoma OU'],
  vitalsSummary: [
    { label: 'BP', value: '132/82 mmHg' },
    { label: 'HbA1c', value: '7.4%' },
    { label: 'IOP', value: 'OD 16 / OS 15 mmHg (GAT)' },
  ],
  diagnoses: [
    {
      id: 'dx-1',
      code: 'E11.351',
      label: 'Proliferative diabetic retinopathy with diabetic macular oedema',
      status: 'confirmed',
      laterality: 'OD',
      onsetLabel: '3 months',
    },
  ],
  historySummary: [
    { code: 'CC', value: 'Metamorphopsia and gradual central blurring in right eye for 6 weeks.' },
    { code: 'PMH', value: 'On oral glimepiride + metformin; pseudophakic OD (2024).' },
  ],
  examinationSummary: [
    { code: 'BCVA', value: 'OD 6/18 (LogMAR +0.48) · OS 6/6 (LogMAR 0.00)' },
    { code: 'SLE/Fundus', value: 'OD PCIOL stable; macular thickening with hard exudates within 500 µm of fovea.' },
  ],
  pacsKeyFindingsSummary: ['OCT Macula OD (ACC-2026-8841): CST 412 µm with subfoveal neurosensory detachment.'],
  prescriptions: [
    {
      id: 'prx-1',
      drugName: 'Nepafenac',
      strength: '0.1% w/v',
      formLabel: 'Ophthalmic Suspension',
      formularyCode: 'OPH-NSAID-02',
      doseQtyUnit: '1 drop',
      frequencyPattern: '1 - 1 - 1 - 0 (TDS)',
      routeSite: 'Topical · OD',
      durationLabel: '6 weeks',
      instructions: 'Shake well before instillation',
    },
    {
      id: 'prx-2',
      drugName: 'Metformin Hydrochloride SR',
      strength: '500 mg',
      formLabel: 'Sustained-Release Tablet',
      formularyCode: 'END-BIG-01',
      doseQtyUnit: '1 tab',
      frequencyPattern: '1 - 0 - 0 - 1 (BD)',
      routeSite: 'Oral',
      durationLabel: '30 days',
      dispenseTotalLabel: 'Dispense: 60 tabs',
      instructions: 'Swallow whole after meals',
    },
  ],
  investigations: [
    {
      id: 'inv-1',
      category: 'Ophthalmic / Specialty',
      code: 'OCT-MAC-OU',
      name: 'Repeat Spectral-Domain OCT Macula (OD/OS) at 4 weeks post-injection',
      priority: 'Routine',
      indication: 'Quantify CST response after anti-VEGF therapy',
      status: 'Ordered',
    },
  ],
  treatmentAdvises: [
    'Planned for intravitreal anti-VEGF injection (Ranibizumab 0.5 mg / 0.05 mL) in Right Eye (OD) under aseptic OT protocol.',
    'Maintain strict glycaemic and blood pressure control; report immediately if ocular pain, redness, or drop in vision occurs.',
  ],
  crossConsultations: [
    {
      id: 'cc-1',
      careSetting: 'opd',
      targetSpecialty: 'Endocrinology & Metabolism',
      targetConsultant: 'Dr R. K. Verma',
      urgency: 'Routine',
      reasonForConsult: 'Diabetic macular oedema progression',
      clinicalQuestion: 'Optimise systemic glycaemic regimen prior to bilateral retinal intervention',
      locationOrClinic: 'Endocrine OPD Block B',
      status: 'Requested',
    },
  ],
  followUpDateLabel: 'Review in Retina Clinic after 4 weeks with repeat OCT Macula',
  prescriberName: 'Dr Vivek Gupta, MD',
  prescriberRegNo: 'MCI-48291',
  signedAtLabel: '12 Nov 2026 10:15 IST',
};

const meta: Meta = {
  title: 'EMR / Encounter / Clinical surfaces',
  decorators: [
    moduleMetadata({
      imports: [
        EmrPacsViewerComponent,
        EmrSpecialtyExamMatrixComponent,
        EmrInpatientMarComponent,
        EmrEncounterSummaryPrintComponent,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Unified L4 encounter clinical surfaces: Multi-Viewport DICOMweb PACS Viewer, Multi-Specialty Examination & Dosing Matrix, Inpatient eMAR & Nursing Kardex Grid, and Print-Ready OPD Prescription / IPD Discharge Summary.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const PacsViewerCompare: Story = {
  render: () => ({
    props: { model: pacsViewerFixture },
    template: `<div class="emr-story-surface"><emr-pacs-viewer [model]="model" /></div>`,
  }),
};

export const SpecialtyExamMatrixOphthalmology: Story = {
  render: () => ({
    props: { model: specialtyExamMatrixFixture },
    template: `<div class="emr-story-surface"><emr-specialty-exam-matrix [model]="model" /></div>`,
  }),
};

export const InpatientMarGrid: Story = {
  render: () => ({
    props: { model: inpatientMarFixture },
    template: `<div class="emr-story-surface"><emr-inpatient-mar [model]="model" /></div>`,
  }),
};

export const EncounterSummaryPrintOpd: Story = {
  render: () => ({
    props: { model: encounterSummaryPrintFixture },
    template: `<div class="emr-story-surface"><emr-encounter-summary-print [model]="model" /></div>`,
  }),
};
