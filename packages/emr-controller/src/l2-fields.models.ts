import type { ClinicalAssessmentStatus, ClinicalOption, EmrBadge, EmrTone } from './models.js';
import type { ClinicalAssessmentStatusOption } from './clinical-form.models.js';
import type { EmrFieldDefinition, EmrPartialDate } from './field-contract.models.js';
import type { EmrValidationMessage } from './validation.models.js';

// ─────────────────────────────────────────────────────────────
// Shared L1 mechanical data structures (serializable, no DOM handles)
// ─────────────────────────────────────────────────────────────

export interface EmrSegmentedOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  readonly badge?: string;
}

export interface EmrFileSelectionItem {
  readonly name: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly lastModified?: number;
}

// ─────────────────────────────────────────────────────────────
// Canonical datetime wire-format helpers (UTC ISO-8601 <-> local wall-clock)
// ─────────────────────────────────────────────────────────────

const pad2 = (n: number): string => String(n).padStart(2, '0');
const pad4 = (n: number): string => String(n).padStart(4, '0');

/**
 * Normalizes either a UTC/offset ISO-8601 instant (`'2026-10-14T09:30:00Z'`) or a
 * zone-less local datetime string (`'2026-10-14T15:00'`) into the local wall-clock
 * `'YYYY-MM-DDTHH:mm'` (or `'YYYY-MM-DDTHH:mm:ss'`) string expected by native
 * `datetime-local` controls. Never shifts UTC by stripping `'Z'`.
 */
export function toLocalDateTimeInputValue(
  value: string | null | undefined,
  precision: 'minute' | 'second' = 'minute'
): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  if (!zoned) {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);
    if (!m) return '';
    return precision === 'second'
      ? `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}`
      : `${m[1]}T${m[2]}:${m[3]}`;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  const datePart = `${pad4(parsed.getFullYear())}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
  const hm = `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
  return precision === 'second' ? `${datePart}T${hm}:${pad2(parsed.getSeconds())}` : `${datePart}T${hm}`;
}

/**
 * Converts a local wall-clock datetime (`'YYYY-MM-DDTHH:mm'` or `'YYYY-MM-DDTHH:mm:ss'`)
 * into the canonical UTC ISO-8601 wire string (`'YYYY-MM-DDTHH:mm:ssZ'`), or `null` when empty/invalid.
 */
export function localDateTimeToUtcIso(localValue: string | null | undefined): string | null {
  if (!localValue) return null;
  const trimmed = localValue.trim();
  if (!trimmed) return null;
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6] ?? '0');
  const instant = new Date(year, month - 1, day, hour, minute, second);
  if (Number.isNaN(instant.getTime())) return null;
  return instant.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// ─────────────────────────────────────────────────────────────
// L2 Contract-Completing Field Models & Intents
// ─────────────────────────────────────────────────────────────

// 1. EmrScaleField (Likert / VAS + six-state ClinicalAssessmentStatus)
export interface ScaleFieldViewModel {
  readonly definition?: EmrFieldDefinition;
  readonly label: string;
  readonly variant: 'likert' | 'vas';
  readonly value: number | null;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly majorInterval?: number;
  readonly minorInterval?: number;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly anchors?: {
    readonly minLabel?: string;
    readonly midLabel?: string;
    readonly maxLabel?: string;
  };
  readonly optionTones?: Readonly<Record<number, EmrTone>>;
  readonly tone?: EmrTone;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type ScaleFieldIntent =
  | { readonly type: 'valueChangeRequested'; readonly value: number | null }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 2. EmrPartialDateField (Year / Year-Month / Full-Date + status)
export interface PartialDateFieldViewModel {
  readonly label: string;
  readonly value: EmrPartialDate | null;
  readonly min?: string;
  readonly max?: string;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type PartialDateFieldIntent =
  | { readonly type: 'precisionChangeRequested'; readonly precision: EmrPartialDate['precision'] }
  | { readonly type: 'valueChangeRequested'; readonly value: EmrPartialDate | null }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 3. EmrAttachmentField (File / Camera / Scanner attachment refs + status)
export interface EmrAttachmentRef {
  readonly id: string;
  readonly title: string;
  readonly contentType: string;
  readonly sizeBytes?: number;
  readonly uploadedAt?: string;
  readonly statusBadge?: EmrBadge;
  readonly url?: string;
}

export interface AttachmentFieldViewModel {
  readonly label: string;
  readonly items: readonly EmrAttachmentRef[];
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxItems?: number;
  readonly allowCamera?: boolean;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type AttachmentFieldIntent =
  | { readonly type: 'filesSelected'; readonly files: readonly EmrFileSelectionItem[] }
  | { readonly type: 'captureRequested'; readonly mode: 'camera' | 'scanner' }
  | { readonly type: 'itemSelected'; readonly id: string }
  | { readonly type: 'itemRemoveRequested'; readonly id: string }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 4. EmrPairedField (BP Systolic/Diastolic, C/D ratio, OD/OS paired entry)
export interface EmrPairedFieldValue {
  readonly first: string | number | null;
  readonly second: string | number | null;
}

export interface PairedFieldViewModel {
  readonly label: string;
  readonly mode?: 'text' | 'decimal' | 'integer';
  readonly firstLabel: string;
  readonly secondLabel: string;
  readonly firstPlaceholder?: string;
  readonly secondPlaceholder?: string;
  readonly separator?: string;
  readonly unit?: string;
  readonly value: EmrPairedFieldValue | null;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type PairedFieldIntent =
  | { readonly type: 'firstChangeRequested'; readonly value: string | number | null }
  | { readonly type: 'secondChangeRequested'; readonly value: string | number | null }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 5. EmrDurationInput (Amount + UCUM calendar/time unit)
export type EmrDurationUnit = 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';

export interface EmrDurationValue {
  readonly amount: number | null;
  readonly unit: EmrDurationUnit;
}

export interface DurationFieldViewModel {
  readonly label: string;
  readonly value: EmrDurationValue | null;
  readonly unitOptions: readonly { readonly value: EmrDurationUnit; readonly label: string }[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type DurationFieldIntent =
  | { readonly type: 'amountChangeRequested'; readonly amount: number | null }
  | { readonly type: 'unitChangeRequested'; readonly unit: EmrDurationUnit }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 6. EmrRangeField (Low–High numeric or date range)
export interface EmrRangeValue {
  readonly low: number | string | null;
  readonly high: number | string | null;
}

export interface RangeFieldViewModel {
  readonly label: string;
  readonly kind: 'number' | 'date';
  readonly value: EmrRangeValue | null;
  readonly unit?: string;
  readonly min?: number | string;
  readonly max?: number | string;
  readonly step?: number;
  readonly lowPlaceholder?: string;
  readonly highPlaceholder?: string;
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type RangeFieldIntent =
  | { readonly type: 'lowChangeRequested'; readonly low: number | string | null }
  | { readonly type: 'highChangeRequested'; readonly high: number | string | null };

// 7. EmrSignatureCaptureField (Stylus/pointer drawn signature pad)
export interface EmrSignaturePoint {
  readonly x: number;
  readonly y: number;
}

export interface EmrSignatureStroke {
  readonly points: readonly EmrSignaturePoint[];
}

export interface SignatureCaptureViewModel {
  readonly label: string;
  readonly signatoryName?: string;
  readonly signatoryRole?: string;
  readonly signedAt?: string;
  readonly strokes: readonly EmrSignatureStroke[];
  readonly width?: number;
  readonly height?: number;
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type SignatureCaptureIntent =
  | { readonly type: 'strokeAdded'; readonly stroke: EmrSignatureStroke }
  | { readonly type: 'clearRequested' };

// 8. EmrPhoneInput (FHIR ContactPoint phone + messaging channels)
export type EmrPhoneChannel = 'voice' | 'sms' | 'whatsapp';

export interface PhoneFieldViewModel {
  readonly label: string;
  readonly countryCode: string;
  readonly countryOptions: readonly { readonly code: string; readonly label: string }[];
  readonly nationalNumber: string;
  readonly extension?: string;
  readonly channels?: readonly EmrPhoneChannel[];
  readonly availableChannels?: readonly { readonly id: EmrPhoneChannel; readonly label: string }[];
  readonly verifiedBadge?: EmrBadge;
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type PhoneFieldIntent =
  | { readonly type: 'countryCodeChangeRequested'; readonly countryCode: string }
  | { readonly type: 'numberChangeRequested'; readonly nationalNumber: string }
  | { readonly type: 'extensionChangeRequested'; readonly extension: string }
  | { readonly type: 'channelToggleRequested'; readonly channel: EmrPhoneChannel };

// 9. EmrAddressField (Structured regional/FHIR Address)
export interface EmrAddressValue {
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly district?: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface AddressFieldViewModel {
  readonly label: string;
  readonly use?: 'home' | 'work' | 'temp' | 'billing';
  readonly useOptions?: readonly { readonly value: 'home' | 'work' | 'temp' | 'billing'; readonly label: string }[];
  readonly value: EmrAddressValue;
  readonly stateOptions?: readonly ClinicalOption[];
  readonly countryOptions?: readonly ClinicalOption[];
  readonly showDistrict?: boolean;
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type AddressFieldIntent =
  | { readonly type: 'fieldChangeRequested'; readonly part: keyof EmrAddressValue; readonly value: string }
  | { readonly type: 'useChangeRequested'; readonly use: 'home' | 'work' | 'temp' | 'billing' };

// 10. EmrMacroTextField (Narrative note field with controlled '.' / '/' SmartPhrase expansion)
export interface EmrMacroSuggestion {
  readonly trigger: string;
  readonly label: string;
  readonly expansionPreview: string;
}

export interface MacroTextFieldViewModel {
  readonly label: string;
  readonly value: string;
  readonly suggestions: readonly EmrMacroSuggestion[];
  readonly suggestionsOpen: boolean;
  readonly dictating?: boolean;
  readonly rows?: number;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type MacroTextFieldIntent =
  | { readonly type: 'valueChangeRequested'; readonly value: string }
  | { readonly type: 'macroQueryRequested'; readonly trigger: string }
  | { readonly type: 'macroSelected'; readonly trigger: string }
  | { readonly type: 'macroDismissRequested' }
  | { readonly type: 'dictationToggleRequested' };

// 11. EmrLateralityField (OD/OS/OU or Right/Left/Bilateral with optional surgical-site confirmation)
export type EmrLateralityCode =
  | 'OD'
  | 'OS'
  | 'OU'
  | 'right'
  | 'left'
  | 'bilateral'
  | 'unilateral-unspecified';

export interface LateralityFieldViewModel {
  readonly label: string;
  readonly domain?: 'ophthalmic' | 'anatomic';
  readonly value: EmrLateralityCode | null;
  readonly options: readonly {
    readonly code: EmrLateralityCode;
    readonly label: string;
    readonly shortLabel?: string;
  }[];
  readonly requiresConfirmation?: boolean;
  readonly confirmed?: boolean;
  readonly confirmationLabel?: string;
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type LateralityFieldIntent =
  | { readonly type: 'lateralitySelected'; readonly code: EmrLateralityCode | null }
  | { readonly type: 'confirmationChangeRequested'; readonly confirmed: boolean };

// 12. EmrVisualAcuityField (Snellen / LogMAR / ETDRS + Low Vision + Pinhole)
export type EmrAcuityNotation = 'snellen-m' | 'snellen-ft' | 'logmar' | 'etdrs' | 'low-vision';
export type EmrAcuityCorrection = 'unaided' | 'habitual' | 'best-corrected' | 'contact-lens';

export interface VisualAcuityFieldViewModel {
  readonly label: string;
  readonly eye?: 'OD' | 'OS' | 'OU';
  readonly notation: EmrAcuityNotation;
  readonly notationOptions: readonly { readonly value: EmrAcuityNotation; readonly label: string }[];
  readonly correction: EmrAcuityCorrection;
  readonly correctionOptions: readonly { readonly value: EmrAcuityCorrection; readonly label: string }[];
  readonly value: string | null;
  readonly valueOptions: readonly ClinicalOption[];
  readonly pinholeValue?: string | null;
  readonly showPinhole?: boolean;
  readonly derivedDisplay?: string;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type VisualAcuityFieldIntent =
  | { readonly type: 'notationChangeRequested'; readonly notation: EmrAcuityNotation }
  | { readonly type: 'correctionChangeRequested'; readonly correction: EmrAcuityCorrection }
  | { readonly type: 'valueChangeRequested'; readonly value: string | null }
  | { readonly type: 'pinholeChangeRequested'; readonly value: string | null }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };

// 13. EmrRefractionField (Sphere / Cylinder / Axis / Add clinical refraction)
export interface EmrRefractionValue {
  readonly sphere: number | null;
  readonly cylinder: number | null;
  readonly axis: number | null;
  readonly nearAdd?: number | null;
}

export interface RefractionFieldViewModel {
  readonly label: string;
  readonly eye?: 'OD' | 'OS';
  readonly value: EmrRefractionValue;
  readonly sphereStep?: number;
  readonly cylinderStep?: number;
  readonly showNearAdd?: boolean;
  readonly formattedSummary?: string;
  readonly status?: ClinicalAssessmentStatus;
  readonly statusOptions?: readonly ClinicalAssessmentStatusOption[];
  readonly hint?: string;
  readonly messages?: readonly EmrValidationMessage[];
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

export type RefractionFieldIntent =
  | { readonly type: 'sphereChangeRequested'; readonly sphere: number | null }
  | { readonly type: 'cylinderChangeRequested'; readonly cylinder: number | null }
  | { readonly type: 'axisChangeRequested'; readonly axis: number | null }
  | { readonly type: 'nearAddChangeRequested'; readonly nearAdd: number | null }
  | { readonly type: 'statusChangeRequested'; readonly status: ClinicalAssessmentStatus | undefined };
