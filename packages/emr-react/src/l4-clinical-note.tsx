'use client';

import { createElement, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type {
  ClinicalNoteAction,
  ClinicalNoteHistoryEntry,
  ClinicalNoteSnapshotView,
  ClinicalNoteSignatureView,
  ClinicalNoteWorkspaceIntent,
  ClinicalNoteWorkspaceViewModel,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

type Dispatch = (intent: ClinicalNoteWorkspaceIntent) => void;

function NoteActions({ actions, onIntent }: { actions: readonly ClinicalNoteAction[]; onIntent: Dispatch }) {
  if (!actions.length) return null;
  return (
    <View style={styles.actions}>
      {actions.map(action => (
        <EmrButton key={action.id} label={action.label} variant={action.primary ? 'primary' : 'outline'}
          onPress={() => onIntent({ type: 'actionRequested', actionId: action.id })} />
      ))}
    </View>
  );
}

function NoteEntries({ entries, onIntent }: { entries: readonly ClinicalNoteHistoryEntry[]; onIntent: Dispatch }) {
  const t = useEmrTheme();
  return (
    <View role="list" style={styles.stack}>
      {entries.map(entry => (
        <View role="listitem" key={entry.id} style={[styles.entry, { borderColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>{entry.title}</Text>
          {entry.metadata.map((line, index) => <Text key={index} style={{ color: t.textMuted, fontSize: t.textSm }}>{line}</Text>)}
          {entry.reason ? <Text style={{ color: t.text, fontSize: t.textSm }}>Reason · {entry.reason}</Text> : null}
          <NoteActions actions={entry.actions} onIntent={onIntent} />
        </View>
      ))}
    </View>
  );
}

function NoteSignatures({ signatures }: { signatures?: readonly ClinicalNoteSignatureView[] }) {
  const t = useEmrTheme();
  const muted = { color: t.textMuted, fontSize: t.textSm };
  return signatures?.map(signature => (
    <View key={`${signature.signerId}:${signature.purpose}`} style={styles.section}>
      <Text style={muted}>{signature.purpose === 'co-sign' ? 'Co-signed by' : 'Signed by'} {signature.name} · {signature.role} · {signature.signedAtLabel}</Text>
      {signature.verification ? (
        <Text style={muted}>{signature.verification.label}
          {signature.verification.status === 'verified' ? ` · ${signature.verification.verifiedAtLabel}` : ''}
        </Text>
      ) : null}
    </View>
  ));
}

function NoteSnapshot({ snapshot }: { snapshot: ClinicalNoteSnapshotView }) {
  const t = useEmrTheme();
  return (
    <View style={[styles.panel, { borderColor: t.border, backgroundColor: t.surface }]}>
      <Text role="heading" style={{ color: t.text, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }}>{snapshot.title}</Text>
      {snapshot.metadata.map((line, index) => <Text key={index} style={{ color: t.textMuted, fontSize: t.textSm }}>{line}</Text>)}
      <NoteSignatures signatures={snapshot.signatures} />
      {snapshot.sections.map(section => (
        <View key={section.id} style={styles.section}>
          <Text style={{ color: t.text, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>{section.label}</Text>
          <Text style={{ color: t.text, fontSize: t.textMd }}>{section.value || 'Not supplied'}</Text>
        </View>
      ))}
    </View>
  );
}

const printStyle = '@media print { [data-emr-note-interactive] { display: none !important } [data-emr-note-record] { display: block !important } } .emr-print [data-emr-note-interactive] { display: none !important } .emr-print [data-emr-note-record] { display: block !important }';
const webPrintProps = (kind: 'interactive' | 'record') =>
  Platform.OS === 'web' ? { dataSet: { [`emr-note-${kind}`]: '' } } : {};

/** L4 controlled clinical note workspace for outpatient, inpatient and operative records. */
export function EmrClinicalNoteWorkspace({ model, headingId, onIntent }: {
  model: ClinicalNoteWorkspaceViewModel;
  headingId?: string;
  onIntent: Dispatch;
}) {
  const t = useEmrTheme();
  const [width, setWidth] = useState(0);
  const wide = width >= 800 && !!model.history;
  const heading = { color: t.text, fontFamily: fontFamily(t), fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) };
  const body = { color: t.text, fontFamily: fontFamily(t), fontSize: t.textMd };
  const muted = { ...body, color: t.textMuted, fontSize: t.textSm };
  const panel = [styles.panel, { borderColor: t.border, backgroundColor: t.surface }];
  const comparison = model.history?.comparison;

  return (
    <View style={styles.stack} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {Platform.OS === 'web' ? createElement('style', null, printStyle) : null}
      <View style={panel}>
        <Text style={muted}>{model.context}</Text>
        <Text nativeID={headingId} role="heading" style={{ ...heading, fontSize: t.textXl }}>{model.title}</Text>
        <Text role="status" style={heading}>{model.status}</Text>
        {model.metadata.map((line, index) => <Text key={index} style={muted}>{line}</Text>)}
        <NoteSignatures signatures={model.signatures} />
        <View {...webPrintProps('interactive')} style={styles.stack}>
          {model.message ? <Text style={muted}>{model.message}</Text> : null}
          {model.error ? <Text role="alert" style={{ ...body, color: t.danger }}>{model.error}</Text> : null}
          <NoteActions actions={model.actions} onIntent={onIntent} />
        </View>
      </View>
      <View {...webPrintProps('record')} style={[styles.columns, wide && styles.wide]}>
        <View style={[styles.stack, wide && styles.main]}>
          {model.current ? <NoteSnapshot snapshot={model.current} /> : null}
          {model.addenda.map(addendum => <NoteSnapshot key={addendum.id} snapshot={addendum} />)}
          {model.review ? <View {...webPrintProps('interactive')}><NoteSnapshot snapshot={model.review} /></View> : null}
          {model.form ? (
            <View {...webPrintProps('interactive')} style={panel}>
              <Text role="heading" style={heading}>{model.form.title}</Text>
              {model.form.fields.map(field => (
                <View key={field.id} style={styles.section}>
                  <Text style={body}>{field.label}</Text>
                  <ThemedInput accessibilityLabel={field.label} value={field.value} multiline={field.multiline}
                    onChangeText={value => onIntent({ type: 'fieldChanged', fieldId: field.id, value })} />
                </View>
              ))}
              <NoteActions actions={model.form.actions} onIntent={onIntent} />
            </View>
          ) : null}
        </View>
        {model.history ? (
          <View role="region" aria-label={model.history.title} {...webPrintProps('interactive')} style={[panel, wide && styles.aside]}>
            <Text role="heading" style={heading}>{model.history.title}</Text>
            <NoteEntries entries={model.history.entries} onIntent={onIntent} />
            {model.history.snapshot ? <NoteSnapshot snapshot={model.history.snapshot} /> : null}
            {comparison ? (
              <View style={styles.stack}>
                <Text role="heading" style={heading}>{comparison.title}</Text>
                {comparison.rows.length === 0 ? <Text style={muted}>No sections changed.</Text> : null}
                {comparison.rows.map(row => (
                  <View key={row.id} style={[styles.entry, { borderColor: t.border }]}>
                    <Text style={heading}>{row.label}</Text>
                    <View style={styles.actions}>
                      <View style={styles.value}><Text style={muted}>{comparison.previousLabel}</Text><Text style={body}>{row.previous ?? 'Section absent'}</Text></View>
                      <View style={styles.value}><Text style={muted}>{comparison.currentLabel}</Text><Text style={body}>{row.current ?? 'Section absent'}</Text></View>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View role="region" aria-label={model.queue.title} {...webPrintProps('interactive')} style={panel}>
        <Text role="heading" style={heading}>{model.queue.title}</Text>
        {model.queue.entries.length ? <NoteEntries entries={model.queue.entries} onIntent={onIntent} /> : <Text style={muted}>{model.queue.emptyLabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  section: { gap: 4 },
  panel: { gap: 8, padding: 12, borderRadius: 8, borderWidth: 1, minWidth: 0 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  columns: { gap: 12 },
  wide: { flexDirection: 'row', alignItems: 'flex-start' },
  main: { flex: 3, minWidth: 0 },
  aside: { flex: 2, minWidth: 0 },
  entry: { paddingTop: 8, borderTopWidth: 1, gap: 4 },
  value: { flexGrow: 1, flexBasis: 136, minWidth: 0, gap: 4 },
});
