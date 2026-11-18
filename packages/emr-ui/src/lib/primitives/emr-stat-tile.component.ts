import { booleanAttribute, ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import type { EmrStatTileIntent, EmrStatTileModel, EmrStatTileSize, EmrTone } from '@drguptavivek/emr-controller';

/**
 * L1 mechanical KPI / count tile: renders caller-supplied label, formatted value, optional trend,
 * subtitle and status badge. Never counts, rounds, compares or infers a tone.
 */
@Component({
  selector: 'emr-stat-tile',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @if (canInteract()) {
      <button
        type="button"
        class="emr-stat-tile emr-stat-tile--interactive"
        [class.emr-stat-tile--sm]="resolvedSize() === 'sm'"
        [class.emr-stat-tile--lg]="resolvedSize() === 'lg'"
        [class.emr-stat-tile--selected]="selected()"
        [class.emr-stat-tile--disabled]="disabled()"
        [attr.data-tone]="resolvedTone()"
        [attr.id]="controlId() ?? null"
        [attr.aria-label]="resolvedAriaLabel()"
        [attr.aria-pressed]="selected() ? 'true' : 'false'"
        [disabled]="disabled()"
        (click)="onActivate(m.key)"
      >
        <span class="emr-stat-tile__label">{{ m.label }}</span>
        <span class="emr-stat-tile__value">{{ m.value }}</span>
        @if (m.trend; as tr) {
          <span class="emr-stat-tile__trend" [attr.data-tone]="tr.tone ?? 'neutral'">
            @if (tr.direction === 'up') {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
            } @else if (tr.direction === 'down') {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            } @else if (tr.direction === 'flat') {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            }
            {{ tr.label }}
          </span>
        }
        @if (m.sub) {
          <span class="emr-stat-tile__sub">{{ m.sub }}</span>
        }
        @if (m.status; as s) {
          <span class="emr-badge emr-tone-{{ s.tone }}">
            {{ s.label }}
            @if (s.assistiveText) {
              <span class="emr-sr-only"> {{ s.assistiveText }}</span>
            }
          </span>
        }
      </button>
    } @else {
      <div
        class="emr-stat-tile"
        [class.emr-stat-tile--sm]="resolvedSize() === 'sm'"
        [class.emr-stat-tile--lg]="resolvedSize() === 'lg'"
        [class.emr-stat-tile--selected]="selected()"
        [class.emr-stat-tile--readonly]="readOnly()"
        [class.emr-stat-tile--disabled]="disabled()"
        [class.emr-stat-tile--loading]="loading()"
        [attr.data-tone]="resolvedTone()"
        role="group"
        [attr.id]="controlId() ?? null"
        [attr.aria-label]="resolvedAriaLabel()"
        [attr.aria-busy]="loading() ? 'true' : null"
        [attr.aria-readonly]="interactive() && readOnly() ? 'true' : null"
        [attr.aria-disabled]="disabled() ? 'true' : null"
      >
        @if (loading()) {
          <span class="emr-stat-tile__skeleton emr-stat-tile__skeleton--label" aria-hidden="true"></span>
          <span class="emr-stat-tile__skeleton emr-stat-tile__skeleton--value" aria-hidden="true"></span>
          <span class="emr-stat-tile__skeleton emr-stat-tile__skeleton--sub" aria-hidden="true"></span>
        } @else {
          <span class="emr-stat-tile__label">{{ m.label }}</span>
          <span class="emr-stat-tile__value">{{ m.value }}</span>
          @if (m.trend; as tr) {
            <span class="emr-stat-tile__trend" [attr.data-tone]="tr.tone ?? 'neutral'">
              @if (tr.direction === 'up') {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
              } @else if (tr.direction === 'down') {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              } @else if (tr.direction === 'flat') {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
              {{ tr.label }}
            </span>
          }
          @if (m.sub) {
            <span class="emr-stat-tile__sub">{{ m.sub }}</span>
          }
          @if (m.status; as s) {
            <span class="emr-badge emr-tone-{{ s.tone }}">
              {{ s.label }}
              @if (s.assistiveText) {
                <span class="emr-sr-only"> {{ s.assistiveText }}</span>
              }
            </span>
          }
        }
      </div>
    }
  `,
  styles: [
    `
      emr-stat-tile {
        display: flex;
        min-width: 0;
      }
      .emr-stat-tile {
        flex: 1;
        min-width: 0;
        min-height: calc(var(--emr-control-height) * 2);
        border: 1px solid var(--emr-border);
        border-radius: 12px;
        background: var(--emr-surface);
        color: var(--emr-text);
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 4px;
        text-align: left;
        font: inherit;
        transition: background-color 140ms ease, border-color 140ms ease;
      }
      .emr-stat-tile--sm { min-height: 72px; padding: 12px; }
      .emr-stat-tile--lg { min-height: 104px; padding: 20px; }
      .emr-stat-tile--interactive { cursor: pointer; }
      .emr-stat-tile--interactive:hover:not(:disabled) {
        background: var(--emr-surface-raised);
        border-color: var(--emr-primary-border);
      }
      .emr-stat-tile--interactive:focus-visible {
        outline: 3px solid var(--emr-focus);
        outline-offset: 2px;
      }
      .emr-stat-tile--selected {
        border-color: var(--emr-primary);
        background: var(--emr-primary-soft, var(--emr-surface-accent));
      }
      .emr-stat-tile--readonly {
        border-style: dashed;
      }
      .emr-stat-tile--disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .emr-stat-tile[data-tone="info"]:not(.emr-stat-tile--selected) { border-color: var(--emr-info); }
      .emr-stat-tile[data-tone="success"]:not(.emr-stat-tile--selected) { border-color: var(--emr-success); }
      .emr-stat-tile[data-tone="warning"]:not(.emr-stat-tile--selected) { border-color: var(--emr-warning); }
      .emr-stat-tile[data-tone="danger"]:not(.emr-stat-tile--selected) { border-color: var(--emr-danger); }
      .emr-stat-tile__label {
        font-size: var(--emr-text-sm);
        font-weight: var(--emr-weight-medium);
        color: var(--emr-text-muted);
        overflow-wrap: anywhere;
      }
      .emr-stat-tile__value {
        font-size: var(--emr-text-2xl);
        font-weight: var(--emr-weight-bold);
        line-height: var(--emr-leading-tight);
        font-variant-numeric: tabular-nums;
        color: var(--emr-text);
        overflow-wrap: anywhere;
      }
      .emr-stat-tile--sm .emr-stat-tile__value { font-size: var(--emr-text-xl); }
      .emr-stat-tile__trend {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--emr-text-xs);
        font-weight: 600;
        color: var(--emr-text-muted);
      }
      .emr-stat-tile__trend[data-tone="info"] { color: var(--emr-info); }
      .emr-stat-tile__trend[data-tone="success"] { color: var(--emr-success); }
      .emr-stat-tile__trend[data-tone="warning"] { color: var(--emr-warning); }
      .emr-stat-tile__trend[data-tone="danger"] { color: var(--emr-danger); }
      .emr-stat-tile__sub {
        font-size: var(--emr-text-xs);
        color: var(--emr-text-muted);
        overflow-wrap: anywhere;
      }
      .emr-stat-tile__skeleton {
        display: block;
        border-radius: 6px;
        background: var(--emr-surface-soft);
      }
      .emr-stat-tile__skeleton--label { width: 55%; height: 12px; }
      .emr-stat-tile__skeleton--value { width: 35%; height: 26px; margin: 2px 0; }
      .emr-stat-tile__skeleton--sub { width: 70%; height: 11px; }
    `
  ]
})
export class EmrStatTileComponent {
  readonly model = input.required<EmrStatTileModel>();
  readonly tone = input<EmrTone | undefined>(undefined);
  readonly size = input<EmrStatTileSize>('md');
  readonly interactive = input(true, { transform: booleanAttribute });
  readonly selected = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly controlId = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly intent = output<EmrStatTileIntent>();

  protected readonly resolvedSize = computed<EmrStatTileSize>(() => {
    const s = this.size();
    return s === 'sm' || s === 'lg' ? s : 'md';
  });

  protected readonly resolvedTone = computed<EmrTone>(() => {
    const t = this.tone() ?? this.model().tone;
    return t === 'info' || t === 'success' || t === 'warning' || t === 'danger' ? t : 'neutral';
  });

  protected readonly canInteract = computed(() =>
    this.interactive() && !this.readOnly() && !this.disabled() && !this.loading(),
  );

  protected readonly resolvedAriaLabel = computed(() => {
    if (this.ariaLabel()?.trim()) return this.ariaLabel()!.trim();
    const m = this.model();
    if (m.accessibilityLabel) return m.accessibilityLabel;
    return [m.label, m.value, m.trend?.label, m.sub, m.status?.label].filter(Boolean).join(', ');
  });

  protected onActivate(key: string): void {
    if (!this.canInteract()) return;
    this.intent.emit({ type: 'statSelected', key });
  }
}
