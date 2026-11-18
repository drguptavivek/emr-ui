'use client';

import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  EmrCommandCategory,
  EmrCommandItem,
  EmrCommandPaletteIntent,
  EmrCommandPaletteViewModel,
  EmrMasterDetailIntent,
  EmrMasterDetailItem,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridViewModel,
  EmrTimeGridCell,
  EmrTimeGridResolution,
  EmrTimeGridTrack,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { webProps, type WebKeyEvent } from './l1-interactive-shared';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';
import {
  COMMAND_PALETTE_CATEGORIES,
  SPLIT_WORKSPACE_PRESETS,
  TIME_GRID_RESOLUTIONS,
  clampTimeGridScrollOffset,
  filterCommandPaletteItems,
  filterMasterDetailItems,
  groupCommandPaletteItems,
  resolveSplitWorkspacePresetSizes,
  stepCommandPaletteIndex,
  stepSplitWorkspacePaneSizes,
  toggleMasterDetailCheckedId,
  visibleSplitWorkspacePanes,
} from './l3-workstation.logic';

export type {
  EmrCommandCategory,
  EmrCommandItem,
  EmrCommandPaletteIntent,
  EmrCommandPaletteViewModel,
  EmrMasterDetailIntent,
  EmrMasterDetailItem,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridViewModel,
  EmrTimeGridCell,
  EmrTimeGridResolution,
  EmrTimeGridTrack,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

// ===========================================================================
// 1. EmrSplitWorkspace — Resizable 2- or 3-pane encounter workstation layout
// ===========================================================================

export function EmrSplitWorkspace({
  model: m,
  onIntent,
  headingId,
  panePrimary,
  paneSecondary,
  paneTertiary,
}: {
  model: EmrSplitWorkspaceViewModel;
  onIntent: (intent: EmrSplitWorkspaceIntent) => void;
  headingId?: string;
  panePrimary?: ReactNode;
  paneSecondary?: ReactNode;
  paneTertiary?: ReactNode;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const panes = visibleSplitWorkspacePanes(m.panes, m.preset);
  const activeMobileId = m.mobileActivePaneId ?? m.panes[0]?.id ?? '';

  const selectPreset = (preset: EmrSplitWorkspacePreset) => {
    if (m.readOnly) return;
    const count = preset === '3-pane' ? Math.min(3, m.panes.length) : Math.min(2, m.panes.length);
    const paneSizes = resolveSplitWorkspacePresetSizes(preset, count);
    onIntent({ type: 'presetChanged', preset, paneSizes });
  };

  const resizeDivider = (dividerIndex: number, deltaPct: number) => {
    if (m.readOnly) return;
    const paneSizes = stepSplitWorkspacePaneSizes(m.paneSizes, dividerIndex, deltaPct);
    onIntent({ type: 'paneResized', dividerIndex, deltaPct, paneSizes });
  };

  const slotNodeFor = (pane: EmrSplitWorkspacePane): ReactNode => {
    if (pane.slot === 'pane-primary') return panePrimary;
    if (pane.slot === 'pane-secondary') return paneSecondary;
    return paneTertiary;
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : (m.title ?? 'Clinical Split Workstation')}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      {/* Workstation Header & Preset Bar */}
      <View style={[styles.toolbar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={styles.rowWrap}>
          <View style={[styles.tag, { backgroundColor: t.primary }]}>
            <Text style={{ color: t.surface, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
              WORKSTATION
            </Text>
          </View>
          <Text nativeID={headingId} style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
            {m.title ?? 'Clinical Encounter Split Workspace'}
          </Text>
        </View>

        <View style={styles.rowWrap} role="group" aria-label="Workspace layout presets">
          {SPLIT_WORKSPACE_PRESETS.map((p) => {
            const sel = m.preset === p.id;
            return (
              <Pressable
                key={p.id}
                role="button"
                aria-pressed={sel}
                disabled={m.readOnly}
                onPress={() => selectPreset(p.id)}
                style={({ focused }: PressState) => [
                  styles.chipBtn,
                  { borderColor: sel ? t.primary : t.border, backgroundColor: sel ? t.primarySoft : t.surface },
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

        {/* Mobile Tab Switcher */}
        <View style={styles.rowWrap} role="tablist" aria-label="Mobile workspace panes">
          {m.panes.map((pane) => {
            const active = activeMobileId === pane.id;
            return (
              <Pressable
                key={pane.id}
                role="tab"
                aria-selected={active}
                onPress={() => onIntent({ type: 'mobilePaneSelected', paneId: pane.id })}
                style={({ focused }: PressState) => [
                  styles.chipBtn,
                  { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primarySoft : t.surface },
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
      </View>

      {/* Multi-Pane Split Body */}
      <View style={styles.panesRow}>
        {panes.map((pane, idx) => {
          const widthPct = pane.collapsed ? 6 : (m.paneSizes[idx] ?? Math.round(100 / Math.max(1, panes.length)));
          const slotContent = slotNodeFor(pane);
          return (
            <View key={pane.id} style={{ flex: widthPct, minWidth: pane.collapsed ? 56 : 160, flexDirection: 'row' }}>
              <View style={{ flex: 1, backgroundColor: t.surface }}>
                <View style={[styles.paneHeader, { borderBottomColor: t.border, backgroundColor: t.surfaceRaised }]}>
                  <View style={styles.rowWrap}>
                    <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                      {pane.title}
                    </Text>
                    {pane.subtitle ? (
                      <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{pane.subtitle}</Text>
                    ) : null}
                    {pane.badge ? <EmrBadgeView badge={pane.badge} /> : null}
                  </View>
                  {pane.collapsible !== false && !m.readOnly ? (
                    <Pressable
                      role="button"
                      aria-expanded={!pane.collapsed}
                      aria-label={`${pane.collapsed ? 'Expand' : 'Collapse'} ${pane.title}`}
                      onPress={() => onIntent({ type: 'paneCollapsedToggled', paneId: pane.id, collapsed: !pane.collapsed })}
                      style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
                    >
                      <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>
                        {pane.collapsed ? 'Expand' : 'Collapse'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {!pane.collapsed ? (
                  <View style={{ padding: 12, gap: 6 }}>
                    {slotContent}
                    {pane.summaryItems?.map((line, i) => (
                      <Text key={`${pane.id}-s-${i}`} style={{ color: t.text, fontFamily: ff, fontSize: t.textSm }}>
                        • {line}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>

              {idx < panes.length - 1 && !m.readOnly ? (
                <View
                  role="separator"
                  aria-label={`Resize divider ${idx + 1}`}
                  {...webProps({
                    tabIndex: 0,
                    onKeyDown: (e: WebKeyEvent) => {
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        resizeDivider(idx, -5);
                      } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        resizeDivider(idx, 5);
                      }
                    },
                  })}
                  style={[styles.divider, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}
                >
                  <Pressable
                    role="button"
                    aria-label={`Shrink ${pane.title} by 5%`}
                    onPress={() => resizeDivider(idx, -5)}
                    style={[styles.stepBtn, { borderColor: t.border, backgroundColor: t.surface }]}
                  >
                    <Text style={{ color: t.text, fontSize: 11 }}>‹</Text>
                  </Pressable>
                  <Text style={{ color: t.textMuted, fontSize: 11 }}>⋮</Text>
                  <Pressable
                    role="button"
                    aria-label={`Grow ${pane.title} by 5%`}
                    onPress={() => resizeDivider(idx, 5)}
                    style={[styles.stepBtn, { borderColor: t.border, backgroundColor: t.surface }]}
                  >
                    <Text style={{ color: t.text, fontSize: 11 }}>›</Text>
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
}: {
  model: EmrCommandPaletteViewModel;
  onIntent: (intent: EmrCommandPaletteIntent) => void;
  headingId?: string;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  if (!m.open) return null;

  const filtered = filterCommandPaletteItems(m.items, m.activeCategory, m.query);
  const groups = groupCommandPaletteItems(filtered);

  const handleKeyDown = (e: WebKeyEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onIntent({ type: 'dismissed' });
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
      if (current && !current.disabled && !m.readOnly) {
        e.preventDefault();
        onIntent({ type: 'commandExecuted', itemId: current.id, item: current });
      }
    }
  };

  return (
    <View style={[styles.cmdBackdrop, { backgroundColor: t.surfaceAccent }]}>
      <View
        role="dialog"
        aria-labelledby={headingId}
        aria-label={headingId ? undefined : (m.title ?? 'Clinical Command Palette')}
        {...webProps({ onKeyDown: handleKeyDown })}
        style={[styles.cmdDialog, { borderColor: t.border, backgroundColor: t.surface }]}
      >
        <View style={[styles.cmdHead, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
          <View style={styles.rowBetween}>
            <View style={styles.rowWrap}>
              <View style={[styles.kbdBadge, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
                <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>⌘K</Text>
              </View>
              <Text nativeID={headingId} style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                {m.title ?? 'Quick Orders, SmartPhrases & Navigation'}
              </Text>
            </View>
            <Pressable
              role="button"
              aria-label="Close command palette (Escape)"
              onPress={() => onIntent({ type: 'dismissed' })}
              style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>Esc ✕</Text>
            </Pressable>
          </View>

          <ThemedInput
            aria-label="Search clinical commands"
            value={m.query}
            placeholder={m.placeholder ?? 'Type a command, order, SmartPhrase (.iop), or patient route...'}
            onChangeText={(query) => onIntent({ type: 'queryChanged', query })}
          />

          <View style={styles.rowWrap} role="tablist" aria-label="Command categories">
            {COMMAND_PALETTE_CATEGORIES.map((cat) => {
              const sel = m.activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  role="tab"
                  aria-selected={sel}
                  onPress={() => onIntent({ type: 'categoryChanged', category: cat.id })}
                  style={[
                    styles.chipBtn,
                    { borderColor: sel ? t.primary : t.border, backgroundColor: sel ? t.primarySoft : t.surface },
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

        <ScrollView style={{ maxHeight: 360, padding: 8 }} role="list" aria-label="Matching clinical commands">
          {filtered.length === 0 ? (
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textSm, padding: 16, textAlign: 'center' }}>
              {m.emptyMessage ?? 'No matching commands, orders, or SmartPhrases.'}
            </Text>
          ) : (
            groups.map((group) => (
              <View key={group.label} style={{ marginBottom: 8, gap: 4 }}>
                <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold), paddingHorizontal: 8 }}>
                  {group.label}
                </Text>
                {group.items.map(({ item, flatIndex }) => {
                  const active = flatIndex === m.activeIndex;
                  return (
                    <Pressable
                      key={item.id}
                      role="option"
                      aria-selected={active}
                      disabled={item.disabled || m.readOnly}
                      onPress={() => {
                        if (!item.disabled && !m.readOnly) {
                          onIntent({ type: 'commandExecuted', itemId: item.id, item });
                        }
                      }}
                      style={[
                        styles.cmdItem,
                        {
                          borderColor: active ? t.primary : 'transparent',
                          backgroundColor: active ? t.primarySoft : 'transparent',
                          opacity: item.disabled ? 0.5 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                          {item.label}
                        </Text>
                        {item.subtitle ? (
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{item.subtitle}</Text>
                        ) : null}
                      </View>
                      <View style={styles.rowWrap}>
                        {item.pinned ? (
                          <Text style={{ color: t.warning, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>★ Pinned</Text>
                        ) : item.recent ? (
                          <Text style={{ color: t.info, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>Recent</Text>
                        ) : null}
                        {item.badge ? <EmrBadgeView badge={item.badge} /> : null}
                        {item.shortcut ? (
                          <View style={[styles.kbdBadge, { borderColor: t.border, backgroundColor: t.surfaceRaised }]}>
                            <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
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
  masterSlot,
  detailSlot,
}: {
  model: EmrMasterDetailViewModel;
  onIntent: (intent: EmrMasterDetailIntent) => void;
  headingId?: string;
  masterSlot?: ReactNode;
  detailSlot?: ReactNode;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const filtered = filterMasterDetailItems(m.items, m.activeFilterId, m.searchQuery);
  const selectedItem = m.items.find((item) => item.id === m.selectedId);
  const checkedIds = m.checkedIds ?? [];

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : m.title}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface, flexDirection: 'row', flexWrap: 'wrap' }]}
    >
      {/* Left Master List */}
      <View style={{ flex: 1, minWidth: 280, borderRightWidth: 1, borderRightColor: t.border }}>
        <View style={{ padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.surfaceSoft }}>
          <View style={styles.rowBetween}>
            <View>
              <Text nativeID={headingId} style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
                {m.title}
              </Text>
              {m.subtitle ? (
                <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{m.subtitle}</Text>
              ) : null}
            </View>
            {m.batchActions?.length && checkedIds.length > 0 && !m.readOnly ? (
              <View style={styles.rowWrap}>
                {m.batchActions.map((act) => (
                  <EmrButton
                    key={act.id}
                    small
                    label={`${act.label} (${checkedIds.length})`}
                    onPress={() => onIntent({ type: 'actionTriggered', actionId: act.id, itemIds: checkedIds })}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <ThemedInput
            aria-label="Search master list"
            value={m.searchQuery}
            placeholder={m.searchPlaceholder ?? 'Filter work queue or inbox items...'}
            onChangeText={(query) => onIntent({ type: 'searchChanged', query })}
          />

          <View style={styles.rowWrap} role="tablist" aria-label="List filters">
            {m.filters.map((f) => {
              const sel = m.activeFilterId === f.id;
              return (
                <Pressable
                  key={f.id}
                  role="tab"
                  aria-selected={sel}
                  onPress={() => onIntent({ type: 'filterChanged', filterId: f.id })}
                  style={[
                    styles.chipBtn,
                    { borderColor: sel ? t.primary : t.border, backgroundColor: sel ? t.primarySoft : t.surface },
                  ]}
                >
                  <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                    {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {masterSlot}

        <View role="list" aria-label={`${m.title} items`}>
          {filtered.length === 0 ? (
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textSm, padding: 16 }}>
              {m.emptyListMessage ?? 'No matching queue items.'}
            </Text>
          ) : (
            filtered.map((item) => {
              const sel = item.id === m.selectedId;
              const checked = checkedIds.includes(item.id);
              return (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: 10,
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
                        const nextChecked = toggleMasterDetailCheckedId(checkedIds, item.id);
                        onIntent({ type: 'batchSelectionToggled', itemId: item.id, checkedIds: nextChecked });
                      }}
                      style={[styles.stepBtn, { borderColor: t.border, backgroundColor: checked ? t.primary : t.surface }]}
                    >
                      <Text style={{ color: checked ? t.surface : t.textMuted, fontSize: 10 }}>{checked ? '✓' : ' '}</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    role="option"
                    aria-selected={sel}
                    onPress={() => onIntent({ type: 'itemSelected', itemId: item.id })}
                    style={{ flex: 1, gap: 4 }}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold) }}>
                        {item.unread ? '● ' : ''}{item.title}
                      </Text>
                      {item.timestampLabel ? (
                        <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{item.timestampLabel}</Text>
                      ) : null}
                    </View>
                    {item.subtitle ? (
                      <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{item.subtitle}</Text>
                    ) : null}
                    <View style={styles.rowWrap}>
                      {item.priorityBadge ? <EmrBadgeView badge={item.priorityBadge} /> : null}
                      {item.statusBadge ? <EmrBadgeView badge={item.statusBadge} /> : null}
                    </View>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Right Detail Inspector */}
      <View style={{ flex: 1.5, minWidth: 300, padding: 16, gap: 12 }}>
        <View style={styles.rowBetween}>
          <Pressable
            role="button"
            aria-label="Back to master list"
            onPress={() => onIntent({ type: 'detailClosed' })}
            style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>← Back to list</Text>
          </Pressable>
        </View>

        {detailSlot}

        {selectedItem ? (
          <View style={{ gap: 12 }}>
            <View style={[styles.rowBetween, { borderBottomWidth: 1, borderBottomColor: t.border, paddingBottom: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }}>
                  {selectedItem.title}
                </Text>
                {selectedItem.subtitle ? (
                  <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{selectedItem.subtitle}</Text>
                ) : null}
              </View>
              <View style={styles.rowWrap}>
                {selectedItem.priorityBadge ? <EmrBadgeView badge={selectedItem.priorityBadge} /> : null}
                {selectedItem.statusBadge ? <EmrBadgeView badge={selectedItem.statusBadge} /> : null}
              </View>
            </View>

            {selectedItem.summaryFields?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 10, borderRadius: 8, backgroundColor: t.surfaceSoft }}>
                {selectedItem.summaryFields.map((f) => (
                  <View key={f.label} style={{ minWidth: 120 }}>
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
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
              <View style={styles.rowWrap}>
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
            {m.emptyDetailMessage ?? 'Select an item from the list to inspect details.'}
          </Text>
        )}
      </View>
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
}: {
  model: EmrSynchronizedTimeGridViewModel;
  onIntent: (intent: EmrSynchronizedTimeGridIntent) => void;
  headingId?: string;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const resolutions = m.availableResolutions ?? TIME_GRID_RESOLUTIONS;
  const start = Math.max(0, m.scrollOffset);
  const count = m.visibleColumnCount ?? m.columns.length;
  const visibleColumns = m.columns.slice(start, start + count);

  const stepScroll = (delta: number) => {
    if (m.readOnly) return;
    const offset = clampTimeGridScrollOffset(m.scrollOffset + delta, m.columns.length, count);
    onIntent({ type: 'scrollOffsetChanged', offset });
  };

  return (
    <View
      role="region"
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : m.title}
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
    >
      <View style={[styles.toolbar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View>
          <Text nativeID={headingId} style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
            {m.title}
          </Text>
          {m.subtitle ? (
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs }}>{m.subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.rowWrap}>
          {resolutions.map((res) => {
            const sel = m.resolution === res;
            return (
              <Pressable
                key={res}
                role="button"
                aria-pressed={sel}
                disabled={m.readOnly}
                onPress={() => onIntent({ type: 'resolutionChanged', resolution: res })}
                style={[
                  styles.chipBtn,
                  { borderColor: sel ? t.primary : t.border, backgroundColor: sel ? t.primarySoft : t.surface },
                ]}
              >
                <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                  {res}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            role="button"
            aria-label="Scroll earlier"
            disabled={m.readOnly || m.scrollOffset <= 0}
            onPress={() => stepScroll(-1)}
            style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>‹ Earlier</Text>
          </Pressable>
          <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: t.textXs }}>Col +{m.scrollOffset}</Text>
          <Pressable
            role="button"
            aria-label="Scroll later"
            disabled={m.readOnly}
            onPress={() => stepScroll(1)}
            style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs }}>Later ›</Text>
          </Pressable>
        </View>
      </View>

      {/* Shared TimeAxis Header Row */}
      <ScrollView horizontal>
        <View style={{ minWidth: 640 }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.surfaceRaised }}>
            <View style={{ width: 180, padding: 8, borderRightWidth: 1, borderRightColor: t.border }}>
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                Time Axis ({m.resolution})
              </Text>
            </View>
            {visibleColumns.map((col) => {
              const sel = col.id === m.selectedColumnId;
              return (
                <Pressable
                  key={col.id}
                  role="button"
                  aria-pressed={sel}
                  onPress={() => {
                    if (!m.readOnly) onIntent({ type: 'columnSelected', columnId: col.id });
                  }}
                  style={{
                    width: 110,
                    padding: 6,
                    borderRightWidth: 1,
                    borderRightColor: t.border,
                    backgroundColor: col.isCurrentTime || sel ? t.primarySoft : t.surfaceRaised,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                    {col.label}
                  </Text>
                  {col.shiftBadge ? (
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>{col.shiftBadge}</Text>
                  ) : null}
                  {col.encounterBadge ? (
                    <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>{col.encounterBadge}</Text>
                  ) : null}
                  {col.isCurrentTime ? (
                    <Text style={{ color: t.primary, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>NOW</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Stacked Clinical Tracks */}
          {m.tracks.map((track) => (
            <View key={track.id}>
              <Pressable
                role="button"
                aria-expanded={!track.collapsed}
                onPress={() => onIntent({ type: 'trackToggled', trackId: track.id, collapsed: !track.collapsed })}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: t.surfaceAccent,
                  borderBottomWidth: 1,
                  borderBottomColor: t.border,
                }}
              >
                <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                  {track.collapsed ? '▸' : '▾'} {track.title}
                </Text>
                <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10 }}>
                  {track.kind.toUpperCase()}
                </Text>
              </Pressable>

              {!track.collapsed
                ? track.rows.map((row) => (
                    <View key={row.id} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border }}>
                      <View style={{ width: 180, padding: 8, borderRightWidth: 1, borderRightColor: t.border, backgroundColor: t.surfaceRaised }}>
                        <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                          {row.label}
                        </Text>
                        {row.unitLabel ? (
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>{row.unitLabel}</Text>
                        ) : null}
                        {row.referenceRangeLabel ? (
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>{row.referenceRangeLabel}</Text>
                        ) : null}
                      </View>

                      {visibleColumns.map((col) => {
                        const cell = row.cells[col.id];
                        const cellSel =
                          m.selectedCell?.trackId === track.id &&
                          m.selectedCell?.rowId === row.id &&
                          m.selectedCell?.columnId === col.id;
                        return (
                          <Pressable
                            key={col.id}
                            role="button"
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
                            style={{
                              width: 110,
                              minHeight: 44,
                              padding: 6,
                              borderRightWidth: 1,
                              borderRightColor: t.border,
                              backgroundColor: cellSel ? t.primarySoft : t.surface,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {cell ? (
                              <>
                                <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold) }}>
                                  {cell.valueLabel}
                                </Text>
                                {cell.secondaryLabel ? (
                                  <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>{cell.secondaryLabel}</Text>
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
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  panesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 260,
  },
  paneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  divider: {
    width: 28,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  cmdBackdrop: {
    padding: 16,
    borderRadius: 12,
  },
  cmdDialog: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cmdHead: {
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  kbdBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  cmdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
