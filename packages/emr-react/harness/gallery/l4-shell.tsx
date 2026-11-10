'use client';

import { useState } from 'react';
import { View } from 'react-native';
import type { AttestationViewModel, CaptureStatusBarViewModel, PatientBannerViewModel } from '@drguptavivek/emr-controller';
import { EmrAttestation, EmrButton, EmrCaptureStatusBar, EmrOptionChip, EmrPatientBanner, EmrRow, EmrSheet } from '../../src';
import type { GallerySection } from './types';

const patient: PatientBannerViewModel = {
  patientId: 'TP-0001',
  displayName: 'Test Patient A',
  identifiers: [{ label: 'Health ID', value: '00-0000-0000-0001' }],
  ageLabel: '54 y',
  sexLabel: 'Female',
  careSetting: 'ipd',
  careSettingLabel: 'Inpatient',
  locationLabel: 'Ward 3',
  encounterLabel: 'Encounter 0001',
  criticality: { label: 'Critical', tone: 'danger' },
  allergies: [
    {
      id: 'a1',
      label: 'Penicillin',
      tone: 'danger',
      reactionLabel: 'Anaphylaxis / Laryngeal Oedema',
      detail: 'Strict beta-lactam avoidance. Cross-reactivity flagged in prescribing table.',
      provenanceLabel: 'Verified by Dr. S. Iyer · Immunization & Allergy Registry',
      recordedAtLabel: '14 Mar 2024',
    },
    {
      id: 'a2',
      label: 'Latex',
      tone: 'warning',
      reactionLabel: 'Contact Urticaria',
      detail: 'Use nitrile gloves for all ophthalmic & surgical procedures.',
      provenanceLabel: 'Verified by Operating Theatre Nursing',
      recordedAtLabel: '02 Aug 2025',
    },
    { id: 'a3', label: 'Peanut', tone: 'warning', reactionLabel: 'Bronchospasm' },
  ],
  allergyStatus: { label: 'Allergies recorded', tone: 'warning' },
  allergyChipPrefix: 'Allergy:',
  allergyOverflow: { label: '+1 allergies', tone: 'warning' },
  chronicDiseases: [{ id: 'c1', label: 'Type 2 diabetes', tone: 'info' }],
  alerts: [{ id: 'f1', label: 'Fall risk', tone: 'warning' }],
  vitals: [
    {
      id: 'v-iop-od',
      label: 'IOP OD (GAT)',
      valueLabel: '14',
      unit: 'mmHg',
      deltaLabel: 'Δ -4',
      tone: 'success',
      trendPoints: [22, 19, 18, 16, 14],
      provenanceLabel: 'Goldmann Applanation · Today 09:42 · CCT 542 µm',
    },
    {
      id: 'v-iop-os',
      label: 'IOP OS (GAT)',
      valueLabel: '15',
      unit: 'mmHg',
      deltaLabel: 'Δ -2',
      tone: 'success',
      trendPoints: [20, 18, 17, 16, 15],
      provenanceLabel: 'Goldmann Applanation · Today 09:42 · CCT 545 µm',
    },
    {
      id: 'v-va',
      label: 'BCVA OD / OS',
      valueLabel: '6/6 · 6/9',
      tone: 'info',
      trendPoints: [6, 7, 8, 9, 10],
      provenanceLabel: 'ETDRS 4m LogMAR Chart · Today 09:30',
    },
    {
      id: 'v-bp',
      label: 'BP',
      valueLabel: '128/78',
      unit: 'mmHg',
      deltaLabel: 'WNL',
      tone: 'neutral',
      trendPoints: [138, 134, 130, 128],
      provenanceLabel: 'Automated Oscillometric · Today 09:15',
    },
    {
      id: 'v-hba1c',
      label: 'HbA1c',
      valueLabel: '6.8',
      unit: '%',
      deltaLabel: '↓ -0.4%',
      tone: 'info',
      trendPoints: [7.8, 7.4, 7.2, 6.8],
      provenanceLabel: 'Central Lab HPLC · 04 Nov 2026',
    },
  ],
  activeInspectId: 'a1',
  layoutMode: 'banner',
  expanded: false,
  bedLabel: 'Bed 12',
  wardLabel: 'Ward 3',
  lengthOfStayLabel: 'Day 4',
  codeStatus: { label: 'Full code', tone: 'neutral' },
  weightLabel: '62 kg',
};

const signatory = (id: string, name: string, signed: boolean) => ({
  id, displayName: name, roleLabel: 'Nurse',
  status: { label: signed ? 'Signed' : 'Awaiting signature', tone: signed ? 'success' : 'warning' } as const,
  signedAtLabel: signed ? '10 Oct 2026 09:14' : undefined,
});

function Banner({ compact }: { compact?: boolean }) {
  const [m, setM] = useState(patient);
  return (
    <View style={{ gap: 10 }}>
      {!compact ? (
        <EmrRow>
          <EmrOptionChip
            label="Cerner Horizontal Banner"
            selected={m.layoutMode === 'banner'}
            onPress={() => setM({ ...m, layoutMode: 'banner' })}
          />
          <EmrOptionChip
            label="Epic Left-Rail Storyboard"
            selected={m.layoutMode === 'storyboard'}
            onPress={() => setM({ ...m, layoutMode: 'storyboard' })}
          />
          <EmrOptionChip
            label="Compact Sticky Header"
            selected={m.layoutMode === 'compact'}
            onPress={() => setM({ ...m, layoutMode: 'compact' })}
          />
        </EmrRow>
      ) : null}
      <EmrPatientBanner
        model={m}
        compact={compact}
        onIntent={(i) => {
          if (i.type === 'expandedChangeRequested') setM({ ...m, expanded: i.expanded });
          else if (i.type === 'alertInspectRequested') setM({ ...m, activeInspectId: i.alertId });
          else if (i.type === 'layoutModeChangeRequested') setM({ ...m, layoutMode: i.layoutMode });
        }}
      />
    </View>
  );
}

function StatusBar() {
  const [m, setM] = useState<CaptureStatusBarViewModel>({
    session: { dirty: true, saving: false, savedAt: null, conflict: null, error: null },
    attributionLabel: 'Recorded by Test Clinician, 10 Oct 2026 09:14',
    signature: { status: { label: 'Unsigned', tone: 'warning' }, signatories: [signatory('s1', 'Test Nurse B', false)], canSign: true, canAmend: false },
    connection: { label: 'Offline', tone: 'warning' },
    outbox: { count: 3, label: '3 waiting to sync', tone: 'warning' },
    lastSync: '10 Oct 2026 08:50',
  });
  return (
    <EmrCaptureStatusBar
      model={m}
      onIntent={(i) => {
        if (i.type === 'saveRequested') setM({ ...m, savedAtLabel: '09:20', session: { ...m.session, dirty: false, savedAt: '2026-10-10T09:20:00Z', error: null } });
        else if (i.type === 'discardRequested') setM({ ...m, session: { ...m.session, dirty: false } });
        else if (i.type === 'conflictDetailRequested' || i.type === 'conflictResolutionRequested') setM({ ...m, session: { ...m.session, conflict: null } });
        else setM({ ...m, session: { ...m.session, error: 'Network unavailable' } });
      }}
    />
  );
}

function Attestation() {
  const [last, setLast] = useState('');
  const model: AttestationViewModel = {
    id: 'att1', title: 'Administered by', statement: 'I confirm the dose was given as charted.',
    signatories: [signatory('s1', 'Test Nurse B', true), signatory('s2', 'Test Nurse C', false)],
    canSign: true, canAmend: true,
  };
  return (
    <View style={{ gap: 8 }}>
      <EmrAttestation model={model} onIntent={(i) => setLast(i.type)} />
      {last ? <EmrCaptureStatusBar model={{ session: { dirty: false, saving: false, savedAt: null, conflict: null, error: null }, attributionLabel: `Last intent: ${last}` }} onIntent={() => {}} /> : null}
    </View>
  );
}

function Sheet() {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <EmrButton label="Open sheet" onPress={() => setOpen(true)} />
      <EmrSheet
        open={open}
        title="Discard changes?"
        onIntent={() => setOpen(false)}
        footer={<><EmrButton variant="outline" label="Cancel" onPress={() => setOpen(false)} /><EmrButton label="Discard" onPress={() => setOpen(false)} /></>}
      >
        <EmrAttestation model={{ id: 'a', statement: 'Unsaved changes for Test Patient A will be lost.', signatories: [], canSign: false }} onIntent={() => {}} />
      </EmrSheet>
    </View>
  );
}

export const gallery: GallerySection[] = [
  { id: 'patient-banner', title: 'EmrPatientBanner', render: () => <Banner /> },
  { id: 'patient-banner-compact', title: 'EmrPatientBanner compact', render: () => <Banner compact /> },
  { id: 'capture-status-bar', title: 'EmrCaptureStatusBar (with sync state)', render: () => <StatusBar /> },
  { id: 'attestation', title: 'EmrAttestation', render: () => <Attestation /> },
  { id: 'sheet', title: 'EmrSheet', render: () => <Sheet /> },
];
