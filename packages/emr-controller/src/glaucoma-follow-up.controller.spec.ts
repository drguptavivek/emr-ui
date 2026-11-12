import { describe, expect, it, vi } from 'vitest';
import { GlaucomaFollowUpController } from './glaucoma-follow-up.controller';
import type { GlaucomaFollowUpEncounter, GlaucomaFollowUpRepository } from './glaucoma-follow-up.models';

const encounter = (patientId = 'patient-1', encounterId = 'visit-1'): GlaucomaFollowUpEncounter => ({
  patientId, encounterId, revision: 1, status: 'draft', examination: { od: '', os: '' }, followUp: '',
  orders: [{ id: 'order-1', eye: 'od' }],
  results: [{ id: 'result-1', orderId: 'order-1', eye: 'od', report: { id: 'result-1', title: 'Result', metadata: [], metrics: [] }, acknowledged: false }],
});
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const repository = (): GlaucomaFollowUpRepository => ({
  load: vi.fn(async () => encounter()),
  saveDraft: vi.fn(async value => ({ ...value, revision: value.revision + 1 })),
  sign: vi.fn(async value => ({ ...value, revision: value.revision + 1, status: 'signed' })),
});

describe('GlaucomaFollowUpController', () => {
  it('edits both eyes, acknowledges a linked result, saves and freezes after signing', async () => {
    const controller = new GlaucomaFollowUpController(repository());
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'editEye', eye: 'od', value: 'right' });
    controller.dispatch({ type: 'editEye', eye: 'os', value: 'left' });
    controller.dispatch({ type: 'acknowledgeResult', resultId: 'result-1' });
    controller.dispatch({ type: 'setFollowUp', value: 'Review' });
    controller.dispatch({ type: 'saveDraft' });
    await tick();
    expect(controller.getSnapshot().encounter).toMatchObject({ revision: 2, examination: { od: 'right', os: 'left' }, followUp: 'Review', results: [{ acknowledged: true }] });
    controller.dispatch({ type: 'sign' });
    await tick();
    controller.dispatch({ type: 'editEye', eye: 'od', value: 'changed' });
    expect(controller.getSnapshot().encounter).toMatchObject({ revision: 3, status: 'signed', examination: { od: 'right' } });
  });

  it('rejects wrong identity and mismatched result eye at the load boundary', async () => {
    const repo = repository();
    repo.load = vi.fn(async () => encounter('other'));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ status: 'error', encounter: null });
    const base = encounter();
    const bad: GlaucomaFollowUpEncounter = { ...base, results: [{ ...base.results[0]!, eye: 'os' }] };
    repo.load = vi.fn(async () => bad);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ status: 'error', encounter: null });
  });

  it('requires explicit discard before switching away from an unsaved encounter', async () => {
    const repo = repository();
    repo.load = vi.fn(async selection => encounter(selection.patientId, selection.encounterId));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'editEye', eye: 'od', value: 'Unsaved finding' });
    controller.dispatch({ type: 'acknowledgeResult', resultId: 'result-1' });
    controller.dispatch({ type: 'setFollowUp', value: 'Unsaved follow-up' });
    controller.dispatch({ type: 'select', patientId: 'patient-2', encounterId: 'visit-2' });
    expect(repo.load).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toMatchObject({ dirty: true, encounter: {
      patientId: 'patient-1', examination: { od: 'Unsaved finding' },
      followUp: 'Unsaved follow-up', results: [{ acknowledged: true }],
    } });
    controller.dispatch({ type: 'discardRequested' });
    expect(controller.getSnapshot()).toMatchObject({ dirty: false, encounter: {
      patientId: 'patient-1', examination: { od: '' }, followUp: '', results: [{ acknowledged: false }],
    } });
    controller.dispatch({ type: 'select', patientId: 'patient-2', encounterId: 'visit-2' });
    await tick();
    expect(controller.getSnapshot().encounter?.patientId).toBe('patient-2');
  });

  it('preserves edits on rejection and invalid revision', async () => {
    const repo = repository();
    repo.saveDraft = vi.fn(async () => { throw new Error('conflict'); });
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'editEye', eye: 'od', value: 'unsaved' });
    controller.dispatch({ type: 'saveDraft' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ status: 'ready', error: 'Unable to save this draft.', encounter: { examination: { od: 'unsaved' } } });
    repo.sign = vi.fn(async value => ({ ...value, status: 'signed' }));
    controller.dispatch({ type: 'sign' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ error: 'Unable to sign this encounter.', encounter: { status: 'draft', examination: { od: 'unsaved' } } });
  });

  it('rejects missing result linkage and malformed report entries', async () => {
    const variants = [
      { orderId: undefined, eye: undefined },
      { corrected: true },
      { report: { id: 'result-1', title: 'Result', metadata: [null], metrics: [] } },
      { report: { id: 'result-1', title: 'Result', metadata: [], metrics: [{ id: 'm', label: 'Metric' }] } },
      { report: { id: 'result-1', title: 'Result', metadata: [], metrics: [], attachments: [null] } },
    ];
    for (const variant of variants) {
      const base = encounter();
      const bad = { ...base, results: [{ ...base.results[0], ...variant }] } as unknown as GlaucomaFollowUpEncounter;
      const repo = repository();
      repo.load = vi.fn(async () => bad);
      const controller = new GlaucomaFollowUpController(repo);
      controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
      await tick();
      expect(controller.getSnapshot()).toMatchObject({ status: 'error', encounter: null });
    }
  });

  it('preserves a dirty draft when a save response has malformed metadata', async () => {
    const repo = repository();
    repo.saveDraft = vi.fn(async value => ({ ...value, revision: value.revision + 1, results: [{ ...value.results[0], report: { ...value.results[0].report, metadata: [null] } }] }) as unknown as GlaucomaFollowUpEncounter);
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'editEye', eye: 'od', value: 'unsaved' });
    controller.dispatch({ type: 'saveDraft' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ status: 'ready', dirty: true, error: 'Unable to save this draft.', encounter: { examination: { od: 'unsaved' } } });
  });

  it('aborts and ignores late loads and writes after switching encounters', async () => {
    const pendingLoad = deferred<GlaucomaFollowUpEncounter>();
    const pendingSave = deferred<GlaucomaFollowUpEncounter>();
    const repo = repository();
    let firstSignal: AbortSignal | undefined;
    repo.load = vi.fn((selection, signal) => {
      if (selection.patientId === 'patient-1') { firstSignal = signal; return pendingLoad.promise; }
      return Promise.resolve(encounter('patient-2', 'visit-2'));
    });
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    controller.dispatch({ type: 'select', patientId: 'patient-2', encounterId: 'visit-2' });
    expect(firstSignal?.aborted).toBe(true);
    await tick();
    pendingLoad.resolve(encounter());
    await tick();
    expect(controller.getSnapshot().encounter?.patientId).toBe('patient-2');
    repo.saveDraft = vi.fn(() => pendingSave.promise);
    controller.dispatch({ type: 'saveDraft' });
    controller.dispatch({ type: 'select', patientId: 'patient-2', encounterId: 'visit-2' });
    await tick();
    pendingSave.resolve({ ...encounter('patient-2', 'visit-2'), revision: 2 });
    await tick();
    expect(controller.getSnapshot().encounter?.revision).toBe(1);
  });

  it('ignores a late signature after switching encounters', async () => {
    const pending = deferred<GlaucomaFollowUpEncounter>();
    const repo = repository();
    repo.load = vi.fn(async selection => encounter(selection.patientId, selection.encounterId));
    repo.sign = vi.fn(() => pending.promise);
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'sign' });
    controller.dispatch({ type: 'select', patientId: 'patient-2', encounterId: 'visit-2' });
    await tick();
    pending.resolve({ ...encounter(), revision: 2, status: 'signed' });
    await tick();
    expect(controller.getSnapshot().encounter).toMatchObject({ patientId: 'patient-2', status: 'draft' });
  });

  it('ignores results after destruction', async () => {
    const pending = deferred<GlaucomaFollowUpEncounter>();
    const repo = repository();
    let signal: AbortSignal | undefined;
    repo.load = vi.fn((_selection, nextSignal) => { signal = nextSignal; return pending.promise; });
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    controller.destroy();
    expect(signal?.aborted).toBe(true);
    pending.resolve(encounter());
    await tick();
    expect(controller.getSnapshot().status).toBe('loading');
  });
  it('amends only a signed revision with its original snapshot and a reason', async () => {
    const draft = encounter();
    const base = { ...draft, status: 'signed' as const, signedRevisions: [{ revision: 1, examination: draft.examination, followUp: draft.followUp, results: draft.results }] };
    const repo = repository();
    repo.load = vi.fn(async () => base);
    repo.amend = vi.fn(async (value, reason) => ({ ...value, status: 'draft', revision: 2, amendment: { baseRevision: 1, reason } }));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'amendRequested', reason: '  ' });
    expect(repo.amend).not.toHaveBeenCalled();
    controller.dispatch({ type: 'amendRequested', reason: ' correction ' });
    await tick();
    expect(controller.getSnapshot().encounter).toMatchObject({ status: 'draft', amendment: { baseRevision: 1, reason: 'correction' }, signedRevisions: [{ revision: 1, examination: base.examination }] });
  });

  it('ignores late amendment responses after selecting another encounter', async () => {
    const pending = deferred<GlaucomaFollowUpEncounter>();
    const repo = repository();
    repo.load = vi.fn(async selection => {
      const value = encounter(selection.patientId, selection.encounterId);
      return { ...value, status: 'signed', signedRevisions: [{ revision: value.revision, examination: value.examination, followUp: value.followUp, results: value.results }] };
    });
    repo.amend = vi.fn(() => pending.promise);
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'amendRequested', reason: 'correction' });
    controller.dispatch({ type: 'select', patientId: 'patient-2', encounterId: 'visit-2' });
    await tick();
    pending.resolve({ ...encounter(), revision: 2 });
    await tick();
    expect(controller.getSnapshot().encounter?.patientId).toBe('patient-2');
  });

  it('refreshes corrected results without losing edits and acknowledges the exact revision', async () => {
    const base = encounter();
    const versioned = { ...base, results: [{ ...base.results[0]!, revision: 1, acknowledged: true }] };
    const corrected = { ...versioned, results: [{ ...versioned.results[0]!, revision: 2, corrected: true, acknowledged: false }] };
    const repo = repository();
    repo.load = vi.fn().mockResolvedValueOnce(versioned).mockResolvedValue(corrected);
    repo.acknowledge = vi.fn(async () => ({ ...corrected, results: [{ ...corrected.results[0]!, acknowledged: true }] }));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'editEye', eye: 'od', value: 'unsaved' });
    controller.dispatch({ type: 'refreshResults' });
    await tick();
    controller.dispatch({ type: 'acknowledgeResult', resultId: 'result-1', resultRevision: 1 });
    controller.dispatch({ type: 'acknowledgeResult', resultId: 'result-1' });
    expect(repo.acknowledge).not.toHaveBeenCalled();
    controller.dispatch({ type: 'acknowledgeResult', resultId: 'result-1', resultRevision: 2 });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ dirty: true, encounter: { examination: { od: 'unsaved' }, results: [{ revision: 2, acknowledged: true }] } });
    controller.dispatch({ type: 'discardRequested' });
    expect(controller.getSnapshot()).toMatchObject({ dirty: false, encounter: { examination: { od: '' }, results: [{ revision: 2, acknowledged: true }] } });
  });

  it('acknowledges a result on a signed note and rejects revision regression', async () => {
    const base = encounter();
    const signed = { ...base, status: 'signed' as const, results: [{ ...base.results[0]!, revision: 2 }] };
    const repo = repository();
    repo.load = vi.fn().mockResolvedValueOnce(signed).mockResolvedValue({ ...signed, results: [{ ...signed.results[0]!, revision: 1 }] });
    repo.acknowledge = vi.fn(async () => ({ ...signed, results: [{ ...signed.results[0]!, acknowledged: true }] }));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'refreshResults' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ error: 'Unable to refresh results.', encounter: { results: [{ revision: 2 }] } });
    controller.dispatch({ type: 'acknowledgeResult', resultId: 'result-1', resultRevision: 2 });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ dirty: false, encounter: { status: 'signed', results: [{ acknowledged: true }] } });
  });

  it('preserves the archived signed snapshot when live results have been corrected', async () => {
    const base = encounter();
    const archived = { revision: 1, examination: base.examination, followUp: base.followUp, results: [{ ...base.results[0]!, revision: 1 }] };
    const signed = { ...base, status: 'signed' as const, signedRevisions: [archived], results: [{ ...base.results[0]!, revision: 2, corrected: true }] };
    const repo = repository();
    repo.load = vi.fn(async () => signed);
    repo.amend = vi.fn(async (value, reason) => ({ ...value, revision: 2, status: 'draft', amendment: { baseRevision: 1, reason } }));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'amendRequested', reason: 'Correction' });
    await tick();
    expect(controller.getSnapshot().encounter).toMatchObject({ status: 'draft', signedRevisions: [archived], results: [{ revision: 2 }] });
  });

  it('rejects a save that drops signed history or changes the amendment', async () => {
    const base = encounter();
    const archive = { revision: 1, examination: base.examination, followUp: base.followUp, results: base.results };
    const amended = { ...base, revision: 2, signedRevisions: [archive], amendment: { baseRevision: 1, reason: 'Correction' } };
    const repo = repository();
    repo.load = vi.fn(async () => amended);
    repo.saveDraft = vi.fn(async value => ({ ...value, revision: 3, signedRevisions: [] }));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'editEye', eye: 'od', value: 'unsaved' });
    controller.dispatch({ type: 'saveDraft' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ dirty: true, error: 'Unable to save this draft.', encounter: { examination: { od: 'unsaved' } } });
    repo.saveDraft = vi.fn(async value => ({ ...value, revision: 3, amendment: { baseRevision: 1, reason: 'changed' } }));
    controller.dispatch({ type: 'saveDraft' });
    await tick();
    expect(controller.getSnapshot().error).toBe('Unable to save this draft.');
  });

  it('requires an unchanged note and an archive when signing with amendments enabled', async () => {
    const repo = repository();
    repo.amend = vi.fn();
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'sign' });
    await tick();
    expect(controller.getSnapshot().error).toBe('Unable to sign this encounter.');
    repo.sign = vi.fn(async value => ({ ...value, revision: 2, status: 'signed', signedRevisions: [{ revision: 2, examination: value.examination, followUp: value.followUp, results: value.results }] }));
    controller.dispatch({ type: 'sign' });
    await tick();
    expect(controller.getSnapshot().encounter?.status).toBe('signed');
  });

  it('rejects changes to a report without a new result revision', async () => {
    const base = encounter();
    const versioned = { ...base, results: [{ ...base.results[0]!, revision: 1, acknowledged: true }] };
    const changed = { ...versioned, results: [{ ...versioned.results[0]!, report: { ...versioned.results[0]!.report, title: 'Changed' } }] };
    const repo = repository();
    repo.load = vi.fn().mockResolvedValueOnce(versioned).mockResolvedValue(changed);
    repo.acknowledge = vi.fn();
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'refreshResults' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ error: 'Unable to refresh results.', encounter: { results: [{ report: { title: 'Result' } }] } });
  });

  it('rejects an amendment response that changes signed note content', async () => {
    const draft = encounter();
    const base = { ...draft, status: 'signed' as const, signedRevisions: [{ revision: 1, examination: draft.examination, followUp: draft.followUp, results: draft.results }] };
    const repo = repository();
    repo.load = vi.fn(async () => base);
    repo.amend = vi.fn(async (value, reason) => ({ ...value, revision: 2, status: 'draft', examination: { ...value.examination, od: 'changed' }, amendment: { baseRevision: 1, reason } }));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'amendRequested', reason: 'Correction' });
    await tick();
    expect(controller.getSnapshot()).toMatchObject({ error: 'Unable to amend this encounter.', encounter: { status: 'signed', examination: { od: '' } } });
  });

  it('rejects a save or sign that changes a versioned result without advancing it', async () => {
    const base = encounter();
    const versioned = { ...base, results: [{ ...base.results[0]!, revision: 2 }] };
    const repo = repository();
    repo.load = vi.fn(async () => versioned);
    repo.saveDraft = vi.fn(async value => ({ ...value, revision: 2, results: [{ ...value.results[0]!, revision: 1 }] }));
    repo.sign = vi.fn(async value => ({ ...value, revision: 2, status: 'signed', results: [{ ...value.results[0]!, corrected: true }] }));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'saveDraft' });
    await tick();
    expect(controller.getSnapshot().error).toBe('Unable to save this draft.');
    controller.dispatch({ type: 'sign' });
    await tick();
    expect(controller.getSnapshot().error).toBe('Unable to sign this encounter.');
  });

  it('accepts a correct signed archive from a repository without an amend hook', async () => {
    const repo = repository();
    repo.sign = vi.fn(async value => ({ ...value, revision: 2, status: 'signed', signedRevisions: [{ revision: 2, examination: value.examination, followUp: value.followUp, results: value.results }] }));
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'sign' });
    await tick();
    expect(controller.getSnapshot().encounter?.status).toBe('signed');
  });

  it('does not amend a signed note without its original archive', async () => {
    const repo = repository();
    repo.load = vi.fn(async () => ({ ...encounter(), status: 'signed' }));
    repo.amend = vi.fn();
    const controller = new GlaucomaFollowUpController(repo);
    controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
    await tick();
    controller.dispatch({ type: 'amendRequested', reason: 'Correction' });
    expect(repo.amend).not.toHaveBeenCalled();
  });

  it('rejects a current signed archive that conflicts with note or same-version result', async () => {
    const base = encounter();
    const result = { ...base.results[0]!, revision: 1 };
    const archive = { revision: 1, examination: base.examination, followUp: base.followUp, results: [result] };
    const repo = repository();
    const controller = new GlaucomaFollowUpController(repo);
    for (const invalid of [
      { ...base, status: 'signed' as const, examination: { ...base.examination, od: 'changed' }, results: [result], signedRevisions: [archive] },
      { ...base, status: 'signed' as const, results: [{ ...result, report: { ...result.report, title: 'changed' } }], signedRevisions: [archive] },
    ]) {
      repo.load = vi.fn(async () => invalid);
      controller.dispatch({ type: 'select', patientId: 'patient-1', encounterId: 'visit-1' });
      await tick();
      expect(controller.getSnapshot()).toMatchObject({ status: 'error', encounter: null });
    }
  });

});
