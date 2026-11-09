'use client';

import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useEmrTheme } from '../../src';
import type { EmrBadge, EmrTone } from '@drguptavivek/emr-controller';
import { EmrAlert, EmrCard, EmrChip, EmrColumns, EmrFieldValueRow, EmrSeparator, EmrStateMessage, EmrStatusCell } from '../../src/l1-display';
import type { GallerySection } from './types';

const tones: EmrTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const badge = (tone: EmrTone, label: string): EmrBadge => ({ tone, label });
/** Demo body text in the theme's text colour (plain Text renders black in dark mode). */
function T({ children }: { children: ReactNode }) {
  return <Text style={{ color: useEmrTheme().text }}>{children}</Text>;
}

function Box({ text }: { text: string }) {
  return <View style={{ padding: 8, borderWidth: 1, borderColor: useEmrTheme().border }}><T>{text}</T></View>;
}

const box = (text: string) => <Box text={text} />;
const stack = { gap: 12 } as const;

export const gallery: GallerySection[] = [
  { id: 'chip', title: 'EmrChip', render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{tones.map(t => <EmrChip key={t} tone={t}>{`Tone ${t}`}</EmrChip>)}</View>
  ) },
  { id: 'alert', title: 'EmrAlert', render: () => (
    <View style={stack}>
      {tones.map(t => <EmrAlert key={t} tone={t} title={`Alert ${t}`}>Synthetic body text for this alert.</EmrAlert>)}
      <EmrAlert title="Title only" />
    </View>
  ) },
  { id: 'state-message', title: 'EmrStateMessage', render: () => (
    <View style={stack}>
      <EmrStateMessage kind="empty" message="No encounters recorded." />
      <EmrStateMessage kind="loading" />
      <EmrStateMessage kind="error" title="Could not load" message="Try again later." />
    </View>
  ) },
  { id: 'separator', title: 'EmrSeparator', render: () => (
    <View>
      <T>Above</T>
      <EmrSeparator />
      <EmrSeparator label="Section label" />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><T>Left</T><EmrSeparator orientation="vertical" /><T>Right</T></View>
    </View>
  ) },
  { id: 'card', title: 'EmrCard', render: () => (
    <EmrColumns count={3} gap={12}>
      <EmrCard label="Padded card"><T>Standard padded card body.</T></EmrCard>
      <EmrCard label="Flush card (table / list)" padded={false}>
        <EmrFieldValueRow field="OD" value="6/6" remarks="Unaided" />
        <EmrFieldValueRow field="OS" value="6/9" remarks="With pinhole 6/6" />
      </EmrCard>
      <EmrCard><T>Card without header bar</T></EmrCard>
    </EmrColumns>
  ) },
  { id: 'columns', title: 'EmrColumns (1 to 6 columns)', render: () => (
    <View style={stack}>
      <EmrColumns count={6} gap={8}>{box('Col 1')}{box('Col 2')}{box('Col 3')}{box('Col 4')}{box('Col 5')}{box('Col 6')}</EmrColumns>
      <EmrColumns count={4} gap={8}>{box('1 of 4')}{box('2 of 4')}{box('3 of 4')}{box('4 of 4')}</EmrColumns>
      <EmrColumns count={3} gap={8}>{box('A (1/3)')}{box('B (1/3)')}{box('C (1/3)')}</EmrColumns>
      <EmrColumns widths={['2fr', '1fr']} gap={8}>{box('Wide (2fr)')}{box('Narrow (1fr)')}</EmrColumns>
    </View>
  ) },
  { id: 'field-value-row', title: 'EmrFieldValueRow', render: () => (
    <View>
      <EmrFieldValueRow heading field="Field" value="Value" remarks="Remarks" notes="Notes" />
      <EmrFieldValueRow field="Pulse" value="72 /min" remarks="Regular" notes="Seated" />
      <EmrFieldValueRow field="Temperature" />
    </View>
  ) },
  { id: 'status-cell', title: 'EmrStatusCell', render: () => (
    <View style={stack}>
      <EmrStatusCell status={badge('success', 'Recorded')} valueLabel="120/80" attribution={{ nameLabel: 'A. Example', roleLabel: 'Nurse', timeLabel: '09:30' }}
        action={{ label: 'Edit', icon: '✎' }} secondaryNote="Synthetic note" onIntent={() => {}} />
      <EmrStatusCell status={badge('warning', 'Not assessed')} selectable onIntent={() => {}} />
      <EmrStatusCell status={badge('danger', 'Refused')} valueLabel="Hidden when compact" compact />
      <EmrStatusCell status={badge('neutral', 'Read only')} valueLabel="42" action={{ label: 'Edit' }} readOnly />
    </View>
  ) },
];
