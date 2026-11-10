'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import type {
  CrossMeridian,
  DiagnosticMetric,
  DiagnosticResultIntent,
  DiagnosticResultViewModel,
  EmrBadge,
  GazePosition,
  MeridianCrossEye,
  MeridianCrossIntent,
  MeridianCrossViewModel,
  MotilityCell,
  MotilityEye,
  OctEyeRecord,
  OctFinding,
  OctFindingRecordIntent,
  OctFindingRecordViewModel,
  OctFrameRef,
  OcularMotilityIntent,
  OcularMotilityViewModel,
  SpectaclePrescriptionIntent,
  SpectaclePrescriptionViewModel,
} from '@drguptavivek/emr-controller';
import {
  EmrDiagnosticResultSummary,
  EmrMeridianCross,
  EmrOctFindingRecord,
  EmrOcularMotilityChart,
  EmrSpectaclePrescription,
} from '../../src/l4-ophthalmology';
import { EmrOptionChip, EmrRow } from '../../src/primitives';
import { fontFamily, useEmrTheme } from '../../src/theme';
import type { GallerySection } from './types';

// ---------------------------------------------------------------------------
// 1. EmrDiagnosticResultSummary demo
// ---------------------------------------------------------------------------

const PERIMETRY_RESULT: DiagnosticResultViewModel = {
  id: 'perimetry-2026-08-19',
  title: 'Perimetry result',
  subtitle: 'Automated visual field examination',
  status: { label: 'Final', tone: 'success' },
  metadata: [
    { label: 'Right eye (OD)', value: 'Tested · 19 Aug 2026, 10:15' },
    { label: 'Left eye (OS)', value: 'Tested · 19 Aug 2026, 10:24' },
    { label: 'Method', value: 'Humphrey 24-2 · stimulus details supplied by device' },
  ],
  metrics: [
    {
      id: 'od-reliability',
      label: 'Right eye (OD) · reliability fields',
      valueLabel: 'Fixation losses and false responses recorded',
      referenceLabel: 'See device report',
      status: { label: 'Recorded', tone: 'info' },
      helpText: 'Device-provided description; no grading applied.',
    },
    {
      id: 'os-reliability',
      label: 'Left eye (OS) · reliability fields',
      valueLabel: 'Reliability data available',
      referenceLabel: 'See device report',
      status: { label: 'Recorded', tone: 'info' },
    },
    {
      id: 'od-indices',
      label: 'Right eye (OD) · summary indices',
      valueLabel: 'MD and PSD available in report',
      referenceLabel: 'See device report',
    },
    {
      id: 'os-indices',
      label: 'Left eye (OS) · summary indices',
      valueLabel: 'MD and PSD available in report',
      referenceLabel: 'See device report',
    },
  ],
  interpretation:
    'No automated interpretation is displayed here. Review the supplied plot and report in the clinical workflow.',
  trendSummary: 'Prior baseline visual field from 12 Feb 2026 linked for clinician comparison.',
  attachments: [
    { id: 'od-plot', label: 'Open OD plot', kind: 'plot', assistiveDescription: 'Open right eye visual field plot' },
    { id: 'os-plot', label: 'Open OS plot', kind: 'plot', assistiveDescription: 'Open left eye visual field plot' },
    { id: 'full-report', label: 'Open full report', kind: 'report' },
  ],
};

function DiagnosticSummaryDemo() {
  const t = useEmrTheme();
  const [mode, setMode] = useState<'populated' | 'loading' | 'error'>('populated');
  const [lastIntent, setLastIntent] = useState<string>('none');

  const model: DiagnosticResultViewModel =
    mode === 'loading'
      ? { ...PERIMETRY_RESULT, loading: true }
      : mode === 'error'
        ? { ...PERIMETRY_RESULT, error: 'The device report is temporarily unavailable.' }
        : PERIMETRY_RESULT;

  const handleIntent = (intent: DiagnosticResultIntent) => {
    setLastIntent(JSON.stringify(intent));
    if (intent.type === 'retryRequested') setMode('populated');
  };

  return (
    <View style={{ gap: 10 }}>
      <EmrRow>
        <EmrOptionChip label="Populated" selected={mode === 'populated'} onPress={() => setMode('populated')} />
        <EmrOptionChip label="Loading" selected={mode === 'loading'} onPress={() => setMode('loading')} />
        <EmrOptionChip label="Error" selected={mode === 'error'} onPress={() => setMode('error')} />
      </EmrRow>
      <EmrDiagnosticResultSummary model={model} onIntent={handleIntent} />
      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
        {`Last intent: ${lastIntent}`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrSpectaclePrescription demo
// ---------------------------------------------------------------------------

const INITIAL_SPECTACLE_MODEL: SpectaclePrescriptionViewModel = {
  id: 'spectacle-prescription',
  label: 'Spectacle prescription',
  description: 'Enter the prescribed values for each eye. Values are retained as raw strings by the controller.',
  eyes: [
    { id: 'od', label: 'Right eye', shortLabel: 'OD' },
    { id: 'os', label: 'Left eye', shortLabel: 'OS' },
  ],
  fields: [
    { id: 'sphere', label: 'Sphere', type: 'decimal', unit: 'D' },
    { id: 'cylinder', label: 'Cylinder', type: 'decimal', unit: 'D' },
    { id: 'axis', label: 'Axis', type: 'integer', unit: '°' },
    { id: 'addition', label: 'Near addition', type: 'decimal', unit: 'D' },
    { id: 'prism', label: 'Prism', type: 'text', unit: 'Δ' },
    {
      id: 'base',
      label: 'Base',
      type: 'select',
      options: [
        { value: 'in', label: 'In' },
        { value: 'out', label: 'Out' },
        { value: 'up', label: 'Up' },
        { value: 'down', label: 'Down' },
      ],
    },
    { id: 'visual-acuity', label: 'Visual acuity', type: 'text' },
  ],
  values: {
    od: {
      sphere: '-1.25',
      cylinder: '-0.50',
      axis: '090',
      addition: '+1.50',
      prism: '',
      base: '',
      'visual-acuity': '6/6',
    },
    os: {
      sphere: '-0.75',
      cylinder: '-0.25',
      axis: '080',
      addition: '+1.50',
      prism: '',
      base: '',
      'visual-acuity': '6/9',
    },
  },
  vaChartType: 'snellen-6m',
  iopReadings: {
    od: {
      valueLabel: '14 mmHg',
      methodLabel: 'GAT (Goldmann)',
      timeLabel: '09:42',
      deltaLabel: 'Δ −4 mmHg vs last visit',
      pachymetryLabel: 'CCT 542 µm',
      flag: { label: 'Normal', tone: 'success' },
    },
    os: {
      valueLabel: '15 mmHg',
      methodLabel: 'GAT (Goldmann)',
      timeLabel: '09:42',
      deltaLabel: 'Δ −2 mmHg vs last visit',
      pachymetryLabel: 'CCT 545 µm',
      flag: { label: 'Normal', tone: 'success' },
    },
  },
  slitLampRows: [
    {
      id: 'lids-conj',
      label: 'Lids & Conjunctiva',
      normalPreset: 'Quiet, no injection, puncta patent',
      quickFindings: ['Quiet, no injection', 'MGD 1+', 'Papillae 1+', 'SCH temporal', 'Pterygium nasal'],
      odValue: 'Quiet, no injection, puncta patent',
      osValue: 'Quiet, no injection, puncta patent',
    },
    {
      id: 'cornea',
      label: 'Cornea',
      normalPreset: 'Clear, compact, no fluorescein stain',
      quickFindings: ['Clear, no stain', 'SPK inferior 1+', 'Arcus senilis', 'Endothelial guttata'],
      odValue: 'Clear, compact, no fluorescein stain',
      osValue: 'Clear, compact, no fluorescein stain',
    },
    {
      id: 'ac-iris',
      label: 'Anterior Chamber & Iris',
      normalPreset: 'Deep & quiet, VH4, round reactive pupil',
      quickFindings: ['Deep & quiet, VH4', 'Cells 1+, Flare trace', 'PXF on pupillary margin', 'PI patent'],
      odValue: 'Deep & quiet, VH4, round reactive pupil',
      osValue: 'Deep & quiet, VH4, round reactive pupil',
    },
    {
      id: 'lens',
      label: 'Lens / IOL',
      normalPreset: 'Clear crystalline lens',
      quickFindings: ['PCIOL well-centered in bag', 'NS 1+', 'NS 2+ Cortical 1+', 'PSC central', 'Clear lens'],
      odValue: 'PCIOL well-centered in bag',
      osValue: 'NS 2+ Cortical 1+',
      modifiedOs: true,
    },
    {
      id: 'fundus-disc',
      label: 'Optic Disc & Macula',
      normalPreset: 'CDR 0.3, healthy NRR, flat macula, foveal reflex +',
      quickFindings: ['CDR 0.3, flat macula', 'CDR 0.6, inferior notch', 'Hard drusen macula', 'Mild NPDR'],
      odValue: 'CDR 0.3, healthy NRR, flat macula, foveal reflex +',
      osValue: 'CDR 0.3, healthy NRR, flat macula, foveal reflex +',
    },
  ],
  notes: { od: '', os: 'Near addition supplied for both eyes.' },
};

const VA_EQUIV_TABLE: Record<string, Record<string, string>> = {
  '6/5': { 'snellen-6m': '6/5', 'snellen-20ft': '20/15', logmar: '-0.08', etdrs: '89L', decimal: '1.2' },
  '6/6': { 'snellen-6m': '6/6', 'snellen-20ft': '20/20', logmar: '0.00', etdrs: '85L', decimal: '1.0' },
  '6/9': { 'snellen-6m': '6/9', 'snellen-20ft': '20/30', logmar: '+0.18', etdrs: '76L', decimal: '0.67' },
  '6/12': { 'snellen-6m': '6/12', 'snellen-20ft': '20/40', logmar: '+0.30', etdrs: '70L', decimal: '0.50' },
  '6/18': { 'snellen-6m': '6/18', 'snellen-20ft': '20/60', logmar: '+0.48', etdrs: '61L', decimal: '0.33' },
  '6/24': { 'snellen-6m': '6/24', 'snellen-20ft': '20/80', logmar: '+0.60', etdrs: '55L', decimal: '0.25' },
  '6/36': { 'snellen-6m': '6/36', 'snellen-20ft': '20/120', logmar: '+0.78', etdrs: '46L', decimal: '0.17' },
  '6/60': { 'snellen-6m': '6/60', 'snellen-20ft': '20/200', logmar: '+1.00', etdrs: '35L', decimal: '0.10' },
};

function convertVaScale(val: string, targetScale: string): string {
  for (const row of Object.values(VA_EQUIV_TABLE)) {
    if (Object.values(row).includes(val.trim())) {
      return row[targetScale] ?? val;
    }
  }
  return val;
}

function SpectaclePrescriptionDemo() {
  const t = useEmrTheme();
  const [model, setModel] = useState<SpectaclePrescriptionViewModel>(INITIAL_SPECTACLE_MODEL);
  const [showErrors, setShowErrors] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [lastIntent, setLastIntent] = useState('none');

  const activeModel: SpectaclePrescriptionViewModel = {
    ...model,
    readOnly,
    errors: showErrors
      ? {
          'od.axis': 'Axis is required for the right eye.',
          'os.notes': 'Add a dispensing note or explicitly record that none was supplied.',
        }
      : undefined,
  };

  const handleIntent = (intent: SpectaclePrescriptionIntent) => {
    setLastIntent(JSON.stringify(intent));
    if (intent.type === 'cellEditRequested') {
      setModel(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [intent.eyeId]: {
            ...prev.values[intent.eyeId],
            [intent.fieldId]: intent.value,
          },
        },
      }));
    } else if (intent.type === 'cellStepped') {
      setModel(prev => {
        const curRaw = prev.values[intent.eyeId]?.[intent.fieldId] ?? '0';
        const curNum = Number(curRaw.replace('+', '')) || 0;
        let nextFormatted: string;
        if (intent.fieldId === 'axis') {
          const deg = Math.min(180, Math.max(0, Math.round(curNum + intent.delta)));
          nextFormatted = String(deg).padStart(3, '0');
        } else {
          const stepped = Math.round((curNum + intent.delta) * 100) / 100;
          nextFormatted = (stepped > 0 ? '+' : '') + stepped.toFixed(2);
        }
        return {
          ...prev,
          values: {
            ...prev.values,
            [intent.eyeId]: {
              ...prev.values[intent.eyeId],
              [intent.fieldId]: nextFormatted,
            },
          },
        };
      });
    } else if (intent.type === 'vaChartTypeChanged') {
      setModel(prev => ({
        ...prev,
        vaChartType: intent.chartType,
        values: {
          ...prev.values,
          od: {
            ...prev.values['od'],
            'visual-acuity': convertVaScale(prev.values['od']?.['visual-acuity'] ?? '6/6', intent.chartType),
          },
          os: {
            ...prev.values['os'],
            'visual-acuity': convertVaScale(prev.values['os']?.['visual-acuity'] ?? '6/9', intent.chartType),
          },
        },
      }));
    } else if (intent.type === 'copyEyeRequested') {
      setModel(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [intent.toEyeId]: { ...prev.values[intent.fromEyeId] },
        },
        notes: {
          ...prev.notes,
          [intent.toEyeId]: prev.notes?.[intent.fromEyeId] ?? '',
        },
      }));
    } else if (intent.type === 'slitLampChanged') {
      setModel(prev => ({
        ...prev,
        slitLampRows: prev.slitLampRows?.map(r =>
          r.id === intent.rowId
            ? intent.eyeId === 'od'
              ? { ...r, odValue: intent.value, modifiedOd: true }
              : { ...r, osValue: intent.value, modifiedOs: true }
            : r,
        ),
      }));
    } else if (intent.type === 'slitLampMacroNormalRequested') {
      setModel(prev => ({
        ...prev,
        slitLampRows: prev.slitLampRows?.map(r => {
          if (intent.rowId && r.id !== intent.rowId) return r;
          return {
            ...r,
            odValue: intent.scope === 'od' || intent.scope === 'ou' ? r.normalPreset : r.odValue,
            osValue: intent.scope === 'os' || intent.scope === 'ou' ? r.normalPreset : r.osValue,
          };
        }),
      }));
    } else if (intent.type === 'slitLampCopyEyeRequested') {
      setModel(prev => ({
        ...prev,
        slitLampRows: prev.slitLampRows?.map(r => {
          if (intent.rowId && r.id !== intent.rowId) return r;
          return intent.toEyeId === 'os'
            ? { ...r, osValue: r.odValue, modifiedOs: true }
            : { ...r, odValue: r.osValue, modifiedOd: true };
        }),
      }));
    } else if (intent.type === 'notesEditRequested') {
      setModel(prev => ({
        ...prev,
        notes: {
          ...prev.notes,
          [intent.eyeId]: intent.value,
        },
      }));
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <EmrRow>
        <EmrOptionChip label="Read-only" selected={readOnly} multiple onPress={() => setReadOnly(r => !r)} />
        <EmrOptionChip label="Show errors" selected={showErrors} multiple onPress={() => setShowErrors(e => !e)} />
      </EmrRow>
      <EmrSpectaclePrescription model={activeModel} onIntent={handleIntent} />
      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
        {`Last intent: ${lastIntent}`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrMeridianCross demo
// ---------------------------------------------------------------------------

const mer = (axisDeg: number, powerLabel: string, power: string): CrossMeridian => ({
  axisDeg,
  powerLabel,
  assistiveLabel: `Axis ${axisDeg} degrees, ${power}`,
});

const mcOd = (extra: Partial<MeridianCrossEye> = {}): MeridianCrossEye => ({
  eyeId: 'od',
  label: 'Right eye',
  shortLabel: 'OD',
  status: 'recorded',
  meridians: [mer(180, '-1.00 D', 'minus 1.00 dioptres'), mer(90, '-2.50 D', 'minus 2.50 dioptres')],
  ...extra,
});

const mcOs = (extra: Partial<MeridianCrossEye> = {}): MeridianCrossEye => ({
  eyeId: 'os',
  label: 'Left eye',
  shortLabel: 'OS',
  status: 'recorded',
  meridians: [mer(30, '+0.50 D', 'plus 0.50 dioptres'), mer(120, '+1.75 D', 'plus 1.75 dioptres')],
  ...extra,
});

function MeridianCrossDemo() {
  const t = useEmrTheme();
  const [preset, setPreset] = useState<'optical' | 'retinoscopy' | 'unassessed'>('optical');
  const [lastIntent, setLastIntent] = useState('none');

  const model: MeridianCrossViewModel =
    preset === 'retinoscopy'
      ? {
          id: 'mc-r',
          kind: 'retinoscopy',
          title: 'Retinoscopy',
          summaryText: 'Retinoscopy cross for both eyes with working distance and gross or net readings.',
          eyes: [
            mcOd({
              meridians: [mer(180, '+1.50 D', 'plus 1.50 dioptres'), mer(90, '+0.25 D', 'plus 0.25 dioptres')],
              captionLines: ['Working distance 66 cm', 'Gross readings'],
              flag: { label: 'Cycloplegic', tone: 'info' },
            }),
            mcOs({
              meridians: [mer(30, '+1.25 D', 'plus 1.25 dioptres'), mer(120, '+0.50 D', 'plus 0.50 dioptres')],
              captionLines: ['Working distance 66 cm', 'Gross readings'],
              flag: { label: 'Cycloplegic', tone: 'info' },
            }),
          ],
        }
      : preset === 'unassessed'
        ? {
            id: 'mc-u',
            kind: 'optical',
            title: 'Spectacle power cross',
            summaryText: 'Power cross with left eye unable to assess.',
            eyes: [
              mcOd(),
              mcOs({
                status: 'unable-to-assess',
                meridians: undefined,
                captionLines: ['Poor fixation'],
                flag: { label: 'Repeat visit', tone: 'warning' },
              }),
            ],
          }
        : {
            id: 'mc-1',
            kind: 'optical',
            title: 'Spectacle power cross',
            summaryText: 'Power cross for both eyes, drawn as the examiner sees them.',
            eyes: [mcOd(), mcOs()],
          };

  const handleIntent = (intent: MeridianCrossIntent) => {
    setLastIntent(JSON.stringify(intent));
  };

  return (
    <View style={{ gap: 10 }}>
      <EmrRow>
        <EmrOptionChip label="Optical cross" selected={preset === 'optical'} onPress={() => setPreset('optical')} />
        <EmrOptionChip label="Retinoscopy" selected={preset === 'retinoscopy'} onPress={() => setPreset('retinoscopy')} />
        <EmrOptionChip label="Unable to assess" selected={preset === 'unassessed'} onPress={() => setPreset('unassessed')} />
      </EmrRow>
      <EmrMeridianCross model={model} onIntent={handleIntent} />
      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
        {`Last intent: ${lastIntent}`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. EmrOcularMotilityChart demo
// ---------------------------------------------------------------------------

const POSITION_LABELS: Record<GazePosition, string> = {
  'up-right': 'Up and right',
  up: 'Up',
  'up-left': 'Up and left',
  right: 'Right',
  primary: 'Primary',
  left: 'Left',
  'down-right': 'Down and right',
  down: 'Down',
  'down-left': 'Down and left',
};

const recCell = (valueLabel: string, extra: Partial<MotilityCell> = {}): MotilityCell => ({
  valueLabel,
  status: 'recorded',
  ...extra,
});

const fullCells = (): Record<GazePosition, MotilityCell> => ({
  'up-right': recCell('Full'),
  up: recCell('Full'),
  'up-left': recCell('Full'),
  right: recCell('Full'),
  primary: recCell('Full'),
  left: recCell('Full'),
  'down-right': recCell('Full'),
  down: recCell('Full'),
  'down-left': recCell('Full'),
});

const INITIAL_MOTILITY_EYES: MotilityEye[] = [
  {
    eyeId: 'od',
    label: 'Right eye',
    shortLabel: 'OD',
    cells: {
      ...fullCells(),
      left: recCell('-2', {
        badge: { label: 'Underaction', tone: 'warning' },
        note: 'Abduction deficit',
      }),
      'up-left': recCell('-1', { badge: { label: 'Underaction', tone: 'warning' } }),
      'down-left': recCell('-1', { badge: { label: 'Underaction', tone: 'warning' } }),
    },
  },
  {
    eyeId: 'os',
    label: 'Left eye',
    shortLabel: 'OS',
    cells: fullCells(),
  },
];

function OcularMotilityDemo() {
  const t = useEmrTheme();
  const [layout, setLayout] = useState<'per-eye' | 'binocular'>('per-eye');
  const [selected, setSelected] = useState<{ eyeId: string; position: GazePosition }>({
    eyeId: 'od',
    position: 'left',
  });
  const [lastIntent, setLastIntent] = useState('none');

  const model: OcularMotilityViewModel = {
    id: 'mt-1',
    title: layout === 'binocular' ? 'Versions (binocular)' : 'Ocular motility',
    layout,
    eyes:
      layout === 'binocular'
        ? [
            {
              eyeId: 'ou',
              label: 'Both eyes',
              shortLabel: 'OU',
              cells: { ...fullCells(), primary: recCell('Orthophoric') },
            },
          ]
        : INITIAL_MOTILITY_EYES,
    positionLabels: POSITION_LABELS,
    selected,
    summaryText: 'Nine-position motility chart.',
  };

  const handleIntent = (intent: OcularMotilityIntent) => {
    setLastIntent(JSON.stringify(intent));
    if (intent.type === 'cellSelected') {
      setSelected({ eyeId: intent.eyeId, position: intent.position });
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <EmrRow>
        <EmrOptionChip label="Per-eye (OD / OS)" selected={layout === 'per-eye'} onPress={() => setLayout('per-eye')} />
        <EmrOptionChip label="Binocular (OU)" selected={layout === 'binocular'} onPress={() => setLayout('binocular')} />
      </EmrRow>
      <EmrOcularMotilityChart model={model} onIntent={handleIntent} />
      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
        {`Last intent: ${lastIntent}`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 5. EmrOctFindingRecord demo
// ---------------------------------------------------------------------------

const syntheticThumb = (seed: number): string => {
  const bands = Array.from(
    { length: 9 },
    (_, i) =>
      `<path d="M0 ${34 + i * 9 + (seed % 3) * 2} Q60 ${28 + i * 9 + seed * 2} 120 ${34 + i * 9}" stroke="#${i % 2 ? '8a8a8a' : 'b0b0b0'}" stroke-width="3" fill="none"/>`,
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90"><rect width="120" height="90" fill="#555"/>${bands}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const makeFrame = (
  eye: string,
  n: number,
  label: string,
  kind: OctFrameRef['kind'],
  withThumb = true,
): OctFrameRef => ({
  frameId: `${eye}-f${n}`,
  seriesId: `${eye}-s1`,
  label,
  kind,
  altText: `Synthetic placeholder for ${label.toLowerCase()}`,
  ...(withThumb ? { thumbnailUrl: syntheticThumb(n) } : {}),
  width: 512,
  height: 496,
});

const okBadge: EmrBadge = { label: 'Within reference range', tone: 'success' };
const highBadge: EmrBadge = { label: 'Above reference range', tone: 'warning' };

const makeMetric = (
  id: string,
  label: string,
  valueLabel: string,
  referenceLabel: string,
  status: EmrBadge = okBadge,
): DiagnosticMetric => ({ id, label, valueLabel, referenceLabel, status });

const makeFinding = (
  eye: string,
  i: number,
  label: string,
  locationLabel: string | undefined,
  extra: Partial<OctFinding> = {},
): OctFinding => ({
  id: `${eye}-fd${i}`,
  path: ['octRecord', 'eyes', eye, 'findings', i],
  label,
  locationLabel,
  status: 'recorded',
  ...extra,
});

const INITIAL_OCT_EYES: OctEyeRecord[] = [
  {
    eyeId: 'od',
    label: 'Right eye',
    shortLabel: 'OD',
    status: 'recorded',
    metadata: [
      { label: 'Device', value: 'Synthetic SD-OCT' },
      { label: 'Protocol', value: 'Macular cube 512 x 128' },
      { label: 'Scan date', value: '12 Mar 2026' },
      { label: 'Signal quality', value: 'Good (8/10)' },
    ],
    frames: [
      makeFrame('od', 1, 'Horizontal B-scan through fovea', 'b-scan'),
      makeFrame('od', 2, 'Vertical B-scan through fovea', 'b-scan'),
      makeFrame('od', 3, 'Retinal thickness map', 'thickness-map'),
    ],
    selectedFrameId: 'od-f1',
    metrics: [makeMetric('cst', 'Central subfield thickness (CST)', '268 µm', '220–300 µm')],
    findings: [
      makeFinding('od', 0, 'Drusen', 'Parafoveal', {
        badge: { label: 'Small, hard', tone: 'neutral' },
        frameId: 'od-f2',
      }),
      makeFinding('od', 1, 'Epiretinal membrane (ERM)', 'Superotemporal arcade', {
        badge: { label: 'Present', tone: 'info' },
        note: 'No traction on the foveal contour noted by the reader.',
        code: { system: 'SNOMED CT', code: '367510001', display: 'Epiretinal membrane' },
      }),
    ],
    interpretation:
      'Normal foveal contour. Small parafoveal drusen. Mild epiretinal membrane along the superotemporal arcade.',
  },
  {
    eyeId: 'os',
    label: 'Left eye',
    shortLabel: 'OS',
    status: 'recorded',
    metadata: [
      { label: 'Device', value: 'Synthetic SD-OCT' },
      { label: 'Protocol', value: 'Macular cube 512 x 128' },
      { label: 'Scan date', value: '12 Mar 2026' },
      { label: 'Signal quality', value: 'Fair (6/10)' },
    ],
    frames: [
      makeFrame('os', 1, 'Horizontal B-scan through fovea', 'b-scan'),
      makeFrame('os', 2, 'Vertical B-scan through fovea', 'b-scan'),
      makeFrame('os', 3, 'Retinal thickness map', 'thickness-map'),
    ],
    selectedFrameId: 'os-f1',
    metrics: [makeMetric('cst', 'Central subfield thickness (CST)', '341 µm', '220–300 µm', highBadge)],
    findings: [
      makeFinding('os', 0, 'Subretinal fluid', 'Subfoveal', {
        badge: { label: 'Present', tone: 'warning' },
        frameId: 'os-f1',
        note: 'Shallow neurosensory detachment under the fovea.',
      }),
      makeFinding('os', 1, 'Intraretinal cysts', 'Parafoveal', {
        badge: { label: 'Present', tone: 'warning' },
        frameId: 'os-f1',
      }),
      makeFinding('os', 2, 'Drusen', 'Subfoveal', {
        status: 'unable-to-assess',
        note: 'Signal too weak under the fluid to comment.',
      }),
    ],
    interpretation:
      'Subfoveal subretinal fluid with parafoveal intraretinal cysts. Epiretinal membrane present superotemporally.',
  },
];

function OctFindingRecordDemo() {
  const t = useEmrTheme();
  const [eyes, setEyes] = useState<OctEyeRecord[]>(INITIAL_OCT_EYES);
  const [showMessages, setShowMessages] = useState(true);
  const [lastIntent, setLastIntent] = useState('none');

  const model: OctFindingRecordViewModel = {
    id: 'oct-1',
    title: 'OCT macula',
    eyes,
    messages: showMessages
      ? [
          {
            path: ['octRecord', 'eyes', 'os', 'findings', 2],
            severity: 'warning',
            message: 'Left eye drusen finding has status "Unable to assess" and no coded value.',
          },
          {
            path: ['octRecord'],
            severity: 'info',
            message: 'Signal quality is below the department target for the left eye.',
          },
        ]
      : [],
  };

  const handleIntent = (intent: OctFindingRecordIntent) => {
    setLastIntent(JSON.stringify(intent));
    if (intent.type === 'frameSelected') {
      setEyes(prev =>
        prev.map(e => (e.eyeId === intent.eyeId ? { ...e, selectedFrameId: intent.frameId } : e)),
      );
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <EmrRow>
        <EmrOptionChip
          label="Validation messages"
          selected={showMessages}
          multiple
          onPress={() => setShowMessages(v => !v)}
        />
      </EmrRow>
      <EmrOctFindingRecord model={model} onIntent={handleIntent} />
      <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
        {`Last intent: ${lastIntent}`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Export gallery sections
// ---------------------------------------------------------------------------

export const gallery: GallerySection[] = [
  {
    id: 'l4-diagnostic-result-summary',
    title: 'EmrDiagnosticResultSummary',
    render: DiagnosticSummaryDemo,
  },
  {
    id: 'l4-spectacle-prescription',
    title: 'EmrSpectaclePrescription',
    render: SpectaclePrescriptionDemo,
  },
  {
    id: 'l4-meridian-cross',
    title: 'EmrMeridianCross',
    render: MeridianCrossDemo,
  },
  {
    id: 'l4-ocular-motility-chart',
    title: 'EmrOcularMotilityChart',
    render: OcularMotilityDemo,
  },
  {
    id: 'l4-oct-finding-record',
    title: 'EmrOctFindingRecord',
    render: OctFindingRecordDemo,
  },
];
