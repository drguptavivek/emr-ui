import type {
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldType,
  ClinicalFieldValue,
  ClinicalOption,
  EmrFieldDefinition,
  EmrFieldState,
  EmrTone,
  EmrTreeNode,
  EmrValidationMessage,
  EmrValueType,
  EmrWidgetHint,
} from '@drguptavivek/emr-controller';

export interface NormalizedTypedFieldDefinition {
  readonly id: string;
  readonly label: string;
  readonly valueType: EmrValueType;
  readonly widget?: EmrWidgetHint;
  readonly placeholder: string;
  readonly hint?: string;
  readonly instructions?: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue?: ClinicalFieldValue;
  readonly unit?: string;
  readonly precision?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly rows: number;
  readonly anchors?: {
    readonly minLabel?: string;
    readonly midLabel?: string;
    readonly maxLabel?: string;
  };
  readonly optionTones?: Readonly<Record<number, EmrTone>>;
  readonly options: readonly ClinicalOption[];
  readonly treeNodes: readonly EmrTreeNode[];
  readonly mask?: string;
  readonly assessmentStatusOptions: readonly ClinicalAssessmentStatusOption[];
  readonly customRendererKey?: string;
  readonly legacyDefinition: ClinicalFieldDefinition;
}

export interface NormalizedTypedFieldState {
  readonly value: ClinicalFieldValue;
  readonly status?: ClinicalAssessmentStatus;
  readonly readOnly: boolean;
  readonly disabled: boolean;
  readonly requiredOverride?: boolean;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages: readonly EmrValidationMessage[];
  readonly legacyState?: ClinicalFieldState;
}

export type ResolvedTypedFieldRenderer =
  | 'text'
  | 'search'
  | 'textarea'
  | 'integer'
  | 'decimal'
  | 'stepper'
  | 'slider'
  | 'masked'
  | 'otp'
  | 'boolean-checkbox'
  | 'boolean-toggle'
  | 'date'
  | 'time'
  | 'datetime'
  | 'partial-date'
  | 'select'
  | 'radio'
  | 'segmented'
  | 'search-select'
  | 'combobox'
  | 'tree-select'
  | 'tag-input'
  | 'multiselect'
  | 'checkbox-group'
  | 'chips'
  | 'quantity'
  | 'coded'
  | 'likert'
  | 'vas'
  | 'attachment'
  | 'image-upload'
  | 'signature'
  | 'annotation'
  | 'custom';

export function isEmrFieldDefinition(
  definition: ClinicalFieldDefinition | EmrFieldDefinition,
): definition is EmrFieldDefinition {
  return 'schemaVersion' in definition && 'contract' in definition && 'presentation' in definition;
}

export function isEmrFieldState(
  state: ClinicalFieldState | EmrFieldState | undefined,
): state is EmrFieldState {
  return Boolean(state && 'messages' in state && 'enabled' in state);
}

function toLegacyFieldType(valueType: EmrValueType): ClinicalFieldType {
  switch (valueType) {
    case 'text':
    case 'multiline':
    case 'integer':
    case 'decimal':
    case 'date':
    case 'time':
    case 'datetime':
    case 'select':
    case 'multiselect':
    case 'boolean':
    case 'quantity':
    case 'custom':
      return valueType;
    default:
      return 'custom';
  }
}

export function normalizeTypedFieldDefinition(
  definition: ClinicalFieldDefinition | EmrFieldDefinition,
): NormalizedTypedFieldDefinition {
  if (isEmrFieldDefinition(definition)) {
    const { contract, presentation } = definition;
    const required = contract.cardinality.min >= 1;
    const unit = presentation.unitDisplay ?? contract.unit?.code;
    const legacyDefinition: ClinicalFieldDefinition = {
      kind: 'field',
      id: contract.linkId,
      label: presentation.label,
      type: toLegacyFieldType(contract.valueType),
      widget: presentation.widget,
      span: presentation.span,
      placeholder: presentation.placeholder,
      hint: presentation.hint,
      required,
      unit,
      precision: presentation.precision,
      min: presentation.min,
      max: presentation.max,
      step: presentation.step,
      rows: presentation.rows,
      options: presentation.options,
      assessmentStatusOptions: presentation.assessmentStatusOptions,
      customRendererKey: presentation.customRendererKey,
    };
    return {
      id: contract.linkId,
      label: presentation.label,
      valueType: contract.valueType,
      widget: presentation.widget,
      placeholder: presentation.placeholder ?? '',
      hint: presentation.hint,
      instructions: presentation.instructions,
      required,
      readOnly: Boolean(contract.readOnly),
      defaultValue: contract.defaultValue,
      unit,
      precision: presentation.precision,
      min: presentation.min,
      max: presentation.max,
      step: presentation.step,
      rows: presentation.rows ?? 3,
      anchors: presentation.anchors,
      optionTones: presentation.optionTones,
      options: presentation.options ?? [],
      treeNodes: presentation.treeNodes ?? [],
      mask: presentation.mask,
      assessmentStatusOptions: presentation.assessmentStatusOptions ?? [],
      customRendererKey: presentation.customRendererKey,
      legacyDefinition,
    };
  }

  return {
    id: definition.id,
    label: definition.label,
    valueType: definition.type,
    widget: definition.widget,
    placeholder: definition.placeholder ?? '',
    hint: definition.hint,
    required: Boolean(definition.required),
    readOnly: false,
    unit: definition.unit,
    precision: definition.precision,
    min: definition.min,
    max: definition.max,
    step: definition.step,
    rows: definition.rows ?? 3,
    options: definition.options ?? [],
    treeNodes: [],
    assessmentStatusOptions: definition.assessmentStatusOptions ?? [],
    customRendererKey: definition.customRendererKey,
    legacyDefinition: definition,
  };
}

export function normalizeTypedFieldState(
  state: ClinicalFieldState | EmrFieldState | undefined,
  defaultValue: ClinicalFieldValue = null,
): NormalizedTypedFieldState {
  if (!state) {
    return {
      value: defaultValue ?? null,
      readOnly: false,
      disabled: false,
      messages: [],
    };
  }

  if (isEmrFieldState(state)) {
    const errorMsg = state.messages.find((m) => m.severity === 'error')?.message;
    const warningMsg = state.messages.find((m) => m.severity === 'warning')?.message;
    const infoMsg = state.messages.find((m) => m.severity === 'info')?.message;
    const disabled = !state.enabled;
    return {
      value: state.value,
      status: state.status,
      readOnly: false,
      disabled,
      error: errorMsg,
      warning: warningMsg,
      info: infoMsg,
      messages: state.messages,
      legacyState: {
        value: state.value,
        assessmentStatus: state.status,
        disabled,
        error: errorMsg,
        warning: warningMsg,
      },
    };
  }

  return {
    value: state.value,
    status: state.assessmentStatus,
    readOnly: Boolean(state.readOnly),
    disabled: Boolean(state.disabled),
    requiredOverride: state.required,
    error: state.error,
    warning: state.warning,
    messages: [],
    legacyState: state,
  };
}

export function resolveTypedFieldRenderer(
  valueType: EmrValueType,
  widget?: EmrWidgetHint,
): ResolvedTypedFieldRenderer {
  if (widget === 'tree-select') return 'tree-select';
  if (widget === 'combobox') return 'combobox';
  if (widget === 'tag-input') return 'tag-input';
  if (widget === 'image-upload') return 'image-upload';
  if (widget === 'slider') return 'slider';
  if (widget === 'masked') return 'masked';
  if (widget === 'otp') return 'otp';

  switch (valueType) {
    case 'custom':
      return 'custom';
    case 'annotation':
      return widget === 'signature' ? 'signature' : 'annotation';
    case 'attachment':
      return 'attachment';
    case 'partial-date':
      return 'partial-date';
    case 'scale':
      return widget === 'vas' ? 'vas' : 'likert';
    case 'coded':
      if (widget === 'radio') return 'radio';
      if (widget === 'segmented') return 'segmented';
      if (widget === 'select') return 'select';
      if (widget === 'checkbox') return 'checkbox-group';
      if (widget === 'chips') return 'chips';
      return 'coded';
    case 'quantity':
      return 'quantity';
    case 'boolean':
      if (widget === 'toggle') return 'boolean-toggle';
      if (widget === 'segmented') return 'segmented';
      if (widget === 'radio') return 'radio';
      return 'boolean-checkbox';
    case 'multiselect':
      if (widget === 'checkbox') return 'checkbox-group';
      if (widget === 'chips') return 'chips';
      return 'multiselect';
    case 'select':
      if (widget === 'radio') return 'radio';
      if (widget === 'segmented') return 'segmented';
      if (widget === 'search-select' || widget === 'search') return 'search-select';
      if (widget === 'chips') return 'chips';
      return 'select';
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'datetime':
      return 'datetime';
    case 'integer':
      if (widget === 'stepper') return 'stepper';
      if (widget === 'likert') return 'likert';
      if (widget === 'vas') return 'vas';
      return 'integer';
    case 'decimal':
      if (widget === 'stepper') return 'stepper';
      if (widget === 'vas') return 'vas';
      if (widget === 'likert') return 'likert';
      return 'decimal';
    case 'multiline':
      return 'textarea';
    case 'text':
    default:
      if (widget === 'textarea') return 'textarea';
      if (widget === 'search') return 'search';
      if (widget === 'signature') return 'signature';
      return 'text';
  }
}

export function typedFieldHasMessage(
  definition: NormalizedTypedFieldDefinition,
  state: NormalizedTypedFieldState,
): boolean {
  return Boolean(
    definition.hint ||
      state.error ||
      state.warning ||
      state.info ||
      state.messages.length > 0,
  );
}

export function typedFieldHasError(state: NormalizedTypedFieldState): boolean {
  return Boolean(state.error || state.messages.some((m) => m.severity === 'error'));
}

/** Extracts a trailing `.phrase` or `/phrase` macro trigger immediately before cursor. */
export function extractActiveMacroTrigger(text: string, cursorIndex: number): string | null {
  const safeCursor = Math.max(0, Math.min(text.length, cursorIndex));
  const prefix = text.slice(0, safeCursor);
  const match = /(?:^|\s)([./][A-Za-z0-9_-]*)$/.exec(prefix);
  return match ? match[1] : null;
}
