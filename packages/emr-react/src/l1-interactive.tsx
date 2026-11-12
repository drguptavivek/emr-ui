'use client';

import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type { EmrOption, EmrStage } from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { SvgIcon } from './icons';
import { EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import { interactiveLabelDefaults, textInputKeys, webProps, type InteractiveLabels, type WebKeyEvent } from './l1-interactive-shared';
import { clampedTarget, rovingTarget, tabStopTick } from './l1-interactive.logic';
import { filterOptionsLocally, groupOptions } from './l1-wave2.logic';

export { EmrLikert, EmrVas, type EmrScaleAnchor } from './l1-interactive-scales';
export { interactiveLabelDefaults, type InteractiveLabels } from './l1-interactive-shared';

type PressState = PressableStateCallbackType & { focused?: boolean };
type FocusRef = ({ focus(): void } | null)[];

/** L1 tablist. On web, Left/Right/Home/End move selection and focus (wrapping, skipping disabled tabs). */
export function EmrTabs({
  tabs,
  active,
  onTabChange,
  ariaLabel,
  labels,
}: {
  tabs: readonly EmrOption[];
  active: string;
  onTabChange: (value: string) => void;
  ariaLabel?: string;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const refs = useRef<FocusRef>([]);
  const onKey = (e: WebKeyEvent, index: number) => {
    const target = rovingTarget(
      e.key,
      index,
      tabs.map(tab => !tab.disabled),
    );
    if (target === null) return;
    e.preventDefault();
    onTabChange(tabs[target]!.value);
    refs.current[target]?.focus();
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View role="tablist" aria-label={ariaLabel ?? l.tabsAria} style={[styles.tabs, { borderBottomColor: t.border }]}>
        {tabs.map((tab, i) => {
          const selected = tab.value === active;
          return (
            <Pressable
              key={tab.value}
              ref={el => {
                refs.current[i] = el;
              }}
              role="tab"
              aria-selected={selected}
              aria-disabled={tab.disabled}
              disabled={tab.disabled}
              onPress={() => onTabChange(tab.value)}
              {...webProps({ tabIndex: selected ? 0 : -1, onKeyDown: (e: WebKeyEvent) => onKey(e, i) })}
              style={({ focused }: PressState) => [
                styles.tab,
                focusRing(t, focused),
                {
                  minHeight: Math.max(44, t.controlHeight),
                  minWidth: 44,
                  borderBottomWidth: 3,
                  borderBottomColor: selected ? t.primary : 'transparent',
                  backgroundColor: selected ? t.surfaceAccent : 'transparent',
                  opacity: tab.disabled ? 0.5 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? t.primary : t.text,
                  fontSize: t.textMd,
                  fontFamily: fontFamily(t),
                  fontWeight: fontWeight(t.weightMedium),
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/**
 * L1 search-select. Supports remote (async controller) or local filtering (`filterMode`),
 * grouped options (`option.group`), single `value`/`onValueChange` or multi `selected`,
 * `clearable` + `onCleared`, and `allowCustomValue` + `onCustomValueCommitted`.
 */
export function EmrSearchSelect({
  label,
  labelHidden,
  placeholder,
  query: controlledQuery,
  options,
  selected: controlledSelected,
  value,
  filterMode = 'remote',
  multiple,
  open: controlledOpen,
  clearable,
  allowCustomValue,
  loading,
  readOnly,
  disabled,
  error,
  emptyMessage,
  labels,
  onQueryChange,
  onSearchRequested,
  onOpenRequested,
  onCloseRequested,
  onOptionSelect,
  onValueChange,
  onRemoveRequested,
  onCleared,
  onCustomValueCommitted,
}: {
  label?: string;
  /** Keep the label for assistive tech but not on screen. */
  labelHidden?: boolean;
  placeholder?: string;
  query?: string;
  options: readonly EmrOption[];
  selected?: readonly EmrOption[];
  value?: string | null;
  filterMode?: 'remote' | 'local';
  multiple?: boolean;
  open?: boolean;
  clearable?: boolean;
  allowCustomValue?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
  emptyMessage?: string;
  labels?: Partial<InteractiveLabels>;
  onQueryChange?: (query: string) => void;
  onSearchRequested?: () => void;
  onOpenRequested?: () => void;
  onCloseRequested?: () => void;
  onOptionSelect?: (value: string) => void;
  onValueChange?: (value: string | null) => void;
  onRemoveRequested?: (value: string) => void;
  onCleared?: () => void;
  onCustomValueCommitted?: (value: string) => void;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const name = label ?? l.searchLabel;
  const [localQuery, setLocalQuery] = useState('');
  const [localOpen, setLocalOpen] = useState(false);
  const refs = useRef<FocusRef>([]);
  const anchorWrapRef = useRef<{ contains?: (target: unknown) => boolean } | null>(null);

  const query = controlledQuery !== undefined ? controlledQuery : localQuery;
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;

  const selected: readonly EmrOption[] =
    controlledSelected !== undefined
      ? controlledSelected
      : value !== undefined && value !== null && value !== ''
        ? [options.find(o => o.value === value) ?? { value, label: value }]
        : [];

  const handleClose = () => {
    setLocalOpen(false);
    onCloseRequested?.();
  };
  const handleOpen = () => {
    setLocalOpen(true);
    onOpenRequested?.();
  };
  const handleQuery = (next: string) => {
    setLocalQuery(next);
    onQueryChange?.(next);
    if (filterMode === 'local') {
      setLocalOpen(true);
      onOpenRequested?.();
    }
  };
  const handleSearch = () => {
    const trimmed = query.trim();
    if (allowCustomValue && trimmed.length > 0) {
      const exact = options.find(
        o => o.value.toLowerCase() === trimmed.toLowerCase() || o.label.toLowerCase() === trimmed.toLowerCase(),
      );
      if (!exact) {
        onCustomValueCommitted?.(trimmed);
        onOptionSelect?.(trimmed);
        onValueChange?.(trimmed);
      }
    }
    onSearchRequested?.();
  };

  const closeRef = useRef(handleClose);
  closeRef.current = handleClose;

  const visibleOptions = filterMode === 'local' ? filterOptionsLocally(options, query) : options;
  const groups = groupOptions(visibleOptions);
  const flatVisibleOptions = groups.flatMap(g => g.options);

  const trimmedQuery = query.trim();
  const showCustomCandidate = Boolean(
    allowCustomValue &&
      trimmedQuery.length > 0 &&
      !visibleOptions.some(
        o =>
          o.value.toLowerCase() === trimmedQuery.toLowerCase() ||
          o.label.toLowerCase() === trimmedQuery.toLowerCase(),
      ),
  );

  const isOpen = Boolean(open && !readOnly && !disabled);
  const enabled = flatVisibleOptions.map((o, i) => (o.disabled ? -1 : i)).filter(i => i >= 0);
  const focusAt = (pos: number) => refs.current[enabled[Math.max(0, Math.min(pos, enabled.length - 1))]!]?.focus();

  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web') return;
    const g = globalThis as {
      addEventListener?: (type: string, fn: (e: { key?: string; target?: unknown }) => void) => void;
      removeEventListener?: (type: string, fn: (e: { key?: string; target?: unknown }) => void) => void;
      document?: {
        addEventListener?: (type: string, fn: (e: { target?: unknown }) => void) => void;
        removeEventListener?: (type: string, fn: (e: { target?: unknown }) => void) => void;
      };
    };
    const onKeyDown = (e: { key?: string }) => {
      if (e.key === 'Escape') closeRef.current();
    };
    const onPointerDown = (e: { target?: unknown }) => {
      const root = anchorWrapRef.current;
      if (root && typeof root.contains === 'function' && e.target && !root.contains(e.target)) {
        closeRef.current();
      }
    };
    g.addEventListener?.('keydown', onKeyDown);
    g.document?.addEventListener?.('mousedown', onPointerDown);
    return () => {
      g.removeEventListener?.('keydown', onKeyDown);
      g.document?.removeEventListener?.('mousedown', onPointerDown);
    };
  }, [isOpen]);

  const onInputKey = (e: WebKeyEvent) => {
    if (e.key === 'ArrowDown' && isOpen && enabled.length) {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };
  const onOptionKey = (e: WebKeyEvent, index: number) => {
    if (e.key === 'Escape') {
      handleClose();
      return;
    }
    const target = clampedTarget(e.key, enabled.indexOf(index), enabled.length);
    if (target === null) return;
    e.preventDefault();
    focusAt(target);
  };

  const selectOption = (optValue: string, isCustom = false) => {
    if (readOnly || disabled) return;
    if (isCustom) {
      onCustomValueCommitted?.(optValue);
    }
    onOptionSelect?.(optValue);
    onValueChange?.(optValue);
    if (!multiple) {
      handleClose();
    }
  };

  const hasClearableState = Boolean(
    clearable && !readOnly && !disabled && (value != null || selected.length > 0 || query.length > 0),
  );

  const handleClear = () => {
    if (!hasClearableState) return;
    setLocalQuery('');
    onQueryChange?.('');
    if (!multiple && selected[0]) {
      onRemoveRequested?.(selected[0].value);
    }
    onValueChange?.(null);
    onCleared?.();
    handleClose();
  };

  const text = { color: t.text, fontSize: t.textMd, fontFamily: fontFamily(t) };
  const isWeb = Platform.OS === 'web';
  let optionFlatIdx = -1;

  return (
    <View style={[styles.stack, isOpen && isWeb ? styles.openStackWeb : undefined]}>
      {labelHidden ? null : (
        <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
          {name}
        </Text>
      )}
      {multiple && selected.length ? (
        <View role="list" aria-label={l.selectedOptions} style={styles.wrap}>
          {selected.map(item => (
            <View key={item.value} role="listitem" style={[styles.selectedChip, { backgroundColor: t.neutralSoft, borderColor: t.border }]}>
              <Text style={text}>{item.label}</Text>
              {!readOnly ? (
                <EmrButton
                  small
                  variant="ghost"
                  label={l.remove}
                  accessibilityLabel={l.removeItem(item.label)}
                  disabled={disabled}
                  onPress={() => onRemoveRequested?.(item.value)}
                />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      <View
        ref={el => {
          anchorWrapRef.current = el as unknown as { contains?: (target: unknown) => boolean } | null;
        }}
        style={[styles.anchorWrap, isOpen && isWeb ? styles.anchorWrapOpenWeb : undefined]}
      >
        <View style={styles.bar}>
          <View style={styles.grow}>
            <ThemedInput
              role="combobox"
              aria-label={name}
              aria-expanded={isOpen}
              aria-readonly={readOnly}
              aria-autocomplete="list"
              autoComplete="off"
              autoCorrect={false}
              value={query}
              placeholder={placeholder ?? (selected[0] && !multiple ? selected[0].label : l.searchPlaceholder)}
              readOnly={readOnly}
              editable={!disabled && !readOnly}
              invalid={!!error}
              onChangeText={readOnly ? undefined : handleQuery}
              onFocus={readOnly ? undefined : handleOpen}
              onSubmitEditing={readOnly ? undefined : handleSearch}
              {...(textInputKeys(onInputKey) as object)}
            />
          </View>
          {hasClearableState ? (
            <Pressable
              role="button"
              aria-label={`Clear ${name}`}
              onPress={handleClear}
              style={({ pressed, focused }: PressState) => [
                styles.clearIconBtn,
                focusRing(t, focused),
                {
                  minWidth: 44,
                  minHeight: Math.max(44, t.controlHeight),
                  borderColor: t.border,
                  backgroundColor: pressed ? t.surfaceRaised : t.surface,
                },
              ]}
            >
              <SvgIcon name="close" size={16} color={t.textMuted} />
            </Pressable>
          ) : null}
          {!readOnly ? (
            <EmrButton
              variant="outline"
              label={loading ? l.searching : l.searchButton}
              disabled={disabled || loading}
              onPress={handleSearch}
            />
          ) : null}
        </View>
        {isOpen ? (
          <View
            role="list"
            {...webProps({ role: 'listbox' })}
            aria-multiselectable={multiple}
            aria-label={name}
            style={[
              styles.panel,
              isWeb ? styles.panelOverlayWeb : styles.panelInlineNative,
              { borderColor: t.border, backgroundColor: t.surface },
            ]}
          >
            <ScrollView style={styles.panelScroll} keyboardShouldPersistTaps="handled">
              {showCustomCandidate ? (
                <Pressable
                  role="option"
                  aria-selected={false}
                  onPress={() => selectOption(trimmedQuery, true)}
                  style={({ pressed, focused }: PressState) => [
                    styles.option,
                    focusRing(t, focused),
                    {
                      minHeight: Math.max(44, t.controlHeight),
                      backgroundColor: pressed ? t.surfaceRaised : t.surfaceBlue,
                    },
                  ]}
                >
                  <Text style={[text, { color: t.primary, fontWeight: fontWeight(t.weightBold) }]}>
                    Use "{trimmedQuery}"
                  </Text>
                </Pressable>
              ) : null}
              {!loading && flatVisibleOptions.length === 0 && !showCustomCandidate ? (
                <Text style={[text, { color: t.textMuted, padding: 12 }]}>{emptyMessage ?? l.noMatches}</Text>
              ) : null}
              {groups.map((grp, gIdx) => {
                const optionNodes = grp.options.map(option => {
                  optionFlatIdx += 1;
                  const idx = optionFlatIdx;
                  const isSelected = selected.some(s => s.value === option.value) || value === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      ref={el => {
                        refs.current[idx] = el;
                      }}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      disabled={option.disabled}
                      onPress={() => selectOption(option.value)}
                      {...webProps({ onKeyDown: (e: WebKeyEvent) => onOptionKey(e, idx) })}
                      style={({ pressed, focused }: PressState) => [
                        styles.option,
                        focusRing(t, focused),
                        {
                          minHeight: Math.max(44, t.controlHeight),
                          backgroundColor: isSelected ? t.primarySoft : pressed ? t.surfaceRaised : t.surface,
                          opacity: option.disabled ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Text style={[text, { fontWeight: fontWeight(t.weightBold) }]}>
                        {isSelected ? '✓ ' : ''}
                        {option.label}
                      </Text>
                      {option.description ? (
                        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
                          {option.description}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                });
                if (!grp.label) return optionNodes;
                return (
                  <View key={`grp-${grp.label}-${gIdx}`} role="group" aria-label={grp.label}>
                    <Text
                      style={{
                        color: t.textMuted,
                        fontSize: t.textXs,
                        fontWeight: fontWeight(t.weightBold),
                        fontFamily: fontFamily(t),
                        paddingHorizontal: 12,
                        paddingTop: 8,
                        paddingBottom: 4,
                      }}
                    >
                      {grp.label}
                    </Text>
                    {optionNodes}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
      {error ? (
        <Text role="alert" style={{ color: t.danger, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export type { EmrStage } from '@drguptavivek/emr-controller';

/**
 * L1 numbered stages. Mechanical: caller supplies stages, the active id and any status badge.
 * `readOnly` renders plain list items. Otherwise one tab stop (focused, else active, else first);
 * on web arrows/Home/End move focus.
 */
export function EmrStageStepper({
  stages,
  activeId,
  orientation = 'horizontal',
  readOnly,
  ariaLabel,
  onStageSelect,
  labels,
}: {
  stages: readonly EmrStage[];
  activeId?: string;
  orientation?: 'horizontal' | 'vertical';
  readOnly?: boolean;
  ariaLabel?: string;
  onStageSelect?: (id: string) => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const refs = useRef<FocusRef>([]);
  const tabStop = tabStopTick(stages, focusedId, activeId) ?? stages[0]?.id;
  const onKey = (e: WebKeyEvent, index: number) => {
    const target = clampedTarget(e.key, index, stages.length);
    if (target === null) return;
    e.preventDefault();
    refs.current[target]?.focus();
  };
  const vertical = orientation === 'vertical';
  return (
    <View role="navigation" aria-label={ariaLabel ?? l.stagesAria}>
      <View role="list" style={[styles.stages, vertical && styles.stagesV, { borderColor: t.border, backgroundColor: t.surfaceSlate }]}>
        {stages.map((stage, i) => {
          const active = stage.id === activeId;
          const badge = stage.status ? toneColors(t, stage.status.tone) : null;
          const body = (
            <>
              <View aria-hidden style={[styles.number, { backgroundColor: t.neutralSoft }]}>
                <Text style={{ color: t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                  {i + 1}
                </Text>
              </View>
              <View style={styles.grow}>
                <Text
                  style={{
                    color: active ? t.primary : t.text,
                    fontSize: t.textMd,
                    fontFamily: fontFamily(t),
                    fontWeight: fontWeight(active ? t.weightBold : t.weightRegular),
                  }}
                >
                  {stage.label}
                </Text>
                {stage.description ? (
                  <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{stage.description}</Text>
                ) : null}
              </View>
              {stage.status && badge ? (
                <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
                  <Text style={{ color: badge.color, fontSize: t.textXs, fontFamily: fontFamily(t) }}>{stage.status.label}</Text>
                </View>
              ) : null}
            </>
          );
          const a11yLabel = [
            `${i + 1}. ${stage.label}`,
            stage.description,
            stage.status ? l.stageStatus(stage.status.label, stage.status.assistiveText) : null,
          ]
            .filter(Boolean)
            .join(', ');
          const frame = [
            styles.stage,
            {
              minHeight: Math.max(44, t.controlHeight),
              borderBottomWidth: 3,
              borderBottomColor: active ? t.primary : 'transparent',
              backgroundColor: active ? t.surfaceAccent : 'transparent',
            },
          ];
          return (
            <View key={stage.id} role="listitem" style={vertical ? undefined : styles.stageItem}>
              {readOnly ? (
                <View aria-current={active ? 'step' : undefined} accessible aria-label={a11yLabel} style={frame}>
                  {body}
                </View>
              ) : (
                <Pressable
                  ref={el => {
                    refs.current[i] = el;
                  }}
                  aria-current={active ? 'step' : undefined}
                  aria-label={a11yLabel}
                  onPress={() => onStageSelect?.(stage.id)}
                  onFocus={() => setFocusedId(stage.id)}
                  {...webProps({ tabIndex: stage.id === tabStop ? 0 : -1, onKeyDown: (e: WebKeyEvent) => onKey(e, i) })}
                  style={({ focused }: PressState) => [...frame, focusRing(t, focused)]}
                >
                  {body}
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  openStackWeb: { zIndex: 40 },
  anchorWrap: { position: 'relative' },
  anchorWrapOpenWeb: { zIndex: 40 },
  grow: { flex: 1, minWidth: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearIconBtn: { borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingLeft: 12 },
  panel: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  panelOverlayWeb: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    zIndex: 40,
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  panelInlineNative: { marginTop: 4 },
  panelScroll: { maxHeight: 268 },
  option: { justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  stages: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1 },
  stagesV: { flexDirection: 'column', flexWrap: 'nowrap' },
  stageItem: { flexGrow: 1, flexBasis: 180 },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  number: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
});
