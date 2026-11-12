'use client';

import { createElement, useEffect, useId, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  AttachmentFieldIntent,
  AttachmentFieldViewModel,
  DurationFieldIntent,
  DurationFieldViewModel,
  EmrAttachmentRef,
  EmrDurationUnit,
  EmrDurationValue,
  EmrPairedFieldValue,
  EmrPartialDate,
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
  RangeFieldViewModel,
  ScaleFieldIntent,
  ScaleFieldViewModel,
  SignatureCaptureIntent,
  SignatureCaptureViewModel,
} from '@drguptavivek/emr-controller';
import { EmrTypedText, NumberInput, ThemedInput } from './inputs-core';
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
  formatByteSize,
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
  EmrPairedFieldValue,
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
  RangeFieldViewModel,
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
  controlId,
  onIntent,
}: {
  model: ScaleFieldViewModel;
  controlId?: string;
  onIntent: (intent: ScaleFieldIntent) => void;
}) {
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const anchors = buildScaleAnchors(model.min, model.max, model.anchors);
  const resolvedTone = (model.value !== null ? model.optionTones?.[model.value] : undefined) ?? model.tone;

  return (
    <EmrFieldFrame
      label={model.label}
      labelHidden
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View nativeID={id} style={styles.fieldStack}>
        {model.variant === 'vas' ? (
          <EmrVas
            label={model.label}
            min={model.min}
            max={model.max}
            step={model.step}
            majorInterval={model.majorInterval}
            minorInterval={model.minorInterval}
            orientation={model.orientation}
            anchors={anchors}
            value={model.value}
            tone={resolvedTone}
            required={model.required}
            readOnly={model.readOnly}
            onValueChange={v => onIntent({ type: 'valueChangeRequested', value: v })}
          />
        ) : (
          <EmrLikert
            label={model.label}
            min={model.min}
            max={model.max}
            anchors={anchors}
            value={model.value}
            tone={resolvedTone}
            required={model.required}
            readOnly={model.readOnly}
            onValueChange={v => onIntent({ type: 'valueChangeRequested', value: v })}
          />
        )}
        {model.value !== null && !model.readOnly ? (
          <View style={styles.inlineActions}>
            <EmrButton
              small
              variant="ghost"
              label={labels.clear}
              accessibilityLabel={`${labels.clear} ${model.label}`}
              onPress={() => onIntent({ type: 'valueChangeRequested', value: null })}
            />
          </View>
        ) : null}
        <AssessmentStatusStrip
          fieldLabel={model.label}
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
// 2. EmrPartialDateField (Year / Year-Month / Full-Date + status)
// ---------------------------------------------------------------------------

const PARTIAL_PRECISION_OPTIONS = [
  { value: 'day', label: 'Full date' },
  { value: 'month', label: 'Month & year' },
  { value: 'year', label: 'Year only' },
] as const;

export function EmrPartialDateField({
  model,
  controlId,
  onIntent,
}: {
  model: PartialDateFieldViewModel;
  controlId?: string;
  onIntent: (intent: PartialDateFieldIntent) => void;
}) {
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const [draftPrecision, setDraftPrecision] = useState<EmrPartialDate['precision']>(model.value?.precision ?? 'day');

  useEffect(() => {
    if (model.value?.precision) {
      setDraftPrecision(model.value.precision);
    }
  }, [model.value?.precision]);

  const activePrecision = model.value?.precision ?? draftPrecision;
  const format = resolveDateFormat(labels.dateFormat, activePrecision);
  const invalid = hasErrorMessage(model.messages);

  const handlePrecisionChange = (nextRaw: string | null) => {
    if (!nextRaw) return;
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
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={styles.fieldStack}>
        <EmrSegmentedControl
          ariaLabel={`${model.label} precision`}
          options={PARTIAL_PRECISION_OPTIONS}
          value={activePrecision}
          readOnly={model.readOnly}
          onValueChange={handlePrecisionChange}
        />
        <EmrTypedText
          key={format}
          id={id}
          aria-labelledby={`${id}-label`}
          aria-label={model.label}
          mode={format}
          placeholder={format}
          min={model.min}
          max={model.max}
          value={model.value?.value ?? null}
          invalid={invalid}
          readOnly={Boolean(model.readOnly)}
          editable={!model.readOnly}
          onValueChange={iso =>
            onIntent({
              type: 'valueChangeRequested',
              value: iso ? { value: iso, precision: activePrecision } : null,
            })
          }
        />
        <AssessmentStatusStrip
          fieldLabel={model.label}
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
// 3. EmrAttachmentField (File / Camera / Scanner attachment refs + status)
// ---------------------------------------------------------------------------

export function EmrAttachmentField({
  model,
  controlId,
  onIntent,
  onNativeFilesSelected,
}: {
  model: AttachmentFieldViewModel;
  controlId?: string;
  onIntent: (intent: AttachmentFieldIntent) => void;
  onNativeFilesSelected?: (files: readonly File[]) => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const atCapacity = model.maxItems !== undefined && model.items.length >= model.maxItems;
  const invalid = hasErrorMessage(model.messages);

  return (
    <EmrFieldFrame
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={styles.fieldStack}>
        {model.items.length > 0 ? (
          <View role="list" aria-label={`${model.label} attachments`} style={styles.attachmentList}>
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
                    aria-label={item.title}
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
                        numberOfLines={1}
                        style={{
                          color: t.text,
                          fontSize: t.textSm,
                          fontWeight: fontWeight(t.weightBold),
                          fontFamily: fontFamily(t),
                        }}
                      >
                        {item.title}
                      </Text>
                      {metaParts.length > 0 ? (
                        <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: fontFamily(t) }}>
                          {metaParts.join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                    {item.statusBadge ? <EmrBadgeView badge={item.statusBadge} /> : null}
                  </Pressable>
                  {!model.readOnly ? (
                    <Pressable
                      role="button"
                      aria-label={`Remove ${item.title}`}
                      onPress={() => onIntent({ type: 'itemRemoveRequested', id: item.id })}
                      style={({ pressed, focused }: PressState) => [
                        styles.attachmentRemove,
                        focusRing(t, focused),
                        {
                          minWidth: 44,
                          minHeight: Math.max(44, t.controlHeight),
                          borderLeftColor: t.border,
                          backgroundColor: pressed ? t.dangerSoft : 'transparent',
                        },
                      ]}
                    >
                      <SvgIcon name="close" size={16} color={t.danger} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : model.readOnly && !model.status ? (
          <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>No attachments recorded</Text>
        ) : null}

        {!model.readOnly ? (
          <View style={styles.captureRow}>
            <View style={styles.flex}>
              <EmrFileTrigger
                controlId={id}
                accept={model.accept}
                multiple={model.multiple}
                disabled={atCapacity}
                error={invalid ? undefined : undefined}
                dropHint={
                  model.maxItems !== undefined
                    ? `${model.items.length} / ${model.maxItems} attached`
                    : 'Drag & drop or choose file'
                }
                onFilesSelected={files => onIntent({ type: 'filesSelected', files })}
                onNativeFilesSelected={onNativeFilesSelected}
              />
            </View>
            {model.allowCamera ? (
              <View style={styles.inlineActions}>
                <EmrButton
                  variant="outline"
                  disabled={atCapacity}
                  accessibilityLabel={`Capture photo for ${model.label}`}
                  onPress={() => onIntent({ type: 'captureRequested', mode: 'camera' })}
                >
                  <SvgIcon name="camera" size={16} color={t.primary} />
                  <Text style={{ color: t.primary, fontSize: t.textSm, fontWeight: fontWeight(650), fontFamily: fontFamily(t) }}>
                    Camera
                  </Text>
                </EmrButton>
                <EmrButton
                  variant="outline"
                  label="Scanner"
                  disabled={atCapacity}
                  accessibilityLabel={`Scan document for ${model.label}`}
                  onPress={() => onIntent({ type: 'captureRequested', mode: 'scanner' })}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <AssessmentStatusStrip
          fieldLabel={model.label}
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
// 4. EmrPairedField (BP Systolic/Diastolic, C/D ratio, OD/OS paired entry)
// ---------------------------------------------------------------------------

export function EmrPairedField({
  model,
  controlId,
  onIntent,
}: {
  model: PairedFieldViewModel;
  controlId?: string;
  onIntent: (intent: PairedFieldIntent) => void;
}) {
  const t = useEmrTheme();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const mode = model.mode ?? 'text';
  const isNumeric = mode === 'decimal' || mode === 'integer';
  const invalid = hasErrorMessage(model.messages);
  const firstVal = model.value?.first ?? null;
  const secondVal = model.value?.second ?? null;

  const renderSide = (
    sideKey: 'first' | 'second',
    sideLabel: string,
    sidePlaceholder: string | undefined,
    val: string | number | null,
    emit: (next: string | number | null) => void,
  ) => (
    <View style={styles.pairedHalf}>
      <Text
        style={{
          color: t.textMuted,
          fontSize: t.textXs,
          fontWeight: fontWeight(t.weightBold),
          fontFamily: fontFamily(t),
        }}
      >
        {sideLabel}
      </Text>
      {isNumeric ? (
        <NumberInput
          id={`${id}-${sideKey}`}
          aria-label={`${model.label}, ${sideLabel}`}
          integer={mode === 'integer'}
          min={model.min}
          max={model.max}
          step={model.step}
          placeholder={sidePlaceholder}
          value={typeof val === 'number' ? val : val != null && val !== '' ? Number(val) : undefined}
          invalid={invalid}
          readOnly={Boolean(model.readOnly)}
          editable={!model.readOnly}
          onNumber={n => emit(n)}
        />
      ) : (
        <ThemedInput
          id={`${id}-${sideKey}`}
          aria-label={`${model.label}, ${sideLabel}`}
          placeholder={sidePlaceholder}
          value={val == null ? '' : String(val)}
          invalid={invalid}
          readOnly={Boolean(model.readOnly)}
          editable={!model.readOnly}
          onChangeText={txt => emit(txt === '' ? null : txt)}
        />
      )}
    </View>
  );

  return (
    <EmrFieldFrame
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={styles.fieldStack}>
        <View role="group" aria-labelledby={`${id}-label`} aria-label={model.label} style={styles.pairedRow}>
          {renderSide('first', model.firstLabel, model.firstPlaceholder, firstVal, next =>
            onIntent({ type: 'firstChangeRequested', value: next }),
          )}
          <Text
            aria-hidden
            style={[
              styles.pairedSeparator,
              { color: t.textMuted, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) },
            ]}
          >
            {model.separator ?? '/'}
          </Text>
          {renderSide('second', model.secondLabel, model.secondPlaceholder, secondVal, next =>
            onIntent({ type: 'secondChangeRequested', value: next }),
          )}
          {model.unit ? (
            <Text
              style={[
                styles.pairedUnit,
                { color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) },
              ]}
            >
              {model.unit}
            </Text>
          ) : null}
        </View>
        <AssessmentStatusStrip
          fieldLabel={model.label}
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
// 5. EmrDurationInput (Amount + UCUM calendar/time unit)
// ---------------------------------------------------------------------------

export function EmrDurationInput({
  model,
  controlId,
  onIntent,
}: {
  model: DurationFieldViewModel;
  controlId?: string;
  onIntent: (intent: DurationFieldIntent) => void;
}) {
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const invalid = hasErrorMessage(model.messages);
  const step = model.step ?? 1;
  const currentUnit = model.value?.unit ?? model.unitOptions[0]?.value ?? null;

  return (
    <EmrFieldFrame
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View style={styles.fieldStack}>
        <View style={styles.durationRow}>
          <View style={styles.durationAmount}>
            <NumberInput
              id={id}
              aria-labelledby={`${id}-label`}
              aria-label={`${model.label} amount`}
              integer={Number.isInteger(step)}
              min={model.min ?? 0}
              max={model.max}
              step={step}
              value={model.value?.amount ?? undefined}
              invalid={invalid}
              readOnly={Boolean(model.readOnly)}
              editable={!model.readOnly}
              onNumber={amount => onIntent({ type: 'amountChangeRequested', amount })}
            />
          </View>
          <View style={styles.durationUnit}>
            <EmrSelect
              label={`${model.label} unit`}
              options={model.unitOptions}
              value={currentUnit}
              invalid={invalid}
              readOnly={model.readOnly}
              onChange={unit => {
                if (unit) onIntent({ type: 'unitChangeRequested', unit: unit as EmrDurationUnit });
              }}
            />
          </View>
        </View>
        <AssessmentStatusStrip
          fieldLabel={model.label}
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
// 6. EmrRangeField (Low–High numeric or date range)
// ---------------------------------------------------------------------------

export function EmrRangeField({
  model,
  controlId,
  onIntent,
}: {
  model: RangeFieldViewModel;
  controlId?: string;
  onIntent: (intent: RangeFieldIntent) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const invalid = hasErrorMessage(model.messages);
  const low = model.value?.low ?? null;
  const high = model.value?.high ?? null;

  const numMin = typeof model.min === 'number' ? model.min : undefined;
  const numMax = typeof model.max === 'number' ? model.max : undefined;
  const dateMin = typeof model.min === 'string' ? model.min : undefined;
  const dateMax = typeof model.max === 'string' ? model.max : undefined;

  return (
    <EmrFieldFrame
      label={model.label}
      controlId={id}
      required={model.required}
      hint={model.hint}
      messages={model.messages}
    >
      <View role="group" aria-labelledby={`${id}-label`} aria-label={model.label} style={styles.pairedRow}>
        <View style={styles.pairedHalf}>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
            Low
          </Text>
          {model.kind === 'date' ? (
            <EmrTypedText
              key={`low-${labels.dateFormat}`}
              id={`${id}-low`}
              aria-label={`${model.label}, low`}
              mode={labels.dateFormat}
              placeholder={model.lowPlaceholder ?? labels.dateFormat}
              min={dateMin}
              max={typeof high === 'string' && high ? high : dateMax}
              value={typeof low === 'string' ? low : null}
              invalid={invalid}
              readOnly={Boolean(model.readOnly)}
              editable={!model.readOnly}
              onValueChange={iso => onIntent({ type: 'lowChangeRequested', low: iso })}
            />
          ) : (
            <NumberInput
              id={`${id}-low`}
              aria-label={`${model.label}, low`}
              integer={Number.isInteger(model.step ?? 0.01) && model.step !== undefined}
              min={numMin}
              max={typeof high === 'number' ? high : numMax}
              step={model.step}
              placeholder={model.lowPlaceholder}
              value={typeof low === 'number' ? low : undefined}
              invalid={invalid}
              readOnly={Boolean(model.readOnly)}
              editable={!model.readOnly}
              onNumber={n => onIntent({ type: 'lowChangeRequested', low: n })}
            />
          )}
        </View>
        <Text
          aria-hidden
          style={[
            styles.pairedSeparator,
            { color: t.textMuted, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) },
          ]}
        >
          –
        </Text>
        <View style={styles.pairedHalf}>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
            High
          </Text>
          {model.kind === 'date' ? (
            <EmrTypedText
              key={`high-${labels.dateFormat}`}
              id={`${id}-high`}
              aria-label={`${model.label}, high`}
              mode={labels.dateFormat}
              placeholder={model.highPlaceholder ?? labels.dateFormat}
              min={typeof low === 'string' && low ? low : dateMin}
              max={dateMax}
              value={typeof high === 'string' ? high : null}
              invalid={invalid}
              readOnly={Boolean(model.readOnly)}
              editable={!model.readOnly}
              onValueChange={iso => onIntent({ type: 'highChangeRequested', high: iso })}
            />
          ) : (
            <NumberInput
              id={`${id}-high`}
              aria-label={`${model.label}, high`}
              integer={Number.isInteger(model.step ?? 0.01) && model.step !== undefined}
              min={typeof low === 'number' ? low : numMin}
              max={numMax}
              step={model.step}
              placeholder={model.highPlaceholder}
              value={typeof high === 'number' ? high : undefined}
              invalid={invalid}
              readOnly={Boolean(model.readOnly)}
              editable={!model.readOnly}
              onNumber={n => onIntent({ type: 'highChangeRequested', high: n })}
            />
          )}
        </View>
        {model.unit ? (
          <Text
            style={[
              styles.pairedUnit,
              { color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) },
            ]}
          >
            {model.unit}
          </Text>
        ) : null}
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
  controlId,
  onIntent,
}: {
  model: SignatureCaptureViewModel;
  controlId?: string;
  onIntent: (intent: SignatureCaptureIntent) => void;
}) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const padHeight = model.height ?? 160;
  const [measuredWidth, setMeasuredWidth] = useState<number>(model.width ?? 360);
  const [activePoints, setActivePoints] = useState<EmrSignaturePoint[]>([]);
  const activePointsRef = useRef<EmrSignaturePoint[]>([]);
  const padNodeRef = useRef<PadDomNode | null>(null);
  const invalid = hasErrorMessage(model.messages);

  const liveRef = useRef({
    readOnly: Boolean(model.readOnly),
    width: measuredWidth,
    height: padHeight,
    onIntent,
  });
  liveRef.current = {
    readOnly: Boolean(model.readOnly),
    width: measuredWidth,
    height: padHeight,
    onIntent,
  };

  useEffect(() => {
    if (model.readOnly && activePointsRef.current.length > 0) {
      activePointsRef.current = [];
      setActivePoints([]);
    }
  }, [model.readOnly]);

  const resolvePoint = (nativeEvent: {
    clientX?: number;
    clientY?: number;
    pageX?: number;
    pageY?: number;
    locationX?: number;
    locationY?: number;
  }): EmrSignaturePoint => {
    const { width, height } = liveRef.current;
    const node = padNodeRef.current;
    let rawX = nativeEvent.locationX ?? 0;
    let rawY = nativeEvent.locationY ?? 0;
    if (node && typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      const cx = typeof nativeEvent.clientX === 'number' ? nativeEvent.clientX : nativeEvent.pageX;
      const cy = typeof nativeEvent.clientY === 'number' ? nativeEvent.clientY : nativeEvent.pageY;
      if (typeof cx === 'number' && typeof cy === 'number' && rect.width > 0 && rect.height > 0) {
        rawX = cx - rect.left;
        rawY = cy - rect.top;
      }
    }
    return {
      x: Math.max(0, Math.min(width, Number(rawX.toFixed(1)))),
      y: Math.max(0, Math.min(height, Number(rawY.toFixed(1)))),
    };
  };

  const commitActiveStroke = () => {
    const pts = activePointsRef.current;
    activePointsRef.current = [];
    setActivePoints([]);
    if (!liveRef.current.readOnly && pts.length > 0) {
      liveRef.current.onIntent({ type: 'strokeAdded', stroke: { points: pts } });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !liveRef.current.readOnly,
      onMoveShouldSetPanResponder: () => !liveRef.current.readOnly,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: e => {
        if (liveRef.current.readOnly) return;
        const pt = resolvePoint(e.nativeEvent as unknown as { clientX?: number; clientY?: number; locationX?: number; locationY?: number });
        activePointsRef.current = [pt];
        setActivePoints([pt]);
      },
      onPanResponderMove: e => {
        if (liveRef.current.readOnly) return;
        const pt = resolvePoint(e.nativeEvent as unknown as { clientX?: number; clientY?: number; locationX?: number; locationY?: number });
        const prev = activePointsRef.current[activePointsRef.current.length - 1];
        if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) < 1.5) return;
        const next = [...activePointsRef.current, pt];
        activePointsRef.current = next;
        setActivePoints(next);
      },
      onPanResponderRelease: () => commitActiveStroke(),
      onPanResponderTerminate: () => commitActiveStroke(),
    }),
  ).current;

  const allStrokes: readonly EmrSignatureStroke[] =
    activePoints.length > 0 ? [...model.strokes, { points: activePoints }] : model.strokes;
  const attribution = [model.signatoryName, model.signatoryRole, model.signedAt].filter(Boolean).join(' · ');

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
          ref={el => {
            padNodeRef.current = el as unknown as PadDomNode | null;
          }}
          id={id}
          role="application"
          aria-label={`${model.label} signature pad`}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setMeasuredWidth(w);
          }}
          {...panResponder.panHandlers}
          style={[
            styles.sigPad,
            {
              height: padHeight,
              maxWidth: model.width,
              borderColor: invalid ? t.danger : t.border,
              backgroundColor: model.readOnly ? t.surfaceSoft : t.surface,
            },
          ]}
        >
          <View
            pointerEvents="none"
            style={[styles.sigBaseline, { borderBottomColor: t.border }]}
          />
          {allStrokes.length === 0 ? (
            <View pointerEvents="none" style={styles.sigEmptyOverlay}>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
                {model.readOnly ? 'No signature captured' : 'Sign here with stylus, mouse, or finger'}
              </Text>
            </View>
          ) : null}
          {Platform.OS === 'web' ? (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {createElement(
                'svg',
                {
                  width: '100%',
                  height: '100%',
                  viewBox: `0 0 ${Math.max(1, measuredWidth)} ${padHeight}`,
                  preserveAspectRatio: 'none',
                  'aria-hidden': 'true',
                  style: { display: 'block', width: '100%', height: '100%' },
                },
                ...allStrokes.map((stroke, idx) =>
                  stroke.points.length === 1
                    ? createElement('circle', {
                        key: `dot-${idx}`,
                        cx: stroke.points[0]!.x,
                        cy: stroke.points[0]!.y,
                        r: 1.75,
                        fill: t.text,
                      })
                    : createElement('polyline', {
                        key: `poly-${idx}`,
                        points: signaturePolylinePoints(stroke),
                        fill: 'none',
                        stroke: t.text,
                        strokeWidth: 2.25,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                      }),
                ),
              )}
            </View>
          ) : (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {allStrokes.map((stroke, idx) =>
                stroke.points.length === 1 ? (
                  <View
                    key={`ndot-${idx}`}
                    style={{
                      position: 'absolute',
                      left: stroke.points[0]!.x - 2,
                      top: stroke.points[0]!.y - 2,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
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
                        top: seg.cy - 1.25,
                        width: seg.length,
                        height: 2.5,
                        borderRadius: 1.25,
                        backgroundColor: t.text,
                        transform: [{ rotate: `${seg.angleDeg}deg` }],
                      }}
                    />
                  ))
                ),
              )}
            </View>
          )}
        </View>
        <View style={styles.sigFooter}>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t), flexShrink: 1 }}>
            {attribution || (model.strokes.length > 0 ? `${model.strokes.length} stroke(s) recorded` : 'Unsigned')}
          </Text>
          {!model.readOnly && model.strokes.length > 0 ? (
            <EmrButton
              small
              variant="outline"
              label={labels.clear}
              accessibilityLabel={`${labels.clear} ${model.label}`}
              onPress={() => onIntent({ type: 'clearRequested' })}
            />
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
  controlId,
  disabled,
  onIntent,
  onNativeFilesSelected,
}: {
  model: ImageFieldViewModel;
  controlId?: string;
  disabled?: boolean;
  onIntent?: (intent: ImageFieldIntent) => void;
  onNativeFilesSelected?: (files: readonly File[]) => void;
}) {
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
      <View nativeID={id} style={styles.fieldStack}>
        <EmrImageUpload
          controlId={`${id}-upload`}
          items={model.items}
          multiple={model.multiple ?? true}
          maxFiles={model.maxFiles}
          maxSizeBytes={model.maxSizeBytes}
          allowCamera={model.allowCamera ?? true}
          aspectPresets={model.aspectPresets}
          disabled={disabled}
          readOnly={model.readOnly}
          onFilesSelected={files => onIntent?.({ type: 'filesSelected', files })}
          onNativeFilesSelected={onNativeFilesSelected}
          onItemsChange={items => onIntent?.({ type: 'itemsChangeRequested', items })}
          onImageCropped={(itemId, result) =>
            onIntent?.({ type: 'imageCropped', id: itemId, result })
          }
          onCaptionChange={(itemId, caption) =>
            onIntent?.({ type: 'captionChangeRequested', id: itemId, caption })
          }
          onRemoveRequested={itemId =>
            onIntent?.({ type: 'itemRemoveRequested', id: itemId })
          }
          onCameraRequested={() =>
            onIntent?.({ type: 'captureRequested', mode: 'camera' })
          }
        />
        <AssessmentStatusStrip
          fieldLabel={model.label}
          status={model.status}
          statusOptions={model.statusOptions}
          readOnly={model.readOnly || disabled}
          onStatusChange={status => onIntent?.({ type: 'statusChangeRequested', status })}
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
    minWidth: 132,
    gap: 4,
  },
  pairedSeparator: {
    paddingBottom: 10,
  },
  pairedUnit: {
    paddingBottom: 12,
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
