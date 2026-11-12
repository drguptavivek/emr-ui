import { describe, expect, it } from 'vitest';
import type {
  ClinicalFieldDefinition,
  ClinicalFieldState,
  EmrFieldDefinition,
  EmrFieldState,
  EmrValueType,
  EmrWidgetHint,
} from '@drguptavivek/emr-controller';
import {
  extractActiveMacroTrigger,
  isEmrFieldDefinition,
  isEmrFieldState,
  normalizeTypedFieldDefinition,
  normalizeTypedFieldState,
  resolveTypedFieldRenderer,
  typedFieldHasError,
  typedFieldHasMessage,
} from './typed-field.logic';

const CONTRACT_DEF: EmrFieldDefinition = {
  schemaVersion: '1.0',
  contract: {
    linkId: 'iop-od',
    valueType: 'scale',
    cardinality: { min: 1, max: 1 },
    terminology: [],
    validation: [],
    readOnly: false,
    defaultValue: 3,
  },
  presentation: {
    label: 'Pain score',
    hint: 'Ask patient directly',
    widget: 'vas',
    min: 0,
    max: 10,
    step: 1,
    anchors: { minLabel: 'No pain', maxLabel: 'Worst imaginable' },
  },
};

describe('typed-field.logic', () => {
  it('distinguishes and normalizes both ClinicalFieldDefinition and EmrFieldDefinition', () => {
    const legacyDef: ClinicalFieldDefinition = {
      id: 'chief',
      label: 'Chief complaint',
      type: 'multiline',
      required: true,
      rows: 5,
      hint: 'Patient words',
    };

    expect(isEmrFieldDefinition(legacyDef)).toBe(false);
    expect(isEmrFieldDefinition(CONTRACT_DEF)).toBe(true);

    const normLegacy = normalizeTypedFieldDefinition(legacyDef);
    expect(normLegacy.id).toBe('chief');
    expect(normLegacy.valueType).toBe('multiline');
    expect(normLegacy.required).toBe(true);
    expect(normLegacy.rows).toBe(5);

    const normContract = normalizeTypedFieldDefinition(CONTRACT_DEF);
    expect(normContract.id).toBe('iop-od');
    expect(normContract.valueType).toBe('scale');
    expect(normContract.widget).toBe('vas');
    expect(normContract.required).toBe(true);
    expect(normContract.defaultValue).toBe(3);
    expect(normContract.anchors?.maxLabel).toBe('Worst imaginable');
  });

  it('normalizes both ClinicalFieldState and EmrFieldState including messages and enabled state', () => {
    const legacyState: ClinicalFieldState = {
      value: 'blur',
      assessmentStatus: 'recorded',
      warning: 'Check onset',
    };
    expect(isEmrFieldState(legacyState)).toBe(false);
    const normLegacy = normalizeTypedFieldState(legacyState);
    expect(normLegacy.status).toBe('recorded');
    expect(normLegacy.warning).toBe('Check onset');
    expect(typedFieldHasError(normLegacy)).toBe(false);

    const contractState: EmrFieldState = {
      value: 8,
      status: 'recorded',
      enabled: false,
      messages: [
        { path: ['iop-od'], severity: 'warning', message: 'High score' },
        { path: ['iop-od'], severity: 'error', message: 'Confirm reading' },
      ],
    };
    expect(isEmrFieldState(contractState)).toBe(true);
    const normContract = normalizeTypedFieldState(contractState);
    expect(normContract.disabled).toBe(true);
    expect(normContract.error).toBe('Confirm reading');
    expect(normContract.warning).toBe('High score');
    expect(typedFieldHasError(normContract)).toBe(true);

    const fallbackState = normalizeTypedFieldState(undefined, 42);
    expect(fallbackState.value).toBe(42);
  });

  it('computes non-dangling message presence accurately', () => {
    const defNoHint = normalizeTypedFieldDefinition({
      id: 'f1',
      label: 'Field',
      type: 'text',
    });
    const cleanState = normalizeTypedFieldState({ value: 'ok' });
    expect(typedFieldHasMessage(defNoHint, cleanState)).toBe(false);

    const defWithHint = normalizeTypedFieldDefinition({
      id: 'f2',
      label: 'Field',
      type: 'text',
      hint: 'Helpful hint',
    });
    expect(typedFieldHasMessage(defWithHint, cleanState)).toBe(true);
  });

  it('dispatches all 17 EmrValueTypes and honours all 14 EmrWidgetHints', () => {
    const allTypes: readonly [EmrValueType, EmrWidgetHint | undefined, string][] = [
      ['text', undefined, 'text'],
      ['text', 'input', 'text'],
      ['text', 'textarea', 'textarea'],
      ['text', 'search', 'search'],
      ['text', 'signature', 'signature'],
      ['multiline', undefined, 'textarea'],
      ['integer', undefined, 'integer'],
      ['integer', 'stepper', 'stepper'],
      ['integer', 'likert', 'likert'],
      ['decimal', undefined, 'decimal'],
      ['decimal', 'stepper', 'stepper'],
      ['decimal', 'vas', 'vas'],
      ['boolean', undefined, 'boolean-checkbox'],
      ['boolean', 'toggle', 'boolean-toggle'],
      ['boolean', 'segmented', 'segmented'],
      ['boolean', 'radio', 'radio'],
      ['date', undefined, 'date'],
      ['time', undefined, 'time'],
      ['datetime', undefined, 'datetime'],
      ['partial-date', undefined, 'partial-date'],
      ['select', undefined, 'select'],
      ['select', 'select', 'select'],
      ['select', 'radio', 'radio'],
      ['select', 'segmented', 'segmented'],
      ['select', 'search-select', 'search-select'],
      ['select', 'chips', 'chips'],
      ['multiselect', undefined, 'multiselect'],
      ['multiselect', 'checkbox', 'checkbox-group'],
      ['multiselect', 'chips', 'chips'],
      ['quantity', undefined, 'quantity'],
      ['coded', undefined, 'coded'],
      ['coded', 'radio', 'radio'],
      ['coded', 'segmented', 'segmented'],
      ['coded', 'checkbox', 'checkbox-group'],
      ['scale', undefined, 'likert'],
      ['scale', 'likert', 'likert'],
      ['scale', 'vas', 'vas'],
      ['attachment', undefined, 'attachment'],
      ['annotation', undefined, 'annotation'],
      ['annotation', 'signature', 'signature'],
      ['custom', undefined, 'custom'],
    ];

    for (const [vt, widget, expected] of allTypes) {
      expect(resolveTypedFieldRenderer(vt, widget), `${vt} + ${widget}`).toBe(expected);
    }
  });

  it('extracts active dot and slash macro triggers before the cursor', () => {
    expect(extractActiveMacroTrigger('Cornea clear .sle', 17)).toBe('.sle');
    expect(extractActiveMacroTrigger('/fundus', 7)).toBe('/fundus');
    expect(extractActiveMacroTrigger('Normal exam.', 12)).toBeNull();
    expect(extractActiveMacroTrigger('6/6 unaided', 11)).toBeNull();
  });
});
