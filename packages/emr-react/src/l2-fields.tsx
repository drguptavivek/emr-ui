'use client';

import { useId } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  AttestationIntent,
  AttestationViewModel,
  ClinicalAssessmentStatus,
  CodedInputIntent,
  CodedInputViewModel,
  DoseSlot,
  EmrOption,
  IdentifierEntryIntent,
  IdentifierEntryView,
  ScheduleAmountMode,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
  ScheduleSlotSeed,
} from '@drguptavivek/emr-controller';
import { NumberInput, ThemedInput } from './inputs-core';
import { EmrSearchSelect } from './l1-interactive';
import { EmrFieldFrame } from './l2-field-frame';
import {
  applySlotPreset,
  codedConceptKey,
  codedInputChips,
  formatSlotReadout,
  isPresetActive,
  setSlotAmount,
  toggleSlot,
} from './l2-fields.logic';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export type { AttestationIntent, AttestationViewModel, IdentifierEntryIntent, IdentifierEntryView };

type PressState = PressableStateCallbackType & { focused?: boolean };

export const CODED_INPUT_DEFAULTS = {
  searchLabel: 'Search terminology',
  placeholder: 'Search by name or code',
  notSupplied: 'Not supplied',
  selectedList: (label: string) => `${label} selected`,
  removeConcept: (display: string) => `Remove ${display}`,
  assessmentStatus: (label: string) => `${label} assessment status`,
  clearStatus: 'Clear status',
  error: 'Error',
  warning: 'Warning',
  note: 'Note',
} as const;

export const SLOT_PICKER_DEFAULTS = {
  presetsGroup: (label: string) => `${label} presets`,
  notSelected: 'Not selected',
  selectedNoAmount: 'Selected, no amount',
  slotAmount: (slotLabel: string, unitLabel?: string) =>
    unitLabel ? `${slotLabel} amount in ${unitLabel}` : `${slotLabel} amount`,
  required: 'Required',
  errorPrefix: 'Error:',
} as const;

export const ATTESTATION_DEFAULTS = {
  signatures: 'Signatures',
  signatories: 'Signatories',
  signed: 'Signed',
  notSupplied: 'Not supplied',
  sign: 'Sign',
  amend: 'Amend',
  notCompleted: 'Not completed.',
} as const;

export const IDENTIFIER_ENTRY_DEFAULTS = {
  scan: 'Scan',
  identifierType: 'Identifier type',
} as const;

/**
 * L2 capture-side coded entry. Chosen concepts show as chips with system name and code as text;
 * the search box emits search intents scoped to the contract's answer-value-set binding.
 * Supports clearing `model.status` back to `undefined`.
 */
export function EmrCodedInput({
  model,
  headingId,
  labels,
  onIntent,
}: {
  model: CodedInputViewModel;
  headingId?: string;
  labels?: Partial<typeof CODED_INPUT_DEFAULTS>;
  onIntent: (intent: CodedInputIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...CODED_INPUT_DEFAULTS, ...labels };
  const inputId = useId();

  const label = model.definition.presentation.label;
  const placeholder = model.definition.presentation.placeholder ?? l.placeholder;
  const required = model.definition.contract.cardinality.min >= 1;
  const statusOptions = model.definition.presentation.assessmentStatusOptions ?? [];
  const statusOption = statusOptions.find(o => o.value === model.status);
  const statusLabel = statusOption?.label ?? (model.status ? String(model.status).replaceAll('-', ' ') : '');
  const statusTone = statusOption?.tone ?? 'neutral';

  const chips = codedInputChips(model.value, model.systemLabels);
  const searchOptions: EmrOption[] = model.options.map(c => ({
    value: codedConceptKey(c),
    label: c.display,
    description: `${model.systemLabels?.[c.system] ?? c.system} ${c.code}`,
  }));
  const selectedOptions: EmrOption[] = chips.map(c => ({
    value: c.key,
    label: c.concept.display,
  }));

  const msgIds = model.messages.map((_, i) => `${inputId}-msg-${i}`);
  if (model.definition.presentation.hint) msgIds.unshift(`${inputId}-message`);
  const describedBy = msgIds.join(' ');

  const handleSearch = () => {
    const valueSetCanonical = model.definition.contract.terminology.find(b => b.role === 'answer-value-set')?.valueSetCanonical;
    onIntent({
      type: 'searchRequested',
      query: model.query,
      ...(valueSetCanonical ? { valueSetCanonical } : {}),
    });
  };

  const handleSelect = (key: string) => {
    const concept = model.options.find(c => codedConceptKey(c) === key);
    if (concept) onIntent({ type: 'conceptSelected', concept });
  };

  return (
    <EmrFieldFrame label={label} controlId={inputId} required={required} hint={model.definition.presentation.hint}>
      <View
        role="group"
        aria-labelledby={headingId}
        aria-label={headingId ? undefined : label}
        aria-describedby={describedBy || undefined}
        style={styles.ci}
      >
        {chips.length > 0 ? (
          <View role="list" aria-label={l.selectedList(label)} style={styles.chips}>
            {chips.map(chip => (
              <View
                key={chip.key}
                role="listitem"
                style={[styles.chip, { minHeight: Math.max(44, t.controlHeight), borderColor: t.border, backgroundColor: t.surfaceSoft }]}
              >
                <View style={styles.chipText}>
                  <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                    {chip.concept.display}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
                    <Text style={{ fontWeight: fontWeight(t.weightMedium) }}>{chip.system}</Text> {chip.concept.code}
                  </Text>
                </View>
                {!model.readOnly ? (
                  <Pressable
                    role="button"
                    aria-label={l.removeConcept(chip.concept.display)}
                    onPress={() => onIntent({ type: 'conceptRemoveRequested', code: chip.concept.code, system: chip.concept.system })}
                    style={({ pressed, focused }: PressState) => [
                      styles.chipRemove,
                      focusRing(t, focused),
                      {
                        minWidth: 44,
                        minHeight: Math.max(44, t.controlHeight),
                        borderLeftColor: t.border,
                        backgroundColor: pressed ? t.dangerSoft : 'transparent',
                      },
                    ]}
                  >
                    {({ pressed }: PressState) => (
                      <Text aria-hidden style={{ color: pressed ? t.danger : t.text, fontSize: t.textLg, fontFamily: fontFamily(t) }}>
                        ×
                      </Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : model.readOnly && !model.status ? (
          <View style={[styles.noneRow, { minHeight: Math.max(44, t.controlHeight) }]}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{l.notSupplied}</Text>
          </View>
        ) : null}

        {!model.readOnly ? (
          <EmrSearchSelect
            label={l.searchLabel}
            labelHidden
            placeholder={placeholder}
            query={model.query}
            options={searchOptions}
            selected={selectedOptions}
            open={model.open && (model.options.length > 0 || model.loading)}
            loading={model.loading}
            onQueryChange={query => onIntent({ type: 'queryChangeRequested', query })}
            onSearchRequested={handleSearch}
            onOpenRequested={() => onIntent({ type: 'openRequested' })}
            onCloseRequested={() => onIntent({ type: 'closeRequested' })}
            onOptionSelect={handleSelect}
            onRemoveRequested={key => {
              const chip = chips.find(c => c.key === key);
              if (chip) onIntent({ type: 'conceptRemoveRequested', code: chip.concept.code, system: chip.concept.system });
            }}
          />
        ) : null}

        {model.open && !model.loading && !model.options.length && !model.readOnly ? (
          <View role="status" style={[styles.emptyBox, { borderColor: t.border }]}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{model.emptyMessage}</Text>
          </View>
        ) : null}

        {model.status || (statusOptions.length > 0 && !model.readOnly) ? (
          <View style={styles.statusRow}>
            {model.status ? <EmrBadgeView badge={{ label: statusLabel, tone: statusTone }} /> : null}
            {statusOptions.length > 0 && !model.readOnly ? (
              <View style={styles.statusSelect}>
                <EmrSelect
                  label={l.assessmentStatus(label)}
                  options={statusOptions}
                  value={model.status ?? null}
                  onChange={status =>
                    onIntent({
                      type: 'statusChangeRequested',
                      status: status ? (status as ClinicalAssessmentStatus) : undefined,
                    })
                  }
                />
              </View>
            ) : null}
            {model.status && !model.readOnly ? (
              <EmrButton
                small
                variant="ghost"
                label={l.clearStatus}
                accessibilityLabel={`${l.clearStatus}: ${label}`}
                onPress={() => onIntent({ type: 'statusChangeRequested', status: undefined })}
              />
            ) : null}
          </View>
        ) : null}

        {model.messages.length > 0 ? (
          <View role="list" aria-live="polite" style={styles.messages}>
            {model.messages.map((m, i) => {
              const msgColor = m.severity === 'error' ? t.danger : m.severity === 'warning' ? t.warning : t.textMuted;
              const sevLabel = m.severity === 'error' ? l.error : m.severity === 'warning' ? l.warning : l.note;
              return (
                <View key={i} role="listitem">
                  <Text
                    nativeID={`${inputId}-msg-${i}`}
                    style={{ color: msgColor, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}
                  >
                    <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{sevLabel}:</Text> {m.message}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </EmrFieldFrame>
  );
}

/**
 * L2 input half of `EmrDoseSchedule`: ticks dose slots and sets an amount per slot, emitting a new
 * `DoseSlot[]` in `slots` order (unticked slots omitted).
 */
export function EmrScheduleSlotPicker({
  controlId,
  label,
  hint,
  error,
  required = false,
  readOnly = false,
  disabled = false,
  value,
  slots,
  unitLabel,
  amountMode = 'numeric',
  presets = [],
  defaultAmount = 1,
  defaultAmountLabel = '',
  labels,
  onValueChange,
}: {
  controlId?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  value: readonly DoseSlot[] | null;
  slots: readonly ScheduleSlotDefinition[];
  unitLabel?: string;
  amountMode?: ScheduleAmountMode;
  presets?: readonly ScheduleSlotPreset[];
  defaultAmount?: number;
  defaultAmountLabel?: string;
  labels?: Partial<typeof SLOT_PICKER_DEFAULTS>;
  onValueChange: (value: readonly DoseSlot[]) => void;
}) {
  const t = useEmrTheme();
  const l = { ...SLOT_PICKER_DEFAULTS, ...labels };
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const messageId = `${id}-message`;

  const byId = new Map((value ?? []).map(slot => [slot.id, slot]));
  const rows = slots.map(definition => ({ definition, slot: byId.get(definition.id) }));
  const seed: ScheduleSlotSeed =
    amountMode === 'numeric' ? { amount: defaultAmount } : { amount: null, amountLabel: defaultAmountLabel };

  return (
    <View
      nativeID={id}
      role="group"
      aria-label={required ? `${label}, ${l.required}` : label}
      aria-describedby={error || hint ? messageId : undefined}
      style={styles.ssp}
    >
      <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
        {label}
        {required ? <Text style={{ color: t.danger }}> *</Text> : null}
      </Text>

      {presets.length > 0 && !readOnly ? (
        <View role="group" aria-label={l.presetsGroup(label)} style={styles.presets}>
          {presets.map(preset => {
            const active = isPresetActive(value, preset);
            return (
              <Pressable
                key={preset.id}
                role="button"
                aria-pressed={active}
                aria-disabled={disabled}
                disabled={disabled}
                onPress={() => onValueChange(applySlotPreset(value, slots, preset, seed))}
                style={({ pressed, focused }: PressState) => [
                  styles.presetBtn,
                  focusRing(t, focused),
                  {
                    minHeight: 44,
                    minWidth: 44,
                    borderColor: active ? t.primary : t.border,
                    borderWidth: 1,
                    backgroundColor: active ? t.primarySoft : pressed ? t.surfaceRaised : t.surface,
                    opacity: disabled ? 0.6 : 1,
                  },
                ]}
              >
                <View
                  aria-hidden
                  style={[
                    styles.presetDot,
                    {
                      borderColor: active ? t.primary : t.border,
                      backgroundColor: active ? t.primary : t.surface,
                    },
                  ]}
                >
                  {active ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.surface }} /> : null}
                </View>
                <Text
                  style={{
                    color: active ? t.primaryContrast : t.text,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(t.weightMedium),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View role="list" style={[styles.slotsGrid, { borderColor: t.border, backgroundColor: t.surface }]}>
        {rows.map((row, idx) => {
          const ticked = !!row.slot;
          return (
            <View
              key={row.definition.id}
              role="listitem"
              style={[
                styles.slotCard,
                {
                  borderColor: t.border,
                  borderLeftWidth: idx > 0 ? 1 : 0,
                  backgroundColor: ticked ? t.surfaceSoft : t.surface,
                },
              ]}
            >
              {readOnly ? (
                <View style={styles.readOnlySlot}>
                  <View style={styles.slotHeaderInline}>
                    <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                      {row.definition.label}
                    </Text>
                    {row.definition.timeHint ? (
                      <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: fontFamily(t) }}>{row.definition.timeHint}</Text>
                    ) : null}
                  </View>
                  <Text
                    style={{
                      color: row.slot ? t.primary : t.textMuted,
                      fontSize: t.textSm,
                      fontWeight: fontWeight(row.slot ? t.weightBold : t.weightRegular),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {row.slot ? formatSlotReadout(row.slot, unitLabel, l.selectedNoAmount) : '0'}
                  </Text>
                </View>
              ) : (
                <View style={styles.slotInlineRow}>
                  <Pressable
                    id={`${id}-${row.definition.id}`}
                    role="checkbox"
                    aria-checked={ticked}
                    aria-label={
                      row.definition.timeHint ? `${row.definition.label} (${row.definition.timeHint})` : row.definition.label
                    }
                    aria-disabled={disabled}
                    disabled={disabled}
                    onPress={() => onValueChange(toggleSlot(value, slots, row.definition.id, !ticked, seed))}
                    style={({ focused }: PressState) => [
                      styles.slotToggle,
                      focusRing(t, focused),
                      { minHeight: Math.max(44, t.controlHeight), minWidth: 44, opacity: disabled ? 0.6 : 1 },
                    ]}
                  >
                    <View
                      aria-hidden
                      style={[
                        styles.checkBox,
                        {
                          borderColor: ticked ? t.primary : t.border,
                          backgroundColor: ticked ? t.primary : t.surface,
                        },
                      ]}
                    >
                      {ticked ? (
                        <Text style={{ color: t.surface, fontSize: t.text2xs, lineHeight: 13, fontWeight: fontWeight(t.weightBold) }}>✓</Text>
                      ) : null}
                    </View>
                    <View style={styles.slotNameWrap}>
                      <Text numberOfLines={1} style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                        {row.definition.label}
                      </Text>
                      {row.definition.timeHint ? (
                        <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: fontFamily(t) }}>
                          {row.definition.timeHint}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                  <View style={styles.amountRow}>
                    {row.slot ? (
                      amountMode === 'numeric' ? (
                        <NumberInput
                          id={`${id}-${row.definition.id}-amount`}
                          aria-label={l.slotAmount(row.definition.label, unitLabel)}
                          integer={false}
                          min={0}
                          step={0.5}
                          value={row.slot.amount}
                          unit={unitLabel}
                          editable={!disabled}
                          onNumber={amount => onValueChange(setSlotAmount(value, slots, row.definition.id, { amount }))}
                        />
                      ) : (
                        <ThemedInput
                          id={`${id}-${row.definition.id}-amount`}
                          aria-label={l.slotAmount(row.definition.label)}
                          value={row.slot.amountLabel ?? ''}
                          editable={!disabled}
                          style={{ minWidth: 110 }}
                          onChangeText={amountLabel =>
                            onValueChange(setSlotAmount(value, slots, row.definition.id, { amount: null, amountLabel }))
                          }
                        />
                      )
                    ) : (
                      <View style={[styles.untickedDosePill, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
                        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                          0 {unitLabel ?? ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {error || hint ? (
        <View aria-live="polite" style={styles.sspFooter}>
          {hint ? (
            <Text nativeID={`${id}-hint`} style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
              {hint}
            </Text>
          ) : null}
          {error ? (
            <Text role="alert" nativeID={messageId} style={{ color: t.danger, fontSize: t.textXs, fontWeight: fontWeight(600), fontFamily: fontFamily(t) }}>
              {l.errorPrefix} {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Relocated L2: EmrAttestation (re-exported from l4-shell.tsx for compatibility)
// ---------------------------------------------------------------------------

/** L2. Sign / witness / co-sign block. The controller decides who may sign; this renders and emits. */
export function EmrAttestation({
  model: m,
  labels,
  onIntent,
}: {
  model: AttestationViewModel;
  labels?: Partial<typeof ATTESTATION_DEFAULTS>;
  onIntent: (intent: AttestationIntent) => void;
}) {
  const t = useEmrTheme();
  const font = fontFamily(t);
  const body = { color: t.text, fontSize: t.textMd, fontFamily: font };
  const muted = { color: t.textMuted, fontSize: t.textMd, fontFamily: font };
  const bold = { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font };
  const key = {
    color: t.textMuted,
    fontSize: t.textXs,
    fontWeight: fontWeight(t.weightBold),
    fontFamily: font,
    textTransform: 'uppercase' as const,
  };
  const l = { ...ATTESTATION_DEFAULTS, ...labels };

  return (
    <View role="region" aria-label={m.title || l.signatures} style={styles.attestGroup}>
      {m.title ? (
        <Text role="heading" style={key}>
          {m.title}
        </Text>
      ) : null}
      {m.statement ? <Text style={body}>{m.statement}</Text> : null}
      {m.signatories.length ? (
        <View aria-label={l.signatories} style={styles.attestGroup}>
          {m.signatories.map(s => (
            <View key={s.id} style={styles.attestWrap}>
              <Pressable
                role="button"
                onPress={() => onIntent({ type: 'signatorySelected', signatoryId: s.id })}
                style={({ focused }: PressState) => [
                  focusRing(t, focused),
                  { minHeight: Math.max(44, t.controlHeight), minWidth: 44, justifyContent: 'center' },
                ]}
              >
                <Text style={bold}>{s.displayName}</Text>
              </Pressable>
              <Text style={muted}>{s.roleLabel}</Text>
              <EmrBadgeView badge={s.status} />
              <Text style={muted}>
                {l.signed}: {s.signedAtLabel || l.notSupplied}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {m.error ? (
        <View role="alert" style={[styles.attestAlert, { borderColor: t.danger, backgroundColor: t.dangerSoft }]}>
          <Text style={body}>
            <Text style={bold}>{l.notCompleted}</Text> {m.error}
          </Text>
        </View>
      ) : null}
      {!m.readOnly && (m.canSign || m.canAmend) ? (
        <View style={styles.attestWrap}>
          {m.canSign ? (
            <EmrButton small label={m.signLabel || l.sign} onPress={() => onIntent({ type: 'signRequested' })} />
          ) : null}
          {m.canAmend ? (
            <EmrButton small variant="outline" label={m.amendLabel || l.amend} onPress={() => onIntent({ type: 'amendRequested' })} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Canonical L2: EmrIdentifierEntry
// ---------------------------------------------------------------------------

/**
 * L2 identifier / barcode / national-health-id entry field.
 * Consumes `IdentifierEntryView` and emits `IdentifierEntryIntent` (`valueChanged` | `scanRequested` | `typeSelected`).
 */
export function EmrIdentifierEntry({
  model,
  controlId,
  labels,
  onSubmit,
  onIntent,
}: {
  model: IdentifierEntryView;
  controlId?: string;
  labels?: Partial<typeof IDENTIFIER_ENTRY_DEFAULTS>;
  onSubmit?: () => void;
  onIntent: (intent: IdentifierEntryIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...IDENTIFIER_ENTRY_DEFAULTS, ...labels };
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const hasMessage = Boolean(model.error || model.warning || model.hint);

  return (
    <EmrFieldFrame
      label={model.label}
      labelNamesControl
      controlId={id}
      hint={model.hint}
      warning={model.warning}
      error={model.error}
    >
      {model.typeOptions && model.typeOptions.length > 0 ? (
        <View role="radiogroup" aria-label={`${model.label}: ${l.identifierType}`}>
          <EmrRow>
            {model.typeOptions.map(o => (
              <EmrOptionChip
                key={o.id}
                label={o.label}
                selected={o.id === model.selectedType}
                readOnly={model.readOnly}
                onPress={() => onIntent({ type: 'typeSelected', id: o.id })}
              />
            ))}
          </EmrRow>
        </View>
      ) : null}
      <View style={styles.identEntry}>
        <View style={styles.identGrow}>
          <ThemedInput
            id={id}
            nativeID={id}
            aria-label={model.label}
            aria-labelledby={Platform.OS === 'web' ? `${id}-label` : undefined}
            aria-describedby={hasMessage ? `${id}-message` : undefined}
            value={model.value}
            onChangeText={raw => onIntent({ type: 'valueChanged', raw })}
            invalid={Boolean(model.error)}
            readOnly={model.readOnly}
            editable={!model.readOnly}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType={onSubmit ? 'done' : undefined}
            blurOnSubmit={false}
            onSubmitEditing={onSubmit ? () => onSubmit() : undefined}
          />
        </View>
        {model.readOnly ? null : (
          <EmrButton
            variant="outline"
            label={l.scan}
            accessibilityLabel={`${l.scan}: ${model.label}`}
            onPress={() => onIntent({ type: 'scanRequested' })}
          />
        )}
      </View>
      {model.normalisedValue ? (
        <Text aria-live="polite" style={{ color: t.success, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
          ✓ {model.normalisedValue}
        </Text>
      ) : null}
    </EmrFieldFrame>
  );
}

const styles = StyleSheet.create({
  ci: { gap: 8, minWidth: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'stretch', maxWidth: '100%', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  chipText: { justifyContent: 'center', gap: 1, minWidth: 0, flexShrink: 1, paddingVertical: 5, paddingHorizontal: 10 },
  chipRemove: { borderLeftWidth: 1, alignItems: 'center', justifyContent: 'center' },
  noneRow: { justifyContent: 'center' },
  emptyBox: { paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  statusSelect: { minWidth: 180, maxWidth: '100%' },
  messages: { gap: 3 },
  ssp: { gap: 10, minWidth: 0 },
  sspFooter: { gap: 2 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetBtn: { flexDirection: 'row', gap: 6, borderRadius: 999, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  presetDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  slotCard: { flexGrow: 1, flexBasis: 210, minWidth: 190, paddingVertical: 6, paddingHorizontal: 10, justifyContent: 'center' },
  slotInlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 44 },
  slotHeaderInline: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  readOnlySlot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 6 },
  slotToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  checkBox: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  slotNameWrap: { minWidth: 64 },
  amountRow: { flex: 1, minWidth: 120, alignItems: 'flex-end' },
  untickedDosePill: { minHeight: 38, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  attestGroup: { gap: 4 },
  attestWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, maxWidth: '100%' },
  attestAlert: { borderWidth: 1, borderRadius: 8, padding: 8, gap: 8 },
  identEntry: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  identGrow: { flex: 1, minWidth: 0 },
});
