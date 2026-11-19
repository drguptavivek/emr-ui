'use client';

import { createElement, useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  AttachmentFieldIntent,
  AttachmentFieldViewModel,
  DurationFieldIntent,
  DurationFieldViewModel,
  EmrAttachmentRef,
  EmrDateTimeDisplayFormat,
  EmrDateTimeWireFormat,
  EmrDurationUnit,
  EmrDurationValue,
  EmrFieldDefinition,
  EmrPairedFieldValue,
  EmrPartialDate,
  EmrQuantityNumericMode,
  EmrQuantitySize,
  EmrRangeKind,
  EmrRangeValue,
  EmrSignaturePoint,
  EmrSignatureStroke,
  EmrTimeHourCycle,
  EmrTimePrecision,
  FieldFrameLayout,
  ImageFieldIntent,
  ImageFieldViewModel,
  PairedFieldIntent,
  PairedFieldViewModel,
  PartialDateFieldIntent,
  PartialDateFieldViewModel,
  RangeFieldIntent,
  RangeFieldValidationOptions,
  RangeFieldViewModel,
  RangeSideValidationState,
  ScaleFieldIntent,
  ScaleFieldViewModel,
  SignatureCaptureIntent,
  SignatureCaptureViewModel,
} from '@drguptavivek/emr-controller';
import { EmrDateTimeText, EmrTypedText, NumberInput, ThemedInput } from './inputs-core';
import { SvgIcon } from './icons';
import { EmrImageUpload } from './l1-image';
import { resolveDateFormat } from './l1-inputs.logic';
import { EmrLikert, EmrVas } from './l1-interactive';
import { EmrFileTrigger, EmrSegmentedControl } from './l1-new-inputs';
import { AssessmentStatusStrip, EmrFieldFrame } from './l2-field-frame';
import {
  adaptPartialDatePrecision,
  buildScaleAnchors,
  computeSignatureSegments,
  extractDurationPartValidation,
  formatByteSize,
  formatSignatureAttestation,
  hasSignatureValidationState,
  isSignaturePadLocked,
  mapPointerToSignaturePoint,
  normalizeFieldFrameLayout,
  projectSignatureStrokeForBox,
  resolveDurationFieldConfig,
  resolvePairedSideMode,
  resolvePairedSideValidation,
  resolveRangeFieldMessages,
  resolveRangeNumericMode,
  resolveRangeSideValidation,
  resolveSignatureCanvasGeometry,
  signaturePolylinePoints,
} from './l2-fields.logic';
import { useEmrLabels } from './labels';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export type {
  AttachmentFieldIntent,
  AttachmentFieldViewModel,
  DurationFieldIntent,
  DurationFieldViewModel,
  EmrAttachmentRef,
  EmrDurationUnit,
  EmrDurationValue,
  EmrFieldDefinition,
  EmrPairedFieldValue,
  EmrRangeKind,
  EmrRangeValue,
  EmrSignaturePoint,
  EmrSignatureStroke,
  ImageFieldIntent,
  ImageFieldViewModel,
  PairedFieldIntent,
  PairedFieldViewModel,
  PartialDateFieldIntent,
  PartialDateFieldViewModel,
  RangeFieldIntent,
  RangeFieldValidationOptions,
  RangeFieldViewModel,
  RangeSideValidationState,
  ScaleFieldIntent,
  ScaleFieldViewModel,
  SignatureCaptureIntent,
  SignatureCaptureViewModel,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

function hasErrorMessage(messages?: readonly { readonly severity: string }[]): boolean {
  return Boolean(messages?.some(m => m.severity === 'error'));
}

// ---------------------------------------------------------------------------
// 1. EmrScaleField (Likert / VAS + six-state ClinicalAssessmentStatus)
// ---------------------------------------------------------------------------

export function EmrScaleField({
  model,
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout = 'vertical',
  showMetadata = true,
  readOnly = false,
  onIntent,
  onFocus,
  onBlur,
}: {
  model: ScaleFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: 'vertical' | 'horizontal' | 'inline';
  showMetadata?: boolean;
  readOnly?: boolean;
  onIntent: (intent: ScaleFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedVariant = model.variant ?? (resolvedDef?.presentation?.widget === 'vas' ? 'vas' : 'likert');
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const resolvedRequired = Boolean(
    model.required || (resolvedDef?.contract?.cardinality?.min !== undefined && resolvedDef.contract.cardinality.min >= 1),
  );
  const anchors = buildScaleAnchors(model.min, model.max, model.anchors, resolvedVariant);
  const resolvedTone = (model.value !== null ? model.optionTones?.[model.value] : undefined) ?? model.tone;
  const firstError = model.messages?.find(m => m.severity === 'error')?.message;
  const firstWarning = model.messages?.find(m => m.severity === 'warning')?.message;
  const hasFooter = Boolean(model.hint || model.messages?.length);
  const controlDescribedBy = hasFooter ? `${id}-message` : undefined;
  const controlLabelledBy = headingId || `${id}-label`;

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={layout}
      showMetadata={showMetadata}
      unit={model.unit ?? resolvedDef?.presentation?.unitDisplay}
      required={resolvedRequired}
      readOnly={locked}
      hint={model.hint}
      messages={model.messages}
    >
      <View nativeID={`${id}-control`} style={styles.fieldStack}>
        {resolvedVariant === 'vas' ? (
          <EmrVas
            controlId={`${id}-vas`}
            label={resolvedLabel}
            labelHidden
            ariaLabelledBy={controlLabelledBy}
            ariaDescribedBy={controlDescribedBy}
            min={model.min}
            max={model.max}
            step={model.step}
            majorInterval={model.majorInterval}
            minorInterval={model.minorInterval}
            orientation={model.orientation}
            anchors={anchors}
            value={model.value}
            tone={resolvedTone}
            required={resolvedRequired}
            readOnly={locked}
            error={firstError}
            warning={!firstError ? firstWarning : undefined}
            onFocus={onFocus}
            onBlur={onBlur}
            onValueChange={v => {
              if (!locked) onIntent({ type: 'valueChangeRequested', value: v });
            }}
          />
        ) : (
          <EmrLikert
            controlId={`${id}-likert`}
            label={resolvedLabel}
            labelHidden
            ariaLabelledBy={controlLabelledBy}
            ariaDescribedBy={controlDescribedBy}
            min={model.min}
            max={model.max}
            step={model.step}
            anchors={anchors}
            value={model.value}
            tone={resolvedTone}
            optionTones={model.optionTones}
            required={resolvedRequired}
            readOnly={locked}
            error={firstError}
            warning={!firstError ? firstWarning : undefined}
            onFocus={onFocus}
            onBlur={onBlur}
            onValueChange={v => {
              if (!locked) onIntent({ type: 'valueChangeRequested', value: v });
            }}
          />
        )}
        {model.value !== null && !locked && model.clearable !== false ? (
          <View style={styles.inlineActions}>
            <EmrButton
              variant="ghost"
              accessibilityLabel={`${labels.clear} ${resolvedLabel}`}
              onPress={() => onIntent({ type: 'valueChangeRequested', value: null })}
            >
              <SvgIcon name="close" size={14} color={t.text} />
              <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                {labels.clear}
              </Text>
            </EmrButton>
          </View>
        ) : null}
        <AssessmentStatusStrip
          fieldLabel={resolvedLabel}
          status={model.status}
          statusOptions={model.statusOptions}
          readOnly={locked}
          onStatusChange={status => {
            if (!locked) onIntent({ type: 'statusChangeRequested', status });
          }}
        />
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrPartialDateField (Year / Year-Month / Full-Date + status)
// ---------------------------------------------------------------------------

const PARTIAL_PRECISION_OPTIONS = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Year & month' },
  { value: 'day', label: 'Full date' },
] as const;

export function EmrPartialDateField({
  model,
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout = 'vertical',
  showMetadata = true,
  readOnly = false,
  defaultPrecision = 'day',
  displayFormat,
  clearable = true,
  size = 'md',
  onIntent,
  onFocus,
  onBlur,
}: {
  model: PartialDateFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: 'vertical' | 'horizontal' | 'inline';
  showMetadata?: boolean;
  readOnly?: boolean;
  defaultPrecision?: EmrPartialDate['precision'];
  displayFormat?: 'dd-mm-yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'mm/dd/yyyy';
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onIntent: (intent: PartialDateFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const resolvedRequired = Boolean(
    model.required || (resolvedDef?.contract?.cardinality?.min !== undefined && resolvedDef.contract.cardinality.min >= 1),
  );
  const initialPrecision = model.value?.precision ?? model.defaultPrecision ?? defaultPrecision;
  const [draftPrecision, setDraftPrecision] = useState<EmrPartialDate['precision']>(initialPrecision);

  useEffect(() => {
    setDraftPrecision(model.value?.precision ?? model.defaultPrecision ?? defaultPrecision);
  }, [model.value?.precision, model.defaultPrecision, defaultPrecision]);

  const activePrecision = model.value?.precision ?? draftPrecision;
  const baseFormat = displayFormat ?? model.displayFormat ?? labels.dateFormat;
  const format = resolveDateFormat(baseFormat, activePrecision);
  const invalid = hasErrorMessage(model.messages);
  const firstWarning = model.messages?.find(m => m.severity === 'warning')?.message;
  const hasFooter = Boolean(model.hint || model.messages?.length);
  const resolvedClearable = model.clearable ?? clearable;

  const handlePrecisionChange = (nextRaw: string | null) => {
    if (locked || !nextRaw) return;
    const next = nextRaw as EmrPartialDate['precision'];
    setDraftPrecision(next);
    onIntent({ type: 'precisionChangeRequested', precision: next });
    if (model.value) {
      const adapted = adaptPartialDatePrecision(model.value, next);
      onIntent({ type: 'valueChangeRequested', value: adapted });
    }
  };

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={layout}
      showMetadata={showMetadata}
      required={resolvedRequired}
      readOnly={locked}
      hint={model.hint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={i => {
        if (!locked && i.type === 'statusChangeRequested') {
          onIntent({ type: 'statusChangeRequested', status: i.status });
        }
      }}
    >
      <View style={styles.fieldStack}>
        <EmrSegmentedControl
          ariaLabel={`${resolvedLabel} precision`}
          options={PARTIAL_PRECISION_OPTIONS}
          value={activePrecision}
          readOnly={locked}
          onValueChange={handlePrecisionChange}
        />
        <View style={styles.inlineActions}>
          <EmrTypedText
            key={format}
            id={`${id}-control`}
            aria-labelledby={headingId || `${id}-label`}
            aria-describedby={hasFooter ? `${id}-message` : undefined}
            aria-required={resolvedRequired || undefined}
            mode={format}
            placeholder={format}
            min={model.min}
            max={model.max}
            value={model.value?.value ?? null}
            invalid={invalid}
            clearable={resolvedClearable}
            size={model.size ?? size}
            readOnly={locked}
            editable={!locked}
            style={!invalid && firstWarning ? { borderColor: undefined } : undefined}
            onFocus={onFocus}
            onBlur={onBlur}
            onValueChange={iso => {
              if (!locked) {
                onIntent({
                  type: 'valueChangeRequested',
                  value: iso ? { value: iso, precision: activePrecision } : null,
                });
              }
            }}
          />
          {model.value !== null && !locked && resolvedClearable ? (
            <EmrButton
              variant="ghost"
              accessibilityLabel={`${labels.clear} ${resolvedLabel}`}
              onPress={() => onIntent({ type: 'valueChangeRequested', value: null })}
            >
              <SvgIcon name="close" size={14} color={t.text} />
              <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                {labels.clear}
              </Text>
            </EmrButton>
          ) : null}
        </View>
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrAttachmentField (File / Camera / Scanner attachment refs + status)
// ---------------------------------------------------------------------------

export function EmrAttachmentField({
  model,
  definition,
  controlId,
  headingId: _headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  onIntent,
  onNativeFilesSelected,
  onFocus,
  onBlur,
}: {
  model: AttachmentFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: 'vertical' | 'horizontal' | 'inline';
  showMetadata?: boolean;
  readOnly?: boolean;
  onIntent: (intent: AttachmentFieldIntent) => void;
  onNativeFilesSelected?: (files: readonly File[]) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const resolvedRequired = Boolean(
    model.required || (resolvedDef?.contract?.cardinality?.min !== undefined && resolvedDef.contract.cardinality.min >= 1),
  );
  const maxCard = resolvedDef?.contract?.cardinality?.max;
  const effectiveMaxItems = model.maxItems ?? (typeof maxCard === 'number' ? maxCard : undefined);
  const effectiveMultiple = model.multiple ?? effectiveMaxItems !== 1;
  const atCapacity = effectiveMaxItems !== undefined && model.items.length >= effectiveMaxItems;
  const primaryError = model.messages?.find(m => m.severity === 'error')?.message;
  const invalid = Boolean(primaryError);

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={layout ?? model.layout ?? 'vertical'}
      showMetadata={showMetadata || Boolean(model.showMetadata)}
      required={resolvedRequired}
      readOnly={locked}
      hint={model.hint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={i => {
        if (!locked && i.type === 'statusChangeRequested') {
          onIntent({ type: 'statusChangeRequested', status: i.status });
        }
      }}
    >
      <View
        style={styles.fieldStack}
        {...(Platform.OS === 'web'
          ? ({
              onFocus: () => onFocus?.(),
              onBlur: () => onBlur?.(),
            } as Record<string, unknown>)
          : {})}
      >
        {model.items.length > 0 ? (
          <View role="list" aria-label={`${resolvedLabel} attachments`} style={styles.attachmentList}>
            {model.items.map(item => {
              const metaParts = [item.contentType, formatByteSize(item.sizeBytes), item.uploadedAt].filter(Boolean);
              return (
                <View
                  key={item.id}
                  role="listitem"
                  style={[styles.attachmentItem, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
                >
                  <Pressable
                    role="button"
                    aria-label={`Open ${item.title}`}
                    onPress={() => onIntent({ type: 'itemSelected', id: item.id })}
                    style={({ pressed, focused }: PressState) => [
                      styles.attachmentBody,
                      focusRing(t, focused),
                      {
                        minHeight: Math.max(44, t.controlHeight),
                        backgroundColor: pressed ? t.surfaceRaised : 'transparent',
                      },
                    ]}
                  >
                    <SvgIcon name="paperclip" size={16} color={t.primary} />
                    <View style={styles.flex}>
                      <Text
                        style={{
                          color: t.text,
                          fontSize: t.textSm,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: fontFamily(t),
                          flexShrink: 1,
                        }}
                      >
                        {item.title}
                      </Text>
                      {metaParts.length > 0 ? (
                        <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: fontFamily(t) }}>
                          {metaParts.join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                    {item.statusBadge ? <EmrBadgeView badge={item.statusBadge} /> : null}
                  </Pressable>
                  {!locked ? (
                    <Pressable
                      role="button"
                      aria-label={`Remove ${item.title}`}
                      onPress={() => {
                        if (!locked) onIntent({ type: 'itemRemoveRequested', id: item.id });
                      }}
                      style={({ pressed, focused }: PressState) => [
                        styles.attachmentRemove,
                        focusRing(t, focused),
                        {
                          minWidth: 44,
                          minHeight: Math.max(44, t.controlHeight),
                          paddingHorizontal: 10,
                          gap: 6,
                          flexDirection: 'row',
                          borderLeftColor: t.border,
                          backgroundColor: pressed ? t.dangerSoft : 'transparent',
                        },
                      ]}
                    >
                      <SvgIcon name="trash" size={14} color={t.danger} />
                      <Text style={{ color: t.danger, fontSize: t.textXs, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                        Remove
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : locked && !model.status ? (
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>No attachments recorded.</Text>
        ) : null}

        {!locked ? (
          <View style={styles.fieldStack}>
            <EmrFileTrigger
              controlId={`${id}-trigger`}
              accept={model.accept}
              multiple={effectiveMultiple}
              disabled={atCapacity}
              error={invalid ? primaryError : undefined}
              dropHint={
                effectiveMaxItems !== undefined
                  ? `${model.items.length} of ${effectiveMaxItems} attached`
                  : 'Drag & drop or choose files'
              }
              onFilesSelected={files => {
                if (!locked && !atCapacity) onIntent({ type: 'filesSelected', files });
              }}
              onNativeFilesSelected={files => {
                if (!locked && !atCapacity) onNativeFilesSelected?.(files);
              }}
            />
            {model.allowCamera ? (
              <View style={styles.inlineActions}>
                <EmrButton
                  variant="outline"
                  disabled={atCapacity}
                  accessibilityLabel={`Capture photo for ${resolvedLabel}`}
                  onPress={() => {
                    if (!locked && !atCapacity) onIntent({ type: 'captureRequested', mode: 'camera' });
                  }}
                >
                  <SvgIcon name="camera" size={16} color={t.primary} />
                  <Text style={{ color: t.primary, fontSize: t.textSm, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>
                    Camera
                  </Text>
                </EmrButton>
                <EmrButton
                  variant="outline"
                  disabled={atCapacity}
                  accessibilityLabel={`Scan document for ${resolvedLabel}`}
                  onPress={() => {
                    if (!locked && !atCapacity) onIntent({ type: 'captureRequested', mode: 'scanner' });
                  }}
                >
                  <SvgIcon name="scanner" size={16} color={t.primary} />
                  <Text style={{ color: t.primary, fontSize: t.textSm, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>
                    Scanner
                  </Text>
                </EmrButton>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 4. EmrPairedField (BP Systolic/Diastolic, C/D ratio, OD/OS paired entry)
// ---------------------------------------------------------------------------

export function EmrPairedField({
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
  model: PairedFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: 'vertical' | 'horizontal' | 'inline';
  showMetadata?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  onIntent: (intent: PairedFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedUnit = model.unit ?? resolvedDef?.presentation?.unitDisplay;
  const resolvedLayout = layout ?? model.layout ?? 'vertical';
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const resolvedSize = size ?? model.size ?? 'md';
  const targetSize = resolvedSize === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const firstLocked = locked || Boolean(model.firstReadOnly);
  const secondLocked = locked || Boolean(model.secondReadOnly);
  const resolvedRequired = Boolean(
    model.required || (resolvedDef?.contract?.cardinality?.min !== undefined && resolvedDef.contract.cardinality.min >= 1),
  );
  const firstRequired = model.firstRequired ?? resolvedRequired;
  const secondRequired = model.secondRequired ?? resolvedRequired;
  const firstMode = resolvePairedSideMode(model.firstMode, model.mode, resolvedDef);
  const secondMode = resolvePairedSideMode(model.secondMode, model.mode, resolvedDef);
  const sideValidation = resolvePairedSideValidation(model.messages);
  const hasFooter = Boolean(model.hint || model.messages?.length);
  const describedBy = hasFooter ? `${id}-message` : undefined;
  const groupLabelledBy = headingId || (!labelHidden && resolvedLabel ? `${id}-label` : undefined);
  const firstVal = model.value?.first ?? null;
  const secondVal = model.value?.second ?? null;
  const resolvedClearable = clearable ?? model.clearable ?? false;
  const showClear =
    resolvedClearable &&
    !locked &&
    ((!firstLocked && firstVal !== null && firstVal !== '') ||
      (!secondLocked && secondVal !== null && secondVal !== ''));
  const showSteppers = model.showSteppers === true;

  const renderSide = (params: {
    sideKey: 'first' | 'second';
    sideLabel: string;
    sidePlaceholder: string | undefined;
    sideMode: 'text' | 'decimal' | 'integer';
    sideMin: number | undefined;
    sideMax: number | undefined;
    sideStep: number | undefined;
    sidePrecision: number | undefined;
    sideMaxLength: number | undefined;
    sideRequired: boolean;
    sideLocked: boolean;
    sideInvalid: boolean;
    sideWarning: boolean;
    val: string | number | null;
    emit: (next: string | number | null) => void;
  }) => {
    const {
      sideKey,
      sideLabel,
      sidePlaceholder,
      sideMode,
      sideMin,
      sideMax,
      sideStep,
      sidePrecision,
      sideMaxLength,
      sideRequired,
      sideLocked,
      sideInvalid,
      sideWarning,
      val,
      emit,
    } = params;
    const isNumeric = sideMode === 'decimal' || sideMode === 'integer';
    const numericVal =
      typeof val === 'number'
        ? val
        : val != null && val !== '' && Number.isFinite(Number(val))
          ? Number(val)
          : undefined;
    return (
      <View style={styles.pairedHalf}>
        <Text
          style={{
            color: t.textMuted,
            fontSize: t.textXs,
            fontWeight: fontWeight(t.weightMedium),
            fontFamily: fontFamily(t),
          }}
        >
          {sideLabel}
          {sideRequired ? (
            <Text style={{ color: t.danger, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}> *</Text>
          ) : null}
        </Text>
        {isNumeric ? (
          <NumberInput
            id={`${id}-${sideKey}`}
            aria-label={`${resolvedLabel}, ${sideLabel}`}
            aria-describedby={describedBy}
            aria-required={sideRequired || undefined}
            aria-readonly={sideLocked || undefined}
            integer={sideMode === 'integer'}
            min={sideMin}
            max={sideMax}
            step={sideStep}
            precision={sidePrecision}
            maxLength={sideMaxLength}
            showSteppers={showSteppers}
            size={resolvedSize}
            maxWidth="none"
            placeholder={sidePlaceholder}
            value={numericVal}
            invalid={sideInvalid}
            warning={!sideInvalid && sideWarning}
            readOnly={sideLocked}
            editable={!sideLocked}
            onFocus={onFocus}
            onBlur={onBlur}
            onNumber={n => {
              if (!sideLocked) emit(n);
            }}
          />
        ) : (
          <ThemedInput
            id={`${id}-${sideKey}`}
            aria-label={`${resolvedLabel}, ${sideLabel}`}
            aria-describedby={describedBy}
            aria-required={sideRequired || undefined}
            aria-readonly={sideLocked || undefined}
            placeholder={sidePlaceholder}
            maxLength={sideMaxLength}
            value={val == null ? '' : String(val)}
            invalid={sideInvalid}
            readOnly={sideLocked}
            editable={!sideLocked}
            style={[
              {
                minHeight: targetSize,
                borderStyle: sideLocked ? 'dashed' : 'solid',
              },
              !sideInvalid && sideWarning ? { borderColor: t.warning } : null,
            ]}
            onFocus={onFocus}
            onBlur={onBlur}
            onChangeText={txt => {
              if (!sideLocked) emit(txt === '' ? null : txt);
            }}
          />
        )}
      </View>
    );
  };

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      required={resolvedRequired}
      readOnly={locked}
      hint={model.hint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={i => {
        if (!locked && i.type === 'statusChangeRequested') {
          onIntent({ type: 'statusChangeRequested', status: i.status });
        }
      }}
    >
      <View style={styles.fieldStack}>
        <View role="group" aria-labelledby={groupLabelledBy} aria-label={resolvedLabel} style={styles.pairedRow}>
          {renderSide({
            sideKey: 'first',
            sideLabel: model.firstLabel,
            sidePlaceholder: model.firstPlaceholder,
            sideMode: firstMode,
            sideMin: model.firstMin ?? model.min,
            sideMax: model.firstMax ?? model.max,
            sideStep: model.firstStep ?? model.step,
            sidePrecision: model.firstPrecision ?? model.precision,
            sideMaxLength: model.firstMaxLength ?? model.maxLength,
            sideRequired: firstRequired,
            sideLocked: firstLocked,
            sideInvalid: sideValidation.firstHasError,
            sideWarning: sideValidation.firstHasWarning,
            val: firstVal,
            emit: next => onIntent({ type: 'firstChangeRequested', value: next }),
          })}
          <Text
            aria-hidden
            style={[
              styles.pairedSeparator,
              {
                paddingBottom: resolvedSize === 'lg' ? 12 : 10,
                color: t.textMuted,
                fontSize: t.textLg,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: fontFamily(t),
              },
            ]}
          >
            {model.separator ?? '/'}
          </Text>
          {renderSide({
            sideKey: 'second',
            sideLabel: model.secondLabel,
            sidePlaceholder: model.secondPlaceholder,
            sideMode: secondMode,
            sideMin: model.secondMin ?? model.min,
            sideMax: model.secondMax ?? model.max,
            sideStep: model.secondStep ?? model.step,
            sidePrecision: model.secondPrecision ?? model.precision,
            sideMaxLength: model.secondMaxLength ?? model.maxLength,
            sideRequired: secondRequired,
            sideLocked: secondLocked,
            sideInvalid: sideValidation.secondHasError,
            sideWarning: sideValidation.secondHasWarning,
            val: secondVal,
            emit: next => onIntent({ type: 'secondChangeRequested', value: next }),
          })}
          {resolvedUnit ? (
            <Text
              aria-hidden
              style={[
                styles.pairedUnit,
                {
                  paddingBottom: resolvedSize === 'lg' ? 14 : 12,
                  color: t.textMuted,
                  fontSize: t.textSm,
                  fontWeight: fontWeight(t.weightMedium),
                  fontFamily: fontFamily(t),
                },
              ]}
            >
              {resolvedUnit}
            </Text>
          ) : null}
          {showClear ? (
            <Pressable
              role="button"
              aria-label={`${labels.clear} ${resolvedLabel}`}
              onPress={() => onIntent({ type: 'clearRequested' })}
              {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : null)}
              style={({ pressed, hovered, focused }: PressState & { hovered?: boolean }) => [
                styles.pairedClearBtn,
                focusRing(t, focused),
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
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 5. EmrDurationInput (Amount + UCUM calendar/time unit)
// ---------------------------------------------------------------------------

export function EmrDurationInput({
  model,
  definition,
  controlId,
  headingId,
  labelHidden,
  layout,
  showMetadata = true,
  readOnly = false,
  size,
  clearable,
  showSteppers,
  mode,
  precision,
  placeholder,
  unitPlaceholder,
  hint,
  info,
  warning,
  error,
  onIntent,
  onFocus,
  onBlur,
  onCleared,
  onSubmitted,
}: {
  model: DurationFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  size?: EmrQuantitySize;
  clearable?: boolean;
  showSteppers?: boolean;
  mode?: EmrQuantityNumericMode;
  precision?: number;
  placeholder?: string;
  unitPlaceholder?: string;
  hint?: string;
  info?: string;
  warning?: string;
  error?: string;
  onIntent: (intent: DurationFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onCleared?: () => void;
  onSubmitted?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const groupRef = useRef<ComponentRef<typeof View>>(null);
  const focusedRef = useRef(false);

  const cfg = resolveDurationFieldConfig(model, {
    definition,
    layout,
    showMetadata,
    readOnly,
    size,
    clearable,
    showSteppers,
    mode,
    precision,
    placeholder,
    unitPlaceholder,
    hint,
    labelHidden,
  });
  const pv = extractDurationPartValidation(model.messages, { error, warning });
  const currentUnit = model.value?.unit ?? null;
  const hasFooter = Boolean(cfg.hint || info || warning || error || model.messages?.length);
  const describedBy = hasFooter ? `${id}-message` : undefined;
  const groupLabelledBy = headingId || (!cfg.labelHidden && cfg.label ? `${id}-label` : undefined);
  const targetSize = cfg.size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const rowMaxWidth = cfg.size === 'sm' ? 320 : cfg.size === 'lg' ? 420 : 380;
  const showClear =
    cfg.clearable &&
    !cfg.readOnly &&
    ((model.value?.amount !== null && model.value?.amount !== undefined) || currentUnit !== null);

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
      label={cfg.label}
      labelHidden={cfg.labelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={cfg.layout}
      showMetadata={cfg.showMetadata}
      required={cfg.required}
      readOnly={cfg.readOnly}
      hint={cfg.hint}
      info={info}
      warning={warning}
      error={error}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={i => {
        if (!cfg.readOnly && i.type === 'statusChangeRequested') {
          onIntent({ type: 'statusChangeRequested', status: i.status });
        }
      }}
    >
      <View style={styles.fieldStack}>
        <View
          ref={groupRef}
          role="group"
          aria-labelledby={groupLabelledBy}
          aria-label={cfg.label || undefined}
          style={[styles.durationRow, { maxWidth: rowMaxWidth }]}
        >
          <View style={styles.durationAmount}>
            <NumberInput
              id={id}
              aria-label={`${cfg.label} amount`}
              aria-describedby={describedBy}
              aria-required={cfg.required || undefined}
              aria-readonly={cfg.readOnly || undefined}
              integer={cfg.mode === 'integer'}
              allowNegative={cfg.allowNegative}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              precision={cfg.precision}
              showSteppers={cfg.showSteppers}
              size={cfg.size}
              maxWidth="none"
              placeholder={cfg.placeholder}
              value={model.value?.amount ?? undefined}
              invalid={Boolean(pv.amountError)}
              warning={Boolean(pv.amountWarning)}
              readOnly={cfg.readOnly}
              editable={!cfg.readOnly}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              onSubmitted={onSubmitted}
              onNumber={amount => {
                if (!cfg.readOnly) onIntent({ type: 'amountChangeRequested', amount });
              }}
            />
          </View>
          <View style={styles.durationUnit}>
            <EmrSelect
              controlId={`${id}-unit`}
              label={`${cfg.label} ${cfg.unitLabel}`}
              labelHidden
              placeholder={cfg.unitPlaceholder}
              options={model.unitOptions}
              value={currentUnit}
              size={cfg.size === 'sm' ? 'sm' : 'md'}
              required={cfg.required}
              invalid={Boolean(pv.unitError)}
              warning={pv.unitWarning || undefined}
              readOnly={cfg.readOnly}
              onFocused={handleChildFocus}
              onBlurred={handleChildBlur as unknown as () => void}
              onChange={unit => {
                if (!cfg.readOnly && unit) {
                  onIntent({ type: 'unitChangeRequested', unit: unit as EmrDurationUnit });
                }
              }}
            />
          </View>
          {showClear ? (
            <Pressable
              role="button"
              aria-label={`${labels.clear} ${cfg.label}`}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              onPress={() => {
                if (!cfg.readOnly) {
                  onIntent({ type: 'clearRequested' });
                  onCleared?.();
                }
              }}
              {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : null)}
              style={({ pressed, hovered, focused }: PressState & { hovered?: boolean }) => [
                styles.pairedClearBtn,
                focusRing(t, focused),
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
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 6. EmrRangeField (Low–High numeric, date, time, or datetime range)
// ---------------------------------------------------------------------------

export function EmrRangeField({
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
  showSteppers,
  displayFormat,
  timePrecision,
  hourCycle,
  wireFormat,
  onIntent,
  onFocus,
  onBlur,
  onCleared,
  onSubmitted,
}: {
  model: RangeFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  showSteppers?: boolean;
  displayFormat?: EmrDateTimeDisplayFormat;
  timePrecision?: EmrTimePrecision;
  hourCycle?: EmrTimeHourCycle;
  wireFormat?: EmrDateTimeWireFormat;
  onIntent: (intent: RangeFieldIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onCleared?: () => void;
  onSubmitted?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const groupRef = useRef<ComponentRef<typeof View>>(null);
  const focusedRef = useRef(false);

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedUnit = model.unit ?? resolvedDef?.presentation?.unitDisplay;
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedLayout = layout ?? model.layout ?? 'vertical';
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const resolvedSize = size ?? model.size ?? 'md';
  const targetSize = resolvedSize === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const resolvedClearable = clearable ?? model.clearable ?? true;
  const resolvedShowSteppers = showSteppers ?? model.showSteppers ?? false;
  const resolvedDisplayFormat = displayFormat ?? model.displayFormat ?? labels.dateFormat;
  const resolvedTimePrecision = timePrecision ?? model.timePrecision ?? 'minute';
  const resolvedHourCycle = hourCycle ?? model.hourCycle ?? '24';
  const resolvedWireFormat = wireFormat ?? model.wireFormat ?? 'utc';
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);

  const minCard = resolvedDef?.contract?.cardinality?.min;
  const resolvedRequired = Boolean(model.required || (minCard !== undefined && minCard >= 1));
  const lowRequired = Boolean(model.lowRequired ?? resolvedRequired);
  const highRequired = Boolean(model.highRequired ?? resolvedRequired);

  const lowLabel = model.lowLabel ?? (model.kind === 'number' ? 'Low' : 'From');
  const highLabel = model.highLabel ?? (model.kind === 'number' ? 'High' : 'To');

  const resolvedPrecision = model.precision ?? resolvedDef?.presentation?.precision;
  const resolvedNumericMode = resolveRangeNumericMode(model.numericMode, resolvedPrecision, resolvedDef);
  const resolvedStep = model.step ?? resolvedDef?.presentation?.step;

  const resolvedMessages = resolveRangeFieldMessages(model);
  const sideValidation = resolveRangeSideValidation(resolvedMessages);
  const hasFooter = Boolean(resolvedHint || resolvedMessages.length > 0);
  const describedBy = hasFooter ? `${id}-message` : undefined;
  const groupLabelledBy = headingId || (!labelHidden && resolvedLabel ? `${id}-label` : undefined);

  const low = model.value?.low ?? null;
  const high = model.value?.high ?? null;
  const hasAnyValue =
    (low !== null && low !== undefined && low !== '') ||
    (high !== null && high !== undefined && high !== '');
  const showClear = resolvedClearable && !locked && hasAnyValue;

  const defNumMin = model.kind === 'number' ? resolvedDef?.presentation?.min : undefined;
  const defNumMax = model.kind === 'number' ? resolvedDef?.presentation?.max : undefined;
  const lowNumMin =
    typeof (model.lowMin ?? model.min ?? defNumMin) === 'number'
      ? ((model.lowMin ?? model.min ?? defNumMin) as number)
      : undefined;
  const lowNumMax =
    typeof (model.lowMax ?? model.max ?? defNumMax) === 'number'
      ? ((model.lowMax ?? model.max ?? defNumMax) as number)
      : undefined;
  const highNumMin =
    typeof (model.highMin ?? model.min ?? defNumMin) === 'number'
      ? ((model.highMin ?? model.min ?? defNumMin) as number)
      : undefined;
  const highNumMax =
    typeof (model.highMax ?? model.max ?? defNumMax) === 'number'
      ? ((model.highMax ?? model.max ?? defNumMax) as number)
      : undefined;

  const lowStrMin = typeof (model.lowMin ?? model.min) === 'string' ? ((model.lowMin ?? model.min) as string) : undefined;
  const lowStrMax = typeof (model.lowMax ?? model.max) === 'string' ? ((model.lowMax ?? model.max) as string) : undefined;
  const highStrMin =
    typeof (model.highMin ?? model.min) === 'string' ? ((model.highMin ?? model.min) as string) : undefined;
  const highStrMax =
    typeof (model.highMax ?? model.max) === 'string' ? ((model.highMax ?? model.max) as string) : undefined;

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

  const cellStyle = [
    styles.rangeCell,
    { flexBasis: model.kind === 'datetime' ? 240 : 132 },
  ];

  const renderBound = (params: {
    bound: 'low' | 'high';
    subLabel: string;
    val: number | string | null;
    placeholder: string | undefined;
    numMin: number | undefined;
    numMax: number | undefined;
    strMin: string | undefined;
    strMax: string | undefined;
    sideRequired: boolean;
    sideInvalid: boolean;
    sideWarning: boolean;
  }) => {
    const {
      bound,
      subLabel,
      val,
      placeholder,
      numMin,
      numMax,
      strMin,
      strMax,
      sideRequired,
      sideInvalid,
      sideWarning,
    } = params;
    const emit = (next: number | string | null) => {
      if (locked) return;
      if (bound === 'low') onIntent({ type: 'lowChangeRequested', low: next });
      else onIntent({ type: 'highChangeRequested', high: next });
    };
    const boundId = `${id}-${bound}`;
    const timeMode = resolvedTimePrecision === 'second' ? 'time-seconds' : 'time';
    const strVal = typeof val === 'string' ? val : null;
    const numVal = typeof val === 'number' && Number.isFinite(val) ? val : undefined;

    return (
      <View style={cellStyle}>
        <Text
          style={{
            color: t.textMuted,
            fontSize: t.textXs,
            fontWeight: fontWeight(t.weightMedium),
            fontFamily: fontFamily(t),
          }}
        >
          {subLabel}
          {sideRequired ? (
            <Text style={{ color: t.danger, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}> *</Text>
          ) : null}
        </Text>
        {model.kind === 'date' ? (
          <EmrTypedText
            key={`${bound}-${resolvedDisplayFormat}`}
            id={boundId}
            aria-label={`${resolvedLabel}, ${subLabel}`}
            aria-describedby={describedBy}
            aria-required={sideRequired || undefined}
            aria-readonly={locked || undefined}
            mode={resolvedDisplayFormat}
            placeholder={placeholder ?? resolvedDisplayFormat}
            min={strMin}
            max={strMax}
            size={resolvedSize}
            value={strVal}
            invalid={sideInvalid}
            warning={!sideInvalid && sideWarning}
            readOnly={locked}
            editable={!locked}
            onFocus={handleChildFocus}
            onBlur={handleChildBlur}
            onSubmitEditing={() => {
              if (!locked) onSubmitted?.();
            }}
            onValueChange={emit}
          />
        ) : model.kind === 'time' ? (
          <EmrTypedText
            key={`${bound}-${timeMode}-${resolvedHourCycle}`}
            id={boundId}
            aria-label={`${resolvedLabel}, ${subLabel}`}
            aria-describedby={describedBy}
            aria-required={sideRequired || undefined}
            aria-readonly={locked || undefined}
            mode={timeMode}
            hourCycle={resolvedHourCycle}
            placeholder={placeholder}
            min={strMin}
            max={strMax}
            step={resolvedStep}
            size={resolvedSize}
            clearable={false}
            value={strVal}
            invalid={sideInvalid}
            warning={!sideInvalid && sideWarning}
            readOnly={locked}
            editable={!locked}
            onFocus={handleChildFocus}
            onBlur={handleChildBlur}
            onSubmitEditing={() => {
              if (!locked) onSubmitted?.();
            }}
            onValueChange={emit}
          />
        ) : model.kind === 'datetime' ? (
          <EmrDateTimeText
            id={boundId}
            label={`${resolvedLabel}, ${subLabel}`}
            dateLabel={labels.dateLabel}
            timeLabel={labels.timeLabel}
            ariaDescribedBy={describedBy}
            required={sideRequired}
            format={resolvedDisplayFormat}
            timePrecision={resolvedTimePrecision}
            hourCycle={resolvedHourCycle}
            wireFormat={resolvedWireFormat}
            min={strMin}
            max={strMax}
            size={resolvedSize}
            clearable={false}
            value={strVal}
            invalid={sideInvalid}
            warning={!sideInvalid && sideWarning}
            readOnly={locked}
            editable={!locked}
            onFocus={handleChildFocus}
            onBlur={handleChildBlur}
            onSubmit={() => {
              if (!locked) onSubmitted?.();
            }}
            onValueChange={emit}
          />
        ) : (
          <NumberInput
            id={boundId}
            aria-label={`${resolvedLabel}, ${subLabel}`}
            aria-describedby={describedBy}
            aria-required={sideRequired || undefined}
            aria-readonly={locked || undefined}
            integer={resolvedNumericMode === 'integer'}
            min={numMin}
            max={numMax}
            step={resolvedStep}
            precision={resolvedPrecision}
            showSteppers={resolvedShowSteppers}
            size={resolvedSize}
            maxWidth="none"
            placeholder={placeholder ?? (bound === 'low' ? 'Min' : 'Max')}
            value={numVal}
            invalid={sideInvalid}
            warning={!sideInvalid && sideWarning}
            readOnly={locked}
            editable={!locked}
            onFocus={handleChildFocus}
            onBlur={handleChildBlur}
            onSubmitted={() => {
              if (!locked) onSubmitted?.();
            }}
            onNumber={emit}
          />
        )}
      </View>
    );
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
      messages={resolvedMessages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={i => {
        if (!locked && i.type === 'statusChangeRequested') {
          onIntent({ type: 'statusChangeRequested', status: i.status });
        }
      }}
    >
      <View style={styles.fieldStack}>
        <View
          ref={groupRef}
          role="group"
          aria-labelledby={groupLabelledBy}
          aria-label={resolvedLabel || undefined}
          style={styles.pairedRow}
        >
          {renderBound({
            bound: 'low',
            subLabel: lowLabel,
            val: low,
            placeholder: model.lowPlaceholder,
            numMin: lowNumMin,
            numMax: lowNumMax,
            strMin: lowStrMin,
            strMax: lowStrMax,
            sideRequired: lowRequired,
            sideInvalid: sideValidation.lowInvalid,
            sideWarning: sideValidation.lowWarning,
          })}
          <Text
            aria-hidden
            style={[
              styles.pairedSeparator,
              {
                paddingBottom: resolvedSize === 'lg' ? 12 : 10,
                color: t.textMuted,
                fontSize: t.textLg,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: fontFamily(t),
              },
            ]}
          >
            –
          </Text>
          {renderBound({
            bound: 'high',
            subLabel: highLabel,
            val: high,
            placeholder: model.highPlaceholder,
            numMin: highNumMin,
            numMax: highNumMax,
            strMin: highStrMin,
            strMax: highStrMax,
            sideRequired: highRequired,
            sideInvalid: sideValidation.highInvalid,
            sideWarning: sideValidation.highWarning,
          })}
          {showClear ? (
            <Pressable
              role="button"
              aria-label={`${labels.clear} ${resolvedLabel}`}
              onFocus={handleChildFocus}
              onBlur={handleChildBlur}
              onPress={() => {
                if (!locked) {
                  onIntent({ type: 'clearRequested' });
                  onCleared?.();
                }
              }}
              {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : null)}
              style={({ pressed, hovered, focused }: PressState & { hovered?: boolean }) => [
                styles.pairedClearBtn,
                focusRing(t, focused),
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
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 7. EmrSignatureCaptureField (Cross-platform Web <svg>/<polyline> + Native ink segments)
// ---------------------------------------------------------------------------

interface PadDomNode {
  getBoundingClientRect?: () => { left: number; top: number; width: number; height: number };
}

export function EmrSignatureCaptureField({
  model,
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  onIntent,
  onValueChange,
  onCleared,
  onFocus,
  onBlur,
}: {
  model: SignatureCaptureViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  onIntent: (intent: SignatureCaptureIntent) => void;
  onValueChange?: (strokes: readonly EmrSignatureStroke[]) => void;
  onCleared?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedLabelHidden = Boolean(labelHidden || model.labelHidden);
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedLayout = normalizeFieldFrameLayout(layout ?? model.layout);
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const locked = isSignaturePadLocked({ readOnly: model.readOnly, definition: resolvedDef }, readOnly);
  const resolvedRequired = Boolean(
    model.required ||
      (resolvedDef?.contract?.cardinality?.min !== undefined &&
        resolvedDef.contract.cardinality.min >= 1),
  );
  const geom = resolveSignatureCanvasGeometry(model.width, model.height);
  const penWidth =
    typeof model.penWidth === 'number' && Number.isFinite(model.penWidth) && model.penWidth > 0
      ? model.penWidth
      : 2.25;
  const dotRadius = Number(Math.max(1.25, penWidth * 0.78).toFixed(2));
  const validation = hasSignatureValidationState(model.messages);
  const hasFooterMsg = Boolean(resolvedHint || model.messages?.length);
  const describedBy = hasFooterMsg ? `${id}-message` : undefined;
  const labelledBy =
    headingId || (!resolvedLabelHidden && resolvedLabel ? `${id}-label` : undefined);
  const canUndo = !locked && model.undoable !== false;
  const canClear = !locked && model.clearable !== false;

  const [measuredWidth, setMeasuredWidth] = useState<number>(geom.width);
  const [activePoints, setActivePoints] = useState<EmrSignaturePoint[]>([]);
  const [padFocused, setPadFocused] = useState(false);
  const [padHovered, setPadHovered] = useState(false);
  const activePointsRef = useRef<EmrSignaturePoint[]>([]);
  const padNodeRef = useRef<PadDomNode | null>(null);

  const liveRef = useRef({
    locked,
    canUndo,
    canClear,
    strokes: model.strokes,
    width: geom.width,
    height: geom.height,
    boxWidth: measuredWidth,
    onIntent,
    onValueChange,
    onCleared,
  });
  liveRef.current = {
    locked,
    canUndo,
    canClear,
    strokes: model.strokes,
    width: geom.width,
    height: geom.height,
    boxWidth: measuredWidth,
    onIntent,
    onValueChange,
    onCleared,
  };

  useEffect(() => {
    if (locked && activePointsRef.current.length > 0) {
      activePointsRef.current = [];
      setActivePoints([]);
    }
  }, [locked]);

  const resolvePoint = (nativeEvent: {
    clientX?: number;
    clientY?: number;
    pageX?: number;
    pageY?: number;
    locationX?: number;
    locationY?: number;
  }): EmrSignaturePoint => {
    const { width: vbW, height: vbH, boxWidth } = liveRef.current;
    const node = padNodeRef.current;
    if (node && typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const cx = typeof nativeEvent.clientX === 'number' ? nativeEvent.clientX : nativeEvent.pageX;
      const cy = typeof nativeEvent.clientY === 'number' ? nativeEvent.clientY : nativeEvent.pageY;
      if (typeof cx === 'number' && typeof cy === 'number' && rect.width > 0 && rect.height > 0) {
        return mapPointerToSignaturePoint(cx, cy, rect, vbW, vbH);
      }
    }
    return mapPointerToSignaturePoint(
      nativeEvent.locationX ?? 0,
      nativeEvent.locationY ?? 0,
      { left: 0, top: 0, width: boxWidth, height: vbH },
      vbW,
      vbH,
    );
  };

  const commitActiveStroke = () => {
    const pts = activePointsRef.current;
    activePointsRef.current = [];
    setActivePoints([]);
    if (!liveRef.current.locked && pts.length > 0) {
      const stroke: EmrSignatureStroke = { points: pts };
      liveRef.current.onIntent({ type: 'strokeAdded', stroke });
      liveRef.current.onValueChange?.([...liveRef.current.strokes, stroke]);
    }
  };

  const cancelActiveStroke = () => {
    activePointsRef.current = [];
    setActivePoints([]);
  };

  const handleUndo = () => {
    if (liveRef.current.locked || !liveRef.current.canUndo || liveRef.current.strokes.length === 0) {
      return;
    }
    liveRef.current.onIntent({ type: 'undoRequested' });
    liveRef.current.onValueChange?.(liveRef.current.strokes.slice(0, -1));
  };

  const handleClear = () => {
    if (liveRef.current.locked || !liveRef.current.canClear || liveRef.current.strokes.length === 0) {
      return;
    }
    liveRef.current.onIntent({ type: 'clearRequested' });
    liveRef.current.onValueChange?.([]);
    liveRef.current.onCleared?.();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: e => {
        if (liveRef.current.locked) return false;
        const btn = (e.nativeEvent as unknown as { button?: number }).button;
        return typeof btn === 'number' ? btn === 0 : true;
      },
      onMoveShouldSetPanResponder: () => !liveRef.current.locked,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: e => {
        if (liveRef.current.locked) return;
        const pt = resolvePoint(
          e.nativeEvent as unknown as {
            clientX?: number;
            clientY?: number;
            locationX?: number;
            locationY?: number;
          },
        );
        activePointsRef.current = [pt];
        setActivePoints([pt]);
      },
      onPanResponderMove: e => {
        if (liveRef.current.locked) return;
        const pt = resolvePoint(
          e.nativeEvent as unknown as {
            clientX?: number;
            clientY?: number;
            locationX?: number;
            locationY?: number;
          },
        );
        const prev = activePointsRef.current[activePointsRef.current.length - 1];
        if (prev && prev.x === pt.x && prev.y === pt.y) return;
        const next = [...activePointsRef.current, pt];
        activePointsRef.current = next;
        setActivePoints(next);
      },
      onPanResponderRelease: () => commitActiveStroke(),
      onPanResponderTerminate: () => cancelActiveStroke(),
    }),
  ).current;

  const isEmptyPad = model.strokes.length === 0 && activePoints.length === 0;
  const emptyPrompt =
    model.emptyPrompt?.trim() ||
    (locked ? 'No signature captured' : 'Sign here with stylus, mouse, or finger');
  const attestation = formatSignatureAttestation(model);

  const webPadProps =
    Platform.OS === 'web'
      ? ({
          tabIndex: 0,
          'aria-roledescription': locked ? undefined : 'signature pad',
          'aria-labelledby': labelledBy,
          'aria-label': labelledBy ? undefined : `${resolvedLabel} signature pad`,
          'aria-invalid': validation.hasError || undefined,
          'aria-required': (!locked && resolvedRequired) || undefined,
          'aria-readonly': locked || undefined,
          'aria-describedby': describedBy,
          onFocus: () => {
            setPadFocused(true);
            onFocus?.();
          },
          onBlur: () => {
            setPadFocused(false);
            onBlur?.();
          },
          onMouseEnter: () => setPadHovered(true),
          onMouseLeave: () => setPadHovered(false),
          onKeyDown: (e: {
            key?: string;
            ctrlKey?: boolean;
            metaKey?: boolean;
            shiftKey?: boolean;
            preventDefault?: () => void;
          }) => {
            if (e.key === 'Escape' && activePointsRef.current.length > 0) {
              e.preventDefault?.();
              cancelActiveStroke();
              return;
            }
            if (liveRef.current.locked) return;
            if ((e.key === 'Delete' || e.key === 'Backspace') && liveRef.current.canClear && liveRef.current.strokes.length > 0) {
              e.preventDefault?.();
              handleClear();
              return;
            }
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key?.toLowerCase() === 'z' && liveRef.current.canUndo && liveRef.current.strokes.length > 0) {
              e.preventDefault?.();
              handleUndo();
            }
          },
        } as object)
      : null;

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={resolvedLabelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      required={resolvedRequired}
      readOnly={locked}
      hint={resolvedHint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={i => {
        if (!locked && i.type === 'statusChangeRequested') {
          onIntent({ type: 'statusChangeRequested', status: i.status });
        }
      }}
    >
      <View style={styles.fieldStack}>
        <View
          ref={el => {
            padNodeRef.current = el as unknown as PadDomNode | null;
          }}
          id={id}
          role={locked ? 'img' : 'region'}
          aria-labelledby={labelledBy}
          aria-label={labelledBy ? undefined : `${resolvedLabel} signature pad`}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setMeasuredWidth(w);
          }}
          {...panResponder.panHandlers}
          {...webPadProps}
          style={[
            styles.sigPad,
            focusRing(t, padFocused),
            {
              height: geom.height,
              borderColor: validation.hasError
                ? t.danger
                : validation.hasWarning
                  ? t.warning
                  : padHovered && !locked
                    ? t.focus
                    : t.border,
              borderStyle: locked ? 'dashed' : 'solid',
              backgroundColor: locked ? t.surfaceSoft : t.surface,
            },
          ]}
        >
          {isEmptyPad ? (
            <View pointerEvents="none" style={styles.sigEmptyOverlay}>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t), textAlign: 'center' }}>
                {emptyPrompt}
              </Text>
            </View>
          ) : null}
          {Platform.OS === 'web' ? (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {createElement(
                'svg',
                {
                  width: '100%',
                  height: geom.height,
                  viewBox: `0 0 ${geom.width} ${geom.height}`,
                  preserveAspectRatio: 'xMidYMid meet',
                  'aria-hidden': 'true',
                  style: { display: 'block', width: '100%', height: geom.height },
                },
                createElement('line', {
                  key: 'baseline',
                  x1: geom.baselineInset,
                  y1: geom.baselineY,
                  x2: geom.width - geom.baselineInset,
                  y2: geom.baselineY,
                  stroke: t.border,
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }),
                ...model.strokes.map((stroke, idx) =>
                  stroke.points.length === 1
                    ? createElement('circle', {
                        key: `dot-${idx}`,
                        cx: stroke.points[0]!.x,
                        cy: stroke.points[0]!.y,
                        r: dotRadius,
                        fill: t.text,
                      })
                    : createElement('polyline', {
                        key: `poly-${idx}`,
                        points: signaturePolylinePoints(stroke),
                        fill: 'none',
                        stroke: t.text,
                        strokeWidth: penWidth,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                      }),
                ),
                ...(activePoints.length === 1
                  ? [
                      createElement('circle', {
                        key: 'active-dot',
                        cx: activePoints[0]!.x,
                        cy: activePoints[0]!.y,
                        r: dotRadius,
                        fill: t.primary,
                      }),
                    ]
                  : activePoints.length > 1
                    ? [
                        createElement('polyline', {
                          key: 'active-poly',
                          points: signaturePolylinePoints({ points: activePoints }),
                          fill: 'none',
                          stroke: t.primary,
                          strokeWidth: penWidth,
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                        }),
                      ]
                    : []),
              )}
            </View>
          ) : (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <View
                pointerEvents="none"
                style={[
                  styles.sigBaseline,
                  {
                    bottom: Math.max(8, geom.height - geom.baselineY),
                    borderBottomColor: t.border,
                  },
                ]}
              />
              {model.strokes.map((rawStroke, idx) => {
                const stroke = projectSignatureStrokeForBox(
                  rawStroke,
                  measuredWidth,
                  geom.height,
                  geom.width,
                  geom.height,
                );
                return stroke.points.length === 1 ? (
                  <View
                    key={`ndot-${idx}`}
                    style={{
                      position: 'absolute',
                      left: stroke.points[0]!.x - dotRadius,
                      top: stroke.points[0]!.y - dotRadius,
                      width: dotRadius * 2,
                      height: dotRadius * 2,
                      borderRadius: dotRadius,
                      backgroundColor: t.text,
                    }}
                  />
                ) : (
                  computeSignatureSegments(stroke, idx).map(seg => (
                    <View
                      key={seg.key}
                      style={{
                        position: 'absolute',
                        left: seg.cx - seg.length / 2,
                        top: seg.cy - penWidth / 2,
                        width: seg.length,
                        height: penWidth,
                        borderRadius: penWidth / 2,
                        backgroundColor: t.text,
                        transform: [{ rotate: `${seg.angleDeg}deg` }],
                      }}
                    />
                  ))
                );
              })}
              {activePoints.length > 0
                ? (() => {
                    const activeStroke = projectSignatureStrokeForBox(
                      { points: activePoints },
                      measuredWidth,
                      geom.height,
                      geom.width,
                      geom.height,
                    );
                    return activeStroke.points.length === 1 ? (
                      <View
                        key="active-ndot"
                        style={{
                          position: 'absolute',
                          left: activeStroke.points[0]!.x - dotRadius,
                          top: activeStroke.points[0]!.y - dotRadius,
                          width: dotRadius * 2,
                          height: dotRadius * 2,
                          borderRadius: dotRadius,
                          backgroundColor: t.primary,
                        }}
                      />
                    ) : (
                      computeSignatureSegments(activeStroke, model.strokes.length).map(seg => (
                        <View
                          key={`active-${seg.key}`}
                          style={{
                            position: 'absolute',
                            left: seg.cx - seg.length / 2,
                            top: seg.cy - penWidth / 2,
                            width: seg.length,
                            height: penWidth,
                            borderRadius: penWidth / 2,
                            backgroundColor: t.primary,
                            transform: [{ rotate: `${seg.angleDeg}deg` }],
                          }}
                        />
                      ))
                    );
                  })()
                : null}
            </View>
          )}
        </View>
        <View style={styles.sigFooter}>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t), flexShrink: 1 }}>
            {attestation}
          </Text>
          {!locked && (canUndo || canClear) ? (
            <View
              style={styles.inlineActions}
              {...(Platform.OS === 'web' ? ({ 'data-emr-print': 'hide' } as object) : null)}
            >
              {canUndo ? (
                <EmrButton
                  small
                  variant="outline"
                  disabled={model.strokes.length === 0}
                  accessibilityLabel={`Undo last stroke on ${resolvedLabel}`}
                  onPress={handleUndo}
                >
                  <SvgIcon
                    name="undo"
                    size={14}
                    color={model.strokes.length === 0 ? t.textMuted : t.text}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: model.strokes.length === 0 ? t.textMuted : t.text,
                      fontSize: t.textSm,
                      fontWeight: fontWeight(650),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    Undo
                  </Text>
                </EmrButton>
              ) : null}
              {canClear ? (
                <EmrButton
                  small
                  variant="outline"
                  disabled={model.strokes.length === 0}
                  accessibilityLabel={`${labels.clear} ${resolvedLabel}`}
                  onPress={handleClear}
                >
                  <SvgIcon
                    name="trash"
                    size={14}
                    color={model.strokes.length === 0 ? t.textMuted : t.text}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: model.strokes.length === 0 ? t.textMuted : t.text,
                      fontSize: t.textSm,
                      fontWeight: fontWeight(650),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {labels.clear}
                  </Text>
                </EmrButton>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </EmrFieldFrame>
  );
}

// ---------------------------------------------------------------------------
// 8. EmrImageField (L2 clinical image upload, viewer & cropper + status)
// ---------------------------------------------------------------------------

export function EmrImageField({
  model,
  definition,
  controlId,
  headingId,
  labelHidden = false,
  layout,
  showMetadata = true,
  readOnly = false,
  onIntent,
  onNativeFilesSelected,
  onFocus,
  onBlur,
}: {
  model: ImageFieldViewModel;
  definition?: EmrFieldDefinition;
  controlId?: string;
  headingId?: string;
  labelHidden?: boolean;
  layout?: FieldFrameLayout;
  showMetadata?: boolean;
  readOnly?: boolean;
  onIntent?: (intent: ImageFieldIntent) => void;
  onNativeFilesSelected?: (files: readonly File[]) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const generatedId = useId();
  const id = controlId ?? generatedId;

  const resolvedDef = definition ?? model.definition;
  const resolvedLabel = model.label || resolvedDef?.presentation?.label || '';
  const resolvedLabelHidden = Boolean(labelHidden || model.labelHidden);
  const resolvedHint = model.hint ?? resolvedDef?.presentation?.hint;
  const resolvedLayout = normalizeFieldFrameLayout(layout ?? model.layout);
  const resolvedShowMetadata = showMetadata && model.showMetadata !== false;
  const locked = Boolean(readOnly || model.readOnly || resolvedDef?.contract?.readOnly);
  const resolvedRequired = Boolean(
    model.required ||
      (resolvedDef?.contract?.cardinality?.min !== undefined &&
        resolvedDef.contract.cardinality.min >= 1),
  );
  const maxCard = resolvedDef?.contract?.cardinality?.max;
  const resolvedMultiple =
    model.multiple !== undefined ? model.multiple : maxCard === undefined || maxCard !== 1;
  const hasError = Boolean(model.messages?.some((m) => m.severity === 'error'));

  return (
    <EmrFieldFrame
      label={resolvedLabel}
      labelHidden={resolvedLabelHidden}
      labelNamesControl={false}
      controlId={id}
      layout={resolvedLayout}
      showMetadata={resolvedShowMetadata}
      required={resolvedRequired}
      readOnly={locked}
      hint={resolvedHint}
      messages={model.messages}
      assessmentStatus={model.status}
      assessmentStatusOptions={model.statusOptions}
      onIntent={(i) => {
        if (!locked && i.type === 'statusChangeRequested') {
          onIntent?.({ type: 'statusChangeRequested', status: i.status });
        }
      }}
    >
      <View
        nativeID={id}
        style={styles.fieldStack}
        {...(Platform.OS === 'web'
          ? ({
              'aria-labelledby': headingId || undefined,
            } as Record<string, unknown>)
          : null)}
      >
        <EmrImageUpload
          controlId={`${id}-upload`}
          label={resolvedLabel}
          labelHidden
          items={model.items}
          accept={model.accept ?? 'image/*'}
          multiple={resolvedMultiple}
          maxFiles={model.maxFiles}
          maxSizeBytes={model.maxSizeBytes}
          allowCamera={Boolean(model.allowCamera)}
          aspectPresets={model.aspectPresets}
          required={resolvedRequired}
          readOnly={locked}
          invalid={hasError}
          onFocus={onFocus}
          onBlur={onBlur}
          onFilesSelected={(files) => {
            if (!locked) onIntent?.({ type: 'filesSelected', files });
          }}
          onNativeFilesSelected={(files) => {
            if (!locked) onNativeFilesSelected?.(files);
          }}
          onItemsChange={(items) => {
            if (!locked) onIntent?.({ type: 'itemsChangeRequested', items });
          }}
          onImageCropped={(itemId, result) => {
            if (!locked) onIntent?.({ type: 'imageCropped', id: itemId, result });
          }}
          onCaptionChange={(itemId, caption) => {
            if (!locked) onIntent?.({ type: 'captionChangeRequested', id: itemId, caption });
          }}
          onRemoveRequested={(itemId) => {
            if (!locked) onIntent?.({ type: 'itemRemoveRequested', id: itemId });
          }}
          onCameraRequested={() => {
            if (!locked) onIntent?.({ type: 'captureRequested', mode: 'camera' });
          }}
        />
      </View>
    </EmrFieldFrame>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  fieldStack: { gap: 8, minWidth: 0 },
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  attachmentList: { gap: 6 },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  attachmentBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  attachmentRemove: {
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  pairedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 8,
  },
  pairedHalf: {
    flex: 1,
    minWidth: 88,
    gap: 4,
  },
  rangeCell: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    gap: 4,
  },
  pairedSeparator: {
    paddingBottom: 10,
  },
  pairedUnit: {
    paddingBottom: 12,
  },
  pairedClearBtn: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    maxWidth: 380,
  },
  durationAmount: {
    flex: 1,
    minWidth: 148,
  },
  durationUnit: {
    minWidth: 132,
  },
  sigPad: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  sigBaseline: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  sigEmptyOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sigFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
