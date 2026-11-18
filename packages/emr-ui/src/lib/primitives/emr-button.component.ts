import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

export type EmrButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type EmrButtonSize = 'small' | 'medium' | 'large';
export type EmrButtonShape = 'default' | 'pill';

@Component({
  selector: 'emr-button',
  standalone: true,
  host: {
    '[style.display]': 'block() ? "block" : "inline-block"',
    '[style.width]': 'block() ? "100%" : null',
  },
  template: `
    <button
      class="emr-button"
      [attr.id]="controlId() || null"
      [class.emr-button--secondary]="variant() === 'secondary'"
      [class.emr-button--outline]="variant() === 'outline'"
      [class.emr-button--ghost]="variant() === 'ghost'"
      [class.emr-button--danger]="variant() === 'danger'"
      [class.emr-button--small]="size() === 'small'"
      [class.emr-button--large]="size() === 'large'"
      [class.emr-button--pill]="shape() === 'pill'"
      [class.emr-button--block]="block()"
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() || null"
      [attr.aria-pressed]="pressed() ?? null"
      [attr.aria-label]="ariaLabel() || null"
      (click)="onClick($event)"
      (focus)="focused.emit()"
      (blur)="blurred.emit()"
    >
      @if (loading()) {
        <span aria-hidden="true">•••</span>
      }
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrButtonComponent {
  readonly controlId = input<string>();
  readonly variant = input<EmrButtonVariant>('primary');
  readonly size = input<EmrButtonSize>('medium');
  readonly shape = input<EmrButtonShape>('default');
  readonly pressed = input<boolean>();
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly clicked = output<MouseEvent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  protected onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) return;
    this.clicked.emit(event);
  }
}
