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
  if (error) lines.push({ severity: 'error', message: error });
  if (warning) lines.push({ severity: 'warning', message: warning });
  if (info) lines.push({ severity: 'info', message: info });
  if (messages?.length) {
    for (const msg of messages) {
      if (!lines.some(existing => existing.severity === msg.severity && existing.message === msg.message)) {
        lines.push({ severity: msg.severity, message: msg.message });
      }
    }
  }

  const hasFooter = Boolean(hint || lines.length > 0);
  const showLabel = Boolean(label && !labelHidden);

  return (
    <View style={styles.frame}>
      {showLabel ? (
        <View style={styles.labelRow}>
          <Text
            nativeID={`${controlId}-label`}
            numberOfLines={1}
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
        </View>
      ) : null}
      {children}
      {hasFooter ? (
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
                    ? '⚠ '
                    : line.severity === 'warning'
                      ? '! '
                      : 'ℹ ';
                return (
                  <Text
                    key={`${line.severity}-${idx}`}
                    role={line.severity === 'error' ? 'alert' : undefined}
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { gap: 6, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  footer: { gap: 3 },
  lines: { gap: 2 },
});

export const EmrFieldChrome = FieldChrome;

