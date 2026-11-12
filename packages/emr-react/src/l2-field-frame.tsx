'use client';

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  EmrValidationMessage,
} from '@drguptavivek/emr-controller';
import { FieldChrome } from './l1-field-chrome';
import { useEmrLabels } from './labels';
import { EmrBadgeView, EmrButton, EmrOptionChip, EmrRow } from './primitives';

/**
 * L2 field frame: wraps L1 `FieldChrome` and accepts structured `EmrValidationMessage[]`
 * (`error` | `warning` | `info`) while keeping `hint` persistently visible alongside validation messages.
 */
export function EmrFieldFrame({
  label,
  labelHidden,
  labelNamesControl,
  controlId,
  required,
  hint,
  info,
  warning,
  error,
  messages,
  children,
}: {
  label: string;
  labelNamesControl?: boolean;
  labelHidden?: boolean;
  controlId: string;
  required?: boolean;
  hint?: string;
  info?: string;
  warning?: string;
  error?: string;
  messages?: readonly EmrValidationMessage[];
  children: ReactNode;
}) {
  return (
    <FieldChrome
      label={label}
      labelHidden={labelHidden}
      labelNamesControl={labelNamesControl}
      controlId={controlId}
      required={required}
      hint={hint}
      info={info}
      warning={warning}
      error={error}
      messages={messages?.map(m => ({ severity: m.severity, message: m.message }))}
    >
      {children}
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
