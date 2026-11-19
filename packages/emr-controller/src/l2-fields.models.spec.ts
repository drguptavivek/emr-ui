import { describe, expect, it } from 'vitest';
import {
  ANATOMIC_LATERALITY_OPTIONS,
  DEFAULT_ADDRESS_REQUIRED_PARTS,
  DEFAULT_ADDRESS_USE_OPTIONS,
  DEFAULT_LATERALITY_CONFIRMATION_LABEL,
  OPHTHALMIC_LATERALITY_OPTIONS,
  compareRangeBounds,
  expandMacroTriggerAtCursor,
  extractActiveMacroTrigger,
  hasAnyAddressValue,
  hasMacroValidationState,
  hasPhoneClearableValue,
  isAddressPartInvalid,
  isPhoneExtensionVisible,
  isRangeInverted,
  normalizeLateralityDomain,
  resolveAddressPartValidation,
  resolveAddressRootMessages,
  resolveLateralityOptions,
  resolveLateralityValidation,
  resolvePhonePartValidation,
  resolveRangeFieldMessages,
  resolveRangeSideValidation,
  REFRACTION_DEFAULT_BOUNDS,
  formatRefractionPartDisplay,
  hasRefractionValue,
  resolveRefractionEyeDescription,
  resolveRefractionPartValidation,
  resolveVisualAcuityEyeDescription,
  resolveVisualAcuityPartValidation,
  stepRefractionPart,
  validateRangeField,
} from './l2-fields.models.js';

describe('RangeField controller helpers', () => {
  it('compares bounds for number, date, time, and datetime (utc and local)', () => {
    expect(compareRangeBounds('number', 10, 14)).toBe(-1);
    expect(compareRangeBounds('number', 14, 14)).toBe(0);
    expect(compareRangeBounds('number', 18, 14)).toBe(1);
    expect(compareRangeBounds('number', null, 14)).toBeNull();

    expect(compareRangeBounds('date', '2026-10-01', '2026-10-14')).toBe(-1);
    expect(compareRangeBounds('date', '2026-10-14', '2026-10-14')).toBe(0);
    expect(compareRangeBounds('date', '2026-10-20', '2026-10-14')).toBe(1);

    expect(compareRangeBounds('time', '08:00', '17:30:00')).toBe(-1);
    expect(compareRangeBounds('time', '08:00:00', '08:00')).toBe(0);
    expect(compareRangeBounds('time', '19:15', '17:30')).toBe(1);

    expect(compareRangeBounds('datetime', '2026-10-14T08:00:00Z', '2026-10-14T10:00:00Z', 'utc')).toBe(-1);
    expect(compareRangeBounds('datetime', '2026-10-14T12:00:00Z', '2026-10-14T10:00:00Z', 'utc')).toBe(1);
    expect(compareRangeBounds('datetime', '2026-10-14T08:00', '2026-10-14T10:00', 'local')).toBe(-1);
    expect(compareRangeBounds('datetime', '2026-10-14T12:00', '2026-10-14T10:00', 'local')).toBe(1);
  });

  it('detects inverted ranges across all kinds', () => {
    expect(isRangeInverted('number', { low: 10, high: 14 })).toBe(false);
    expect(isRangeInverted('number', { low: 14, high: 14 })).toBe(false);
    expect(isRangeInverted('number', { low: 20, high: 14 })).toBe(true);
    expect(isRangeInverted('date', { low: '2026-10-20', high: '2026-10-14' })).toBe(true);
    expect(isRangeInverted('time', { low: '18:00', high: '09:00' })).toBe(true);
    expect(
      isRangeInverted('datetime', { low: '2026-10-14T18:00:00Z', high: '2026-10-14T09:00:00Z' }, 'utc'),
    ).toBe(true);
    expect(isRangeInverted('number', null)).toBe(false);
  });

  it('validates requiredness, per-side min/max bounds, inversion, and allowEqual=false', () => {
    const reqMessages = validateRangeField({
      label: 'Target IOP',
      kind: 'number',
      value: { low: null, high: 14 },
      lowRequired: true,
    });
    expect(reqMessages).toEqual([
      { path: ['low'], severity: 'error', message: 'Low is required.' },
    ]);

    const boundMessages = validateRangeField({
      label: 'Target IOP',
      kind: 'number',
      value: { low: 2, high: 40 },
      lowMin: 5,
      highMax: 30,
    });
    expect(boundMessages).toEqual([
      { path: ['low'], severity: 'error', message: 'Low must be at least 5.' },
      { path: ['high'], severity: 'error', message: 'High must be at most 30.' },
    ]);

    const invertedMessages = validateRangeField({
      label: 'Window',
      kind: 'time',
      value: { low: '18:00', high: '08:00' },
    });
    expect(invertedMessages).toEqual([
      { path: [], severity: 'error', message: 'From must not exceed To.' },
    ]);

    const equalStrictMessages = validateRangeField(
      {
        label: 'Window',
        kind: 'number',
        value: { low: 12, high: 12 },
      },
      { allowEqual: false },
    );
    expect(equalStrictMessages).toEqual([
      { path: [], severity: 'error', message: 'Low must be less than High.' },
    ]);
  });

  it('resolves range field messages and per-side validation flags', () => {
    const messages = resolveRangeFieldMessages({
      lowError: 'Below threshold',
      highWarning: 'Near upper limit',
      lowWarning: 'Suppressed warning on invalid side',
      messages: [
        { path: ['low'], severity: 'error', message: 'Below threshold' },
        { path: ['high'], severity: 'warning', message: 'Near upper limit' },
      ],
    });
    expect(messages).toHaveLength(3);
    expect(resolveRangeSideValidation(messages)).toEqual({
      lowInvalid: true,
      highInvalid: false,
      lowWarning: false,
      highWarning: true,
    });

    expect(
      resolveRangeSideValidation([
        { path: [], severity: 'error', message: 'Low must not exceed High.' },
      ]),
    ).toEqual({
      lowInvalid: true,
      highInvalid: true,
      lowWarning: false,
      highWarning: false,
    });
  });
});

describe('PhoneField controller helpers', () => {
  it('resolves path-scoped and untargeted validation states with error-over-warning suppression', () => {
    expect(
      resolvePhonePartValidation([
        { path: ['contact', 'nationalNumber'], severity: 'error', message: 'Invalid number' },
        { path: ['contact', 'nationalNumber'], severity: 'warning', message: 'Suppressed warning' },
        { path: ['extension'], severity: 'warning', message: 'Check extension' },
        { path: ['channels'], severity: 'warning', message: 'Opt-in recommended' },
      ]),
    ).toEqual({
      countryCodeInvalid: false,
      countryCodeWarning: false,
      nationalNumberInvalid: true,
      nationalNumberWarning: false,
      extensionInvalid: false,
      extensionWarning: true,
      channelsInvalid: false,
      channelsWarning: true,
      hasAnyError: true,
      hasAnyWarning: true,
    });

    expect(
      resolvePhonePartValidation([
        { path: [], severity: 'error', message: 'Phone required' },
      ]),
    ).toEqual({
      countryCodeInvalid: true,
      countryCodeWarning: false,
      nationalNumberInvalid: true,
      nationalNumberWarning: false,
      extensionInvalid: false,
      extensionWarning: false,
      channelsInvalid: false,
      channelsWarning: false,
      hasAnyError: true,
      hasAnyWarning: false,
    });

    expect(
      resolvePhonePartValidation([
        { path: ['countryCode'], severity: 'warning', message: 'Roaming rate' },
      ]),
    ).toEqual({
      countryCodeInvalid: false,
      countryCodeWarning: true,
      nationalNumberInvalid: false,
      nationalNumberWarning: false,
      extensionInvalid: false,
      extensionWarning: false,
      channelsInvalid: false,
      channelsWarning: false,
      hasAnyError: false,
      hasAnyWarning: true,
    });
  });

  it('resolves extension visibility and clearable state', () => {
    expect(isPhoneExtensionVisible(undefined, undefined)).toBe(false);
    expect(isPhoneExtensionVisible(undefined, '')).toBe(true);
    expect(isPhoneExtensionVisible(true, undefined)).toBe(true);
    expect(isPhoneExtensionVisible(false, '204')).toBe(false);

    expect(hasPhoneClearableValue('', '')).toBe(false);
    expect(hasPhoneClearableValue('9876543210', '')).toBe(true);
    expect(hasPhoneClearableValue('', '204')).toBe(true);
  });
});

describe('AddressField controller helpers', () => {
  it('provides default use options and required parts', () => {
    expect(DEFAULT_ADDRESS_USE_OPTIONS.map((o) => o.value)).toEqual(['home', 'work', 'temp', 'billing']);
    expect(DEFAULT_ADDRESS_REQUIRED_PARTS).toEqual(['line1', 'city', 'state', 'postalCode', 'country']);
  });

  it('merges root messages while preserving per-part EmrNodePath entries', () => {
    const merged = resolveAddressRootMessages({
      error: 'Complete required address fields',
      warning: 'Verify PIN code',
      info: 'Used for ABHA KYC',
      messages: [
        { path: [], severity: 'error', message: 'Complete required address fields' },
        { path: ['address', 'postalCode'], severity: 'error', message: '6-digit PIN required' },
        { path: ['district'], severity: 'warning', message: 'Confirm district' },
      ],
    });
    expect(merged).toEqual([
      { path: [], severity: 'error', message: 'Complete required address fields' },
      { path: [], severity: 'warning', message: 'Verify PIN code' },
      { path: [], severity: 'info', message: 'Used for ABHA KYC' },
      { path: ['address', 'postalCode'], severity: 'error', message: '6-digit PIN required' },
      { path: ['district'], severity: 'warning', message: 'Confirm district' },
    ]);
  });

  it('routes path-scoped messages and excludes line2/district from blanket root errors', () => {
    const rootState = resolveAddressPartValidation([
      { path: [], severity: 'error', message: 'Address incomplete' },
      { path: ['line2'], severity: 'warning', message: 'Landmark helpful' },
    ]);
    expect(rootState).toEqual({
      line1Invalid: true,
      line1Warning: false,
      line2Invalid: false,
      line2Warning: true,
      cityInvalid: true,
      cityWarning: false,
      districtInvalid: false,
      districtWarning: false,
      stateInvalid: true,
      stateWarning: false,
      postalCodeInvalid: true,
      postalCodeWarning: false,
      countryInvalid: true,
      countryWarning: false,
      hasAnyError: true,
      hasAnyWarning: true,
    });
    expect(isAddressPartInvalid(rootState, 'line1')).toBe(true);
    expect(isAddressPartInvalid(rootState, 'line2')).toBe(false);
    expect(isAddressPartInvalid(rootState, 'district')).toBe(false);

    const targeted = resolveAddressPartValidation([
      { path: ['address', 'postalCode'], severity: 'error', message: 'Invalid PIN' },
      { path: ['address', 'postalCode'], severity: 'warning', message: 'Suppressed warning' },
      { path: ['district'], severity: 'error', message: 'District mismatch' },
    ]);
    expect(targeted.postalCodeInvalid).toBe(true);
    expect(targeted.postalCodeWarning).toBe(false);
    expect(targeted.districtInvalid).toBe(true);
    expect(targeted.line1Invalid).toBe(false);
    expect(isAddressPartInvalid([{ path: ['line2'], severity: 'error', message: 'Too long' }], 'line2')).toBe(true);
    expect(isAddressPartInvalid(undefined, 'line1')).toBe(false);
  });

  it('detects whether any address part has a non-empty value', () => {
    expect(hasAnyAddressValue(null)).toBe(false);
    expect(hasAnyAddressValue(undefined)).toBe(false);
    expect(
      hasAnyAddressValue({ line1: '', line2: '', city: '', district: '', state: '', postalCode: '', country: '' }),
    ).toBe(false);
    expect(hasAnyAddressValue({ line1: '', city: '', state: '', postalCode: '', country: 'IN' })).toBe(true);
  });
});

describe('MacroTextField controller helpers', () => {
  it('extracts active . or / triggers at cursor and rejects decimals, fractions, and trailing space', () => {
    expect(extractActiveMacroTrigger('')).toBeNull();
    expect(extractActiveMacroTrigger('.')).toBe('.');
    expect(extractActiveMacroTrigger('/')).toBe('/');
    expect(extractActiveMacroTrigger('Fundus: .normfundus')).toBe('.normfundus');
    expect(extractActiveMacroTrigger('Note\n/postop_d-1')).toBe('/postop_d-1');
    expect(extractActiveMacroTrigger('Lids .clr more text', 9)).toBe('.clr');
    expect(extractActiveMacroTrigger('Lids .clr more text', 14)).toBeNull();

    expect(extractActiveMacroTrigger('.5')).toBeNull();
    expect(extractActiveMacroTrigger('12.5')).toBeNull();
    expect(extractActiveMacroTrigger('6/6')).toBeNull();
    expect(extractActiveMacroTrigger('OD/OS')).toBeNull();
    expect(extractActiveMacroTrigger('Note . ')).toBeNull();
    expect(extractActiveMacroTrigger('Note /2')).toBeNull();
  });

  it('expands active trigger at cursor without clobbering surrounding text', () => {
    expect(expandMacroTriggerAtCursor('Lids .clr\nIOP 14', 9, 'Cornea clear.')).toEqual({
      value: 'Lids Cornea clear.\nIOP 14',
      cursor: 18,
    });
    expect(expandMacroTriggerAtCursor('Lids ', 5, 'Cornea clear.')).toEqual({
      value: 'Lids Cornea clear.',
      cursor: 18,
    });
    expect(expandMacroTriggerAtCursor('.wnl', 4, 'Within normal limits.')).toEqual({
      value: 'Within normal limits.',
      cursor: 21,
    });
  });

  it('resolves error and warning flags while suppressing warning when error is present', () => {
    expect(hasMacroValidationState([])).toEqual({ hasError: false, hasWarning: false });
    expect(hasMacroValidationState([{ path: [], severity: 'warning', message: 'Dictate carefully' }])).toEqual({
      hasError: false,
      hasWarning: true,
    });
    expect(
      hasMacroValidationState([
        { path: [], severity: 'warning', message: 'Suppressed warning' },
        { path: [], severity: 'error', message: 'Note required' },
      ]),
    ).toEqual({ hasError: true, hasWarning: false });
  });
});

describe('LateralityField controller helpers', () => {
  it('normalizes laterality domains and resolves canonical presets', () => {
    expect(DEFAULT_LATERALITY_CONFIRMATION_LABEL).toBe('Surgical site and laterality verified');
    expect(normalizeLateralityDomain('ophthalmic')).toBe('ophthalmic');
    expect(normalizeLateralityDomain('anatomic')).toBe('anatomic');
    expect(normalizeLateralityDomain('anatomical')).toBe('anatomic');
    expect(normalizeLateralityDomain(undefined)).toBe('anatomic');
    expect(normalizeLateralityDomain(undefined, [{ code: 'OD', label: 'Right Eye' }])).toBe('ophthalmic');

    expect(resolveLateralityOptions({ domain: 'ophthalmic' })).toEqual(OPHTHALMIC_LATERALITY_OPTIONS);
    expect(resolveLateralityOptions({ domain: 'anatomical' })).toEqual(ANATOMIC_LATERALITY_OPTIONS);
    expect(resolveLateralityOptions({ domain: 'ophthalmic', options: [] })).toEqual(OPHTHALMIC_LATERALITY_OPTIONS);
    const custom = [{ code: 'OD', label: 'Right (OD)', shortLabel: 'OD' }] as const;
    expect(resolveLateralityOptions({ domain: 'anatomic', options: custom })).toBe(custom);
  });

  it('resolves path-scoped radiogroup vs confirmation validation and suppresses warnings under errors', () => {
    expect(resolveLateralityValidation([])).toEqual({
      groupHasError: false,
      groupHasWarning: false,
      confirmationHasError: false,
      confirmationHasWarning: false,
    });

    expect(
      resolveLateralityValidation([
        { path: ['laterality', 'confirmed'], severity: 'error', message: 'Verify consent mark' },
        { path: ['confirmation'], severity: 'warning', message: 'Suppressed confirm warning' },
        { path: ['value'], severity: 'warning', message: 'Check laterality' },
      ]),
    ).toEqual({
      groupHasError: false,
      groupHasWarning: true,
      confirmationHasError: true,
      confirmationHasWarning: false,
    });

    expect(
      resolveLateralityValidation([
        { path: [], severity: 'error', message: 'Laterality required' },
        { path: ['laterality'], severity: 'warning', message: 'Suppressed group warning' },
        { path: ['confirm'], severity: 'warning', message: 'Confirm before surgery' },
      ]),
    ).toEqual({
      groupHasError: true,
      groupHasWarning: false,
      confirmationHasError: false,
      confirmationHasWarning: true,
    });
  });
});

describe('VisualAcuityField controller helpers', () => {
  it('expands OD/OS/OU eye laterality descriptions and honors label overrides', () => {
    expect(resolveVisualAcuityEyeDescription('OD')).toBe('Right eye (OD)');
    expect(resolveVisualAcuityEyeDescription('OS')).toBe('Left eye (OS)');
    expect(resolveVisualAcuityEyeDescription('OU')).toBe('Both eyes (OU)');
    expect(
      resolveVisualAcuityEyeDescription('OD', { eyeDescriptions: { OD: 'Oculus dexter (OD)' } }),
    ).toBe('Oculus dexter (OD)');
  });

  it('routes path-scoped messages and propagates un-scoped root errors onto primary value', () => {
    expect(resolveVisualAcuityPartValidation([])).toEqual({
      rootHasError: false,
      rootHasWarning: false,
      valueHasError: false,
      valueHasWarning: false,
      pinholeHasError: false,
      pinholeHasWarning: false,
      notationHasError: false,
      notationHasWarning: false,
      correctionHasError: false,
      correctionHasWarning: false,
      valueMessage: undefined,
      pinholeMessage: undefined,
      notationMessage: undefined,
      correctionMessage: undefined,
    });

    expect(
      resolveVisualAcuityPartValidation([
        { path: ['va', 'pinholeValue'], severity: 'error', message: 'Pinhole must be recorded' },
        { path: ['va', 'pinhole'], severity: 'warning', message: 'Suppressed pinhole warning' },
        { path: ['va', 'acuity'], severity: 'warning', message: 'Confirm acuity chart distance' },
        { path: ['notation'], severity: 'warning', message: 'Verify chart notation' },
        { path: ['correction'], severity: 'error', message: 'Select optical correction' },
      ]),
    ).toEqual({
      rootHasError: false,
      rootHasWarning: false,
      valueHasError: false,
      valueHasWarning: true,
      pinholeHasError: true,
      pinholeHasWarning: false,
      notationHasError: false,
      notationHasWarning: true,
      correctionHasError: true,
      correctionHasWarning: false,
      valueMessage: 'Confirm acuity chart distance',
      pinholeMessage: 'Pinhole must be recorded',
      notationMessage: 'Verify chart notation',
      correctionMessage: 'Select optical correction',
    });

    expect(
      resolveVisualAcuityPartValidation([
        { path: [], severity: 'error', message: 'Visual acuity required' },
        { path: [], severity: 'warning', message: 'Suppressed root warning' },
      ]),
    ).toEqual({
      rootHasError: true,
      rootHasWarning: false,
      valueHasError: true,
      valueHasWarning: false,
      pinholeHasError: false,
      pinholeHasWarning: false,
      notationHasError: false,
      notationHasWarning: false,
      correctionHasError: false,
      correctionHasWarning: false,
      valueMessage: undefined,
      pinholeMessage: undefined,
      notationMessage: undefined,
      correctionMessage: undefined,
    });

    expect(
      resolveVisualAcuityPartValidation([
        { path: [], severity: 'error', message: 'Root error' },
        { path: ['pinhole_value'], severity: 'error', message: 'Pinhole invalid' },
      ]),
    ).toEqual({
      rootHasError: true,
      rootHasWarning: false,
      valueHasError: false,
      valueHasWarning: false,
      pinholeHasError: true,
      pinholeHasWarning: false,
      notationHasError: false,
      notationHasWarning: false,
      correctionHasError: false,
      correctionHasWarning: false,
      valueMessage: undefined,
      pinholeMessage: 'Pinhole invalid',
      notationMessage: undefined,
      correctionMessage: undefined,
    });
  });
});

describe('RefractionField controller helpers', () => {
  it('exposes clinical default bounds including axisMin = 1', () => {
    expect(REFRACTION_DEFAULT_BOUNDS.sphere).toEqual({
      min: -30,
      max: 30,
      step: 0.25,
      precision: 2,
      unit: 'D',
      label: 'Sphere (SPH)',
    });
    expect(REFRACTION_DEFAULT_BOUNDS.axis.min).toBe(1);
    expect(REFRACTION_DEFAULT_BOUNDS.axis.max).toBe(180);
    expect(REFRACTION_DEFAULT_BOUNDS.axis.precision).toBe(0);
  });

  it('routes per-part and whole-field validation messages without leaking errors across parts', () => {
    const messages = [
      { path: ['axis'], severity: 'error' as const, message: 'Axis required when cylinder is non-zero' },
      { path: ['sphere'], severity: 'warning' as const, message: 'High myopia threshold' },
      { path: ['sphere'], severity: 'error' as const, message: 'Out of clinical sphere range' },
    ];
    expect(resolveRefractionPartValidation(messages, 'axis')).toEqual({ hasError: true, hasWarning: false });
    expect(resolveRefractionPartValidation(messages, 'sphere')).toEqual({ hasError: true, hasWarning: false });
    expect(resolveRefractionPartValidation(messages, 'cylinder')).toEqual({ hasError: false, hasWarning: false });

    const rootWarn = [{ path: [], severity: 'warning' as const, message: 'Verify against autorefractor' }];
    expect(resolveRefractionPartValidation(rootWarn, 'cylinder')).toEqual({ hasError: false, hasWarning: true });
    expect(resolveRefractionPartValidation(rootWarn, 'nearAdd')).toEqual({ hasError: false, hasWarning: true });
  });

  it('formats part display values cleanly and tracks populated state', () => {
    expect(formatRefractionPartDisplay(null, 2)).toBe('');
    expect(formatRefractionPartDisplay(-2, 2)).toBe('-2.00');
    expect(formatRefractionPartDisplay(-0, 2)).toBe('0.00');
    expect(formatRefractionPartDisplay(90, 0)).toBe('90');

    expect(hasRefractionValue({ sphere: null, cylinder: null, axis: null, nearAdd: 2.0 }, false)).toBe(false);
    expect(hasRefractionValue({ sphere: null, cylinder: null, axis: null, nearAdd: 2.0 }, true)).toBe(true);
    expect(hasRefractionValue({ sphere: 0, cylinder: null, axis: null })).toBe(true);
    expect(resolveRefractionEyeDescription('OD')).toBe('Right eye (OD)');
    expect(resolveRefractionEyeDescription('OS')).toBe('Left eye (OS)');
  });

  it('steps sphere, cylinder, axis, and nearAdd accurately without binary float drift', () => {
    expect(stepRefractionPart({ current: null, delta: 1, part: 'sphere' })).toBe(0.25);
    expect(stepRefractionPart({ current: null, delta: -1, part: 'sphere' })).toBe(-0.25);
    expect(stepRefractionPart({ current: -1.25, delta: 1, part: 'sphere' })).toBe(-1);
    expect(stepRefractionPart({ current: null, delta: 1, part: 'axis' })).toBe(1);
    expect(stepRefractionPart({ current: 180, delta: 1, part: 'axis' })).toBe(180);
    expect(stepRefractionPart({ current: 0, delta: -1, part: 'nearAdd' })).toBe(0);
    expect(stepRefractionPart({ current: -34, delta: 1, part: 'sphere' })).toBe(-30);
  });
});
