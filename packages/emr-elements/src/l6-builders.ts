import { css, html, nothing, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import type {
  ClinicalFieldValue,
  EmrCondition,
  EmrExpr,
  EmrScoreResult,
  EmrTone,
} from '@drguptavivek/emr-controller';
import type {
  ConditionNode,
  ConditionPredicateNode,
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
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement, emrShadowStyles } from './foundations.js';

const builderStyles = css`
  .builder-card { display: grid; gap: 12px; border: 1px solid var(--emr-border); border-radius: var(--emr-radius-lg, 12px); background: var(--emr-surface); padding: 16px; }
  .builder-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
  .builder-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .builder-list { display: grid; gap: 8px; }
  .builder-item { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 10px; border: 1px solid var(--emr-border); border-radius: var(--emr-radius, 8px); background: var(--emr-surface-raised, var(--emr-surface)); }
  .builder-muted { color: var(--emr-text-muted); font-size: var(--emr-text-sm); }
  .builder-error { color: var(--emr-danger); }
  .builder-issues { display: grid; gap: 6px; padding: 12px; border-radius: var(--emr-radius, 8px); background: var(--emr-warning-soft); }
  pre { max-height: 260px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font-size: var(--emr-text-xs); margin: 0; padding: 10px; border: 1px solid var(--emr-border); border-radius: var(--emr-radius, 8px); background: var(--emr-surface-raised, var(--emr-surface)); }
`;

const LOGIC_OPERATORS: readonly LogicRuleOperator[] = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains', 'exists', 'empty',
];
const LOGIC_COMBINATORS: readonly LogicRuleCombinator[] = ['all', 'any', 'not'];
const LOGIC_EFFECTS: readonly LogicRuleEffectKind[] = ['enableWhen', 'requiredWhen', 'alert'];
const MISSING_POLICIES: readonly MissingItemPolicy[] = ['require-all', 'prorate', 'treat-as-zero'];
const SCORE_TONES: readonly EmrTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const FHIR_TYPES: readonly FhirQuestionnaireItemType[] = [
  'group', 'display', 'boolean', 'decimal', 'integer', 'date', 'dateTime',
  'time', 'string', 'text', 'url', 'choice', 'open-choice', 'coding',
  'attachment', 'reference', 'quantity',
];

function isEmptyVal(v: ClinicalFieldValue | undefined): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  return typeof v === 'object' && 'value' in v && 'unit' in v && (v as { value: unknown }).value === null;
}

function parseInputScalar(raw: string): string | number | boolean | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : raw;
}

function compileTreeToEmrCondition(node: ConditionNode): EmrCondition {
  if (node.kind === 'group') {
    const children = node.children.map(compileTreeToEmrCondition);
    if (node.combinator === 'not') {
      const inner: EmrCondition =
        children.length === 0 ? { all: [] } : children.length === 1 ? children[0]! : { all: children };
      return { not: inner };
    }
    return node.combinator === 'any' ? { any: children } : { all: children };
  }
  const left: EmrExpr = { path: node.fieldId };
  const right: EmrExpr = {
    value: Array.isArray(node.value) ? node.value.join(' ') : ((node.value ?? '') as string | number | boolean | null),
  };
  switch (node.operator) {
    case 'eq': return { op: '=', left, right };
    case 'neq': return { op: '!=', left, right };
    case 'gt': return { op: '>', left, right };
    case 'gte': return { op: '>=', left, right };
    case 'lt': return { op: '<', left, right };
    case 'lte': return { op: '<=', left, right };
    case 'exists': return { op: '!=', left, right: { value: '' } };
    case 'empty': return { op: '=', left, right: { value: '' } };
    case 'contains': return { fn: 'includesValue', args: [left, right] };
    case 'in': {
      const items = Array.isArray(node.value)
        ? node.value
        : typeof node.value === 'string'
          ? node.value.split(',').map(s => s.trim()).filter(Boolean)
          : node.value !== null && node.value !== undefined
            ? [String(node.value)]
            : [];
      return { any: items.map(item => ({ op: '=' as const, left, right: { value: item } })) };
    }
  }
}

function evalNodeOutcome(
  node: ConditionNode,
  testValues: Readonly<Record<string, ClinicalFieldValue>>,
): LogicSandboxOutcome {
  if (node.kind === 'predicate') {
    const fid = node.fieldId.trim();
    if (!fid) return 'indeterminate';
    const raw = testValues[fid];
    if (node.operator === 'exists') return !isEmptyVal(raw) ? 'true' : 'false';
    if (node.operator === 'empty') return isEmptyVal(raw) ? 'true' : 'false';
    if (isEmptyVal(raw)) return 'indeterminate';
    const actualStr = String(raw ?? '');
    const expectedStr = Array.isArray(node.value) ? node.value.join(',') : String(node.value ?? '');
    if (node.operator === 'contains') return actualStr.includes(expectedStr) ? 'true' : 'false';
    if (node.operator === 'in') {
      const items = Array.isArray(node.value) ? node.value.map(String) : expectedStr.split(',').map(s => s.trim());
      return items.includes(actualStr) ? 'true' : 'false';
    }
    const a = Number(actualStr), b = Number(expectedStr);
    const numCmp = Number.isFinite(a) && Number.isFinite(b);
    switch (node.operator) {
      case 'eq': return (numCmp ? a === b : actualStr === expectedStr) ? 'true' : 'false';
      case 'neq': return (numCmp ? a !== b : actualStr !== expectedStr) ? 'true' : 'false';
      case 'gt': return a > b ? 'true' : 'false';
      case 'gte': return a >= b ? 'true' : 'false';
      case 'lt': return a < b ? 'true' : 'false';
      case 'lte': return a <= b ? 'true' : 'false';
    }
  }
  const outcomes = node.children.map(c => evalNodeOutcome(c, testValues));
  if (node.combinator === 'all') {
    if (outcomes.includes('false')) return 'false';
    if (outcomes.includes('indeterminate')) return 'indeterminate';
    return 'true';
  }
  if (node.combinator === 'any') {
    if (outcomes.includes('true')) return 'true';
    if (outcomes.includes('indeterminate')) return 'indeterminate';
    return 'false';
  }
  const inner = outcomes[0] ?? 'true';
  if (inner === 'indeterminate') return 'indeterminate';
  return inner === 'true' ? 'false' : 'true';
}

// ---------------------------------------------------------------------------
// 1. EmrLogicRuleBuilderElement
// ---------------------------------------------------------------------------

export class EmrLogicRuleBuilderElement extends EmrModelElement<LogicRuleBuilderViewModel, LogicRuleBuilderIntent> {
  static override styles = [emrShadowStyles, builderStyles];
  private nextId = 1;

  private get locked(): boolean { return !!this.model?.readOnly; }
  private sendIfEditable(intent: LogicRuleBuilderIntent): void {
    if (!this.locked) this.send(intent);
  }

  private evaluateSandbox(model: LogicRuleBuilderViewModel): LogicSandboxEvaluation {
    if (model.evaluation) return model.evaluation;
    const outcome = evalNodeOutcome(model.root, model.testValues);
    return {
      outcome,
      referencedFields: [],
      missingFields: [],
      summary: outcome === 'true' ? 'Rule evaluates to TRUE' : outcome === 'false' ? 'Rule evaluates to FALSE' : 'Rule is INDETERMINATE',
    };
  }

  private buildArtifact(model: LogicRuleBuilderViewModel): VersionedLogicArtifact {
    return model.exportedArtifact ?? {
      schemaVersion: '1.0',
      engineVersion: model.engineVersion ?? 3,
      ruleId: model.ruleId || 'logic-rule',
      label: model.label || 'Untitled logic rule',
      ...(model.description ? { description: model.description } : {}),
      root: model.root,
      compiledCondition: compileTreeToEmrCondition(model.root),
      target: model.target,
    };
  }

  private addPredicate(parentGroupId: string): void {
    if (!this.model || this.locked) return;
    this.sendIfEditable({
      type: 'predicateAdded',
      parentGroupId,
      predicate: {
        kind: 'predicate',
        id: `pred-${this.nextId++}`,
        fieldId: this.model.availableFields[0]?.id ?? '',
        operator: 'eq',
        value: '',
      },
    });
  }

  private addGroup(parentGroupId: string): void {
    if (!this.model || this.locked) return;
    this.sendIfEditable({
      type: 'groupAdded',
      parentGroupId,
      group: {
        kind: 'group',
        id: `grp-${this.nextId++}`,
        combinator: 'all',
        children: [],
      },
    });
  }

  private renderPredicate(pred: ConditionPredicateNode, model: LogicRuleBuilderViewModel): TemplateResult {
    return html`<div class="builder-item" data-predicate-id=${pred.id}>
      <label class="emr-field">Field<select class="emr-control" .value=${pred.fieldId} ?disabled=${this.locked}
        @change=${(e: Event) => this.sendIfEditable({ type: 'predicateUpdated', predicateId: pred.id, changes: { fieldId: (e.target as HTMLSelectElement).value } })}>
        ${model.availableFields.map(f => html`<option value=${f.id} ?selected=${f.id === pred.fieldId}>${f.label} (${f.id})</option>`)}
      </select></label>
      <label class="emr-field">Operator<select class="emr-control" .value=${pred.operator} ?disabled=${this.locked}
        @change=${(e: Event) => this.sendIfEditable({ type: 'predicateUpdated', predicateId: pred.id, changes: { operator: (e.target as HTMLSelectElement).value as LogicRuleOperator } })}>
        ${LOGIC_OPERATORS.map(op => html`<option value=${op} ?selected=${op === pred.operator}>${op}</option>`)}
      </select></label>
      ${pred.operator !== 'exists' && pred.operator !== 'empty' ? html`
        <label class="emr-field">Value<input class="emr-control" .value=${pred.value === null ? '' : String(pred.value)} ?disabled=${this.locked}
          @input=${(e: Event) => this.sendIfEditable({ type: 'predicateUpdated', predicateId: pred.id, changes: { value: parseInputScalar((e.target as HTMLInputElement).value) } })}></label>
      ` : nothing}
      ${this.action('Remove predicate', { type: 'nodeRemoved', nodeId: pred.id }, () => !this.locked)}
    </div>`;
  }

  private renderNode(node: ConditionNode, model: LogicRuleBuilderViewModel, isRoot = false): TemplateResult {
    if (node.kind === 'predicate') return this.renderPredicate(node, model);
    return html`<div class="builder-card" data-group-id=${node.id}>
      <div class="builder-row">
        <strong>${isRoot ? 'Root Group' : `Group (${node.id})`}</strong>
        ${LOGIC_COMBINATORS.map(comb => html`<button type="button" class="emr-btn emr-btn--secondary"
          aria-pressed=${String(node.combinator === comb)} ?disabled=${this.locked}
          @click=${() => this.sendIfEditable({ type: 'combinatorChanged', groupId: node.id, combinator: comb })}>${comb.toUpperCase()}</button>`)}
        <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked} @click=${() => this.addPredicate(node.id)}>Add predicate</button>
        ${isRoot ? html`<button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked} @click=${() => this.addGroup(node.id)}>Add group</button>`
          : this.action('Remove group', { type: 'nodeRemoved', nodeId: node.id }, () => !this.locked)}
      </div>
      <div class="builder-list">${node.children.map(c => this.renderNode(c, model, false))}</div>
    </div>`;
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const engineVersion = model.engineVersion ?? 3;
    const evaluation = this.evaluateSandbox(model);
    const artifact = this.buildArtifact(model);

    return this.panel('Logic Rule Builder', html`
      <header class="builder-row">
        <span class="emr-badge">CURRENT_LOGIC_ENGINE_VERSION = v${engineVersion}</span>
        <span class="emr-badge" role="status">${evaluation.outcome.toUpperCase()}</span>
        ${this.action('Export artifact', { type: 'artifactExportRequested', artifact }, () => !this.locked)}
        ${this.action(model.saving ? 'Saving…' : 'Save rule', { type: 'artifactSaved', artifact }, () => !this.locked && !model.saving)}
      </header>
      ${model.error ? html`<p class="builder-error" role="alert">${model.error}</p>` : nothing}
      <section class="builder-card" aria-label="Rule metadata and target">
        <h4 class="emr-title">${model.label || 'Untitled logic rule'}</h4>
        <div class="builder-grid">
          <label class="emr-field">Rule label<input class="emr-control" .value=${model.label} ?disabled=${this.locked}
            @input=${(e: Event) => this.sendIfEditable({ type: 'ruleMetaPatched', label: (e.target as HTMLInputElement).value, description: model.description })}></label>
          <label class="emr-field">Target effect<select class="emr-control" .value=${model.target.effect} ?disabled=${this.locked}
            @change=${(e: Event) => this.sendIfEditable({ type: 'targetChanged', target: { ...model.target, effect: (e.target as HTMLSelectElement).value as LogicRuleEffectKind } })}>
            ${LOGIC_EFFECTS.map(eff => html`<option value=${eff} ?selected=${eff === model.target.effect}>${eff}</option>`)}
          </select></label>
          <label class="emr-field">Target field<select class="emr-control" .value=${model.target.targetFieldId} ?disabled=${this.locked}
            @change=${(e: Event) => this.sendIfEditable({ type: 'targetChanged', target: { ...model.target, targetFieldId: (e.target as HTMLSelectElement).value } })}>
            ${model.availableFields.map(f => html`<option value=${f.id} ?selected=${f.id === model.target.targetFieldId}>${f.label}</option>`)}
          </select></label>
        </div>
      </section>
      <section class="builder-card" aria-label="Condition tree">
        <h4 class="emr-title">ConditionNode Tree</h4>
        ${this.renderNode(model.root, model, true)}
      </section>
      <section class="builder-card" aria-label="Sandbox test evaluator">
        <h4 class="emr-title">Sandbox Evaluator · ${evaluation.summary}</h4>
        <div class="builder-grid">
          ${model.availableFields.map(f => html`<label class="emr-field">${f.label} (${f.id})<input class="emr-control"
            aria-label=${`Test value for ${f.id}`}
            .value=${model.testValues[f.id] === undefined || model.testValues[f.id] === null ? '' : String(model.testValues[f.id])}
            ?disabled=${this.locked}
            @input=${(e: Event) => this.sendIfEditable({ type: 'testValueChanged', fieldId: f.id, value: parseInputScalar((e.target as HTMLInputElement).value) })}></label>`)}
        </div>
        <pre>${JSON.stringify(artifact, null, 2)}</pre>
      </section>
    `);
  }
}

// ---------------------------------------------------------------------------
// 2. EmrScoreBuilderElement
// ---------------------------------------------------------------------------

export class EmrScoreBuilderElement extends EmrModelElement<ScoreBuilderViewModel, ScoreBuilderIntent> {
  static override styles = [emrShadowStyles, builderStyles];
  private nextId = 1;

  private get locked(): boolean { return !!this.model?.readOnly; }
  private sendIfEditable(intent: ScoreBuilderIntent): void {
    if (!this.locked) this.send(intent);
  }

  private computePreview(model: ScoreBuilderViewModel): EmrScoreResult {
    if (model.previewResult) return model.previewResult;
    const def = model.definition;
    const answers = model.sampleAnswers;
    const missingItems: string[] = [];
    let answeredSum = 0;
    let answeredWeight = 0;
    let totalWeight = 0;
    let answeredCount = 0;

    for (const item of def.items) {
      const w = Number.isFinite(item.weight) ? item.weight : 1;
      totalWeight += w;
      const ans = answers[item.fieldId];
      let pts: number | null = null;
      if (!isEmptyVal(ans)) {
        if (typeof ans === 'number' && Number.isFinite(ans)) pts = ans;
        else if (typeof ans === 'string') {
          if (item.optionPoints && ans.trim() in item.optionPoints) pts = item.optionPoints[ans.trim()]!;
          else if (Number.isFinite(Number(ans))) pts = Number(ans);
        }
      }
      if (pts === null) missingItems.push(item.fieldId);
      else {
        answeredSum += Math.round(pts * w * 100) / 100;
        answeredWeight += w;
        answeredCount += 1;
      }
    }

    const completenessLabel = `${answeredCount}/${def.items.length} items complete`;
    if (def.missingItemPolicy === 'require-all' && missingItems.length > 0) {
      return {
        total: Math.round(answeredSum * 100) / 100,
        bandLabel: 'Incomplete — required items missing',
        bandTone: 'neutral',
        missingItems,
        completenessLabel,
      };
    }
    let total = answeredSum;
    if (def.missingItemPolicy === 'prorate' && missingItems.length > 0 && answeredWeight > 0) {
      total = (answeredSum * totalWeight) / answeredWeight;
    }
    total = Math.round(total * 100) / 100;
    const band = def.bands.find(b => total >= b.minScore && total <= b.maxScore);
    return {
      total,
      bandLabel: band?.label ?? 'Unclassified score',
      bandTone: band?.tone ?? 'neutral',
      missingItems,
      completenessLabel,
      ...(band?.clinicalGuidance ? { interpretation: band.clinicalGuidance } : {}),
    };
  }

  private addItem(): void {
    if (!this.model || this.locked) return;
    const idx = this.model.definition.items.length + this.nextId++;
    const item: ScoreItemDefinition = {
      id: `score-item-${idx}`,
      fieldId: `item_${idx}`,
      label: `Score item ${idx}`,
      weight: 1,
      required: true,
    };
    this.sendIfEditable({ type: 'scoreItemAdded', item });
  }

  private addBand(): void {
    if (!this.model || this.locked) return;
    const idx = this.model.definition.bands.length + this.nextId++;
    const band: ScoreThresholdBand = {
      id: `score-band-${idx}`,
      minScore: 0,
      maxScore: 10,
      label: `Band ${idx}`,
      tone: 'neutral',
    };
    this.sendIfEditable({ type: 'scoreBandAdded', band });
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const def = model.definition;
    const preview = this.computePreview(model);

    return this.panel('Score Builder', html`
      <header class="builder-row">
        <span class="emr-badge">v${def.versionStamp}</span>
        <span class="emr-badge">Policy: ${def.missingItemPolicy}</span>
        ${this.action(model.saving ? 'Saving…' : 'Save score definition', { type: 'scoreDefinitionSaved', definition: def }, () => !this.locked && !model.saving)}
      </header>
      <section class="builder-card" aria-label="Score instrument metadata">
        <h4 class="emr-title">${def.title || 'Untitled score instrument'}</h4>
        <div class="builder-grid">
          <label class="emr-field">Title<input class="emr-control" .value=${def.title} ?disabled=${this.locked}
            @input=${(e: Event) => this.sendIfEditable({ type: 'scoreMetaPatched', changes: { title: (e.target as HTMLInputElement).value } })}></label>
          <label class="emr-field">Version stamp<input class="emr-control" .value=${def.versionStamp} ?disabled=${this.locked}
            @input=${(e: Event) => this.sendIfEditable({ type: 'scoreMetaPatched', changes: { versionStamp: (e.target as HTMLInputElement).value } })}></label>
          <label class="emr-field">Missing-item policy<select class="emr-control" .value=${def.missingItemPolicy} ?disabled=${this.locked}
            @change=${(e: Event) => this.sendIfEditable({ type: 'missingPolicyChanged', policy: (e.target as HTMLSelectElement).value as MissingItemPolicy })}>
            ${MISSING_POLICIES.map(pol => html`<option value=${pol} ?selected=${pol === def.missingItemPolicy}>${pol}</option>`)}
          </select></label>
        </div>
      </section>
      <section class="builder-card" aria-label="Weighted score items">
        <div class="builder-row">
          <h4 class="emr-title">Weighted Items (${def.items.length})</h4>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked} @click=${this.addItem}>Add score item</button>
        </div>
        <div class="builder-list">
          ${def.items.map(item => html`<div class="builder-item">
            <span><strong>${item.label}</strong> (${item.fieldId} · ×${item.weight})</span>
            ${this.action('Remove item', { type: 'scoreItemRemoved', itemId: item.id }, () => !this.locked)}
          </div>`)}
        </div>
      </section>
      <section class="builder-card" aria-label="Threshold bands">
        <div class="builder-row">
          <h4 class="emr-title">Interpretation Bands (${def.bands.length})</h4>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked} @click=${this.addBand}>Add threshold band</button>
        </div>
        <div class="builder-list">
          ${def.bands.map(band => html`<div class="builder-item">
            <span><strong>${band.label}</strong> [${band.minScore}..${band.maxScore}] · ${band.tone}</span>
            <select class="emr-control" aria-label=${`Tone for ${band.id}`} .value=${band.tone} ?disabled=${this.locked}
              @change=${(e: Event) => this.sendIfEditable({ type: 'scoreBandUpdated', bandId: band.id, changes: { tone: (e.target as HTMLSelectElement).value as EmrTone } })}>
              ${SCORE_TONES.map(t => html`<option value=${t} ?selected=${t === band.tone}>${t}</option>`)}
            </select>
            ${this.action('Remove band', { type: 'scoreBandRemoved', bandId: band.id }, () => !this.locked)}
          </div>`)}
        </div>
      </section>
      <section class="builder-card" aria-label="Live preview calculator" role="status">
        <h4 class="emr-title">Live Preview Calculator · Total: ${preview.total}</h4>
        <p><strong>${preview.bandLabel}</strong> (${preview.bandTone}) · ${preview.completenessLabel}</p>
        ${preview.interpretation ? html`<p class="builder-muted">${preview.interpretation}</p>` : nothing}
        <div class="builder-grid">
          ${def.items.map(item => html`<label class="emr-field">${item.label}<input class="emr-control"
            aria-label=${`Sample answer for ${item.fieldId}`}
            .value=${model.sampleAnswers[item.fieldId] === undefined || model.sampleAnswers[item.fieldId] === null ? '' : String(model.sampleAnswers[item.fieldId])}
            ?disabled=${this.locked}
            @input=${(e: Event) => this.sendIfEditable({ type: 'sampleAnswerChanged', fieldId: item.fieldId, value: parseInputScalar((e.target as HTMLInputElement).value) })}></label>`)}
        </div>
      </section>
    `);
  }
}

// ---------------------------------------------------------------------------
// 3. EmrFhirQuestionnaireMapperElement
// ---------------------------------------------------------------------------

export class EmrFhirQuestionnaireMapperElement extends EmrModelElement<
  FhirQuestionnaireMapperViewModel,
  FhirQuestionnaireMapperIntent
> {
  static override styles = [emrShadowStyles, builderStyles];
  @state() private importJsonDraft = '';
  @state() private newCodingCode = '';

  private get locked(): boolean { return !!this.model?.readOnly; }
  private sendIfEditable(intent: FhirQuestionnaireMapperIntent): void {
    if (!this.locked || intent.type === 'mappingRowSelected') this.send(intent);
  }

  private selectedRow(model: FhirQuestionnaireMapperViewModel): FhirFieldMappingRow | undefined {
    const id = model.selectedLinkId ?? model.rows[0]?.linkId;
    return model.rows.find(r => r.linkId === id);
  }

  private bindCode(linkId: string): void {
    const code = this.newCodingCode.trim();
    if (!code || this.locked) return;
    this.sendIfEditable({
      type: 'fieldMappingUpdated',
      linkId,
      changes: { terminologyCode: { system: 'http://loinc.org', code, display: code } },
    });
    this.newCodingCode = '';
  }

  private importJson(): void {
    const raw = this.importJsonDraft.trim();
    if (!raw || this.locked) return;
    this.sendIfEditable({ type: 'questionnaireImportRequested', rawJson: raw });
  }

  protected override render() {
    const model = this.model;
    if (!model) return nothing;
    const activeRow = this.selectedRow(model);
    const jsonPreview = model.rawJsonDraft ?? JSON.stringify(model.questionnaire, null, 2);

    return this.panel('FHIR Questionnaire Mapper', html`
      <header class="builder-row">
        <div>
          <h4 class="emr-title">${model.schema.label || 'FHIR Questionnaire Mapper'}</h4>
          <span class="builder-muted">FHIR ${model.fhirVersion} (${model.fhirVersion === 'R5' ? '5.0.0' : '4.0.1'})</span>
        </div>
        ${(['R4', 'R5'] as readonly FhirQuestionnaireVersion[]).map(v =>
          this.action(`FHIR ${v}`, { type: 'fhirVersionToggled', fhirVersion: v }, () => !this.locked),
        )}
        ${this.action('Verify round-trip', { type: 'roundTripVerified' }, () => !this.locked)}
        ${this.action(`Export FHIR ${model.fhirVersion}`, { type: 'questionnaireExportRequested', fhirVersion: model.fhirVersion }, () => !this.locked)}
      </header>
      ${model.diagnostics.length ? html`<div class="builder-issues" role="status">
        <strong>Round-trip diagnostics (${model.diagnostics.length})</strong>
        <ul>${model.diagnostics.map(d => html`<li><b>${d.severity}</b> · ${d.linkId ? `${d.linkId}: ` : ''}${d.message}</li>`)}</ul>
      </div>` : nothing}
      <section class="builder-card" aria-label="Side-by-side field mapping table">
        <h4 class="emr-title">Field Mapping Table (${model.rows.length})</h4>
        <div class="emr-scroll">
          <table class="emr-table">
            <thead><tr><th>Field</th><th>EMR Type</th><th>FHIR Type</th><th>Terminology / UCUM</th><th>Inspect</th></tr></thead>
            <tbody>
              ${model.rows.map(row => html`<tr>
                <td><strong>${row.label}</strong><br><small>${row.linkId}</small></td>
                <td><span class="emr-badge">${row.emrValueType}</span></td>
                <td>
                  <select class="emr-control" aria-label=${`FHIR item type for ${row.linkId}`} .value=${row.fhirItemType} ?disabled=${this.locked}
                    @change=${(e: Event) => this.sendIfEditable({ type: 'fieldMappingUpdated', linkId: row.linkId, changes: { fhirItemType: (e.target as HTMLSelectElement).value as FhirQuestionnaireItemType } })}>
                    ${FHIR_TYPES.map(ft => html`<option value=${ft} ?selected=${ft === row.fhirItemType}>${ft}</option>`)}
                  </select>
                </td>
                <td>
                  ${row.terminologyCodes.map(c => html`<span class="emr-badge">${c.code}</span>`)}
                  ${row.ucumUnit ? html`<span class="emr-badge">UCUM: ${row.ucumUnit.code}</span>` : nothing}
                </td>
                <td>${this.action(row.linkId === activeRow?.linkId ? 'Selected' : 'Inspect', { type: 'mappingRowSelected', linkId: row.linkId })}</td>
              </tr>`)}
            </tbody>
          </table>
        </div>
      </section>
      ${activeRow ? html`<section class="builder-card" aria-label="Terminology binding inspector">
        <h4 class="emr-title">Inspector: ${activeRow.label} (${activeRow.linkId})</h4>
        <div class="builder-row">
          <input class="emr-control" aria-label="New terminology code" placeholder="LOINC/SNOMED code" .value=${this.newCodingCode} ?disabled=${this.locked}
            @input=${(e: Event) => { if (!this.locked) this.newCodingCode = (e.target as HTMLInputElement).value; }}>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked || !this.newCodingCode.trim()} @click=${() => this.bindCode(activeRow.linkId)}>Bind code</button>
        </div>
      </section>` : nothing}
      <section class="builder-card" aria-label="Live FHIR Questionnaire JSON preview">
        <h4 class="emr-title">Live FHIR Questionnaire JSON</h4>
        <pre>${jsonPreview}</pre>
        <label class="emr-field">Import FHIR Questionnaire JSON<textarea class="emr-control" aria-label="Import FHIR Questionnaire JSON" .value=${this.importJsonDraft} ?readonly=${this.locked}
          @input=${(e: Event) => { if (!this.locked) this.importJsonDraft = (e.target as HTMLTextAreaElement).value; }}></textarea></label>
        <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked || !this.importJsonDraft.trim()} @click=${this.importJson}>Import Questionnaire</button>
      </section>
    `);
  }
}

export function registerL6BuilderElements(): void {
  defineEmrElement('emr-logic-rule-builder', EmrLogicRuleBuilderElement);
  defineEmrElement('emr-score-builder', EmrScoreBuilderElement);
  defineEmrElement('emr-fhir-questionnaire-mapper', EmrFhirQuestionnaireMapperElement);
}
