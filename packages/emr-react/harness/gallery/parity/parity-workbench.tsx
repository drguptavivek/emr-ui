'use client';

import { Component, createElement, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { EmrBadgeView, EmrThemeProvider, useEmrTheme } from '../../../src';
import { EMR_REGISTRY_MANIFEST } from '../registry-manifest';
import { PARITY_BY_SELECTOR } from './index';
import type { ParityEntry, ParityLogEntry, ParityRenderContext, ParitySource } from './types';

type LayerFilter = 'all' | 'shells' | 1 | 2 | 3 | 4 | 6;
type LayoutMode = 'split' | 'stacked';
type PaneWidthPreset = 'fluid' | '1280' | '768' | '390';

interface WorkbenchCatalogItem {
  readonly selector: string;
  readonly name: string;
  readonly reactName: string;
  readonly litName: string;
  readonly layer: number;
  readonly layerName: string;
  readonly categories: readonly string[];
  readonly description: string;
  readonly reactInstall: string;
  readonly litInstall: string;
  readonly shell: boolean;
  readonly entry: ParityEntry | undefined;
}

const PANE_WIDTH_OPTIONS: readonly { id: PaneWidthPreset; label: string; maxWidth: number | undefined }[] = [
  { id: 'fluid', label: 'Fluid 4K', maxWidth: undefined },
  { id: '1280', label: '1280px', maxWidth: 1280 },
  { id: '768', label: '768px', maxWidth: 768 },
  { id: '390', label: '390px', maxWidth: 390 },
];

const DEFAULT_SELECTOR = 'emr-prescribing-table';

function destroyOwnedController(state: unknown): void {
  if (!state || typeof state !== 'object') return;
  const candidate = state as { controller?: { destroy?: () => void }; destroy?: () => void };
  if (typeof candidate.controller?.destroy === 'function') {
    candidate.controller.destroy();
  } else if (typeof candidate.destroy === 'function') {
    candidate.destroy();
  }
}

function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function safeFormatPayload(detail: unknown): string {
  if (detail === undefined) return 'void';
  try {
    const text = JSON.stringify(detail);
    if (!text) return String(detail);
    return text.length > 260 ? `${text.slice(0, 257)}...` : text;
  } catch {
    return '[unserializable payload]';
  }
}

interface PaneErrorBoundaryProps {
  readonly paneLabel: string;
  readonly resetKey: string;
  readonly onReset: () => void;
  readonly children: ReactNode;
}

interface PaneErrorBoundaryState {
  readonly errorMessage: string | null;
}

class PaneErrorBoundary extends Component<PaneErrorBoundaryProps, PaneErrorBoundaryState> {
  override state: PaneErrorBoundaryState = { errorMessage: null };

  static getDerivedStateFromError(error: unknown): PaneErrorBoundaryState {
    return {
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  override componentDidUpdate(prevProps: PaneErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.errorMessage !== null) {
      this.setState({ errorMessage: null });
    }
  }

  override componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    // Surfaced inline in the pane card.
  }

  override render(): ReactNode {
    if (this.state.errorMessage !== null) {
      return (
        <View style={{ padding: 16, borderWidth: 1, borderColor: '#dc2626', borderRadius: 8, gap: 10 }}>
          <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 14 }}>
            {this.props.paneLabel} render error
          </Text>
          <Text selectable style={{ color: '#dc2626', fontSize: 12 }}>
            {this.state.errorMessage}
          </Text>
          <Pressable
            role="button"
            onPress={() => {
              this.setState({ errorMessage: null });
              this.props.onReset();
            }}
            style={{
              alignSelf: 'flex-start',
              minHeight: 44,
              paddingHorizontal: 14,
              justifyContent: 'center',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#dc2626',
            }}
          >
            <Text style={{ color: '#dc2626', fontWeight: '600', fontSize: 13 }}>Reset component state</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export function ParityWorkbench({ radiusPx = 8 }: { readonly radiusPx?: number }) {
  const t = useEmrTheme();

  const catalogItems = useMemo<readonly WorkbenchCatalogItem[]>(() => {
    const categoryNames = EMR_REGISTRY_MANIFEST.categories as Record<string, string>;
    const list: WorkbenchCatalogItem[] = [];
    for (const raw of EMR_REGISTRY_MANIFEST.items) {
      const litSel =
        'lit' in raw && raw.lit && 'selector' in raw.lit && typeof raw.lit.selector === 'string' && raw.lit.selector.length > 0
          ? raw.lit.selector
          : null;
      if (!litSel) continue;
      const baseName = raw.name;
      const entry = PARITY_BY_SELECTOR.get(litSel);
      list.push({
        selector: litSel,
        name: baseName,
        reactName: 'reactName' in raw && typeof raw.reactName === 'string' ? raw.reactName : baseName,
        litName: 'litName' in raw && typeof raw.litName === 'string' ? raw.litName : baseName,
        layer: raw.layer,
        layerName: raw.layerName,
        categories: raw.categories.map((cat) => categoryNames[cat] ?? cat),
        description: raw.description,
        reactInstall:
          'installCommand' in raw && raw.installCommand && typeof raw.installCommand.react === 'string'
            ? raw.installCommand.react
            : `pnpm emr add ${raw.name} --framework react`,
        litInstall:
          'installCommand' in raw && raw.installCommand && typeof raw.installCommand.lit === 'string'
            ? raw.installCommand.lit
            : `pnpm emr add ${raw.name} --framework lit`,
        shell: Boolean(entry?.shell),
        entry,
      });
    }
    return list;
  }, []);

  const categoryOptions = useMemo(() => {
    const entries = Object.entries(EMR_REGISTRY_MANIFEST.categories) as [string, string][];
    return entries.map(([id, label]) => ({ id, label }));
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [layout, setLayout] = useState<LayoutMode>('split');
  const [paneWidth, setPaneWidth] = useState<PaneWidthPreset>('fluid');
  const [readOnly, setReadOnly] = useState(false);
  const [printPreview, setPrintPreview] = useState(false);
  const [logOpen, setLogOpen] = useState(true);
  const [logs, setLogs] = useState<readonly ParityLogEntry[]>([]);
  const logSeqRef = useRef(0);

  const [activeSelector, setActiveSelector] = useState<string>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('component');
      if (fromUrl && PARITY_BY_SELECTOR.has(fromUrl)) {
        return fromUrl;
      }
    }
    return DEFAULT_SELECTOR;
  });

  const [sharedSlot, setSharedSlot] = useState<{
    readonly selector: string;
    readonly revision: number;
    readonly value: unknown;
  }>(() => {
    const initialSelector =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? (() => {
            const fromUrl = new URLSearchParams(window.location.search).get('component');
            return fromUrl && PARITY_BY_SELECTOR.has(fromUrl) ? fromUrl : DEFAULT_SELECTOR;
          })()
        : DEFAULT_SELECTOR;
    const entry = PARITY_BY_SELECTOR.get(initialSelector);
    return {
      selector: initialSelector,
      revision: 0,
      value: entry ? entry.createInitialState() : null,
    };
  });

  const ownedValueRef = useRef<unknown>(sharedSlot.value);
  useEffect(() => {
    const prev = ownedValueRef.current;
    if (prev !== sharedSlot.value) {
      // Only destroy when switching components or resetting revision, not during normal immutable updates
      // that preserve the same controller reference.
      const prevCtrl = (prev as { controller?: unknown } | null)?.controller;
      const nextCtrl = (sharedSlot.value as { controller?: unknown } | null)?.controller;
      if (prevCtrl && prevCtrl !== nextCtrl) {
        destroyOwnedController(prev);
      }
      ownedValueRef.current = sharedSlot.value;
    }
  }, [sharedSlot]);

  useEffect(() => {
    return () => {
      destroyOwnedController(ownedValueRef.current);
    };
  }, []);

  const selectComponent = useCallback((nextSelector: string) => {
    const entry = PARITY_BY_SELECTOR.get(nextSelector);
    setActiveSelector(nextSelector);
    setSharedSlot((prev) => {
      destroyOwnedController(prev.value);
      return {
        selector: nextSelector,
        revision: prev.revision + 1,
        value: entry ? entry.createInitialState() : null,
      };
    });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'parity');
      url.searchParams.set('component', nextSelector);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const resetActiveState = useCallback(() => {
    const entry = PARITY_BY_SELECTOR.get(activeSelector);
    setSharedSlot((prev) => {
      destroyOwnedController(prev.value);
      return {
        selector: activeSelector,
        revision: prev.revision + 1,
        value: entry ? entry.createInitialState() : null,
      };
    });
    logSeqRef.current += 1;
    const entryLog: ParityLogEntry = {
      id: logSeqRef.current,
      at: formatTime(new Date()),
      source: 'react',
      selector: activeSelector,
      event: 'workbench.resetState',
      payload: { selector: activeSelector },
    };
    setLogs((prev) => [entryLog, ...prev].slice(0, 50));
  }, [activeSelector]);

  // Keep URL synced on initial mount into Parity tab
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== 'parity' || url.searchParams.get('component') !== activeSelector) {
      url.searchParams.set('tab', 'parity');
      url.searchParams.set('component', activeSelector);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [activeSelector]);

  const counts = useMemo(() => {
    let shells = 0;
    let l1 = 0;
    let l2 = 0;
    let l3 = 0;
    let l4 = 0;
    let l6 = 0;
    for (const item of catalogItems) {
      if (item.shell) shells += 1;
      if (item.layer === 1) l1 += 1;
      else if (item.layer === 2) l2 += 1;
      else if (item.layer === 3) l3 += 1;
      else if (item.layer === 4) l4 += 1;
      else if (item.layer === 6) l6 += 1;
    }
    return { all: catalogItems.length, shells, l1, l2, l3, l4, l6 };
  }, [catalogItems]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selectedCategoryLabel =
      categoryFilter === 'all'
        ? null
        : ((EMR_REGISTRY_MANIFEST.categories as Record<string, string>)[categoryFilter] ?? categoryFilter);

    return catalogItems.filter((item) => {
      if (layerFilter === 'shells' && !item.shell) return false;
      if (typeof layerFilter === 'number' && item.layer !== layerFilter) return false;
      if (selectedCategoryLabel && !item.categories.includes(selectedCategoryLabel)) return false;
      if (!q) return true;
      return (
        item.selector.toLowerCase().includes(q) ||
        item.reactName.toLowerCase().includes(q) ||
        item.litName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categories.some((cat) => cat.toLowerCase().includes(q))
      );
    });
  }, [catalogItems, search, layerFilter, categoryFilter]);

  const activeItem = useMemo(
    () => catalogItems.find((item) => item.selector === activeSelector) ?? catalogItems[0],
    [catalogItems, activeSelector],
  );

  const activeFilteredIndex = useMemo(
    () => filteredItems.findIndex((item) => item.selector === activeItem?.selector),
    [filteredItems, activeItem],
  );

  const goRelative = useCallback(
    (delta: -1 | 1) => {
      if (filteredItems.length === 0) return;
      const baseIndex = activeFilteredIndex >= 0 ? activeFilteredIndex : 0;
      const nextIndex = (baseIndex + delta + filteredItems.length) % filteredItems.length;
      const target = filteredItems[nextIndex];
      if (target) {
        selectComponent(target.selector);
      }
    },
    [filteredItems, activeFilteredIndex, selectComponent],
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
        // Also skip when focus is inside a Shadow DOM input/textarea/select
        const activeShadowEl = target.shadowRoot?.activeElement as HTMLElement | null | undefined;
        if (activeShadowEl) {
          const shadowTag = activeShadowEl.tagName;
          if (
            shadowTag === 'INPUT' ||
            shadowTag === 'TEXTAREA' ||
            shadowTag === 'SELECT' ||
            activeShadowEl.isContentEditable
          ) {
            return;
          }
        }
      }
      if (event.key === '[' || (event.altKey && event.key === 'ArrowLeft')) {
        event.preventDefault();
        goRelative(-1);
      } else if (event.key === ']' || (event.altKey && event.key === 'ArrowRight')) {
        event.preventDefault();
        goRelative(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goRelative]);

  const handleUpdate = useCallback(
    (
      source: ParitySource,
      event: string,
      payload: unknown,
      updater?: (prev: unknown) => unknown,
    ) => {
      if (updater) {
        setSharedSlot((prev) => {
          if (prev.selector !== activeSelector) return prev;
          return {
            selector: prev.selector,
            revision: prev.revision,
            value: updater(prev.value),
          };
        });
      }
      logSeqRef.current += 1;
      const item: ParityLogEntry = {
        id: logSeqRef.current,
        at: formatTime(new Date()),
        source,
        selector: activeSelector,
        event,
        payload,
      };
      setLogs((prev) => [item, ...prev].slice(0, 50));
    },
    [activeSelector],
  );

  const currentEntry = activeItem?.entry;
  const effectiveState =
    sharedSlot.selector === activeItem?.selector
      ? sharedSlot.value
      : currentEntry
        ? currentEntry.createInitialState()
        : null;

  const renderContext = useMemo<ParityRenderContext<unknown>>(
    () => ({
      state: effectiveState,
      readOnly,
      update: handleUpdate,
    }),
    [effectiveState, readOnly, handleUpdate],
  );

  const maxPaneWidth = PANE_WIDTH_OPTIONS.find((opt) => opt.id === paneWidth)?.maxWidth;
  const reactLogCount = useMemo(() => logs.filter((l) => l.source === 'react').length, [logs]);
  const litLogCount = useMemo(() => logs.filter((l) => l.source === 'lit').length, [logs]);

  const toolbarChip = (key: string, label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      role="button"
      aria-pressed={active}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderRadius: radiusPx,
        borderWidth: 1,
        borderColor: active ? t.primary : t.border,
        backgroundColor: active ? t.primarySoft : t.surface,
      }}
    >
      <Text
        style={{
          color: active ? t.primaryContrast : t.text,
          fontSize: t.textXs,
          fontWeight: active ? '700' : '600',
          fontFamily: t.fontFamily,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const renderPaneBody = (pane: 'react' | 'lit') => {
    if (!currentEntry || !activeItem) {
      return (
        <View style={{ padding: 20 }}>
          <Text style={{ color: t.danger, fontSize: t.textSm, fontFamily: t.fontFamily }}>
            No parity descriptor registered for {activeItem?.selector ?? 'unknown selector'}.
          </Text>
        </View>
      );
    }

    const content = (
      <PaneErrorBoundary
        paneLabel={pane === 'react' ? 'React (@drguptavivek/emr-react)' : 'Lit (@drguptavivek/emr-elements)'}
        resetKey={`${activeItem.selector}:${sharedSlot.revision}:${readOnly ? 'ro' : 'rw'}`}
        onReset={resetActiveState}
      >
        {pane === 'react' ? currentEntry.renderReact(renderContext) : currentEntry.renderLit(renderContext)}
      </PaneErrorBoundary>
    );

    if (!printPreview) {
      return (
        <View style={{ width: '100%', maxWidth: maxPaneWidth, alignSelf: 'center' }}>
          {content}
        </View>
      );
    }

    // Print preview context (.emr-print forces light print tokens & expands sections in Lit and React)
    const wrappedReact = pane === 'react' ? <EmrThemeProvider scheme="light">{content}</EmrThemeProvider> : content;
    if (Platform.OS === 'web') {
      return createElement(
        'div',
        {
          className: 'emr-print emr-theme-light',
          style: {
            width: '100%',
            maxWidth: maxPaneWidth ? `${maxPaneWidth}px` : undefined,
            margin: '0 auto',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            padding: '16px',
            borderRadius: `${radiusPx}px`,
            border: '1px dashed #94a3b8',
            boxSizing: 'border-box',
          },
        },
        wrappedReact,
      );
    }
    return (
      <View
        style={{
          width: '100%',
          maxWidth: maxPaneWidth,
          alignSelf: 'center',
          backgroundColor: '#ffffff',
          padding: 16,
          borderRadius: radiusPx,
          borderWidth: 1,
          borderColor: '#94a3b8',
        }}
      >
        {wrappedReact}
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        backgroundColor: t.background,
        alignItems: 'stretch',
      }}
    >
      {/* Left Collapsible Component Navigator */}
      {sidebarOpen ? (
        <View
          style={{
            width: 330,
            borderRightWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            padding: 12,
            gap: 10,
            flexShrink: 0,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: '700', fontFamily: t.fontFamily }}>
              Catalog Navigator ({filteredItems.length} / {counts.all})
            </Text>
            <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: t.fontMono }}>
              [ / ] step
            </Text>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search <emr-*>, Emr*, clinical area..."
            placeholderTextColor={t.textMuted}
            aria-label="Filter parity workbench components"
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: radiusPx,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.background,
              color: t.text,
              fontSize: t.textSm,
              fontFamily: t.fontFamily,
            }}
          />

          {/* Layer & Shells Filter Pills */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {toolbarChip('flt-all', `All (${counts.all})`, layerFilter === 'all', () => setLayerFilter('all'))}
            {toolbarChip('flt-shells', `Shells (${counts.shells})`, layerFilter === 'shells', () => setLayerFilter('shells'))}
            {toolbarChip('flt-l1', `L1 (${counts.l1})`, layerFilter === 1, () => setLayerFilter(1))}
            {toolbarChip('flt-l2', `L2 (${counts.l2})`, layerFilter === 2, () => setLayerFilter(2))}
            {toolbarChip('flt-l3', `L3 (${counts.l3})`, layerFilter === 3, () => setLayerFilter(3))}
            {toolbarChip('flt-l4', `L4 (${counts.l4})`, layerFilter === 4, () => setLayerFilter(4))}
            {toolbarChip('flt-l6', `L6 (${counts.l6})`, layerFilter === 6, () => setLayerFilter(6))}
          </View>

          {/* Clinical Specialty / Workflow Filter */}
          {Platform.OS === 'web' ? (
            createElement(
              'select',
              {
                'aria-label': 'Filter by clinical specialty or workflow',
                value: categoryFilter,
                onChange: (e: { target: { value: string } }) => setCategoryFilter(e.target.value),
                style: {
                  minHeight: '44px',
                  width: '100%',
                  padding: '0 10px',
                  borderRadius: `${radiusPx}px`,
                  border: `1px solid ${t.border}`,
                  backgroundColor: t.background,
                  color: t.text,
                  fontSize: `${t.textXs}px`,
                  fontFamily: t.fontFamily,
                },
              },
              createElement('option', { value: 'all' }, 'All Specialties & Workflows (22)'),
              ...categoryOptions.map((opt) =>
                createElement('option', { key: opt.id, value: opt.id }, opt.label),
              ),
            )
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {toolbarChip('cat-all', 'All Areas', categoryFilter === 'all', () => setCategoryFilter('all'))}
              {categoryOptions.map((opt) =>
                toolbarChip(`cat-${opt.id}`, opt.label, categoryFilter === opt.id, () => setCategoryFilter(opt.id)),
              )}
            </ScrollView>
          )}

          {/* Component List */}
          <ScrollView
            style={
              Platform.OS === 'web'
                ? ({ flex: 1, maxHeight: 'calc(100vh - 340px)' } as unknown as object)
                : { flex: 1 }
            }
            contentContainerStyle={{ gap: 6, paddingBottom: 16 }}
          >
            {filteredItems.length === 0 ? (
              <View style={{ padding: 16, gap: 8 }}>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: t.fontFamily }}>
                  No components match the active filter.
                </Text>
                <Pressable
                  role="button"
                  onPress={() => {
                    setSearch('');
                    setLayerFilter('all');
                    setCategoryFilter('all');
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    minHeight: 44,
                    paddingHorizontal: 12,
                    justifyContent: 'center',
                    borderRadius: radiusPx,
                    borderWidth: 1,
                    borderColor: t.primary,
                    backgroundColor: t.primarySoft,
                  }}
                >
                  <Text style={{ color: t.primaryContrast, fontSize: t.textXs, fontWeight: '700', fontFamily: t.fontFamily }}>
                    Clear filters
                  </Text>
                </Pressable>
              </View>
            ) : (
              filteredItems.map((item) => {
                const selected = item.selector === activeItem?.selector;
                return (
                  <Pressable
                    key={item.selector}
                    role="button"
                    aria-pressed={selected}
                    onPress={() => selectComponent(item.selector)}
                    style={{
                      minHeight: 52,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: radiusPx,
                      borderWidth: 1,
                      borderColor: selected ? t.primary : t.border,
                      backgroundColor: selected ? t.primarySoft : t.background,
                      gap: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          color: selected ? t.primaryContrast : t.text,
                          fontSize: t.textXs,
                          fontWeight: '700',
                          fontFamily: t.fontMono,
                        }}
                      >
                        {`<${item.selector}>`}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                        {item.shell ? <EmrBadgeView badge={{ label: 'SHELL', tone: 'info' }} /> : null}
                        <EmrBadgeView badge={{ label: `L${item.layer}`, tone: selected ? 'info' : 'neutral' }} />
                      </View>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: selected ? t.primaryContrast : t.textMuted,
                        fontSize: t.text2xs,
                        fontFamily: t.fontFamily,
                      }}
                    >
                      {item.reactName} · {item.categories[0] ?? item.layerName}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}

      {/* Right Full-Width 4K Comparison Workspace */}
      <View style={{ flex: 1, minWidth: 0, padding: 16, gap: 14 }}>
        {/* Workbench Toolbar & Component Metadata Header */}
        <View
          style={{
            padding: 14,
            borderRadius: Math.max(0, radiusPx + 2),
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            gap: 12,
          }}
        >
          {/* Top Row: Navigation + Controls */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              {toolbarChip(
                'toggle-sidebar',
                sidebarOpen ? 'Hide Navigator' : `Show Navigator (${counts.all})`,
                !sidebarOpen,
                () => setSidebarOpen((v) => !v),
              )}
              {toolbarChip('nav-prev', '← Prev', false, () => goRelative(-1))}
              <View
                style={{
                  minHeight: 44,
                  paddingHorizontal: 10,
                  justifyContent: 'center',
                  borderRadius: radiusPx,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.background,
                }}
              >
                <Text style={{ color: t.text, fontSize: t.textXs, fontWeight: '700', fontFamily: t.fontMono }}>
                  {activeFilteredIndex >= 0 ? `${activeFilteredIndex + 1} / ${filteredItems.length}` : `— / ${filteredItems.length}`}
                </Text>
              </View>
              {toolbarChip('nav-next', 'Next →', false, () => goRelative(1))}
            </View>

            {/* Right Controls: Split/Stacked, Width Presets, ReadOnly, Print, Reset */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              {toolbarChip(
                'layout-split',
                'Side-by-Side (50/50)',
                layout === 'split',
                () => setLayout('split'),
              )}
              {toolbarChip(
                'layout-stacked',
                'Stacked (100%)',
                layout === 'stacked',
                () => setLayout('stacked'),
              )}

              <View style={{ width: 1, height: 28, backgroundColor: t.border }} />

              {PANE_WIDTH_OPTIONS.map((opt) =>
                toolbarChip(`width-${opt.id}`, opt.label, paneWidth === opt.id, () => setPaneWidth(opt.id)),
              )}

              <View style={{ width: 1, height: 28, backgroundColor: t.border }} />

              {toolbarChip(
                'toggle-readonly',
                readOnly ? 'Locked: Read-Only' : 'Mode: Interactive',
                readOnly,
                () => setReadOnly((v) => !v),
              )}
              {toolbarChip(
                'toggle-print',
                printPreview ? 'Print (.emr-print)' : 'Screen Context',
                printPreview,
                () => setPrintPreview((v) => !v),
              )}
              {toolbarChip('btn-reset', 'Reset State', false, resetActiveState)}
            </View>
          </View>

          {/* Bottom Row: Active Component Identity & Notes */}
          {activeItem ? (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text
                  role="heading"
                  aria-level={2}
                  style={{ color: t.text, fontSize: t.textLg, fontWeight: '700', fontFamily: t.fontFamily }}
                >
                  {activeItem.reactName}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: t.fontMono }}>⇄</Text>
                <Text style={{ color: t.primaryContrast, fontSize: t.textMd, fontWeight: '700', fontFamily: t.fontMono }}>
                  {`<${activeItem.selector}>`}
                </Text>
                <EmrBadgeView badge={{ label: `L${activeItem.layer} · ${activeItem.layerName}`, tone: 'info' }} />
                {activeItem.shell ? <EmrBadgeView badge={{ label: 'SHELL SURFACE', tone: 'warning' }} /> : null}
                {activeItem.categories.map((cat) => (
                  <EmrBadgeView key={cat} badge={{ label: cat, tone: 'neutral' }} />
                ))}
              </View>
              <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: t.fontFamily }}>
                {activeItem.description}
              </Text>
              {currentEntry?.notes ? (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: radiusPx,
                    borderWidth: 1,
                    borderColor: t.primaryBorder,
                    backgroundColor: t.infoSoft,
                  }}
                >
                  <Text style={{ color: t.info, fontSize: t.textXs, fontFamily: t.fontFamily }}>
                    Parity note: {currentEntry.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Side-by-Side (or Stacked) Live Renderer Stage */}
        <View
          style={{
            flexDirection: layout === 'split' ? 'row' : 'column',
            gap: 16,
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          {/* Left Pane: React (@drguptavivek/emr-react) */}
          <View
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: Math.max(0, radiusPx + 2),
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surface,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surfaceSoft,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <EmrBadgeView badge={{ label: 'React · @drguptavivek/emr-react', tone: 'info' }} />
                <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: '700', fontFamily: t.fontMono }}>
                  {activeItem ? `<${activeItem.reactName} />` : '—'}
                </Text>
              </View>
              <Text selectable style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: t.fontMono }}>
                {activeItem?.reactInstall}
              </Text>
            </View>

            <ScrollView
              horizontal={paneWidth !== 'fluid'}
              contentContainerStyle={{ flexGrow: 1, padding: 16 }}
            >
              {renderPaneBody('react')}
            </ScrollView>
          </View>

          {/* Right Pane: Lit Web Component (@drguptavivek/emr-elements) */}
          <View
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: Math.max(0, radiusPx + 2),
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surface,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surfaceSoft,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <EmrBadgeView badge={{ label: 'Lit · @drguptavivek/emr-elements', tone: 'success' }} />
                <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: '700', fontFamily: t.fontMono }}>
                  {activeItem ? `<${activeItem.selector}>` : '—'}
                </Text>
                <EmrBadgeView badge={{ label: 'Shadow DOM', tone: 'neutral' }} />
              </View>
              <Text selectable style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: t.fontMono }}>
                {activeItem?.litInstall}
              </Text>
            </View>

            <ScrollView
              horizontal={paneWidth !== 'fluid'}
              contentContainerStyle={{ flexGrow: 1, padding: 16 }}
            >
              {renderPaneBody('lit')}
            </ScrollView>
          </View>
        </View>

        {/* Shared Live Intent & Event Stream */}
        <View
          style={{
            borderRadius: Math.max(0, radiusPx + 2),
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderBottomWidth: logOpen ? 1 : 0,
              borderColor: t.border,
              backgroundColor: t.surfaceSoft,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: '700', fontFamily: t.fontFamily }}>
                Shared Controller & Typed Intent Stream
              </Text>
              <EmrBadgeView badge={{ label: `React: ${reactLogCount}`, tone: 'info' }} />
              <EmrBadgeView badge={{ label: `Lit: ${litLogCount}`, tone: 'success' }} />
              <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: t.fontFamily }}>
                Both panes bind to the same immutable view model; edits in either pane re-render both immediately.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {toolbarChip('btn-clear-logs', 'Clear Stream', false, () => setLogs([]))}
              {toolbarChip(
                'btn-toggle-logs',
                logOpen ? 'Collapse Stream' : `Show Stream (${logs.length})`,
                false,
                () => setLogOpen((v) => !v),
              )}
            </View>
          </View>

          {logOpen ? (
            <View style={{ padding: 12, gap: 6, maxHeight: 220 }}>
              {logs.length === 0 ? (
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: t.fontFamily }}>
                  Interact with either the React component (left) or the Lit Custom Element (right) to inspect emitted intents and verify bidirectional state parity.
                </Text>
              ) : (
                <ScrollView contentContainerStyle={{ gap: 6 }}>
                  {logs.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: radiusPx,
                        borderWidth: 1,
                        borderColor: t.border,
                        backgroundColor: t.background,
                      }}
                    >
                      <Text style={{ color: t.textMuted, fontSize: t.text2xs, fontFamily: t.fontMono }}>
                        {item.at}
                      </Text>
                      <EmrBadgeView
                        badge={{
                          label: item.source === 'react' ? 'React' : 'Lit',
                          tone: item.source === 'react' ? 'info' : 'success',
                        }}
                      />
                      <Text style={{ color: t.text, fontSize: t.textXs, fontWeight: '700', fontFamily: t.fontMono }}>
                        {item.event}
                      </Text>
                      <Text
                        selectable
                        style={{ flex: 1, minWidth: 200, color: t.textMuted, fontSize: t.text2xs, fontFamily: t.fontMono }}
                      >
                        {safeFormatPayload(item.payload)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
