'use client';

import { useId, useRef } from 'react';
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
import { SvgIcon } from './icons';
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
  normalised: 'Recognised as',
  clear: 'Clear identifier',
} as const;

/**
 * L2 capture-side coded entry. Chosen concepts show as chips with system name and code as text;
 * the search box emits search intents scoped to the contract's answer-value-set binding.
 * Supports clearing `model.status` back to `undefined`.
 */
export function EmrCodedInput({
  model,
  controlId,
  headingId,
  labelHidden = false,
  readOnly = false,
  labels,
  onIntent,
}: {
  model: CodedInputViewModel;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  readOnly?: boolean;
  labels?: Partial<typeof CODED_INPUT_DEFAULTS>;
  onIntent: (intent: CodedInputIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...CODED_INPUT_DEFAULTS, ...labels };
  const autoId = useId();
  const inputId = controlId || autoId;
  const effectiveReadOnly = Boolean(readOnly || model.readOnly || model.definition.contract.readOnly);

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
    <EmrFieldFrame label={label} labelHidden={labelHidden} readOnly={effectiveReadOnly} controlId={inputId} required={required} hint={model.definition.presentation.hint}>
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
                {!effectiveReadOnly ? (
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
                      <SvgIcon name="close" size={16} color={pressed ? t.danger : t.text} />
                    )}
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : effectiveReadOnly && !model.status ? (
          <View style={[styles.noneRow, { minHeight: Math.max(44, t.controlHeight) }]}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{l.notSupplied}</Text>
          </View>
        ) : null}

        {!effectiveReadOnly ? (
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

        {model.open && !model.loading && !model.options.length && !effectiveReadOnly ? (
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
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const byId = new Map((value ?? []).map(slot => [slot.id, slot]));
  const rows = slots.map(definition => ({ definition, slot: byId.get(definition.id) }));
  const seed: ScheduleSlotSeed =
    amountMode === 'numeric' ? { amount: defaultAmount } : { amount: null, amountLabel: defaultAmountLabel };

  return (
    <View
      nativeID={id}
      role="group"
      aria-label={required ? `${label}, ${l.required}` : label}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
      aria-describedby={describedBy}
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
                  },
                ]}
              >
                {active ? <SvgIcon name="check" size={14} color={t.primaryContrast} /> : null}
                <Text
                  style={{
                    color: active ? t.primaryContrast : t.text,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(active ? t.weightBold : t.weightMedium),
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

      <View role="list" style={styles.slotsGrid}>
        {rows.map((row) => {
          const ticked = !!row.slot;
          return (
            <View
              key={row.definition.id}
              role="listitem"
              style={[
                styles.slotCard,
                {
                  borderColor: ticked ? t.primary : t.border,
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
                    {row.slot ? formatSlotReadout(row.slot, unitLabel, l.selectedNoAmount) : l.notSelected}
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
                    onPress={() => onValueChange(toggleSlot(value, slots, row.definition.id, !ticked, seed))}
                    style={({ focused }: PressState) => [
                      styles.slotToggle,
                      focusRing(t, focused),
                      { minHeight: Math.max(44, t.controlHeight), minWidth: 44 },
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
                      {ticked ? <SvgIcon name="check" size={12} color={t.surface} /> : null}
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
                          onNumber={amount => onValueChange(setSlotAmount(value, slots, row.definition.id, { amount }))}
                        />
                      ) : (
                        <ThemedInput
                          id={`${id}-${row.definition.id}-amount`}
                          aria-label={l.slotAmount(row.definition.label)}
                          value={row.slot.amountLabel ?? ''}
                          style={{ minWidth: 110 }}
                          onChangeText={amountLabel =>
                            onValueChange(setSlotAmount(value, slots, row.definition.id, { amount: null, amountLabel }))
                          }
                        />
                      )
                    ) : (
                      <View style={[styles.untickedDosePill, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
                        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                          {unitLabel ? `0 ${unitLabel}` : '0'}
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
            <Text nativeID={hintId} style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
              {hint}
            </Text>
          ) : null}
          {error ? (
            <Text role="alert" nativeID={errorId} style={{ color: t.danger, fontSize: t.textXs, fontWeight: fontWeight(600), fontFamily: fontFamily(t) }}>
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
  controlId,
  headingId,
  readOnly = false,
  labels,
  onIntent,
}: {
  model: AttestationViewModel;
  controlId?: string;
  headingId?: string;
  readOnly?: boolean;
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
  const autoId = useId();
  const resolvedId = controlId || autoId;
  const resolvedTitleId = headingId ?? `${resolvedId}-title`;
  const effectiveReadOnly = Boolean(readOnly || m.readOnly);
  const isUnsigned = m.signatories.length === 0 || m.signatories.every(s => !s.signedAtLabel);

  return (
    <View nativeID={resolvedId} role="region" aria-labelledby={resolvedTitleId} style={styles.attestGroup}>
      {m.title ? (
        <Text nativeID={resolvedTitleId} role="heading" style={key}>
          {m.title}
        </Text>
      ) : (
        <Text nativeID={resolvedTitleId} role="heading" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          {l.signatures}
        </Text>
      )}
      {m.statement ? <Text style={body}>{m.statement}</Text> : null}
      {m.signatories.length ? (
        <View aria-label={l.signatories} style={styles.attestGroup}>
          {m.signatories.map(s => (
            <View key={s.id} style={styles.attestWrap}>
              {effectiveReadOnly ? (
                <Text style={bold}>{s.displayName}</Text>
              ) : (
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
              )}
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
        <View nativeID={`${resolvedId}-error`} role="alert" style={[styles.attestAlert, { borderColor: t.danger, backgroundColor: t.dangerSoft }]}>
          <Text style={body}>
            <Text style={bold}>{l.notCompleted}</Text> {m.error}
          </Text>
        </View>
      ) : effectiveReadOnly && isUnsigned ? (
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>{l.notCompleted}</Text>
      ) : null}
      {!effectiveReadOnly && (m.canSign || m.canAmend) ? (
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
 * Consumes `IdentifierEntryView` and emits `IdentifierEntryIntent`.
 */
export function EmrIdentifierEntry({
  model,
  controlId,
  readOnly = false,
  labels,
  onSubmit,
  onIntent,
}: {
  model: IdentifierEntryView;
  controlId?: string;
  readOnly?: boolean;
  labels?: Partial<typeof IDENTIFIER_ENTRY_DEFAULTS>;
  onSubmit?: () => void;
  onIntent: (intent: IdentifierEntryIntent) => void;
}) {
  const t = useEmrTheme();
  const l = { ...IDENTIFIER_ENTRY_DEFAULTS, ...labels };
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const locked = Boolean(readOnly || model.readOnly);
  const hasError = Boolean(model.error || model.messages?.some(m => m.severity === 'error'));
  const hasWarning = Boolean(model.warning || model.messages?.some(m => m.severity === 'warning'));
  const hasMessage = Boolean(model.error || model.warning || model.hint || model.messages?.length);
  const inputRef = useRef<{ focus?: () => void } | null>(null);
  const radioGroupRef = useRef<any>(null);
  const hasSelectedType = Boolean(model.selectedType && model.typeOptions?.some(o => o.id === model.selectedType));

  const onRadioGroupKeyDown = (event: { key?: string; preventDefault?: () => void; target?: unknown }) => {
    if (Platform.OS !== 'web') return;
    const opts = model.typeOptions ?? [];
    if (!opts.length) return;
    const key = event.key;
    if (!key || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    const container = radioGroupRef.current as unknown as HTMLElement | null;
    if (!container?.querySelectorAll) return;
    const buttons = Array.from(container.querySelectorAll<HTMLElement>('[role="radio"]'));
    const cur = buttons.indexOf(event.target as HTMLElement);
    if (cur < 0) return;
    event.preventDefault?.();
    const nextIdx =
      key === 'Home'
        ? 0
        : key === 'End'
          ? opts.length - 1
          : (cur + (key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
    buttons[nextIdx]?.focus();
    if (!locked) {
      onIntent({ type: 'typeSelected', id: opts[nextIdx]!.id });
    }
  };

  return (
    <EmrFieldFrame
      label={model.label}
      labelNamesControl
      controlId={id}
      required={model.required}
      readOnly={locked}
      hint={model.hint}
      warning={model.warning}
      error={model.error}
      messages={model.messages}
    >
      {model.typeOptions && model.typeOptions.length > 0 ? (
        <View
          ref={radioGroupRef}
          role="radiogroup"
          aria-label={`${model.label}: ${l.identifierType}`}
          aria-readonly={locked || undefined}
          style={styles.identTypes}
          {...(Platform.OS === 'web' ? ({ onKeyDown: onRadioGroupKeyDown } as Record<string, unknown>) : {})}
        >
          {model.typeOptions.map((o, idx) => {
            const selected = o.id === model.selectedType;
            const tabStop = selected || (!hasSelectedType && idx === 0);
            return (
              <EmrOptionChip
                key={o.id}
                variant="pill"
                label={o.label}
                selected={selected}
                readOnly={locked}
                tabIndex={Platform.OS === 'web' ? (tabStop ? 0 : -1) : undefined}
                onPress={() => {
                  if (!locked) onIntent({ type: 'typeSelected', id: o.id });
                }}
              />
            );
          })}
        </View>
      ) : null}
      <View style={styles.identEntry}>
        <View style={[styles.identGrow, styles.identInputWrap]}>
          <ThemedInput
            ref={inputRef as never}
            id={id}
            nativeID={id}
            aria-label={model.label}
            aria-labelledby={Platform.OS === 'web' ? `${id}-label` : undefined}
            aria-describedby={hasMessage ? `${id}-message` : undefined}
            aria-required={model.required || undefined}
            value={model.value}
            placeholder={model.placeholder}
            maxLength={model.maxLength}
            onChangeText={raw => {
              if (!locked) onIntent({ type: 'valueChanged', raw });
            }}
            invalid={hasError}
            readOnly={locked}
            editable={!locked}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            style={[
              model.clearable && model.value && !locked ? { paddingRight: 44 } : null,
              !hasError && hasWarning ? { borderColor: t.warning } : null,
            ]}
            returnKeyType="done"
            blurOnSubmit={false}
            onFocus={() => onIntent({ type: 'focused' })}
            onBlur={() => onIntent({ type: 'blurred' })}
            onSubmitEditing={() => {
              if (!locked) {
                onIntent({ type: 'submitted', raw: model.value });
                onSubmit?.();
              }
            }}
          />
          {model.clearable && model.value && !locked ? (
            <Pressable
              role="button"
              aria-label={l.clear}
              onPress={() => {
                onIntent({ type: 'valueChanged', raw: '' });
                onIntent({ type: 'cleared' });
                inputRef.current?.focus?.();
              }}
              style={({ focused }: PressState) => [styles.identClearBtn, focusRing(t, focused)]}
            >
              <SvgIcon name="close" size={16} color={t.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {locked ? null : (
          <EmrButton
            variant="outline"
            accessibilityLabel={`${l.scan}: ${model.label}`}
            onPress={() => onIntent({ type: 'scanRequested' })}
          >
            <SvgIcon name="scanner" size={16} color={t.primary} />
            <Text style={{ color: t.primary, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
              {l.scan}
            </Text>
          </EmrButton>
        )}
      </View>
      {model.normalisedValue ? (
        <View
          aria-live="polite"
          accessibilityLabel={`${l.normalised} ${model.normalisedValue}`}
          style={styles.identNormalised}
        >
          <SvgIcon name="check" size={14} color={t.success} />
          <Text style={{ color: t.success, fontSize: t.textSm, fontFamily: fontFamily(t), flexShrink: 1 }}>
            {model.normalisedValue}
          </Text>
        </View>
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
  presetBtn: { flexDirection: 'row', gap: 6, borderRadius: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotCard: { flexGrow: 1, flexBasis: 190, minWidth: 180, borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, justifyContent: 'space-between', overflow: 'hidden' },
  slotInlineRow: { flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  slotHeaderInline: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  readOnlySlot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 6 },
  slotToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  checkBox: { width: 18, height: 18, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  slotNameWrap: { minWidth: 0, flex: 1 },
  amountRow: { minWidth: 0, alignItems: 'flex-start' },
  untickedDosePill: { minHeight: 38, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  attestGroup: { gap: 4 },
  attestWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, maxWidth: '100%' },
  attestAlert: { borderWidth: 1, borderRadius: 8, padding: 8, gap: 8 },
  identTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  identEntry: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  identGrow: { flexGrow: 1, flexShrink: 1, flexBasis: 180, minWidth: 0 },
  identInputWrap: { position: 'relative', justifyContent: 'center' },
  identClearBtn: { position: 'absolute', right: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  identNormalised: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
