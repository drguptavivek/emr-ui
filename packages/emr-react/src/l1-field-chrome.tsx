'use client';

import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useEmrLabels } from './labels';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

export interface FieldValidationLine {
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
}

export interface FieldChromeProps {
  readonly label?: string;
  readonly labelNamesControl?: boolean;
  readonly labelHidden?: boolean;
  readonly controlId: string;
  readonly required?: boolean;
  readonly unit?: string;
  readonly note?: string;
  readonly layout?: 'vertical' | 'horizontal' | 'inline';
  readonly hint?: string;
  readonly info?: string;
  readonly warning?: string;
  readonly error?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly children: ReactNode;
}

/**
 * Pure L1 mechanical field frame: renders label, required indicator, control slot,
 * persistent hint, and any validation/info lines without upward L2 dependencies.
 */
export function FieldChrome({
  label,
  labelNamesControl,
  labelHidden,
  controlId,
  required,
  unit,
  note,
  layout = 'vertical',
  hint,
  info,
  warning,
  error,
  messages,
  children,
}: FieldChromeProps) {
  const t = useEmrTheme();
  const labels = useEmrLabels();

  const lines: FieldValidationLine[] = [];
  if (info) lines.push({ severity: 'info', message: info });
  if (warning) lines.push({ severity: 'warning', message: warning });
  if (error) lines.push({ severity: 'error', message: error });
  if (messages?.length) {
    for (const msg of messages) {
      if (!lines.some(existing => existing.severity === msg.severity && existing.message === msg.message)) {
        lines.push({ severity: msg.severity, message: msg.message });
      }
    }
  }

  const hasFooter = Boolean(hint || note || lines.length > 0);
  const showLabel = Boolean(label && !labelHidden);
  const horizontal = layout === 'horizontal' || layout === 'inline';

  const labelEl = showLabel ? (
    <View style={[styles.labelRow, horizontal && Platform.OS === 'web' ? { minWidth: 120, maxWidth: 170, paddingTop: 10 } : undefined]}>
      <Text
        nativeID={`${controlId}-label`}
        numberOfLines={horizontal ? 2 : 1}
        aria-label={required ? `${label}, ${labels.required}` : label}
        {...(labelNamesControl && Platform.OS !== 'web'
          ? { importantForAccessibility: 'no' as const, accessibilityElementsHidden: true }
          : null)}
        style={{
          color: t.text,
          fontSize: t.textSm,
          lineHeight: 20,
          minHeight: 20,
          fontWeight: fontWeight(t.weightMedium),
          fontFamily: fontFamily(t),
          flexShrink: 1,
        }}
      >
        {label}
        {required ? (
          <Text style={{ color: t.danger, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}> *</Text>
        ) : null}
      </Text>
      {unit ? (
        <View style={[styles.unitBadge, { backgroundColor: t.surfaceSoft, borderColor: t.border }]}>
          <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontWeight: fontWeight(600), fontFamily: fontFamily(t) }}>
            {unit}
          </Text>
        </View>
      ) : null}
    </View>
  ) : null;

  const footerEl = hasFooter ? (
    <View nativeID={`${controlId}-message`} style={styles.footer}>
      {hint ? (
        <Text
          nativeID={`${controlId}-hint`}
          style={{
            color: t.textMuted,
            fontSize: t.textXs,
            lineHeight: 16,
            fontFamily: fontFamily(t),
            fontWeight: fontWeight(t.weightRegular),
          }}
        >
          {hint}
        </Text>
      ) : null}
      {note ? (
        <Text
          nativeID={`${controlId}-note`}
          style={{
            color: t.textMuted,
            fontSize: t.textXs,
            lineHeight: 16,
            fontFamily: fontFamily(t),
            fontWeight: fontWeight(t.weightRegular),
          }}
        >
          {note}
        </Text>
      ) : null}
      {lines.length > 0 ? (
        <View aria-live="polite" style={styles.lines}>
          {lines.map((line, idx) => {
            const color =
              line.severity === 'error'
                ? t.danger
                : line.severity === 'warning'
                  ? t.warning
                  : t.info;
            const prefix =
              line.severity === 'error'
                ? 'Error: '
                : line.severity === 'warning'
                  ? 'Warning: '
                  : 'Info: ';
            return (
              <Text
                key={`${line.severity}-${idx}`}
                role={line.severity === 'error' ? 'alert' : 'status'}
                nativeID={`${controlId}-msg-${idx}`}
                style={{
                  color,
                  fontSize: t.textXs,
                  lineHeight: 16,
                  fontFamily: fontFamily(t),
                  fontWeight: fontWeight(600),
                }}
              >
                {prefix}
                {line.message}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  ) : null;

  return (
    <View style={[styles.frame, horizontal && Platform.OS === 'web' ? styles.frameHorizontal : undefined]}>
      {labelEl}
      <View style={[styles.controlCol, horizontal && Platform.OS === 'web' ? styles.controlColHorizontal : undefined]}>
        {children}
        {footerEl}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { gap: 6, minWidth: 0 },
  frameHorizontal: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 },
  controlCol: { minWidth: 0, gap: 6 },
  controlColHorizontal: { flex: 1, minWidth: 180 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'wrap' },
  unitBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, borderWidth: 1 },
  footer: { gap: 3 },
  lines: { gap: 2 },
});

export const EmrFieldChrome = FieldChrome;

