import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type {
  ClinicalFieldValue,
  EmrCondition,
  EmrExpr,
  EmrScoreResult,
  EmrTone,
} from '@drguptavivek/emr-controller';
import type {
  ConditionGroupNode,
  ConditionNode,
  ConditionPredicateNode,
  FhirCoding,
  FhirFieldMappingRow,
  FhirQuestionnaireItemType,
  FhirQuestionnaireMapperIntent,
  FhirQuestionnaireMapperViewModel,
  FhirQuestionnaireVersion,
  LogicRuleBuilderIntent,
  LogicRuleBuilderViewModel,
  LogicRuleCombinator,
  LogicRuleEffectKind,
  LogicRuleOperator,
  LogicSandboxEvaluation,
  LogicSandboxOutcome,
  MissingItemPolicy,
  ScoreBuilderIntent,
  ScoreBuilderViewModel,
  ScoreItemDefinition,
  ScoreThresholdBand,
  VersionedLogicArtifact,
} from '@drguptavivek/emr-controller';

export const LOGIC_BUILDER_ENGINE_VERSION = 3;

export const LOGIC_RULE_OPERATORS: readonly { readonly value: LogicRuleOperator; readonly label: string }[] = [
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

export const LOGIC_COMBINATORS: readonly { readonly value: LogicRuleCombinator; readonly label: string }[] = [
  { value: 'all', label: 'ALL (AND)' },
  { value: 'any', label: 'ANY (OR)' },
  { value: 'not', label: 'NOT (Negate)' },
];

export const LOGIC_EFFECT_OPTIONS: readonly { readonly value: LogicRuleEffectKind; readonly label: string }[] = [
  { value: 'enableWhen', label: 'enableWhen (Visibility)' },
  { value: 'requiredWhen', label: 'requiredWhen (Mandatory)' },
  { value: 'alert', label: 'Alert trigger (Clinical Banner)' },
];

export const MISSING_ITEM_POLICIES: readonly { readonly value: MissingItemPolicy; readonly label: string }[] = [
  { value: 'require-all', label: 'Require all items' },
  { value: 'prorate', label: 'Prorate from answered items' },
  { value: 'treat-as-zero', label: 'Treat missing as 0 points' },
];

export const SCORE_BAND_TONES: readonly EmrTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

export const FHIR_ITEM_TYPES: readonly FhirQuestionnaireItemType[] = [
  'group',
  'display',
  'boolean',
  'decimal',
  'integer',
  'date',
  'dateTime',
  'time',
  'string',
  'text',
  'url',
  'choice',
  'open-choice',
  'coding',
  'attachment',
  'reference',
  'quantity',
];

function isFieldValueEmpty(v: ClinicalFieldValue | undefined): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  return typeof v === 'object' && 'value' in v && 'unit' in v && (v as { value: unknown }).value === null;
}

function compilePredicateToEmrCondition(node: ConditionNode): EmrCondition {
  if (node.kind === 'group') {
    const children = node.children.map(compilePredicateToEmrCondition);
    if (node.combinator === 'not') {
      const inner: EmrCondition =
        children.length === 0 ? { all: [] } : children.length === 1 ? children[0]! : { all: children };
      return { not: inner };
    }
    return node.combinator === 'any' ? { any: children } : { all: children };
  }
  const left: EmrExpr = { path: node.fieldId };
  const valScalar: EmrExpr = {
    value: Array.isArray(node.value) ? node.value.join(' ') : ((node.value ?? '') as string | number | boolean | null),
  };
  switch (node.operator) {
    case 'eq':
      return { op: '=', left, right: valScalar };
    case 'neq':
      return { op: '!=', left, right: valScalar };
    case 'gt':
      return { op: '>', left, right: valScalar };
    case 'gte':
      return { op: '>=', left, right: valScalar };
    case 'lt':
      return { op: '<', left, right: valScalar };
    case 'lte':
      return { op: '<=', left, right: valScalar };
    case 'exists':
      return { op: '!=', left, right: { value: '' } };
    case 'empty':
      return { op: '=', left, right: { value: '' } };
    case 'contains':
      return { fn: 'includesValue', args: [left, valScalar] };
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
      return {
        any: items.map(item => ({ op: '=' as const, left, right: { value: item } })),
      };
    }
  }
}

function evalPredicateSandbox(
  pred: ConditionPredicateNode,
  testValues: Readonly<Record<string, ClinicalFieldValue>>,
): LogicSandboxOutcome {
  const fieldId = pred.fieldId.trim();
  if (!fieldId) return 'indeterminate';
  const raw = testValues[fieldId];
  if (pred.operator === 'exists') return !isFieldValueEmpty(raw) ? 'true' : 'false';
  if (pred.operator === 'empty') return isFieldValueEmpty(raw) ? 'true' : 'false';
  if (isFieldValueEmpty(raw)) return 'indeterminate';

  const actualStr =
    raw && typeof raw === 'object' && 'value' in raw
      ? String((raw as { value: unknown }).value ?? '')
      : Array.isArray(raw)
        ? raw.join(' ')
        : String(raw ?? '');
  const expectedStr = Array.isArray(pred.value) ? pred.value.join(',') : String(pred.value ?? '');

  if (pred.operator === 'contains') {
    return actualStr.split(/\s+/).includes(expectedStr) || actualStr.includes(expectedStr) ? 'true' : 'false';
  }
  if (pred.operator === 'in') {
    const list = Array.isArray(pred.value)
      ? pred.value.map(String)
      : expectedStr
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
    return list.includes(actualStr) ? 'true' : 'false';
  }

  const numA = Number(actualStr);
  const numB = Number(expectedStr);
  const bothNumeric = actualStr.trim() !== '' && expectedStr.trim() !== '' && Number.isFinite(numA) && Number.isFinite(numB);

  switch (pred.operator) {
    case 'eq':
      return (bothNumeric ? numA === numB : actualStr === expectedStr) ? 'true' : 'false';
    case 'neq':
      return (bothNumeric ? numA !== numB : actualStr !== expectedStr) ? 'true' : 'false';
    case 'gt':
      return numA > numB ? 'true' : 'false';
    case 'gte':
      return numA >= numB ? 'true' : 'false';
    case 'lt':
      return numA < numB ? 'true' : 'false';
    case 'lte':
      return numA <= numB ? 'true' : 'false';
  }
}

function evalNodeSandbox(
  node: ConditionNode,
  testValues: Readonly<Record<string, ClinicalFieldValue>>,
): LogicSandboxOutcome {
  if (node.kind === 'predicate') return evalPredicateSandbox(node, testValues);
  const outcomes = node.children.map(child => evalNodeSandbox(child, testValues));
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
  const inner: LogicSandboxOutcome =
    outcomes.length === 0
      ? 'true'
      : outcomes.includes('false')
        ? 'false'
        : outcomes.includes('indeterminate')
          ? 'indeterminate'
          : 'true';
  if (inner === 'indeterminate') return 'indeterminate';
  return inner === 'true' ? 'false' : 'true';
}

function collectFieldsFromTree(node: ConditionNode, out: string[] = []): string[] {
  if (node.kind === 'predicate') {
    if (node.fieldId.trim() && !out.includes(node.fieldId.trim())) {
      out.push(node.fieldId.trim());
    }
    return out;
  }
  for (const child of node.children) collectFieldsFromTree(child, out);
  return out;
}

// ============================================================================
// 1. EmrLogicRuleBuilderComponent
// ============================================================================

@Component({
  selector: 'emr-logic-rule-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-builder" [attr.aria-labelledby]="headingId">
      <header class="emr-builder__header">
        <div>
          <p class="emr-eyebrow">L6 Visual Logic Authoring · Engine v{{ engineVersion() }}</p>
          <h2 [id]="headingId">{{ model.label || 'Untitled Logic Rule' }}</h2>
          <p class="emr-builder__subtitle">
            {{ model.description || 'Compose boolean condition groups (ALL / ANY / NOT), predicate leaf rows, target actions, and verify against live sandbox values.' }}
          </p>
        </div>
        <div class="emr-builder__actions">
          <span class="emr-badge emr-badge--engine" data-engine-stamp="true">
            CURRENT_LOGIC_ENGINE_VERSION = v{{ engineVersion() }}
          </span>
          <button
            class="emr-button emr-button--outline"
            type="button"
            [disabled]="readOnly"
            (click)="exportArtifact()"
          >
            Export Artifact
          </button>
          <button
            class="emr-button emr-button--primary"
            type="button"
            [disabled]="readOnly || !!model.saving"
            (click)="saveArtifact()"
          >
            {{ model.saving ? 'Saving…' : 'Save Rule Artifact' }}
          </button>
        </div>
      </header>

      @if (model.error) {
        <div class="emr-builder__alert emr-builder__alert--danger" role="alert">{{ model.error }}</div>
      }

      <div class="emr-builder__layout">
        <div class="emr-builder__main">
          <!-- Rule Metadata & Target Effect -->
          <section class="emr-builder-card" aria-label="Rule metadata and target action">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">Target & Effect</p>
                <h3>When condition is met</h3>
              </div>
              <span class="emr-badge">{{ model.target.effect }}</span>
            </div>
            <div class="emr-builder-grid">
              <label class="emr-builder-label" [for]="id('rule-label')">Rule label</label>
              <input
                class="emr-control"
                [id]="id('rule-label')"
                [value]="model.label"
                [disabled]="readOnly"
                (input)="patchMeta(text($event), model.description)"
              />

              <label class="emr-builder-label" [for]="id('target-effect')">Target effect</label>
              <select
                class="emr-select"
                [id]="id('target-effect')"
                [value]="model.target.effect"
                [disabled]="readOnly"
                (change)="changeTargetEffect(text($event))"
              >
                @for (opt of effectOptions; track opt.value) {
                  <option [value]="opt.value" [selected]="opt.value === model.target.effect">{{ opt.label }}</option>
                }
              </select>

              <label class="emr-builder-label" [for]="id('target-field')">Target field</label>
              <select
                class="emr-select"
                [id]="id('target-field')"
                [value]="model.target.targetFieldId"
                [disabled]="readOnly"
                (change)="changeTargetField(text($event))"
              >
                @for (f of model.availableFields; track f.id) {
                  <option [value]="f.id" [selected]="f.id === model.target.targetFieldId">{{ f.label }} ({{ f.id }})</option>
                }
              </select>

              @if (model.target.effect === 'alert') {
                <label class="emr-builder-label" [for]="id('alert-msg')">Alert banner message</label>
                <input
                  class="emr-control"
                  [id]="id('alert-msg')"
                  [value]="model.target.alertMessage ?? ''"
                  [disabled]="readOnly"
                  placeholder="Clinical decision support alert text"
                  (input)="changeAlertMessage(text($event))"
                />
              }
            </div>
          </section>

          <!-- ConditionNode Tree -->
          <section class="emr-builder-card" aria-label="Condition tree builder">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">ConditionNode Tree</p>
                <h3>Boolean groups & leaf predicates</h3>
              </div>
              @if (model.root.kind === 'group') {
                <div class="emr-builder__inline-actions">
                  <button
                    class="emr-button emr-button--secondary emr-button--sm"
                    type="button"
                    [disabled]="readOnly"
                    (click)="addPredicate(model.root.id)"
                  >
                    + Add Predicate
                  </button>
                  <button
                    class="emr-button emr-button--outline emr-button--sm"
                    type="button"
                    [disabled]="readOnly"
                    (click)="addGroup(model.root.id)"
                  >
                    + Add Subgroup
                  </button>
                </div>
              }
            </div>

            @if (model.root.kind === 'group') {
              <div class="emr-logic-group" [attr.data-combinator]="model.root.combinator">
                <div class="emr-logic-group__bar">
                  <span class="emr-logic-group__tag">ROOT GROUP</span>
                  <div class="emr-combinator-pills" role="group" aria-label="Root combinator">
                    @for (comb of combinators; track comb.value) {
                      <button
                        type="button"
                        class="emr-pill"
                        [class.emr-pill--active]="model.root.combinator === comb.value"
                        [attr.aria-pressed]="model.root.combinator === comb.value"
                        [disabled]="readOnly"
                        (click)="changeCombinator(model.root.id, comb.value)"
                      >
                        {{ comb.label }}
                      </button>
                    }
                  </div>
                </div>

                <div class="emr-logic-children">
                  @for (child of model.root.children; track child.id) {
                    @if (child.kind === 'predicate') {
                      <div class="emr-predicate-row" [attr.data-predicate-id]="child.id">
                        <select
                          class="emr-select"
                          aria-label="Predicate field"
                          [value]="child.fieldId"
                          [disabled]="readOnly"
                          (change)="updatePredicateField(child.id, text($event))"
                        >
                          @for (f of model.availableFields; track f.id) {
                            <option [value]="f.id" [selected]="f.id === child.fieldId">{{ f.label }} ({{ f.id }})</option>
                          }
                        </select>
                        <select
                          class="emr-select"
                          aria-label="Predicate operator"
                          [value]="child.operator"
                          [disabled]="readOnly"
                          (change)="updatePredicateOperator(child.id, text($event))"
                        >
                          @for (op of operators; track op.value) {
                            <option [value]="op.value" [selected]="op.value === child.operator">{{ op.label }}</option>
                          }
                        </select>
                        @if (child.operator !== 'exists' && child.operator !== 'empty') {
                          <input
                            class="emr-control"
                            aria-label="Predicate value"
                            [value]="formatPredicateValue(child.value)"
                            [disabled]="readOnly"
                            placeholder="Expected value"
                            (input)="updatePredicateValue(child.id, text($event))"
                          />
                        } @else {
                          <span class="emr-builder-muted">Unary check</span>
                        }
                        <button
                          type="button"
                          class="emr-button emr-button--ghost emr-button--sm"
                          [disabled]="readOnly"
                          (click)="removeNode(child.id)"
                        >
                          Remove
                        </button>
                      </div>
                    } @else {
                      <div class="emr-logic-group emr-logic-group--nested" [attr.data-combinator]="child.combinator">
                        <div class="emr-logic-group__bar">
                          <span class="emr-logic-group__tag">NESTED GROUP ({{ child.id }})</span>
                          <div class="emr-combinator-pills" role="group" [attr.aria-label]="'Group ' + child.id + ' combinator'">
                            @for (comb of combinators; track comb.value) {
                              <button
                                type="button"
                                class="emr-pill"
                                [class.emr-pill--active]="child.combinator === comb.value"
                                [attr.aria-pressed]="child.combinator === comb.value"
                                [disabled]="readOnly"
                                (click)="changeCombinator(child.id, comb.value)"
                              >
                                {{ comb.label }}
                              </button>
                            }
                          </div>
                          <button
                            type="button"
                            class="emr-button emr-button--secondary emr-button--sm"
                            [disabled]="readOnly"
                            (click)="addPredicate(child.id)"
                          >
                            + Predicate
                          </button>
                          <button
                            type="button"
                            class="emr-button emr-button--ghost emr-button--sm"
                            [disabled]="readOnly"
                            (click)="removeNode(child.id)"
                          >
                            Remove Group
                          </button>
                        </div>
                        <div class="emr-logic-children">
                          @for (sub of child.children; track sub.id) {
                            @if (sub.kind === 'predicate') {
                              <div class="emr-predicate-row" [attr.data-predicate-id]="sub.id">
                                <select
                                  class="emr-select"
                                  aria-label="Nested predicate field"
                                  [value]="sub.fieldId"
                                  [disabled]="readOnly"
                                  (change)="updatePredicateField(sub.id, text($event))"
                                >
                                  @for (f of model.availableFields; track f.id) {
                                    <option [value]="f.id" [selected]="f.id === sub.fieldId">{{ f.label }} ({{ f.id }})</option>
                                  }
                                </select>
                                <select
                                  class="emr-select"
                                  aria-label="Nested predicate operator"
                                  [value]="sub.operator"
                                  [disabled]="readOnly"
                                  (change)="updatePredicateOperator(sub.id, text($event))"
                                >
                                  @for (op of operators; track op.value) {
                                    <option [value]="op.value" [selected]="op.value === sub.operator">{{ op.label }}</option>
                                  }
                                </select>
                                @if (sub.operator !== 'exists' && sub.operator !== 'empty') {
                                  <input
                                    class="emr-control"
                                    aria-label="Nested predicate value"
                                    [value]="formatPredicateValue(sub.value)"
                                    [disabled]="readOnly"
                                    placeholder="Expected value"
                                    (input)="updatePredicateValue(sub.id, text($event))"
                                  />
                                }
                                <button
                                  type="button"
                                  class="emr-button emr-button--ghost emr-button--sm"
                                  [disabled]="readOnly"
                                  (click)="removeNode(sub.id)"
                                >
                                  Remove
                                </button>
                              </div>
                            }
                          }
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </section>
        </div>

        <!-- Live Sandbox Test Evaluator -->
        <aside class="emr-builder__sidebar" aria-label="Live sandbox test evaluator">
          <section class="emr-builder-card">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">Sandbox Evaluator</p>
                <h3>Live rule verification</h3>
              </div>
              <span
                class="emr-sandbox-verdict"
                [attr.data-outcome]="liveEvaluation().outcome"
                role="status"
              >
                {{ liveEvaluation().outcome.toUpperCase() }}
              </span>
            </div>
            <p class="emr-builder-muted">{{ liveEvaluation().summary }}</p>

            <div class="emr-sandbox-inputs">
              @for (f of model.availableFields; track f.id) {
                <div class="emr-sandbox-row">
                  <label class="emr-builder-label" [for]="id('test-' + f.id)">
                    {{ f.label }} <small>({{ f.id }})</small>
                  </label>
                  <input
                    class="emr-control"
                    [id]="id('test-' + f.id)"
                    [value]="formatTestValue(model.testValues[f.id])"
                    [disabled]="readOnly"
                    placeholder="Enter sample value…"
                    (input)="updateTestValue(f.id, text($event))"
                  />
                </div>
              }
            </div>

            <div class="emr-artifact-preview">
              <p class="emr-eyebrow">VersionedLogicArtifact Preview</p>
              <pre>{{ serializedArtifact() }}</pre>
            </div>
          </section>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-builder { display: grid; gap: 16px; }
    .emr-builder__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
    .emr-builder__header h2 { margin: 2px 0 6px; font-size: var(--emr-text-2xl); }
    .emr-builder__subtitle { margin: 0; color: var(--emr-text-muted); max-width: 720px; line-height: 1.45; }
    .emr-builder__actions, .emr-builder__inline-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .emr-eyebrow { margin: 0 0 4px; color: var(--emr-text-muted); font-size: var(--emr-text-2xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .emr-builder__layout { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr); gap: 16px; align-items: start; }
    .emr-builder__main, .emr-builder__sidebar { display: grid; gap: 16px; }
    .emr-builder-card { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); padding: 16px; display: grid; gap: 12px; }
    .emr-builder-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .emr-builder-card h3 { margin: 2px 0 0; font-size: var(--emr-text-lg); }
    .emr-builder-grid { display: grid; grid-template-columns: minmax(120px, 160px) minmax(0, 1fr); gap: 10px 12px; align-items: center; }
    .emr-builder-label { color: var(--emr-text-muted); font-size: var(--emr-text-sm); font-weight: 600; }
    .emr-builder-muted { margin: 0; color: var(--emr-text-muted); font-size: var(--emr-text-sm); }
    .emr-badge { padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 999px; background: var(--emr-surface-raised); font-size: var(--emr-text-xs); font-weight: 600; }
    .emr-logic-group { border: 1px solid var(--emr-border); border-radius: 10px; background: var(--emr-surface-raised); padding: 12px; display: grid; gap: 10px; }
    .emr-logic-group--nested { background: var(--emr-surface); }
    .emr-logic-group__bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .emr-logic-group__tag { font-size: var(--emr-text-xs); font-weight: 700; color: var(--emr-text-muted); }
    .emr-combinator-pills { display: inline-flex; gap: 4px; }
    .emr-pill { padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 999px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .emr-pill--active { background: var(--emr-primary-soft, var(--emr-surface-raised)); border-color: var(--emr-primary, var(--emr-border)); font-weight: 700; }
    .emr-logic-children { display: grid; gap: 8px; }
    .emr-predicate-row { display: grid; grid-template-columns: minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(120px, 1fr) auto; gap: 8px; align-items: center; padding: 8px; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); }
    .emr-sandbox-verdict { padding: 4px 10px; border-radius: 999px; font-size: var(--emr-text-xs); font-weight: 700; border: 1px solid var(--emr-border); background: var(--emr-surface-raised); }
    .emr-sandbox-verdict[data-outcome="true"] { background: var(--emr-success-soft); color: var(--emr-success); border-color: var(--emr-success); }
    .emr-sandbox-verdict[data-outcome="false"] { background: var(--emr-danger-soft); color: var(--emr-danger); border-color: var(--emr-danger); }
    .emr-sandbox-verdict[data-outcome="indeterminate"] { background: var(--emr-warning-soft); color: var(--emr-warning); border-color: var(--emr-warning); }
    .emr-sandbox-inputs { display: grid; gap: 8px; }
    .emr-sandbox-row { display: grid; gap: 4px; }
    .emr-artifact-preview pre { margin: 4px 0 0; padding: 10px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface-raised); max-height: 220px; overflow: auto; font-size: var(--emr-text-xs); white-space: pre-wrap; }
    .emr-builder__alert { padding: 10px 12px; border-radius: 8px; font-size: var(--emr-text-sm); }
    .emr-builder__alert--danger { background: var(--emr-danger-soft); color: var(--emr-danger); }
    @media (max-width: 900px) {
      .emr-builder__layout { grid-template-columns: 1fr; }
      .emr-predicate-row { grid-template-columns: 1fr; }
    }
  `],
})
export class EmrLogicRuleBuilderComponent {
  @Input({ required: true }) model!: LogicRuleBuilderViewModel;
  @Input() headingId = 'emr-logic-rule-builder-heading';
  @Output() readonly intent = new EventEmitter<LogicRuleBuilderIntent>();

  readonly operators = LOGIC_RULE_OPERATORS;
  readonly combinators = LOGIC_COMBINATORS;
  readonly effectOptions = LOGIC_EFFECT_OPTIONS;
  private nextCounter = 1;

  get readOnly(): boolean {
    return !!this.model?.readOnly;
  }

  id(suffix: string): string {
    return `${this.headingId}-${suffix}`;
  }

  engineVersion(): number {
    return this.model?.engineVersion ?? LOGIC_BUILDER_ENGINE_VERSION;
  }

  text(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  emit(intent: LogicRuleBuilderIntent): void {
    if (!this.readOnly) {
      this.intent.emit(intent);
    }
  }

  patchMeta(label?: string, description?: string): void {
    this.emit({ type: 'ruleMetaPatched', label, description });
  }

  changeCombinator(groupId: string, combinator: LogicRuleCombinator): void {
    this.emit({ type: 'combinatorChanged', groupId, combinator });
  }

  addPredicate(parentGroupId: string): void {
    const defaultFieldId = this.model.availableFields[0]?.id ?? '';
    const predicate: ConditionPredicateNode = {
      kind: 'predicate',
      id: `pred-${this.nextCounter++}`,
      fieldId: defaultFieldId,
      operator: 'eq',
      value: '',
    };
    this.emit({ type: 'predicateAdded', parentGroupId, predicate });
  }

  addGroup(parentGroupId: string): void {
    const group: ConditionGroupNode = {
      kind: 'group',
      id: `grp-${this.nextCounter++}`,
      combinator: 'all',
      children: [],
    };
    this.emit({ type: 'groupAdded', parentGroupId, group });
  }

  removeNode(nodeId: string): void {
    this.emit({ type: 'nodeRemoved', nodeId });
  }

  updatePredicateField(predicateId: string, fieldId: string): void {
    this.emit({ type: 'predicateUpdated', predicateId, changes: { fieldId } });
  }

  updatePredicateOperator(predicateId: string, opValue: string): void {
    this.emit({
      type: 'predicateUpdated',
      predicateId,
      changes: { operator: opValue as LogicRuleOperator },
    });
  }

  updatePredicateValue(predicateId: string, rawValue: string): void {
    const trimmed = rawValue.trim();
    const parsed: string | number | boolean =
      trimmed === 'true'
        ? true
        : trimmed === 'false'
          ? false
          : trimmed !== '' && Number.isFinite(Number(trimmed))
            ? Number(trimmed)
            : rawValue;
    this.emit({ type: 'predicateUpdated', predicateId, changes: { value: parsed } });
  }

  changeTargetEffect(effect: string): void {
    this.emit({
      type: 'targetChanged',
      target: {
        ...this.model.target,
        effect: effect as LogicRuleEffectKind,
      },
    });
  }

  changeTargetField(targetFieldId: string): void {
    this.emit({
      type: 'targetChanged',
      target: {
        ...this.model.target,
        targetFieldId,
      },
    });
  }

  changeAlertMessage(alertMessage: string): void {
    this.emit({
      type: 'targetChanged',
      target: {
        ...this.model.target,
        alertMessage,
      },
    });
  }

  updateTestValue(fieldId: string, rawValue: string): void {
    const trimmed = rawValue.trim();
    const value: ClinicalFieldValue =
      trimmed === ''
        ? null
        : trimmed === 'true'
          ? true
          : trimmed === 'false'
            ? false
            : Number.isFinite(Number(trimmed))
              ? Number(trimmed)
              : rawValue;
    this.emit({ type: 'testValueChanged', fieldId, value });
  }

  formatPredicateValue(val: ConditionPredicateNode['value']): string {
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  }

  formatTestValue(val: ClinicalFieldValue | undefined): string {
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object' && 'value' in val) return String((val as { value: unknown }).value ?? '');
    return String(val);
  }

  liveEvaluation(): LogicSandboxEvaluation {
    if (this.model.evaluation) return this.model.evaluation;
    const referencedFields = collectFieldsFromTree(this.model.root);
    const missingFields = referencedFields.filter(f => isFieldValueEmpty(this.model.testValues[f]));
    const outcome = evalNodeSandbox(this.model.root, this.model.testValues);
    const summary =
      outcome === 'true'
        ? 'Rule evaluates to TRUE'
        : outcome === 'false'
          ? 'Rule evaluates to FALSE'
          : `Rule is INDETERMINATE (${missingFields.length ? `missing: ${missingFields.join(', ')}` : 'incomplete predicate'})`;
    return { outcome, referencedFields, missingFields, summary };
  }

  buildArtifact(): VersionedLogicArtifact {
    return (
      this.model.exportedArtifact ?? {
        schemaVersion: '1.0',
        engineVersion: this.engineVersion(),
        ruleId: this.model.ruleId || 'logic-rule',
        label: this.model.label || 'Untitled logic rule',
        ...(this.model.description ? { description: this.model.description } : {}),
        root: this.model.root,
        compiledCondition: compilePredicateToEmrCondition(this.model.root),
        target: this.model.target,
      }
    );
  }

  serializedArtifact(): string {
    return JSON.stringify(this.buildArtifact(), null, 2);
  }

  saveArtifact(): void {
    this.emit({ type: 'artifactSaved', artifact: this.buildArtifact() });
  }

  exportArtifact(): void {
    this.emit({ type: 'artifactExportRequested', artifact: this.buildArtifact() });
  }
}

// ============================================================================
// 2. EmrScoreBuilderComponent
// ============================================================================

@Component({
  selector: 'emr-score-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-builder" [attr.aria-labelledby]="headingId">
      <header class="emr-builder__header">
        <div>
          <p class="emr-eyebrow">L6 Clinical Calculator & PRO Scoring Studio · v{{ model.definition.versionStamp }}</p>
          <h2 [id]="headingId">{{ model.definition.title || 'Untitled Score Instrument' }}</h2>
          <p class="emr-builder__subtitle">
            {{ model.definition.description || 'Configure weighted item definitions, option-to-points maps, missing-item policies, and threshold interpretation bands.' }}
          </p>
        </div>
        <div class="emr-builder__actions">
          <span class="emr-badge">Policy: {{ model.definition.missingItemPolicy }}</span>
          <button
            class="emr-button emr-button--primary"
            type="button"
            [disabled]="readOnly || !!model.saving"
            (click)="saveDefinition()"
          >
            {{ model.saving ? 'Saving…' : 'Save Score Definition' }}
          </button>
        </div>
      </header>

      @if (model.error) {
        <div class="emr-builder__alert emr-builder__alert--danger" role="alert">{{ model.error }}</div>
      }

      <div class="emr-builder__layout">
        <div class="emr-builder__main">
          <!-- Instrument Metadata & Missing Item Policy -->
          <section class="emr-builder-card" aria-label="Score metadata and missing-item policy">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">Instrument Contract</p>
                <h3>Identity & missing-item policy</h3>
              </div>
              <span class="emr-badge">Engine v{{ model.definition.engineVersion }}</span>
            </div>
            <div class="emr-builder-grid">
              <label class="emr-builder-label" [for]="id('inst-id')">Instrument ID</label>
              <input
                class="emr-control"
                [id]="id('inst-id')"
                [value]="model.definition.instrumentId"
                [disabled]="readOnly"
                (input)="patchMeta({ instrumentId: text($event) })"
              />

              <label class="emr-builder-label" [for]="id('inst-title')">Title</label>
              <input
                class="emr-control"
                [id]="id('inst-title')"
                [value]="model.definition.title"
                [disabled]="readOnly"
                (input)="patchMeta({ title: text($event) })"
              />

              <label class="emr-builder-label" [for]="id('inst-version')">Version stamp</label>
              <input
                class="emr-control"
                [id]="id('inst-version')"
                [value]="model.definition.versionStamp"
                [disabled]="readOnly"
                (input)="patchMeta({ versionStamp: text($event) })"
              />

              <label class="emr-builder-label" [for]="id('missing-policy')">Missing-item policy</label>
              <select
                class="emr-select"
                [id]="id('missing-policy')"
                [value]="model.definition.missingItemPolicy"
                [disabled]="readOnly"
                (change)="changeMissingPolicy(text($event))"
              >
                @for (pol of missingPolicies; track pol.value) {
                  <option [value]="pol.value" [selected]="pol.value === model.definition.missingItemPolicy">
                    {{ pol.label }}
                  </option>
                }
              </select>
            </div>
          </section>

          <!-- Weighted Item Definitions -->
          <section class="emr-builder-card" aria-label="Weighted score items">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">Score Items</p>
                <h3>Weighted item definitions ({{ model.definition.items.length }})</h3>
              </div>
              <button
                class="emr-button emr-button--secondary emr-button--sm"
                type="button"
                [disabled]="readOnly"
                (click)="addItem()"
              >
                + Add Score Item
              </button>
            </div>

            <div class="emr-score-list">
              @for (item of model.definition.items; track item.id) {
                <div class="emr-score-item" [attr.data-item-id]="item.id">
                  <div class="emr-score-item__row">
                    <input
                      class="emr-control"
                      aria-label="Item field ID"
                      [value]="item.fieldId"
                      [disabled]="readOnly"
                      placeholder="fieldId"
                      (input)="updateItem(item.id, { fieldId: text($event) })"
                    />
                    <input
                      class="emr-control"
                      aria-label="Item label"
                      [value]="item.label"
                      [disabled]="readOnly"
                      placeholder="Item label"
                      (input)="updateItem(item.id, { label: text($event) })"
                    />
                    <input
                      class="emr-control"
                      type="number"
                      step="0.1"
                      aria-label="Weight multiplier"
                      [value]="item.weight"
                      [disabled]="readOnly"
                      (input)="updateItem(item.id, { weight: numberVal($event, 1) })"
                    />
                    <label class="emr-builder-check">
                      <input
                        type="checkbox"
                        [checked]="item.required"
                        [disabled]="readOnly"
                        (change)="updateItem(item.id, { required: checkedVal($event) })"
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      class="emr-button emr-button--ghost emr-button--sm"
                      [disabled]="readOnly"
                      (click)="removeItem(item.id)"
                    >
                      Remove
                    </button>
                  </div>
                  @if (item.optionPoints) {
                    <div class="emr-option-points">
                      @for (entry of optionEntries(item.optionPoints); track entry[0]) {
                        <span class="emr-badge">{{ entry[0] }} → {{ entry[1] }} pts</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </section>

          <!-- Interpretation Threshold Bands -->
          <section class="emr-builder-card" aria-label="Interpretation threshold bands">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">Thresholds & Guidance</p>
                <h3>Interpretation bands ({{ model.definition.bands.length }})</h3>
              </div>
              <button
                class="emr-button emr-button--secondary emr-button--sm"
                type="button"
                [disabled]="readOnly"
                (click)="addBand()"
              >
                + Add Threshold Band
              </button>
            </div>

            <div class="emr-score-list">
              @for (band of model.definition.bands; track band.id) {
                <div class="emr-score-band" [attr.data-band-id]="band.id">
                  <div class="emr-score-band__row">
                    <input
                      class="emr-control"
                      type="number"
                      aria-label="Min score"
                      [value]="band.minScore"
                      [disabled]="readOnly"
                      (input)="updateBand(band.id, { minScore: numberVal($event, 0) })"
                    />
                    <input
                      class="emr-control"
                      type="number"
                      aria-label="Max score"
                      [value]="band.maxScore"
                      [disabled]="readOnly"
                      (input)="updateBand(band.id, { maxScore: numberVal($event, 10) })"
                    />
                    <input
                      class="emr-control"
                      aria-label="Band label"
                      [value]="band.label"
                      [disabled]="readOnly"
                      (input)="updateBand(band.id, { label: text($event) })"
                    />
                    <select
                      class="emr-select"
                      aria-label="Band tone"
                      [value]="band.tone"
                      [disabled]="readOnly"
                      (change)="updateBand(band.id, { tone: toneVal($event) })"
                    >
                      @for (t of tones; track t) {
                        <option [value]="t" [selected]="t === band.tone">{{ t }}</option>
                      }
                    </select>
                    <button
                      type="button"
                      class="emr-button emr-button--ghost emr-button--sm"
                      [disabled]="readOnly"
                      (click)="removeBand(band.id)"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    class="emr-control"
                    aria-label="Clinical guidance"
                    [value]="band.clinicalGuidance ?? ''"
                    [disabled]="readOnly"
                    placeholder="Clinical guidance for this band…"
                    (input)="updateBand(band.id, { clinicalGuidance: text($event) })"
                  />
                </div>
              }
            </div>
          </section>
        </div>

        <!-- Live Preview Calculator -->
        <aside class="emr-builder__sidebar" aria-label="Live preview calculator">
          <section class="emr-builder-card">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">Live Preview Calculator</p>
                <h3>EmrScoreResult Output</h3>
              </div>
              <span class="emr-badge" [attr.data-tone]="liveScoreResult().bandTone">
                {{ liveScoreResult().bandTone.toUpperCase() }}
              </span>
            </div>

            <div class="emr-score-readout" role="status">
              <div class="emr-score-readout__total">{{ liveScoreResult().total }}</div>
              <div class="emr-score-readout__meta">
                <strong>{{ liveScoreResult().bandLabel }}</strong>
                <span>{{ liveScoreResult().completenessLabel }}</span>
                @if (liveScoreResult().interpretation) {
                  <small>{{ liveScoreResult().interpretation }}</small>
                }
              </div>
            </div>

            <div class="emr-sandbox-inputs">
              @for (item of model.definition.items; track item.id) {
                <div class="emr-sandbox-row">
                  <label class="emr-builder-label" [for]="id('sample-' + item.fieldId)">
                    {{ item.label }} <small>(×{{ item.weight }})</small>
                  </label>
                  <input
                    class="emr-control"
                    [id]="id('sample-' + item.fieldId)"
                    [value]="formatSampleAnswer(model.sampleAnswers[item.fieldId])"
                    [disabled]="readOnly"
                    placeholder="Sample answer or option code…"
                    (input)="changeSampleAnswer(item.fieldId, text($event))"
                  />
                </div>
              }
            </div>
          </section>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-builder { display: grid; gap: 16px; }
    .emr-builder__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
    .emr-builder__header h2 { margin: 2px 0 6px; font-size: var(--emr-text-2xl); }
    .emr-builder__subtitle { margin: 0; color: var(--emr-text-muted); max-width: 720px; line-height: 1.45; }
    .emr-builder__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .emr-eyebrow { margin: 0 0 4px; color: var(--emr-text-muted); font-size: var(--emr-text-2xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .emr-builder__layout { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr); gap: 16px; align-items: start; }
    .emr-builder__main, .emr-builder__sidebar { display: grid; gap: 16px; }
    .emr-builder-card { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); padding: 16px; display: grid; gap: 12px; }
    .emr-builder-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .emr-builder-card h3 { margin: 2px 0 0; font-size: var(--emr-text-lg); }
    .emr-builder-grid { display: grid; grid-template-columns: minmax(130px, 170px) minmax(0, 1fr); gap: 10px 12px; align-items: center; }
    .emr-builder-label { color: var(--emr-text-muted); font-size: var(--emr-text-sm); font-weight: 600; }
    .emr-builder-check { display: inline-flex; align-items: center; gap: 6px; font-size: var(--emr-text-sm); }
    .emr-badge { padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 999px; background: var(--emr-surface-raised); font-size: var(--emr-text-xs); font-weight: 600; }
    .emr-score-list { display: grid; gap: 10px; }
    .emr-score-item, .emr-score-band { border: 1px solid var(--emr-border); border-radius: 10px; background: var(--emr-surface-raised); padding: 10px; display: grid; gap: 8px; }
    .emr-score-item__row { display: grid; grid-template-columns: minmax(110px, 1fr) minmax(140px, 1.4fr) 90px auto auto; gap: 8px; align-items: center; }
    .emr-score-band__row { display: grid; grid-template-columns: 80px 80px minmax(140px, 1fr) 110px auto; gap: 8px; align-items: center; }
    .emr-option-points { display: flex; flex-wrap: wrap; gap: 6px; }
    .emr-score-readout { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 10px; border: 1px solid var(--emr-border); background: var(--emr-surface-raised); }
    .emr-score-readout__total { font-size: var(--emr-text-2xl); font-weight: 800; color: var(--emr-primary, var(--emr-text)); }
    .emr-score-readout__meta { display: grid; gap: 2px; font-size: var(--emr-text-sm); }
    .emr-score-readout__meta span, .emr-score-readout__meta small { color: var(--emr-text-muted); }
    .emr-sandbox-inputs { display: grid; gap: 8px; }
    .emr-sandbox-row { display: grid; gap: 4px; }
    .emr-builder__alert { padding: 10px 12px; border-radius: 8px; font-size: var(--emr-text-sm); }
    .emr-builder__alert--danger { background: var(--emr-danger-soft); color: var(--emr-danger); }
    @media (max-width: 900px) {
      .emr-builder__layout { grid-template-columns: 1fr; }
      .emr-score-item__row, .emr-score-band__row { grid-template-columns: 1fr; }
    }
  `],
})
export class EmrScoreBuilderComponent {
  @Input({ required: true }) model!: ScoreBuilderViewModel;
  @Input() headingId = 'emr-score-builder-heading';
  @Output() readonly intent = new EventEmitter<ScoreBuilderIntent>();

  readonly missingPolicies = MISSING_ITEM_POLICIES;
  readonly tones = SCORE_BAND_TONES;
  private nextCounter = 1;

  get readOnly(): boolean {
    return !!this.model?.readOnly;
  }

  id(suffix: string): string {
    return `${this.headingId}-${suffix}`;
  }

  text(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  numberVal(event: Event, fallback: number): number {
    const parsed = Number(this.text(event));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  checkedVal(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  toneVal(event: Event): EmrTone {
    return this.text(event) as EmrTone;
  }

  optionEntries(map: Readonly<Record<string, number>>): [string, number][] {
    return Object.entries(map);
  }

  emit(intent: ScoreBuilderIntent): void {
    if (!this.readOnly) {
      this.intent.emit(intent);
    }
  }

  patchMeta(
    changes: Partial<Pick<ScoreBuilderViewModel['definition'], 'instrumentId' | 'title' | 'description' | 'versionStamp'>>,
  ): void {
    this.emit({ type: 'scoreMetaPatched', changes });
  }

  changeMissingPolicy(policy: string): void {
    this.emit({ type: 'missingPolicyChanged', policy: policy as MissingItemPolicy });
  }

  addItem(): void {
    const idx = this.model.definition.items.length + this.nextCounter++;
    const item: ScoreItemDefinition = {
      id: `score-item-${idx}`,
      fieldId: `item_${idx}`,
      label: `Score item ${idx}`,
      weight: 1,
      required: true,
    };
    this.emit({ type: 'scoreItemAdded', item });
  }

  updateItem(itemId: string, changes: Partial<ScoreItemDefinition>): void {
    this.emit({ type: 'scoreItemUpdated', itemId, changes });
  }

  removeItem(itemId: string): void {
    this.emit({ type: 'scoreItemRemoved', itemId });
  }

  addBand(): void {
    const idx = this.model.definition.bands.length + this.nextCounter++;
    const band: ScoreThresholdBand = {
      id: `score-band-${idx}`,
      minScore: 0,
      maxScore: 10,
      label: `Band ${idx}`,
      tone: 'neutral',
    };
    this.emit({ type: 'scoreBandAdded', band });
  }

  updateBand(bandId: string, changes: Partial<ScoreThresholdBand>): void {
    this.emit({ type: 'scoreBandUpdated', bandId, changes });
  }

  removeBand(bandId: string): void {
    this.emit({ type: 'scoreBandRemoved', bandId });
  }

  changeSampleAnswer(fieldId: string, raw: string): void {
    const trimmed = raw.trim();
    const val: ClinicalFieldValue =
      trimmed === ''
        ? null
        : Number.isFinite(Number(trimmed))
          ? Number(trimmed)
          : trimmed;
    this.emit({ type: 'sampleAnswerChanged', fieldId, value: val });
  }

  formatSampleAnswer(val: ClinicalFieldValue | undefined): string {
    if (val === null || val === undefined) return '';
    return String(val);
  }

  liveScoreResult(): EmrScoreResult {
    if (this.model.previewResult) return this.model.previewResult;
    const def = this.model.definition;
    const answers = this.model.sampleAnswers;
    const missingItems: string[] = [];
    const components: { id: string; label: string; value: number }[] = [];
    let answeredSum = 0;
    let answeredWeightSum = 0;
    let totalWeightSum = 0;
    let answeredCount = 0;

    for (const item of def.items) {
      const weight = Number.isFinite(item.weight) ? item.weight : 1;
      totalWeightSum += weight;
      const ans = answers[item.fieldId];
      let pts: number | null = null;
      if (!isFieldValueEmpty(ans)) {
        if (typeof ans === 'number' && Number.isFinite(ans)) pts = ans;
        else if (typeof ans === 'string') {
          if (item.optionPoints && ans.trim() in item.optionPoints) pts = item.optionPoints[ans.trim()]!;
          else if (Number.isFinite(Number(ans))) pts = Number(ans);
        }
      }
      if (pts === null) {
        missingItems.push(item.fieldId);
        if (def.missingItemPolicy === 'treat-as-zero') {
          components.push({ id: item.id, label: item.label, value: 0 });
        }
      } else {
        const weighted = Math.round(pts * weight * 100) / 100;
        answeredSum += weighted;
        answeredWeightSum += weight;
        answeredCount += 1;
        components.push({ id: item.id, label: item.label, value: weighted });
      }
    }

    const completenessLabel = `${answeredCount}/${def.items.length} items complete`;
    if (def.missingItemPolicy === 'require-all' && missingItems.length > 0) {
      return {
        total: Math.round(answeredSum * 100) / 100,
        bandLabel: 'Incomplete — required items missing',
        bandTone: 'neutral',
        components,
        missingItems,
        completenessLabel,
        provenance: `${def.instrumentId} (${def.versionStamp})`,
      };
    }

    let total = answeredSum;
    if (def.missingItemPolicy === 'prorate' && missingItems.length > 0 && answeredWeightSum > 0) {
      total = (answeredSum * totalWeightSum) / answeredWeightSum;
    }
    total = Math.round(total * 100) / 100;
    const matched = def.bands.find(b => total >= b.minScore && total <= b.maxScore);
    return {
      total,
      bandLabel: matched?.label ?? 'Unclassified score',
      bandTone: matched?.tone ?? 'neutral',
      components,
      missingItems,
      completenessLabel,
      ...(matched?.clinicalGuidance ? { interpretation: matched.clinicalGuidance } : {}),
      provenance: `${def.instrumentId} (${def.versionStamp})`,
    };
  }

  saveDefinition(): void {
    this.emit({ type: 'scoreDefinitionSaved', definition: this.model.definition });
  }
}

// ============================================================================
// 3. EmrFhirQuestionnaireMapperComponent
// ============================================================================

@Component({
  selector: 'emr-fhir-questionnaire-mapper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-builder" [attr.aria-labelledby]="headingId">
      <header class="emr-builder__header">
        <div>
          <p class="emr-eyebrow">L6 Bi-Directional Interoperability Studio · FHIR {{ model.fhirVersion }}</p>
          <h2 [id]="headingId">{{ model.schema.label || 'FHIR Questionnaire Mapper' }}</h2>
          <p class="emr-builder__subtitle">
            Inspect and map EmrFieldContract / ClinicalFormSchema definitions to and from FHIR R4 and R5 Questionnaire resources with round-trip fidelity diagnostics.
          </p>
        </div>
        <div class="emr-builder__actions">
          <div class="emr-version-toggle" role="group" aria-label="FHIR version toggle">
            <button
              type="button"
              class="emr-pill"
              [class.emr-pill--active]="model.fhirVersion === 'R4'"
              [attr.aria-pressed]="model.fhirVersion === 'R4'"
              [disabled]="readOnly"
              (click)="toggleFhirVersion('R4')"
            >
              FHIR R4 (4.0.1)
            </button>
            <button
              type="button"
              class="emr-pill"
              [class.emr-pill--active]="model.fhirVersion === 'R5'"
              [attr.aria-pressed]="model.fhirVersion === 'R5'"
              [disabled]="readOnly"
              (click)="toggleFhirVersion('R5')"
            >
              FHIR R5 (5.0.0)
            </button>
          </div>
          <button
            class="emr-button emr-button--outline"
            type="button"
            [disabled]="readOnly"
            (click)="emit({ type: 'roundTripVerified' })"
          >
            Verify Round-Trip
          </button>
          <button
            class="emr-button emr-button--primary"
            type="button"
            [disabled]="readOnly"
            (click)="emit({ type: 'questionnaireExportRequested', fhirVersion: model.fhirVersion })"
          >
            Export FHIR {{ model.fhirVersion }}
          </button>
        </div>
      </header>

      @if (model.error) {
        <div class="emr-builder__alert emr-builder__alert--danger" role="alert">{{ model.error }}</div>
      }

      @if (model.diagnostics.length) {
        <section class="emr-builder-card emr-diagnostics-card" aria-label="Compatibility and round-trip diagnostics">
          <div class="emr-builder-card__header">
            <div>
              <p class="emr-eyebrow">Round-Trip Fidelity Diagnostics</p>
              <h3>{{ model.diagnostics.length }} compatibility warning(s)</h3>
            </div>
          </div>
          <ul class="emr-diagnostic-list">
            @for (diag of model.diagnostics; track diag.code + (diag.linkId ?? '')) {
              <li [attr.data-severity]="diag.severity">
                <strong>[{{ diag.severity.toUpperCase() }}]</strong>
                @if (diag.linkId) { <code>{{ diag.linkId }}</code> · }
                {{ diag.message }}
              </li>
            }
          </ul>
        </section>
      }

      <div class="emr-builder__layout">
        <div class="emr-builder__main">
          <!-- Side-by-Side Field Mapping Table -->
          <section class="emr-builder-card" aria-label="Side-by-side field mapping table">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">Bi-Directional Field Mapping Table</p>
                <h3>EmrFieldContract ↔ FHIR {{ model.fhirVersion }} Questionnaire.item ({{ model.rows.length }})</h3>
              </div>
            </div>

            <div class="emr-table-wrap">
              <table class="emr-mapping-table">
                <thead>
                  <tr>
                    <th>linkId / Label</th>
                    <th>EMR ValueType</th>
                    <th>FHIR Item Type</th>
                    <th>Cardinality</th>
                    <th>Terminology & UCUM</th>
                    <th>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of model.rows; track row.linkId) {
                    <tr
                      [class.emr-mapping-row--selected]="row.linkId === model.selectedLinkId"
                      [attr.data-link-id]="row.linkId"
                    >
                      <td>
                        <strong>{{ row.label }}</strong>
                        <div><code>{{ row.linkId }}</code></div>
                      </td>
                      <td><span class="emr-badge">{{ row.emrValueType }}</span></td>
                      <td>
                        <select
                          class="emr-select"
                          [attr.aria-label]="'FHIR item type for ' + row.linkId"
                          [value]="row.fhirItemType"
                          [disabled]="readOnly"
                          (change)="updateRowFhirType(row.linkId, text($event))"
                        >
                          @for (it of fhirItemTypes; track it) {
                            <option [value]="it" [selected]="it === row.fhirItemType">{{ it }}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <span class="emr-badge">
                          {{ row.required ? '1' : '0' }}..{{ row.repeats ? '*' : '1' }}
                        </span>
                      </td>
                      <td>
                        @for (code of row.terminologyCodes; track code.code) {
                          <span class="emr-badge">{{ code.code }}</span>
                        }
                        @if (row.ucumUnit) {
                          <span class="emr-badge">UCUM: {{ row.ucumUnit.code }}</span>
                        }
                      </td>
                      <td>
                        <button
                          type="button"
                          class="emr-button emr-button--ghost emr-button--sm"
                          (click)="selectRow(row.linkId)"
                        >
                          {{ row.linkId === model.selectedLinkId ? 'Selected' : 'Inspect' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- Terminology Binding Inspector -->
          @if (selectedRow(); as activeRow) {
            <section class="emr-builder-card" aria-label="Terminology binding inspector">
              <div class="emr-builder-card__header">
                <div>
                  <p class="emr-eyebrow">Terminology & Extension Inspector</p>
                  <h3>{{ activeRow.label }} ({{ activeRow.linkId }})</h3>
                </div>
                <span class="emr-badge">{{ activeRow.emrValueType }} → {{ activeRow.fhirItemType }}</span>
              </div>

              <div class="emr-builder-grid">
                <label class="emr-builder-label" [for]="id('ucum-code')">UCUM unit code</label>
                <input
                  class="emr-control"
                  [id]="id('ucum-code')"
                  [value]="activeRow.ucumUnit?.code ?? ''"
                  [disabled]="readOnly"
                  placeholder="e.g. mm[Hg], kg"
                  (input)="updateRowUcum(activeRow.linkId, text($event))"
                />

                <label class="emr-builder-label" [for]="id('term-code')">Add LOINC/SNOMED code</label>
                <div class="emr-builder__inline-actions">
                  <input
                    class="emr-control"
                    [id]="id('term-code')"
                    [value]="newCodingCode"
                    [disabled]="readOnly"
                    placeholder="Code (e.g. 79893-4)"
                    (input)="newCodingCode = text($event)"
                  />
                  <input
                    class="emr-control"
                    aria-label="Coding display"
                    [value]="newCodingDisplay"
                    [disabled]="readOnly"
                    placeholder="Display text"
                    (input)="newCodingDisplay = text($event)"
                  />
                  <button
                    type="button"
                    class="emr-button emr-button--secondary emr-button--sm"
                    [disabled]="readOnly || !newCodingCode.trim()"
                    (click)="bindTerminologyCode(activeRow.linkId)"
                  >
                    Bind Code
                  </button>
                </div>
              </div>
            </section>
          }
        </div>

        <!-- Live FHIR Questionnaire JSON Preview & Import -->
        <aside class="emr-builder__sidebar" aria-label="Live FHIR Questionnaire JSON preview">
          <section class="emr-builder-card">
            <div class="emr-builder-card__header">
              <div>
                <p class="emr-eyebrow">FHIR {{ model.fhirVersion }} Resource</p>
                <h3>Live Questionnaire JSON</h3>
              </div>
              <span class="emr-badge">v{{ model.questionnaire.fhirVersion ?? (model.fhirVersion === 'R5' ? '5.0.0' : '4.0.1') }}</span>
            </div>
            <pre class="emr-fhir-json">{{ questionnaireJson() }}</pre>

            <label class="emr-builder-label" [for]="id('import-json')">Import FHIR Questionnaire JSON</label>
            <textarea
              class="emr-control"
              [id]="id('import-json')"
              rows="4"
              [value]="importJsonDraft"
              [disabled]="readOnly"
              placeholder="Paste FHIR R4 or R5 Questionnaire JSON to import…"
              (input)="importJsonDraft = text($event)"
            ></textarea>
            <button
              type="button"
              class="emr-button emr-button--secondary"
              [disabled]="readOnly || !importJsonDraft.trim()"
              (click)="importQuestionnaire()"
            >
              Import Questionnaire JSON
            </button>
          </section>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-builder { display: grid; gap: 16px; }
    .emr-builder__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
    .emr-builder__header h2 { margin: 2px 0 6px; font-size: var(--emr-text-2xl); }
    .emr-builder__subtitle { margin: 0; color: var(--emr-text-muted); max-width: 720px; line-height: 1.45; }
    .emr-builder__actions, .emr-builder__inline-actions, .emr-version-toggle { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .emr-eyebrow { margin: 0 0 4px; color: var(--emr-text-muted); font-size: var(--emr-text-2xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .emr-builder__layout { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr); gap: 16px; align-items: start; }
    .emr-builder__main, .emr-builder__sidebar { display: grid; gap: 16px; }
    .emr-builder-card { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); padding: 16px; display: grid; gap: 12px; }
    .emr-builder-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .emr-builder-card h3 { margin: 2px 0 0; font-size: var(--emr-text-lg); }
    .emr-builder-grid { display: grid; grid-template-columns: minmax(130px, 170px) minmax(0, 1fr); gap: 10px 12px; align-items: center; }
    .emr-builder-label { color: var(--emr-text-muted); font-size: var(--emr-text-sm); font-weight: 600; }
    .emr-badge { padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 999px; background: var(--emr-surface-raised); font-size: var(--emr-text-xs); font-weight: 600; }
    .emr-pill { padding: 5px 12px; border: 1px solid var(--emr-border); border-radius: 999px; background: var(--emr-surface); color: var(--emr-text); font-size: var(--emr-text-xs); cursor: pointer; }
    .emr-pill--active { background: var(--emr-primary-soft, var(--emr-surface-raised)); border-color: var(--emr-primary, var(--emr-border)); font-weight: 700; }
    .emr-table-wrap { overflow-x: auto; }
    .emr-mapping-table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-sm); }
    .emr-mapping-table th, .emr-mapping-table td { padding: 10px 8px; text-align: left; border-bottom: 1px solid var(--emr-border); vertical-align: middle; }
    .emr-mapping-row--selected { background: var(--emr-surface-raised); }
    .emr-diagnostics-card { border-color: var(--emr-warning); background: var(--emr-warning-soft); }
    .emr-diagnostic-list { margin: 0; padding-left: 20px; font-size: var(--emr-text-sm); display: grid; gap: 4px; }
    .emr-fhir-json { margin: 0; padding: 10px; border-radius: 8px; border: 1px solid var(--emr-border); background: var(--emr-surface-raised); max-height: 280px; overflow: auto; font-size: var(--emr-text-xs); white-space: pre-wrap; }
    .emr-builder__alert { padding: 10px 12px; border-radius: 8px; font-size: var(--emr-text-sm); }
    .emr-builder__alert--danger { background: var(--emr-danger-soft); color: var(--emr-danger); }
    @media (max-width: 900px) {
      .emr-builder__layout { grid-template-columns: 1fr; }
    }
  `],
})
export class EmrFhirQuestionnaireMapperComponent {
  @Input({ required: true }) model!: FhirQuestionnaireMapperViewModel;
  @Input() headingId = 'emr-fhir-questionnaire-mapper-heading';
  @Output() readonly intent = new EventEmitter<FhirQuestionnaireMapperIntent>();

  readonly fhirItemTypes = FHIR_ITEM_TYPES;
  newCodingCode = '';
  newCodingDisplay = '';
  importJsonDraft = '';

  get readOnly(): boolean {
    return !!this.model?.readOnly;
  }

  id(suffix: string): string {
    return `${this.headingId}-${suffix}`;
  }

  text(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  emit(intent: FhirQuestionnaireMapperIntent): void {
    if (!this.readOnly || intent.type === 'mappingRowSelected') {
      this.intent.emit(intent);
    }
  }

  toggleFhirVersion(fhirVersion: FhirQuestionnaireVersion): void {
    this.emit({ type: 'fhirVersionToggled', fhirVersion });
  }

  selectRow(linkId: string): void {
    this.emit({ type: 'mappingRowSelected', linkId });
  }

  selectedRow(): FhirFieldMappingRow | undefined {
    const targetId = this.model.selectedLinkId ?? this.model.rows[0]?.linkId;
    return this.model.rows.find(r => r.linkId === targetId);
  }

  updateRowFhirType(linkId: string, fhirItemType: string): void {
    this.emit({
      type: 'fieldMappingUpdated',
      linkId,
      changes: { fhirItemType: fhirItemType as FhirQuestionnaireItemType },
    });
  }

  updateRowUcum(linkId: string, ucumCode: string): void {
    this.emit({
      type: 'fieldMappingUpdated',
      linkId,
      changes: { ucumCode },
    });
  }

  bindTerminologyCode(linkId: string): void {
    const code = this.newCodingCode.trim();
    if (!code || this.readOnly) return;
    const terminologyCode: FhirCoding = {
      system: 'http://loinc.org',
      code,
      display: this.newCodingDisplay.trim() || code,
    };
    this.emit({
      type: 'fieldMappingUpdated',
      linkId,
      changes: { terminologyCode },
    });
    this.newCodingCode = '';
    this.newCodingDisplay = '';
  }

  questionnaireJson(): string {
    return this.model.rawJsonDraft ?? JSON.stringify(this.model.questionnaire, null, 2);
  }

  importQuestionnaire(): void {
    const raw = this.importJsonDraft.trim();
    if (!raw || this.readOnly) return;
    this.emit({ type: 'questionnaireImportRequested', rawJson: raw });
  }
}
