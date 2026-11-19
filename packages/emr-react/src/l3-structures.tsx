'use client';

import { useRef, useState, type ComponentRef, type ComponentType } from 'react';
import { useEmrLabels } from './labels';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
} from 'react-native';
import type {
  ClinicalAssessmentStatus,
  ClinicalCellState,
  ClinicalCellValue,
  ClinicalColumn,
  ClinicalListIntent,
  ClinicalListItem,
  ClinicalListViewModel,
  ClinicalMatrixIntent,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  ClinicalQuantityValue,
  ClinicalRow,
  EmrClinicalListHeadingLevel,
  EmrClinicalListLabels,
  EmrClinicalListModel,
  EmrTimeAxisLabels,
  TimeAxisIntent,
  TimeAxisViewModel,
} from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { EmrTypedText, NumberInput, ThemedInput } from './inputs-core';
import { EmrStateMessage } from './l1-display';
import { interactiveLabelDefaults, webProps, type InteractiveLabels, type WebKeyEvent } from './l1-interactive-shared';
import { EmrBadgeView, EmrButton, EmrSelect } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import {
  canAddClinicalListItem,
  canChangeTimeAxisStep,
  canEditClinicalListItem,
  canMutateMatrixCell,
  canMutateMatrixRemark,
  canPanTimeAxis,
  canRemoveClinicalListItem,
  canSelectTimeAxisSlot,
  cellNumberValue,
  cellSelectValue,
  formatCellValue,
  groupMatrixColumns,
  isApplicable,
  isClinicalListItemSelectable,
  isMatrixStacked,
  isQuantity,
  normalizeClinicalListHeadingLevel,
  normalizeClinicalListTone,
  normalizeClinicalListVariant,
  parseMatrixPresetValue,
  quantityUnit,
  resolveClinicalListHeadingId,
  resolveMatrixDecimalStep,
  resolveMatrixDomId,
  resolveMatrixHeadingId,
  resolveTimeAxisHeadingId,
  resolveTimeAxisId,
  resolveTimeAxisNextIndex,
  resolveTimeAxisStepSelectId,
  resolveTimeAxisTabStopId,
  resolveTimeAxisTickId,
} from './l3-structures.logic';

const RESOLVED_MONO_FONT = (webMono: string): string | undefined =>
  Platform.OS === 'web'
    ? webMono
    : Platform.select({ ios: 'Menlo', android: 'monospace', default: webMono });

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

/** English fallbacks for every built-in string; override any of them through the `strings` prop. */
const DEFAULTS = {
  add: 'Add',
  edit: 'Edit',
  remove: 'Remove',
  retry: 'Retry',
  loading: 'Loading…',
  errorTitle: 'Unable to load entries',
  emptyList: 'Status not supplied.',
  clinicalListTitle: 'Clinical information',
  medicationsTitle: 'Medications',
  allergiesTitle: 'Allergies',
  chronicDiseasesTitle: 'Chronic diseases',
  personalHistoryTitle: 'Significant personal history',
  clinicalField: 'Clinical field',
  remarks: 'Remarks',
  notApplicable: 'Not applicable',
  notRecorded: 'Not recorded',
  yes: 'Yes',
  no: 'No',
  warning: 'Warning',
  assessmentStatus: 'Assessment status for',
  statusNotSet: 'Status not set',
  customRendererUnavailable: 'Custom renderer unavailable',
} as const;

export type EmrL3Strings = { [K in keyof typeof DEFAULTS]: string };

// ---------------------------------------------------------------------------
// Clinical lists
// ---------------------------------------------------------------------------

export type { EmrClinicalListModel };

export interface ClinicalListProps {
  readonly model: ClinicalListViewModel;
  readonly onIntent?: (intent: ClinicalListIntent) => void;
  readonly headingId?: string;
  readonly headingLevel?: EmrClinicalListHeadingLevel;
  readonly labels?: Partial<EmrClinicalListLabels>;
  readonly title?: string;
  readonly strings?: Partial<EmrL3Strings>;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
}

/** L3. Titled list of clinical items with select / edit / remove / add / retry intents. */
export function EmrClinicalList({
  model,
  onIntent,
  headingId,
  headingLevel = 2,
  labels,
  title,
  strings,
  onFocus,
  onBlur,
}: ClinicalListProps) {
  const t = useEmrTheme();
  const s = { ...DEFAULTS, ...strings };
  const font = fontFamily(t);
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;
  const printBreakProps =
    Platform.OS === 'web' ? ({ breakInside: 'avoid', pageBreakInside: 'avoid' } as object) : null;

  const resolvedHeadingId = resolveClinicalListHeadingId(headingId);
  const resolvedHeadingLevel = normalizeClinicalListHeadingLevel(headingLevel);
  const variant = normalizeClinicalListVariant(model.variant);
  const resolvedTitle = model.title ?? title ?? labels?.title ?? s.clinicalListTitle;
  const resolvedAddLabel = model.addLabel ?? labels?.add ?? s.add;
  const resolvedEditLabel = labels?.edit ?? s.edit;
  const resolvedRemoveLabel = labels?.remove ?? s.remove;
  const resolvedRetryLabel = labels?.retry ?? s.retry;
  const resolvedLoadingLabel = model.loadingLabel ?? labels?.loading ?? s.loading;
  const resolvedErrorTitle = labels?.errorTitle ?? s.errorTitle;
  const resolvedEmptyMessage = model.emptyMessage ?? labels?.emptyMessage ?? s.emptyList;
  const allowAdd = canAddClinicalListItem(model);

  const surfaceBg =
    variant === 'filled' ? t.surfaceRaised : variant === 'subtle' ? t.surfaceSoft : t.surface;
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
      aria-busy={model.loading ? true : undefined}
      style={[
        styles.panel,
        {
          borderColor: t.border,
          backgroundColor: surfaceBg,
          borderStyle: model.readOnly ? 'dashed' : 'solid',
        },
        shadowStyle,
        printBreakProps,
      ]}
      {...webProps({
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      <View
        style={[
          styles.panelHeader,
          {
            backgroundColor: t.surfaceAccent,
            borderBottomColor: t.border,
            minHeight: Math.max(44, t.controlHeight),
          },
        ]}
      >
        <View aria-hidden style={styles.headerIcon}>
          <SvgIcon name="list" size={18} color={t.textMuted} />
        </View>
        <View style={styles.headingBlock}>
          <Text
            role="heading"
            aria-level={resolvedHeadingLevel}
            nativeID={resolvedHeadingId}
            style={{
              color: t.text,
              fontSize: t.textLg,
              lineHeight: 22,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            }}
          >
            {resolvedTitle}
          </Text>
          {model.description ? (
            <Text
              style={{
                color: t.textMuted,
                fontSize: t.textSm,
                lineHeight: 18,
                fontFamily: font,
                marginTop: 2,
              }}
            >
              {model.description}
            </Text>
          ) : null}
        </View>
        {model.status ? <EmrBadgeView badge={model.status} /> : null}
        {allowAdd ? (
          <View {...printHideProps}>
            <EmrButton
              small
              variant="outline"
              onPress={() => {
                if (canAddClinicalListItem(model)) {
                  onIntent?.({ type: 'addRequested' });
                }
              }}
            >
              <SvgIcon name="plus" size={14} color={t.primary} />
              <Text
                numberOfLines={1}
                style={{
                  color: t.primary,
                  fontSize: t.textSm,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: font,
                }}
              >
                {resolvedAddLabel}
              </Text>
            </EmrButton>
          </View>
        ) : null}
      </View>
      <View style={styles.panelBody}>
        {model.error ? (
          <EmrStateMessage
            kind="error"
            size="sm"
            icon="danger"
            title={resolvedErrorTitle}
            message={model.error}
          >
            <View {...printHideProps} style={{ marginTop: 4 }}>
              <EmrButton
                small
                variant="outline"
                accessibilityLabel={resolvedRetryLabel}
                onPress={() => onIntent?.({ type: 'retryRequested' })}
              >
                <SvgIcon name="refresh" size={14} color={t.primary} />
                <Text
                  numberOfLines={1}
                  style={{
                    color: t.primary,
                    fontSize: t.textSm,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: font,
                  }}
                >
                  {resolvedRetryLabel}
                </Text>
              </EmrButton>
            </View>
          </EmrStateMessage>
        ) : model.loading ? (
          <EmrStateMessage kind="loading" size="sm" title={resolvedLoadingLabel} />
        ) : model.items.length === 0 ? (
          <EmrStateMessage
            kind="empty"
            size="sm"
            title={model.emptyTitle || resolvedEmptyMessage}
            message={model.emptyTitle ? resolvedEmptyMessage : undefined}
          />
        ) : (
          <View role="list" style={styles.list}>
            {model.items.map((item) => {
              const selected = model.selectedId === item.id;
              const selectable = isClinicalListItemSelectable(item);
              const canEdit = canEditClinicalListItem(model, item);
              const canRemove = canRemoveClinicalListItem(model, item);
              const tone = normalizeClinicalListTone(item.tone);
              const tonePalette = tone !== 'neutral' ? toneColors(t, tone) : undefined;
              const itemBg = selected
                ? withAlpha(t.primarySoft, 0.92)
                : tonePalette
                  ? withAlpha(tonePalette.backgroundColor, 0.35)
                  : t.surface;
              const itemBorder = selected
                ? t.primary
                : tonePalette
                  ? withAlpha(tonePalette.color, 0.45)
                  : t.border;
              const itemReadOnly = Boolean(model.readOnly || item.readOnly);
              const bodyMinHeight = Math.max(44, t.controlHeight);

              const bodyContent = (
                <>
                  <Text
                    style={{
                      color: t.text,
                      fontSize: t.textMd,
                      lineHeight: 20,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: font,
                    }}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text
                      style={{
                        color: t.textMuted,
                        fontSize: t.textSm,
                        lineHeight: 18,
                        fontFamily: font,
                      }}
                    >
                      {item.subtitle}
                    </Text>
                  ) : null}
                  {item.detail ? (
                    <Text
                      style={{
                        color: t.textMuted,
                        fontSize: t.textSm,
                        lineHeight: 18,
                        fontFamily: font,
                      }}
                    >
                      {item.detail}
                    </Text>
                  ) : null}
                  {item.meta ? (
                    <Text
                      style={{
                        color: t.textMuted,
                        fontSize: t.textXs,
                        lineHeight: 16,
                        fontFamily: font,
                      }}
                    >
                      {item.meta}
                    </Text>
                  ) : null}
                  {item.badges?.length ? (
                    <View style={styles.badges}>
                      {item.badges.map((badge, badgeIndex) => (
                        <EmrBadgeView key={`${badge.label}-${badgeIndex}`} badge={badge} />
                      ))}
                    </View>
                  ) : null}
                </>
              );

              return (
                <View
                  key={item.id}
                  role="listitem"
                  style={[
                    styles.item,
                    {
                      borderColor: itemBorder,
                      backgroundColor: itemBg,
                      borderStyle: itemReadOnly ? 'dashed' : 'solid',
                    },
                    printBreakProps,
                  ]}
                >
                  {selectable ? (
                    <Pressable
                      role="button"
                      aria-current={selected ? 'true' : undefined}
                      onPress={() => {
                        if (isClinicalListItemSelectable(item)) {
                          onIntent?.({ type: 'selected', id: item.id });
                        }
                      }}
                      style={({ focused, pressed, hovered }: PressState) => [
                        styles.itemBody,
                        focusRing(t, focused),
                        {
                          minHeight: bodyMinHeight,
                          backgroundColor: pressed || hovered ? t.surfaceRaised : 'transparent',
                        },
                      ]}
                    >
                      {bodyContent}
                    </Pressable>
                  ) : (
                    <View
                      aria-current={selected ? 'true' : undefined}
                      style={[styles.itemBody, { minHeight: bodyMinHeight }]}
                    >
                      {bodyContent}
                    </View>
                  )}
                  {canEdit || canRemove ? (
                    <View style={styles.actions} {...printHideProps}>
                      {canEdit ? (
                        <EmrButton
                          small
                          variant="ghost"
                          accessibilityLabel={`${resolvedEditLabel} ${item.title}`}
                          onPress={() => {
                            if (canEditClinicalListItem(model, item)) {
                              onIntent?.({ type: 'editRequested', id: item.id });
                            }
                          }}
                        >
                          <SvgIcon name="pen" size={14} color={t.text} />
                          <Text
                            numberOfLines={1}
                            style={{
                              color: t.text,
                              fontSize: t.textSm,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: font,
                            }}
                          >
                            {resolvedEditLabel}
                          </Text>
                        </EmrButton>
                      ) : null}
                      {canRemove ? (
                        <EmrButton
                          small
                          variant="ghost"
                          accessibilityLabel={`${resolvedRemoveLabel} ${item.title}`}
                          onPress={() => {
                            if (canRemoveClinicalListItem(model, item)) {
                              onIntent?.({ type: 'removeRequested', id: item.id });
                            }
                          }}
                        >
                          <SvgIcon name="trash" size={14} color={t.text} />
                          <Text
                            numberOfLines={1}
                            style={{
                              color: t.text,
                              fontSize: t.textSm,
                              fontWeight: fontWeight(t.weightBold),
                              fontFamily: font,
                            }}
                          >
                            {resolvedRemoveLabel}
                          </Text>
                        </EmrButton>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

export type DomainListProps = Omit<ClinicalListProps, 'title'> & { readonly title?: string };

/** L4 domain wrapper over EmrClinicalList. Fixed default title and headingId, otherwise forwards all props and intents. */
export function EmrMedicationList({
  model,
  title,
  labels,
  strings,
  headingId = 'emr-medication-list-title',
  ...rest
}: DomainListProps) {
  const resolvedTitle = model.title ?? title ?? labels?.title ?? strings?.medicationsTitle ?? DEFAULTS.medicationsTitle;
  return (
    <EmrClinicalList
      {...rest}
      model={{ ...model, title: resolvedTitle }}
      headingId={resolveClinicalListHeadingId(headingId, 'emr-medication-list-title')}
      labels={labels}
      strings={strings}
    />
  );
}
export function EmrAllergyList({
  model,
  title,
  labels,
  strings,
  headingId = 'emr-allergy-list-title',
  ...rest
}: DomainListProps) {
  const resolvedTitle = model.title ?? title ?? labels?.title ?? strings?.allergiesTitle ?? DEFAULTS.allergiesTitle;
  return (
    <EmrClinicalList
      {...rest}
      model={{ ...model, title: resolvedTitle }}
      headingId={resolveClinicalListHeadingId(headingId, 'emr-allergy-list-title')}
      labels={labels}
      strings={strings}
    />
  );
}
export function EmrChronicDiseaseList({
  model,
  title,
  labels,
  strings,
  headingId = 'emr-chronic-list-title',
  ...rest
}: DomainListProps) {
  const resolvedTitle =
    model.title ?? title ?? labels?.title ?? strings?.chronicDiseasesTitle ?? DEFAULTS.chronicDiseasesTitle;
  return (
    <EmrClinicalList
      {...rest}
      model={{ ...model, title: resolvedTitle }}
      headingId={resolveClinicalListHeadingId(headingId, 'emr-chronic-list-title')}
      labels={labels}
      strings={strings}
    />
  );
}
export function EmrPersonalHistoryList({
  model,
  title,
  labels,
  strings,
  headingId = 'emr-history-list-title',
  ...rest
}: DomainListProps) {
  const resolvedTitle =
    model.title ?? title ?? labels?.title ?? strings?.personalHistoryTitle ?? DEFAULTS.personalHistoryTitle;
  return (
    <EmrClinicalList
      {...rest}
      model={{ ...model, title: resolvedTitle }}
      headingId={resolveClinicalListHeadingId(headingId, 'emr-history-list-title')}
      labels={labels}
      strings={strings}
    />
  );
}

// ---------------------------------------------------------------------------
// Clinical matrix
// ---------------------------------------------------------------------------

/** What a custom cell renderer receives; `emit` becomes a `customCellIntent`. */
export interface EmrMatrixCellRendererProps {
  row: ClinicalRow;
  column: ClinicalColumn;
  cell?: ClinicalCellState;
  readOnly: boolean;
  emit: (action: string, payload?: unknown) => void;
}

export type EmrMatrixCellRenderers = Readonly<Record<string, ComponentType<EmrMatrixCellRendererProps>>>;

export interface EmrClinicalCellRendererProps extends EmrMatrixCellRendererProps {
  readonly columnId?: string;
  readonly renderer?: ComponentType<EmrMatrixCellRendererProps>;
  readonly fallbackText?: string;
}

/** L3. Custom matrix cell renderer host with read-only gating and fallback status. */
export function EmrClinicalCellRenderer({
  row,
  column,
  cell,
  readOnly,
  emit,
  renderer: Renderer,
  fallbackText = DEFAULTS.customRendererUnavailable,
}: EmrClinicalCellRendererProps) {
  const t = useEmrTheme();
  const font = fontFamily(t);
  const locked = !canMutateMatrixCell(readOnly, cell);
  const gatedEmit = (action: string, payload?: unknown) => {
    if (!locked) {
      emit(action, payload);
    }
  };
  if (!Renderer) {
    return (
      <Text role="status" style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
        {fallbackText}
      </Text>
    );
  }
  return <Renderer row={row} column={column} cell={cell} readOnly={locked} emit={gatedEmit} />;
}

/**
 * L3. Rows x columns clinical matrix. A table when its container is wide, one card per row when
 * narrow (container width via onLayout with windowWidth fallback). One intent out.
 */
export function EmrClinicalMatrix({
  definition,
  model = {},
  onIntent,
  readOnly = false,
  headingId,
  idPrefix = '',
  customRenderers,
  strings,
  onFocus,
  onBlur,
}: {
  definition: ClinicalMatrixSchema;
  model?: ClinicalMatrixValues;
  onIntent: (intent: ClinicalMatrixIntent) => void;
  readOnly?: boolean;
  headingId?: string;
  idPrefix?: string;
  customRenderers?: EmrMatrixCellRenderers;
  strings?: Partial<EmrL3Strings>;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const s = { ...DEFAULTS, ...strings };
  const dateFormat = useEmrLabels().dateFormat;
  const font = fontFamily(t);
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const focusWithinRef = useRef(false);
  const containerRef = useRef<ComponentRef<typeof View>>(null);
  const stacked = isMatrixStacked(width, windowWidth);
  const titleId = resolveMatrixHeadingId(definition.id, headingId, idPrefix);
  const showRemarks = definition.showRemarks !== false;
  const columnGroupSlots = groupMatrixColumns(definition.columns, definition.columnGroups);
  const text = { yes: s.yes, no: s.no, notRecorded: s.notRecorded };
  const small = { color: t.textMuted, fontSize: t.textSm, fontFamily: font };
  const metaText = { color: t.textMuted, fontSize: t.textXs, fontFamily: font, fontVariant: ['tabular-nums'] as ('tabular-nums')[] };

  const emitCell = (row: ClinicalRow, column: ClinicalColumn, value: ClinicalCellValue | ClinicalQuantityValue) => {
    const current = model[row.id]?.cells[column.id];
    if (!canMutateMatrixCell(readOnly, current)) return;
    onIntent({ type: 'cellEditRequested', rowId: row.id, columnId: column.id, value });
  };

  const cellEditor = (row: ClinicalRow, column: ClinicalColumn) => {
    if (!isApplicable(row, column.id)) {
      return (
        <Text role="img" aria-label={s.notApplicable} style={{ color: t.textMuted, fontSize: t.textMd, paddingVertical: 10 }}>
          —
        </Text>
      );
    }
    const cell = model[row.id]?.cells[column.id];
    const name = `${row.label}, ${column.label}`;
    const invalid = !!cell?.error;
    const focus = () => onIntent({ type: 'cellFocused', rowId: row.id, columnId: column.id });
    const locked = !canMutateMatrixCell(readOnly, cell);
    const controlId = resolveMatrixDomId(idPrefix, definition.id, row.id, column.id);
    const warningId = cell?.warning ? resolveMatrixDomId(idPrefix, definition.id, row.id, column.id, 'warning') : undefined;
    const errorId = cell?.error ? resolveMatrixDomId(idPrefix, definition.id, row.id, column.id, 'error') : undefined;
    const describedBy = [warningId, errorId].filter(Boolean).join(' ') || undefined;
    const describedByWeb = describedBy ? webProps({ 'aria-describedby': describedBy }) : {};
    const step = resolveMatrixDecimalStep(row);

    let editor;
    if (row.type === 'custom') {
      const Custom = row.customRendererKey ? customRenderers?.[row.customRendererKey] : undefined;
      editor = (
        <EmrClinicalCellRenderer
          row={row}
          column={column}
          columnId={column.id}
          cell={cell}
          readOnly={locked}
          renderer={Custom}
          fallbackText={s.customRendererUnavailable}
          emit={(action, payload) => onIntent({ type: 'customCellIntent', rowId: row.id, columnId: column.id, action, payload })}
        />
      );
    } else if (locked) {
      // Read-only / locked stays a focusable, announced input (never disabled): keyboard users can still reach the value.
      editor = (
        <ThemedInput
          nativeID={controlId}
          aria-label={name}
          readOnly
          multiline={row.type === 'multiline'}
          numberOfLines={row.type === 'multiline' ? 2 : 1}
          invalid={invalid}
          value={formatCellValue(cell?.value, text)}
          onFocus={focus}
          {...describedByWeb}
        />
      );
    } else {
      switch (row.type) {
        case 'select':
          editor = (
            <EmrSelect
              controlId={controlId}
              label={name}
              labelHidden
              options={row.options ?? []}
              value={cellSelectValue(cell?.value)}
              placeholder={row.placeholder}
              clearable={row.clearable ?? true}
              required={row.required}
              invalid={invalid}
              ariaDescribedBy={describedBy}
              onFocused={focus}
              onChange={value => emitCell(row, column, value)}
            />
          );
          break;
        case 'boolean':
          editor = (
            <EmrSelect
              controlId={controlId}
              label={name}
              labelHidden
              value={cellSelectValue(cell?.value)}
              clearable={row.clearable ?? true}
              required={row.required}
              invalid={invalid}
              ariaDescribedBy={describedBy}
              options={[
                { value: 'true', label: s.yes },
                { value: 'false', label: s.no },
              ]}
              onFocused={focus}
              onChange={value => emitCell(row, column, value === null ? null : value === 'true')}
            />
          );
          break;
        case 'integer':
        case 'decimal':
          editor = (
            <NumberInput
              nativeID={controlId}
              aria-label={name}
              value={cellNumberValue(cell?.value)}
              integer={row.type === 'integer'}
              min={row.min}
              max={row.max}
              step={step}
              precision={row.precision}
              placeholder={row.placeholder}
              invalid={invalid}
              warning={!!cell?.warning}
              onFocus={focus}
              onNumber={value => emitCell(row, column, value)}
              {...describedByWeb}
            />
          );
          break;
        case 'quantity': {
          const currentUnit = quantityUnit(row, cell?.value);
          const currentNum = cellNumberValue(cell?.value);
          editor = (
            <View style={{ gap: 6, minWidth: 0 }}>
              <NumberInput
                nativeID={controlId}
                aria-label={`${row.label} ${column.label}`}
                value={currentNum}
                integer={false}
                min={row.min}
                max={row.max}
                step={step}
                precision={row.precision}
                placeholder={row.placeholder}
                unit={row.unitOptions?.length ? undefined : currentUnit}
                invalid={invalid}
                warning={!!cell?.warning}
                onFocus={focus}
                onNumber={value => emitCell(row, column, { value, unit: currentUnit })}
                {...describedByWeb}
              />
              {row.unitOptions?.length ? (
                <EmrSelect
                  controlId={`${controlId}-unit`}
                  label={`${row.label} unit, ${column.label}`}
                  labelHidden
                  options={row.unitOptions}
                  value={currentUnit || null}
                  onChange={nextUnit => emitCell(row, column, { value: currentNum, unit: nextUnit ?? currentUnit })}
                />
              ) : null}
            </View>
          );
          break;
        }
        case 'date':
          // Day-first display, ISO value — the same date entry as EmrDateInput and form fields.
          editor = (
            <EmrTypedText
              nativeID={controlId}
              aria-label={name}
              mode={dateFormat}
              min={row.minDate}
              max={row.maxDate}
              clearable={row.clearable}
              placeholder={row.placeholder ?? dateFormat}
              invalid={invalid}
              warning={!!cell?.warning}
              value={typeof cell?.value === 'string' && cell.value ? cell.value : null}
              onFocus={focus}
              onValueChange={next => emitCell(row, column, next)}
              {...describedByWeb}
            />
          );
          break;
        case 'multiline': {
          const value = typeof cell?.value === 'string' ? cell.value : typeof cell?.value === 'number' ? String(cell.value) : '';
          editor = (
            <ThemedInput
              nativeID={controlId}
              aria-label={name}
              multiline
              numberOfLines={2}
              maxLength={row.maxLength}
              placeholder={row.placeholder}
              value={value}
              invalid={invalid}
              onFocus={focus}
              onChangeText={next => emitCell(row, column, next)}
              {...describedByWeb}
            />
          );
          break;
        }
        default: {
          const value = typeof cell?.value === 'string' ? cell.value : typeof cell?.value === 'number' ? String(cell.value) : '';
          editor = (
            <ThemedInput
              nativeID={controlId}
              aria-label={name}
              maxLength={row.maxLength}
              placeholder={row.placeholder}
              value={value}
              invalid={invalid}
              onFocus={focus}
              onChangeText={next => emitCell(row, column, next)}
              {...describedByWeb}
            />
          );
        }
      }
    }

    const hasClearableValue = isQuantity(cell?.value)
      ? cell.value.value !== null
      : cell?.value !== null && cell?.value !== undefined && cell?.value !== '';

    return (
      <View style={styles.cell}>
        {editor}
        {row.clearable && !locked && row.type !== 'select' && row.type !== 'boolean' && row.type !== 'date' && hasClearableValue ? (
          <Pressable
            role="button"
            aria-label={`Clear ${name}`}
            onPress={() =>
              emitCell(
                row,
                column,
                row.type === 'quantity' ? { value: null, unit: quantityUnit(row, cell?.value) } : null,
              )
            }
            {...webProps({ 'data-emr-print': 'hide' })}
            style={({ focused }: PressState) => [
              styles.matrixActionBtn,
              { minHeight: Math.max(44, t.controlHeight), borderColor: t.border, backgroundColor: t.surfaceRaised },
              focusRing(t, focused),
            ]}
          >
            <SvgIcon name="close" size={14} color={t.text} />
            <Text style={{ color: t.text, fontSize: t.textXs, fontFamily: font }}>Clear</Text>
          </Pressable>
        ) : null}
        {!locked && cell?.quickPresets?.length ? (
          <View style={styles.matrixMetaRow} {...webProps({ 'data-emr-print': 'hide' })}>
            {cell.quickPresets.map(preset => (
              <Pressable
                key={preset}
                role="button"
                aria-label={`Set ${name} to ${preset}`}
                onPress={() => emitCell(row, column, parseMatrixPresetValue(row, preset, cell))}
                style={({ focused }: PressState) => [
                  styles.matrixActionBtn,
                  { minHeight: Math.max(44, t.controlHeight), borderColor: t.border, backgroundColor: t.surfaceRaised },
                  focusRing(t, focused),
                ]}
              >
                <Text style={{ color: t.text, fontSize: t.textXs, fontFamily: font, fontVariant: ['tabular-nums'] }}>
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {cell?.flagBadge || cell?.assessmentStatus || cell?.previousValueLabel || cell?.deltaLabel || cell?.modified ? (
          <View style={styles.matrixMetaRow}>
            {cell?.flagBadge ? <EmrBadgeView badge={cell.flagBadge} size="sm" /> : null}
            {cell?.assessmentStatus ? <EmrBadgeView badge={cell.assessmentStatus} size="sm" /> : null}
            {cell?.modified ? (
              <EmrBadgeView badge={{ label: 'Modified', tone: 'info' }} size="sm" />
            ) : null}
            {cell?.previousValueLabel ? <Text style={metaText}>{cell.previousValueLabel}</Text> : null}
            {cell?.deltaLabel ? <Text style={metaText}>{cell.deltaLabel}</Text> : null}
          </View>
        ) : null}
        {!locked && row.assessmentStatusOptions?.length ? (
          <EmrSelect
            controlId={`${controlId}-status`}
            label={`${s.assessmentStatus} ${name}`}
            labelHidden
            clearable
            placeholder={s.statusNotSet}
            value={cell?.assessmentStatus?.value ?? null}
            options={row.assessmentStatusOptions.map(option => ({ value: option.value, label: option.label }))}
            onChange={value =>
              onIntent({
                type: 'cellAssessmentStatusEditRequested',
                rowId: row.id,
                columnId: column.id,
                status: (value ?? null) as ClinicalAssessmentStatus | null,
              })
            }
          />
        ) : null}
        {cell?.warning ? (
          <Text nativeID={warningId} role="status" style={[small, { color: t.warning }]}>
            {`${s.warning}: ${cell.warning}`}
          </Text>
        ) : null}
        {cell?.error ? (
          <Text nativeID={errorId} role="alert" style={[small, { color: t.danger }]}>
            {cell.error}
          </Text>
        ) : null}
      </View>
    );
  };

  const remark = (row: ClinicalRow) => {
    const value = model[row.id];
    const remarkLocked = !canMutateMatrixRemark(readOnly, value);
    const remarkId = resolveMatrixDomId(idPrefix, definition.id, row.id, 'remark');
    const remarkErrorId = value?.remarkError ? resolveMatrixDomId(idPrefix, definition.id, row.id, 'remark-error') : undefined;
    return (
      <View style={styles.cell}>
        <ThemedInput
          nativeID={remarkId}
          aria-label={`${s.remarks} — ${row.label}`}
          value={value?.remark ?? ''}
          invalid={!!value?.remarkError}
          readOnly={remarkLocked}
          onChangeText={next => {
            if (!remarkLocked) {
              onIntent({ type: 'remarkEditRequested', rowId: row.id, remark: next });
            }
          }}
          {...(remarkErrorId ? webProps({ 'aria-describedby': remarkErrorId }) : {})}
        />
        {value?.remarkError ? (
          <Text nativeID={remarkErrorId} role="alert" style={[small, { color: t.danger }]}>
            {value.remarkError}
          </Text>
        ) : null}
      </View>
    );
  };

  const head = { color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: font };
  const rowLabel = (row: ClinicalRow) => (
    <>
      <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(650), fontFamily: font }}>
        {row.unit ? `${row.label}${row.required ? ' *' : ''} (${row.unit})` : `${row.label}${row.required ? ' *' : ''}`}
      </Text>
      {row.helpText ? <Text style={small}>{row.helpText}</Text> : null}
    </>
  );

  return (
    <View
      ref={containerRef}
      role="region"
      aria-labelledby={titleId}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      {...webProps({
        onFocus: () => {
          if (!focusWithinRef.current) {
            focusWithinRef.current = true;
            onFocus?.();
          }
        },
        onBlur: (e: { relatedTarget?: unknown }) => {
          if (e.relatedTarget && containsDomNode(containerRef.current, e.relatedTarget)) return;
          if (focusWithinRef.current) {
            focusWithinRef.current = false;
            onBlur?.();
          }
        },
      })}
      style={[
        styles.matrix,
        {
          borderColor: t.border,
          backgroundColor: t.surface,
        },
      ]}
    >
      <View
        style={{
          gap: 4,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <Text role="heading" aria-level={2} nativeID={titleId} style={[head, { fontSize: t.textLg }]}>
          {definition.label}
        </Text>
        {definition.description ? <Text style={small}>{definition.description}</Text> : null}
      </View>
      {stacked ? (
        <View style={{ padding: 10, gap: 10, minWidth: 0 }}>
          {definition.rows.map(row => (
            <View key={row.id} style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
              <View style={[styles.cardTitle, { backgroundColor: t.surfaceRaised }]}>{rowLabel(row)}</View>
              {definition.columns.map(column => (
                <View key={column.id} style={[styles.cardCell, { borderTopColor: t.border }]}>
                  <Text style={[small, { fontWeight: fontWeight(650) }]}>{column.label}</Text>
                  {cellEditor(row, column)}
                </View>
              ))}
              {showRemarks ? (
                <View style={[styles.cardCell, { borderTopColor: t.border }]}>
                  <Text style={[small, { fontWeight: fontWeight(650) }]}>{s.remarks}</Text>
                  {remark(row)}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View role="table" aria-label={definition.label} style={{ minWidth: 0 }}>
          {definition.columnGroups?.length ? (
            <View role="row" style={styles.tableRow}>
              <View {...webProps({ 'aria-hidden': true })} style={styles.rowLabel} />
              {columnGroupSlots.map((slot, idx) =>
                slot.kind === 'group' ? (
                  <Text
                    key={`${slot.id}-${idx}`}
                    role="columnheader"
                    {...webProps({ 'aria-colspan': slot.colSpan })}
                    style={[head, { flex: slot.colSpan }, styles.col]}
                  >
                    {slot.label}
                  </Text>
                ) : (
                  <View key={slot.columns[0].id} {...webProps({ 'aria-hidden': true })} style={[{ flex: 1 }, styles.col]} />
                ),
              )}
              {showRemarks ? <View {...webProps({ 'aria-hidden': true })} style={styles.col} /> : null}
            </View>
          ) : null}
          <View role="row" style={[styles.tableRow, { borderBottomColor: t.border, borderBottomWidth: 1 }]}>
            <Text role="columnheader" style={[head, styles.rowLabel]}>
              {s.clinicalField}
            </Text>
            {definition.columns.map(column => (
              <Text key={column.id} role="columnheader" style={[head, styles.col]}>
                {column.label}
              </Text>
            ))}
            {showRemarks ? (
              <Text role="columnheader" style={[head, styles.col]}>
                {s.remarks}
              </Text>
            ) : null}
          </View>
          {definition.rows.map(row => (
            <View
              key={row.id}
              role="row"
              style={[styles.tableRow, { borderBottomColor: t.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <View role="rowheader" style={[styles.rowLabel, { paddingTop: 10 }]}>
                {rowLabel(row)}
              </View>
              {definition.columns.map(column => (
                <View key={column.id} role="cell" style={styles.col}>
                  {cellEditor(row, column)}
                </View>
              ))}
              {showRemarks ? (
                <View role="cell" style={styles.col}>
                  {remark(row)}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Time axis (L3)
// ---------------------------------------------------------------------------

export type { EmrTimeAxisLabels, TimeAxisIntent, TimeAxisViewModel };

export interface EmrTimeAxisProps {
  readonly model: TimeAxisViewModel;
  readonly headingId?: string;
  readonly idPrefix?: string;
  readonly onIntent: (intent: TimeAxisIntent) => void;
  readonly labels?: Partial<EmrTimeAxisLabels & InteractiveLabels>;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
}

type FocusRef = ({ focus(): void } | null)[];
const TICK_WIDTH = 88;

/**
 * L3 time axis. The controller supplies ticks and moves the window on intent; this never computes
 * times. The current tick says "Current" in text. On web ArrowLeft/ArrowRight/Home/End move focus; press selects.
 */
export function EmrTimeAxis({
  model,
  headingId,
  idPrefix = '',
  onIntent,
  labels,
  onFocus,
  onBlur,
}: EmrTimeAxisProps) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const resolvedTitle = labels?.title ?? labels?.timeAxisTitle ?? l.timeAxisTitle;
  const resolvedEmpty = labels?.empty ?? labels?.noTimes ?? l.noTimes;
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const refs = useRef<FocusRef>([]);
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);

  const axisDomId = resolveTimeAxisId(model.id, idPrefix);
  const resolvedHeadingId = resolveTimeAxisHeadingId(model.id, idPrefix, headingId);
  const stepSelectId = resolveTimeAxisStepSelectId(model.id, idPrefix);
  const tabStop = resolveTimeAxisTabStopId(model.ticks, focusedId, model.selectedTickId);
  const canPanEarlier = canPanTimeAxis(model, 'earlier');
  const canPanLater = canPanTimeAxis(model, 'later');

  const font = { fontFamily: fontFamily(t) };
  const tabularStyle =
    Platform.OS === 'web'
      ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object)
      : ({ fontFamily: RESOLVED_MONO_FONT(t.fontMono), fontVariant: ['tabular-nums'] } as object);
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;
  const printExpandProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'expand' } } as object) : null;
  const printBreakStyle = Platform.OS === 'web' ? ({ breakInside: 'avoid' } as unknown as object) : null;

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

  const onKey = (e: WebKeyEvent, index: number) => {
    const target = resolveTimeAxisNextIndex(e.key, index, model.ticks.length);
    if (target === null) return;
    e.preventDefault();
    const targetTick = model.ticks[target];
    if (!targetTick) return;
    setFocusedId(targetTick.id);
    refs.current[target]?.focus();
  };

  return (
    <View
      ref={containerRef}
      nativeID={axisDomId}
      role="region"
      aria-labelledby={resolvedHeadingId}
      style={[styles.axisStack, printBreakStyle]}
      {...webProps({
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      <View style={styles.axisHead}>
        <Text
          role="heading"
          aria-level={3}
          nativeID={resolvedHeadingId}
          style={
            model.title
              ? [font, { color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }]
              : styles.srOnly
          }
        >
          {model.title || resolvedTitle}
        </Text>
        <View style={styles.axisWrap}>
          {!model.readOnly && model.steps?.length ? (
            <View style={styles.axisStep} {...printHideProps}>
              <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{l.step}</Text>
              <View style={styles.axisSelectWrap}>
                <EmrSelect
                  controlId={stepSelectId}
                  label={l.step}
                  labelHidden
                  size="sm"
                  tabularNums
                  options={model.steps.map(s => ({ value: s.id, label: s.label }))}
                  value={model.selectedStepId ?? null}
                  onValueChange={stepId => {
                    if (stepId && canChangeTimeAxisStep(model, stepId)) {
                      onIntent({ type: 'stepChangeRequested', stepId });
                    }
                  }}
                />
              </View>
            </View>
          ) : model.stepLabel ? (
            <Text style={[font, { color: t.textMuted, fontSize: t.textSm }]}>{l.stepValue(model.stepLabel)}</Text>
          ) : null}
          {model.readOnly ? null : (
            <View style={styles.axisWrap} {...printHideProps}>
              <EmrButton
                small
                variant="outline"
                accessibilityLabel={l.earlier}
                disabled={!canPanEarlier}
                onPress={() => {
                  if (canPanTimeAxis(model, 'earlier')) {
                    onIntent({ type: 'shiftEarlierRequested' });
                  }
                }}
              >
                <SvgIcon name="chevron-left" size={16} color={t.primary} />
                <Text style={[font, { color: t.primary, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }]}>
                  {l.earlier}
                </Text>
              </EmrButton>
              <EmrButton
                small
                variant="outline"
                accessibilityLabel={l.later}
                disabled={!canPanLater}
                onPress={() => {
                  if (canPanTimeAxis(model, 'later')) {
                    onIntent({ type: 'shiftLaterRequested' });
                  }
                }}
              >
                <Text style={[font, { color: t.primary, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }]}>
                  {l.later}
                </Text>
                <SvgIcon name="chevron-right" size={16} color={t.primary} />
              </EmrButton>
            </View>
          )}
        </View>
      </View>
      {!model.ticks.length ? (
        <Text style={[font, { color: t.textMuted, fontSize: t.textSm, fontStyle: 'italic' }]}>{resolvedEmpty}</Text>
      ) : (
        <ScrollView
          horizontal
          style={[styles.axisScroll, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}
          {...printExpandProps}
          {...(model.readOnly
            ? webProps({ tabIndex: 0, role: 'region', 'aria-labelledby': resolvedHeadingId })
            : null)}
        >
          <View
            role="list"
            {...(model.readOnly ? null : webProps({ role: 'listbox' }))}
            aria-orientation="horizontal"
            aria-labelledby={resolvedHeadingId}
            style={styles.strip}
          >
            {model.ticks.map((tick, i) => {
              const sel = tick.id === model.selectedTickId;
              const tickDomId = resolveTimeAxisTickId(model.id, tick.id, idPrefix);
              const body = (
                <>
                  {tick.current ? (
                    <View
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        backgroundColor: t.primary,
                      }}
                    />
                  ) : null}
                  <Text
                    style={[
                      font,
                      tabularStyle,
                      { color: t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), textAlign: 'center' },
                    ]}
                  >
                    {tick.label}
                  </Text>
                  {tick.sublabel ? (
                    <Text
                      style={[
                        font,
                        tabularStyle,
                        { color: sel || tick.current ? t.text : t.textMuted, fontSize: t.textXs, textAlign: 'center' },
                      ]}
                    >
                      {tick.sublabel}
                    </Text>
                  ) : null}
                  {tick.current ? (
                    <Text
                      style={[
                        font,
                        {
                          color: t.primary,
                          fontSize: t.text2xs,
                          fontWeight: fontWeight(t.weightBold),
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                        },
                      ]}
                    >
                      {l.current}
                    </Text>
                  ) : null}
                </>
              );
              const frame = [
                styles.tick,
                {
                  minHeight: Math.max(44, t.controlHeight),
                  borderColor: sel ? t.primary : t.border,
                  borderWidth: sel ? 2 : 0,
                  borderRightWidth: sel ? 2 : 1,
                  borderLeftWidth: sel ? 2 : i === 0 ? 1 : 0,
                  backgroundColor: sel || tick.current ? t.primarySoft : 'transparent',
                },
              ];
              const a11y = [tick.label, tick.sublabel, tick.current ? l.current : null, model.readOnly && sel ? l.selected : null]
                .filter(Boolean)
                .join(', ');
              return model.readOnly ? (
                <View
                  key={tick.id}
                  nativeID={tickDomId}
                  role="listitem"
                  accessible
                  aria-label={a11y}
                  aria-current={tick.current ? 'time' : undefined}
                  style={frame}
                >
                  {body}
                </View>
              ) : (
                <Pressable
                  key={tick.id}
                  nativeID={tickDomId}
                  ref={el => {
                    refs.current[i] = el;
                  }}
                  role="option"
                  aria-selected={sel}
                  aria-current={tick.current ? 'time' : undefined}
                  aria-label={a11y}
                  onPress={() => {
                    if (canSelectTimeAxisSlot(model, tick.id)) {
                      onIntent({ type: 'tickSelected', tickId: tick.id });
                    }
                  }}
                  onFocus={() => setFocusedId(tick.id)}
                  {...webProps({ tabIndex: tick.id === tabStop ? 0 : -1, onKeyDown: (e: WebKeyEvent) => onKey(e, i) })}
                  style={({ focused, hovered }: PressState) => [
                    ...frame,
                    hovered && !sel && !tick.current ? { backgroundColor: t.primarySoft } : null,
                    focusRing(t, focused),
                  ]}
                >
                  {body}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  panel: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', minWidth: 0 },
  panelHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headingBlock: { flexGrow: 1, flexShrink: 1, flexBasis: 180, minWidth: 0 },
  panelBody: { padding: 12, minWidth: 0 },
  list: { gap: 8, minWidth: 0 },
  item: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 0,
  },
  itemBody: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  matrix: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', minWidth: 0 },
  matrixMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, minWidth: 0 },
  matrixActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
  },
  tableRow: { flexDirection: 'row', gap: 8, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'flex-start', minWidth: 0 },
  rowLabel: { width: '20%', minWidth: 0 },
  col: { flex: 1, minWidth: 0 },
  cell: { gap: 4, minWidth: 0 },
  card: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', minWidth: 0 },
  cardTitle: { paddingHorizontal: 12, paddingVertical: 10, gap: 2, minWidth: 0 },
  cardCell: { gap: 6, padding: 10, borderTopWidth: 1, minWidth: 0 },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
  axisStack: { gap: 8, minWidth: 0, maxWidth: '100%' },
  axisWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, minWidth: 0, maxWidth: '100%' },
  axisStep: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: '100%' },
  axisSelectWrap: { minWidth: 112 },
  axisHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0, maxWidth: '100%' },
  axisScroll: { borderWidth: 1, borderRadius: 8, maxWidth: '100%' },
  strip: { flexDirection: 'row' },
  tick: { position: 'relative', width: TICK_WIDTH, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 6 },
});
