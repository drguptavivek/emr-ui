'use client';

import { Image, Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import type {
  EmrPacsStudyEntry,
  EncounterSummaryPrintIntent,
  EncounterSummaryPrintViewModel,
  InpatientMarIntent,
  InpatientMarViewModel,
  PacsViewerIntent,
  PacsViewerViewModel,
  SpecialtyExamMatrixIntent,
  SpecialtyExamMatrixViewModel,
} from '@drguptavivek/emr-controller';
import { ThemedInput } from './inputs-core';
import { EmrBadgeView, EmrButton } from './primitives';
import { focusRing, fontFamily, fontWeight, useEmrTheme } from './theme';

export type {
  EncounterSummaryPrintIntent,
  EncounterSummaryPrintViewModel,
  InpatientMarIntent,
  InpatientMarViewModel,
  PacsViewerIntent,
  PacsViewerViewModel,
  SpecialtyExamMatrixIntent,
  SpecialtyExamMatrixViewModel,
};

type PressState = PressableStateCallbackType & { focused?: boolean };

// ===========================================================================
// 1. EmrPacsViewer — Multi-Viewport PACS / DICOMweb Compare Viewer
// ===========================================================================

/** Displays the host-rendered frame for the supplied study, or an unavailable state. */
function renderDicomViewport(study: EmrPacsStudyEntry) {
  return study.renderedFrameUrl ? (
    <Image source={{ uri: study.renderedFrameUrl }} accessibilityLabel={`${study.modality} ${study.accessionNumber}, slice ${study.currentSlice} of ${study.sliceCount}`} resizeMode="contain" style={{ width: '100%', height: 152 }} />
  ) : (
    <View style={{ height: 152, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#94a3b8' }}>Rendered frame unavailable</Text>
    </View>
  );
}

/**
 * L4. Multi-Viewport PACS / DICOMweb Diagnostic & Compare Viewer (`EmrPacsViewer`).
 * Displays host-rendered study frames and emits viewer and clinical-note intents.
 */
export function EmrPacsViewer({
  model: m,
  onIntent,
}: {
  model: PacsViewerViewModel;
  onIntent: (intent: PacsViewerIntent) => void;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);
  const activeStudy = m.studies.find((s) => s.id === m.activeStudyId);
  if (!activeStudy) return null;
  const compareStudy = m.studies.find((s) => s.id === m.compareStudyId && s.id !== activeStudy.id);
  const dispatch = (intent: PacsViewerIntent) => { if (!m.readOnly) onIntent(intent); };

  return (
    <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
      {/* Top PACS Header & Layout Switcher */}
      <View style={[styles.headerBar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <View style={[styles.tagBadge, { backgroundColor: t.primary }]}>
            <Text style={{ color: t.surface, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
              DICOMweb PACS
            </Text>
          </View>
          <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
            {m.title ?? 'Multi-Viewport PACS & Diagnostic Imaging Viewer'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              { id: '1-up', label: '▣ 1-Up Single' },
              { id: '2-up-od-os', label: '◫ 2-Up OD vs OS' },
              { id: '2-up-compare', label: '⇄ 2-Up Active vs Prior' },
            ] as const
          ).map((ly) => {
            const sel = m.layoutMode === ly.id;
            return (
              <Pressable
                disabled={m.readOnly}
                key={ly.id}
                role="button"
                aria-pressed={sel}
                onPress={() => dispatch({ type: 'layoutModeChanged', layoutMode: ly.id })}
                style={({ focused }: PressState) => [
                  styles.chipBtn,
                  {
                    borderColor: sel ? t.primary : t.border,
                    backgroundColor: sel ? t.primarySoft : t.surface,
                  },
                  focusRing(t, focused),
                ]}
              >
                <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  {ly.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            disabled={m.readOnly}
            role="button"
            aria-pressed={m.syncScroll}
            onPress={() => dispatch({ type: 'syncScrollToggled' })}
            style={({ focused }: PressState) => [
              styles.chipBtn,
              {
                borderColor: m.syncScroll ? t.info : t.border,
                backgroundColor: m.syncScroll ? t.infoSoft : t.surface,
              },
              focusRing(t, focused),
            ]}
          >
            <Text style={{ color: m.syncScroll ? t.info : t.textMuted, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
              {m.syncScroll ? '✓ Sync Scroll' : 'Sync Scroll'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ padding: 12, gap: 10 }}>
        {/* Modality & Study Selector Bar */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {m.studies.map((st) => {
              const sel = st.id === activeStudy.id;
              return (
                <Pressable
                  disabled={m.readOnly}
                  key={st.id}
                  role="button"
                  aria-pressed={sel}
                  onPress={() => dispatch({ type: 'studySelected', studyId: st.id })}
                  style={({ focused }: PressState) => [
                    styles.chipBtn,
                    {
                      borderColor: sel ? t.primary : t.border,
                      backgroundColor: sel ? t.primarySoft : t.surfaceSoft,
                    },
                    focusRing(t, focused),
                  ]}
                >
                  <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                    [{st.modality}] {st.bodyPart} ({st.dateLabel.split(' ')[0]})
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10 }}>
            {activeStudy.pacsEndpointLabel}
          </Text>
        </View>

        {/* Viewport Grid (1-Up or 2-Up Split) */}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {/* Primary Viewport */}
          <View style={{ flex: 1, minWidth: 260, backgroundColor: activeStudy.inverted ? '#f4f7f9' : '#09111a', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: t.border, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
              <Text style={{ color: '#38bdf8', fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                {`ACTIVE · [${activeStudy.modality}] ${activeStudy.accessionNumber} · ${activeStudy.dateLabel}`}
              </Text>
              <Text style={{ color: '#94a3b8', fontFamily: t.fontMono, fontSize: 11 }}>
                Slice {activeStudy.currentSlice}/{activeStudy.sliceCount} · {activeStudy.windowPreset} · {activeStudy.zoomPercent}%
              </Text>
            </View>
            {renderDicomViewport(activeStudy)}
            {activeStudy.caliperMeasurementLabel ? (
              <Text style={{ color: '#f59e0b', fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                Caliper: {activeStudy.caliperMeasurementLabel}
              </Text>
            ) : null}
          </View>

          {m.layoutMode !== '1-up' ? (
            <View style={{ flex: 1, minWidth: 260, backgroundColor: '#09111a', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: t.border, gap: 6 }}>
              {compareStudy ? (
                <>
                  <Text style={{ color: '#22c55e', fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                    {`COMPARE · [${compareStudy.modality}] ${compareStudy.accessionNumber} · ${compareStudy.dateLabel}`}
                  </Text>
                  <Text style={{ color: '#94a3b8', fontFamily: t.fontMono, fontSize: 11 }}>
                    Slice {compareStudy.currentSlice}/{compareStudy.sliceCount} · {compareStudy.windowPreset} · {compareStudy.zoomPercent}%
                  </Text>
                  {renderDicomViewport(compareStudy)}
                </>
              ) : <Text style={{ color: '#94a3b8' }}>Comparison study unavailable</Text>}
            </View>
          ) : null}
        </View>

        {/* PACS Interactive Controls (Slice Scrubber, W/L Presets, Zoom, Invert, Key-Image Pin) */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 8, backgroundColor: t.surfaceSoft, borderWidth: 1, borderColor: t.border }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Pressable
              disabled={m.readOnly}
              role="button"
              aria-label="Previous DICOM slice"
              onPress={() => dispatch({ type: 'sliceStepped', studyId: activeStudy.id, delta: -1 })}
              style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>− Slice</Text>
            </Pressable>
            <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
              {activeStudy.currentSlice}/{activeStudy.sliceCount}
            </Text>
            <Pressable
              disabled={m.readOnly}
              role="button"
              aria-label="Next DICOM slice"
              onPress={() => dispatch({ type: 'sliceStepped', studyId: activeStudy.id, delta: 1 })}
              style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>+ Slice</Text>
            </Pressable>

            {(['Retina/OCT', 'High-Contrast', 'Brain/Orbit', 'Bone'] as const).map((preset) => (
              <Pressable
                disabled={m.readOnly}
                key={preset}
                role="button"
                aria-pressed={activeStudy.windowPreset === preset}
                onPress={() => dispatch({ type: 'windowPresetChanged', studyId: activeStudy.id, preset })}
                style={[
                  styles.chipBtn,
                  {
                    borderColor: activeStudy.windowPreset === preset ? t.primary : t.border,
                    backgroundColor: activeStudy.windowPreset === preset ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text style={{ color: activeStudy.windowPreset === preset ? t.primaryContrast : t.textMuted, fontFamily: t.fontMono, fontSize: 10 }}>
                  W/L: {preset}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Pressable
              disabled={m.readOnly}
              role="button"
              onPress={() =>
                dispatch({
                  type: 'zoomChanged',
                  studyId: activeStudy.id,
                  zoomPercent: activeStudy.zoomPercent >= 200 ? 100 : activeStudy.zoomPercent + 50,
                })
              }
              style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 10 }}>Zoom {activeStudy.zoomPercent}%</Text>
            </Pressable>
            <Pressable
              disabled={m.readOnly}
              role="button"
              aria-pressed={!!activeStudy.inverted}
              onPress={() => dispatch({ type: 'invertToggled', studyId: activeStudy.id })}
              style={[
                styles.chipBtn,
                {
                  borderColor: activeStudy.inverted ? t.primary : t.border,
                  backgroundColor: activeStudy.inverted ? t.primarySoft : t.surface,
                },
              ]}
            >
              <Text style={{ color: activeStudy.inverted ? t.primaryContrast : t.text, fontFamily: t.fontMono, fontSize: 10 }}>
                Invert LUT
              </Text>
            </Pressable>
            <Pressable
              disabled={m.readOnly}
              role="button"
              onPress={() =>
                dispatch({
                  type: 'keyImagePinned',
                  studyId: activeStudy.id,
                  slice: activeStudy.currentSlice,
                  label: `${activeStudy.modality} Slice ${activeStudy.currentSlice} (${activeStudy.caliperMeasurementLabel ?? ''})`,
                })
              }
              style={[styles.chipBtn, { borderColor: t.warning, backgroundColor: t.warningSoft }]}
            >
              <Text style={{ color: t.warning, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                ☆ Pin Key Image
              </Text>
            </Pressable>
            <Pressable
              disabled={m.readOnly}
              role="button"
              onPress={() =>
                dispatch({
                  type: 'impressionPulledToNote',
                  studyId: activeStudy.id,
                  text: `[PACS ${activeStudy.modality} ${activeStudy.accessionNumber}]: ${activeStudy.radiologistImpression}`,
                })
              }
              style={[styles.chipBtn, { borderColor: t.primary, backgroundColor: t.primarySoft }]}
            >
              <Text style={{ color: t.primaryContrast, fontFamily: ff, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                ↳ Pull Impression to Note
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Pinned Key Images & Radiologist Impression */}
        {m.pinnedKeyImages && m.pinnedKeyImages.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
              PINNED KEY IMAGES:
            </Text>
            {m.pinnedKeyImages.map((pin) => (
              <EmrBadgeView key={pin.id} badge={{ label: `☆ ${pin.label}`, tone: 'warning' }} />
            ))}
          </View>
        ) : null}

        <View style={{ padding: 8, borderRadius: 6, backgroundColor: t.surfaceSoft, borderWidth: 1, borderColor: t.border }}>
          <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
            RADIOLOGIST / READING CENTRE IMPRESSION ({activeStudy.status.toUpperCase()}):
          </Text>
          <Text style={{ color: t.text, fontFamily: ff, fontSize: 12, marginTop: 2 }}>
            {activeStudy.radiologistImpression}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ===========================================================================
// 2. EmrSpecialtyExamMatrix — Ophthalmology, Pediatrics, Dermatology, Oncology
// ===========================================================================

/**
 * L4. Multi-Specialty Clinical Examination & Dosing Calculator Matrix (`EmrSpecialtyExamMatrix`).
 * Supports Ophthalmology bilateral (OD/OS) Anterior/Posterior segment matrix with WNL & Copy OD→OS,
 * Pediatrics weight-based (`mg/kg`) suspension volume calculator, Dermatology FTU & BSA% body calculator,
 * and Oncology Mosteller BSA (`mg/m²`) chemo cycle calculator with ANC/Platelet safety gate.
 */
export function EmrSpecialtyExamMatrix({
  model: m,
  onIntent,
}: {
  model: SpecialtyExamMatrixViewModel;
  onIntent: (intent: SpecialtyExamMatrixIntent) => void;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);

  return (
    <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
      <View style={[styles.headerBar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <View style={[styles.tagBadge, { backgroundColor: t.info }]}>
            <Text style={{ color: t.surface, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
              SPECIALTY EXAM
            </Text>
          </View>
          <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
            {m.title ?? 'Multi-Specialty Structured Examination & Dosing Matrix'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              { id: 'ophthalmology', label: 'Ophthalmology (OD/OS Matrix)' },
              { id: 'pediatrics', label: 'Pediatrics (mg/kg & Growth)' },
              { id: 'dermatology', label: 'Dermatology (BSA% & FTU)' },
              { id: 'oncology', label: 'Oncology (BSA mg/m² Cycles)' },
            ] as const
          ).map((sp) => {
            const sel = m.activeSpecialty === sp.id;
            return (
              <Pressable
                key={sp.id}
                role="button"
                aria-pressed={sel}
                onPress={() => onIntent({ type: 'specialtyChanged', specialty: sp.id })}
                style={({ focused }: PressState) => [
                  styles.chipBtn,
                  {
                    borderColor: sel ? t.primary : t.border,
                    backgroundColor: sel ? t.primarySoft : t.surface,
                  },
                  focusRing(t, focused),
                ]}
              >
                <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  {sp.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ padding: 12, gap: 10 }}>
        {m.activeSpecialty === 'ophthalmology' ? (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 12 }}>
                Bilateral Slit-Lamp Biomicroscopy, Applanation Tonometry, Gonioscopy & Dilated Fundus Matrix
              </Text>
              {!m.readOnly ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    role="button"
                    onPress={() => onIntent({ type: 'ophthalmicApplyWnlAll' })}
                    style={[styles.chipBtn, { borderColor: t.success, backgroundColor: t.successSoft }]}
                  >
                    <Text style={{ color: t.success, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                      ✓ All WNL (OU)
                    </Text>
                  </Pressable>
                  <Pressable
                    role="button"
                    onPress={() => onIntent({ type: 'ophthalmicCopyOdToOs' })}
                    style={[styles.chipBtn, { borderColor: t.primary, backgroundColor: t.primarySoft }]}
                  >
                    <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                      ⇄ Copy All OD → OS
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* OD / OS Bilateral Table */}
            <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: 8, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', backgroundColor: t.surfaceRaised, paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: t.border }}>
                <Text style={{ width: 150, color: t.textMuted, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  OCULAR STRUCTURE
                </Text>
                <Text style={{ flex: 1, color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  RIGHT EYE (OD)
                </Text>
                <Text style={{ flex: 1, color: t.info, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  LEFT EYE (OS)
                </Text>
              </View>
              {m.ophthalmicRows.map((row, idx) => (
                <View
                  key={row.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    gap: 8,
                    borderBottomWidth: idx < m.ophthalmicRows.length - 1 ? 1 : 0,
                    borderColor: t.border,
                    backgroundColor: idx % 2 === 1 ? t.surfaceSoft : t.surface,
                  }}
                >
                  <View style={{ width: 150, gap: 2 }}>
                    <Text style={{ color: t.text, fontFamily: ff, fontSize: 12, fontWeight: fontWeight(t.weightBold) }}>
                      {row.structureLabel}
                    </Text>
                    <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10 }}>
                      {row.segment}
                    </Text>
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedInput
                      value={row.odValue}
                      editable={!m.readOnly}
                      accessibilityLabel={`${row.structureLabel} Right Eye OD`}
                      onChangeText={(val) => { if (!m.readOnly) onIntent({ type: 'ophthalmicCellChanged', rowId: row.id, eye: 'od', value: val }); }}
                      style={{ minHeight: 34, height: 34, fontSize: 12 }}
                    />
                    <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                      {row.quickChips.map((chip) => (
                        <Pressable
                          key={`od-${chip}`}
                          role="button"
                          disabled={m.readOnly}
                          onPress={() => { if (!m.readOnly) onIntent({ type: 'ophthalmicCellChanged', rowId: row.id, eye: 'od', value: chip }); }}
                          style={[styles.microChip, { borderColor: t.border, backgroundColor: t.surface }]}
                        >
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>+ {chip}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedInput
                      value={row.osValue}
                      editable={!m.readOnly}
                      accessibilityLabel={`${row.structureLabel} Left Eye OS`}
                      onChangeText={(val) => { if (!m.readOnly) onIntent({ type: 'ophthalmicCellChanged', rowId: row.id, eye: 'os', value: val }); }}
                      style={{ minHeight: 34, height: 34, fontSize: 12 }}
                    />
                    <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                      {row.quickChips.map((chip) => (
                        <Pressable
                          key={`os-${chip}`}
                          role="button"
                          disabled={m.readOnly}
                          onPress={() => { if (!m.readOnly) onIntent({ type: 'ophthalmicCellChanged', rowId: row.id, eye: 'os', value: chip }); }}
                          style={[styles.microChip, { borderColor: t.border, backgroundColor: t.surface }]}
                        >
                          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>+ {chip}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {m.activeSpecialty === 'pediatrics' ? (
          <View style={{ gap: 10, padding: 10, borderRadius: 8, backgroundColor: t.surfaceSoft, borderWidth: 1, borderColor: t.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <View>
                <Text style={{ color: t.text, fontFamily: ff, fontSize: 13, fontWeight: fontWeight(t.weightBold) }}>
                  Pediatric Anthropometry & Weight-Based Suspension Dosing Calculator
                </Text>
                <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11 }}>
                  Weight: {m.pediatrics.weightKg} kg ({m.pediatrics.weightCentileLabel}) · Height: {m.pediatrics.heightCm} cm ({m.pediatrics.heightCentileLabel}){m.pediatrics.bsaM2 ? ` · BSA: ${m.pediatrics.bsaM2} m²` : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Pressable
                  role="button"
                  disabled={m.readOnly || !Number.isFinite(m.pediatrics.weightKg - 1) || m.pediatrics.weightKg - 1 <= 0}
                  onPress={() => { const weightKg = m.pediatrics.weightKg - 1; if (!m.readOnly && m.activeSpecialty === 'pediatrics' && Number.isFinite(weightKg) && weightKg > 0) onIntent({ type: 'pediatricWeightChanged', weightKg }); }}
                  style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
                >
                  <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>− 1 kg</Text>
                </Pressable>
                <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 13, fontWeight: fontWeight(t.weightBold) }}>
                  {m.pediatrics.weightKg} kg
                </Text>
                <Pressable
                  role="button"
                  disabled={m.readOnly || !Number.isFinite(m.pediatrics.weightKg + 1) || m.pediatrics.weightKg + 1 <= 0}
                  onPress={() => { const weightKg = m.pediatrics.weightKg + 1; if (!m.readOnly && m.activeSpecialty === 'pediatrics' && Number.isFinite(weightKg) && weightKg > 0) onIntent({ type: 'pediatricWeightChanged', weightKg }); }}
                  style={[styles.chipBtn, { borderColor: t.border, backgroundColor: t.surface }]}
                >
                  <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>+ 1 kg</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ padding: 10, borderRadius: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.primaryBorder, gap: 4 }}>
              <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                TARGET DRUG: {m.pediatrics.targetDrugLabel} ({m.pediatrics.concentrationMgPer5Ml} mg / 5 mL) · Basis: {m.pediatrics.mgPerKgPerDose} mg/kg/dose
              </Text>
              <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 14, fontWeight: fontWeight(t.weightBold) }}>
                Calculated Per-Administration Dose: {m.pediatrics.calculatedMgPerDose} mg = {m.pediatrics.calculatedMlPerDose} mL via Oral Syringe
              </Text>
              <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11 }}>
                Safety Ceiling: {m.pediatrics.maxDailyMgLabel}
              </Text>
            </View>
          </View>
        ) : null}

        {m.activeSpecialty === 'dermatology' ? (
          <View style={{ gap: 10, padding: 10, borderRadius: 8, backgroundColor: t.surfaceSoft, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.text, fontFamily: ff, fontSize: 13, fontWeight: fontWeight(t.weightBold) }}>
              Dermatology Lesion Morphology & Fingertip Unit (FTU) Body Map
            </Text>
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 12 }}>
              Morphology: {m.dermatology.morphologyLabel}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {m.dermatology.regions.map((reg) => (
                <Pressable
                  key={reg.id}
                  role="button"
                  aria-pressed={reg.active}
                  disabled={m.readOnly}
                  onPress={() => { if (!m.readOnly && m.activeSpecialty === 'dermatology' && m.dermatology.regions.some((region) => region.id === reg.id)) onIntent({ type: 'dermRegionToggled', regionId: reg.id }); }}
                  style={[
                    styles.chipBtn,
                    {
                      borderColor: reg.active ? t.primary : t.border,
                      backgroundColor: reg.active ? t.primarySoft : t.surface,
                    },
                  ]}
                >
                  <Text style={{ color: reg.active ? t.primaryContrast : t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                    {reg.active ? '✓ ' : ''}{reg.regionLabel} ({reg.bsaPercent}% BSA · {reg.ftuPerDose} FTU)
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ padding: 10, borderRadius: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.primaryBorder }}>
              <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 12, fontWeight: fontWeight(t.weightBold) }}>
                Affected BSA: {m.dermatology.totalBsaPercent}% · Single Application: {m.dermatology.totalFtuPerApp} FTU{m.dermatology.totalGramsPerApp != null ? ` (${m.dermatology.totalGramsPerApp} g)` : ''} · 14-Day BD Course Estimate: {m.dermatology.totalGramsFor14DaysBd} g
              </Text>
            </View>
          </View>
        ) : null}

        {m.activeSpecialty === 'oncology' ? (
          <View style={{ gap: 10, padding: 10, borderRadius: 8, backgroundColor: t.surfaceSoft, borderWidth: 1, borderColor: t.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <View>
                <Text style={{ color: t.text, fontFamily: ff, fontSize: 13, fontWeight: fontWeight(t.weightBold) }}>
                  {m.oncology.regimenName} · Cycle {m.oncology.cycleNumber} ({m.oncology.cycleDayLabel})
                </Text>
                <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11 }}>
                  Mosteller BSA: {m.oncology.bsaM2} m² · ECOG: {m.oncology.ecogScore} · ANC: {m.oncology.ancCountLabel} · Platelets: {m.oncology.plateletCountLabel}
                </Text>
              </View>
              {m.oncology.safetyGateBadge ? <EmrBadgeView badge={m.oncology.safetyGateBadge} /> : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11 }}>Dose Level:</Text>
              {([100, 80, 75, 50] as const).map((pct) => (
                <Pressable
                  key={pct}
                  role="button"
                  aria-pressed={m.oncology.doseReductionPercent === pct}
                  disabled={m.readOnly}
                  onPress={() => { if (!m.readOnly && m.activeSpecialty === 'oncology') onIntent({ type: 'oncologyDoseReductionChanged', percent: pct }); }}
                  style={[
                    styles.chipBtn,
                    {
                      borderColor: m.oncology.doseReductionPercent === pct ? t.primary : t.border,
                      backgroundColor: m.oncology.doseReductionPercent === pct ? t.primarySoft : t.surface,
                    },
                  ]}
                >
                  <Text style={{ color: m.oncology.doseReductionPercent === pct ? t.primaryContrast : t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                    {pct}% {pct === 100 ? '(Full Dose)' : 'Reduction'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {m.oncology.agents.map((ag) => (
              <View key={ag.id} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderRadius: 6, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.text, fontFamily: ff, fontSize: 12, fontWeight: fontWeight(t.weightBold) }}>
                  {ag.drugName} <Text style={{ color: t.textMuted, fontFamily: t.fontMono }}>({ag.standardMgPerM2} mg/m² · {ag.routeLabel})</Text>
                </Text>
                <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 12, fontWeight: fontWeight(t.weightBold) }}>
                  Final Dose ({m.oncology.doseReductionPercent}%): {ag.calculatedDoseMg} mg
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ===========================================================================
// 3. EmrInpatientMar — Inpatient eMAR & Nursing Kardex Grid
// ===========================================================================

/**
 * L4. Inpatient Electronic Medication Administration Record (`EmrInpatientMar`).
 * Links the 7-column prescription orders (including Backend API `formLabel`, `formularyCode`,
 * and `↘ Step-Down` / `↗ Step-Up` titration phases) to scheduled nursing administration slots
 * (`08:00`, `14:00`, `18:00`, `22:00`) with Barcode Medication Administration (BCMA) and Dual-Sign checks.
 */
export function EmrInpatientMar({
  model: m,
  onIntent,
}: {
  model: InpatientMarViewModel;
  onIntent: (intent: InpatientMarIntent) => void;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);

  return (
    <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
      <View style={[styles.headerBar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <View style={[styles.tagBadge, { backgroundColor: t.success }]}>
            <Text style={{ color: t.surface, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
              INPATIENT eMAR
            </Text>
          </View>
          <View>
            <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textMd, fontWeight: fontWeight(t.weightBold) }}>
              {m.title ?? 'Inpatient Electronic Medication Administration Record (eMAR)'}
            </Text>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs }}>
              {m.wardBedLabel} · {m.shiftLabel} · Primary Nurse: {m.nurseLabel}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 860, width: '100%' }}>
          {/* eMAR Column Header */}
          <View style={{ flexDirection: 'row', backgroundColor: t.surfaceRaised, borderBottomWidth: 1, borderColor: t.border, paddingVertical: 8, paddingHorizontal: 10 }}>
            <Text style={{ flex: 1.6, minWidth: 240, color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
              ORDERED MEDICATION (FORM & ROUTE)
            </Text>
            {m.timeColumns.map((col) => (
              <View key={col.id} style={{ width: 145, alignItems: 'center' }}>
                <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  {col.timeLabel}
                </Text>
                <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 10 }}>
                  {col.slotLabel}
                </Text>
              </View>
            ))}
          </View>

          {/* eMAR Order Rows */}
          {m.orders.map((ord, idx) => (
            <View
              key={ord.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 10,
                borderBottomWidth: idx < m.orders.length - 1 ? 1 : 0,
                borderColor: t.border,
                backgroundColor: ord.stepPhase ? t.surfaceRaised : idx % 2 === 1 ? t.surfaceSoft : t.surface,
              }}
            >
              <View style={{ flex: 1.6, minWidth: 240, gap: 3, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {ord.stepLabel ? (
                    <EmrBadgeView badge={{ label: ord.stepLabel, tone: ord.stepPhase === 'step-down' ? 'warning' : 'info' }} />
                  ) : null}
                  {ord.highAlert ? (
                    <EmrBadgeView badge={{ label: 'HIGH-ALERT · DUAL SIGN', tone: 'danger' }} />
                  ) : null}
                </View>
                <Text style={{ color: t.text, fontFamily: ff, fontSize: 13, fontWeight: fontWeight(t.weightBold) }}>
                  {ord.drugName} <Text style={{ color: t.textMuted, fontFamily: t.fontMono }}>{ord.strength}</Text>
                </Text>
                <Text style={{ color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  Dose: {ord.doseLabel} · {ord.frequencyCode} · {ord.routeLabel}{ord.siteLabel ? ` (${ord.siteLabel})` : ''}
                </Text>
                <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs }}>
                  Form: {ord.formLabel}{ord.formularyCode ? ` · ${ord.formularyCode}` : ''}
                </Text>
                {ord.highAlert ? (
                  <Pressable
                    role="button"
                    disabled={m.readOnly}
                    onPress={() => { if (!m.readOnly) onIntent({ type: 'dualSignVerified', orderId: ord.id }); }}
                    style={[
                      styles.microChip,
                      {
                        alignSelf: 'flex-start',
                        borderColor: ord.dualSignVerified ? t.success : t.danger,
                        backgroundColor: ord.dualSignVerified ? t.successSoft : t.dangerSoft,
                      },
                    ]}
                  >
                    <Text style={{ color: ord.dualSignVerified ? t.success : t.danger, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
                      {ord.dualSignVerified ? '✓ 2-RN Co-Signed' : '! Require 2nd RN Co-Sign'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {m.timeColumns.map((col) => {
                const adm = ord.administrations.find((a) => a.slotId === col.id);
                const status = adm?.status ?? 'not-due';
                const statusTone =
                  status === 'given'
                    ? t.success
                    : status === 'due'
                      ? t.warning
                      : status === 'held' || status === 'refused'
                        ? t.danger
                        : t.border;
                const statusBg =
                  status === 'given'
                    ? t.successSoft
                    : status === 'due'
                      ? t.warningSoft
                      : status === 'held' || status === 'refused'
                        ? t.dangerSoft
                        : t.surfaceSoft;
                const statusLabel =
                  status === 'given'
                    ? '✓ GIVEN'
                    : status === 'due'
                      ? '◷ DUE NOW'
                      : status === 'held'
                        ? '⏸ HELD'
                        : status === 'refused'
                          ? '✕ REFUSED'
                          : '—';

                return (
                  <View key={col.id} style={{ width: 145, paddingHorizontal: 4 }}>
                    <Pressable
                      role="button"
                      disabled={m.readOnly || status === 'not-due'}
                      aria-label={`${ord.drugName} ${col.timeLabel} status ${statusLabel}`}
                      onPress={() => onIntent({ type: 'slotStatusCycled', orderId: ord.id, slotId: col.id })}
                      style={({ focused }: PressState) => [
                        {
                          padding: 6,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: statusTone,
                          backgroundColor: statusBg,
                          alignItems: 'center',
                          gap: 2,
                        },
                        focusRing(t, focused),
                      ]}
                    >
                      <Text style={{ color: status === 'not-due' ? t.textMuted : statusTone, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                        {statusLabel}
                      </Text>
                      {adm?.administeredAtLabel ? (
                        <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 9 }}>
                          {adm.administeredAtLabel} {adm.bcmaScanned ? '· [BCMA]' : ''}
                        </Text>
                      ) : null}
                      {adm?.holdReason ? (
                        <Text style={{ color: t.danger, fontFamily: ff, fontSize: 9 }}>
                          {adm.holdReason}
                        </Text>
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ===========================================================================
// 4. EmrEncounterSummaryPrint — Print-Ready OPD Rx & IPD Discharge Summary
// ===========================================================================

/**
 * L4. Print-Ready (`.emr-print`) OPD Prescription & IPD Discharge Summary Surface (`EmrEncounterSummaryPrint`).
 * Compiles Patient Identity, Allergies, Diagnoses, Classical History, Examination, PACS Key Findings,
 * 7-Column Rx Table (with Tab/Cap-only Dispense Totals & Step-Down/Step-Up phases), Investigations,
 * Treatment Advises, and Cross-Consultations into a clinical printout.
 */
export function EmrEncounterSummaryPrint({
  model: m,
  onIntent,
}: {
  model: EncounterSummaryPrintViewModel;
  onIntent: (intent: EncounterSummaryPrintIntent) => void;
}) {
  const t = useEmrTheme();
  const ff = fontFamily(t);

  return (
    <View style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}>
      {/* Action Header */}
      <View style={[styles.headerBar, { borderBottomColor: t.border, backgroundColor: t.surfaceSoft }]}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              { id: 'opd-rx', label: 'OPD Prescription & Case Summary' },
              { id: 'ipd-discharge', label: 'IPD Discharge Summary & Course' },
            ] as const
          ).map((dm) => {
            const sel = m.documentMode === dm.id;
            return (
              <Pressable
                key={dm.id}
                role="button"
                aria-pressed={sel}
                onPress={() => onIntent({ type: 'documentModeChanged', mode: dm.id })}
                style={[
                  styles.chipBtn,
                  {
                    borderColor: sel ? t.primary : t.border,
                    backgroundColor: sel ? t.primarySoft : t.surface,
                  },
                ]}
              >
                <Text style={{ color: sel ? t.primaryContrast : t.text, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
                  {dm.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <EmrButton
          label="Print / Export PDF (.emr-print)"
          variant="primary"
          onPress={() => onIntent({ type: 'printTriggered' })}
        />
      </View>

      {/* Printable Clinical Sheet */}
      <View style={{ padding: 16, gap: 12 }}>
        {/* Hospital Letterhead */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', borderBottomWidth: 2, borderColor: t.primary, paddingBottom: 10 }}>
          <View>
            <Text style={{ color: t.text, fontFamily: ff, fontSize: t.textLg, fontWeight: fontWeight(t.weightBold) }}>
              {m.facilityName}
            </Text>
            <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 12 }}>
              {m.facilityDepartment} · {m.documentMode === 'opd-rx' ? 'OUTPATIENT PRESCRIPTION & CLINICAL RECORD' : 'INPATIENT DISCHARGE SUMMARY'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
              Date: {m.encounterDateLabel}
            </Text>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11 }}>
              Encounter: {m.encounterId} · {m.careSettingLabel}
            </Text>
          </View>
        </View>

        {/* Patient Demographics & Safety Strip */}
        <View style={{ padding: 10, borderRadius: 6, backgroundColor: t.surfaceSoft, borderWidth: 1, borderColor: t.border, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <Text style={{ color: t.text, fontFamily: ff, fontSize: 13, fontWeight: fontWeight(t.weightBold) }}>
              Patient: {m.patientName} ({m.patientAgeSex})
            </Text>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11 }}>
              {m.patientIdentifiers.map((id) => `${id.label}: ${id.value}`).join(' · ')}
            </Text>
          </View>
          <Text style={{ color: t.danger, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
            Key Drug Allergies: {m.allergiesSummary.join(' | ') || 'NKDA'}
          </Text>
          <Text style={{ color: t.textMuted, fontFamily: ff, fontSize: 11 }}>
            Chronic Conditions: {m.chronicConditionsSummary.join(' · ')} · Vitals: {m.vitalsSummary.map((v) => `${v.label} ${v.value}`).join(' | ')}
          </Text>
        </View>

        {/* Diagnoses */}
        <View style={{ gap: 4 }}>
          <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
            FINAL & WORKING DIAGNOSES (ICD-10 / SNOMED-CT)
          </Text>
          {m.diagnoses.map((dx, i) => (
            <Text key={dx.id} style={{ color: t.text, fontFamily: ff, fontSize: 12 }}>
              {i + 1}. <Text style={{ fontFamily: t.fontMono, fontWeight: fontWeight(t.weightBold) }}>[{dx.code}]</Text> {dx.label} ({dx.status.toUpperCase()}{dx.laterality ? ` · ${dx.laterality}` : ''})
            </Text>
          ))}
        </View>

        {/* Clinical History, Exam & PACS Summary */}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 240, gap: 3 }}>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
              CLINICAL HISTORY SUMMARY
            </Text>
            {m.historySummary.map((h) => (
              <Text key={h.code} style={{ color: t.text, fontFamily: ff, fontSize: 11 }}>
                <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{h.code}:</Text> {h.value}
              </Text>
            ))}
          </View>
          <View style={{ flex: 1, minWidth: 240, gap: 3 }}>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
              EXAMINATION & PACS IMAGING FINDINGS
            </Text>
            {m.examinationSummary.map((ex) => (
              <Text key={ex.code} style={{ color: t.text, fontFamily: ff, fontSize: 11 }}>
                <Text style={{ fontWeight: fontWeight(t.weightBold) }}>{ex.code}:</Text> {ex.value}
              </Text>
            ))}
            {m.pacsKeyFindingsSummary.map((pf, i) => (
              <Text key={i} style={{ color: t.info, fontFamily: t.fontMono, fontSize: 11 }}>
                PACS: {pf}
              </Text>
            ))}
          </View>
        </View>

        {/* 7-Column Rx Table Printout */}
        <View style={{ gap: 4 }}>
          <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
            Rx — RECOMMENDED MEDICATION SCHEDULE (DISPENSE TOTALS CALCULATED FOR TABLETS & CAPSULES ONLY)
          </Text>
          <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: 6, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', backgroundColor: t.surfaceRaised, paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: t.border }}>
              <Text style={{ flex: 1.5, color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>1. DRUG & FORM</Text>
              <Text style={{ width: 85, color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>2. DOSE QTY</Text>
              <Text style={{ width: 120, color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>3. FREQ (M-A-E-N)</Text>
              <Text style={{ width: 95, color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>4. ROUTE/SITE</Text>
              <Text style={{ width: 115, color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>5. DURATION</Text>
              <Text style={{ flex: 1.2, color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>6. INSTRUCTIONS</Text>
            </View>
            {m.prescriptions.map((rx, idx) => (
              <View
                key={rx.id}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderBottomWidth: idx < m.prescriptions.length - 1 ? 1 : 0,
                  borderColor: t.border,
                }}
              >
                <View style={{ flex: 1.5 }}>
                  <Text style={{ color: t.text, fontFamily: ff, fontSize: t.text2xs, fontWeight: fontWeight(t.weightBold) }}>
                    {idx + 1}. {rx.drugName} {rx.strength} {rx.stepLabel ? `(${rx.stepLabel})` : ''}
                  </Text>
                  <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs }}>
                    Form: {rx.formLabel}{rx.formularyCode ? ` · ${rx.formularyCode}` : ''}
                  </Text>
                </View>
                <Text style={{ width: 85, color: t.text, fontFamily: t.fontMono, fontSize: 11 }}>{rx.doseQtyUnit}</Text>
                <Text style={{ width: 120, color: t.primaryContrast, fontFamily: t.fontMono, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>{rx.frequencyPattern}</Text>
                <Text style={{ width: 95, color: t.text, fontFamily: t.fontMono, fontSize: 10 }}>{rx.routeSite}</Text>
                <View style={{ width: 115 }}>
                  <Text style={{ color: t.text, fontFamily: t.fontMono, fontSize: 11 }}>{rx.durationLabel}</Text>
                  {rx.dispenseTotalLabel ? (
                    <Text style={{ color: t.success, fontFamily: t.fontMono, fontSize: 9, fontWeight: fontWeight(t.weightBold) }}>
                      {rx.dispenseTotalLabel}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ flex: 1.2, color: t.textMuted, fontFamily: ff, fontSize: 10 }}>{rx.instructions}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Treatment Advises, Investigations & Cross-Consults */}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 240, gap: 2 }}>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
              RECOMMENDED TREATMENT ADVISES & PRECAUTIONS
            </Text>
            {m.treatmentAdvises.map((adv, i) => (
              <Text key={i} style={{ color: t.text, fontFamily: ff, fontSize: 11 }}>
                • {adv}
              </Text>
            ))}
          </View>
          <View style={{ flex: 1, minWidth: 240, gap: 2 }}>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: 10, fontWeight: fontWeight(t.weightBold) }}>
              INVESTIGATIONS & CROSS-CONSULTATIONS
            </Text>
            {m.investigations.map((inv) => (
              <Text key={inv.id} style={{ color: t.text, fontFamily: ff, fontSize: 11 }}>
                • [{inv.priority}] {inv.name} ({inv.status})
              </Text>
            ))}
            {m.crossConsultations.map((con) => (
              <Text key={con.id} style={{ color: t.info, fontFamily: ff, fontSize: 11 }}>
                • Consult {con.targetSpecialty} ({con.targetConsultant}) — {con.status}
              </Text>
            ))}
          </View>
        </View>

        {/* Signature Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderColor: t.border, paddingTop: 10 }}>
          <Text style={{ color: t.text, fontFamily: ff, fontSize: 11, fontWeight: fontWeight(t.weightBold) }}>
            Follow-Up Schedule: {m.followUpDateLabel}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: t.text, fontFamily: ff, fontSize: 12, fontWeight: fontWeight(t.weightBold) }}>
              {m.prescriberName}
            </Text>
            <Text style={{ color: t.textMuted, fontFamily: t.fontMono, fontSize: t.text2xs }}>
              Reg. No: {m.prescriberRegNo} {m.signedAtLabel ? `· Signed ${m.signedAtLabel}` : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  microChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
});
