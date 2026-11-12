'use client';

import { Text, View } from 'react-native';
import type {
  AccessLogViewModel,
  DraftRecordListIntent,
  DraftRecordRowView,
  LinkCardView,
  LinkCardsIntent,
  PatientListIntent,
  PatientListRow,
  PatientListViewModel,
  PrivacyCentreViewModel,
  QueueStation,
  RightsRequestsViewModel,
  SharingGrantView,
  SharingGrantsViewModel,
  TimelineEvent,
  TimelineKindDefinition,
  WorkQueueIntent,
} from '@drguptavivek/emr-controller';
import {
  EmrAccessLog,
  EmrArrivalLinker,
  EmrBarChart,
  EmrBookedNotDeliveredList,
  EmrButton,
  EmrCataractEpisodeCard,
  EmrConsentCapture,
  EmrConsentReceipt,
  EmrConsentReview,
  EmrConsentStatusBadge,
  EmrContactAttemptForm,
  EmrContactAttemptSummary,
  EmrDocumentUploadQueue,
  EmrDocumentViewer,
  EmrDraftRecordList,
  EmrFavouritesPanel,
  EmrFunnelChart,
  EmrHierarchyOrderPicker,
  EmrIdentifierCheckPrompt,
  EmrLinkCards,
  EmrLoginForm,
  EmrMergeCompare,
  EmrOrderDetails,
  EmrPatientDocuments,
  EmrPatientHistoryTimeline,
  EmrPatientIdentityCard,
  EmrPatientList,
  EmrPinPad,
  EmrPrivacyCentre,
  EmrRecordDiff,
  EmrRightsRequests,
  EmrSharingGrants,
  EmrSpectacleDelivery,
  EmrSyncPill,
  EmrTimeline,
  EmrToast,
  EmrUploadQueue,
  EmrWorkQueue,
  useEmrTheme,
  type DocumentUploadIntent,
  type DocumentUploadQueueViewModel,
  type DocumentViewerIntent,
  type DocumentViewerViewModel,
  type EmrArrivalLinkerModel,
  type EmrBarChartModel,
  type EmrBookedRow,
  type EmrCataractEpisode,
  type EmrChartIntent,
  type EmrConsentCaptureModel,
  type EmrConsentIntent,
  type EmrConsentReceiptModel,
  type EmrConsentReviewIntent,
  type EmrConsentReviewModel,
  type EmrContactAttemptIntent,
  type EmrLoginFormModel,
  type EmrMergeIntent,
  type EmrPatientHistoryIntent,
  type EmrPatientHistoryModel,
  type EmrPatientIdentity,
  type EmrPinPadModel,
  type EmrRecordDiffModel,
  type EmrToastModel,
  type EmrUploadQueueIntent,
  type EmrUploadQueueItem,
  type FavouritesIntent,
  type FavouritesViewModel,
  type HierarchyNode,
  type HierarchyOrderViewModel,
  type OrderDetailsIntent,
  type PatientDocumentsIntent,
  type PatientDocumentsViewModel,
  type SelectedOrder,
} from '../../../src';
import { LitElementHost } from './lit-element-host';
import { defineParityEntry, type ParityEntry } from './types';

function MutedText({ children }: { children: string }) {
  const t = useEmrTheme();
  return <Text style={{ color: t.textMuted, fontSize: t.textSm, fontFamily: t.fontFamily }}>{children}</Text>;
}

// Valid base64 PNG data URL so both React Image and Lit EmrDocumentViewerElement (`rasterSource()` allowlist) render cleanly
const SYNTHETIC_DOC_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAGXRFWHRTb2Z0d2FyZQBNYXRwbG90bGliIHZlcnNpb24zLjguMCwgaHR0cHM6Ly9tYXRwbG90bGliLm9yZy81sbWrAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIklEQVQImWP8//8/AzbAxIAFMBJFjAwMDAwMoxpGNYyYBgB60QMR6O9b6gAAAABJRU5ErkJggg==';

const SYNTHETIC_PATIENT: EmrPatientIdentity = {
  name: 'Ananya Rao',
  ageLabel: '54 y',
  sexLabel: 'Female',
  phone: '9000000101',
  centreName: 'Vision Centre North',
  lastVisitDate: '10-10-2026',
  aliases: ['A. Rao'],
  identifiers: [
    { system: 'uhid', label: 'UHID', display: '900000842' },
    { system: 'project', label: 'Project ID', display: '17-26-000842' },
    { system: 'abha', label: 'National Health ID', display: '00-0000-0000-0842', statusBadge: { label: 'Verified', tone: 'success' } },
  ],
  addableSystems: [{ system: 'abha-address', label: 'Health address' }],
  alerts: [{ id: 'phone', text: 'Confirm alternate contact number', tone: 'info', actionLabel: 'Verify' }],
};

const PATIENT_ROWS: readonly PatientListRow[] = [
  { patientId: 'p1', displayName: 'Ananya Rao', primaryIdentifier: 'MRN-1001', ageLabel: '54 y', sexLabel: 'F', careSettingLabel: 'Outpatient', locationLabel: 'Room 101', queueLabel: 'Queue 1', status: { label: 'Waiting', tone: 'warning' } },
  { patientId: 'p2', displayName: 'Aarav Sharma', primaryIdentifier: 'MRN-1002', ageLabel: '58 y', sexLabel: 'M', careSettingLabel: 'Outpatient', locationLabel: 'Room 104', queueLabel: 'Queue 2', status: { label: 'Urgent', tone: 'danger', assistiveText: 'Urgent priority' } },
  { patientId: 'p3', displayName: 'Meera Iyer', primaryIdentifier: 'MRN-1003', ageLabel: '42 y', sexLabel: 'F', careSettingLabel: 'Inpatient', locationLabel: 'Ward 4', status: { label: 'Seen', tone: 'success' } },
];

const TIMELINE_KINDS: TimelineKindDefinition[] = [
  { id: 'visit', label: 'OPD Visit', tone: 'info' },
  { id: 'surgery', label: 'Surgery', tone: 'warning' },
  { id: 'discharge', label: 'Discharge', tone: 'success' },
];

const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 'e1', occurredAt: '2026-08-12', dateLabel: '12 Aug 2026', title: 'Baseline Glaucoma Assessment', summary: 'IOP 24/18 mmHg; started topical therapy.', kindId: 'visit' },
  { id: 'e2', occurredAt: '2026-09-19', dateLabel: '19 Sep 2026', title: 'Phacoemulsification + PCIOL (OD)', summary: 'Uneventful +21.0 D in-the-bag IOL.', kindId: 'surgery' },
  { id: 'e3', occurredAt: '2026-10-14', dateLabel: '14 Oct 2026', title: 'Post-op Week 3 Review', summary: 'SD-OCT macular check.', kindId: 'discharge' },
];

const QUEUE_STATIONS_SEED: QueueStation[] = [
  {
    id: 'refraction',
    label: 'Refraction',
    countLabel: '2 waiting',
    canCallNext: true,
    cards: [
      { id: 'q1', patientId: 'p1', displayName: 'Ananya Rao', primaryIdentifier: 'MRN-1001', tokenLabel: 'Token 14', waitLabel: '8 min', ageSexLabel: '54 F' },
      { id: 'q2', patientId: 'p2', displayName: 'Aarav Sharma', primaryIdentifier: 'MRN-1002', tokenLabel: 'Token 15', waitLabel: '4 min', ageSexLabel: '58 M', priority: { label: 'Post-op', tone: 'warning' } },
    ],
  },
  {
    id: 'consultant',
    label: 'Consultant Room 2',
    countLabel: '1 waiting',
    canCallNext: true,
    cards: [
      { id: 'q3', patientId: 'p3', displayName: 'Rohan Nair', primaryIdentifier: 'MRN-1009', tokenLabel: 'Token 11', waitLabel: '12 min', ageSexLabel: '63 M' },
    ],
  },
];

const ORDER_TREE_NODES: readonly HierarchyNode[] = [
  {
    id: 'ophth-img',
    label: 'Ophthalmic Imaging',
    kind: 'group',
    selectable: false,
    expanded: true,
    children: [
      { id: 'oct-mac', label: 'SD-OCT Macula (OU)', code: 'OCT-MAC', kind: 'item', selectable: true },
      { id: 'hvf-24-2', label: 'Humphrey Visual Field 24-2', code: 'HVF-242', kind: 'item', selectable: true },
    ],
  },
  {
    id: 'pathology',
    label: 'Pathology',
    kind: 'group',
    selectable: false,
    expanded: true,
    children: [
      { id: 'hba1c', label: 'Glycated Haemoglobin (HbA1c)', code: 'HBA1C', kind: 'item', selectable: true },
    ],
  },
];

const CATARACT_EPISODE_SEED: EmrCataractEpisode = {
  id: 'ep-od-1',
  eye: 'Right eye (OD)',
  status: 'operated',
  statusBadge: { label: 'Operated', tone: 'success' },
  canAddFollowup: true,
  admissionDate: '18-09-2026',
  sxDate: '19-09-2026',
  stages: {
    stages: [
      { id: 'booked', label: 'Booked', status: { label: 'Done', tone: 'success' } },
      { id: 'admitted', label: 'Admitted', status: { label: 'Done', tone: 'success' } },
      { id: 'operated', label: 'Operated', status: { label: 'Done', tone: 'success' } },
      { id: 'followup', label: 'Follow-up' },
    ],
    activeId: 'followup',
  },
  followups: [
    { label: 'Day 1', due: '20-09-2026', done: true, statusBadge: { label: 'Seen', tone: 'success' } },
    { label: 'Week 4', due: '17-10-2026', statusBadge: { label: 'Due', tone: 'info' } },
  ],
};

export const PARITY_ENTRIES_L4_WORKFLOWS: readonly ParityEntry[] = [
  // ---- Patient Lists, Timeline & Work Queue (3) ------------------------------------------
  defineParityEntry<PatientListViewModel>({
    selector: 'emr-patient-list',
    createInitialState: () => ({
      query: '',
      page: 1,
      pageSize: 10,
      total: PATIENT_ROWS.length,
      rows: PATIENT_ROWS,
      loading: false,
      selectedPatientId: 'p1',
    }),
    renderReact: ({ state, update }) => (
      <EmrPatientList
        model={state}
        onIntent={(i: PatientListIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'queryChanged') {
              const q = i.query.toLowerCase();
              const rows = PATIENT_ROWS.filter((r) => `${r.displayName} ${r.primaryIdentifier}`.toLowerCase().includes(q));
              return { ...s, query: i.query, rows, total: rows.length };
            }
            if (i.type === 'patientSelected') return { ...s, selectedPatientId: i.patientId };
            if (i.type === 'sortChanged') return { ...s, sort: { field: i.field, direction: i.direction } };
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-patient-list"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as PatientListIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'queryChanged') {
                const q = i.query.toLowerCase();
                const rows = PATIENT_ROWS.filter((r) => `${r.displayName} ${r.primaryIdentifier}`.toLowerCase().includes(q));
                return { ...s, query: i.query, rows, total: rows.length };
              }
              if (i.type === 'patientSelected') return { ...s, selectedPatientId: i.patientId };
              if (i.type === 'sortChanged') return { ...s, sort: { field: i.field, direction: i.direction } };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ selectedId: string }>({
    selector: 'emr-timeline',
    createInitialState: () => ({ selectedId: 'e2' }),
    renderReact: ({ state, update }) => (
      <EmrTimeline
        events={TIMELINE_EVENTS}
        kinds={TIMELINE_KINDS}
        selectedId={state.selectedId}
        onIntent={(i) => update('react', i.type, i, () => ({ selectedId: i.eventId }))}
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-timeline"
        props={{ model: { events: TIMELINE_EVENTS, kinds: TIMELINE_KINDS, selectedId: state.selectedId } }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; eventId: string };
            update('lit', i.type, i, () => ({ selectedId: i.eventId }));
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ stations: QueueStation[]; selectedCardId?: string }>({
    selector: 'emr-work-queue',
    createInitialState: () => ({ stations: QUEUE_STATIONS_SEED, selectedCardId: 'q1' }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrWorkQueue
        model={{
          id: 'wq-parity',
          title: 'OPD Station Flow Board',
          updatedLabel: 'Live sync',
          emptyMessage: 'Queue empty.',
          selectedCardId: state.selectedCardId,
          moveTargets: state.stations.map((s) => ({ value: s.id, label: s.label })),
          readOnly,
          stations: state.stations,
        }}
        onIntent={(i: WorkQueueIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'cardSelected') return { ...s, selectedCardId: i.cardId };
            if (i.type === 'moveRequested') {
              const card = s.stations.flatMap((st) => st.cards).find((c) => c.id === i.cardId);
              if (!card) return s;
              return {
                ...s,
                stations: s.stations.map((st) => {
                  const cards = [...st.cards.filter((c) => c.id !== i.cardId), ...(st.id === i.stationId ? [card] : [])];
                  return { ...st, cards, countLabel: `${cards.length} waiting` };
                }),
              };
            }
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-work-queue"
        props={{
          model: {
            id: 'wq-parity',
            title: 'OPD Station Flow Board',
            updatedLabel: 'Live sync',
            emptyMessage: 'Queue empty.',
            selectedCardId: state.selectedCardId,
            moveTargets: state.stations.map((s) => ({ value: s.id, label: s.label })),
            readOnly,
            stations: state.stations,
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as WorkQueueIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'cardSelected') return { ...s, selectedCardId: i.cardId };
              if (i.type === 'moveRequested') {
                const card = s.stations.flatMap((st) => st.cards).find((c) => c.id === i.cardId);
                if (!card) return s;
                return {
                  ...s,
                  stations: s.stations.map((st) => {
                    const cards = [...st.cards.filter((c) => c.id !== i.cardId), ...(st.id === i.stationId ? [card] : [])];
                    return { ...st, cards, countLabel: `${cards.length} waiting` };
                  }),
                };
              }
              return s;
            });
          },
        }}
      />
    ),
  }),

  // ---- Orders & Documents (6) ------------------------------------------------------------
  defineParityEntry<DocumentUploadQueueViewModel>({
    selector: 'emr-document-upload-queue',
    createInitialState: () => ({
      label: 'Add clinical documents',
      acceptDescription: 'PDF, JPEG and PNG files accepted.',
      multiple: true,
      candidates: [
        { id: 'dc1', fileName: 'perimetry-report.pdf', sizeLabel: '210 KB', mediaTypeLabel: 'PDF', sourceToken: 'tok-1', status: 'complete', statusLabel: 'Ready', progress: 100 },
        { id: 'dc2', fileName: 'corrupted-scan.pdf', sizeLabel: '84 KB', mediaTypeLabel: 'PDF', sourceToken: 'tok-2', status: 'error', statusLabel: 'Failed', error: 'Checksum error.' },
      ],
    }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrDocumentUploadQueue
        model={{ ...state, disabled: readOnly }}
        onIntent={(i: DocumentUploadIntent) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'candidateRemoveRequested') return { ...m, candidates: m.candidates.filter((c) => c.id !== i.candidateId) };
            if (i.type === 'candidateRetryRequested') {
              return { ...m, candidates: m.candidates.map((c) => (c.id === i.candidateId ? { ...c, status: 'complete', statusLabel: 'Ready', progress: 100, error: undefined } : c)) };
            }
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-document-upload-queue"
        props={{ model: { ...state, disabled: readOnly }, readOnly }}
        events={{
          intent: (raw) => {
            const i = raw as DocumentUploadIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'candidateRemoveRequested') return { ...m, candidates: m.candidates.filter((c) => c.id !== i.candidateId) };
              if (i.type === 'candidateRetryRequested') {
                return { ...m, candidates: m.candidates.map((c) => (c.id === i.candidateId ? { ...c, status: 'complete', statusLabel: 'Ready', progress: 100, error: undefined } : c)) };
              }
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<PatientDocumentsViewModel>({
    selector: 'emr-patient-documents',
    createInitialState: () => ({
      instanceId: 'pdocs-parity',
      label: 'Patient Clinical Documents',
      query: '',
      page: 1,
      pageSize: 10,
      total: 2,
      categoryOptions: [{ value: 'clinical', label: 'Clinical' }, { value: 'admin', label: 'Administrative' }],
      folderOptions: [{ value: 'oct-2026', label: 'October 2026 Encounter' }],
      documents: [
        { id: 'doc1', title: 'Discharge Summary', categoryId: 'clinical', categoryLabel: 'Clinical', folderId: 'oct-2026', folderLabel: 'October 2026 Encounter', fileName: 'discharge.pdf', mediaTypeLabel: 'PDF', sizeLabel: '224 KB', createdAt: '2026-10-14T09:00:00Z', createdAtLabel: '14 Oct 2026', canPreview: true, canDownload: true, canDelete: true, previewKind: 'pdf' },
        { id: 'doc2', title: 'Surgical Consent', categoryId: 'admin', categoryLabel: 'Administrative', folderId: 'oct-2026', folderLabel: 'October 2026 Encounter', fileName: 'consent.pdf', mediaTypeLabel: 'PDF', sizeLabel: '96 KB', createdAt: '2026-10-12T09:00:00Z', createdAtLabel: '12 Oct 2026', canPreview: true, canDownload: true, previewKind: 'pdf' },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrPatientDocuments
        model={state}
        onIntent={(i: PatientDocumentsIntent) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'queryChanged') return { ...m, query: i.query };
            if (i.type === 'categoryChanged') return { ...m, category: i.category };
            if (i.type === 'folderChanged') return { ...m, folder: i.folder };
            if (i.type === 'documentSelected') return { ...m, selectedDocumentId: i.documentId };
            if (i.type === 'deleteRequested') return { ...m, documents: m.documents.filter((d) => d.id !== i.documentId) };
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-patient-documents"
        props={{ model: state, readOnly }}
        events={{
          intent: (raw) => {
            const i = raw as PatientDocumentsIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'queryChanged') return { ...m, query: i.query };
              if (i.type === 'categoryChanged') return { ...m, category: i.category };
              if (i.type === 'folderChanged') return { ...m, folder: i.folder };
              if (i.type === 'documentSelected') return { ...m, selectedDocumentId: i.documentId };
              if (i.type === 'deleteRequested') return { ...m, documents: m.documents.filter((d) => d.id !== i.documentId) };
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<DocumentViewerViewModel>({
    selector: 'emr-document-viewer',
    createInitialState: () => ({
      instanceId: 'doc-viewer-parity',
      open: true,
      loading: false,
      documentIndex: 0,
      documentCount: 1,
      pageIndex: 0,
      canPreviousDocument: false,
      canNextDocument: false,
      canPreviousPage: false,
      canNextPage: true,
      currentDocument: {
        documentId: 'doc-1',
        title: 'Discharge Summary (Rasterized Preview)',
        fileName: 'discharge.pdf',
        categoryLabel: 'Clinical',
        folderLabel: 'October 2026 Encounter',
        createdAtLabel: '14 Oct 2026',
        kind: 'pdf',
        pageCount: 2,
      },
      page: {
        assetId: 'asset-0',
        documentId: 'doc-1',
        pageIndex: 0,
        pageLabel: 'Page 1 of 2',
        rasterUrl: SYNTHETIC_DOC_PNG,
        altText: 'Synthetic rasterized page 1 preview',
      },
    }),
    renderReact: ({ state, update }) => {
      const setPage = (m: DocumentViewerViewModel, nextIdx: number): DocumentViewerViewModel => {
        const count = m.currentDocument?.pageCount ?? 1;
        const idx = Math.max(0, Math.min(count - 1, nextIdx));
        return {
          ...m,
          pageIndex: idx,
          canPreviousPage: idx > 0,
          canNextPage: idx < count - 1,
          page: {
            assetId: `asset-${idx}`,
            documentId: 'doc-1',
            pageIndex: idx,
            pageLabel: `Page ${idx + 1} of ${count}`,
            rasterUrl: SYNTHETIC_DOC_PNG,
            altText: `Synthetic rasterized page ${idx + 1} preview`,
          },
        };
      };
      const reduceDoc = (m: DocumentViewerViewModel, i: DocumentViewerIntent): DocumentViewerViewModel => {
        if (i.type === 'pageRequested') return setPage(m, i.pageIndex);
        if (i.type === 'previousPageRequested') return setPage(m, m.pageIndex - 1);
        if (i.type === 'nextPageRequested') return setPage(m, m.pageIndex + 1);
        return m;
      };
      return (
        <EmrDocumentViewer
          model={state}
          inline
          onIntent={(i) => update('react', i.type, i, (m) => reduceDoc(m, i))}
        />
      );
    },
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-document-viewer"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as DocumentViewerIntent;
            update('lit', i.type, i, (m) => {
              const count = m.currentDocument?.pageCount ?? 1;
              const setPage = (nextIdx: number): DocumentViewerViewModel => {
                const idx = Math.max(0, Math.min(count - 1, nextIdx));
                return {
                  ...m,
                  pageIndex: idx,
                  canPreviousPage: idx > 0,
                  canNextPage: idx < count - 1,
                  page: {
                    assetId: `asset-${idx}`,
                    documentId: 'doc-1',
                    pageIndex: idx,
                    pageLabel: `Page ${idx + 1} of ${count}`,
                    rasterUrl: SYNTHETIC_DOC_PNG,
                    altText: `Synthetic rasterized page ${idx + 1} preview`,
                  },
                };
              };
              if (i.type === 'pageRequested') return setPage(i.pageIndex);
              if (i.type === 'previousPageRequested') return setPage(m.pageIndex - 1);
              if (i.type === 'nextPageRequested') return setPage(m.pageIndex + 1);
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<HierarchyOrderViewModel>({
    selector: 'emr-hierarchy-order-picker',
    createInitialState: () => ({
      title: 'Diagnostic & Laboratory Order Catalogue',
      query: '',
      roots: ORDER_TREE_NODES,
      loading: false,
      selected: [
        { id: 'ord-oct', catalogueId: 'oct-mac', label: 'SD-OCT Macula (OU)', code: 'OCT-MAC', kind: 'radiology', details: { urgency: 'routine' } },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrHierarchyOrderPicker
        model={state}
        onIntent={(i) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'queryChanged') return { ...m, query: i.query };
            if (i.type === 'itemAddRequested') {
              const exists = m.selected.some((s) => s.catalogueId === i.nodeId);
              if (exists) return { ...m, selected: m.selected.filter((s) => s.catalogueId !== i.nodeId) };
              const leaf = ORDER_TREE_NODES.flatMap((r) => r.children ?? []).find((c) => c.id === i.nodeId);
              return leaf
                ? { ...m, selected: [...m.selected, { id: `ord-${leaf.id}`, catalogueId: leaf.id, label: leaf.label, code: leaf.code, kind: 'laboratory', details: { urgency: 'routine' } }] }
                : m;
            }
            if (i.type === 'orderRemoveRequested') return { ...m, selected: m.selected.filter((s) => s.id !== i.orderId) };
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-hierarchy-order-picker"
        props={{ model: state, readOnly }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; query?: string; nodeId?: string; orderId?: string };
            update('lit', i.type, i, (m) => {
              if (i.type === 'queryChanged') return { ...m, query: i.query ?? '' };
              if (i.type === 'itemAddRequested' && i.nodeId) {
                const exists = m.selected.some((s) => s.catalogueId === i.nodeId);
                if (exists) return { ...m, selected: m.selected.filter((s) => s.catalogueId !== i.nodeId) };
                const leaf = ORDER_TREE_NODES.flatMap((r) => r.children ?? []).find((c) => c.id === i.nodeId);
                return leaf
                  ? { ...m, selected: [...m.selected, { id: `ord-${leaf.id}`, catalogueId: leaf.id, label: leaf.label, code: leaf.code, kind: 'laboratory', details: { urgency: 'routine' } }] }
                  : m;
              }
              if (i.type === 'orderRemoveRequested') return { ...m, selected: m.selected.filter((s) => s.id !== i.orderId) };
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<SelectedOrder>({
    selector: 'emr-order-details',
    createInitialState: () => ({
      id: 'ord-mri',
      catalogueId: 'mri-orbits',
      label: 'MRI Orbits & Optic Pathways',
      code: 'MRI-ORB',
      kind: 'radiology',
      details: {
        urgency: 'urgent',
        bodySite: 'Orbits',
        laterality: 'bilateral',
        contrast: true,
        clinicalIndication: 'Atypical optic neuropathy workup',
      },
    }),
    renderReact: ({ state, update }) => (
      <EmrOrderDetails
        model={state}
        onIntent={(i: OrderDetailsIntent) =>
          update('react', i.type, i, (s) =>
            i.type === 'detailChangeRequested' ? { ...s, details: { ...s.details, [i.field]: i.value } } : s,
          )
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-order-details"
        props={{ model: state, readOnly }}
        events={{
          intent: (raw) => {
            const i = raw as OrderDetailsIntent;
            update('lit', i.type, i, (s) =>
              i.type === 'detailChangeRequested' ? { ...s, details: { ...s.details, [i.field]: i.value } } : s,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<FavouritesViewModel>({
    selector: 'emr-favourites-panel',
    createInitialState: () => ({
      open: true,
      mode: 'list',
      activeKind: 'combination',
      query: '',
      loading: false,
      items: [
        {
          id: 'fav-cataract',
          name: 'Pre-op Cataract Bundle',
          kind: 'combination',
          summary: 'Biometry, HbA1c, BP & Xylocaine sensitivity',
          updatedAt: '2026-10-01',
          orderTemplates: [
            { id: 't1', catalogueId: 'iol-bio', label: 'Optical Biometry (IOLMaster)', kind: 'radiology' },
            { id: 't2', catalogueId: 'hba1c', label: 'HbA1c', kind: 'laboratory' },
          ],
        },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrFavouritesPanel
        model={state}
        onIntent={(i: FavouritesIntent) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'queryChanged') return { ...m, query: i.query };
            if (i.type === 'tabChanged') return { ...m, activeKind: i.kind };
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-favourites-panel"
        props={{ model: state, readOnly }}
        events={{
          intent: (raw) => {
            const i = raw as FavouritesIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'queryChanged') return { ...m, query: i.query };
              if (i.type === 'tabChanged') return { ...m, activeKind: i.kind };
              return m;
            });
          },
        }}
      />
    ),
  }),

  // ---- Consent, Privacy & Identity (10) --------------------------------------------------
  defineParityEntry<EmrConsentCaptureModel>({
    selector: 'emr-consent-capture',
    createInitialState: () => ({
      notice: {
        title: 'Synthetic Data & Care Consent Notice',
        version: 'DEMO-1',
        languageLabel: 'English',
        sections: [{ heading: 'Purpose', body: 'Placeholder consent wording supplied by the host application.' }],
      },
      languageOptions: [{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिन्दी' }],
      selectedLanguage: 'en',
      categories: [
        {
          id: 'care',
          label: 'Clinical Care',
          mode: 'whole',
          purposes: [{ id: 'p-care', label: 'Eye care treatment records', description: 'Essential for clinical care.', essential: true }],
        },
        {
          id: 'followup',
          label: 'Follow-up Reminders',
          mode: 'per_purpose',
          purposes: [{ id: 'p-sms', label: 'SMS appointment reminders', description: 'Optional recall messages.', essential: false, decision: 'granted' }],
        },
      ],
      givenByOptions: [{ id: 'self', label: 'Patient' }, { id: 'guardian', label: 'Guardian' }],
      selectedGivenBy: 'self',
      methodOptions: [{ id: 'tap', label: 'Tap to agree' }, { id: 'signature', label: 'Signature' }],
      selectedMethod: 'tap',
      canSubmit: true,
    }),
    renderReact: ({ state, update }) => (
      <EmrConsentCapture
        model={state}
        onIntent={(i: EmrConsentIntent) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'languageSelected') return { ...m, selectedLanguage: i.id };
            if (i.type === 'givenBySelected') return { ...m, selectedGivenBy: i.id };
            if (i.type === 'methodSelected') return { ...m, selectedMethod: i.id };
            if (i.type === 'purposeDecided') {
              return {
                ...m,
                categories: m.categories.map((c) => ({
                  ...c,
                  purposes: c.purposes.map((p) => (p.id === i.id ? { ...p, decision: i.decision } : p)),
                })),
              };
            }
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-consent-capture"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as EmrConsentIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'languageSelected') return { ...m, selectedLanguage: i.id };
              if (i.type === 'givenBySelected') return { ...m, selectedGivenBy: i.id };
              if (i.type === 'methodSelected') return { ...m, selectedMethod: i.id };
              if (i.type === 'purposeDecided') {
                return {
                  ...m,
                  categories: m.categories.map((c) => ({
                    ...c,
                    purposes: c.purposes.map((p) => (p.id === i.id ? { ...p, decision: i.decision } : p)),
                  })),
                };
              }
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<EmrConsentReviewModel>({
    selector: 'emr-consent-review',
    createInitialState: () => ({
      patient: { name: 'Ananya Rao', ageLabel: '54 y', sexLabel: 'Female', identifiers: [{ system: 'uhid', label: 'UHID', display: '900000842' }] },
      noticeVersionLabel: 'Notice v1 · English',
      categories: [
        {
          id: 'contact',
          label: 'Contact Preferences',
          purposes: [
            {
              id: 'followup',
              label: 'Follow-up recall',
              essential: false,
              description: 'Appointment and post-op check reminders.',
              statusBadge: { label: 'Granted', tone: 'success' },
              decidedAtLabel: '10 Oct 2026',
              methodLabel: 'Tap',
              givenByLabel: 'Self',
              canWithdraw: true,
              canGrant: false,
            },
          ],
        },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrConsentReview
        model={state}
        onIntent={(i: EmrConsentReviewIntent) =>
          update('react', i.type, i, (m) => {
            if (i.type === 'withdrawRequested') {
              return { ...m, pendingWithdrawal: { purposeId: i.purposeId, title: 'Withdraw consent?', body: 'Recall reminders will stop.', confirmLabel: 'Withdraw', cancelLabel: 'Keep' } };
            }
            if (i.type === 'withdrawDismissed') return { ...m, pendingWithdrawal: undefined };
            if (i.type === 'withdrawConfirmed') {
              return {
                ...m,
                pendingWithdrawal: undefined,
                categories: m.categories.map((c) => ({
                  ...c,
                  purposes: c.purposes.map((p) =>
                    p.id === i.purposeId ? { ...p, statusBadge: { label: 'Withdrawn', tone: 'warning' }, canWithdraw: false, canGrant: true } : p,
                  ),
                })),
              };
            }
            if (i.type === 'grantRequested') {
              return {
                ...m,
                categories: m.categories.map((c) => ({
                  ...c,
                  purposes: c.purposes.map((p) =>
                    p.id === i.purposeId ? { ...p, statusBadge: { label: 'Granted', tone: 'success' }, canWithdraw: true, canGrant: false } : p,
                  ),
                })),
              };
            }
            return m;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-consent-review"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as EmrConsentReviewIntent;
            update('lit', i.type, i, (m) => {
              if (i.type === 'withdrawRequested') {
                return { ...m, pendingWithdrawal: { purposeId: i.purposeId, title: 'Withdraw consent?', body: 'Recall reminders will stop.', confirmLabel: 'Withdraw', cancelLabel: 'Keep' } };
              }
              if (i.type === 'withdrawDismissed') return { ...m, pendingWithdrawal: undefined };
              if (i.type === 'withdrawConfirmed') {
                return {
                  ...m,
                  pendingWithdrawal: undefined,
                  categories: m.categories.map((c) => ({
                    ...c,
                    purposes: c.purposes.map((p) =>
                      p.id === i.purposeId ? { ...p, statusBadge: { label: 'Withdrawn', tone: 'warning' }, canWithdraw: false, canGrant: true } : p,
                    ),
                  })),
                };
              }
              if (i.type === 'grantRequested') {
                return {
                  ...m,
                  categories: m.categories.map((c) => ({
                    ...c,
                    purposes: c.purposes.map((p) =>
                      p.id === i.purposeId ? { ...p, statusBadge: { label: 'Granted', tone: 'success' }, canWithdraw: true, canGrant: false } : p,
                    ),
                  })),
                };
              }
              return m;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<EmrConsentReceiptModel>({
    selector: 'emr-consent-receipt',
    createInitialState: () => ({
      title: 'Consent Receipt',
      patientName: 'Ananya Rao',
      identifiers: [{ label: 'UHID', display: '900000842' }],
      dateLabel: '14 Oct 2026',
      noticeVersionLabel: 'Notice v1 · English',
      categories: [
        { label: 'Care', purposes: [{ label: 'Eye care treatment records', decisionLabel: 'Required for care' }] },
        { label: 'Follow-up', purposes: [{ label: 'SMS reminders', decisionLabel: 'Granted', statusBadge: { label: 'Granted', tone: 'success' } }] },
      ],
      howToChange: 'Visit the patient desk or call helpline 1800-000-0000.',
      footer: 'Synthetic printable consent receipt.',
    }),
    renderReact: ({ state }) => <EmrConsentReceipt model={state} />,
    renderLit: ({ state }) => <LitElementHost tag="emr-consent-receipt" props={{ model: state }} />,
  }),

  defineParityEntry<{ clicks: number }>({
    selector: 'emr-consent-status-badge',
    createInitialState: () => ({ clicks: 0 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrConsentStatusBadge
        badge={{ label: 'Consent Partial', tone: 'warning' }}
        detail={`2 of 3 purposes granted (opened ${state.clicks}×)`}
        onIntent={readOnly ? undefined : (i) => update('react', i.type, i, (s) => ({ clicks: s.clicks + 1 }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-consent-status-badge"
        props={{
          model: {
            badge: { label: 'Consent Partial', tone: 'warning' },
            detail: `2 of 3 purposes granted (opened ${state.clicks}×)`,
          },
          interactive: !readOnly,
        }}
        events={{
          intent: (i) => update('lit', 'intent', i, (s) => ({ clicks: s.clicks + 1 })),
        }}
      />
    ),
  }),

  defineParityEntry<{ grants: SharingGrantView[]; selectedFilter: string }>({
    selector: 'emr-sharing-grants',
    createInitialState: () => ({
      selectedFilter: 'all',
      grants: [
        {
          id: 'g1',
          recipientLabel: 'District Eye Hospital',
          recipientTypeLabel: 'Hospital',
          purposeLabel: 'Surgical referral continuity',
          dataScope: ['Eye examination', 'Prescriptions'],
          validFromLabel: '01-10-2026',
          validToLabel: '31-12-2026',
          statusBadge: { label: 'Active', tone: 'success' },
          grantedAtLabel: '01-10-2026',
          canRevoke: true,
        },
      ],
    }),
    renderReact: ({ state, update }) => {
      const model: SharingGrantsViewModel = {
        grants: state.grants,
        state: 'ready',
        filters: [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }],
        selectedFilter: state.selectedFilter,
      };
      return (
        <EmrSharingGrants
          model={model}
          onIntent={(i) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'filterSelected') return { ...s, selectedFilter: i.id };
              if (i.type === 'revokeRequested') {
                return { ...s, grants: s.grants.map((g) => (g.id === i.grantId ? { ...g, canRevoke: false, statusBadge: { label: 'Revoked', tone: 'danger' } } : g)) };
              }
              return s;
            })
          }
        />
      );
    },
    renderLit: ({ state, update }) => {
      const model: SharingGrantsViewModel = {
        grants: state.grants,
        state: 'ready',
        filters: [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }],
        selectedFilter: state.selectedFilter,
      };
      return (
        <LitElementHost
          tag="emr-sharing-grants"
          props={{ model }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string; id?: string; grantId?: string };
              update('lit', i.type, i, (s) => {
                if (i.type === 'filterSelected' && i.id) return { ...s, selectedFilter: i.id };
                if (i.type === 'revokeRequested') {
                  return { ...s, grants: s.grants.map((g) => (g.id === i.grantId ? { ...g, canRevoke: false, statusBadge: { label: 'Revoked', tone: 'danger' } } : g)) };
                }
                return s;
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<AccessLogViewModel>({
    selector: 'emr-access-log',
    createInitialState: () => ({
      state: 'ready',
      canLoadMore: true,
      selectedPeriod: '30',
      periodOptions: [{ id: '30', label: 'Last 30 days' }, { id: '90', label: 'Last 90 days' }],
      entries: [
        {
          id: 'al-1',
          atLabel: '14-10-2026 09:15',
          actorLabel: 'Dr. S. Iyer',
          actorRoleLabel: 'Ophthalmologist',
          organisationLabel: 'Synthetic Eye Institute',
          actionLabel: 'Viewed',
          dataLabel: 'SD-OCT & Refraction Record',
          purposeLabel: 'Treatment',
          canReportConcern: true,
        },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrAccessLog
        model={state}
        onIntent={(i) =>
          update('react', i.type, i, (m) => (i.type === 'periodSelected' ? { ...m, selectedPeriod: i.id } : m))
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-access-log"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; id?: string };
            update('lit', i.type, i, (m) => (i.type === 'periodSelected' && i.id ? { ...m, selectedPeriod: i.id } : m));
          },
        }}
      />
    ),
  }),

  defineParityEntry<RightsRequestsViewModel>({
    selector: 'emr-rights-requests',
    createInitialState: () => ({
      state: 'ready',
      requests: [
        {
          id: 'rr-1',
          kind: 'access',
          kindLabel: 'Copy of clinical records',
          submittedAtLabel: '08-10-2026',
          statusBadge: { label: 'In progress', tone: 'info' },
          dueLabel: 'Reply due 22-10-2026',
          summary: 'Discharge summary and OCT images.',
          canWithdraw: true,
        },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrRightsRequests
        model={state}
        onIntent={(i) =>
          update('react', i.type, i, (m) =>
            i.type === 'withdrawRequested'
              ? { ...m, requests: m.requests.map((r) => (r.id === i.requestId ? { ...r, canWithdraw: false, statusBadge: { label: 'Withdrawn', tone: 'neutral' } } : r)) }
              : m,
          )
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-rights-requests"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as { type: string; requestId?: string };
            update('lit', i.type, i, (m) =>
              i.type === 'withdrawRequested'
                ? { ...m, requests: m.requests.map((r) => (r.id === i.requestId ? { ...r, canWithdraw: false, statusBadge: { label: 'Withdrawn', tone: 'neutral' } } : r)) }
                : m,
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<PrivacyCentreViewModel>({
    selector: 'emr-privacy-centre',
    createInitialState: () => ({
      title: 'Patient Privacy Centre',
      tiles: [
        { key: 'grants', label: 'Active Grants', value: '2' },
        { key: 'access', label: 'Access Events', value: '5', sub: '30 days' },
        { key: 'requests', label: 'Open Requests', value: '1', status: { label: 'Due', tone: 'warning' } },
      ],
      sections: [
        { id: 'consents', label: 'Consents' },
        { id: 'grants', label: 'Sharing' },
        { id: 'access', label: 'Access Log' },
        { id: 'requests', label: 'Requests' },
      ],
      activeSection: 'grants',
      contactText: 'Privacy desk helpline: 1800-000-0000',
    }),
    renderReact: ({ state, update }) => (
      <EmrPrivacyCentre
        model={state}
        onIntent={(i) =>
          update('react', i.type, i, (m) => ({
            ...m,
            activeSection: i.type === 'sectionSelected' ? i.id : (i.key as PrivacyCentreViewModel['activeSection']),
          }))
        }
      >
        <MutedText>{`Active privacy section: ${state.activeSection}`}</MutedText>
      </EmrPrivacyCentre>
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-privacy-centre"
        props={{ model: state }}
        slotHtml={`<div style="padding:8px 0;color:var(--emr-text-muted)">Active privacy section: ${state.activeSection}</div>`}
        events={{
          intent: (raw) => {
            const i = raw as { type: 'sectionSelected'; id: PrivacyCentreViewModel['activeSection'] } | { type: 'tilePressed'; key: string };
            update('lit', i.type, i, (m) => ({
              ...m,
              activeSection: i.type === 'sectionSelected' ? i.id : (i.key as PrivacyCentreViewModel['activeSection']),
            }));
          },
        }}
      />
    ),
  }),

  defineParityEntry<EmrPatientIdentity>({
    selector: 'emr-patient-identity-card',
    createInitialState: () => SYNTHETIC_PATIENT,
    renderReact: ({ state, update }) => (
      <EmrPatientIdentityCard mode="full" model={state} onIntent={(i) => update('react', i.type, i)} />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-patient-identity-card"
        props={{ model: state }}
        events={{ intent: (i) => update('lit', (i as { type: string }).type, i) }}
      />
    ),
  }),

  defineParityEntry<{ acked: string[] }>({
    selector: 'emr-identifier-check-prompt',
    createInitialState: () => ({ acked: [] }),
    renderReact: ({ state, update }) => {
      const findings = [
        {
          id: 'f1',
          kind: 'same_type_exists' as const,
          message: 'Patient already has a Project ID on record.',
          evidence: [{ label: 'Registered', value: '01-10-2026' }],
          candidate: { ...SYNTHETIC_PATIENT, id: 'cand-1', name: 'Ananya Rao (Existing)', addableSystems: [] },
          acknowledged: state.acked.includes('f1'),
        },
      ];
      const ok = findings.every((f) => f.acknowledged);
      return (
        <EmrIdentifierCheckPrompt
          model={{
            identifier: { label: 'Project ID', display: '17-26-000842' },
            outcome: 'warnings',
            findings,
            canConfirm: ok,
            canAddAsAdditional: ok,
            canReplaceExisting: ok,
          }}
          onIntent={(i) =>
            update('react', i.type, i, (s) =>
              i.type === 'findingAcknowledged'
                ? { acked: s.acked.includes(i.findingId) ? s.acked.filter((x) => x !== i.findingId) : [...s.acked, i.findingId] }
                : s,
            )
          }
        />
      );
    },
    renderLit: ({ state, update }) => {
      const findings = [
        {
          id: 'f1',
          kind: 'same_type_exists' as const,
          message: 'Patient already has a Project ID on record.',
          evidence: [{ label: 'Registered', value: '01-10-2026' }],
          candidate: { ...SYNTHETIC_PATIENT, id: 'cand-1', name: 'Ananya Rao (Existing)', addableSystems: [] },
          acknowledged: state.acked.includes('f1'),
        },
      ];
      const ok = findings.every((f) => f.acknowledged);
      return (
        <LitElementHost
          tag="emr-identifier-check-prompt"
          props={{
            model: {
              identifier: { label: 'Project ID', display: '17-26-000842' },
              outcome: 'warnings',
              findings,
              canConfirm: ok,
              canAddAsAdditional: ok,
              canReplaceExisting: ok,
            },
          }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string; findingId?: string };
              update('lit', i.type, i, (s) =>
                i.type === 'findingAcknowledged' && i.findingId
                  ? { acked: s.acked.includes(i.findingId) ? s.acked.filter((x) => x !== i.findingId) : [...s.acked, i.findingId!] }
                  : s,
              );
            },
          }}
        />
      );
    },
  }),

  // ---- Outreach, Desk, Merge, History & Records (12) -------------------------------------
  defineParityEntry<{ raw: string; cards: LinkCardView[]; primary: string }>({
    selector: 'emr-link-cards',
    createInitialState: () => ({
      raw: '',
      primary: 'c1',
      cards: [
        { id: 'c1', display: 'PEC-0842', state: 'unused', statusBadge: { label: 'Unused', tone: 'success' } },
        { id: 'c2', display: 'PEC-0849', state: 'checking', statusBadge: { label: 'Checking', tone: 'neutral' } },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrLinkCards
        model={{
          patient: SYNTHETIC_PATIENT,
          entry: { label: 'Card number', value: state.raw },
          cards: state.cards,
          primaryCardId: state.primary,
          canSubmit: state.cards.every((c) => c.state === 'unused'),
        }}
        onIntent={(i: LinkCardsIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'entryChanged') return { ...s, raw: i.raw };
            if (i.type === 'cardRemoved') return { ...s, cards: s.cards.filter((c) => c.id !== i.id) };
            if (i.type === 'primarySelected') return { ...s, primary: i.id };
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-link-cards"
        props={{
          model: {
            patient: SYNTHETIC_PATIENT,
            entry: { label: 'Card number', value: state.raw },
            cards: state.cards,
            primaryCardId: state.primary,
            canSubmit: state.cards.every((c) => c.state === 'unused'),
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as LinkCardsIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'entryChanged') return { ...s, raw: i.raw };
              if (i.type === 'cardRemoved') return { ...s, cards: s.cards.filter((c) => c.id !== i.id) };
              if (i.type === 'primarySelected') return { ...s, primary: i.id };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ number?: string; channel?: string; reached: boolean; outcome?: string; note: string }>({
    selector: 'emr-contact-attempt-form',
    createInitialState: () => ({ number: 'p1', channel: 'call', reached: true, outcome: 'coming', note: 'Confirmed arrival for Friday.' }),
    renderReact: ({ state, update }) => (
      <EmrContactAttemptForm
        model={{
          reasonLabel: 'Referred for cataract surgery (12 days)',
          numberOptions: [{ id: 'p1', label: 'Primary · 90000 00101' }, { id: 'p2', label: 'Alternate · 90000 00102' }],
          selectedNumber: state.number,
          channelOptions: [{ id: 'call', label: 'Phone call' }, { id: 'sms', label: 'SMS' }],
          selectedChannel: state.channel,
          reached: state.reached,
          outcomeOptions: [{ id: 'coming', label: 'Will attend' }, { id: 'later', label: 'Call back later' }],
          selectedOutcome: state.outcome,
          note: state.note,
          canSubmit: Boolean(state.number && state.channel && state.outcome),
        }}
        onIntent={(i: EmrContactAttemptIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'numberSelected') return { ...s, number: i.id };
            if (i.type === 'channelSelected') return { ...s, channel: i.id };
            if (i.type === 'reachedChanged') return { ...s, reached: i.reached };
            if (i.type === 'outcomeSelected') return { ...s, outcome: i.id };
            if (i.type === 'noteChanged') return { ...s, note: i.note };
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-contact-attempt-form"
        props={{
          model: {
            reasonLabel: 'Referred for cataract surgery (12 days)',
            numberOptions: [{ id: 'p1', label: 'Primary · 90000 00101' }, { id: 'p2', label: 'Alternate · 90000 00102' }],
            selectedNumber: state.number,
            channelOptions: [{ id: 'call', label: 'Phone call' }, { id: 'sms', label: 'SMS' }],
            selectedChannel: state.channel,
            reached: state.reached,
            outcomeOptions: [{ id: 'coming', label: 'Will attend' }, { id: 'later', label: 'Call back later' }],
            selectedOutcome: state.outcome,
            note: state.note,
            canSubmit: Boolean(state.number && state.channel && state.outcome),
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as EmrContactAttemptIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'numberSelected') return { ...s, number: i.id };
              if (i.type === 'channelSelected') return { ...s, channel: i.id };
              if (i.type === 'reachedChanged') return { ...s, reached: i.reached };
              if (i.type === 'outcomeSelected') return { ...s, outcome: i.id };
              if (i.type === 'noteChanged') return { ...s, note: i.note };
              return s;
            });
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ logs: number }>({
    selector: 'emr-contact-attempt-summary',
    createInitialState: () => ({ logs: 2 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrContactAttemptSummary
        model={{
          text: `Last call 12-10-2026 · confirmed attendance · ${state.logs} attempts logged`,
          statusBadge: { label: 'Reached', tone: 'success' },
        }}
        onIntent={readOnly ? undefined : (i) => update('react', i.type, i, (s) => ({ logs: s.logs + 1 }))}
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-contact-attempt-summary"
        props={{
          model: {
            text: `Last call 12-10-2026 · confirmed attendance · ${state.logs} attempts logged`,
            statusBadge: { label: 'Reached', tone: 'success' },
          },
        }}
        events={{
          intent: (i) => update('lit', 'intent', i, (s) => ({ logs: s.logs + 1 })),
        }}
      />
    ),
  }),

  defineParityEntry<{ survivor?: string; chosen: Record<string, string> }>({
    selector: 'emr-merge-compare',
    createInitialState: () => ({ survivor: 's0', chosen: { name: 's0' } }),
    renderReact: ({ state, update }) => {
      const sources = [
        { id: 's0', label: 'Record A', name: 'Ananya Rao', ageLabel: '54 y', sexLabel: 'F', identifiers: [{ system: 'mrn', label: 'MRN', display: 'MRN-1001' }] },
        { id: 's1', label: 'Record B', name: 'Ananya S. Rao', ageLabel: '54 y', sexLabel: 'F', identifiers: [{ system: 'mrn', label: 'MRN', display: 'MRN-1984' }] },
      ];
      const rows = [
        { id: 'name', label: 'Name', values: { s0: 'Ananya Rao', s1: 'Ananya S. Rao' }, differs: true, chosenSourceId: state.chosen['name'] },
        { id: 'phone', label: 'Phone', values: { s0: '9000000101', s1: '9000000199' }, differs: true, chosenSourceId: state.chosen['phone'] },
      ];
      return (
        <EmrMergeCompare
          model={{ sources, rows, survivorSourceId: state.survivor, canConfirm: Boolean(state.survivor && rows.every((r) => r.chosenSourceId)) }}
          onIntent={(i: EmrMergeIntent) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'survivorChosen') return { ...s, survivor: i.sourceId };
              if (i.type === 'fieldChosen') return { ...s, chosen: { ...s.chosen, [i.rowId]: i.sourceId } };
              return s;
            })
          }
        />
      );
    },
    renderLit: ({ state, update }) => {
      const sources = [
        { id: 's0', label: 'Record A', name: 'Ananya Rao', ageLabel: '54 y', sexLabel: 'F', identifiers: [{ system: 'mrn', label: 'MRN', display: 'MRN-1001' }] },
        { id: 's1', label: 'Record B', name: 'Ananya S. Rao', ageLabel: '54 y', sexLabel: 'F', identifiers: [{ system: 'mrn', label: 'MRN', display: 'MRN-1984' }] },
      ];
      const rows = [
        { id: 'name', label: 'Name', values: { s0: 'Ananya Rao', s1: 'Ananya S. Rao' }, differs: true, chosenSourceId: state.chosen['name'] },
        { id: 'phone', label: 'Phone', values: { s0: '9000000101', s1: '9000000199' }, differs: true, chosenSourceId: state.chosen['phone'] },
      ];
      return (
        <LitElementHost
          tag="emr-merge-compare"
          props={{ model: { sources, rows, survivorSourceId: state.survivor, canConfirm: Boolean(state.survivor && rows.every((r) => r.chosenSourceId)) } }}
          events={{
            intent: (raw) => {
              const i = raw as EmrMergeIntent;
              update('lit', i.type, i, (s) => {
                if (i.type === 'survivorChosen') return { ...s, survivor: i.sourceId };
                if (i.type === 'fieldChosen') return { ...s, chosen: { ...s.chosen, [i.rowId]: i.sourceId } };
                return s;
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<DraftRecordRowView[]>({
    selector: 'emr-draft-record-list',
    createInitialState: () => [
      { id: 'd1', title: 'Glaucoma Assessment', subtitle: 'Vision Centre North', patientLabel: 'Ananya Rao · 900000842', updatedAtLabel: '14-10-2026 09:40', stateBadge: { label: 'Draft', tone: 'neutral' }, canOpen: true, canMove: true, canDiscard: true },
      { id: 'd2', title: 'Spectacle Prescription', patientLabel: 'Aarav Sharma · 900000899', updatedAtLabel: '14-10-2026 09:12', stateBadge: { label: 'Queued', tone: 'info' }, canOpen: true, canMove: false, canDiscard: false },
    ],
    renderReact: ({ state, update }) => (
      <EmrDraftRecordList
        model={{ rows: state, state: state.length ? 'ready' : 'empty', message: state.length ? undefined : 'No drafts' }}
        onIntent={(i: DraftRecordListIntent) =>
          update('react', i.type, i, (s) => (i.type === 'discardRequested' ? s.filter((r) => r.id !== i.id) : s))
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-draft-record-list"
        props={{ model: { rows: state, state: state.length ? 'ready' : 'empty', message: state.length ? undefined : 'No drafts' } }}
        events={{
          intent: (raw) => {
            const i = raw as DraftRecordListIntent;
            update('lit', i.type, i, (s) => (i.type === 'discardRequested' ? s.filter((r) => r.id !== i.id) : s));
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ purpose?: string; refs: string[]; noRef: boolean; uhid: string }>({
    selector: 'emr-arrival-linker',
    createInitialState: () => ({ purpose: 'surgery', refs: ['r1'], noRef: false, uhid: '900000842' }),
    renderReact: ({ state, update }) => {
      const model: EmrArrivalLinkerModel = {
        patient: SYNTHETIC_PATIENT,
        openReferrals: [
          { id: 'r1', date: '01-10-2026', centreName: 'Vision Centre North', purpose: 'Cataract surgery', flags: ['Diabetic'], daysSinceAdviceLabel: '13 days since advice' },
        ],
        purposeOptions: [{ id: 'surgery', label: 'Surgery' }, { id: 'review', label: 'Review' }],
        selectedPurpose: state.purpose,
        selectedReferralIds: state.refs,
        noReferral: state.noRef,
        uhid: { value: state.uhid, normalisedValue: state.uhid, required: false },
        canSubmit: Boolean(state.purpose && (state.refs.length > 0 || state.noRef)),
      };
      return (
        <EmrArrivalLinker
          model={model}
          onIntent={(i) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'purposeSelected') return { ...s, purpose: i.id };
              if (i.type === 'referralToggled') return { ...s, refs: s.refs.includes(i.id) ? s.refs.filter((x) => x !== i.id) : [...s.refs, i.id], noRef: false };
              if (i.type === 'noReferralToggled') return { ...s, noRef: !s.noRef, refs: [] };
              if (i.type === 'uhidChanged') return { ...s, uhid: i.raw };
              return s;
            })
          }
        />
      );
    },
    renderLit: ({ state, update }) => {
      const model: EmrArrivalLinkerModel = {
        patient: SYNTHETIC_PATIENT,
        openReferrals: [
          { id: 'r1', date: '01-10-2026', centreName: 'Vision Centre North', purpose: 'Cataract surgery', flags: ['Diabetic'], daysSinceAdviceLabel: '13 days since advice' },
        ],
        purposeOptions: [{ id: 'surgery', label: 'Surgery' }, { id: 'review', label: 'Review' }],
        selectedPurpose: state.purpose,
        selectedReferralIds: state.refs,
        noReferral: state.noRef,
        uhid: { value: state.uhid, normalisedValue: state.uhid, required: false },
        canSubmit: Boolean(state.purpose && (state.refs.length > 0 || state.noRef)),
      };
      return (
        <LitElementHost
          tag="emr-arrival-linker"
          props={{ model }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string; id?: string; raw?: string };
              update('lit', i.type, i, (s) => {
                if (i.type === 'purposeSelected' && i.id) return { ...s, purpose: i.id };
                if (i.type === 'referralToggled' && i.id) return { ...s, refs: s.refs.includes(i.id) ? s.refs.filter((x) => x !== i.id) : [...s.refs, i.id!], noRef: false };
                if (i.type === 'noReferralToggled') return { ...s, noRef: !s.noRef, refs: [] };
                if (i.type === 'uhidChanged') return { ...s, uhid: i.raw ?? '' };
                return s;
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<{ selectedIds: string[]; date: string }>({
    selector: 'emr-spectacle-delivery',
    createInitialState: () => ({ selectedIds: ['b1'], date: '2026-10-14' }),
    renderReact: ({ state, update }) => {
      const bookings = [
        { id: 'b1', bookedDate: '05-10-2026', type: 'Distance spectacles', paidBadge: { label: 'Paid', tone: 'success' as const }, rxSummary: 'OD -1.50 / OS -1.25', daysOpenLabel: '9 days open', statusBadge: { label: 'Ready', tone: 'info' as const } },
      ];
      return (
        <EmrSpectacleDelivery
          model={{ patient: SYNTHETIC_PATIENT, bookings, selectedBookingIds: state.selectedIds, deliveryDate: state.date, canSubmit: state.selectedIds.length > 0 }}
          onIntent={(i) =>
            update('react', i.type, i, (s) =>
              i.type === 'bookingToggled'
                ? { ...s, selectedIds: s.selectedIds.includes(i.id) ? s.selectedIds.filter((x) => x !== i.id) : [...s.selectedIds, i.id] }
                : i.type === 'deliveryDateChanged'
                  ? { ...s, date: i.iso ?? '' }
                  : s,
            )
          }
        />
      );
    },
    renderLit: ({ state, update }) => {
      const bookings = [
        { id: 'b1', bookedDate: '05-10-2026', type: 'Distance spectacles', paidBadge: { label: 'Paid', tone: 'success' as const }, rxSummary: 'OD -1.50 / OS -1.25', daysOpenLabel: '9 days open', statusBadge: { label: 'Ready', tone: 'info' as const } },
      ];
      return (
        <LitElementHost
          tag="emr-spectacle-delivery"
          props={{ model: { patient: SYNTHETIC_PATIENT, bookings, selectedBookingIds: state.selectedIds, deliveryDate: state.date, canSubmit: state.selectedIds.length > 0 } }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string; id?: string; iso?: string | null };
              update('lit', i.type, i, (s) =>
                i.type === 'bookingToggled' && i.id
                  ? { ...s, selectedIds: s.selectedIds.includes(i.id) ? s.selectedIds.filter((x) => x !== i.id) : [...s.selectedIds, i.id!] }
                  : i.type === 'deliveryDateChanged'
                    ? { ...s, date: i.iso ?? '' }
                    : s,
              );
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<{ centreId?: string }>({
    selector: 'emr-booked-not-delivered-list',
    createInitialState: () => ({ centreId: undefined }),
    renderReact: ({ state, update }) => {
      const allRows: EmrBookedRow[] = [
        { bookingId: 'bk1', patientName: 'Ananya Rao', primaryIdentifier: '17-26-000842', phone: '9000000101', centreName: 'Vision Centre North', bookedDate: '02-10-2026', daysOpenLabel: '12 days open', overdueBadge: { label: 'Overdue', tone: 'danger' }, type: 'Bifocal', paidBadge: { label: 'Paid', tone: 'success' } },
        { bookingId: 'bk2', patientName: 'Aarav Sharma', primaryIdentifier: '17-26-000899', phone: '9000000102', centreName: 'Vision Centre South', bookedDate: '08-10-2026', daysOpenLabel: '6 days open', type: 'Reading', paidBadge: { label: 'Balance due', tone: 'warning' } },
      ];
      const centres = [{ id: 'c1', label: 'Vision Centre North' }, { id: 'c2', label: 'Vision Centre South' }];
      const rows = allRows.filter((r) => !state.centreId || r.centreName === centres.find((c) => c.id === state.centreId)?.label);
      return (
        <EmrBookedNotDeliveredList
          model={{ rows, filters: { centreOptions: centres, selectedCentreId: state.centreId }, page: 1, pageCount: 1, pagingSummaryLabel: `Showing ${rows.length} bookings` }}
          onIntent={(i) => update('react', i.type, i, (s) => (i.type === 'filterChanged' ? { centreId: i.centreId } : s))}
        />
      );
    },
    renderLit: ({ state, update }) => {
      const allRows: EmrBookedRow[] = [
        { bookingId: 'bk1', patientName: 'Ananya Rao', primaryIdentifier: '17-26-000842', phone: '9000000101', centreName: 'Vision Centre North', bookedDate: '02-10-2026', daysOpenLabel: '12 days open', overdueBadge: { label: 'Overdue', tone: 'danger' }, type: 'Bifocal', paidBadge: { label: 'Paid', tone: 'success' } },
        { bookingId: 'bk2', patientName: 'Aarav Sharma', primaryIdentifier: '17-26-000899', phone: '9000000102', centreName: 'Vision Centre South', bookedDate: '08-10-2026', daysOpenLabel: '6 days open', type: 'Reading', paidBadge: { label: 'Balance due', tone: 'warning' } },
      ];
      const centres = [{ id: 'c1', label: 'Vision Centre North' }, { id: 'c2', label: 'Vision Centre South' }];
      const rows = allRows.filter((r) => !state.centreId || r.centreName === centres.find((c) => c.id === state.centreId)?.label);
      return (
        <LitElementHost
          tag="emr-booked-not-delivered-list"
          props={{ model: { rows, filters: { centreOptions: centres, selectedCentreId: state.centreId }, page: 1, pageCount: 1, pagingSummaryLabel: `Showing ${rows.length} bookings` } }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string; centreId?: string };
              update('lit', i.type, i, (s) => (i.type === 'filterChanged' ? { centreId: i.centreId } : s));
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<EmrCataractEpisode>({
    selector: 'emr-cataract-episode-card',
    createInitialState: () => CATARACT_EPISODE_SEED,
    renderReact: ({ state, update }) => (
      <EmrCataractEpisodeCard episode={state} onIntent={(i) => update('react', i.type, i)} />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-cataract-episode-card"
        props={{ model: state }}
        events={{ intent: (i) => update('lit', (i as { type: string }).type, i) }}
      />
    ),
  }),

  defineParityEntry<EmrPatientHistoryModel>({
    selector: 'emr-patient-history-timeline',
    createInitialState: () => ({
      patient: SYNTHETIC_PATIENT,
      summary: {
        lastSpectacleRx: {
          date: '10-10-2026',
          re: { sph: '-1.50', cyl: '-0.50', axis: '90°', add: '+2.00' },
          le: { sph: '-1.25', cyl: '-0.75', axis: '85°', add: '+2.00' },
          type: 'Bifocal',
          statusBadge: { label: 'Delivered', tone: 'success' },
        },
        openReferrals: [],
        openBookings: [],
        openEpisodes: [CATARACT_EPISODE_SEED],
      },
      visits: [
        { id: 'v1', date: '10-10-2026', centreName: 'Vision Centre North', teamName: 'Team A', pvaRe: '6/9', pvaLe: '6/6', diagnosis: 'Pseudophakia OD', advice: 'Annual review' },
      ],
    }),
    renderReact: ({ state, update }) => (
      <EmrPatientHistoryTimeline
        model={state}
        onIntent={(i: EmrPatientHistoryIntent) => update('react', i.type, i)}
        onIdentityIntent={(i) => update('react', `identity:${i.type}`, i)}
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-patient-history-timeline"
        props={{ model: state }}
        events={{ intent: (i) => update('lit', (i as { type: string }).type, i) }}
      />
    ),
  }),

  defineParityEntry<EmrRecordDiffModel>({
    selector: 'emr-record-diff',
    createInitialState: () => ({
      title: 'Encounter Audit Diff — MRN-2026-0842',
      summaryLabel: '3 field changes by Dr. S. Iyer · 14 Oct 2026 09:42',
      kindBadges: {
        added: { label: '+ Added', tone: 'success' },
        removed: { label: '− Removed', tone: 'danger' },
        changed: { label: '~ Changed', tone: 'warning' },
      },
      sections: [
        {
          id: 'tonometry',
          label: 'Tonometry & Rx',
          changes: [
            { id: 'c1', path: ['exam', 'iopOd'], label: 'IOP (OD)', before: '18 mmHg', after: '22 mmHg', kind: 'changed' },
            { id: 'c2', path: ['rx', 0], label: 'Prednisolone 1% drops', before: 'QID OD', kind: 'removed' },
            { id: 'c3', path: ['rx', 1], label: 'Nepafenac 0.1% drops', after: 'TDS OD', kind: 'added' },
          ],
        },
      ],
    }),
    renderReact: ({ state, update }) => <EmrRecordDiff model={state} onIntent={(i) => update('react', i.type, i)} />,
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-record-diff"
        props={{ model: state }}
        events={{ intent: (i) => update('lit', (i as { type: string }).type, i) }}
      />
    ),
  }),

  defineParityEntry<EmrUploadQueueItem[]>({
    selector: 'emr-upload-queue',
    createInitialState: () => [
      { id: 'u1', name: 'biometry-iolmaster.pdf', sizeLabel: '180 KB', status: { label: 'Ready', tone: 'success' }, progress: 100 },
      { id: 'u2', name: 'b-scan-ultrasound.png', sizeLabel: '640 KB', status: { label: 'Failed', tone: 'danger' }, progress: 60, error: 'Upload interrupted.' },
    ],
    renderReact: ({ state, update }) => (
      <EmrUploadQueue
        model={{
          label: 'Attach diagnostic files',
          accept: 'application/pdf,image/*',
          acceptDescription: 'PDF or images',
          multiple: true,
          items: state,
          canPublish: state.length > 0 && state.every((i) => i.status.tone === 'success'),
        }}
        onIntent={(i: EmrUploadQueueIntent) =>
          update('react', i.type, i, (s) => {
            if (i.type === 'removeRequested') return s.filter((x) => x.id !== i.id);
            if (i.type === 'retryRequested') return s.map((x) => (x.id === i.id ? { ...x, status: { label: 'Ready', tone: 'success' }, progress: 100, error: undefined } : x));
            return s;
          })
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-upload-queue"
        props={{
          model: {
            label: 'Attach diagnostic files',
            accept: 'application/pdf,image/*',
            acceptDescription: 'PDF or images',
            multiple: true,
            items: state,
            canPublish: state.length > 0 && state.every((i) => i.status.tone === 'success'),
          },
        }}
        events={{
          intent: (raw) => {
            const i = raw as EmrUploadQueueIntent;
            update('lit', i.type, i, (s) => {
              if (i.type === 'removeRequested') return s.filter((x) => x.id !== i.id);
              if (i.type === 'retryRequested') return s.map((x) => (x.id === i.id ? { ...x, status: { label: 'Ready', tone: 'success' }, progress: 100, error: undefined } : x));
              return s;
            });
          },
        }}
      />
    ),
  }),

  // ---- Charts, Auth & Mobile Status Surfaces (6) -----------------------------------------
  defineParityEntry<EmrBarChartModel>({
    selector: 'emr-bar-chart',
    createInitialState: () => ({
      title: 'Weekly Screenings per Vision Centre',
      description: 'Current week vs previous week.',
      yAxisLabel: 'Patients',
      categories: [
        { id: 'vcn', label: 'VC North' },
        { id: 'vcs', label: 'VC South' },
        { id: 'dh', label: 'District Hub' },
      ],
      series: [
        { id: 'cur', label: 'This week', values: { vcn: 142, vcs: 98, dh: 175 } },
        { id: 'prev', label: 'Last week', values: { vcn: 128, vcs: 104, dh: 160 } },
      ],
    }),
    renderReact: ({ state, update }) => <EmrBarChart model={state} onIntent={(i: EmrChartIntent) => update('react', i.type, i)} />,
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-bar-chart"
        props={{ model: state }}
        events={{ intent: (i) => update('lit', (i as EmrChartIntent).type, i) }}
      />
    ),
  }),

  defineParityEntry<null>({
    selector: 'emr-funnel-chart',
    createInitialState: () => null,
    renderReact: ({ update }) => (
      <EmrFunnelChart
        model={{
          title: 'Cataract Surgical Pathway Conversion',
          description: 'Outreach camp referrals through Week-4 post-op follow-up.',
          steps: [
            { id: 'ref', label: 'Referred', value: 400, valueLabel: '400' },
            { id: 'arr', label: 'Arrived at hub', value: 320, valueLabel: '320', conversionLabel: '80% of referred' },
            { id: 'op', label: 'Operated', value: 288, valueLabel: '288', conversionLabel: '90% of arrived' },
            { id: 'fu', label: 'Week-4 follow-up', value: 230, valueLabel: '230', conversionLabel: '80% of operated' },
          ],
        }}
        onIntent={(i) => update('react', i.type, i)}
      />
    ),
    renderLit: ({ update }) => (
      <LitElementHost
        tag="emr-funnel-chart"
        props={{
          model: {
            title: 'Cataract Surgical Pathway Conversion',
            description: 'Outreach camp referrals through Week-4 post-op follow-up.',
            steps: [
              { id: 'ref', label: 'Referred', value: 400, valueLabel: '400' },
              { id: 'arr', label: 'Arrived at hub', value: 320, valueLabel: '320', conversionLabel: '80% of referred' },
              { id: 'op', label: 'Operated', value: 288, valueLabel: '288', conversionLabel: '90% of arrived' },
              { id: 'fu', label: 'Week-4 follow-up', value: 230, valueLabel: '230', conversionLabel: '80% of operated' },
            ],
          },
        }}
        events={{ intent: (i) => update('lit', (i as { type: string }).type, i) }}
      />
    ),
  }),

  defineParityEntry<{ digits: string; statusMsg: string }>({
    selector: 'emr-pin-pad',
    createInitialState: () => ({ digits: '12', statusMsg: 'Demo unlock PIN is 1234' }),
    renderReact: ({ state, update }) => {
      const model: EmrPinPadModel = {
        mode: 'unlock',
        length: 4,
        digitsEntered: state.digits.length,
        title: 'Quick Session Unlock',
        prompt: state.statusMsg,
        biometric: { label: 'Use biometric unlock', available: true },
      };
      return (
        <EmrPinPad
          model={model}
          showForgot
          onIntent={(i) =>
            update('react', i.type, i, (s) => {
              if (i.type === 'digitPressed') return { ...s, digits: s.digits.length < 4 ? s.digits + i.digit : s.digits };
              if (i.type === 'deleted') return { ...s, digits: s.digits.slice(0, -1) };
              if (i.type === 'submitted') return { digits: '', statusMsg: s.digits === '1234' ? 'Unlocked!' : 'Incorrect PIN (try 1234)' };
              return { ...s, statusMsg: `${i.type} triggered` };
            })
          }
        />
      );
    },
    renderLit: ({ state, update }) => {
      const model: EmrPinPadModel = {
        mode: 'unlock',
        length: 4,
        digitsEntered: state.digits.length,
        title: 'Quick Session Unlock',
        prompt: state.statusMsg,
        biometric: { label: 'Use biometric unlock', available: true },
      };
      return (
        <LitElementHost
          tag="emr-pin-pad"
          props={{ model, showForgot: true }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string; digit?: string };
              update('lit', i.type, i, (s) => {
                if (i.type === 'digitPressed' && i.digit) return { ...s, digits: s.digits.length < 4 ? s.digits + i.digit : s.digits };
                if (i.type === 'deleted') return { ...s, digits: s.digits.slice(0, -1) };
                if (i.type === 'submitted') return { digits: '', statusMsg: s.digits === '1234' ? 'Unlocked!' : 'Incorrect PIN (try 1234)' };
                return { ...s, statusMsg: `${i.type} triggered` };
              });
            },
          }}
        />
      );
    },
  }),

  defineParityEntry<EmrLoginFormModel>({
    selector: 'emr-login-form',
    createInitialState: () => ({
      title: 'Clinician Sign-In',
      username: 'dr.iyer',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
    }),
    renderReact: ({ state, update }) => (
      <EmrLoginForm
        model={state}
        onIntent={(i) =>
          update('react', i.type, i, (m) =>
            i.type === 'usernameChanged'
              ? { ...m, username: i.value, error: undefined }
              : { ...m, error: `Demo sign-in submitted for ${i.username}` },
          )
        }
      />
    ),
    renderLit: ({ state, update }) => (
      <LitElementHost
        tag="emr-login-form"
        props={{ model: state }}
        events={{
          intent: (raw) => {
            const i = raw as { type: 'usernameChanged'; value: string } | { type: 'submitted'; username: string };
            update('lit', i.type, i, (m) =>
              i.type === 'usernameChanged'
                ? { ...m, username: i.value, error: undefined }
                : { ...m, error: `Demo sign-in submitted for ${i.username}` },
            );
          },
        }}
      />
    ),
  }),

  defineParityEntry<{ detailsOpened: number }>({
    selector: 'emr-sync-pill',
    createInitialState: () => ({ detailsOpened: 0 }),
    renderReact: ({ state, readOnly, update }) => (
      <EmrSyncPill
        model={{
          label: '3 records waiting',
          tone: 'warning',
          detail: `Last sync 09:30 (inspected ${state.detailsOpened}×)`,
        }}
        onIntent={readOnly ? undefined : (i) => update('react', i.type, i, (s) => ({ detailsOpened: s.detailsOpened + 1 }))}
      />
    ),
    renderLit: ({ state, readOnly, update }) => (
      <LitElementHost
        tag="emr-sync-pill"
        props={{
          model: {
            label: '3 records waiting',
            tone: 'warning',
            detail: `Last sync 09:30 (inspected ${state.detailsOpened}×)`,
          },
          interactive: !readOnly,
        }}
        events={{
          intent: (i) => update('lit', 'intent', i, (s) => ({ detailsOpened: s.detailsOpened + 1 })),
        }}
      />
    ),
  }),

  defineParityEntry<{ toast: EmrToastModel | null }>({
    selector: 'emr-toast',
    createInitialState: () => ({
      toast: { id: 't-1', message: '3 offline camp records queued for sync.', tone: 'warning', actionLabel: 'Sync now' },
    }),
    renderReact: ({ state, update }) => (
      <View style={{ minHeight: 130, gap: 8 }}>
        {!state.toast ? (
          <EmrButton
            variant="outline"
            label="Re-queue toast"
            onPress={() =>
              update('react', 'requeue', {}, () => ({
                toast: { id: 't-1', message: '3 offline camp records queued for sync.', tone: 'warning', actionLabel: 'Sync now' },
              }))
            }
          />
        ) : null}
        <EmrToast
          model={state.toast}
          onIntent={(i) => update('react', i.type, i, (s) => (i.type === 'dismissed' ? { toast: null } : s))}
        />
      </View>
    ),
    renderLit: ({ state, update }) => (
      <View style={{ minHeight: 130, gap: 8 }}>
        {!state.toast ? (
          <EmrButton
            variant="outline"
            label="Re-queue toast"
            onPress={() =>
              update('lit', 'requeue', {}, () => ({
                toast: { id: 't-1', message: '3 offline camp records queued for sync.', tone: 'warning', actionLabel: 'Sync now' },
              }))
            }
          />
        ) : null}
        <LitElementHost
          tag="emr-toast"
          props={{ model: state.toast }}
          events={{
            intent: (raw) => {
              const i = raw as { type: string };
              update('lit', i.type, i, (s) => (i.type === 'dismissed' ? { toast: null } : s));
            },
          }}
        />
      </View>
    ),
  }),
];
