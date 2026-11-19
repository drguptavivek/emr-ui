'use client';

import { useEffect, useId, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
} from 'react-native';
import type {
  AnnotationListIntent,
  AnnotationListItem,
  AnnotationListViewModel,
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFormIntent,
  EmrImageTemplatePickerLabels as ControllerImageTemplatePickerLabels,
  ImageTemplateOption,
  ImageTemplatePickerIntent,
  ImageTemplatePickerViewModel,
  RepeatableGroupDefinition,
  RepeatableItemState,
} from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { ThemedInput } from './inputs-core';
import { clampedTarget } from './l1-interactive.logic';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import { useEmrLabels } from './labels';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import { EmrTypedField, type EmrCustomRenderers } from './typed-field';
import { isFieldShown } from './typed-field.logic';
import {
  FAVOURITES_GROUP_ID,
  annotationFullSummary,
  annotationLayerIconName,
  annotationLayerToolName,
  annotationListTabStopId,
  annotationPrimaryLabel,
  annotationSecondaryLabel,
  canAddRepeatableItem,
  canEditTemplateFavourites,
  canMoveAnnotationLayer,
  canOpenToolbarPen,
  canRemoveAnnotationLayer,
  canRemoveRepeatableItem,
  canSelectImageTemplate,
  canToggleAnnotationLayerLock,
  canToggleAnnotationLayerVisibility,
  canToggleTemplateFavourite,
  canTriggerToolbarIntent,
  filterImageTemplates,
  hasToolbarPen,
  isRepeatableStacked,
  isTemplateFavourite,
  partitionImageTemplates,
  repeatableControlId,
  repeatableFieldSpanPercent,
  repeatableFocusFieldId,
  repeatableHeadingId,
  repeatableMaxItemsHint,
  resolveAnnotationListId,
  resolveAnnotationListRowId,
  resolveAnnotationToolbarPanelId,
  resolveImageTemplatePickerHeadingId,
  resolveImageTemplatePickerId,
  resolveImageTemplateSearchId,
  resolveImageTemplateSectionId,
  showFavouritePinHint,
  showFavouritesFilterChip,
  templateGridColumns,
  templateGridNextIndex,
  templateTabStopId,
  templateTileLabel,
  toolbarActiveTabStop,
  toolbarEnabledKeys,
  toolbarPenLabel,
  toolbarRovingNextKey,
  toolbarToolIconName,
  toolbarToolTitle,
} from './l3-annotation.logic';

const RESOLVED_MONO_FONT = (webMono: string): string | undefined =>
  Platform.OS === 'web'
    ? webMono
    : Platform.select({ ios: 'Menlo', android: 'monospace', default: webMono });

export {
  FAVOURITES_GROUP_ID,
  filterImageTemplates,
  partitionImageTemplates,
};

type PressState = PressableStateCallbackType & { focused?: boolean; hovered?: boolean };
type FocusableHandle = { focus(): void } | null;

// ---------------------------------------------------------------------------
// 1. EmrRepeatableGroup
// ---------------------------------------------------------------------------

export type ClinicalRepeatableBlockDefinition = RepeatableGroupDefinition;

export interface EmrRepeatableGroupProps {
  definition: ClinicalRepeatableBlockDefinition;
  model?: readonly RepeatableItemState[];
  headingId?: string;
  readOnly?: boolean;
  idPrefix?: string;
  emptyMessage?: string;
  error?: string;
  warning?: string;
  customRenderers?: EmrCustomRenderers;
  onIntent: (intent: ClinicalFormIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

function containsDomNode(container: unknown, target: unknown): boolean {
  const el = container as { contains?: (n: unknown) => boolean } | null | undefined;
  return Boolean(el && typeof el.contains === 'function' && el.contains(target));
}

/**
 * L3. Standalone repeatable field group: header with Add button, empty state, and one card per
 * repeated item with Remove and a 12-column responsive `EmrTypedField` grid.
 */
export function EmrRepeatableGroup({
  definition,
  model = [],
  headingId,
  readOnly = false,
  idPrefix = '',
  emptyMessage,
  error,
  warning,
  customRenderers,
  onIntent,
  onFocus,
  onBlur,
}: EmrRepeatableGroupProps) {
  const t = useEmrTheme();
  const labels = useEmrLabels();
  const [width, setWidth] = useState(0);
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);
  const stacked = isRepeatableStacked(width);
  const resolvedHeadingId = repeatableHeadingId(definition.id, idPrefix, headingId);
  const resolvedEmptyMessage = emptyMessage ?? definition.emptyMessage ?? labels.noEntries;
  const addAllowed = canAddRepeatableItem(definition, model, readOnly);
  const maxHint = repeatableMaxItemsHint(definition, model, readOnly);
  const addText = definition.addLabel ?? labels.add;
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;

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

  const renderField = (item: RepeatableItemState, field: ClinicalFieldDefinition) => {
    const state: ClinicalFieldState | undefined = item.fields[field.id];
    if (!isFieldShown(state)) return null;
    const itemReadOnly = !!(readOnly || item.readOnly);
    const fieldLocked = itemReadOnly || !!state?.readOnly || !!state?.disabled;
    return (
      <View
        key={field.id}
        style={[styles.repeatCell, { width: repeatableFieldSpanPercent(field.span, stacked) }]}
      >
        <EmrTypedField
          definition={field}
          model={state}
          controlId={repeatableControlId(definition.id, item.id, field.id, idPrefix)}
          readOnly={itemReadOnly}
          customRenderers={customRenderers}
          onFocus={() =>
            onIntent({
              type: 'fieldFocused',
              fieldId: repeatableFocusFieldId(definition.id, item.id, field.id),
            })
          }
          onValueChange={value => {
            if (!fieldLocked) {
              onIntent({
                type: 'repeatItemEditRequested',
                groupId: definition.id,
                itemId: item.id,
                fieldId: field.id,
                value,
              });
            }
          }}
          onStatusChange={status => {
            if (!fieldLocked) {
              onIntent({
                type: 'repeatItemStatusEditRequested',
                groupId: definition.id,
                itemId: item.id,
                fieldId: field.id,
                status,
              });
            }
          }}
        />
      </View>
    );
  };

  return (
    <View
      ref={containerRef}
      role="region"
      aria-labelledby={resolvedHeadingId}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.repeatable,
        {
          borderColor: error ? t.danger : warning ? t.warning : t.border,
          borderStyle: readOnly ? 'dashed' : 'solid',
          backgroundColor: t.surfaceSlate,
        },
      ]}
      {...webProps({
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      <View style={styles.repeatHeading}>
        <View style={styles.repeatHeadingText}>
          <Text
            role="heading"
            aria-level={3}
            nativeID={resolvedHeadingId}
            style={{
              color: t.text,
              fontSize: t.textLg,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: fontFamily(t),
            }}
          >
            {definition.label}
          </Text>
          {definition.description ? (
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: fontFamily(t) }}>
              {definition.description}
            </Text>
          ) : null}
        </View>
        {addAllowed ? (
          <View {...printHideProps}>
            <EmrButton
              variant="outline"
              small
              accessibilityLabel={addText}
              onPress={() => {
                if (canAddRepeatableItem(definition, model, readOnly)) {
                  onIntent({ type: 'repeatItemAddRequested', groupId: definition.id });
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
                  fontFamily: fontFamily(t),
                }}
              >
                {addText}
              </Text>
            </EmrButton>
          </View>
        ) : maxHint ? (
          <Text
            role="status"
            style={{
              color: t.textMuted,
              fontSize: t.textXs,
              fontWeight: fontWeight(600),
              fontFamily: fontFamily(t),
              paddingTop: 6,
            }}
          >
            {maxHint}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text
          role="alert"
          style={{
            color: t.danger,
            fontSize: t.textXs,
            fontWeight: fontWeight(600),
            fontFamily: fontFamily(t),
            marginTop: 8,
          }}
        >
          {error}
        </Text>
      ) : null}
      {warning ? (
        <Text
          role="status"
          style={{
            color: t.warning,
            fontSize: t.textXs,
            fontWeight: fontWeight(600),
            fontFamily: fontFamily(t),
            marginTop: 8,
          }}
        >
          {warning}
        </Text>
      ) : null}
      {model.length === 0 ? (
        <Text
          style={{
            color: t.textMuted,
            fontSize: t.textMd,
            fontFamily: fontFamily(t),
            marginTop: 12,
          }}
        >
          {resolvedEmptyMessage}
        </Text>
      ) : (
        model.map((item, index) => {
          const itemLabel = item.label ?? labels.entry(index + 1);
          const itemLocked = !!(readOnly || item.readOnly);
          const removeAllowed = canRemoveRepeatableItem(definition, model, item, readOnly);
          return (
            <View
              key={item.id}
              style={[
                styles.repeatItem,
                {
                  borderColor: item.error ? t.danger : item.warning ? t.warning : t.border,
                  borderStyle: itemLocked ? 'dashed' : 'solid',
                  backgroundColor: t.surface,
                },
                Platform.OS === 'web'
                  ? ({ breakInside: 'avoid', pageBreakInside: 'avoid' } as object)
                  : null,
              ]}
            >
              <View style={styles.repeatHeading}>
                <View style={styles.repeatItemTitle}>
                  <Text
                    style={{
                      color: t.text,
                      fontSize: t.textMd,
                      fontWeight: fontWeight(600),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {itemLabel}
                  </Text>
                  {item.readOnly && !readOnly ? (
                    <EmrBadgeView
                      badge={{ label: 'Read-only', tone: 'neutral', size: 'sm', icon: 'lock' }}
                    />
                  ) : null}
                  {item.badges?.map((b, bi) => (
                    <EmrBadgeView key={bi} badge={b} />
                  ))}
                </View>
                {removeAllowed ? (
                  <View {...printHideProps}>
                    <EmrButton
                      variant="ghost"
                      small
                      accessibilityLabel={`${labels.remove} ${itemLabel}`}
                      onPress={() => {
                        if (canRemoveRepeatableItem(definition, model, item, readOnly)) {
                          onIntent({
                            type: 'repeatItemRemoveRequested',
                            groupId: definition.id,
                            itemId: item.id,
                          });
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
                          fontFamily: fontFamily(t),
                        }}
                      >
                        {labels.remove}
                      </Text>
                    </EmrButton>
                  </View>
                ) : null}
              </View>
              {item.error ? (
                <Text
                  role="alert"
                  style={{
                    color: t.danger,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(600),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {item.error}
                </Text>
              ) : null}
              {item.warning ? (
                <Text
                  role="status"
                  style={{
                    color: t.warning,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(600),
                    fontFamily: fontFamily(t),
                  }}
                >
                  {item.warning}
                </Text>
              ) : null}
              <View style={styles.repeatGrid}>
                {definition.fields.map(field => renderField(item, field))}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 2. EmrAnnotationToolbar
// ---------------------------------------------------------------------------

export const TOOLBAR_DEFAULTS = {
  toolbarAria: 'Annotation tools',
  toolsGroup: 'Tools',
  penGroup: 'Pen',
  penPrefix: 'Pen',
  penFallback: 'Pen colour and width',
  penPanelAria: 'Pen colour and width',
  colourGroup: 'Colour',
  widthGroup: 'Line width',
  historyGroup: 'History',
  undo: 'Undo',
  redo: 'Redo',
  zoomGroup: 'Zoom',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  zoomFit: 'Fit to view',
  zoomReset: 'Reset zoom',
  zoomResetAria: (zoomLabel: string) => `Reset zoom, currently ${zoomLabel}`,
  saveGroup: 'Save',
  save: 'Save annotations',
};

export type EmrAnnotationToolbarLabels = typeof TOOLBAR_DEFAULTS;

export interface EmrAnnotationToolbarProps {
  model: AnnotationToolbarViewModel;
  headingId?: string;
  idPrefix?: string;
  labels?: Partial<typeof TOOLBAR_DEFAULTS>;
  onIntent: (intent: AnnotationToolbarIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * L3. Dense, wrapping row of 44px icon buttons for any annotation surface.
 * Single Tab stop on web with arrow/Home/End roving focus.
 */
export function EmrAnnotationToolbar({
  model,
  headingId,
  idPrefix = '',
  labels,
  onIntent,
  onFocus,
  onBlur,
}: EmrAnnotationToolbarProps) {
  const t = useEmrTheme();
  const l = { ...TOOLBAR_DEFAULTS, ...labels };
  const reactPanelId = useId();
  const panelId = resolveAnnotationToolbarPanelId(idPrefix, headingId, `${reactPanelId}-pen`);
  const [open, setOpen] = useState(false);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);
  const buttonRefs = useRef<Record<string, FocusableHandle>>({});

  const locked = !!model.readOnly;
  const hasPen = hasToolbarPen(model);
  const selectedColour = model.colours.find(c => c.id === model.selectedColourId);
  const selectedWidth = model.widths.find(w => w.id === model.selectedWidthId);
  const btnMinSize = Math.max(44, t.controlHeight);
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;

  useEffect(() => {
    if (locked || !hasPen) setOpen(false);
  }, [locked, hasPen]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onDocPointerDown = (ev: Event) => {
      if (!containsDomNode(containerRef.current, ev.target)) {
        setOpen(false);
      }
    };
    const onDocKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        setOpen(false);
        buttonRefs.current['pen']?.focus();
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    document.addEventListener('keydown', onDocKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      document.removeEventListener('keydown', onDocKeyDown, true);
    };
  }, [open]);

  const handleContainerFocusIn = () => {
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      onFocus?.();
    }
  };

  const handleContainerFocusOut = (ev: { relatedTarget?: unknown }) => {
    if (ev.relatedTarget && containsDomNode(containerRef.current, ev.relatedTarget)) return;
    if (open) setOpen(false);
    if (focusWithinRef.current) {
      focusWithinRef.current = false;
      onBlur?.();
    }
  };

  const enabledKeys = useMemo(() => toolbarEnabledKeys(model), [model]);
  const activeKey = toolbarActiveTabStop(model, focusedKey);

  const onButtonKey = (e: WebKeyEvent, key: string) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
      buttonRefs.current['pen']?.focus();
      return;
    }
    const next = toolbarRovingNextKey(e.key, key, enabledKeys);
    if (!next) return;
    e.preventDefault();
    setFocusedKey(next);
    buttonRefs.current[next]?.focus();
  };

  const emitToolbarIntent = (intent: AnnotationToolbarIntent) => {
    if (!canTriggerToolbarIntent(model, intent)) return;
    onIntent(intent);
  };

  const pickPenOption = (intent: AnnotationToolbarIntent) => {
    if (!canTriggerToolbarIntent(model, intent)) return;
    onIntent(intent);
    setOpen(false);
    buttonRefs.current['pen']?.focus();
  };

  const toolbarBtn = ({
    btnKey,
    ariaLabel,
    title,
    pressed,
    expanded,
    ariaControls,
    disabled,
    onPress,
    children,
  }: {
    btnKey: string;
    ariaLabel: string;
    title?: string;
    pressed?: boolean;
    expanded?: boolean;
    ariaControls?: string;
    disabled?: boolean;
    onPress: () => void;
    children: React.ReactNode;
  }) => {
    const active = pressed || expanded;
    return (
      <Pressable
        key={btnKey}
        ref={el => {
          buttonRefs.current[btnKey] = el;
        }}
        role="button"
        aria-label={ariaLabel}
        aria-pressed={pressed}
        aria-expanded={expanded}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={() => {
          if (!disabled) onPress();
        }}
        onFocus={() => setFocusedKey(btnKey)}
        {...webProps({
          title: title ?? ariaLabel,
          'aria-controls': ariaControls,
          'aria-disabled': disabled ? 'true' : undefined,
          tabIndex: btnKey === activeKey ? 0 : -1,
          onKeyDown: (e: WebKeyEvent) => onButtonKey(e, btnKey),
        })}
        style={(st: PressState) => [
          styles.tbBtn,
          { minWidth: btnMinSize, minHeight: btnMinSize, height: btnMinSize },
          focusRing(t, st.focused),
          disabled ? styles.disabled : null,
        ]}
      >
        {({ hovered }: PressState) => (
          <>
            <View
              style={[
                styles.tbFace,
                {
                  backgroundColor: active
                    ? t.primarySoft
                    : hovered && !disabled
                      ? t.surfaceSoft
                      : 'transparent',
                  borderColor: active
                    ? t.primary
                    : hovered && !disabled
                      ? t.border
                      : 'transparent',
                },
              ]}
            >
              {children}
            </View>
            {active ? <View style={[styles.tbActiveBar, { backgroundColor: t.primary }]} /> : null}
          </>
        )}
      </Pressable>
    );
  };

  const penSummary = toolbarPenLabel(model, l.penFallback, l.penPrefix);

  return (
    <View
      ref={containerRef}
      style={styles.tbWrap}
      {...printHideProps}
      {...webProps({
        onFocus: handleContainerFocusIn,
        onBlur: handleContainerFocusOut,
      })}
    >
      <View
        role="toolbar"
        aria-orientation="horizontal"
        aria-label={headingId ? undefined : l.toolbarAria}
        aria-labelledby={headingId}
        style={[styles.tb, { borderColor: t.border, backgroundColor: t.surface }]}
      >
        {model.tools.length > 0 ? (
          <View role="group" aria-label={l.toolsGroup} style={styles.tbGroup}>
            {model.tools.map(tool => {
              const selected = tool.id === model.selectedToolId;
              const iconName = toolbarToolIconName(tool);
              const iconColor = selected ? t.primaryContrast : t.text;
              return toolbarBtn({
                btnKey: `t:${tool.id}`,
                ariaLabel: tool.label,
                title: toolbarToolTitle(tool),
                pressed: selected,
                disabled: locked || !!tool.disabled,
                onPress: () => emitToolbarIntent({ type: 'toolSelected', toolId: tool.id }),
                children: iconName ? (
                  <SvgIcon name={iconName} size={20} color={iconColor} strokeWidth={1.6} />
                ) : (
                  <Text
                    aria-hidden
                    style={{
                      color: iconColor,
                      fontSize: t.textMd,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {tool.label.slice(0, 1)}
                  </Text>
                ),
              });
            })}
          </View>
        ) : null}

        {hasPen ? (
          <View role="group" aria-label={l.penGroup} style={styles.tbGroup}>
            {toolbarBtn({
              btnKey: 'pen',
              ariaLabel: penSummary,
              title: penSummary,
              expanded: open,
              ariaControls: panelId,
              disabled: locked,
              onPress: () => {
                if (canOpenToolbarPen(model)) setOpen(prev => !prev);
              },
              children: (
                <View style={styles.tbPenFace}>
                  <View
                    aria-hidden
                    style={[
                      styles.tbDot,
                      {
                        backgroundColor: selectedColour?.hex ?? t.text,
                        borderColor: t.textMuted,
                      },
                    ]}
                  />
                  <View
                    aria-hidden
                    style={[
                      styles.tbBar,
                      {
                        height: Math.max(1, Math.min(8, selectedWidth?.px ?? 2)),
                        backgroundColor: open ? t.primaryContrast : t.text,
                      },
                    ]}
                  />
                </View>
              ),
            })}
          </View>
        ) : null}

        <View role="group" aria-label={l.historyGroup} style={styles.tbGroup}>
          {toolbarBtn({
            btnKey: 'undo',
            ariaLabel: l.undo,
            disabled: locked || !model.canUndo,
            onPress: () => emitToolbarIntent({ type: 'undoRequested' }),
            children: <SvgIcon name="undo" size={18} color={t.text} />,
          })}
          {toolbarBtn({
            btnKey: 'redo',
            ariaLabel: l.redo,
            disabled: locked || !model.canRedo,
            onPress: () => emitToolbarIntent({ type: 'redoRequested' }),
            children: <SvgIcon name="redo" size={18} color={t.text} />,
          })}
        </View>

        <View role="group" aria-label={l.zoomGroup} style={styles.tbGroup}>
          {toolbarBtn({
            btnKey: 'zoomOut',
            ariaLabel: l.zoomOut,
            disabled: !!model.zoomLocked,
            onPress: () => emitToolbarIntent({ type: 'zoomOutRequested' }),
            children: <SvgIcon name="zoom-out" size={18} color={t.text} />,
          })}
          {toolbarBtn({
            btnKey: 'zoomReset',
            ariaLabel: l.zoomResetAria(model.zoomLabel),
            title: l.zoomReset,
            disabled: !!model.zoomLocked,
            onPress: () => emitToolbarIntent({ type: 'zoomResetRequested' }),
            children: (
              <Text
                aria-hidden
                style={{
                  color: t.text,
                  fontSize: t.textXs,
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: monoFont,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {model.zoomLabel}
              </Text>
            ),
          })}
          {toolbarBtn({
            btnKey: 'zoomIn',
            ariaLabel: l.zoomIn,
            disabled: !!model.zoomLocked,
            onPress: () => emitToolbarIntent({ type: 'zoomInRequested' }),
            children: <SvgIcon name="zoom-in" size={18} color={t.text} />,
          })}
          {toolbarBtn({
            btnKey: 'zoomFit',
            ariaLabel: l.zoomFit,
            disabled: !!model.zoomLocked,
            onPress: () => emitToolbarIntent({ type: 'zoomFitRequested' }),
            children: <SvgIcon name="maximize" size={18} color={t.text} />,
          })}
        </View>

        <View role="group" aria-label={l.saveGroup} style={styles.tbGroup}>
          {toolbarBtn({
            btnKey: 'save',
            ariaLabel: model.saveLabel ?? l.save,
            disabled: locked || !model.canSave,
            onPress: () => emitToolbarIntent({ type: 'saveRequested' }),
            children: <SvgIcon name="download" size={18} color={t.text} />,
          })}
        </View>
      </View>

      {open && !locked && hasPen ? (
        <View
          nativeID={panelId}
          role="group"
          aria-label={l.penPanelAria}
          {...webProps({
            id: panelId,
            onKeyDown: (e: WebKeyEvent) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
                buttonRefs.current['pen']?.focus();
              }
            },
          })}
          style={[styles.tbPanel, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          {model.colours.length > 0 ? (
            <View role="group" aria-label={l.colourGroup} style={styles.tbGroup}>
              {model.colours.map(c => {
                const selected = c.id === model.selectedColourId;
                return (
                  <Pressable
                    key={c.id}
                    role="button"
                    aria-label={c.label}
                    aria-pressed={selected}
                    onPress={() => pickPenOption({ type: 'colourSelected', colourId: c.id })}
                    {...webProps({ title: c.label })}
                    style={(st: PressState) => [
                      styles.tbBtn,
                      { minWidth: btnMinSize, minHeight: btnMinSize, height: btnMinSize },
                      focusRing(t, st.focused),
                    ]}
                  >
                    <View
                      style={[
                        styles.tbSwatchOuter,
                        { borderColor: selected ? t.primary : 'transparent' },
                      ]}
                    >
                      <View
                        style={[
                          styles.tbSwatch,
                          { backgroundColor: c.hex, borderColor: t.textMuted },
                        ]}
                      >
                        {selected ? (
                          <View style={[styles.tbTick, { backgroundColor: t.surface }]}>
                            <SvgIcon name="check" size={11} color={t.text} strokeWidth={2.5} />
                          </View>
                        ) : null}
                      </View>
                    </View>
                    {selected ? (
                      <View style={[styles.tbActiveBar, { backgroundColor: t.primary }]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {model.widths.length > 0 ? (
            <View role="group" aria-label={l.widthGroup} style={styles.tbGroup}>
              {model.widths.map(w => {
                const selected = w.id === model.selectedWidthId;
                return (
                  <Pressable
                    key={w.id}
                    role="button"
                    aria-label={w.label}
                    aria-pressed={selected}
                    onPress={() => pickPenOption({ type: 'widthSelected', widthId: w.id })}
                    {...webProps({ title: w.label })}
                    style={(st: PressState) => [
                      styles.tbBtn,
                      { minWidth: btnMinSize, minHeight: btnMinSize, height: btnMinSize },
                      focusRing(t, st.focused),
                    ]}
                  >
                    <View
                      style={[
                        styles.tbFace,
                        {
                          backgroundColor: selected ? t.primarySoft : 'transparent',
                          borderColor: selected ? t.primary : 'transparent',
                        },
                      ]}
                    >
                      <View
                        aria-hidden
                        style={[
                          styles.tbBarWide,
                          {
                            height: Math.max(1, Math.min(10, w.px)),
                            backgroundColor: selected ? t.primaryContrast : t.text,
                          },
                        ]}
                      />
                    </View>
                    {selected ? (
                      <View style={[styles.tbActiveBar, { backgroundColor: t.primary }]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 3. EmrAnnotationList
// ---------------------------------------------------------------------------

export const LIST_DEFAULTS = {
  listAria: 'Annotations',
  locked: 'Locked',
  hidden: 'Hidden',
  drawingPrefix: 'Drawing',
  showTitle: 'Show drawing',
  hideTitle: 'Hide drawing',
  lockTitle: 'Lock drawing',
  unlockTitle: 'Unlock drawing',
  moveUpTitle: 'Move up',
  moveDownTitle: 'Move down',
  deleteTitle: 'Delete drawing',
  showDrawing: (num: number, name: string) => `Show drawing ${num}, ${name}`,
  lockDrawing: (num: number, name: string) => `Lock drawing ${num}, ${name}`,
  moveUpDrawing: (num: number, name: string) => `Move drawing ${num} up, ${name}`,
  moveDownDrawing: (num: number, name: string) => `Move drawing ${num} down, ${name}`,
  deleteDrawing: (num: number, name: string) => `Delete drawing ${num}, ${name}`,
};

export type EmrAnnotationListLabels = typeof LIST_DEFAULTS;

export interface EmrAnnotationListProps {
  model: AnnotationListViewModel;
  headingId?: string;
  idPrefix?: string;
  labels?: Partial<typeof LIST_DEFAULTS>;
  onIntent: (intent: AnnotationListIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * L3. Numbered list of annotation layers with colour swatch, class/label, tool icon, and
 * 44px action buttons (visibility, lock, reorder, delete). Plain legend when `model.readOnly`.
 */
export function EmrAnnotationList({
  model,
  headingId,
  idPrefix = '',
  labels,
  onIntent,
  onFocus,
  onBlur,
}: EmrAnnotationListProps) {
  const t = useEmrTheme();
  const l = { ...LIST_DEFAULTS, ...labels };
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);
  const mainRefs = useRef<FocusableHandle[]>([]);
  const tabStopId = annotationListTabStopId(model, focusedId);
  const font = fontFamily(t);
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);
  const btnMinSize = Math.max(44, t.controlHeight);
  const listId = resolveAnnotationListId(idPrefix, headingId);
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;

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

  const onMainKey = (e: WebKeyEvent, index: number) => {
    const target = clampedTarget(e.key, index, model.items.length);
    if (target === null) return;
    e.preventDefault();
    const nextItem = model.items[target];
    if (nextItem) setFocusedId(nextItem.layer.id);
    mainRefs.current[target]?.focus();
  };

  if (model.items.length === 0) {
    return (
      <View
        ref={containerRef}
        role="status"
        style={[styles.alEmpty, { borderColor: t.border, backgroundColor: t.surface }]}
        {...webProps({
          onFocus: handleFocusIn,
          onBlur: handleFocusOut,
        })}
      >
        <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font }}>
          {model.emptyMessage}
        </Text>
      </View>
    );
  }

  const rowActionBtn = ({
    key,
    rowId,
    ariaLabel,
    title,
    pressed,
    eyeToggle,
    danger,
    disabled,
    icon,
    onPress,
  }: {
    key: string;
    rowId: string;
    ariaLabel: string;
    title: string;
    pressed?: boolean;
    eyeToggle?: boolean;
    danger?: boolean;
    disabled?: boolean;
    icon: React.ReactNode;
    onPress: () => void;
  }) => {
    const highlighted = pressed && !eyeToggle;
    return (
      <Pressable
        key={key}
        role="button"
        aria-label={ariaLabel}
        aria-pressed={pressed}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={() => {
          if (!disabled) onPress();
        }}
        onFocus={() => setFocusedId(rowId)}
        {...webProps({
          title,
          'aria-disabled': disabled ? 'true' : undefined,
          tabIndex: rowId === tabStopId ? 0 : -1,
        })}
        style={(st: PressState) => [
          styles.alActionBtn,
          { width: btnMinSize, minWidth: btnMinSize, height: btnMinSize, minHeight: btnMinSize },
          focusRing(t, st.focused),
          disabled ? styles.disabled : null,
        ]}
      >
        {({ hovered }: PressState) => (
          <View
            style={[
              styles.alActionFace,
              {
                backgroundColor: highlighted
                  ? t.primarySoft
                  : hovered && !disabled
                    ? (danger ? t.dangerSoft : t.surfaceSoft)
                    : 'transparent',
                borderColor: highlighted
                  ? t.primaryBorder
                  : hovered && !disabled
                    ? (danger ? t.danger : t.border)
                    : 'transparent',
              },
            ]}
          >
            {icon}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View
      ref={containerRef}
      nativeID={listId}
      role="list"
      aria-label={headingId ? undefined : l.listAria}
      aria-labelledby={headingId}
      style={[styles.al, { borderColor: t.border, backgroundColor: t.surface }]}
      {...webProps({
        id: listId,
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      {model.items.map((it: AnnotationListItem, index: number) => {
        const selected = it.layer.id === model.selectedLayerId;
        const hidden = !it.layer.visible;
        const first = index === 0;
        const last = index === model.items.length - 1;
        const primary = annotationPrimaryLabel(it);
        const secondary = annotationSecondaryLabel(it);
        const summary = annotationFullSummary(it);
        const toolLabel = annotationLayerToolName(it.layer.tool);
        const toolIcon = annotationLayerIconName(it.layer.tool);
        const rowDomId = resolveAnnotationListRowId(idPrefix, it.layer.id);

        return (
          <View
            key={it.layer.id}
            nativeID={rowDomId}
            role="listitem"
            aria-current={selected ? 'true' : undefined}
            {...webProps({ id: rowDomId, dataSet: { 'emr-print': 'legend-row' } })}
            style={[
              styles.alRow,
              !last ? { borderBottomWidth: 1, borderBottomColor: t.border } : null,
              selected
                ? {
                    backgroundColor: t.primarySoft,
                    borderLeftWidth: 4,
                    borderLeftColor: t.primary,
                  }
                : null,
              Platform.OS === 'web'
                ? ({ breakInside: 'avoid', pageBreakInside: 'avoid' } as object)
                : null,
            ]}
          >
            <Pressable
              ref={el => {
                mainRefs.current[index] = el;
              }}
              role="button"
              aria-label={`${l.drawingPrefix} ${it.number}. ${summary}, ${toolLabel}${it.locked ? `, ${l.locked}` : ''}${hidden ? `, ${l.hidden}` : ''}`}
              onPress={() => onIntent({ type: 'layerSelected', layerId: it.layer.id })}
              onFocus={() => setFocusedId(it.layer.id)}
              {...webProps({
                title: summary,
                tabIndex: it.layer.id === tabStopId ? 0 : -1,
                onKeyDown: (e: WebKeyEvent) => onMainKey(e, index),
              })}
              style={(st: PressState) => [
                styles.alMain,
                { minHeight: btnMinSize },
                focusRing(t, st.focused),
              ]}
            >
              <View
                aria-hidden
                style={[styles.alNo, { borderColor: t.border, backgroundColor: t.surface }]}
              >
                <Text
                  style={{
                    color: t.text,
                    fontSize: t.textXs,
                    fontWeight: fontWeight(t.weightBold),
                    fontFamily: monoFont,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {it.number}
                </Text>
              </View>

              <View
                aria-hidden
                style={[
                  styles.alSwatch,
                  {
                    backgroundColor: it.layer.color,
                    borderColor: t.textMuted,
                    borderStyle: hidden ? 'dashed' : 'solid',
                  },
                ]}
              />

              <View style={styles.alTxt}>
                <Text
                  numberOfLines={1}
                  {...webProps({ dataSet: { 'emr-print': 'unwrap' } })}
                  style={{
                    color: t.text,
                    fontSize: t.textMd,
                    fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
                    fontStyle: hidden ? 'italic' : 'normal',
                    fontFamily: font,
                  }}
                >
                  {primary}
                  {secondary ? (
                    <Text style={{ fontWeight: fontWeight(t.weightRegular) }}>{` · ${secondary}`}</Text>
                  ) : null}
                </Text>
                {it.description ? (
                  <Text
                    numberOfLines={1}
                    {...webProps({ dataSet: { 'emr-print': 'unwrap' } })}
                    style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: font }}
                  >
                    {it.description}
                  </Text>
                ) : null}
              </View>

              <View role="img" aria-label={toolLabel} style={styles.alTool}>
                <SvgIcon name={toolIcon} size={18} color={t.textMuted} strokeWidth={1.6} />
              </View>

              {it.locked ? (
                <View role="img" aria-label={l.locked} style={styles.alTool}>
                  <SvgIcon name="lock" size={15} color={t.textMuted} />
                </View>
              ) : null}

              {model.readOnly && hidden ? (
                <View role="img" aria-label={l.hidden} style={styles.alTool}>
                  <SvgIcon name="eye-off" size={15} color={t.textMuted} />
                </View>
              ) : null}
            </Pressable>

            {!model.readOnly ? (
              <View style={styles.alActions} {...printHideProps}>
                {rowActionBtn({
                  key: 'vis',
                  rowId: it.layer.id,
                  ariaLabel: l.showDrawing(it.number, primary),
                  title: it.layer.visible ? l.hideTitle : l.showTitle,
                  pressed: it.layer.visible,
                  eyeToggle: true,
                  icon: (
                    <SvgIcon
                      name={it.layer.visible ? 'eye' : 'eye-off'}
                      size={18}
                      color={t.text}
                    />
                  ),
                  onPress: () => {
                    if (canToggleAnnotationLayerVisibility(model, it.layer.id)) {
                      onIntent({ type: 'layerVisibilityToggleRequested', layerId: it.layer.id });
                    }
                  },
                })}

                {model.canLock
                  ? rowActionBtn({
                      key: 'lock',
                      rowId: it.layer.id,
                      ariaLabel: l.lockDrawing(it.number, primary),
                      title: it.locked ? l.unlockTitle : l.lockTitle,
                      pressed: !!it.locked,
                      icon: (
                        <SvgIcon name={it.locked ? 'lock' : 'unlock'} size={18} color={t.text} />
                      ),
                      onPress: () => {
                        if (canToggleAnnotationLayerLock(model, it.layer.id)) {
                          onIntent({ type: 'layerLockToggleRequested', layerId: it.layer.id });
                        }
                      },
                    })
                  : null}

                {selected ? (
                  <>
                    {rowActionBtn({
                      key: 'up',
                      rowId: it.layer.id,
                      ariaLabel: l.moveUpDrawing(it.number, primary),
                      title: l.moveUpTitle,
                      disabled: first || !!it.locked,
                      icon: <SvgIcon name="chevron-up" size={18} color={t.text} />,
                      onPress: () => {
                        if (canMoveAnnotationLayer(model, it.layer.id, 'up')) {
                          onIntent({
                            type: 'layerMoveRequested',
                            layerId: it.layer.id,
                            direction: 'up',
                          });
                        }
                      },
                    })}
                    {rowActionBtn({
                      key: 'down',
                      rowId: it.layer.id,
                      ariaLabel: l.moveDownDrawing(it.number, primary),
                      title: l.moveDownTitle,
                      disabled: last || !!it.locked,
                      icon: <SvgIcon name="chevron-down" size={18} color={t.text} />,
                      onPress: () => {
                        if (canMoveAnnotationLayer(model, it.layer.id, 'down')) {
                          onIntent({
                            type: 'layerMoveRequested',
                            layerId: it.layer.id,
                            direction: 'down',
                          });
                        }
                      },
                    })}
                  </>
                ) : null}

                {rowActionBtn({
                  key: 'del',
                  rowId: it.layer.id,
                  ariaLabel: l.deleteDrawing(it.number, primary),
                  title: l.deleteTitle,
                  danger: true,
                  disabled: !!it.locked,
                  icon: <SvgIcon name="trash" size={18} color={t.danger} />,
                  onPress: () => {
                    if (canRemoveAnnotationLayer(model, it.layer.id)) {
                      onIntent({ type: 'layerRemoveRequested', layerId: it.layer.id });
                    }
                  },
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. EmrImageTemplatePicker
// ---------------------------------------------------------------------------

export const PICKER_DEFAULTS: Required<ControllerImageTemplatePickerLabels> = {
  close: 'Close',
  searchPlaceholder: 'Search by name, side or view',
  searchAria: (title: string) => `Search ${title}`,
  clearSearch: 'Clear search',
  filterAria: (title: string) => `Filter ${title}`,
  favourites: 'Favourites',
  all: 'All',
  allTemplates: 'All templates',
  starHint: 'Star a template to pin it here.',
  showAll: 'Show all',
  resetFilters: 'Reset filters',
  addFavourite: (label: string) => `Add ${label} to favourites`,
  removeFavourite: (label: string) => `Remove ${label} from favourites`,
};

export type EmrImageTemplatePickerLabels = ControllerImageTemplatePickerLabels;

export interface EmrImageTemplatePickerProps {
  model: ImageTemplatePickerViewModel;
  headingId?: string;
  idPrefix?: string;
  readOnly?: boolean;
  labels?: EmrImageTemplatePickerLabels;
  onIntent: (intent: ImageTemplatePickerIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const TILE_MIN_WIDTH = 120;
const TILE_GAP = 8;

/**
 * L3. Controlled gallery picker for choosing a background image template visually,
 * with search, group filter chips, pinned Favourites section, and square thumbnail tiles.
 */
export function EmrImageTemplatePicker({
  model,
  headingId,
  idPrefix = '',
  readOnly = false,
  labels,
  onIntent,
  onFocus,
  onBlur,
}: EmrImageTemplatePickerProps) {
  const t = useEmrTheme();
  const l = { ...PICKER_DEFAULTS, ...labels };
  const uid = useId();
  const pickerId = resolveImageTemplatePickerId(idPrefix, headingId, `${uid}-picker`);
  const resolvedHeadingId = resolveImageTemplatePickerHeadingId(idPrefix, headingId, `${uid}-heading`);
  const searchInputId = resolveImageTemplateSearchId(idPrefix, headingId, `${uid}-picker`);
  const favSectionId = resolveImageTemplateSectionId('fav', idPrefix, headingId, `${uid}-picker`);
  const allSectionId = resolveImageTemplateSectionId('all', idPrefix, headingId, `${uid}-picker`);
  const [containerWidth, setContainerWidth] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);
  const tileRefs = useRef<Record<string, FocusableHandle>>({});
  const escapeStateRef = useRef({ query: model.query, onIntent });
  escapeStateRef.current = { query: model.query, onIntent };
  const font = fontFamily(t);
  const hitTarget = Math.max(44, t.controlHeight);
  const effectiveReadOnly = !!(readOnly || model.readOnly);
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = containerRef.current as unknown as {
      addEventListener?: (t: string, l: (ev: { key: string; preventDefault: () => void }) => void) => void;
      removeEventListener?: (t: string, l: (ev: { key: string; preventDefault: () => void }) => void) => void;
    } | null;
    if (!node?.addEventListener) return;
    const onKeyDown = (ev: { key: string; preventDefault: () => void }) => {
      if (ev.key !== 'Escape') return;
      ev.preventDefault();
      if (escapeStateRef.current.query) {
        escapeStateRef.current.onIntent({ type: 'queryChangeRequested', query: '' });
      } else {
        escapeStateRef.current.onIntent({ type: 'closeRequested' });
      }
    };
    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener?.('keydown', onKeyDown);
  }, []);

  const { favs, rest, flat } = useMemo(() => partitionImageTemplates(model), [model]);
  const tabStop = templateTabStopId(flat, model.selectedId, focusedId);
  const canEditFavs = canEditTemplateFavourites(model, readOnly);
  const columns = templateGridColumns(containerWidth, TILE_MIN_WIDTH, TILE_GAP);
  const tileWidth =
    containerWidth > 0 ? (containerWidth - TILE_GAP * (columns - 1)) / columns : undefined;

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

  const onTileKey = (e: WebKeyEvent, id: string) => {
    if (e.key === 'Escape') {
      return;
    }
    const i = flat.findIndex(o => o.id === id);
    const nextIdx = templateGridNextIndex(e.key, i, flat.length, favs.length, columns);
    if (nextIdx === null) return;
    e.preventDefault();
    const nextOption = flat[nextIdx];
    if (nextOption) {
      setFocusedId(nextOption.id);
      tileRefs.current[nextOption.id]?.focus();
    }
  };

  const renderChip = (
    key: string,
    label: string,
    selected: boolean,
    onPress: () => void,
    count?: number,
    starPrefix?: boolean,
  ) => (
    <Pressable
      key={key}
      role="button"
      aria-pressed={selected}
      onPress={onPress}
      style={(st: PressState) => [
        styles.tpChip,
        {
          minHeight: hitTarget,
          minWidth: hitTarget,
          borderColor: selected ? t.primary : t.border,
          backgroundColor: selected ? t.primarySoft : t.surface,
        },
        focusRing(t, st.focused),
      ]}
    >
      {starPrefix ? <SvgIcon name="star-filled" size={14} color={t.warning} /> : null}
      <Text
        style={{
          color: selected ? t.primaryContrast : t.text,
          fontSize: t.textSm,
          fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
          fontFamily: font,
        }}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <Text
          style={{
            color: selected ? t.primaryContrast : t.textMuted,
            fontSize: t.textSm,
            fontFamily: font,
          }}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );

  const renderTile = (option: ImageTemplateOption) => {
    const selected = option.id === model.selectedId;
    const isFav = isTemplateFavourite(model, option.id);
    const canSelect = canSelectImageTemplate(effectiveReadOnly, option);
    const canToggleFav = canToggleTemplateFavourite(model, option, readOnly);
    return (
      <View
        key={option.id}
        role="listitem"
        style={[
          styles.tpItem,
          Platform.OS === 'web'
            ? ({ width: '100%' } as object)
            : tileWidth !== undefined
              ? { width: tileWidth }
              : { flexBasis: '31%', flexGrow: 1, minWidth: TILE_MIN_WIDTH },
        ]}
      >
        <Pressable
          ref={el => {
            tileRefs.current[option.id] = el;
          }}
          role="button"
          aria-pressed={selected}
          aria-disabled={effectiveReadOnly || undefined}
          disabled={effectiveReadOnly}
          aria-label={templateTileLabel(option)}
          onPress={() => {
            if (canSelect) onIntent({ type: 'templateSelected', templateId: option.id });
          }}
          onFocus={() => setFocusedId(option.id)}
          {...webProps({
            'aria-disabled': effectiveReadOnly ? 'true' : undefined,
            tabIndex: option.id === tabStop ? 0 : -1,
            onKeyDown: (e: WebKeyEvent) => onTileKey(e, option.id),
          })}
          style={(st: PressState) => [
            styles.tpTile,
            {
              minHeight: hitTarget,
              borderColor: selected ? t.primary : t.border,
              borderWidth: 1,
              backgroundColor: selected
                ? t.primarySoft
                : st.hovered && !effectiveReadOnly
                  ? t.surfaceRaised
                  : t.surface,
            },
            Platform.OS === 'web' && selected
              ? ({ boxShadow: `0 0 0 1px ${t.primary}` } as object)
              : null,
            focusRing(t, st.focused),
          ]}
        >
          <View style={[styles.tpFrame, { backgroundColor: t.surfaceSoft }]}>
            {option.imageUrl ? (
              <Image
                source={{ uri: option.imageUrl }}
                accessibilityLabel={option.altText ?? option.label}
                resizeMode="contain"
                style={styles.tpImg}
              />
            ) : null}
          </View>
          <Text
            numberOfLines={2}
            style={{
              color: t.text,
              fontSize: t.textSm,
              fontWeight: fontWeight(t.weightMedium),
              fontFamily: font,
            }}
          >
            {option.label}
          </Text>
          {option.badges?.length ? (
            <View style={styles.tpBadges}>
              {option.badges.map(badge => (
                <View key={badge} style={[styles.tpBadge, { backgroundColor: t.neutralSoft }]}>
                  <Text
                    style={{
                      color: t.text,
                      fontSize: t.text2xs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: font,
                    }}
                  >
                    {badge}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Pressable>

        {selected ? (
          <View
            aria-hidden
            pointerEvents="none"
            style={[
              styles.tpCheck,
              { backgroundColor: t.primarySoft, borderColor: t.primary },
            ]}
          >
            <SvgIcon name="check" size={12} color={t.primaryContrast} strokeWidth={2.5} />
          </View>
        ) : null}

        {canEditFavs ? (
          <Pressable
            role="button"
            aria-pressed={isFav}
            aria-label={isFav ? l.removeFavourite(option.label) : l.addFavourite(option.label)}
            onPress={() => {
              if (canToggleFav) {
                onIntent({
                  type: 'favouriteToggleRequested',
                  templateId: option.id,
                  favourite: !isFav,
                });
              }
            }}
            onFocus={() => setFocusedId(option.id)}
            {...webProps({ tabIndex: option.id === tabStop ? 0 : -1 })}
            style={(st: PressState) => [
              styles.tpStar,
              { width: hitTarget, minWidth: hitTarget, height: hitTarget, minHeight: hitTarget },
              focusRing(t, st.focused),
            ]}
          >
            <View
              style={[
                styles.tpStarBg,
                {
                  backgroundColor: isFav ? t.warningSoft : t.surface,
                  borderColor: isFav ? t.warning : t.border,
                },
              ]}
            >
              <SvgIcon
                name={isFav ? 'star-filled' : 'star'}
                size={15}
                color={isFav ? t.warning : t.text}
              />
            </View>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View
      ref={containerRef}
      nativeID={pickerId}
      role="region"
      aria-labelledby={resolvedHeadingId}
      style={[styles.tp, { borderColor: t.border, backgroundColor: t.surface }]}
      {...printHideProps}
      {...webProps({
        id: pickerId,
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
      })}
    >
      <View style={styles.tpHead}>
        <View style={styles.flex}>
          <Text
            role="heading"
            aria-level={3}
            nativeID={resolvedHeadingId}
            style={{
              color: t.text,
              fontSize: t.textXl,
              fontWeight: fontWeight(t.weightBold),
              fontFamily: font,
            }}
          >
            {model.title}
          </Text>
          {model.totalLabel ? (
            <Text
              role="status"
              style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font, marginTop: 2 }}
            >
              {model.totalLabel}
            </Text>
          ) : null}
        </View>
        <Pressable
          role="button"
          aria-label={l.close}
          onPress={() => onIntent({ type: 'closeRequested' })}
          {...webProps({ title: l.close })}
          style={(st: PressState) => [
            styles.tpCloseBtn,
            {
              width: hitTarget,
              minWidth: hitTarget,
              height: hitTarget,
              minHeight: hitTarget,
              borderColor: t.border,
              backgroundColor: st.hovered ? t.surfaceRaised : t.surface,
            },
            focusRing(t, st.focused),
          ]}
        >
          <SvgIcon name="close" size={16} color={t.text} />
        </Pressable>
      </View>

      <View style={styles.tpSearchWrap}>
        <View pointerEvents="none" style={styles.tpSearchGlass}>
          <SvgIcon name="search" size={16} color={t.textMuted} />
        </View>
        <ThemedInput
          nativeID={searchInputId}
          role="searchbox"
          aria-label={l.searchAria(model.title)}
          placeholder={l.searchPlaceholder}
          value={model.query}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={query => onIntent({ type: 'queryChangeRequested', query })}
          style={{
            minHeight: hitTarget,
            paddingLeft: 38,
            paddingRight: model.query ? 46 : 12,
          }}
        />
        {model.query ? (
          <Pressable
            role="button"
            aria-label={l.clearSearch}
            onPress={() => onIntent({ type: 'queryChangeRequested', query: '' })}
            {...webProps({ title: l.clearSearch })}
            style={(st: PressState) => [
              styles.tpClearBtn,
              {
                width: hitTarget,
                minWidth: hitTarget,
                height: hitTarget,
                minHeight: hitTarget,
                backgroundColor: st.hovered ? t.surfaceSoft : 'transparent',
              },
              focusRing(t, st.focused),
            ]}
          >
            <SvgIcon name="close" size={16} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View role="group" aria-label={l.filterAria(model.title)} style={styles.tpChips}>
        {showFavouritesFilterChip(model, readOnly)
          ? renderChip(
              FAVOURITES_GROUP_ID,
              l.favourites,
              model.selectedGroupId === FAVOURITES_GROUP_ID,
              () => onIntent({ type: 'groupSelected', groupId: FAVOURITES_GROUP_ID }),
              model.favouriteIds?.length ?? 0,
              true,
            )
          : null}
        {renderChip(
          '__all__',
          l.all,
          !model.selectedGroupId,
          () => onIntent({ type: 'groupSelected', groupId: null }),
        )}
        {model.groups.map(g =>
          renderChip(
            g.id,
            g.label,
            model.selectedGroupId === g.id,
            () => onIntent({ type: 'groupSelected', groupId: g.id }),
            g.count,
          ),
        )}
      </View>

      <View
        onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
        style={styles.tpBody}
      >
        {flat.length > 0 ? (
          <>
            {favs.length > 0 ? (
              <View role="group" aria-labelledby={favSectionId} style={styles.tpSec}>
                <View style={styles.tpSubRow}>
                  <SvgIcon name="star-filled" size={14} color={t.warning} />
                  <Text
                    nativeID={favSectionId}
                    style={[
                      styles.tpSubText,
                      {
                        color: t.textMuted,
                        fontSize: t.textSm,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: font,
                      },
                    ]}
                  >
                    {`${l.favourites} ${favs.length}`}
                  </Text>
                </View>
                <View
                  role="list"
                  style={[
                    styles.tpGrid,
                    Platform.OS === 'web'
                      ? ({
                          display: 'grid',
                          gridTemplateColumns: `repeat(auto-fill, minmax(min(${TILE_MIN_WIDTH}px, 100%), 1fr))`,
                          gap: TILE_GAP,
                        } as object)
                      : null,
                  ]}
                >
                  {favs.map(renderTile)}
                </View>
              </View>
            ) : showFavouritePinHint(model, readOnly) ? (
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: font }}>
                {l.starHint}
              </Text>
            ) : null}

            {rest.length > 0 ? (
              <View
                role={favs.length > 0 ? 'group' : undefined}
                aria-labelledby={favs.length > 0 ? allSectionId : undefined}
                style={styles.tpSec}
              >
                {favs.length > 0 ? (
                  <Text
                    nativeID={allSectionId}
                    style={[
                      styles.tpSubText,
                      {
                        color: t.textMuted,
                        fontSize: t.textSm,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: font,
                      },
                    ]}
                  >
                    {`${l.allTemplates} ${rest.length}`}
                  </Text>
                ) : null}
                <View
                  role="list"
                  style={[
                    styles.tpGrid,
                    Platform.OS === 'web'
                      ? ({
                          display: 'grid',
                          gridTemplateColumns: `repeat(auto-fill, minmax(min(${TILE_MIN_WIDTH}px, 100%), 1fr))`,
                          gap: TILE_GAP,
                        } as object)
                      : null,
                  ]}
                >
                  {rest.map(renderTile)}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <View role="status" style={styles.tpEmpty}>
            <Text style={{ color: t.textMuted, fontSize: t.textMd, fontFamily: font, textAlign: 'center' }}>
              {model.emptyMessage}
            </Text>
            <View style={styles.tpEmptyActions}>
              {model.query ? (
                <EmrButton
                  small
                  variant="outline"
                  label={l.clearSearch}
                  onPress={() => onIntent({ type: 'queryChangeRequested', query: '' })}
                />
              ) : null}
              {model.selectedGroupId ? (
                <EmrButton
                  small
                  variant="outline"
                  label={l.showAll}
                  onPress={() => onIntent({ type: 'groupSelected', groupId: null })}
                />
              ) : null}
              {model.query && model.selectedGroupId ? (
                <EmrButton
                  small
                  variant="outline"
                  label={l.resetFilters}
                  onPress={() => {
                    onIntent({ type: 'queryChangeRequested', query: '' });
                    onIntent({ type: 'groupSelected', groupId: null });
                  }}
                />
              ) : null}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const REPEAT_GAP = 16;

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: 4 },
  disabled: { opacity: 0.52 },

  // EmrRepeatableGroup
  repeatable: { borderWidth: 1, borderRadius: 8, padding: 16 },
  repeatHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  repeatHeadingText: { flex: 1, flexBasis: 180, minWidth: 0, gap: 4 },
  repeatItemTitle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexBasis: 160,
    minWidth: 0,
  },
  repeatItem: { marginTop: 12, padding: 12, borderWidth: 1, borderRadius: 8, gap: 12 },
  repeatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -REPEAT_GAP / 2,
    rowGap: REPEAT_GAP,
  },
  repeatCell: { paddingHorizontal: REPEAT_GAP / 2, minWidth: 0 },

  // EmrAnnotationToolbar
  tbWrap: { position: 'relative' },
  tb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderRadius: 8,
  },
  tbGroup: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  tbBtn: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbFace: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbPenFace: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  tbDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  tbBar: { width: 16, borderRadius: 2 },
  tbBarWide: { width: 18, borderRadius: 2 },
  tbActiveBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 1,
    height: 3,
    borderRadius: 2,
  },
  tbPanel: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  tbSwatchOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbTick: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // EmrAnnotationList
  al: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  alRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  alMain: {
    flex: 1,
    flexBasis: 150,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 8,
  },
  alNo: {
    minWidth: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  alSwatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  alTxt: { flex: 1, minWidth: 0, gap: 2 },
  alTool: { alignItems: 'center', justifyContent: 'center' },
  alActions: { flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', alignItems: 'center', marginLeft: 'auto', paddingRight: 4 },
  alActionBtn: { alignItems: 'center', justifyContent: 'center' },
  alActionFace: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alEmpty: {
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },

  // EmrImageTemplatePicker
  tp: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12, minWidth: 0 },
  tpHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  tpCloseBtn: { borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tpSearchWrap: { position: 'relative', justifyContent: 'center' },
  tpSearchGlass: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  tpClearBtn: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tpChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 999,
  },
  tpBody: { gap: 12 },
  tpSec: { gap: 8 },
  tpSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tpSubText: { textTransform: 'uppercase', letterSpacing: 0.6 },
  tpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
  tpItem: { position: 'relative', minWidth: 0 },
  tpTile: {
    width: '100%',
    padding: 6,
    borderRadius: 8,
    gap: 4,
  },
  tpFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpImg: { width: '100%', height: '100%' },
  tpBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tpBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  tpCheck: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpStar: {
    position: 'absolute',
    top: 2,
    right: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpStarBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpEmpty: {
    minHeight: 120,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tpEmptyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
