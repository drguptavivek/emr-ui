import { StateController } from '../../packages/emr-controller/src/contracts';
import type {
  ClinicalNoteAction,
  ClinicalNoteComparisonRow,
  ClinicalNoteHistoryEntry,
  ClinicalNoteSection,
  ClinicalNoteSignatureView,
  ClinicalNoteSnapshotView,
  ClinicalNoteWorkspaceIntent,
  ClinicalNoteWorkspaceViewModel
} from '../../packages/emr-controller/src/clinical-note.models';

export type ClinicalNoteScenario = 'opd' | 'ipd' | 'ot';
export type ClinicalNoteActor = 'author' | 'reviewer' | 'clinician';

interface Signature {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly at: string;
}

interface SignedSnapshot {
  readonly id: string;
  readonly revision: number;
  readonly title: string;
  readonly clinicalTime: string;
  readonly sections: readonly ClinicalNoteSection[];
  readonly author: Signature;
  readonly signers: readonly Signature[];
  readonly reason?: string;
}

interface NoteRecord {
  readonly id: string;
  readonly scenario: ClinicalNoteScenario;
  readonly title: string;
  readonly context: string;
  readonly clinicalTime: string;
  readonly eventTime: string;
  readonly fields: readonly { readonly id: string; readonly label: string; readonly value: string }[];
  readonly versions: readonly SignedSnapshot[];
  readonly draft?: { readonly baseRevision: number; readonly reason?: string; readonly fields: readonly { readonly id: string; readonly label: string; readonly value: string }[] };
  readonly addenda: readonly SignedSnapshot[];
  readonly events: readonly { readonly id: string; readonly title: string; readonly actor: Signature; readonly time: string; readonly reason?: string; readonly revision?: number; readonly snapshotId?: string }[];
  readonly enteredInError?: string;
}

const roles: Record<ClinicalNoteActor, Signature> = {
  author: { id: 'resident', name: 'Dr Ananya Rao', role: 'Resident physician', at: '' },
  reviewer: { id: 'consultant', name: 'Dr Meera Iyer', role: 'Consultant physician', at: '' },
  clinician: { id: 'reader', name: 'Dr Kiran Shah', role: 'Consultant surgeon', at: '' }
};

function signature(actor: ClinicalNoteActor, scenario: ClinicalNoteScenario): Signature {
  return actor === 'author' && scenario === 'ot'
    ? { id: 'surgeon', name: 'Dr Kiran Shah', role: 'Consultant surgeon', at: '' }
    : roles[actor];
}

const ACTIONS: Record<string, ClinicalNoteAction> = {
  'edit-note': { id: 'edit-note', label: 'Edit draft' },
  'save-draft': { id: 'save-draft', label: 'Save draft' },
  'review-cosign': { id: 'review-cosign', label: 'Review for co-signature' },
  'cancel': { id: 'cancel', label: 'Cancel' },
  'discard-addendum': { id: 'discard-addendum', label: 'Discard addendum draft' },
  'review-note': { id: 'review-note', label: 'Review note' },
  'sign-note': { id: 'sign-note', label: 'Sign note', primary: true },
  'cosign-note': { id: 'cosign-note', label: 'Co-sign note', primary: true },
  'return-note': { id: 'return-note', label: 'Return for correction' },
  'addendum': { id: 'addendum', label: 'Add telephone addendum' },
  'start-amendment': { id: 'start-amendment', label: 'Amend signed note' },
  'sign-amendment': { id: 'sign-amendment', label: 'Sign amendment', primary: true },
  'review-amendment': { id: 'review-amendment', label: 'Review amendment' },
  'review-addendum': { id: 'review-addendum', label: 'Review addendum' },
  'confirm-return': { id: 'confirm-return', label: 'Return note for correction', primary: true },
  'enter-error': { id: 'enter-error', label: 'Mark entered in error' },
  'history': { id: 'history', label: 'History' },
  'close-history': { id: 'close-history', label: 'Close history' },
  'sign-addendum': { id: 'sign-addendum', label: 'Sign addendum', primary: true },
  'confirm-enter-error': { id: 'confirm-enter-error', label: 'Confirm entered in error', primary: true }
};

const action = (id: string): ClinicalNoteAction => {
  if (ACTIONS[id]) return ACTIONS[id]!;
  if (id.startsWith('view:')) return { id, label: id.startsWith('view:addendum') ? 'View addendum' : `View version ${id.slice('view:signed-'.length)}` };
  if (id.startsWith('compare:')) return { id, label: `Compare ${id.slice('compare:'.length).replace(':', ' with ')}` };
  throw new Error(`Unknown clinical note action: ${id}`);
};

function sections(fields: readonly { readonly id: string; readonly label: string; readonly value: string }[]): readonly ClinicalNoteSection[] {
  return fields.map(({ id, label, value }) => ({ id, label, value }));
}

function signatures(snapshot: SignedSnapshot): readonly ClinicalNoteSignatureView[] {
  return snapshot.signers.map((signer, index) => ({
    signerId: signer.id,
    name: signer.name,
    role: signer.role,
    signedAtLabel: signer.at,
    purpose: index === 0 ? 'sign' : 'co-sign',
    method: 'attestation',
  }));
}

function canMarkEnteredInError(actor: ClinicalNoteActor, scenario: ClinicalNoteScenario): boolean {
  return actor === 'author' || (actor === 'reviewer' && scenario === 'ipd');
}

function snapshot(note: NoteRecord, signed: SignedSnapshot): ClinicalNoteSnapshotView {
  return {
    id: signed.id,
    title: signed.id.startsWith('addendum-') ? signed.title : `${note.title} · v${signed.revision}`,
    metadata: [
      `Clinical event: ${signed.clinicalTime}`,
      `Authored by ${signed.author.name} · ${signed.author.role}`,
      ...(signed.reason ? [`Amendment reason · ${signed.reason}`] : []),
    ],
    signatures: signatures(signed),
    sections: signed.sections.map(section => ({ ...section }))
  };
}

function compare(previous: SignedSnapshot, current: SignedSnapshot): readonly ClinicalNoteComparisonRow[] {
  const oldSections = new Map(previous.sections.map(section => [section.id, section]));
  const newSections = new Map(current.sections.map(section => [section.id, section]));
  const ids = [...new Set([...oldSections.keys(), ...newSections.keys()])];
  return ids.flatMap(id => {
    const oldValue = oldSections.get(id)?.value;
    const newValue = newSections.get(id)?.value;
    if (oldValue === newValue) return [];
    return [{ id, label: newSections.get(id)?.label ?? oldSections.get(id)!.label, previous: oldValue ?? null, current: newValue ?? null }];
  });
}

/** In-memory demonstration controller. A production host supplies identity, permission and persistence services. */
let nextControllerId = 0;

export class ClinicalNoteWorkspaceController extends StateController<ClinicalNoteWorkspaceViewModel, ClinicalNoteWorkspaceIntent> {
  private clockTick = 0;
  private actor: ClinicalNoteActor;
  private note: NoteRecord;
  private panel: 'editor' | 'review' | 'history' | 'error' | 'return' = 'editor';
  private selectedSnapshot?: string;
  private compareRevisions?: readonly [number, number];
  private returnedReason?: string;
  private errorReason = '';
  private addendumText = '';
  private addendumTime = '11 Nov 2026 · 08:30';
  private addendumOpen = false;
  private savedAt?: string;
  private generation = 0;
  private readonly controllerId = ++nextControllerId;
  private returnReason = '';

  constructor(scenario: ClinicalNoteScenario, private readonly suppliedClock?: () => string) {
    const note = demoNote(scenario);
    const actor: ClinicalNoteActor = 'author';
    super(buildModel(note, actor, 'editor'));
    this.actor = actor;
    this.note = note;
    this.publish();
  }

  private now(): string {
    if (this.suppliedClock) return this.suppliedClock();
    const date = new Date('2026-11-11T16:20:00+05:30');
    date.setMinutes(date.getMinutes() + this.clockTick++);
    return `11 Nov 2026 · ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })} IST`;
  }

  selectActor(actor: ClinicalNoteActor): void {
    if (this.isDestroyed() || actor === this.actor || !Object.hasOwn(roles, actor)) return;
    this.actor = actor;
    this.panel = 'editor';
    this.selectedSnapshot = undefined;
    this.compareRevisions = undefined;
    this.publish();
  }

  dispatch(intent: ClinicalNoteWorkspaceIntent): void {
    if (this.isDestroyed()) return;
    const model = this.getSnapshot();
    if (intent.type === 'fieldChanged') {
      if (!model.form?.fields.some(field => field.id === intent.fieldId)) return;
      const value = intent.value.slice(0, 4000);
      const fieldId = intent.fieldId.slice(intent.fieldId.indexOf('|') + 1);
      if (this.panel === 'return') this.returnReason = value;
      else if (this.panel === 'error') this.errorReason = value;
      else if (this.addendumOpen) {
        if (fieldId === 'opd-addendum:clinical-time') this.addendumTime = value;
        else this.addendumText = value;
      }
      else if (this.note.draft) {
        const id = fieldId.slice(fieldId.indexOf(':') + 1);
        const draft = this.note.draft;
        this.note = { ...this.note, draft: id === 'change-reason'
          ? { ...draft, reason: value }
          : { ...draft, fields: draft.fields.map(field => field.id === id ? { ...field, value } : field) } };
      } else {
        this.note = { ...this.note, fields: this.note.fields.map(field => field.id === fieldId ? { ...field, value } : field) };
      }
      this.savedAt = undefined;
      this.publish();
      return;
    }

    const visible = [
      ...model.actions,
      ...(model.form?.actions ?? []),
      ...model.queue.entries.flatMap(entry => entry.actions),
      ...(model.history?.entries.flatMap(entry => entry.actions) ?? []),
    ];
    if (visible.some(item => item.id === intent.actionId)) {
      this.perform(intent.actionId.slice(intent.actionId.indexOf('|') + 1));
    }
  }

  private perform(id: string): void {
    const actor = { ...signature(this.actor, this.note.scenario), at: this.now() };
    switch (id) {
      case 'edit-note':
        this.panel = 'editor';
        break;
      case 'save-draft':
        this.savedAt = actor.at;
        this.panel = 'editor';
        break;
      case 'review-cosign':
      case 'review-note':
        if (!this.note.versions.length || this.note.draft || this.note.scenario === 'ipd' && this.actor === 'reviewer') this.panel = 'review';
        break;
      case 'sign-note':
        if (this.actor !== 'author' || this.panel !== 'review' || this.note.scenario === 'ipd' && this.note.versions.length && (!this.note.draft || this.note.draft.baseRevision !== this.note.versions.at(-1)?.revision)) break;
        if (this.note.scenario !== 'ipd' && this.note.versions.length) break;
        this.sign(sections(this.note.draft?.fields ?? this.note.fields), actor, this.note.draft?.reason?.trim());
        break;
      case 'cosign-note':
        if (this.note.scenario !== 'ipd' || this.actor !== 'reviewer' || this.note.draft || this.panel !== 'review') break;
        {
          const current = this.note.versions.at(-1);
          if (!current || current.signers.length !== 1) break;
          const updated = { ...current, signers: [...current.signers, actor] };
          this.note = {
            ...this.note,
            versions: [...this.note.versions.slice(0, -1), updated],
            events: [...this.note.events, { id: `event-${this.note.events.length + 1}`, title: 'Note co-signed', actor, time: actor.at, revision: current.revision }]
          };
          this.panel = 'history';
        }
        break;
      case 'return-note':
        if (this.note.scenario !== 'ipd' || this.actor !== 'reviewer' || this.panel !== 'review' || this.note.draft) break;
        this.returnReason = '';
        this.panel = 'return';
        break;
      case 'addendum':
        if (this.note.scenario !== 'opd' || !this.note.versions.length || this.actor !== 'author' || this.note.enteredInError) break;
        this.addendumText = '';
        this.addendumTime = '11 Nov 2026 · 08:30';
        this.addendumOpen = true;
        this.panel = 'editor';
        break;
      case 'review-addendum':
        if (!this.addendumOpen || !this.addendumText.trim() || this.actor !== 'author') break;
        this.panel = 'review';
        break;
      case 'sign-addendum':
        if (this.note.scenario !== 'opd' || !this.note.versions.length || this.actor !== 'author' || !this.addendumOpen || this.panel !== 'review' || !this.addendumText.trim()) break;
        this.note = { ...this.note, addenda: [...this.note.addenda, { id: `addendum-${this.note.addenda.length + 1}`, revision: this.note.versions.at(-1)!.revision, title: 'Telephone addendum', clinicalTime: this.addendumTime.trim(), sections: [{ id: 'telephone-update', label: 'Telephone update', value: this.addendumText.trim() }], author: actor, signers: [actor] }], events: [...this.note.events, { id: `event-${this.note.events.length + 1}`, title: 'Telephone addendum signed', actor, time: actor.at, revision: this.note.versions.at(-1)!.revision, snapshotId: `addendum-${this.note.addenda.length + 1}` }] };
        this.addendumText = '';
        this.addendumOpen = false;
        this.panel = 'history';
        break;
      case 'start-amendment':
        if (this.note.scenario !== 'ot' || this.actor !== 'author' || !this.note.versions.length || this.note.draft || this.note.enteredInError) break;
        {
          const current = this.note.versions.at(-1)!;
          this.note = {
            ...this.note,
            draft: { baseRevision: current.revision, reason: '', fields: sections(current.sections) },
            events: [...this.note.events, {
              id: `event-${this.note.events.length + 1}`,
              title: 'Amendment started',
              actor,
              time: actor.at,
            }],
          };
        }
        this.panel = 'editor';
        break;
      case 'review-amendment':
        if (this.note.scenario !== 'ot' || this.actor !== 'author' || !this.note.draft?.reason?.trim()) break;
        this.panel = 'review';
        break;
      case 'sign-amendment':
        if (this.note.scenario !== 'ot' || this.actor !== 'author' || this.panel !== 'review' || !this.note.draft?.reason?.trim()) break;
        this.sign(sections(this.note.draft.fields), actor, this.note.draft.reason.trim());
        break;
      case 'confirm-return':
        if (this.note.scenario !== 'ipd' || this.actor !== 'reviewer' || this.panel !== 'return' || !this.returnReason.trim()) break;
        this.returnedReason = this.returnReason.trim();
        this.note = { ...this.note, draft: { baseRevision: this.note.versions.at(-1)!.revision, reason: this.returnedReason, fields: this.note.versions.at(-1)!.sections.map(section => ({ ...section })) }, events: [...this.note.events, { id: `event-${this.note.events.length + 1}`, title: 'Returned for correction', actor, time: actor.at, reason: this.returnedReason }] };
        this.panel = 'editor';
        break;
      case 'enter-error':
        if (!this.note.versions.length || this.note.enteredInError || !canMarkEnteredInError(this.actor, this.note.scenario)) break;
        this.errorReason = '';
        this.panel = 'error';
        break;
      case 'confirm-enter-error':
        if (this.panel !== 'error' || !this.note.versions.length || this.note.enteredInError
          || !this.errorReason.trim() || !canMarkEnteredInError(this.actor, this.note.scenario)) break;
        this.note = { ...this.note, enteredInError: this.errorReason.trim(), events: [...this.note.events, { id: `event-${this.note.events.length + 1}`, title: 'Entered in error', actor, time: actor.at, reason: this.errorReason.trim() }] };
        this.panel = 'history';
        break;
      case 'discard-addendum':
        this.addendumText = '';
        this.addendumOpen = false;
        this.panel = 'editor';
        break;
      case 'cancel': this.panel = 'editor'; break;
      case 'history':
        this.selectedSnapshot = undefined;
        this.compareRevisions = undefined;
        this.panel = 'history';
        break;
      case 'close-history': this.panel = 'editor'; break;
      default:
        if (id.startsWith('view:')) {
          this.selectedSnapshot = id.slice(5);
          this.compareRevisions = undefined;
          this.panel = 'history';
        } else if (id.startsWith('compare:')) {
          this.selectedSnapshot = undefined;
          const [left, right] = id.slice(8).split(':').map(Number);
          if (this.note.versions.some(version => version.revision === left) && this.note.versions.some(version => version.revision === right) && left !== right) this.compareRevisions = [left!, right!];
          this.panel = 'history';
        }
    }
    this.publish();
  }

  private sign(noteSections: readonly ClinicalNoteSection[], signer: Signature, reason?: string): void {
    const previous = this.note.versions.at(-1);
    const revision = (previous?.revision ?? 0) + 1;
    const kind = previous ? 'amendment' : 'original';
    const next: SignedSnapshot = { id: `signed-${revision}`, revision, title: this.note.title, clinicalTime: this.note.clinicalTime, sections: noteSections.map(section => ({ ...section })), author: previous?.author ?? signer, signers: [signer], ...(reason ? { reason } : {}) };
    this.note = { ...this.note, versions: [...this.note.versions, next], ...(this.note.draft ? { draft: undefined } : {}), events: [...this.note.events, { id: `event-${this.note.events.length + 1}`, title: kind === 'amendment' ? 'Amendment signed' : 'Note signed', actor: signer, time: signer.at, ...(reason ? { reason } : {}), revision }] };
    this.returnedReason = undefined;
    this.savedAt = undefined;
    this.panel = kind === 'amendment' ? 'history' : 'editor';
  }

  private publish(): void {
    const model = buildModel(this.note, this.actor, this.panel, this.selectedSnapshot, this.compareRevisions,
      this.returnedReason, this.errorReason, this.addendumText, this.addendumOpen, this.returnReason, this.savedAt, this.addendumTime);
    const identity = `${this.note.id}:${this.controllerId}`;
    const token = `${identity}:${++this.generation}`;
    const actions = (items: readonly ClinicalNoteAction[]) => items.map(item => ({ ...item, id: `${token}|${item.id}` }));
    const entries = (items: readonly ClinicalNoteHistoryEntry[]) => items.map(item => ({ ...item, actions: actions(item.actions) }));
    this.setState({
      ...model,
      actions: actions(model.actions),
      form: model.form && {
        ...model.form,
        fields: model.form.fields.map(field => ({ ...field, id: `${identity}|${field.id}` })),
        actions: actions(model.form.actions),
      },
      queue: { ...model.queue, entries: entries(model.queue.entries) },
      history: model.history && { ...model.history, entries: entries(model.history.entries) },
    });
  }
}

function demoNote(scenario: ClinicalNoteScenario): NoteRecord {
  const common = { id: `synthetic-${scenario}`, scenario };
  if (scenario === 'opd') return {
    ...common, title: 'Consultation note', context: 'OPD · General medicine · Encounter 10 Nov 2026', clinicalTime: '10 Nov 2026 · 09:15', eventTime: '10 Nov 2026 · 09:15',
    fields: [{ id: 'reason', label: 'Reason for visit', value: 'Intermittent headache for three days.' }, { id: 'assessment', label: 'Assessment', value: 'No acute neurological features reported.' }, { id: 'plan', label: 'Plan', value: 'Hydration, symptom diary, review if symptoms persist.' }], versions: [], addenda: [], events: []
  };
  if (scenario === 'ipd') {
    const sections = [{ id: 'overnight', label: 'Overnight events', value: 'Rested comfortably. No acute events reported.' }, { id: 'examination', label: 'Review and examination', value: 'Alert, stable observations, tolerating oral intake.' }, { id: 'plan', label: 'Plan', value: 'Continue current treatment. Review fluid balance this morning.' }];
    const author = { ...roles.author, at: '11 Nov 2026 · 06:45' };
    const signed: SignedSnapshot = { id: 'signed-1', revision: 1, title: 'Ward progress note', clinicalTime: '11 Nov 2026 · 06:30', sections, author, signers: [author] };
    return { ...common, title: 'Ward progress note', context: 'IPD · General medicine · Ward 4 · 11 Nov 2026', clinicalTime: '11 Nov 2026 · 06:30', eventTime: '11 Nov 2026 · 06:45', fields: sections, versions: [signed], addenda: [], events: [{ id: 'event-1', title: 'Note signed', actor: author, time: author.at, revision: 1 }] };
  }
  const sections = [{ id: 'procedure', label: 'Procedure performed', value: 'Laparoscopic cholecystectomy.' }, { id: 'findings', label: 'Operative findings', value: 'Gallbladder removed intact. Haemostasis achieved.' }, { id: 'specimen', label: 'Specimen', value: 'Gallbladder sent to pathology.' }, { id: 'postoperative', label: 'Postoperative plan', value: 'Recovery monitoring, analgesia, advance diet as tolerated.' }];
  const surgeon = { ...signature('author', 'ot'), at: '11 Nov 2026 · 12:10' };
  const signed: SignedSnapshot = { id: 'signed-1', revision: 1, title: 'Operative note', clinicalTime: '11 Nov 2026 · 11:45', sections, author: surgeon, signers: [surgeon] };
  return { ...common, title: 'Operative note', context: 'OT · General surgery · 11 Nov 2026', clinicalTime: '11 Nov 2026 · 11:45', eventTime: '11 Nov 2026 · 12:10', fields: sections, versions: [signed], addenda: [], events: [{ id: 'event-1', title: 'Original note signed', actor: surgeon, time: surgeon.at, revision: 1 }] };
}

function buildModel(
  note: NoteRecord,
  actor: ClinicalNoteActor,
  panel: ClinicalNoteWorkspaceController['panel'],
  selectedSnapshot?: string,
  compareRevisions?: readonly [number, number],
  returnedReason?: string,
  errorReason = '',
  addendumText = '',
  addendumOpen = false,
  returnReason = '',
  savedAt?: string,
  addendumTime = '',
): ClinicalNoteWorkspaceViewModel {
  const current = note.versions.at(-1);
  const author = current?.author ?? signature('author', note.scenario);
  const editable = actor === 'author' && !note.enteredInError;
  const reviewer = actor === 'reviewer' && note.scenario === 'ipd' && !note.enteredInError;
  const awaiting = note.scenario === 'ipd' && current?.signers.length === 1 && !note.draft && !note.enteredInError;
  const content = note.draft?.fields ?? note.fields;
  const draftPrefix = note.draft ? `draft-${note.draft.baseRevision}:` : '';
  const status = note.enteredInError ? 'Entered in error'
    : current ? [
        `${current.revision > 1 ? 'Amended' : 'Signed'} · v${current.revision}`,
        awaiting ? 'Awaiting co-signature' : undefined,
        note.draft ? note.scenario === 'ipd' ? 'Correction draft' : 'Amendment draft' : undefined,
      ].filter(Boolean).join(' · ') : 'Draft';
  const actions: ClinicalNoteAction[] = [];
  let form: ClinicalNoteWorkspaceViewModel['form'];
  let review: ClinicalNoteSnapshotView | undefined;
  const canReadHistory = !note.enteredInError || canMarkEnteredInError(actor, note.scenario);
  if (current && canReadHistory) actions.push(action(panel === 'history' ? 'close-history' : 'history'));
  if (panel === 'error' && (editable || reviewer)) {
    form = {
      title: 'Mark note entered in error',
      fields: [{ id: 'error-reason', label: 'Reason', value: errorReason, multiline: true }],
      actions: [...(errorReason.trim() ? [action('confirm-enter-error')] : []), action('cancel')],
    };
  } else if (panel === 'return' && reviewer && awaiting) {
    form = {
      title: 'Return note for correction',
      fields: [{ id: 'return-reason', label: 'Reason for return', value: returnReason, multiline: true }],
      actions: [...(returnReason.trim() ? [action('confirm-return')] : []), action('cancel')],
    };
  } else if (panel === 'review' && reviewer && awaiting && current) {
    review = { ...snapshot(note, current), title: 'Review note for co-signature' };
    actions.push(action('cosign-note'), action('return-note'), action('cancel'));
  } else if (panel === 'review' && editable && (!current || note.draft || addendumOpen)) {
    const reviewTitle = addendumOpen ? 'Review telephone addendum' : note.draft ? 'Review corrected note' : 'Review consultation note';
    review = {
      id: `${note.id}-review`,
      title: reviewTitle,
      metadata: [
        'Review the full entry before signing.',
        ...(addendumOpen ? [`Clinical event: ${addendumTime.trim()}`] : []),
        ...(note.draft?.reason ? [`Reason · ${note.draft.reason.trim()}`] : []),
      ],
      sections: addendumOpen ? [{ id: 'telephone-update', label: 'Telephone update', value: addendumText.trim() }] : sections(content),
    };
    actions.push(action(addendumOpen ? 'sign-addendum' : note.scenario === 'ot' ? 'sign-amendment' : 'sign-note'), action('edit-note'));
  } else if (panel === 'editor' && editable && addendumOpen) {
    form = {
      title: 'Telephone addendum',
      fields: [
        { id: 'opd-addendum:clinical-time', label: 'Telephone call time', value: addendumTime },
        { id: 'opd-addendum:telephone-update', label: 'Telephone update', value: addendumText, multiline: true },
      ],
      actions: [...(addendumText.trim() && addendumTime.trim() ? [action('review-addendum')] : []), action('discard-addendum')],
    };
  } else if (panel === 'editor' && editable && (!current || note.draft)) {
    const reason = note.draft?.reason ?? '';
    form = {
      title: note.draft ? `Correction of signed version ${note.draft.baseRevision}` : 'Draft note',
      fields: [
        ...content.map(field => ({ ...field, id: draftPrefix + field.id, multiline: true })),
        ...(note.draft ? [{
          id: `${draftPrefix}change-reason`,
          label: note.scenario === 'ipd' ? 'Reason for correction' : 'Reason for amendment',
          value: reason,
          multiline: true,
        }] : []),
      ],
      actions: [
        action('save-draft'),
        ...(!note.draft || reason.trim() ? [action(note.scenario === 'ot' ? 'review-amendment' : 'review-note')] : []),
      ],
    };
  } else if (current && !note.draft && !addendumOpen && (editable || reviewer)) {
    if (editable && note.scenario === 'opd') actions.push(action('addendum'));
    if (editable && note.scenario === 'ot') actions.push(action('start-amendment'));
    actions.push(action('enter-error'));
  }

  const entries: ClinicalNoteHistoryEntry[] = [...note.events].reverse().map(event => {
    const item = event.snapshotId ?? (event.revision ? `signed-${event.revision}` : undefined);
    return {
      id: event.id,
      title: event.title,
      metadata: [
        `${event.actor.name} · ${event.actor.role}`, event.time,
        ...(event.revision ? [`Version ${event.revision}`] : []),
        ...(item === current?.id && !note.enteredInError ? ['Current version'] : []),
      ],
      ...(event.reason ? { reason: event.reason } : {}),
      actions: [
        ...(item ? [action(`view:${item}`)] : []),
        ...(!event.snapshotId && event.revision && event.revision > 1 && event.title === 'Amendment signed'
          ? [action(`compare:${event.revision - 1}:${event.revision}`)] : []),
      ],
    };
  });
  const selected = [...note.versions, ...note.addenda].find(item => item.id === selectedSnapshot);
  const pair = compareRevisions?.map(revision => note.versions.find(item => item.revision === revision));
  const comparison = pair?.[0] && pair[1] ? {
    title: 'Changed sections',
    previousLabel: `Version ${pair[0].revision}`,
    currentLabel: `Version ${pair[1].revision}`,
    rows: compare(pair[0], pair[1]),
  } : undefined;
  const queueEntries: ClinicalNoteHistoryEntry[] = reviewer && awaiting && current ? [{
    id: note.id,
    title: note.title,
    metadata: [`Signed by ${author.name}`, current.signers[0]!.at, 'Ward 4'],
    actions: panel === 'editor' || panel === 'history' ? [action('review-cosign')] : [],
  }] : [];

  return {
    title: note.title,
    context: note.context,
    status,
    metadata: [
      `Clinical event: ${note.clinicalTime}`,
      `Entered: ${note.eventTime}`,
      `Authored by ${author.name} · ${author.role}`,
    ],
    signatures: current && !note.enteredInError ? signatures(current) : undefined,
    message: returnedReason ? `Returned for correction · ${returnedReason}`
      : savedAt && form ? `Draft saved in this session · ${savedAt}` : undefined,
    current: current && !note.enteredInError ? snapshot(note, current) : undefined,
    addenda: note.enteredInError ? [] : note.addenda.map(item => snapshot(note, item)),
    form,
    review,
    actions,
    queue: { title: 'Co-signature queue', emptyLabel: 'No notes awaiting your co-signature.', entries: queueEntries },
    history: panel === 'history' && canReadHistory ? {
      title: 'Note history',
      entries,
      snapshot: selected ? snapshot(note, selected) : undefined,
      comparison,
    } : undefined,
  };
}
