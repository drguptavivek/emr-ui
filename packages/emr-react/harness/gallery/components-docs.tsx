'use client';

import { Component, createElement, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { EmrBadgeView, EmrThemeProvider, useEmrTheme, type EmrColorScheme } from '../../src';
import { EMR_COMPONENT_API } from './component-api-manifest';
import { PARITY_BY_SELECTOR } from './parity';
import { resolveSitePublicUrl } from './parity/lit-element-host';
import type { ParityEntry, ParityRenderContext, ParitySource } from './parity/types';
import { EMR_REGISTRY_MANIFEST } from './registry-manifest';

type FrameworkView = 'all' | 'react' | 'lit' | 'angular';
type LayerFilter = 'all' | 1 | 2 | 3 | 4 | 6;
type ViewportPreset = 'auto' | '768' | '390';
type SnippetFramework = 'react' | 'angular' | 'lit' | 'expo';

interface CatalogComponentItem {
  readonly selector: string;
  readonly displayName: string;
  readonly reactName: string;
  readonly angularName: string;
  readonly litName: string;
  readonly layer: number;
  readonly layerName: string;
  readonly description: string;
  readonly categories: readonly string[];
  readonly stories: readonly string[];
  readonly reactImport: string;
  readonly angularImport: string;
  readonly litImport: string;
  readonly expoImport: string;
  readonly installCommands: {
    readonly react: string;
    readonly angular: string;
    readonly lit: string;
    readonly expo: string;
  };
  readonly entry: ParityEntry | undefined;
}

const LAYER_LABELS: Readonly<Record<number, string>> = {
  1: 'L1 · Primitives',
  2: 'L2 · Clinical Fields',
  3: 'L3 · Structures',
  4: 'L4 · Clinical Domain',
  6: 'L6 · Authoring',
};

const LAYER_ORDER: readonly number[] = [1, 2, 3, 4, 6];

function formatDisplayName(reactName: string, selector: string): string {
  const base = reactName ? reactName.replace(/^Emr/, '') : selector.replace(/^emr-/, '');
  return base
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function destroyOwnedController(state: unknown): void {
  if (!state || typeof state !== 'object') return;
  const candidate = state as { controller?: { destroy?: () => void }; destroy?: () => void };
  if (typeof candidate.controller?.destroy === 'function') {
    candidate.controller.destroy();
  } else if (typeof candidate.destroy === 'function') {
    candidate.destroy();
  }
}

function safeFormatPayload(detail: unknown): string {
  if (detail === undefined) return 'void';
  try {
    const text = JSON.stringify(detail);
    if (!text) return String(detail);
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  } catch {
    return '[unserializable payload]';
  }
}

function resolveAngularPreviewUrl(selector: string, colorScheme: EmrColorScheme): string {
  if (typeof window === 'undefined') {
    return `http://localhost:4200/?selector=${encodeURIComponent(selector)}&theme=${colorScheme}`;
  }
  const { hostname } = window.location;
  const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';
  const base = isLocalDev ? 'http://localhost:4200/' : resolveSitePublicUrl('angular/index.html');
  return `${base}?selector=${encodeURIComponent(selector)}&theme=${colorScheme}`;
}

interface CardErrorBoundaryProps {
  readonly label: string;
  readonly resetKey: string;
  readonly onReset: () => void;
  readonly children: ReactNode;
}

interface CardErrorBoundaryState {
  readonly errorMessage: string | null;
}

class CardErrorBoundary extends Component<CardErrorBoundaryProps, CardErrorBoundaryState> {
  override state: CardErrorBoundaryState = { errorMessage: null };

  static getDerivedStateFromError(error: unknown): CardErrorBoundaryState {
    return { errorMessage: error instanceof Error ? error.message : String(error) };
  }

  override componentDidUpdate(prevProps: CardErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.errorMessage !== null) {
      this.setState({ errorMessage: null });
    }
  }

  override componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    // Displayed inline in the framework card.
  }

  override render(): ReactNode {
    if (this.state.errorMessage !== null) {
      return (
        <View style={{ padding: 14, gap: 8 }}>
          <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '700' }}>
            {this.props.label} render error
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
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#dc2626',
            }}
          >
            <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export function ComponentsDocsPage() {
  const [colorScheme, setColorScheme] = useState<EmrColorScheme>('light');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('emr-theme-light', 'emr-theme-dark');
    root.classList.add(colorScheme === 'dark' ? 'emr-theme-dark' : 'emr-theme-light');
  }, [colorScheme]);

  return (
    <EmrThemeProvider scheme={colorScheme}>
      <ComponentsDocsInner colorScheme={colorScheme} onToggleTheme={() => setColorScheme((s) => (s === 'light' ? 'dark' : 'light'))} />
    </EmrThemeProvider>
  );
}

function ComponentsDocsInner({
  colorScheme,
  onToggleTheme,
}: {
  readonly colorScheme: EmrColorScheme;
  readonly onToggleTheme: () => void;
}) {
  const t = useEmrTheme();

  const items = useMemo<readonly CatalogComponentItem[]>(() => {
    const out: CatalogComponentItem[] = [];
    for (const raw of EMR_REGISTRY_MANIFEST.items as readonly Record<string, unknown>[]) {
      const rawSelector = typeof raw['selector'] === 'string' ? raw['selector'] : '';
      const rawName = typeof raw['name'] === 'string' ? raw['name'] : '';
      const selector = rawSelector || (rawName === 'emr-clinical-cell-renderer' ? rawName : '');
      const layer = typeof raw['layer'] === 'number' ? raw['layer'] : 0;
      if (!selector || layer === 0 || layer === 5) continue;
      const reactName = typeof raw['reactName'] === 'string' ? raw['reactName'] : selector;
      const angular = (raw['angular'] as Record<string, unknown> | undefined) ?? {};
      const react = (raw['react'] as Record<string, unknown> | undefined) ?? {};
      const lit = (raw['lit'] as Record<string, unknown> | undefined) ?? {};
      const expo = (raw['expo'] as Record<string, unknown> | undefined) ?? {};
      const install = (raw['installCommand'] as Record<string, string> | undefined) ?? {};
      const stories = Array.isArray(raw['stories']) ? (raw['stories'] as string[]) : [];
      out.push({
        selector,
        displayName: formatDisplayName(reactName, selector),
        reactName,
        angularName: typeof angular['component'] === 'string' ? angular['component'] : reactName,
        litName: typeof raw['litName'] === 'string' ? raw['litName'] : selector,
        layer,
        layerName: typeof raw['layerName'] === 'string' ? raw['layerName'] : '',
        description: typeof raw['description'] === 'string' ? raw['description'] : '',
        categories: Array.isArray(raw['categories']) ? (raw['categories'] as string[]) : [],
        stories,
        reactImport: typeof react['import'] === 'string' ? react['import'] : '',
        angularImport: typeof angular['import'] === 'string' ? angular['import'] : '',
        litImport: typeof lit['import'] === 'string' ? lit['import'] : '',
        expoImport: typeof expo['import'] === 'string' ? expo['import'] : '',
        installCommands: {
          react: install['react'] ?? `pnpm emr add ${selector} --framework react`,
          angular: install['angular'] ?? `pnpm emr add ${selector} --framework angular`,
          lit: install['lit'] ?? `pnpm emr add ${selector} --framework lit`,
          expo: install['expo'] ?? `pnpm emr add ${selector} --framework expo`,
        },
        entry: PARITY_BY_SELECTOR.get(selector),
      });
    }
    return out;
  }, []);

  const [selectedSelector, setSelectedSelector] = useState<string>('emr-button');
  const [search, setSearch] = useState('');
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [frameworkView, setFrameworkView] = useState<FrameworkView>('all');
  const [viewport, setViewport] = useState<ViewportPreset>('auto');
  const [snippetTab, setSnippetTab] = useState<SnippetFramework>('react');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastIntent, setLastIntent] = useState<{ source: ParitySource; event: string; payload: string } | null>(null);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [angularIframeHeight, setAngularIframeHeight] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync selection from URL hash (#emr-button)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '').trim();
      if (hash && items.some((i) => i.selector === hash)) {
        setSelectedSelector(hash);
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [items]);

  // Track responsive breakpoint for mobile drawer
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const update = () => setIsNarrowViewport(window.innerWidth < 860);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const selectComponent = useCallback((selector: string) => {
    setSelectedSelector(selector);
    setLastIntent(null);
    setMobileMenuOpen(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const nextHash = `#${selector}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', nextHash);
      }
    }
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (layerFilter !== 'all' && item.layer !== layerFilter) return false;
      if (!q) return true;
      return (
        item.displayName.toLowerCase().includes(q) ||
        item.selector.toLowerCase().includes(q) ||
        item.reactName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categories.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [items, layerFilter, search]);

  const groupedItems = useMemo(() => {
    const map = new Map<number, CatalogComponentItem[]>();
    for (const layer of LAYER_ORDER) {
      map.set(layer, []);
    }
    for (const item of filteredItems) {
      const bucket = map.get(item.layer) ?? [];
      bucket.push(item);
      map.set(item.layer, bucket);
    }
    return LAYER_ORDER.map((layer) => ({
      layer,
      title: LAYER_LABELS[layer] ?? `L${layer}`,
      items: map.get(layer) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [filteredItems]);

  const activeItem = useMemo(
    () => items.find((i) => i.selector === selectedSelector) ?? items[0],
    [items, selectedSelector],
  );

  // Shared live state per component so React and Lit stay synchronized on edits
  const [stateRevision, setStateRevision] = useState(0);
  const stateMapRef = useRef<Map<string, unknown>>(new Map());
  const activeSelector = activeItem?.selector ?? 'emr-button';

  useEffect(() => {
    const map = stateMapRef.current;
    return () => {
      for (const value of map.values()) {
        destroyOwnedController(value);
      }
      map.clear();
    };
  }, []);

  const getComponentState = useCallback((): unknown => {
    if (!activeItem?.entry) return undefined;
    if (!stateMapRef.current.has(activeSelector)) {
      stateMapRef.current.set(activeSelector, activeItem.entry.createInitialState());
    }
    return stateMapRef.current.get(activeSelector);
  }, [activeItem, activeSelector]);

  const setComponentState = useCallback(
    (updater: (prev: unknown) => unknown) => {
      const prev = getComponentState();
      const next = updater(prev);
      stateMapRef.current.set(activeSelector, next);
      setStateRevision((r) => r + 1);
    },
    [activeSelector, getComponentState],
  );

  const resetComponentState = useCallback(() => {
    if (!activeItem?.entry) return;
    destroyOwnedController(stateMapRef.current.get(activeSelector));
    stateMapRef.current.set(activeSelector, activeItem.entry.createInitialState());
    setLastIntent(null);
    setStateRevision((r) => r + 1);
  }, [activeItem, activeSelector]);

  const currentState = useMemo(() => {
    void stateRevision;
    return getComponentState();
  }, [getComponentState, stateRevision]);

  const ctx = useMemo<ParityRenderContext<unknown>>(
    () => ({
      state: currentState,
      readOnly: false,
      update: (source, event, payload, updater) => {
        if (updater) {
          setComponentState(updater);
        }
        setLastIntent({ source, event, payload: safeFormatPayload(payload) });
      },
    }),
    [currentState, setComponentState],
  );

  const paneMaxWidth = viewport === '390' ? 390 : viewport === '768' ? 768 : undefined;

  const chipStyle = (active: boolean) => ({
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: active ? t.primary : t.border,
    backgroundColor: active ? t.primarySoft : t.surface,
  });

  const renderSidebar = () => (
    <View
      style={{
        width: 268,
        borderRightWidth: 1,
        borderColor: t.border,
        backgroundColor: t.surface,
        flexShrink: 0,
        ...(Platform.OS === 'web'
          ? ({
              position: isNarrowViewport ? 'fixed' : 'sticky',
              top: 0,
              left: 0,
              height: '100vh',
              zIndex: 40,
              display: 'flex',
              flexDirection: 'column',
            } as unknown as object)
          : { height: '100%' }),
      }}
    >
      {/* Sidebar Header */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: t.border,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: '700', fontFamily: t.fontFamily }}>
            EMR Components
          </Text>
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontFamily: t.fontMono }}>
            {filteredItems.length}
          </Text>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search components..."
          placeholderTextColor={t.textMuted}
          aria-label="Search components"
          style={{
            minHeight: 36,
            paddingHorizontal: 10,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.background,
            color: t.text,
            fontSize: t.textSm,
            fontFamily: t.fontFamily,
          }}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {(['all', 1, 2, 3, 4, 6] as const).map((lvl) => (
            <Pressable
              key={String(lvl)}
              role="button"
              onPress={() => setLayerFilter(lvl)}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: layerFilter === lvl ? t.primary : t.border,
                backgroundColor: layerFilter === lvl ? t.primarySoft : t.background,
              }}
            >
              <Text
                style={{
                  color: layerFilter === lvl ? t.primaryContrast : t.textMuted,
                  fontSize: 11,
                  fontWeight: '600',
                  fontFamily: t.fontMono,
                }}
              >
                {lvl === 'all' ? 'All' : `L${lvl}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Scrollable Component Menu */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 12, gap: 18, paddingBottom: 32 }}
      >
        {groupedItems.length === 0 ? (
          <Text style={{ color: t.textMuted, fontSize: 13, paddingHorizontal: 10, fontFamily: t.fontFamily }}>
            No matching components.
          </Text>
        ) : (
          groupedItems.map((group) => (
            <View key={group.layer} style={{ gap: 2 }}>
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 0.5,
                  paddingHorizontal: 10,
                  paddingBottom: 4,
                  fontFamily: t.fontFamily,
                }}
              >
                {group.title}
              </Text>
              {group.items.map((item) => {
                const active = item.selector === activeItem?.selector;
                return (
                  <Pressable
                    key={item.selector}
                    role="button"
                    aria-current={active ? 'page' : undefined}
                    onPress={() => selectComponent(item.selector)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: active ? t.primarySoft : 'transparent',
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        color: active ? t.primaryContrast : t.text,
                        fontSize: 13,
                        fontWeight: active ? '600' : '400',
                        fontFamily: t.fontFamily,
                      }}
                    >
                      {item.displayName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  const angularIframeRef = useRef<HTMLIFrameElement | null>(null);
  const initialAngularSrcRef = useRef<string | null>(null);
  if (mounted && !initialAngularSrcRef.current) {
    initialAngularSrcRef.current = resolveAngularPreviewUrl(activeSelector, colorScheme);
  }

  useEffect(() => {
    if (Platform.OS !== 'web' || !mounted) return;
    angularIframeRef.current?.contentWindow?.postMessage(
      { type: 'emr-preview', selector: activeSelector, theme: colorScheme, state: currentState },
      '*',
    );
  }, [activeSelector, colorScheme, currentState, mounted]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onMsg = (event: MessageEvent) => {
      const data = event.data as { type?: string; selector?: string; state?: Record<string, unknown>; height?: number } | null;
      if (!data) return;
      if (data.type === 'emr-preview-height' && typeof data.height === 'number' && data.height > 0) {
        setAngularIframeHeight(Math.max(220, data.height));
        return;
      }
      if (data.type !== 'emr-preview-state' || data.selector !== activeSelector || !data.state) return;
      const patch = data.state;
      setComponentState((prev) =>
        prev && typeof prev === 'object' ? { ...(prev as Record<string, unknown>), ...patch } : patch,
      );
      setLastIntent({ source: 'react', event: 'angularSync', payload: safeFormatPayload(patch) });
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [activeSelector, setComponentState]);

  const primaryStoryId = activeItem?.stories[0];
  const storybookUrl =
    mounted && primaryStoryId
      ? `http://localhost:6006/?path=/story/${encodeURIComponent(primaryStoryId)}`
      : null;
  const galleryUrl = mounted ? resolveSitePublicUrl('theme-studio/') : 'theme-studio/';

  const showReact = frameworkView === 'all' || frameworkView === 'react';
  const showLit = frameworkView === 'all' || frameworkView === 'lit';
  const showAngular = frameworkView === 'all' || frameworkView === 'angular';

  return (
    <View
      style={{
        flexDirection: 'row',
        minHeight: Platform.OS === 'web' ? ('100vh' as unknown as number) : undefined,
        backgroundColor: t.background,
        width: '100%',
      }}
    >
      {/* Fixed Left Menu (desktop always visible; mobile drawer when open) */}
      {!isNarrowViewport || mobileMenuOpen ? renderSidebar() : null}

      {/* Mobile backdrop */}
      {isNarrowViewport && mobileMenuOpen && Platform.OS === 'web'
        ? createElement('div', {
            onClick: () => setMobileMenuOpen(false),
            style: {
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              zIndex: 35,
            },
          })
        : null}

      {/* Main Right Content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Minimal Sticky Top Controls */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            paddingHorizontal: isNarrowViewport ? 12 : 24,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            ...(Platform.OS === 'web' ? ({ position: 'sticky', top: 0, zIndex: 20 } as unknown as object) : {}),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', maxWidth: '100%' }}>
            {isNarrowViewport ? (
              <Pressable role="button" onPress={() => setMobileMenuOpen(true)} style={chipStyle(false)}>
                <Text style={{ color: t.text, fontSize: 12, fontWeight: '600', fontFamily: t.fontFamily }}>
                  ☰ Menu
                </Text>
              </Pressable>
            ) : null}

            {/* Framework Focus Tabs */}
            {(['all', 'react', 'lit', 'angular'] as const).map((fw) => (
              <Pressable
                key={fw}
                role="button"
                onPress={() => setFrameworkView(fw)}
                style={chipStyle(frameworkView === fw)}
              >
                <Text
                  style={{
                    color: frameworkView === fw ? t.primaryContrast : t.text,
                    fontSize: 12,
                    fontWeight: '600',
                    fontFamily: t.fontFamily,
                  }}
                >
                  {fw === 'all' ? 'All Frameworks' : fw === 'react' ? 'React' : fw === 'lit' ? 'Lit' : 'Angular'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', maxWidth: '100%' }}>
            {/* Viewport Width Toggle */}
            {(['auto', '768', '390'] as const).map((vp) => (
              <Pressable
                key={vp}
                role="button"
                onPress={() => setViewport(vp)}
                style={chipStyle(viewport === vp)}
              >
                <Text
                  style={{
                    color: viewport === vp ? t.primaryContrast : t.textMuted,
                    fontSize: 12,
                    fontWeight: '600',
                    fontFamily: t.fontMono,
                  }}
                >
                  {vp === 'auto' ? 'Auto' : `${vp}px`}
                </Text>
              </Pressable>
            ))}

            <Pressable role="button" onPress={onToggleTheme} style={chipStyle(colorScheme === 'dark')}>
              <Text
                style={{
                  color: colorScheme === 'dark' ? t.primaryContrast : t.text,
                  fontSize: 12,
                  fontWeight: '600',
                  fontFamily: t.fontFamily,
                }}
              >
                {colorScheme === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </Pressable>

            <Pressable role="button" onPress={resetComponentState} style={chipStyle(false)}>
              <Text style={{ color: t.text, fontSize: 12, fontWeight: '600', fontFamily: t.fontFamily }}>
                Reset
              </Text>
            </Pressable>

            {Platform.OS === 'web' && storybookUrl
              ? createElement(
                  'a',
                  {
                    href: storybookUrl,
                    target: '_blank',
                    rel: 'noreferrer',
                    style: {
                      fontSize: '12px',
                      fontWeight: 600,
                      color: t.textMuted,
                      textDecoration: 'none',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${t.border}`,
                    },
                  },
                  'Angular Storybook ↗',
                )
              : null}

            {Platform.OS === 'web'
              ? createElement(
                  'a',
                  {
                    href: galleryUrl,
                    style: {
                      fontSize: '12px',
                      fontWeight: 600,
                      color: t.primaryContrast,
                      textDecoration: 'none',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${t.border}`,
                    },
                  },
                  'Theme Studio & Registry ↗',
                )
              : null}
          </View>
        </View>

        {/* Component Documentation & Multi-Framework Preview */}
        {activeItem ? (
          <View style={{ padding: 24, gap: 20, maxWidth: 1440, width: '100%' }}>
            {/* Title & Summary */}
            {/* Title & Summary */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <Text
                  role="heading"
                  aria-level={1}
                  style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.4, fontFamily: t.fontFamily }}
                >
                  {activeItem.displayName}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: 13, fontFamily: t.fontMono }}>
                  {`<${activeItem.selector}>`}
                </Text>
                <EmrBadgeView badge={{ label: LAYER_LABELS[activeItem.layer] ?? `L${activeItem.layer}`, tone: 'neutral' }} />
              </View>
              <Text style={{ color: t.textMuted, fontSize: 15, lineHeight: 22, maxWidth: 720, fontFamily: t.fontFamily }}>
                {activeItem.description}
              </Text>
            </View>

            {/* Active Props Strip (clickable for boolean & enum props) */}
            {currentState && typeof currentState === 'object' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: t.fontFamily }}>
                  Active Props:
                </Text>
                {Object.entries(currentState as Record<string, unknown>)
                  .filter(
                    ([, v]) => {
                      if (v === undefined || typeof v === 'function') return false;
                      // Keep Active Props compact: omit raw JSON object/array payloads across all components
                      if (typeof v === 'object' && v !== null) return false;
                      return true;
                    },
                  )
                  .slice(0, 24)
                  .map(([k, v]) => {
                    const enumCycles: Record<string, readonly string[]> = {
                      variant:
                        activeItem?.selector === 'emr-checkbox-group'
                          ? ['tile', 'inline', 'card', 'chip']
                          : activeItem?.selector === 'emr-toggle-group'
                            ? ['tile', 'inline', 'card']
                            : activeItem?.selector === 'emr-radio-group'
                            ? ['tile', 'inline', 'card', 'pill', 'segmented']
                            : v === 'tile' || v === 'inline'
                              ? ['tile', 'inline']
                              : activeItem?.selector === 'emr-badge' || activeItem?.selector === 'emr-chip'
                              ? ['soft', 'solid', 'outline']
                              : activeItem?.selector === 'emr-tabs'
                                ? ['underline', 'pill', 'soft']
                                : activeItem?.selector === 'emr-segmented-control'
                                  ? ['default', 'outline', 'soft']
                                  : activeItem?.selector === 'emr-separator'
                                  ? ['solid', 'dashed', 'subtle']
                                  : activeItem?.selector === 'emr-card' ||
                                      activeItem?.selector === 'emr-section-card' ||
                                      activeItem?.selector === 'emr-clinical-list' ||
                                      activeItem?.selector === 'emr-medication-list' ||
                                      activeItem?.selector === 'emr-allergy-list' ||
                                      activeItem?.selector === 'emr-chronic-disease-list' ||
                                      activeItem?.selector === 'emr-personal-history-list'
                                    ? ['outlined', 'elevated', 'filled', 'subtle']
                                    : activeItem?.selector === 'emr-scale-field'
                                      ? ['likert', 'vas']
                                      : activeItem?.selector === 'emr-select' ||
                                          activeItem?.selector === 'emr-tree-select'
                                        ? ['outline', 'filled', 'subtle']
                                        : activeItem?.selector === 'emr-menu' ||
                                            activeItem?.selector === 'emr-copy-button'
                                          ? ['outline', 'primary', 'secondary', 'ghost']
                                          : activeItem?.selector === 'emr-split-button'
                                            ? ['primary', 'secondary', 'outline', 'danger']
                                            : activeItem?.selector === 'emr-accordion'
                                              ? ['outlined', 'flush', 'card']
                                              : ['primary', 'secondary', 'outline', 'ghost', 'danger'],
                      status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                      size:
                        activeItem?.selector === 'emr-checkbox' ||
                        activeItem?.selector === 'emr-checkbox-group' ||
                        activeItem?.selector === 'emr-toggle' ||
                        activeItem?.selector === 'emr-toggle-group' ||
                        activeItem?.selector === 'emr-tree-view' ||
                        activeItem?.selector === 'emr-tree-select' ||
                        activeItem?.selector === 'emr-radio-group' ||
                        activeItem?.selector === 'emr-segmented-control' ||
                        activeItem?.selector === 'emr-badge' ||
                        activeItem?.selector === 'emr-chip' ||
                        activeItem?.selector === 'emr-select' ||
                        activeItem?.selector === 'emr-search-select' ||
                        activeItem?.selector === 'emr-combobox' ||
                        activeItem?.selector === 'emr-tag-input' ||
                        activeItem?.selector === 'emr-menu' ||
                        activeItem?.selector === 'emr-accordion' ||
                        activeItem?.selector === 'emr-breadcrumbs' ||
                        activeItem?.selector === 'emr-color-picker'
                          ? ['md', 'sm']
                          : ['sm', 'md', 'lg'],
                      checkStrategy: ['cascade', 'all', 'leaf'],
                      displayMode: ['path', 'leaf'],
                      shape: activeItem?.selector === 'emr-segmented-control' ? ['default', 'pill'] : ['pill', 'rounded'],
                      padding: ['md', 'lg', 'sm', 'none'],
                      align:
                        activeItem?.selector === 'emr-menu' || activeItem?.selector === 'emr-split-button'
                          ? ['start', 'end']
                          : ['stretch', 'start', 'center', 'end'],
                      separator: ['/', 'chevron', '>'],
                      labelAlign: ['start', 'center', 'end'],
                      filterMode: ['local', 'remote', 'none'],
                      ...(activeItem?.selector === 'emr-search-select' ||
                      activeItem?.selector === 'emr-combobox'
                        ? {
                            variant: ['outline', 'filled', 'subtle'],
                            warning: ['', 'Verify laterality and onset before signing'],
                            error: ['', 'Chief complaint is required for triage'],
                          }
                        : {}),
                      precision: activeItem?.selector === 'emr-vas' ? ['integer', 'decimal'] : ['minute', 'second'],
                      scaleMode: ['numeric', 'text'],
                      inputType: ['text', 'integer', 'decimal', 'select'],
                      ...(activeItem?.selector === 'emr-paired-field'
                        ? {
                            mode: ['integer', 'decimal', 'text', 'select'],
                            layout: ['vertical', 'horizontal', 'inline'],
                            size: ['sm', 'md', 'lg'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      timePrecision: ['minute', 'second'],
                      displayFormat: ['dd-mm-yyyy', 'dd/mm/yyyy', 'yyyy-mm-dd', 'mm/dd/yyyy'],
                      wireFormat: ['utc', 'local'],
                      ...(activeItem?.selector === 'emr-checkbox-group'
                        ? {
                            warning: ['', 'Confirm laterality before surgical timeout'],
                            error: ['', 'Select at least one mandatory safety check'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-toggle-group'
                        ? {
                            warning: ['', 'Patient opted out of non-urgent SMS reminders'],
                            error: ['', 'Select at least one active notification channel'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-tree-view'
                        ? {
                            warning: ['', 'Verify laterality before locking anatomical site'],
                            error: ['', 'Select at least one anatomical structure'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-tree-select'
                        ? {
                            warning: ['', 'Verify anatomical site before finalizing diagnosis'],
                            error: ['', 'Primary anatomical site is required'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-radio-group'
                        ? {
                            warning: ['', 'STAT triage escalates to on-call attending'],
                            error: ['', 'Select a referral triage priority'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-checkbox'
                        ? {
                            description: ['', 'Verified bilaterally prior to slit-lamp exam'],
                            hint: ['', 'Allow 20 min for full cycloplegia'],
                            warning: ['', 'Shallow AC risk: check IOP first'],
                            error: ['', 'Confirm dilation status before proceeding'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-toggle'
                        ? {
                            onLabel: ['', 'On', 'Active'],
                            offLabel: ['', 'Off', 'Inactive'],
                            description: ['', 'Sync readings across contralateral checklists'],
                            hint: ['', 'Highlights contralateral eye protection across clinical checklists'],
                            warning: ['', 'Verify monocular status with patient'],
                            error: ['', 'Confirm precaution setting before sign-off'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-segmented-control'
                        ? {
                            warning: ['', 'Confirm laterality before surgical timeout'],
                            error: ['', 'Select operative eye laterality'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-tag-input'
                        ? {
                            variant: ['outline', 'filled', 'subtle'],
                            chipTone: ['neutral', 'info', 'success', 'warning', 'danger'],
                            warning: ['', 'Verify allergy severity before prescribing'],
                            error: ['', 'At least one documented allergy or NKDA tag is required'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-select'
                        ? {
                            warning: ['', 'Confirm laterality before surgical timeout'],
                            error: ['', 'Operative laterality is required'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-duration-input'
                        ? {
                            size: ['sm', 'md', 'lg'],
                            layout: ['vertical', 'horizontal', 'inline'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-range-field'
                        ? {
                            kind: ['number', 'date', 'time', 'datetime'],
                            size: ['sm', 'md', 'lg'],
                            layout: ['vertical', 'horizontal', 'inline'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-phone-input'
                        ? {
                            size: ['sm', 'md', 'lg'],
                            layout: ['vertical', 'horizontal', 'inline'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-address-field'
                        ? {
                            layout: ['vertical', 'horizontal', 'inline'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-macro-text-field'
                        ? {
                            layout: ['vertical', 'horizontal', 'inline'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-laterality-field'
                        ? {
                            domain: ['ophthalmic', 'anatomic'],
                            size: ['sm', 'md', 'lg'],
                            layout: ['vertical', 'horizontal', 'inline'],
                            orientation: ['horizontal', 'vertical'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-visual-acuity-field'
                        ? {
                            eye: ['OD', 'OS', 'OU'],
                            notation: ['snellen-m', 'snellen-ft', 'logmar', 'etdrs', 'low-vision'],
                            correction: ['unaided', 'habitual', 'best-corrected', 'contact-lens'],
                            derivedTone: ['neutral', 'info', 'success', 'warning', 'danger'],
                            size: ['sm', 'md', 'lg'],
                            layout: ['vertical', 'horizontal', 'inline'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-refraction-field'
                        ? {
                            eye: ['OD', 'OS'],
                            size: ['sm', 'md', 'lg'],
                            layout: ['vertical', 'horizontal', 'inline'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-image-viewer'
                        ? {
                            warning: ['', 'Verify laterality (OD/OS) against clinical note'],
                            error: ['', 'Image failed quality check — recapture'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-image-cropper'
                        ? {
                            outputMimeType: ['image/png', 'image/jpeg', 'image/webp'],
                            warning: ['', 'Keep optic disc centered inside ROI'],
                            error: ['', 'Crop region is too small for diagnostic review'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-image-upload'
                        ? {
                            cropOutputMimeType: ['image/png', 'image/jpeg', 'image/webp'],
                            warning: ['', 'Redact patient-identifying metadata before export'],
                            error: ['', 'At least one diagnostic fundus image is required'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-image-field'
                        ? {
                            layout: ['vertical', 'horizontal', 'inline'],
                            status: ['recorded', 'not-assessed', 'unable-to-assess', 'not-applicable', 'declined', 'unknown'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-date-range-input'
                        ? {
                            variant: ['outline', 'filled', 'subtle'],
                            warning: ['', 'Date span exceeds standard 30-day review window'],
                            error: ['', 'Select a valid encounter date range'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-slider'
                        ? {
                            warning: ['', 'High overlay opacity may obscure vessels'],
                            error: ['', 'Opacity must be configured before saving'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-range-slider'
                        ? {
                            warning: ['', 'Upper target exceeds 21 mmHg norm'],
                            error: ['', 'Target IOP range is required'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-masked-input'
                        ? {
                            variant: ['outline', 'filled', 'subtle'],
                            warning: ['', 'Verify ABHA checksum before linking'],
                            error: ['', '14-digit ABHA number is incomplete'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-otp-input'
                        ? {
                            variant: ['outline', 'filled', 'subtle'],
                            warning: ['', 'Code expires in 45 seconds'],
                            error: ['', 'Invalid verification code — 2 attempts remaining'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-color-picker'
                        ? {
                            warning: ['', 'Verify colour contrast on printed retinal diagram'],
                            error: ['', 'Select an annotation colour before saving'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-clinical-list' ||
                      activeItem?.selector === 'emr-medication-list' ||
                      activeItem?.selector === 'emr-allergy-list' ||
                      activeItem?.selector === 'emr-chronic-disease-list' ||
                      activeItem?.selector === 'emr-personal-history-list'
                        ? {
                            variant: ['outlined', 'elevated', 'filled', 'subtle'],
                            error: ['', 'Unable to sync clinical entries'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-image-template-picker'
                        ? {
                            category: ['all', 'retina', 'cornea'],
                            selectedTemplateId: ['retina-od', 'retina-os', 'cornea-od'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-time-axis'
                        ? {
                            stepId: ['60', '30'],
                            selectedTickId: ['t0', 't1', 't2', 't3', 't4', 't5', 't6'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-data-table'
                        ? {
                            density: ['comfortable', 'compact'],
                            error: ['', 'Unable to load referral registry'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-split-workspace'
                        ? {
                            preset: ['3-pane', '2-pane-50-50', '2-pane-40-60', 'focus-primary'],
                            mobileActivePaneId: ['pane-chart', 'pane-note', 'pane-cds'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-command-palette'
                        ? {
                            presentation: ['inline', 'modal'],
                            activeCategory: ['all', 'orders', 'navigation', 'smartphrases', 'calculators', 'actions'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-master-detail'
                        ? {
                            activeFilterId: ['all', 'critical', 'cosign'],
                            selectedId: ['inb-1', 'inb-2', 'inb-3'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-synchronized-time-grid'
                        ? {
                            resolution: ['15m', '1h', '4h', '24h'],
                            selectedColumnId: ['c08', 'c09', 'c10', 'c11', 'c12', 'c13'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-field-generator'
                        ? {
                            type: [
                              'text',
                              'multiline',
                              'integer',
                              'decimal',
                              'quantity',
                              'boolean',
                              'select',
                              'multi-select',
                              'date',
                              'time',
                              'datetime',
                            ],
                            error: ['', 'Unable to persist field definition cleanly.'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-terminology-search'
                        ? {
                            role: ['question-meaning', 'unit', 'answer-value-set', 'classification-mapping'],
                            sourceId: ['loinc', 'snomed', 'icd10', 'ucum'],
                            error: ['', 'Terminology lookup timed out.'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-field-library-picker'
                        ? {
                            selectedSectionId: ['tonometry', 'history'],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-template-composer' ||
                      activeItem?.selector === 'emr-template-preview'
                        ? {
                            status: ['draft', 'active', 'retired'],
                            selectedSectionId: ['tonometry', 'history'],
                            error: ['', 'Template revision conflict detected.'],
                          }
                        : {}),
                      hourCycle: ['24', '12'],
                      mode:
                        activeItem?.selector === 'emr-paired-field'
                          ? ['integer', 'decimal', 'text', 'select']
                          : activeItem?.selector === 'emr-date-range-input'
                            ? ['date', 'datetime']
                            : ['decimal', 'integer'],
                      labelPlacement: ['end', 'start', 'space-between'],
                      tone: ['info', 'success', 'warning', 'danger', 'neutral'],
                      kind:
                        activeItem?.selector === 'emr-range-field'
                          ? ['number', 'date', 'time', 'datetime']
                          : ['empty', 'loading', 'error'],
                      layout: ['vertical', 'horizontal', 'inline'],
                      assessmentStatus: ['recorded', 'not-assessed', 'unable-to-assess'],
                      orientation:
                        activeItem?.selector === 'emr-radio-group' ||
                        activeItem?.selector === 'emr-checkbox-group' ||
                        activeItem?.selector === 'emr-toggle-group'
                          ? ['vertical', 'horizontal', 'grid']
                          : ['horizontal', 'vertical'],
                    };
                    const numCycles: Record<string, readonly number[]> = {
                      count: [3, 2, 1],
                      gap: [12, 24, 8],
                      maxSelections: [3, 2, 1],
                      maxTagCount: [2, 1, 3, 0],
                      maxTags: [6, 4, 3, 2],
                      maxTagLength: [24, 12, 8, 40],
                      activeIndex: [0, 1],
                      height: [300, 240, 400],
                      maxFiles: [4, 2, 1, 6],
                      maxSizeBytes: [5 * 1024 * 1024, 2 * 1024 * 1024, 1024 * 1024],
                      weekStartsOn: [0, 1],
                      separatorAfter: [3, 2, 0],
                      maxItems: [3, 2, 4, 0],
                      headingLevel: [2, 3, 4, 5, 6],
                      ...(activeItem?.selector === 'emr-macro-text-field'
                        ? {
                            rows: [4, 2, 6, 8],
                            maxLength: [280, 140, 500],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-time-axis'
                        ? {
                            offset: [0, 1, 2],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-data-table'
                        ? {
                            pageSize: [3, 5, 10],
                            page: [1, 2, 3],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-command-palette'
                        ? {
                            activeIndex: [0, 1, 2, 3],
                          }
                        : {}),
                      ...(activeItem?.selector === 'emr-synchronized-time-grid'
                        ? {
                            scrollOffset: [0, 1, 2],
                            visibleColumnCount: [3, 4, 6],
                          }
                        : {}),
                    };
                    const isBool = typeof v === 'boolean';
                    const cycle = typeof v === 'string' ? enumCycles[k] : undefined;
                    const numCycle = typeof v === 'number' ? numCycles[k] : undefined;
                    const interactive = isBool || Boolean(cycle) || Boolean(numCycle);
                    const onToggleProp = () => {
                      if (isBool) {
                        setComponentState((prev) => {
                          if (!prev || typeof prev !== 'object') return prev;
                          const obj = prev as Record<string, unknown>;
                          if (
                            activeItem?.selector === 'emr-terminology-search' &&
                            k === 'loading' &&
                            obj['search'] &&
                            typeof obj['search'] === 'object'
                          ) {
                            return {
                              ...obj,
                              loading: !v,
                              search: { ...(obj['search'] as Record<string, unknown>), loading: !v },
                            };
                          }
                          return { ...obj, [k]: !v };
                        });
                      } else if (cycle) {
                        const next = cycle[(cycle.indexOf(v as string) + 1) % cycle.length];
                        setComponentState((prev) => {
                          if (!prev || typeof prev !== 'object') return prev;
                          const obj = prev as Record<string, unknown>;
                          if (activeItem?.selector === 'emr-laterality-field' && k === 'domain') {
                            return {
                              ...obj,
                              domain: next,
                              value: next === 'ophthalmic' ? 'OD' : 'right',
                              confirmationLabel:
                                next === 'ophthalmic'
                                  ? 'Operative eye confirmed against consent and biometry'
                                  : 'Surgical site and laterality verified',
                            };
                          }
                          if (activeItem?.selector === 'emr-visual-acuity-field' && k === 'notation') {
                            const vaChartMap: Record<
                              string,
                              {
                                readonly options: { readonly value: string; readonly label: string }[];
                                readonly value: string;
                                readonly pinhole: string | null;
                                readonly derived: string;
                              }
                            > = {
                              'snellen-m': {
                                options: [
                                  { value: '6/6', label: '6/6' },
                                  { value: '6/9', label: '6/9' },
                                  { value: '6/12', label: '6/12' },
                                  { value: '6/18', label: '6/18' },
                                  { value: '6/24', label: '6/24' },
                                  { value: '6/36', label: '6/36' },
                                  { value: '6/60', label: '6/60' },
                                ],
                                value: '6/18',
                                pinhole: '6/9',
                                derived: 'LogMAR 0.48 (PH 0.18)',
                              },
                              'snellen-ft': {
                                options: [
                                  { value: '20/20', label: '20/20' },
                                  { value: '20/30', label: '20/30' },
                                  { value: '20/40', label: '20/40' },
                                  { value: '20/60', label: '20/60' },
                                  { value: '20/80', label: '20/80' },
                                  { value: '20/200', label: '20/200' },
                                ],
                                value: '20/60',
                                pinhole: '20/30',
                                derived: 'Snellen 6/18 (LogMAR 0.48)',
                              },
                              logmar: {
                                options: [
                                  { value: '0.00', label: '0.00' },
                                  { value: '0.18', label: '0.18' },
                                  { value: '0.30', label: '0.30' },
                                  { value: '0.48', label: '0.48' },
                                  { value: '0.60', label: '0.60' },
                                  { value: '1.00', label: '1.00' },
                                ],
                                value: '0.48',
                                pinhole: '0.18',
                                derived: 'Snellen 6/18 (20/60)',
                              },
                              etdrs: {
                                options: [
                                  { value: '85', label: '85 letters' },
                                  { value: '75', label: '75 letters' },
                                  { value: '70', label: '70 letters' },
                                  { value: '61', label: '61 letters' },
                                  { value: '55', label: '55 letters' },
                                  { value: '35', label: '35 letters' },
                                ],
                                value: '61',
                                pinhole: '75',
                                derived: 'Snellen 6/18 (LogMAR 0.48)',
                              },
                              'low-vision': {
                                options: [
                                  { value: 'CF-3m', label: 'CF 3m' },
                                  { value: 'CF-1m', label: 'CF 1m' },
                                  { value: 'HM', label: 'HM' },
                                  { value: 'LP', label: 'LP' },
                                  { value: 'NLP', label: 'NLP' },
                                ],
                                value: 'CF-3m',
                                pinhole: null,
                                derived: 'WHO Low Vision (LogMAR > 1.3)',
                              },
                            };
                            const preset = next ? vaChartMap[next] : undefined;
                            if (preset) {
                              return {
                                ...obj,
                                notation: next,
                                valueOptions: preset.options,
                                value: preset.value,
                                pinholeValue: obj['showPinhole'] ? preset.pinhole : null,
                                derivedDisplay: preset.derived,
                              };
                            }
                          }
                          if (activeItem?.selector === 'emr-time-axis' && k === 'stepId') {
                            const labels =
                              next === '30'
                                ? ['08:00', '08:30', '09:00']
                                : ['08:00', '09:00', '10:00'];
                            const off = typeof obj['offset'] === 'number' ? Math.max(0, Math.min(2, obj['offset'])) : 0;
                            return { ...obj, stepId: next, windowStartLabel: labels[off] ?? '08:00' };
                          }
                          if (
                            activeItem?.selector === 'emr-field-generator' &&
                            k === 'type' &&
                            obj['draft'] &&
                            typeof obj['draft'] === 'object'
                          ) {
                            return {
                              ...obj,
                              type: next,
                              draft: { ...(obj['draft'] as Record<string, unknown>), type: next },
                            };
                          }
                          if (
                            activeItem?.selector === 'emr-terminology-search' &&
                            (k === 'sourceId' || k === 'role' || k === 'error') &&
                            obj['search'] &&
                            typeof obj['search'] === 'object'
                          ) {
                            return {
                              ...obj,
                              [k]: next,
                              search: {
                                ...(obj['search'] as Record<string, unknown>),
                                [k]: k === 'error' ? next || undefined : next,
                              },
                            };
                          }
                          if (
                            (activeItem?.selector === 'emr-template-composer' ||
                              activeItem?.selector === 'emr-template-preview') &&
                            k === 'status' &&
                            obj['template'] &&
                            typeof obj['template'] === 'object'
                          ) {
                            return {
                              ...obj,
                              status: next,
                              template: { ...(obj['template'] as Record<string, unknown>), status: next },
                            };
                          }
                          return { ...obj, [k]: next };
                        });
                      } else if (numCycle) {
                        const idx = numCycle.indexOf(v as number);
                        const next = numCycle[(idx + 1) % numCycle.length];
                        setComponentState((prev) => {
                          if (!prev || typeof prev !== 'object') return prev;
                          const obj = prev as Record<string, unknown>;
                          if (activeItem?.selector === 'emr-time-axis' && k === 'offset') {
                            const labels =
                              obj['stepId'] === '30'
                                ? ['08:00', '08:30', '09:00']
                                : ['08:00', '09:00', '10:00'];
                            return { ...obj, offset: next, windowStartLabel: labels[next] ?? '08:00' };
                          }
                          if (activeItem?.selector === 'emr-data-table' && k === 'pageSize') {
                            return { ...obj, pageSize: next, page: 1 };
                          }
                          return { ...obj, [k]: next };
                        });
                      }
                    };
                    return (
                      <Pressable
                        key={k}
                        role={interactive ? 'button' : undefined}
                        disabled={!interactive}
                        onPress={interactive ? onToggleProp : undefined}
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          maxWidth: '100%',
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 5,
                          borderWidth: 1,
                          borderColor: interactive ? t.primaryBorder : t.border,
                          backgroundColor: isBool && v ? t.primarySoft : t.surface,
                        }}
                      >
                        <Text style={{ color: t.textMuted, fontSize: 11, fontFamily: t.fontMono }}>
                          {k}=
                        </Text>
                        <Text
                          selectable
                          style={[
                            { color: t.primaryContrast, fontSize: 11, fontWeight: '700', fontFamily: t.fontMono, flexShrink: 1, maxWidth: '100%' },
                            Platform.OS === 'web' ? ({ overflowWrap: 'anywhere', wordBreak: 'break-all' } as never) : null,
                          ]}
                        >
                          {safeFormatPayload(v)}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            ) : null}

            {/* Framework Previews */}
            <View
              style={{
                flexDirection: frameworkView === 'all' && !isNarrowViewport && viewport === 'auto' ? 'row' : 'column',
                flexWrap: 'wrap',
                gap: 24,
                alignItems: 'stretch',
                width: '100%',
                maxWidth: paneMaxWidth,
                minWidth: 0,
                zIndex: 50,
              }}
            >
              {/* 1. React Preview */}
              {showReact ? (
                <View style={{ flex: isNarrowViewport ? undefined : 1, width: isNarrowViewport ? '100%' : undefined, minWidth: isNarrowViewport ? 0 : 320, maxWidth: '100%', gap: 8, zIndex: 40 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                    <Text style={{ color: t.text, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', fontFamily: t.fontFamily }}>
                      React
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 12, fontFamily: t.fontMono }}>
                      {`<${activeItem.reactName} />`}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: isNarrowViewport ? undefined : 1,
                      padding: 24,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surface,
                      alignItems: 'flex-start',
                    }}
                  >
                    <View style={{ width: '100%', maxWidth: paneMaxWidth }}>
                      {activeItem.entry ? (
                        <CardErrorBoundary
                          label="React"
                          resetKey={`${activeItem.selector}-${stateRevision}`}
                          onReset={resetComponentState}
                        >
                          {activeItem.entry.renderReact(ctx)}
                        </CardErrorBoundary>
                      ) : (
                        <Text style={{ color: t.textMuted, fontSize: 13, fontFamily: t.fontFamily }}>
                          No interactive React harness entry registered yet for {activeItem.reactName}.
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : null}

              {/* 2. Lit Web Component Preview */}
              {showLit ? (
                <View style={{ flex: isNarrowViewport ? undefined : 1, width: isNarrowViewport ? '100%' : undefined, minWidth: isNarrowViewport ? 0 : 320, maxWidth: '100%', gap: 8, zIndex: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                    <Text style={{ color: t.text, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', fontFamily: t.fontFamily }}>
                      Lit Web Component
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 12, fontFamily: t.fontMono }}>
                      {`<${activeItem.selector}>`}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: isNarrowViewport ? undefined : 1,
                      padding: 24,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surface,
                      alignItems: 'flex-start',
                    }}
                  >
                    <View style={{ width: '100%', maxWidth: paneMaxWidth }}>
                      {activeItem.entry ? (
                        <CardErrorBoundary
                          label="Lit"
                          resetKey={`${activeItem.selector}-${stateRevision}`}
                          onReset={resetComponentState}
                        >
                          {activeItem.entry.renderLit(ctx)}
                        </CardErrorBoundary>
                      ) : (
                        <Text style={{ color: t.textMuted, fontSize: 13, fontFamily: t.fontFamily }}>
                          No interactive Lit harness entry registered yet for {`<${activeItem.selector}>`}.
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : null}

              {/* 3. Angular (Storybook iframe) */}
              {showAngular ? (
                <View style={{ flex: isNarrowViewport ? undefined : 1, width: isNarrowViewport ? '100%' : undefined, minWidth: isNarrowViewport ? 0 : 320, maxWidth: '100%', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                    <Text style={{ color: t.text, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', fontFamily: t.fontFamily }}>
                      Angular
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: t.textMuted, fontSize: 12, fontFamily: t.fontMono }}>
                        {activeItem.angularName}
                      </Text>
                      {Platform.OS === 'web' && storybookUrl
                        ? createElement(
                            'a',
                            {
                              href: storybookUrl,
                              target: '_blank',
                              rel: 'noreferrer',
                              style: {
                                fontSize: '11px',
                                fontWeight: 600,
                                color: t.primaryContrast,
                                textDecoration: 'none',
                              },
                            },
                            'Open ↗',
                          )
                        : null}
                    </View>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      padding: 16,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surface,
                      alignItems: 'flex-start',
                    }}
                  >
                    <View style={{ width: '100%', maxWidth: paneMaxWidth }}>
                      {Platform.OS === 'web' && mounted && initialAngularSrcRef.current ? (
                        createElement('iframe', {
                          ref: angularIframeRef,
                          src: initialAngularSrcRef.current,
                          title: `${activeItem.angularName} Angular preview`,
                          onLoad: () => {
                            angularIframeRef.current?.contentWindow?.postMessage(
                              { type: 'emr-preview', selector: activeSelector, theme: colorScheme, state: currentState },
                              '*',
                            );
                          },
                          style: {
                            width: '100%',
                            height: angularIframeHeight ? `${angularIframeHeight}px` : undefined,
                            minHeight: frameworkView === 'angular' ? '320px' : '220px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: 'transparent',
                          },
                        })
                      ) : (
                        <Text style={{ color: t.textMuted, fontSize: 13, fontFamily: t.fontFamily }}>
                          Loading Angular preview...
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : null}

            </View>

            {/* Live Intent Feedback Strip */}
            {lastIntent ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: t.primaryBorder,
                  backgroundColor: t.surfaceSoft,
                }}
              >
                <EmrBadgeView badge={{ label: lastIntent.source.toUpperCase(), tone: 'info' }} />
                <Text style={{ color: t.text, fontSize: 12, fontWeight: '700', fontFamily: t.fontMono }}>
                  {lastIntent.event}
                </Text>
                <Text selectable style={{ color: t.textMuted, fontSize: 12, fontFamily: t.fontMono }}>
                  {lastIntent.payload}
                </Text>
              </View>
            ) : null}

            {/* Compact Usage / Install Card */}
            <View
              style={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surface,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surfaceSoft,
                }}
              >
                <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', marginRight: 6, fontFamily: t.fontFamily }}>
                  Usage
                </Text>
                {(['react', 'angular', 'lit', 'expo'] as const).map((fw) => (
                  <Pressable key={fw} role="button" onPress={() => setSnippetTab(fw)} style={chipStyle(snippetTab === fw)}>
                    <Text
                      style={{
                        color: snippetTab === fw ? t.primaryContrast : t.textMuted,
                        fontSize: 11,
                        fontWeight: '600',
                        fontFamily: t.fontFamily,
                      }}
                    >
                      {fw === 'react' ? 'React' : fw === 'angular' ? 'Angular' : fw === 'lit' ? 'Lit' : 'Expo'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View
                style={{
                  padding: 14,
                  gap: 6,
                  minWidth: 0,
                  maxWidth: '100%',
                  ...(Platform.OS === 'web' ? ({ overflowX: 'auto' } as object) : {}),
                }}
              >
                <Text
                  selectable
                  style={{
                    color: t.text,
                    fontSize: 12,
                    fontFamily: t.fontMono,
                    ...(Platform.OS === 'web' ? ({ overflowWrap: 'anywhere', wordBreak: 'break-word' } as object) : {}),
                  }}
                >
                  {snippetTab === 'react'
                    ? activeItem.reactImport
                    : snippetTab === 'angular'
                      ? activeItem.angularImport
                      : snippetTab === 'lit'
                        ? activeItem.litImport
                        : activeItem.expoImport}
                </Text>
                <Text
                  selectable
                  style={{
                    color: t.textMuted,
                    fontSize: 12,
                    fontFamily: t.fontMono,
                    ...(Platform.OS === 'web' ? ({ overflowWrap: 'anywhere', wordBreak: 'break-word' } as object) : {}),
                  }}
                >
                  {activeItem.installCommands[snippetTab]}
                </Text>
              </View>
            </View>

            {/* Properties & Events (API Docs) */}
            {(() => {
              const api = EMR_COMPONENT_API[activeItem.selector];
              if (!api || (api.inputs.length === 0 && api.outputs.length === 0)) return null;
              return (
                <View style={{ gap: 20, width: '100%', maxWidth: '100%', minWidth: 0 }}>
                  {api.inputs.length > 0 ? (
                    <View style={{ gap: 8, width: '100%', maxWidth: '100%', minWidth: 0 }}>
                      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', fontFamily: t.fontFamily }}>
                        Properties
                      </Text>
                      <View
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: 0,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: t.border,
                          backgroundColor: t.surface,
                          overflow: 'hidden',
                          ...(Platform.OS === 'web' ? ({ overflowX: 'auto' } as object) : {}),
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderBottomWidth: 1,
                            borderColor: t.border,
                            backgroundColor: t.surfaceSoft,
                            gap: 12,
                          }}
                        >
                          <Text style={{ flex: 1.1, minWidth: 0, color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: t.fontFamily }}>
                            Name
                          </Text>
                          <Text style={{ flex: 1.6, minWidth: 0, color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: t.fontFamily }}>
                            Type
                          </Text>
                          <Text style={{ flex: 0.9, minWidth: 0, color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: t.fontFamily }}>
                            Default
                          </Text>
                        </View>
                        {api.inputs.map((prop, idx) => (
                          <View
                            key={prop.name}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              borderTopWidth: idx === 0 ? 0 : 1,
                              borderColor: t.border,
                              gap: 12,
                            }}
                          >
                            <View style={{ flex: 1.1, minWidth: 0, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <Text selectable style={{ color: t.text, fontSize: 13, fontWeight: '600', fontFamily: t.fontMono, ...(Platform.OS === 'web' ? ({ overflowWrap: 'anywhere' } as object) : {}) }}>
                                {prop.name}
                              </Text>
                              {prop.required ? <EmrBadgeView badge={{ label: 'required', tone: 'warning' }} /> : null}
                            </View>
                            <Text selectable style={{ flex: 1.6, minWidth: 0, color: t.primaryContrast, fontSize: 12, fontFamily: t.fontMono, ...(Platform.OS === 'web' ? ({ overflowWrap: 'anywhere' } as object) : {}) }}>
                              {prop.type}
                            </Text>
                            <Text selectable style={{ flex: 0.9, minWidth: 0, color: t.textMuted, fontSize: 12, fontFamily: t.fontMono, ...(Platform.OS === 'web' ? ({ overflowWrap: 'anywhere' } as object) : {}) }}>
                              {prop.defaultValue ?? (prop.required ? '—' : 'undefined')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {api.outputs.length > 0 ? (
                    <View style={{ gap: 8, width: '100%', maxWidth: '100%', minWidth: 0 }}>
                      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', fontFamily: t.fontFamily }}>
                        Events
                      </Text>
                      <View
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: 0,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: t.border,
                          backgroundColor: t.surface,
                          overflow: 'hidden',
                          ...(Platform.OS === 'web' ? ({ overflowX: 'auto' } as object) : {}),
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderBottomWidth: 1,
                            borderColor: t.border,
                            backgroundColor: t.surfaceSoft,
                            gap: 12,
                          }}
                        >
                          <Text style={{ flex: 1, minWidth: 0, color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: t.fontFamily }}>
                            Event
                          </Text>
                          <Text style={{ flex: 2, minWidth: 0, color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: t.fontFamily }}>
                            Payload
                          </Text>
                        </View>
                        {api.outputs.map((ev, idx) => (
                          <View
                            key={ev.name}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              borderTopWidth: idx === 0 ? 0 : 1,
                              borderColor: t.border,
                              gap: 12,
                            }}
                          >
                            <Text selectable style={{ flex: 1, minWidth: 0, color: t.text, fontSize: 13, fontWeight: '600', fontFamily: t.fontMono, ...(Platform.OS === 'web' ? ({ overflowWrap: 'anywhere' } as object) : {}) }}>
                              {ev.name}
                            </Text>
                            <Text selectable style={{ flex: 2, minWidth: 0, color: t.primaryContrast, fontSize: 12, fontFamily: t.fontMono, ...(Platform.OS === 'web' ? ({ overflowWrap: 'anywhere' } as object) : {}) }}>
                              {ev.type}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })()}
          </View>
        ) : null}
      </View>
    </View>
  );
}
