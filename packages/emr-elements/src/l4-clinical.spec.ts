// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { registerL3Elements } from './l3-structures.js';
import { registerL4ClinicalElements, type EmrStagedChecklistElement, type EmrSpectaclePrescriptionElement, type EmrClinicalAnnotationCanvasElement, type EmrMedicationReconciliationElement, type EmrDiagnosticResultSummaryElement } from './l4-clinical.js';

registerL3Elements();
registerL4ClinicalElements();
const mounted: HTMLElement[] = [];
async function mount<T extends HTMLElement & { updateComplete: Promise<boolean> }>(tag: string, properties: Partial<T>) {
  const element = Object.assign(document.createElement(tag) as T, properties);
  mounted.push(element); document.body.append(element); await element.updateComplete; return element;
}
function intents(element: HTMLElement) {
  const result: unknown[] = []; element.addEventListener('intent', event => result.push((event as CustomEvent).detail)); return result;
}
afterEach(() => { for (const element of mounted.splice(0)) element.remove(); });

it('proposes checklist responses and notes without mutating the snapshot, and locks edits', async () => {
  const model = { instanceId: 'test', schema: { id: 's', label: 'Safety', phases: [{ id: 'p', label: 'Phase', items: [{ id: 'check', label: 'Checked', type: 'checkbox' as const }, { id: 'answer', label: 'Answer', type: 'yes-no' as const, requiresNoteWhen: ['yes'] }] }] }, activePhaseId: 'p', items: { check: { value: false }, answer: { value: 'yes', note: 'Original' } } };
  const element = await mount<EmrStagedChecklistElement>('emr-staged-checklist', { model }); const events = intents(element);
  element.shadowRoot!.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
  const note = element.shadowRoot!.querySelector('textarea')!; note.value = 'Changed'; note.dispatchEvent(new Event('input'));
  expect(events).toEqual([{ type: 'itemResponseRequested', itemId: 'check', value: true }, { type: 'itemNoteRequested', itemId: 'answer', note: 'Changed' }]);
  expect(model.items.check.value).toBe(false); expect(model.items.answer.note).toBe('Original');
  element.model = { ...model, readOnly: true }; await element.updateComplete;
  expect(element.shadowRoot!.querySelector<HTMLInputElement>('input[type=checkbox]')!.disabled).toBe(true);
});

it('shows only supplied VA equivalents and emits an eye-specific prescription edit', async () => {
  const model = { id: 'rx', label: 'Prescription', fields: [{ id: 'sphere', label: 'Sphere', type: 'decimal' as const }], eyes: [{ id: 'od', label: 'Right eye' }, { id: 'os', label: 'Left eye' }], values: { od: { sphere: '-1' }, os: { sphere: '2' } }, logMarEquivalents: { od: '0.2' } };
  const element = await mount<EmrSpectaclePrescriptionElement>('emr-spectacle-prescription', { model }); const events = intents(element);
  expect(element.shadowRoot!.textContent).toContain('LogMAR: 0.2'); expect(element.shadowRoot!.textContent!.match(/LogMAR:/g)).toHaveLength(1);
  const input = element.shadowRoot!.querySelector<HTMLInputElement>('tbody input')!; input.value = '-2'; input.dispatchEvent(new Event('input'));
  expect(events).toEqual([{ type: 'cellEditRequested', eyeId: 'od', fieldId: 'sphere', value: '-2' }]); expect(model.values.od.sphere).toBe('-1');
  element.model = { ...model, readOnly: true }; await element.updateComplete; expect(element.shadowRoot!.querySelector<HTMLInputElement>('tbody input')!.readOnly).toBe(true);
});

it('renders the supplied annotation and proposes a layer visibility change without modifying it', async () => {
  const model = { instanceId: 'a', title: 'Drawing', imageTemplates: [{ id: 'img', label: 'Image', imageUrl: 'https://example.test/a.png', width: 100, height: 100 }], availableLabels: [], selectedImageId: 'img', brushColor: '#ff0000', layers: [{ id: 'one', label: 'Line', tool: 'line' as const, color: '#ff0000', strokeWidth: 2, visible: true, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] as const }] };
  const element = await mount<EmrClinicalAnnotationCanvasElement>('emr-clinical-annotation-canvas', { model }); const events = intents(element);
  expect(element.shadowRoot!.querySelector('svg image')?.getAttribute('href')).toBe('https://example.test/a.png'); expect(element.shadowRoot!.querySelector('svg polyline')?.getAttribute('points')).toBe('0,0 100,100');
  [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Toggle visibility')!.click();
  expect(events).toMatchObject([{ type: 'stateChanged', reason: 'layer-visibility:one:false', state: { layers: [{ id: 'one', visible: false }] } }]); expect(model.layers[0].visible).toBe(true);
  element.model = { ...model, readOnly: true }; await element.updateComplete; expect([...element.shadowRoot!.querySelectorAll('button')].some(b => b.textContent?.trim() === 'Toggle visibility')).toBe(false);
});

it('preserves reconciliation paths, decisions and read-only restrictions', async () => {
  const model = { id: 'r', title: 'Reconcile', leftLabel: 'Home', rightLabel: 'Ward', rows: [{ id: 'one', path: ['medications', 0], left: { id: 'med', nameLabel: 'Medicine', doseSummary: 'One daily' }, decisionOptions: [{ value: 'continue', label: 'Continue' }], reasonRequired: true }], emptyMessage: 'No medicines', canComplete: false };
  const element = await mount<EmrMedicationReconciliationElement>('emr-medication-reconciliation', { model }); const events = intents(element);
  const select = element.shadowRoot!.querySelector('select')!; select.value = 'continue'; select.dispatchEvent(new Event('change'));
  const reason = element.shadowRoot!.querySelector('textarea')!; reason.value = 'Confirmed'; reason.dispatchEvent(new Event('input'));
  expect(events).toEqual([{ type: 'decisionChangeRequested', path: ['medications', 0], decision: 'continue' }, { type: 'reasonChangeRequested', path: ['medications', 0], reason: 'Confirmed' }]);
  expect([...element.shadowRoot!.querySelectorAll('button')].find(b => b.textContent === 'Complete reconciliation')!.disabled).toBe(true);
  element.model = { ...model, readOnly: true }; await element.updateComplete; expect(element.shadowRoot!.querySelector('select')!.disabled).toBe(true);
});

it('renders diagnostic loading and retry instead of stale result data', async () => {
  const model = { id: 'd', title: 'Result', metadata: [], metrics: [{ id: 'm', label: 'Value', valueLabel: '5' }], loading: true };
  const element = await mount<EmrDiagnosticResultSummaryElement>('emr-diagnostic-result-summary', { model }); const events = intents(element);
  expect(element.shadowRoot!.textContent).toContain('Loading result'); expect(element.shadowRoot!.textContent).not.toContain('Value: 5');
  element.model = { ...model, loading: false, error: 'Unavailable' }; await element.updateComplete;
  [...element.shadowRoot!.querySelectorAll('button')].find(button => button.textContent === 'Try again')!.click(); expect(events).toEqual([{ type: 'retryRequested', resultId: 'd' }]);
});

it('proposes normalized annotation geometry and rejects script URLs', async () => {
  const model = { instanceId: 'a', title: 'Drawing', imageTemplates: [{ id: 'img', label: 'Image', imageUrl: 'https://example.test/a.png', width: 100, height: 200 }], availableLabels: [], selectedImageId: 'img', selectedTool: 'line' as const, brushColor: '#112233', layers: [] };
  const element = await mount<EmrClinicalAnnotationCanvasElement>('emr-clinical-annotation-canvas', { model }); const events = intents(element);
  const svg = element.shadowRoot!.querySelector('svg')!;
  svg.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 200, right: 110, bottom: 220, x: 10, y: 20, toJSON: () => ({}) });
  svg.dispatchEvent(new MouseEvent('pointerdown', { clientX: 35, clientY: 70, button: 0 }));
  svg.dispatchEvent(new MouseEvent('pointerup', { clientX: 85, clientY: 170, button: 0 }));
  expect(events).toMatchObject([{ type: 'stateChanged', reason: 'line-added', state: { layers: [{ tool: 'line', points: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.75 }] }] } }]); expect(model.layers).toEqual([]);
  element.model = { ...model, imageTemplates: [{ ...model.imageTemplates[0], imageUrl: 'javascript:alert(1)' }] }; await element.updateComplete;
  expect(element.shadowRoot!.querySelector('image')).toBeNull(); expect(element.shadowRoot!.textContent).toContain('Image unavailable');
});

it('allows keyboard annotation without committing the draft to the model', async () => {
  const model = { instanceId: 'a', title: 'Drawing', imageTemplates: [{ id: 'img', label: 'Image', imageUrl: 'https://example.test/a.png', width: 100, height: 100 }], availableLabels: [], selectedImageId: 'img', selectedTool: 'line' as const, brushColor: '#112233', layers: [] };
  const element = await mount<EmrClinicalAnnotationCanvasElement>('emr-clinical-annotation-canvas', { model }); const events = intents(element); const svg = element.shadowRoot!.querySelector('svg')!;
  svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  expect(events).toMatchObject([{ type: 'stateChanged', reason: 'line-added', state: { layers: [{ points: [{ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.5 }] }] } }]); expect(model.layers).toEqual([]);
});

it.each(['image', 'record', 'tool', 'lock'])('discards a pointer draft after %s changes even before rendering', async change => {
  const image = { id: 'od', label: 'Right', imageUrl: 'https://example.test/od.png', width: 100, height: 100 };
  const model = { instanceId: 'record', title: 'Drawing', imageTemplates: [image, { ...image, id: 'os', label: 'Left', imageUrl: 'https://example.test/os.png' }], availableLabels: [], selectedImageId: 'od', selectedTool: 'line' as const, brushColor: '#112233', layers: [] };
  const element = await mount<EmrClinicalAnnotationCanvasElement>('emr-clinical-annotation-canvas', { model }); const events = intents(element);
  const svg = element.shadowRoot!.querySelector('svg')!;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
  svg.dispatchEvent(new MouseEvent('pointerdown', { clientX: 25, clientY: 25, button: 0 }));
  if (change === 'image') element.model = { ...model, selectedImageId: 'os' };
  if (change === 'record') element.model = { ...model, instanceId: 'another' };
  if (change === 'tool') element.model = { ...model, selectedTool: 'arrow' };
  if (change === 'lock') element.model = { ...model, readOnly: true };
  element.model = model;
  svg.dispatchEvent(new MouseEvent('pointerup', { clientX: 75, clientY: 75, button: 0 }));
  await element.updateComplete;
  expect(events).toEqual([]);
  expect(element.shadowRoot!.querySelectorAll('polyline')).toHaveLength(0);
});

it('hands selected photos to the host without reading them and suppresses locked selection', async () => {
  const model = { instanceId: 'photo', title: 'Photo', imageTemplates: [], availableLabels: [], brushColor: '#112233', layers: [], photoUploadHint: 'Choose an eye photo', photoAccept: 'image/png' };
  const element = await mount<EmrClinicalAnnotationCanvasElement>('emr-clinical-annotation-canvas', { model }); const events: unknown[] = [];
  element.addEventListener('nativeFilesSelected', event => events.push((event as CustomEvent).detail));
  const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type=file]')!;
  expect(input.accept).toBe('image/png'); expect(element.shadowRoot!.textContent).toContain('Choose an eye photo');
  const file = new File(['image'], 'eye.png', { type: 'image/png' }); Object.defineProperty(input, 'files', { configurable: true, value: [file] }); input.dispatchEvent(new Event('change'));
  expect(events).toEqual([[file]]); expect(model.imageTemplates).toEqual([]);
  element.model = { ...model, readOnly: true }; input.dispatchEvent(new Event('change')); expect(events).toHaveLength(1);
  await element.updateComplete; expect(element.shadowRoot!.querySelector('input[type=file]')).toBeNull();
});

it('ignores release from another pointer and stale surface pointerdown', async () => {
  const image = { id: 'od', label: 'Right', imageUrl: 'https://example.test/od.png', width: 100, height: 100 };
  const model = { instanceId: 'record', title: 'Drawing', imageTemplates: [image, { ...image, id: 'os' }], availableLabels: [], selectedImageId: 'od', selectedTool: 'line' as const, brushColor: '#112233', layers: [] };
  const element = await mount<EmrClinicalAnnotationCanvasElement>('emr-clinical-annotation-canvas', { model }); const events = intents(element); const svg = element.shadowRoot!.querySelector('svg')!;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
  const pointer = (type: string, id: number) => { const event = new MouseEvent(type, { clientX: 50, clientY: 50, button: 0 }); Object.defineProperty(event, 'pointerId', { value: id }); svg.dispatchEvent(event); };
  pointer('pointerdown', 1); pointer('pointerup', 2); expect(events).toEqual([]);
  element.model = { ...model, selectedImageId: 'os' }; pointer('pointerdown', 1); pointer('pointerup', 1); expect(events).toEqual([]);
});
