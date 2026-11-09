'use client';

import { StyleSheet, Text, View } from 'react-native';
import { EmrCard } from './l1-display';
import { EmrBadgeView, EmrButton, EmrRow } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';
import type { EmrUploadQueueLabels, EmrUploadQueueProps } from './upload-queue.types';

export type * from './upload-queue.types';

const DEFAULTS: EmrUploadQueueLabels = {
  dropHint: 'Select files from your device',
  browse: 'Choose files',
  queue: 'Queued files',
  empty: 'No files queued.',
  remove: 'Remove',
  retry: 'Retry',
  publish: 'Publish',
  progress: 'Upload progress',
  progressValue: '{percent}% uploaded',
  nativeUnavailable: '',
};

/**
 * React Native implementation of L4 EmrUploadQueue.
 * Renders the file-picker trigger, queued items with progress bars, retry/remove actions, and publish button.
 */
export function EmrUploadQueue({ model, onIntent, labels }: EmrUploadQueueProps) {
  const t = useEmrTheme();
  const l = { ...DEFAULTS, ...labels };
  const ff = fontFamily(t);

  return (
    <EmrCard label={model.label}>
      <View style={styles.root}>
        <View style={[styles.dropBox, { borderColor: t.border, backgroundColor: t.surfaceSoft }]}>
          <Text style={{ fontFamily: ff, fontSize: t.textSm, color: t.text }}>{l.dropHint}</Text>
          <EmrButton
            variant="outline"
            label={l.browse}
            onPress={() => onIntent?.({ type: 'filesPicked', files: [] })}
          />
          {model.acceptDescription ? (
            <Text style={{ fontFamily: ff, fontSize: t.textXs, color: t.textMuted }}>{model.acceptDescription}</Text>
          ) : null}
        </View>

        <View role="list" aria-label={l.queue} style={styles.list}>
          {model.items.length === 0 ? (
            <Text style={{ fontFamily: ff, fontSize: t.textSm, color: t.textMuted }}>{l.empty}</Text>
          ) : null}
          {model.items.map((item) => {
            const pct = item.progress === undefined ? undefined : Math.min(100, Math.max(0, item.progress));
            return (
              <View key={item.id} style={[styles.itemCard, { borderColor: t.border, backgroundColor: t.surface }]}>
                <EmrRow>
                  <Text style={{ fontFamily: ff, fontSize: t.textSm, fontWeight: fontWeight(t.weightBold), color: t.text, flex: 1 }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontFamily: ff, fontSize: t.textSm, color: t.textMuted }}>{item.sizeLabel}</Text>
                  <EmrBadgeView badge={item.status} />
                </EmrRow>
                {pct !== undefined ? (
                  <View
                    role="progressbar"
                    aria-label={`${l.progress}: ${item.name}`}
                    aria-valuetext={l.progressValue.replace('{percent}', String(Math.round(pct)))}
                    style={[styles.progressTrack, { backgroundColor: t.surfaceSoft, borderColor: t.border }]}
                  >
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: t.primary, borderRadius: 4 }} />
                  </View>
                ) : null}
                {item.error ? (
                  <Text role="alert" style={{ fontFamily: ff, fontSize: t.textSm, color: t.danger }}>
                    {item.error}
                  </Text>
                ) : null}
                <EmrRow>
                  {item.error ? (
                    <EmrButton
                      variant="outline"
                      small
                      label={l.retry}
                      onPress={() => onIntent?.({ type: 'retryRequested', id: item.id })}
                    />
                  ) : null}
                  <EmrButton
                    variant="ghost"
                    small
                    label={l.remove}
                    onPress={() => onIntent?.({ type: 'removeRequested', id: item.id })}
                  />
                </EmrRow>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <EmrButton
            label={l.publish}
            disabled={!model.canPublish}
            onPress={() => {
              if (model.canPublish) onIntent?.({ type: 'publishRequested' });
            }}
          />
        </View>
      </View>
    </EmrCard>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  dropBox: { alignItems: 'center', gap: 8, padding: 16, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed' },
  list: { gap: 8 },
  itemCard: { borderWidth: 1, borderRadius: 8, padding: 10, gap: 6 },
  progressTrack: { height: 8, borderRadius: 4, borderWidth: 1, overflow: 'hidden' },
  actions: { flexDirection: 'row' },
});
