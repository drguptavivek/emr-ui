import { StateController } from './contracts.js';
import type { GlaucomaFollowUpEncounter, GlaucomaFollowUpIntent, GlaucomaFollowUpRepository, GlaucomaFollowUpState } from './glaucoma-follow-up.models.js';

function validBadge(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const badge = value as Record<string, unknown>;
  return typeof badge['label'] === 'string' && ['neutral', 'info', 'success', 'warning', 'danger'].includes(badge['tone'] as string) && (badge['assistiveText'] === undefined || typeof badge['assistiveText'] === 'string');
}

function validReport(value: GlaucomaFollowUpEncounter['results'][number]['report'], id: string): boolean {
  if (!value || value.id !== id || typeof value.title !== 'string' || !validBadge(value.status) || !Array.isArray(value.metadata) || !Array.isArray(value.metrics)) return false;
  if (![value.subtitle, value.interpretation, value.trendSummary, value.error].every(item => item === undefined || typeof item === 'string') || (value.loading !== undefined && typeof value.loading !== 'boolean')) return false;
  if (!value.metadata.every(item => item && typeof item.label === 'string' && typeof item.value === 'string')) return false;
  if (!value.metrics.every(item => item && typeof item.id === 'string' && typeof item.label === 'string' && typeof item.valueLabel === 'string' && (item.referenceLabel === undefined || typeof item.referenceLabel === 'string') && (item.helpText === undefined || typeof item.helpText === 'string') && validBadge(item.status))) return false;
  return value.attachments === undefined || (Array.isArray(value.attachments) && value.attachments.every(item => item && typeof item.id === 'string' && typeof item.label === 'string' && ['report', 'plot', 'image', 'data'].includes(item.kind) && (item.assistiveDescription === undefined || typeof item.assistiveDescription === 'string') && (item.disabled === undefined || typeof item.disabled === 'boolean')));
}

/** Compares decoded values without depending on object property order. */
function sameValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => sameValue(item, right[index]));
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = Object.keys(a).filter(key => a[key] !== undefined);
  return keys.length === Object.keys(b).filter(key => b[key] !== undefined).length && keys.every(key => sameValue(a[key], b[key]));
}

/** Checks that an existing versioned result was not replaced or rolled back. */
function continuousResult(old: GlaucomaFollowUpEncounter['results'][number], next: GlaucomaFollowUpEncounter['results'][number] | undefined): boolean {
  if (!next || next.orderId !== old.orderId || next.eye !== old.eye) return false;
  if (old.revision === undefined) return true;
  if (next.revision === undefined || next.revision < old.revision) return false;
  return next.revision !== old.revision || ((!old.acknowledged || next.acknowledged) && (old.corrected ?? false) === (next.corrected ?? false) && sameValue(old.report, next.report));
}

/** Coordinates a single encounter; repository authorization and revision checks remain server responsibilities. */
export class GlaucomaFollowUpController extends StateController<GlaucomaFollowUpState, GlaucomaFollowUpIntent> {
  private generation = 0;
  private request?: AbortController;
  private savedEncounter?: GlaucomaFollowUpEncounter;

  constructor(private readonly repository: GlaucomaFollowUpRepository) {
    super({ status: 'idle', encounter: null, dirty: false, error: null });
  }

  dispatch(intent: GlaucomaFollowUpIntent): void {
    if (this.isDestroyed()) return;
    if (intent.type === 'select') {
      if (this.getSnapshot().dirty) return;
      if (typeof intent.patientId !== 'string' || !intent.patientId.trim() || typeof intent.encounterId !== 'string' || !intent.encounterId.trim()) return;
      void this.load(intent.patientId, intent.encounterId);
      return;
    }
    const state = this.getSnapshot();
    const encounter = state.encounter;
    if (state.status !== 'ready' || !encounter) return;
    if (intent.type === 'amendRequested') {
      if (encounter.status === 'signed' && encounter.signedRevisions?.some(item => item.revision === encounter.revision && sameValue(item.examination, encounter.examination) && item.followUp === encounter.followUp && sameValue(item.amendment, encounter.amendment)) && typeof intent.reason === 'string' && intent.reason.trim() && this.repository.amend) void this.amend(encounter, intent.reason.trim());
      return;
    }
    if (intent.type === 'refreshResults') {
      if (this.repository.acknowledge) void this.reviewResults(encounter);
      return;
    }
    if (intent.type === 'acknowledgeResult' && this.repository.acknowledge) {
      const result = encounter.results.find(item => item.id === intent.resultId);
      if (result && !result.acknowledged && result.revision !== undefined && intent.resultRevision === result.revision) void this.reviewResults(encounter, result.id, result.revision);
      return;
    }
    if (encounter.status !== 'draft') return;
    switch (intent.type) {
      case 'editEye':
        if ((intent.eye !== 'od' && intent.eye !== 'os') || typeof intent.value !== 'string' || encounter.examination[intent.eye] === intent.value) return;
        this.setState({ ...state, dirty: true, encounter: { ...encounter, examination: { ...encounter.examination, [intent.eye]: intent.value } }, error: null });
        return;
      case 'acknowledgeResult': {
        const result = encounter.results.find(item => item.id === intent.resultId);
        if (!result || result.revision !== undefined || result.acknowledged || !encounter.orders.some(order => order.id === result.orderId && order.eye === result.eye)) return;
        this.setState({ ...state, dirty: true, encounter: { ...encounter, results: encounter.results.map(item => item.id === result.id ? { ...item, acknowledged: true } : item) }, error: null });
        return;
      }
      case 'setFollowUp':
        if (typeof intent.value !== 'string' || encounter.followUp === intent.value) return;
        this.setState({ ...state, dirty: true, encounter: { ...encounter, followUp: intent.value }, error: null });
        return;
      case 'discardRequested':
        if (state.dirty && this.savedEncounter) {
          this.setState({ ...state, encounter: this.savedEncounter, dirty: false, error: null });
        }
        return;
      case 'saveDraft': void this.persist(encounter, false); return;
      case 'sign': void this.persist(encounter, true); return;
    }
  }

  private async load(patientId: string, encounterId: string): Promise<void> {
    const { generation, signal } = this.beginRequest();
    this.savedEncounter = undefined;
    this.setState({ status: 'loading', encounter: null, dirty: false, error: null });
    if (!this.current(generation)) return;
    try {
      const encounter = await this.repository.load({ patientId, encounterId }, signal);
      if (!this.current(generation)) return;
      if (!this.validEncounter(encounter, patientId, encounterId)) throw new Error('Invalid encounter');
      this.savedEncounter = encounter;
      this.setState({ status: 'ready', encounter, dirty: false, error: null });
    } catch {
      if (this.current(generation)) this.setState({ status: 'error', encounter: null, dirty: false, error: 'Unable to load this encounter.' });
    }
  }

  private async persist(encounter: GlaucomaFollowUpEncounter, signing: boolean): Promise<void> {
    const { generation, signal } = this.beginRequest();
    const { dirty } = this.getSnapshot();
    this.setState({ status: signing ? 'signing' : 'saving', encounter, dirty, error: null });
    if (!this.current(generation)) return;
    try {
      const saved = await (signing ? this.repository.sign(encounter, signal) : this.repository.saveDraft(encounter, signal));
      if (!this.current(generation)) return;
      if (!this.validEncounter(saved, encounter.patientId, encounter.encounterId) || saved.revision <= encounter.revision || saved.status !== (signing ? 'signed' : 'draft')) throw new Error('Invalid save response');
      const history = encounter.signedRevisions ?? [];
      const archivesSign = signing && (this.repository.amend || (saved.signedRevisions?.length ?? 0) > history.length);
      const expectedHistory = archivesSign ? [...history, { revision: saved.revision, examination: saved.examination, followUp: saved.followUp, results: saved.results, amendment: saved.amendment }] : history;
      if (!sameValue(saved.amendment, encounter.amendment) || !sameValue(saved.signedRevisions ?? [], expectedHistory) || (archivesSign && (!sameValue(saved.examination, encounter.examination) || saved.followUp !== encounter.followUp)) || encounter.results.some(old => old.revision !== undefined && !continuousResult(old, saved.results.find(item => item.id === old.id)))) throw new Error('Invalid signed history');
      this.savedEncounter = saved;
      this.setState({ status: 'ready', encounter: saved, dirty: false, error: null });
    } catch {
      if (this.current(generation)) this.setState({ status: 'ready', encounter, dirty, error: signing ? 'Unable to sign this encounter.' : 'Unable to save this draft.' });
    }
  }

  private async amend(encounter: GlaucomaFollowUpEncounter, reason: string): Promise<void> {
    const { generation, signal } = this.beginRequest();
    this.setState({ ...this.getSnapshot(), status: 'amending', error: null });
    if (!this.current(generation)) return;
    try {
      const amended = await this.repository.amend!(encounter, reason, signal);
      if (!this.current(generation)) return;
      const expectedHistory = encounter.signedRevisions;
      if (!this.validEncounter(amended, encounter.patientId, encounter.encounterId) || amended.status !== 'draft' || amended.revision <= encounter.revision || amended.amendment?.baseRevision !== encounter.revision || amended.amendment.reason !== reason || !sameValue(amended.signedRevisions, expectedHistory) || !sameValue(amended.examination, encounter.examination) || amended.followUp !== encounter.followUp || encounter.results.some(old => old.revision !== undefined && !continuousResult(old, amended.results.find(item => item.id === old.id)))) throw new Error('Invalid amendment');
      this.savedEncounter = amended;
      this.setState({ status: 'ready', encounter: amended, dirty: false, error: null });
    } catch {
      if (this.current(generation)) this.setState({ status: 'ready', encounter, dirty: false, error: 'Unable to amend this encounter.' });
    }
  }

  private async reviewResults(encounter: GlaucomaFollowUpEncounter, resultId?: string, resultRevision?: number): Promise<void> {
    const { generation, signal } = this.beginRequest();
    const { dirty } = this.getSnapshot();
    this.setState({ status: resultId ? 'acknowledgingResult' : 'refreshingResults', encounter, dirty, error: null });
    if (!this.current(generation)) return;
    try {
      const reviewed = resultId && resultRevision !== undefined
        ? await this.repository.acknowledge!({ patientId: encounter.patientId, encounterId: encounter.encounterId, resultId, resultRevision }, signal)
        : await this.repository.load({ patientId: encounter.patientId, encounterId: encounter.encounterId }, signal);
      if (!this.current(generation)) return;
      if (!this.validEncounter(reviewed, encounter.patientId, encounter.encounterId) || reviewed.revision !== encounter.revision || reviewed.status !== encounter.status) throw new Error('Invalid review response');
      for (const old of encounter.results) {
        const next = reviewed.results.find(item => item.id === old.id);
        if (!continuousResult(old, next) || (old.revision === undefined && next?.revision === undefined && old.acknowledged && !next?.acknowledged)) throw new Error('Invalid result revision');
      }
      if (resultId && !reviewed.results.some(item => item.id === resultId && item.revision === resultRevision && item.acknowledged)) throw new Error('Invalid acknowledgement');
      const updated = { ...encounter, orders: reviewed.orders, results: reviewed.results };
      if (!this.validEncounter(updated, encounter.patientId, encounter.encounterId)) throw new Error('Invalid reviewed linkage');
      if (this.savedEncounter) this.savedEncounter = { ...this.savedEncounter, orders: reviewed.orders, results: reviewed.results };
      this.setState({ status: 'ready', encounter: updated, dirty, error: null });
    } catch {
      if (this.current(generation)) this.setState({ status: 'ready', encounter, dirty, error: resultId ? 'Unable to acknowledge this result.' : 'Unable to refresh results.' });
    }
  }

  private beginRequest(): { generation: number; signal: AbortSignal } {
    this.request?.abort();
    this.request = new AbortController();
    return { generation: ++this.generation, signal: this.request.signal };
  }

  private current(generation: number): boolean { return !this.isDestroyed() && generation === this.generation; }

  private validEncounter(value: GlaucomaFollowUpEncounter, patientId: string, encounterId: string): boolean {
    if (!value || value.patientId !== patientId || value.encounterId !== encounterId || !Number.isSafeInteger(value.revision) || value.revision < 0 || (value.status !== 'draft' && value.status !== 'signed') || !value.examination || typeof value.examination.od !== 'string' || typeof value.examination.os !== 'string' || typeof value.followUp !== 'string' || !Array.isArray(value.orders) || !Array.isArray(value.results)) return false;
    if (value.amendment !== undefined && (!value.amendment || !Number.isSafeInteger(value.amendment.baseRevision) || value.amendment.baseRevision < 0 || value.amendment.baseRevision >= value.revision || typeof value.amendment.reason !== 'string' || !value.amendment.reason.trim())) return false;
    if (value.signedRevisions !== undefined && (!Array.isArray(value.signedRevisions) || !value.signedRevisions.every((item, index, history) => item && Number.isSafeInteger(item.revision) && item.revision >= 0 && (item.revision < value.revision || (value.status === 'signed' && item.revision === value.revision)) && (index === 0 || history[index - 1]!.revision < item.revision) && this.validEncounter({ ...value, revision: item.revision, status: 'signed', examination: item.examination, followUp: item.followUp, results: item.results, amendment: item.amendment, signedRevisions: undefined }, patientId, encounterId)))) return false;
    const orders = new Map<string, string>();
    for (const order of value.orders) {
      if (!order || typeof order.id !== 'string' || !order.id || (order.eye !== 'od' && order.eye !== 'os') || orders.has(order.id)) return false;
      orders.set(order.id, order.eye);
    }
    const resultIds = new Set<string>();
    for (const result of value.results) {
      if (!result || typeof result.id !== 'string' || !result.id || resultIds.has(result.id) || typeof result.orderId !== 'string' || !result.orderId || (result.eye !== 'od' && result.eye !== 'os') || orders.get(result.orderId) !== result.eye || typeof result.acknowledged !== 'boolean' || !validReport(result.report, result.id)) return false;
      if ((result.revision !== undefined && (!Number.isSafeInteger(result.revision) || result.revision < 0)) || (result.corrected !== undefined && typeof result.corrected !== 'boolean') || (result.corrected === true && result.revision === undefined)) return false;
      resultIds.add(result.id);
    }
    const archive = value.status === 'signed' ? value.signedRevisions?.find(item => item.revision === value.revision) : undefined;
    if (archive && (!sameValue(archive.examination, value.examination) || archive.followUp !== value.followUp || !sameValue(archive.amendment, value.amendment) || archive.results.some((old: GlaucomaFollowUpEncounter['results'][number]) => {
      const current = value.results.find(item => item.id === old.id);
      return !continuousResult(old, current) || (old.revision === undefined && current?.revision === undefined && (!sameValue(old.report, current?.report) || (old.corrected ?? false) !== (current?.corrected ?? false) || (old.acknowledged && !current?.acknowledged)));
    }))) return false;
    return true;
  }

  protected override onDestroy(): void {
    this.request?.abort();
    this.generation += 1;
    this.savedEncounter = undefined;
  }
}
