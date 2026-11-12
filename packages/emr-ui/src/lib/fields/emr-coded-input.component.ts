import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark } from '@ng-icons/heroicons/outline';
import type {
  ClinicalAssessmentStatus,
  CodedInputIntent,
  CodedInputViewModel,
  EmrCodedValue,
  EmrOption,
} from '@drguptavivek/emr-controller';
import { EmrSearchSelectComponent } from '../primitives/emr-search-select.component';
import { EmrFieldFrameComponent } from './emr-field-frame.component';

let nextCodedInputId = 0;

interface CodedChip {
  readonly concept: EmrCodedValue;
  readonly key: string;
  readonly system: string;
}

const keyOf = (c: EmrCodedValue): string => `${c.system}|${c.code}`;

@Component({
  selector: 'emr-coded-input',
  standalone: true,
  imports: [EmrFieldFrameComponent, EmrSearchSelectComponent, NgIcon],
  providers: [...provideIcons({ heroXMark })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <emr-field-frame
      [label]="label()"
      [controlId]="resolvedId()"
      [required]="required()"
      [hint]="m.definition.presentation.hint"
      [messages]="m.messages"
    >
      <div
        class="ci"
        role="group"
        [attr.aria-labelledby]="headingId() ?? null"
        [attr.aria-label]="headingId() ? null : label()"
        [attr.aria-describedby]="describedBy()"
      >
        @if (chips().length) {
          <ul class="ci__chips" [attr.aria-label]="label() + ' selected'">
            @for (chip of chips(); track chip.key) {
              <li class="ci__chip">
                <span class="ci__text">
                  <strong class="ci__display">{{ chip.concept.display }}</strong>
                  <span class="ci__code">
                    <span class="ci__system">{{ chip.system }}</span> {{ chip.concept.code }}
                  </span>
                </span>
                @if (!m.readOnly) {
                  <button
                    class="ci__remove"
                    type="button"
                    [attr.aria-label]="'Remove ' + chip.concept.display"
                    (click)="
                      intent.emit({
                        type: 'conceptRemoveRequested',
                        code: chip.concept.code,
                        system: chip.concept.system
                      })
                    "
                  >
                    <ng-icon name="heroXMark" aria-hidden="true" />
                  </button>
                }
              </li>
            }
          </ul>
        } @else if (m.readOnly && !m.status) {
          <p class="ci__none">Not supplied</p>
        }

        @if (!m.readOnly) {
          <emr-search-select
            class="ci__search"
            [controlId]="resolvedId()"
            label="Search terminology"
            [labelHidden]="true"
            [placeholder]="placeholder()"
            [query]="m.query"
            [options]="searchOptions()"
            [selected]="selectedOptions()"
            [open]="m.open && (m.options.length > 0 || m.loading)"
            [loading]="m.loading"
            (queryChanged)="intent.emit({ type: 'queryChangeRequested', query: $event })"
            (searchRequested)="search()"
            (openRequested)="intent.emit({ type: 'openRequested' })"
            (closeRequested)="intent.emit({ type: 'closeRequested' })"
            (optionSelected)="select($event)"
          />
        }

        @if (m.open && !m.loading && !m.options.length && !m.readOnly) {
          <p class="ci__empty" role="status">{{ m.emptyMessage }}</p>
        }

        @if (m.status || (statusOptions().length && !m.readOnly)) {
          <div class="ci__status">
            @if (m.status) {
              <span [class]="'emr-badge ' + statusTone()" role="status">{{ statusLabel() }}</span>
            }
            @if (statusOptions().length && !m.readOnly) {
              <select
                #statusSelect
                class="emr-select ci__status-select"
                [attr.aria-label]="label() + ' assessment status'"
                [value]="m.status ?? ''"
                (change)="statusChanged($event)"
                (blur)="syncStatusSelect()"
              >
                <option value="" [selected]="!m.status">Status not set</option>
                @for (option of statusOptions(); track option.value) {
                  <option [value]="option.value" [selected]="option.value === m.status">
                    {{ option.label }}
                  </option>
                }
              </select>
            }
          </div>
        }
      </div>
    </emr-field-frame>
  `,
  styles: [
    `
      :host {
        display: block;
        color: var(--emr-text);
        font-family: var(--emr-font-family);
      }
      .ci {
        display: grid;
        gap: 8px;
        min-width: 0;
      }
      .ci__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .ci__chip {
        display: inline-flex;
        align-items: stretch;
        min-height: 44px;
        max-width: 100%;
        border: 1px solid var(--emr-border);
        border-radius: 8px;
        background: var(--emr-surface-soft);
      }
      .ci__text {
        display: grid;
        align-content: center;
        gap: 1px;
        min-width: 0;
        padding: 5px 10px;
        overflow-wrap: anywhere;
      }
      .ci__display {
        font-size: var(--emr-text-sm);
        font-weight: var(--emr-weight-bold);
        line-height: var(--emr-leading-tight);
      }
      .ci__code {
        font-size: var(--emr-text-xs);
        color: var(--emr-text-muted);
        line-height: var(--emr-leading-tight);
      }
      .ci__system {
        font-weight: var(--emr-weight-medium);
      }
      .ci__remove {
        flex: 0 0 auto;
        width: 44px;
        min-height: 44px;
        display: inline-grid;
        place-items: center;
        border: 0;
        border-left: 1px solid var(--emr-border);
        border-radius: 0 7px 7px 0;
        background: transparent;
        color: var(--emr-text);
        font-size: var(--emr-text-lg);
        cursor: pointer;
      }
      .ci__remove:hover {
        background: var(--emr-danger-soft);
        color: var(--emr-danger);
      }
      .ci__remove:focus-visible {
        outline: 3px solid var(--emr-focus);
        outline-offset: -3px;
      }
      .ci__empty {
        margin: 0;
        padding: 10px 12px;
        border: 1px dashed var(--emr-border);
        border-radius: 8px;
        color: var(--emr-text-muted);
        font-size: var(--emr-text-md);
      }
      .ci__none {
        margin: 0;
        min-height: 44px;
        display: flex;
        align-items: center;
        color: var(--emr-text-muted);
        font-size: var(--emr-text-md);
      }
      .ci__status {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .ci__status-select {
        width: auto;
        max-width: 100%;
        min-width: 0;
      }
    `,
  ],
})
export class EmrCodedInputComponent implements AfterViewChecked {
  readonly model = input.required<CodedInputViewModel>();
  readonly headingId = input<string>();
  readonly controlId = input<string>();
  readonly intent = output<CodedInputIntent>();

  private readonly fallbackId = `emr-coded-input-${++nextCodedInputId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  readonly chips = computed<readonly CodedChip[]>(() => {
    const m = this.model();
    const list =
      m.value === null
        ? []
        : Array.isArray(m.value)
          ? (m.value as readonly EmrCodedValue[])
          : [m.value as EmrCodedValue];
    return list.map((concept) => ({
      concept,
      key: keyOf(concept),
      system: this.systemName(concept),
    }));
  });

  readonly searchOptions = computed<readonly EmrOption[]>(() =>
    this.model().options.map((c) => ({
      value: keyOf(c),
      label: c.display,
      description: `${this.systemName(c)} ${c.code}`,
    })),
  );

  readonly selectedOptions = computed<readonly EmrOption[]>(() =>
    this.chips().map((c) => ({ value: c.key, label: c.concept.display })),
  );

  readonly describedBy = computed(() => {
    const m = this.model();
    const hasMsg = Boolean(m.definition.presentation.hint || m.messages.length > 0);
    return hasMsg ? `${this.resolvedId()}-message` : null;
  });

  readonly label = computed(() => this.model().definition.presentation.label);
  readonly placeholder = computed(
    () => this.model().definition.presentation.placeholder ?? 'Search by name or code',
  );
  readonly required = computed(() => this.model().definition.contract.cardinality.min >= 1);
  readonly statusOptions = computed(
    () => this.model().definition.presentation.assessmentStatusOptions ?? [],
  );
  readonly statusLabel = computed(() => {
    const status = this.model().status;
    return (
      this.statusOptions().find((o) => o.value === status)?.label ??
      String(status ?? '').replaceAll('-', ' ')
    );
  });
  readonly statusTone = computed(() => {
    const status = this.model().status;
    const tone = this.statusOptions().find((o) => o.value === status)?.tone;
    return tone ? `emr-tone-${tone}` : 'emr-tone-neutral';
  });

  private readonly statusSelectRef = viewChild<ElementRef<HTMLSelectElement>>('statusSelect');
  private needsStatusSync = false;

  ngAfterViewChecked(): void {
    if (this.needsStatusSync) {
      this.needsStatusSync = false;
      this.syncStatusSelect();
    }
  }

  search(): void {
    const m = this.model();
    const valueSetCanonical = m.definition.contract.terminology.find(
      (b) => b.role === 'answer-value-set',
    )?.valueSetCanonical;
    this.intent.emit({
      type: 'searchRequested',
      query: m.query,
      ...(valueSetCanonical ? { valueSetCanonical } : {}),
    });
  }

  select(key: string): void {
    const concept = this.model().options.find((c) => keyOf(c) === key);
    if (concept) this.intent.emit({ type: 'conceptSelected', concept });
  }

  statusChanged(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (this.model().readOnly) {
      this.syncStatusSelect();
      return;
    }
    const raw = target.value as ClinicalAssessmentStatus | '';
    this.needsStatusSync = true;
    queueMicrotask(() => {
      if (this.needsStatusSync) {
        this.needsStatusSync = false;
        this.syncStatusSelect();
      }
    });
    this.intent.emit({
      type: 'statusChangeRequested',
      status: raw ? raw : undefined,
    });
  }

  protected syncStatusSelect(): void {
    const el = this.statusSelectRef()?.nativeElement;
    if (!el) return;
    const expected = this.model().status ?? '';
    if (el.value !== expected) {
      el.value = expected;
    }
  }

  private systemName(c: EmrCodedValue): string {
    return this.model().systemLabels?.[c.system] ?? c.system;
  }
}
