import type { EmrBadge } from './models.js';

export type SpectaclePrescriptionFieldType = 'text' | 'decimal' | 'integer' | 'select';

export type VaChartType = 'snellen-6m' | 'snellen-20ft' | 'logmar' | 'etdrs' | 'decimal';

export interface SpectaclePrescriptionField {
  id: string;
  label: string;
  type: SpectaclePrescriptionFieldType;
  unit?: string;
  placeholder?: string;
  options?: readonly { value: string; label: string; disabled?: boolean }[];
  readOnly?: boolean;
  disabled?: boolean;
}

export interface SpectaclePrescriptionEye {
  id: string;
  label: string;
  shortLabel?: string;
}

export interface KaleidoscopeIopReading {
  valueLabel: string;
  methodLabel: string;
  timeLabel?: string;
  deltaLabel?: string;
  pachymetryLabel?: string;
  flag?: EmrBadge;
}

export interface KaleidoscopeSlitLampRow {
  id: string;
  label: string;
  normalPreset: string;
  quickFindings: readonly string[];
  odValue: string;
  osValue: string;
  modifiedOd?: boolean;
  modifiedOs?: boolean;
}

export interface SpectaclePrescriptionViewModel {
  id: string;
  label: string;
  description?: string;
  fields: readonly SpectaclePrescriptionField[];
  eyes: readonly SpectaclePrescriptionEye[];
  values: Readonly<Record<string, Readonly<Record<string, string | undefined>>>>;
  notes?: Readonly<Record<string, string | undefined>>;
  errors?: Readonly<Record<string, string | undefined>>;
  warnings?: Readonly<Record<string, string | undefined>>;
  readOnly?: boolean;
  /** Active Visual Acuity chart scale in top-left settings (Snellen 6m, Snellen 20ft, LogMAR, ETDRS, Decimal). */
  vaChartType?: VaChartType;
  /** Controller-supplied or resolved LogMAR equivalent per eye (e.g. { od: '0.00', os: '+0.18' }). */
  logMarEquivalents?: Readonly<Record<string, string | undefined>>;
  /** Epic Kaleidoscope IOP Tonometry readings per eye (od / os). */
  iopReadings?: Readonly<Record<string, KaleidoscopeIopReading>>;
  /** Epic Kaleidoscope Paired OD / OS Slit-Lamp & Fundus Examination rows. */
  slitLampRows?: readonly KaleidoscopeSlitLampRow[];
}

export type SpectaclePrescriptionIntent =
  | { type: 'cellFocused'; eyeId: string; fieldId: string }
  | { type: 'cellEditRequested'; eyeId: string; fieldId: string; value: string }
  | { type: 'cellStepped'; eyeId: string; fieldId: string; delta: number }
  | { type: 'vaChartTypeChanged'; chartType: VaChartType }
  | { type: 'copyEyeRequested'; fromEyeId: string; toEyeId: string }
  | { type: 'notesEditRequested'; eyeId: string; value: string }
  | { type: 'slitLampChanged'; rowId: string; eyeId: 'od' | 'os'; value: string }
  | { type: 'slitLampMacroNormalRequested'; scope: 'ou' | 'od' | 'os'; rowId?: string }
  | { type: 'slitLampCopyEyeRequested'; fromEyeId: 'od' | 'os'; toEyeId: 'od' | 'os'; rowId?: string };
