import type { ClinicalFieldValue } from './clinical-form.models.js';
import type { EmrTone } from './models.js';

// ─────────────────────────────────────────────────────────────
// Scoring stays OUT of the UI. This is a standing constraint of the
// library: components never interpret clinical values. A UI renders a
// controller-computed {@link EmrScoreResult} and nothing more — it must
// never sum answers, threshold a total, or pick a severity label itself.
// ─────────────────────────────────────────────────────────────

export interface EmrScoreResult {
  readonly total: number;
  /**
   * Controller-supplied severity/band label (e.g. "Moderate depression").
   * NEVER inferred by the UI from `total` — thresholding a raw score against
   * a band is clinical interpretation, and clinical interpretation does not
   * belong in the presentation layer.
   */
  readonly bandLabel: string;
  /**
   * Controller-supplied tone for the band (e.g. `warning` for a raised
   * score). Like `bandLabel`, this is never derived by the UI from `total`.
   */
  readonly bandTone: EmrTone;
  readonly components?: readonly {
    id: string;
    label: string;
    value: number;
  }[];
  readonly subscales?: readonly {
    id?: string;
    label: string;
    value: number | string;
    bandLabel?: string;
    max?: number;
  }[];
  readonly missingItems?: readonly string[];
  readonly completenessLabel?: string;
  readonly interpretation?: string;
  readonly computedAt?: string; // ISO-8601
  readonly computedAtLabel?: string;
  readonly provenance?: string;
}

export interface EmrScoringPort {
  score(
    instrumentId: string,
    answers: Readonly<Record<string, ClinicalFieldValue>>,
    signal?: AbortSignal,
  ): Promise<EmrScoreResult>;
}
