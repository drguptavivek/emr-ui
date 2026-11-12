import type {
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  ClinicalFormSection,
  ClinicalOption,
  EmrAttachmentRef,
  EmrCodedValue,
  EmrFieldDefinition,
  EmrFieldState,
  EmrPartialDate,
  EmrSignatureStroke,
  EmrTone,
  EmrTreeNode,
  EmrUploadedImageItem,
  EmrValidationMessage,
  EmrValueType,
  EmrWidgetHint,
} from '@drguptavivek/emr-controller';
import { isEmptyValue, toClinicalFieldDefinition } from '@drguptavivek/emr-controller';
import {
  computePrecisionStep,
  isQuantity,
  numberTextOf,
  parseNumberDraft,
  sanitizeNumberText,
} from './l1-inputs.logic';

export { computePrecisionStep, isQuantity, numberTextOf, parseNumberDraft, sanitizeNumberText };

export function textOf(value: ClinicalFieldValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

export function toggled(values: ClinicalFieldValue | undefined, value: string): string[] {
  const current = Array.isArray(values) ? (values as readonly string[]) : [];
  return current.includes(value) ? current.filter(v => v !== value) : [...current, value];
}

/** A hidden field is skipped only while empty: a hidden field that still holds a value is clinical data and stays visible. */
export function isFieldShown(state: { hidden?: boolean; value: ClinicalFieldValue } | undefined): boolean {
  return !state?.hidden || !isEmptyValue(state.value);
}

/**
 * A section is drawn while any block in it would show. Repeatable groups always count (they
 * carry the Add action); a matrix counts while any cell is shown.
 */
export function isSectionShown(
  section: ClinicalFormSection,
  fields: Readonly<Record<string, ClinicalFieldState | undefined>>,
): boolean {
  return section.blocks.some(block => {
    if (block.kind === 'repeatable') return true;
    if (block.kind === 'matrix') {
      return block.rows.some(row => Object.values(row.cells).some(cell => isFieldShown(fields[cell.id])));
    }
    return isFieldShown(fields[block.id]);
  });
}

// ---------------------------------------------------------------------------
// Unified EmrFieldDefinition / ClinicalFieldDefinition + State normalization
// ---------------------------------------------------------------------------

export function isEmrFieldDefinition(
  definition: ClinicalFieldDefinition | EmrFieldDefinition,
): definition is EmrFieldDefinition {
  return 'contract' in definition && 'presentation' in definition;
}

export function isEmrFieldState(
  state: ClinicalFieldState | EmrFieldState | undefined,
): state is EmrFieldState {
  return Boolean(state && 'messages' in state && 'enabled' in state);
}

export type ResolvedTypedWidgetKind =
  | 'text-input'
  | 'textarea'
  | 'search-input'
  | 'number-input'
  | 'numeric-stepper'
  | 'likert'
  | 'vas'
  | 'scale-field'
  | 'boolean-chip'
  | 'checkbox'
  | 'toggle'
  | 'boolean-segmented'
  | 'date'
  | 'time'
  | 'datetime'
  | 'partial-date'
  | 'select-dropdown'
  | 'select-chips'
  | 'radio-group'
  | 'segmented-control'
  | 'search-select'
  | 'multiselect-chips'
  | 'checkbox-group'
  | 'multiselect-search'
  | 'coded-input'
  | 'coded-choice'
  | 'attachment-field'
  | 'signature-capture'
  | 'tree-select'
  | 'combobox'
  | 'tag-input'
  | 'image-upload'
  | 'slider'
  | 'masked'
  | 'otp'
  | 'custom';

export interface NormalizedTypedField {
  readonly id: string;
  readonly label: string;
  readonly valueType: EmrValueType;
  readonly widget?: EmrWidgetHint;
  readonly dispatchKind: ResolvedTypedWidgetKind;
  readonly hint?: string;
  readonly instructions?: string;
  readonly placeholder?: string;
  readonly rows: number;
  readonly precision?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step: number;
  readonly unit?: string;
  readonly options: readonly ClinicalOption[];
  readonly treeNodes: readonly EmrTreeNode[];
  readonly mask?: string;
  readonly anchors?: {
    readonly minLabel?: string;
    readonly midLabel?: string;
    readonly maxLabel?: string;
  };
  readonly optionTones?: Readonly<Record<number, EmrTone>>;
  readonly statusOptions: readonly ClinicalAssessmentStatusOption[];
  readonly customRendererKey?: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly disabled: boolean;
  readonly value: ClinicalFieldValue | undefined;
  readonly status?: ClinicalAssessmentStatus;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages: readonly EmrValidationMessage[];
  readonly contractDefinition?: EmrFieldDefinition;
  readonly legacyDefinition: ClinicalFieldDefinition;
  readonly legacyState?: ClinicalFieldState;
}

export function resolveTypedFieldDispatch(
  valueType: EmrValueType,
  widget: EmrWidgetHint | undefined,
  optionCount: number,
  dropdownThreshold = 6,
): ResolvedTypedWidgetKind {
  if (valueType === 'custom' || valueType === 'annotation') {
    return widget === 'signature' ? 'signature-capture' : 'custom';
  }
  if (widget === 'signature') return 'signature-capture';
  if (widget === 'tree-select') return 'tree-select';
  if (widget === 'combobox') return 'combobox';
  if (widget === 'tag-input') return 'tag-input';
  if (widget === 'image-upload') return 'image-upload';
  if (widget === 'slider') return 'slider';
  if (widget === 'masked') return 'masked';
  if (widget === 'otp') return 'otp';

  switch (valueType) {
    case 'multiline':
      return 'textarea';
    case 'text':
      if (widget === 'textarea') return 'textarea';
      if (widget === 'search') return 'search-input';
      return 'text-input';
    case 'integer':
    case 'decimal':
    case 'quantity':
      if (widget === 'stepper') return 'numeric-stepper';
      if (widget === 'likert') return 'likert';
      if (widget === 'vas') return 'vas';
      return 'number-input';
    case 'boolean':
      if (widget === 'toggle') return 'toggle';
      if (widget === 'checkbox') return 'checkbox';
      if (widget === 'segmented') return 'boolean-segmented';
      return 'boolean-chip';
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'datetime':
      return 'datetime';
    case 'partial-date':
      return 'partial-date';
    case 'select':
      if (widget === 'segmented') return 'segmented-control';
      if (widget === 'radio') return 'radio-group';
      if (widget === 'search' || widget === 'search-select') return 'search-select';
      if (widget === 'chips') return 'select-chips';
      if (widget === 'select' || optionCount > dropdownThreshold) return 'select-dropdown';
      return 'select-chips';
    case 'multiselect':
      if (widget === 'checkbox') return 'checkbox-group';
      if (widget === 'search' || widget === 'search-select') return 'multiselect-search';
      return 'multiselect-chips';
    case 'coded':
      if (
        optionCount > 0 &&
        (widget === 'select' || widget === 'radio' || widget === 'segmented' || widget === 'chips')
      ) {
        return 'coded-choice';
      }
      return 'coded-input';
    case 'scale':
      return 'scale-field';
    case 'attachment':
      return 'attachment-field';
    default:
      return 'text-input';
  }
}

export function normalizeTypedField(
  definition: ClinicalFieldDefinition | EmrFieldDefinition,
  model?: ClinicalFieldState | EmrFieldState,
  readOnlyProp = false,
  dropdownThreshold = 6,
): NormalizedTypedField {
  const contractDef = isEmrFieldDefinition(definition) ? definition : undefined;
  const legacyDef: ClinicalFieldDefinition = isEmrFieldDefinition(definition)
    ? toClinicalFieldDefinition(definition)
    : definition;

  const valueType: EmrValueType = contractDef ? contractDef.contract.valueType : legacyDef.type;
  const widget: EmrWidgetHint | undefined = contractDef ? contractDef.presentation.widget : legacyDef.widget;
  const label = contractDef ? contractDef.presentation.label : legacyDef.label;
  const hint = contractDef ? contractDef.presentation.hint : legacyDef.hint;
  const instructions = contractDef?.presentation.instructions;
  const placeholder = contractDef ? contractDef.presentation.placeholder : legacyDef.placeholder;
  const rows = (contractDef ? contractDef.presentation.rows : legacyDef.rows) ?? 3;
  const precision = contractDef ? contractDef.presentation.precision : legacyDef.precision;
  const min = contractDef ? contractDef.presentation.min : legacyDef.min;
  const max = contractDef ? contractDef.presentation.max : legacyDef.max;
  const explicitStep = contractDef ? contractDef.presentation.step : legacyDef.step;
  const numericKind = valueType === 'integer' ? 'integer' : valueType === 'quantity' ? 'quantity' : 'decimal';
  const step = computePrecisionStep(numericKind, precision, explicitStep);
  const unit = contractDef
    ? (contractDef.presentation.unitDisplay ?? contractDef.contract.unit?.code)
    : legacyDef.unit;
  const options = (contractDef ? contractDef.presentation.options : legacyDef.options) ?? [];
  const treeNodes = contractDef?.presentation.treeNodes ?? [];
  const mask = contractDef?.presentation.mask;
  const anchors = contractDef?.presentation.anchors;
  const optionTones = contractDef?.presentation.optionTones;
  const statusOptions =
    (contractDef ? contractDef.presentation.assessmentStatusOptions : legacyDef.assessmentStatusOptions) ?? [];
  const customRendererKey = contractDef
    ? contractDef.presentation.customRendererKey
    : legacyDef.customRendererKey;

  const contractState = isEmrFieldState(model) ? model : undefined;
  const legacyState = !contractState ? (model as ClinicalFieldState | undefined) : undefined;

  const required =
    legacyState?.required ??
    (contractDef ? contractDef.contract.cardinality.min >= 1 : Boolean(legacyDef.required));
  const readOnly = Boolean(
    readOnlyProp ||
      (contractDef ? contractDef.contract.readOnly : false) ||
      legacyState?.readOnly,
  );
  const disabled = contractState ? !contractState.enabled : Boolean(legacyState?.disabled);

  const messages: readonly EmrValidationMessage[] = contractState ? contractState.messages : [];
  const firstError = legacyState?.error ?? messages.find(m => m.severity === 'error')?.message;
  const firstWarning = legacyState?.warning ?? messages.find(m => m.severity === 'warning')?.message;
  const firstInfo = messages.find(m => m.severity === 'info')?.message;
  const value = model?.value;
  const status = contractState ? contractState.status : legacyState?.assessmentStatus;

  const synthesizedLegacyState: ClinicalFieldState | undefined = model
    ? legacyState ?? {
        value: contractState!.value,
        assessmentStatus: contractState!.status,
        disabled: !contractState!.enabled,
        readOnly,
        required,
        error: firstError,
        warning: firstWarning,
      }
    : undefined;

  return {
    id: contractDef ? contractDef.contract.linkId : legacyDef.id,
    label,
    valueType,
    widget,
    dispatchKind: resolveTypedFieldDispatch(valueType, widget, options.length, dropdownThreshold),
    hint,
    instructions,
    placeholder,
    rows,
    precision,
    min,
    max,
    step,
    unit,
    options,
    treeNodes,
    mask,
    anchors,
    optionTones,
    statusOptions,
    customRendererKey,
    required,
    readOnly,
    disabled,
    value,
    status,
    error: firstError,
    warning: firstWarning,
    info: firstInfo,
    messages,
    contractDefinition: contractDef,
    legacyDefinition: legacyDef,
    legacyState: synthesizedLegacyState,
  };
}

export function coercePartialDate(value: ClinicalFieldValue | undefined): EmrPartialDate | null {
  if (!value) return null;
  if (typeof value === 'object' && !Array.isArray(value) && 'precision' in value && 'value' in value) {
    return value as EmrPartialDate;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}$/.test(trimmed)) return { value: trimmed, precision: 'year' };
    if (/^\d{4}-\d{2}$/.test(trimmed)) return { value: trimmed, precision: 'month' };
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { value: trimmed, precision: 'day' };
  }
  return null;
}

export function coerceCodedValues(value: ClinicalFieldValue | undefined): readonly EmrCodedValue[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is EmrCodedValue => typeof item === 'object' && item !== null && 'code' in item && 'system' in item);
  }
  if (typeof value === 'object' && 'code' in value && 'system' in value) {
    return [value as EmrCodedValue];
  }
  return [];
}

export function coerceAttachmentRefs(value: ClinicalFieldValue | undefined): readonly EmrAttachmentRef[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is EmrAttachmentRef => typeof item === 'object' && item !== null && 'id' in item && 'title' in item);
}

export function coerceUploadedImages(value: ClinicalFieldValue | undefined): readonly EmrUploadedImageItem[] {
  if (!Array.isArray(value)) return [];
  const out: EmrUploadedImageItem[] = [];
  for (const raw of value) {
    if (typeof raw === 'object' && raw !== null && 'id' in raw) {
      const rec = raw as Record<string, unknown>;
      if (typeof rec['src'] === 'string' && typeof rec['name'] === 'string') {
        out.push(raw as unknown as EmrUploadedImageItem);
      } else if (typeof rec['title'] === 'string') {
        const sizeBytes = rec['sizeBytes'];
        const url = rec['url'];
        const contentType = rec['contentType'];
        out.push({
          id: String(rec['id']),
          name: String(rec['title']),
          src: typeof url === 'string' ? url : '',
          mimeType: typeof contentType === 'string' ? contentType : 'image/jpeg',
          ...(typeof sizeBytes === 'number' ? { sizeBytes } : {}),
        });
      }
    }
  }
  return out;
}

export function coerceSignatureStrokes(value: ClinicalFieldValue | undefined): readonly EmrSignatureStroke[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is EmrSignatureStroke => typeof item === 'object' && item !== null && 'points' in item);
}
