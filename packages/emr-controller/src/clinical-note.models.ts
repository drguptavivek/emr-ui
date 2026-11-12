/** Controlled presentation contract for the clinical note workspace. */
export interface ClinicalNoteAction {
  readonly id: string;
  readonly label: string;
  readonly primary?: boolean;
}

export interface ClinicalNoteField {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly multiline?: boolean;
}

export interface ClinicalNoteSection {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface ClinicalNoteSignatureView {
  readonly signerId: string;
  readonly name: string;
  readonly role: string;
  readonly signedAtLabel: string;
  readonly purpose: 'sign' | 'co-sign';
  readonly method: 'attestation' | 'digital';
  /** Host-supplied verification of the signature on this exact record. */
  readonly verification?:
    | { readonly status: 'verified'; readonly label: string; readonly verifiedAtLabel: string; readonly evidenceId: string }
    | { readonly status: 'unverified' | 'unavailable'; readonly label: string };
}

export interface ClinicalNoteSnapshotView {
  readonly id: string;
  readonly title: string;
  readonly metadata: readonly string[];
  readonly signatures?: readonly ClinicalNoteSignatureView[];
  readonly sections: readonly ClinicalNoteSection[];
}

export interface ClinicalNoteHistoryEntry {
  readonly id: string;
  readonly title: string;
  readonly metadata: readonly string[];
  readonly reason?: string;
  readonly actions: readonly ClinicalNoteAction[];
}

export interface ClinicalNoteComparisonRow {
  readonly id: string;
  readonly label: string;
  readonly previous: string | null;
  readonly current: string | null;
}

export interface ClinicalNoteWorkspaceViewModel {
  readonly title: string;
  readonly context: string;
  readonly status: string;
  readonly metadata: readonly string[];
  readonly signatures?: readonly ClinicalNoteSignatureView[];
  readonly message?: string;
  readonly error?: string;
  readonly current?: ClinicalNoteSnapshotView;
  readonly addenda: readonly ClinicalNoteSnapshotView[];
  readonly form?: {
    readonly title: string;
    readonly fields: readonly ClinicalNoteField[];
    readonly actions: readonly ClinicalNoteAction[];
  };
  readonly review?: ClinicalNoteSnapshotView;
  readonly actions: readonly ClinicalNoteAction[];
  readonly queue: {
    readonly title: string;
    readonly emptyLabel: string;
    readonly entries: readonly ClinicalNoteHistoryEntry[];
  };
  readonly history?: {
    readonly title: string;
    readonly entries: readonly ClinicalNoteHistoryEntry[];
    readonly snapshot?: ClinicalNoteSnapshotView;
    readonly comparison?: {
      readonly title: string;
      readonly previousLabel: string;
      readonly currentLabel: string;
      readonly rows: readonly ClinicalNoteComparisonRow[];
    };
  };
}

export type ClinicalNoteWorkspaceIntent =
  | { readonly type: 'actionRequested'; readonly actionId: string }
  | { readonly type: 'fieldChanged'; readonly fieldId: string; readonly value: string };
