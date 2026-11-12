'use client';

import { useId } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  AddressFieldIntent,
  AddressFieldViewModel,
  EmrAcuityCorrection,
  EmrAcuityNotation,
  EmrAddressValue,
  EmrLateralityCode,
  EmrMacroSuggestion,
  EmrPhoneChannel,
  EmrRefractionValue,
  LateralityFieldIntent,
  LateralityFieldViewModel,
  MacroTextFieldIntent,
  MacroTextFieldViewModel,
  PhoneFieldIntent,
  PhoneFieldViewModel,
  RefractionFieldIntent,
  RefractionFieldViewModel,
  VisualAcuityFieldIntent,
  VisualAcuityFieldViewModel,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { SvgIcon } from './icons';
import { EmrCheckbox } from './l1-inputs';
import { textInputKeys, webProps, type WebKeyEvent } from './l1-interactive-shared';
import { EmrIconButton, EmrNumericStepper, EmrSegmentedControl } from './l1-new-inputs';
import { AssessmentStatusStrip, EmrFieldFrame } from './l2-field-frame';
import { extractTrailingMacroToken } from './l2-fields.logic';
import { useEmrLabels } from './labels';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export type {
  AddressFieldIntent,
  AddressFieldViewModel,
  EmrAcuityCorrection,
  EmrAcuityNotation,
  EmrAddressValue,
  EmrLateralityCode,
  EmrMacroSuggestion,
  EmrPhoneChannel,
  EmrRefractionValue,
  LateralityFieldIntent,
  LateralityFieldViewModel,
  MacroTextFieldIntent,
  MacroTextFieldViewModel,
  PhoneFieldIntent,
  PhoneFieldViewModel,
  RefractionFieldIntent,
  RefractionFieldViewModel,
  VisualAcuityFieldIntent,
  VisualAcuityFieldViewModel,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

function hasError(messages?: readonly { readonly severity: string }[]): boolean {
  return Boolean(messages?.some(m => m.severity === 'error'));
}

// ---------------------------------------------------------------------------
// 8. EmrPhoneInput (FHIR ContactPoint phone + messaging channels)
// ---------------------------------------------------------------------------

export function EmrPhoneInput({
  model,
  controlId,
  onIntent,
}: {
  model: PhoneFieldViewModel;
  controlId?: string;
  onIntent: (intent: PhoneFieldIntent) => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const invalid = hasError(model.messages);
  const selectedChannels = new Set(model.channels ?? []);

  return (
    <EmrFieldFrame
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={styles.fieldStack}>
        {model.verifiedBadge ? (
          <View style={styles.inlineHeader}>
            <EmrBadgeView badge={model.verifiedBadge} />
          </View>
        ) : null}
        <View style={styles.phoneRow}>
          <View style={styles.countryWrap}>
            <EmrSelect
              label={`${model.label} country code`}
              options={model.countryOptions.map(c => ({ value: c.code, label: c.label }))}
              value={model.countryCode}
              invalid={invalid}
              readOnly={model.readOnly}
              onChange={code => {
                if (code) onIntent({ type: 'countryCodeChangeRequested', countryCode: code });
              }}
            />
          </View>
          <View style={styles.phoneNumberWrap}>
            <View style={styles.phoneIconOverlay} pointerEvents="none">
              <SvgIcon name="phone" size={15} color={t.textMuted} />
            </View>
            <ThemedInput
              id={id}
              aria-labelledby={`${id}-label`}
              aria-label={model.label}
              keyboardType="phone-pad"
              inputMode="tel"
              placeholder="Phone number"
              value={model.nationalNumber}
              invalid={invalid}
              readOnly={Boolean(model.readOnly)}
              editable={!model.readOnly}
              onChangeText={nationalNumber => onIntent({ type: 'numberChangeRequested', nationalNumber })}
              style={styles.phoneInputWithIcon}
            />
          </View>
          {model.extension !== undefined || !model.readOnly ? (
            <View style={styles.extWrap}>
              <ThemedInput
                id={`${id}-ext`}
                aria-label={`${model.label} extension`}
                placeholder="Ext."
                keyboardType="phone-pad"
                inputMode="numeric"
                value={model.extension ?? ''}
                readOnly={Boolean(model.readOnly)}
                editable={!model.readOnly}
                onChangeText={extension => onIntent({ type: 'extensionChangeRequested', extension })}
              />
            </View>
          ) : null}
        </View>
        {model.availableChannels && model.availableChannels.length > 0 ? (
          <View role="group" aria-label={`${model.label} channels`}>
            <EmrRow>
              {model.availableChannels.map(ch => (
                <EmrOptionChip
                  key={ch.id}
                  label={ch.label}
                  multiple
                  selected={selectedChannels.has(ch.id)}
                  readOnly={model.readOnly}
                  onPress={() => onIntent({ type: 'channelToggleRequested', channel: ch.id })}
                />
              ))}
            </EmrRow>
          </View>
        ) : null}
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 9. EmrAddressField (Structured regional/FHIR Address)
// ---------------------------------------------------------------------------

export function EmrAddressField({
  model,
  controlId,
  onIntent,
}: {
  model: AddressFieldViewModel;
  controlId?: string;
  onIntent: (intent: AddressFieldIntent) => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const invalid = hasError(model.messages);
  const v = model.value;

  const subLabel = (text: string) => (
    <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
      {text}
    </Text>
  );

  const emitPart = (part: keyof EmrAddressValue, value: string) => {
    onIntent({ type: 'fieldChangeRequested', part, value });
  };

  return (
    <EmrFieldFrame
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View role="group" aria-labelledby={`${id}-label`} aria-label={model.label} style={styles.fieldStack}>
        {model.useOptions && model.useOptions.length > 0 ? (
          <EmrSegmentedControl
            ariaLabel={`${model.label} use`}
            options={model.useOptions}
            value={model.use ?? null}
            readOnly={model.readOnly}
            onValueChange={use => {
              if (use) onIntent({ type: 'useChangeRequested', use: use as 'home' | 'work' | 'temp' | 'billing' });
            }}
          />
        ) : null}
        <View style={styles.addressCell}>
          {subLabel('Address line 1')}
          <ThemedInput
            id={`${id}-line1`}
            aria-label={`${model.label}, address line 1`}
            placeholder="Street, building, house number"
            value={v.line1}
            invalid={invalid}
            readOnly={Boolean(model.readOnly)}
            editable={!model.readOnly}
            onChangeText={val => emitPart('line1', val)}
          />
        </View>
        <View style={styles.addressCell}>
          {subLabel('Address line 2')}
          <ThemedInput
            id={`${id}-line2`}
            aria-label={`${model.label}, address line 2`}
            placeholder="Apartment, landmark, locality (optional)"
            value={v.line2 ?? ''}
            readOnly={Boolean(model.readOnly)}
            editable={!model.readOnly}
            onChangeText={val => emitPart('line2', val)}
          />
        </View>
        <View style={styles.addressGridRow}>
          <View style={styles.addressHalf}>
            {subLabel('City / Town')}
            <ThemedInput
              id={`${id}-city`}
              aria-label={`${model.label}, city`}
              placeholder="City"
              value={v.city}
              invalid={invalid}
              readOnly={Boolean(model.readOnly)}
              editable={!model.readOnly}
              onChangeText={val => emitPart('city', val)}
            />
          </View>
          {model.showDistrict || Boolean(v.district) ? (
            <View style={styles.addressHalf}>
              {subLabel('District')}
              <ThemedInput
                id={`${id}-district`}
                aria-label={`${model.label}, district`}
                placeholder="District"
                value={v.district ?? ''}
                readOnly={Boolean(model.readOnly)}
                editable={!model.readOnly}
                onChangeText={val => emitPart('district', val)}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.addressGridRow}>
          <View style={styles.addressHalf}>
            {subLabel('State / Province')}
            {model.stateOptions && model.stateOptions.length > 0 ? (
              <EmrSelect
                label={`${model.label}, state`}
                options={model.stateOptions}
                value={v.state || null}
                invalid={invalid}
                readOnly={model.readOnly}
                onChange={val => emitPart('state', val ?? '')}
              />
            ) : (
              <ThemedInput
                id={`${id}-state`}
                aria-label={`${model.label}, state`}
                placeholder="State"
                value={v.state}
                invalid={invalid}
                readOnly={Boolean(model.readOnly)}
                editable={!model.readOnly}
                onChangeText={val => emitPart('state', val)}
              />
            )}
          </View>
          <View style={styles.addressSmall}>
            {subLabel('Postal code')}
            <ThemedInput
              id={`${id}-postalCode`}
              aria-label={`${model.label}, postal code`}
              placeholder="Postal / PIN"
              value={v.postalCode}
              invalid={invalid}
              readOnly={Boolean(model.readOnly)}
              editable={!model.readOnly}
              onChangeText={val => emitPart('postalCode', val)}
            />
          </View>
          <View style={styles.addressHalf}>
            {subLabel('Country')}
            {model.countryOptions && model.countryOptions.length > 0 ? (
              <EmrSelect
                label={`${model.label}, country`}
                options={model.countryOptions}
                value={v.country || null}
                invalid={invalid}
                readOnly={model.readOnly}
                onChange={val => emitPart('country', val ?? '')}
              />
            ) : (
              <ThemedInput
                id={`${id}-country`}
                aria-label={`${model.label}, country`}
                placeholder="Country"
                value={v.country}
                invalid={invalid}
                readOnly={Boolean(model.readOnly)}
                editable={!model.readOnly}
                onChangeText={val => emitPart('country', val)}
              />
            )}
          </View>
        </View>
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 10. EmrMacroTextField (Narrative note field with '.' / '/' SmartPhrase expansion)
// ---------------------------------------------------------------------------

export function EmrMacroTextField({
  model,
  controlId,
  onIntent,
}: {
  model: MacroTextFieldViewModel;
  controlId?: string;
  onIntent: (intent: MacroTextFieldIntent) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const invalid = hasError(model.messages);
  const rows = Math.max(3, model.rows ?? 4);
  const isOpen = Boolean(model.suggestionsOpen && !model.readOnly);

  const handleTextChange = (next: string) => {
    onIntent({ type: 'valueChangeRequested', value: next });
    const token = extractTrailingMacroToken(next);
    if (token) {
      onIntent({ type: 'macroQueryRequested', trigger: token });
    } else if (model.suggestionsOpen) {
      onIntent({ type: 'macroDismissRequested' });
    }
  };

  const handleKeyDown = (e: WebKeyEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      onIntent({ type: 'macroDismissRequested' });
    }
  };

  return (
    <EmrFieldFrame
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={[styles.fieldStack, isOpen && Platform.OS === 'web' ? { zIndex: 40 } : undefined]}>
        {!model.readOnly ? (
          <View style={styles.macroToolbar}>
            <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: fontFamily(t) }}>
              Type <Text style={{ fontWeight: fontWeight(t.weightBold) }}>.</Text> or{' '}
              <Text style={{ fontWeight: fontWeight(t.weightBold) }}>/</Text> for SmartPhrases
            </Text>
            <EmrIconButton
              ariaLabel={model.dictating ? `Stop dictation for ${model.label}` : `Start dictation for ${model.label}`}
              icon="mic"
              variant={model.dictating ? 'danger' : 'outline'}
              pressed={model.dictating}
              onPress={() => onIntent({ type: 'dictationToggleRequested' })}
            />
          </View>
        ) : null}
        <View style={styles.macroAnchor}>
          <ThemedInput
            id={id}
            aria-labelledby={`${id}-label`}
            aria-label={model.label}
            aria-expanded={isOpen}
            multiline
            numberOfLines={rows}
            placeholder={model.placeholder}
            value={model.value}
            invalid={invalid}
            readOnly={Boolean(model.readOnly)}
            editable={!model.readOnly}
            onChangeText={handleTextChange}
            {...(textInputKeys(handleKeyDown) as object)}
          />
          {isOpen ? (
            <View
              {...(webProps({ role: 'listbox' }) as object)}
              aria-label={`${model.label} macro suggestions`}
              style={[
                styles.macroDropdown,
                Platform.OS === 'web' ? styles.macroDropdownWeb : undefined,
                { borderColor: t.border, backgroundColor: t.surface },
              ]}
            >
              <View style={[styles.macroDropHeader, { borderBottomColor: t.border, backgroundColor: t.surfaceAccent }]}>
                <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                  SMARTPHRASES
                </Text>
                <EmrButton
                  small
                  variant="ghost"
                  label={labels.close}
                  onPress={() => onIntent({ type: 'macroDismissRequested' })}
                />
              </View>
              <ScrollView style={styles.macroScroll} keyboardShouldPersistTaps="handled">
                {model.suggestions.length === 0 ? (
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t), padding: 12 }}>
                    No matching phrases
                  </Text>
                ) : (
                  model.suggestions.map(item => (
                    <Pressable
                      key={item.trigger}
                      role="option"
                      aria-label={`${item.trigger}: ${item.label}`}
                      onPress={() => onIntent({ type: 'macroSelected', trigger: item.trigger })}
                      style={({ pressed, focused }: PressState) => [
                        styles.macroItem,
                        focusRing(t, focused),
                        {
                          minHeight: Math.max(44, t.controlHeight),
                          backgroundColor: pressed ? t.surfaceRaised : t.surface,
                        },
                      ]}
                    >
                      <View style={styles.macroItemHeader}>
                        <View style={[styles.macroTriggerPill, { backgroundColor: t.primarySoft }]}>
                          <Text
                            style={{
                              color: t.primaryContrast,
                              fontSize: t.text2xs,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: t.fontMono,
                            }}
                          >
                            {item.trigger}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: t.text,
                            fontSize: t.textSm,
                            fontWeight: fontWeight(t.weightBold),
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={2}
                        style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}
                      >
                        {item.expansionPreview}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 11. EmrLateralityField (OD/OS/OU or Right/Left/Bilateral + site confirmation)
// ---------------------------------------------------------------------------

export function EmrLateralityField({
  model,
  controlId,
  onIntent,
}: {
  model: LateralityFieldViewModel;
  controlId?: string;
  onIntent: (intent: LateralityFieldIntent) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;

  return (
    <EmrFieldFrame
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={styles.fieldStack}>
        <View
          id={id}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-label={model.label}
          aria-required={model.required}
          aria-readonly={model.readOnly}
          style={styles.lateralityRow}
        >
          {model.options.map(opt => {
            const selected = model.value === opt.code;
            return (
              <Pressable
                key={opt.code}
                role="radio"
                aria-checked={selected}
                aria-readonly={model.readOnly}
                onPress={
                  model.readOnly
                    ? undefined
                    : () => onIntent({ type: 'lateralitySelected', code: selected && !model.required ? null : opt.code })
                }
                style={({ pressed, focused }: PressState) => [
                  styles.lateralityPill,
                  focusRing(t, focused),
                  {
                    minHeight: Math.max(44, t.controlHeight),
                    minWidth: 44,
                    borderColor: selected ? t.primary : t.border,
                    backgroundColor: selected
                      ? t.primarySoft
                      : pressed && !model.readOnly
                        ? t.surfaceRaised
                        : t.surface,
                  },
                ]}
              >
                {opt.shortLabel ? (
                  <View
                    style={[
                      styles.lateralityCodeBadge,
                      { backgroundColor: selected ? t.primary : t.neutralSoft },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? t.surface : t.text,
                        fontSize: t.text2xs,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: t.fontMono,
                      }}
                    >
                      {opt.shortLabel}
                    </Text>
                  </View>
                ) : null}
                <Text
                  style={{
                    color: selected ? t.primaryContrast : t.text,
                    fontSize: t.textSm,
                    fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
          {model.value !== null && !model.readOnly && model.required ? (
            <EmrButton
              small
              variant="ghost"
              label={labels.clear}
              accessibilityLabel={`${labels.clear} ${model.label}`}
              onPress={() => onIntent({ type: 'lateralitySelected', code: null })}
            />
          ) : null}
        </View>
        {model.requiresConfirmation ? (
          <EmrCheckbox
            controlId={`${id}-confirm`}
            label={model.confirmationLabel ?? 'Laterality confirmed against consent and patient mark'}
            checked={Boolean(model.confirmed)}
            readOnly={model.readOnly}
            required={model.required}
            onCheckedChange={confirmed => onIntent({ type: 'confirmationChangeRequested', confirmed })}
          />
        ) : null}
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 12. EmrVisualAcuityField (Snellen / LogMAR / ETDRS + Low Vision + Pinhole)
// ---------------------------------------------------------------------------

export function EmrVisualAcuityField({
  model,
  controlId,
  onIntent,
}: {
  model: VisualAcuityFieldViewModel;
  controlId?: string;
  onIntent: (intent: VisualAcuityFieldIntent) => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const invalid = hasError(model.messages);
  const fullLabel = model.eye ? `${model.label} (${model.eye})` : model.label;

  return (
    <EmrFieldFrame
      label={fullLabel}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={styles.fieldStack}>
        <View style={styles.acuityControlsRow}>
          {model.notationOptions.length > 0 ? (
            <View style={styles.acuitySegmentCol}>
              <EmrSegmentedControl
                ariaLabel={`${fullLabel} notation`}
                options={model.notationOptions}
                value={model.notation}
                readOnly={model.readOnly}
                onValueChange={notation => {
                  if (notation) onIntent({ type: 'notationChangeRequested', notation: notation as EmrAcuityNotation });
                }}
              />
            </View>
          ) : null}
          {model.correctionOptions.length > 0 ? (
            <View style={styles.acuitySegmentCol}>
              <EmrSegmentedControl
                ariaLabel={`${fullLabel} correction`}
                options={model.correctionOptions}
                value={model.correction}
                readOnly={model.readOnly}
                onValueChange={correction => {
                  if (correction) {
                    onIntent({ type: 'correctionChangeRequested', correction: correction as EmrAcuityCorrection });
                  }
                }}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.acuityValueRow}>
          <View style={styles.acuitySelectCol}>
            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
              Acuity
            </Text>
            <EmrSelect
              label={fullLabel}
              options={model.valueOptions}
              value={model.value}
              invalid={invalid}
              readOnly={model.readOnly}
              onChange={value => onIntent({ type: 'valueChangeRequested', value })}
            />
          </View>
          {model.showPinhole ? (
            <View style={styles.acuitySelectCol}>
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                Pinhole (PH)
              </Text>
              <EmrSelect
                label={`${fullLabel} pinhole`}
                options={model.valueOptions}
                value={model.pinholeValue ?? null}
                readOnly={model.readOnly}
                onChange={value => onIntent({ type: 'pinholeChangeRequested', value })}
              />
            </View>
          ) : null}
          {model.derivedDisplay ? (
            <View style={styles.derivedWrap}>
              <EmrBadgeView badge={{ label: model.derivedDisplay, tone: 'info' }} />
            </View>
          ) : null}
        </View>
        <AssessmentStatusStrip
          fieldLabel={fullLabel}
          status={model.status}
          statusOptions={model.statusOptions}
          readOnly={model.readOnly}
          onStatusChange={status => onIntent({ type: 'statusChangeRequested', status })}
        />
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 13. EmrRefractionField (Sphere / Cylinder / Axis / Add clinical refraction)
// ---------------------------------------------------------------------------

export function EmrRefractionField({
  model,
  controlId,
  onIntent,
}: {
  model: RefractionFieldViewModel;
  controlId?: string;
  onIntent: (intent: RefractionFieldIntent) => void;
}) {
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const fullLabel = model.eye ? `${model.label} (${model.eye})` : model.label;
  const sphereStep = model.sphereStep ?? 0.25;
  const cylinderStep = model.cylinderStep ?? 0.25;

  return (
    <EmrFieldFrame
      label={fullLabel}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={styles.fieldStack}>
        {model.formattedSummary ? (
          <View style={styles.inlineHeader}>
            <EmrBadgeView badge={{ label: model.formattedSummary, tone: 'info' }} />
          </View>
        ) : null}
        <View role="group" aria-labelledby={`${id}-label`} aria-label={fullLabel} style={styles.refractionGrid}>
          <View style={styles.refractionCell}>
            <EmrNumericStepper
              controlId={`${id}-sphere`}
              label="Sphere"
              value={model.value.sphere}
              min={-30}
              max={30}
              step={sphereStep}
              precision={2}
              unit="D"
              readOnly={model.readOnly}
              onValueChange={sphere => onIntent({ type: 'sphereChangeRequested', sphere })}
            />
          </View>
          <View style={styles.refractionCell}>
            <EmrNumericStepper
              controlId={`${id}-cylinder`}
              label="Cylinder"
              value={model.value.cylinder}
              min={-15}
              max={15}
              step={cylinderStep}
              precision={2}
              unit="D"
              readOnly={model.readOnly}
              onValueChange={cylinder => onIntent({ type: 'cylinderChangeRequested', cylinder })}
            />
          </View>
          <View style={styles.refractionCell}>
            <EmrNumericStepper
              controlId={`${id}-axis`}
              label="Axis"
              value={model.value.axis}
              min={0}
              max={180}
              step={1}
              precision={0}
              unit="°"
              readOnly={model.readOnly}
              onValueChange={axis => onIntent({ type: 'axisChangeRequested', axis })}
            />
          </View>
          {model.showNearAdd ? (
            <View style={styles.refractionCell}>
              <EmrNumericStepper
                controlId={`${id}-add`}
                label="Near Add"
                value={model.value.nearAdd ?? null}
                min={0}
                max={6}
                step={0.25}
                precision={2}
                unit="D"
                readOnly={model.readOnly}
                onValueChange={nearAdd => onIntent({ type: 'nearAddChangeRequested', nearAdd })}
              />
            </View>
          ) : null}
        </View>
        <AssessmentStatusStrip
          fieldLabel={fullLabel}
          status={model.status}
          statusOptions={model.statusOptions}
          readOnly={model.readOnly}
          onStatusChange={status => onIntent({ type: 'statusChangeRequested', status })}
        />
      </View>
    </EmrFieldFrame>
  );
}

const styles = StyleSheet.create({
  fieldStack: { gap: 8, minWidth: 0 },
  inlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phoneRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  countryWrap: { minWidth: 120 },
  phoneNumberWrap: { flex: 1, minWidth: 168, position: 'relative', justifyContent: 'center' },
  phoneIconOverlay: { position: 'absolute', left: 10, zIndex: 2 },
  phoneInputWithIcon: { paddingLeft: 32 },
  extWrap: { width: 92, minWidth: 80 },
  addressCell: { gap: 4 },
  addressGridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addressHalf: { flex: 1, minWidth: 150, gap: 4 },
  addressSmall: { width: 132, minWidth: 112, gap: 4 },
  macroToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroAnchor: { position: 'relative' },
  macroDropdown: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  macroDropdownWeb: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 40,
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  macroDropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 6,
    borderBottomWidth: 1,
  },
  macroScroll: { maxHeight: 220 },
  macroItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  macroItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroTriggerPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lateralityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  lateralityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  lateralityCodeBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  acuityControlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  acuitySegmentCol: {
    flexGrow: 1,
    flexBasis: 240,
  },
  acuityValueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 8,
  },
  acuitySelectCol: {
    flex: 1,
    minWidth: 160,
    gap: 4,
  },
  derivedWrap: {
    minHeight: 44,
    justifyContent: 'center',
  },
  refractionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  refractionCell: {
    flexGrow: 1,
    flexBasis: 164,
    minWidth: 152,
  },
});
