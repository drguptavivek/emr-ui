import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  ClinicalFormIntent,
  RepeatableGroupDefinition,
  RepeatableItemState,
} from '@drguptavivek/emr-controller';
import { EmrCustomFieldContext, EmrTypedFieldComponent } from '../fields/emr-typed-field.component';
import { EmrBadgeComponent } from '../primitives/emr-feedback.component';
import {
  REPEATABLE_GROUP_ICON_PATHS,
  canAddRepeatableItem,
  canRemoveRepeatableItem,
  isRepeatableFieldShown,
  resolveRepeatableControlId,
  resolveRepeatableHeadingId,
  resolveRepeatableMaxItemsHint,
} from './emr-repeatable-group.logic';

@Component({
  selector: 'emr-repeatable-group',
  standalone: true,
  imports: [EmrTypedFieldComponent, EmrBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <section
      class="emr-repeatable-group"
      [class.emr-repeatable-group--readonly]="readOnly()"
      [class.emr-repeatable-group--error]="!!error()"
      [class.emr-repeatable-group--warning]="!error() && !!warning()"
      role="region"
      [attr.aria-labelledby]="resolvedHeadingId()"
    >
      <div class="emr-repeatable-group__heading">
        <div class="emr-repeatable-group__heading-text">
          <h3 [id]="resolvedHeadingId()">{{ definition().label }}</h3>
          @if (definition().description) {
            <p class="emr-repeatable-group__description">{{ definition().description }}</p>
          }
        </div>
        @if (canAdd()) {
          <button
            class="emr-button emr-button--outline emr-button--small emr-repeatable-group__add"
            type="button"
            data-emr-print="hide"
            (click)="requestAdd()"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              @for (d of iconPaths.plus; track $index) {
                <path [attr.d]="d" />
              }
            </svg>
            <span>{{ definition().addLabel ?? 'Add' }}</span>
          </button>
        } @else if (maxItemsHint(); as hint) {
          <span class="emr-repeatable-group__limit" role="status">{{ hint }}</span>
        }
      </div>
      @if (error(); as err) {
        <p class="emr-repeatable-group__message emr-field__error" role="alert">{{ err }}</p>
      }
      @if (warning(); as warn) {
        <p class="emr-repeatable-group__message emr-field__warning" role="status">{{ warn }}</p>
      }
      @for (item of model(); track item.id) {
        <article
          class="emr-repeatable-group__item"
          [class.emr-repeatable-group__item--readonly]="readOnly() || !!item.readOnly"
          [class.emr-repeatable-group__item--error]="!!item.error"
          [class.emr-repeatable-group__item--warning]="!item.error && !!item.warning"
        >
          <header class="emr-repeatable-group__item-header">
            <div class="emr-repeatable-group__item-title">
              <span>{{ itemLabel(item, $index) }}</span>
              @if (item.readOnly && !readOnly()) {
                <span class="emr-badge emr-tone-neutral emr-badge--sm emr-repeatable-group__lock">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (d of iconPaths.lock; track $index) {
                      <path [attr.d]="d" />
                    }
                  </svg>
                  <span>Read-only</span>
                </span>
              }
              @for (badge of item.badges ?? []; track $index) {
                <emr-badge [badge]="badge" />
              }
            </div>
            @if (canRemove(item)) {
              <button
                class="emr-button emr-button--ghost emr-button--small emr-repeatable-group__remove"
                type="button"
                data-emr-print="hide"
                [attr.aria-label]="'Remove ' + itemLabel(item, $index)"
                (click)="requestRemove(item)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  @for (d of iconPaths.trash; track $index) {
                    <path [attr.d]="d" />
                  }
                </svg>
                <span>Remove</span>
              </button>
            }
          </header>
          @if (item.error; as itemErr) {
            <p class="emr-repeatable-group__message emr-field__error" role="alert">{{ itemErr }}</p>
          }
          @if (item.warning; as itemWarn) {
            <p class="emr-repeatable-group__message emr-field__warning" role="status">{{ itemWarn }}</p>
          }
          <div class="emr-repeatable-group__grid">
            @for (field of visibleFields(item); track field.id) {
              <div class="emr-repeatable-group__field" [style.grid-column]="'span ' + (field.span ?? 6)">
                <emr-typed-field
                  [definition]="field"
                  [model]="item.fields[field.id]"
                  [controlId]="controlId(item, field)"
                  [readOnly]="readOnly() || !!item.readOnly"
                  [customTemplates]="customTemplates()"
                  (focused)="onFieldFocused(item, field)"
                  (valueChange)="onValueChanged(item, field, $event)"
                  (statusChange)="onStatusChanged(item, field, $event)"
                />
              </div>
            }
          </div>
        </article>
      } @empty {
        <p class="emr-repeatable-group__empty">{{ resolvedEmptyMessage() }}</p>
      }
    </section>
  `,
})
export class EmrRepeatableGroupComponent {
  readonly definition = input.required<RepeatableGroupDefinition>();
  readonly model = input<readonly RepeatableItemState[]>([]);
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly emptyMessage = input<string>();
  readonly error = input<string>();
  readonly warning = input<string>();
  readonly customTemplates = input<Readonly<Record<string, TemplateRef<EmrCustomFieldContext>>>>({});

  readonly intent = output<ClinicalFormIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  protected readonly iconPaths = REPEATABLE_GROUP_ICON_PATHS;

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  protected readonly resolvedHeadingId = computed(() =>
    resolveRepeatableHeadingId(this.definition().id, this.idPrefix(), this.headingId()),
  );
  protected readonly resolvedEmptyMessage = computed(
    () => this.emptyMessage() ?? this.definition().emptyMessage ?? 'No entries recorded.',
  );
  protected readonly canAdd = computed(() =>
    canAddRepeatableItem(this.definition(), this.model(), this.readOnly()),
  );
  protected readonly maxItemsHint = computed(() =>
    resolveRepeatableMaxItemsHint(this.definition(), this.model(), this.readOnly()),
  );

  protected itemLabel(item: RepeatableItemState, index: number): string {
    return item.label ?? `Entry ${index + 1}`;
  }

  protected canRemove(item: RepeatableItemState): boolean {
    return canRemoveRepeatableItem(this.definition(), this.model(), item, this.readOnly());
  }

  protected visibleFields(item: RepeatableItemState): readonly ClinicalFieldDefinition[] {
    return this.definition().fields.filter((field) => isRepeatableFieldShown(item.fields[field.id]));
  }

  protected controlId(item: RepeatableItemState, field: ClinicalFieldDefinition): string {
    return resolveRepeatableControlId(this.definition().id, item.id, field.id, this.idPrefix());
  }

  protected requestAdd(): void {
    if (!this.canAdd()) return;
    this.intent.emit({ type: 'repeatItemAddRequested', groupId: this.definition().id });
  }

  protected requestRemove(item: RepeatableItemState): void {
    if (!this.canRemove(item)) return;
    this.intent.emit({
      type: 'repeatItemRemoveRequested',
      groupId: this.definition().id,
      itemId: item.id,
    });
  }

  protected onFieldFocused(item: RepeatableItemState, field: ClinicalFieldDefinition): void {
    this.intent.emit({
      type: 'fieldFocused',
      fieldId: `${this.definition().id}.${item.id}.${field.id}`,
    });
  }

  protected onValueChanged(
    item: RepeatableItemState,
    field: ClinicalFieldDefinition,
    value: ClinicalFieldValue,
  ): void {
    const state = item.fields[field.id];
    if (this.readOnly() || item.readOnly || state?.readOnly || state?.disabled) return;
    this.intent.emit({
      type: 'repeatItemEditRequested',
      groupId: this.definition().id,
      itemId: item.id,
      fieldId: field.id,
      value,
    });
  }

  protected onStatusChanged(
    item: RepeatableItemState,
    field: ClinicalFieldDefinition,
    status: ClinicalFieldState['assessmentStatus'],
  ): void {
    const state = item.fields[field.id];
    if (this.readOnly() || item.readOnly || state?.readOnly || state?.disabled) return;
    this.intent.emit({
      type: 'repeatItemStatusEditRequested',
      groupId: this.definition().id,
      itemId: item.id,
      fieldId: field.id,
      status,
    });
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
