import type {
  EmrTimeAxisLabels,
  TimeAxisIntent,
  TimeAxisTick,
  TimeAxisViewModel,
} from '@drguptavivek/emr-controller';

export interface ResolvedTimeAxisLabels {
  readonly title: string;
  readonly empty: string;
  readonly step: string;
  readonly stepValue: (label: string) => string;
  readonly earlier: string;
  readonly later: string;
  readonly current: string;
  readonly selected: string;
}

const DEFAULT_TIME_AXIS_LABELS: ResolvedTimeAxisLabels = {
  title: 'Time axis',
  empty: 'No times supplied.',
  step: 'Step',
  stepValue: (label: string) => `Step: ${label}`,
  earlier: 'Earlier',
  later: 'Later',
  current: 'Current',
  selected: 'selected',
};

export function resolveTimeAxisLabels(labels?: EmrTimeAxisLabels): ResolvedTimeAxisLabels {
  return { ...DEFAULT_TIME_AXIS_LABELS, ...labels };
}

export function resolveTimeAxisId(axisId: string, idPrefix = ''): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  const cleanId = axisId.trim() || 'time-axis';
  return prefix ? `${prefix}-emr-time-axis-${cleanId}` : `emr-time-axis-${cleanId}`;
}

export function resolveTimeAxisHeadingId(
  axisId: string,
  idPrefix = '',
  headingId?: string | null,
): string {
  const explicit = headingId?.trim();
  if (explicit) return explicit;
  return `${resolveTimeAxisId(axisId, idPrefix)}-heading`;
}

export function resolveTimeAxisTickId(
  axisId: string,
  tickId: string,
  idPrefix = '',
): string {
  return `${resolveTimeAxisId(axisId, idPrefix)}-tick-${tickId}`;
}

export function resolveTimeAxisStepSelectId(axisId: string, idPrefix = ''): string {
  return `${resolveTimeAxisId(axisId, idPrefix)}-step`;
}

export function canSelectTimeAxisSlot(
  model: Pick<TimeAxisViewModel, 'readOnly' | 'ticks'>,
  tickId: string,
): boolean {
  if (model.readOnly) return false;
  return model.ticks.some((tick) => tick.id === tickId);
}

export function canChangeTimeAxisStep(
  model: Pick<TimeAxisViewModel, 'readOnly' | 'steps'>,
  stepId: string,
): boolean {
  if (model.readOnly || !model.steps?.length) return false;
  return model.steps.some((step) => step.id === stepId);
}

export function canPanTimeAxis(
  model: Pick<TimeAxisViewModel, 'readOnly' | 'canShiftEarlier' | 'canShiftLater'>,
  direction: 'earlier' | 'later',
): boolean {
  if (model.readOnly) return false;
  return direction === 'earlier' ? Boolean(model.canShiftEarlier) : Boolean(model.canShiftLater);
}

export function canTriggerTimeAxisIntent(
  model: TimeAxisViewModel,
  intent: TimeAxisIntent,
): boolean {
  switch (intent.type) {
    case 'tickSelected':
      return canSelectTimeAxisSlot(model, intent.tickId);
    case 'stepChangeRequested':
      return canChangeTimeAxisStep(model, intent.stepId);
    case 'shiftEarlierRequested':
      return canPanTimeAxis(model, 'earlier');
    case 'shiftLaterRequested':
      return canPanTimeAxis(model, 'later');
  }
}

export function resolveTimeAxisTabStopId(
  ticks: readonly Pick<TimeAxisTick, 'id' | 'current'>[],
  focusedId?: string | null,
  selectedTickId?: string | null,
): string | undefined {
  const has = (id: string | null | undefined): id is string =>
    Boolean(id && ticks.some((tick) => tick.id === id));
  if (has(focusedId)) return focusedId;
  if (has(selectedTickId)) return selectedTickId;
  return ticks.find((tick) => tick.current)?.id ?? ticks[0]?.id;
}

export function resolveTimeAxisNextIndex(
  key: string,
  currentIndex: number,
  count: number,
): number | null {
  if (count <= 0) return null;
  const clamped = currentIndex >= 0 && currentIndex < count ? currentIndex : 0;
  switch (key) {
    case 'ArrowRight':
      return Math.min(clamped + 1, count - 1);
    case 'ArrowLeft':
      return Math.max(clamped - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
