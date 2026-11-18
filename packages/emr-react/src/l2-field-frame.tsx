'use client';

import { useId, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  mergeFieldFrameMessages,
  normalizeFieldFrameLayout,
  type ClinicalAssessmentStatus,
  type ClinicalAssessmentStatusOption,
  type ClinicalFieldDefinition,
  type ClinicalFieldState,
  type EmrValidationMessage,
  type FieldFrameIntent,
  type FieldFrameLayout,
} from '@drguptavivek/emr-controller';
import { FieldChrome } from './l1-field-chrome';
import { useEmrLabels } from './labels';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow } from './primitives';

/**
 * L2 field frame: wraps L1 `FieldChrome` and accepts structured `EmrValidationMessage[]`,
 * `definition`/`model`, `unit`, `note`, `layout`, and six-state `ClinicalAssessmentStatus`.
 */
export function EmrFieldFrame({
  label,
  labelHidden,
  labelNamesControl,
  controlId: controlIdProp,
  definition,
  model,
  required,
  unit,
  note,
  showMetadata = true,
  readOnly,
  layout,
  assessmentStatus,
  assessmentStatusOptions,
  hint,
  info,
  warning,
  error,
  messages,
  onIntent,
  children,
}: {
  label?: string;
  labelNamesControl?: boolean;
  labelHidden?: boolean;
  controlId?: string;
  definition?: ClinicalFieldDefinition;
  model?: ClinicalFieldState;
  required?: boolean;
  unit?: string;
  note?: string;
  showMetadata?: boolean;
  readOnly?: boolean;
  layout?: FieldFrameLayout;
  assessmentStatus?: ClinicalAssessmentStatus;
  assessmentStatusOptions?: readonly ClinicalAssessmentStatusOption[];
  hint?: string;
  info?: string;
  warning?: string;
  error?: string;
  messages?: readonly EmrValidationMessage[];
  onIntent?: (intent: FieldFrameIntent) => void;
  children: ReactNode;
}) {
  const autoId = useId();
  const controlId = controlIdProp || autoId;
  const resolvedLabel = label ?? definition?.label ?? '';
  const resolvedRequired = required ?? Boolean(definition?.required);
  const resolvedReadOnly = readOnly ?? false;
  const resolvedHint = hint ?? definition?.hint;
  const resolvedUnit = showMetadata ? (unit ?? definition?.unit) : undefined;
  const resolvedStatus = assessmentStatus ?? model?.assessmentStatus;
  const resolvedStatusOptions =
    assessmentStatusOptions ?? definition?.assessmentStatusOptions ?? [];
  const mergedMessages = mergeFieldFrameMessages(
    error ?? model?.error,
    warning ?? model?.warning,
    info,
    messages,
  );
  const showStrip =
    showMetadata && (Boolean(resolvedStatus) || (!resolvedReadOnly && resolvedStatusOptions.length > 0));

  return (
    <FieldChrome
      label={resolvedLabel}
      labelHidden={labelHidden}
      labelNamesControl={labelNamesControl}
      controlId={controlId}
      required={resolvedRequired}
      unit={resolvedUnit}
      note={note}
      layout={normalizeFieldFrameLayout(layout)}
      hint={resolvedHint}
      messages={mergedMessages.map(m => ({ severity: m.severity, message: m.message }))}
    >
      {children}
      {showStrip ? (
        <AssessmentStatusStrip
          fieldLabel={resolvedLabel}
          status={resolvedStatus}
          statusOptions={resolvedStatusOptions}
          readOnly={resolvedReadOnly}
          onStatusChange={status => onIntent?.({ type: 'statusChangeRequested', status })}
        />
      ) : null}
    </FieldChrome>
  );
}

/**
 * Shared L2 six-state `ClinicalAssessmentStatus` strip: shows current status badge, selectable
 * option chips, and an explicit clear button when a status is set and `!readOnly`.
 */
export function AssessmentStatusStrip({
  fieldLabel,
  status,
  statusOptions = [],
  readOnly,
  disabled,
  onStatusChange,
}: {
  fieldLabel: string;
  status?: ClinicalAssessmentStatus;
  statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readOnly?: boolean;
  disabled?: boolean;
  onStatusChange: (next: ClinicalAssessmentStatus | undefined) => void;
}) {
  const labels = useEmrLabels();
  if (!status && statusOptions.length === 0) return null;
  const matched = statusOptions.find(o => o.value === status);
  const badgeLabel = matched?.label ?? (status ? String(status).replaceAll('-', ' ') : '');

  return (
    <View style={styles.statusWrap}>
      {status ? (
        <View style={styles.statusHeader}>
          <EmrBadgeView badge={{ label: badgeLabel, tone: matched?.tone ?? 'neutral' }} />
          {!readOnly ? (
            <EmrButton
              small
              variant="ghost"
              label={labels.clear}
              accessibilityLabel={`${labels.clear} ${labels.assessmentStatus(fieldLabel)}`}
              disabled={disabled}
              onPress={() => onStatusChange(undefined)}
            />
          ) : null}
        </View>
      ) : null}
      {statusOptions.length > 0 && !readOnly ? (
        <View role="radiogroup" aria-label={labels.assessmentStatus(fieldLabel)}>
          <EmrRow>
            {statusOptions.map(option => (
              <EmrOptionChip
                key={option.value}
                label={option.label}
                selected={status === option.value}
                readOnly={readOnly}
                disabled={disabled}
                onPress={() => onStatusChange(status === option.value ? undefined : option.value)}
              />
            ))}
          </EmrRow>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  statusWrap: { gap: 6, marginTop: 6 },
  statusHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
});
