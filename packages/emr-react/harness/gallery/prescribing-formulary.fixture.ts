import type { PrescribingFormularyItem, PrescribingRow, PrescribingTableViewModel, SearchRepository } from '@drguptavivek/emr-controller';

export const FORMULARY_ITEMS: readonly PrescribingFormularyItem[] = [
  { code: 'RXN-309114', drugName: 'Moxifloxacin', strength: '0.5% w/v', form: 'drop', formLabel: 'Ophthalmic Drops', route: 'eye', site: 'OD', doseAmount: 1, doseStep: 1, unitLabel: 'drop', allowedUnits: ['drop', 'mL', ''], specialtyTag: 'Ophthalmology', stockStatus: 'In Stock', defaultPresetId: 'qid', defaultDurationCount: 7, defaultDurationUnit: 'days', defaultFoodRelation: '5 min gap', defaultInstructions: 'Instil 1 drop cleanly; wait 5 min before other drops.' },
  { code: 'RXN-860975', drugName: 'Prednisolone acetate', strength: '1% w/v', form: 'drop', formLabel: 'Ophthalmic Drops', route: 'eye', site: 'OD', doseAmount: 1, doseStep: 1, unitLabel: 'drop', allowedUnits: ['drop', 'mL', ''], specialtyTag: 'Ophthalmology', stockStatus: 'In Stock', defaultPresetId: 'qid', defaultDurationCount: 7, defaultDurationUnit: 'days', defaultFoodRelation: 'Shake well', defaultInstructions: 'Shake well before use. Use ↘ Step-Dn for weekly taper.' },
  { code: 'RXN-313782', drugName: 'Amoxicillin Suspension', strength: '250 mg/5 mL', form: 'liquid', formLabel: 'Paediatric Suspension', route: 'oral', doseAmount: 7.5, doseStep: 2.5, unitLabel: 'mL', allowedUnits: ['mL', 'tsp', 'mg/kg', 'mg'], specialtyTag: 'Pediatrics', dosingBasisLabel: '15 mg/kg · 12 kg = 180 mg', stockStatus: 'In Stock', defaultPresetId: 'tds', defaultDurationCount: 5, defaultDurationUnit: 'days', defaultFoodRelation: 'Use oral syringe', defaultInstructions: 'Measure 7.5 mL accurately with oral syringe.' },
  { code: 'RXN-197985', drugName: 'Mometasone Furoate', strength: '0.1% w/w', form: 'ointment', formLabel: 'Topical Cream/Oint', route: 'topical', site: 'Lesions', doseAmount: 1.5, doseStep: 0.5, unitLabel: 'FTU', allowedUnits: ['FTU', 'app', 'ribbon', 'g'], specialtyTag: 'Dermatology', dosingBasisLabel: '1.5 FTU ≈ 0.75 g', stockStatus: 'In Stock', defaultPresetId: 'od', defaultDurationCount: 14, defaultDurationUnit: 'days', defaultFoodRelation: 'Thin layer only', defaultInstructions: 'Apply thin layer to affected plaques once daily.' },
  { code: 'RXN-402243', drugName: 'Ciprofloxacin + Dexamethasone', strength: '0.3%/0.1%', form: 'drop', formLabel: 'Otic Ear Drops', route: 'ear', site: 'AD', doseAmount: 4, doseStep: 1, unitLabel: 'drop', allowedUnits: ['drop', 'mL'], specialtyTag: 'ENT', stockStatus: 'In Stock', defaultPresetId: 'bd', defaultDurationCount: 7, defaultDurationUnit: 'days', defaultFoodRelation: 'Tilt head 2 min', defaultInstructions: 'Warm bottle in hand; keep ear dry during bath.' },
  { code: 'RXN-194000', drugName: 'Capecitabine', strength: '500 mg', form: 'tablet', formLabel: 'Oral Tablet', route: 'oral', doseAmount: 3, doseStep: 0.5, unitLabel: 'tab', allowedUnits: ['', 'tab', 'mg'], specialtyTag: 'Oncology', dosingBasisLabel: '1000 mg/m² · BSA 1.5m²', stockStatus: 'In Stock', defaultPresetId: 'bd', defaultDurationCount: 14, defaultDurationUnit: 'days', defaultFoodRelation: 'After food', defaultInstructions: 'Cycle Days 1–14, then 7 days rest. Swallow whole.' },
  { code: 'RXN-311474', drugName: 'Mannitol 20%', strength: '20 g/100 mL', form: 'injection', formLabel: 'IV Infusion', route: 'iv-inf', doseAmount: 100, doseStep: 25, unitLabel: 'mL', allowedUnits: ['mL', 'g', 'mg/kg'], specialtyTag: 'Neurosurgery', dosingBasisLabel: '0.5 g/kg IV osmotherapy', stockStatus: 'In Stock (Ward)', defaultPresetId: 'tds', defaultDurationCount: 3, defaultDurationUnit: 'days', defaultFoodRelation: 'Infuse over 20m (Mannitol)', defaultInstructions: 'Hold if serum Na > 155 mmol/L or osmolality > 320.' },
  { code: 'RXN-310431', drugName: 'Gabapentin', strength: '100 mg', form: 'capsule', formLabel: 'Oral Capsule', route: 'oral', doseAmount: 1, doseStep: 1, unitLabel: 'cap', allowedUnits: ['', 'cap', 'mg'], specialtyTag: 'Neurology', stockStatus: 'In Stock', defaultPresetId: 'hs', defaultDurationCount: 3, defaultDurationUnit: 'days', defaultFoodRelation: 'At bedtime', defaultInstructions: 'Click ↗ Step-Up to titrate HS → BD → TDS.' },
  { code: 'RXN-745679', drugName: 'Salbutamol MDI', strength: '100 mcg/puff', form: 'inhaler', formLabel: 'MDI Inhaler', route: 'inhalation', doseAmount: 2, doseStep: 1, unitLabel: 'puff', allowedUnits: ['puff', 'spray', 'respule'], specialtyTag: 'Gen Med', stockStatus: 'In Stock', defaultPresetId: 'sos', defaultDurationCount: 30, defaultDurationUnit: 'days', defaultFoodRelation: 'Use spacer', defaultInstructions: '2 puffs SOS for wheeze/breathlessness.' },
  { code: 'RXN-198440', drugName: 'Paracetamol', strength: '500 mg', form: 'tablet', formLabel: 'Oral Tablet (Scored)', route: 'oral', doseAmount: 1, doseStep: 0.5, unitLabel: 'tab', allowedUnits: ['', 'tab', 'mg'], specialtyTag: 'Gen Med', stockStatus: 'In Stock', defaultPresetId: 'bd', defaultDurationCount: 5, defaultDurationUnit: 'days', defaultFoodRelation: 'After food', defaultInstructions: 'Take after meals for pain or fever.' },
];

export const syntheticFormularyRepository: SearchRepository<PrescribingFormularyItem> = {
  async search({ query, page, pageSize, signal }) {
    signal.throwIfAborted();
    const needle = query.trim().toLowerCase();
    const matches = FORMULARY_ITEMS.filter(item =>
      [item.drugName, item.code, item.formLabel, item.specialtyTag ?? '']
        .some(value => value.toLowerCase().includes(needle)),
    );
    const size = Math.max(1, Math.min(20, pageSize));
    const start = (Math.max(1, page) - 1) * size;
    return { items: matches.slice(start, start + size), total: matches.length };
  },
};

export function clearFixturePrescriptionProduct(row: PrescribingRow, drugName: string): PrescribingRow {
  return {
    ...row, drugName, formularyCode: undefined, strength: '', form: 'other', formLabel: '', route: '',
    allowedRoutes: undefined, site: undefined, specialtyTag: undefined, dosingBasisLabel: undefined,
    stockStatus: undefined, doseAmount: null, doseStep: undefined, unitLabel: '', allowedUnits: undefined,
    slots: row.slots.map(slot => ({ ...slot, amount: null, amountLabel: undefined, householdLabel: undefined })),
    frequencyCode: undefined, patternLabel: undefined, durationCount: null, dispenseQuantity: undefined,
    foodRelation: '', instructions: '', taperExpanded: false, taperSteps: undefined, error: undefined,
  };
}

export function resolveFixturePrescriptionProduct(
  row: PrescribingRow,
  item: PrescribingFormularyItem,
  model: Pick<PrescribingTableViewModel, 'slotDefinitions' | 'presets'>,
): PrescribingRow {
  const preset = model.presets?.find(option => option.id === item.defaultPresetId);
  return {
    ...clearFixturePrescriptionProduct(row, item.drugName),
    formularyCode: item.code, strength: item.strength, form: item.form, formLabel: item.formLabel,
    route: item.route, allowedRoutes: item.allowedRoutes, site: item.site, doseAmount: item.doseAmount ?? null,
    doseStep: item.doseStep, unitLabel: item.unitLabel, allowedUnits: item.allowedUnits,
    specialtyTag: item.specialtyTag, dosingBasisLabel: item.dosingBasisLabel, stockStatus: item.stockStatus,
    frequencyCode: preset?.label,
    slots: model.slotDefinitions.map(slot => ({
      id: slot.id, label: slot.label, timeHint: slot.timeHint,
      amount: preset ? preset.slotIds.includes(slot.id) ? item.doseAmount ?? null : 0 : null,
    })),
    durationCount: item.defaultDurationCount ?? null, durationUnit: item.defaultDurationUnit ?? 'days',
    foodRelation: item.defaultFoodRelation ?? '', instructions: item.defaultInstructions ?? '',
  };
}

export const PRESCRIBING_PRESETS = [
  { id: 'od', label: 'OD', slotIds: ['m'] },
  { id: 'bd', label: 'BD', slotIds: ['m', 'n'] },
  { id: 'tds', label: 'TDS', slotIds: ['m', 'a', 'n'] },
  { id: 'qid', label: 'QID', slotIds: ['m', 'a', 'e', 'n'] },
  { id: 'hs', label: 'HS', slotIds: ['n'] },
  { id: 'sos', label: 'SOS', slotIds: [] },
] as const;
