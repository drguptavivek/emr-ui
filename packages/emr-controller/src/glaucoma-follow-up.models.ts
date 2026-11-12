import type { DiagnosticResultViewModel } from './diagnostic-result.models.js';

export type GlaucomaFollowUpEye = 'od' | 'os';

export interface GlaucomaFollowUpResult {
  readonly id: string;
  readonly orderId: string;
  readonly eye: GlaucomaFollowUpEye;
  readonly report: DiagnosticResultViewModel;
  /** Advance the revision when the report changes. Acknowledgement applies to this revision. */
  readonly revision?: number;
  readonly corrected?: boolean;
  readonly acknowledged: boolean;
}

export interface GlaucomaFollowUpAmendment {
  readonly baseRevision: number;
  readonly reason: string;
}

export interface GlaucomaSignedRevision {
  readonly revision: number;
  readonly examination: GlaucomaFollowUpEncounter['examination'];
  readonly followUp: string;
  readonly results: readonly GlaucomaFollowUpResult[];
  readonly amendment?: GlaucomaFollowUpAmendment;
}

export interface GlaucomaFollowUpEncounter {
  readonly patientId: string;
  readonly encounterId: string;
  readonly revision: number;
  readonly status: 'draft' | 'signed';
  readonly examination: { readonly od: string; readonly os: string };
  readonly orders: readonly { readonly id: string; readonly eye: GlaucomaFollowUpEye }[];
  readonly results: readonly GlaucomaFollowUpResult[];
  readonly amendment?: GlaucomaFollowUpAmendment;
  /** Oldest first. An archive records the result versions and review state at signing. */
  readonly signedRevisions?: readonly GlaucomaSignedRevision[];
  readonly followUp: string;
}

/** Repository operations must authorize the selected encounter and enforce the supplied revision.
 * Decode external data into the complete encounter and diagnostic report types, including optional extensions, before returning it.
 */
export interface GlaucomaFollowUpRepository {
  load(selection: { patientId: string; encounterId: string }, signal: AbortSignal): Promise<GlaucomaFollowUpEncounter>;
  saveDraft(encounter: GlaucomaFollowUpEncounter, signal: AbortSignal): Promise<GlaucomaFollowUpEncounter>;
  sign(encounter: GlaucomaFollowUpEncounter, signal: AbortSignal): Promise<GlaucomaFollowUpEncounter>;
  /** Creates a new draft against the current signature. Repositories that amend must archive every new signature. */
  amend?(encounter: GlaucomaFollowUpEncounter, reason: string, signal: AbortSignal): Promise<GlaucomaFollowUpEncounter>;
  /** Reviews an exact report revision independently of the note. The response retains the note revision. */
  acknowledge?(request: { patientId: string; encounterId: string; resultId: string; resultRevision: number }, signal: AbortSignal): Promise<GlaucomaFollowUpEncounter>;
}

export interface GlaucomaFollowUpState {
  readonly status: 'idle' | 'loading' | 'ready' | 'saving' | 'signing' | 'amending' | 'refreshingResults' | 'acknowledgingResult' | 'error';
  readonly encounter: GlaucomaFollowUpEncounter | null;
  readonly dirty: boolean;
  readonly error: string | null;
}

export type GlaucomaFollowUpIntent =
  | { type: 'select'; patientId: string; encounterId: string }
  | { type: 'editEye'; eye: GlaucomaFollowUpEye; value: string }
  | { type: 'acknowledgeResult'; resultId: string; resultRevision?: number }
  | { type: 'refreshResults' }
  | { type: 'amendRequested'; reason: string }
  | { type: 'setFollowUp'; value: string }
  | { type: 'discardRequested' }
  | { type: 'saveDraft' }
  | { type: 'sign' };
