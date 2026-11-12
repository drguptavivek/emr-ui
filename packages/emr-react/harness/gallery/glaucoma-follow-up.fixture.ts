import type { GlaucomaFollowUpEncounter, GlaucomaFollowUpRepository } from '@drguptavivek/emr-controller';

export const GLAUCOMA_EXAMPLE_VISITS = [
  { patientId: 'synthetic-a', encounterId: 'visit-a', label: 'Synthetic patient A — follow-up' },
  { patientId: 'synthetic-b', encounterId: 'visit-b', label: 'Synthetic patient B — follow-up' },
] as const;

const fixtures: readonly GlaucomaFollowUpEncounter[] = [
  {
    patientId: 'synthetic-a', encounterId: 'visit-a', revision: 0, status: 'draft',
    examination: { od: 'Optic disc: cupping documented', os: 'Optic disc: cupping documented' }, followUp: '',
    orders: [{ id: 'a-oct-od', eye: 'od' }, { id: 'a-field-os', eye: 'os' }],
    results: [
      { id: 'a-result-oct', orderId: 'a-oct-od', eye: 'od', acknowledged: false, report: {
        id: 'a-result-oct', title: 'OCT retinal nerve fibre layer — OD',
        metadata: [{ label: 'Current', value: '10 Nov 2026' }, { label: 'Earlier comparison', value: '10 Nov 2025' }],
        metrics: [{ id: 'rnfl', label: 'Average RNFL', valueLabel: '74 µm', referenceLabel: 'Earlier: 76 µm' }],
        interpretation: 'Synthetic report for workflow demonstration.'
      } },
      { id: 'a-result-field', orderId: 'a-field-os', eye: 'os', acknowledged: false, report: {
        id: 'a-result-field', title: 'Visual field — OS',
        metadata: [{ label: 'Current', value: '10 Nov 2026' }, { label: 'Earlier comparison', value: '10 Nov 2025' }],
        metrics: [{ id: 'md', label: 'Mean deviation', valueLabel: '−4.2 dB', referenceLabel: 'Earlier: −4.0 dB' }],
        interpretation: 'Synthetic report for workflow demonstration.'
      } },
    ],
  },
  {
    patientId: 'synthetic-b', encounterId: 'visit-b', revision: 0, status: 'draft',
    examination: { od: '', os: '' }, followUp: '',
    orders: [{ id: 'b-oct-os', eye: 'os' }],
    results: [{ id: 'b-result-oct', orderId: 'b-oct-os', eye: 'os', acknowledged: false, report: {
      id: 'b-result-oct', title: 'OCT retinal nerve fibre layer — OS',
      metadata: [{ label: 'Current', value: '10 Nov 2026' }, { label: 'Earlier comparison', value: '12 Nov 2025' }],
      metrics: [{ id: 'rnfl', label: 'Average RNFL', valueLabel: '82 µm', referenceLabel: 'Earlier: 84 µm' }],
      interpretation: 'Synthetic report for workflow demonstration.'
    } }],
  },
];

type Selection = Pick<GlaucomaFollowUpEncounter, 'patientId' | 'encounterId'>;
type Result = GlaucomaFollowUpEncounter['results'][number];
type SignedRevision = NonNullable<GlaucomaFollowUpEncounter['signedRevisions']>[number];

const key = (item: Selection): string => `emr-glaucoma-example:v2:${item.patientId}:${item.encounterId}`;
const checkAbort = (signal: AbortSignal): void => { if (signal.aborted) throw new DOMException('Aborted', 'AbortError'); };
const find = (selection: Selection): GlaucomaFollowUpEncounter => {
  const fixture = fixtures.find(item => item.patientId === selection.patientId && item.encounterId === selection.encounterId);
  if (!fixture) throw new Error('Unknown synthetic encounter');
  return fixture;
};

/** Rebuilds fixture reports from known variants rather than trusting session storage. */
function readEncounter(storage: Pick<Storage, 'getItem'>, selection: Selection): GlaucomaFollowUpEncounter {
  const fixture = find(selection);
  const raw = storage.getItem(key(fixture));
  if (raw === null) return { ...structuredClone(fixture), results: fixture.results.map(result => ({ ...structuredClone(result), revision: 1 })) };
  const stored: unknown = JSON.parse(raw);
  if (!stored || typeof stored !== 'object') throw new Error('Invalid synthetic encounter');
  const value = stored as GlaucomaFollowUpEncounter;
  const validNote = (note: Pick<GlaucomaFollowUpEncounter, 'examination' | 'followUp'>): boolean =>
    !!note.examination && typeof note.examination.od === 'string' && typeof note.examination.os === 'string' && typeof note.followUp === 'string';
  const results = (items: readonly Result[]): Result[] => {
    if (!Array.isArray(items) || items.length !== fixture.results.length) throw new Error('Invalid synthetic results');
    return fixture.results.map(result => {
      const matches = items.filter(item => item && item.id === result.id && item.orderId === result.orderId && item.eye === result.eye && typeof item.acknowledged === 'boolean');
      if (matches.length !== 1) throw new Error('Invalid synthetic result');
      const item = matches[0];
      const revision = item.revision;
      if (revision !== 1 && !(fixture.patientId === 'synthetic-a' && result.id === 'a-result-oct' && revision === 2)) throw new Error('Invalid synthetic result revision');
      const report = structuredClone(result.report);
      if (revision === 2) {
        return { ...result, revision, corrected: true, acknowledged: item.acknowledged, report: { ...report, metrics: report.metrics.map(metric => metric.id === 'rnfl' ? { ...metric, valueLabel: '71 µm' } : metric), interpretation: 'Corrected synthetic report for workflow demonstration.' } };
      }
      return { ...result, revision, acknowledged: item.acknowledged, report };
    });
  };
  const amendment = (item: GlaucomaFollowUpEncounter['amendment'], previous: number | undefined): GlaucomaFollowUpEncounter['amendment'] => {
    if (item === undefined && previous === undefined) return undefined;
    if (!item || !Number.isSafeInteger(item.baseRevision) || item.baseRevision !== previous || typeof item.reason !== 'string' || !item.reason.trim()) throw new Error('Invalid synthetic amendment');
    return { baseRevision: item.baseRevision, reason: item.reason };
  };
  if (value.patientId !== fixture.patientId || value.encounterId !== fixture.encounterId || !Number.isSafeInteger(value.revision) || value.revision < 0 || (value.status !== 'draft' && value.status !== 'signed') || !validNote(value) || (value.signedRevisions !== undefined && !Array.isArray(value.signedRevisions))) throw new Error('Invalid synthetic encounter');
  const history: SignedRevision[] = [];
  for (const item of value.signedRevisions ?? []) {
    const previous = history.at(-1)?.revision;
    if (!item || !Number.isSafeInteger(item.revision) || item.revision <= (previous ?? 0) || item.revision > value.revision || !validNote(item)) throw new Error('Invalid synthetic history');
    history.push({ revision: item.revision, examination: { ...item.examination }, followUp: item.followUp, results: results(item.results), amendment: amendment(item.amendment, previous) });
  }
  const latest = history.at(-1);
  const currentAmendment = amendment(value.amendment, value.status === 'signed' ? history.at(-2)?.revision : latest?.revision);
  if (value.status === 'signed' && (!latest || latest.revision !== value.revision || latest.examination.od !== value.examination.od || latest.examination.os !== value.examination.os || latest.followUp !== value.followUp || JSON.stringify(latest.amendment) !== JSON.stringify(currentAmendment))) throw new Error('Invalid synthetic signed encounter');
  if (value.status === 'draft' && latest && value.revision <= latest.revision) throw new Error('Invalid synthetic draft revision');
  return { ...structuredClone(fixture), revision: value.revision, status: value.status, examination: { od: value.examination.od, os: value.examination.os }, followUp: value.followUp, results: results(value.results), amendment: currentAmendment, signedRevisions: history };
}

/** Indicates whether the synthetic OCT correction is available. */
export function canPublishGlaucomaFixtureCorrection(encounter: GlaucomaFollowUpEncounter): boolean {
  return encounter.patientId === 'synthetic-a' && encounter.encounterId === 'visit-a' && encounter.results.some(result => result.id === 'a-result-oct' && result.revision === 1);
}

/** Publishes the single synthetic OCT correction without changing the note revision. */
export function publishGlaucomaFixtureCorrection(storage: Pick<Storage, 'getItem' | 'setItem'>, selection: Selection): boolean {
  const current = readEncounter(storage, selection);
  if (!canPublishGlaucomaFixtureCorrection(current)) return false;
  const updated = { ...current, results: current.results.map(result => result.id === 'a-result-oct' ? { ...result, revision: 2, acknowledged: false } : result) };
  storage.setItem(key(current), JSON.stringify(updated));
  return true;
}

/** Creates a browser-session-only repository for the two synthetic encounters. */
export function createGlaucomaFixtureRepository(storage: Pick<Storage, 'getItem' | 'setItem'>): GlaucomaFollowUpRepository {
  const write = (incoming: GlaucomaFollowUpEncounter, signal: AbortSignal, signing: boolean): GlaucomaFollowUpEncounter => {
    checkAbort(signal);
    const current = readEncounter(storage, incoming);
    if (current.status !== 'draft' || incoming.status !== 'draft' || current.revision !== incoming.revision || !incoming.examination || typeof incoming.examination.od !== 'string' || typeof incoming.examination.os !== 'string' || typeof incoming.followUp !== 'string' || !Array.isArray(incoming.results) || incoming.results.length !== current.results.length || current.results.some(result => !incoming.results.some(item => item.id === result.id && item.orderId === result.orderId && item.eye === result.eye && item.revision === result.revision))) throw new Error('Invalid synthetic draft or revision');
    if (!Number.isSafeInteger(current.revision + 1)) throw new Error('Invalid synthetic revision');
    const saved: GlaucomaFollowUpEncounter = { ...current, examination: { od: incoming.examination.od, os: incoming.examination.os }, followUp: incoming.followUp, revision: current.revision + 1, status: signing ? 'signed' : 'draft' };
    const snapshot: SignedRevision = { revision: saved.revision, examination: saved.examination, followUp: saved.followUp, results: saved.results, amendment: saved.amendment };
    const final = signing ? { ...saved, signedRevisions: [...(saved.signedRevisions ?? []), snapshot] } : saved;
    checkAbort(signal);
    storage.setItem(key(current), JSON.stringify(final));
    return structuredClone(final);
  };
  return {
    async load(selection, signal) { checkAbort(signal); return readEncounter(storage, selection); },
    async saveDraft(encounter, signal) { return write(encounter, signal, false); },
    async sign(encounter, signal) { return write(encounter, signal, true); },
    async amend(encounter, reason, signal) {
      checkAbort(signal);
      const current = readEncounter(storage, encounter);
      if (current.status !== 'signed' || encounter.status !== 'signed' || current.revision !== encounter.revision || typeof reason !== 'string' || !reason.trim() || !Number.isSafeInteger(current.revision + 1)) throw new Error('Invalid synthetic amendment');
      const draft: GlaucomaFollowUpEncounter = { ...current, status: 'draft', revision: current.revision + 1, amendment: { baseRevision: current.revision, reason: reason.trim() } };
      checkAbort(signal);
      storage.setItem(key(current), JSON.stringify(draft));
      return structuredClone(draft);
    },
    async acknowledge(request, signal) {
      checkAbort(signal);
      const current = readEncounter(storage, request);
      if (!current.results.some(result => result.id === request.resultId && result.revision === request.resultRevision)) throw new Error('Invalid synthetic result revision');
      const updated = { ...current, results: current.results.map(result => result.id === request.resultId ? { ...result, acknowledged: true } : result) };
      checkAbort(signal);
      storage.setItem(key(current), JSON.stringify(updated));
      return structuredClone(updated);
    },
  };
}
