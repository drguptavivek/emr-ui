'use client';

import { createElement, useRef, useState, type ComponentRef, type ComponentType, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
} from 'react-native';
import type {
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFormIntent,
  ClinicalFormViewModel,
  ClinicalMatrixBlockDefinition,
  ClinicalMatrixBlockRow,
  EmrBadge,
  EmrSectionCardHeadingLevel,
  EmrSectionCardPadding,
  EmrSectionCardVariant,
  EmrTone,
  RepeatableItemState,
  SectionCardIntent,
} from '@drguptavivek/emr-controller';
import {
  clinicalFormFieldSpanPercent,
  isClinicalFormStacked,
  isClinicalMatrixRowRequired,
  isFieldShown,
  isSectionShown,
  normalizeSectionCardHeadingLevel,
  normalizeSectionCardPadding,
  normalizeSectionCardTone,
  normalizeSectionCardVariant,
  resolveClinicalFormControlId,
  resolveClinicalFormDomId,
  resolveSectionCardContentId,
  resolveSectionCardHeadingId,
  resolveSectionCardToggleLabel,
  visibleClinicalMatrixRows,
} from './clinical-form.logic';
import { isEmrIconName, SvgIcon } from './icons';
import { webProps } from './l1-interactive-shared';
import { useEmrLabels } from './labels';
import { EmrRepeatableGroup } from './l3-annotation';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import { EmrTypedField, type EmrCustomRenderers } from './typed-field';

type PressState = PressableStateCallbackType & { focused?: boolean; hovered?: boolean };

function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function containsDomNode(container: unknown, target: unknown): boolean {
  const el = container as { contains?: (n: unknown) => boolean } | null | undefined;
  return Boolean(el && typeof el.contains === 'function' && el.contains(target));
}

export interface EmrSectionCardProps {
  readonly sectionId: string;
  readonly label: string;
  readonly description?: string;
  readonly status?: EmrBadge;
  readonly collapsible?: boolean;
  readonly collapsed?: boolean;
  readonly headingId?: string;
  readonly headingLevel?: EmrSectionCardHeadingLevel;
  readonly variant?: EmrSectionCardVariant;
  readonly tone?: EmrTone;
  readonly padding?: EmrSectionCardPadding;
  readonly icon?: string;
  readonly readOnly?: boolean;
  readonly headerActions?: ReactNode;
  readonly footer?: ReactNode;
  readonly onIntent?: (intent: SectionCardIntent) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly children?: ReactNode;
}

/** L3. Collapsible section container: heading, description, status badge, actions, footer, and print-safe body. */
export function EmrSectionCard({
  sectionId,
  label,
  description,
  status,
  collapsible = false,
  collapsed = false,
  headingId,
  headingLevel: headingLevelProp = 2,
  variant: variantProp = 'outlined',
  tone: toneProp = 'neutral',
  padding: paddingProp = 'md',
  icon,
  readOnly = false,
  headerActions,
  footer,
  onIntent,
  onFocus,
  onBlur,
  children,
}: EmrSectionCardProps) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);

  const variant = normalizeSectionCardVariant(variantProp);
  const tone = normalizeSectionCardTone(toneProp);
  const padding = normalizeSectionCardPadding(paddingProp);
  const headingLevel = normalizeSectionCardHeadingLevel(headingLevelProp);
  const resolvedHeadingId = resolveSectionCardHeadingId(sectionId, headingId);
  const contentId = resolveSectionCardContentId(sectionId);
  const toggleAriaLabel = resolveSectionCardToggleLabel(Boolean(collapsed), label, {
    show: labels.show,
    hide: labels.hide,
  });

  const toneColor = tone !== 'neutral' ? toneColors(t, tone).color : undefined;
  const surfaceBg =
    variant === 'filled' ? t.surfaceRaised : variant === 'subtle' ? t.surfaceSoft : t.surface;
  const borderColor = toneColor ? withAlpha(toneColor, 0.45) : t.border;
  const contentPadding = padding === 'none' ? 0 : padding === 'sm' ? 10 : padding === 'lg' ? 24 : 16;

  const shadowStyle =
    variant === 'elevated'
      ? {
          shadowColor: '#0f172a',
          shadowOpacity: 0.14,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }
      : undefined;

  const handleFocusIn = () => {
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      onFocus?.();
    }
  };

  const handleFocusOut = (ev: { relatedTarget?: unknown }) => {
    if (ev.relatedTarget && containsDomNode(containerRef.current, ev.relatedTarget)) return;
    if (focusWithinRef.current) {
      focusWithinRef.current = false;
      onBlur?.();
    }
  };

  return (
    <View
      ref={containerRef}
      role="region"
      aria-labelledby={resolvedHeadingId}
      style={[
        styles.card,
        {
          backgroundColor: surfaceBg,
          borderColor,
          borderStyle: readOnly ? 'dashed' : 'solid',
        },
        shadowStyle,
      ]}
      {...webProps({
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      <View
        style={[
          styles.cardHeader,
          {
            backgroundColor: t.surfaceAccent,
            borderBottomColor: t.border,
            borderBottomWidth: collapsed ? 0 : 1,
          },
        ]}
      >
        {icon && isEmrIconName(icon) ? (
          <View aria-hidden style={styles.headerIcon}>
            <SvgIcon name={icon} size={18} color={t.textMuted} />
          </View>
        ) : null}
        <View style={styles.flex}>
          <Text
            role="heading"
            aria-level={headingLevel}
            nativeID={resolvedHeadingId}
            style={{
              color: t.text,
              fontSize: t.textLg,
              lineHeight: 22,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: fontFamily(t),
            }}
          >
            {label}
          </Text>
          {description ? (
            <Text
              style={{
                color: t.textMuted,
                fontSize: t.textSm,
                lineHeight: 18,
                fontFamily: fontFamily(t),
              }}
            >
              {description}
            </Text>
          ) : null}
        </View>
        {status ? <EmrBadgeView badge={status} /> : null}
        {headerActions ? <View style={styles.headerActions}>{headerActions}</View> : null}
        {collapsible ? (
          <Pressable
            role="button"
            aria-label={toggleAriaLabel}
            aria-expanded={!collapsed}
            onPress={() => onIntent?.({ type: 'toggleRequested', sectionId })}
            {...(Platform.OS === 'web'
              ? ({ dataSet: { 'emr-print': 'hide', 'section-toggle': 'true' } } as object)
              : null)}
            {...webProps({
              type: 'button',
              'aria-controls': contentId,
            })}
            style={({ pressed, hovered, focused }: PressState) => [
              styles.toggleBtn,
              focusRing(t, focused),
              {
                minHeight: Math.max(44, t.controlHeight),
                minWidth: 44,
                backgroundColor: pressed || hovered ? t.surfaceSoft : 'transparent',
              },
            ]}
          >
            <Text
              style={{
                color: t.text,
                fontSize: t.textSm,
                fontWeight: fontWeight(t.weightBold),
                fontFamily: fontFamily(t),
              }}
            >
              {collapsed ? labels.show : labels.hide}
            </Text>
            <View
              aria-hidden
              style={
                Platform.OS === 'web'
                  ? ({
                      transform: [{ rotate: !collapsed ? '180deg' : '0deg' }],
                      transition: 'transform 150ms ease',
                    } as unknown as object)
                  : { transform: [{ rotate: !collapsed ? '180deg' : '0deg' }] }
              }
            >
              <SvgIcon name="chevron-down" size={16} color={t.textMuted} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {/* Collapsed content stays mounted with [hidden] on Web (and display:none on Native)
          so .emr-print can restore it: a collapsed section on paper is omitted clinical data. */}
      {Platform.OS === 'web' ? (
        createElement(
          'div' as unknown as ComponentType<Record<string, unknown>>,
          {
            id: contentId,
            className: 'emr-section-card__content',
            hidden: Boolean(collapsed),
          },
          <View style={[styles.contentInner, contentPadding > 0 ? { padding: contentPadding } : undefined]}>
            {children}
          </View>,
        )
      ) : (
        <View nativeID={contentId} style={collapsed ? styles.collapsed : undefined}>
          <View style={[styles.contentInner, contentPadding > 0 ? { padding: contentPadding } : undefined]}>
            {children}
          </View>
        </View>
      )}
      {footer ? (
        Platform.OS === 'web' ? (
          createElement(
            'div' as unknown as ComponentType<Record<string, unknown>>,
            {
              className: 'emr-section-card__footer',
              hidden: Boolean(collapsed),
              style: {
                padding: '10px 16px',
                borderTop: `1px solid ${t.border}`,
                backgroundColor: t.surfaceSoft,
              },
            },
            footer,
          )
        ) : (
          <View
            style={[
              styles.footer,
              { borderTopColor: t.border, backgroundColor: t.surfaceSoft },
              collapsed ? styles.collapsed : undefined,
            ]}
          >
            {footer}
          </View>
        )
      ) : null}
    </View>
  );
}

export interface EmrClinicalFormProps {
  readonly model: ClinicalFormViewModel;
  readonly headingId?: string;
  readonly idPrefix?: string;
  readonly customRenderers?: EmrCustomRenderers;
  readonly onIntent: (intent: ClinicalFormIntent) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
}

/** L3. Schema-driven clinical form: the React twin of emr-clinical-form. One intent out. */
export function EmrClinicalForm({
  model,
  headingId,
  idPrefix = '',
  customRenderers,
  onIntent,
  onFocus,
  onBlur,
}: EmrClinicalFormProps) {
  const t = useEmrTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);
  const stacked = isClinicalFormStacked(width, windowWidth);
  const schemaId = model.schema.id;
  const resolvedHeadingId = headingId?.trim() || undefined;
  const domId = (value: string) => resolveClinicalFormDomId(value, idPrefix);
  const controlId = (field: ClinicalFieldDefinition, itemId?: string) =>
    resolveClinicalFormControlId(schemaId, field.id, idPrefix, itemId);
  const span = (field: { span?: number }) => clinicalFormFieldSpanPercent(field.span, stacked);
  const visibleSections = model.schema.sections.filter(section => isSectionShown(section, model.fields));

  const handleFocusIn = () => {
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      onFocus?.();
    }
  };

  const handleFocusOut = (ev: { relatedTarget?: unknown }) => {
    if (ev.relatedTarget && containsDomNode(containerRef.current, ev.relatedTarget)) return;
    if (focusWithinRef.current) {
      focusWithinRef.current = false;
      onBlur?.();
    }
  };

  const typedField = (
    field: ClinicalFieldDefinition,
    state: ClinicalFieldState | undefined,
    readOnly: boolean,
    item?: RepeatableItemState,
    groupId?: string,
    labelHidden?: boolean,
  ) => {
    const fieldLocked = Boolean(readOnly || state?.readOnly || state?.disabled);
    return (
      <EmrTypedField
        definition={field}
        labelHidden={labelHidden}
        model={state}
        controlId={controlId(field, item?.id)}
        readOnly={readOnly}
        customRenderers={customRenderers}
        onFocus={() => onIntent({ type: 'fieldFocused', fieldId: field.id })}
        onValueChange={value => {
          if (fieldLocked) return;
          onIntent(
            item && groupId
              ? { type: 'repeatItemEditRequested', groupId, itemId: item.id, fieldId: field.id, value }
              : { type: 'fieldEditRequested', fieldId: field.id, value },
          );
        }}
        onStatusChange={status => {
          if (fieldLocked) return;
          onIntent(
            item && groupId
              ? { type: 'repeatItemStatusEditRequested', groupId, itemId: item.id, fieldId: field.id, status }
              : { type: 'fieldStatusEditRequested', fieldId: field.id, status },
          );
        }}
      />
    );
  };

  const fieldCell = (field: ClinicalFieldDefinition, state: ClinicalFieldState | undefined, readOnly: boolean, item?: RepeatableItemState, groupId?: string) => (
    <View key={field.id} style={[styles.cell, { width: span(field) }]}>{typedField(field, state, readOnly, item, groupId)}</View>
  );

  // Rows × columns of ordinary fields. Headers are the visible labels; each control keeps its own field label as its accessible name.
  const matrix = (block: ClinicalMatrixBlockDefinition) => {
    const rows = visibleClinicalMatrixRows(block, model.fields);
    if (rows.length === 0) return null;
    const textStyle = { color: t.text, fontFamily: fontFamily(t) };
    return (
      <View key={block.id} style={[styles.cell, styles.full]}>
        <View style={styles.matrix}>
          <Text role="heading" aria-level={3} style={[textStyle, { fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }]}>{block.label}</Text>
          {block.description ? <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{block.description}</Text> : null}
          <View role="table" aria-label={block.label} style={styles.matrix}>
            {stacked ? null : (
              <View role="row" style={styles.matrixRow}>
                <View aria-hidden style={styles.matrixRowLabel} />
                {block.columns.map(column => (
                  <Text key={column.id} role="columnheader" style={[textStyle, styles.matrixCell, { fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }]}>{column.label}</Text>
                ))}
              </View>
            )}
            {rows.map(row => {
              const required = isClinicalMatrixRowRequired(row, model.fields);
              return (
                <View key={row.id} role="row" style={[styles.matrixRowWrap, { borderTopColor: t.border }, stacked ? null : styles.matrixRow]}>
                  <Text role="rowheader" style={[textStyle, stacked ? null : styles.matrixRowLabel, { fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }]}>
                    {row.label}{required ? <Text aria-hidden style={{ color: t.danger }}> *</Text> : null}
                  </Text>
                  <View role="none" style={stacked ? styles.matrixCellsStacked : styles.matrixCells}>
                    {block.columns.map(column => {
                      const cell = row.cells[column.id];
                      const state = cell ? model.fields[cell.id] : undefined;
                      const shown = Boolean(cell && isFieldShown(state));
                      if (stacked && !shown) return null;
                      return (
                        <View key={column.id} role="cell" style={stacked ? styles.matrixCellStacked : styles.matrixCell}>
                          {stacked && shown ? (
                            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: fontWeight(t.weightMedium), fontFamily: fontFamily(t) }}>
                              {column.label}
                            </Text>
                          ) : null}
                          {shown && cell ? typedField(cell, state, model.readOnly ?? false, undefined, undefined, true) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      ref={containerRef}
      role="form"
      aria-labelledby={resolvedHeadingId}
      aria-label={resolvedHeadingId ? undefined : model.schema.label}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={styles.form}
      {...webProps({
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      {model.schema.description ? <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{model.schema.description}</Text> : null}
      {model.correction ? (
        <View
          style={styles.correction}
          {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null)}
        >
          {model.correction.description ? <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>{model.correction.description}</Text> : null}
          <EmrButton variant="outline" label={model.correction.label} onPress={() => onIntent({ type: 'correctionRequested' })} />
        </View>
      ) : null}
      {visibleSections.length === 0 && model.emptyMessage ? (
        <Text role="status" style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>
          {model.emptyMessage}
        </Text>
      ) : null}
      {visibleSections.map(section => (
        <EmrSectionCard key={section.id} sectionId={domId(`${schemaId}-${section.id}`)} label={section.label} description={section.description}
          collapsible={section.collapsible} collapsed={model.collapsedSectionIds?.includes(section.id)} status={model.sectionStatuses?.[section.id]}
          onIntent={() => onIntent({ type: 'sectionToggleRequested', sectionId: section.id })}>
          <View style={styles.grid}>
            {section.blocks.map(block => {
              if (block.kind === 'matrix') return matrix(block);
              if (block.kind !== 'repeatable') {
                const state = model.fields[block.id];
                return isFieldShown(state) ? fieldCell(block, state, model.readOnly ?? false) : null;
              }
              return (
                <View key={block.id} style={[styles.cell, styles.full]}>
                  <EmrRepeatableGroup
                    definition={block}
                    model={model.repeatableGroups[block.id]}
                    readOnly={model.readOnly}
                    idPrefix={domId(schemaId)}
                    customRenderers={customRenderers}
                    onIntent={intent => {
                      if (model.readOnly && intent.type !== 'fieldFocused') return;
                      onIntent(intent);
                    }}
                  />
                </View>
              );
            })}
          </View>
        </EmrSectionCard>
      ))}
    </View>
  );
}

const GAP = 16;

const styles = StyleSheet.create({
  form: { gap: GAP },
  flex: { flex: 1, flexBasis: 180, minWidth: 0, gap: 3 },
  card: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  cardHeader: { minHeight: 60, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  headerIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexShrink: 0,
  },
  contentInner: { gap: 12 },
  footer: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  collapsed: { display: 'none' },
  correction: { alignItems: 'flex-start', gap: 8 },
  // 12-column grid as wrapping percentages; cells carry half-gutters so spans add up to 100%.
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -GAP / 2, rowGap: GAP },
  cell: { paddingHorizontal: GAP / 2, minWidth: 0 },
  full: { width: '100%' },
  matrix: { gap: 8 },
  matrixRow: { flexDirection: 'row', gap: GAP, alignItems: 'flex-start' },
  matrixRowWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 6 },
  matrixCells: { flex: 1, minWidth: 0, flexDirection: 'row', gap: GAP, alignItems: 'flex-start' },
  matrixCellsStacked: { flexDirection: 'column', gap: 10, width: '100%', minWidth: 0 },
  matrixCell: { flex: 1, minWidth: 0 },
  matrixCellStacked: { width: '100%', minWidth: 0, gap: 4 },
  matrixRowLabel: { width: '22%', paddingTop: 12 },
});
