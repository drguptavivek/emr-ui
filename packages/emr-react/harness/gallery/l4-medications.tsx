'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type {
  DoseForm,
  DoseScheduleViewModel,
  DoseSlot,
  EmrBadge,
  EmrOption,
  MedicationReconciliationViewModel,
  PrescribingFormularyItem,
  PrescribingRow,
  PrescribingTableIntent,
  PrescribingTableViewModel,
  ReconMedication,
  ReconRow,
  ScoreResultCardViewModel,
} from '@drguptavivek/emr-controller';
import { EmrDoseSchedule, EmrMedicationReconciliation, EmrScoreResultCard } from '../../src/l4-medications';
import { EmrPrescribingTable } from '../../src/l4-prescribing-table';
import { fontFamily, useEmrTheme } from '../../src/theme';
import type { GallerySection } from './types';

// ---------------------------------------------------------------------------
// Synthetic Score Result Card data
// ---------------------------------------------------------------------------

const news2Model: ScoreResultCardViewModel = {
  id: 'news2',
  instrumentLabel: 'NEWS2 early warning score',
  result: {
    total: 7,
    bandLabel: 'High clinical risk',
    bandTone: 'danger',
    interpretation: 'Emergency assessment by a critical-care competent team. Consider transfer to a higher level of care.',
    computedAt: '2026-03-14T09:42:00Z',
    components: [
      { id: 'resp', label: 'Respiration rate', value: 2 },
      { id: 'spo2', label: 'SpO2 (scale 1)', value: 1 },
      { id: 'air', label: 'Air or oxygen', value: 2 },
      { id: 'sbp', label: 'Systolic blood pressure', value: 1 },
      { id: 'pulse', label: 'Pulse', value: 0 },
      { id: 'cons', label: 'Consciousness', value: 0 },
      { id: 'temp', label: 'Temperature', value: 1 },
    ],
  },
  canRecompute: true,
  canViewDetail: true,
};

const phq9Items = [
  'Little interest or pleasure',
  'Feeling down or hopeless',
  'Sleep problems',
  'Tired or little energy',
  'Appetite changes',
  'Feeling bad about yourself',
  'Trouble concentrating',
  'Slowed or restless',
  'Thoughts of self-harm',
];

const phq9Model: ScoreResultCardViewModel = {
  id: 'phq9',
  instrumentLabel: 'PHQ-9 depression screen',
  result: {
    total: 12,
    bandLabel: 'Moderate depression',
    bandTone: 'warning',
    interpretation: 'Review the patient for treatment planning. Item 9 is scored 1, so ask about safety before the visit ends.',
    computedAt: '2026-03-14T10:05:00Z',
    components: phq9Items.map((label, i) => ({
      id: `q${i + 1}`,
      label: `${i + 1}. ${label}`,
      value: [1, 2, 1, 2, 1, 2, 1, 1, 1][i]!,
    })),
  },
  canRecompute: true,
  canViewDetail: true,
};

function ScoreCardDemo({ initial }: { initial: ScoreResultCardViewModel }) {
  const t = useEmrTheme();
  const [model, setModel] = useState(initial);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <EmrScoreResultCard
        model={model}
        onIntent={(intent) => {
          setLastIntent(JSON.stringify(intent));
          if (intent.type === 'recomputeRequested') {
            setModel((curr) => ({ ...curr, stale: false, staleLabel: undefined }));
          }
        }}
      />
      {lastIntent ? (
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
          Intent: {lastIntent}
        </Text>
      ) : null}
    </View>
  );
}

function ScoreCardCompactDemo() {
  return (
    <View style={{ gap: 8 }}>
      <EmrScoreResultCard model={{ ...news2Model, compact: true }} />
      <EmrScoreResultCard model={{ ...phq9Model, compact: true }} />
      <EmrScoreResultCard
        model={{
          ...news2Model,
          instrumentLabel: 'NEWS2 (previous set of observations)',
          compact: true,
          stale: true,
          staleLabel: 'Inputs changed',
          canViewDetail: false,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Synthetic Dose Schedule data
// ---------------------------------------------------------------------------

const slot = (id: string, label: string, amount: number | null, extra: Partial<DoseSlot> = {}): DoseSlot => ({
  id,
  label,
  amount,
  ...extra,
});

const mna = (m: number | null, a: number | null, n: number | null): DoseSlot[] => [
  slot('m', 'Morning', m, { timeHint: '8 am' }),
  slot('a', 'Afternoon', a, { timeHint: '2 pm' }),
  slot('n', 'Night', n, { timeHint: '9 pm' }),
];

const tabletBdModel: DoseScheduleViewModel = {
  medication: { label: 'Paracetamol', strength: '500 mg', formLabel: 'Tablet', form: 'tablet' },
  unit: { one: 'tablet', other: 'tablets' },
  frequency: { code: 'BD', label: 'Twice daily' },
  slots: mna(1, null, 1),
  route: 'By mouth',
  foodRelation: 'After food',
  duration: '5 days',
  startLabel: 'Starts today',
  canEdit: true,
  canShowInstructions: true,
};

const eyeDropTaperModel: DoseScheduleViewModel = {
  medication: { label: 'Prednisolone acetate', strength: '1%', formLabel: 'Eye drops', form: 'drop' },
  unit: { one: 'drop', other: 'drops' },
  frequency: { label: 'Reducing over 5 weeks' },
  slots: [],
  site: { code: 'OD', label: 'Right eye' },
  taper: [
    { id: 'w1', periodLabel: 'Week 1', frequencyLabel: '6 times daily' },
    { id: 'w2', periodLabel: 'Week 2', frequencyLabel: '4 times daily' },
    { id: 'w3', periodLabel: 'Week 3', frequencyLabel: '3 times daily' },
    { id: 'w4', periodLabel: 'Week 4', frequencyLabel: '2 times daily' },
    { id: 'w5', periodLabel: 'Week 5', frequencyLabel: 'Once daily, then stop' },
  ],
  separationNote: 'Shake the bottle well. Wait 5 minutes between different eye drops.',
  instructions: ['One drop each time.'],
};

const prnModel: DoseScheduleViewModel = {
  medication: { label: 'Paracetamol', strength: '500 mg', formLabel: 'Tablet', form: 'tablet' },
  unit: { one: 'tablet', other: 'tablets' },
  frequency: { code: 'SOS', label: 'Only when needed' },
  slots: [slot('dose', 'Each dose', 1)],
  prn: { label: 'Take only if you have pain or fever', maxLabel: 'No more than 4 tablets in 24 hours' },
  route: 'By mouth',
};

function DoseScheduleDemo({ model }: { model: DoseScheduleViewModel }) {
  const t = useEmrTheme();
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <EmrDoseSchedule model={model} onIntent={(i) => setLastIntent(i.type)} />
      {lastIntent ? (
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
          Intent: {lastIntent}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Synthetic Medication Reconciliation data
// ---------------------------------------------------------------------------

const reconOptions: EmrOption[] = [
  { value: 'continue', label: 'Continue' },
  { value: 'modify', label: 'Modify' },
  { value: 'stop', label: 'Stop' },
  { value: 'new', label: 'New' },
  { value: 'unmatched', label: 'Unmatched' },
];

const patientReported: EmrBadge = { label: 'Patient reported', tone: 'info' };
const pharmacyList: EmrBadge = { label: 'Pharmacy list', tone: 'neutral' };
const wardOrder: EmrBadge = { label: 'Ward order', tone: 'success' };
const admissionOrder: EmrBadge = { label: 'Admission order', tone: 'success' };

const med = (id: string, nameLabel: string, doseSummary: string, extra: Partial<ReconMedication> = {}): ReconMedication => ({
  id,
  nameLabel,
  doseSummary,
  ...extra,
});

const makeRow = (id: string, extra: Partial<ReconRow> = {}): ReconRow => ({
  id,
  path: ['medications', id],
  decisionOptions: reconOptions,
  ...extra,
});

const admissionReconModel: MedicationReconciliationViewModel = {
  id: 'recon-admission',
  title: 'Admission medicine reconciliation',
  leftLabel: 'Home list',
  rightLabel: 'Current orders',
  rows: [
    makeRow('r1', {
      left: med('h1', 'Amlodipine 5 mg tablet', '1 tablet once daily (OD), in the morning', {
        lastTakenLabel: 'today, 8 am',
        badges: [pharmacyList],
      }),
      right: med('o1', 'Amlodipine 5 mg tablet', '1 tablet once daily (OD), in the morning', {
        badges: [admissionOrder],
      }),
      decision: 'continue',
    }),
    makeRow('r2', {
      left: med('h2', 'Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', {
        lastTakenLabel: 'today, 8 am',
        badges: [patientReported],
      }),
      right: med('o2', 'Metformin 500 mg tablet', '1 tablet twice daily (BD), after food', {
        badges: [wardOrder],
      }),
      decision: 'continue',
    }),
    makeRow('r3', {
      left: med('h3', 'Atorvastatin 20 mg tablet', '1 tablet once daily (OD), at night', {
        lastTakenLabel: 'yesterday, 9 pm',
        badges: [patientReported],
      }),
      right: med('o3', 'Atorvastatin 40 mg tablet', '1 tablet once daily (OD), at night', {
        badges: [admissionOrder],
      }),
      decision: 'modify',
      reasonRequired: true,
      reason: 'Dose increased after acute coronary syndrome protocol.',
    }),
    makeRow('r4', {
      left: med('h4', 'Timolol 0.5% eye drops', '1 drop in both eyes (OU) twice daily (BD)', {
        lastTakenLabel: 'today, 8 am',
        badges: [patientReported],
      }),
    }),
  ],
  selectedRowId: 'r3',
  summary: [
    { label: '2 continue', tone: 'success' },
    { label: '1 modify', tone: 'warning' },
    { label: '1 not decided', tone: 'neutral', assistiveText: 'Still needs a decision' },
  ],
  emptyMessage: 'No medicines on either list.',
  canComplete: false,
};

const reasonRequiredReconModel: MedicationReconciliationViewModel = {
  id: 'recon-reason',
  title: 'Admission medicine reconciliation',
  leftLabel: 'Home list',
  rightLabel: 'Current orders',
  rows: [
    makeRow('e1', {
      left: med('h1', 'Aspirin 75 mg tablet', '1 tablet once daily (OD), after lunch', { badges: [patientReported] }),
      right: med('o1', 'Aspirin 75 mg tablet', '1 tablet once daily (OD), after lunch', { badges: [admissionOrder] }),
      decision: 'continue',
    }),
    makeRow('e2', {
      left: med('h2', 'Atorvastatin 20 mg tablet', '1 tablet once daily (OD), at night', { badges: [pharmacyList] }),
      decision: 'stop',
      reasonRequired: true,
      messages: [{ path: ['medications', 'e2', 'reason'], severity: 'error', message: 'Give a reason for stopping this medicine.' }],
    }),
    makeRow('e3', {
      left: med('h3', 'Losartan 50 mg tablet', '1 tablet once daily (OD), in the morning', { badges: [patientReported] }),
      right: med('o3', 'Losartan 25 mg tablet', '1 tablet once daily (OD), in the morning', { badges: [admissionOrder] }),
      decision: 'modify',
      reasonRequired: true,
      reason: 'Lower dose while kidney function is rechecked.',
      messages: [{ path: ['medications', 'e3'], severity: 'warning', message: 'Dose differs between the two lists.' }],
    }),
  ],
  summary: [
    { label: '1 continue', tone: 'success' },
    { label: '1 stop', tone: 'danger' },
    { label: '1 modify', tone: 'warning' },
    { label: '1 needs a reason', tone: 'danger' },
  ],
  emptyMessage: 'No medicines on either list.',
  canComplete: false,
};

const readOnlyReconModel: MedicationReconciliationViewModel = {
  ...admissionReconModel,
  id: 'recon-readonly',
  readOnly: true,
  rows: admissionReconModel.rows.slice(0, 3),
  summary: [{ label: 'Completed', tone: 'success' }],
  canComplete: true,
};

function ReconDemo({ initial }: { initial: MedicationReconciliationViewModel }) {
  const [model, setModel] = useState(initial);
  return (
    <EmrMedicationReconciliation
      model={model}
      onIntent={(intent) => {
        if (intent.type === 'rowSelected') {
          setModel((curr) => ({ ...curr, selectedRowId: intent.rowId }));
        } else if (intent.type === 'decisionChangeRequested') {
          const rowId = String(intent.path[intent.path.length - 1]);
          setModel((curr) => ({
            ...curr,
            rows: curr.rows.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    decision: intent.decision,
                    reasonRequired: intent.decision === 'stop' || intent.decision === 'modify',
                  }
                : r,
            ),
          }));
        } else if (intent.type === 'reasonChangeRequested') {
          const rowId = String(intent.path[intent.path.length - 1]);
          setModel((curr) => ({
            ...curr,
            rows: curr.rows.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    reason: intent.reason,
                    messages: intent.reason.trim() ? [] : r.messages,
                  }
                : r,
            ),
          }));
        }
      }}
    />
  );
}

const PRESCRIBING_SLOTS = [
  { id: 'm', label: 'Morning', shortLabel: 'Morning', timeHint: '8 am' },
  { id: 'a', label: 'Afternoon', shortLabel: 'Afternoon', timeHint: '2 pm' },
  { id: 'e', label: 'Evening', shortLabel: 'Evening', timeHint: '6 pm' },
  { id: 'n', label: 'Night', shortLabel: 'Night', timeHint: '10 pm' },
] as const;

const PRESCRIBING_PRESETS = [
  { id: 'od', label: 'OD', slotIds: ['m'] },
  { id: 'bd', label: 'BD', slotIds: ['m', 'n'] },
  { id: 'tds', label: 'TDS', slotIds: ['m', 'a', 'n'] },
  { id: 'qid', label: 'QID', slotIds: ['m', 'a', 'e', 'n'] },
  { id: 'hs', label: 'HS', slotIds: ['n'] },
] as const;

const FORMULARY_ITEMS: readonly PrescribingFormularyItem[] = [
  { code: 'F-01', drugName: 'Moxifloxacin', strength: '0.5%', form: 'drop', formLabel: 'Eye drops', route: 'eye', site: 'OD', unitLabel: 'drop', defaultPresetId: 'qid', defaultDurationCount: 7, defaultDurationUnit: 'days', defaultFoodRelation: '5 min gap', defaultInstructions: 'Instil 1 drop cleanly; wait 5 min before other drops.' },
  { code: 'F-02', drugName: 'Prednisolone acetate', strength: '1%', form: 'drop', formLabel: 'Eye drops', route: 'eye', site: 'OD', unitLabel: 'drop', defaultPresetId: 'qid', defaultDurationCount: 4, defaultDurationUnit: 'weeks', defaultFoodRelation: '5 min gap', defaultInstructions: 'Shake well before use. Follow weekly taper.' },
  { code: 'F-03', drugName: 'Carboxymethylcellulose', strength: '0.5%', form: 'drop', formLabel: 'Eye drops', route: 'eye', site: 'OU', unitLabel: 'drop', defaultPresetId: 'qid', defaultDurationCount: 30, defaultDurationUnit: 'days', defaultFoodRelation: 'Anytime', defaultInstructions: 'Lubricating eye drops.' },
  { code: 'F-04', drugName: 'Paracetamol', strength: '500 mg', form: 'tablet', formLabel: 'Tablet', route: 'oral', unitLabel: 'tab', defaultPresetId: 'tds', defaultDurationCount: 5, defaultDurationUnit: 'days', defaultFoodRelation: 'After food', defaultInstructions: 'Take after meals for pain or fever.' },
  { code: 'F-05', drugName: 'Amoxicillin + Clavulanate', strength: '625 mg', form: 'tablet', formLabel: 'Tablet', route: 'oral', unitLabel: 'tab', defaultPresetId: 'bd', defaultDurationCount: 5, defaultDurationUnit: 'days', defaultFoodRelation: 'After food', defaultInstructions: 'Complete the full 5-day antibiotic course.' },
  { code: 'F-06', drugName: 'Pantoprazole', strength: '40 mg', form: 'tablet', formLabel: 'Tablet', route: 'oral', unitLabel: 'tab', defaultPresetId: 'od', defaultDurationCount: 14, defaultDurationUnit: 'days', defaultFoodRelation: 'Before food', defaultInstructions: 'Take 30 minutes before breakfast.' },
  { code: 'F-07', drugName: 'Metformin', strength: '500 mg', form: 'tablet', formLabel: 'Tablet', route: 'oral', unitLabel: 'tab', defaultPresetId: 'bd', defaultDurationCount: 30, defaultDurationUnit: 'days', defaultFoodRelation: 'With food', defaultInstructions: 'Swallow whole with meals.' },
];

function computeRowAnnotations(row: PrescribingRow): PrescribingRow {
  const amounts = PRESCRIBING_SLOTS.map((d) => row.slots.find((s) => s.id === d.id)?.amount ?? 0);
  const patternLabel = amounts.map((n) => (n === 0.5 ? '½' : String(n))).join(' - ');
  const activeIds = PRESCRIBING_SLOTS.filter((d) => (row.slots.find((s) => s.id === d.id)?.amount ?? 0) > 0).map((d) => d.id);
  const matchedPreset = PRESCRIBING_PRESETS.find(
    (p) => p.slotIds.length === activeIds.length && p.slotIds.every((id) => activeIds.includes(id)),
  );
  return {
    ...row,
    patternLabel,
    frequencyCode: matchedPreset?.label ?? (activeIds.length > 0 ? `${activeIds.length}x/d` : '0'),
  };
}

function makeSlots(mAmt: number, aAmt: number, eAmt: number, nAmt: number): readonly DoseSlot[] {
  return [
    { id: 'm', label: 'Morning', timeHint: '8 am', amount: mAmt },
    { id: 'a', label: 'Afternoon', timeHint: '2 pm', amount: aAmt },
    { id: 'e', label: 'Evening', timeHint: '6 pm', amount: eAmt },
    { id: 'n', label: 'Night', timeHint: '10 pm', amount: nAmt },
  ];
}

const initialPrescribingRows: readonly PrescribingRow[] = [
  computeRowAnnotations({
    id: 'rx-1',
    drugName: 'Moxifloxacin',
    strength: '0.5%',
    form: 'drop',
    formLabel: 'Eye drops',
    route: 'eye',
    site: 'OD',
    slots: makeSlots(1, 1, 1, 1),
    unitLabel: 'drop',
    durationCount: 7,
    durationUnit: 'days',
    foodRelation: '5 min gap',
    instructions: 'Wait 5 minutes between different eye drops.',
  }),
  computeRowAnnotations({
    id: 'rx-2',
    drugName: 'Prednisolone acetate',
    strength: '1%',
    form: 'drop',
    formLabel: 'Eye drops',
    route: 'eye',
    site: 'OD',
    slots: makeSlots(1, 1, 1, 1),
    unitLabel: 'drop',
    durationCount: 4,
    durationUnit: 'weeks',
    foodRelation: '5 min gap',
    instructions: 'Shake well before use. Follow reducing taper below.',
    taperExpanded: true,
    taperSteps: [
      { id: 'ts-1', periodLabel: 'Week 1', frequencyLabel: '1 drop 4 times daily (QID)' },
      { id: 'ts-2', periodLabel: 'Week 2', frequencyLabel: '1 drop 3 times daily (TDS)' },
      { id: 'ts-3', periodLabel: 'Week 3', frequencyLabel: '1 drop twice daily (BD)' },
      { id: 'ts-4', periodLabel: 'Week 4', frequencyLabel: '1 drop once daily (OD), then stop' },
    ],
  }),
  computeRowAnnotations({
    id: 'rx-3',
    drugName: 'Paracetamol',
    strength: '500 mg',
    form: 'tablet',
    formLabel: 'Tablet',
    route: 'oral',
    slots: makeSlots(1, 0, 0, 1),
    unitLabel: 'tab',
    durationCount: 5,
    durationUnit: 'days',
    foodRelation: 'After food',
    instructions: 'Take after meals.',
  }),
];

let nextRxSeq = 10;

export function PrescribingTableDemo() {
  const [rows, setRows] = useState<readonly PrescribingRow[]>(initialPrescribingRows);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleIntent = (intent: PrescribingTableIntent) => {
    setError(undefined);
    switch (intent.type) {
      case 'rowAddRequested': {
        const newRow = computeRowAnnotations({
          id: `rx-${++nextRxSeq}`,
          drugName: '',
          strength: '500 mg',
          form: 'tablet',
          formLabel: 'Tablet',
          route: 'oral',
          slots: makeSlots(1, 0, 0, 1),
          unitLabel: 'tab',
          durationCount: 5,
          durationUnit: 'days',
          foodRelation: 'After food',
          instructions: '',
        });
        if (!intent.afterRowId) {
          setRows((prev) => [...prev, newRow]);
        } else {
          setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === intent.afterRowId);
            if (idx < 0) return [...prev, newRow];
            return [...prev.slice(0, idx + 1), newRow, ...prev.slice(idx + 1)];
          });
        }
        break;
      }
      case 'rowRemoveRequested': {
        setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== intent.rowId)));
        break;
      }
      case 'rowMoveRequested': {
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.id === intent.rowId);
          if (idx < 0) return prev;
          const targetIdx = intent.direction === 'up' ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= prev.length) return prev;
          const copy = [...prev];
          const [moved] = copy.splice(idx, 1);
          copy.splice(targetIdx, 0, moved!);
          return copy;
        });
        break;
      }
      case 'formularySelected': {
        const it = intent.item;
        const preset = PRESCRIBING_PRESETS.find((p) => p.id === (it.defaultPresetId ?? 'bd')) ?? PRESCRIBING_PRESETS[1]!;
        setRows((prev) =>
          prev.map((r) =>
            r.id === intent.rowId
              ? computeRowAnnotations({
                  ...r,
                  drugName: it.drugName,
                  strength: it.strength,
                  form: it.form,
                  formLabel: it.formLabel,
                  route: it.route,
                  site: it.site,
                  unitLabel: it.unitLabel,
                  slots: PRESCRIBING_SLOTS.map((s) => ({
                    id: s.id,
                    label: s.label,
                    timeHint: s.timeHint,
                    amount: preset.slotIds.includes(s.id as never) ? 1 : 0,
                  })),
                  durationCount: it.defaultDurationCount ?? 5,
                  durationUnit: it.defaultDurationUnit ?? 'days',
                  foodRelation: it.defaultFoodRelation ?? 'After food',
                  instructions: it.defaultInstructions ?? '',
                  error: undefined,
                })
              : r,
          ),
        );
        break;
      }
      case 'drugNameChanged':
        setRows((prev) => prev.map((r) => (r.id === intent.rowId ? { ...r, drugName: intent.drugName, error: undefined } : r)));
        break;
      case 'strengthChanged':
        setRows((prev) => prev.map((r) => (r.id === intent.rowId ? { ...r, strength: intent.strength } : r)));
        break;
      case 'formChanged': {
        const labels: Partial<Record<DoseForm, string>> = {
          tablet: 'Tablet',
          drop: 'Eye drops',
          capsule: 'Capsule',
          ointment: 'Ointment',
          liquid: 'Syrup / Liquid',
        };
        const units: Partial<Record<DoseForm, string>> = {
          tablet: 'tab',
          drop: 'drop',
          capsule: 'cap',
          ointment: 'app',
          liquid: 'mL',
        };
        setRows((prev) =>
          prev.map((r) =>
            r.id === intent.rowId
              ? {
                  ...r,
                  form: intent.form,
                  formLabel: labels[intent.form] ?? intent.form,
                  unitLabel: units[intent.form] ?? 'dose',
                  route: intent.form === 'drop' ? 'eye' : r.route,
                  site: intent.form === 'drop' ? r.site ?? 'OU' : r.site,
                }
              : r,
          ),
        );
        break;
      }
      case 'routeChanged':
        setRows((prev) =>
          prev.map((r) =>
            r.id === intent.rowId ? { ...r, route: intent.route, site: intent.route === 'eye' ? r.site ?? 'OU' : undefined } : r,
          ),
        );
        break;
      case 'siteChanged':
        setRows((prev) => prev.map((r) => (r.id === intent.rowId ? { ...r, site: intent.site } : r)));
        break;
      case 'slotStepped':
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== intent.rowId) return r;
            const nextSlots = PRESCRIBING_SLOTS.map((def) => {
              const cur = r.slots.find((s) => s.id === def.id)?.amount ?? 0;
              if (def.id !== intent.slotId) return { id: def.id, label: def.label, timeHint: def.timeHint, amount: cur };
              const nextAmt = Math.max(0, Math.round((cur + intent.delta) * 100) / 100);
              return { id: def.id, label: def.label, timeHint: def.timeHint, amount: nextAmt };
            });
            return computeRowAnnotations({ ...r, slots: nextSlots });
          }),
        );
        break;
      case 'slotAmountChanged':
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== intent.rowId) return r;
            const nextSlots = PRESCRIBING_SLOTS.map((def) => {
              const cur = r.slots.find((s) => s.id === def.id)?.amount ?? 0;
              return {
                id: def.id,
                label: def.label,
                timeHint: def.timeHint,
                amount: def.id === intent.slotId ? (intent.amount ?? 0) : cur,
              };
            });
            return computeRowAnnotations({ ...r, slots: nextSlots });
          }),
        );
        break;
      case 'presetApplied': {
        const preset = PRESCRIBING_PRESETS.find((p) => p.id === intent.presetId);
        if (!preset) break;
        setRows((prev) =>
          prev.map((r) =>
            r.id === intent.rowId
              ? computeRowAnnotations({
                  ...r,
                  slots: PRESCRIBING_SLOTS.map((def) => ({
                    id: def.id,
                    label: def.label,
                    timeHint: def.timeHint,
                    amount: preset.slotIds.includes(def.id as never) ? 1 : 0,
                  })),
                })
              : r,
          ),
        );
        break;
      }
      case 'durationStepped':
        setRows((prev) =>
          prev.map((r) =>
            r.id === intent.rowId
              ? { ...r, durationCount: Math.max(1, (r.durationCount ?? 1) + intent.delta) }
              : r,
          ),
        );
        break;
      case 'durationChanged':
        setRows((prev) =>
          prev.map((r) =>
            r.id === intent.rowId
              ? { ...r, durationCount: intent.count, durationUnit: intent.unit ?? r.durationUnit }
              : r,
          ),
        );
        break;
      case 'foodRelationChanged':
        setRows((prev) => prev.map((r) => (r.id === intent.rowId ? { ...r, foodRelation: intent.foodRelation } : r)));
        break;
      case 'instructionsChanged':
        setRows((prev) => prev.map((r) => (r.id === intent.rowId ? { ...r, instructions: intent.instructions } : r)));
        break;
      case 'taperToggleRequested':
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== intent.rowId) return r;
            const nextExpanded = !r.taperExpanded;
            const taperSteps =
              nextExpanded && (!r.taperSteps || r.taperSteps.length === 0)
                ? [
                    { id: `ts-${++nextRxSeq}`, periodLabel: 'Week 1', frequencyLabel: '4 times daily (QID)' },
                    { id: `ts-${++nextRxSeq}`, periodLabel: 'Week 2', frequencyLabel: 'twice daily (BD)' },
                  ]
                : r.taperSteps;
            return { ...r, taperExpanded: nextExpanded, taperSteps };
          }),
        );
        break;
      case 'taperStepAddRequested':
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== intent.rowId) return r;
            const cur = [...(r.taperSteps ?? [])];
            const newStep = {
              id: `ts-${++nextRxSeq}`,
              periodLabel: `Week ${cur.length + 1}`,
              frequencyLabel: 'Once daily (OD)',
            };
            if (!intent.afterStepId) {
              cur.push(newStep);
            } else {
              const sIdx = cur.findIndex((s) => s.id === intent.afterStepId);
              cur.splice(sIdx >= 0 ? sIdx + 1 : cur.length, 0, newStep);
            }
            return { ...r, taperExpanded: true, taperSteps: cur };
          }),
        );
        break;
      case 'taperStepRemoveRequested':
        setRows((prev) =>
          prev.map((r) =>
            r.id === intent.rowId
              ? { ...r, taperSteps: (r.taperSteps ?? []).filter((s) => s.id !== intent.stepId) }
              : r,
          ),
        );
        break;
      case 'taperStepMoveRequested':
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== intent.rowId) return r;
            const cur = [...(r.taperSteps ?? [])];
            const idx = cur.findIndex((s) => s.id === intent.stepId);
            const target = intent.direction === 'up' ? idx - 1 : idx + 1;
            if (idx < 0 || target < 0 || target >= cur.length) return r;
            const [moved] = cur.splice(idx, 1);
            cur.splice(target, 0, moved!);
            return { ...r, taperSteps: cur };
          }),
        );
        break;
      case 'taperStepChanged':
        setRows((prev) =>
          prev.map((r) =>
            r.id === intent.rowId
              ? {
                  ...r,
                  taperSteps: (r.taperSteps ?? []).map((s) =>
                    s.id === intent.stepId
                      ? {
                          ...s,
                          periodLabel: intent.periodLabel ?? s.periodLabel,
                          frequencyLabel: intent.frequencyLabel ?? s.frequencyLabel,
                        }
                      : s,
                  ),
                }
              : r,
          ),
        );
        break;
      case 'favouriteApplied': {
        if (intent.favouriteId === 'cataract-postop') {
          setRows(initialPrescribingRows);
        } else if (intent.favouriteId === 'dry-eye') {
          setRows([
            computeRowAnnotations({
              id: `rx-${++nextRxSeq}`,
              drugName: 'Carboxymethylcellulose',
              strength: '0.5%',
              form: 'drop',
              formLabel: 'Eye drops',
              route: 'eye',
              site: 'OU',
              slots: makeSlots(1, 1, 1, 1),
              unitLabel: 'drop',
              durationCount: 30,
              durationUnit: 'days',
              foodRelation: 'Anytime',
              instructions: 'Preservative-free tear substitute.',
            }),
          ]);
        } else if (intent.favouriteId === 'antibiotic-fever') {
          setRows([
            computeRowAnnotations({
              id: `rx-${++nextRxSeq}`,
              drugName: 'Amoxicillin + Clavulanate',
              strength: '625 mg',
              form: 'tablet',
              formLabel: 'Tablet',
              route: 'oral',
              slots: makeSlots(1, 0, 0, 1),
              unitLabel: 'tab',
              durationCount: 5,
              durationUnit: 'days',
              foodRelation: 'After food',
              instructions: 'Complete the full 5-day course.',
            }),
            computeRowAnnotations({
              id: `rx-${++nextRxSeq}`,
              drugName: 'Pantoprazole',
              strength: '40 mg',
              form: 'tablet',
              formLabel: 'Tablet',
              route: 'oral',
              slots: makeSlots(1, 0, 0, 0),
              unitLabel: 'tab',
              durationCount: 5,
              durationUnit: 'days',
              foodRelation: 'Before food',
              instructions: 'Take 30 min before breakfast.',
            }),
          ]);
        }
        break;
      }
      case 'signRequested': {
        const missing = rows.some((r) => !r.drugName.trim());
        if (missing) {
          setRows((prev) =>
            prev.map((r) => (!r.drugName.trim() ? { ...r, error: 'Select or enter a medicine name before signing.' } : r)),
          );
          setError('Complete all medicine names before signing the prescription.');
        } else {
          setSigned(true);
        }
        break;
      }
      case 'amendRequested':
        setSigned(false);
        break;
    }
  };

  const model: PrescribingTableViewModel = {
    title: 'Multi-Row Clinical Prescribing Table (Rx Composer)',
    rows,
    formulary: FORMULARY_ITEMS,
    favourites: [
      { id: 'cataract-postop', label: 'Cataract Post-Op Kit' },
      { id: 'dry-eye', label: 'Dry Eye Regimen' },
      { id: 'antibiotic-fever', label: 'Antibiotic + PPI' },
    ],
    slotDefinitions: PRESCRIBING_SLOTS,
    presets: PRESCRIBING_PRESETS,
    status: signed ? { label: 'Signed', tone: 'success' } : { label: `${rows.length} medicines · Draft`, tone: 'info' },
    prescriberLabel: 'Dr. S. Iyer (Reg #48219)',
    signedAtLabel: signed ? '10 Nov 2026, 00:25' : undefined,
    canSign: !signed,
    canAmend: signed,
    error,
  };

  return <EmrPrescribingTable model={model} onIntent={handleIntent} />;
}

export const gallery: GallerySection[] = [
  { id: 'prescribing-table-composer', title: 'EmrPrescribingTable · Multi-Row Rx Table (+ / − / ↑ / ↓ / Taper)', render: () => <PrescribingTableDemo /> },
  { id: 'score-card-ews', title: 'EmrScoreResultCard · NEWS2 EWS', render: () => <ScoreCardDemo initial={news2Model} /> },
  { id: 'score-card-phq9', title: 'EmrScoreResultCard · PHQ-9', render: () => <ScoreCardDemo initial={phq9Model} /> },
  { id: 'score-card-compact', title: 'EmrScoreResultCard · Compact', render: () => <ScoreCardCompactDemo /> },
  {
    id: 'score-card-stale',
    title: 'EmrScoreResultCard · Stale',
    render: () => <ScoreCardDemo initial={{ ...phq9Model, stale: true, staleLabel: 'Answers changed since this score was calculated' }} />,
  },
  { id: 'dose-schedule-bd', title: 'EmrDoseSchedule · Tablet twice daily (BD)', render: () => <DoseScheduleDemo model={tabletBdModel} /> },
  { id: 'dose-schedule-taper', title: 'EmrDoseSchedule · Eye-drop taper', render: () => <DoseScheduleDemo model={eyeDropTaperModel} /> },
  { id: 'dose-schedule-prn', title: 'EmrDoseSchedule · As needed (PRN)', render: () => <DoseScheduleDemo model={prnModel} /> },
  { id: 'med-recon-admission', title: 'EmrMedicationReconciliation · Admission', render: () => <ReconDemo initial={admissionReconModel} /> },
  { id: 'med-recon-reason-error', title: 'EmrMedicationReconciliation · Reason required error', render: () => <ReconDemo initial={reasonRequiredReconModel} /> },
  { id: 'med-recon-readonly', title: 'EmrMedicationReconciliation · Read-only', render: () => <ReconDemo initial={readOnlyReconModel} /> },
];
