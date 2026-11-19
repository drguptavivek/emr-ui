import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  ClinicalListIntent,
  ClinicalListItem,
  ClinicalListViewModel,
  EmrClinicalListHeadingLevel,
  EmrClinicalListLabels,
} from '@drguptavivek/emr-controller';
import { EmrBadgeComponent, EmrStateMessageComponent } from '../primitives/emr-feedback.component';
import {
  canAddClinicalListItem,
  canEditClinicalListItem,
  canRemoveClinicalListItem,
  isClinicalListItemSelectable,
  normalizeClinicalListHeadingLevel,
  normalizeClinicalListTone,
  normalizeClinicalListVariant,
  resolveClinicalListHeadingId,
  resolveClinicalListIconPaths,
  resolveClinicalListLabels,
} from './emr-clinical-list.logic';

@Component({
  selector: 'emr-clinical-list',
  standalone: true,
  imports: [EmrBadgeComponent, EmrStateMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'emr-clinical-list emr-panel',
    '[class.emr-panel--elevated]': 'resolvedVariant() === "elevated"',
    '[class.emr-panel--filled]': 'resolvedVariant() === "filled"',
    '[class.emr-panel--subtle]': 'resolvedVariant() === "subtle"',
    '[class.emr-panel--readonly]': '!!model().readOnly',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <section [attr.aria-labelledby]="resolvedHeadingId()" [attr.aria-busy]="model().loading ? 'true' : null">
      <header class="emr-panel__header emr-clinical-list__header">
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
            @for (d of listIconPaths; track $index) {
              <path [attr.d]="d" />
            }
          </svg>
        </span>
        <div class="emr-clinical-list__heading">
          @switch (resolvedHeadingLevel()) {
            @case (2) { <h2 class="emr-panel__title" [id]="resolvedHeadingId()">{{ resolvedTitle() }}</h2> }
            @case (3) { <h3 class="emr-panel__title" [id]="resolvedHeadingId()">{{ resolvedTitle() }}</h3> }
            @case (4) { <h4 class="emr-panel__title" [id]="resolvedHeadingId()">{{ resolvedTitle() }}</h4> }
            @case (5) { <h5 class="emr-panel__title" [id]="resolvedHeadingId()">{{ resolvedTitle() }}</h5> }
            @case (6) { <h6 class="emr-panel__title" [id]="resolvedHeadingId()">{{ resolvedTitle() }}</h6> }
          }
          @if (model().description) {
            <p class="emr-clinical-list__description">{{ model().description }}</p>
          }
        </div>
        @if (model().status; as statusBadge) {
          <emr-badge [badge]="statusBadge" />
        }
        @if (allowAdd()) {
          <button
            class="emr-button emr-button--small emr-button--outline emr-clinical-list__add"
            type="button"
            data-emr-print="hide"
            (click)="onAdd()"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              @for (d of plusIconPaths; track $index) {
                <path [attr.d]="d" />
              }
            </svg>
            <span>{{ resolvedAddLabel() }}</span>
          </button>
        }
      </header>
      <div class="emr-panel__body">
        @if (model().error) {
          <emr-state-message
            kind="error"
            size="sm"
            [title]="resolvedLabels().errorTitle"
            [message]="model().error!"
            [actionLabel]="resolvedLabels().retry"
            (actionTriggered)="onRetry()"
          />
        } @else if (model().loading) {
          <emr-state-message
            kind="loading"
            size="sm"
            [title]="resolvedLoadingLabel()"
          />
        } @else if (model().items.length === 0) {
          <emr-state-message
            kind="empty"
            size="sm"
            [title]="model().emptyTitle || resolvedEmptyMessage()"
            [message]="model().emptyTitle ? resolvedEmptyMessage() : ''"
          />
        } @else {
          <ul class="emr-list">
            @for (item of model().items; track item.id) {
              @let selected = model().selectedId === item.id;
              @let selectable = isItemSelectable(item);
              @let canEdit = canEditItem(item);
              @let canRemove = canRemoveItem(item);
              @let tone = itemTone(item);
              <li
                class="emr-list__item"
                [class.emr-list__item--selected]="selected"
                [class.emr-list__item--readonly]="!!model().readOnly || !!item.readOnly"
                [attr.data-tone]="tone"
              >
                @if (selectable) {
                  <button
                    class="emr-list__select"
                    type="button"
                    [attr.aria-current]="selected ? 'true' : null"
                    (click)="onSelect(item)"
                  >
                    <span class="emr-list__title">{{ item.title }}</span>
                    @if (item.subtitle) { <span class="emr-list__subtitle">{{ item.subtitle }}</span> }
                    @if (item.detail) { <span class="emr-list__detail">{{ item.detail }}</span> }
                    @if (item.meta) { <span class="emr-list__meta">{{ item.meta }}</span> }
                    @if (item.badges?.length) {
                      <span class="emr-chip-row">
                        @for (badge of item.badges; track $index) {
                          <emr-badge [badge]="badge" />
                        }
                      </span>
                    }
                  </button>
                } @else {
                  <div class="emr-list__select emr-list__select--static" [attr.aria-current]="selected ? 'true' : null">
                    <span class="emr-list__title">{{ item.title }}</span>
                    @if (item.subtitle) { <span class="emr-list__subtitle">{{ item.subtitle }}</span> }
                    @if (item.detail) { <span class="emr-list__detail">{{ item.detail }}</span> }
                    @if (item.meta) { <span class="emr-list__meta">{{ item.meta }}</span> }
                    @if (item.badges?.length) {
                      <span class="emr-chip-row">
                        @for (badge of item.badges; track $index) {
                          <emr-badge [badge]="badge" />
                        }
                      </span>
                    }
                  </div>
                }
                @if (canEdit || canRemove) {
                  <div class="emr-list__actions" data-emr-print="hide">
                    @if (canEdit) {
                      <button
                        class="emr-button emr-button--small emr-button--ghost"
                        type="button"
                        [attr.aria-label]="resolvedLabels().edit + ' ' + item.title"
                        (click)="onEdit(item)"
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
                          @for (d of penIconPaths; track $index) {
                            <path [attr.d]="d" />
                          }
                        </svg>
                        <span>{{ resolvedLabels().edit }}</span>
                      </button>
                    }
                    @if (canRemove) {
                      <button
                        class="emr-button emr-button--small emr-button--ghost"
                        type="button"
                        [attr.aria-label]="resolvedLabels().remove + ' ' + item.title"
                        (click)="onRemove(item)"
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
                          @for (d of trashIconPaths; track $index) {
                            <path [attr.d]="d" />
                          }
                        </svg>
                        <span>{{ resolvedLabels().remove }}</span>
                      </button>
                    }
                  </div>
                }
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
})
export class EmrClinicalListComponent {
  readonly model = input.required<ClinicalListViewModel>();
  readonly headingId = input<string>();
  readonly headingLevel = input<EmrClinicalListHeadingLevel>(2);
  readonly labels = input<Partial<EmrClinicalListLabels>>({});

  readonly intent = output<ClinicalListIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  protected readonly listIconPaths = resolveClinicalListIconPaths('list');
  protected readonly plusIconPaths = resolveClinicalListIconPaths('plus');
  protected readonly penIconPaths = resolveClinicalListIconPaths('pen');
  protected readonly trashIconPaths = resolveClinicalListIconPaths('trash');

  protected readonly resolvedLabels = computed(() => resolveClinicalListLabels(this.labels()));
  protected readonly resolvedVariant = computed(() => normalizeClinicalListVariant(this.model().variant));
  protected readonly resolvedHeadingLevel = computed(() => normalizeClinicalListHeadingLevel(this.headingLevel()));
  protected readonly resolvedHeadingId = computed(() => resolveClinicalListHeadingId(this.headingId()));
  protected readonly resolvedTitle = computed(() => this.model().title ?? this.resolvedLabels().title);
  protected readonly resolvedAddLabel = computed(() => this.model().addLabel ?? this.resolvedLabels().add);
  protected readonly resolvedLoadingLabel = computed(
    () => this.model().loadingLabel ?? this.resolvedLabels().loading,
  );
  protected readonly resolvedEmptyMessage = computed(
    () => this.model().emptyMessage ?? this.resolvedLabels().emptyMessage,
  );
  protected readonly allowAdd = computed(() => canAddClinicalListItem(this.model()));

  protected isItemSelectable(item: ClinicalListItem): boolean {
    return isClinicalListItemSelectable(item);
  }

  protected canEditItem(item: ClinicalListItem): boolean {
    return canEditClinicalListItem(this.model(), item);
  }

  protected canRemoveItem(item: ClinicalListItem): boolean {
    return canRemoveClinicalListItem(this.model(), item);
  }

  protected itemTone(item: ClinicalListItem): string | null {
    const tone = normalizeClinicalListTone(item.tone);
    return tone !== 'neutral' ? tone : null;
  }

  protected onAdd(): void {
    if (this.allowAdd()) {
      this.intent.emit({ type: 'addRequested' });
    }
  }

  protected onRetry(): void {
    this.intent.emit({ type: 'retryRequested' });
  }

  protected onSelect(item: ClinicalListItem): void {
    if (this.isItemSelectable(item)) {
      this.intent.emit({ type: 'selected', id: item.id });
    }
  }

  protected onEdit(item: ClinicalListItem): void {
    if (this.canEditItem(item)) {
      this.intent.emit({ type: 'editRequested', id: item.id });
    }
  }

  protected onRemove(item: ClinicalListItem): void {
    if (this.canRemoveItem(item)) {
      this.intent.emit({ type: 'removeRequested', id: item.id });
    }
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
