import { describe, expect, it } from 'vitest';
import { canPublishGlaucomaFixtureCorrection, createGlaucomaFixtureRepository, publishGlaucomaFixtureCorrection } from './glaucoma-follow-up.fixture.js';

describe('glaucoma synthetic repository', () => {
  it('preserves signed history across amendments and revision-specific corrections', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const repo = createGlaucomaFixtureRepository(storage);
    const selection = { patientId: 'synthetic-a', encounterId: 'visit-a' };
    const signal = new AbortController().signal;
    const initial = await repo.load(selection, signal);
    expect(initial.results[0].revision).toBe(1);
    const signed = await repo.sign(initial, signal);
    expect(signed.signedRevisions?.[0].revision).toBe(signed.revision);
    expect(canPublishGlaucomaFixtureCorrection(signed)).toBe(true);
    expect(publishGlaucomaFixtureCorrection(storage, selection)).toBe(true);
    expect(publishGlaucomaFixtureCorrection(storage, selection)).toBe(false);
    const corrected = await repo.load(selection, signal);
    expect(corrected.revision).toBe(signed.revision);
    expect(corrected.results[0].report.metrics[0].valueLabel).toBe('71 µm');
    expect(corrected.signedRevisions?.[0].results[0].report.metrics[0].valueLabel).toBe('74 µm');
    await expect(repo.acknowledge!({ ...selection, resultId: 'a-result-oct', resultRevision: 1 }, signal)).rejects.toThrow();
    const acknowledged = await repo.acknowledge!({ ...selection, resultId: 'a-result-oct', resultRevision: 2 }, signal);
    expect(acknowledged.results[0].acknowledged).toBe(true);
    expect(acknowledged.revision).toBe(signed.revision);
    const draft = await repo.amend!(acknowledged, 'Correction discussed', signal);
    expect(draft.amendment).toEqual({ baseRevision: signed.revision, reason: 'Correction discussed' });
    const resigned = await repo.sign(draft, signal);
    expect(resigned.signedRevisions).toHaveLength(2);
    expect((await repo.load(selection, signal)).signedRevisions).toHaveLength(2);
    await expect(repo.amend!(signed, 'stale', signal)).rejects.toThrow();
    await expect(repo.amend!(resigned, ' ', signal)).rejects.toThrow();
  });

  it('rejects malformed storage and stale saves after correction', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const repo = createGlaucomaFixtureRepository(storage);
    const selection = { patientId: 'synthetic-a', encounterId: 'visit-a' };
    const signal = new AbortController().signal;
    const initial = await repo.load(selection, signal);
    publishGlaucomaFixtureCorrection(storage, selection);
    await expect(repo.saveDraft(initial, signal)).rejects.toThrow();
    values.set('emr-glaucoma-example:v2:synthetic-a:visit-a', '{}');
    await expect(repo.load(selection, signal)).rejects.toThrow();
  });
});
