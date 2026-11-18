'use client';

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { ClinicalOption, EmrTone } from '@drguptavivek/emr-controller';
import type {
  ConditionNode,
  ConditionPredicateNode,
  FhirQuestionnaireItemType,
  FhirQuestionnaireMapperIntent,
  FhirQuestionnaireMapperViewModel,
  FhirQuestionnaireVersion,
  LogicRuleBuilderIntent,
  LogicRuleBuilderViewModel,
  LogicRuleCombinator,
  LogicRuleEffectKind,
  LogicRuleOperator,
  MissingItemPolicy,
  ScoreBuilderIntent,
  ScoreBuilderViewModel,
  ScoreItemDefinition,
  ScoreThresholdBand,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import {
  CURRENT_LOGIC_ENGINE_VERSION,
  FHIR_ITEM_TYPE_OPTIONS,
  LOGIC_COMBINATOR_OPTIONS,
  LOGIC_EFFECT_OPTIONS,
  LOGIC_RULE_OPERATOR_OPTIONS,
  MISSING_ITEM_POLICY_OPTIONS,
  SCORE_BAND_TONE_OPTIONS,
  buildLoincOrCustomCoding,
  createBlankGroupNode,
  createBlankPredicateNode,
  createBlankScoreBand,
  createBlankScoreItem,
  formatScalarInput,
  parseScalarInput,
  resolveLogicBuilderArtifact,
  resolveLogicBuilderSandbox,
  resolveScoreBuilderPreview,
  resolveSelectedFhirMappingRow,
} from './l6-builders.logic';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

type PressState = PressableStateCallbackType & { focused?: boolean };

export type {
  FhirQuestionnaireMapperIntent,
  FhirQuestionnaireMapperViewModel,
  LogicRuleBuilderIntent,
  LogicRuleBuilderViewModel,
  ScoreBuilderIntent,
  ScoreBuilderViewModel,
};

// ---------------------------------------------------------------------------
// 1. EmrLogicRuleBuilder
// ---------------------------------------------------------------------------

export const LOGIC_RULE_BUILDER_DEFAULTS = {
  eyebrow: (v: number) => `L6 Visual Logic Authoring · Engine v${v}`,
  untitledRule: 'Untitled Logic Rule',
  defaultDescription:
    'Compose boolean condition groups (ALL / ANY / NOT), predicate leaf rows, target actions, and verify against live sandbox values.',
  exportArtifact: 'Export Artifact',
  saveArtifact: 'Save Rule Artifact',
  saving: 'Saving…',
  targetEyebrow: 'Target & Effect',
  targetHeading: 'When condition is met',
  ruleLabel: 'Rule label',
  targetEffectLabel: 'Target effect',
  targetFieldLabel: 'Target field',
  alertMessageLabel: 'Alert banner message',
  treeEyebrow: 'ConditionNode Tree',
  treeHeading: 'Boolean groups & leaf predicates',
  addPredicate: '+ Add Predicate',
  addSubgroup: '+ Add Subgroup',
  remove: 'Remove',
  sandboxEyebrow: 'Sandbox Evaluator',
  sandboxHeading: 'Live rule verification',
  artifactPreviewEyebrow: 'VersionedLogicArtifact Preview',
} as const;

/** L6 visual logic rule builder for ConditionNode trees, target effects, engine version stamp, and live sandbox evaluation. */
export function EmrLogicRuleBuilder({
  model,
  headingId = 'emr-logic-rule-builder-heading',
  labels,
  onIntent,
}: {
  model: LogicRuleBuilderViewModel;
  headingId?: string;
  labels?: Partial<typeof LOGIC_RULE_BUILDER_DEFAULTS>;
  onIntent: (intent: LogicRuleBuilderIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...LOGIC_RULE_BUILDER_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const [counter, setCounter] = useState(1);

  const emit = (intent: LogicRuleBuilderIntent) => {
    if (!readOnly) onIntent(intent);
  };

  const engineVer = model.engineVersion ?? CURRENT_LOGIC_ENGINE_VERSION;
  const evaluation = resolveLogicBuilderSandbox(model);
  const artifact = resolveLogicBuilderArtifact(model);

  const fieldOptions: ClinicalOption[] = model.availableFields.map(f => ({
    value: f.id,
    label: `${f.label} (${f.id})`,
  }));

  const handleAddPredicate = (parentGroupId: string) => {
    const nextId = `pred-${counter}`;
    setCounter(c => c + 1);
    emit({
      type: 'predicateAdded',
      parentGroupId,
      predicate: createBlankPredicateNode(nextId, model.availableFields[0]?.id ?? ''),
    });
  };

  const handleAddGroup = (parentGroupId: string) => {
    const nextId = `grp-${counter}`;
    setCounter(c => c + 1);
    emit({
      type: 'groupAdded',
      parentGroupId,
      group: createBlankGroupNode(nextId, 'all'),
    });
  };

  const renderPredicateRow = (pred: ConditionPredicateNode) => (
    <View
      key={pred.id}
      style={[styles.predicateRow, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={styles.flex}>
        <EmrSelect
          label={`Field for ${pred.id}`}
          options={fieldOptions}
          value={pred.fieldId}
          readOnly={readOnly}
          onChange={fieldId => {
            if (fieldId) emit({ type: 'predicateUpdated', predicateId: pred.id, changes: { fieldId } });
          }}
        />
      </View>
      <View style={styles.flex}>
        <EmrSelect
          label={`Operator for ${pred.id}`}
          options={LOGIC_RULE_OPERATOR_OPTIONS}
          value={pred.operator}
          readOnly={readOnly}
          onChange={op => {
            if (op) {
              emit({
                type: 'predicateUpdated',
                predicateId: pred.id,
                changes: { operator: op as LogicRuleOperator },
              });
            }
          }}
        />
      </View>
      {pred.operator !== 'exists' && pred.operator !== 'empty' ? (
        <View style={styles.flex}>
          <ThemedInput
            id={`${headingId}-${pred.id}-val`}
            aria-label={`Value for ${pred.id}`}
            value={formatScalarInput(pred.value)}
            placeholder="Expected value"
            readOnly={readOnly}
            editable={!readOnly}
            onChangeText={txt =>
              emit({
                type: 'predicateUpdated',
                predicateId: pred.id,
                changes: { value: parseScalarInput(txt) },
              })
            }
          />
        </View>
      ) : (
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>Unary check</Text>
      )}
      <EmrButton
        small
        variant="ghost"
        label={l.remove}
        disabled={readOnly}
        onPress={() => emit({ type: 'nodeRemoved', nodeId: pred.id })}
      />
    </View>
  );

  const renderNode = (node: ConditionNode, isRoot = false) => {
    if (node.kind === 'predicate') return renderPredicateRow(node);
    return (
      <View
        key={node.id}
        style={[
          styles.groupBox,
          {
            borderColor: t.border,
            backgroundColor: isRoot ? t.surfaceRaised : t.surface,
          },
        ]}
      >
        <View style={styles.inlineRow}>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(700), fontFamily: font }}>
            {isRoot ? 'ROOT GROUP' : `GROUP (${node.id})`}
          </Text>
          <View role="group" aria-label={`Combinator for ${node.id}`} style={styles.inlineRow}>
            {LOGIC_COMBINATOR_OPTIONS.map(comb => {
              const active = node.combinator === comb.value;
              return (
                <Pressable
                  key={comb.value}
                  role="button"
                  aria-pressed={active}
                  disabled={readOnly}
                  onPress={() => emit({ type: 'combinatorChanged', groupId: node.id, combinator: comb.value })}
                  style={({ focused }: PressState) => [
                    styles.pillButton,
                    focusRing(t, focused),
                    {
                      borderColor: active ? t.primary : t.border,
                      backgroundColor: active ? t.primarySoft : t.surface,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? t.primary : t.text,
                      fontSize: t.textXs,
                      fontWeight: fontWeight(active ? 700 : 500),
                      fontFamily: font,
                    }}
                  >
                    {comb.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <EmrButton
            small
            variant="outline"
            label={l.addPredicate}
            disabled={readOnly}
            onPress={() => handleAddPredicate(node.id)}
          />
          {isRoot ? (
            <EmrButton
              small
              variant="ghost"
              label={l.addSubgroup}
              disabled={readOnly}
              onPress={() => handleAddGroup(node.id)}
            />
          ) : (
            <EmrButton
              small
              variant="ghost"
              label={l.remove}
              disabled={readOnly}
              onPress={() => emit({ type: 'nodeRemoved', nodeId: node.id })}
            />
          )}
        </View>
        <View style={styles.fieldStack}>{node.children.map(child => renderNode(child, false))}</View>
      </View>
    );
  };

  const outcomeTone: EmrTone =
    evaluation.outcome === 'true'
      ? 'success'
      : evaluation.outcome === 'false'
        ? 'danger'
        : 'warning';

  return (
    <View role="region" aria-labelledby={headingId} style={styles.surfaceStack}>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
            {l.eyebrow(engineVer)}
          </Text>
          <Text
            role="heading"
            aria-level={2}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.text2xl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.label || l.untitledRule}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
            {model.description || l.defaultDescription}
          </Text>
        </View>
        <View style={styles.inlineRow}>
          <EmrBadgeView badge={{ label: `CURRENT_LOGIC_ENGINE_VERSION = v${engineVer}`, tone: 'info' }} />
          <EmrButton
            variant="outline"
            label={l.exportArtifact}
            disabled={readOnly}
            onPress={() => emit({ type: 'artifactExportRequested', artifact })}
          />
          <EmrButton
            label={model.saving ? l.saving : l.saveArtifact}
            disabled={readOnly || !!model.saving}
            onPress={() => emit({ type: 'artifactSaved', artifact })}
          />
        </View>
      </View>

      {model.error ? (
        <View role="alert" style={[styles.alertBox, { backgroundColor: t.dangerSoft }]}>
          <Text style={{ color: t.danger, fontSize: t.textSm, fontFamily: font }}>{model.error}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.targetEyebrow}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {l.targetHeading}
            </Text>
          </View>
          <EmrBadgeView badge={{ label: model.target.effect, tone: 'neutral' }} />
        </View>

        <View style={styles.fieldStack}>
          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.ruleLabel}
            </Text>
            <ThemedInput
              id={`${headingId}-rule-label`}
              aria-label={l.ruleLabel}
              value={model.label}
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={label => emit({ type: 'ruleMetaPatched', label, description: model.description })}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.targetEffectLabel}
            </Text>
            <EmrSelect
              label={l.targetEffectLabel}
              options={LOGIC_EFFECT_OPTIONS}
              value={model.target.effect}
              readOnly={readOnly}
              onChange={eff => {
                if (eff) {
                  emit({
                    type: 'targetChanged',
                    target: { ...model.target, effect: eff as LogicRuleEffectKind },
                  });
                }
              }}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.targetFieldLabel}
            </Text>
            <EmrSelect
              label={l.targetFieldLabel}
              options={fieldOptions}
              value={model.target.targetFieldId}
              readOnly={readOnly}
              onChange={targetFieldId => {
                if (targetFieldId) {
                  emit({
                    type: 'targetChanged',
                    target: { ...model.target, targetFieldId },
                  });
                }
              }}
            />
          </View>

          {model.target.effect === 'alert' ? (
            <View style={styles.fieldRow}>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                {l.alertMessageLabel}
              </Text>
              <ThemedInput
                id={`${headingId}-alert-msg`}
                aria-label={l.alertMessageLabel}
                value={model.target.alertMessage ?? ''}
                readOnly={readOnly}
                editable={!readOnly}
                onChangeText={alertMessage =>
                  emit({
                    type: 'targetChanged',
                    target: { ...model.target, alertMessage },
                  })
                }
              />
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
          {l.treeEyebrow}
        </Text>
        <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
          {l.treeHeading}
        </Text>
        {renderNode(model.root, true)}
      </View>

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.sandboxEyebrow}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {l.sandboxHeading}
            </Text>
          </View>
          <EmrBadgeView badge={{ label: evaluation.outcome.toUpperCase(), tone: outcomeTone }} />
        </View>
        <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
          {evaluation.summary}
        </Text>

        <View style={styles.fieldStack}>
          {model.availableFields.map(f => (
            <View key={f.id} style={styles.fieldRow}>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                {f.label} ({f.id})
              </Text>
              <ThemedInput
                id={`${headingId}-test-${f.id}`}
                aria-label={`Test value for ${f.id}`}
                value={formatScalarInput(model.testValues[f.id])}
                placeholder="Enter sample value…"
                readOnly={readOnly}
                editable={!readOnly}
                onChangeText={txt =>
                  emit({
                    type: 'testValueChanged',
                    fieldId: f.id,
                    value: parseScalarInput(txt),
                  })
                }
              />
            </View>
          ))}
        </View>

        <View style={[styles.codeBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
            {l.artifactPreviewEyebrow}
          </Text>
          <Text style={{ color: t.text, fontSize: t.textXs, fontFamily: font }}>
            {JSON.stringify(artifact, null, 2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrScoreBuilder
// ---------------------------------------------------------------------------

export const SCORE_BUILDER_DEFAULTS = {
  eyebrow: (v: string) => `L6 Clinical Calculator & PRO Scoring Studio · v${v}`,
  untitledInstrument: 'Untitled Score Instrument',
  defaultDescription:
    'Configure weighted item definitions, option-to-points maps, missing-item policies, and threshold interpretation bands.',
  saveScore: 'Save Score Definition',
  saving: 'Saving…',
  contractEyebrow: 'Instrument Contract',
  contractHeading: 'Identity & missing-item policy',
  instrumentIdLabel: 'Instrument ID',
  titleLabel: 'Title',
  versionStampLabel: 'Version stamp',
  missingPolicyLabel: 'Missing-item policy',
  itemsEyebrow: 'Score Items',
  itemsHeading: (count: number) => `Weighted item definitions (${count})`,
  addItem: '+ Add Score Item',
  bandsEyebrow: 'Thresholds & Guidance',
  bandsHeading: (count: number) => `Interpretation bands (${count})`,
  addBand: '+ Add Threshold Band',
  remove: 'Remove',
  previewEyebrow: 'Live Preview Calculator',
  previewHeading: 'EmrScoreResult Output',
} as const;

/** L6 visual clinical calculator & PRO scoring builder with weighted items, missing-item policy, threshold bands, and live EmrScoreResult preview. */
export function EmrScoreBuilder({
  model,
  headingId = 'emr-score-builder-heading',
  labels,
  onIntent,
}: {
  model: ScoreBuilderViewModel;
  headingId?: string;
  labels?: Partial<typeof SCORE_BUILDER_DEFAULTS>;
  onIntent: (intent: ScoreBuilderIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...SCORE_BUILDER_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const def = model.definition;
  const [counter, setCounter] = useState(1);

  const emit = (intent: ScoreBuilderIntent) => {
    if (!readOnly) onIntent(intent);
  };

  const previewResult = resolveScoreBuilderPreview(model);

  const handleAddItem = () => {
    const idx = def.items.length + counter;
    setCounter(c => c + 1);
    emit({ type: 'scoreItemAdded', item: createBlankScoreItem(idx) });
  };

  const handleAddBand = () => {
    const idx = def.bands.length + counter;
    setCounter(c => c + 1);
    emit({ type: 'scoreBandAdded', band: createBlankScoreBand(idx) });
  };

  return (
    <View role="region" aria-labelledby={headingId} style={styles.surfaceStack}>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
            {l.eyebrow(def.versionStamp)}
          </Text>
          <Text
            role="heading"
            aria-level={2}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.text2xl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {def.title || l.untitledInstrument}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
            {def.description || l.defaultDescription}
          </Text>
        </View>
        <View style={styles.inlineRow}>
          <EmrBadgeView badge={{ label: `Policy: ${def.missingItemPolicy}`, tone: 'neutral' }} />
          <EmrButton
            label={model.saving ? l.saving : l.saveScore}
            disabled={readOnly || !!model.saving}
            onPress={() => emit({ type: 'scoreDefinitionSaved', definition: def })}
          />
        </View>
      </View>

      {model.error ? (
        <View role="alert" style={[styles.alertBox, { backgroundColor: t.dangerSoft }]}>
          <Text style={{ color: t.danger, fontSize: t.textSm, fontFamily: font }}>{model.error}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.contractEyebrow}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {l.contractHeading}
            </Text>
          </View>
          <EmrBadgeView badge={{ label: `Engine v${def.engineVersion}`, tone: 'info' }} />
        </View>

        <View style={styles.fieldStack}>
          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.instrumentIdLabel}
            </Text>
            <ThemedInput
              id={`${headingId}-inst-id`}
              aria-label={l.instrumentIdLabel}
              value={def.instrumentId}
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={instrumentId => emit({ type: 'scoreMetaPatched', changes: { instrumentId } })}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.titleLabel}
            </Text>
            <ThemedInput
              id={`${headingId}-inst-title`}
              aria-label={l.titleLabel}
              value={def.title}
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={title => emit({ type: 'scoreMetaPatched', changes: { title } })}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.versionStampLabel}
            </Text>
            <ThemedInput
              id={`${headingId}-inst-version`}
              aria-label={l.versionStampLabel}
              value={def.versionStamp}
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={versionStamp => emit({ type: 'scoreMetaPatched', changes: { versionStamp } })}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.missingPolicyLabel}
            </Text>
            <EmrSelect
              label={l.missingPolicyLabel}
              options={MISSING_ITEM_POLICY_OPTIONS}
              value={def.missingItemPolicy}
              readOnly={readOnly}
              onChange={pol => {
                if (pol) emit({ type: 'missingPolicyChanged', policy: pol as MissingItemPolicy });
              }}
            />
          </View>
        </View>
      </View>

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.itemsEyebrow}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {l.itemsHeading(def.items.length)}
            </Text>
          </View>
          <EmrButton small variant="outline" label={l.addItem} disabled={readOnly} onPress={handleAddItem} />
        </View>

        <View style={styles.fieldStack}>
          {def.items.map((item: ScoreItemDefinition) => (
            <View
              key={item.id}
              style={[styles.groupBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
            >
              <View style={styles.inlineRow}>
                <View style={styles.flex}>
                  <ThemedInput
                    id={`${headingId}-item-${item.id}-label`}
                    aria-label={`Label for ${item.id}`}
                    value={item.label}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={label =>
                      emit({ type: 'scoreItemUpdated', itemId: item.id, changes: { label } })
                    }
                  />
                </View>
                <EmrBadgeView badge={{ label: `${item.fieldId} · ×${item.weight}`, tone: 'neutral' }} />
                <EmrButton
                  small
                  variant="ghost"
                  label={l.remove}
                  disabled={readOnly}
                  onPress={() => emit({ type: 'scoreItemRemoved', itemId: item.id })}
                />
              </View>
              {item.optionPoints ? (
                <View style={styles.inlineRow}>
                  {Object.entries(item.optionPoints).map(([code, pts]) => (
                    <EmrBadgeView key={code} badge={{ label: `${code} → ${pts} pts`, tone: 'info' }} />
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.bandsEyebrow}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {l.bandsHeading(def.bands.length)}
            </Text>
          </View>
          <EmrButton small variant="outline" label={l.addBand} disabled={readOnly} onPress={handleAddBand} />
        </View>

        <View style={styles.fieldStack}>
          {def.bands.map((band: ScoreThresholdBand) => (
            <View
              key={band.id}
              style={[styles.groupBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
            >
              <View style={styles.inlineRow}>
                <EmrBadgeView badge={{ label: `${band.minScore} – ${band.maxScore}`, tone: band.tone }} />
                <View style={styles.flex}>
                  <ThemedInput
                    id={`${headingId}-band-${band.id}-label`}
                    aria-label={`Band label for ${band.id}`}
                    value={band.label}
                    readOnly={readOnly}
                    editable={!readOnly}
                    onChangeText={label =>
                      emit({ type: 'scoreBandUpdated', bandId: band.id, changes: { label } })
                    }
                  />
                </View>
                <View style={{ minWidth: 120 }}>
                  <EmrSelect
                    label={`Band tone for ${band.id}`}
                    options={SCORE_BAND_TONE_OPTIONS}
                    value={band.tone}
                    readOnly={readOnly}
                    onChange={nextTone => {
                      if (nextTone) {
                        emit({
                          type: 'scoreBandUpdated',
                          bandId: band.id,
                          changes: { tone: nextTone as EmrTone },
                        });
                      }
                    }}
                  />
                </View>
                <EmrButton
                  small
                  variant="ghost"
                  label={l.remove}
                  disabled={readOnly}
                  onPress={() => emit({ type: 'scoreBandRemoved', bandId: band.id })}
                />
              </View>
              {band.clinicalGuidance ? (
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                  {band.clinicalGuidance}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
              {l.previewEyebrow}
            </Text>
            <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
              {l.previewHeading}
            </Text>
          </View>
          <EmrBadgeView badge={{ label: previewResult.bandTone.toUpperCase(), tone: previewResult.bandTone }} />
        </View>

        <View
          role="status"
          style={[styles.groupBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
        >
          <Text style={{ color: t.primary, fontSize: t.text2xl, fontWeight: fontWeight(800), fontFamily: font }}>
            {previewResult.total}
          </Text>
          <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(700), fontFamily: font }}>
            {previewResult.bandLabel}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
            {previewResult.completenessLabel}
          </Text>
          {previewResult.interpretation ? (
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
              {previewResult.interpretation}
            </Text>
          ) : null}
        </View>

        <View style={styles.fieldStack}>
          {def.items.map(item => (
            <View key={item.id} style={styles.fieldRow}>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
                {item.label} (×{item.weight})
              </Text>
              <ThemedInput
                id={`${headingId}-sample-${item.fieldId}`}
                aria-label={`Sample answer for ${item.fieldId}`}
                value={formatScalarInput(model.sampleAnswers[item.fieldId])}
                placeholder="Sample answer or option code…"
                readOnly={readOnly}
                editable={!readOnly}
                onChangeText={txt =>
                  emit({
                    type: 'sampleAnswerChanged',
                    fieldId: item.fieldId,
                    value: parseScalarInput(txt),
                  })
                }
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrFhirQuestionnaireMapper
// ---------------------------------------------------------------------------

export const FHIR_QUESTIONNAIRE_MAPPER_DEFAULTS = {
  eyebrow: (v: FhirQuestionnaireVersion) => `L6 Bi-Directional Interoperability Studio · FHIR ${v}`,
  defaultHeading: 'FHIR Questionnaire Mapper',
  subtitle:
    'Inspect and map EmrFieldContract / ClinicalFormSchema definitions to and from FHIR R4 and R5 Questionnaire resources with round-trip fidelity diagnostics.',
  verifyRoundTrip: 'Verify Round-Trip',
  exportFhir: (v: FhirQuestionnaireVersion) => `Export FHIR ${v}`,
  diagnosticsEyebrow: 'Round-Trip Fidelity Diagnostics',
  tableEyebrow: 'Bi-Directional Field Mapping Table',
  inspectorEyebrow: 'Terminology & Extension Inspector',
  ucumLabel: 'UCUM unit code',
  bindCodeButton: 'Bind Code',
  jsonEyebrow: (v: FhirQuestionnaireVersion) => `FHIR ${v} Resource`,
  jsonHeading: 'Live Questionnaire JSON',
  importButton: 'Import Questionnaire JSON',
} as const;

/** L6 bi-directional mapping studio between EmrFieldContract / ClinicalFormSchema and FHIR R4 / R5 Questionnaire resources. */
export function EmrFhirQuestionnaireMapper({
  model,
  headingId = 'emr-fhir-questionnaire-mapper-heading',
  labels,
  onIntent,
}: {
  model: FhirQuestionnaireMapperViewModel;
  headingId?: string;
  labels?: Partial<typeof FHIR_QUESTIONNAIRE_MAPPER_DEFAULTS>;
  onIntent: (intent: FhirQuestionnaireMapperIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...FHIR_QUESTIONNAIRE_MAPPER_DEFAULTS, ...labels };
  const font = fontFamily(t);
  const readOnly = !!model.readOnly;
  const [newCodingCode, setNewCodingCode] = useState('');
  const [newCodingDisplay, setNewCodingDisplay] = useState('');
  const [importDraft, setImportDraft] = useState('');

  const emit = (intent: FhirQuestionnaireMapperIntent) => {
    if (!readOnly || intent.type === 'mappingRowSelected') onIntent(intent);
  };

  const activeRow = resolveSelectedFhirMappingRow(model);
  const jsonPreview = model.rawJsonDraft ?? JSON.stringify(model.questionnaire, null, 2);

  const handleBindCode = () => {
    if (!activeRow || !newCodingCode.trim() || readOnly) return;
    emit({
      type: 'fieldMappingUpdated',
      linkId: activeRow.linkId,
      changes: {
        terminologyCode: buildLoincOrCustomCoding(newCodingCode, newCodingDisplay),
      },
    });
    setNewCodingCode('');
    setNewCodingDisplay('');
  };

  return (
    <View role="region" aria-labelledby={headingId} style={styles.surfaceStack}>
      <View style={styles.topHeader}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
            {l.eyebrow(model.fhirVersion)}
          </Text>
          <Text
            role="heading"
            aria-level={2}
            nativeID={headingId}
            style={{ color: t.text, fontSize: t.text2xl, fontWeight: fontWeight(t.weightBold), fontFamily: font }}
          >
            {model.schema.label || l.defaultHeading}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>{l.subtitle}</Text>
        </View>
        <View style={styles.inlineRow}>
          {(['R4', 'R5'] as const).map(ver => {
            const active = model.fhirVersion === ver;
            return (
              <Pressable
                key={ver}
                role="button"
                aria-pressed={active}
                disabled={readOnly}
                onPress={() => emit({ type: 'fhirVersionToggled', fhirVersion: ver })}
                style={({ focused }: PressState) => [
                  styles.pillButton,
                  focusRing(t, focused),
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: active ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? t.primary : t.text,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(active ? 700 : 500),
                    fontFamily: font,
                  }}
                >
                  FHIR {ver} ({ver === 'R5' ? '5.0.0' : '4.0.1'})
                </Text>
              </Pressable>
            );
          })}
          <EmrButton
            variant="outline"
            label={l.verifyRoundTrip}
            disabled={readOnly}
            onPress={() => emit({ type: 'roundTripVerified' })}
          />
          <EmrButton
            label={l.exportFhir(model.fhirVersion)}
            disabled={readOnly}
            onPress={() => emit({ type: 'questionnaireExportRequested', fhirVersion: model.fhirVersion })}
          />
        </View>
      </View>

      {model.diagnostics.length > 0 ? (
        <View style={[styles.card, { borderColor: t.warning, backgroundColor: t.warningSoft }]}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
            {l.diagnosticsEyebrow}
          </Text>
          {model.diagnostics.map((d, idx) => (
            <Text key={`${d.code}-${idx}`} style={{ color: t.text, fontSize: t.textSm, fontFamily: font }}>
              [{d.severity.toUpperCase()}] {d.linkId ? `${d.linkId} · ` : ''}
              {d.message}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
          {l.tableEyebrow}
        </Text>
        <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
          EmrFieldContract ↔ FHIR {model.fhirVersion} Questionnaire.item ({model.rows.length})
        </Text>

        <View style={styles.fieldStack}>
          {model.rows.map(row => {
            const isSelected = row.linkId === (model.selectedLinkId ?? model.rows[0]?.linkId);
            return (
              <View
                key={row.linkId}
                style={[
                  styles.predicateRow,
                  {
                    borderColor: isSelected ? t.primary : t.border,
                    backgroundColor: isSelected ? t.surfaceRaised : t.surface,
                  },
                ]}
              >
                <View style={styles.flex}>
                  <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(700), fontFamily: font }}>
                    {row.label}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}>
                    {row.linkId} · {row.required ? '1' : '0'}..{row.repeats ? '*' : '1'}
                  </Text>
                </View>
                <EmrBadgeView badge={{ label: row.emrValueType, tone: 'neutral' }} />
                <View style={{ minWidth: 140 }}>
                  <EmrSelect
                    label={`FHIR item type for ${row.linkId}`}
                    options={FHIR_ITEM_TYPE_OPTIONS}
                    value={row.fhirItemType}
                    readOnly={readOnly}
                    onChange={nextType => {
                      if (nextType) {
                        emit({
                          type: 'fieldMappingUpdated',
                          linkId: row.linkId,
                          changes: { fhirItemType: nextType as FhirQuestionnaireItemType },
                        });
                      }
                    }}
                  />
                </View>
                <View style={styles.inlineRow}>
                  {row.terminologyCodes.map(c => (
                    <EmrBadgeView key={c.code} badge={{ label: c.code, tone: 'info' }} />
                  ))}
                  {row.ucumUnit ? (
                    <EmrBadgeView badge={{ label: `UCUM: ${row.ucumUnit.code}`, tone: 'success' }} />
                  ) : null}
                </View>
                <EmrButton
                  small
                  variant="ghost"
                  label={isSelected ? 'Selected' : 'Inspect'}
                  onPress={() => emit({ type: 'mappingRowSelected', linkId: row.linkId })}
                />
              </View>
            );
          })}
        </View>
      </View>

      {activeRow ? (
        <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
          <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
            {l.inspectorEyebrow}
          </Text>
          <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
            {activeRow.label} ({activeRow.linkId})
          </Text>
          <View style={styles.fieldRow}>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(600), fontFamily: font }}>
              {l.ucumLabel}
            </Text>
            <ThemedInput
              id={`${headingId}-ucum-${activeRow.linkId}`}
              aria-label={l.ucumLabel}
              value={activeRow.ucumUnit?.code ?? ''}
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={ucumCode =>
                emit({
                  type: 'fieldMappingUpdated',
                  linkId: activeRow.linkId,
                  changes: { ucumCode },
                })
              }
            />
          </View>
          <View style={styles.inlineRow}>
            <View style={styles.flex}>
              <ThemedInput
                id={`${headingId}-term-code`}
                aria-label="Terminology code"
                value={newCodingCode}
                placeholder="LOINC / SNOMED code"
                readOnly={readOnly}
                editable={!readOnly}
                onChangeText={setNewCodingCode}
              />
            </View>
            <View style={styles.flex}>
              <ThemedInput
                id={`${headingId}-term-display`}
                aria-label="Terminology display"
                value={newCodingDisplay}
                placeholder="Display text"
                readOnly={readOnly}
                editable={!readOnly}
                onChangeText={setNewCodingDisplay}
              />
            </View>
            <EmrButton
              small
              variant="outline"
              label={l.bindCodeButton}
              disabled={readOnly || !newCodingCode.trim()}
              onPress={handleBindCode}
            />
          </View>
        </View>
      ) : null}

      <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
        <Text style={[styles.eyebrow, { color: t.textMuted, fontSize: t.text2xs, fontFamily: font }]}>
          {l.jsonEyebrow(model.fhirVersion)}
        </Text>
        <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: font }}>
          {l.jsonHeading}
        </Text>
        <View style={[styles.codeBox, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
          <Text style={{ color: t.text, fontSize: t.textXs, fontFamily: font }}>{jsonPreview}</Text>
        </View>
        <View style={styles.inlineRow}>
          <View style={styles.flex}>
            <ThemedInput
              id={`${headingId}-import-json`}
              aria-label="Import FHIR Questionnaire JSON"
              value={importDraft}
              placeholder="Paste FHIR Questionnaire JSON…"
              readOnly={readOnly}
              editable={!readOnly}
              onChangeText={setImportDraft}
            />
          </View>
          <EmrButton
            variant="outline"
            label={l.importButton}
            disabled={readOnly || !importDraft.trim()}
            onPress={() => {
              if (importDraft.trim()) {
                emit({ type: 'questionnaireImportRequested', rawJson: importDraft.trim() });
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  surfaceStack: { gap: 16 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: {
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fieldStack: { gap: 10 },
  fieldRow: { gap: 4 },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  predicateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  pillButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 999,
  },
  codeBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  alertBox: {
    padding: 10,
    borderRadius: 8,
  },
  flex: { flex: 1, minWidth: 140 },
});
