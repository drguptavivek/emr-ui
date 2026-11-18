import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import {
  calculateFixedScheduleDispenseQuantity,
  type PrescribingFormularyItem,
  type PrescribingRow,
  type PrescribingTableIntent,
  type PrescribingTableViewModel,
} from '@drguptavivek/emr-controller';

const componentPath = join(
  process.cwd(),
  'packages/emr-ui/src/lib/domain/emr-prescribing-table.component.ts',
);
const componentSource = readFileSync(componentPath, 'utf8');

/**
 * Loads the component module in Node by stripping the `@Component(...)` decorator
 * (which requires ng-packagr's Angular compiler) and evaluating the TypeScript class
 * and exported pure helpers against mock Angular signal primitives.
 */
function loadPrescribingTableModule() {
  const withoutDecorators = componentSource.replace(
    /@Component\(\{[\s\S]*?\}\)\s*(?=export class EmrPrescribingTableComponent)/,
    '',
  );
  const transpiled = ts.transpileModule(withoutDecorators, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const makeSignal = <T>(initial: T) => {
    let val = initial;
    const sig = () => val;
    sig.set = (next: T) => {
      val = next;
    };
    sig.update = (fn: (prev: T) => T) => {
      val = fn(val);
    };
    return sig;
  };

  const mockRequire = (id: string) => {
    if (id === '@angular/core') {
      return {
        ChangeDetectionStrategy: { OnPush: 0 },
        Component: () => (cls: unknown) => cls,
        input: Object.assign(
          <T>(init?: T) => makeSignal<T | undefined>(init),
          { required: <T>() => makeSignal<T | undefined>(undefined) },
        ),
        output: <T>() => {
          const listeners: ((v: T) => void)[] = [];
          return {
            emit: (v: T) => listeners.forEach((l) => l(v)),
            subscribe: (l: (v: T) => void) => listeners.push(l),
          };
        },
        signal: makeSignal,
      };
    }
    if (id === '@drguptavivek/emr-controller') {
      return { calculateFixedScheduleDispenseQuantity };
    }
    return {};
  };

  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const runner = new Function('exports', 'require', 'module', transpiled);
  runner(exportsObj, mockRequire, moduleObj);
  return moduleObj.exports as {
    EmrPrescribingTableComponent: new () => Record<string, any>;
    getFormClinicalProfile: (form: string) => any;
    formatPrescribingDoseAmount: (n: number | null | undefined) => string;
    resolveRowDispenseQuantity: (row: PrescribingRow, allRows?: readonly PrescribingRow[]) => any;
    calculateDispenseQuantity: (row: PrescribingRow) => any;
    EYE_SITES: readonly { value: string; label: string }[];
    EAR_SITES: readonly { value: string; label: string }[];
    NASAL_SITES: readonly { value: string; label: string }[];
    DERM_SITES: readonly { value: string; label: string }[];
    INJ_SITES: readonly { value: string; label: string }[];
    DEFAULT_PRESCRIBING_FORMS: readonly { value: string; label: string }[];
    DEFAULT_PRESCRIBING_DURATION_UNITS: readonly string[];
    DEFAULT_PRESCRIBING_PRESETS: readonly { id: string; label: string; slotIds: readonly string[] }[];
  };
}

const mod = loadPrescribingTableModule();

const SLOTS = [
  { id: 'm', label: 'Morning', shortLabel: 'Morn', timeHint: '08:00' },
  { id: 'a', label: 'Afternoon', shortLabel: 'Noon', timeHint: '13:00' },
  { id: 'e', label: 'Evening', shortLabel: 'Eve', timeHint: '18:00' },
  { id: 'n', label: 'Night', shortLabel: 'Night', timeHint: '22:00' },
] as const;

function makeRow(overrides: Partial<PrescribingRow> = {}): PrescribingRow {
  return {
    id: 'row-1',
    drugName: 'Prednisolone Acetate',
    strength: '1% w/v',
    form: 'drop',
    formLabel: 'Ophthalmic Drops',
    route: 'eye',
    site: 'OU',
    doseAmount: 1,
    slots: [
      { id: 'm', label: 'Morning', amount: 1 },
      { id: 'a', label: 'Afternoon', amount: 1 },
      { id: 'e', label: 'Evening', amount: 1 },
      { id: 'n', label: 'Night', amount: 1 },
    ],
    unitLabel: 'drop',
    frequencyCode: 'QID',
    patternLabel: '1 - 1 - 1 - 1',
    durationCount: 7,
    durationUnit: 'days',
    foodRelation: '5 min gap',
    instructions: 'Shake well before instilling',
    ...overrides,
  };
}

function makeModel(overrides: Partial<PrescribingTableViewModel> = {}): PrescribingTableViewModel {
  return {
    title: 'Ophthalmic Rx Composer',
    rows: [makeRow()],
    slotDefinitions: SLOTS,
    quickSigExamples: [
      { command: 'moxi 1qid ou 7d', label: 'Moxifloxacin QID OU 7d' },
      { command: 'pred 1qid ou taper', label: 'Prednisolone 4wk Taper' },
    ],
    safetyAlerts: [
      {
        id: 'steroid-iop',
        tone: 'warning',
        badgeLabel: 'Steroid IOP Advisory',
        message: 'Topical corticosteroid > 14 days — baseline & 2-week IOP tonometry check advised.',
      },
      {
        id: 'ddi-severe',
        tone: 'danger',
        badgeLabel: 'DDI Alert',
        message: 'Duplicate topical carbonic anhydrase inhibitor.',
      },
    ],
    canSign: true,
    ...overrides,
  };
}

function createHarness(initialModel: PrescribingTableViewModel) {
  const instance = new mod.EmrPrescribingTableComponent();
  instance.model.set(initialModel);
  const emitted: PrescribingTableIntent[] = [];
  instance.intent.subscribe((intent: PrescribingTableIntent) => emitted.push(intent));
  return {
    instance,
    emitted,
    setModel: (next: PrescribingTableViewModel) => instance.model.set(next),
  };
}

describe('EmrPrescribingTableComponent (emr-yr5.1)', () => {
  describe('component template and contract boundaries', () => {
    it('preserves selector, inputs, output, and controlled architecture', () => {
      expect(componentSource).toMatch(/selector:\s*'emr-prescribing-table'/);
      expect(componentSource).toMatch(/readonly\s+model\s*=\s*input\.required<PrescribingTableViewModel>\(\)/);
      expect(componentSource).toMatch(/readonly\s+headingId\s*=\s*input<string>\(\)/);
      expect(componentSource).toMatch(/readonly\s+intent\s*=\s*output<PrescribingTableIntent>\(\)/);
      expect(componentSource).not.toMatch(/@Input\(|@Output\(|EventEmitter/);
    });

    it('renders expandable taper steps sub-rows when row.taperExpanded is true', () => {
      expect(componentSource).toContain('@if (row.taperExpanded)');
      expect(componentSource).toContain('REDUCING / TAPER SCHEDULE FOR');
      expect(componentSource).toContain('@for (step of row.taperSteps ?? []');
      expect(componentSource).toContain("type: 'taperStepAddRequested'");
      expect(componentSource).toContain("type: 'taperStepRemoveRequested'");
      expect(componentSource).toContain("type: 'taperStepMoveRequested'");
      expect(componentSource).toContain("type: 'taperStepChanged'");
    });

    it('renders SmartSig quick-entry bar, view mode switches, DDI/safety banner, eye-site selector, and dispense badge', () => {
      // SmartSig
      expect(componentSource).toContain('SmartSig Quick-Order:');
      expect(componentSource).toContain('aria-label="SmartSig shorthand command"');
      expect(componentSource).toContain('+ Parse &amp; Add Row');
      expect(componentSource).toContain('model().quickSigExamples');

      // View modes
      expect(componentSource).toContain('Dense Grid (Cerner)');
      expect(componentSource).toContain('Sig Summary (Epic)');
      expect(componentSource).toContain('Patient Matrix');
      expect(componentSource).toContain("@if (viewMode() === 'sig')");
      expect(componentSource).toContain("@else if (viewMode() === 'patient')");

      // DDI & Allergy safety alerts
      expect(componentSource).toContain('model().safetyAlerts');
      expect(componentSource).toContain('Acknowledge / Override');

      // Ophthalmic eye-site selector
      expect(componentSource).toContain('sitesForRow(row)');
      expect(componentSource).toContain('changeSite(row.id, s.value)');

      // Auto-calculated dispense count
      expect(componentSource).toContain('dispenseForRow(row)');
      expect(componentSource).toContain('calculateFixedScheduleDispenseQuantity');
    });
  });

  describe('Taper schedule sub-rows & interactions', () => {
    it('emits taperStepChanged for periodLabel and frequencyLabel edits', () => {
      const { instance, emitted } = createHarness(
        makeModel({
          rows: [
            makeRow({
              taperExpanded: true,
              taperSteps: [
                { id: 'ts-1', periodLabel: 'Week 1', frequencyLabel: 'QID' },
                { id: 'ts-2', periodLabel: 'Week 2', frequencyLabel: 'BD' },
              ],
            }),
          ],
        }),
      );

      instance.onTaperStepPeriodInput('row-1', 'ts-1', {
        target: { value: 'Days 1–7' },
      } as unknown as Event);
      expect(emitted.at(-1)).toEqual({
        type: 'taperStepChanged',
        rowId: 'row-1',
        stepId: 'ts-1',
        periodLabel: 'Days 1–7',
      });

      instance.onTaperStepFrequencyInput('row-1', 'ts-2', {
        target: { value: '1 drop twice daily (BD)' },
      } as unknown as Event);
      expect(emitted.at(-1)).toEqual({
        type: 'taperStepChanged',
        rowId: 'row-1',
        stepId: 'ts-2',
        frequencyLabel: '1 drop twice daily (BD)',
      });
    });

    it('formats taper summary in Sig view when taperSteps are present', () => {
      const { instance } = createHarness(makeModel());
      const rowWithTaper = makeRow({
        taperSteps: [
          { id: 's1', periodLabel: 'Week 1', frequencyLabel: 'QID' },
          { id: 's2', periodLabel: 'Week 2', frequencyLabel: 'BD' },
        ],
      });
      expect(instance.formatRowTaperSummary(rowWithTaper)).toBe(' · Taper: Week 1: QID → Week 2: BD');
      expect(instance.formatRowTaperSummary(makeRow({ taperSteps: [] }))).toBe('');
    });

    it('blocks taper step edits when table is readOnly or signed', () => {
      const { instance, emitted } = createHarness(makeModel({ readOnly: true }));
      instance.onTaperStepPeriodInput('row-1', 'ts-1', {
        target: { value: 'Week 3' },
      } as unknown as Event);
      instance.onTaperStepFrequencyInput('row-1', 'ts-1', {
        target: { value: 'OD' },
      } as unknown as Event);
      expect(emitted).toHaveLength(0);
    });
  });

  describe('SmartSig quick-entry & 1-click chips', () => {
    it('submits trimmed SmartSig command and clears quickSigText', () => {
      const { instance, emitted } = createHarness(makeModel());

      instance.onQuickSigInput({ target: { value: '  moxi 1qid ou 7d  ' } } as unknown as Event);
      expect(instance.quickSigText()).toBe('  moxi 1qid ou 7d  ');

      instance.submitQuickSig();
      expect(emitted).toEqual([{ type: 'quickSigSubmitted', command: 'moxi 1qid ou 7d' }]);
      expect(instance.quickSigText()).toBe('');
    });

    it('ignores blank SmartSig submissions and locked state', () => {
      const { instance, emitted, setModel } = createHarness(makeModel());

      instance.onQuickSigInput({ target: { value: '   ' } } as unknown as Event);
      instance.submitQuickSig();
      expect(emitted).toHaveLength(0);

      instance.applyQuickSigExample('pred 1qid ou taper');
      expect(emitted).toEqual([{ type: 'quickSigSubmitted', command: 'pred 1qid ou taper' }]);

      setModel(makeModel({ readOnly: true }));
      instance.applyQuickSigExample('timolol 1bd od cont');
      expect(emitted).toHaveLength(1);
    });
  });

  describe('View modes (Dense Grid, Sig Summary, Patient Matrix)', () => {
    it('switches between grid, sig, and patient view modes and computes slot schedules', () => {
      const row1 = makeRow({
        id: 'r1',
        drugName: 'Moxifloxacin',
        slots: [
          { id: 'm', label: 'Morning', amount: 1 },
          { id: 'a', label: 'Afternoon', amount: 0 },
          { id: 'e', label: 'Evening', amount: 0 },
          { id: 'n', label: 'Night', amount: 1 },
        ],
      });
      const row2 = makeRow({
        id: 'r2',
        drugName: 'Atropine',
        slots: [
          { id: 'm', label: 'Morning', amount: 0 },
          { id: 'a', label: 'Afternoon', amount: 0 },
          { id: 'e', label: 'Evening', amount: 0 },
          { id: 'n', label: 'Night', amount: 1 },
        ],
      });
      const { instance } = createHarness(makeModel({ rows: [row1, row2] }));

      expect(instance.viewMode()).toBe('grid');
      instance.setViewMode('sig');
      expect(instance.viewMode()).toBe('sig');
      expect(instance.formatRowSlotPattern(row1)).toBe('1 – 0 – 0 – 1');
      expect(instance.formatRowDuration(row1)).toBe('7 days');
      expect(instance.formatRowDuration(makeRow({ durationUnit: 'cont', durationCount: null }))).toBe('CONT');

      instance.setViewMode('patient');
      expect(instance.viewMode()).toBe('patient');
      expect(instance.scheduledRowsForSlot('m').map((x: { row: PrescribingRow }) => x.row.id)).toEqual(['r1']);
      expect(instance.scheduledRowsForSlot('a')).toEqual([]);
      expect(instance.scheduledRowsForSlot('n').map((x: { row: PrescribingRow }) => x.row.id)).toEqual(['r1', 'r2']);
    });
  });

  describe('DDI & Allergy safety alert banner acknowledgment', () => {
    it('toggles alert acknowledgement state when unlocked', () => {
      const { instance, setModel } = createHarness(makeModel());

      expect(instance.isAlertAcknowledged('ddi-severe')).toBe(false);
      instance.toggleAlertAcknowledge('ddi-severe');
      expect(instance.isAlertAcknowledged('ddi-severe')).toBe(true);
      instance.toggleAlertAcknowledge('ddi-severe');
      expect(instance.isAlertAcknowledged('ddi-severe')).toBe(false);

      setModel(makeModel({ readOnly: true }));
      instance.toggleAlertAcknowledge('ddi-severe');
      expect(instance.isAlertAcknowledged('ddi-severe')).toBe(false);
    });
  });

  describe('Ophthalmic eye-site selector & clinical form profiles', () => {
    it('resolves OD, OS, OU eye sites for ophthalmic drops, ointments, and intravitreal injections', () => {
      const { instance, emitted } = createHarness(makeModel());

      const dropEyeRow = makeRow({ form: 'drop', route: 'eye' });
      expect(instance.sitesForRow(dropEyeRow)).toEqual(mod.EYE_SITES);

      const dropEarRow = makeRow({ form: 'drop', route: 'ear' });
      expect(instance.sitesForRow(dropEarRow)).toEqual(mod.EAR_SITES);

      const ointmentEyeRow = makeRow({ form: 'ointment', route: 'eye' });
      expect(instance.sitesForRow(ointmentEyeRow)).toEqual(mod.EYE_SITES);

      const ivtRow = makeRow({ form: 'injection', route: 'ivt' });
      expect(instance.sitesForRow(ivtRow)).toEqual(mod.EYE_SITES);

      const oralTabRow = makeRow({ form: 'tablet', route: 'oral' });
      expect(instance.sitesForRow(oralTabRow)).toEqual([]);

      instance.changeSite('row-1', 'OD');
      expect(emitted.at(-1)).toEqual({ type: 'siteChanged', rowId: 'row-1', site: 'OD' });

      instance.changeRoute('row-1', 'ear');
      expect(emitted.at(-1)).toEqual({ type: 'routeChanged', rowId: 'row-1', route: 'ear' });
    });

    it('provides form-specific units, routes, timings, and stepper increments', () => {
      expect(mod.getFormClinicalProfile('tablet').step).toBe(0.5);
      expect(mod.getFormClinicalProfile('liquid').step).toBe(2.5);
      expect(mod.getFormClinicalProfile('drop').step).toBe(1);
      expect(mod.DEFAULT_PRESCRIBING_FORMS.length).toBe(7);
      expect(mod.DEFAULT_PRESCRIBING_DURATION_UNITS).toEqual(['days', 'weeks', 'months']);
      expect(mod.DEFAULT_PRESCRIBING_PRESETS.map((p) => p.id)).toEqual(['od', 'bd', 'tds', 'qid', 'hs', 'sos']);

      expect(mod.formatPrescribingDoseAmount(0)).toBe('0');
      expect(mod.formatPrescribingDoseAmount(0.25)).toBe('¼');
      expect(mod.formatPrescribingDoseAmount(0.5)).toBe('½');
      expect(mod.formatPrescribingDoseAmount(0.75)).toBe('¾');
      expect(mod.formatPrescribingDoseAmount(2)).toBe('2');
    });
  });

  describe('Auto-calculated dispense count (calculateDispenseQuantity)', () => {
    it('auto-calculates whole-unit dispense quantities for fixed tablet and capsule schedules', () => {
      const tabletRow = makeRow({
        id: 'tab-1',
        drugName: 'Amoxicillin + Clavulanate',
        strength: '625 mg',
        form: 'tablet',
        formLabel: 'Tablet',
        route: 'oral',
        site: undefined,
        doseAmount: 1,
        unitLabel: 'tab',
        frequencyCode: 'BD',
        slots: [
          { id: 'm', label: 'Morning', amount: 1 },
          { id: 'a', label: 'Afternoon', amount: 0 },
          { id: 'e', label: 'Evening', amount: 0 },
          { id: 'n', label: 'Night', amount: 1 },
        ],
        durationCount: 5,
        durationUnit: 'days',
        dispenseQuantity: undefined,
      });

      expect(mod.calculateDispenseQuantity(tabletRow)).toEqual({ count: 10, unit: 'tab' });
      expect(mod.resolveRowDispenseQuantity(tabletRow, [tabletRow])).toEqual({ count: 10, unit: 'tab' });

      const { instance } = createHarness(makeModel({ rows: [tabletRow] }));
      expect(instance.dispenseForRow(tabletRow)).toEqual({ count: 10, unit: 'tab' });
    });

    it('omits auto-calculated dispense quantity when row is a titration parent or taper is active', () => {
      const parentRow = makeRow({
        id: 'parent-1',
        drugName: 'Prednisolone',
        form: 'tablet',
        route: 'oral',
        doseAmount: 1,
        unitLabel: 'tab',
        frequencyCode: 'OD',
        slots: [
          { id: 'm', label: 'Morning', amount: 1 },
          { id: 'a', label: 'Afternoon', amount: 0 },
          { id: 'e', label: 'Evening', amount: 0 },
          { id: 'n', label: 'Night', amount: 0 },
        ],
        durationCount: 7,
        durationUnit: 'days',
      });
      const childRow = makeRow({
        id: 'child-1',
        parentRowId: 'parent-1',
        stepPhase: 'step-down',
      });

      expect(mod.resolveRowDispenseQuantity(parentRow, [parentRow, childRow])).toBeUndefined();
      expect(mod.resolveRowDispenseQuantity({ ...parentRow, taperExpanded: true }, [parentRow])).toBeUndefined();
    });
  });

  describe('Formulary search, dose stepping, and slot cycling', () => {
    it('guards formulary selection and dose stepping properly', () => {
      const item: PrescribingFormularyItem = {
        code: 'RXN-111',
        drugName: 'Moxifloxacin',
        strength: '0.5%',
        form: 'drop',
        formLabel: 'Eye Drops',
        route: 'eye',
        site: 'OU',
        doseAmount: 1,
        unitLabel: 'drop',
      };
      const row = makeRow({ id: 'row-1', drugName: 'Moxi', form: 'tablet', doseAmount: 1, unitLabel: 'tab' });
      const { instance, emitted } = createHarness(
        makeModel({
          rows: [row],
          formularySearch: {
            rowId: 'row-1',
            query: 'Moxi',
            items: [item],
            loading: false,
          },
        }),
      );

      // Step dose up (+0.5 for tablet)
      instance.stepDose('row-1', 1);
      expect(emitted.at(-1)).toEqual({ type: 'doseStepped', rowId: 'row-1', delta: 0.5 });

      // Cycle slot amount: 1 -> 0.5 (for tablet when slotAmt === baseDose)
      instance.cycleSlotAmount(row, 'm');
      expect(emitted.at(-1)).toEqual({ type: 'slotAmountChanged', rowId: 'row-1', slotId: 'm', amount: 0.5 });

      // Select formulary item
      instance.selectFormulary('row-1', item);
      expect(emitted.at(-1)).toEqual({ type: 'formularySelected', rowId: 'row-1', item });
    });
  });
});
