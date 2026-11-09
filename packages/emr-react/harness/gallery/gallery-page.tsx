'use client';

import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { EmrBadgeView, EmrThemeProvider, useEmrTheme, type EmrColorScheme } from '../../src';
import { HarnessForm } from '../harness-form';
import { galleryGroups } from './index';
import { EMR_REGISTRY_MANIFEST } from './registry-manifest';

type SiteTab = 'showcase' | 'registry' | 'form';
type FrameworkTab = 'react' | 'angular' | 'expo';

function Section({ id, title, render: Render }: { id: string; title: string; render: () => React.ReactNode }) {
  const t = useEmrTheme();
  return (
    <View
      nativeID={`gallery-${id}`}
      style={{
        gap: 12,
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: t.border,
        backgroundColor: t.surface,
      }}
    >
      <Text role="heading" aria-level={3} style={{ color: t.textMuted, fontSize: t.textSm, fontWeight: '700' }}>
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
        : item.react.import;

  const targetFiles =
    framework === 'angular'
      ? item.angular.files
      : framework === 'expo'
        ? item.expo.files
        : item.react.files;

  const reactLabel = 'reactName' in item ? item.reactName : 'EmrThemeProvider';
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
            <Text style={{ color: t.text, fontSize: t.textLg, fontWeight: '700' }}>{reactLabel}</Text>
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
}: {
  scheme: EmrColorScheme;
  onScheme: (s: EmrColorScheme) => void;
}) {
  const t = useEmrTheme();
  const [tab, setTab] = useState<SiteTab>('showcase');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedLayer, setSelectedLayer] = useState<number | 'all'>('all');
  const [framework, setFramework] = useState<FrameworkTab>('react');
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim().toLowerCase();

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
        minHeight: 40,
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: active ? t.primary : t.border,
        backgroundColor: active ? t.primarySoft : t.surface,
      }}
    >
      <Text style={{ color: active ? t.primaryContrast : t.text, fontWeight: '600', fontSize: t.textSm }}>
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
            <Text role="heading" aria-level={1} style={{ color: t.text, fontSize: t.textXl, fontWeight: '700' }}>
              EMR Component System · L0–L6 Catalog
            </Text>
            <Text style={{ color: t.textMuted, fontSize: t.textSm }}>
              117 installable components synchronized across Angular (`@drguptavivek/emr-ui`), React Web, and Expo (`@drguptavivek/emr-react`)
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {pillButton('tab-showcase', `Interactive Showcase (${galleryGroups.length} groups)`, tab === 'showcase', () => setTab('showcase'))}
            {pillButton('tab-registry', `Shadcn Registry (${EMR_REGISTRY_MANIFEST.totalItems} items)`, tab === 'registry', () => setTab('registry'))}
            {pillButton('tab-form', 'OPD Clinical Form Demo', tab === 'form', () => setTab('form'))}
            {pillButton('link-storybook', 'Angular Storybook ↗', false, () => {
              void Linking.openURL('./storybook/index.html');
            })}
            <Pressable
              role="button"
              onPress={() => onScheme(scheme === 'light' ? 'dark' : 'light')}
              style={{
                minHeight: 40,
                paddingHorizontal: 14,
                justifyContent: 'center',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.primaryBorder,
                backgroundColor: t.primarySoft,
              }}
            >
              <Text style={{ color: t.primaryContrast, fontWeight: '600', fontSize: t.textSm }}>
                {scheme === 'light' ? 'Dark theme' : 'Light theme'}
              </Text>
            </Pressable>
          </View>
        </View>

        {tab !== 'form' ? (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                tab === 'showcase'
                  ? 'Filter interactive components (e.g. banner,pedigree, chart, table, consent)...'
                  : 'Search 117 registry items by slug, React/Angular name, or clinical keyword...'
              }
              placeholderTextColor={t.textMuted}
              aria-label="Search components"
              style={{
                flex: 1,
                minWidth: 260,
                minHeight: 40,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.background,
                color: t.text,
                fontSize: t.textSm,
              }}
            />
            {tab === 'registry' ? (
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
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
          {/* Left sidebar navigation for the 31 interactive groups */}
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
                borderRadius: 6,
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
                    borderRadius: 6,
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
                <Text role="heading" aria-level={2} style={{ color: t.text, fontSize: t.textXl, fontWeight: '700' }}>
                  {group.title}
                </Text>
                {group.sections.map((section) => (
                  <Section key={section.id} {...section} />
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
  return (
    <EmrThemeProvider scheme={scheme} overrides={{ controlHeight: 48 }}>
      <Surface scheme={scheme} onScheme={setScheme} />
    </EmrThemeProvider>
  );
}
