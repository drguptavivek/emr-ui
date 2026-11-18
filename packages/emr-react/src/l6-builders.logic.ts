import type {
  ClinicalFieldValue,
  ClinicalOption,
  EmrScoreResult,
  EmrTone,
} from '@drguptavivek/emr-controller';
import {
  CURRENT_LOGIC_ENGINE_VERSION,
  FHIR_UNIT_EXTENSION_URL,
  buildVersionedLogicArtifact,
  collectConditionNodeFields,
  compileConditionNode,
  evaluateLogicRuleSandbox,
  evaluateScoreDefinition,
  fromFhirQuestionnaire,
  toFhirQuestionnaire,
  type ConditionGroupNode,
  type ConditionNode,
  type ConditionPredicateNode,
  type FhirCoding,
  type FhirFieldMappingRow,
  type FhirQuestionnaireItemType,
  type FhirQuestionnaireMapperViewModel,
  type FhirQuestionnaireVersion,
  type LogicRuleBuilderViewModel,
  type LogicRuleCombinator,
  type LogicRuleEffectKind,
  type LogicRuleOperator,
  type LogicSandboxEvaluation,
  type MissingItemPolicy,
  type ScoreBuilderViewModel,
  type ScoreDefinitionSchema,
  type ScoreItemDefinition,
  type ScoreThresholdBand,
  type VersionedLogicArtifact,
} from '@drguptavivek/emr-controller';

export {
  CURRENT_LOGIC_ENGINE_VERSION,
  FHIR_UNIT_EXTENSION_URL,
  buildVersionedLogicArtifact,
  collectConditionNodeFields,
  compileConditionNode,
  evaluateLogicRuleSandbox,
  evaluateScoreDefinition,
  fromFhirQuestionnaire,
  toFhirQuestionnaire,
};

export const LOGIC_RULE_OPERATOR_OPTIONS: readonly ClinicalOption[] = [
  { value: 'eq', label: '= Equals' },
  { value: 'neq', label: '≠ Not equal' },
  { value: 'gt', label: '> Greater than' },
  { value: 'gte', label: '≥ Greater or equal' },
  { value: 'lt', label: '< Less than' },
  { value: 'lte', label: '≤ Less or equal' },
  { value: 'in', label: '∈ In list' },
  { value: 'contains', label: '⊃ Contains' },
  { value: 'exists', label: '∃ Exists (non-empty)' },
  { value: 'empty', label: '∅ Is empty' },
];

export const LOGIC_COMBINATOR_OPTIONS: readonly { readonly value: LogicRuleCombinator; readonly label: string }[] = [
  { value: 'all', label: 'ALL (AND)' },
  { value: 'any', label: 'ANY (OR)' },
  { value: 'not', label: 'NOT (Negate)' },
];

export const LOGIC_EFFECT_OPTIONS: readonly ClinicalOption[] = [
  { value: 'enableWhen', label: 'enableWhen (Visibility)' },
  { value: 'requiredWhen', label: 'requiredWhen (Mandatory)' },
  { value: 'alert', label: 'Alert trigger (Clinical Banner)' },
];

export const MISSING_ITEM_POLICY_OPTIONS: readonly ClinicalOption[] = [
  { value: 'require-all', label: 'Require all items' },
  { value: 'prorate', label: 'Prorate from answered items' },
  { value: 'treat-as-zero', label: 'Treat missing as 0 points' },
];

export const SCORE_BAND_TONE_OPTIONS: readonly ClinicalOption[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
];

export const FHIR_ITEM_TYPE_OPTIONS: readonly ClinicalOption[] = [
  { value: 'group', label: 'group' },
  { value: 'display', label: 'display' },
  { value: 'boolean', label: 'boolean' },
  { value: 'decimal', label: 'decimal' },
  { value: 'integer', label: 'integer' },
  { value: 'date', label: 'date' },
  { value: 'dateTime', label: 'dateTime' },
  { value: 'time', label: 'time' },
  { value: 'string', label: 'string' },
  { value: 'text', label: 'text' },
  { value: 'url', label: 'url' },
  { value: 'choice', label: 'choice' },
  { value: 'open-choice', label: 'open-choice' },
  { value: 'coding', label: 'coding' },
  { value: 'attachment', label: 'attachment' },
  { value: 'reference', label: 'reference' },
  { value: 'quantity', label: 'quantity' },
];

/** Parses a free-text predicate or test value input into a typed scalar. */
export function parseScalarInput(raw: string): string | number | boolean | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const num = Number(trimmed);
  if (Number.isFinite(num)) return num;
  return raw;
}

/** Formats a predicate or test value for display inside a text control. */
export function formatScalarInput(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object' && 'value' in val) {
    return String((val as { value: unknown }).value ?? '');
  }
  return String(val);
}

/** Resolves the live sandbox evaluation for a LogicRuleBuilderViewModel. */
export function resolveLogicBuilderSandbox(model: LogicRuleBuilderViewModel): LogicSandboxEvaluation {
  if (model.evaluation) return model.evaluation;
  return evaluateLogicRuleSandbox(model.root, model.testValues);
}

/** Resolves the version-stamped VersionedLogicArtifact for a LogicRuleBuilderViewModel. */
export function resolveLogicBuilderArtifact(model: LogicRuleBuilderViewModel): VersionedLogicArtifact {
  if (model.exportedArtifact) return model.exportedArtifact;
  return buildVersionedLogicArtifact(model);
}

/** Resolves the live EmrScoreResult preview for a ScoreBuilderViewModel. */
export function resolveScoreBuilderPreview(model: ScoreBuilderViewModel): EmrScoreResult {
  if (model.previewResult) return model.previewResult;
  return evaluateScoreDefinition(model.definition, model.sampleAnswers);
}

/** Resolves the currently selected mapping row in EmrFhirQuestionnaireMapper. */
export function resolveSelectedFhirMappingRow(
  model: FhirQuestionnaireMapperViewModel,
): FhirFieldMappingRow | undefined {
  const targetId = model.selectedLinkId ?? model.rows[0]?.linkId;
  return model.rows.find(r => r.linkId === targetId);
}

/** Creates a new blank ConditionPredicateNode for the given default field ID. */
export function createBlankPredicateNode(id: string, defaultFieldId = ''): ConditionPredicateNode {
  return {
    kind: 'predicate',
    id,
    fieldId: defaultFieldId,
    operator: 'eq',
    value: '',
  };
}

/** Creates a new blank ConditionGroupNode. */
export function createBlankGroupNode(id: string, combinator: LogicRuleCombinator = 'all'): ConditionGroupNode {
  return {
    kind: 'group',
    id,
    combinator,
    children: [],
  };
}

/** Creates a new blank ScoreItemDefinition. */
export function createBlankScoreItem(index: number): ScoreItemDefinition {
  return {
    id: `score-item-${index}`,
    fieldId: `item_${index}`,
    label: `Score item ${index}`,
    weight: 1,
    required: true,
  };
}

/** Creates a new blank ScoreThresholdBand. */
export function createBlankScoreBand(index: number, minScore = 0, maxScore = 10, tone: EmrTone = 'neutral'): ScoreThresholdBand {
  return {
    id: `score-band-${index}`,
    minScore,
    maxScore,
    label: `Band ${index}`,
    tone,
  };
}

/** Builds a FHIR Coding object from code and display strings. */
export function buildLoincOrCustomCoding(code: string, display = '', system = 'http://loinc.org'): FhirCoding {
  const trimmedCode = code.trim();
  const trimmedDisplay = display.trim();
  return {
    system,
    code: trimmedCode,
    display: trimmedDisplay || trimmedCode,
  };
}

export type {
  ConditionGroupNode,
  ConditionNode,
  ConditionPredicateNode,
  FhirCoding,
  FhirFieldMappingRow,
  FhirQuestionnaireItemType,
  FhirQuestionnaireVersion,
  LogicRuleCombinator,
  LogicRuleEffectKind,
  LogicRuleOperator,
  LogicSandboxEvaluation,
  MissingItemPolicy,
  ScoreDefinitionSchema,
  ScoreItemDefinition,
  ScoreThresholdBand,
  VersionedLogicArtifact,
};
