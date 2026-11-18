import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, computed, input } from '@angular/core';
import type { EmrSeparatorLabelAlign, EmrSeparatorOrientation, EmrSeparatorVariant } from '@drguptavivek/emr-controller';

export type { EmrSeparatorLabelAlign, EmrSeparatorOrientation, EmrSeparatorVariant };

/**
 * Presentation-only divider. Renders a plain rule, an optional horizontal label
 * (`start | center | end`), or a vertical divider for inline groupings.
 */
@Component({
  selector: 'emr-separator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (resolvedOrientation() === 'vertical') {
      <div
        class="emr-separator emr-separator--vertical"
        [class.emr-separator--dashed]="variant() === 'dashed'"
        [class.emr-separator--subtle]="variant() === 'subtle'"
        [id]="controlId() ?? null"
        [attr.role]="decorative() ? 'none' : 'separator'"
        [attr.aria-orientation]="decorative() ? null : 'vertical'"
        [attr.aria-hidden]="decorative() ? 'true' : null"
      ></div>
    } @else if (label(); as text) {
      <div
        class="emr-separator emr-separator--labelled"
        [class.emr-separator--dashed]="variant() === 'dashed'"
        [class.emr-separator--subtle]="variant() === 'subtle'"
        [class.emr-separator--align-start]="labelAlign() === 'start'"
        [class.emr-separator--align-end]="labelAlign() === 'end'"
        [id]="controlId() ?? null"
        [attr.role]="decorative() ? 'none' : 'separator'"
        [attr.aria-orientation]="decorative() ? null : 'horizontal'"
        [attr.aria-label]="decorative() ? null : text"
        [attr.aria-hidden]="decorative() ? 'true' : null"
      >
        <span class="emr-separator__line emr-separator__line--start" aria-hidden="true"></span>
        <span class="emr-separator__label">{{ text }}</span>
        <span class="emr-separator__line emr-separator__line--end" aria-hidden="true"></span>
      </div>
    } @else {
      <div
        class="emr-separator"
        [class.emr-separator--dashed]="variant() === 'dashed'"
        [class.emr-separator--subtle]="variant() === 'subtle'"
        [id]="controlId() ?? null"
        [attr.role]="decorative() ? 'none' : 'separator'"
        [attr.aria-orientation]="decorative() ? null : 'horizontal'"
        [attr.aria-hidden]="decorative() ? 'true' : null"
      ><ng-content /></div>
    }
  `,
})
export class EmrSeparatorComponent {
  readonly controlId = input<string | undefined>(undefined);
  readonly orientation = input<EmrSeparatorOrientation>('horizontal');
  readonly label = input<string | undefined>(undefined);
  readonly labelAlign = input<EmrSeparatorLabelAlign>('center');
  readonly variant = input<EmrSeparatorVariant>('solid');
  readonly decorative = input<boolean, unknown>(false, { transform: booleanAttribute });

  protected readonly resolvedOrientation = computed<EmrSeparatorOrientation>(() =>
    this.orientation() === 'vertical' ? 'vertical' : 'horizontal',
  );
}
