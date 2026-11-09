import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { EmrStatTileIntent, EmrStatTileModel } from '@drguptavivek/emr-controller';

/**
 * L1 mechanical KPI / count tile: renders caller-supplied label, formatted value, optional subtitle
 * and status badge. Never counts, rounds, compares or infers a tone. When `interactive` is true and
 * not `readOnly`, renders as a `<button>` emitting `{ type: 'statSelected', key }`.
 */
@Component({
  selector: 'emr-stat-tile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @if (interactive() && !readOnly()) {
      <button
        type="button"
        class="emr-stat-tile emr-stat-tile--interactive"
        [attr.id]="controlId()"
        [attr.aria-label]="ariaLabel()"
        (click)="intent.emit({ type: 'statSelected', key: m.key })"
      >
        <span class="emr-stat-tile__label">{{ m.label }}</span>
        <span class="emr-stat-tile__value">{{ m.value }}</span>
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
        role="group"
        [attr.id]="controlId()"
        [attr.aria-label]="ariaLabel()"
      >
        <span class="emr-stat-tile__label">{{ m.label }}</span>
        <span class="emr-stat-tile__value">{{ m.value }}</span>
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
      </div>
    }
  `,
  styles: [
    `
      :host {
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
      }
      .emr-stat-tile--interactive {
        cursor: pointer;
      }
      .emr-stat-tile--interactive:hover {
        background: var(--emr-surface-raised);
        border-color: var(--emr-primary-border);
      }
      .emr-stat-tile--interactive:focus-visible {
        outline: 3px solid var(--emr-focus);
        outline-offset: 2px;
      }
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
        color: var(--emr-text);
        overflow-wrap: anywhere;
      }
      .emr-stat-tile__sub {
        font-size: var(--emr-text-xs);
        color: var(--emr-text-muted);
        overflow-wrap: anywhere;
      }
    `
  ]
})
export class EmrStatTileComponent {
  readonly model = input.required<EmrStatTileModel>();
  readonly interactive = input(true);
  readonly readOnly = input(false);
  readonly controlId = input<string>();
  readonly intent = output<EmrStatTileIntent>();

  protected readonly ariaLabel = computed(() => {
    const m = this.model();
    if (m.accessibilityLabel) return m.accessibilityLabel;
    return [m.label, m.value, m.sub, m.status?.label].filter(Boolean).join(', ');
  });
}
