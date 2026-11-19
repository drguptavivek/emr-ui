import { describe, expect, it } from 'vitest';
import type { DoseSlot, EmrCodedValue, ScheduleSlotDefinition } from '@drguptavivek/emr-controller';
import {
  ANATOMIC_LATERALITY_OPTIONS,
  DEFAULT_ADDRESS_REQUIRED_PARTS,
  DEFAULT_ADDRESS_USE_OPTIONS,
  DEFAULT_LATERALITY_CONFIRMATION_LABEL,
  OPHTHALMIC_LATERALITY_OPTIONS,
  REFRACTION_DEFAULT_BOUNDS,
  applySlotPreset,
  codedInputChips,
  compareRangeBounds,
  expandMacroTriggerAtCursor,
  extractActiveMacroTrigger,
  extractDurationPartValidation,
  formatRefractionPartDisplay,
  formatSignatureAttestation,
  formatSlotReadout,
  hasAnyAddressValue,
  hasMacroValidationState,
  hasPhoneClearableValue,
  hasRefractionValue,
  hasSignatureValidationState,
  isAddressPartInvalid,
  isPhoneExtensionVisible,
  isPresetActive,
  isRangeInverted,
  isSignaturePadLocked,
  mapPointerToSignaturePoint,
  normalizeLateralityDomain,
  parsePairedNumberDraft,
  projectSignatureStrokeForBox,
  resolveAddressPartValidation,
  resolveAddressRootMessages,
  resolveDurationFieldConfig,
  resolveLateralityOptions,
  resolveLateralityValidation,
  resolvePairedSideMode,
  resolvePairedSideValidation,
  resolvePhonePartValidation,
  resolveRangeFieldMessages,
  resolveRangeNumericMode,
  resolveRangeSideValidation,
  resolveRefractionEyeDescription,
  resolveRefractionPartValidation,
  resolveSignatureCanvasGeometry,
  sanitizePairedNumberText,
  setSlotAmount,
  stepPairedNumber,
  stepRefractionPart,
  toggleSlot,
  validateRangeField,
} from './l2-fields.logic';

const slots: ScheduleSlotDefinition[] = [
  { id: 'm', label: 'Morning', timeHint: '8 am' },
  { id: 'a', label: 'Afternoon' },
  { id: 'e', label: 'Evening' },
  { id: 'n', label: 'Night' },
];
const one = { amount: 1 };
const ids = (v: readonly DoseSlot[]) => v.map(s => s.id);

describe('codedInputChips', () => {
  const snomed = 'http://snomed.info/sct';
  const icd10 = 'http://hl7.org/fhir/sid/icd-10';
  const labels = { [snomed]: 'SNOMED CT' };
  const c1: EmrCodedValue = { system: snomed, code: '77075001', display: 'Primary open-angle glaucoma' };
  const c2: EmrCodedValue = { system: icd10, code: 'H40.11', display: 'Primary open-angle glaucoma' };

  it('normalises null, single concept, and concept array with resolved system labels', () => {
    expect(codedInputChips(null, labels)).toEqual([]);
    expect(codedInputChips(c1, labels)).toEqual([
      { concept: c1, key: `${snomed}|77075001`, system: 'SNOMED CT' },
    ]);
    expect(codedInputChips([c1, c2], labels)).toEqual([
      { concept: c1, key: `${snomed}|77075001`, system: 'SNOMED CT' },
      { concept: c2, key: `${icd10}|H40.11`, system: icd10 },
    ]);
  });
});

describe('schedule slot value building', () => {
  it('ticks from empty and null, copying label and time hint', () => {
    expect(toggleSlot(null, slots, 'm', true, one)).toEqual([{ id: 'm', label: 'Morning', timeHint: '8 am', amount: 1 }]);
    expect(toggleSlot([], slots, 'a', true, one)).toEqual([{ id: 'a', label: 'Afternoon', amount: 1 }]);
  });

  it('keeps slot order from the definitions, not click order', () => {
    const v = toggleSlot(toggleSlot(null, slots, 'n', true, one), slots, 'm', true, one);
    expect(ids(v)).toEqual(['m', 'n']);
  });

  it('unticking omits the slot; re-ticking an already ticked slot keeps its amount', () => {
    const v = [{ id: 'm', label: 'Morning', amount: 2 }, { id: 'n', label: 'Night', amount: 1 }];
    expect(ids(toggleSlot(v, slots, 'm', false, one))).toEqual(['n']);
    expect(toggleSlot(v, slots, 'm', true, one)[0]?.amount).toBe(2);
  });

  it('does not mutate the input value', () => {
    const v = Object.freeze([Object.freeze({ id: 'm', label: 'Morning', amount: 1 })]);
    expect(() => toggleSlot(v, slots, 'n', true, one)).not.toThrow();
    expect(v).toHaveLength(1);
  });

  it('sets the amount of a ticked slot only, allowing null and labels', () => {
    const v = [{ id: 'm', label: 'Morning', amount: 1, householdLabel: '1 teaspoon' }];
    expect(setSlotAmount(v, slots, 'm', { amount: 0.5 })[0]).toMatchObject({ amount: 0.5, householdLabel: '1 teaspoon' });
    expect(setSlotAmount(v, slots, 'm', { amount: null })[0]?.amount).toBeNull();
    expect(setSlotAmount(v, slots, 'n', { amount: 3 })).toHaveLength(1);
    expect(setSlotAmount(v, slots, 'm', { amount: null, amountLabel: 'thin layer' })[0]).toMatchObject({ amount: null, amountLabel: 'thin layer' });
  });

  it('a preset replaces the selection, keeping existing amounts and seeding new slots', () => {
    const v = [{ id: 'm', label: 'Morning', amount: 2 }, { id: 'a', label: 'Afternoon', amount: 1 }];
    const bd = applySlotPreset(v, slots, { id: 'bd', label: 'BD', slotIds: ['n', 'm'] }, one);
    expect(bd.map(s => [s.id, s.amount])).toEqual([['m', 2], ['n', 1]]);
  });

  it('ignores unknown ids in value and presets', () => {
    expect(applySlotPreset([{ id: 'x', label: 'X', amount: 1 }], slots, { id: 'p', label: 'P', slotIds: ['zz'] }, one)).toEqual([]);
  });

  it('checks preset active state by set equality', () => {
    const bdPreset = { id: 'bd', label: 'BD', slotIds: ['m', 'n'] };
    const odPreset = { id: 'od', label: 'OD', slotIds: ['m'] };
    const v: DoseSlot[] = [{ id: 'm', label: 'Morning', amount: 1 }, { id: 'n', label: 'Night', amount: 1 }];
    expect(isPresetActive(v, bdPreset)).toBe(true);
    expect(isPresetActive(v, odPreset)).toBe(false);
    expect(isPresetActive(null, bdPreset)).toBe(false);
  });

  it('formats slot readout for numeric, unit, label, and null amounts', () => {
    expect(formatSlotReadout({ id: 'm', label: 'Morning', amount: 2 }, 'tablets')).toBe('2 tablets');
    expect(formatSlotReadout({ id: 'm', label: 'Morning', amount: 2 })).toBe('2');
    expect(formatSlotReadout({ id: 'm', label: 'Morning', amount: null }, 'tablets')).toBe('Selected, no amount');
    expect(formatSlotReadout({ id: 'n', label: 'Night', amount: null, amountLabel: 'thin layer' }, 'tablets')).toBe('thin layer');
  });
});

describe('paired field logic helpers', () => {
  it('resolves per-side validation targets for first, second, and root paths', () => {
    expect(
      resolvePairedSideValidation([
        { path: ['bp', 'first'], severity: 'error', message: 'Systolic too high' },
        { path: ['bp', 'second'], severity: 'warning', message: 'Check diastolic' },
      ]),
    ).toEqual({
      firstHasError: true,
      secondHasError: false,
      firstHasWarning: false,
      secondHasWarning: true,
    });

    expect(
      resolvePairedSideValidation([
        { path: [], severity: 'error', message: 'Missing blood pressure' },
      ]),
    ).toEqual({
      firstHasError: true,
      secondHasError: true,
      firstHasWarning: false,
      secondHasWarning: false,
    });
  });

  it('resolves side mode from explicit -> group -> definition -> text', () => {
    const intDef = {
      schemaVersion: '1.0' as const,
      contract: { linkId: 'bp', valueType: 'integer' as const, cardinality: { min: 0, max: 1 }, terminology: [], validation: [] },
      presentation: { label: 'BP' },
    };
    expect(resolvePairedSideMode('text', 'integer', intDef)).toBe('text');
    expect(resolvePairedSideMode(undefined, 'decimal', intDef)).toBe('decimal');
    expect(resolvePairedSideMode(undefined, undefined, intDef)).toBe('integer');
    expect(resolvePairedSideMode(undefined, undefined, undefined)).toBe('text');
  });

  it('sanitizes, preserves incomplete drafts, truncates integer, and emits out-of-range values without clamping', () => {
    expect(sanitizePairedNumberText(' -12,5a ', 'decimal')).toBe('-12.5');
    expect(sanitizePairedNumberText('12.5.8', 'decimal')).toBe('12.58');
    expect(sanitizePairedNumberText('120.9', 'integer')).toBe('1209');

    expect(parsePairedNumberDraft('', 'integer')).toEqual({ complete: true, value: null });
    expect(parsePairedNumberDraft('-', 'decimal')).toEqual({ complete: false });
    expect(parsePairedNumberDraft('-.', 'decimal')).toEqual({ complete: false });
    expect(parsePairedNumberDraft('.', 'decimal')).toEqual({ complete: false });
    expect(parsePairedNumberDraft('12.', 'decimal')).toEqual({ complete: false });
    expect(parsePairedNumberDraft('12.9', 'integer')).toEqual({ complete: true, value: 12 });
    expect(parsePairedNumberDraft('240', 'integer')).toEqual({ complete: true, value: 240 });

    expect(stepPairedNumber({ current: 120, delta: 1, mode: 'integer', min: 50, max: 220 })).toBe(121);
    expect(stepPairedNumber({ current: 220, delta: 1, mode: 'integer', min: 50, max: 220 })).toBe(220);
    expect(stepPairedNumber({ current: 0.2, delta: 1, mode: 'decimal', step: 0.1, precision: 1 })).toBe(0.3);
  });
});

describe('duration field logic helpers', () => {
  it('resolves min default 0, integer/decimal mode, step, and definition fallbacks', () => {
    const intDef = {
      schemaVersion: '1.0' as const,
      contract: {
        linkId: 'dur',
        valueType: 'integer' as const,
        cardinality: { min: 1, max: 1 },
        terminology: [],
        validation: [],
      },
      presentation: { label: 'Course length', hint: 'Days or weeks', placeholder: '0' },
    };
    const cfg = resolveDurationFieldConfig({
      label: '',
      definition: intDef,
      value: null,
      unitOptions: [{ value: 'd', label: 'days' }],
    });
    expect(cfg.label).toBe('Course length');
    expect(cfg.min).toBe(0);
    expect(cfg.allowNegative).toBe(false);
    expect(cfg.mode).toBe('integer');
    expect(cfg.step).toBe(1);
    expect(cfg.required).toBe(true);
    expect(cfg.unitPlaceholder).toBe('Unit');
    expect(cfg.showSteppers).toBe(true);

    const decCfg = resolveDurationFieldConfig({
      label: 'Taper',
      value: null,
      unitOptions: [{ value: 'wk', label: 'weeks' }],
      min: -2,
      precision: 1,
    });
    expect(decCfg.min).toBe(-2);
    expect(decCfg.allowNegative).toBe(true);
    expect(decCfg.mode).toBe('decimal');
    expect(decCfg.step).toBe(0.1);
  });

  it('extracts per-part validation for amount, value, unit, and root paths while suppressing warning on error', () => {
    expect(
      extractDurationPartValidation([
        { path: ['amount'], severity: 'error', message: 'Invalid amount' },
        { path: ['value'], severity: 'warning', message: 'Suppressed amount warning' },
        { path: ['unit'], severity: 'warning', message: 'Confirm unit' },
      ]),
    ).toEqual({
      amountError: 'Invalid amount',
      unitError: '',
      amountWarning: '',
      unitWarning: 'Confirm unit',
      hasAnyError: true,
      hasAnyWarning: true,
    });

    expect(
      extractDurationPartValidation([
        { path: [], severity: 'error', message: 'Duration required' },
      ]),
    ).toEqual({
      amountError: 'Duration required',
      unitError: 'Duration required',
      amountWarning: '',
      unitWarning: '',
      hasAnyError: true,
      hasAnyWarning: false,
    });
  });
});

describe('range field logic helpers', () => {
  it('compares bounds and detects inversion across number, date, time, and datetime', () => {
    expect(compareRangeBounds('number', 10, 14)).toBe(-1);
    expect(compareRangeBounds('number', 20, 14)).toBe(1);
    expect(compareRangeBounds('date', '2026-10-01', '2026-10-14')).toBe(-1);
    expect(compareRangeBounds('time', '18:00', '09:00')).toBe(1);
    expect(compareRangeBounds('datetime', '2026-10-14T08:00:00Z', '2026-10-14T10:00:00Z', 'utc')).toBe(-1);
    expect(isRangeInverted('time', { low: '18:00', high: '09:00' })).toBe(true);
    expect(isRangeInverted('number', { low: 14, high: 14 })).toBe(false);
  });

  it('validates range fields and resolves per-side error/warning states', () => {
    const msgs = validateRangeField({
      label: 'Target IOP',
      kind: 'number',
      value: { low: 25, high: 14 },
      lowMax: 20,
    });
    expect(msgs).toEqual([
      { path: ['low'], severity: 'error', message: 'Low must be at most 20.' },
      { path: [], severity: 'error', message: 'Low must not exceed High.' },
    ]);

    const resolved = resolveRangeFieldMessages({
      lowError: 'Below range',
      lowWarning: 'Suppressed warning',
      highWarning: 'Near ceiling',
      messages: [{ path: ['low'], severity: 'error', message: 'Below range' }],
    });
    expect(resolveRangeSideValidation(resolved)).toEqual({
      lowInvalid: true,
      highInvalid: false,
      lowWarning: false,
      highWarning: true,
    });

    expect(resolveRangeNumericMode(undefined, 0)).toBe('integer');
    expect(resolveRangeNumericMode('decimal', 0)).toBe('decimal');
  });
});

describe('signature capture logic helpers', () => {
  it('resolves canvas geometry defaults and maps scaled viewBox coordinates uniformly', () => {
    expect(resolveSignatureCanvasGeometry()).toEqual({
      width: 420,
      height: 140,
      baselineY: 109,
      baselineInset: 16,
    });

    // Narrow 390px viewport container: width=300, height=140 => scale=300/420, offsetY=20
    const center = mapPointerToSignaturePoint(
      150,
      70,
      { left: 0, top: 0, width: 300, height: 140 },
      420,
      140,
    );
    expect(center).toEqual({ x: 210, y: 70 });

    const clamped = mapPointerToSignaturePoint(
      500,
      -20,
      { left: 0, top: 0, width: 300, height: 140 },
      420,
      140,
    );
    expect(clamped).toEqual({ x: 420, y: 0 });

    expect(
      projectSignatureStrokeForBox({ points: [{ x: 210, y: 70 }] }, 300, 140, 420, 140),
    ).toEqual({ points: [{ x: 150, y: 70 }] });
  });

  it('formats attestation, resolves locked state, and extracts validation state', () => {
    expect(
      formatSignatureAttestation({
        signatoryName: 'Suresh Menon',
        signatoryRole: 'Patient',
        signedAt: '2026-10-14 09:30',
        strokes: [{ points: [{ x: 10, y: 10 }] }],
      }),
    ).toBe('Suresh Menon · Patient · 2026-10-14 09:30');
    expect(formatSignatureAttestation({ strokes: [{ points: [{ x: 10, y: 10 }] }] })).toBe(
      '1 stroke(s) recorded',
    );
    expect(formatSignatureAttestation({ strokes: [] })).toBe('Unsigned');

    expect(
      isSignaturePadLocked({
        readOnly: false,
        definition: {
          schemaVersion: '1.0',
          contract: {
            linkId: 'sig',
            valueType: 'annotation',
            readOnly: true,
            cardinality: { min: 0, max: 1 },
            terminology: [],
            validation: [],
          },
          presentation: { label: 'Sig' },
        },
      }),
    ).toBe(true);

    expect(
      hasSignatureValidationState([
        { path: [], severity: 'warning', message: 'Check witness' },
        { path: [], severity: 'error', message: 'Signature required' },
      ]),
    ).toEqual({
      hasError: true,
      hasWarning: false,
      firstError: 'Signature required',
      firstWarning: 'Check witness',
    });
  });
});

describe('phone field logic helpers', () => {
  it('resolves per-part phone validation, extension visibility, and clearable state', () => {
    expect(
      resolvePhonePartValidation([
        { path: ['extension'], severity: 'error', message: 'Digits only' },
        { path: ['extension'], severity: 'warning', message: 'Suppressed' },
        { path: [], severity: 'warning', message: 'Unverified number' },
      ]),
    ).toEqual({
      countryCodeInvalid: false,
      countryCodeWarning: true,
      nationalNumberInvalid: false,
      nationalNumberWarning: true,
      extensionInvalid: true,
      extensionWarning: false,
      channelsInvalid: false,
      channelsWarning: false,
      hasAnyError: true,
      hasAnyWarning: true,
    });

    expect(isPhoneExtensionVisible(undefined, undefined)).toBe(false);
    expect(isPhoneExtensionVisible(true, undefined)).toBe(true);
    expect(isPhoneExtensionVisible(false, '204')).toBe(false);
    expect(hasPhoneClearableValue('', '')).toBe(false);
    expect(hasPhoneClearableValue('9876543210', '')).toBe(true);
  });
});

describe('address field logic helpers', () => {
  it('resolves per-part validation, root messages, defaults, and clearable state', () => {
    expect(DEFAULT_ADDRESS_USE_OPTIONS.map(o => o.value)).toEqual(['home', 'work', 'temp', 'billing']);
    expect(DEFAULT_ADDRESS_REQUIRED_PARTS).toEqual(['line1', 'city', 'state', 'postalCode', 'country']);

    const merged = resolveAddressRootMessages({
      error: 'Address incomplete',
      warning: 'Check PIN',
      messages: [
        { path: ['postalCode'], severity: 'error', message: 'Invalid PIN' },
        { path: ['district'], severity: 'warning', message: 'Verify district' },
      ],
    });
    const pv = resolveAddressPartValidation(merged);
    expect(isAddressPartInvalid(pv, 'line1')).toBe(true);
    expect(isAddressPartInvalid(pv, 'line2')).toBe(false);
    expect(isAddressPartInvalid(pv, 'district')).toBe(false);
    expect(isAddressPartInvalid(pv, 'postalCode')).toBe(true);
    expect(pv.postalCodeWarning).toBe(false);
    expect(pv.districtWarning).toBe(true);

    expect(hasAnyAddressValue({ line1: '', city: '', state: '', postalCode: '', country: '' })).toBe(false);
    expect(hasAnyAddressValue({ line1: '14 Ansari Nagar' })).toBe(true);
  });
});

describe('macro text field logic helpers', () => {
  it('extracts cursor-aware triggers, expands at cursor, and resolves validation state', () => {
    expect(extractActiveMacroTrigger('Cornea .clear next', 13)).toBe('.clear');
    expect(extractActiveMacroTrigger('Cornea .clear next', 18)).toBeNull();
    expect(extractActiveMacroTrigger('.5', 2)).toBeNull();
    expect(extractActiveMacroTrigger('6/6', 3)).toBeNull();
    expect(extractActiveMacroTrigger('OD/OS', 5)).toBeNull();
    expect(extractActiveMacroTrigger('Note . ', 7)).toBeNull();

    expect(expandMacroTriggerAtCursor('Cornea .clear next', 13, 'clear')).toEqual({
      value: 'Cornea clear next',
      cursor: 12,
    });

    expect(
      hasMacroValidationState([
        { path: [], severity: 'warning', message: 'Suppressed' },
        { path: [], severity: 'error', message: 'Note required' },
      ]),
    ).toEqual({ hasError: true, hasWarning: false });
    expect(
      hasMacroValidationState([{ path: [], severity: 'warning', message: 'Review laterality' }]),
    ).toEqual({ hasError: false, hasWarning: true });
  });
});

describe('laterality field logic helpers', () => {
  it('normalizes domain presets and resolves path-scoped radiogroup vs confirmation validation', () => {
    expect(DEFAULT_LATERALITY_CONFIRMATION_LABEL).toBe('Surgical site and laterality verified');
    expect(normalizeLateralityDomain('anatomical')).toBe('anatomic');
    expect(normalizeLateralityDomain('ophthalmic')).toBe('ophthalmic');
    expect(resolveLateralityOptions({ domain: 'ophthalmic' })).toEqual(OPHTHALMIC_LATERALITY_OPTIONS);
    expect(resolveLateralityOptions({ domain: 'anatomic' })).toEqual(ANATOMIC_LATERALITY_OPTIONS);

    expect(
      resolveLateralityValidation([
        { path: ['confirmed'], severity: 'error', message: 'Confirm mark' },
        { path: ['value'], severity: 'warning', message: 'Verify eye' },
      ]),
    ).toEqual({
      groupHasError: false,
      groupHasWarning: true,
      confirmationHasError: true,
      confirmationHasWarning: false,
    });
  });
});

describe('refraction field logic helpers', () => {
  it('exposes clinical refraction defaults, formatting, per-part validation, and stepping', () => {
    expect(REFRACTION_DEFAULT_BOUNDS.axis.min).toBe(1);
    expect(formatRefractionPartDisplay(-2, 2)).toBe('-2.00');
    expect(formatRefractionPartDisplay(90, 0)).toBe('90');
    expect(resolveRefractionEyeDescription('OD')).toBe('Right eye (OD)');
    expect(hasRefractionValue({ sphere: null, cylinder: null, axis: null }, false)).toBe(false);
    expect(hasRefractionValue({ sphere: 0, cylinder: null, axis: null }, false)).toBe(true);

    expect(
      resolveRefractionPartValidation(
        [
          { path: ['axis'], severity: 'error', message: 'Axis required' },
          { path: ['sphere'], severity: 'warning', message: 'High myopia' },
        ],
        'axis',
      ),
    ).toEqual({ hasError: true, hasWarning: false });

    expect(stepRefractionPart({ current: -1.25, delta: 1, part: 'sphere' })).toBe(-1);
    expect(stepRefractionPart({ current: null, delta: 1, part: 'axis' })).toBe(1);
  });
});
