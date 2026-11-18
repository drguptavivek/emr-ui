import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type {
  EmrBadge,
  EmrStatusCellAction,
  EmrStatusCellAttribution,
  EmrStatusCellIntent,
  EmrStatusCellSize,
} from '@drguptavivek/emr-controller';

export type { EmrStatusCellAction, EmrStatusCellAttribution, EmrStatusCellIntent, EmrStatusCellSize };

/**
 * Mechanical state cell: caller-supplied badge, optional value, attribution line and ONE action.
 * No clinical meaning: every label and tone is supplied. Reuses the global `.emr-badge`/`.emr-tone-*`
 * classes (no L1 sibling import). `selectable` makes the cell body a role="button"; the action is a
 * sibling button, never nested inside it. `compact` shows the badge only, full text stays for AT.
 */
@Component({
  selector: 'emr-status-cell',
  standalone: true,
  template: `
    <div
      class="emr-status-cell"
      [class.emr-status-cell--sm]="size() === 'sm'"
      [class.emr-status-cell--disabled]="disabled()"
      [class.emr-status-cell--readonly]="readOnly()"
    >
      <div
        class="emr-status-cell__body"
        [class.emr-status-cell__body--selectable]="isSelectable()"
        [class.emr-status-cell__body--selected]="isSelectedState()"
        [class.emr-status-cell__body--readonly]="isSelectable() && readOnly()"
        [class.emr-status-cell__body--disabled]="disabled()"
        [attr.id]="controlId() ?? null"
        [attr.role]="isSelectable() ? 'button' : null"
        [attr.tabindex]="isSelectable() && !disabled() ? 0 : isSelectable() ? -1 : null"
        [attr.aria-label]="resolvedAriaLabel() || null"
        [attr.aria-pressed]="isSelectable() ? (isSelectedState() ? 'true' : 'false') : null"
        [attr.aria-readonly]="isSelectable() && readOnly() ? 'true' : null"
        [attr.aria-disabled]="disabled() ? 'true' : null"
        (click)="onSelect()"
        (keydown.enter)="onKey($event)"
        (keydown.space)="onKey($event)"
      >
        <span class="emr-status-cell__main">
          <span
            class="emr-badge emr-tone-{{ status().tone }}"
            [class.emr-badge--solid]="status().variant === 'solid'"
            [class.emr-badge--outline]="status().variant === 'outline'"
            [class.emr-badge--soft]="!status().variant || status().variant === 'soft'"
            [class.emr-badge--rounded]="status().shape === 'rounded'"
            [class.emr-badge--sm]="status().size === 'sm'"
          >
            @if (status().dot) {
              <span class="emr-badge__dot" aria-hidden="true"></span>
            }
            {{ status().label }}
          </span>
          @if (status().assistiveText) {
            <span class="emr-sr-only">{{ status().assistiveText }}</span>
          }
          @if (!compact() && valueLabel()) {
            <span class="emr-status-cell__value">{{ valueLabel() }}</span>
          }
        </span>
        @if (!compact()) {
          @if (attributionText()) {
            <span class="emr-status-cell__meta">{{ attributionText() }}</span>
          }
          @if (secondaryNote()) {
            <span class="emr-status-cell__meta">{{ secondaryNote() }}</span>
          }
        } @else if (hiddenText()) {
          <span class="emr-sr-only">{{ hiddenText() }}</span>
        }
      </div>
      @if (action() && !readOnly() && !compact() && !disabled()) {
        <button
          type="button"
          class="emr-button emr-button--outline emr-status-cell__action"
          [attr.aria-label]="action()!.ariaLabel || null"
          (click)="onAction()"
        >
          @if (action()!.icon === 'pen') {
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          } @else if (action()!.icon === 'check') {
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          } @else if (action()!.icon === 'plus') {
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          } @else if (action()!.icon === 'close') {
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          }
          {{ action()!.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; min-width: 0; }
      .emr-status-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; }
      .emr-status-cell--disabled { opacity: 0.55; }
      .emr-status-cell__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; max-width: 100%; border-radius: var(--emr-radius, 8px); border: 1px solid transparent; transition: background-color 140ms ease, border-color 140ms ease; }
      .emr-status-cell__body--selectable { min-height: 44px; min-width: 44px; justify-content: center; cursor: pointer; padding: 6px 8px; }
      .emr-status-cell__body--selectable:hover:not(.emr-status-cell__body--readonly):not(.emr-status-cell__body--disabled) { background: var(--emr-surface-accent); }
      .emr-status-cell__body--selectable:active:not(.emr-status-cell__body--readonly):not(.emr-status-cell__body--disabled) { background: var(--emr-surface-soft); }
      .emr-status-cell__body--selectable:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
      .emr-status-cell__body--selected { border-color: var(--emr-primary); background: var(--emr-primary-soft, var(--emr-surface-accent)); }
      .emr-status-cell__body--readonly { cursor: default; border-style: dashed; border-color: var(--emr-border); }
      .emr-status-cell__body--disabled { cursor: not-allowed; }
      .emr-status-cell__main { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; }
      .emr-status-cell__value { font-size: var(--emr-text-sm); font-weight: 650; color: var(--emr-text); overflow-wrap: anywhere; }
      .emr-status-cell__meta { font-size: var(--emr-text-xs); color: var(--emr-text-muted); overflow-wrap: anywhere; }
      .emr-status-cell--sm .emr-status-cell__value { font-size: var(--emr-text-xs); }
      .emr-status-cell--sm .emr-status-cell__meta { font-size: var(--emr-text-2xs); }
      .emr-status-cell__action { min-height: 44px; min-width: 44px; max-width: 100%; display: inline-flex; align-items: center; gap: 6px; }
      .emr-status-cell .emr-badge { max-width: 100%; white-space: normal; height: auto; min-height: var(--emr-compact-height); line-height: 1.2; }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmrStatusCellComponent {
  readonly status = input.required<EmrBadge>();
  readonly valueLabel = input<string>();
  readonly attribution = input<EmrStatusCellAttribution | string>();
  readonly action = input<EmrStatusCellAction>();
  readonly secondaryNote = input<string>();
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly compact = input(false, { transform: booleanAttribute });
  readonly selectable = input(false, { transform: booleanAttribute });
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly isSelected = input(false, { transform: booleanAttribute });
  readonly size = input<EmrStatusCellSize>('md');
  readonly ariaLabel = input<string>();
  readonly controlId = input<string>();

  readonly actionClicked = output<void>();
  readonly selected = output<void>();
  readonly intent = output<EmrStatusCellIntent>();

  protected readonly isSelectable = computed(() => this.selectable() || this.interactive());
  protected readonly isSelectedState = computed(() => this.isSelected());

  protected readonly attributionText = computed(() => {
    const a = this.attribution();
    if (!a) return '';
    if (typeof a === 'string') return a.trim();
    return [a.nameLabel ?? a.author, a.roleLabel, a.timeLabel ?? a.timestamp].filter(Boolean).join(' · ');
  });

  /** Full content for assistive tech when compact hides it visually. */
  protected readonly hiddenText = computed(() =>
    [this.valueLabel(), this.attributionText(), this.secondaryNote()].filter(Boolean).join('. ')
  );

  protected readonly resolvedAriaLabel = computed(() => {
    if (this.ariaLabel()?.trim()) return this.ariaLabel()!.trim();
    if (this.compact() && this.hiddenText()) {
      return [this.status().label, this.status().assistiveText, this.hiddenText()].filter(Boolean).join('. ');
    }
    return '';
  });

  protected onSelect(): void {
    if (!this.isSelectable() || this.readOnly() || this.disabled()) return;
    this.selected.emit();
    this.intent.emit('selected');
  }

  protected onAction(): void {
    if (this.readOnly() || this.disabled() || this.compact()) return;
    this.actionClicked.emit();
    this.intent.emit('action');
  }

  protected onKey(event: Event): void {
    if (!this.isSelectable() || this.readOnly() || this.disabled()) return;
    event.preventDefault();
    this.onSelect();
  }
}
