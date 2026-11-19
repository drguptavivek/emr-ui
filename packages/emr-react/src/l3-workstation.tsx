'use client';

import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
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
  EmrCommandCategory,
  EmrCommandItem,
  EmrCommandPaletteIntent,
  EmrCommandPaletteLabels,
  EmrCommandPaletteViewModel,
  EmrMasterDetailIntent,
  EmrMasterDetailItem,
  EmrMasterDetailLabels,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspaceLabels,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridLabels,
  EmrSynchronizedTimeGridViewModel,
  EmrTimeGridCell,
  EmrTimeGridResolution,
  EmrTimeGridTrack,
} from '@drguptavivek/emr-controller';
import { SvgIcon } from './icons';
import { ThemedInput } from './inputs-core';
import { textInputKeys, webProps, type WebKeyEvent } from './l1-interactive-shared';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import {
  COMMAND_PALETTE_CATEGORIES,
  SPLIT_WORKSPACE_PRESETS,
  TIME_GRID_RESOLUTIONS,
  canExecuteCommandItem,
  canMutateMasterDetail,
  canMutateSplitWorkspace,
  canStepTimeGridScroll,
  clampSparklineNorm,
  clampTimeGridScrollOffset,
  filterCommandPaletteItems,
  filterMasterDetailItems,
  groupCommandPaletteItems,
  isWorkstationNarrow,
  normalizeTone,
  resolveCommandPaletteHeadingId,
  resolveCommandPaletteId,
  resolveCommandPaletteLabels,
  resolveCommandPaletteListboxId,
  resolveCommandPaletteOptionId,
  resolveCommandPalettePresentation,
  resolveMasterDetailHeadingId,
  resolveMasterDetailId,
  resolveMasterDetailLabels,
  resolveSplitWorkspaceDividerBounds,
  resolveSplitWorkspaceHeadingId,
  resolveSplitWorkspaceId,
  resolveSplitWorkspaceLabels,
  resolveSplitWorkspacePresetSizes,
  resolveSynchronizedTimeGridHeadingId,
  resolveSynchronizedTimeGridId,
  resolveSynchronizedTimeGridLabels,
  resolveTimeGridVisibleColumns,
  stepCommandPaletteIndex,
  stepSplitWorkspacePaneSizes,
  toggleMasterDetailCheckedId,
  visibleSplitWorkspacePanes,
} from './l3-workstation.logic';

export type {
  EmrCommandCategory,
  EmrCommandItem,
  EmrCommandPaletteIntent,
  EmrCommandPaletteLabels,
  EmrCommandPaletteViewModel,
  EmrMasterDetailIntent,
  EmrMasterDetailItem,
  EmrMasterDetailLabels,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspaceLabels,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridLabels,
  EmrSynchronizedTimeGridViewModel,
  EmrTimeGridCell,
  EmrTimeGridResolution,
  EmrTimeGridTrack,
};

type PressState = PressableStateCallbackType & { focused?: boolean; hovered?: boolean };

const RESOLVED_MONO_FONT = (webMono: string): string | undefined =>
  Platform.OS === 'web'
    ? webMono
    : Platform.select({ ios: 'Menlo', android: 'monospace', default: webMono });

function containsDomNode(container: unknown, target: unknown): boolean {
  const el = container as { contains?: (n: unknown) => boolean } | null | undefined;
  return Boolean(el && typeof el.contains === 'function' && el.contains(target));
}

function useFocusWithinHandlers(onFocus?: () => void, onBlur?: () => void) {
  const containerRef = useRef<ComponentRef<typeof View> | null>(null);
  const focusWithinRef = useRef(false);

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

  return { containerRef, handleFocusIn, handleFocusOut };
}

// ===========================================================================
// 1. EmrSplitWorkspace — Resizable 2- or 3-pane encounter workstation layout
// ===========================================================================

export function EmrSplitWorkspace({
  model: m,
  onIntent,
  headingId,
  idPrefix = '',
  labels,
  onFocus,
  onBlur,
  panePrimary,
  paneSecondary,
  paneTertiary,
}: {
  model: EmrSplitWorkspaceViewModel;
  onIntent: (intent: EmrSplitWorkspaceIntent) => void;
  headingId?: string;
  idPrefix?: string;
  labels?: Partial<EmrSplitWorkspaceLabels>;
  onFocus?: () => void;
  onBlur?: () => void;
  panePrimary?: ReactNode;
  paneSecondary?: ReactNode;
  paneTertiary?: ReactNode;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);
  const l = resolveSplitWorkspaceLabels(labels);
  const hitSize = Math.max(44, t.controlHeight);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const { width: winWidth } = useWindowDimensions();
  const isNarrow = isWorkstationNarrow(containerWidth, winWidth);
  const { containerRef, handleFocusIn, handleFocusOut } = useFocusWithinHandlers(onFocus, onBlur);

  const rootId = resolveSplitWorkspaceId(m.id, idPrefix);
  const resolvedHeadingId = resolveSplitWorkspaceHeadingId(m.id, idPrefix, headingId);
  const panes = visibleSplitWorkspacePanes(m.panes, m.preset);
  const activeMobileId =
    m.mobileActivePaneId && panes.some((p) => p.id === m.mobileActivePaneId)
      ? m.mobileActivePaneId
      : (panes[0]?.id ?? m.panes[0]?.id ?? '');
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;

  const selectPreset = (preset: EmrSplitWorkspacePreset) => {
    if (!canMutateSplitWorkspace(m)) return;
    const count = preset === '3-pane' ? Math.min(3, m.panes.length) : Math.min(2, m.panes.length);
    const paneSizes = resolveSplitWorkspacePresetSizes(preset, count);
    onIntent({ type: 'presetChanged', preset, paneSizes });
  };

  const resizeDivider = (dividerIndex: number, deltaPct: number) => {
    if (!canMutateSplitWorkspace(m)) return;
    const paneSizes = stepSplitWorkspacePaneSizes(m.paneSizes, dividerIndex, deltaPct, panes);
    onIntent({ type: 'paneResized', dividerIndex, deltaPct, paneSizes });
  };

  const slotNodeFor = (pane: EmrSplitWorkspacePane): ReactNode => {
    if (pane.slot === 'pane-primary') return panePrimary;
    if (pane.slot === 'pane-secondary') return paneSecondary;
    return paneTertiary;
  };

  const renderedPanes = isNarrow
    ? [panes.find((p) => p.id === activeMobileId) ?? panes[0]].filter((p): p is EmrSplitWorkspacePane => Boolean(p))
    : panes;

  return (
    <View
      ref={containerRef}
      nativeID={rootId}
      role="region"
      aria-labelledby={resolvedHeadingId}
      onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
      {...webProps({ onFocus: handleFocusIn, onBlur: handleFocusOut })}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.toolbar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={[styles.rowWrap, { flexShrink: 1 }]}>
          <View style={[styles.tag, { backgroundColor: t.primary }]}>
            <Text style={{ color: t.surface, fontFamily: monoFont, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
              {l.tag}
            </Text>
          </View>
          <Text nativeID={resolvedHeadingId} style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), flexShrink: 1, minWidth: 0 }}>
            {m.title ?? l.defaultTitle}
          </Text>
        </View>

        <View style={styles.rowWrap} role="group" aria-label={l.presetsLabel} {...printHideProps}>
          {SPLIT_WORKSPACE_PRESETS.map((p) => {
            const sel = m.preset === p.id;
            const inert = Boolean(m.readOnly);
            return (
              <Pressable
                key={p.id}
                role="button"
                aria-pressed={sel}
                disabled={inert}
                accessibilityState={{ disabled: inert }}
                {...webProps({ tabIndex: 0 })}
                onPress={() => selectPreset(p.id)}
                style={({ focused, hovered }: PressState) => [
                  styles.chipBtn,
                  {
                    minHeight: hitSize,
                    minWidth: 44,
                    borderColor: sel ? t.primary : t.border,
                    backgroundColor: sel || (hovered && !inert) ? t.primarySoft : t.surface,
                    opacity: inert ? 0.5 : 1,
                  },
                  focusRing(t, focused),
                ]}
              >
                <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isNarrow ? (
          <View style={[styles.rowWrap, { width: '100%' }]} role="tablist" aria-label={l.mobileTabsLabel} {...printHideProps}>
            {m.panes.map((pane) => {
              const active = activeMobileId === pane.id;
              return (
                <Pressable
                  key={pane.id}
                  role="tab"
                  aria-selected={active}
                  onPress={() => onIntent({ type: 'mobilePaneSelected', paneId: pane.id })}
                  style={({ focused, hovered }: PressState) => [
                    styles.chipBtn,
                    {
                      minHeight: hitSize,
                      minWidth: 44,
                      borderColor: active ? t.primary : t.border,
                      backgroundColor: active || hovered ? t.primarySoft : t.surface,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <Text style={{ color: active ? t.primaryContrast : t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                    {pane.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={[styles.panesRow, isNarrow ? { flexDirection: 'column', minHeight: 0 } : null]}>
        {renderedPanes.map((pane, idx) => {
          const widthPct = pane.collapsed ? 6 : (m.paneSizes[idx] ?? Math.round(100 / Math.max(1, panes.length)));
          const slotContent = slotNodeFor(pane);
          const bounds = resolveSplitWorkspaceDividerBounds(m.paneSizes, idx, panes);
          return (
            <View
              key={pane.id}
              style={
                isNarrow
                  ? { width: '100%', minWidth: 0 }
                  : { flex: widthPct, minWidth: 0, flexDirection: 'row' }
              }
            >
              <View style={{ flex: 1, minWidth: 0, backgroundColor: t.surface }}>
                <View style={[styles.paneHeader, { borderBottomColor: t.border, backgroundColor: t.surfaceRaised }]}>
                  <View style={[styles.rowWrap, { flex: 1, minWidth: 0 }]}>
                    <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), flexShrink: 1 }}>
                      {pane.title}
                    </Text>
                    {pane.subtitle ? (
                      <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs, flexShrink: 1 }}>{pane.subtitle}</Text>
                    ) : null}
                    {pane.badge ? <EmrBadgeView badge={pane.badge} size="sm" /> : null}
                  </View>
                  {pane.collapsible !== false && !m.readOnly ? (
                    <Pressable
                      role="button"
                      aria-expanded={!pane.collapsed}
                      aria-label={`${pane.collapsed ? l.expand : l.collapse} ${pane.title}`}
                      onPress={() => onIntent({ type: 'paneCollapsedToggled', paneId: pane.id, collapsed: !pane.collapsed })}
                      {...printHideProps}
                      style={({ focused, hovered }: PressState) => [
                        styles.chipBtn,
                        {
                          minHeight: hitSize,
                          minWidth: 44,
                          borderColor: t.border,
                          backgroundColor: hovered ? t.primarySoft : t.surface,
                        },
                        focusRing(t, focused),
                      ]}
                    >
                      <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                        {pane.collapsed ? l.expand : l.collapse}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {!pane.collapsed ? (
                  <View style={{ padding: 12, gap: 6, minWidth: 0 }}>
                    {slotContent}
                    {pane.summaryItems?.map((line, i) => (
                      <View key={`${pane.id}-s-${i}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                        <View
                          aria-hidden
                          style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.textMuted, marginTop: 7, flexShrink: 0 }}
                        />
                        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, flex: 1, minWidth: 0 }}>
                          {line}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              {!isNarrow && idx < renderedPanes.length - 1 && !m.readOnly ? (
                <View
                  {...printHideProps}
                  style={[styles.divider, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
                >
                  <Pressable
                    role="button"
                    aria-label={`${l.shrinkPaneLabel} ${pane.title} by 5%`}
                    onPress={() => resizeDivider(idx, -5)}
                    style={({ focused }: PressState) => [
                      styles.stepBtn,
                      { minHeight: hitSize, minWidth: 44, borderColor: t.border, backgroundColor: t.surface },
                      focusRing(t, focused),
                    ]}
                  >
                    <SvgIcon name="chevron-left" size={16} color={t.text} />
                  </Pressable>
                  <Pressable
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`${l.resizeDividerLabel} ${idx + 1}`}
                    aria-valuemin={bounds.min}
                    aria-valuemax={bounds.max}
                    aria-valuenow={bounds.now}
                    {...webProps({
                      tabIndex: 0,
                      onKeyDown: (e: WebKeyEvent) => {
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          resizeDivider(idx, -5);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          resizeDivider(idx, 5);
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          resizeDivider(idx, -100);
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          resizeDivider(idx, 100);
                        }
                      },
                    })}
                    style={({ focused }: PressState) => [
                      { minHeight: hitSize, minWidth: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
                      focusRing(t, focused),
                    ]}
                  >
                    <SvgIcon name="more-vertical" size={16} color={t.textMuted} />
                  </Pressable>
                  <Pressable
                    role="button"
                    aria-label={`${l.growPaneLabel} ${pane.title} by 5%`}
                    onPress={() => resizeDivider(idx, 5)}
                    style={({ focused }: PressState) => [
                      styles.stepBtn,
                      { minHeight: hitSize, minWidth: 44, borderColor: t.border, backgroundColor: t.surface },
                      focusRing(t, focused),
                    ]}
                  >
                    <SvgIcon name="chevron-right" size={16} color={t.text} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// 2. EmrCommandPalette — Cmd+K / Ctrl+K quick-order, SmartPhrase & launcher
// ===========================================================================

export function EmrCommandPalette({
  model: m,
  onIntent,
  headingId,
  idPrefix = '',
  labels,
  onFocus,
  onBlur,
}: {
  model: EmrCommandPaletteViewModel;
  onIntent: (intent: EmrCommandPaletteIntent) => void;
  headingId?: string;
  idPrefix?: string;
  labels?: Partial<EmrCommandPaletteLabels>;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);
  const l = resolveCommandPaletteLabels(labels);
  const hitSize = Math.max(44, t.controlHeight);
  const { containerRef, handleFocusIn, handleFocusOut } = useFocusWithinHandlers(onFocus, onBlur);

  if (!m.open) return null;

  const presentation = resolveCommandPalettePresentation(m);
  const isModal = presentation === 'modal';
  const rootId = resolveCommandPaletteId(m.id, idPrefix);
  const resolvedHeadingId = resolveCommandPaletteHeadingId(m.id, idPrefix, headingId);
  const listboxId = resolveCommandPaletteListboxId(m.id, idPrefix);
  const filtered = filterCommandPaletteItems(m.items, m.activeCategory, m.query);
  const groups = groupCommandPaletteItems(filtered);
  const activeItem = filtered[m.activeIndex];
  const activeOptionId = activeItem ? resolveCommandPaletteOptionId(m.id, activeItem.id, idPrefix) : undefined;
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;
  const printExpandProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'expand' } } as object) : null;

  const dismiss = () => onIntent({ type: 'dismissed' });

  const handleKeyDown = (e: WebKeyEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismiss();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      const nextIdx = stepCommandPaletteIndex(filtered, m.activeIndex, delta);
      const nextItem = filtered[nextIdx];
      if (nextIdx >= 0 && nextItem) {
        onIntent({ type: 'itemHighlighted', index: nextIdx, itemId: nextItem.id });
      }
      return;
    }
    if (e.key === 'Enter') {
      const current = filtered[m.activeIndex];
      if (canExecuteCommandItem(m, current)) {
        e.preventDefault();
        onIntent({ type: 'commandExecuted', itemId: current!.id, item: current! });
      }
    }
  };

  return (
    <View
      ref={containerRef}
      {...webProps({
        onFocus: handleFocusIn,
        onBlur: handleFocusOut,
        ...(isModal ? { onClick: dismiss } : null),
      })}
      style={[
        isModal ? styles.cmdBackdropModal : styles.cmdBackdropInline,
        isModal && Platform.OS === 'web'
          ? ({
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingTop: 48,
              paddingHorizontal: 16,
              paddingBottom: 16,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
            } as unknown as object)
          : null,
      ]}
    >
      <View
        nativeID={rootId}
        role={isModal ? 'dialog' : 'region'}
        aria-modal={isModal || undefined}
        aria-labelledby={resolvedHeadingId}
        {...webProps({
          onKeyDown: handleKeyDown,
          onClick: (e: { stopPropagation?: () => void }) => e.stopPropagation?.(),
        })}
        style={[
          styles.cmdDialog,
          isModal ? { maxWidth: 680, width: '100%' } : { width: '100%', maxWidth: '100%' },
          { borderColor: t.border, backgroundColor: t.surface },
        ]}
      >
        <View style={[styles.cmdHead, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
          <View style={styles.rowBetween}>
            <View style={[styles.rowWrap, { flex: 1, minWidth: 0 }]}>
              <View style={[styles.kbdBadge, { borderColor: t.border, backgroundColor: t.surfaceRaised }]} {...printHideProps}>
                <Text style={{ color: t.text, fontFamily: monoFont, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
                  ⌘K
                </Text>
              </View>
              <Text nativeID={resolvedHeadingId} style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), flex: 1, minWidth: 0 }}>
                {m.title ?? l.defaultTitle}
              </Text>
            </View>
            <Pressable
              role="button"
              aria-label={l.closeLabel}
              onPress={dismiss}
              {...printHideProps}
              style={({ focused, hovered }: PressState) => [
                styles.chipBtn,
                {
                  minHeight: hitSize,
                  minWidth: 44,
                  borderColor: t.border,
                  backgroundColor: hovered ? t.primarySoft : t.surface,
                },
                focusRing(t, focused),
              ]}
            >
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                Esc
              </Text>
              <SvgIcon name="close" size={14} color={t.textMuted} />
            </Pressable>
          </View>

          <ThemedInput
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={m.open}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            aria-label={l.searchLabel}
            value={m.query}
            placeholder={m.placeholder ?? l.defaultPlaceholder}
            onChangeText={(query) => onIntent({ type: 'queryChanged', query })}
            {...textInputKeys(handleKeyDown)}
            {...printHideProps}
          />

          <View style={styles.rowWrap} role="tablist" aria-label={l.categoriesLabel} {...printHideProps}>
            {COMMAND_PALETTE_CATEGORIES.map((cat) => {
              const sel = m.activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  role="tab"
                  aria-selected={sel}
                  onPress={() => onIntent({ type: 'categoryChanged', category: cat.id })}
                  style={({ focused, hovered }: PressState) => [
                    styles.chipBtn,
                    {
                      minHeight: hitSize,
                      minWidth: 44,
                      borderColor: sel ? t.primary : t.border,
                      backgroundColor: sel || hovered ? t.primarySoft : t.surface,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView style={{ maxHeight: 360 }} {...printExpandProps}>
          <View
            nativeID={listboxId}
            role="list"
            {...webProps({ role: 'listbox' })}
            aria-label={l.resultsLabel}
            style={{ padding: 8 }}
          >
            {filtered.length === 0 ? (
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textSm, padding: 16, textAlign: 'center' }}>
                {m.emptyMessage ?? l.emptyMessage}
              </Text>
            ) : (
              groups.map((group) => (
                <View key={group.label} style={{ marginBottom: 8, gap: 4 }}>
                  <Text style={{ color: t.textMuted, fontFamily: monoFont, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold), paddingHorizontal: 8 }}>
                    {group.label}
                  </Text>
                  {group.items.map(({ item, flatIndex }) => {
                    const active = flatIndex === m.activeIndex;
                    const inert = Boolean(item.disabled || m.readOnly);
                    const optId = resolveCommandPaletteOptionId(m.id, item.id, idPrefix);
                    return (
                      <Pressable
                        key={item.id}
                        nativeID={optId}
                        role="option"
                        aria-selected={active}
                        disabled={inert}
                        accessibilityState={{ selected: active, disabled: inert }}
                        onPress={() => {
                          if (canExecuteCommandItem(m, item)) {
                            onIntent({ type: 'commandExecuted', itemId: item.id, item });
                          }
                        }}
                        {...webProps({
                          tabIndex: 0,
                          onMouseEnter: () => {
                            if (!item.disabled) {
                              onIntent({ type: 'itemHighlighted', index: flatIndex, itemId: item.id });
                            }
                          },
                        })}
                        style={({ focused, hovered }: PressState) => [
                          styles.cmdItem,
                          {
                            minHeight: hitSize,
                            borderColor: active ? t.primary : 'transparent',
                            backgroundColor: active || (hovered && !inert) ? t.primarySoft : 'transparent',
                            opacity: inert ? 0.5 : 1,
                          },
                          focusRing(t, focused),
                        ]}
                      >
                        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                          <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                            {item.label}
                          </Text>
                          {item.subtitle ? (
                            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{item.subtitle}</Text>
                          ) : null}
                        </View>
                        <View style={styles.rowWrap}>
                          {item.pinned ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <SvgIcon name="star-filled" size={12} color={t.warning} filled />
                              <Text style={{ color: t.warning, fontFamily: ff, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
                                {l.pinnedLabel}
                              </Text>
                            </View>
                          ) : item.recent ? (
                            <Text style={{ color: t.info, fontFamily: ff, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
                              {l.recentLabel}
                            </Text>
                          ) : null}
                          {item.badge ? <EmrBadgeView badge={item.badge} size="sm" /> : null}
                          {item.shortcut ? (
                            <View style={[styles.kbdBadge, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
                              <Text style={{ color: t.text, fontFamily: monoFont, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
                                {item.shortcut}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ===========================================================================
// 3. EmrMasterDetail — Split inbox / work-queue master list + detail inspector
// ===========================================================================

export function EmrMasterDetail({
  model: m,
  onIntent,
  headingId,
  idPrefix = '',
  labels,
  onFocus,
  onBlur,
  masterSlot,
  detailSlot,
}: {
  model: EmrMasterDetailViewModel;
  onIntent: (intent: EmrMasterDetailIntent) => void;
  headingId?: string;
  idPrefix?: string;
  labels?: Partial<EmrMasterDetailLabels>;
  onFocus?: () => void;
  onBlur?: () => void;
  masterSlot?: ReactNode;
  detailSlot?: ReactNode;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const l = resolveMasterDetailLabels(labels);
  const hitSize = Math.max(44, t.controlHeight);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const { width: winWidth } = useWindowDimensions();
  const isNarrow = isWorkstationNarrow(containerWidth, winWidth);
  const { containerRef, handleFocusIn, handleFocusOut } = useFocusWithinHandlers(onFocus, onBlur);
  const masterBtnRefs = useRef<Record<string, { focus?: () => void } | null>>({});
  const prevMobileDetailRef = useRef(Boolean(m.mobileDetailOpen));

  useEffect(() => {
    const wasOpen = prevMobileDetailRef.current;
    const isOpen = Boolean(m.mobileDetailOpen);
    prevMobileDetailRef.current = isOpen;
    if (Platform.OS === 'web' && wasOpen && !isOpen) {
      const targetId = m.selectedId ?? filterMasterDetailItems(m.items, m.activeFilterId, m.searchQuery)[0]?.id;
      if (targetId && typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => masterBtnRefs.current[targetId]?.focus?.());
      }
    }
  }, [m.mobileDetailOpen, m.selectedId, m.items, m.activeFilterId, m.searchQuery]);

  const rootId = resolveMasterDetailId(m.id, idPrefix);
  const resolvedHeadingId = resolveMasterDetailHeadingId(m.id, idPrefix, headingId);
  const filtered = filterMasterDetailItems(m.items, m.activeFilterId, m.searchQuery);
  const selectedItem = m.items.find((item) => item.id === m.selectedId);
  const checkedIds = m.checkedIds ?? [];
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;

  const showMaster = !isNarrow || !m.mobileDetailOpen;
  const showDetail = !isNarrow || Boolean(m.mobileDetailOpen);

  return (
    <View
      ref={containerRef}
      nativeID={rootId}
      role="region"
      aria-labelledby={resolvedHeadingId}
      onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
      {...webProps({ onFocus: handleFocusIn, onBlur: handleFocusOut })}
      style={[
        styles.card,
        {
          borderColor: t.border,
          backgroundColor: t.surface,
          flexDirection: isNarrow ? 'column' : 'row',
        },
      ]}
    >
      {showMaster ? (
        <View
          style={{
            flex: isNarrow ? undefined : 1,
            width: isNarrow ? '100%' : undefined,
            minWidth: isNarrow ? 0 : 260,
            borderRightWidth: isNarrow ? 0 : 1,
            borderRightColor: t.border,
          }}
        >
          <View style={{ padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.surfaceSoft }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text nativeID={resolvedHeadingId} style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                  {m.title}
                </Text>
                {m.subtitle ? (
                  <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{m.subtitle}</Text>
                ) : null}
              </View>
              {m.batchActions?.length && checkedIds.length > 0 && !m.readOnly ? (
                <View style={styles.rowWrap} {...printHideProps}>
                  {m.batchActions.map((act) => (
                    <EmrButton
                      key={act.id}
                      small
                      variant={act.primary ? 'primary' : 'secondary'}
                      label={`${act.label} (${checkedIds.length})`}
                      onPress={() => onIntent({ type: 'actionTriggered', actionId: act.id, itemIds: checkedIds })}
                    />
                  ))}
                </View>
              ) : null}
            </View>

            <ThemedInput
              aria-label={l.searchLabel}
              value={m.searchQuery}
              placeholder={m.searchPlaceholder ?? l.searchPlaceholder}
              onChangeText={(query) => onIntent({ type: 'searchChanged', query })}
              {...printHideProps}
            />

            {m.filters.length ? (
              <View style={styles.rowWrap} role="tablist" aria-label={l.filtersLabel} {...printHideProps}>
                {m.filters.map((f) => {
                  const sel = m.activeFilterId === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      role="tab"
                      aria-selected={sel}
                      onPress={() => onIntent({ type: 'filterChanged', filterId: f.id })}
                      style={({ focused, hovered }: PressState) => [
                        styles.chipBtn,
                        {
                          minHeight: hitSize,
                          minWidth: 44,
                          borderColor: sel ? t.primary : t.border,
                          backgroundColor: sel || hovered ? t.primarySoft : t.surface,
                        },
                        focusRing(t, focused),
                      ]}
                    >
                      <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                        {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          {masterSlot}

          <View role="list" aria-label={`${m.title}${l.listLabelSuffix}`}>
            {filtered.length === 0 ? (
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textSm, padding: 16 }}>
                {m.emptyListMessage ?? l.emptyListMessage}
              </Text>
            ) : (
              filtered.map((item) => {
                const sel = item.id === m.selectedId;
                const checked = checkedIds.includes(item.id);
                return (
                  <View
                    key={item.id}
                    role="listitem"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: t.border,
                      backgroundColor: sel ? t.primarySoft : 'transparent',
                    }}
                  >
                    {!m.readOnly ? (
                      <Pressable
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={`Select ${item.title}`}
                        onPress={() => {
                          if (!canMutateMasterDetail(m)) return;
                          const nextChecked = toggleMasterDetailCheckedId(checkedIds, item.id);
                          onIntent({ type: 'batchSelectionToggled', itemId: item.id, checkedIds: nextChecked });
                        }}
                        {...printHideProps}
                        style={({ focused }: PressState) => [
                          {
                            minHeight: hitSize,
                            minWidth: hitSize,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 6,
                          },
                          focusRing(t, focused),
                        ]}
                      >
                        <View
                          aria-hidden
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: checked ? t.primary : t.border,
                            backgroundColor: checked ? t.primary : t.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {checked ? <SvgIcon name="check" size={12} color={t.surface} /> : null}
                        </View>
                      </Pressable>
                    ) : null}

                    <Pressable
                      ref={(el) => {
                        masterBtnRefs.current[item.id] = el as unknown as { focus?: () => void } | null;
                      }}
                      role="button"
                      aria-current={sel ? 'true' : undefined}
                      onPress={() => onIntent({ type: 'itemSelected', itemId: item.id })}
                      style={({ focused }: PressState) => [
                        {
                          flex: 1,
                          minWidth: 0,
                          minHeight: hitSize,
                          paddingVertical: 4,
                          paddingHorizontal: 6,
                          borderRadius: 6,
                          gap: 4,
                        },
                        focusRing(t, focused),
                      ]}
                    >
                      <View style={[styles.rowBetween, { flexWrap: 'wrap' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          {item.unread ? (
                            <View
                              aria-label={l.unreadLabel}
                              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.primary, flexShrink: 0 }}
                            />
                          ) : null}
                          <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), flexShrink: 1 }}>
                            {item.title}
                          </Text>
                        </View>
                        {item.timestampLabel ? (
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{item.timestampLabel}</Text>
                        ) : null}
                      </View>
                      {item.subtitle ? (
                        <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{item.subtitle}</Text>
                      ) : null}
                      <View style={styles.rowWrap}>
                        {item.priorityBadge ? <EmrBadgeView badge={item.priorityBadge} size="sm" /> : null}
                        {item.statusBadge ? <EmrBadgeView badge={item.statusBadge} size="sm" /> : null}
                      </View>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </View>
      ) : null}

      {showDetail ? (
        <View
          role="region"
          aria-label={l.detailLabel}
          style={{ flex: isNarrow ? undefined : 1.5, width: isNarrow ? '100%' : undefined, minWidth: 0, padding: 16, gap: 12 }}
        >
          {isNarrow ? (
            <View style={styles.rowBetween} {...printHideProps}>
              <Pressable
                role="button"
                aria-label={l.backToList}
                onPress={() => onIntent({ type: 'detailClosed' })}
                style={({ focused, hovered }: PressState) => [
                  styles.chipBtn,
                  {
                    minHeight: hitSize,
                    minWidth: 44,
                    borderColor: t.border,
                    backgroundColor: hovered ? t.primarySoft : t.surface,
                  },
                  focusRing(t, focused),
                ]}
              >
                <SvgIcon name="arrow-left" size={16} color={t.text} />
                <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                  {l.backToList}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {detailSlot}

          {selectedItem ? (
            <View style={{ gap: 12 }}>
              <View style={[styles.rowBetween, { flexWrap: 'wrap', borderBottomWidth: 1, borderBottomColor: t.border, paddingBottom: 10 }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }}>
                    {selectedItem.title}
                  </Text>
                  {selectedItem.subtitle ? (
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{selectedItem.subtitle}</Text>
                  ) : null}
                </View>
                <View style={styles.rowWrap}>
                  {selectedItem.priorityBadge ? <EmrBadgeView badge={selectedItem.priorityBadge} size="sm" /> : null}
                  {selectedItem.statusBadge ? <EmrBadgeView badge={selectedItem.statusBadge} size="sm" /> : null}
                </View>
              </View>

              {selectedItem.summaryFields?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 10, borderRadius: 8, backgroundColor: t.surfaceSoft }}>
                  {selectedItem.summaryFields.map((f) => (
                    <View key={f.label} style={{ minWidth: 120 }}>
                      <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
                        {f.label}
                      </Text>
                      <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                        {f.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {selectedItem.detailBody ? (
                <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm }}>{selectedItem.detailBody}</Text>
              ) : null}

              {selectedItem.actions?.length && !m.readOnly ? (
                <View style={styles.rowWrap} {...printHideProps}>
                  {selectedItem.actions.map((act) => (
                    <EmrButton
                      key={act.id}
                      small
                      variant={act.primary ? 'primary' : 'secondary'}
                      label={act.label}
                      onPress={() => onIntent({ type: 'actionTriggered', actionId: act.id, itemIds: [selectedItem.id] })}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textSm }}>
              {m.emptyDetailMessage ?? l.emptyDetailMessage}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

// ===========================================================================
// 4. EmrSynchronizedTimeGrid — Scroll-synced longitudinal clinical time grid
// ===========================================================================

export function EmrSynchronizedTimeGrid({
  model: m,
  onIntent,
  headingId,
  idPrefix = '',
  labels,
  onFocus,
  onBlur,
}: {
  model: EmrSynchronizedTimeGridViewModel;
  onIntent: (intent: EmrSynchronizedTimeGridIntent) => void;
  headingId?: string;
  idPrefix?: string;
  labels?: Partial<EmrSynchronizedTimeGridLabels>;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const monoFont = RESOLVED_MONO_FONT(t.fontMono);
  const l = resolveSynchronizedTimeGridLabels(labels);
  const hitSize = Math.max(44, t.controlHeight);
  const { containerRef, handleFocusIn, handleFocusOut } = useFocusWithinHandlers(onFocus, onBlur);

  const rootId = resolveSynchronizedTimeGridId(m.id, idPrefix);
  const resolvedHeadingId = resolveSynchronizedTimeGridHeadingId(m.id, idPrefix, headingId);
  const resolutions = m.availableResolutions ?? TIME_GRID_RESOLUTIONS;
  const visibleColumns = resolveTimeGridVisibleColumns(m.columns, m.scrollOffset, m.visibleColumnCount);
  const canEarlier = !m.readOnly && canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, -1);
  const canLater = !m.readOnly && canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, 1);

  const tabularStyle =
    Platform.OS === 'web'
      ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object)
      : ({ fontFamily: monoFont, fontVariant: ['tabular-nums'] } as object);
  const stickyLeadStyle =
    Platform.OS === 'web'
      ? ({ position: 'sticky', left: 0, zIndex: 2 } as unknown as object)
      : null;
  const printHideProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null;
  const printExpandProps = Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'expand' } } as object) : null;

  const stepScroll = (delta: -1 | 1) => {
    if (m.readOnly) return;
    if (!canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, delta)) return;
    const count = m.visibleColumnCount ?? m.columns.length;
    const offset = clampTimeGridScrollOffset(m.scrollOffset + delta, m.columns.length, count);
    onIntent({ type: 'scrollOffsetChanged', offset });
  };

  return (
    <View
      ref={containerRef}
      nativeID={rootId}
      role="region"
      aria-labelledby={resolvedHeadingId}
      {...webProps({ onFocus: handleFocusIn, onBlur: handleFocusOut })}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.toolbar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={{ flexShrink: 1, flexGrow: 1, flexBasis: 180, minWidth: 0, maxWidth: '100%' }}>
          <Text nativeID={resolvedHeadingId} style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), flexShrink: 1 }}>
            {m.title}
          </Text>
          {m.subtitle ? (
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs, flexShrink: 1 }}>{m.subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.rowWrap} {...printHideProps}>
          <View style={styles.rowWrap} role="group" aria-label={l.resolutionGroupLabel}>
            {resolutions.map((res) => {
              const sel = m.resolution === res;
              const inert = Boolean(m.readOnly);
              return (
                <Pressable
                  key={res}
                  role="button"
                  aria-pressed={sel}
                  disabled={inert}
                  accessibilityState={{ disabled: inert }}
                  {...webProps({ tabIndex: 0 })}
                  onPress={() => {
                    if (!m.readOnly) onIntent({ type: 'resolutionChanged', resolution: res });
                  }}
                  style={({ focused, hovered }: PressState) => [
                    styles.chipBtn,
                    {
                      minHeight: hitSize,
                      minWidth: 44,
                      borderColor: sel ? t.primary : t.border,
                      backgroundColor: sel || (hovered && !inert) ? t.primarySoft : t.surface,
                      opacity: inert ? 0.5 : 1,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                    {res}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.rowWrap} role="group" aria-label={l.scrollGroupLabel}>
            <Pressable
              role="button"
              aria-label={`Scroll ${l.earlier.toLowerCase()}`}
              disabled={!canEarlier}
              accessibilityState={{ disabled: !canEarlier }}
              {...webProps({ tabIndex: 0 })}
              onPress={() => stepScroll(-1)}
              style={({ focused }: PressState) => [
                styles.chipBtn,
                {
                  minHeight: hitSize,
                  minWidth: 44,
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  opacity: canEarlier ? 1 : 0.5,
                },
                focusRing(t, focused),
              ]}
            >
              <SvgIcon name="chevron-left" size={16} color={t.text} />
              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                {l.earlier}
              </Text>
            </Pressable>
            <Text style={[tabularStyle, { color: t.textMuted, fontFamily: monoFont, fontSize: t.textXs }]}>
              Col +{m.scrollOffset}
            </Text>
            <Pressable
              role="button"
              aria-label={`Scroll ${l.later.toLowerCase()}`}
              disabled={!canLater}
              accessibilityState={{ disabled: !canLater }}
              {...webProps({ tabIndex: 0 })}
              onPress={() => stepScroll(1)}
              style={({ focused }: PressState) => [
                styles.chipBtn,
                {
                  minHeight: hitSize,
                  minWidth: 44,
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  opacity: canLater ? 1 : 0.5,
                },
                focusRing(t, focused),
              ]}
            >
              <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                {l.later}
              </Text>
              <SvgIcon name="chevron-right" size={16} color={t.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView horizontal style={{ maxWidth: '100%' }} contentContainerStyle={{ minWidth: '100%' }} {...printExpandProps}>
        <View style={{ minWidth: 124 + visibleColumns.length * 108, width: '100%' }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.surfaceRaised }}>
            <View style={[stickyLeadStyle, { width: 124, minWidth: 124, maxWidth: 124, padding: 8, borderRightWidth: 1, borderRightColor: t.border, backgroundColor: t.surfaceRaised, justifyContent: 'center' }]}>
              <Text style={[tabularStyle, { color: t.textMuted, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }]}>
                {l.timeAxisPrefix} ({m.resolution})
              </Text>
            </View>
            {visibleColumns.map((col) => {
              const sel = col.id === m.selectedColumnId;
              const inert = Boolean(m.readOnly);
              return (
                <Pressable
                  key={col.id}
                  role="button"
                  aria-pressed={sel}
                  disabled={inert}
                  accessibilityState={{ disabled: inert }}
                  {...webProps({ tabIndex: 0 })}
                  onPress={() => {
                    if (!m.readOnly) onIntent({ type: 'columnSelected', columnId: col.id });
                  }}
                  style={({ focused }: PressState) => [
                    {
                      width: 108,
                      minWidth: 108,
                      flexGrow: 1,
                      flexShrink: 0,
                      minHeight: hitSize,
                      padding: 6,
                      borderRightWidth: 1,
                      borderRightColor: t.border,
                      backgroundColor: col.isCurrentTime || sel ? t.primarySoft : t.surfaceRaised,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <Text style={[tabularStyle, { color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }]}>
                    {col.label}
                  </Text>
                  {col.shiftBadge ? (
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.text2xs }}>{col.shiftBadge}</Text>
                  ) : null}
                  {col.encounterBadge ? (
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.text2xs }}>{col.encounterBadge}</Text>
                  ) : null}
                  {col.isCurrentTime ? (
                    <Text style={{ color: t.primary, fontFamily: ff, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
                      {l.nowBadge}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {m.tracks.map((track) => (
            <View key={track.id}>
              <Pressable
                role="button"
                aria-expanded={!track.collapsed}
                onPress={() => onIntent({ type: 'trackToggled', trackId: track.id, collapsed: !track.collapsed })}
                style={({ focused }: PressState) => [
                  {
                    minHeight: hitSize,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: t.surfaceAccent,
                    borderBottomWidth: 1,
                    borderBottomColor: t.border,
                  },
                  focusRing(t, focused),
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <SvgIcon name={track.collapsed ? 'chevron-right' : 'chevron-down'} size={16} color={t.text} />
                  <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                    {track.title}
                  </Text>
                  {track.badge ? <EmrBadgeView badge={track.badge} size="sm" /> : null}
                </View>
                <Text style={{ color: t.textMuted, fontFamily: monoFont, fontSize: t.text2xs }}>
                  {track.kind.toUpperCase()}
                </Text>
              </Pressable>

              {!track.collapsed
                ? track.rows.map((row) => (
                    <View key={row.id} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border }}>
                      <View style={[stickyLeadStyle, { width: 124, minWidth: 124, maxWidth: 124, padding: 8, borderRightWidth: 1, borderRightColor: t.border, backgroundColor: t.surfaceRaised, justifyContent: 'center', gap: 2 }]}>
                        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                          {row.label}
                        </Text>
                        {row.unitLabel ? (
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.text2xs }}>{row.unitLabel}</Text>
                        ) : null}
                        {row.referenceRangeLabel ? (
                          <Text style={[tabularStyle, { color: t.textMuted, fontFamily: ff, fontSize: t.text2xs }]}>
                            {row.referenceRangeLabel}
                          </Text>
                        ) : null}
                      </View>

                      {visibleColumns.map((col) => {
                        const cell = row.cells[col.id];
                        const cellSel =
                          m.selectedCell?.trackId === track.id &&
                          m.selectedCell?.rowId === row.id &&
                          m.selectedCell?.columnId === col.id;
                        const spark = clampSparklineNorm(cell?.sparklineNorm);
                        const tone = cell?.abnormalTone ? toneColors(t, normalizeTone(cell.abnormalTone)) : null;
                        const bgColor = cellSel
                          ? t.primarySoft
                          : tone
                            ? tone.backgroundColor
                            : t.surface;
                        const fgColor = tone ? tone.color : t.text;
                        const inert = Boolean(m.readOnly);
                        return (
                          <Pressable
                            key={col.id}
                            role="button"
                            aria-pressed={cellSel}
                            disabled={inert}
                            accessibilityState={{ disabled: inert }}
                            {...webProps({
                              ...(cell?.note ? { title: cell.note } : null),
                              tabIndex: 0,
                            })}
                            onPress={() => {
                              if (!m.readOnly) {
                                onIntent({
                                  type: 'cellSelected',
                                  trackId: track.id,
                                  rowId: row.id,
                                  columnId: col.id,
                                  cell,
                                });
                              }
                            }}
                            style={({ focused }: PressState) => [
                              {
                                width: 108,
                                minWidth: 108,
                                flexGrow: 1,
                                flexShrink: 0,
                                minHeight: hitSize,
                                padding: 6,
                                borderRightWidth: 1,
                                borderRightColor: t.border,
                                backgroundColor: bgColor,
                                borderWidth: cellSel ? 2 : 0,
                                borderColor: cellSel ? t.primary : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 3,
                              },
                              focusRing(t, focused),
                            ]}
                          >
                            {cell ? (
                              <>
                                <Text style={[tabularStyle, { color: fgColor, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }]}>
                                  {cell.valueLabel}
                                </Text>
                                {cell.secondaryLabel ? (
                                  <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.text2xs }}>{cell.secondaryLabel}</Text>
                                ) : null}
                                {cell.badge ? <EmrBadgeView badge={cell.badge} size="sm" /> : null}
                                {spark !== null ? (
                                  <View aria-hidden style={{ width: '100%', maxWidth: 84, height: 4, borderRadius: 999, backgroundColor: t.neutralSoft, overflow: 'hidden' }}>
                                    <View
                                      style={{
                                        width: `${Math.round(spark * 100)}%`,
                                        height: '100%',
                                        borderRadius: 999,
                                        backgroundColor: tone ? tone.color : t.primary,
                                      }}
                                    />
                                  </View>
                                ) : null}
                                {cell.note ? (
                                  <Text numberOfLines={1} style={{ color: t.textMuted, fontFamily: ff, fontSize: t.text2xs, maxWidth: 96 }}>
                                    {cell.note}
                                  </Text>
                                ) : null}
                              </>
                            ) : (
                              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>—</Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  ))
                : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 0,
    maxWidth: '100%',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    maxWidth: '100%',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
    maxWidth: '100%',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  panesRow: {
    flexDirection: 'row',
    minHeight: 260,
    minWidth: 0,
  },
  paneHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  divider: {
    width: 48,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  stepBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  cmdBackdropModal: {
    padding: 16,
    flex: 1,
  },
  cmdBackdropInline: {
    minWidth: 0,
    maxWidth: '100%',
  },
  cmdDialog: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 0,
  },
  cmdHead: {
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    minWidth: 0,
  },
  kbdBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  cmdItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 0,
  },
});
