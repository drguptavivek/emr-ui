import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import {
  EmrAbdmHealthLockerPanelComponent,
  EmrAudiogramComponent,
  EmrChemoRegimenRoadmapComponent,
  EmrEncounterChargeSheetComponent,
  EmrGrowthChartComponent,
  EmrImmunizationLedgerComponent,
  EmrOdontogramComponent,
  EmrPartogramComponent,
  EmrReferralTrackerComponent,
  EmrWaveformStripViewerComponent,
  type EmrAbdmHealthLockerPanelViewModel,
  type EmrAudiogramViewModel,
  type EmrChemoRegimenRoadmapViewModel,
  type EmrEncounterChargeSheetViewModel,
  type EmrGrowthChartViewModel,
  type EmrImmunizationLedgerViewModel,
  type EmrOdontogramViewModel,
  type EmrPartogramViewModel,
  type EmrReferralTrackerViewModel,
  type EmrWaveformStripViewerViewModel,
} from '../domain/emr-maternal-peds-specialty-abdm.component';

export const partogramActiveLabourFixture: EmrPartogramViewModel = {
  id: 'parto-lcg-01',
  title: 'WHO Labour Care Guide (LCG) Active First-Stage Partogram',
  subtitle: 'Spontaneous Active Labour · Oxytocin Augmentation Monitoring',
  gravidaParaLabel: 'G2P1L1 · 39w 4d · Cephalic LOA',
  membraneStatus: 'Clear Liquor',
  alertStatus: 'alert-line',
  selectedHour: 4,
  observations: [
    {
      hour: 1,
      timeLabel: '08:00',
      cervicalDilationCm: 5,
      descentStation: -2,
      fhrBpm: 138,
      contractionsPer10Min: 3,
    },
    {
      hour: 2,
      timeLabel: '09:00',
      cervicalDilationCm: 6,
      descentStation: -1,
      fhrBpm: 144,
      contractionsPer10Min: 4,
    },
    {
      hour: 3,
      timeLabel: '10:00',
      cervicalDilationCm: 7,
      descentStation: 0,
      fhrBpm: 148,
      contractionsPer10Min: 4,
      oxytocinUnitsPerL: 2.5,
    },
    {
      hour: 4,
      timeLabel: '11:00',
      cervicalDilationCm: 9,
      descentStation: 1,
      fhrBpm: 142,
      contractionsPer10Min: 5,
      oxytocinUnitsPerL: 5.0,
    },
  ],
};

export const growthChartWhoUnderFiveFixture: EmrGrowthChartViewModel = {
  id: 'growth-who-01',
  title: 'WHO Child Growth Standards (0–5 Years) Centile & Z-Score Chart',
  subtitle: 'Longitudinal Anthropometry · Weight-for-Age & Stunting/Wasting Surveillance',
  standardLabel: 'WHO 0-5y',
  activeMetric: 'weight-for-age',
  midParentalHeightCm: 166.5,
  selectedPointId: 'g-18m',
  points: [
    {
      id: 'g-birth',
      ageLabel: 'Birth',
      ageMonths: 0,
      value: 3.1,
      unit: 'kg',
      centile: 42,
      zScore: -0.2,
      flag: 'normal',
    },
    {
      id: 'g-6m',
      ageLabel: '6 Months',
      ageMonths: 6,
      value: 7.4,
      unit: 'kg',
      centile: 38,
      zScore: -0.35,
      flag: 'normal',
    },
    {
      id: 'g-12m',
      ageLabel: '12 Months',
      ageMonths: 12,
      value: 9.2,
      unit: 'kg',
      centile: 44,
      zScore: -0.18,
      flag: 'normal',
    },
    {
      id: 'g-18m',
      ageLabel: '18 Months',
      ageMonths: 18,
      value: 10.8,
      unit: 'kg',
      centile: 48,
      zScore: -0.05,
      flag: 'normal',
    },
  ],
};

export const immunizationLedgerUipFixture: EmrImmunizationLedgerViewModel = {
  id: 'imm-uip-01',
  title: 'National UIP & IAP Pediatric Immunization Ledger',
  subtitle: 'Cold-Chain Batch Traceability, VVM Status & AEFI Surveillance',
  scheduleStandard: 'India MoHFW UIP + IAP 2026',
  activeFilter: 'all',
  selectedDoseId: 'imm-3',
  doses: [
    {
      id: 'imm-1',
      vaccineName: 'BCG + OPV-0 + Hep-B Birth Dose',
      doseNumberLabel: 'Birth Cohort',
      ageGroupLabel: 'Birth',
      status: 'administered',
      dateLabel: '10 Jan 2026',
      batchLotNumber: 'SII-BCG-4412',
      siteAndRoute: 'Left Upper Arm ID / Oral / Right Thigh IM',
    },
    {
      id: 'imm-2',
      vaccineName: 'Pentavalent-1 + Rotavirus-1 + fIPV-1 + PCV-1',
      doseNumberLabel: 'Dose 1',
      ageGroupLabel: '6 Weeks',
      status: 'administered',
      dateLabel: '24 Feb 2026',
      batchLotNumber: 'BBIL-PENTA-882',
      siteAndRoute: 'Anterolateral Thigh IM',
    },
    {
      id: 'imm-3',
      vaccineName: 'Pentavalent-2 + Rotavirus-2',
      doseNumberLabel: 'Dose 2',
      ageGroupLabel: '10 Weeks',
      status: 'overdue',
      siteAndRoute: 'Anterolateral Thigh IM',
    },
    {
      id: 'imm-4',
      vaccineName: 'Measles-Rubella (MR-1) + PCV Booster + Vitamin A',
      doseNumberLabel: 'Dose 1',
      ageGroupLabel: '9 Months',
      status: 'due',
      siteAndRoute: 'Right Upper Arm SC',
    },
  ],
};

export const waveformStripEcgFixture: EmrWaveformStripViewerViewModel = {
  id: 'ecg-strip-01',
  title: '12-Lead Diagnostic ECG & Rhythm Caliper Strip',
  subtitle: 'Bedside Telemetry & Bazett QTc Interval Verification',
  modality: '12-Lead ECG',
  paperSpeed: '25 mm/s',
  gain: '10 mm/mV',
  intervals: {
    hrBpm: 78,
    prMs: 164,
    qrsMs: 88,
    qtcMs: 416,
  },
  activeLeadId: 'II',
  leads: [
    {
      id: 'II',
      label: 'Lead II (Rhythm)',
      samplePoints: [0.0, 0.15, 0.0, -0.1, 1.25, -0.25, 0.0, 0.32, 0.0],
      rhythmNote: 'Regular sinus P waves preceding every QRS complex',
    },
    {
      id: 'V1',
      label: 'Lead V1',
      samplePoints: [0.0, 0.08, 0.22, -0.95, 0.0, -0.12, 0.0],
      rhythmNote: 'Normal rS septal morphology',
    },
    {
      id: 'V5',
      label: 'Lead V5',
      samplePoints: [0.0, 0.12, -0.08, 1.45, -0.15, 0.38, 0.0],
      rhythmNote: 'No ST-segment elevation or depression',
    },
  ],
  interpretation: 'Normal sinus rhythm at 78 bpm. Normal axis, normal PR (164 ms) and QTc (416 ms).',
  criticalAlert: false,
  signed: true,
};

export const odontogramFdiChartFixture: EmrOdontogramViewModel = {
  id: 'odonto-fdi-01',
  title: 'FDI Two-Digit Dental Arch Chart & Periodontal Pocket Record',
  subtitle: 'Comprehensive Caries, Endodontic RCT, Crown & DMFT Epidemiological Index',
  dentitionMode: 'permanent-fdi',
  selectedToothNumber: '16',
  teeth: [
    { toothNumber: '16', arch: 'upper', status: 'caries', pocketDepthMm: 5, note: 'Mesio-occlusal dentinal caries' },
    { toothNumber: '11', arch: 'upper', status: 'sound', pocketDepthMm: 2 },
    { toothNumber: '21', arch: 'upper', status: 'sound', pocketDepthMm: 2 },
    { toothNumber: '26', arch: 'upper', status: 'endodontic-rct', pocketDepthMm: 3, note: 'Obturated 3 canals + PFM crown planned' },
    { toothNumber: '36', arch: 'lower', status: 'missing', note: 'Extracted 2023; implant site evaluation' },
    { toothNumber: '31', arch: 'lower', status: 'sound', pocketDepthMm: 2 },
    { toothNumber: '41', arch: 'lower', status: 'sound', pocketDepthMm: 2 },
    { toothNumber: '46', arch: 'lower', status: 'restored-filling', pocketDepthMm: 3, note: 'Intact Class II composite restoration' },
  ],
};

export const audiogramPureToneFixture: EmrAudiogramViewModel = {
  id: 'audio-pta-01',
  title: 'Bilateral Pure-Tone Audiogram (250–8000 Hz) & Jerger Tympanometry',
  subtitle: 'Air & Bone Conduction Thresholds, Speech Discrimination Score (SDS) & Middle Ear Compliance',
  activeConductionView: 'both',
  rightEar: {
    ear: 'Right',
    ptaDbHl: 16,
    sdsPct: 98,
    tympanogramType: 'Type A',
    degreeClassification: 'Normal Hearing Sensitivity (<= 20 dB HL)',
    thresholds: [
      { frequencyHz: 250, airDbHl: 15, boneDbHl: 10 },
      { frequencyHz: 500, airDbHl: 15, boneDbHl: 10 },
      { frequencyHz: 1000, airDbHl: 15, boneDbHl: 10 },
      { frequencyHz: 2000, airDbHl: 20, boneDbHl: 15 },
      { frequencyHz: 4000, airDbHl: 20, boneDbHl: 15 },
      { frequencyHz: 8000, airDbHl: 25 },
    ],
  },
  leftEar: {
    ear: 'Left',
    ptaDbHl: 42,
    sdsPct: 92,
    tympanogramType: 'Type B',
    degreeClassification: 'Moderate Conductive Hearing Loss (Air-Bone Gap 25 dB)',
    thresholds: [
      { frequencyHz: 250, airDbHl: 45, boneDbHl: 15, masked: true },
      { frequencyHz: 500, airDbHl: 45, boneDbHl: 15, masked: true },
      { frequencyHz: 1000, airDbHl: 40, boneDbHl: 15, masked: true },
      { frequencyHz: 2000, airDbHl: 40, boneDbHl: 15, masked: true },
      { frequencyHz: 4000, airDbHl: 35, boneDbHl: 15, masked: true },
      { frequencyHz: 8000, airDbHl: 35 },
    ],
  },
};

export const chemoRegimenRoadmapFixture: EmrChemoRegimenRoadmapViewModel = {
  id: 'chemo-folfox-01',
  title: 'Systemic Oncology Chemotherapy Protocol & Pre-Cycle ANC/Platelet Gate',
  subtitle: 'Adjuvant mFOLFOX6 (14-Day Cycle) · Mosteller BSA & CTCAE v5.0 Dose Modification',
  protocolName: 'mFOLFOX6 (Oxaliplatin + Leucovorin + 5-FU)',
  diagnosisLabel: 'Stage IIIB Sigmoid Colon Adenocarcinoma (pT3N1bM0, MSS)',
  bsaM2: 1.76,
  ecogStatus: 1,
  labClearancePassed: true,
  ancCountLabel: '2,180 /µL (Gate >= 1,500)',
  plateletCountLabel: '164,000 /µL (Gate >= 100,000)',
  selectedCycleNumber: 3,
  cycles: [
    {
      cycleNumber: 1,
      plannedDate: '2026-10-01',
      status: 'completed',
      dosePct: 100,
      agentsSummary: 'Oxaliplatin 85 mg/m² IV + Leucovorin 400 mg/m² + 5-FU 400 mg/m² bolus & 2400 mg/m² 46h pump',
    },
    {
      cycleNumber: 2,
      plannedDate: '2026-10-15',
      status: 'completed',
      dosePct: 100,
      agentsSummary: 'Oxaliplatin 85 mg/m² IV + Leucovorin 400 mg/m² + 5-FU 2400 mg/m² 46h pump',
      toxicityGradeNote: 'CTCAE Grade 1 cold-induced paresthesia (resolved in 4 days)',
    },
    {
      cycleNumber: 3,
      plannedDate: '2026-10-29',
      status: 'active-cycle',
      dosePct: 100,
      agentsSummary: 'Oxaliplatin 85 mg/m² IV + Leucovorin 400 mg/m² + 5-FU 2400 mg/m² 46h pump',
    },
    {
      cycleNumber: 4,
      plannedDate: '2026-11-12',
      status: 'planned',
      dosePct: 80,
      agentsSummary: 'Planned 80% Oxaliplatin dose reduction if Grade 2 neuropathy persists',
    },
  ],
};

export const referralTrackerClosedLoopFixture: EmrReferralTrackerViewModel = {
  id: 'ref-loop-01',
  title: 'Closed-Loop Specialty Consultation & Inter-Facility Referral Tracker',
  subtitle: 'Urgency Triage, Receiving Specialist Acceptance & Consult Closure Summary',
  activeFilter: 'all',
  selectedReferralId: 'ref-1',
  referrals: [
    {
      id: 'ref-1',
      targetSpecialty: 'Pediatric Ophthalmology (ROP Screening)',
      receivingFacilityOrDoctor: 'Dr. Vivek Gupta · Retina & ROP Service',
      urgency: 'urgent',
      status: 'completed-report-filed',
      clinicalQuestion: '30-week preterm neonate (BW 1240 g) day-28 ROP screening examination.',
      consultantReplySummary: 'Zone II Stage 1 ROP without plus disease; repeat indirect ophthalmoscopy in 2 weeks.',
      createdAtLabel: '05 Nov 2026',
    },
    {
      id: 'ref-2',
      targetSpecialty: 'Maternal-Fetal Medicine (High-Risk Obstetrics)',
      receivingFacilityOrDoctor: 'Perinatal Center Level III',
      urgency: 'emergent',
      status: 'accepted',
      clinicalQuestion: 'Severe preeclampsia at 33w 2d with abnormal umbilical artery Doppler.',
      createdAtLabel: '12 Nov 2026',
    },
  ],
};

export const encounterChargeSheetPmjayFixture: EmrEncounterChargeSheetViewModel = {
  id: 'charge-pmjay-01',
  title: 'Encounter Coding, Tariff & PM-JAY Pre-Authorization Charge Sheet',
  subtitle: 'ICD-10 / HBP 2.2 Package Coding, Payer Coverage Split & Net Patient Payable',
  payerScheme: 'Ayushman Bharat PM-JAY (National Health Authority)',
  preAuthStatus: 'preauth-approved',
  preAuthNumber: 'PMJAY-2026-IN-90841',
  currencySymbol: '₹',
  primaryDiagnosisCode: 'ICD-10 O82.0 · Delivery by elective caesarean section',
  lineItems: [
    {
      id: 'li-1',
      code: 'HBP-OB-014',
      description: 'Lower Segment Caesarean Section (LSCS) Comprehensive Package',
      category: 'procedure',
      quantity: 1,
      unitPrice: 14500,
      coveredByPayer: true,
    },
    {
      id: 'li-2',
      code: 'LAB-NEONAT-02',
      description: 'Newborn Cord Blood TSH, G6PD & Bilirubin Screening Panel',
      category: 'diagnostics',
      quantity: 1,
      unitPrice: 1200,
      coveredByPayer: true,
    },
    {
      id: 'li-3',
      code: 'ROOM-UPG-01',
      description: 'Optional Private Deluxe Room Differential (2 Days)',
      category: 'consumables',
      quantity: 2,
      unitPrice: 1500,
      coveredByPayer: false,
    },
  ],
};

export const abdmHealthLockerFixture: EmrAbdmHealthLockerPanelViewModel = {
  id: 'abdm-locker-01',
  title: 'Ayushman Bharat Digital Mission (ABDM) Health Locker & Consent Panel',
  subtitle: 'ABHA Identity Verification, OPD Scan & Share Token & DEPA / FHIR R4 Consent Artefacts',
  abhaNumber: '91-4821-7734-9902',
  abhaAddress: 'priya.sharma@abdm',
  kycVerified: true,
  scanAndShareToken: 'OPD-TOKEN-108',
  linkedCareContextsCount: 7,
  selectedConsentId: 'abdm-con-1',
  consents: [
    {
      id: 'abdm-con-1',
      requesterHiuName: 'AIIMS Perinatal & Pediatric Center (HIU)',
      purpose: 'Care Management (CAREMGT)',
      status: 'GRANTED',
      hiTypes: ['OPConsultation', 'Prescription', 'DiagnosticReport', 'ImmunizationRecord'],
      validUntilLabel: '30 Jun 2027',
    },
    {
      id: 'abdm-con-2',
      requesterHiuName: 'Regional Oncology & Diagnostic Institute (HIU)',
      purpose: 'Self Requested / Second Opinion (PATRQT)',
      status: 'REQUESTED',
      hiTypes: ['DischargeSummary', 'DiagnosticReport'],
      validUntilLabel: '15 Dec 2026',
    },
  ],
};

const meta: Meta = {
  title: 'EMR / Maternal-Child, Specialty Diagnostics & Claims-ABDM',
  decorators: [
    moduleMetadata({
      imports: [
        EmrPartogramComponent,
        EmrGrowthChartComponent,
        EmrImmunizationLedgerComponent,
        EmrWaveformStripViewerComponent,
        EmrOdontogramComponent,
        EmrAudiogramComponent,
        EmrChemoRegimenRoadmapComponent,
        EmrReferralTrackerComponent,
        EmrEncounterChargeSheetComponent,
        EmrAbdmHealthLockerPanelComponent,
      ],
    }),
  ],
};

export default meta;

export const PartogramActiveLabour: StoryObj = {
  render: () => ({
    props: { model: partogramActiveLabourFixture },
    template: `<emr-partogram [model]="model" />`,
  }),
};

export const GrowthChartWhoUnderFive: StoryObj = {
  render: () => ({
    props: { model: growthChartWhoUnderFiveFixture },
    template: `<emr-growth-chart [model]="model" />`,
  }),
};

export const ImmunizationLedgerUip: StoryObj = {
  render: () => ({
    props: { model: immunizationLedgerUipFixture },
    template: `<emr-immunization-ledger [model]="model" />`,
  }),
};

export const WaveformStripEcg: StoryObj = {
  render: () => ({
    props: { model: waveformStripEcgFixture },
    template: `<emr-waveform-strip-viewer [model]="model" />`,
  }),
};

export const OdontogramFdiChart: StoryObj = {
  render: () => ({
    props: { model: odontogramFdiChartFixture },
    template: `<emr-odontogram [model]="model" />`,
  }),
};

export const AudiogramPureTone: StoryObj = {
  render: () => ({
    props: { model: audiogramPureToneFixture },
    template: `<emr-audiogram [model]="model" />`,
  }),
};

export const ChemoRegimenRoadmap: StoryObj = {
  render: () => ({
    props: { model: chemoRegimenRoadmapFixture },
    template: `<emr-chemo-regimen-roadmap [model]="model" />`,
  }),
};

export const ReferralTrackerClosedLoop: StoryObj = {
  render: () => ({
    props: { model: referralTrackerClosedLoopFixture },
    template: `<emr-referral-tracker [model]="model" />`,
  }),
};

export const EncounterChargeSheetPmjay: StoryObj = {
  render: () => ({
    props: { model: encounterChargeSheetPmjayFixture },
    template: `<emr-encounter-charge-sheet [model]="model" />`,
  }),
};

export const AbdmHealthLocker: StoryObj = {
  render: () => ({
    props: { model: abdmHealthLockerFixture },
    template: `<emr-abdm-health-locker-panel [model]="model" />`,
  }),
};
