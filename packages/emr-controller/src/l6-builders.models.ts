import type {
  ClinicalFieldDefinition,
  ClinicalFieldType,
  ClinicalFieldValue,
  ClinicalFormBlock,
  ClinicalFormSchema,
  ClinicalFormSection,
} from './clinical-form.models.js';
import { evalCondition } from './condition.evaluate.js';
import type { CmpOp, EmrCondition, EmrExpr } from './condition.models.js';
import { references } from './condition.models.js';
import { EMR_ENGINE_VERSION } from './engine-version.js';
import { fromClinicalFieldDefinition, toClinicalFieldDefinition } from './field-contract.adapters.js';
import type {
  EmrCardinality,
  EmrCodedValue,
  EmrFieldContract,
  EmrFieldDefinition,
  EmrFieldPresentation,
  EmrUnitBinding,
  EmrValueType,
} from './field-contract.models.js';
import type { FieldValidationRule } from './field-generator.models.js';
import { isEmptyValue } from './form-logic.js';
import type { ClinicalOption, EmrTone } from './models.js';
import type { EmrScoreResult } from './scoring.models.js';
import type { TerminologyBinding, TerminologyConcept } from './terminology.models.js';
import type { EmrEnableWhen } from './validation.models.js';

// ─────────────────────────────────────────────────────────────────────────────
// 1. L6 Visual Authoring Builder: EmrLogicRuleBuilder
// ─────────────────────────────────────────────────────────────────────────────

/** Current logic engine version stamp attached to authored logic artifacts. */
export const CURRENT_LOGIC_ENGINE_VERSION = EMR_ENGINE_VERSION;

/** Operators supported by visual authoring predicate rows. */
export type LogicRuleOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'contains'
  | 'exists'
  | 'empty';

/** Boolean combinators supported by visual authoring condition groups. */
export type LogicRuleCombinator = 'all' | 'any' | 'not';

/** Leaf predicate row inside a visual ConditionNode tree. */
export interface ConditionPredicateNode {
  readonly kind: 'predicate';
  readonly id: string;
  readonly fieldId: string;
  readonly operator: LogicRuleOperator;
  readonly value: string | number | boolean | readonly string[] | null;
}

/** Boolean group node ('all' | 'any' | 'not') inside a visual ConditionNode tree. */
export interface ConditionGroupNode {
  readonly kind: 'group';
  readonly id: string;
  readonly combinator: LogicRuleCombinator;
  readonly children: readonly ConditionNode[];
}

/** Visual authoring tree representation of a clinical condition rule. */
export type ConditionNode = ConditionGroupNode | ConditionPredicateNode;

/** Target effect triggered when a logic rule evaluates to true. */
export type LogicRuleEffectKind = 'enableWhen' | 'requiredWhen' | 'alert';

/** Target action configuration for an authored logic rule. */
export interface LogicRuleTargetAction {
  readonly effect: LogicRuleEffectKind;
  readonly targetFieldId: string;
  /** Optional clinical alert banner or constraint message when effect === 'alert'. */
  readonly alertMessage?: string;
  readonly alertTone?: EmrTone;
}

/** Version-stamped logic rule artifact produced by EmrLogicRuleBuilder. */
export interface VersionedLogicArtifact {
  readonly schemaVersion: '1.0';
  readonly engineVersion: number;
  readonly ruleId: string;
  readonly label: string;
  readonly description?: string;
  readonly root: ConditionNode;
  readonly compiledCondition: EmrCondition;
  readonly target: LogicRuleTargetAction;
}

/** Tri-state sandbox evaluation outcome for a ConditionNode against sample values. */
export type LogicSandboxOutcome = 'true' | 'false' | 'indeterminate';

/** Result of evaluating a ConditionNode in the live authoring sandbox. */
export interface LogicSandboxEvaluation {
  readonly outcome: LogicSandboxOutcome;
  readonly referencedFields: readonly string[];
  readonly missingFields: readonly string[];
  readonly summary: string;
}

/** Field catalog option available in the logic rule builder. */
export interface LogicBuilderFieldOption {
  readonly id: string;
  readonly label: string;
  readonly valueType?: EmrValueType | ClinicalFieldType;
  readonly options?: readonly ClinicalOption[];
}

/** Controlled ViewModel for EmrLogicRuleBuilder. */
export interface LogicRuleBuilderViewModel {
  readonly ruleId: string;
  readonly label: string;
  readonly description?: string;
  readonly engineVersion?: number;
  readonly root: ConditionNode;
  readonly target: LogicRuleTargetAction;
  readonly availableFields: readonly LogicBuilderFieldOption[];
  readonly testValues: Readonly<Record<string, ClinicalFieldValue>>;
  readonly evaluation?: LogicSandboxEvaluation;
  readonly exportedArtifact?: VersionedLogicArtifact;
  readonly dirty?: boolean;
  readonly saving?: boolean;
  readonly readOnly?: boolean;
  readonly error?: string;
}

/** Intents emitted by EmrLogicRuleBuilder. */
export type LogicRuleBuilderIntent =
  | { type: 'ruleMetaPatched'; label?: string; description?: string }
  | { type: 'combinatorChanged'; groupId: string; combinator: LogicRuleCombinator }
  | { type: 'predicateAdded'; parentGroupId: string; predicate: ConditionPredicateNode }
  | { type: 'groupAdded'; parentGroupId: string; group: ConditionGroupNode }
  | { type: 'nodeRemoved'; nodeId: string }
  | {
      type: 'predicateUpdated';
      predicateId: string;
      changes: Partial<Pick<ConditionPredicateNode, 'fieldId' | 'operator' | 'value'>>;
    }
  | { type: 'targetChanged'; target: LogicRuleTargetAction }
  | { type: 'testValueChanged'; fieldId: string; value: ClinicalFieldValue }
  | { type: 'artifactSaved'; artifact: VersionedLogicArtifact }
  | { type: 'artifactExportRequested'; artifact: VersionedLogicArtifact };

const OPERATOR_TO_CMP: Readonly<Partial<Record<LogicRuleOperator, CmpOp>>> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
};

function scalarExpr(val: ConditionPredicateNode['value']): EmrExpr {
  if (Array.isArray(val)) {
    return { value: val.join(' ') };
  }
  return { value: (val ?? '') as string | number | boolean | null };
}

/** Compiles a visual ConditionNode into an executable EmrCondition tree. */
export function compileConditionNode(node: ConditionNode): EmrCondition {
  if (node.kind === 'group') {
    const compiledChildren = node.children.map(compileConditionNode);
    if (node.combinator === 'not') {
      const inner: EmrCondition =
        compiledChildren.length === 0
          ? { all: [] }
          : compiledChildren.length === 1
            ? compiledChildren[0]!
            : { all: compiledChildren };
      return { not: inner };
    }
    if (node.combinator === 'any') {
      return { any: compiledChildren };
    }
    return { all: compiledChildren };
  }

  const pathExpr: EmrExpr = { path: node.fieldId };
  const cmpOp = OPERATOR_TO_CMP[node.operator];
  if (cmpOp) {
    return { op: cmpOp, left: pathExpr, right: scalarExpr(node.value) };
  }

  switch (node.operator) {
    case 'exists':
      return { op: '!=', left: pathExpr, right: { value: '' } };
    case 'empty':
      return { op: '=', left: pathExpr, right: { value: '' } };
    case 'contains':
      return { fn: 'includesValue', args: [pathExpr, scalarExpr(node.value)] };
    case 'in': {
      const items = Array.isArray(node.value)
        ? node.value
        : typeof node.value === 'string'
          ? node.value
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : node.value !== null && node.value !== undefined
            ? [String(node.value)]
            : [];
      if (items.length === 0) return { any: [] };
      return {
        any: items.map(item => ({
          op: '=' as const,
          left: pathExpr,
          right: { value: item },
        })),
      };
    }
    default:
      return { op: '=', left: pathExpr, right: scalarExpr(node.value) };
  }
}

/** Collects all fieldIds referenced by a visual ConditionNode tree. */
export function collectConditionNodeFields(node: ConditionNode, out = new Set<string>()): Set<string> {
  if (node.kind === 'predicate') {
    if (node.fieldId.trim()) out.add(node.fieldId.trim());
    return out;
  }
  for (const child of node.children) {
    collectConditionNodeFields(child, out);
  }
  return out;
}

function evalPredicateTriState(
  pred: ConditionPredicateNode,
  testValues: Readonly<Record<string, ClinicalFieldValue>>,
): LogicSandboxOutcome {
  const fieldId = pred.fieldId.trim();
  if (!fieldId) return 'indeterminate';
  const raw = testValues[fieldId];

  if (pred.operator === 'exists') {
    return !isEmptyValue(raw) ? 'true' : 'false';
  }
  if (pred.operator === 'empty') {
    return isEmptyValue(raw) ? 'true' : 'false';
  }

  if (isEmptyValue(raw)) {
    return 'indeterminate';
  }

  const compiled = compileConditionNode(pred);
  const normalizedValues: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(testValues)) {
    if (v && typeof v === 'object' && 'value' in v && 'unit' in v) {
      normalizedValues[k] = (v as { value: unknown }).value;
    } else if (v && typeof v === 'object' && 'code' in v) {
      normalizedValues[k] = (v as { code: string }).code;
    } else {
      normalizedValues[k] = v;
    }
  }
  return evalCondition(compiled, normalizedValues) ? 'true' : 'false';
}

function evalNodeTriState(
  node: ConditionNode,
  testValues: Readonly<Record<string, ClinicalFieldValue>>,
): LogicSandboxOutcome {
  if (node.kind === 'predicate') {
    return evalPredicateTriState(node, testValues);
  }

  const outcomes = node.children.map(child => evalNodeTriState(child, testValues));
  if (node.combinator === 'all') {
    if (outcomes.length === 0) return 'true';
    if (outcomes.includes('false')) return 'false';
    if (outcomes.includes('indeterminate')) return 'indeterminate';
    return 'true';
  }
  if (node.combinator === 'any') {
    if (outcomes.length === 0) return 'false';
    if (outcomes.includes('true')) return 'true';
    if (outcomes.includes('indeterminate')) return 'indeterminate';
    return 'false';
  }
  // 'not'
  const innerOutcome: LogicSandboxOutcome =
    outcomes.length === 0
      ? 'true'
      : outcomes.includes('false')
        ? 'false'
        : outcomes.includes('indeterminate')
          ? 'indeterminate'
          : 'true';
  if (innerOutcome === 'indeterminate') return 'indeterminate';
  return innerOutcome === 'true' ? 'false' : 'true';
}

/**
 * Evaluates a ConditionNode against sample test values in the authoring sandbox,
 * returning `'true'`, `'false'`, or `'indeterminate'` (when referenced fields lack values).
 */
export function evaluateLogicRuleSandbox(
  root: ConditionNode,
  testValues: Readonly<Record<string, ClinicalFieldValue>>,
): LogicSandboxEvaluation {
  const referencedFields = [...collectConditionNodeFields(root)];
  const missingFields = referencedFields.filter(fieldId => isEmptyValue(testValues[fieldId]));
  const outcome = evalNodeTriState(root, testValues);
  const summary =
    outcome === 'true'
      ? 'Rule evaluates to TRUE'
      : outcome === 'false'
        ? 'Rule evaluates to FALSE'
        : `Rule is INDETERMINATE (${missingFields.length ? `missing: ${missingFields.join(', ')}` : 'incomplete predicate'})`;

  return {
    outcome,
    referencedFields,
    missingFields,
    summary,
  };
}

/** Builds a version-stamped VersionedLogicArtifact from the current LogicRuleBuilderViewModel. */
export function buildVersionedLogicArtifact(
  model: Pick<LogicRuleBuilderViewModel, 'ruleId' | 'label' | 'description' | 'root' | 'target' | 'engineVersion'>,
): VersionedLogicArtifact {
  const compiledCondition = compileConditionNode(model.root);
  // Touch references() so dependency extraction is validated at build time
  references(compiledCondition);
  return {
    schemaVersion: '1.0',
    engineVersion: model.engineVersion ?? CURRENT_LOGIC_ENGINE_VERSION,
    ruleId: model.ruleId || 'logic-rule',
    label: model.label || 'Untitled logic rule',
    ...(model.description ? { description: model.description } : {}),
    root: model.root,
    compiledCondition,
    target: model.target,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. L6 Visual Authoring Builder: EmrScoreBuilder
// ─────────────────────────────────────────────────────────────────────────────

/** Policy for handling missing item answers when computing a clinical score. */
export type MissingItemPolicy = 'require-all' | 'prorate' | 'treat-as-zero';

/** Weighted item definition inside a clinical score / PRO instrument. */
export interface ScoreItemDefinition {
  readonly id: string;
  readonly fieldId: string;
  readonly label: string;
  readonly weight: number;
  readonly required: boolean;
  /** Maps coded/choice option values (e.g. 'not-at-all', 'nearly-every-day') to numeric points. */
  readonly optionPoints?: Readonly<Record<string, number>>;
  readonly minPoints?: number;
  readonly maxPoints?: number;
}

/** Interpretation threshold band mapping a numeric score range to a label, tone, and clinical guidance. */
export interface ScoreThresholdBand {
  readonly id: string;
  readonly minScore: number;
  readonly maxScore: number;
  readonly label: string;
  readonly tone: EmrTone;
  readonly clinicalGuidance?: string;
}

/** Version-stamped clinical score / PRO algorithm definition authored in EmrScoreBuilder. */
export interface ScoreDefinitionSchema {
  readonly schemaVersion: '1.0';
  readonly engineVersion: number;
  readonly instrumentId: string;
  readonly title: string;
  readonly description?: string;
  readonly versionStamp: string;
  readonly missingItemPolicy: MissingItemPolicy;
  readonly items: readonly ScoreItemDefinition[];
  readonly bands: readonly ScoreThresholdBand[];
}

/** Controlled ViewModel for EmrScoreBuilder. */
export interface ScoreBuilderViewModel {
  readonly definition: ScoreDefinitionSchema;
  readonly sampleAnswers: Readonly<Record<string, ClinicalFieldValue>>;
  readonly previewResult?: EmrScoreResult;
  readonly dirty?: boolean;
  readonly saving?: boolean;
  readonly readOnly?: boolean;
  readonly error?: string;
}

/** Intents emitted by EmrScoreBuilder. */
export type ScoreBuilderIntent =
  | {
      type: 'scoreMetaPatched';
      changes: Partial<Pick<ScoreDefinitionSchema, 'instrumentId' | 'title' | 'description' | 'versionStamp'>>;
    }
  | { type: 'missingPolicyChanged'; policy: MissingItemPolicy }
  | { type: 'scoreItemAdded'; item: ScoreItemDefinition }
  | { type: 'scoreItemUpdated'; itemId: string; changes: Partial<ScoreItemDefinition> }
  | { type: 'scoreItemRemoved'; itemId: string }
  | { type: 'scoreBandAdded'; band: ScoreThresholdBand }
  | { type: 'scoreBandUpdated'; bandId: string; changes: Partial<ScoreThresholdBand> }
  | { type: 'scoreBandRemoved'; bandId: string }
  | { type: 'sampleAnswerChanged'; fieldId: string; value: ClinicalFieldValue }
  | { type: 'scoreDefinitionSaved'; definition: ScoreDefinitionSchema };

function resolveItemRawPoints(item: ScoreItemDefinition, answer: ClinicalFieldValue | undefined): number | null {
  if (isEmptyValue(answer)) return null;
  if (typeof answer === 'number') {
    return Number.isFinite(answer) ? answer : null;
  }
  if (typeof answer === 'boolean') {
    if (item.optionPoints && String(answer) in item.optionPoints) {
      return item.optionPoints[String(answer)]!;
    }
    return answer ? 1 : 0;
  }
  if (typeof answer === 'string') {
    const trimmed = answer.trim();
    if (!trimmed) return null;
    if (item.optionPoints && trimmed in item.optionPoints) {
      return item.optionPoints[trimmed]!;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (answer && typeof answer === 'object' && 'code' in answer) {
    const code = (answer as EmrCodedValue).code;
    if (item.optionPoints && code in item.optionPoints) {
      return item.optionPoints[code]!;
    }
    const parsed = Number(code);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (answer && typeof answer === 'object' && 'value' in answer && 'unit' in answer) {
    const v = (answer as { value: number | null }).value;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  return null;
}

/**
 * Pure controller helper evaluating a `ScoreDefinitionSchema` against sample item answers
 * into a presentation-ready `EmrScoreResult`.
 */
export function evaluateScoreDefinition(
  definition: ScoreDefinitionSchema,
  answers: Readonly<Record<string, ClinicalFieldValue>>,
): EmrScoreResult {
  const missingItems: string[] = [];
  const components: { id: string; label: string; value: number }[] = [];
  let answeredSum = 0;
  let answeredWeightSum = 0;
  let totalWeightSum = 0;
  let answeredCount = 0;

  for (const item of definition.items) {
    const weight = Number.isFinite(item.weight) ? item.weight : 1;
    totalWeightSum += weight;
    const rawPoints = resolveItemRawPoints(item, answers[item.fieldId]);
    if (rawPoints === null) {
      missingItems.push(item.fieldId);
      if (definition.missingItemPolicy === 'treat-as-zero') {
        components.push({ id: item.id, label: item.label, value: 0 });
      }
    } else {
      const weighted = Math.round(rawPoints * weight * 100) / 100;
      answeredSum += weighted;
      answeredWeightSum += weight;
      answeredCount += 1;
      components.push({ id: item.id, label: item.label, value: weighted });
    }
  }

  const totalItems = definition.items.length;
  const completenessLabel = `${answeredCount}/${totalItems} items complete`;
  const hasMissingRequired = definition.items.some(
    item => item.required && missingItems.includes(item.fieldId),
  );

  if (
    definition.missingItemPolicy === 'require-all' &&
    (missingItems.length > 0 || hasMissingRequired)
  ) {
    return {
      total: Math.round(answeredSum * 100) / 100,
      bandLabel: 'Incomplete — required items missing',
      bandTone: 'neutral',
      components,
      missingItems,
      completenessLabel,
      interpretation: `Complete all required items (${missingItems.join(', ')}) to calculate the final score.`,
      provenance: `${definition.instrumentId} (${definition.versionStamp})`,
    };
  }

  let finalTotal = answeredSum;
  if (
    definition.missingItemPolicy === 'prorate' &&
    missingItems.length > 0 &&
    answeredWeightSum > 0 &&
    totalWeightSum > 0
  ) {
    finalTotal = (answeredSum * totalWeightSum) / answeredWeightSum;
  }
  finalTotal = Math.round(finalTotal * 100) / 100;

  const matchedBand = definition.bands.find(
    band => finalTotal >= band.minScore && finalTotal <= band.maxScore,
  );

  return {
    total: finalTotal,
    bandLabel: matchedBand?.label ?? 'Unclassified score',
    bandTone: matchedBand?.tone ?? 'neutral',
    components,
    missingItems,
    completenessLabel,
    ...(matchedBand?.clinicalGuidance ? { interpretation: matchedBand.clinicalGuidance } : {}),
    provenance: `${definition.instrumentId} (${definition.versionStamp})`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. L6 Visual Authoring Builder: EmrFhirQuestionnaireMapper
// ─────────────────────────────────────────────────────────────────────────────

/** Supported FHIR Questionnaire versions in EmrFhirQuestionnaireMapper. */
export type FhirQuestionnaireVersion = 'R4' | 'R5';

/** FHIR Questionnaire item type across R4 and R5. */
export type FhirQuestionnaireItemType =
  | 'group'
  | 'display'
  | 'boolean'
  | 'decimal'
  | 'integer'
  | 'date'
  | 'dateTime'
  | 'time'
  | 'string'
  | 'text'
  | 'url'
  | 'choice'
  | 'open-choice'
  | 'coding'
  | 'attachment'
  | 'reference'
  | 'quantity';

/** FHIR Coding structure for Questionnaire.item.code and answerOption.valueCoding. */
export interface FhirCoding {
  readonly system?: string;
  readonly version?: string;
  readonly code: string;
  readonly display?: string;
}

/** FHIR Extension structure (e.g. for questionnaire-unit UCUM bindings). */
export interface FhirExtension {
  readonly url: string;
  readonly valueCoding?: FhirCoding;
  readonly valueString?: string;
}

/** FHIR Questionnaire.item.answerOption entry. */
export interface FhirQuestionnaireAnswerOption {
  readonly valueCoding?: FhirCoding;
  readonly valueString?: string;
  readonly valueInteger?: number;
}

/** FHIR Questionnaire.item.enableWhen entry. */
export interface FhirQuestionnaireEnableWhen {
  readonly question: string;
  readonly operator: 'exists' | '=' | '!=' | '>' | '<' | '>=' | '<=';
  readonly answerBoolean?: boolean;
  readonly answerDecimal?: number;
  readonly answerInteger?: number;
  readonly answerDate?: string;
  readonly answerString?: string;
  readonly answerCoding?: FhirCoding;
}

/** FHIR Questionnaire.item.initial entry. */
export interface FhirQuestionnaireInitial {
  readonly valueBoolean?: boolean;
  readonly valueDecimal?: number;
  readonly valueInteger?: number;
  readonly valueDate?: string;
  readonly valueString?: string;
  readonly valueCoding?: FhirCoding;
  readonly valueQuantity?: {
    readonly value?: number;
    readonly unit?: string;
    readonly system?: string;
    readonly code?: string;
  };
}

/** FHIR R4 / R5 Questionnaire.item resource node. */
export interface FhirQuestionnaireItem {
  readonly linkId: string;
  readonly type: FhirQuestionnaireItemType;
  readonly text?: string;
  readonly required?: boolean;
  readonly repeats?: boolean;
  readonly readOnly?: boolean;
  readonly maxLength?: number;
  readonly code?: readonly FhirCoding[];
  readonly answerValueSet?: string;
  /** R5 uses `answerConstraint` ('optionsOnly' | 'optionsOrType' | 'optionsOrString') instead of `open-choice`. */
  readonly answerConstraint?: 'optionsOnly' | 'optionsOrType' | 'optionsOrString';
  readonly answerOption?: readonly FhirQuestionnaireAnswerOption[];
  readonly enableWhen?: readonly FhirQuestionnaireEnableWhen[];
  readonly enableBehavior?: 'all' | 'any';
  readonly initial?: readonly FhirQuestionnaireInitial[];
  readonly extension?: readonly FhirExtension[];
  readonly item?: readonly FhirQuestionnaireItem[];
}

/** FHIR R4 / R5 Questionnaire resource representation. */
export interface FhirQuestionnaireResource {
  readonly resourceType: 'Questionnaire';
  readonly id: string;
  readonly url?: string;
  readonly version?: string;
  readonly title?: string;
  readonly description?: string;
  readonly status: 'draft' | 'active' | 'retired' | 'unknown';
  readonly fhirVersion?: '4.0.1' | '5.0.0';
  readonly item: readonly FhirQuestionnaireItem[];
}

/** Round-trip fidelity warning or diagnostic produced during FHIR Questionnaire mapping. */
export interface FhirMappingDiagnostic {
  readonly severity: 'info' | 'warning' | 'error';
  readonly code: string;
  readonly linkId?: string;
  readonly message: string;
}

/** Side-by-side field mapping row connecting an EMR field contract to its FHIR Questionnaire.item. */
export interface FhirFieldMappingRow {
  readonly linkId: string;
  readonly sectionId?: string;
  readonly label: string;
  readonly emrValueType: EmrValueType;
  readonly fhirItemType: FhirQuestionnaireItemType;
  readonly required: boolean;
  readonly repeats: boolean;
  readonly terminologyCodes: readonly FhirCoding[];
  readonly answerValueSet?: string;
  readonly ucumUnit?: EmrUnitBinding;
  readonly enableWhenCount: number;
  readonly hasInitialValue: boolean;
  readonly warnings: readonly string[];
}

/** Output of `toFhirQuestionnaire` including the FHIR resource, side-by-side rows, and diagnostics. */
export interface FhirQuestionnaireExportResult {
  readonly fhirVersion: FhirQuestionnaireVersion;
  readonly questionnaire: FhirQuestionnaireResource;
  readonly rows: readonly FhirFieldMappingRow[];
  readonly diagnostics: readonly FhirMappingDiagnostic[];
}

/** Output of `fromFhirQuestionnaire` including the reconstructed schema, field definitions, and diagnostics. */
export interface FhirQuestionnaireImportResult {
  readonly detectedFhirVersion: FhirQuestionnaireVersion;
  readonly schema: ClinicalFormSchema;
  readonly fields: readonly EmrFieldDefinition[];
  readonly rows: readonly FhirFieldMappingRow[];
  readonly diagnostics: readonly FhirMappingDiagnostic[];
}

/** Controlled ViewModel for EmrFhirQuestionnaireMapper. */
export interface FhirQuestionnaireMapperViewModel {
  readonly fhirVersion: FhirQuestionnaireVersion;
  readonly schema: ClinicalFormSchema;
  readonly fields?: readonly EmrFieldDefinition[];
  readonly questionnaire: FhirQuestionnaireResource;
  readonly rows: readonly FhirFieldMappingRow[];
  readonly diagnostics: readonly FhirMappingDiagnostic[];
  readonly selectedLinkId?: string;
  readonly rawJsonDraft?: string;
  readonly dirty?: boolean;
  readonly readOnly?: boolean;
  readonly error?: string;
}

/** Intents emitted by EmrFhirQuestionnaireMapper. */
export type FhirQuestionnaireMapperIntent =
  | { type: 'fhirVersionToggled'; fhirVersion: FhirQuestionnaireVersion }
  | { type: 'mappingRowSelected'; linkId: string }
  | {
      type: 'fieldMappingUpdated';
      linkId: string;
      changes: {
        fhirItemType?: FhirQuestionnaireItemType;
        required?: boolean;
        repeats?: boolean;
        ucumCode?: string;
        terminologyCode?: FhirCoding;
      };
    }
  | { type: 'questionnaireExportRequested'; fhirVersion: FhirQuestionnaireVersion }
  | { type: 'questionnaireImportRequested'; rawJson: string }
  | { type: 'roundTripVerified' };

export const FHIR_UNIT_EXTENSION_URL = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';

function valueTypeToFhirItemType(
  valueType: EmrValueType,
  fhirVersion: FhirQuestionnaireVersion,
  diagnostics: FhirMappingDiagnostic[],
  linkId: string,
  rowWarnings: string[],
): FhirQuestionnaireItemType {
  switch (valueType) {
    case 'text':
      return 'string';
    case 'multiline':
      return 'text';
    case 'integer':
    case 'scale':
      if (valueType === 'scale') {
        const msg = `EmrValueType 'scale' mapped to FHIR 'integer'; scale anchors require presentation extensions.`;
        diagnostics.push({ severity: 'warning', code: 'lossy-scale', linkId, message: msg });
        rowWarnings.push(msg);
      }
      return 'integer';
    case 'decimal':
      return 'decimal';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'partial-date':
      if (valueType === 'partial-date') {
        const msg = `EmrValueType 'partial-date' mapped to FHIR 'date'; partial precision metadata is not native to Questionnaire.item.type.`;
        diagnostics.push({ severity: 'warning', code: 'lossy-partial-date', linkId, message: msg });
        rowWarnings.push(msg);
      }
      return 'date';
    case 'time':
      return 'time';
    case 'datetime':
      return 'dateTime';
    case 'select':
    case 'multiselect':
    case 'coded':
      return fhirVersion === 'R5' ? 'coding' : 'choice';
    case 'quantity':
      return 'quantity';
    case 'attachment':
      return 'attachment';
    case 'annotation':
    case 'custom': {
      const msg = `EmrValueType '${valueType}' has no direct FHIR Questionnaire item type; mapped to 'string'.`;
      diagnostics.push({ severity: 'warning', code: 'lossy-custom-type', linkId, message: msg });
      rowWarnings.push(msg);
      return 'string';
    }
  }
}

function fhirItemTypeToValueType(
  item: FhirQuestionnaireItem,
  diagnostics: FhirMappingDiagnostic[],
  rowWarnings: string[],
): EmrValueType {
  switch (item.type) {
    case 'string':
    case 'url':
    case 'reference':
      if (item.type !== 'string') {
        const msg = `FHIR item type '${item.type}' normalized to EMR 'text'.`;
        diagnostics.push({ severity: 'info', code: 'normalized-string-type', linkId: item.linkId, message: msg });
        rowWarnings.push(msg);
      }
      return 'text';
    case 'text':
      return 'multiline';
    case 'integer':
      return 'integer';
    case 'decimal':
      return 'decimal';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'dateTime':
      return 'datetime';
    case 'choice':
    case 'open-choice':
    case 'coding':
      if (item.type === 'open-choice' || item.answerConstraint === 'optionsOrString') {
        const msg = `Open-choice / optionsOrString mapped to EMR 'select' (or 'multiselect' when repeats=true).`;
        diagnostics.push({ severity: 'info', code: 'open-choice-mapped', linkId: item.linkId, message: msg });
        rowWarnings.push(msg);
      }
      return item.repeats ? 'multiselect' : 'select';
    case 'quantity':
      return 'quantity';
    case 'attachment':
      return 'attachment';
    case 'display':
    case 'group':
      return 'text';
  }
}

function convertEnableWhenToFhir(ew: EmrEnableWhen): FhirQuestionnaireEnableWhen {
  const lastSeg = ew.question[ew.question.length - 1];
  const question = lastSeg !== undefined ? String(lastSeg) : 'unknown';
  const base = { question, operator: ew.operator };
  if (typeof ew.answer === 'boolean') return { ...base, answerBoolean: ew.answer };
  if (typeof ew.answer === 'number') {
    return Number.isInteger(ew.answer)
      ? { ...base, answerInteger: ew.answer }
      : { ...base, answerDecimal: ew.answer };
  }
  if (ew.answer && typeof ew.answer === 'object' && 'code' in ew.answer) {
    const coded = ew.answer as EmrCodedValue;
    return {
      ...base,
      answerCoding: { system: coded.system, code: coded.code, display: coded.display },
    };
  }
  return { ...base, answerString: ew.answer === null ? '' : String(ew.answer) };
}

function convertEnableWhenFromFhir(ew: FhirQuestionnaireEnableWhen): EmrEnableWhen {
  const answer: ClinicalFieldValue =
    ew.answerBoolean !== undefined
      ? ew.answerBoolean
      : ew.answerInteger !== undefined
        ? ew.answerInteger
        : ew.answerDecimal !== undefined
          ? ew.answerDecimal
          : ew.answerDate !== undefined
            ? ew.answerDate
            : ew.answerCoding !== undefined
              ? {
                  system: ew.answerCoding.system ?? 'urn:ietf:rfc:3986',
                  code: ew.answerCoding.code,
                  display: ew.answerCoding.display ?? ew.answerCoding.code,
                }
              : (ew.answerString ?? null);
  return {
    question: [ew.question],
    operator: ew.operator,
    answer,
  };
}

function convertInitialToFhir(
  defaultValue: ClinicalFieldValue | undefined,
  unit?: EmrUnitBinding,
  unitDisplay?: string,
): readonly FhirQuestionnaireInitial[] | undefined {
  if (isEmptyValue(defaultValue)) return undefined;
  if (typeof defaultValue === 'boolean') return [{ valueBoolean: defaultValue }];
  if (typeof defaultValue === 'number') {
    return [Number.isInteger(defaultValue) ? { valueInteger: defaultValue } : { valueDecimal: defaultValue }];
  }
  if (typeof defaultValue === 'string') return [{ valueString: defaultValue }];
  if (defaultValue && typeof defaultValue === 'object' && 'value' in defaultValue && 'unit' in defaultValue) {
    const q = defaultValue as { value: number | null; unit: string };
    if (q.value === null) return undefined;
    return [
      {
        valueQuantity: {
          value: q.value,
          unit: q.unit || unitDisplay,
          ...(unit ? { system: unit.system, code: unit.code } : {}),
        },
      },
    ];
  }
  if (defaultValue && typeof defaultValue === 'object' && 'code' in defaultValue) {
    const c = defaultValue as EmrCodedValue;
    return [{ valueCoding: { system: c.system, code: c.code, display: c.display } }];
  }
  return undefined;
}

function convertInitialFromFhir(initial: readonly FhirQuestionnaireInitial[] | undefined): ClinicalFieldValue {
  const first = initial?.[0];
  if (!first) return null;
  if (first.valueBoolean !== undefined) return first.valueBoolean;
  if (first.valueInteger !== undefined) return first.valueInteger;
  if (first.valueDecimal !== undefined) return first.valueDecimal;
  if (first.valueDate !== undefined) return first.valueDate;
  if (first.valueString !== undefined) return first.valueString;
  if (first.valueCoding !== undefined) return first.valueCoding.code;
  if (first.valueQuantity?.value !== undefined) {
    return {
      value: first.valueQuantity.value,
      unit: first.valueQuantity.unit ?? first.valueQuantity.code ?? '',
    };
  }
  return null;
}

function fieldDefinitionToFhirItem(
  def: EmrFieldDefinition,
  fhirVersion: FhirQuestionnaireVersion,
  diagnostics: FhirMappingDiagnostic[],
  rows: FhirFieldMappingRow[],
  sectionId?: string,
): FhirQuestionnaireItem {
  const { contract, presentation } = def;
  const rowWarnings: string[] = [];
  const fhirType = valueTypeToFhirItemType(
    contract.valueType,
    fhirVersion,
    diagnostics,
    contract.linkId,
    rowWarnings,
  );
  const required = contract.cardinality.min >= 1;
  const repeats = contract.cardinality.max === null || contract.valueType === 'multiselect';

  const questionCodes: FhirCoding[] = contract.terminology
    .filter(b => b.role === 'question-meaning' && b.concept)
    .map(b => ({
      system: b.concept!.system,
      code: b.concept!.code,
      display: b.concept!.display,
      ...(b.concept!.version ? { version: b.concept!.version } : {}),
    }));

  const answerValueSet = contract.terminology.find(b => b.role === 'answer-value-set')?.valueSetCanonical;

  const ucumFromTerminology = contract.terminology.find(b => b.role === 'unit' && b.concept)?.concept;
  const resolvedUnit: EmrUnitBinding | undefined =
    contract.unit ??
    (ucumFromTerminology
      ? { system: ucumFromTerminology.system, code: ucumFromTerminology.code }
      : presentation.unitDisplay
        ? { system: 'http://unitsofmeasure.org', code: presentation.unitDisplay }
        : undefined);

  if (contract.valueType === 'quantity' && !resolvedUnit) {
    const msg = `Quantity field '${contract.linkId}' has no UCUM unit binding; questionnaire-unit extension omitted.`;
    diagnostics.push({ severity: 'warning', code: 'missing-ucum-unit', linkId: contract.linkId, message: msg });
    rowWarnings.push(msg);
  }

  const extensions: FhirExtension[] = [];
  if (resolvedUnit) {
    extensions.push({
      url: FHIR_UNIT_EXTENSION_URL,
      valueCoding: {
        system: resolvedUnit.system,
        code: resolvedUnit.code,
        display: presentation.unitDisplay ?? resolvedUnit.code,
      },
    });
  }

  const answerOption: FhirQuestionnaireAnswerOption[] | undefined =
    presentation.options && presentation.options.length > 0
      ? presentation.options.map(opt => ({
          valueCoding: {
            system: 'urn:emr:option',
            code: opt.value,
            display: opt.label,
          },
        }))
      : undefined;

  const enableWhen =
    contract.enableWhen && contract.enableWhen.length > 0
      ? contract.enableWhen.map(convertEnableWhenToFhir)
      : undefined;

  const initial = convertInitialToFhir(contract.defaultValue, resolvedUnit, presentation.unitDisplay);

  const maxLengthRule = contract.validation.find(
    (r): r is Extract<FieldValidationRule, { kind: 'max-length' }> => r.kind === 'max-length',
  );
  const nonMaxLengthRules = contract.validation.filter(r => r.kind !== 'max-length');
  if (nonMaxLengthRules.length > 0) {
    const msg = `${nonMaxLengthRules.length} validation rule(s) (${nonMaxLengthRules.map(r => r.kind).join(', ')}) are not native to core FHIR Questionnaire.item and require SDC extensions.`;
    diagnostics.push({ severity: 'info', code: 'validation-sdc-extension', linkId: contract.linkId, message: msg });
    rowWarnings.push(msg);
  }

  rows.push({
    linkId: contract.linkId,
    ...(sectionId ? { sectionId } : {}),
    label: presentation.label,
    emrValueType: contract.valueType,
    fhirItemType: fhirType,
    required,
    repeats,
    terminologyCodes: questionCodes,
    ...(answerValueSet ? { answerValueSet } : {}),
    ...(resolvedUnit ? { ucumUnit: resolvedUnit } : {}),
    enableWhenCount: enableWhen?.length ?? 0,
    hasInitialValue: !!initial?.length,
    warnings: rowWarnings,
  });

  return {
    linkId: contract.linkId,
    type: fhirType,
    text: presentation.label,
    required,
    repeats,
    ...(contract.readOnly ? { readOnly: true } : {}),
    ...(maxLengthRule ? { maxLength: maxLengthRule.value } : {}),
    ...(questionCodes.length > 0 ? { code: questionCodes } : {}),
    ...(answerValueSet ? { answerValueSet } : {}),
    ...(fhirVersion === 'R5' && (fhirType === 'coding' || fhirType === 'choice')
      ? { answerConstraint: 'optionsOnly' as const }
      : {}),
    ...(answerOption ? { answerOption } : {}),
    ...(enableWhen ? { enableWhen } : {}),
    ...(contract.enableBehavior ? { enableBehavior: contract.enableBehavior } : {}),
    ...(initial ? { initial } : {}),
    ...(extensions.length > 0 ? { extension: extensions } : {}),
  };
}

/**
 * Pure bi-directional converter: transforms a `ClinicalFormSchema` (and optional rich
 * `EmrFieldDefinition[]` catalog) into a **FHIR R4 or R5 `Questionnaire`** resource
 * along with side-by-side mapping rows and round-trip fidelity diagnostics.
 */
export function toFhirQuestionnaire(
  schema: ClinicalFormSchema,
  fhirVersion: FhirQuestionnaireVersion = 'R4',
  fieldDefinitions: readonly EmrFieldDefinition[] = [],
): FhirQuestionnaireExportResult {
  const byLinkId = new Map<string, EmrFieldDefinition>(
    fieldDefinitions.map(def => [def.contract.linkId, def]),
  );
  const diagnostics: FhirMappingDiagnostic[] = [];
  const rows: FhirFieldMappingRow[] = [];

  const resolveFieldDef = (field: ClinicalFieldDefinition): EmrFieldDefinition => {
    const rich = byLinkId.get(field.id);
    if (rich) return rich;
    return fromClinicalFieldDefinition(field);
  };

  const sectionItems: FhirQuestionnaireItem[] = schema.sections.map(section => {
    const blockItems: FhirQuestionnaireItem[] = [];
    for (const block of section.blocks) {
      if (block.kind === 'repeatable') {
        const childItems = block.fields.map(f =>
          fieldDefinitionToFhirItem(resolveFieldDef(f), fhirVersion, diagnostics, rows, section.id),
        );
        blockItems.push({
          linkId: block.id,
          type: 'group',
          text: block.label,
          repeats: true,
          item: childItems,
        });
      } else if (block.kind === 'matrix') {
        const msg = `Matrix block '${block.id}' flattened to a FHIR 'group' item; 2D row/column layout is not native to core FHIR Questionnaire.`;
        diagnostics.push({ severity: 'warning', code: 'matrix-flattened', linkId: block.id, message: msg });
        const matrixChildItems: FhirQuestionnaireItem[] = [];
        for (const row of block.rows) {
          for (const col of block.columns) {
            const cell = row.cells[col.id];
            if (cell) {
              matrixChildItems.push(
                fieldDefinitionToFhirItem(resolveFieldDef(cell), fhirVersion, diagnostics, rows, section.id),
              );
            }
          }
        }
        blockItems.push({
          linkId: block.id,
          type: 'group',
          text: block.label,
          repeats: false,
          item: matrixChildItems,
        });
      } else {
        blockItems.push(
          fieldDefinitionToFhirItem(resolveFieldDef(block), fhirVersion, diagnostics, rows, section.id),
        );
      }
    }

    return {
      linkId: section.id,
      type: 'group',
      text: section.label,
      item: blockItems,
    };
  });

  const questionnaire: FhirQuestionnaireResource = {
    resourceType: 'Questionnaire',
    id: schema.id,
    url: `urn:emr:questionnaire:${schema.id}`,
    version: '1.0.0',
    title: schema.label,
    ...(schema.description ? { description: schema.description } : {}),
    status: 'active',
    fhirVersion: fhirVersion === 'R5' ? '5.0.0' : '4.0.1',
    item: sectionItems,
  };

  return {
    fhirVersion,
    questionnaire,
    rows,
    diagnostics,
  };
}

function fhirItemToFieldDefinition(
  item: FhirQuestionnaireItem,
  diagnostics: FhirMappingDiagnostic[],
  rows: FhirFieldMappingRow[],
  sectionId?: string,
): EmrFieldDefinition {
  const rowWarnings: string[] = [];
  const valueType = fhirItemTypeToValueType(item, diagnostics, rowWarnings);
  const required = !!item.required;
  const repeats = !!item.repeats && valueType !== 'multiselect';

  const cardinality: EmrCardinality = {
    min: required ? 1 : 0,
    max: repeats || valueType === 'multiselect' ? null : 1,
  };

  const terminology: TerminologyBinding[] = [];
  for (const coding of item.code ?? []) {
    const concept: TerminologyConcept = {
      sourceId: coding.system?.includes('loinc')
        ? 'loinc'
        : coding.system?.includes('snomed')
          ? 'snomed'
          : 'custom',
      system: coding.system ?? 'urn:ietf:rfc:3986',
      code: coding.code,
      display: coding.display ?? coding.code,
      ...(coding.version ? { version: coding.version } : {}),
    };
    terminology.push({
      id: `code-${item.linkId}-${coding.code}`,
      role: 'question-meaning',
      concept,
      strength: 'preferred',
    });
  }

  if (item.answerValueSet) {
    terminology.push({
      id: `vs-${item.linkId}`,
      role: 'answer-value-set',
      valueSetCanonical: item.answerValueSet,
      strength: 'required',
    });
  }

  const unitExt = item.extension?.find(ext => ext.url === FHIR_UNIT_EXTENSION_URL)?.valueCoding;
  const unit: EmrUnitBinding | undefined = unitExt
    ? {
        system: unitExt.system ?? 'http://unitsofmeasure.org',
        code: unitExt.code,
      }
    : undefined;

  if (unitExt) {
    terminology.push({
      id: `unit-${item.linkId}-${unitExt.code}`,
      role: 'unit',
      concept: {
        sourceId: 'ucum',
        system: unitExt.system ?? 'http://unitsofmeasure.org',
        code: unitExt.code,
        display: unitExt.display ?? unitExt.code,
      },
      strength: 'required',
    });
  }

  const options: ClinicalOption[] | undefined =
    item.answerOption && item.answerOption.length > 0
      ? item.answerOption.map(opt => {
          if (opt.valueCoding) {
            return {
              value: opt.valueCoding.code,
              label: opt.valueCoding.display ?? opt.valueCoding.code,
            };
          }
          if (opt.valueInteger !== undefined) {
            return { value: String(opt.valueInteger), label: String(opt.valueInteger) };
          }
          const str = opt.valueString ?? '';
          return { value: str, label: str };
        })
      : undefined;

  const validation: FieldValidationRule[] = [];
  if (typeof item.maxLength === 'number') {
    validation.push({
      id: `${item.linkId}-max-length`,
      kind: 'max-length',
      value: item.maxLength,
    });
  }

  const enableWhen = item.enableWhen?.map(convertEnableWhenFromFhir);
  const defaultValue = convertInitialFromFhir(item.initial);

  const contract: EmrFieldContract = {
    linkId: item.linkId,
    valueType,
    cardinality,
    terminology,
    validation,
    ...(enableWhen && enableWhen.length > 0 ? { enableWhen } : {}),
    ...(item.enableBehavior ? { enableBehavior: item.enableBehavior } : {}),
    ...(unit ? { unit } : {}),
    ...(item.readOnly ? { readOnly: true } : {}),
    ...(defaultValue !== null ? { defaultValue } : {}),
  };

  const presentation: EmrFieldPresentation = {
    label: item.text ?? item.linkId,
    ...(unitExt ? { unitDisplay: unitExt.display ?? unitExt.code } : {}),
    ...(options ? { options } : {}),
  };

  rows.push({
    linkId: item.linkId,
    ...(sectionId ? { sectionId } : {}),
    label: presentation.label,
    emrValueType: valueType,
    fhirItemType: item.type,
    required,
    repeats: !!item.repeats,
    terminologyCodes: item.code ?? [],
    ...(item.answerValueSet ? { answerValueSet: item.answerValueSet } : {}),
    ...(unit ? { ucumUnit: unit } : {}),
    enableWhenCount: enableWhen?.length ?? 0,
    hasInitialValue: defaultValue !== null,
    warnings: rowWarnings,
  });

  return {
    schemaVersion: '1.0',
    contract,
    presentation,
  };
}

/**
 * Pure bi-directional converter: reconstructs a `ClinicalFormSchema` and `EmrFieldDefinition[]`
 * from a **FHIR R4 or R5 `Questionnaire`** resource with round-trip diagnostics.
 */
export function fromFhirQuestionnaire(questionnaire: FhirQuestionnaireResource): FhirQuestionnaireImportResult {
  const diagnostics: FhirMappingDiagnostic[] = [];
  const fields: EmrFieldDefinition[] = [];
  const rows: FhirFieldMappingRow[] = [];

  const hasR5Features = (items: readonly FhirQuestionnaireItem[]): boolean =>
    items.some(
      i =>
        i.type === 'coding' ||
        i.answerConstraint !== undefined ||
        (i.item ? hasR5Features(i.item) : false),
    );

  const detectedFhirVersion: FhirQuestionnaireVersion =
    questionnaire.fhirVersion === '5.0.0' || hasR5Features(questionnaire.item) ? 'R5' : 'R4';

  const sections: ClinicalFormSection[] = [];
  const rootLeafBlocks: ClinicalFormBlock[] = [];

  for (const topItem of questionnaire.item) {
    if (topItem.type === 'group') {
      const blocks: ClinicalFormBlock[] = [];
      for (const child of topItem.item ?? []) {
        if (child.type === 'group' && child.repeats) {
          const groupFields: ClinicalFieldDefinition[] = [];
          for (const sub of child.item ?? []) {
            const def = fhirItemToFieldDefinition(sub, diagnostics, rows, topItem.linkId);
            fields.push(def);
            groupFields.push(toClinicalFieldDefinition(def));
          }
          blocks.push({
            kind: 'repeatable',
            id: child.linkId,
            label: child.text ?? child.linkId,
            fields: groupFields,
          });
        } else if (child.type === 'group') {
          for (const sub of child.item ?? []) {
            const def = fhirItemToFieldDefinition(sub, diagnostics, rows, topItem.linkId);
            fields.push(def);
            blocks.push(toClinicalFieldDefinition(def));
          }
        } else {
          const def = fhirItemToFieldDefinition(child, diagnostics, rows, topItem.linkId);
          fields.push(def);
          blocks.push(toClinicalFieldDefinition(def));
        }
      }
      sections.push({
        id: topItem.linkId,
        label: topItem.text ?? topItem.linkId,
        blocks,
      });
    } else {
      const def = fhirItemToFieldDefinition(topItem, diagnostics, rows, 'default-section');
      fields.push(def);
      rootLeafBlocks.push(toClinicalFieldDefinition(def));
    }
  }

  if (rootLeafBlocks.length > 0) {
    sections.unshift({
      id: 'default-section',
      label: questionnaire.title ?? 'General',
      blocks: rootLeafBlocks,
    });
  }

  const schema: ClinicalFormSchema = {
    id: questionnaire.id || 'imported-questionnaire',
    label: questionnaire.title ?? questionnaire.id ?? 'Imported Questionnaire',
    ...(questionnaire.description ? { description: questionnaire.description } : {}),
    sections,
  };

  return {
    detectedFhirVersion,
    schema,
    fields,
    rows,
    diagnostics,
  };
}
