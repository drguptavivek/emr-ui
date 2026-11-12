import type { SpecialtyExamMatrixIntent, SpecialtyExamMatrixViewModel } from '@drguptavivek/emr-controller';

const FUNDUS_EXAM_ROWS: SpecialtyExamMatrixViewModel['ophthalmicRows'] = [
  {
    id: 'vitreous',
    segment: 'Posterior Segment',
    structureLabel: 'Vitreous',
    odValue: '',
    osValue: '',
    normalDefault: 'Within normal limits',
    quickChips: [],
  },
  {
    id: 'optic-disc',
    segment: 'Posterior Segment',
    structureLabel: 'Optic disc',
    odValue: '',
    osValue: '',
    normalDefault: 'Within normal limits',
    quickChips: [],
  },
  {
    id: 'macula',
    segment: 'Posterior Segment',
    structureLabel: 'Macula & fovea',
    odValue: 'Dull foveal reflex, cystoid macular oedema (CST 418 µm)',
    osValue: 'Healthy foveal reflex, CST 258 µm',
    normalDefault: 'Healthy foveal reflex, flat macula',
    quickChips: ['Healthy foveal reflex', 'Cystoid oedema (CMO)', 'Hard exudates', 'Microaneurysms'],
  },
  {
    id: 'retinal-vessels',
    segment: 'Posterior Segment',
    structureLabel: 'Retinal vessels',
    odValue: '',
    osValue: '',
    normalDefault: 'Within normal limits',
    quickChips: [],
  },
  {
    id: 'peripheral-retina',
    segment: 'Posterior Segment',
    structureLabel: 'Peripheral retina',
    odValue: '',
    osValue: '',
    normalDefault: 'Within normal limits',
    quickChips: [],
  },
];


export function makeSpecialtyExamFixture(): SpecialtyExamMatrixViewModel {
  return {
    title: 'Specialty exam · Synthetic example',
    activeSpecialty: 'ophthalmology',
    ophthalmicRows: [
      {
        id: 'cornea',
        segment: 'Anterior Segment',
        structureLabel: 'Cornea & Wound',
        odValue: 'Clear, temporal phaco port well-apposed, Seidel neg',
        osValue: 'Clear, compact stroma, no KP',
        normalDefault: 'Clear, lustrous, Fluorescein negative',
        quickChips: ['Clear', 'Descemet folds +', 'SPK +', 'Seidel neg'],
      },
      {
        id: 'ac',
        segment: 'Anterior Segment',
        structureLabel: 'Anterior Chamber',
        odValue: 'Deep, 0 cells, 0 flare (SUN Grade 0)',
        osValue: 'Deep & quiet (VH Grade 4)',
        normalDefault: 'Deep and quiet (0 cells, 0 flare)',
        quickChips: ['Deep & quiet', 'Cells 1+', 'Flare 1+', 'Shallow VH2'],
      },
      {
        id: 'lens',
        segment: 'Anterior Segment',
        structureLabel: 'Lens / PCIOL',
        odValue: 'Toric PCIOL well-centered in capsular bag',
        osValue: 'Nuclear Sclerosis Grade II (NS2)',
        normalDefault: 'Clear crystalline lens',
        quickChips: ['PCIOL in bag', 'Clear lens', 'NS2 Cataract', 'PCO +'],
      },
      {
        id: 'iop-gonio',
        segment: 'Tonometry & Gonioscopy',
        structureLabel: 'IOP (GAT) & Angle',
        odValue: '22 mmHg (Steroid responder) · Shaffer Grade IV open',
        osValue: '15 mmHg · Shaffer Grade IV open',
        normalDefault: '15 mmHg · Shaffer Grade IV open 360°',
        quickChips: ['14 mmHg', '22 mmHg (High)', 'Shaffer IV open', 'PAS +'],
      },
      ...FUNDUS_EXAM_ROWS,
    ],
    pediatrics: {
      weightKg: 12,
      heightCm: 88,
      bsaM2: '0.54',
      weightCentileLabel: '50th WHO Centile',
      heightCentileLabel: '55th WHO Centile',
      targetDrugLabel: 'Amoxicillin Oral Suspension',
      mgPerKgPerDose: 15,
      concentrationMgPer5Ml: 250,
      calculatedMgPerDose: 180,
      calculatedMlPerDose: 3.6,
      maxDailyMgLabel: 'Fixture ceiling: 90 mg/kg/day',
    },
    dermatology: {
      morphologyLabel: 'Erythematous scaly plaques over extensor surfaces & trunk',
      regions: [
        { id: 'face', regionLabel: 'Face & Neck', bsaPercent: 2.5, ftuPerDose: 2.5, active: false },
        { id: 'trunk', regionLabel: 'Anterior Trunk', bsaPercent: 6, ftuPerDose: 3.5, active: true },
        { id: 'arms', regionLabel: 'Bilateral Upper Limbs', bsaPercent: 4, ftuPerDose: 3, active: true },
        { id: 'legs', regionLabel: 'Bilateral Lower Limbs', bsaPercent: 8, ftuPerDose: 4, active: false },
      ],
      totalBsaPercent: 10,
      totalFtuPerApp: 6.5,
      totalGramsPerApp: 3.25,
      totalGramsFor14DaysBd: 91,
    },
    oncology: {
      regimenName: 'CAPOX (Capecitabine + Oxaliplatin)',
      cycleNumber: 3,
      cycleDayLabel: 'Days 1–14 (21-Day Cycle)',
      ecogScore: 1,
      bsaM2: 1.76,
      ancCountLabel: '2,450 /µL (≥ 1,500)',
      plateletCountLabel: '168,000 /µL (≥ 100,000)',
      safetyGatePassed: true,
      safetyGateBadge: { label: 'Fixture haematology reviewed', tone: 'info' },
      doseReductionPercent: 100,
      agents: [
        { id: 'ag-1', drugName: 'Capecitabine (Oral Tablet 500 mg)', standardMgPerM2: 1000, calculatedDoseMg: 1750, routeLabel: 'Oral BD Days 1–14' },
        { id: 'ag-2', drugName: 'Oxaliplatin (IV Infusion)', standardMgPerM2: 130, calculatedDoseMg: 228, routeLabel: 'IV over 2h Day 1' },
      ],
    },
  };
}

/** State transitions for the synthetic showcase. Real dosing and safety assessments come from the host. */
export function reduceSpecialtyExamFixture(
  model: SpecialtyExamMatrixViewModel,
  intent: SpecialtyExamMatrixIntent,
): SpecialtyExamMatrixViewModel {
  if (intent.type === 'specialtyChanged') return { ...model, activeSpecialty: intent.specialty };
  if (model.readOnly) return model;

  switch (intent.type) {
    case 'ophthalmicCellChanged': {
      if (model.activeSpecialty !== 'ophthalmology') return model;
      const key = intent.eye === 'od' ? 'odValue' : 'osValue';
      return { ...model, ophthalmicRows: model.ophthalmicRows.map(row =>
        row.id === intent.rowId ? { ...row, [key]: intent.value } : row
      ) };
    }
    case 'ophthalmicApplyWnlAll':
      if (model.activeSpecialty !== 'ophthalmology') return model;
      return { ...model, ophthalmicRows: model.ophthalmicRows.map(row =>
        ({ ...row, odValue: row.normalDefault, osValue: row.normalDefault })
      ) };
    case 'ophthalmicCopyOdToOs':
      if (model.activeSpecialty !== 'ophthalmology') return model;
      return { ...model, ophthalmicRows: model.ophthalmicRows.map(row =>
        !intent.rowId || row.id === intent.rowId ? { ...row, osValue: row.odValue } : row
      ) };
    case 'pediatricWeightChanged': {
      if (model.activeSpecialty !== 'pediatrics' || !Number.isFinite(intent.weightKg) || intent.weightKg <= 0) return model;
      const p = model.pediatrics;
      const mg = Math.round(intent.weightKg * p.mgPerKgPerDose);
      const ml = Math.round((mg / p.concentrationMgPer5Ml) * 50) / 10;
      return { ...model, pediatrics: {
        ...p, weightKg: intent.weightKg, calculatedMgPerDose: mg, calculatedMlPerDose: ml,
        weightCentileLabel: 'centile unavailable for edited fixture', bsaM2: '',
      } };
    }
    case 'dermRegionToggled': {
      if (model.activeSpecialty !== 'dermatology') return model;
      const regions = model.dermatology.regions.map(region =>
        region.id === intent.regionId ? { ...region, active: !region.active } : region
      );
      const active = regions.filter(region => region.active);
      const totalBsaPercent = active.reduce((sum, region) => sum + region.bsaPercent, 0);
      const totalFtuPerApp = active.reduce((sum, region) => sum + region.ftuPerDose, 0);
      const totalGramsPerApp = totalFtuPerApp * 0.5;
      return { ...model, dermatology: {
        ...model.dermatology, regions, totalBsaPercent, totalFtuPerApp, totalGramsPerApp,
        totalGramsFor14DaysBd: Math.round(totalGramsPerApp * 28),
      } };
    }
    case 'oncologyDoseReductionChanged': {
      if (model.activeSpecialty !== 'oncology') return model;
      const oncology = model.oncology;
      return { ...model, oncology: {
        ...oncology, doseReductionPercent: intent.percent,
        agents: oncology.agents.map(agent => ({
          ...agent, calculatedDoseMg: Math.round(agent.standardMgPerM2 * oncology.bsaM2 * (intent.percent / 100)),
        })),
      } };
    }
    default:
      return model;
  }
}
