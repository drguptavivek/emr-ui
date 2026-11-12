// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import type { NoteCaptureViewModel } from '@drguptavivek/emr-controller';
import { registerL3Elements } from './l3-structures.js';
import {
  registerL4ObservationElements,
  type EmrCaptureStatusBarElement,
  type EmrClinicalTranscriptElement,
  type EmrEvidenceSuggestionListElement,
  type EmrObservationFlowsheetElement,
  type EmrObservationTrendElement,
} from './l4-observations.js';

const mounted: HTMLElement[] = [];
async function mount<T extends HTMLElement & { updateComplete: Promise<boolean> }>(tag: string, props: Partial<T>) {
  registerL3Elements();
  registerL4ObservationElements();
  const el = Object.assign(document.createElement(tag) as T, props);
  mounted.push(el);
  document.body.append(el);
  await el.updateComplete;
  const intents: unknown[] = [];
  el.addEventListener('intent', (event) => intents.push((event as CustomEvent).detail));
  return { el, intents };
}

function click(el: HTMLElement, name: string) {
  const button = [...el.shadowRoot!.querySelectorAll('button')].find((item) => item.textContent?.trim() === name);
  if (!button) throw new Error(`Missing button: ${name}`);
  button.click();
}

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove();
});

it('renders supplied observation states and prevents a stale edit after lock', async () => {
  const { el, intents } = await mount<EmrObservationFlowsheetElement>('emr-observation-flowsheet', { model: {
    id: 'sheet', title: 'Observations', emptyMessage: 'No observations',
    columns: [{ id: 'morning', label: '08:00' }],
    rows: [{ id: 'metric', label: 'Observation' }, { id: 'missing', label: 'Review' }],
    cells: {
      metric: { morning: { valueLabel: '42', editable: true, flag: { label: 'Supplied flag', tone: 'warning' } } },
      missing: { morning: { valueLabel: null, status: 'declined' } },
    },
  } });
  expect(el.shadowRoot!.textContent).toContain('declined');
  expect(el.shadowRoot!.querySelector('emr-badge')!.badge.label).toBe('Supplied flag');
  click(el, '42');
  el.model = { ...el.model!, readOnly: true };
  click(el, '42');
  expect(intents).toEqual([{ type: 'cellSelected', rowId: 'metric', columnId: 'morning' }]);
});

it('draws controller-supplied trend points and emits their stable IDs', async () => {
  const { el, intents } = await mount<EmrObservationTrendElement>('emr-observation-trend', { model: {
    id: 'trend', title: 'Trend', emptyMessage: 'No observations', summaryText: 'Fixture trend', yLabel: 'Units',
    xMin: 0, xMax: 2, yMin: 0, yMax: 10, xTicks: [], yTicks: [],
    series: [{ id: 'series', label: 'Series', tone: 'info', points: [{ id: 'point', x: 1, y: 5, xLabel: 'Today', valueLabel: '5 units' }] }],
  } });
  const point = el.shadowRoot!.querySelector('circle')!;
  expect(point.namespaceURI).toBe('http://www.w3.org/2000/svg');
  click(el, '5 units');
  expect(intents).toEqual([{ type: 'pointSelected', seriesId: 'series', pointId: 'point' }]);
});

const note: NoteCaptureViewModel = {
  id: 'note', title: 'Transcript',
  dictation: { status: 'idle', label: 'Ready', canStart: true, canStop: false },
  segments: [{ id: 'segment', text: 'Fixture evidence', startMs: null, endMs: null, source: 'typed', timeLabel: '' }],
  spans: [{ id: 'span', segmentId: 'segment', start: 8, end: 16, suggestionIds: ['suggestion'] }],
  suggestions: [{ id: 'suggestion', path: ['fixture'], fieldLabel: 'Fixture field', value: 'Initial', valueLabel: 'Initial', valueType: 'text', spanIds: ['span'], status: 'pending' }],
  highlightedSpanIds: [], highlightedSuggestionIds: [], canSummarise: true,
};

it('links transcript evidence and commits an edited suggestion only on Apply', async () => {
  const transcript = await mount<EmrClinicalTranscriptElement>('emr-clinical-transcript', { model: note });
  click(transcript.el, 'evidence');
  expect(transcript.intents).toEqual([{ type: 'spanSelected', spanId: 'span' }]);

  const suggestions = await mount<EmrEvidenceSuggestionListElement>('emr-evidence-suggestion-list', { model: note });
  const field = suggestions.el.shadowRoot!.querySelector('emr-typed-field')!;
  field.dispatchEvent(new CustomEvent('valueChange', { detail: 'Revised', bubbles: true, composed: true }));
  expect(suggestions.intents).toEqual([]);
  suggestions.el.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  expect(suggestions.intents).toEqual([{ type: 'suggestionEdited', suggestionId: 'suggestion', value: 'Revised' }]);
  expect(note.suggestions[0]!.value).toBe('Initial');
});

it('renders capture status and rechecks permissions before sending save', async () => {
  const { el, intents } = await mount<EmrCaptureStatusBarElement>('emr-capture-status-bar', { model: {
    session: { dirty: true, saving: false, savedAt: null, conflict: null, error: null },
  } });
  expect(el.shadowRoot!.textContent).toContain('Unsaved changes');
  click(el, 'Save');
  el.model = { ...el.model!, readOnly: true };
  click(el, 'Save');
  expect(intents).toEqual([{ type: 'saveRequested' }]);
});
