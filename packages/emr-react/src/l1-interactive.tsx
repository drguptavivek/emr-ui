'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import {
  canActivateTab,
  canSelectEmrStage,
  getNextStageStepperIndex,
  getNextTabIndex,
  normalizeEmrStageStepperOrientation,
  normalizeEmrStageStepperSize,
  resolveActiveTabValue,
  resolveStageStepperTabStopId,
  resolveTabStopIndex,
  type EmrControlVariant,
  type EmrOption,
  type EmrSearchSelectFilterMode,
  type EmrSearchSelectSize,
  type EmrStage,
  type EmrStageStepperIntent,
  type EmrStageStepperOrientation,
  type EmrStageStepperSize,
  type EmrTabOption,
  type EmrTabsActivationMode,
  type EmrTabsIconPosition,
  type EmrTabsOrientation,
  type EmrTabsSize,
  type EmrTabsVariant,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { SvgIcon, type EmrIconName } from './icons';
import { EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, toneColors, useEmrTheme } from './theme';
import { interactiveLabelDefaults, textInputKeys, webProps, type InteractiveLabels, type WebKeyEvent } from './l1-interactive-shared';
import { clampedTarget, rovingTarget, tabStopTick } from './l1-interactive.logic';
import {
  findNextEnabledSearchOptionIndex,
  formatCreatableLabel,
  groupOptions,
  hasSearchSelectClearableValue,
  isSearchOptionSelected,
  rankAndFilterOptions,
  resolveCustomSearchCandidate,
  resolveDefaultActiveOptionIndex,
  resolveSearchSelectDisplayValue,
  resolveSearchSelectValues,
  splitMatchHighlightSegments,
} from './l1-wave2.logic';

export { EmrLikert, EmrVas, type EmrScaleAnchor } from './l1-interactive-scales';
export { interactiveLabelDefaults, type InteractiveLabels } from './l1-interactive-shared';

type PressState = PressableStateCallbackType & { focused?: boolean };
type FocusRef = ({ focus(): void } | null)[];

/** L1 tablist. Supports underline/pill/soft variants, horizontal/vertical, automatic/manual activation, and roving tabindex. */
export function EmrTabs({
  controlId,
  tabs = [],
  value,
  active,
  onValueChange,
  onTabChange,
  variant = 'underline',
  size = 'md',
  orientation = 'horizontal',
  fitted = false,
  activationMode = 'automatic',
  loop = true,
  iconPosition = 'start',
  readOnly = false,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  onFocus,
  onBlur,
  labels,
}: {
  controlId?: string;
  tabs?: readonly EmrTabOption[];
  value?: string;
  active?: string;
  onValueChange?: (value: string) => void;
  onTabChange?: (value: string) => void;
  variant?: EmrTabsVariant;
  size?: EmrTabsSize;
  orientation?: EmrTabsOrientation;
  fitted?: boolean;
  activationMode?: EmrTabsActivationMode;
  loop?: boolean;
  iconPosition?: EmrTabsIconPosition;
  readOnly?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const refs = useRef<FocusRef>([]);
  const resolvedActive = resolveActiveTabValue(tabs, value, active);
  const tabStopIndex = resolveTabStopIndex(tabs, resolvedActive, disabled);
  const isVertical = orientation === 'vertical';
  const minH = size === 'lg' ? 48 : Math.max(44, t.controlHeight);
  const fontSize = size === 'sm' ? t.textSm : size === 'lg' ? t.textLg : t.textMd;

  const emitTab = (next: string) => {
    if (next === resolvedActive) return;
    onValueChange?.(next);
    onTabChange?.(next);
  };

  const onKey = (e: WebKeyEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const tab = tabs[index];
      if (canActivateTab(tab, disabled, readOnly)) {
        e.preventDefault();
        emitTab(tab!.value);
      }
      return;
    }
    const target = getNextTabIndex(tabs, index, e.key, { orientation, loop });
    if (target === null) return;
    e.preventDefault();
    refs.current[target]?.focus();
    if (activationMode === 'automatic') {
      const targetTab = tabs[target];
      if (canActivateTab(targetTab, disabled, readOnly)) {
        emitTab(targetTab!.value);
      }
    }
  };

  const listNode = (
    <View
      nativeID={controlId}
      role="tablist"
      aria-orientation={orientation}
      aria-label={ariaLabelledBy ? undefined : ariaLabel ?? l.tabsAria}
      aria-labelledby={ariaLabelledBy}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      style={[
        styles.tabs,
        isVertical && {
          flexDirection: 'column',
          borderBottomWidth: 0,
          borderLeftWidth: 2,
          borderLeftColor: t.border,
          gap: 2,
        },
        variant === 'underline' && !isVertical && { borderBottomColor: t.border, borderBottomWidth: 1, width: '100%', gap: 4 },
        variant === 'pill' && {
          borderBottomWidth: 0,
          backgroundColor: t.surfaceSoft,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 10,
          padding: 4,
          gap: 4,
          alignSelf: fitted && !isVertical ? 'stretch' : 'flex-start',
        },
        variant === 'soft' && { borderBottomWidth: 0, gap: 6, width: '100%' },
        fitted && !isVertical && { width: '100%' },
      ]}
    >
      {tabs.map((tab, i) => {
        const selected = tab.value === resolvedActive;
        const tabDisabled = disabled || Boolean(tab.disabled);
        const isStop = i === tabStopIndex;
        const textColor = tabDisabled
          ? t.textMuted
          : selected
            ? t.primary
            : t.textMuted;
        const iconNode = tab.icon ? (
          <SvgIcon name={tab.icon as EmrIconName} size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} color={textColor} />
        ) : null;

        return (
          <Pressable
            key={tab.value}
            nativeID={controlId ? `${controlId}-tab-${i}` : undefined}
            ref={el => {
              refs.current[i] = el;
            }}
            role="tab"
            aria-selected={selected}
            aria-controls={tab.panelId}
            aria-disabled={tabDisabled || (readOnly && !selected) || undefined}
            disabled={tabDisabled}
            onFocus={onFocus}
            onBlur={onBlur}
            onPress={() => {
              if (!canActivateTab(tab, disabled, readOnly)) return;
              emitTab(tab.value);
            }}
            {...webProps({
              tabIndex: isStop ? 0 : -1,
              onKeyDown: (e: WebKeyEvent) => onKey(e, i),
            })}
            style={({ focused, hovered }: PressState & { hovered?: boolean }) => [
              styles.tab,
              {
                minHeight: minH,
                minWidth: 44,
                paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 18 : 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flex: fitted && !isVertical ? 1 : undefined,
                justifyContent: isVertical ? 'flex-start' : 'center',
                borderBottomWidth: variant === 'underline' && !isVertical ? 3 : 0,
                borderBottomColor: variant === 'underline' && !isVertical && selected ? t.primary : 'transparent',
                borderBottomStyle: readOnly && selected ? 'dashed' : 'solid',
                borderLeftWidth: variant === 'underline' && isVertical ? 3 : 0,
                borderLeftColor: variant === 'underline' && isVertical && selected ? t.primary : 'transparent',
                borderRadius: variant === 'pill' ? 7 : variant === 'soft' ? 8 : 0,
                backgroundColor:
                  variant === 'pill' && selected
                    ? t.surface
                    : variant === 'soft' && selected
                      ? t.surfaceAccent
                      : hovered && !tabDisabled && !selected && !readOnly
                        ? t.surfaceSoft
                        : 'transparent',
                opacity: tabDisabled ? 0.48 : 1,
              },
              focusRing(t, focused),
            ]}
          >
            {iconPosition === 'start' ? iconNode : null}
            <Text
              style={{
                color: textColor,
                fontSize,
                fontFamily: fontFamily(t),
                fontWeight: fontWeight(selected ? t.weightBold : t.weightMedium),
              }}
            >
              {tab.label}
            </Text>
            {iconPosition === 'end' ? iconNode : null}
            {tab.badge !== undefined && tab.badge !== null && tab.badge !== '' ? (
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: selected ? t.primarySoft : t.neutralSoft,
                }}
              >
                <Text
                  style={[
                    {
                      color: selected ? t.primary : t.textMuted,
                      fontSize: t.text2xs,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: fontFamily(t),
                    },
                    Platform.OS === 'web' ? ({ fontVariantNumeric: 'tabular-nums' } as unknown as object) : null,
                  ]}
                >
                  {String(tab.badge)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  if (isVertical) return listNode;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={variant !== 'pill' || fitted ? { flexGrow: 1 } : undefined}
    >
      {listNode}
    </ScrollView>
  );
}

/**
 * L1 search-select. Supports remote, local, or none filtering (`filterMode`),
 * deterministic tiered ranking + match highlighting, grouped options (`option.group`),
 * single or multi-select (`multiple`, `maxSelections`, `maxTagCount`),
 * `clearable` + `onCleared`, and `creatable` / `allowCreate` / `allowCustomValue`.
 */
export function EmrSearchSelect({
  controlId,
  label,
  ariaLabel,
  labelHidden,
  placeholder,
  variant = 'outline',
  size = 'md',
  multiple = false,
  value,
  selected: controlledSelected,
  options,
  maxSelections,
  maxTagCount,
  closeOnSelect,
  clearable = false,
  clearLabel,
  query: controlledQuery,
  searchQuery,
  filterMode = 'remote',
  highlightMatch = true,
  autoHighlight = true,
  debounceMs = 200,
  minQueryLength = 0,
  open: controlledOpen,
  creatable = false,
  allowCreate = false,
  allowCustomValue = false,
  createLabel = 'Create "{query}"',
  loading = false,
  loadingMessage,
  emptyMessage,
  required = false,
  readOnly = false,
  disabled = false,
  invalid = false,
  hint,
  warning,
  error,
  labels,
  onValueChange,
  onQueryChange,
  onSearchRequested,
  onOpenChange,
  onOpenRequested,
  onCloseRequested,
  onOptionSelect,
  onOptionSelected,
  onRemoveRequested,
  onSelectionRemoved,
  onCreateRequested,
  onCustomValueCommitted,
  onCleared,
  onFocus,
  onBlur,
  onSubmitted,
}: {
  controlId?: string;
  label?: string;
  ariaLabel?: string;
  /** Keep the label for assistive tech but not on screen. */
  labelHidden?: boolean;
  placeholder?: string;
  variant?: EmrControlVariant;
  size?: EmrSearchSelectSize | 'lg';
  multiple?: boolean;
  value?: string | readonly string[] | null;
  selected?: readonly EmrOption[];
  options: readonly EmrOption[];
  maxSelections?: number;
  maxTagCount?: number;
  closeOnSelect?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  query?: string;
  searchQuery?: string;
  filterMode?: EmrSearchSelectFilterMode;
  highlightMatch?: boolean;
  autoHighlight?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  open?: boolean;
  creatable?: boolean;
  allowCreate?: boolean;
  allowCustomValue?: boolean;
  createLabel?: string;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  hint?: string;
  warning?: string;
  error?: string;
  labels?: Partial<InteractiveLabels>;
  onValueChange?: (value: string | readonly string[] | null) => void;
  onQueryChange?: (query: string) => void;
  onSearchRequested?: () => void;
  onOpenChange?: (open: boolean) => void;
  onOpenRequested?: () => void;
  onCloseRequested?: () => void;
  onOptionSelect?: (value: string) => void;
  onOptionSelected?: (value: string) => void;
  onRemoveRequested?: (value: string) => void;
  onSelectionRemoved?: (value: string) => void;
  onCreateRequested?: (value: string) => void;
  onCustomValueCommitted?: (value: string) => void;
  onCleared?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitted?: () => void;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const reactId = useId();
  const baseId = controlId ?? `emr-search-${reactId.replace(/:/g, '')}`;
  const name = ariaLabel || label || l.searchLabel;
  const { width: winWidth } = useWindowDimensions();

  const [localQuery, setLocalQuery] = useState('');
  const [localOpen, setLocalOpen] = useState(false);
  const [isActivelyTyping, setIsActivelyTyping] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const anchorWrapRef = useRef<{ contains?: (target: unknown) => boolean } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const externalQuery = searchQuery !== undefined ? searchQuery : controlledQuery;
  const query = filterMode !== 'remote' && isActivelyTyping
    ? localQuery
    : externalQuery !== undefined
      ? externalQuery
      : localQuery;

  const isControlledOpen = controlledOpen !== undefined;
  const open = isControlledOpen ? controlledOpen : localOpen;
  const locked = Boolean(disabled || readOnly);
  const isInvalid = Boolean(invalid || error);
  const isCreatable = Boolean(creatable || allowCreate || allowCustomValue);
  const resolvedCloseOnSelect = closeOnSelect ?? !multiple;
  const effectiveLoadingMsg = loadingMessage ?? l.searching;
  const controlMinHeight = size === 'lg' ? 48 : Math.max(44, t.controlHeight);

  const selectedValues = resolveSearchSelectValues(Boolean(multiple), value, controlledSelected);
  const selectedChips: readonly EmrOption[] = (() => {
    if (selectedValues.length === 0) return controlledSelected ?? [];
    const byVal = new Map<string, EmrOption>();
    for (const o of controlledSelected ?? []) byVal.set(o.value, o);
    for (const o of options) if (!byVal.has(o.value)) byVal.set(o.value, o);
    return selectedValues.map(v => byVal.get(v) ?? { value: v, label: v });
  })();

  const visibleChips =
    typeof maxTagCount === 'number' && maxTagCount >= 0 && selectedChips.length > maxTagCount
      ? selectedChips.slice(0, maxTagCount)
      : selectedChips;
  const overflowChipCount =
    typeof maxTagCount === 'number' && maxTagCount >= 0 && selectedChips.length > maxTagCount
      ? selectedChips.length - maxTagCount
      : 0;

  const setOpenState = (next: boolean) => {
    if (!isControlledOpen) {
      setLocalOpen(next);
    }
    onOpenChange?.(next);
    if (next) {
      onOpenRequested?.();
    } else {
      onCloseRequested?.();
    }
  };

  const handleClose = () => {
    setIsActivelyTyping(false);
    setLocalQuery('');
    setOpenState(false);
  };

  const handleOpen = () => {
    if (locked) return;
    onFocus?.();
    if (!open) {
      setOpenState(true);
    }
  };

  const handleQuery = (next: string) => {
    if (locked) return;
    setIsActivelyTyping(true);
    setLocalQuery(next);
    onQueryChange?.(next);
    if (!open) {
      setOpenState(true);
    }
    if (filterMode === 'remote') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (next.trim().length >= Math.max(0, minQueryLength)) {
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null;
          onSearchRequested?.();
        }, Math.max(0, debounceMs));
      }
    }
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const ranked = rankAndFilterOptions(options, query, filterMode);
  const visibleOptions = ranked.map(entry => entry.option);
  const bestMatchValue = query.trim() ? (ranked.find(entry => entry.isBestMatch)?.option.value ?? null) : null;
  const groups = groupOptions(visibleOptions);
  const flatVisibleOptions = groups.flatMap(g => g.options);
  const customCandidate = resolveCustomSearchCandidate(query, options, isCreatable, minQueryLength);

  const isOpen = Boolean(open && !readOnly && !disabled);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(
      resolveDefaultActiveOptionIndex(flatVisibleOptions, selectedValues, query, autoHighlight),
    );
  }, [isOpen, query, autoHighlight, flatVisibleOptions.length]);

  const closeRef = useRef(handleClose);
  closeRef.current = handleClose;

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

  const selectOption = (option: EmrOption, isCustom = false) => {
    if (locked || option.disabled || option.readOnly) return;
    setIsActivelyTyping(false);
    setLocalQuery('');
    if (isCustom) {
      onCreateRequested?.(option.value);
      onCustomValueCommitted?.(option.value);
    }

    if (multiple && !isCustom) {
      const exists = selectedValues.includes(option.value);
      if (!exists && typeof maxSelections === 'number' && maxSelections >= 1 && selectedValues.length >= maxSelections) {
        return;
      }
      const next = exists
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      if (exists) {
        onRemoveRequested?.(option.value);
        onSelectionRemoved?.(option.value);
      } else {
        onOptionSelect?.(option.value);
        onOptionSelected?.(option.value);
      }
      onValueChange?.(next);
    } else if (multiple && isCustom) {
      const next = selectedValues.includes(option.value)
        ? selectedValues
        : [...selectedValues, option.value];
      onOptionSelect?.(option.value);
      onOptionSelected?.(option.value);
      onValueChange?.(next);
    } else {
      onOptionSelect?.(option.value);
      onOptionSelected?.(option.value);
      onValueChange?.(option.value);
    }

    if (resolvedCloseOnSelect) {
      setOpenState(false);
    }
  };

  const handleSearch = () => {
    if (locked) return;
    if (isOpen && activeIndex >= 0 && activeIndex < flatVisibleOptions.length) {
      selectOption(flatVisibleOptions[activeIndex]!);
      onSubmitted?.();
      return;
    }
    if (customCandidate && (activeIndex === flatVisibleOptions.length || flatVisibleOptions.length === 0)) {
      selectOption({ value: customCandidate, label: customCandidate }, true);
      onSubmitted?.();
      return;
    }
    if (filterMode === 'local') {
      const firstEnabled = flatVisibleOptions.find(o => !o.disabled);
      if (firstEnabled) {
        selectOption(firstEnabled);
      }
      onSubmitted?.();
      return;
    }
    if (!loading) {
      if (!isOpen) setOpenState(true);
      onSearchRequested?.();
    }
    onSubmitted?.();
  };

  const onInputKey = (e: WebKeyEvent) => {
    if (locked) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      if (!isOpen) {
        setOpenState(true);
        return;
      }
      const nextIdx = findNextEnabledSearchOptionIndex(flatVisibleOptions, activeIndex, e.key);
      if (nextIdx !== null) {
        setActiveIndex(nextIdx);
      }
    } else if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const hasClearableState = hasSearchSelectClearableValue({
    clearable: Boolean(clearable),
    disabled: Boolean(disabled),
    readOnly: Boolean(readOnly),
    value,
    selected: selectedChips,
    query,
  });

  const handleClear = () => {
    if (!hasClearableState) return;
    setIsActivelyTyping(false);
    setLocalQuery('');
    onQueryChange?.('');
    if (multiple) {
      const preserved = selectedChips.filter(item => item.readOnly).map(item => item.value);
      onValueChange?.(preserved.length ? preserved : []);
    } else {
      const currentOpt = selectedChips[0];
      if (!currentOpt?.readOnly) {
        if (currentOpt) {
          onRemoveRequested?.(currentOpt.value);
          onSelectionRemoved?.(currentOpt.value);
        }
        onValueChange?.(null);
      }
    }
    onCleared?.();
    setOpenState(false);
  };

  const displayedInputValue = resolveSearchSelectDisplayValue({
    filterMode,
    isActivelyTyping,
    query,
    value,
    selected: selectedChips,
    options,
    multiple: Boolean(multiple),
  });

  const text = { color: t.text, fontSize: size === 'sm' ? t.textSm : t.textMd, fontFamily: fontFamily(t) };
  const isWeb = Platform.OS === 'web';
  const useSheetModal = !isWeb || (winWidth > 0 && winWidth < 520);
  const activeDescendantId =
    isOpen && activeIndex >= 0 && activeIndex < flatVisibleOptions.length + (customCandidate ? 1 : 0)
      ? `${baseId}-opt-${activeIndex}`
      : undefined;

  const variantInputStyle =
    variant === 'filled'
      ? { backgroundColor: t.surfaceSoft, borderColor: 'transparent', paddingLeft: 34, paddingRight: loading ? 34 : undefined }
      : variant === 'subtle'
        ? { backgroundColor: 'transparent', borderColor: 'transparent', paddingLeft: 34, paddingRight: loading ? 34 : undefined }
        : { paddingLeft: 34, paddingRight: loading ? 34 : undefined };

  const variantActionStyle =
    variant === 'filled'
      ? { backgroundColor: t.surfaceSoft, borderColor: 'transparent' }
      : variant === 'subtle'
        ? { backgroundColor: 'transparent', borderColor: 'transparent' }
        : { backgroundColor: t.surface, borderColor: t.border };

  const renderHighlighted = (raw: string, baseStyle: object) => {
    const segments = highlightMatch ? splitMatchHighlightSegments(raw, query) : [{ text: raw, matched: false }];
    return (
      <Text style={baseStyle}>
        {segments.map((seg, idx) =>
          seg.matched ? (
            <Text
              key={idx}
              style={{
                backgroundColor: t.primarySoft,
                color: t.primary,
                fontWeight: fontWeight(t.weightBold),
              }}
            >
              {seg.text}
            </Text>
          ) : (
            seg.text
          ),
        )}
      </Text>
    );
  };

  let optionFlatIdx = -1;
  const renderListboxContent = () => (
    <ScrollView style={useSheetModal ? styles.sheetScroll : styles.panelScroll} keyboardShouldPersistTaps="handled">
      {loading && flatVisibleOptions.length === 0 ? (
        <Text role="status" style={[text, { color: t.textMuted, padding: 12 }]}>{effectiveLoadingMsg}</Text>
      ) : !loading && flatVisibleOptions.length === 0 && !customCandidate ? (
        <Text style={[text, { color: t.textMuted, padding: 12 }]}>{emptyMessage ?? l.noMatches}</Text>
      ) : null}
      {groups.map((grp, gIdx) => {
        const optionNodes = grp.options.map(option => {
          optionFlatIdx += 1;
          const idx = optionFlatIdx;
          const isSelected = isSearchOptionSelected(option.value, value, selectedChips);
          const isActive = activeIndex === idx;
          const isBest = bestMatchValue === option.value;
          const isMaxBlocked =
            Boolean(multiple) &&
            !isSelected &&
            typeof maxSelections === 'number' &&
            maxSelections >= 1 &&
            selectedValues.length >= maxSelections;
          const badgeLabel = option.badge
            ? (typeof option.badge === 'string' ? option.badge : option.badge.label)
            : null;
          const badgeTone = option.badge && typeof option.badge !== 'string' && option.badge.tone
            ? option.badge.tone
            : option.tone;
          const badgeColors = badgeTone ? toneColors(t, badgeTone) : null;

          return (
            <Pressable
              key={option.value}
              nativeID={`${baseId}-opt-${idx}`}
              role="option"
              aria-selected={isSelected}
              aria-readonly={option.readOnly ? true : undefined}
              aria-disabled={option.disabled || option.readOnly || isMaxBlocked || undefined}
              disabled={option.disabled || isMaxBlocked}
              onPress={() => selectOption(option)}
              {...webProps({
                onMouseDown: (e: { preventDefault?: () => void }) => e.preventDefault?.(),
                onMouseEnter: () => setActiveIndex(idx),
              })}
              style={({ pressed, focused }: PressState) => [
                styles.option,
                focusRing(t, focused || isActive),
                {
                  minHeight: Math.max(44, t.controlHeight),
                  backgroundColor: isSelected
                    ? t.primarySoft
                    : pressed || isActive
                      ? t.surfaceRaised
                      : t.surface,
                  opacity: option.disabled || isMaxBlocked ? 0.55 : 1,
                },
              ]}
            >
              <View style={styles.optionRow}>
                <View style={styles.optionCheck}>
                  {isSelected ? <SvgIcon name="check" size={14} color={t.primary} /> : null}
                </View>
                <View style={styles.optionBody}>
                  <View style={styles.optionTopRow}>
                    {renderHighlighted(option.label, [text, { fontWeight: fontWeight(t.weightBold) }])}
                    {option.code ? (
                      <View style={[styles.codeTag, { backgroundColor: t.surfaceSoft, borderColor: t.border }]}>
                        {renderHighlighted(option.code, {
                          color: t.textMuted,
                          fontSize: t.textXs,
                          fontFamily: fontFamily(t),
                        })}
                      </View>
                    ) : null}
                    {isBest ? (
                      <View style={[styles.bestMatchTag, { backgroundColor: t.primarySoft }]}>
                        <Text style={{ color: t.primary, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                          Best match
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {option.description
                    ? renderHighlighted(option.description, {
                        color: t.textMuted,
                        fontSize: t.textSm,
                        fontFamily: fontFamily(t),
                      })
                    : null}
                </View>
                {badgeLabel ? (
                  <View
                    style={[
                      styles.optionBadge,
                      {
                        backgroundColor: badgeColors ? badgeColors.backgroundColor : t.neutralSoft,
                        borderColor: t.border,
                      },
                    ]}
                  >
                    <Text style={{ color: badgeColors ? badgeColors.color : t.text, fontSize: t.textXs, fontFamily: fontFamily(t) }}>
                      {badgeLabel}
                    </Text>
                  </View>
                ) : null}
                {option.readOnly ? <SvgIcon name="lock" size={14} color={t.textMuted} /> : null}
              </View>
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
      {customCandidate ? (
        <Pressable
          nativeID={`${baseId}-opt-${flatVisibleOptions.length}`}
          role="option"
          aria-selected={false}
          onPress={() => selectOption({ value: customCandidate, label: customCandidate }, true)}
          {...webProps({
            onMouseDown: (e: { preventDefault?: () => void }) => e.preventDefault?.(),
            onMouseEnter: () => setActiveIndex(flatVisibleOptions.length),
          })}
          style={({ pressed, focused }: PressState) => [
            styles.option,
            focusRing(t, focused || activeIndex === flatVisibleOptions.length),
            {
              minHeight: Math.max(44, t.controlHeight),
              backgroundColor: pressed || activeIndex === flatVisibleOptions.length ? t.surfaceRaised : t.surfaceBlue,
            },
          ]}
        >
          <View style={styles.optionRow}>
            <SvgIcon name="plus" size={14} color={t.primary} />
            <Text style={[text, { color: t.primary, fontWeight: fontWeight(t.weightBold) }]}>
              {formatCreatableLabel(createLabel, customCandidate)}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </ScrollView>
  );

  const renderInputBar = (inModal = false) => (
    <View style={styles.bar}>
      <View style={[styles.grow, styles.inputIconWrap]}>
        <View style={styles.leadingIconSlot} pointerEvents="none">
          <SvgIcon name="search" size={16} color={t.textMuted} />
        </View>
        <ThemedInput
          role="combobox"
          aria-label={name}
          aria-expanded={isOpen}
          aria-controls={`${baseId}-listbox`}
          aria-activedescendant={activeDescendantId}
          aria-readonly={readOnly}
          aria-disabled={disabled ? true : undefined}
          aria-busy={loading ? true : undefined}
          aria-required={required}
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect={false}
          value={displayedInputValue}
          placeholder={placeholder ?? l.searchPlaceholder}
          readOnly={readOnly}
          editable={!disabled && !readOnly}
          invalid={isInvalid}
          onChangeText={readOnly ? undefined : handleQuery}
          onFocus={readOnly || inModal ? undefined : handleOpen}
          onBlur={() => {
            setIsActivelyTyping(false);
            onBlur?.();
          }}
          onSubmitEditing={readOnly ? undefined : handleSearch}
          style={[
            variantInputStyle,
            size === 'lg' ? { minHeight: controlMinHeight } : undefined,
          ]}
          {...(textInputKeys(onInputKey) as object)}
        />
        {loading ? (
          <View style={styles.trailingSpinnerSlot} pointerEvents="none">
            <ActivityIndicator size="small" color={t.textMuted} />
          </View>
        ) : null}
      </View>
      {hasClearableState ? (
        <Pressable
          role="button"
          aria-label={`${clearLabel ?? 'Clear'} ${name}`}
          onPress={handleClear}
          style={({ pressed, focused }: PressState) => [
            styles.clearIconBtn,
            focusRing(t, focused),
            variantActionStyle,
            {
              minWidth: 44,
              minHeight: controlMinHeight,
              ...(pressed ? { backgroundColor: t.surfaceRaised } : undefined),
            },
          ]}
        >
          <SvgIcon name="close" size={16} color={t.textMuted} />
        </Pressable>
      ) : null}
      {filterMode !== 'remote' ? (
        <Pressable
          role="button"
          aria-label={`Toggle ${name}`}
          aria-expanded={isOpen}
          disabled={locked}
          onPress={() => {
            if (locked) return;
            if (isOpen) handleClose();
            else handleOpen();
          }}
          style={({ pressed, focused }: PressState) => [
            styles.clearIconBtn,
            focusRing(t, focused),
            variantActionStyle,
            {
              minWidth: 44,
              minHeight: controlMinHeight,
              ...(pressed ? { backgroundColor: t.surfaceRaised } : undefined),
              opacity: locked ? 0.5 : 1,
            },
          ]}
        >
          <SvgIcon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
        </Pressable>
      ) : !readOnly ? (
        <EmrButton
          variant="outline"
          label={loading ? effectiveLoadingMsg : l.searchButton}
          disabled={disabled || loading}
          onPress={handleSearch}
        />
      ) : null}
    </View>
  );

  return (
    <View nativeID={controlId} style={[styles.stack, isOpen && isWeb && !useSheetModal ? styles.openStackWeb : undefined]}>
      {labelHidden ? null : (
        <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
          {label ?? l.searchLabel}
          {required ? <Text style={{ color: t.danger }}> *</Text> : null}
        </Text>
      )}
      {multiple && selectedChips.length ? (
        <View role="list" aria-label={l.selectedOptions} style={styles.wrap}>
          {visibleChips.map(item => (
            <View key={item.value} role="listitem" style={[styles.selectedChip, { backgroundColor: t.neutralSoft, borderColor: t.border }]}>
              <Text style={[text, { fontSize: t.textSm }]}>{item.label}</Text>
              {!readOnly && !item.readOnly ? (
                <Pressable
                  role="button"
                  aria-label={l.removeItem(item.label)}
                  disabled={disabled}
                  hitSlop={8}
                  onPress={() => {
                    onRemoveRequested?.(item.value);
                    onSelectionRemoved?.(item.value);
                    const next = selectedValues.filter(v => v !== item.value);
                    onValueChange?.(next);
                  }}
                  style={({ focused }: PressState) => [
                    styles.chipRemoveBtn,
                    focusRing(t, focused),
                  ]}
                >
                  <SvgIcon name="close" size={12} color={t.textMuted} />
                </Pressable>
              ) : null}
            </View>
          ))}
          {overflowChipCount > 0 ? (
            <View style={[styles.selectedChip, { backgroundColor: t.surfaceRaised, borderColor: t.border, paddingRight: 10 }]}>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
                +{overflowChipCount}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View
        ref={el => {
          anchorWrapRef.current = el as unknown as { contains?: (target: unknown) => boolean } | null;
        }}
        style={[styles.anchorWrap, isOpen && isWeb && !useSheetModal ? styles.anchorWrapOpenWeb : undefined]}
      >
        {renderInputBar(false)}
        {isOpen && !useSheetModal ? (
          <View
            nativeID={`${baseId}-listbox`}
            role="list"
            {...webProps({ role: 'listbox' })}
            aria-busy={loading || undefined}
            aria-multiselectable={multiple}
            aria-label={name}
            style={[
              styles.panel,
              styles.panelOverlayWeb,
              { borderColor: t.border, backgroundColor: t.surface },
            ]}
          >
            {renderListboxContent()}
          </View>
        ) : null}
      </View>
      {isOpen && useSheetModal ? (
        <Modal
          visible={isOpen}
          transparent
          statusBarTranslucent
          animationType={winWidth < 520 ? 'slide' : 'fade'}
          onRequestClose={handleClose}
        >
          <Pressable style={styles.sheetBackdrop} onPress={handleClose}>
            <Pressable
              style={[styles.sheetCard, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={e => e.stopPropagation()}
            >
              <View style={styles.sheetHeader}>
                <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                  {name}
                </Text>
                <Pressable
                  role="button"
                  aria-label="Close"
                  onPress={handleClose}
                  style={[styles.clearIconBtn, { minWidth: 44, minHeight: 44, borderColor: t.border }]}
                >
                  <SvgIcon name="close" size={16} color={t.textMuted} />
                </Pressable>
              </View>
              {renderInputBar(true)}
              <View
                nativeID={`${baseId}-listbox`}
                role="list"
                {...webProps({ role: 'listbox' })}
                aria-busy={loading || undefined}
                aria-multiselectable={multiple}
                aria-label={name}
                style={[styles.sheetListWrap, { borderColor: t.border }]}
              >
                {renderListboxContent()}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
      {error ? (
        <Text role="alert" style={{ color: t.danger, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
          {error}
        </Text>
      ) : !disabled && warning ? (
        <Text role="status" style={{ color: t.warning, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
          {warning}
        </Text>
      ) : !disabled && hint ? (
        <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: fontFamily(t) }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export type { EmrStage } from '@drguptavivek/emr-controller';

/**
 * L1 numbered stages. Mechanical: caller supplies stages, the active id, completedIds and any status badge.
 * `readOnly` keeps stages focusable with `aria-readonly="true"` and suppresses selection.
 * Roving tabindex (focused, else active, else first enabled); on web arrows/Home/End move focus.
 */
export function EmrStageStepper({
  controlId,
  stages,
  activeId,
  completedIds = [],
  orientation: orientationProp = 'horizontal',
  size: sizeProp = 'md',
  clickable = true,
  linear = false,
  readOnly = false,
  disabled = false,
  ariaLabel,
  onStageSelect,
  onIntent,
  onFocus,
  onBlur,
  labels,
}: {
  controlId?: string;
  stages: readonly EmrStage[];
  activeId?: string;
  completedIds?: readonly string[];
  orientation?: EmrStageStepperOrientation;
  size?: EmrStageStepperSize;
  clickable?: boolean;
  linear?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onStageSelect?: (id: string) => void;
  onIntent?: (intent: EmrStageStepperIntent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  labels?: Partial<InteractiveLabels>;
}) {
  const t = useEmrTheme();
  const l = { ...interactiveLabelDefaults, ...labels };
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const refs = useRef<FocusRef>([]);
  const orientation = normalizeEmrStageStepperOrientation(orientationProp);
  const size = normalizeEmrStageStepperSize(sizeProp);
  const tabStop = resolveStageStepperTabStopId(stages, focusedId, activeId, disabled);
  const onKey = (e: WebKeyEvent, index: number) => {
    const target = getNextStageStepperIndex(stages, index, e.key, disabled);
    if (target === null) return;
    e.preventDefault();
    refs.current[target]?.focus();
  };
  const vertical = orientation === 'vertical';
  return (
    <View nativeID={controlId} role="navigation" aria-label={ariaLabel ?? l.stagesAria} style={disabled ? { opacity: 0.55 } : undefined}>
      <View
        role="list"
        style={[
          styles.stages,
          vertical && styles.stagesV,
          {
            borderColor: t.border,
            borderStyle: readOnly ? 'dashed' : 'solid',
            backgroundColor: t.surfaceSlate,
            borderRadius: 8,
            overflow: 'hidden',
          },
        ]}
      >
        {stages.map((stage, i) => {
          const active = stage.id === activeId;
          const completed = completedIds.includes(stage.id);
          const stageDisabled = disabled || Boolean(stage.disabled);
          const canSelect = canSelectEmrStage(stage, {
            readOnly,
            disabled,
            clickable,
            linear,
            activeId,
            stages,
            completedIds,
          });
          const badge = stage.status ? toneColors(t, stage.status.tone) : null;
          const body = (
            <>
              <View
                aria-hidden
                style={[
                  styles.number,
                  { backgroundColor: completed ? t.successSoft : t.neutralSoft },
                ]}
              >
                {completed ? (
                  <SvgIcon name="check" size={14} color={t.success} />
                ) : (
                  <Text style={{ color: t.text, fontSize: t.textXs, fontWeight: fontWeight(t.weightBold), fontFamily: fontFamily(t) }}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <View style={styles.grow}>
                <Text
                  style={{
                    color: active ? t.primary : t.text,
                    fontSize: size === 'sm' ? t.textSm : t.textMd,
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
              paddingVertical: size === 'sm' ? 8 : 10,
              paddingHorizontal: size === 'sm' ? 10 : 14,
              borderBottomWidth: active ? 3 : vertical && i < stages.length - 1 ? 1 : 0,
              borderBottomColor: active ? t.primary : t.border,
              borderRightWidth: !vertical && i < stages.length - 1 ? 1 : 0,
              borderRightColor: t.border,
              backgroundColor: active ? t.surfaceAccent : 'transparent',
              opacity: stage.disabled && !disabled ? 0.55 : 1,
            },
          ];
          return (
            <View key={stage.id} role="listitem" style={vertical ? undefined : styles.stageItem}>
              <Pressable
                ref={el => {
                  refs.current[i] = el;
                }}
                aria-current={active ? 'step' : undefined}
                aria-label={a11yLabel}
                aria-readonly={readOnly || undefined}
                aria-disabled={stageDisabled || undefined}
                disabled={stageDisabled}
                onPress={() => {
                  if (!canSelect) return;
                  onStageSelect?.(stage.id);
                  onIntent?.({ type: 'stageSelected', stageId: stage.id });
                }}
                onFocus={() => {
                  setFocusedId(stage.id);
                  onFocus?.();
                }}
                onBlur={onBlur}
                {...webProps({
                  tabIndex: stage.id === tabStop ? 0 : -1,
                  onKeyDown: (e: WebKeyEvent) => onKey(e, i),
                })}
                style={(state: PressState) => [
                  ...frame,
                  focusRing(t, state.focused),
                  canSelect && ((state as unknown as { hovered?: boolean }).hovered || state.pressed)
                    ? { backgroundColor: t.surfaceSoft }
                    : undefined,
                ]}
              >
                {body}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  openStackWeb: { zIndex: 100 },
  anchorWrap: { position: 'relative' },
  anchorWrapOpenWeb: { zIndex: 100 },
  grow: { flex: 1, minWidth: 0 },
  inputIconWrap: { position: 'relative', justifyContent: 'center' },
  leadingIconSlot: { position: 'absolute', left: 10, zIndex: 2, justifyContent: 'center', alignItems: 'center' },
  trailingSpinnerSlot: { position: 'absolute', right: 10, zIndex: 2, justifyContent: 'center', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearIconBtn: { borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingLeft: 12, paddingRight: 4, paddingVertical: 2 },
  chipRemoveBtn: { minWidth: 44, minHeight: 44, marginVertical: -10, marginRight: -4, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  panel: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  panelOverlayWeb: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    zIndex: 100,
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  panelInlineNative: { marginTop: 4 },
  panelScroll: { maxHeight: 268 },
  option: { justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionCheck: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  optionBody: { flex: 1, minWidth: 0, gap: 2 },
  optionTopRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  codeTag: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  bestMatchTag: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  optionBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 12,
  },
  sheetCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    maxHeight: '85%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sheetListWrap: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  sheetScroll: { maxHeight: 320 },
  stages: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1 },
  stagesV: { flexDirection: 'column', flexWrap: 'nowrap' },
  stageItem: { flexGrow: 1, flexBasis: 180 },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  number: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
});
