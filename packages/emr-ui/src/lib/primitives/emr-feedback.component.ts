import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import type { EmrToastIntent, EmrToastModel, EmrTone } from '@drguptavivek/emr-controller';

const TONE_GLYPH: Record<EmrTone, string> = {
  neutral: '•',
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✕',
};

export interface EmrToastLabels {
  readonly dismiss?: string;
}

@Component({
  selector: 'emr-badge',
  standalone: true,
  template: `<span class="emr-badge" [class]="'emr-badge emr-tone-' + tone()"><ng-content /></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrBadgeComponent {
  readonly tone = input<EmrTone>('neutral');
}

@Component({
  selector: 'emr-chip',
  standalone: true,
  template: `
    <span class="emr-chip" [class]="'emr-chip emr-tone-' + tone()">
      <ng-content />
      @if (removable()) {
        <button
          type="button"
          class="emr-chip__remove"
          [disabled]="disabled()"
          [attr.aria-label]="removeLabel() || 'Remove'"
          (click)="onRemove($event)"
        >
          <span aria-hidden="true">✕</span>
        </button>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrChipComponent {
  readonly tone = input<EmrTone>('neutral');
  readonly removable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly removeLabel = input<string>();
  readonly removeRequested = output<void>();

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.removeRequested.emit();
  }
}

@Component({
  selector: 'emr-alert',
  standalone: true,
  template: `
    <div class="emr-alert" [class]="'emr-alert emr-tone-' + tone()" role="status">
      <div>
        @if (title()) {
          <div class="emr-alert__title">{{ title() }}</div>
        }
        <div class="emr-alert__body"><ng-content /></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrAlertComponent {
  readonly tone = input<EmrTone>('info');
  readonly title = input('');
}

@Component({
  selector: 'emr-state-message',
  standalone: true,
  template: `
    <div class="emr-empty" [attr.role]="kind() === 'error' ? 'alert' : 'status'">
      <div>
        <strong>{{ title() }}</strong>
        @if (message()) {
          <div>{{ message() }}</div>
        }
        <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrStateMessageComponent {
  readonly kind = input<'empty' | 'loading' | 'error'>('empty');
  readonly title = input('');
  readonly message = input('');
}

/**
 * L1 Toast notification banner: controlled notification with tone glyph, optional action button, and dismiss button.
 */
@Component({
  selector: 'emr-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (model(); as m) {
      @let urgent = m.tone === 'danger' || m.tone === 'warning';
      <div
        class="emr-toast"
        [attr.data-tone]="m.tone"
        [attr.role]="urgent ? 'alert' : 'status'"
        [style.margin-bottom.px]="bottomOffset()"
      >
        <span class="emr-toast__msg">
          <span aria-hidden="true">{{ glyph(m.tone) }}</span>
          {{ m.message }}
        </span>
        @if (m.actionLabel) {
          <button
            type="button"
            class="emr-button emr-button--small emr-button--outline"
            (click)="intent.emit({ type: 'actionPressed', id: m.id })"
          >
            {{ m.actionLabel }}
          </button>
        }
        <button
          type="button"
          class="emr-button emr-button--small emr-button--ghost"
          [attr.aria-label]="dismissLabel()"
          (click)="intent.emit({ type: 'dismissed', id: m.id })"
        >
          ✕
        </button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--emr-font-family);
      }
      .emr-toast {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid var(--emr-border);
        background: var(--emr-surface);
        color: var(--emr-text);
        font-size: var(--emr-text-md);
      }
      .emr-toast[data-tone='info'] {
        background: var(--emr-info-soft);
        color: var(--emr-info);
        border-color: var(--emr-info);
      }
      .emr-toast[data-tone='success'] {
        background: var(--emr-success-soft);
        color: var(--emr-success);
        border-color: var(--emr-success);
      }
      .emr-toast[data-tone='warning'] {
        background: var(--emr-warning-soft);
        color: var(--emr-warning);
        border-color: var(--emr-warning);
      }
      .emr-toast[data-tone='danger'] {
        background: var(--emr-danger-soft);
        color: var(--emr-danger);
        border-color: var(--emr-danger);
      }
      .emr-toast__msg {
        flex: 1;
        min-width: 0;
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class EmrToastComponent {
  readonly model = input<EmrToastModel | null>(null);
  readonly bottomOffset = input(0);
  readonly labels = input<EmrToastLabels>({});
  readonly intent = output<EmrToastIntent>();

  protected readonly dismissLabel = computed(() => this.labels().dismiss ?? 'Dismiss');

  protected glyph(tone: EmrTone): string {
    return TONE_GLYPH[tone];
  }
}
