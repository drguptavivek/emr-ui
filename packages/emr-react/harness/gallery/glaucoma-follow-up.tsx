'use client';

import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GlaucomaFollowUpController } from '@drguptavivek/emr-controller';
import { ThemedInput } from '../../src/inputs-core';
import { EmrDiagnosticResultSummary } from '../../src/l4-ophthalmology';
import { EmrButton } from '../../src/primitives';
import { useControllerState } from '../../src/use-controller';
import { useEmrTheme } from '../../src/theme';
import {
  canPublishGlaucomaFixtureCorrection, createGlaucomaFixtureRepository,
  GLAUCOMA_EXAMPLE_VISITS, publishGlaucomaFixtureCorrection,
} from './glaucoma-follow-up.fixture';

const fallbackStorage = new Map<string, string>();
const storage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {
      // Fall back to in-memory storage on React Native or restricted contexts.
    }
    return fallbackStorage.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fall back to in-memory storage on React Native or restricted contexts.
    }
    fallbackStorage.set(key, value);
  },
};

const operationLabels = {
  loading: 'Loading encounter…',
  saving: 'Saving draft…',
  signing: 'Signing…',
  amending: 'Opening amendment…',
  refreshingResults: 'Refreshing diagnostic results…',
  acknowledgingResult: 'Saving result acknowledgement…',
} as const;

export function GlaucomaFollowUpDemo() {
  const [controller, setController] = useState<GlaucomaFollowUpController>();
  const theme = useEmrTheme();

  useEffect(() => {
    const instance = new GlaucomaFollowUpController(createGlaucomaFixtureRepository(storage));
    instance.dispatch({ type: 'select', ...GLAUCOMA_EXAMPLE_VISITS[0] });
    setController(instance);
    return () => instance.destroy();
  }, []);

  return controller
    ? <GlaucomaFollowUpHost controller={controller} />
    : <Text role="status" style={{ color: theme.text }}>Opening synthetic encounter…</Text>;
}

function GlaucomaFollowUpHost({ controller }: { controller: GlaucomaFollowUpController }) {
  const [selected, setSelected] = useState<(typeof GLAUCOMA_EXAMPLE_VISITS)[number]>(GLAUCOMA_EXAMPLE_VISITS[0]);
  const [reasonDraft, setReasonDraft] = useState<{ revision: number; value: string }>();
  const [correctionError, setCorrectionError] = useState<string>();
  const { status, encounter, dirty, error } = useControllerState(controller);
  const theme = useEmrTheme();
  const textStyle = { color: theme.text, fontSize: theme.textSm };
  const operation = status === 'idle' || status === 'ready' || status === 'error' ? undefined : operationLabels[status];
  const ready = status === 'ready';
  const editable = ready && encounter?.status === 'draft';
  const reason = reasonDraft && reasonDraft.revision === encounter?.revision ? reasonDraft.value : '';

  function open(visit: typeof selected) {
    setSelected(visit);
    setReasonDraft(undefined);
    setCorrectionError(undefined);
    controller.dispatch({ type: 'select', patientId: visit.patientId, encounterId: visit.encounterId });
  }

  function refreshResults() {
    setCorrectionError(undefined);
    controller.dispatch({ type: 'refreshResults' });
  }

  function publishCorrection() {
    if (!ready || !encounter) return;
    try {
      publishGlaucomaFixtureCorrection(storage, encounter);
      refreshResults();
    } catch {
      setCorrectionError('Could not publish the synthetic correction. Try again.');
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <Text style={textStyle}>Synthetic records. Drafts and signatures in this example are stored in this browser tab.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {GLAUCOMA_EXAMPLE_VISITS.map(visit => (
          <EmrButton key={visit.encounterId} label={visit.label} disabled={dirty || Boolean(operation)}
            variant={selected.encounterId === visit.encounterId ? 'primary' : 'outline'}
            onPress={() => open(visit)} />
        ))}
      </View>
      {error ? <Text role="alert" style={{ color: theme.danger }}>{error}</Text> : null}
      {correctionError ? <Text role="alert" style={{ color: theme.danger }}>{correctionError}</Text> : null}
      {!encounter ? (
        status === 'error'
          ? <EmrButton label="Retry loading encounter" onPress={() => open(selected)} />
          : <Text role="status" style={textStyle}>Loading encounter…</Text>
      ) : (
        <>
          <Text role="status" style={textStyle}>
            {operation ??
              `${encounter.status === 'signed' ? 'Signed' : 'Draft'} · Revision ${encounter.revision}${dirty ? ' · Unsaved changes' : ''}`}
          </Text>
          {encounter.amendment ? (
            <Text style={textStyle}>Amendment of signed revision {encounter.amendment.baseRevision}. Reason: {encounter.amendment.reason}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['od', 'os'] as const).map(eye => {
              const label = eye === 'od' ? 'Optic disc, right eye (OD)' : 'Optic disc, left eye (OS)';
              return (
                <View key={eye} style={{ flexGrow: 1, minWidth: 200, gap: 4 }}>
                  <Text style={textStyle}>{label}</Text>
                  <ThemedInput accessibilityLabel={label} value={encounter.examination[eye]}
                    editable={editable} onChangeText={value => controller.dispatch({ type: 'editEye', eye, value })} />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <EmrButton label="Refresh diagnostic results" variant="outline" disabled={!ready} onPress={refreshResults} />
            {canPublishGlaucomaFixtureCorrection(encounter) ? (
              <EmrButton label="Publish synthetic OCT correction" variant="outline" disabled={!ready} onPress={publishCorrection} />
            ) : null}
          </View>
          {encounter.results.map(result => (
            <View key={result.id} nativeID={`glaucoma-result-${result.id}`} style={{ gap: 6 }}>
              <EmrDiagnosticResultSummary model={result.report} />
              {result.revision !== undefined ? (
                <Text style={textStyle}>Report revision {result.revision}{result.corrected ? ' · Corrected' : ''}</Text>
              ) : null}
              <Text style={textStyle}>{result.acknowledged ? 'Result acknowledged' : 'Awaiting acknowledgement'}</Text>
              <EmrButton label={`Acknowledge ${result.report.title}`} disabled={!ready || result.acknowledged}
                onPress={() => controller.dispatch({ type: 'acknowledgeResult', resultId: result.id, resultRevision: result.revision })} />
            </View>
          ))}
          <Text style={textStyle}>Follow-up owner and plan</Text>
          <ThemedInput accessibilityLabel="Follow-up owner and plan" value={encounter.followUp}
            editable={editable} onChangeText={value => controller.dispatch({ type: 'setFollowUp', value })} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <EmrButton label="Save draft" disabled={!editable || !dirty}
              onPress={() => controller.dispatch({ type: 'saveDraft' })} />
            <EmrButton label="Sign synthetic note" disabled={!editable} onPress={() => controller.dispatch({ type: 'sign' })} />
            {dirty ? <EmrButton label="Discard unsaved edits" variant="outline" disabled={!ready}
              onPress={() => controller.dispatch({ type: 'discardRequested' })} /> : null}
          </View>
          {encounter.status === 'signed' ? (
            <View style={{ gap: 4 }}>
              <Text style={textStyle}>Amendment reason</Text>
              <ThemedInput accessibilityLabel="Amendment reason" value={reason} editable={ready}
                onChangeText={value => setReasonDraft({ revision: encounter.revision, value })} />
              <EmrButton label="Start amendment" variant="outline" disabled={!ready || !reason.trim()}
                onPress={() => controller.dispatch({ type: 'amendRequested', reason })} />
            </View>
          ) : null}
          {encounter.signedRevisions?.length ? (
            <View style={{ gap: 8 }}>
              <Text role="heading" style={textStyle}>Signed revisions</Text>
              {encounter.signedRevisions.map(revision => (
                <View key={revision.revision} nativeID={`glaucoma-signed-revision-${revision.revision}`} style={{ gap: 4 }}>
                  <Text role="heading" style={textStyle}>Signed revision {revision.revision}</Text>
                  {revision.amendment ? (
                    <Text style={textStyle}>Amendment of signed revision {revision.amendment.baseRevision}. Reason: {revision.amendment.reason}</Text>
                  ) : null}
                  <Text style={textStyle}>OD examination: {revision.examination.od}</Text>
                  <Text style={textStyle}>OS examination: {revision.examination.os}</Text>
                  <Text style={textStyle}>Follow-up: {revision.followUp}</Text>
                  {revision.results.map(result => (
                    <View key={result.id}>
                      <Text style={textStyle}>
                        {result.report.title}{result.revision !== undefined ? ` · Report revision ${result.revision}` : ''}
                        {result.acknowledged ? ' · Acknowledged at signing' : ' · Awaiting acknowledgement at signing'}
                      </Text>
                      {result.report.metrics.map(metric => (
                        <Text key={metric.id} style={textStyle}>{metric.label}: {metric.valueLabel}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
