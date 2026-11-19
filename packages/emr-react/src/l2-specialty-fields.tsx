'use client';

import { useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type KeyboardTypeOptions,
  type PressableStateCallbackType,
  type TextInputContentSizeChangeEvent,
} from 'react-native';
import type {
  AddressFieldIntent,
  AddressFieldViewModel,
  AddressPartValidationState,
  EmrAcuityCorrection,
  EmrAcuityNotation,
  EmrAddressPart,
  EmrAddressPartLabels,
  EmrAddressUse,
  EmrAddressValue,
  EmrFieldDefinition,
  EmrLateralityCode,
  EmrMacroSuggestion,
  EmrPhoneChannel,
  EmrPhoneChannelOption,
  EmrPhoneCountryOption,
  EmrRefractionPart,
  EmrRefractionValue,
  EmrSegmentedOption,
  EmrSegmentedSize,
  FieldFrameLayout,
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
import { useEmrLabels } from './labels';
import { EmrCheckbox } from './l1-inputs';
import { textInputKeys, webProps, type WebKeyEvent } from './l1-interactive-shared';
import { EmrSegmentedControl } from './l1-new-inputs';
import { EmrFieldFrame } from './l2-field-frame';
import {
  DEFAULT_ADDRESS_REQUIRED_PARTS,
  DEFAULT_ADDRESS_USE_OPTIONS,
  DEFAULT_LATERALITY_CONFIRMATION_LABEL,
  REFRACTION_DEFAULT_BOUNDS,
  extractActiveMacroTrigger,
  formatRefractionPartDisplay,
  hasAnyAddressValue,
  hasMacroValidationState,
  hasPhoneClearableValue,
  hasRefractionValue,
  isAddressPartInvalid,
  isPhoneExtensionVisible,
  parsePairedNumberDraft,
  resolveAddressPartValidation,
  resolveAddressRootMessages,
  resolveLateralityOptions,
  resolveLateralityValidation,
  resolvePhonePartValidation,
  resolveRefractionEyeDescription,
  resolveRefractionPartValidation,
  resolveVisualAcuityEyeDescription,
  resolveVisualAcuityPartValidation,
  sanitizePairedNumberText,
  stepRefractionPart,
} from './l2-fields.logic';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export type {
  AddressFieldIntent,
  AddressFieldViewModel,
  AddressPartValidationState,
  EmrAcuityCorrection,
  EmrAcuityNotation,
  EmrAddressPart,
  EmrAddressPartLabels,
  EmrAddressUse,
  EmrAddressValue,
  EmrLateralityCode,
  EmrMacroSuggestion,
  EmrPhoneChannel,
  EmrPhoneChannelOption,
  EmrPhoneCountryOption,
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
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  size,
  clearable,
  onIntent,
  onFocus,
  onBlur,
  onSubmitted,
}: {
  model: PhoneFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  onIntent: (intent: PhoneFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitted?: () => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const groupRef = useRef<ComponentRef<typeof View>>(null);
  const focusedRef = useRef(false);

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedUnit = resolvedDef?.presentation?.unitDisplay;
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedLayout = layout ?? model.layout ?? 'vertical';
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const resolvedSize = size ?? model.size ?? 'md';
  const targetSize = resolvedSize === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const minCard = resolvedDef?.contract?.cardinality?.min;
  const resolvedRequired = Boolean(model.required || (minCard !== undefined && minCard >= 1));
  const resolvedPlaceholder = model.placeholder ?? resolvedDef?.presentation?.placeholder ?? 'Phone number';
  const resolvedExtPlaceholder = model.extensionPlaceholder ?? 'Ext.';
  const showPhoneIcon = model.showPhoneIcon !== false;
  const extensionVisible = isPhoneExtensionVisible(model.showExtension, model.extension);
  const resolvedClearable = clearable ?? model.clearable ?? false;
  const showClear =
    resolvedClearable &&
    !locked &&
    hasPhoneClearableValue(model.nationalNumber, model.extension);
  const pv = resolvePhonePartValidation(model.messages);
  const hasFooter = Boolean(resolvedHint || model.messages?.length);
  const describedBy = hasFooter ? `${id}-message` : undefined;
  const groupLabelledBy = headingId || (!labelHidden && resolvedLabel ? `${id}-label` : undefined);
  const selectedChannels = new Set(model.channels ?? []);

  const handleChildFocus = () => {
    if (!focusedRef.current) {
      focusedRef.current = true;
      onFocus?.();
    }
  };

  const handleChildBlur = (e?: unknown) => {
    if (Platform.OS === 'web') {
      const ev = e as { nativeEvent?: { relatedTarget?: unknown }; relatedTarget?: unknown } | undefined;
      const related = (ev?.nativeEvent?.relatedTarget ?? ev?.relatedTarget) as Node | null | undefined;
      const container = groupRef.current as unknown as { contains?: (n: Node) => boolean } | null;
      if (related && container?.contains?.(related)) return;
    }
    if (focusedRef.current) {
      focusedRef.current = false;
      onBlur?.();
    }
  };

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      unit={resolvedUnit}
      required={resolvedRequired}
      readOnly={locked}
      hint={resolvedHint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={fi => {
        if (fi.type === 'statusChangeRequested' && !locked) {
          onIntent({ type: 'statusChangeRequested', status: fi.status });
        }
      }}
    >
      <View
        ref={groupRef}
        role="group"
        aria-labelledby={groupLabelledBy}
        aria-label={resolvedLabel}
        style={styles.fieldStack}
      >
        <View style={styles.phoneRow}>
          <View style={styles.countryWrap}>
            <EmrSelect
              controlId={`${id}-country`}
              label={`${resolvedLabel} country code`}
              labelHidden={true}
              options={model.countryOptions.map(c => ({
                value: c.code,
                label: c.label,
                keywords: c.keywords,
                description: c.description,
                disabled: c.disabled,
                readOnly: c.readOnly,
                badge: c.badge,
                tone: c.tone,
                group: c.group,
              }))}
              value={model.countryCode}
              size={resolvedSize === 'sm' ? 'sm' : 'md'}
              required={resolvedRequired}
              invalid={pv.countryCodeInvalid}
              hasWarning={pv.countryCodeWarning}
              ariaDescribedBy={describedBy}
              readOnly={locked}
              onFocused={handleChildFocus}
              onBlurred={handleChildBlur}
              onValueChange={code => {
                if (!locked && typeof code === 'string' && code && code !== model.countryCode) {
                  onIntent({ type: 'countryCodeChangeRequested', countryCode: code });
                }
              }}
            />
          </View>
          <View style={styles.phoneNumberWrap}>
            {showPhoneIcon ? (
              <View style={styles.phoneIconOverlay} pointerEvents="none">
                <SvgIcon name="phone" size={15} color={t.textMuted} />
              </View>
            ) : null}
            <ThemedInput
              id={id}
              aria-label={resolvedLabel}
              aria-describedby={describedBy}
              aria-required={resolvedRequired || undefined}
              aria-readonly={locked || undefined}
              autoComplete="tel-national"
              keyboardType="phone-pad"
              inputMode="tel"
              placeholder={resolvedPlaceholder}
              maxLength={model.maxLength}
              value={model.nationalNumber}
              invalid={pv.nationalNumberInvalid}
              readOnly={locked}
              editable={!locked}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              onSubmitEditing={() => {
                if (!locked) onSubmitted?.();
              }}
              onChangeText={nationalNumber => {
                if (!locked) onIntent({ type: 'numberChangeRequested', nationalNumber });
              }}
              style={[
                showPhoneIcon ? styles.phoneInputWithIcon : null,
                {
                  minHeight: targetSize,
                  borderStyle: locked ? 'dashed' : 'solid',
                  backgroundColor: locked ? t.surfaceSoft : t.surface,
                },
                !pv.nationalNumberInvalid && pv.nationalNumberWarning ? { borderColor: t.warning } : null,
                resolvedSize === 'sm' ? { fontSize: t.textSm } : null,
              ]}
            />
          </View>
          {extensionVisible ? (
            <View style={styles.extWrap}>
              <ThemedInput
                id={`${id}-ext`}
                aria-label={`${resolvedLabel} extension`}
                aria-describedby={describedBy}
                aria-readonly={locked || undefined}
                {...webProps({ autoComplete: 'tel-extension' })}
                placeholder={resolvedExtPlaceholder}
                maxLength={model.extensionMaxLength}
                keyboardType="phone-pad"
                inputMode="numeric"
                value={model.extension ?? ''}
                invalid={pv.extensionInvalid}
                readOnly={locked}
                editable={!locked}
                onFocus={handleChildFocus}
                onBlur={handleChildBlur}
                onSubmitEditing={() => {
                  if (!locked) onSubmitted?.();
                }}
                onChangeText={extension => {
                  if (!locked) onIntent({ type: 'extensionChangeRequested', extension });
                }}
                style={[
                  {
                    minHeight: targetSize,
                    borderStyle: locked ? 'dashed' : 'solid',
                    backgroundColor: locked ? t.surfaceSoft : t.surface,
                  },
                  !pv.extensionInvalid && pv.extensionWarning ? { borderColor: t.warning } : null,
                  resolvedSize === 'sm' ? { fontSize: t.textSm } : null,
                ]}
              />
            </View>
          ) : null}
          {showClear ? (
            <Pressable
              role="button"
              aria-label={`Clear ${resolvedLabel}`}
              {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : {})}
              onPress={() => {
                if (!locked) onIntent({ type: 'clearRequested' });
              }}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              style={({ pressed, focused }: PressState) => [
                styles.clearBtn,
                focusRing(t, focused),
                {
                  width: targetSize,
                  height: targetSize,
                  minWidth: 44,
                  minHeight: targetSize,
                  borderColor: t.border,
                  backgroundColor: pressed ? t.surfaceSoft : t.surface,
                },
              ]}
            >
              <SvgIcon name="close" size={14} color={t.textMuted} />
            </Pressable>
          ) : null}
          {model.verifiedBadge ? <EmrBadgeView badge={model.verifiedBadge} /> : null}
        </View>
        {model.formattedPreview ? (
          <Text
            nativeID={`${id}-preview`}
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontFamily: fontFamily(t),
              fontVariant: ['tabular-nums'],
            }}
          >
            {model.formattedPreview}
          </Text>
        ) : null}
        {model.availableChannels && model.availableChannels.length > 0 ? (
          <View
            role="group"
            aria-label={`${resolvedLabel} messaging channels`}
            aria-invalid={pv.channelsInvalid || undefined}
            style={styles.channelsRow}
          >
            {model.availableChannels.map(ch => {
              const chLocked = locked || Boolean(ch.readOnly);
              const chDisabled = Boolean(ch.disabled);
              return (
                <EmrOptionChip
                  key={ch.id}
                  label={ch.label}
                  variant="pill"
                  size="sm"
                  multiple
                  selected={selectedChannels.has(ch.id)}
                  invalid={pv.channelsInvalid}
                  warning={!pv.channelsInvalid && pv.channelsWarning}
                  readOnly={chLocked}
                  disabled={chDisabled}
                  onFocus={handleChildFocus}
                  onBlur={handleChildBlur}
                  onPress={() => {
                    if (!chLocked && !chDisabled) {
                      onIntent({ type: 'channelToggleRequested', channel: ch.id });
                    }
                  }}
                />
              );
            })}
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
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  onIntent,
  onFocus,
  onBlur,
}: {
  model: AddressFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  onIntent: (intent: AddressFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const groupRef = useRef<ComponentRef<typeof View>>(null);
  const focusedRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedUnit = resolvedDef?.presentation?.unitDisplay;
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedLayout = layout ?? model.layout ?? 'vertical';
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const minCard = resolvedDef?.contract?.cardinality?.min;
  const effectiveRequired = Boolean(model.required || (minCard !== undefined && minCard >= 1));
  const mergedMessages = resolveAddressRootMessages(model);
  const pv = resolveAddressPartValidation(mergedMessages);
  const hasFooter = Boolean(resolvedHint || mergedMessages.length > 0);
  const describedBy = hasFooter ? `${id}-message` : undefined;
  const groupLabelledBy = headingId || (!labelHidden && resolvedLabel ? `${id}-label` : undefined);
  const v = model.value;

  const resolvedUseOptions =
    model.useOptions !== undefined
      ? model.useOptions
      : model.use !== undefined
        ? DEFAULT_ADDRESS_USE_OPTIONS
        : [];
  const districtVisible =
    model.showDistrict !== undefined
      ? Boolean(model.showDistrict)
      : Boolean(v.district);
  const showClear = Boolean(model.clearable && !locked && hasAnyAddressValue(v));
  const stacked = containerWidth !== null && containerWidth < 360;

  const isPartRequired = (part: EmrAddressPart): boolean =>
    model.requiredParts !== undefined
      ? model.requiredParts.includes(part)
      : effectiveRequired && DEFAULT_ADDRESS_REQUIRED_PARTS.includes(part);

  const partLabel = (part: EmrAddressPart, fallback: string): string => model.labels?.[part] || fallback;
  const partPlaceholder = (part: EmrAddressPart, fallback: string): string => model.placeholders?.[part] ?? fallback;

  const partWarning = (part: EmrAddressPart): boolean => {
    switch (part) {
      case 'line1':
        return pv.line1Warning;
      case 'line2':
        return pv.line2Warning;
      case 'city':
        return pv.cityWarning;
      case 'district':
        return pv.districtWarning;
      case 'state':
        return pv.stateWarning;
      case 'postalCode':
        return pv.postalCodeWarning;
      case 'country':
        return pv.countryWarning;
    }
  };

  const handleChildFocus = () => {
    if (!focusedRef.current) {
      focusedRef.current = true;
      onFocus?.();
    }
  };

  const handleChildBlur = (e?: unknown) => {
    if (Platform.OS === 'web') {
      const ev = e as { nativeEvent?: { relatedTarget?: unknown }; relatedTarget?: unknown } | undefined;
      const related = (ev?.nativeEvent?.relatedTarget ?? ev?.relatedTarget) as Node | null | undefined;
      const container = groupRef.current as unknown as { contains?: (n: Node) => boolean } | null;
      if (related && container?.contains?.(related)) return;
    }
    if (focusedRef.current) {
      focusedRef.current = false;
      onBlur?.();
    }
  };

  const subLabel = (text: string, req: boolean) => (
    <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
      {text}
      {req ? <Text style={{ color: t.danger }}> *</Text> : null}
    </Text>
  );

  const emitPart = (part: EmrAddressPart, value: string) => {
    if (locked) return;
    onIntent({ type: 'fieldChangeRequested', part, value });
  };

  const emitUse = (use: string | null) => {
    if (locked || !use) return;
    if (use === 'home' || use === 'work' || use === 'temp' || use === 'billing') {
      onIntent({ type: 'useChangeRequested', use: use as EmrAddressUse });
    }
  };

  const inputStyle = (part: EmrAddressPart, extra?: object) => [
    {
      minHeight: Math.max(44, t.controlHeight),
      borderStyle: (locked ? 'dashed' : 'solid') as 'dashed' | 'solid',
      backgroundColor: locked ? t.surfaceSoft : t.surface,
    },
    !isAddressPartInvalid(pv, part) && partWarning(part) ? { borderColor: t.warning } : null,
    extra ?? null,
  ];

  const rowStyle = stacked ? styles.addressColStacked : styles.addressGridRow;

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      unit={resolvedUnit}
      required={effectiveRequired}
      readOnly={locked}
      hint={resolvedHint}
      messages={mergedMessages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={fi => {
        if (fi.type === 'statusChangeRequested' && !locked) {
          onIntent({ type: 'statusChangeRequested', status: fi.status });
        }
      }}
    >
      <View
        ref={groupRef}
        role="group"
        aria-labelledby={groupLabelledBy}
        aria-label={resolvedLabel}
        onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
        style={styles.fieldStack}
      >
        {resolvedUseOptions.length > 0 || showClear ? (
          <View style={[styles.addressHeader, resolvedUseOptions.length === 0 ? styles.addressHeaderEnd : null]}>
            {resolvedUseOptions.length > 0 ? (
              <View style={styles.addressUseWrap}>
                <EmrSegmentedControl
                  controlId={`${id}-use`}
                  ariaLabel={model.labels?.use || `${resolvedLabel} use`}
                  labelHidden={true}
                  options={resolvedUseOptions}
                  value={model.use ?? null}
                  readOnly={locked}
                  onFocused={handleChildFocus}
                  onBlurred={handleChildBlur}
                  onValueChange={emitUse}
                />
              </View>
            ) : null}
            {showClear ? (
              <Pressable
                role="button"
                aria-label={`${model.labels?.clear ?? 'Clear'} ${resolvedLabel}`}
                {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : {})}
                onPress={() => {
                  if (!locked) onIntent({ type: 'cleared' });
                }}
                onFocus={handleChildFocus}
                onBlur={handleChildBlur}
                style={({ pressed, focused }: PressState) => [
                  styles.clearBtn,
                  focusRing(t, focused),
                  {
                    width: Math.max(44, t.controlHeight),
                    height: Math.max(44, t.controlHeight),
                    minWidth: 44,
                    minHeight: 44,
                    borderColor: t.border,
                    backgroundColor: pressed ? t.surfaceSoft : t.surface,
                  },
                ]}
              >
                <SvgIcon name="close" size={14} color={t.textMuted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.addressCell}>
          {subLabel(partLabel('line1', 'Address line 1'), isPartRequired('line1'))}
          <ThemedInput
            id={id}
            aria-label={`${resolvedLabel}, ${partLabel('line1', 'address line 1')}`}
            aria-describedby={describedBy}
            aria-required={isPartRequired('line1') || undefined}
            aria-readonly={locked || undefined}
            {...webProps({ autoComplete: 'address-line1' })}
            placeholder={partPlaceholder('line1', 'Street, building, house number')}
            maxLength={model.maxLengths?.line1}
            value={v.line1 ?? ''}
            invalid={isAddressPartInvalid(pv, 'line1')}
            readOnly={locked}
            editable={!locked}
            onFocus={handleChildFocus}
            onBlur={handleChildBlur}
            onChangeText={val => emitPart('line1', val)}
            style={inputStyle('line1')}
          />
        </View>

        <View style={styles.addressCell}>
          {subLabel(partLabel('line2', 'Address line 2'), isPartRequired('line2'))}
          <ThemedInput
            id={`${id}-line2`}
            aria-label={`${resolvedLabel}, ${partLabel('line2', 'address line 2')}`}
            aria-describedby={describedBy}
            aria-required={isPartRequired('line2') || undefined}
            aria-readonly={locked || undefined}
            {...webProps({ autoComplete: 'address-line2' })}
            placeholder={partPlaceholder('line2', 'Apartment, landmark, locality (optional)')}
            maxLength={model.maxLengths?.line2}
            value={v.line2 ?? ''}
            invalid={isAddressPartInvalid(pv, 'line2')}
            readOnly={locked}
            editable={!locked}
            onFocus={handleChildFocus}
            onBlur={handleChildBlur}
            onChangeText={val => emitPart('line2', val)}
            style={inputStyle('line2')}
          />
        </View>

        <View style={rowStyle}>
          <View style={stacked || !districtVisible ? styles.addressFullCell : styles.addressHalf}>
            {subLabel(partLabel('city', 'City / Town'), isPartRequired('city'))}
            <ThemedInput
              id={`${id}-city`}
              aria-label={`${resolvedLabel}, ${partLabel('city', 'city')}`}
              aria-describedby={describedBy}
              aria-required={isPartRequired('city') || undefined}
              aria-readonly={locked || undefined}
              {...webProps({ autoComplete: 'address-level2' })}
              placeholder={partPlaceholder('city', 'City')}
              maxLength={model.maxLengths?.city}
              value={v.city ?? ''}
              invalid={isAddressPartInvalid(pv, 'city')}
              readOnly={locked}
              editable={!locked}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              onChangeText={val => emitPart('city', val)}
              style={inputStyle('city')}
            />
          </View>
          {districtVisible ? (
            <View style={stacked ? styles.addressFullCell : styles.addressHalf}>
              {subLabel(partLabel('district', 'District'), isPartRequired('district'))}
              <ThemedInput
                id={`${id}-district`}
                aria-label={`${resolvedLabel}, ${partLabel('district', 'district')}`}
                aria-describedby={describedBy}
                aria-required={isPartRequired('district') || undefined}
                aria-readonly={locked || undefined}
                {...webProps({ autoComplete: 'address-level3' })}
                placeholder={partPlaceholder('district', 'District')}
                maxLength={model.maxLengths?.district}
                value={v.district ?? ''}
                invalid={isAddressPartInvalid(pv, 'district')}
                readOnly={locked}
                editable={!locked}
                onFocus={handleChildFocus}
                onBlur={handleChildBlur}
                onChangeText={val => emitPart('district', val)}
                style={inputStyle('district')}
              />
            </View>
          ) : null}
        </View>

        <View style={rowStyle}>
          <View style={stacked ? styles.addressFullCell : styles.addressHalf}>
            {subLabel(partLabel('state', 'State / Province'), isPartRequired('state'))}
            {model.stateOptions && model.stateOptions.length > 0 ? (
              <EmrSelect
                controlId={`${id}-state`}
                label={`${resolvedLabel}, ${partLabel('state', 'state')}`}
                labelHidden={true}
                options={model.stateOptions}
                value={v.state || null}
                placeholder={partPlaceholder('state', 'Select')}
                required={isPartRequired('state')}
                invalid={isAddressPartInvalid(pv, 'state')}
                hasWarning={pv.stateWarning}
                ariaDescribedBy={describedBy}
                readOnly={locked}
                onFocused={handleChildFocus}
                onBlurred={handleChildBlur}
                onValueChange={val => emitPart('state', typeof val === 'string' ? val : '')}
              />
            ) : (
              <ThemedInput
                id={`${id}-state`}
                aria-label={`${resolvedLabel}, ${partLabel('state', 'state')}`}
                aria-describedby={describedBy}
                aria-required={isPartRequired('state') || undefined}
                aria-readonly={locked || undefined}
                {...webProps({ autoComplete: 'address-level1' })}
                placeholder={partPlaceholder('state', 'State')}
                maxLength={model.maxLengths?.state}
                value={v.state ?? ''}
                invalid={isAddressPartInvalid(pv, 'state')}
                readOnly={locked}
                editable={!locked}
                onFocus={handleChildFocus}
                onBlur={handleChildBlur}
                onChangeText={val => emitPart('state', val)}
                style={inputStyle('state')}
              />
            )}
          </View>
          <View style={stacked ? styles.addressFullCell : styles.addressSmall}>
            {subLabel(partLabel('postalCode', 'Postal / PIN code'), isPartRequired('postalCode'))}
            <ThemedInput
              id={`${id}-postalCode`}
              aria-label={`${resolvedLabel}, ${partLabel('postalCode', 'postal code')}`}
              aria-describedby={describedBy}
              aria-required={isPartRequired('postalCode') || undefined}
              aria-readonly={locked || undefined}
              autoComplete="postal-code"
              autoCapitalize="characters"
              placeholder={partPlaceholder('postalCode', 'Postal / PIN')}
              maxLength={model.maxLengths?.postalCode}
              value={v.postalCode ?? ''}
              invalid={isAddressPartInvalid(pv, 'postalCode')}
              readOnly={locked}
              editable={!locked}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              onChangeText={val => emitPart('postalCode', val)}
              style={inputStyle('postalCode', { fontVariant: ['tabular-nums'] })}
            />
          </View>
          <View style={stacked ? styles.addressFullCell : styles.addressHalf}>
            {subLabel(partLabel('country', 'Country'), isPartRequired('country'))}
            {model.countryOptions && model.countryOptions.length > 0 ? (
              <EmrSelect
                controlId={`${id}-country`}
                label={`${resolvedLabel}, ${partLabel('country', 'country')}`}
                labelHidden={true}
                options={model.countryOptions}
                value={v.country || null}
                placeholder={partPlaceholder('country', 'Select')}
                required={isPartRequired('country')}
                invalid={isAddressPartInvalid(pv, 'country')}
                hasWarning={pv.countryWarning}
                ariaDescribedBy={describedBy}
                readOnly={locked}
                onFocused={handleChildFocus}
                onBlurred={handleChildBlur}
                onValueChange={val => emitPart('country', typeof val === 'string' ? val : '')}
              />
            ) : (
              <ThemedInput
                id={`${id}-country`}
                aria-label={`${resolvedLabel}, ${partLabel('country', 'country')}`}
                aria-describedby={describedBy}
                aria-required={isPartRequired('country') || undefined}
                aria-readonly={locked || undefined}
                {...webProps({ autoComplete: 'country-name' })}
                placeholder={partPlaceholder('country', 'Country')}
                maxLength={model.maxLengths?.country}
                value={v.country ?? ''}
                invalid={isAddressPartInvalid(pv, 'country')}
                readOnly={locked}
                editable={!locked}
                onFocus={handleChildFocus}
                onBlur={handleChildBlur}
                onChangeText={val => emitPart('country', val)}
                style={inputStyle('country')}
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
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  rows,
  maxLength,
  clearable,
  autoResize,
  onIntent,
  onFocus,
  onBlur,
}: {
  model: MacroTextFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  rows?: number;
  maxLength?: number;
  clearable?: boolean;
  autoResize?: boolean;
  onIntent: (intent: MacroTextFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const inputRef = useRef<ComponentRef<typeof ThemedInput>>(null);
  const cursorRef = useRef<number>(model.value.length);
  const [activeIndex, setActiveIndex] = useState(0);

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedUnit = resolvedDef?.presentation?.unitDisplay;
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedPlaceholder = model.placeholder ?? resolvedDef?.presentation?.placeholder ?? '';
  const resolvedLayout = layout ?? model.layout ?? 'vertical';
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const minCard = resolvedDef?.contract?.cardinality?.min;
  const resolvedRequired = Boolean(model.required || (minCard !== undefined && minCard >= 1));
  const resolvedRows = Math.max(2, rows ?? model.rows ?? resolvedDef?.presentation?.rows ?? 4);
  const resolvedMaxLength = maxLength ?? model.maxLength;
  const resolvedClearable = clearable ?? model.clearable ?? false;
  const resolvedAutoResize = autoResize ?? model.autoResize ?? false;
  const dictationVisible = model.dictationEnabled !== false;
  const showClear = resolvedClearable && !locked && model.value.length > 0;
  const showCounter = model.showCounter !== false && (resolvedMaxLength !== undefined || model.showCounter === true);
  const vs = hasMacroValidationState(model.messages);

  const minHeight = Math.max(88, Math.round(resolvedRows * t.textMd * t.leadingNormal + 20));
  const [measuredHeight, setMeasuredHeight] = useState<number>(minHeight);

  useEffect(() => {
    if (!resolvedAutoResize || model.value === '') {
      setMeasuredHeight(minHeight);
    }
  }, [resolvedAutoResize, minHeight, model.value]);

  const isOpen = Boolean(model.suggestionsOpen && !locked);
  const hasSuggestions = model.suggestions.length > 0;
  const clampedActiveIndex = hasSuggestions
    ? Math.max(0, Math.min(activeIndex, model.suggestions.length - 1))
    : 0;
  const listboxId = `${id}-macros`;
  const counterId = `${id}-counter`;
  const activeDescendant = isOpen && hasSuggestions ? `${id}-macro-${clampedActiveIndex}` : undefined;
  const hasMessages = Boolean(resolvedHint || model.messages?.length);
  const describedBy =
    [hasMessages ? `${id}-message` : '', showCounter ? counterId : ''].filter(Boolean).join(' ') || undefined;
  const labelledBy = headingId || (!labelHidden && resolvedLabel ? `${id}-label` : undefined);

  const handleContentSize = (e: TextInputContentSizeChangeEvent) => {
    if (!resolvedAutoResize) return;
    const h = Math.ceil(e.nativeEvent.contentSize.height + 16);
    if (h > 0 && Math.abs(h - measuredHeight) > 2) {
      setMeasuredHeight(Math.max(minHeight, h));
    }
  };

  const handleTextChange = (next: string) => {
    if (locked) return;
    const domCursor =
      Platform.OS === 'web'
        ? (inputRef.current as unknown as { selectionStart?: number } | null)?.selectionStart
        : undefined;
    const delta = next.length - model.value.length;
    const nextCursor =
      typeof domCursor === 'number'
        ? domCursor
        : cursorRef.current <= model.value.length
          ? Math.max(0, Math.min(next.length, cursorRef.current + delta))
          : next.length;
    cursorRef.current = nextCursor;

    onIntent({ type: 'valueChangeRequested', value: next });
    const token = extractActiveMacroTrigger(next, nextCursor);
    if (token) {
      setActiveIndex(0);
      onIntent({ type: 'macroQueryRequested', trigger: token });
    } else if (model.suggestionsOpen) {
      onIntent({ type: 'macroDismissRequested' });
    }
  };

  const handleKeyDown = (e: WebKeyEvent) => {
    if (locked) return;
    if (!isOpen) {
      if (e.key === 'Escape' && model.suggestionsOpen) {
        e.preventDefault();
        onIntent({ type: 'macroDismissRequested' });
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onIntent({ type: 'macroDismissRequested' });
      return;
    }
    if (!hasSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % model.suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + model.suggestions.length) % model.suggestions.length);
    } else if (e.key === 'Enter') {
      const chosen = model.suggestions[clampedActiveIndex];
      if (chosen) {
        e.preventDefault();
        onIntent({ type: 'macroSelected', trigger: chosen.trigger });
      }
    }
  };

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={true}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      unit={resolvedUnit}
      required={resolvedRequired}
      readOnly={locked}
      hint={resolvedHint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={fi => {
        if (fi.type === 'statusChangeRequested' && !locked) {
          onIntent({ type: 'statusChangeRequested', status: fi.status });
        }
      }}
    >
      <View style={[styles.fieldStack, isOpen && Platform.OS === 'web' ? { zIndex: 40 } : undefined]}>
        {!locked ? (
          <View
            {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : null)}
            style={styles.macroToolbar}
          >
            <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: fontFamily(t) }}>
              Type <Text style={{ fontWeight: fontWeight(t.weightBold) }}>.</Text> or{' '}
              <Text style={{ fontWeight: fontWeight(t.weightBold) }}>/</Text> for SmartPhrases
            </Text>
            <View style={styles.macroActions}>
              {showClear ? (
                <Pressable
                  role="button"
                  aria-label={`Clear ${resolvedLabel}`}
                  {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : null)}
                  onPress={() => {
                    if (!locked) {
                      onIntent({ type: 'clearRequested' });
                      (inputRef.current as { focus?: () => void } | null)?.focus?.();
                    }
                  }}
                  style={({ pressed, focused }: PressState) => [
                    styles.clearBtn,
                    focusRing(t, focused),
                    {
                      width: Math.max(44, t.controlHeight),
                      height: Math.max(44, t.controlHeight),
                      minWidth: 44,
                      minHeight: 44,
                      borderColor: t.border,
                      backgroundColor: pressed ? t.surfaceSoft : t.surface,
                    },
                  ]}
                >
                  <SvgIcon name="close" size={14} color={t.textMuted} />
                </Pressable>
              ) : null}
              {dictationVisible ? (
                <EmrButton
                  small
                  variant={model.dictating ? 'danger' : 'outline'}
                  pressed={Boolean(model.dictating)}
                  accessibilityLabel={
                    model.dictating ? `Stop dictation for ${resolvedLabel}` : `Start dictation for ${resolvedLabel}`
                  }
                  onPress={() => {
                    if (!locked) onIntent({ type: 'dictationToggleRequested' });
                  }}
                >
                  <SvgIcon name="mic" size={14} color={model.dictating ? t.danger : t.primary} />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: model.dictating ? t.danger : t.primary,
                      fontSize: t.textSm,
                      fontWeight: fontWeight(650),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {model.dictating ? 'Stop dictation' : 'Start dictation'}
                  </Text>
                </EmrButton>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.macroAnchor}>
          <ThemedInput
            ref={inputRef}
            id={id}
            role="combobox"
            aria-labelledby={labelledBy}
            aria-label={resolvedLabel}
            aria-describedby={describedBy}
            aria-required={resolvedRequired || undefined}
            aria-readonly={locked || undefined}
            aria-expanded={isOpen}
            {...(webProps({
              'aria-autocomplete': 'list',
              'aria-haspopup': 'listbox',
              'aria-controls': isOpen && hasSuggestions ? listboxId : undefined,
              'aria-activedescendant': activeDescendant,
            }) as object)}
            multiline
            numberOfLines={resolvedRows}
            maxLength={resolvedMaxLength}
            placeholder={resolvedPlaceholder}
            value={model.value}
            invalid={vs.hasError}
            readOnly={locked}
            editable={!locked}
            onFocus={() => onFocus?.()}
            onBlur={() => onBlur?.()}
            onSelectionChange={(e: { nativeEvent: { selection: { start: number } } }) => {
              cursorRef.current = e.nativeEvent.selection.start;
            }}
            onContentSizeChange={resolvedAutoResize ? handleContentSize : undefined}
            onChangeText={handleTextChange}
            {...(textInputKeys(handleKeyDown) as object)}
            style={[
              resolvedAutoResize ? { minHeight: Math.max(minHeight, measuredHeight) } : { minHeight },
              {
                borderStyle: locked ? 'dashed' : 'solid',
                backgroundColor: locked ? t.surfaceSoft : t.surface,
              },
              !vs.hasError && vs.hasWarning ? { borderColor: t.warning } : null,
            ]}
          />
          {isOpen ? (
            <View
              {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : null)}
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
                <Pressable
                  role="button"
                  aria-label="Close SmartPhrases"
                  {...(Platform.OS === 'web'
                    ? ({ onMouseDown: (e: { preventDefault?: () => void }) => e.preventDefault?.() } as object)
                    : null)}
                  onPress={() => {
                    onIntent({ type: 'macroDismissRequested' });
                    (inputRef.current as { focus?: () => void } | null)?.focus?.();
                  }}
                  style={({ pressed, focused }: PressState) => [
                    styles.macroCloseBtn,
                    focusRing(t, focused),
                    { backgroundColor: pressed ? t.surfaceSoft : 'transparent' },
                  ]}
                >
                  <SvgIcon name="close" size={14} color={t.textMuted} />
                </Pressable>
              </View>
              {!hasSuggestions ? (
                <View role="status" style={styles.macroEmpty}>
                  <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
                    No matching SmartPhrases
                  </Text>
                </View>
              ) : (
                <ScrollView
                  {...(webProps({ role: 'listbox', id: listboxId }) as object)}
                  aria-label={`${resolvedLabel} macro suggestions`}
                  style={styles.macroScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {model.suggestions.map((item, idx) => {
                    const active = idx === clampedActiveIndex;
                    return (
                      <Pressable
                        key={item.trigger}
                        id={`${id}-macro-${idx}`}
                        role="option"
                        aria-selected={active}
                        aria-label={`${item.trigger}: ${item.label}`}
                        {...(Platform.OS === 'web'
                          ? ({ onMouseDown: (e: { preventDefault?: () => void }) => e.preventDefault?.() } as object)
                          : null)}
                        onPress={() => {
                          if (!locked) onIntent({ type: 'macroSelected', trigger: item.trigger });
                        }}
                        style={({ pressed, focused }: PressState) => [
                          styles.macroItem,
                          focusRing(t, focused),
                          {
                            minHeight: Math.max(44, t.controlHeight),
                            backgroundColor: pressed ? t.surfaceRaised : active ? t.primarySoft : t.surface,
                            borderColor: active ? t.primaryBorder : 'transparent',
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
                          {item.category ? (
                            <View style={[styles.macroCategoryBadge, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}>
                              <Text
                                style={{
                                  color: t.textMuted,
                                  fontSize: t.text2xs,
                                  fontFamily: fontFamily(t),
                                }}
                              >
                                {item.category}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          numberOfLines={2}
                          style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}
                        >
                          {item.expansionPreview}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : null}
        </View>

        {showCounter ? (
          <View style={styles.macroFooter}>
            <Text
              nativeID={counterId}
              style={[
                {
                  color:
                    resolvedMaxLength !== undefined && model.value.length >= resolvedMaxLength
                      ? t.warning
                      : t.textMuted,
                  fontSize: t.text2xs,
                  fontFamily: fontFamily(t),
                },
                Platform.OS === 'web' ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object) : null,
              ]}
            >
              {resolvedMaxLength !== undefined ? `${model.value.length} / ${resolvedMaxLength}` : `${model.value.length}`}
            </Text>
          </View>
        ) : null}
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 11. EmrLateralityField (OD/OS/OU or Right/Left/Bilateral + site confirmation)
// ---------------------------------------------------------------------------

export function EmrLateralityField({
  model,
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  size,
  clearable,
  onIntent,
  onCleared,
  onFocus,
  onBlur,
}: {
  model: LateralityFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  size?: EmrSegmentedSize;
  clearable?: boolean;
  onIntent: (intent: LateralityFieldIntent) => void;
  onCleared?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const groupRef = useRef<unknown>(null);
  const focusedRef = useRef(false);

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedUnit = resolvedDef?.presentation?.unitDisplay;
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedLayout = layout ?? model.layout ?? 'vertical';
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const minCard = resolvedDef?.contract?.cardinality?.min;
  const resolvedRequired = Boolean(model.required || (minCard !== undefined && minCard >= 1));
  const resolvedSize: EmrSegmentedSize = size ?? model.size ?? 'md';
  const resolvedClearable = clearable ?? model.clearable ?? !resolvedRequired;
  const resolvedOrientation = model.orientation ?? 'horizontal';
  const resolvedConfirmationLabel =
    model.confirmationLabel || DEFAULT_LATERALITY_CONFIRMATION_LABEL;

  const segmentedOptions: EmrSegmentedOption[] = resolveLateralityOptions(model).map(opt => ({
    value: opt.code,
    label: opt.label,
    badge: opt.shortLabel,
    description: opt.description,
    icon: opt.icon,
    ariaLabel: opt.ariaLabel,
    readOnly: opt.readOnly,
    disabled: opt.disabled,
    tone: opt.tone,
  }));

  const validation = resolveLateralityValidation(model.messages);
  const hasMessages = Boolean(resolvedHint || model.messages?.length);
  const describedBy = hasMessages ? `${id}-message` : undefined;
  const groupLabelledBy =
    headingId || (!labelHidden && resolvedLabel ? `${id}-label` : undefined);

  const handleChildFocus = () => {
    if (!focusedRef.current) {
      focusedRef.current = true;
      onFocus?.();
    }
  };

  const handleChildBlur = (e?: unknown) => {
    if (Platform.OS === 'web') {
      const ev = e as { nativeEvent?: { relatedTarget?: unknown }; relatedTarget?: unknown } | undefined;
      const related = (ev?.nativeEvent?.relatedTarget ?? ev?.relatedTarget) as Node | null | undefined;
      const container = groupRef.current as unknown as { contains?: (n: Node) => boolean } | null;
      if (related && container?.contains?.(related)) return;
    }
    if (focusedRef.current) {
      focusedRef.current = false;
      onBlur?.();
    }
  };

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      unit={resolvedUnit}
      required={resolvedRequired}
      readOnly={locked}
      hint={resolvedHint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={fi => {
        if (fi.type === 'statusChangeRequested' && !locked) {
          onIntent({ type: 'statusChangeRequested', status: fi.status });
        }
      }}
    >
      <View
        ref={groupRef as never}
        style={styles.fieldStack}
        {...(Platform.OS === 'web'
          ? webProps({
              onBlur: (e: unknown) => handleChildBlur(e),
            })
          : {})}
      >
        <EmrSegmentedControl
          controlId={`${id}-control`}
          ariaLabel={resolvedLabel}
          ariaLabelledBy={groupLabelledBy}
          ariaDescribedBy={describedBy}
          options={segmentedOptions}
          value={model.value}
          size={resolvedSize}
          orientation={resolvedOrientation}
          clearable={resolvedClearable}
          allowDeselect={false}
          required={resolvedRequired}
          readOnly={locked}
          invalid={validation.groupHasError}
          hasWarning={validation.groupHasWarning}
          onFocused={handleChildFocus}
          onBlurred={() => handleChildBlur()}
          onValueChange={next => {
            if (locked) return;
            onIntent({
              type: 'lateralitySelected',
              code: (next as EmrLateralityCode | null) ?? null,
            });
          }}
          onCleared={() => {
            if (!locked) onCleared?.();
          }}
        />

        {model.requiresConfirmation ? (
          <EmrCheckbox
            controlId={`${id}-confirm`}
            label={resolvedConfirmationLabel}
            checked={Boolean(model.confirmed)}
            readOnly={locked}
            required={resolvedRequired}
            invalid={validation.confirmationHasError}
            hasWarning={validation.confirmationHasWarning}
            ariaDescribedBy={describedBy}
            onFocused={handleChildFocus}
            onBlurred={() => handleChildBlur()}
            onCheckedChange={confirmed => {
              if (!locked) onIntent({ type: 'confirmationChangeRequested', confirmed });
            }}
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
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  size,
  clearable,
  onIntent,
  onFocus,
  onBlur,
}: {
  model: VisualAcuityFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  onIntent: (intent: VisualAcuityFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const { width: winW } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const groupRef = useRef<ComponentRef<typeof View>>(null);
  const focusedRef = useRef(false);

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedUnit = resolvedDef?.presentation?.unitDisplay;
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedLayout = layout ?? model.layout ?? 'vertical';
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const minCard = resolvedDef?.contract?.cardinality?.min;
  const resolvedRequired = Boolean(model.required || (minCard !== undefined && minCard >= 1));
  const resolvedSize: 'sm' | 'md' | 'lg' = size ?? model.size ?? 'md';
  const resolvedClearable = clearable ?? model.clearable ?? true;

  const pv = resolveVisualAcuityPartValidation(model.messages);
  const hasMessages = Boolean(resolvedHint || model.messages?.length);
  const describedBy = hasMessages ? `${id}-message` : undefined;
  const groupLabelledBy =
    headingId || (!labelHidden && resolvedLabel ? `${id}-label` : undefined);
  const isNarrow = (containerWidth !== null && containerWidth < 520) || winW <= 640;

  const notationLabel = model.labels?.notationLabel ?? 'Notation';
  const correctionLabel = model.labels?.correctionLabel ?? 'Correction';
  const valueLabel = model.labels?.valueLabel ?? 'Acuity';
  const pinholeLabel = model.labels?.pinholeLabel ?? 'Pinhole (PH)';
  const derivedLabel = model.labels?.derivedLabel ?? 'Equivalent';
  const clearLabel = model.labels?.clearLabel ?? 'Clear';
  const valuePlaceholder = model.valuePlaceholder ?? 'Select acuity';
  const pinholePlaceholder = model.pinholePlaceholder ?? 'Not tested';
  const pinholeOptions = model.pinholeOptions ?? model.valueOptions;

  const handleChildFocus = () => {
    if (!focusedRef.current) {
      focusedRef.current = true;
      onFocus?.();
    }
  };

  const handleChildBlur = (e?: unknown) => {
    if (Platform.OS === 'web') {
      const ev = e as { nativeEvent?: { relatedTarget?: unknown }; relatedTarget?: unknown } | undefined;
      const related = (ev?.nativeEvent?.relatedTarget ?? ev?.relatedTarget) as Node | null | undefined;
      const container = groupRef.current as unknown as { contains?: (n: Node) => boolean } | null;
      if (related && container?.contains?.(related)) return;
    }
    if (focusedRef.current) {
      focusedRef.current = false;
      onBlur?.();
    }
  };

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      unit={resolvedUnit}
      required={resolvedRequired}
      readOnly={locked}
      hint={resolvedHint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={fi => {
        if (fi.type === 'statusChangeRequested' && !locked) {
          onIntent({ type: 'statusChangeRequested', status: fi.status });
        }
      }}
    >
      <View
        ref={groupRef}
        role="group"
        aria-labelledby={groupLabelledBy}
        aria-label={resolvedLabel}
        onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
        style={styles.fieldStack}
        {...(Platform.OS === 'web'
          ? webProps({
              onBlur: (e: unknown) => handleChildBlur(e),
            })
          : {})}
      >
        {model.eye || model.derivedDisplay ? (
          <View style={styles.acuityContextRow}>
            {model.eye ? (
              <EmrBadgeView
                tone="info"
                icon="eye"
                label={model.eye}
                assistiveText={resolveVisualAcuityEyeDescription(model.eye, model.labels)}
              />
            ) : null}
            {model.derivedDisplay ? (
              <EmrBadgeView
                tone={model.derivedTone ?? 'neutral'}
                label={model.derivedDisplay}
                assistiveText={`${derivedLabel}: ${model.derivedDisplay}`}
                tabularNums={true}
              />
            ) : null}
          </View>
        ) : null}

        {model.notationOptions.length > 0 || model.correctionOptions.length > 0 ? (
          <View style={styles.acuityControlsRow}>
            {model.notationOptions.length > 0 ? (
              <View style={[styles.acuitySegmentCol, isNarrow ? styles.acuityFullCol : null]}>
                <Text
                  nativeID={`${id}-notation-label`}
                  style={{
                    color: t.textMuted,
                    fontSize: t.textSm,
                    fontWeight: fontWeight(t.weightMedium),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {notationLabel}
                </Text>
                <EmrSegmentedControl
                  controlId={`${id}-notation`}
                  ariaLabel={`${resolvedLabel} ${notationLabel}`}
                  ariaLabelledBy={`${id}-notation-label`}
                  ariaDescribedBy={describedBy}
                  options={model.notationOptions}
                  value={model.notation}
                  size={resolvedSize}
                  allowDeselect={false}
                  readOnly={locked}
                  invalid={pv.notationHasError}
                  hasWarning={pv.notationHasWarning}
                  onFocused={handleChildFocus}
                  onBlurred={() => handleChildBlur()}
                  onValueChange={notation => {
                    if (!locked && notation) {
                      onIntent({ type: 'notationChangeRequested', notation: notation as EmrAcuityNotation });
                    }
                  }}
                />
              </View>
            ) : null}
            {model.correctionOptions.length > 0 ? (
              <View style={[styles.acuitySegmentCol, isNarrow ? styles.acuityFullCol : null]}>
                <Text
                  nativeID={`${id}-correction-label`}
                  style={{
                    color: t.textMuted,
                    fontSize: t.textSm,
                    fontWeight: fontWeight(t.weightMedium),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {correctionLabel}
                </Text>
                <EmrSegmentedControl
                  controlId={`${id}-correction`}
                  ariaLabel={`${resolvedLabel} ${correctionLabel}`}
                  ariaLabelledBy={`${id}-correction-label`}
                  ariaDescribedBy={describedBy}
                  options={model.correctionOptions}
                  value={model.correction}
                  size={resolvedSize}
                  allowDeselect={false}
                  readOnly={locked}
                  invalid={pv.correctionHasError}
                  hasWarning={pv.correctionHasWarning}
                  onFocused={handleChildFocus}
                  onBlurred={() => handleChildBlur()}
                  onValueChange={correction => {
                    if (!locked && correction) {
                      onIntent({
                        type: 'correctionChangeRequested',
                        correction: correction as EmrAcuityCorrection,
                      });
                    }
                  }}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={isNarrow || !model.showPinhole ? styles.acuityValueCol : styles.acuityValueRow}>
          <View style={isNarrow || !model.showPinhole ? styles.acuityFullCol : styles.acuitySelectCol}>
            <Text
              style={{
                color: t.textMuted,
                fontSize: t.textSm,
                fontWeight: fontWeight(t.weightMedium),
                fontFamily: fontFamily(t),
              }}
            >
              {valueLabel}
              {resolvedRequired ? <Text style={{ color: t.danger }}> *</Text> : null}
            </Text>
            <EmrSelect
              controlId={`${id}-value`}
              label={`${resolvedLabel} ${valueLabel}`}
              labelHidden={true}
              options={model.valueOptions}
              value={model.value}
              placeholder={valuePlaceholder}
              size={resolvedSize}
              clearable={resolvedClearable}
              clearLabel={clearLabel}
              required={resolvedRequired}
              invalid={pv.valueHasError}
              hasWarning={pv.valueHasWarning}
              ariaDescribedBy={describedBy}
              readOnly={locked}
              tabularNums={true}
              onFocused={handleChildFocus}
              onBlurred={() => handleChildBlur()}
              onValueChange={value => {
                if (!locked) onIntent({ type: 'valueChangeRequested', value });
              }}
            />
          </View>
          {model.showPinhole ? (
            <View style={isNarrow ? styles.acuityFullCol : styles.acuitySelectCol}>
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: t.textSm,
                  fontWeight: fontWeight(t.weightMedium),
                  fontFamily: fontFamily(t),
                }}
              >
                {pinholeLabel}
                {model.pinholeRequired ? <Text style={{ color: t.danger }}> *</Text> : null}
              </Text>
              <EmrSelect
                controlId={`${id}-pinhole`}
                label={`${resolvedLabel} ${pinholeLabel}`}
                labelHidden={true}
                options={pinholeOptions}
                value={model.pinholeValue ?? null}
                placeholder={pinholePlaceholder}
                size={resolvedSize}
                clearable={resolvedClearable}
                clearLabel={clearLabel}
                required={Boolean(model.pinholeRequired)}
                invalid={pv.pinholeHasError}
                hasWarning={pv.pinholeHasWarning}
                ariaDescribedBy={describedBy}
                readOnly={locked}
                tabularNums={true}
                onFocused={handleChildFocus}
                onBlurred={() => handleChildBlur()}
                onValueChange={value => {
                  if (!locked) onIntent({ type: 'pinholeChangeRequested', value });
                }}
              />
            </View>
          ) : null}
        </View>
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 13. EmrRefractionField (Sphere / Cylinder / Axis / Add clinical refraction)
// ---------------------------------------------------------------------------

function RefractionPartStepper({
  inputId,
  part,
  label,
  unit,
  value,
  min,
  max,
  step,
  precision,
  size,
  required,
  locked,
  hasError,
  hasWarning,
  describedBy,
  onPartFocus,
  onPartBlur,
  onPartChange,
}: {
  inputId: string;
  part: EmrRefractionPart;
  label: string;
  unit: string;
  value: number | null;
  min: number;
  max: number;
  step: number;
  precision: number;
  size: 'sm' | 'md' | 'lg';
  required: boolean;
  locked: boolean;
  hasError: boolean;
  hasWarning: boolean;
  describedBy?: string;
  onPartFocus: () => void;
  onPartBlur: (e?: unknown) => void;
  onPartChange: (next: number | null) => void;
}) {
  const t = useEmrTheme();
  const mode: 'decimal' | 'integer' = precision === 0 ? 'integer' : 'decimal';
  const numericVal = typeof value === 'number' && Number.isFinite(value) ? value : null;
  const externalFormatted = formatRefractionPartDisplay(numericVal, precision);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(externalFormatted);

  useEffect(() => {
    if (locked || !focused) {
      setDraft(externalFormatted);
      return;
    }
    setDraft(current => {
      const parsed = parsePairedNumberDraft(current, mode);
      if (!parsed.complete) return current;
      if (parsed.value === numericVal) return current;
      return externalFormatted;
    });
  }, [externalFormatted, locked, focused, mode, numericVal]);

  const displayed = locked || !focused ? externalFormatted : draft;
  const targetSize = size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const canDec = !locked && (numericVal === null || numericVal - step >= min - 1e-9);
  const canInc = !locked && (numericVal === null || numericVal + step <= max + 1e-9);

  const nudge = (delta: -1 | 1) => {
    if (locked) return;
    const next = stepRefractionPart({
      current: numericVal,
      delta,
      part,
      step,
      min,
      max,
    });
    setDraft(formatRefractionPartDisplay(next, precision));
    onPartChange(next);
  };

  const handleKey = (e: WebKeyEvent) => {
    if (locked) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      nudge(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nudge(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setDraft(externalFormatted);
    }
  };

  const keyboardType: KeyboardTypeOptions = precision === 0 ? 'number-pad' : 'decimal-pad';
  const borderColor = hasError
    ? t.danger
    : hasWarning
      ? t.warning
      : focused
        ? t.focus
        : hovered && !locked
          ? t.focus
          : t.border;

  return (
    <View style={styles.refractionCell}>
      <Text
        nativeID={`${inputId}-label`}
        style={{
          color: t.textMuted,
          fontSize: t.textXs,
          fontWeight: fontWeight(t.weightMedium),
          fontFamily: fontFamily(t),
        }}
      >
        {label}
      </Text>
      <View
        {...(Platform.OS === 'web'
          ? ({
              onMouseEnter: () => setHovered(true),
              onMouseLeave: () => setHovered(false),
            } as object)
          : null)}
        style={[
          styles.refStepperGroup,
          {
            minHeight: targetSize,
            borderColor,
            borderStyle: locked ? 'dashed' : 'solid',
            backgroundColor: locked ? t.surfaceSoft : t.surface,
          },
          focusRing(t, focused),
        ]}
      >
        <Pressable
          role="button"
          aria-label={`Decrease ${label}`}
          aria-disabled={!canDec}
          disabled={!canDec}
          onPress={() => nudge(-1)}
          {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null)}
          style={({ pressed, hovered: btnHovered, focused: btnFocused }: PressState & { hovered?: boolean }) => [
            styles.refStepBtn,
            focusRing(t, btnFocused),
            {
              minWidth: targetSize,
              minHeight: targetSize,
              borderRightWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : btnHovered && canDec ? t.primaryHover : t.surfaceSoft,
              opacity: canDec ? 1 : 0.4,
            },
          ]}
        >
          <SvgIcon name="minus" size={14} color={t.text} />
        </Pressable>

        <ThemedInput
          id={inputId}
          role="spinbutton"
          aria-label={label}
          aria-labelledby={`${inputId}-label`}
          aria-describedby={describedBy}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={numericVal ?? undefined}
          aria-required={required || undefined}
          aria-readonly={locked || undefined}
          invalid={hasError}
          {...(Platform.OS === 'web' && !hasError && hasWarning ? ({ dataSet: { warning: 'true' } } as object) : null)}
          {...(Platform.OS === 'web'
            ? webProps({
                onWheel: (e: { currentTarget?: { blur?: () => void } }) => {
                  e.currentTarget?.blur?.();
                },
              })
            : null)}
          value={displayed}
          keyboardType={keyboardType}
          inputMode={precision === 0 ? 'numeric' : 'decimal'}
          returnKeyType="done"
          readOnly={locked}
          editable={!locked}
          onSubmitEditing={() => {
            setDraft(externalFormatted);
          }}
          {...textInputKeys(handleKey)}
          style={[
            styles.refStepperInput,
            {
              minHeight: targetSize,
              borderWidth: 0,
              borderRadius: 0,
              backgroundColor: 'transparent',
              color: t.text,
              fontSize: t.textMd,
              fontFamily: fontFamily(t),
            },
            Platform.OS === 'web' ? ({ fontVariantNumeric: 'tabular-nums', outlineWidth: 0 } as unknown as object) : null,
          ]}
          onFocus={() => {
            setFocused(true);
            setDraft(externalFormatted);
            onPartFocus();
          }}
          onBlur={e => {
            setFocused(false);
            setDraft(externalFormatted);
            onPartBlur(e);
          }}
          onChangeText={text => {
            if (locked) return;
            const clean = sanitizePairedNumberText(text, mode);
            setDraft(clean);
            const parsed = parsePairedNumberDraft(clean, mode);
            if (parsed.complete) {
              onPartChange(parsed.value);
            }
          }}
        />

        <View
          aria-hidden
          style={[
            styles.refUnitBox,
            {
              borderLeftWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surfaceSoft,
            },
          ]}
        >
          <Text
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontWeight: fontWeight(t.weightMedium),
              fontFamily: fontFamily(t),
            }}
          >
            {unit}
          </Text>
        </View>

        <Pressable
          role="button"
          aria-label={`Increase ${label}`}
          aria-disabled={!canInc}
          disabled={!canInc}
          onPress={() => nudge(1)}
          {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null)}
          style={({ pressed, hovered: btnHovered, focused: btnFocused }: PressState & { hovered?: boolean }) => [
            styles.refStepBtn,
            focusRing(t, btnFocused),
            {
              minWidth: targetSize,
              minHeight: targetSize,
              borderLeftWidth: 1,
              borderColor: t.border,
              backgroundColor: pressed ? t.surfaceRaised : btnHovered && canInc ? t.primaryHover : t.surfaceSoft,
              opacity: canInc ? 1 : 0.4,
            },
          ]}
        >
          <SvgIcon name="plus" size={14} color={t.text} />
        </Pressable>
      </View>
    </View>
  );
}

export function EmrRefractionField({
  model,
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  size,
  clearable,
  onIntent,
  onFocus,
  onBlur,
}: {
  model: RefractionFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  onIntent: (intent: RefractionFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const groupRef = useRef<ComponentRef<typeof View>>(null);
  const focusedRef = useRef(false);

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || 'Refraction';
  const resolvedUnit = resolvedDef?.presentation?.unitDisplay;
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedLayout = layout ?? model.layout ?? 'vertical';
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const minCard = resolvedDef?.contract?.cardinality?.min;
  const resolvedRequired = Boolean(model.required || (minCard !== undefined && minCard >= 1));
  const resolvedSize: 'sm' | 'md' | 'lg' = size ?? model.size ?? 'md';
  const resolvedClearable = clearable ?? model.clearable ?? false;
  const showClear =
    resolvedClearable && !locked && hasRefractionValue(model.value, model.showNearAdd);
  const targetSize = resolvedSize === 'lg' ? 48 : Math.max(44, t.controlHeight);

  const hasMessages = Boolean(resolvedHint || model.messages?.length);
  const describedBy = hasMessages ? `${id}-message` : undefined;
  const groupLabelledBy =
    headingId || (!labelHidden && resolvedLabel ? `${id}-label` : undefined);
  const groupAriaLabel = model.eye ? `${resolvedLabel} (${model.eye})` : resolvedLabel;

  const handleChildFocus = () => {
    if (!focusedRef.current) {
      focusedRef.current = true;
      onFocus?.();
    }
  };

  const handleChildBlur = (e?: unknown) => {
    if (Platform.OS === 'web') {
      const ev = e as { nativeEvent?: { relatedTarget?: unknown }; relatedTarget?: unknown } | undefined;
      const related = (ev?.nativeEvent?.relatedTarget ?? ev?.relatedTarget) as Node | null | undefined;
      const container = groupRef.current as unknown as { contains?: (n: Node) => boolean } | null;
      if (related && container?.contains?.(related)) return;
    }
    if (focusedRef.current) {
      focusedRef.current = false;
      onBlur?.();
    }
  };

  const partKeys: readonly EmrRefractionPart[] = model.showNearAdd
    ? ['sphere', 'cylinder', 'axis', 'nearAdd']
    : ['sphere', 'cylinder', 'axis'];

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      unit={resolvedUnit}
      required={resolvedRequired}
      readOnly={locked}
      hint={resolvedHint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={fi => {
        if (fi.type === 'statusChangeRequested' && !locked) {
          onIntent({ type: 'statusChangeRequested', status: fi.status });
        }
      }}
    >
      <View
        ref={groupRef}
        role="group"
        aria-labelledby={groupLabelledBy}
        aria-label={groupAriaLabel}
        aria-required={resolvedRequired || undefined}
        aria-describedby={describedBy}
        style={styles.fieldStack}
        {...(Platform.OS === 'web'
          ? webProps({
              onBlur: (e: unknown) => handleChildBlur(e),
            })
          : {})}
      >
        {model.eye || model.formattedSummary || showClear ? (
          <View style={styles.refHeaderRow}>
            {model.eye ? (
              <EmrBadgeView
                tone="info"
                icon="eye"
                label={model.eye}
                assistiveText={resolveRefractionEyeDescription(model.eye)}
              />
            ) : null}
            {model.formattedSummary ? (
              <EmrBadgeView
                tone="neutral"
                label={model.formattedSummary}
                assistiveText={`Summary: ${model.formattedSummary}`}
                tabularNums={true}
              />
            ) : null}
            {showClear ? (
              <Pressable
                role="button"
                aria-label={`${labels.clear} ${resolvedLabel}`}
                onPress={() => {
                  if (!locked) onIntent({ type: 'clearRequested' });
                }}
                {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null)}
                style={({ pressed, hovered, focused: btnFocused }: PressState & { hovered?: boolean }) => [
                  styles.refClearBtn,
                  focusRing(t, btnFocused),
                  {
                    minWidth: targetSize,
                    minHeight: targetSize,
                    borderColor: hovered ? t.focus : t.border,
                    backgroundColor: pressed ? t.surfaceRaised : hovered ? t.surfaceSoft : t.surface,
                  },
                ]}
              >
                <SvgIcon name="close" size={14} color={t.textMuted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.refractionGrid}>
          {partKeys.map(key => {
            const cfg = REFRACTION_DEFAULT_BOUNDS[key];
            const val =
              key === 'sphere'
                ? model.value.sphere
                : key === 'cylinder'
                  ? model.value.cylinder
                  : key === 'axis'
                    ? model.value.axis
                    : (model.value.nearAdd ?? null);
            const min =
              key === 'sphere'
                ? (model.sphereMin ?? cfg.min)
                : key === 'cylinder'
                  ? (model.cylinderMin ?? cfg.min)
                  : key === 'axis'
                    ? (model.axisMin ?? cfg.min)
                    : (model.nearAddMin ?? cfg.min);
            const max =
              key === 'sphere'
                ? (model.sphereMax ?? cfg.max)
                : key === 'cylinder'
                  ? (model.cylinderMax ?? cfg.max)
                  : key === 'axis'
                    ? (model.axisMax ?? cfg.max)
                    : (model.nearAddMax ?? cfg.max);
            const step =
              key === 'sphere'
                ? (model.sphereStep ?? cfg.step)
                : key === 'cylinder'
                  ? (model.cylinderStep ?? cfg.step)
                  : key === 'axis'
                    ? (model.axisStep ?? cfg.step)
                    : (model.nearAddStep ?? cfg.step);
            const pv = resolveRefractionPartValidation(model.messages, key);
            return (
              <RefractionPartStepper
                key={key}
                inputId={`${id}-${key}`}
                part={key}
                label={cfg.label}
                unit={cfg.unit}
                value={val}
                min={min}
                max={max}
                step={step}
                precision={cfg.precision}
                size={resolvedSize}
                required={resolvedRequired}
                locked={locked}
                hasError={pv.hasError}
                hasWarning={pv.hasWarning}
                describedBy={describedBy}
                onPartFocus={handleChildFocus}
                onPartBlur={handleChildBlur}
                onPartChange={next => {
                  if (locked) return;
                  if (key === 'sphere') onIntent({ type: 'sphereChangeRequested', sphere: next });
                  else if (key === 'cylinder') onIntent({ type: 'cylinderChangeRequested', cylinder: next });
                  else if (key === 'axis') onIntent({ type: 'axisChangeRequested', axis: next });
                  else onIntent({ type: 'nearAddChangeRequested', nearAdd: next });
                }}
              />
            );
          })}
        </View>
      </View>
    </EmrFieldFrame>
  );
}

const styles = StyleSheet.create({
  fieldStack: { gap: 8, minWidth: 0 },
  inlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phoneRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  countryWrap: { minWidth: 120, flexShrink: 1, maxWidth: '100%' },
  phoneNumberWrap: { flex: 1, minWidth: 168, maxWidth: '100%', position: 'relative', justifyContent: 'center' },
  phoneIconOverlay: { position: 'absolute', left: 10, zIndex: 2 },
  phoneInputWithIcon: { paddingLeft: 32 },
  extWrap: { width: 92, minWidth: 80, maxWidth: '100%' },
  clearBtn: { borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  channelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addressHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 },
  addressHeaderEnd: { justifyContent: 'flex-end' },
  addressUseWrap: { flex: 1, minWidth: 0 },
  addressCell: { gap: 4, minWidth: 0 },
  addressGridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, minWidth: 0 },
  addressColStacked: { flexDirection: 'column', gap: 8, minWidth: 0 },
  addressHalf: { flex: 1, minWidth: 150, gap: 4 },
  addressSmall: { width: 132, minWidth: 112, gap: 4 },
  addressFullCell: { width: '100%', minWidth: 0, gap: 4 },
  macroToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  macroAnchor: { position: 'relative' },
  macroDropdown: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  macroDropdownWeb: {
    marginTop: 6,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  macroDropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 4,
    borderBottomWidth: 1,
  },
  macroCloseBtn: {
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroEmpty: {
    padding: 12,
  },
  macroScroll: { maxHeight: 220, padding: 6 },
  macroItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 2,
  },
  macroItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroTriggerPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  macroCategoryBadge: {
    marginLeft: 'auto',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  macroFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  acuityContextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  acuityControlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  acuitySegmentCol: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 0,
    maxWidth: '100%',
    gap: 4,
  },
  acuityValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  acuityValueCol: {
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
  },
  acuitySelectCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  acuityFullCol: {
    width: '100%',
    minWidth: 0,
    gap: 4,
  },
  refractionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    minWidth: 0,
  },
  refractionCell: {
    flexGrow: 1,
    flexBasis: 196,
    minWidth: 196,
    maxWidth: '100%',
    gap: 4,
  },
  refHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  refClearBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  refStepperGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  refStepBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  refStepperInput: {
    flex: 1,
    minWidth: 52,
    borderWidth: 0,
    borderRadius: 0,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  refUnitBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
    flexShrink: 0,
  },
});
