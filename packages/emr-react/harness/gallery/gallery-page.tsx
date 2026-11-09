'use client';

import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { EmrBadgeView, EmrThemeProvider, SvgIcon, useEmrTheme, type EmrColorScheme, type EmrTokens } from '../../src';
import { HarnessForm } from '../harness-form';
import { galleryGroups } from './index';
import { EMR_REGISTRY_MANIFEST } from './registry-manifest';

type SiteTab = 'showcase' | 'registry' | 'form';
type FrameworkTab = 'react' | 'angular' | 'expo' | 'lit';
type PalettePresetId = 'clinical-slate' | 'surgical-teal' | 'royal-blue' | 'forest-emerald' | 'ophthal-dark-room';
type FontStackId = 'inter' | 'ibm-plex' | 'atkinson' | 'system';
type DensityId = 'compact' | 'standard' | 'touch';
type RadiusId = 'sharp' | 'crisp' | 'standard' | 'soft';
type FontScaleId = '0.9' | '1' | '1.1' | '1.2';

interface CustomThemeState {
  palette: PalettePresetId;
  fontStack: FontStackId;
  density: DensityId;
  radius: RadiusId;
  fontScale: FontScaleId;
  customBrandHex: string;
}

const PALETTE_PRESETS: Record<
  PalettePresetId,
  {
    label: string;
    swatch: string;
    light: Partial<EmrTokens>;
    dark: Partial<EmrTokens>;
  }
> = {
  'clinical-slate': {
    label: 'Clinical Slate',
    swatch: '#475f70',
    light: {
      primary: '#475f70',
      primaryHover: '#d4e0e6',
      primaryContrast: '#344b5a',
      primarySoft: '#e3ebef',
      primaryBorder: '#b2c4ce',
      focus: '#5f7f92',
    },
    dark: {
      primary: '#c5d5df',
      primaryHover: '#435966',
      primaryContrast: '#e8eff3',
      primarySoft: '#334755',
      primaryBorder: '#708998',
      focus: '#8fb0c2',
    },
  },
  'surgical-teal': {
    label: 'Surgical Teal',
    swatch: '#0f766e',
    light: {
      primary: '#0f766e',
      primaryHover: '#ccfbf1',
      primaryContrast: '#115e59',
      primarySoft: '#e6fffa',
      primaryBorder: '#5eead4',
      focus: '#0d9488',
    },
    dark: {
      primary: '#5eead4',
      primaryHover: '#115e59',
      primaryContrast: '#ccfbf1',
      primarySoft: '#134e4a',
      primaryBorder: '#2dd4bf',
      focus: '#2dd4bf',
    },
  },
  'royal-blue': {
    label: 'Hospital Blue',
    swatch: '#1d4ed8',
    light: {
      primary: '#1d4ed8',
      primaryHover: '#dbeafe',
      primaryContrast: '#1e3a8a',
      primarySoft: '#eff6ff',
      primaryBorder: '#93c5fd',
      focus: '#2563eb',
    },
    dark: {
      primary: '#93c5fd',
      primaryHover: '#1e3a8a',
      primaryContrast: '#dbeafe',
      primarySoft: '#172554',
      primaryBorder: '#60a5fa',
      focus: '#60a5fa',
    },
  },
  'forest-emerald': {
    label: 'Clinical Emerald',
    swatch: '#15803d',
    light: {
      primary: '#15803d',
      primaryHover: '#dcfce7',
      primaryContrast: '#14532d',
      primarySoft: '#f0fdf4',
      primaryBorder: '#86efac',
      focus: '#16a34a',
    },
    dark: {
      primary: '#86efac',
      primaryHover: '#14532d',
      primaryContrast: '#dcfce7',
      primarySoft: '#052e16',
      primaryBorder: '#4ade80',
      focus: '#4ade80',
    },
  },
  'ophthal-dark-room': {
    label: 'Ophthal Dark-Room',
    swatch: '#0b1120',
    light: {
      primary: '#7dd3fc',
      primaryHover: '#1e293b',
      primaryContrast: '#e0f2fe',
      primarySoft: '#0f172a',
      primaryBorder: '#38bdf8',
      focus: '#38bdf8',
      background: '#050811',
      surface: '#0b1120',
      surfaceSoft: '#111827',
      surfaceRaised: '#1e293b',
      border: '#334155',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
    },
    dark: {
      primary: '#7dd3fc',
      primaryHover: '#1e293b',
      primaryContrast: '#e0f2fe',
      primarySoft: '#0f172a',
      primaryBorder: '#38bdf8',
      focus: '#38bdf8',
      background: '#050811',
      surface: '#0b1120',
      surfaceSoft: '#111827',
      surfaceRaised: '#1e293b',
      border: '#334155',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
    },
  },
};

const FONT_STACKS: Record<FontStackId, { label: string; sans: string; mono: string }> = {
  inter: {
    label: 'Inter Clinical (I/l + Tabular)',
    sans: "'Inter Variable', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  'ibm-plex': {
    label: 'IBM Plex Sans + Mono',
    sans: "'IBM Plex Sans', 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  atkinson: {
    label: 'Atkinson Hyperlegible',
    sans: "'Atkinson Hyperlegible', 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  system: {
    label: 'System UI Native',
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
};

const DENSITY_OPTIONS: Record<DensityId, { label: string; controlHeight: number; compactHeight: number }> = {
  compact: { label: 'Compact (36px)', controlHeight: 36, compactHeight: 28 },
  standard: { label: 'Standard (44px)', controlHeight: 44, compactHeight: 32 },
  touch: { label: 'Touch (48px)', controlHeight: 48, compactHeight: 36 },
};

const RADIUS_OPTIONS: Record<RadiusId, { label: string; px: number }> = {
  sharp: { label: 'Sharp (0px)', px: 0 },
  crisp: { label: 'Crisp (6px)', px: 6 },
  standard: { label: 'Standard (8px)', px: 8 },
  soft: { label: 'Soft (12px)', px: 12 },
};

function Section({
  id,
  title,
  radiusPx,
  render: Render,
}: {
  id: string;
  title: string;
  radiusPx: number;
  render: () => React.ReactNode;
}) {
  const t = useEmrTheme();
  return (
    <View
      nativeID={`gallery-${id}`}
      style={{
        gap: 12,
        padding: 16,
        borderWidth: 1,
        borderRadius: Math.max(0, radiusPx + 2),
        borderColor: t.border,
        backgroundColor: t.surface,
      }}
    >
      <Text role="heading" aria-level={3} style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: '700', fontFamily: t.fontFamily }}>
        {title}
      </Text>
      <Render />
    </View>
  );
}

function RegistryCard({
  item,
  framework,
}: {
  item: (typeof EMR_REGISTRY_MANIFEST.items)[number];
  framework: FrameworkTab;
}) {
  const t = useEmrTheme();
  const [expanded, setExpanded] = useState(false);

  const cliCmd =
    item.name === 'foundations'
      ? `pnpm emr init --framework ${framework}`
      : `pnpm emr add ${item.name} --framework ${framework}`;

  const importSnippet =
    framework === 'angular'
      ? item.angular.import
      : framework === 'expo'
        ? item.expo.import
        : framework === 'lit'
          ? item.lit.import
          : item.react.import;

  const targetFiles =
    framework === 'angular'
      ? item.angular.files
      : framework === 'expo'
        ? item.expo.files
        : framework === 'lit'
          ? item.lit.files
          : item.react.files;

  const componentLabel =
    framework === 'lit'
      ? 'litName' in item
        ? item.litName
        : 'EmrLitElement'
      : framework === 'angular'
        ? 'id' in item
          ? item.id
          : 'emr.css'
        : 'reactName' in item
          ? item.reactName
          : 'EmrThemeProvider';
  const selectorLabel = 'selector' in item && item.selector ? `<${item.selector}>` : 'foundations';

  return (
    <View
      style={{
        gap: 10,
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: t.border,
        backgroundColor: t.surface,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ gap: 4, flex: 1, minWidth: 220 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <EmrBadgeView badge={{ label: `L${item.layer} · ${item.layerName}`, tone: 'info' }} />
            <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: '700' }}>{componentLabel}</Text>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: t.fontMono }}>{selectorLabel}</Text>
          </View>
          <Text style={{ color: t.textMuted, fontSize: t.textSm }}>{item.description}</Text>
        </View>
        <EmrBadgeView badge={{ label: item.status, tone: item.status === 'stable' ? 'success' : 'neutral' }} />
      </View>

      <View
        style={{
          padding: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.surfaceSoft,
          gap: 6,
        }}
      >
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: '700' }}>
          CLI INSTALL ({framework.toUpperCase()})
        </Text>
        <Text selectable style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
          {cliCmd}
        </Text>
        <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: '700', marginTop: 4 }}>
          PACKAGE IMPORT
        </Text>
        <Text selectable style={{ color: t.text, fontSize: t.textSm, fontFamily: t.fontMono }}>
          {importSnippet}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Text style={{ color: t.textMuted, fontSize: t.textXs }}>
            Dependencies ({item.registryDependencies.length}):
          </Text>
          {item.registryDependencies.length === 0 ? (
            <Text style={{ color: t.textMuted, fontSize: t.textXs }}>none</Text>
          ) : (
            item.registryDependencies.map((dep) => (
              <View
                key={dep}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.background,
                }}
              >
                <Text style={{ color: t.text, fontSize: t.textXs, fontFamily: t.fontMono }}>{dep}</Text>
              </View>
            ))
          )}
        </View>

        <Pressable
          role="button"
          onPress={() => setExpanded((prev) => !prev)}
          style={{
            minHeight: 36,
            paddingHorizontal: 12,
            justifyContent: 'center',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.background,
          }}
        >
          <Text style={{ color: t.text, fontSize: t.textXs, fontWeight: '600' }}>
            {expanded ? 'Hide source files' : `Show files (${targetFiles.length})`}
          </Text>
        </Pressable>
      </View>

      {expanded ? (
        <View
          style={{
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.background,
            gap: 4,
          }}
        >
          <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: '700' }}>
            BUNDLED SOURCE FILES ({framework.toUpperCase()})
          </Text>
          {targetFiles.map((f) => (
            <Text key={f} selectable style={{ color: t.text, fontSize: t.textXs, fontFamily: t.fontMono }}>
              • {f}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Surface({
  scheme,
  onScheme,
  customTheme,
  onCustomTheme,
}: {
  scheme: EmrColorScheme;
  onScheme: (s: EmrColorScheme) => void;
  customTheme: CustomThemeState;
  onCustomTheme: (next: CustomThemeState) => void;
}) {
  const t = useEmrTheme();
  const [tab, setTab] = useState<SiteTab>('showcase');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedLayer, setSelectedLayer] = useState<number | 'all'>('all');
  const [framework, setFramework] = useState<FrameworkTab>('react');
  const [query, setQuery] = useState('');
  const [customizerOpen, setCustomizerOpen] = useState(true);

  const trimmedQuery = query.trim().toLowerCase();
  const radiusPx = RADIUS_OPTIONS[customTheme.radius].px;

  const filteredGroups = useMemo(() => {
    return galleryGroups
      .filter((g) => selectedGroupId === 'all' || g.id === selectedGroupId)
      .map((g) => {
        if (!trimmedQuery) return g;
        const groupMatches = g.title.toLowerCase().includes(trimmedQuery) || g.id.toLowerCase().includes(trimmedQuery);
        if (groupMatches) return g;
        return {
          ...g,
          sections: g.sections.filter(
            (s) => s.title.toLowerCase().includes(trimmedQuery) || s.id.toLowerCase().includes(trimmedQuery)
          ),
        };
      })
      .filter((g) => g.sections.length > 0);
  }, [selectedGroupId, trimmedQuery]);

  const filteredRegistryItems = useMemo(() => {
    return EMR_REGISTRY_MANIFEST.items.filter((item) => {
      if (selectedLayer !== 'all' && item.layer !== selectedLayer) return false;
      if (!trimmedQuery) return true;
      const reactName = 'reactName' in item ? item.reactName : '';
      return (
        item.name.toLowerCase().includes(trimmedQuery) ||
        reactName.toLowerCase().includes(trimmedQuery) ||
        item.description.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [selectedLayer, trimmedQuery]);

  const pillButton = (key: string, label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      role="button"
      aria-pressed={active}
      onPress={onPress}
      style={{
        minHeight: 38,
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderRadius: radiusPx,
        borderWidth: 1,
        borderColor: active ? t.primary : t.border,
        backgroundColor: active ? t.primarySoft : t.surface,
      }}
    >
      <Text style={{ color: active ? t.primaryContrast : t.text, fontWeight: '600', fontSize: t.textSm, fontFamily: t.fontFamily }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, minHeight: '100vh' as unknown as number, backgroundColor: t.background }}>
      {/* Top sticky header */}
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: t.border,
          backgroundColor: t.surface,
          paddingHorizontal: 24,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
          <View style={{ gap: 2 }}>
            <Text role="heading" aria-level={1} style={{ color: t.text, fontSize: t.textXl, fontWeight: '700', fontFamily: t.fontFamily }}>
              EMR Component System · L0–L6 Catalog
            </Text>
            <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: t.fontFamily }}>
              117 installable components synchronized across Lit Web Components (`@drguptavivek/emr-elements`), Angular (`@drguptavivek/emr-ui`), React Web & Expo (`@drguptavivek/emr-react`)
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {pillButton('tab-showcase', `Interactive Showcase (${galleryGroups.length} groups)`, tab === 'showcase', () => setTab('showcase'))}
            {pillButton('tab-registry', `Shadcn Registry (${EMR_REGISTRY_MANIFEST.totalItems} items)`, tab === 'registry', () => setTab('registry'))}
            {pillButton('tab-form', 'OPD Clinical Form Demo', tab === 'form', () => setTab('form'))}
            {pillButton(
              'btn-customizer',
              customizerOpen ? 'Hide Theme & Typography Studio' : 'Customize Design & Typography',
              customizerOpen,
              () => setCustomizerOpen((v) => !v),
            )}
            {pillButton('link-storybook', 'Angular Storybook ↗', false, () => {
              void Linking.openURL('./storybook/index.html');
            })}
            <Pressable
              role="button"
              onPress={() => onScheme(scheme === 'light' ? 'dark' : 'light')}
              style={{
                minHeight: 38,
                paddingHorizontal: 14,
                justifyContent: 'center',
                borderRadius: radiusPx,
                borderWidth: 1,
                borderColor: t.primaryBorder,
                backgroundColor: t.primarySoft,
              }}
            >
              <Text style={{ color: t.primaryContrast, fontWeight: '600', fontSize: t.textSm, fontFamily: t.fontFamily }}>
                {scheme === 'light' ? 'Dark theme' : 'Light theme'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Live End-User Design & Typography Customizer Bar */}
        {customizerOpen ? (
          <View
            style={{
              maxWidth: 1400,
              width: '100%',
              alignSelf: 'center',
              padding: 14,
              borderRadius: Math.max(0, radiusPx + 2),
              borderWidth: 1,
              borderColor: t.primaryBorder,
              backgroundColor: t.surfaceSoft,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SvgIcon name="sliders" size={16} color={t.primaryContrast} />
                <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: '700', fontFamily: t.fontFamily }}>
                  End-User Design & Clinical Typography Studio (Live CSS Variables + Token Context)
                </Text>
              </View>
              <Pressable
                role="button"
                onPress={() =>
                  onCustomTheme({
                    palette: 'clinical-slate',
                    fontStack: 'inter',
                    density: 'standard',
                    radius: 'standard',
                    fontScale: '1',
                    customBrandHex: '',
                  })
                }
                style={{
                  minHeight: 30,
                  paddingHorizontal: 10,
                  justifyContent: 'center',
                  borderRadius: radiusPx,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surface,
                }}
              >
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: '600', fontFamily: t.fontFamily }}>
                  Reset Defaults
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
              {/* Brand Palette */}
              <View style={{ gap: 6, flex: 1, minWidth: 280 }}>
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: '700', fontFamily: t.fontFamily }}>
                  BRAND PALETTE & DARK-ROOM PRESET
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(Object.keys(PALETTE_PRESETS) as PalettePresetId[]).map((pid) => {
                    const p = PALETTE_PRESETS[pid];
                    const active = customTheme.palette === pid && !customTheme.customBrandHex;
                    return (
                      <Pressable
                        key={pid}
                        role="button"
                        aria-pressed={active}
                        onPress={() => onCustomTheme({ ...customTheme, palette: pid, customBrandHex: '' })}
                        style={{
                          minHeight: 32,
                          paddingHorizontal: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          borderRadius: radiusPx,
                          borderWidth: 1,
                          borderColor: active ? t.primary : t.border,
                          backgroundColor: active ? t.primarySoft : t.surface,
                        }}
                      >
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            backgroundColor: p.swatch,
                            borderWidth: 1,
                            borderColor: t.border,
                          }}
                        />
                        <Text style={{ color: active ? t.primaryContrast : t.text, fontSize: t.textXs, fontWeight: '600', fontFamily: t.fontFamily }}>
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <TextInput
                    value={customTheme.customBrandHex}
                    onChangeText={(txt) => onCustomTheme({ ...customTheme, customBrandHex: txt })}
                    placeholder="#Hex Brand"
                    placeholderTextColor={t.textMuted}
                    aria-label="Custom Brand Hex Color"
                    style={{
                      width: 96,
                      minHeight: 32,
                      paddingHorizontal: 8,
                      borderRadius: radiusPx,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surface,
                      color: t.text,
                      fontSize: t.textXs,
                      fontFamily: t.fontMono,
                    }}
                  />
                </View>
              </View>

              {/* Clinical Typography */}
              <View style={{ gap: 6, flex: 1, minWidth: 280 }}>
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: '700', fontFamily: t.fontFamily }}>
                  CLINICAL FONT FAMILY (DISAMBIGUATED I/l/1 & TABULAR NUMS)
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(Object.keys(FONT_STACKS) as FontStackId[]).map((fid) => {
                    const active = customTheme.fontStack === fid;
                    return (
                      <Pressable
                        key={fid}
                        role="button"
                        aria-pressed={active}
                        onPress={() => onCustomTheme({ ...customTheme, fontStack: fid })}
                        style={{
                          minHeight: 32,
                          paddingHorizontal: 10,
                          justifyContent: 'center',
                          borderRadius: radiusPx,
                          borderWidth: 1,
                          borderColor: active ? t.primary : t.border,
                          backgroundColor: active ? t.primarySoft : t.surface,
                        }}
                      >
                        <Text style={{ color: active ? t.primaryContrast : t.text, fontSize: t.textXs, fontWeight: '600', fontFamily: FONT_STACKS[fid].sans }}>
                          {FONT_STACKS[fid].label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Corner Radius, Density & Scale */}
              <View style={{ gap: 6, minWidth: 280 }}>
                <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: '700', fontFamily: t.fontFamily }}>
                  CORNER SHAPE · CONTROL DENSITY · FONT SCALE
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(Object.keys(RADIUS_OPTIONS) as RadiusId[]).map((rid) => {
                    const active = customTheme.radius === rid;
                    return (
                      <Pressable
                        key={rid}
                        role="button"
                        aria-pressed={active}
                        onPress={() => onCustomTheme({ ...customTheme, radius: rid })}
                        style={{
                          minHeight: 32,
                          paddingHorizontal: 8,
                          justifyContent: 'center',
                          borderRadius: radiusPx,
                          borderWidth: 1,
                          borderColor: active ? t.primary : t.border,
                          backgroundColor: active ? t.primarySoft : t.surface,
                        }}
                      >
                        <Text style={{ color: active ? t.primaryContrast : t.text, fontSize: t.textXs, fontWeight: '600', fontFamily: t.fontFamily }}>
                          {RADIUS_OPTIONS[rid].label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(Object.keys(DENSITY_OPTIONS) as DensityId[]).map((did) => {
                    const active = customTheme.density === did;
                    return (
                      <Pressable
                        key={did}
                        role="button"
                        aria-pressed={active}
                        onPress={() => onCustomTheme({ ...customTheme, density: did })}
                        style={{
                          minHeight: 32,
                          paddingHorizontal: 8,
                          justifyContent: 'center',
                          borderRadius: radiusPx,
                          borderWidth: 1,
                          borderColor: active ? t.primary : t.border,
                          backgroundColor: active ? t.primarySoft : t.surface,
                        }}
                      >
                        <Text style={{ color: active ? t.primaryContrast : t.text, fontSize: t.textXs, fontWeight: '600', fontFamily: t.fontFamily }}>
                          {DENSITY_OPTIONS[did].label}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {(['0.9', '1', '1.1', '1.2'] as FontScaleId[]).map((sc) => {
                    const active = customTheme.fontScale === sc;
                    return (
                      <Pressable
                        key={sc}
                        role="button"
                        aria-pressed={active}
                        onPress={() => onCustomTheme({ ...customTheme, fontScale: sc })}
                        style={{
                          minHeight: 32,
                          paddingHorizontal: 8,
                          justifyContent: 'center',
                          borderRadius: radiusPx,
                          borderWidth: 1,
                          borderColor: active ? t.primary : t.border,
                          backgroundColor: active ? t.primarySoft : t.surface,
                        }}
                      >
                        <Text style={{ color: active ? t.primaryContrast : t.text, fontSize: t.textXs, fontWeight: '600', fontFamily: t.fontMono }}>
                          {Math.round(Number(sc) * 100)}%
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {tab !== 'form' ? (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                tab === 'showcase'
                  ? 'Filter interactive components (e.g. prescribing, banner, pedigree, chart, table)...'
                  : 'Search 118 registry items by slug, Lit/React/Angular name, or clinical keyword...'
              }
              placeholderTextColor={t.textMuted}
              aria-label="Search components"
              style={{
                flex: 1,
                minWidth: 260,
                minHeight: 40,
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
            {tab === 'registry' ? (
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {pillButton('fw-lit', 'Lit Web Components', framework === 'lit', () => setFramework('lit'))}
                {pillButton('fw-react', 'React Web', framework === 'react', () => setFramework('react'))}
                {pillButton('fw-angular', 'Angular', framework === 'angular', () => setFramework('angular'))}
                {pillButton('fw-expo', 'Expo / RN', framework === 'expo', () => setFramework('expo'))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {tab === 'form' ? (
        <HarnessForm title="emr-react · Live OPD Clinical Form" />
      ) : tab === 'registry' ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, gap: 16, maxWidth: 1400, width: '100%', alignSelf: 'center' }}
        >
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {pillButton('layer-all', `All Layers (${EMR_REGISTRY_MANIFEST.totalItems})`, selectedLayer === 'all', () => setSelectedLayer('all'))}
            {([0, 1, 2, 3, 4, 5, 6] as const).map((layerNum) =>
              pillButton(
                `layer-${layerNum}`,
                `L${layerNum} · ${EMR_REGISTRY_MANIFEST.layers[layerNum]}`,
                selectedLayer === layerNum,
                () => setSelectedLayer(layerNum)
              )
            )}
          </View>

          <Text style={{ color: t.textMuted, fontSize: t.textSm }}>
            Showing {filteredRegistryItems.length} of {EMR_REGISTRY_MANIFEST.totalItems} installable registry entries
          </Text>

          {filteredRegistryItems.map((item) => (
            <RegistryCard key={item.name} item={item} framework={framework} />
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
          {/* Left sidebar navigation for the interactive groups */}
          <ScrollView
            style={{
              width: 260,
              maxWidth: 260,
              flexGrow: 0,
              borderRightWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surface,
            }}
            contentContainerStyle={{ padding: 12, gap: 4 }}
          >
            <Text style={{ color: t.textMuted, fontSize: t.textXs, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4 }}>
              LAYERS & GROUPS
            </Text>
            <Pressable
              role="button"
              aria-pressed={selectedGroupId === 'all'}
              onPress={() => setSelectedGroupId('all')}
              style={{
                minHeight: 36,
                paddingHorizontal: 10,
                justifyContent: 'center',
                borderRadius: radiusPx,
                backgroundColor: selectedGroupId === 'all' ? t.primarySoft : 'transparent',
              }}
            >
              <Text style={{ color: selectedGroupId === 'all' ? t.primaryContrast : t.text, fontWeight: '500', fontSize: t.textSm }}>
                All Groups ({galleryGroups.length})
              </Text>
            </Pressable>
            {galleryGroups.map((g) => {
              const active = selectedGroupId === g.id;
              return (
                <Pressable
                  key={g.id}
                  role="button"
                  aria-pressed={active}
                  onPress={() => setSelectedGroupId(g.id)}
                  style={{
                    minHeight: 36,
                    paddingHorizontal: 10,
                    justifyContent: 'center',
                    borderRadius: radiusPx,
                    backgroundColor: active ? t.primarySoft : 'transparent',
                  }}
                >
                  <Text style={{ color: active ? t.primaryContrast : t.text, fontWeight: '500', fontSize: t.textSm }}>
                    {g.title} ({g.sections.length})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Main interactive component canvas */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, gap: 24 }}
          >
            {filteredGroups.length === 0 ? (
              <Text style={{ color: t.textMuted, fontSize: t.textMd }}>
                No components match "{query}".
              </Text>
            ) : null}
            {filteredGroups.map((group) => (
              <View key={group.id} nativeID={`group-${group.id}`} style={{ gap: 12 }}>
                <Text role="heading" aria-level={2} style={{ color: t.text, fontSize: t.textXl, fontWeight: '700', fontFamily: t.fontFamily }}>
                  {group.title}
                </Text>
                {group.sections.map((section) => (
                  <Section key={section.id} radiusPx={radiusPx} {...section} />
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function GalleryPage() {
  const [scheme, setScheme] = useState<EmrColorScheme>('light');
  const [customTheme, setCustomTheme] = useState<CustomThemeState>({
    palette: 'clinical-slate',
    fontStack: 'inter',
    density: 'standard',
    radius: 'standard',
    fontScale: '1',
    customBrandHex: '',
  });

  const overrides = useMemo((): Partial<EmrTokens> => {
    const pal = PALETTE_PRESETS[customTheme.palette][scheme];
    const font = FONT_STACKS[customTheme.fontStack];
    const dens = DENSITY_OPTIONS[customTheme.density];
    const scale = Number(customTheme.fontScale) || 1;
    const hexValid = /^#[0-9a-fA-F]{6}$/.test(customTheme.customBrandHex.trim());
    const customHex = hexValid ? customTheme.customBrandHex.trim() : undefined;

    return {
      ...pal,
      ...(customHex ? { primary: customHex, primaryContrast: customHex, focus: customHex } : {}),
      fontFamily: font.sans,
      fontMono: font.mono,
      controlHeight: dens.controlHeight,
      compactHeight: dens.compactHeight,
      text2xs: Math.round(11 * scale),
      textXs: Math.round(12 * scale),
      textSm: Math.round(13 * scale),
      textMd: Math.round(14 * scale),
      textLg: Math.round(16 * scale),
      textXl: Math.round(20 * scale),
      text2xl: Math.round(24 * scale),
    };
  }, [scheme, customTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (overrides.primary) root.style.setProperty('--emr-primary', overrides.primary);
    if (overrides.primaryHover) root.style.setProperty('--emr-primary-hover', overrides.primaryHover);
    if (overrides.primaryContrast) root.style.setProperty('--emr-primary-contrast', overrides.primaryContrast);
    if (overrides.primarySoft) root.style.setProperty('--emr-primary-soft', overrides.primarySoft);
    if (overrides.primaryBorder) root.style.setProperty('--emr-primary-border', overrides.primaryBorder);
    if (overrides.focus) root.style.setProperty('--emr-focus', overrides.focus);
    if (overrides.fontFamily) root.style.setProperty('--emr-font-family', overrides.fontFamily);
    if (overrides.fontMono) root.style.setProperty('--emr-font-mono', overrides.fontMono);
    if (overrides.controlHeight) root.style.setProperty('--emr-control-height', `${overrides.controlHeight}px`);
    root.style.setProperty('--emr-radius', `${RADIUS_OPTIONS[customTheme.radius].px}px`);
  }, [overrides, customTheme.radius]);

  return (
    <EmrThemeProvider scheme={scheme} overrides={overrides}>
      <Surface scheme={scheme} onScheme={setScheme} customTheme={customTheme} onCustomTheme={setCustomTheme} />
    </EmrThemeProvider>
  );
}
