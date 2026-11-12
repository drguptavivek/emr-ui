import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

let nextOverlayId = 0;

@Component({
  selector: 'emr-dialog',
  standalone: true,
  imports: [CdkTrapFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (open()) {
      <div
        class="emr-dialog-backdrop"
        (click)="onBackdropClick($event)"
        (keydown.escape)="onEscape($event)"
      >
        <section
          class="emr-dialog"
          [class.emr-dialog--sm]="size() === 'sm'"
          [class.emr-dialog--lg]="size() === 'lg'"
          [class.emr-dialog--fullscreen]="size() === 'fullscreen'"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          aria-modal="true"
          [attr.role]="role()"
          [attr.aria-labelledby]="resolvedHeadingId()"
          [attr.aria-describedby]="description() ? resolvedDescriptionId() : null"
          tabindex="-1"
        >
          <header class="emr-dialog__header">
            <div>
              <h2 class="emr-dialog__title" [id]="resolvedHeadingId()">{{ title() }}</h2>
              @if (description()) {
                <p class="emr-field__hint" [id]="resolvedDescriptionId()">{{ description() }}</p>
              }
            </div>
            @if (dismissible()) {
              <button
                type="button"
                class="emr-button emr-button--small emr-button--ghost"
                aria-label="Close dialog"
                (click)="closeRequested.emit()"
              >
                ✕
              </button>
            }
          </header>
          <div class="emr-dialog__body">
            <ng-content />
          </div>
          <footer class="emr-dialog__footer">
            <ng-content select="[dialogFooter]" />
          </footer>
        </section>
      </div>
    }
  `,
})
export class EmrDialogComponent {
  readonly open = input(false, { transform: booleanAttribute });
  readonly title = input.required<string>();
  readonly description = input('');
  readonly size = input<'sm' | 'md' | 'lg' | 'fullscreen'>('md');
  readonly role = input<'dialog' | 'alertdialog'>('dialog');
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly headingId = input<string>();

  readonly closeRequested = output<void>();

  private readonly fallbackId = `emr-dialog-${++nextOverlayId}`;
  readonly resolvedHeadingId = computed(() => this.headingId() || `${this.fallbackId}-title`);
  protected readonly resolvedDescriptionId = computed(() => `${this.fallbackId}-desc`);

  protected onBackdropClick(event: MouseEvent): void {
    if (!this.dismissible()) return;
    if (event.target === event.currentTarget) {
      this.closeRequested.emit();
    }
  }

  protected onEscape(event: Event): void {
    if (!this.dismissible()) return;
    event.preventDefault();
    event.stopPropagation();
    this.closeRequested.emit();
  }
}

@Component({
  selector: 'emr-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="emr-popover-anchor"
      [attr.id]="resolvedId()"
      (keydown.escape)="onEscape($event)"
    >
      <ng-content select="[popoverTrigger]" />
      @if (open()) {
        <div
          class="emr-popover__panel"
          [class.emr-popover__panel--end]="align() === 'end'"
          [id]="resolvedId() + '-panel'"
          role="dialog"
          [attr.aria-label]="label()"
        >
          <ng-content />
        </div>
      }
    </div>
  `,
})
export class EmrPopoverComponent {
  readonly controlId = input<string>();
  readonly open = input(false, { transform: booleanAttribute });
  readonly label = input('Options');
  readonly align = input<'start' | 'end'>('start');

  readonly openChange = output<boolean>();

  private readonly fallbackId = `emr-popover-${++nextOverlayId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected onEscape(event: Event): void {
    if (!this.open()) return;
    event.preventDefault();
    event.stopPropagation();
    this.openChange.emit(false);
  }
}

@Component({
  selector: 'emr-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <span
      class="emr-tooltip-wrap"
      [attr.aria-describedby]="isOpen() ? resolvedId() : null"
      (mouseenter)="show()"
      (mouseleave)="hide()"
      (focusin)="show()"
      (focusout)="hide()"
      (keydown.escape)="onEscape($event)"
    >
      <ng-content />
      @if (isOpen()) {
        <span class="emr-tooltip__bubble" role="tooltip" [id]="resolvedId()">
          {{ content() }}
        </span>
      }
    </span>
  `,
})
export class EmrTooltipComponent {
  readonly content = input.required<string>();
  readonly controlId = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly fallbackId = `emr-tooltip-${++nextOverlayId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);
  private readonly active = signal(false);
  protected readonly isOpen = computed(() => !this.disabled() && !!this.content() && this.active());

  protected show(): void {
    if (!this.disabled()) this.active.set(true);
  }

  protected hide(): void {
    this.active.set(false);
  }

  protected onEscape(event: Event): void {
    if (!this.active()) return;
    event.stopPropagation();
    this.active.set(false);
  }
}
