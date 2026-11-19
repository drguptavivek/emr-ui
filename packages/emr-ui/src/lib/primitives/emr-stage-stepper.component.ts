import { booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import type {
  EmrBadge,
  EmrStage,
  EmrStageStepperIntent,
  EmrStageStepperOrientation,
  EmrStageStepperSize,
} from '@drguptavivek/emr-controller';

export type { EmrStage, EmrStageStepperIntent, EmrStageStepperOrientation, EmrStageStepperSize };

/**
 * Numbered stage navigation. Mechanical: the caller supplies stages, the active id and any
 * status badge; the stepper infers nothing about completion or order validity.
 * Emits `stageSelected` and `intent` with the stage id. With `readOnly` the stage buttons remain
 * focusable with `aria-readonly="true"` and emit nothing.
 * Roving tabindex: one tab stop (focused enabled stage, else active, else first enabled).
 */
@Component({
  selector: 'emr-stage-stepper',
  standalone: true,
  template: `
    <nav
      class="emr-stage-stepper"
      [id]="controlId() ?? null"
      [class.emr-stage-stepper--sm]="size() === 'sm'"
      [class.emr-stage-stepper--disabled]="disabled()"
      [class.emr-stage-stepper--readonly]="readOnly()"
      [attr.aria-label]="ariaLabel()"
      [attr.data-orientation]="orientation()"
    >
      <ol class="emr-stage-stepper__list">
        @for (stage of stages(); track stage.id; let index = $index) {
          <li class="emr-stage-stepper__item">
            <button
              type="button"
              class="emr-stage-stepper__stage"
              [id]="stageDomId(stage.id)"
              [class.emr-stage-stepper__stage--active]="stage.id === activeId()"
              [class.emr-stage-stepper__stage--completed]="isCompleted(stage.id)"
              [class.emr-stage-stepper__stage--readonly]="readOnly()"
              [class.emr-stage-stepper__stage--disabled]="isStageDisabled(stage)"
              [disabled]="isStageDisabled(stage)"
              [attr.aria-current]="stage.id === activeId() ? 'step' : null"
              [attr.aria-readonly]="readOnly() ? 'true' : null"
              [attr.aria-disabled]="isStageDisabled(stage) ? 'true' : null"
              [attr.tabindex]="stage.id === tabStopId() ? 0 : -1"
              (focus)="focusedId.set(stage.id)"
              (keydown)="onKeydown($event, index)"
              (click)="onStageClick(stage)"
            >
              <span class="emr-stage-stepper__number" aria-hidden="true">
                @if (isCompleted(stage.id)) {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                } @else {
                  {{ index + 1 }}
                }
              </span>
              <span class="emr-stage-stepper__text">
                <span class="emr-stage-stepper__label">{{ stage.label }}</span>
                @if (stage.description) {
                  <span class="emr-stage-stepper__description">{{ stage.description }}</span>
                }
              </span>
              @if (stage.status; as status) {
                <span class="emr-stage-stepper__badge" [attr.data-tone]="status.tone">
                  {{ status.label }}@if (status.assistiveText) { <span class="emr-sr-only"> ({{ status.assistiveText }})</span> }
                </span>
              }
            </button>
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    emr-stage-stepper { display: block; container-type: inline-size; color: var(--emr-text); }
    .emr-stage-stepper--disabled { opacity: 0.55; }
    .emr-stage-stepper__list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; border: 1px solid var(--emr-border); border-radius: var(--emr-radius, 8px); overflow: hidden; background: var(--emr-surface-slate); }
    .emr-stage-stepper--readonly .emr-stage-stepper__list { border-style: dashed; }
    .emr-stage-stepper__item { flex: 1 1 auto; min-width: 0; border-inline-end: 1px solid var(--emr-border); }
    .emr-stage-stepper__item:last-child { border-inline-end: 0; }
    .emr-stage-stepper__stage { box-sizing: border-box; width: 100%; min-height: 44px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; border: 0; background: transparent; color: var(--emr-text); font: inherit; font-size: var(--emr-text-md); text-align: start; transition: background-color 140ms ease, color 140ms ease; }
    .emr-stage-stepper--sm .emr-stage-stepper__stage { padding: 8px 10px; font-size: var(--emr-text-sm); }
    button.emr-stage-stepper__stage:not(:disabled):not(.emr-stage-stepper__stage--readonly) { cursor: pointer; }
    button.emr-stage-stepper__stage:not(:disabled):not(.emr-stage-stepper__stage--readonly):hover { background: var(--emr-surface-soft); }
    .emr-stage-stepper__stage--readonly { cursor: default; }
    .emr-stage-stepper__stage--disabled { opacity: 0.55; cursor: not-allowed; }
    .emr-stage-stepper__stage--active { background: var(--emr-surface-accent); color: var(--emr-primary); box-shadow: inset 0 -3px var(--emr-primary); font-weight: 600; }
    .emr-stage-stepper__stage--completed .emr-stage-stepper__number { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-stage-stepper__number { flex: none; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: var(--emr-neutral-soft); color: var(--emr-text); font-size: var(--emr-text-xs); font-weight: 700; }
    .emr-stage-stepper__text { display: flex; flex-direction: column; min-width: 0; overflow-wrap: break-word; }
    .emr-stage-stepper__description { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-stage-stepper__badge { flex: none; margin-inline-start: auto; border-radius: 999px; padding: 4px 9px; font-size: var(--emr-text-xs); background: var(--emr-surface-soft); color: var(--emr-text); }
    .emr-stage-stepper__badge[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); }
    .emr-stage-stepper__badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-stage-stepper__badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-stage-stepper__badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-stage-stepper[data-orientation="vertical"] .emr-stage-stepper__list { flex-direction: column; flex-wrap: nowrap; }
    .emr-stage-stepper[data-orientation="vertical"] .emr-stage-stepper__item { flex: none; border-inline-end: 0; border-bottom: 1px solid var(--emr-border); }
    .emr-stage-stepper[data-orientation="vertical"] .emr-stage-stepper__item:last-child { border-bottom: 0; }
    .emr-stage-stepper__stage:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: -3px; }
    @media (max-width: 640px) { .emr-stage-stepper__item { flex-basis: 100%; border-inline-end: 0; border-bottom: 1px solid var(--emr-border); } .emr-stage-stepper__item:last-child { border-bottom: 0; } }
    @container (max-width: 560px) { .emr-stage-stepper__item { flex-basis: 100%; border-inline-end: 0; border-bottom: 1px solid var(--emr-border); } .emr-stage-stepper__item:last-child { border-bottom: 0; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrStageStepperComponent {
  readonly stages = input.required<readonly EmrStage[]>();
  readonly activeId = input<string | undefined>(undefined);
  readonly completedIds = input<readonly string[]>([]);
  readonly ariaLabel = input('Stages');
  readonly orientation = input<EmrStageStepperOrientation>('horizontal');
  readonly size = input<EmrStageStepperSize>('md');
  readonly clickable = input(true, { transform: booleanAttribute });
  readonly linear = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly controlId = input<string | undefined>(undefined);
  readonly idPrefix = input<string | undefined>(undefined);

  readonly stageSelected = output<string>();
  readonly intent = output<EmrStageStepperIntent>();

  protected readonly focusedId = signal<string | undefined>(undefined);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected isCompleted(id: string): boolean {
    return this.completedIds().includes(id);
  }

  protected isStageDisabled(stage: EmrStage): boolean {
    return this.disabled() || Boolean(stage.disabled);
  }

  protected canSelect(stage: EmrStage): boolean {
    if (this.readOnly() || this.isStageDisabled(stage) || !this.clickable()) return false;
    if (!this.linear()) return true;
    if (stage.id === this.activeId() || this.isCompleted(stage.id)) return true;
    const list = this.stages();
    const activeIdx = this.activeId() ? list.findIndex((s) => s.id === this.activeId()) : -1;
    const targetIdx = list.findIndex((s) => s.id === stage.id);
    if (activeIdx < 0) {
      const firstEnabled = list.findIndex((s) => !s.disabled);
      return targetIdx === firstEnabled;
    }
    return targetIdx <= activeIdx + 1;
  }

  // One tab stop: last focused enabled stage, else active enabled, else first enabled.
  protected readonly tabStopId = computed(() => {
    if (this.disabled()) return undefined;
    const enabled = this.stages().filter((s) => !s.disabled).map((s) => s.id);
    if (!enabled.length) return undefined;
    const pick = [this.focusedId(), this.activeId()].find((id) => id !== undefined && enabled.includes(id));
    return pick ?? enabled[0];
  });

  private static nextId = 0;
  private readonly fallbackPrefix = `emr-stage-stepper-${EmrStageStepperComponent.nextId++}`;

  protected stageDomId(id: string): string { return `${this.idPrefix() ?? this.fallbackPrefix}-${id}`; }

  protected onStageClick(stage: EmrStage): void {
    if (!this.canSelect(stage)) return;
    this.stageSelected.emit(stage.id);
    this.intent.emit({ type: 'stageSelected', stageId: stage.id });
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (this.disabled()) return;
    const list = this.stages();
    const enabled = list.map((s, i) => (s.disabled ? -1 : i)).filter((i) => i >= 0);
    if (!enabled.length) return;
    let target: number;
    if (event.key === 'Home') {
      target = enabled[0]!;
    } else if (event.key === 'End') {
      target = enabled[enabled.length - 1]!;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      const pos = enabled.indexOf(index);
      target = enabled[Math.min(enabled.length - 1, Math.max(0, (pos < 0 ? 0 : pos) + 1))]!;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      const pos = enabled.indexOf(index);
      target = enabled[Math.min(enabled.length - 1, Math.max(0, (pos < 0 ? 0 : pos) - 1))]!;
    } else {
      return;
    }
    event.preventDefault();
    this.host.nativeElement.querySelectorAll<HTMLElement>('button.emr-stage-stepper__stage')[target]?.focus();
  }
}
