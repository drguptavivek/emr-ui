import type {
  EmrLikertAnchor,
  EmrLikertAnchorsSummary,
  EmrLikertOption,
  EmrLikertPoint,
  EmrTone,
} from '@drguptavivek/emr-controller';

export function buildLikertPoints(options: {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly value?: number | null;
  readonly anchors?: readonly EmrLikertAnchor[];
  readonly options?: readonly EmrLikertOption[];
  readonly showOptionLabels?: boolean;
  readonly tone?: EmrTone;
  readonly optionTones?: Readonly<Record<number, EmrTone>>;
  readonly maxPoints?: number;
}): readonly EmrLikertPoint[] {
  const anchorMap = new Map<number, EmrLikertAnchor>();
  for (const a of options.anchors ?? []) {
    anchorMap.set(a.value, a);
  }
  const cap = options.maxPoints ?? 101;
  if (options.options && options.options.length > 0) {
    return options.options.slice(0, cap).map((opt) => {
      const anchor = anchorMap.get(opt.value);
      const showLabel = options.showOptionLabels !== false;
      const label = showLabel ? opt.label : String(opt.value);
      const description = opt.description ?? (showLabel ? undefined : opt.label);
      const spokenBase = opt.assistiveLabel ?? (description ? `${label} — ${description}` : label);
      return {
        value: opt.value,
        label,
        description,
        assistiveLabel: spokenBase,
        selected: options.value === opt.value,
        tone: opt.tone ?? options.optionTones?.[opt.value] ?? options.tone,
        anchorLabel: anchor?.label,
      };
    });
  }
  const min = Number.isFinite(options.min) ? Math.trunc(options.min!) : 0;
  const max = Number.isFinite(options.max) ? Math.trunc(options.max!) : 10;
  if (max < min) return [];
  const step = Number.isFinite(options.step) && options.step! >= 1 ? Math.trunc(options.step!) : 1;
  const points: EmrLikertPoint[] = [];
  for (let n = min; n <= max && points.length < cap; n += step) {
    const anchor = anchorMap.get(n);
    const label = String(n);
    const description = options.showOptionLabels && anchor ? anchor.label : undefined;
    const assistiveText = anchor ? (anchor.assistiveLabel ?? anchor.label) : '';
    points.push({
      value: n,
      label,
      description,
      assistiveLabel: assistiveText ? `${label} — ${assistiveText}` : label,
      selected: options.value === n,
      tone: options.optionTones?.[n] ?? options.tone,
      anchorLabel: anchor?.label,
    });
  }
  return points;
}

export function resolveLikertAnchors(
  points: readonly EmrLikertPoint[],
  anchors: readonly EmrLikertAnchor[] = [],
): EmrLikertAnchorsSummary {
  if (points.length === 0 || anchors.length === 0) {
    return { start: null, mid: null, end: null };
  }
  const firstVal = points[0]!.value;
  const lastVal = points[points.length - 1]!.value;
  const midVal = points.length > 2 ? points[Math.floor(points.length / 2)]!.value : undefined;
  const byVal = new Map(anchors.map((a) => [a.value, a]));
  return {
    start: byVal.get(firstVal) ?? null,
    mid: midVal !== undefined && midVal !== firstVal && midVal !== lastVal ? (byVal.get(midVal) ?? null) : null,
    end: lastVal !== firstVal ? (byVal.get(lastVal) ?? null) : null,
  };
}
