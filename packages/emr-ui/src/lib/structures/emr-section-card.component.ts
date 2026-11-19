import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  EmrBadge,
  EmrSectionCardHeadingLevel,
  EmrSectionCardPadding,
  EmrSectionCardVariant,
  EmrTone,
  SectionCardIntent,
} from '@drguptavivek/emr-controller';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import {
  normalizeSectionCardHeadingLevel,
  normalizeSectionCardPadding,
  normalizeSectionCardTone,
  normalizeSectionCardVariant,
  resolveSectionCardContentId,
  resolveSectionCardHeadingId,
  resolveSectionCardIconPaths,
  resolveSectionCardToggleLabel,
} from './emr-section-card.logic';

@Component({
  selector: 'emr-section-card',
  standalone: true,
  imports: [EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'emr-section-card',
    '[class.emr-section-card--outlined]': 'resolvedVariant() === "outlined"',
    '[class.emr-section-card--elevated]': 'resolvedVariant() === "elevated"',
    '[class.emr-section-card--filled]': 'resolvedVariant() === "filled"',
    '[class.emr-section-card--subtle]': 'resolvedVariant() === "subtle"',
    '[class.emr-section-card--pad-none]': 'resolvedPadding() === "none"',
    '[class.emr-section-card--pad-sm]': 'resolvedPadding() === "sm"',
    '[class.emr-section-card--pad-md]': 'resolvedPadding() === "md"',
    '[class.emr-section-card--pad-lg]': 'resolvedPadding() === "lg"',
    '[class.emr-section-card--readonly]': 'readOnly()',
    '[class.emr-section-card--collapsed]': 'collapsed()',
    '[attr.data-tone]': 'resolvedTone() !== "neutral" ? resolvedTone() : null',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <section [attr.aria-labelledby]="resolvedHeadingId()">
      <header class="emr-section-card__header">
        @if (iconPaths().length > 0) {
          <span class="emr-card-header-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              focusable="false"
            >
              @for (d of iconPaths(); track $index) {
                <path [attr.d]="d" />
              }
            </svg>
          </span>
        }
        <div class="emr-section-card__heading">
          @switch (resolvedHeadingLevel()) {
            @case (2) { <h2 [id]="resolvedHeadingId()">{{ label() }}</h2> }
            @case (3) { <h3 [id]="resolvedHeadingId()">{{ label() }}</h3> }
            @case (4) { <h4 [id]="resolvedHeadingId()">{{ label() }}</h4> }
            @case (5) { <h5 [id]="resolvedHeadingId()">{{ label() }}</h5> }
            @case (6) { <h6 [id]="resolvedHeadingId()">{{ label() }}</h6> }
          }
          @if (description()) { <p>{{ description() }}</p> }
        </div>
        @if (status(); as badge) { <emr-badge [badge]="badge" /> }
        <div class="emr-section-card__actions"><ng-content select="[emrSectionActions]" /></div>
        @if (collapsible()) {
          <button
            class="emr-button emr-button--ghost emr-button--small emr-section-card__toggle"
            type="button"
            [attr.aria-expanded]="!collapsed()"
            [attr.aria-controls]="contentId()"
            [attr.aria-label]="toggleAriaLabel()"
            (click)="onToggleClick()"
          >
            <span>{{ collapsed() ? 'Show' : 'Hide' }}</span>
            <svg
              class="emr-section-card__chevron"
              [class.emr-section-card__chevron--expanded]="!collapsed()"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        }
      </header>
      <!-- Collapsed content stays in the DOM (hidden, not removed) so the print
           layer can restore it: a collapsed section on paper is omitted clinical data. -->
      <div class="emr-section-card__content" [id]="contentId()" [hidden]="collapsed()"><ng-content /></div>
      <footer class="emr-section-card__footer" [hidden]="collapsed()"><ng-content select="[emrSectionFooter]" /></footer>
    </section>
  `,
})
export class EmrSectionCardComponent {
  readonly sectionId = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly status = input<EmrBadge>();
  readonly collapsible = input(false, { transform: booleanAttribute });
  readonly collapsed = input(false, { transform: booleanAttribute });
  readonly headingId = input<string>();
  readonly headingLevel = input<EmrSectionCardHeadingLevel>(2);
  readonly variant = input<EmrSectionCardVariant>('outlined');
  readonly tone = input<EmrTone>('neutral');
  readonly padding = input<EmrSectionCardPadding>('md');
  readonly icon = input<string>();
  readonly readOnly = input(false, { transform: booleanAttribute });

  readonly intent = output<SectionCardIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  protected readonly resolvedVariant = computed(() => normalizeSectionCardVariant(this.variant()));
  protected readonly resolvedTone = computed(() => normalizeSectionCardTone(this.tone()));
  protected readonly resolvedPadding = computed(() => normalizeSectionCardPadding(this.padding()));
  protected readonly resolvedHeadingLevel = computed(() => normalizeSectionCardHeadingLevel(this.headingLevel()));
  protected readonly resolvedHeadingId = computed(() => resolveSectionCardHeadingId(this.sectionId(), this.headingId()));
  protected readonly contentId = computed(() => resolveSectionCardContentId(this.sectionId()));
  protected readonly iconPaths = computed(() => resolveSectionCardIconPaths(this.icon()));
  protected readonly toggleAriaLabel = computed(() => resolveSectionCardToggleLabel(this.collapsed(), this.label()));

  protected onToggleClick(): void {
    this.intent.emit({ type: 'toggleRequested', sectionId: this.sectionId() });
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.hostRef.nativeElement.contains(nextTarget)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}
