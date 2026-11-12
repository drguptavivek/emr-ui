import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core';
import type { EmrTone } from '@drguptavivek/emr-controller';
import { deriveAvatarInitials } from './emr-inputs.logic';

let nextIndicatorId = 0;

@Component({
  selector: 'emr-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="emr-progress" [attr.id]="resolvedId()" [attr.data-tone]="tone()">
      <div class="emr-progress__header">
        <span [id]="resolvedId() + '-label'">{{ label() }}</span>
        @if (displayValueLabel()) {
          <span>{{ displayValueLabel() }}</span>
        }
      </div>
      <div
        class="emr-progress__track"
        role="progressbar"
        [attr.aria-labelledby]="resolvedId() + '-label'"
        [attr.aria-valuemin]="indeterminate() ? null : 0"
        [attr.aria-valuemax]="indeterminate() ? null : safeMax()"
        [attr.aria-valuenow]="indeterminate() ? null : clampedValue()"
        [attr.aria-valuetext]="valueLabel() || null"
      >
        <div
          class="emr-progress__bar"
          [class.emr-progress__bar--indeterminate]="indeterminate()"
          [style.width.%]="indeterminate() ? 40 : percent()"
        ></div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .emr-progress__bar--indeterminate {
        opacity: 0.72;
      }
    `,
  ],
})
export class EmrProgressBarComponent {
  readonly controlId = input<string>();
  readonly label = input.required<string>();
  readonly value = input<number | null>(null);
  readonly max = input(100);
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly tone = input<EmrTone>('info');
  readonly valueLabel = input<string>();

  private readonly fallbackId = `emr-progress-${++nextIndicatorId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly safeMax = computed(() => (this.max() > 0 ? this.max() : 100));
  protected readonly clampedValue = computed(() => {
    const raw = this.value();
    if (raw === null || raw === undefined || !Number.isFinite(raw)) return 0;
    return Math.min(this.safeMax(), Math.max(0, raw));
  });
  protected readonly percent = computed(() => (this.clampedValue() / this.safeMax()) * 100);
  protected readonly displayValueLabel = computed(() => {
    if (this.valueLabel()) return this.valueLabel()!;
    if (this.indeterminate() || this.value() === null || this.value() === undefined) return '';
    return `${Math.round(this.percent())}%`;
  });
}

@Component({
  selector: 'emr-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="emr-spinner"
      role="status"
      [attr.id]="controlId() || null"
      [attr.data-tone]="tone()"
      [attr.data-size]="size()"
    >
      <span
        class="emr-spinner__ring"
        [class.emr-spinner__ring--sm]="size() === 'sm'"
        [class.emr-spinner__ring--lg]="size() === 'lg'"
        aria-hidden="true"
      ></span>
      <span>{{ label() }}</span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .emr-spinner__ring--sm {
        width: 14px;
        height: 14px;
        border-width: 2px;
      }
      .emr-spinner__ring--lg {
        width: 28px;
        height: 28px;
        border-width: 3px;
      }
      .emr-spinner[data-tone='success'] .emr-spinner__ring {
        border-top-color: var(--emr-success);
      }
      .emr-spinner[data-tone='warning'] .emr-spinner__ring {
        border-top-color: var(--emr-warning);
      }
      .emr-spinner[data-tone='danger'] .emr-spinner__ring {
        border-top-color: var(--emr-danger);
      }
    `,
  ],
})
export class EmrSpinnerComponent {
  readonly controlId = input<string>();
  readonly label = input('Loading');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly tone = input<EmrTone>('info');
}

@Component({
  selector: 'emr-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="emr-skeleton-group"
      role="status"
      aria-busy="true"
      [attr.aria-label]="ariaLabel()"
    >
      @for (idx of lineIndices(); track idx) {
        <span
          class="emr-skeleton"
          [class.emr-skeleton--circle]="variant() === 'circle'"
          [style.width]="resolvedWidth()"
          [style.height]="resolvedHeight()"
          aria-hidden="true"
        ></span>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .emr-skeleton-group {
        display: grid;
        gap: 6px;
      }
    `,
  ],
})
export class EmrSkeletonComponent {
  readonly variant = input<'line' | 'rect' | 'circle'>('line');
  readonly lines = input(1);
  readonly width = input<string>();
  readonly height = input<string>();
  readonly ariaLabel = input('Loading content');

  protected readonly lineIndices = computed(() => {
    const count = this.variant() === 'line' ? Math.max(1, Math.trunc(this.lines() || 1)) : 1;
    return Array.from({ length: count }, (_, i) => i);
  });

  protected readonly resolvedWidth = computed(() => {
    if (this.width()) return this.width()!;
    if (this.variant() === 'circle') return '36px';
    return '100%';
  });

  protected readonly resolvedHeight = computed(() => {
    if (this.height()) return this.height()!;
    if (this.variant() === 'circle') return '36px';
    if (this.variant() === 'rect') return '72px';
    return '14px';
  });
}

@Component({
  selector: 'emr-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="emr-avatar"
      [class.emr-avatar--sm]="size() === 'sm'"
      [class.emr-avatar--lg]="size() === 'lg'"
      [class]="'emr-avatar emr-tone-' + tone() + (size() === 'sm' ? ' emr-avatar--sm' : size() === 'lg' ? ' emr-avatar--lg' : '')"
      role="img"
      [attr.id]="controlId() || null"
      [attr.aria-label]="name()"
    >
      @if (showImage()) {
        <img [src]="imageUrl()!" [alt]="name()" (error)="onImageError()" />
      } @else {
        <span aria-hidden="true">{{ computedInitials() }}</span>
      }
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
    `,
  ],
})
export class EmrAvatarComponent {
  readonly controlId = input<string>();
  readonly name = input.required<string>();
  readonly initials = input<string>();
  readonly imageUrl = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly tone = input<EmrTone>('neutral');

  private readonly failedImageUrl = signal<string | null>(null);

  protected readonly showImage = computed(() => {
    const url = this.imageUrl();
    return Boolean(url && this.failedImageUrl() !== url);
  });

  protected readonly computedInitials = computed(() =>
    deriveAvatarInitials(this.name(), this.initials()),
  );

  protected onImageError(): void {
    this.failedImageUrl.set(this.imageUrl());
  }
}
