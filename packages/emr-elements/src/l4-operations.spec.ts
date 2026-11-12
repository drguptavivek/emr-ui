// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  registerL4OperationsElements,
  type EmrWorkQueueElement,
  type EmrPatientDocumentsElement,
  type EmrHierarchyOrderPickerElement,
  type EmrArrivalLinkerElement,
  type EmrAppShellElement,
  type EmrUploadQueueElement,
  type EmrDocumentViewerElement,
} from './l4-operations.js';

const mounted: HTMLElement[] = [];
async function mount<
  T extends HTMLElement & { updateComplete: Promise<boolean> },
>(tag: string, properties: Partial<T>) {
  const element = Object.assign(document.createElement(tag) as T, properties);
  mounted.push(element);
  document.body.append(element);
  await element.updateComplete;
  return element;
}
function collect(element: HTMLElement) {
  const intents: unknown[] = [];
  element.addEventListener('intent', (e) =>
    intents.push((e as CustomEvent).detail),
  );
  return intents;
}
afterEach(() => {
  for (const element of mounted.splice(0)) element.remove();
});

describe('Lit operations', () => {
  it('renders shell slots and forwards controlled navigation', async () => {
    registerL4OperationsElements();
    const shell = await mount<EmrAppShellElement>('emr-app-shell', {
      model: {
        topBar: {
          title: 'Clinic',
          search: { query: '', open: false, groups: [] },
        },
        nav: {
          items: [{ id: 'patients', label: 'Patients' }],
          expandedIds: [],
        },
        navOpen: true,
      },
    });
    const intents = collect(shell);
    const nav = shell.shadowRoot!.querySelector('emr-left-nav')!;
    await nav.updateComplete;
    nav.shadowRoot!.querySelector('button')!.click();
    expect(intents).toEqual([{ type: 'itemSelected', itemId: 'patients' }]);
    expect(shell.shadowRoot!.querySelector('main slot')).not.toBeNull();
  });
  it('renders document errors and only allows permitted effects and valid pages', async () => {
    registerL4OperationsElements();
    const el = await mount<EmrPatientDocumentsElement>(
      'emr-patient-documents',
      {
        model: {
          instanceId: 'a',
          label: 'Documents',
          query: '',
          documents: [
            {
              id: 'd',
              title: 'Report',
              categoryId: 'c',
              categoryLabel: 'Tests',
              folderId: 'f',
              folderLabel: 'Visits',
              fileName: 'r.pdf',
              mediaTypeLabel: 'PDF',
              sizeLabel: '1 KB',
              createdAt: '2026-01-01',
              createdAtLabel: 'Today',
              canPreview: true,
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
          error: 'Failed',
        },
      },
    );
    const intents = collect(el);
    const buttons = [...el.shadowRoot!.querySelectorAll('button')];
    buttons.find((b) => b.textContent === 'Preview')!.click();
    buttons.find((b) => b.textContent === 'Retry')!.click();
    buttons.find((b) => b.textContent === 'Next')!.click();
    expect(intents).toEqual([
      { type: 'previewRequested', documentId: 'd' },
      { type: 'retryRequested' },
    ]);
    expect(el.shadowRoot!.textContent).toContain('Failed');
    expect(buttons.some((b) => b.textContent === 'Delete')).toBe(false);
  });
  it('reflects initial and updated document filters, falling back for stale values', async () => {
    registerL4OperationsElements();
    const model = {
      instanceId: 'filters',
      label: 'Documents',
      query: '',
      category: 'results',
      categoryOptions: [{ value: 'results', label: 'Results' }],
      folder: 'opd',
      folderOptions: [{ value: 'opd', label: 'OPD' }],
      documents: [],
      page: 1,
      pageSize: 10,
      total: 0,
    };
    const el = await mount<EmrPatientDocumentsElement>(
      'emr-patient-documents',
      { model },
    );
    let selects = el.shadowRoot!.querySelectorAll('select');
    expect([selects[0]!.value, selects[1]!.value]).toEqual(['results', 'opd']);
    el.model = { ...model, category: 'stale', folder: 'all' };
    await el.updateComplete;
    selects = el.shadowRoot!.querySelectorAll('select');
    expect([selects[0]!.value, selects[1]!.value]).toEqual(['all', 'all']);
  });
  it('renders authorized raster data URLs', async () => {
    registerL4OperationsElements();
    const url = 'data:image/png;base64,aGVsbG8=';
    const el = await mount<EmrDocumentViewerElement>('emr-document-viewer', {
      model: {
        instanceId: 'viewer',
        open: true,
        documentIndex: 0,
        documentCount: 1,
        pageIndex: 0,
        page: {
          assetId: 'asset',
          documentId: 'd',
          pageIndex: 0,
          pageLabel: '1',
          rasterUrl: url,
          altText: 'Page',
        },
        loading: false,
        canPreviousDocument: false,
        canNextDocument: false,
        canPreviousPage: false,
        canNextPage: false,
      },
    });
    expect(el.shadowRoot!.querySelector('img')?.getAttribute('src')).toBe(url);
  });
  it('rejects unsafe preview URLs and respects navigation bounds', async () => {
    registerL4OperationsElements();
    const el = await mount<EmrDocumentViewerElement>('emr-document-viewer', {
      model: {
        instanceId: 'viewer',
        open: true,
        documentIndex: 0,
        documentCount: 1,
        pageIndex: 0,
        page: {
          assetId: 'asset',
          documentId: 'd',
          pageIndex: 0,
          pageLabel: '1',
          rasterUrl: 'javascript:alert(1)',
          altText: 'Page',
        },
        loading: false,
        canPreviousDocument: false,
        canNextDocument: false,
        canPreviousPage: false,
        canNextPage: false,
      },
    });
    const intents = collect(el);
    expect(el.shadowRoot!.querySelector('img')).toBeNull();
    expect(el.shadowRoot!.textContent).toContain('Preview unavailable');
    [...el.shadowRoot!.querySelectorAll('button')]
      .find((b) => b.textContent === 'Next page')!
      .click();
    expect(intents).toEqual([]);
  });
  it('shows order group preview and emits its confirmation', async () => {
    registerL4OperationsElements();
    const el = await mount<EmrHierarchyOrderPickerElement>(
      'emr-hierarchy-order-picker',
      {
        model: {
          title: 'Orders',
          query: '',
          roots: [],
          selected: [],
          loading: false,
          preview: {
            groupId: 'g',
            groupLabel: 'Panel',
            items: [{ catalogueId: 'a', label: 'Test' }],
            duplicateIds: ['a'],
          },
        },
      },
    );
    const intents = collect(el);
    [...el.shadowRoot!.querySelectorAll('button')]
      .find((b) => b.textContent === 'Add group')!
      .click();
    expect(intents).toEqual([{ type: 'groupAddConfirmed', groupId: 'g' }]);
    expect(el.shadowRoot!.textContent).toContain('duplicate');
  });
  it('prevents queue mutation while read only and preserves empty state', async () => {
    registerL4OperationsElements();
    const el = await mount<EmrWorkQueueElement>('emr-work-queue', {
      model: {
        id: 'q',
        title: 'Queue',
        stations: [
          {
            id: 's',
            label: 'Desk',
            countLabel: '0 waiting',
            cards: [],
            canCallNext: true,
          },
        ],
        moveTargets: [],
        emptyMessage: 'No patients',
        readOnly: true,
      },
    });
    const intents = collect(el);
    [...el.shadowRoot!.querySelectorAll('button')]
      .find((b) => b.textContent === 'Call next')!
      .click();
    expect(intents).toEqual([]);
    expect(el.shadowRoot!.textContent).toContain('No patients');
  });
  it('uses host submission eligibility for arrival and upload', async () => {
    registerL4OperationsElements();
    const arrival = await mount<EmrArrivalLinkerElement>('emr-arrival-linker', {
      model: {
        patient: { name: 'A', ageLabel: '40', sexLabel: 'F', identifiers: [] },
        openReferrals: [],
        purposeOptions: [],
        selectedReferralIds: [],
        noReferral: false,
        canSubmit: false,
      },
    });
    const upload = await mount<EmrUploadQueueElement>('emr-upload-queue', {
      model: { label: 'Uploads', items: [], canPublish: false },
    });
    const intents = collect(arrival);
    const uploads = collect(upload);
    [...arrival.shadowRoot!.querySelectorAll('button')]
      .find((b) => b.textContent === 'Submit')!
      .click();
    [...upload.shadowRoot!.querySelectorAll('button')]
      .find((b) => b.textContent === 'Publish')!
      .click();
    expect(intents).toEqual([]);
    expect(uploads).toEqual([]);
  });
});
