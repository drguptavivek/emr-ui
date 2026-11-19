import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  EmrGeneratedFieldDefinition,
  FieldLibraryPickerIntent,
  FieldLibraryPickerViewModel,
} from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPlus } from '@ng-icons/heroicons/outline';
import {
  FIELD_LIBRARY_DEFAULTS,
  resolveAuthoringId,
  summarizeFieldTerminology,
  type EmrFieldLibraryPickerLabels,
} from './emr-authoring.logic';

@Component({
  selector: 'emr-field-library-picker',
  standalone: true,
  imports: [NgIcon],
  providers: [...provideIcons({ heroPlus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    @let m = model();
    @let l = text();
    @let locked = effectiveReadOnly();
    <section
      class="emr-template-card"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.data-emr-print]="'expand'"
    >
      <header class="emr-template-card__heading">
        <div>
          <p class="emr-template-eyebrow">{{ l.eyebrow }}</p>
          <h2 [id]="resolvedHeadingId()">{{ l.heading }}</h2>
          <p>{{ l.description }}</p>
        </div>
        <span class="emr-template-count" role="status">{{ m.fields.length }} available</span>
      </header>

      <label class="emr-template-label" [for]="queryId()">{{ l.searchLabel }}</label>
      <input
        class="emr-control"
        [id]="queryId()"
        type="search"
        [value]="m.query"
        [readonly]="locked"
        [placeholder]="l.searchPlaceholder"
        (input)="queryChanged($event)"
      />

      @if (!m.selectedSectionId) {
        <p class="emr-template-note" role="status">{{ l.selectSectionNote }}</p>
      }

      <div class="emr-template-library" role="list" [attr.aria-label]="l.availableFieldsList">
        @for (field of m.fields; track field.id) {
          <article class="emr-template-library__item" role="listitem">
            <div>
              <strong>{{ field.label }}</strong>
              <span>
                {{ field.type }}{{ field.required ? ' · ' + l.requiredTag : '' }}{{ field.repeats ? ' · ' + l.repeatableTag : '' }}
              </span>
              @if (field.description) {
                <small>{{ field.description }}</small>
              }
              @if (field.terminologyBindings.length) {
                <small>{{ terminologySummary(field) }}</small>
              }
            </div>
            <button
              class="emr-button emr-button--outline emr-button--small"
              type="button"
              data-emr-print="hide"
              [attr.aria-disabled]="(locked || !m.selectedSectionId) ? 'true' : null"
              (click)="add(field)"
            >
              <ng-icon name="heroPlus" size="16" aria-hidden="true" />
              <span>{{ l.add }}</span>
            </button>
          </article>
        } @empty {
          <p class="emr-template-note" role="status">{{ l.noMatchingFields }}</p>
        }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block;container-type:inline-size;max-width:100%}
    .emr-template-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px;color:var(--emr-text);font-family:var(--emr-font-family);min-width:0;max-width:100%}
    .emr-template-card__heading{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap}
    .emr-template-card h2{margin:2px 0 6px;font-size:var(--emr-text-lg)}
    .emr-template-card p{margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-md);line-height:1.45}
    .emr-template-eyebrow{margin:0 0 4px !important;color:var(--emr-text-muted) !important;font-size:var(--emr-text-2xs) !important;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .emr-template-count{color:var(--emr-text-muted);font-size:var(--emr-text-sm);white-space:nowrap}
    .emr-template-label{display:block;margin-bottom:6px;color:var(--emr-text-muted);font-size:var(--emr-text-sm);font-weight:600}
    .emr-control,.emr-button{min-height:var(--emr-control-height,44px)}
    .emr-button{min-width:44px;display:inline-flex;align-items:center;gap:6px}
    .emr-button[aria-disabled="true"]{cursor:not-allowed;opacity:.55}
    .emr-template-note{margin-top:12px !important;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised)}
    .emr-template-library{display:grid;gap:8px;margin-top:14px;max-height:430px;overflow:auto}
    .emr-template-library__item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--emr-border);border-radius:9px;background:var(--emr-surface-raised)}
    .emr-template-library__item>div{display:grid;gap:3px;min-width:0}
    .emr-template-library__item span,.emr-template-library__item small{color:var(--emr-text-muted);font-size:var(--emr-text-xs);overflow-wrap:anywhere}
    .emr-template-library__item small{line-height:1.35}
    @container (max-width: 720px){
      .emr-template-card{padding:14px}
      .emr-template-card__heading{display:grid;gap:8px}
      .emr-template-library__item{grid-template-columns:1fr}
      .emr-template-library__item button{justify-self:start}
    }
    @media (max-width: 640px){
      .emr-template-card{padding:14px}
      .emr-template-card__heading{display:grid;gap:8px}
      .emr-template-library__item{grid-template-columns:1fr}
      .emr-template-library__item button{justify-self:start}
    }
    :host-context(.emr-print) [data-emr-print="hide"]{display:none !important}
    :host-context(.emr-print) .emr-template-library{max-height:none !important;overflow:visible !important}
    @media print{
      [data-emr-print="hide"]{display:none !important}
      .emr-template-library{max-height:none !important;overflow:visible !important}
    }
  `],
})
export class EmrFieldLibraryPickerComponent {
  readonly model = input.required<FieldLibraryPickerViewModel>();
  readonly headingId = input<string>('emr-field-library-heading');
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrFieldLibraryPickerLabels>>({});

  readonly intent = output<FieldLibraryPickerIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  protected readonly text = computed(() => ({ ...FIELD_LIBRARY_DEFAULTS, ...this.labels() }));
  protected readonly effectiveReadOnly = computed(() => !!this.model().readOnly);
  protected readonly resolvedHeadingId = computed(() =>
    resolveAuthoringId(this.idPrefix(), this.headingId().trim() || 'emr-field-library-heading'),
  );

  queryId(): string {
    return `${this.resolvedHeadingId()}-search`;
  }

  queryChanged(event: Event): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'fieldLibraryQueryChanged', query: (event.target as HTMLInputElement).value });
  }

  add(field: EmrGeneratedFieldDefinition): void {
    const sectionId = this.model().selectedSectionId;
    if (this.effectiveReadOnly() || !sectionId) return;
    this.intent.emit({ type: 'fieldAdded', sectionId, field, placementId: '' });
  }

  terminologySummary(field: EmrGeneratedFieldDefinition): string {
    return summarizeFieldTerminology(field);
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.hostRef.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}
