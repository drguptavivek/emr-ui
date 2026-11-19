import { describe, expect, it } from 'vitest';
import type { EmrFieldDefinition } from '@drguptavivek/emr-controller';
import {
  ANATOMIC_LATERALITY_OPTIONS,
  DEFAULT_ADDRESS_REQUIRED_PARTS,
  DEFAULT_ADDRESS_USE_OPTIONS,
  DEFAULT_LATERALITY_CONFIRMATION_LABEL,
  OPHTHALMIC_LATERALITY_OPTIONS,
  REFRACTION_DEFAULT_BOUNDS,
  compareRangeBounds,
  expandMacroTriggerAtCursor,
  extractActiveMacroTrigger,
  extractDurationPartValidation,
  formatRefractionPartDisplay,
  formatSignatureAttestation,
  hasAnyAddressValue,
  hasMacroValidationState,
  hasPhoneClearableValue,
  hasRefractionValue,
  hasSignatureValidationState,
  isAddressPartInvalid,
  isPhoneExtensionVisible,
  isRangeInverted,
  isSignaturePadLocked,
  mapPointerToSignaturePoint,
  normalizeFieldLayout,
  normalizeLateralityDomain,
  parsePairedNumberDraft,
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
  stepPairedNumber,
  stepRefractionPart,
  validateRangeField,
} from './emr-fields.logic';
import { mergeTypedFieldMessages } from './typed-field.logic';
import { parseQuantityDraft, sanitizeQuantityText } from '../primitives/emr-inputs.logic';

const BP_DEF: EmrFieldDefinition = {
  schemaVersion: '1.0',
  contract: {
    linkId: 'bp',
    valueType: 'integer',
    cardinality: { min: 1, max: 1 },
    terminology: [],
    validation: [],
  },
  presentation: {
    label: 'Sitting BP',
    unitDisplay: 'mmHg',
  },
};

describe('emr-fields.logic (paired field)', () => {
  it('resolves per-side validation states from EmrValidationMessage.path', () => {
    expect(
      resolvePairedSideValidation([
        { path: ['first'], severity: 'error', message: 'Required systolic' },
        { path: ['second'], severity: 'warning', message: 'Elevated diastolic' },
      ]),
    ).toEqual({
      firstHasError: true,
      secondHasError: false,
      firstHasWarning: false,
      secondHasWarning: true,
    });

    expect(
      resolvePairedSideValidation([
        { path: ['bp'], severity: 'error', message: 'Invalid pair' },
      ]),
    ).toEqual({
      firstHasError: true,
      secondHasError: true,
      firstHasWarning: false,
      secondHasWarning: false,
    });
  });

  it('falls back through explicit -> group -> definition.contract.valueType -> text (including select)', () => {
    expect(resolvePairedSideMode('select', 'integer', BP_DEF)).toBe('select');
    expect(resolvePairedSideMode(undefined, 'select', BP_DEF)).toBe('select');
    expect(resolvePairedSideMode('text', 'integer', BP_DEF)).toBe('text');
    expect(resolvePairedSideMode(undefined, 'decimal', BP_DEF)).toBe('decimal');
    expect(resolvePairedSideMode(undefined, undefined, BP_DEF)).toBe('integer');
    expect(resolvePairedSideMode(undefined, undefined, undefined)).toBe('text');
  });

  it('preserves incomplete drafts and never drops or clamps out-of-range typed numbers', () => {
    expect(sanitizePairedNumberText(' 240 mmHg ', 'integer')).toBe('240');
    expect(sanitizePairedNumberText('-12,75', 'decimal')).toBe('-12.75');
    expect(sanitizePairedNumberText('-12.75.2', 'decimal')).toBe('-12.752');

    expect(parsePairedNumberDraft('', 'decimal')).toEqual({ complete: true, value: null });
    expect(parsePairedNumberDraft('-', 'decimal')).toEqual({ complete: false });
    expect(parsePairedNumberDraft('-.', 'decimal')).toEqual({ complete: false });
    expect(parsePairedNumberDraft('.', 'decimal')).toEqual({ complete: false });
    expect(parsePairedNumberDraft('12.', 'decimal')).toEqual({ complete: false });
    expect(parsePairedNumberDraft('12.9', 'integer')).toEqual({ complete: true, value: 12 });
    expect(parsePairedNumberDraft('240', 'integer')).toEqual({ complete: true, value: 240 });
  });

  it('steps within bounds and normalizes field layout', () => {
    expect(stepPairedNumber({ current: null, delta: 1, mode: 'integer', min: 50, max: 260 })).toBe(50);
    expect(stepPairedNumber({ current: 260, delta: 1, mode: 'integer', min: 50, max: 260 })).toBe(260);
    expect(stepPairedNumber({ current: 0.4, delta: 1, mode: 'decimal', precision: 1 })).toBe(0.5);
    expect(normalizeFieldLayout('horizontal')).toBe('horizontal');
    expect(normalizeFieldLayout(undefined)).toBe('vertical');
  });
});

describe('emr-fields.logic (duration input)', () => {
  it('resolves duration config defaults, definition fallbacks, and allowNegative', () => {
    const durDef: EmrFieldDefinition = {
      schemaVersion: '1.0',
      contract: {
        linkId: 'duration',
        valueType: 'integer',
        cardinality: { min: 1, max: 1 },
        terminology: [],
        validation: [],
      },
      presentation: { label: 'Duration', hint: 'Symptom duration' },
    };
    const cfg = resolveDurationFieldConfig({
      label: '',
      definition: durDef,
      value: null,
      unitOptions: [{ value: 'd', label: 'days' }],
    });
    expect(cfg.label).toBe('Duration');
    expect(cfg.min).toBe(0);
    expect(cfg.allowNegative).toBe(false);
    expect(cfg.mode).toBe('integer');
    expect(cfg.step).toBe(1);
    expect(cfg.required).toBe(true);
    expect(cfg.unitPlaceholder).toBe('Unit');

    expect(sanitizeQuantityText('-12,5', 'decimal', { allowNegative: false })).toBe('12.5');
    expect(sanitizeQuantityText('-12,5', 'decimal')).toBe('-12.5');
    expect(parseQuantityDraft('-12', 'integer', { allowNegative: false })).toBe(12);
  });

  it('extracts per-part duration validation and suppresses warnings when side has an error', () => {
    expect(
      extractDurationPartValidation([
        { path: ['amount'], severity: 'error', message: 'Must be >= 1' },
        { path: ['amount'], severity: 'warning', message: 'Long duration' },
        { path: ['unit'], severity: 'warning', message: 'Verify unit' },
      ]),
    ).toEqual({
      amountError: 'Must be >= 1',
      unitError: '',
      amountWarning: '',
      unitWarning: 'Verify unit',
      hasAnyError: true,
      hasAnyWarning: true,
    });

    expect(
      extractDurationPartValidation([
        { path: ['duration'], severity: 'error', message: 'Required duration' },
      ]),
    ).toEqual({
      amountError: 'Required duration',
      unitError: 'Required duration',
      amountWarning: '',
      unitWarning: '',
      hasAnyError: true,
      hasAnyWarning: false,
    });
  });
});

describe('emr-fields.logic (range field)', () => {
  it('compares bounds and detects inversion across all 4 kinds', () => {
    expect(compareRangeBounds('number', 10, 14)).toBe(-1);
    expect(compareRangeBounds('date', '2026-10-14', '2026-10-01')).toBe(1);
    expect(compareRangeBounds('time', '08:00', '08:00:00')).toBe(0);
    expect(compareRangeBounds('datetime', '2026-10-14T18:00', '2026-10-14T09:00', 'local')).toBe(1);
    expect(isRangeInverted('datetime', { low: '2026-10-14T18:00', high: '2026-10-14T09:00' }, 'local')).toBe(true);
  });

  it('validates range bounds and resolves per-side error/warning states', () => {
    const msgs = validateRangeField({
      label: 'Window',
      kind: 'time',
      value: { low: '19:00', high: '17:00' },
      highMax: '18:00',
    });
    expect(msgs).toEqual([
      { path: [], severity: 'error', message: 'From must not exceed To.' },
    ]);

    const resolved = resolveRangeFieldMessages({
      highError: 'Past clinic close',
      highWarning: 'Suppressed warning',
      lowWarning: 'Early arrival',
      messages: [],
    });
    expect(resolveRangeSideValidation(resolved)).toEqual({
      lowInvalid: false,
      highInvalid: true,
      lowWarning: true,
      highWarning: false,
    });
    expect(resolveRangeNumericMode(undefined, undefined, BP_DEF)).toBe('integer');
  });
});

describe('emr-fields.logic (signature capture field)', () => {
  it('computes default geometry and inverse-maps uniform xMidYMid meet coordinates', () => {
    expect(resolveSignatureCanvasGeometry()).toEqual({
      width: 420,
      height: 140,
      baselineY: 109,
      baselineInset: 16,
    });
    expect(
      mapPointerToSignaturePoint(
        150,
        70,
        { left: 0, top: 0, width: 300, height: 140 },
        420,
        140,
      ),
    ).toEqual({ x: 210, y: 70 });
    expect(
      mapPointerToSignaturePoint(
        -10,
        999,
        { left: 0, top: 0, width: 300, height: 140 },
        420,
        140,
      ),
    ).toEqual({ x: 0, y: 140 });
  });

  it('formats attestation, resolves locked state, and merges typed-field validation messages', () => {
    expect(
      formatSignatureAttestation({
        signatoryName: 'Dr Vivek Gupta',
        signatoryRole: 'Surgeon',
        strokes: [{ points: [{ x: 1, y: 1 }] }, { points: [{ x: 2, y: 2 }] }],
        showStrokeCount: true,
      }),
    ).toBe('Dr Vivek Gupta · Surgeon · 2 strokes');
    expect(formatSignatureAttestation({ strokes: [] })).toBe('Unsigned');
    expect(isSignaturePadLocked({ readOnly: false }, true)).toBe(true);
    expect(
      hasSignatureValidationState([
        { path: [], severity: 'warning', message: 'Pending witness' },
      ]),
    ).toEqual({
      hasError: false,
      hasWarning: true,
      firstError: '',
      firstWarning: 'Pending witness',
    });

    expect(
      mergeTypedFieldMessages({
        value: [],
        readOnly: false,
        disabled: false,
        error: 'Signature required',
        warning: 'Verify identity',
        messages: [],
      }),
    ).toEqual([
      { path: [], severity: 'error', message: 'Signature required' },
      { path: [], severity: 'warning', message: 'Verify identity' },
    ]);
  });
});

describe('emr-fields.logic (phone input)', () => {
  it('resolves per-part phone validation, extension visibility, and clearable state', () => {
    expect(
      resolvePhonePartValidation([
        { path: ['countryCode'], severity: 'error', message: 'Select ISD code' },
        { path: ['channels'], severity: 'warning', message: 'Choose channel' },
      ]),
    ).toEqual({
      countryCodeInvalid: true,
      countryCodeWarning: false,
      nationalNumberInvalid: false,
      nationalNumberWarning: false,
      extensionInvalid: false,
      extensionWarning: false,
      channelsInvalid: false,
      channelsWarning: true,
      hasAnyError: true,
      hasAnyWarning: true,
    });

    expect(
      resolvePhonePartValidation([{ path: [], severity: 'error', message: 'Required' }]),
    ).toMatchObject({
      countryCodeInvalid: true,
      nationalNumberInvalid: true,
      extensionInvalid: false,
      channelsInvalid: false,
    });

    expect(isPhoneExtensionVisible(undefined, undefined)).toBe(false);
    expect(isPhoneExtensionVisible(true, undefined)).toBe(true);
    expect(isPhoneExtensionVisible(false, '204')).toBe(false);
    expect(hasPhoneClearableValue('', '')).toBe(false);
    expect(hasPhoneClearableValue('', '204')).toBe(true);
  });
});

describe('emr-fields.logic (address field)', () => {
  it('resolves per-part validation without marking line2/district on blanket root errors', () => {
    expect(DEFAULT_ADDRESS_USE_OPTIONS).toHaveLength(4);
    expect(DEFAULT_ADDRESS_REQUIRED_PARTS).toEqual(['line1', 'city', 'state', 'postalCode', 'country']);

    const merged = resolveAddressRootMessages({
      error: 'Address required',
      messages: [
        { path: ['line2'], severity: 'warning', message: 'Optional landmark' },
        { path: ['district'], severity: 'error', message: 'Invalid district' },
      ],
    });
    const pv = resolveAddressPartValidation(merged);
    expect(pv.line1Invalid).toBe(true);
    expect(pv.line2Invalid).toBe(false);
    expect(pv.line2Warning).toBe(true);
    expect(pv.districtInvalid).toBe(true);
    expect(isAddressPartInvalid(pv, 'city')).toBe(true);
    expect(isAddressPartInvalid(pv, 'line2')).toBe(false);
    expect(hasAnyAddressValue({ line1: '', city: '', state: '', postalCode: '', country: '' })).toBe(false);
    expect(hasAnyAddressValue({ postalCode: '110029' })).toBe(true);
  });
});

describe('emr-fields.logic (macro text field)', () => {
  it('extracts triggers at cursor, rejects numeric/fraction/trailing-space tokens, expands at cursor, and resolves validation state', () => {
    expect(extractActiveMacroTrigger('Fundus .norm', 12)).toBe('.norm');
    expect(extractActiveMacroTrigger('Lids /postop middle', 12)).toBe('/postop');
    expect(extractActiveMacroTrigger('.5', 2)).toBeNull();
    expect(extractActiveMacroTrigger('12.5', 4)).toBeNull();
    expect(extractActiveMacroTrigger('6/6', 3)).toBeNull();
    expect(extractActiveMacroTrigger('OD/OS', 5)).toBeNull();
    expect(extractActiveMacroTrigger('Note . ', 7)).toBeNull();

    expect(expandMacroTriggerAtCursor('Lids .clr; IOP 15', 9, 'Cornea clear')).toEqual({
      value: 'Lids Cornea clear; IOP 15',
      cursor: 17,
    });

    expect(
      hasMacroValidationState([
        { path: [], severity: 'warning', message: 'Suppressed' },
        { path: [], severity: 'error', message: 'Required' },
      ]),
    ).toEqual({ hasError: true, hasWarning: false });
    expect(
      hasMacroValidationState([{ path: [], severity: 'warning', message: 'Check laterality' }]),
    ).toEqual({ hasError: false, hasWarning: true });
  });
});

describe('emr-fields.logic (laterality field)', () => {
  it('resolves ophthalmic/anatomic presets, domain aliases, confirmation default, and path-scoped validation', () => {
    expect(DEFAULT_LATERALITY_CONFIRMATION_LABEL).toBe('Surgical site and laterality verified');
    expect(normalizeLateralityDomain('ophthalmic')).toBe('ophthalmic');
    expect(normalizeLateralityDomain('anatomical')).toBe('anatomic');
    expect(normalizeLateralityDomain(undefined, [{ code: 'OD', label: 'Right Eye' }])).toBe('ophthalmic');

    expect(resolveLateralityOptions({ domain: 'ophthalmic' })).toEqual(OPHTHALMIC_LATERALITY_OPTIONS);
    expect(resolveLateralityOptions({ domain: 'anatomical' })).toEqual(ANATOMIC_LATERALITY_OPTIONS);

    expect(
      resolveLateralityValidation([
        { path: ['confirmed'], severity: 'error', message: 'Verify consent' },
        { path: ['confirmation'], severity: 'warning', message: 'Suppressed warning' },
        { path: ['laterality'], severity: 'warning', message: 'Double check eye' },
      ]),
    ).toEqual({
      groupHasError: false,
      groupHasWarning: true,
      confirmationHasError: true,
      confirmationHasWarning: false,
    });
  });
});

describe('emr-fields.logic (refraction field)', () => {
  it('mirrors refraction bounds, per-part validation routing, display formatting, and stepping', () => {
    expect(REFRACTION_DEFAULT_BOUNDS.axis.min).toBe(1);
    expect(formatRefractionPartDisplay(-2.5, 2)).toBe('-2.50');
    expect(formatRefractionPartDisplay(95, 0)).toBe('95');
    expect(resolveRefractionEyeDescription('OS')).toBe('Left eye (OS)');
    expect(hasRefractionValue({ sphere: null, cylinder: null, axis: null }, false)).toBe(false);
    expect(hasRefractionValue({ sphere: -1.25, cylinder: null, axis: null }, false)).toBe(true);

    expect(
      resolveRefractionPartValidation(
        [
          { path: ['axis'], severity: 'error', message: 'Axis required with cylinder' },
          { path: ['sphere'], severity: 'warning', message: 'High myopia' },
        ],
        'axis',
      ),
    ).toEqual({ hasError: true, hasWarning: false });

    expect(stepRefractionPart({ current: -1.25, delta: 1, part: 'sphere' })).toBe(-1);
    expect(stepRefractionPart({ current: null, delta: 1, part: 'axis' })).toBe(1);
  });
});
