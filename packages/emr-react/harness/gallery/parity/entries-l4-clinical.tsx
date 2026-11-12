'use client';

import { Text, View } from 'react-native';
import type {
  CaptureStatusBarIntent,
  CaptureStatusBarViewModel,
  ClinicalListIntent,
  ClinicalListItem,
  ClinicalNoteWorkspaceIntent,
  ClinicalNoteWorkspaceViewModel,
  DiagnosticResultIntent,
  DiagnosticResultViewModel,
  DoseScheduleIntent,
  DoseScheduleViewModel,
  EmrAppShellIntent,
  EmrAppShellModel,
  EmrClinicalAnnotationCanvasIntent,
  EmrClinicalAnnotationCanvasState,
  EmrTopBarIntent,
  EncounterSummaryPrintIntent,
  EncounterSummaryPrintViewModel,
  FamilyPedigreeIntent,
  FamilyPedigreeViewModel,
  FlowsheetIntent,
  FlowsheetViewModel,
  GazePosition,
  InpatientMarIntent,
  InpatientMarViewModel,
  MedicationReconciliationIntent,
  MedicationReconciliationViewModel,
  MeridianCrossIntent,
  MeridianCrossViewModel,
  NavItem,
  NoteCaptureIntent,
  NoteCaptureViewModel,
  ObservationTrendIntent,
  ObservationTrendViewModel,
  OctFindingRecordIntent,
  OctFindingRecordViewModel,
  OcularMotilityIntent,
  OcularMotilityViewModel,
  PacChecklistIntent,
  PacChecklistViewModel,
  PacsViewerIntent,
  PacsViewerViewModel,
  PatientBannerIntent,
  PatientBannerViewModel,
  PrescribingRow,
  PrescribingTableIntent,
  ScoreResultCardIntent,
  ScoreResultCardViewModel,
  SpecialtyExamMatrixIntent,
  SpecialtyExamMatrixViewModel,
  SpectaclePrescriptionIntent,
  SpectaclePrescriptionViewModel,
  StagedChecklistIntent,
  StagedChecklistViewModel,
} from '@drguptavivek/emr-controller';
import { createClinicalNoteDemo } from '../../../../../examples/clinical-notes/clinical-note.fixture';
import {
  EmrAllergyList,
  EmrAppShell,
  EmrBottomTabBar,
  EmrButton,
  EmrCaptureStatusBar,
  EmrCard,
  EmrChronicDiseaseList,
  EmrClinicalAnnotationCanvas,
  EmrClinicalNoteWorkspace,
  EmrClinicalTranscript,
  EmrDiagnosticResultSummary,
  EmrDoseSchedule,
  EmrEncounterSummaryPrint,
  EmrEvidenceSuggestionList,
  EmrFamilyPedigree,
  EmrFieldValueRow,
  EmrInpatientMar,
  EmrLeftNav,
  EmrMedicationList,
  EmrMedicationReconciliation,
  EmrMeridianCross,
  EmrObservationFlowsheet,
  EmrObservationTrend,
  EmrOctFindingRecord,
  EmrOcularMotilityChart,
  EmrPacChecklist,
  EmrPacsViewer,
  EmrPatientBanner,
  EmrPersonalHistoryList,
  EmrPrescribingTable,
  EmrRightFlyout,
  EmrScoreResultCard,
  EmrSheet,
  EmrSpecialtyExamMatrix,
  EmrSpectaclePrescription,
  EmrStagedChecklist,
  EmrTopBar,
  EmrTopBarSearch,
  reduceFamilyPedigreeIntent,
  reduceStagedChecklistIntent,
  useEmrTheme,
  type EmrSearchGroup,
  type RightFlyoutIntent,
} from '../../../src';
import { PRESCRIBING_PRESETS } from '../prescribing-formulary.fixture';
import { makeSpecialtyExamFixture, reduceSpecialtyExamFixture } from '../specialty-exam.fixture';
import { LitElementHost } from './lit-element-host';
import { defineParityEntry, type ParityEntry } from './types';

function BodyNote({ text }: { text: string }) {
  const t = useEmrTheme();
  return <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: t.fontFamily }}>{text}</Text>;
}

const SHELL_SEARCH_GROUPS: EmrSearchGroup[] = [
  {
    id: 'patients',
    label: 'Active Patients',
    results: [
      { id: 'p1', label: 'Aarav Sharma · MRN-2026-0842', sub: 'OPD Room 4 · Pseudophakic CMO OD', badge: { label: 'Active', tone: 'info' } },
      { id: 'p2', label: 'Ananya Rao · MRN-2026-0911', sub: 'OPD Room 2 · POAG Review', badge: { label: 'Waiting', tone: 'warning' } },
    ],
  },
];

const SHELL_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Encounter Summary', badge: { label: 'OPD', tone: 'info' } },
  {
    id: 'exam-group',
    label: 'Clinical Documentation',
    children: [
      { id: 'va-iop', label: 'Refraction & Tonometry', badge: { label: 'Recorded', tone: 'success' } },
      { id: 'slit-lamp', label: 'Slit-Lamp & Fundus' },
    ],
  },
  { id: 'orders', label: 'Rx & Investigations', badge: { label: '3', tone: 'warning' } },
];

const PATIENT_BANNER_SEED: PatientBannerViewModel = {
  patientId: 'MRN-2026-0842',
  displayName: 'Aarav Sharma',
  identifiers: [
    { label: 'MRN', value: 'MRN-2026-0842' },
    { label: 'National Health ID', value: '91-4820-7731-9904' },
  ],
  ageLabel: '58 y',
  sexLabel: 'Male',
  weightLabel: '68 kg',
  careSetting: 'opd',
  careSettingLabel: 'Outpatient · Room 4',
  locationLabel: 'Ophthalmology Wing',
  encounterLabel: 'ENC-2026-88412',
  criticality: { label: 'Steroid Responder', tone: 'warning' },
  allergyStatus: { label: '2 Drug Allergies', tone: 'danger' },
  allergyChipPrefix: 'Allergy:',
  allergies: [
    { id: 'a1', label: 'Penicillin (Anaphylaxis)', tone: 'danger', reactionLabel: 'Anaphylaxis', provenanceLabel: 'Allergy Registry' },
    { id: 'a2', label: 'Sulfonamides (Rash)', tone: 'warning', reactionLabel: 'Maculopapular rash', provenanceLabel: 'OPD Intake' },
  ],
  chronicDiseases: [
    { id: 'c1', label: 'Type 2 Diabetes Mellitus', tone: 'warning' },
    { id: 'c2', label: 'POAG (OU)', tone: 'info' },
  ],
  alerts: [{ id: 'al1', label: 'IOP 22 mmHg OD', tone: 'warning' }],
  vitals: [
    { id: 'v1', label: 'BCVA OD/OS', valueLabel: '6/12 · 6/6', tone: 'warning', trendPoints: [6, 9, 12, 12] },
    { id: 'v2', label: 'IOP OD/OS', valueLabel: '22 / 15', unit: 'mmHg', tone: 'warning', trendPoints: [15, 17, 20, 22] },
    { id: 'v3', label: 'BP', valueLabel: '134/82', unit: 'mmHg', tone: 'neutral', trendPoints: [142, 138, 134] },
  ],
  layoutMode: 'banner',
  expanded: false,
};

const CAPTURE_BAR_SEED: CaptureStatusBarViewModel = {
  session: { dirty: true, saving: false, savedAt: '2026-10-14T09:40:00Z', conflict: null, error: null },
  savedAtLabel: '09:40',
  attributionLabel: 'Author: Dr. S. Iyer (Consultant Ophthalmologist) · ENC-2026-88412',
  signature: {
    status: { label: 'Draft in progress', tone: 'warning' },
    signatories: [],
    canSign: true,
    canAmend: false,
  },
  connection: { label: 'FHIR + DICOMweb Online', tone: 'success' },
};

const RX_SLOTS = [
  { id: 'm', label: 'Morning', timeHint: '08:00' },
  { id: 'a', label: 'Afternoon', timeHint: '14:00' },
  { id: 'e', label: 'Evening', timeHint: '18:00' },
  { id: 'n', label: 'Night', timeHint: '22:00' },
];

const RX_ROWS_SEED: readonly PrescribingRow[] = [
  {
    id: 'rx-1',
    drugName: 'Nepafenac',
    strength: '0.1% w/v',
    form: 'drop',
    formLabel: 'Eye drops',
    formularyCode: 'RXN-402188',
    route: 'ophthalmic',
    site: 'OD',
    doseAmount: 1,
    frequencyCode: 'TDS',
    slots: [
      { id: 'm', label: 'Morning', timeHint: '08:00', amount: 1 },
      { id: 'a', label: 'Afternoon', timeHint: '14:00', amount: 1 },
      { id: 'e', label: 'Evening', timeHint: '18:00', amount: 0 },
      { id: 'n', label: 'Night', timeHint: '22:00', amount: 1 },
    ],
    unitLabel: 'drop',
    allowedUnits: ['', 'drop'],
    durationCount: 28,
    durationUnit: 'days',
    foodRelation: '',
    instructions: '5-minute gap between eye drops.',
  },
  {
    id: 'rx-2',
    drugName: 'Brinzolamide',
    strength: '1% w/v',
    form: 'drop',
    formLabel: 'Eye drops',
    formularyCode: 'RXN-284519',
    route: 'ophthalmic',
    site: 'OD',
    doseAmount: 1,
    frequencyCode: 'BD',
    slots: [
      { id: 'm', label: 'Morning', timeHint: '08:00', amount: 1 },
      { id: 'a', label: 'Afternoon', timeHint: '14:00', amount: 0 },
      { id: 'e', label: 'Evening', timeHint: '18:00', amount: 0 },
      { id: 'n', label: 'Night', timeHint: '22:00', amount: 1 },
    ],
    unitLabel: 'drop',
    allowedUnits: ['', 'drop'],
    durationCount: 28,
    durationUnit: 'days',
    foodRelation: '',
    instructions: 'Punctal occlusion for 60 seconds.',
  },
];

const octFrameSvg = (title: string, cst: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 156" width="520" height="156"><rect width="520" height="156" fill="#09111a"/><path d="M20 122 Q260 118 500 122" stroke="#22c55e" stroke-width="2.5" fill="none"/><path d="M20 76 Q140 74 195 52 Q260 28 325 52 Q380 74 500 76" stroke="#38bdf8" stroke-width="2.5" fill="none"/><text x="18" y="24" fill="#e2e8f0" font-size="13" font-family="monospace">${title} · ${cst}</text></svg>`,
  )}`;

const PACS_SEED: PacsViewerViewModel = {
  title: 'Multi-Viewport PACS & SD-OCT Compare Viewer',
  layoutMode: '2-up-od-os',
  syncScroll: true,
  activeStudyId: 'oct-od',
  compareStudyId: 'oct-os',
  studies: [
    {
      id: 'oct-od',
      accessionNumber: 'ACC-2026-OCT-9921',
      dateLabel: 'Today 08:45',
      modality: 'OCT',
      bodyPart: 'Macula OD',
      title: 'SD-OCT Macular Cube 512×128 (OD)',
      status: 'Final Report',
      pacsEndpointLabel: 'DICOMweb · PACS-OPHTH-01',
      sliceCount: 25,
      currentSlice: 13,
      windowPreset: 'Retina/OCT',
      zoomPercent: 100,
      inverted: false,
      caliperMeasurementLabel: 'CST 418 µm (↑ +164 µm)',
      comparePriorDateLabel: '12 Aug 2026 (254 µm)',
      renderedFrameUrl: octFrameSvg('SD-OCT Macula OD', 'CST 418 µm'),
      radiologistImpression: 'Intraretinal cystoid spaces at fovea (Irvine-Gass CMO OD).',
      keyFindings: ['Central subfield thickness 418 µm', 'Intact outer photoreceptor band'],
    },
    {
      id: 'oct-os',
      accessionNumber: 'ACC-2026-OCT-9922',
      dateLabel: 'Today 08:47',
      modality: 'OCT',
      bodyPart: 'Macula OS',
      title: 'SD-OCT Macular Cube 512×128 (OS)',
      status: 'Final Report',
      pacsEndpointLabel: 'DICOMweb · PACS-OPHTH-01',
      sliceCount: 25,
      currentSlice: 13,
      windowPreset: 'Retina/OCT',
      zoomPercent: 100,
      inverted: false,
      caliperMeasurementLabel: 'CST 258 µm (Normal)',
      renderedFrameUrl: octFrameSvg('SD-OCT Macula OS', 'CST 258 µm'),
      radiologistImpression: 'Normal foveal contour OS.',
      keyFindings: ['Central subfield thickness 258 µm', 'No intraretinal or subretinal fluid'],
    },
  ],
  pinnedKeyImages: [],
};

const MAR_SEED: InpatientMarViewModel = {
  title: 'Inpatient eMAR & Ophthalmic Nursing Kardex',
  wardBedLabel: 'Ward 4 · Bed 14B',
  shiftLabel: 'Morning Shift (14 Oct 2026)',
  nurseLabel: 'RN K. Nair',
  timeColumns: [
    { id: 'm', timeLabel: '08:00', slotLabel: 'Morning' },
    { id: 'a', timeLabel: '14:00', slotLabel: 'Afternoon' },
    { id: 'n', timeLabel: '22:00', slotLabel: 'Night' },
  ],
  orders: [
    {
      id: 'mar-1',
      drugName: 'Nepafenac',
      strength: '0.1% w/v',
      formLabel: 'Eye drops',
      formularyCode: 'RXN-402188',
      doseLabel: '1 drop',
      routeLabel: 'Ophthalmic',
      siteLabel: 'OD',
      frequencyCode: 'TDS',
      administrations: [
        { slotId: 'm', scheduledTime: '08:00', status: 'given', administeredAtLabel: '08:04 · RN K.N.', bcmaScanned: true },
        { slotId: 'a', scheduledTime: '14:00', status: 'due' },
        { slotId: 'n', scheduledTime: '22:00', status: 'due' },
      ],
    },
    {
      id: 'mar-2',
      drugName: 'Mannitol 20%',
      strength: '20 g/100 mL',
      formLabel: 'IV Infusion',
      formularyCode: 'RXN-311474',
      doseLabel: '100 mL',
      routeLabel: 'IV over 20m',
      frequencyCode: 'STAT',
      highAlert: true,
      dualSignVerified: false,
      administrations: [
        { slotId: 'm', scheduledTime: '08:00', status: 'due' },
        { slotId: 'a', scheduledTime: '14:00', status: 'not-due' },
        { slotId: 'n', scheduledTime: '22:00', status: 'not-due' },
      ],
    },
  ],
};

const PRINT_SUMMARY_SEED: EncounterSummaryPrintViewModel = {
  documentMode: 'opd-rx',
  facilityName: 'Synthetic Eye & Multi-Specialty Institute',
  facilityDepartment: 'Department of Ophthalmology & Vitreoretina',
  encounterDateLabel: '14 Oct 2026 · 09:30 IST',
  encounterId: 'ENC-2026-88412',
  patientName: 'Aarav Sharma',
  patientAgeSex: '58 y / Male (68 kg)',
  patientIdentifiers: [
    { label: 'MRN', value: 'MRN-2026-0842' },
    { label: 'National Health ID', value: '91-4820-7731-9904' },
  ],
  careSettingLabel: 'Outpatient (OPD Room 4)',
  allergiesSummary: ['Penicillin (Anaphylaxis)', 'Sulfonamides (Rash)'],
  chronicConditionsSummary: ['Type 2 Diabetes Mellitus', 'Primary Open-Angle Glaucoma (OU)'],
  vitalsSummary: [
    { label: 'BCVA OD/OS', value: '6/12 / 6/6' },
    { label: 'IOP OD/OS', value: '22 / 15 mmHg' },
    { label: 'BP', value: '134/82 mmHg' },
  ],
  diagnoses: [
    { id: 'dx1', code: 'H59.031', label: 'Pseudophakic cystoid macular oedema, right eye', status: 'principal', laterality: 'OD' },
    { id: 'dx2', code: 'H40.41X2', label: 'Steroid-induced ocular hypertension, right eye', status: 'provisional', laterality: 'OD' },
  ],
  historySummary: [{ code: 'Chief Complaint', value: 'Blurred central vision in operated right eye for 5 days.' }],
  examinationSummary: [{ code: 'Ocular Exam', value: 'Quiet pseudophakia OD; dull foveal reflex with OCT CST 418 µm.' }],
  pacsKeyFindingsSummary: ['ACC-2026-OCT-9921: Intraretinal cystoid spaces OD (CST 418 µm); OS normal (258 µm).'],
  prescriptions: [
    {
      id: 'p1',
      drugName: 'Nepafenac',
      strength: '0.1%',
      formLabel: 'Eye drops',
      formularyCode: 'RXN-402188',
      doseQtyUnit: '1 drop',
      frequencyPattern: 'TDS (1-1-0-1)',
      routeSite: 'Ophthalmic · OD',
      durationLabel: '4 weeks',
      instructions: '5 min gap between drops.',
    },
  ],
  investigations: [
    { id: 'i1', category: 'Ophthalmic / Specialty', code: 'OCT-MAC', name: 'Repeat SD-OCT Macula OU in 3 weeks', priority: 'Routine', indication: 'Monitor CMO resolution', status: 'Ordered' },
  ],
  treatmentAdvises: ['Stop topical steroid drops in Right Eye immediately.', 'Maintain 5-minute interval between eye drops.'],
  crossConsultations: [],
  followUpDateLabel: 'Review in 3 weeks with repeat SD-OCT Macula',
  prescriberName: 'Dr. S. Iyer, MD (Consultant Ophthalmologist)',
  prescriberRegNo: 'SYN-REG-10482',
  signedAtLabel: '14 Oct 2026 09:42 IST',
};

const FLOWSHEET_SEED: FlowsheetViewModel = {
  id: 'iop-flowsheet',
  title: 'Post-operative IOP & Vitals Flowsheet',
  rows: [
    { id: 'iopOd', label: 'IOP Right (OD)', unitLabel: 'mmHg', referenceLabel: '10–21' },
    { id: 'iopOs', label: 'IOP Left (OS)', unitLabel: 'mmHg', referenceLabel: '10–21' },
    { id: 'bp', label: 'Blood Pressure', unitLabel: 'mmHg' },
  ],
  columns: [
    { id: 'c1', label: '08:00', sublabel: 'Day 1' },
    { id: 'c2', label: '12:00', sublabel: 'Day 1' },
    { id: 'c3', label: '16:00', sublabel: 'Day 1', current: true },
  ],
  emptyMessage: 'No observations recorded.',
  cells: {
    iopOd: {
      c1: { valueLabel: '24', flag: { label: 'High', tone: 'danger' }, editable: true },
      c2: { valueLabel: '20', editable: true },
      c3: { valueLabel: '17', editable: true, modified: true, deltaLabel: 'Δ −3' },
    },
    iopOs: {
      c1: { valueLabel: '16', editable: true },
      c2: { valueLabel: '15', editable: true },
      c3: { valueLabel: '15', editable: true },
    },
    bp: {
      c1: { valueLabel: '136/84', editable: true },
      c2: { valueLabel: '130/80', editable: true },
      c3: { valueLabel: '126/78', editable: true },
    },
  },
  selectedCell: { rowId: 'iopOd', columnId: 'c3' },
};

const TREND_SEED: ObservationTrendViewModel = {
  id: 'iop-trend',
  title: 'Intraocular Pressure Bilateral Trend (6 Months)',
  yLabel: 'mmHg',
  yMin: 8,
  yMax: 30,
  xMin: 0,
  xMax: 6,
  xGranularityLabel: 'Window',
  granularityOptions: [
    { id: '3m', label: '3 months' },
    { id: '6m', label: '6 months', selected: true },
  ],
  xTicks: [
    { x: 0, label: 'Baseline' },
    { x: 2, label: 'Month 2' },
    { x: 4, label: 'Month 4' },
    { x: 6, label: 'Month 6' },
  ],
  yTicks: [10, 15, 20, 25, 30].map((y) => ({ y, label: String(y) })),
  series: [
    {
      id: 'od',
      label: 'Right eye (OD)',
      tone: 'info',
      points: [
        { id: 'od0', x: 0, y: 26, xLabel: 'Baseline', valueLabel: '26 mmHg', flag: { label: 'High', tone: 'danger' } },
        { id: 'od2', x: 2, y: 21, xLabel: 'Month 2', valueLabel: '21 mmHg' },
        { id: 'od4', x: 4, y: 18, xLabel: 'Month 4', valueLabel: '18 mmHg' },
        { id: 'od6', x: 6, y: 16, xLabel: 'Month 6', valueLabel: '16 mmHg' },
      ],
    },
    {
      id: 'os',
      label: 'Left eye (OS)',
      tone: 'neutral',
      dashed: true,
      points: [
        { id: 'os0', x: 0, y: 19, xLabel: 'Baseline', valueLabel: '19 mmHg' },
        { id: 'os2', x: 2, y: 17, xLabel: 'Month 2', valueLabel: '17 mmHg' },
        { id: 'os4', x: 4, y: 16, xLabel: 'Month 4', valueLabel: '16 mmHg' },
        { id: 'os6', x: 6, y: 15, xLabel: 'Month 6', valueLabel: '15 mmHg' },
      ],
    },
  ],
  bands: [{ id: 'target', label: 'Target 10–21 mmHg', yFrom: 10, yTo: 21, tone: 'success' }],
  selectedPointId: 'od0',
  summaryText: 'OD IOP reduced from 26 mmHg at baseline to 16 mmHg at 6 months.',
  emptyMessage: 'No IOP trend readings.',
};

const NOTE_CAPTURE_SEED: NoteCaptureViewModel = {
  id: 'ambient-opd',
  title: 'Ambient Clinical Transcript & Evidence Extraction',
  dictation: { status: 'idle', label: 'Dictation idle', canStart: true, canStop: false },
  segments: [
    { id: 's1', timeLabel: '00:05', speakerLabel: 'Clinician', text: 'How has the right eye vision been this week?', startMs: null, endMs: null, source: 'spoken' },
    { id: 's2', timeLabel: '00:11', speakerLabel: 'Patient', text: 'Right eye has mild glare for three days, no severe pain.', startMs: null, endMs: null, source: 'spoken', editable: true },
    { id: 's3', timeLabel: '00:24', speakerLabel: 'Clinician', text: 'Applanation pressure is 22 in the right eye and 15 in the left eye.', startMs: null, endMs: null, source: 'spoken' },
  ],
  spans: [
    { id: 'sp1', segmentId: 's2', start: 0, end: 39, suggestionIds: ['sg1'] },
    { id: 'sp2', segmentId: 's3', start: 24, end: 43, suggestionIds: ['sg2'] },
  ],
  suggestions: [
    {
      id: 'sg1',
      path: ['history', 'complaint'],
      fieldLabel: 'Chief complaint',
      sectionLabel: 'History',
      value: 'Mild glare in right eye for 3 days',
      valueLabel: 'Mild glare in right eye for 3 days',
      spanIds: ['sp1'],
      status: 'pending',
      valueType: 'text',
      confidence: { label: 'High confidence', tone: 'success' },
    },
    {
      id: 'sg2',
      path: ['exam', 'iopOd'],
      fieldLabel: 'IOP Right Eye (OD)',
      sectionLabel: 'Tonometry',
      value: 22,
      valueLabel: '22 mmHg',
      spanIds: ['sp2'],
      status: 'pending',
      valueType: 'integer',
      confidence: { label: 'High confidence', tone: 'success' },
    },
  ],
  highlightedSpanIds: ['sp1'],
  highlightedSuggestionIds: ['sg1'],
  canSummarise: true,
};

function reduceNoteCapture(m: NoteCaptureViewModel, i: NoteCaptureIntent): NoteCaptureViewModel {
  if (i.type === 'suggestionAccepted') {
    return { ...m, suggestions: m.suggestions.map((s) => (s.id === i.suggestionId ? { ...s, status: 'accepted' } : s)) };
  }
  if (i.type === 'suggestionRejected') {
    return { ...m, suggestions: m.suggestions.map((s) => (s.id === i.suggestionId ? { ...s, status: 'rejected' } : s)) };
  }
  if (i.type === 'suggestionSelected') {
    return { ...m, highlightedSuggestionIds: [i.suggestionId], highlightedSpanIds: m.suggestions.find((s) => s.id === i.suggestionId)?.spanIds ?? [] };
  }
  if (i.type === 'dictationStartRequested') {
    return { ...m, dictation: { status: 'listening', label: 'Listening…', canStart: false, canStop: true } };
  }
  if (i.type === 'dictationStopRequested') {
    return { ...m, dictation: { status: 'idle', label: 'Dictation idle', canStart: true, canStop: false } };
  }
  return m;
}

const STAGED_CHECKLIST_SEED: StagedChecklistViewModel = {
  instanceId: 'who-cataract-01',
  schema: {
    id: 'cataract-safety',
    label: 'Ophthalmic Surgical Safety Checklist',
    description: 'WHO-adapted Sign In / Time Out / Sign Out workflow.',
    phases: [
      {
        id: 'sign-in',
        label: 'Sign In',
        description: 'Before regional block / topical anaesthesia',
        items: [
          { id: 'id-site', label: 'Patient identity, operative eye (OD) & IOL power (+21.0 D) verified', type: 'checkbox', required: true },
          { id: 'allergy', label: 'Known drug allergies reviewed', type: 'yes-no-na', required: true },
        ],
      },
      {
        id: 'time-out',
        label: 'Time Out',
        description: 'Before corneal incision',
        items: [
          { id: 'team', label: 'Surgical & nursing team briefed', type: 'checkbox', required: true },
          { id: 'povidone', label: 'Povidone-iodine 5% conjunctival prep completed', type: 'yes-no-na', required: true },
        ],
      },
      {
        id: 'sign-out',
        label: 'Sign Out',
        description: 'Before patient leaves OT',
        items: [
          { id: 'shield', label: 'Eye shield applied & post-op dropscharted', type: 'checkbox', required: true },
        ],
      },
    ],
  },
  items: {
    'id-site': { value: true },
    allergy: { value: 'yes' },
    team: { value: false },
    povidone: { value: null },
    shield: { value: null },
  },
  activePhaseId: 'sign-in',
};

const PAC_SEED: PacChecklistViewModel = {
  instanceId: 'pac-parity-1',
  title: 'Pre-Anaesthesia Assessment Checklist (PAC)',
  description: 'Controller-backed pre-operative assessment surface.',
  context: [
    { id: 'pt', label: 'Patient', value: 'Ananya Rao · MRN-204881' },
    { id: 'proc', label: 'Planned procedure', value: 'Phacoemulsification + PCIOL (OD)' },
  ],
  form: {
    schema: {
      id: 'pac-mini',
      label: 'Pre-op parameters',
      sections: [
        {
          id: 'main',
          label: 'Anaesthesia & Systemic Review',
          blocks: [
            { id: 'plan', label: 'Planned block', type: 'select', span: 6, options: [{ value: 'topical', label: 'Topical' }, { value: 'peribulbar', label: 'Peribulbar' }] },
            { id: 'notes', label: 'Systemic comorbidities', type: 'text', span: 6 },
          ],
        },
      ],
    },
    fields: {
      plan: { value: 'topical' },
      notes: { value: 'Controlled hypertension; ECG normal' },
    },
    repeatableGroups: {},
  },
  actions: [
    { id: 'save', label: 'Save draft', tone: 'secondary' },
    { id: 'submit', label: 'Request anaesthesia review', tone: 'primary' },
  ],
};

const PEDIGREE_SEED: FamilyPedigreeViewModel = {
  label: 'Hereditary Glaucoma Pedigree (Primary Open-Angle Glaucoma)',
  selectedPersonId: 'proband',
  people: [
    { id: 'father', displayName: 'Ravi Rao', relationshipLabel: 'Father', generation: -1, order: 0, age: 74, sex: 'male', lifeStatus: 'alive', lifeStatusLabel: 'Living', phenotype: 'affected', conditions: [{ label: 'POAG', tone: 'warning' }] },
    { id: 'mother', displayName: 'Meena Rao', relationshipLabel: 'Mother', generation: -1, order: 1, age: 70, sex: 'female', lifeStatus: 'alive', lifeStatusLabel: 'Living', phenotype: 'unaffected' },
    { id: 'proband', displayName: 'Ananya Rao', relationshipLabel: 'Proband', generation: 0, order: 0, age: 48, sex: 'female', lifeStatus: 'alive', lifeStatusLabel: 'Living', proband: true, phenotype: 'affected' },
    { id: 'sibling', displayName: 'Kiran Rao', relationshipLabel: 'Brother', generation: 0, order: 1, age: 45, sex: 'male', lifeStatus: 'alive', lifeStatusLabel: 'Living', phenotype: 'unaffected' },
  ],
  relationships: [
    { id: 'r1', fromPersonId: 'father', toPersonId: 'mother', relationshipLabel: 'Partner', kind: 'partner' },
    { id: 'r2', fromPersonId: 'father', toPersonId: 'proband', relationshipLabel: 'Parent-child', kind: 'parent-child' },
    { id: 'r3', fromPersonId: 'mother', toPersonId: 'proband', relationshipLabel: 'Parent-child', kind: 'parent-child' },
    { id: 'r4', fromPersonId: 'proband', toPersonId: 'sibling', relationshipLabel: 'Sibling', kind: 'sibling' },
  ],
};

const CANVAS_BG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><rect width="800" height="520" fill="#f8fafc"/><circle cx="400" cy="260" r="200" fill="#fff" stroke="#475f70" stroke-width="4"/><circle cx="330" cy="260" r="36" fill="none" stroke="#d97706" stroke-width="3"/><text x="400" y="495" text-anchor="middle" font-size="18" fill="#475f70" font-family="sans-serif">Synthetic Posterior Pole Sketch (OD)</text></svg>`,
)}`;

const ANNOTATION_CANVAS_SEED: EmrClinicalAnnotationCanvasState = {
  instanceId: 'retina-canvas-parity',
  title: 'Fundus Drawing & Lesion Annotation Canvas',
  description: 'Vector drawing canvas with class labels and layer controls.',
  imageTemplates: [
    { id: 'fundus-od', label: 'Posterior pole OD', imageUrl: CANVAS_BG, width: 800, height: 520, altText: 'Posterior pole outline' },
  ],
  availableLabels: [
    { id: 'break', label: 'Retinal break', color: '#dc2626' },
    { id: 'lattice', label: 'Lattice degeneration', color: '#2563eb' },
  ],
  selectedImageId: 'fundus-od',
  selectedLabelId: 'break',
  selectedTool: 'circle',
  brushColor: '#dc2626',
  brushWidth: 3,
  colourOptions: [
    { id: 'red', label: 'Red', hex: '#dc2626' },
    { id: 'blue', label: 'Blue', hex: '#2563eb' },
  ],
  widthOptions: [
    { id: 'w2', label: 'Medium', px: 3 },
    { id: 'w4', label: 'Thick', px: 5 },
  ],
  textContent: 'Horseshoe tear',
  layers: [
    {
      id: 'ly-1',
      tool: 'circle',
      label: 'Superotemporal tear',
      color: '#dc2626',
      strokeWidth: 3,
      visible: true,
      classIds: ['break'],
      center: { x: 0.62, y: 0.34 },
      radiusX: 0.07,
      radiusY: 0.06,
    },
  ],
  selectedLayerId: 'ly-1',
};

const SPECTACLE_SEED: SpectaclePrescriptionViewModel = {
  id: 'spec-rx-parity',
  label: 'Spectacle Prescription (OD / OS)',
  description: 'Refractive values synchronized across React and Lit.',
  eyes: [
    { id: 'od', label: 'Right eye', shortLabel: 'OD' },
    { id: 'os', label: 'Left eye', shortLabel: 'OS' },
  ],
  fields: [
    { id: 'sphere', label: 'Sphere', type: 'decimal', unit: 'D' },
    { id: 'cylinder', label: 'Cylinder', type: 'decimal', unit: 'D' },
    { id: 'axis', label: 'Axis', type: 'integer', unit: '°' },
    { id: 'addition', label: 'Near Add', type: 'decimal', unit: 'D' },
    { id: 'visual-acuity', label: 'BCVA', type: 'text' },
  ],
  values: {
    od: { sphere: '-1.50', cylinder: '-0.50', axis: '090', addition: '+2.00', 'visual-acuity': '6/6' },
    os: { sphere: '-1.25', cylinder: '-0.75', axis: '085', addition: '+2.00', 'visual-acuity': '6/6' },
  },
  notes: { od: 'Anti-reflective coating', os: 'Anti-reflective coating' },
};

const OCT_RECORD_SEED: OctFindingRecordViewModel = {
  id: 'oct-parity',
  title: 'SD-OCT Macular Finding Record (OD / OS)',
  eyes: [
    {
      eyeId: 'od',
      label: 'Right eye',
      shortLabel: 'OD',
      status: 'recorded',
      metadata: [
        { label: 'Protocol', value: 'Macular cube 512×128' },
        { label: 'Signal', value: '8/10' },
      ],
      frames: [
        { frameId: 'od-f1', seriesId: 's1', label: 'Horizontal foveal B-scan', kind: 'b-scan', altText: 'Synthetic OD B-scan', thumbnailUrl: octFrameSvg('OD B-Scan', '418 µm'), width: 520, height: 156 },
      ],
      selectedFrameId: 'od-f1',
      metrics: [{ id: 'cst', label: 'Central subfield thickness', valueLabel: '418 µm', referenceLabel: '220–300 µm', status: { label: 'Elevated', tone: 'warning' } }],
      findings: [
        { id: 'f-od-1', path: ['oct', 'od', 0], label: 'Intraretinal cystoid spaces', locationLabel: 'Foveal', status: 'recorded', badge: { label: 'Present', tone: 'warning' } },
      ],
      interpretation: 'Pseudophakic cystoid macular oedema OD.',
    },
    {
      eyeId: 'os',
      label: 'Left eye',
      shortLabel: 'OS',
      status: 'recorded',
      metadata: [
        { label: 'Protocol', value: 'Macular cube 512×128' },
        { label: 'Signal', value: '9/10' },
      ],
      frames: [
        { frameId: 'os-f1', seriesId: 's2', label: 'Horizontal foveal B-scan', kind: 'b-scan', altText: 'Synthetic OS B-scan', thumbnailUrl: octFrameSvg('OS B-Scan', '258 µm'), width: 520, height: 156 },
      ],
      selectedFrameId: 'os-f1',
      metrics: [{ id: 'cst', label: 'Central subfield thickness', valueLabel: '258 µm', referenceLabel: '220–300 µm', status: { label: 'Normal', tone: 'success' } }],
      findings: [],
      interpretation: 'Normal foveal contour OS.',
    },
  ],
  messages: [],
};

const MERIDIAN_SEED: MeridianCrossViewModel = {
  id: 'mc-parity',
  kind: 'optical',
  title: 'Optical Power Cross (OD / OS)',
  summaryText: 'Principal corneal meridians for both eyes.',
  eyes: [
    {
      eyeId: 'od',
      label: 'Right eye',
      shortLabel: 'OD',
      status: 'recorded',
      meridians: [
        { axisDeg: 180, powerLabel: '-1.50 D', assistiveLabel: 'Axis 180 degrees, -1.50 D' },
        { axisDeg: 90, powerLabel: '-2.25 D', assistiveLabel: 'Axis 90 degrees, -2.25 D' },
      ],
    },
    {
      eyeId: 'os',
      label: 'Left eye',
      shortLabel: 'OS',
      status: 'recorded',
      meridians: [
        { axisDeg: 175, powerLabel: '-1.25 D', assistiveLabel: 'Axis 175 degrees, -1.25 D' },
        { axisDeg: 85, powerLabel: '-2.00 D', assistiveLabel: 'Axis 85 degrees, -2.00 D' },
      ],
    },
  ],
};

const GAZE_LABELS: Record<GazePosition, string> = {
  'up-right': 'Up-right',
  up: 'Up',
  'up-left': 'Up-left',
  right: 'Right',
  primary: 'Primary',
  left: 'Left',
  'down-right': 'Down-right',
  down: 'Down',
  'down-left': 'Down-left',
};

const fullMotilityCells = () => ({
  'up-right': { valueLabel: 'Full', status: 'recorded' as const },
  up: { valueLabel: 'Full', status: 'recorded' as const },
  'up-left': { valueLabel: 'Full', status: 'recorded' as const },
  right: { valueLabel: 'Full', status: 'recorded' as const },
  primary: { valueLabel: 'Full', status: 'recorded' as const },
  left: { valueLabel: '-2', status: 'recorded' as const, badge: { label: 'Underaction', tone: 'warning' as const } },
  'down-right': { valueLabel: 'Full', status: 'recorded' as const },
  down: { valueLabel: 'Full', status: 'recorded' as const },
  'down-left': { valueLabel: 'Full', status: 'recorded' as const },
});

export const PARITY_ENTRIES_L4_CLINICAL: readonly ParityEntry[] = [
  // ---- Shells & Encounter Chrome (9) -----------------------------------------------------
  defineParityEntry<EmrAppShellModel>({
    selector: 'emr-app-shell',
    shell: true,
    createInitialState: () => ({
      topBar: {
        title: 'Ophthalmic EMR Workstation',
        userLabel: 'Dr. S. Iyer',
        search: { query: '', open: false, loading: false, groups: SHELL_SEARCH_GROUPS },
      },
      nav: {
        title: 'Encounter Sections',
        items: SHELL_NAV_ITEMS,
        activeId: 'overview',
        expandedIds: ['exam-group'],
      },
      navOpen: false,
    }),
    renderReact: ({ state, update }) => (
      <View style={{ minHeight: 420, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, overflow: 'hidden' }}>
        <EmrAppShell
          model={state}
          wideBreakpoint={520}
          rightPanel={
            <View style={{ padding: 12, gap: 6 }}>
              <BodyNote text="Right Context Drawer (SD-OCT / Prior Labs)" />
            </View>
          }
          onIntent={(i: EmrAppShellIntent) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'itemSelected') return { ...s, nav: { ...s.nav, activeId: i.itemId }, navOpen: false };
              if (i.type === 'itemExpansionRequested') {
                const exp = s.nav.expandedIds ?? [];
                return { ...s, nav: { ...s.nav, expandedIds: i.expanded ? [...exp.filter((x) => x !== i.itemId), i.itemId] : exp.filter((x) => x !== i.itemId) } };
              }
              if (i.type === 'navToggleRequested') return { ...s, navOpen: !s.navOpen };
              if (i.type === 'queryChanged') return { ...s, topBar: { ...s.topBar, search: { ...s.topBar.search, query: i.query, open: true } } };
              if (i.type === 'searchOpenRequested') return { ...s, topBar: { ...s.topBar, search: { ...s.topBar.search, open: true } } };
              if (i.type === 'searchCloseRequested') return { ...s, topBar: { ...s.topBar, search: { ...s.topBar.search, open: false } } };
              return s;
            })
          }
        >
          <EmrCard label={`Active Workspace · ${state.nav.activeId}`}>
            <EmrFieldValueRow field="Patient" value="Aarav Sharma (58 M · MRN-2026-0842)" />
            <EmrFieldValueRow field="BCVA / IOP" value="OD 6/12 (22 mmHg) · OS 6/6 (15 mmHg)" />
          </EmrCard>
        </EmrAppShell>
      </View>
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-app-shell"
        props={{ model: state }}
        slotHtml={`<div style="padding:12px;border:1px solid var(--emr-border);border-radius:var(--emr-radius,8px);background:var(--emr-surface)"><strong>Active Workspace · ${state.nav.activeId}</strong><div style="margin-top:6px">Patient: Aarav Sharma (58 M · MRN-2026-0842) — OD 6/12 (22 mmHg) · OS 6/6 (15 mmHg)</div></div><div slot="right" style="padding:12px">Right Context Drawer (SD-OCT / Prior Labs)</div>`}
        events={{
          intent: (raw) => {
            const i = raw as EmrAppShellIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'itemSelected') return { ...s, nav: { ...s.nav, activeId: i.itemId }, navOpen: false };
              if (i.type === 'itemExpansionRequested') {
                const exp = s.nav.expandedIds ?? [];
                return { ...s, nav: { ...s.nav, expandedIds: i.expanded ? [...exp.filter((x) => x !== i.itemId), i.itemId] : exp.filter((x) => x !== i.itemId) } };
              }
              if (i.type === 'navToggleRequested') return { ...s, navOpen: !s.navOpen };
              if (i.type === 'queryChanged') return { ...s, topBar: { ...s.topBar, search: { ...s.topBar.search, query: i.query, open: true } } };
              if (i.type === 'searchOpenRequested') return { ...s, topBar: { ...s.topBar, search: { ...s.topBar.search, open: true } } };
              if (i.type === 'searchCloseRequested') return { ...s, topBar: { ...s.topBar, search: { ...s.topBar.search, open: false } } };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ query: string; open: boolean }>({
    selector: 'emr-top-bar',
    shell: true,
    createInitialState: () => ({ query: '', open: false }),
    renderReact: ({ state, update }) => (
      <EmrTopBar
        model={{
          title: 'EMR Outpatient Desk',
          userLabel: 'Dr. S. Iyer',
          showNavToggle: true,
          search: { query: state.query, open: state.open, loading: false, groups: SHELL_SEARCH_GROUPS },
        }}
        onIntent={(i: EmrTopBarIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'queryChanged') return { query: i.query, open: true };
            if (i.type === 'searchOpenRequested') return { ...s, open: true };
            if (i.type === 'searchCloseRequested' || i.type === 'resultSelected') return { ...s, open: false };
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-top-bar"
        props={{
          model: {
            title: 'EMR Outpatient Desk',
            userLabel: 'Dr. S. Iyer',
            showNavToggle: true,
            search: { query: state.query, open: state.open, loading: false, groups: SHELL_SEARCH_GROUPS },
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as EmrTopBarIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'queryChanged') return { query: i.query, open: true };
              if (i.type === 'searchOpenRequested') return { ...s, open: true };
              if (i.type === 'searchCloseRequested' || i.type === 'resultSelected') return { ...s, open: false };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ query: string; open: boolean }>({
    selector: 'emr-top-bar-search',
    shell: true,
    createInitialState: () => ({ query: 'Aarav', open: true }),
    renderReact: ({ state, update }) => (
      <View style={{ minHeight: 170 }}>
        <EmrTopBarSearch
          query={state.query}
          open={state.open}
          loading={false}
          groups={SHELL_SEARCH_GROUPS}
          labels={{
            search: 'Global clinical search',
            searchPlaceholder: 'Search patients, MRN, clinics...',
            noResults: 'No matching records.',
            searching: 'Searching...',
          }}
          onQueryChange={(q) => update('react', 'onQueryChange', q, () => ({ query: q, open: true }))}
          onSearchRequested={() => update('react', 'onSearchRequested', {}, (s) => ({ ...s, open: true }))}
          onOpenRequested={() => update('react', 'onOpenRequested', {}, (s) => ({ ...s, open: true }))}
          onCloseRequested={() => update('react', 'onCloseRequested', {}, (s) => ({ ...s, open: false }))}
          onSelect={(groupId, id) => update('react', 'onSelect', { groupId, id }, (s) => ({ ...s, open: false }))}
        />
      </View>
    ),
    renderLit: ({ state, update }) => (
      <View style={{ minHeight: 170 }}>
        <LitElementHost
          tag="emr-top-bar-search"
          props={{ model: { query: state.query, open: state.open, loading: false, groups: SHELL_SEARCH_GROUPS } }}
          events={{
            intent: (raw) => {
              const i = raw as EmrTopBarIntent;
              update('lit', i.type, i, (s) => {
                if (i.type === 'queryChanged') return { query: i.query, open: true };
                if (i.type === 'searchOpenRequested') return { ...s, open: true };
                if (i.type === 'searchCloseRequested' || i.type === 'resultSelected') return { ...s, open: false };
                return s;
              });
            },
          }}
        />
      </View>
    ),
  }),

  defineParityEntry<{ activeId: string; expandedIds: string[] }>({
    selector: 'emr-left-nav',
    shell: true,
    createInitialState: () => ({ activeId: 'va-iop', expandedIds: ['exam-group'] }),
    renderReact: ({ state, update }) => (
      <EmrLeftNav
        items={SHELL_NAV_ITEMS}
        activeId={state.activeId}
        expandedIds={state.expandedIds}
        onIntent={(i) =>
          update('react', i.type, i, (s) =>
            i.type === 'itemSelected'
              ? { ...s, activeId: i.itemId }
              : {
                  ...s,
                  expandedIds: i.expanded
                    ? [...s.expandedIds.filter((x) => x !== i.itemId), i.itemId]
                    : s.expandedIds.filter((x) => x !== i.itemId),
                },
          )
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-left-nav"
        props={{
          model: {
            title: 'Encounter Navigation',
            items: SHELL_NAV_ITEMS,
            activeId: state.activeId,
            expandedIds: state.expandedIds,
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as { type: 'itemSelected' | 'itemExpansionRequested'; itemId: string; expanded?: boolean };
            update('lit', i.type, i, (s) =>
              i.type === 'itemSelected'
                ? { ...s, activeId: i.itemId }
                : {
                    ...s,
                    expandedIds: i.expanded
                      ? [...s.expandedIds.filter((x) => x !== i.itemId), i.itemId]
                      : s.expandedIds.filter((x) => x !== i.itemId),
                  },
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ reactOpen: boolean; litOpen: boolean }>({
    selector: 'emr-right-flyout',
    shell: true,
    notes: 'React renders EmrRightFlyout in a modal overlay; Lit renders an inline dialog section.',
    createInitialState: () => ({ reactOpen: false, litOpen: true }),
    renderReact: ({ state, update }) => (
      <View style={{ gap: 10 }}>
        <EmrCard label="Right Flyout Trigger (React Modal)">
          <BodyNote text="Open the slide-over order flyout to inspect modal presentation." />
          <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <EmrButton
              label="Open React EmrRightFlyout"
              onPress={() => update('react', 'openFlyout', {}, (s) => ({ ...s, reactOpen: true }))}
            />
          </View>
        </EmrCard>
        <EmrRightFlyout
          open={state.reactOpen}
          title="Order Details · SD-OCT Macula"
          showBack
          footer={<EmrButton label="Confirm order" onPress={() => update('react', 'confirmOrder', {}, (s) => ({ ...s, reactOpen: false }))} />}
          onIntent={(i: RightFlyoutIntent) => update('react', i.type, i, (s) => ({ ...s, reactOpen: false }))}
        >
          <EmrFieldValueRow field="Order" value="SD-OCT Macular Cube (OU)" />
          <EmrFieldValueRow field="Priority" value="Urgent · Same-day OPD" />
        </EmrRightFlyout>
      </View>
    ),
    renderLit: ({ state, update }) => (
      <View style={{ gap: 10 }}>
        {!state.litOpen ? (
          <EmrButton
            variant="outline"
            label="Re-open Lit <emr-right-flyout>"
            onPress={() => update('lit', 'reopenFlyout', {}, (s) => ({ ...s, litOpen: true }))}
          />
        ) : null}
        <LitElementHost
          tag="emr-right-flyout"
          props={{
            model: {
              open: state.litOpen,
              title: 'Order Details · SD-OCT Macula',
              showBack: true,
              showFooter: true,
            },
          }}
          slotHtml="<div><strong>Order:</strong> SD-OCT Macular Cube (OU)<br/><strong>Priority:</strong> Urgent · Same-day OPD</div><div slot='footer'><em>Footer action slot</em></div>"
          events={{
            intent: (i) => update('lit', 'intent', i, (s) => ({ ...s, litOpen: false })),
          }}
        />
      </View>
    ),
  }),

  defineParityEntry<{ reactOpen: boolean; litOpen: boolean }>({
    selector: 'emr-sheet',
    shell: true,
    notes: 'Both React (<Modal>) and Lit (<dialog showModal>) open top-layer sheets; trigger buttons prevent blocking navigation.',
    createInitialState: () => ({ reactOpen: false, litOpen: false }),
    renderReact: ({ state, update }) => (
      <View style={{ gap: 10 }}>
        <EmrCard label="Adaptive Sheet / Drawer (React)">
          <BodyNote text="Bottom sheet on narrow screens, right drawer on wide screens." />
          <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <EmrButton
              label="Open React EmrSheet"
              onPress={() => update('react', 'openSheet', {}, (s) => ({ ...s, reactOpen: true }))}
            />
          </View>
        </EmrCard>
        <EmrSheet
          open={state.reactOpen}
          title="Dispensing Checklist"
          showBack
          onIntent={(i) => update('react', i.type, i, (s) => ({ ...s, reactOpen: false }))}
        >
          <BodyNote text="Verify pupillary distance (62 mm) and anti-reflective coating." />
        </EmrSheet>
      </View>
    ),
    renderLit: ({ state, update }) => (
      <View style={{ gap: 10 }}>
        <EmrCard label="Adaptive Sheet / Dialog (Lit <emr-sheet>)">
          <BodyNote text="Uses native HTML <dialog> with Escape / Close intent." />
          <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <EmrButton
              variant="outline"
              label="Open Lit <emr-sheet>"
              onPress={() => update('lit', 'openSheet', {}, (s) => ({ ...s, litOpen: true }))}
            />
          </View>
        </EmrCard>
        <LitElementHost
          tag="emr-sheet"
          props={{ open: state.litOpen, title: 'Dispensing Checklist', showBack: true }}
          slotHtml="<p style='padding:12px;margin:0'>Verify pupillary distance (62 mm) and anti-reflective coating.</p>"
          events={{
            intent: (i) => update('lit', 'intent', i, (s) => ({ ...s, litOpen: false })),
          }}
        />
      </View>
    ),
  }),

  defineParityEntry<{ activeId: string; scans: number }>({
    selector: 'emr-bottom-tab-bar',
    shell: true,
    createInitialState: () => ({ activeId: 'today', scans: 0 }),
    renderReact: ({ state, update }) => {
      const items = [
        { id: 'today', label: 'Today' },
        { id: 'patients', label: 'Patients', badge: { label: '4', tone: 'info' as const } },
        { id: 'sync', label: 'Sync' },
        { id: 'more', label: 'More' },
      ];
      return (
        <View style={{ gap: 8 }}>
          <BodyNote text={`Active tab: ${state.activeId} · Barcode scans triggered: ${state.scans}`} />
          <EmrBottomTabBar
            items={items}
            activeId={state.activeId}
            onIntent={(i) =>
              update('react', i.type, i, (s) =>
                i.type === 'tabSelected' ? { ...s, activeId: i.id } : { ...s, scans: s.scans + 1 },
              )
            }
          />
        </View>
      );
    },
    renderLit: ({ state, update }) => {
      const items = [
        { id: 'today', label: 'Today' },
        { id: 'patients', label: 'Patients', badge: { label: '4', tone: 'info' as const } },
        { id: 'sync', label: 'Sync' },
        { id: 'more', label: 'More' },
      ];
      return (
        <View style={{ gap: 8 }}>
          <BodyNote text={`Active tab: ${state.activeId} · Barcode scans triggered: ${state.scans}`} />
          <LitElementHost
            tag="emr-bottom-tab-bar"
            props={{ items, activeId: state.activeId }}
            events={{
              intent: (raw) => {
                const i = raw as { type: 'tabSelected'; id: string } | { type: 'scanRequested' };
                update('lit', i.type, i, (s) =>
                  i.type === 'tabSelected' ? { ...s, activeId: i.id } : { ...s, scans: s.scans + 1 },
                );
              },
            }}
          />
        </View>
      );
    },
  }),

  defineParityEntry<PatientBannerViewModel>({
    selector: 'emr-patient-banner',
    shell: true,
    createInitialState: () => PATIENT_BANNER_SEED,
    renderReact: ({ state, update }) => (
      <EmrPatientBanner
        model={state}
        onIntent={(i: PatientBannerIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'expandedChangeRequested') return { ...s, expanded: i.expanded };
            if (i.type === 'layoutModeChangeRequested') return { ...s, layoutMode: i.layoutMode };
            if (i.type === 'alertInspectRequested') return { ...s, activeInspectId: i.alertId };
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-patient-banner"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as PatientBannerIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'expandedChangeRequested') return { ...s, expanded: i.expanded };
              if (i.type === 'layoutModeChangeRequested') return { ...s, layoutMode: i.layoutMode };
              if (i.type === 'alertInspectRequested') return { ...s, activeInspectId: i.alertId };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<CaptureStatusBarViewModel>({
    selector: 'emr-capture-status-bar',
    shell: true,
    createInitialState: () => CAPTURE_BAR_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrCaptureStatusBar
        model={{ ...state, readOnly }}
        onIntent={(i: CaptureStatusBarIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'saveRequested') return { ...s, session: { ...s.session, dirty: false }, savedAtLabel: 'Just now' };
            if (i.type === 'signRequested') {
              return {
                ...s,
                session: { ...s.session, dirty: false },
                signature: { status: { label: 'Signed', tone: 'success' }, signatories: [], canSign: false, canAmend: true },
              };
            }
            if (i.type === 'amendRequested') {
              return {
                ...s,
                session: { ...s.session, dirty: true },
                signature: { status: { label: 'Addendum draft', tone: 'warning' }, signatories: [], canSign: true, canAmend: false },
              };
            }
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-capture-status-bar"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as CaptureStatusBarIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'saveRequested') return { ...s, session: { ...s.session, dirty: false }, savedAtLabel: 'Just now' };
              if (i.type === 'signRequested') {
                return {
                  ...s,
                  session: { ...s.session, dirty: false },
                  signature: { status: { label: 'Signed', tone: 'success' }, signatories: [], canSign: false, canAmend: true },
                };
              }
              if (i.type === 'amendRequested') {
                return {
                  ...s,
                  session: { ...s.session, dirty: true },
                  signature: { status: { label: 'Addendum draft', tone: 'warning' }, signatories: [], canSign: true, canAmend: false },
                };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  // ---- Encounter Clinical Surfaces (6) ---------------------------------------------------
  defineParityEntry<{ rows: readonly PrescribingRow[]; signed: boolean }>({
    selector: 'emr-prescribing-table',
    createInitialState: () => ({ rows: RX_ROWS_SEED, signed: false }),
    renderReact: ({ state, readOnly, update }) => {
      const reduceRx = (s: { rows: readonly PrescribingRow[]; signed: boolean }, i: PrescribingTableIntent) => {
        if (i.type === 'rowAddRequested') {
          return {
            ...s,
            rows: [
              ...s.rows,
              {
                id: `rx-${s.rows.length + 1}`,
                drugName: '',
                strength: '',
                form: 'drop' as const,
                formLabel: 'Eye drops',
                route: 'ophthalmic',
                site: 'OU',
                doseAmount: 1,
                slots: RX_SLOTS.map((sl) => ({ ...sl, amount: sl.id === 'm' ? 1 : 0 })),
                unitLabel: 'drop',
                durationCount: 7,
                durationUnit: 'days' as const,
                foodRelation: '',
                instructions: '',
              },
            ],
          };
        }
        if (i.type === 'rowRemoveRequested') {
          return { ...s, rows: s.rows.length > 1 ? s.rows.filter((r) => r.id !== i.rowId) : s.rows };
        }
        if (i.type === 'drugNameChanged') {
          return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, drugName: i.drugName } : r)) };
        }
        if (i.type === 'strengthChanged') {
          return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, strength: i.strength } : r)) };
        }
        if (i.type === 'siteChanged') {
          return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, site: i.site } : r)) };
        }
        if (i.type === 'instructionsChanged') {
          return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, instructions: i.instructions } : r)) };
        }
        if (i.type === 'durationChanged') {
          return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, durationCount: i.count ?? r.durationCount } : r)) };
        }
        if (i.type === 'slotAmountChanged') {
          return {
            ...s,
            rows: s.rows.map((r) =>
              r.id === i.rowId
                ? { ...r, slots: r.slots.map((sl) => (sl.id === i.slotId ? { ...sl, amount: i.amount } : sl)) }
                : r,
            ),
          };
        }
        if (i.type === 'presetApplied') {
          const preset = PRESCRIBING_PRESETS.find((p) => p.id === i.presetId);
          if (!preset) return s;
          return {
            ...s,
            rows: s.rows.map((r) =>
              r.id === i.rowId
                ? {
                    ...r,
                    frequencyCode: preset.label,
                    slots: r.slots.map((sl) => ({ ...sl, amount: preset.slotIds.includes(sl.id as never) ? (r.doseAmount ?? 1) : 0 })),
                  }
                : r,
            ),
          };
        }
        if (i.type === 'signRequested') return { ...s, signed: true };
        return s;
      };
      return (
        <EmrPrescribingTable
          model={{
            title: 'Multi-Row Ophthalmic & Systemic Prescription',
            rows: state.rows,
            slotDefinitions: RX_SLOTS,
            presets: PRESCRIBING_PRESETS,
            readOnly: readOnly || state.signed,
            canSign: !readOnly && !state.signed,
          }}
          onIntent={(i) => update('react', i.type, i, (s) => reduceRx(s, i))}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-prescribing-table"
        props={{
          model: {
            title: 'Multi-Row Ophthalmic & Systemic Prescription',
            rows: state.rows,
            slotDefinitions: RX_SLOTS,
            presets: PRESCRIBING_PRESETS,
            readOnly: readOnly || state.signed,
            canSign: !readOnly && !state.signed,
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as PrescribingTableIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'rowAddRequested') {
                return {
                  ...s,
                  rows: [
                    ...s.rows,
                    {
                      id: `rx-${s.rows.length + 1}`,
                      drugName: '',
                      strength: '',
                      form: 'drop' as const,
                      formLabel: 'Eye drops',
                      route: 'ophthalmic',
                      site: 'OU',
                      doseAmount: 1,
                      slots: RX_SLOTS.map((sl) => ({ ...sl, amount: sl.id === 'm' ? 1 : 0 })),
                      unitLabel: 'drop',
                      durationCount: 7,
                      durationUnit: 'days' as const,
                      foodRelation: '',
                      instructions: '',
                    },
                  ],
                };
              }
              if (i.type === 'rowRemoveRequested') {
                return { ...s, rows: s.rows.length > 1 ? s.rows.filter((r) => r.id !== i.rowId) : s.rows };
              }
              if (i.type === 'drugNameChanged') {
                return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, drugName: i.drugName } : r)) };
              }
              if (i.type === 'strengthChanged') {
                return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, strength: i.strength } : r)) };
              }
              if (i.type === 'siteChanged') {
                return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, site: i.site } : r)) };
              }
              if (i.type === 'instructionsChanged') {
                return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, instructions: i.instructions } : r)) };
              }
              if (i.type === 'durationChanged') {
                return { ...s, rows: s.rows.map((r) => (r.id === i.rowId ? { ...r, durationCount: i.count ?? r.durationCount } : r)) };
              }
              if (i.type === 'slotAmountChanged') {
                return {
                  ...s,
                  rows: s.rows.map((r) =>
                    r.id === i.rowId
                      ? { ...r, slots: r.slots.map((sl) => (sl.id === i.slotId ? { ...sl, amount: i.amount } : sl)) }
                      : r,
                  ),
                };
              }
              if (i.type === 'presetApplied') {
                const preset = PRESCRIBING_PRESETS.find((p) => p.id === i.presetId);
                if (!preset) return s;
                return {
                  ...s,
                  rows: s.rows.map((r) =>
                    r.id === i.rowId
                      ? {
                          ...r,
                          frequencyCode: preset.label,
                          slots: r.slots.map((sl) => ({ ...sl, amount: preset.slotIds.includes(sl.id as never) ? (r.doseAmount ?? 1) : 0 })),
                        }
                      : r,
                  ),
                };
              }
              if (i.type === 'signRequested') return { ...s, signed: true };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<PacsViewerViewModel>({
    selector: 'emr-pacs-viewer',
    createInitialState: () => PACS_SEED,
    renderReact: ({ state, readOnly, update }) => {
      const reducePacs = (m: PacsViewerViewModel, i: PacsViewerIntent): PacsViewerViewModel => {
        if (i.type === 'layoutModeChanged') return { ...m, layoutMode: i.layoutMode };
        if (i.type === 'studySelected') return { ...m, activeStudyId: i.studyId };
        if (i.type === 'compareStudySelected') return { ...m, compareStudyId: i.studyId };
        if (i.type === 'sliceStepped') {
          return { ...m, studies: m.studies.map((s) => (s.id === i.studyId ? { ...s, currentSlice: Math.max(1, Math.min(s.sliceCount, s.currentSlice + i.delta)) } : s)) };
        }
        if (i.type === 'windowPresetChanged') {
          return { ...m, studies: m.studies.map((s) => (s.id === i.studyId ? { ...s, windowPreset: i.preset } : s)) };
        }
        if (i.type === 'zoomChanged') {
          return { ...m, studies: m.studies.map((s) => (s.id === i.studyId ? { ...s, zoomPercent: i.zoomPercent } : s)) };
        }
        if (i.type === 'invertToggled') {
          return { ...m, studies: m.studies.map((s) => (s.id === i.studyId ? { ...s, inverted: !s.inverted } : s)) };
        }
        return m;
      };
      return (
        <EmrPacsViewer
          model={{ ...state, readOnly }}
          onIntent={(i) => update('react', i.type, i, (s) => reducePacs(s, i))}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-pacs-viewer"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as PacsViewerIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'layoutModeChanged') return { ...m, layoutMode: i.layoutMode };
              if (i.type === 'studySelected') return { ...m, activeStudyId: i.studyId };
              if (i.type === 'compareStudySelected') return { ...m, compareStudyId: i.studyId };
              if (i.type === 'sliceStepped') {
                return { ...m, studies: m.studies.map((s) => (s.id === i.studyId ? { ...s, currentSlice: Math.max(1, Math.min(s.sliceCount, s.currentSlice + i.delta)) } : s)) };
              }
              if (i.type === 'windowPresetChanged') {
                return { ...m, studies: m.studies.map((s) => (s.id === i.studyId ? { ...s, windowPreset: i.preset } : s)) };
              }
              if (i.type === 'zoomChanged') {
                return { ...m, studies: m.studies.map((s) => (s.id === i.studyId ? { ...s, zoomPercent: i.zoomPercent } : s)) };
              }
              if (i.type === 'invertToggled') {
                return { ...m, studies: m.studies.map((s) => (s.id === i.studyId ? { ...s, inverted: !s.inverted } : s)) };
              }
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<SpecialtyExamMatrixViewModel>({
    selector: 'emr-specialty-exam-matrix',
    createInitialState: () => makeSpecialtyExamFixture(),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSpecialtyExamMatrix
        model={{ ...state, readOnly }}
        onIntent={(i: SpecialtyExamMatrixIntent) =>
          update('react', i.type, i, (s) => reduceSpecialtyExamFixture(s, i))
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-specialty-exam-matrix"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as SpecialtyExamMatrixIntent;
            update('lit', i.type, i, (s) => reduceSpecialtyExamFixture(s, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<InpatientMarViewModel>({
    selector: 'emr-inpatient-mar',
    createInitialState: () => MAR_SEED,
    renderReact: ({ state, readOnly, update }) => {
      const cycle: Array<'due' | 'given' | 'held' | 'refused'> = ['due', 'given', 'held', 'refused'];
      return (
        <EmrInpatientMar
          model={{ ...state, readOnly }}
          onIntent={(i: InpatientMarIntent) =>
            update('react', i.type, i, (prev) => {
              if (i.type === 'slotStatusCycled') {
                return {
                  ...prev,
                  orders: prev.orders.map((ord) =>
                    ord.id === i.orderId
                      ? {
                          ...ord,
                          administrations: ord.administrations.map((adm) => {
                            if (adm.slotId !== i.slotId || adm.status === 'not-due') return adm;
                            const next = cycle[(cycle.indexOf(adm.status) + 1) % cycle.length]!;
                            return { ...adm, status: next, administeredAtLabel: next === 'given' ? 'Just now · RN K.N.' : undefined };
                          }),
                        }
                      : ord,
                  ),
                };
              }
              if (i.type === 'dualSignVerified') {
                return { ...prev, orders: prev.orders.map((ord) => (ord.id === i.orderId ? { ...ord, dualSignVerified: !ord.dualSignVerified } : ord)) };
              }
              return prev;
            })
          }
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => {
      const cycle: Array<'due' | 'given' | 'held' | 'refused'> = ['due', 'given', 'held', 'refused'];
      return (
        <LitElementHost
          tag="emr-inpatient-mar"
          props={{ model: { ...state, readOnly } }}
          events={{
            intent: (raw) => {
              const i = raw as InpatientMarIntent;
              update('lit', i.type, i, (prev) => {
                if (i.type === 'slotStatusCycled') {
                  return {
                    ...prev,
                    orders: prev.orders.map((ord) =>
                      ord.id === i.orderId
                        ? {
                            ...ord,
                            administrations: ord.administrations.map((adm) => {
                              if (adm.slotId !== i.slotId || adm.status === 'not-due') return adm;
                              const next = cycle[(cycle.indexOf(adm.status) + 1) % cycle.length]!;
                              return { ...adm, status: next, administeredAtLabel: next === 'given' ? 'Just now · RN K.N.' : undefined };
                            }),
                          }
                        : ord,
                    ),
                  };
                }
                if (i.type === 'dualSignVerified') {
                  return { ...prev, orders: prev.orders.map((ord) => (ord.id === i.orderId ? { ...ord, dualSignVerified: !ord.dualSignVerified } : ord)) };
                }
                return prev;
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<EncounterSummaryPrintViewModel>({
    selector: 'emr-encounter-summary-print',
    createInitialState: () => PRINT_SUMMARY_SEED,
    renderReact: ({ state, update }) => (
      <EmrEncounterSummaryPrint
        model={state}
        onIntent={(i: EncounterSummaryPrintIntent) =>
          update('react', i.type, i, (s) => (i.type === 'documentModeChanged' ? { ...s, documentMode: i.mode } : s))
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-encounter-summary-print"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as EncounterSummaryPrintIntent;
            update('lit', i.type, i, (s) => (i.type === 'documentModeChanged' ? { ...s, documentMode: i.mode } : s));
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ controller: ReturnType<typeof createClinicalNoteDemo>; model: ClinicalNoteWorkspaceViewModel }>({
    selector: 'emr-clinical-note-workspace',
    createInitialState: () => {
      const controller = createClinicalNoteDemo('opd');
      return { controller, model: controller.getSnapshot() };
    },
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalNoteWorkspace
        model={readOnly ? { ...state.model, form: undefined, actions: [] } : state.model}
        onIntent={(i: ClinicalNoteWorkspaceIntent) =>
          update('react', i.type, i, (s) => {
            s.controller.dispatch(i);
            return { controller: s.controller, model: s.controller.getSnapshot() };
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-note-workspace"
        props={{ model: readOnly ? { ...state.model, form: undefined, actions: [] } : state.model }}
        events={{
          intent: (raw) => {
            const i = raw as ClinicalNoteWorkspaceIntent;
            update('lit', i.type, i, (s) => {
              s.controller.dispatch(i);
              return { controller: s.controller, model: s.controller.getSnapshot() };
            });
          },
        }}
      />
    ),
  }),

  // ---- Medications, Clinical Lists, Observations & Notes (11) ----------------------------
  defineParityEntry<DoseScheduleViewModel>({
    selector: 'emr-dose-schedule',
    createInitialState: () => ({
      medication: { label: 'Prednisolone acetate', strength: '1%', formLabel: 'Eye drops', form: 'drop' },
      unit: { one: 'drop', other: 'drops' },
      frequency: { code: 'QID', label: 'Four times daily' },
      slots: [
        { id: 'm', label: 'Morning', timeHint: '08:00', amount: 1 },
        { id: 'a', label: 'Afternoon', timeHint: '13:00', amount: 1 },
        { id: 'e', label: 'Evening', timeHint: '18:00', amount: 1 },
        { id: 'n', label: 'Night', timeHint: '22:00', amount: 1 },
      ],
      route: 'Ophthalmic · Right eye (OD)',
      duration: '7 days, then taper weekly',
      startLabel: 'Starts today',
      canEdit: true,
      canShowInstructions: true,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDoseSchedule
        model={{ ...state, canEdit: !readOnly }}
        onIntent={(i: DoseScheduleIntent) => update('react', i.type, i)}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-dose-schedule"
        props={{ model: { ...state, canEdit: !readOnly } }}
        events={{ intent: (i) => update('lit', (i as DoseScheduleIntent).type, i) }}
      />
    ),
  }),

  defineParityEntry<ScoreResultCardViewModel>({
    selector: 'emr-score-result-card',
    createInitialState: () => ({
      id: 'news2-parity',
      instrumentLabel: 'NEWS2 Early Warning Score',
      stale: true,
      staleLabel: 'Vitals updated',
      canRecompute: true,
      canViewDetail: true,
      result: {
        total: 5,
        bandLabel: 'Medium clinical risk',
        bandTone: 'warning',
        interpretation: 'Urgent review by ward-based clinician to decide escalation frequency.',
        computedAt: '2026-10-14T09:30:00Z',
        components: [
          { id: 'rr', label: 'Respiration rate', value: 2 },
          { id: 'spo2', label: 'SpO2', value: 1 },
          { id: 'sbp', label: 'Systolic BP', value: 1 },
          { id: 'temp', label: 'Temperature', value: 1 },
        ],
      },
    }),
    renderReact: ({ state, update }) => (
      <EmrScoreResultCard
        model={state}
        onIntent={(i: ScoreResultCardIntent) =>
          update('react', i.type, i, (s) => (i.type === 'recomputeRequested' ? { ...s, stale: false, staleLabel: undefined } : s))
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-score-result-card"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as ScoreResultCardIntent;
            update('lit', i.type, i, (s) => (i.type === 'recomputeRequested' ? { ...s, stale: false, staleLabel: undefined } : s));
          },
        }}
      />
    ),
  }),

  defineParityEntry<MedicationReconciliationViewModel>({
    selector: 'emr-medication-reconciliation',
    createInitialState: () => ({
      id: 'recon-parity',
      title: 'Admission Medicine Reconciliation',
      leftLabel: 'Home Medicines',
      rightLabel: 'Ward Orders',
      rows: [
        {
          id: 'r1',
          path: ['medications', 'r1'],
          left: { id: 'h1', nameLabel: 'Metformin 500 mg tablet', doseSummary: '1 tablet twice daily (BD), after food', badges: [{ label: 'Patient reported', tone: 'neutral' }] },
          right: { id: 'o1', nameLabel: 'Metformin 500 mg tablet', doseSummary: '1 tablet twice daily (BD), after food', badges: [{ label: 'Ward order', tone: 'info' }] },
          decision: 'continue',
          decisionOptions: [
            { value: 'continue', label: 'Continue' },
            { value: 'hold', label: 'Hold' },
            { value: 'stop', label: 'Stop' },
          ],
        },
        {
          id: 'r2',
          path: ['medications', 'r2'],
          left: { id: 'h2', nameLabel: 'Timolol 0.5% eye drops', doseSummary: '1 drop twice daily (BD) to both eyes', badges: [{ label: 'OPD list', tone: 'info' }] },
          decisionOptions: [
            { value: 'continue', label: 'Continue' },
            { value: 'hold', label: 'Hold' },
            { value: 'stop', label: 'Stop' },
          ],
          reasonRequired: true,
        },
      ],
      summary: [{ label: '1 continue', tone: 'success' }, { label: '1 undecided', tone: 'warning' }],
      emptyMessage: 'No medicines to reconcile.',
      canComplete: false,
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrMedicationReconciliation
        model={{ ...state, readOnly }}
        onIntent={(i: MedicationReconciliationIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'decisionChangeRequested') {
              const targetId = String(i.path[i.path.length - 1]);
              const rows = s.rows.map((r) => (r.id === targetId ? { ...r, decision: i.decision } : r));
              return { ...s, rows, canComplete: rows.every((r) => Boolean(r.decision)) };
            }
            if (i.type === 'reasonChangeRequested') {
              const targetId = String(i.path[i.path.length - 1]);
              return { ...s, rows: s.rows.map((r) => (r.id === targetId ? { ...r, reason: i.reason } : r)) };
            }
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-medication-reconciliation"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as MedicationReconciliationIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'decisionChangeRequested') {
                const targetId = String(i.path[i.path.length - 1]);
                const rows = s.rows.map((r) => (r.id === targetId ? { ...r, decision: i.decision } : r));
                return { ...s, rows, canComplete: rows.every((r) => Boolean(r.decision)) };
              }
              if (i.type === 'reasonChangeRequested') {
                const targetId = String(i.path[i.path.length - 1]);
                return { ...s, rows: s.rows.map((r) => (r.id === targetId ? { ...r, reason: i.reason } : r)) };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  ...(
    [
      {
        selector: 'emr-medication-list',
        Component: EmrMedicationList,
        emptyMessage: 'No active medications.',
        seed: [
          { id: 'm1', title: 'Latanoprost 0.005% eye drops', subtitle: '1 drop OU at bedtime', badges: [{ label: 'Active', tone: 'success' as const }] },
          { id: 'm2', title: 'Metformin 500 mg tablet', subtitle: 'Twice daily after food', badges: [{ label: 'Systemic', tone: 'info' as const }] },
        ],
      },
      {
        selector: 'emr-allergy-list',
        Component: EmrAllergyList,
        emptyMessage: 'No known drug allergies recorded.',
        seed: [
          { id: 'a1', title: 'Penicillin', subtitle: 'Anaphylaxis (verified 2025)', badges: [{ label: 'Severe', tone: 'danger' as const }] },
          { id: 'a2', title: 'Sulfonamides', subtitle: 'Maculopapular rash', badges: [{ label: 'Moderate', tone: 'warning' as const }] },
        ],
      },
      {
        selector: 'emr-chronic-disease-list',
        Component: EmrChronicDiseaseList,
        emptyMessage: 'No chronic conditions recorded.',
        seed: [
          { id: 'd1', title: 'Primary Open-Angle Glaucoma (OU)', subtitle: 'Since 2022', badges: [{ label: 'On therapy', tone: 'info' as const }] },
          { id: 'd2', title: 'Type 2 Diabetes Mellitus', subtitle: 'HbA1c 7.6%', badges: [{ label: 'Active', tone: 'warning' as const }] },
        ],
      },
      {
        selector: 'emr-personal-history-list',
        Component: EmrPersonalHistoryList,
        emptyMessage: 'No personal/social history recorded.',
        seed: [
          { id: 'p1', title: 'Non-smoker, non-alcoholic', subtitle: 'Recorded at intake', badges: [{ label: 'Verified', tone: 'success' as const }] },
          { id: 'p2', title: 'High near-screen visual demand', subtitle: 'Accountant (8 hrs/day)', badges: [{ label: 'Occupational', tone: 'neutral' as const }] },
        ],
      },
    ] as const
  ).map(({ selector, Component, emptyMessage, seed }) =>
    defineParityEntry<readonly ClinicalListItem[]>({
      selector,
      createInitialState: () => seed,
      renderReact: ({ state, readOnly, update }) => (
        <Component
          model={{ items: state, allowAdd: !readOnly, emptyMessage }}
          onIntent={(i: ClinicalListIntent) =>
            update('react', i.type, i, (s) =>
              i.type === 'removeRequested'
                ? s.filter((x) => x.id !== i.id)
                : i.type === 'addRequested'
                  ? [...s, { id: `new-${s.length + 1}`, title: `Added entry ${s.length + 1}`, badges: [{ label: 'New', tone: 'info' }] }]
                  : s,
            )
          }
        />
      ),
      renderLit: ({ state, readOnly, update }) => (
        <LitElementHost
          tag={selector}
          props={{ items: state, readOnly, allowAdd: !readOnly, emptyMessage }}
          events={{
            intent: (raw) => {
              const i = raw as ClinicalListIntent;
              update('lit', i.type, i, (s) =>
                i.type === 'removeRequested'
                  ? s.filter((x) => x.id !== i.id)
                  : i.type === 'addRequested'
                    ? [...s, { id: `new-${s.length + 1}`, title: `Added entry ${s.length + 1}`, badges: [{ label: 'New', tone: 'info' }] }]
                    : s,
              );
            },
          }}
        />
      ),
    }),
  ),

  defineParityEntry<FlowsheetViewModel>({
    selector: 'emr-observation-flowsheet',
    createInitialState: () => FLOWSHEET_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrObservationFlowsheet
        model={{ ...state, readOnly }}
        onIntent={(i: FlowsheetIntent) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'cellSelected') return { ...m, selectedCell: { rowId: i.rowId, columnId: i.columnId } };
            if (i.type === 'columnAddRequested') {
              const id = `c${m.columns.length + 1}`;
              return { ...m, columns: [...m.columns.map((c) => ({ ...c, current: false })), { id, label: '20:00', sublabel: 'Day 1', current: true }] };
            }
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-observation-flowsheet"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as FlowsheetIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'cellSelected') return { ...m, selectedCell: { rowId: i.rowId, columnId: i.columnId } };
              if (i.type === 'columnAddRequested') {
                const id = `c${m.columns.length + 1}`;
                return { ...m, columns: [...m.columns.map((c) => ({ ...c, current: false })), { id, label: '20:00', sublabel: 'Day 1', current: true }] };
              }
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<ObservationTrendViewModel>({
    selector: 'emr-observation-trend',
    createInitialState: () => TREND_SEED,
    renderReact: ({ state, update }) => (
      <EmrObservationTrend
        model={state}
        onIntent={(i: ObservationTrendIntent) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'pointSelected') return { ...m, selectedPointId: i.pointId };
            if (i.type === 'granularityChangeRequested') {
              return { ...m, granularityOptions: m.granularityOptions?.map((g) => ({ ...g, selected: g.id === i.granularityId })) };
            }
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-observation-trend"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as ObservationTrendIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'pointSelected') return { ...m, selectedPointId: i.pointId };
              if (i.type === 'granularityChangeRequested') {
                return { ...m, granularityOptions: m.granularityOptions?.map((g) => ({ ...g, selected: g.id === i.granularityId })) };
              }
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<NoteCaptureViewModel>({
    selector: 'emr-clinical-transcript',
    createInitialState: () => NOTE_CAPTURE_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalTranscript
        model={{ ...state, readOnly }}
        onIntent={(i: NoteCaptureIntent) => update('react', i.type, i, (m) => reduceNoteCapture(m, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-transcript"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as NoteCaptureIntent;
            update('lit', i.type, i, (m) => reduceNoteCapture(m, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<NoteCaptureViewModel>({
    selector: 'emr-evidence-suggestion-list',
    createInitialState: () => NOTE_CAPTURE_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrEvidenceSuggestionList
        model={{ ...state, readOnly }}
        onIntent={(i: NoteCaptureIntent) => update('react', i.type, i, (m) => reduceNoteCapture(m, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-evidence-suggestion-list"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as NoteCaptureIntent;
            update('lit', i.type, i, (m) => reduceNoteCapture(m, i));
          },
        }}
      />
    ),
  }),

  // ---- Safety, Pedigree, Annotation & Ophthalmology (9) ----------------------------------
  defineParityEntry<StagedChecklistViewModel>({
    selector: 'emr-staged-checklist',
    createInitialState: () => STAGED_CHECKLIST_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrStagedChecklist
        model={{ ...state, readOnly }}
        onIntent={(i: StagedChecklistIntent) => update('react', i.type, i, (m) => reduceStagedChecklistIntent(m, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-staged-checklist"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as StagedChecklistIntent;
            update('lit', i.type, i, (m) => reduceStagedChecklistIntent(m, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<PacChecklistViewModel>({
    selector: 'emr-pac-checklist',
    createInitialState: () => PAC_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrPacChecklist
        model={{ ...state, readOnly, form: { ...state.form, readOnly } }}
        onIntent={(i: PacChecklistIntent) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'formIntent' && i.intent.type === 'fieldEditRequested') {
              const { fieldId, value } = i.intent;
              return { ...m, form: { ...m.form, fields: { ...m.form.fields, [fieldId]: { ...(m.form.fields[fieldId] ?? { value: null }), value } } } };
            }
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-pac-checklist"
        props={{ model: { ...state, readOnly, form: { ...state.form, readOnly } } }}
        events={{
          intent: (raw) => {
            const i = raw as PacChecklistIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'formIntent' && i.intent.type === 'fieldEditRequested') {
                const { fieldId, value } = i.intent;
                return { ...m, form: { ...m.form, fields: { ...m.form.fields, [fieldId]: { ...(m.form.fields[fieldId] ?? { value: null }), value } } } };
              }
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<FamilyPedigreeViewModel>({
    selector: 'emr-family-pedigree',
    createInitialState: () => PEDIGREE_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrFamilyPedigree
        model={{ ...state, readOnly }}
        onIntent={(i: FamilyPedigreeIntent) => update('react', i.type, i, (m) => reduceFamilyPedigreeIntent(m, i))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-family-pedigree"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as FamilyPedigreeIntent;
            update('lit', i.type, i, (m) => reduceFamilyPedigreeIntent(m, i));
          },
        }}
      />
    ),
  }),

  defineParityEntry<EmrClinicalAnnotationCanvasState>({
    selector: 'emr-clinical-annotation-canvas',
    createInitialState: () => ANNOTATION_CANVAS_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrClinicalAnnotationCanvas
        model={{ ...state, readOnly }}
        onIntent={(i: EmrClinicalAnnotationCanvasIntent) =>
          update('react', `${i.type}:${i.reason}`, { reason: i.reason }, () => i.state)
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-clinical-annotation-canvas"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as EmrClinicalAnnotationCanvasIntent;
            update('lit', `${i.type}:${i.reason}`, { reason: i.reason }, () => i.state);
          },
        }}
      />
    ),
  }),

  defineParityEntry<DiagnosticResultViewModel>({
    selector: 'emr-diagnostic-result-summary',
    createInitialState: () => ({
      id: 'hvf-24-2',
      title: 'Humphrey 24-2 Automated Perimetry',
      subtitle: 'SITA-Standard white-on-white stimulus III',
      status: { label: 'Final', tone: 'success' },
      metadata: [
        { label: 'Right eye (OD)', value: 'MD -4.8 dB · PSD 5.1 dB' },
        { label: 'Left eye (OS)', value: 'MD -1.1 dB · PSD 1.8 dB' },
      ],
      metrics: [
        { id: 'od-rel', label: 'OD Fixation & Reliability', valueLabel: 'FL 1/14 · FP 2% · FN 3%', status: { label: 'Reliable', tone: 'success' } },
        { id: 'od-vf', label: 'OD Superior Arcuate Field', valueLabel: ' early superior nasal step noted', status: { label: 'Review plot', tone: 'warning' } },
      ],
      interpretation: 'Correlate right superior nasal field change with inferotemporal neuroretinal rim thinning.',
      attachments: [
        { id: 'plot-od', label: 'Open OD greyscale & total deviation', kind: 'plot' },
        { id: 'pdf-all', label: 'Open full perimetry PDF', kind: 'report' },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrDiagnosticResultSummary model={state} onIntent={(i: DiagnosticResultIntent) => update('react', i.type, i)} />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-diagnostic-result-summary"
        props={{ model: state }}
        events={{ intent: (i) => update('lit', (i as DiagnosticResultIntent).type, i) }}
      />
    ),
  }),

  defineParityEntry<SpectaclePrescriptionViewModel>({
    selector: 'emr-spectacle-prescription',
    createInitialState: () => SPECTACLE_SEED,
    renderReact: ({ state, readOnly, update }) => {
      const reduceSpec = (m: SpectaclePrescriptionViewModel, i: SpectaclePrescriptionIntent): SpectaclePrescriptionViewModel => {
        if (i.type === 'cellEditRequested') {
          return { ...m, values: { ...m.values, [i.eyeId]: { ...m.values[i.eyeId], [i.fieldId]: i.value } } };
        }
        if (i.type === 'copyEyeRequested') {
          return { ...m, values: { ...m.values, [i.toEyeId]: { ...m.values[i.fromEyeId] } } };
        }
        if (i.type === 'notesEditRequested') {
          return { ...m, notes: { ...m.notes, [i.eyeId]: i.value } };
        }
        return m;
      };
      return (
        <EmrSpectaclePrescription
          model={{ ...state, readOnly }}
          onIntent={(i) => update('react', i.type, i, (m) => reduceSpec(m, i))}
        />
      );
    },
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-spectacle-prescription"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as SpectaclePrescriptionIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'cellEditRequested') {
                return { ...m, values: { ...m.values, [i.eyeId]: { ...m.values[i.eyeId], [i.fieldId]: i.value } } };
              }
              if (i.type === 'copyEyeRequested') {
                return { ...m, values: { ...m.values, [i.toEyeId]: { ...m.values[i.fromEyeId] } } };
              }
              if (i.type === 'notesEditRequested') {
                return { ...m, notes: { ...m.notes, [i.eyeId]: i.value } };
              }
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<OctFindingRecordViewModel>({
    selector: 'emr-oct-finding-record',
    createInitialState: () => OCT_RECORD_SEED,
    renderReact: ({ state, readOnly, update }) => (
      <EmrOctFindingRecord
        model={{ ...state, readOnly }}
        onIntent={(i: OctFindingRecordIntent) =>
          update('react', i.type, i, (m) =>
            i.type === 'frameSelected'
              ? { ...m, eyes: m.eyes.map((e) => (e.eyeId === i.eyeId ? { ...e, selectedFrameId: i.frameId } : e)) }
              : m,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-oct-finding-record"
        props={{ model: { ...state, readOnly } }}
        events={{
          intent: (raw) => {
            const i = raw as OctFindingRecordIntent;
            update('lit', i.type, i, (m) =>
              i.type === 'frameSelected'
                ? { ...m, eyes: m.eyes.map((e) => (e.eyeId === i.eyeId ? { ...e, selectedFrameId: i.frameId } : e)) }
                : m,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<MeridianCrossViewModel>({
    selector: 'emr-meridian-cross',
    createInitialState: () => MERIDIAN_SEED,
    renderReact: ({ state, update }) => (
      <EmrMeridianCross model={state} onIntent={(i: MeridianCrossIntent) => update('react', i.type, i)} />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-meridian-cross"
        props={{ model: state }}
        events={{ intent: (i) => update('lit', (i as MeridianCrossIntent).type, i) }}
      />
    ),
  }),

  defineParityEntry<OcularMotilityViewModel>({
    selector: 'emr-ocular-motility-chart',
    createInitialState: () => ({
      id: 'motility-parity',
      title: '9-Gaze Ocular Motility Chart (OD / OS)',
      layout: 'per-eye',
      eyes: [
        { eyeId: 'od', label: 'Right eye', shortLabel: 'OD', cells: fullMotilityCells() },
        { eyeId: 'os', label: 'Left eye', shortLabel: 'OS', cells: { ...fullMotilityCells(), left: { valueLabel: 'Full', status: 'recorded' } } },
      ],
      positionLabels: GAZE_LABELS,
      selected: { eyeId: 'od', position: 'left' },
      summaryText: 'Mild right lateral rectus underaction (-2) on abduction.',
    }),
    renderReact: ({ state, update }) => (
      <EmrOcularMotilityChart
        model={state}
        onIntent={(i: OcularMotilityIntent) =>
          update('react', i.type, i, (m) => (i.type === 'cellSelected' ? { ...m, selected: { eyeId: i.eyeId, position: i.position } } : m))
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-ocular-motility-chart"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as OcularMotilityIntent;
            update('lit', i.type, i, (m) => (i.type === 'cellSelected' ? { ...m, selected: { eyeId: i.eyeId, position: i.position } } : m));
          },
        }}
      />
    ),
  }),
];
