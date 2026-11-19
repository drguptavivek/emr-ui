import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import type {
  EmrBadge,
  EmrBadgeShape,
  EmrBadgeSize,
  EmrBadgeVariant,
  EmrChipSize,
  EmrChipVariant,
  EmrStateMessageKind,
  EmrStateMessageSize,
  EmrToastIntent,
  EmrToastModel,
  EmrTone,
} from '@drguptavivek/emr-controller';
import {
  canMutateEmrChip,
  formatEmrBadgeCount,
  normalizeEmrBadgeShape,
  normalizeEmrBadgeSize,
  normalizeEmrBadgeTone,
  normalizeEmrBadgeVariant,
  normalizeEmrChipSize,
  normalizeEmrChipTone,
  normalizeEmrChipVariant,
  normalizeEmrStateMessageKind,
  normalizeEmrStateMessageSize,
  resolveEmrChipRemoveLabel,
  resolveEmrStateMessageRole,
  resolveEmrStateMessageTitle,
} from './emr-feedback.logic';

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
  template: `
    @if (isVisible()) {
      <span
        [attr.id]="controlId() || null"
        class="emr-badge"
        [class]="'emr-badge emr-tone-' + resolvedTone() + ' emr-badge--' + resolvedVariant() + (resolvedSize() === 'sm' ? ' emr-badge--sm' : '') + (resolvedShape() === 'rounded' ? ' emr-badge--rounded' : '') + (isDotOnly() ? ' emr-badge--dot-only' : '')"
        [attr.role]="isDotOnly() ? 'img' : null"
        [attr.aria-label]="isDotOnly() ? (resolvedAssistiveText() || 'Status indicator') : null"
      >
        @if (resolvedDot() && !isDotOnly()) {
          <span class="emr-badge__dot" aria-hidden="true"></span>
        }
        @if (resolvedIcon() === 'check') {
          <svg [attr.width]="resolvedSize() === 'sm' ? 11 : 13" [attr.height]="resolvedSize() === 'sm' ? 11 : 13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        } @else if (resolvedIcon() === 'warning') {
          <svg [attr.width]="resolvedSize() === 'sm' ? 11 : 13" [attr.height]="resolvedSize() === 'sm' ? 11 : 13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2.5L14 13.5H2L8 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M8 6.5v3M8 11.3v.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        } @else if (resolvedIcon() === 'info') {
          <svg [attr.width]="resolvedSize() === 'sm' ? 11 : 13" [attr.height]="resolvedSize() === 'sm' ? 11 : 13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" />
            <path d="M8 7v4M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        } @else if (resolvedIcon() === 'close') {
          <svg [attr.width]="resolvedSize() === 'sm' ? 11 : 13" [attr.height]="resolvedSize() === 'sm' ? 11 : 13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
          </svg>
        } @else if (resolvedIcon() === 'eye') {
          <svg [attr.width]="resolvedSize() === 'sm' ? 11 : 13" [attr.height]="resolvedSize() === 'sm' ? 11 : 13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75" />
          </svg>
        }
        @if (countInfo().text !== null) {
          <span class="emr-badge__count">{{ countInfo().text }}</span>
        } @else if (resolvedLabel()) {
          <span>{{ resolvedLabel() }}</span>
        } @else if (!isDotOnly()) {
          <ng-content />
        }
        @if (!isDotOnly() && resolvedAssistiveText()) {
          <span class="emr-sr-only"> {{ resolvedAssistiveText() }}</span>
        }
      </span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrBadgeComponent {
  readonly badge = input<EmrBadge>();
  readonly tone = input<EmrTone>('neutral');
  readonly label = input<string>();
  readonly variant = input<EmrBadgeVariant>('soft');
  readonly size = input<EmrBadgeSize>('md');
  readonly shape = input<EmrBadgeShape>('pill');
  readonly icon = input<string>();
  readonly dot = input(false, { transform: booleanAttribute });
  readonly count = input<number>();
  readonly maxCount = input<number>(99);
  readonly showZero = input(false, { transform: booleanAttribute });
  readonly assistiveText = input<string>();
  readonly controlId = input<string>();

  protected readonly resolvedTone = computed(() => normalizeEmrBadgeTone(this.badge()?.tone ?? this.tone()));
  protected readonly resolvedVariant = computed(() => normalizeEmrBadgeVariant(this.badge()?.variant ?? this.variant()));
  protected readonly resolvedSize = computed(() => normalizeEmrBadgeSize(this.badge()?.size ?? this.size()));
  protected readonly resolvedShape = computed(() => normalizeEmrBadgeShape(this.badge()?.shape ?? this.shape()));
  protected readonly resolvedLabel = computed(() => this.badge()?.label ?? this.label());
  protected readonly resolvedIcon = computed(() => {
    const raw = this.badge()?.icon ?? this.icon();
    return raw && raw !== 'none' ? raw : undefined;
  });
  protected readonly resolvedDot = computed(() => Boolean(this.badge()?.dot ?? this.dot()));
  protected readonly resolvedAssistiveText = computed(() => this.badge()?.assistiveText ?? this.assistiveText());
  protected readonly countInfo = computed(() =>
    formatEmrBadgeCount(
      this.badge()?.count ?? this.count(),
      this.badge()?.maxCount ?? this.maxCount(),
      this.badge()?.showZero ?? this.showZero(),
    ),
  );
  protected readonly isVisible = computed(
    () => this.countInfo().visible || Boolean(this.resolvedLabel()) || this.resolvedDot(),
  );
  protected readonly isDotOnly = computed(
    () => this.resolvedDot() && this.countInfo().text === null && !this.resolvedLabel(),
  );
}

@Component({
  selector: 'emr-chip',
  standalone: true,
  template: `
    <span
      class="emr-chip"
      [id]="controlId() ?? null"
      [class]="'emr-chip emr-tone-' + resolvedTone() + ' emr-chip--' + resolvedVariant() + ' emr-chip--' + resolvedSize()"
      [class.emr-chip--interactive]="selectable() || removable()"
      [class.emr-chip--selectable]="selectable()"
      [class.emr-chip--selected]="selectable() && selected()"
      [class.emr-chip--disabled]="disabled()"
      [class.emr-chip--readonly]="readOnly()"
    >
      @if (selectable()) {
        <button
          type="button"
          class="emr-chip__trigger"
          [disabled]="disabled()"
          [attr.aria-pressed]="selected()"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-disabled]="disabled() || null"
          [attr.aria-label]="ariaLabel() || null"
          (click)="onToggle()"
        >
          @if (avatar()) {
            <span class="emr-chip__avatar" aria-hidden="true">{{ avatar() }}</span>
          }
          @switch (resolvedIcon()) {
            @case ('check') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            }
            @case ('info') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
            }
            @case ('warning') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 16H3Z" /><path d="M12 10v4M12 17h.01" /></svg>
            }
            @case ('user') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
            }
            @case ('plus') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            }
          }
          <span class="emr-chip__label">@if (label()) { {{ label() }} } @else { <ng-content /> }</span>
        </button>
      } @else {
        <span class="emr-chip__body">
          @if (avatar()) {
            <span class="emr-chip__avatar" aria-hidden="true">{{ avatar() }}</span>
          }
          @switch (resolvedIcon()) {
            @case ('check') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            }
            @case ('info') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
            }
            @case ('warning') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 16H3Z" /><path d="M12 10v4M12 17h.01" /></svg>
            }
            @case ('user') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
            }
            @case ('plus') {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            }
          }
          <span class="emr-chip__label">@if (label()) { {{ label() }} } @else { <ng-content /> }</span>
        </span>
      }
      @if (removable()) {
        <button
          type="button"
          class="emr-chip__remove"
          [disabled]="disabled()"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-label]="resolvedRemoveLabel()"
          (click)="onRemove($event)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrChipComponent {
  readonly controlId = input<string | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly tone = input<EmrTone>('neutral');
  readonly variant = input<EmrChipVariant>('soft');
  readonly size = input<EmrChipSize>('md');
  readonly leadingIcon = input<string | undefined>(undefined);
  readonly avatar = input<string | undefined>(undefined);
  readonly selectable = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly selected = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly removable = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly removeLabel = input<string | undefined>(undefined);
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly readOnly = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly selectedChange = output<boolean>();
  readonly removeRequested = output<void>();

  protected readonly resolvedTone = computed(() => normalizeEmrChipTone(this.tone()));
  protected readonly resolvedVariant = computed(() => normalizeEmrChipVariant(this.variant()));
  protected readonly resolvedSize = computed(() => normalizeEmrChipSize(this.size()));
  protected readonly resolvedIcon = computed(() => {
    const raw = this.leadingIcon();
    if (raw && raw !== 'none') return raw;
    if (this.selectable() && this.selected()) return 'check';
    return undefined;
  });
  protected readonly resolvedRemoveLabel = computed(() =>
    resolveEmrChipRemoveLabel(this.removeLabel(), this.label()),
  );

  protected onToggle(): void {
    if (!canMutateEmrChip(this.disabled(), this.readOnly())) return;
    this.selectedChange.emit(!this.selected());
  }

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    if (!canMutateEmrChip(this.disabled(), this.readOnly())) return;
    this.removeRequested.emit();
  }
}

@Component({
  selector: 'emr-alert',
  standalone: true,
  template: `
    <div class="emr-alert" [class]="'emr-alert emr-tone-' + tone()" [attr.role]="tone() === 'danger' ? 'alert' : 'status'">
      @if (toneGlyph()) {
        <span aria-hidden="true" style="font-size:var(--emr-text-md);font-weight:700;line-height:1.3;">{{ toneGlyph() }}</span>
      }
      <div style="flex:1;min-width:0;">
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

  protected toneGlyph(): string {
    switch (this.tone()) {
      case 'info':
        return 'ℹ';
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'danger':
        return '!';
      default:
        return '';
    }
  }
}

@Component({
  selector: 'emr-state-message',
  standalone: true,
  template: `
    <div
      class="emr-empty emr-state-message"
      [id]="controlId() ?? null"
      [class.emr-state-message--compact]="resolvedSize() === 'sm'"
      [attr.role]="resolvedRole()"
    >
      @if (resolvedIcon() === 'loading') {
        <span class="emr-state-message__spinner" aria-hidden="true"></span>
      } @else if (resolvedIcon() === 'danger') {
        <span class="emr-state-message__icon emr-state-message__icon--danger" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
        </span>
      } @else if (resolvedIcon() === 'info') {
        <span class="emr-state-message__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        </span>
      }
      <strong class="emr-state-message__title">{{ resolvedTitle() }}</strong>
      @if (message()) {
        <div class="emr-state-message__message">{{ message() }}</div>
      }
      @if (actionLabel()) {
        <div class="emr-state-message__actions">
          <button
            type="button"
            class="emr-button emr-button--outline"
            [disabled]="actionDisabled()"
            (click)="onAction()"
          >
            {{ actionLabel() }}
          </button>
        </div>
      }
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrStateMessageComponent {
  readonly controlId = input<string | undefined>(undefined);
  readonly kind = input<EmrStateMessageKind>('empty');
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly size = input<EmrStateMessageSize>('md');
  readonly compact = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly icon = input<string | undefined>(undefined);
  readonly actionLabel = input<string>('');
  readonly actionDisabled = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly actionTriggered = output<void>();

  protected readonly resolvedKind = computed(() => normalizeEmrStateMessageKind(this.kind()));
  protected readonly resolvedSize = computed(() => normalizeEmrStateMessageSize(this.size(), this.compact()));
  protected readonly resolvedTitle = computed(() => resolveEmrStateMessageTitle(this.resolvedKind(), this.title()));
  protected readonly resolvedRole = computed(() => resolveEmrStateMessageRole(this.resolvedKind()));
  protected readonly resolvedIcon = computed(() => {
    const raw = this.icon();
    if (raw === 'none') return undefined;
    if (raw) return raw;
    if (this.resolvedKind() === 'loading') return 'loading';
    if (this.resolvedKind() === 'error') return 'danger';
    return 'info';
  });

  protected onAction(): void {
    if (this.actionDisabled()) return;
    this.actionTriggered.emit();
  }
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
