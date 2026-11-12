import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
  viewChildren,
} from '@angular/core';
import type { EmrOption } from '@drguptavivek/emr-controller';

@Component({
  selector: 'emr-tabs',
  standalone: true,
  template: `
    <div
      class="emr-tabs"
      role="tablist"
      [attr.id]="controlId() || null"
      [attr.aria-label]="ariaLabel()"
    >
      @for (tab of tabs(); track tab.value) {
        <button
          #tabButton
          class="emr-tab"
          type="button"
          role="tab"
          [disabled]="tab.disabled"
          [attr.aria-selected]="active() === tab.value"
          [attr.aria-disabled]="readOnly() && active() !== tab.value ? 'true' : null"
          [attr.tabindex]="active() === tab.value || (!active() && $first) ? 0 : -1"
          (click)="onTabClick(tab)"
          (keydown)="onKeydown($event, tab.value)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmrTabsComponent {
  readonly controlId = input<string>();
  readonly ariaLabel = input('Sections');
  readonly tabs = input<readonly EmrOption[]>([]);
  readonly active = input('');
  readonly readOnly = input(false, { transform: booleanAttribute });

  readonly tabChange = output<string>();
  readonly tabChanged = output<string>();

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected onTabClick(tab: EmrOption): void {
    if (tab.disabled || this.readOnly()) return;
    this.emitTab(tab.value);
  }

  protected onKeydown(event: KeyboardEvent, value: string): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const enabledTabs = this.tabs().filter((tab) => !tab.disabled);
    if (!enabledTabs.length) return;
    const current = Math.max(
      0,
      enabledTabs.findIndex((tab) => tab.value === value),
    );
    const targetIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? enabledTabs.length - 1
          : event.key === 'ArrowRight'
            ? (current + 1) % enabledTabs.length
            : (current - 1 + enabledTabs.length) % enabledTabs.length;
    const target = enabledTabs[targetIndex];
    if (!target) return;
    event.preventDefault();
    if (!this.readOnly()) {
      this.emitTab(target.value);
    }
    const enabledButtons = this.tabButtons()
      .map((ref) => ref.nativeElement)
      .filter((btn) => !btn.disabled);
    enabledButtons[targetIndex]?.focus();
  }

  private emitTab(value: string): void {
    this.tabChange.emit(value);
    this.tabChanged.emit(value);
  }
}
