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
  TerminologyBinding,
  TerminologyBindingStrength,
  TerminologyConcept,
  TerminologyMappingRelationship,
  TerminologySearchIntent,
  TerminologySearchViewModel,
} from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowPath,
  heroChevronLeft,
  heroChevronRight,
  heroMagnifyingGlass,
  heroTrash,
} from '@ng-icons/heroicons/outline';
import {
  TERMINOLOGY_SEARCH_DEFAULTS,
  resolveAuthoringId,
  type EmrTerminologySearchLabels,
} from './emr-authoring.logic';

@Component({
  selector: 'emr-terminology-search',
  standalone: true,
  imports: [NgIcon],
  providers: [
    ...provideIcons({
      heroArrowPath,
      heroChevronLeft,
      heroChevronRight,
      heroMagnifyingGlass,
      heroTrash,
    }),
  ],
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
      class="emr-authoring-card emr-terminology-search"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.data-emr-print]="'expand'"
    >
      <div class="emr-authoring-card__heading">
        <div>
          <p class="emr-eyebrow">{{ l.eyebrow }}</p>
          <h3 [id]="resolvedHeadingId()">{{ roleLabel() }}</h3>
        </div>
        @if (m.search?.loading) {
          <span class="emr-authoring-status" role="status">{{ l.searching }}</span>
        }
      </div>

      <div class="emr-authoring-grid emr-authoring-grid--search">
        <label class="emr-field-frame__label" [for]="sourceControlId()">{{ l.sourceLabel }}</label>
        <select
          class="emr-select"
          [id]="sourceControlId()"
          [value]="m.search?.sourceId ?? ''"
          [attr.aria-disabled]="locked ? 'true' : null"
          (mousedown)="guardReadOnlySelect($event, locked)"
          (keydown)="guardReadOnlySelectKey($event, locked)"
          (change)="sourceChanged($event)"
        >
          <option value="" [selected]="!m.search?.sourceId">{{ l.chooseTerminology }}</option>
          @for (source of m.sources; track source.id) {
            <option
              [value]="source.id"
              [selected]="source.id === m.search?.sourceId"
              [attr.data-available]="source.available ? 'true' : 'false'"
            >
              {{ source.label }}{{ source.versionLabel ? ' · ' + source.versionLabel : '' }}{{ !source.available ? ' (Unavailable)' : '' }}
            </option>
          }
        </select>

        <label class="emr-field-frame__label" [for]="queryControlId()">{{ l.searchLabel }}</label>
        <div class="emr-search-row">
          <input
            class="emr-control"
            [id]="queryControlId()"
            type="search"
            [value]="m.search?.query ?? ''"
            [placeholder]="placeholder()"
            [readonly]="locked || !m.search?.sourceId"
            [attr.aria-disabled]="(locked || !m.search?.sourceId) ? 'true' : null"
            (input)="queryChanged($event)"
            (keydown.enter)="searchRequested()"
          />
          <button
            class="emr-button emr-button--secondary"
            type="button"
            data-emr-print="hide"
            [attr.aria-disabled]="(locked || !m.search?.sourceId || m.search.loading) ? 'true' : null"
            (click)="searchRequested()"
          >
            <ng-icon name="heroMagnifyingGlass" size="16" aria-hidden="true" />
            <span>{{ l.searchButton }}</span>
          </button>
        </div>
      </div>

      @if (m.search?.error) {
        <div class="emr-authoring-message emr-authoring-message--error" role="alert">
          <span>{{ m.search.error }}</span>
          <button
            class="emr-button emr-button--ghost"
            type="button"
            data-emr-print="hide"
            [attr.aria-disabled]="locked ? 'true' : null"
            (click)="retry()"
          >
            <ng-icon name="heroArrowPath" size="16" aria-hidden="true" />
            <span>{{ l.retry }}</span>
          </button>
        </div>
      } @else if (m.search && !m.search.loading && m.search.sourceId && m.search.query && m.search.options.length === 0) {
        <p class="emr-authoring-message" role="status">{{ l.noConceptsFound }}</p>
      }

      @if (m.search && m.search.options.length) {
        <div class="emr-terminology-results" role="group" [attr.aria-label]="roleLabel() + ' search results'">
          @for (concept of m.search.options; track concept.sourceId + ':' + concept.code) {
            <button
              class="emr-terminology-result"
              type="button"
              [attr.aria-disabled]="(locked || concept.active === false) ? 'true' : null"
              (click)="selectConcept(concept)"
            >
              <span class="emr-terminology-result__main">
                <strong>{{ concept.display }}</strong>
                <span>{{ concept.code }}</span>
              </span>
              <span class="emr-terminology-result__meta">
                {{ concept.system }}{{ concept.version ? ' · ' + concept.version : '' }}{{ concept.active === false ? ' · ' + l.inactive : '' }}
              </span>
            </button>
          }
        </div>
        @if (m.search && m.search.total > m.search.pageSize) {
          <div class="emr-authoring-pagination" data-emr-print="hide">
            <span>Page {{ m.search.page }} · {{ m.search.total }} results</span>
            <button
              class="emr-button emr-button--ghost"
              type="button"
              [attr.aria-disabled]="(locked || m.search.page <= 1) ? 'true' : null"
              (click)="pageChanged(m.search.page - 1)"
            >
              <ng-icon name="heroChevronLeft" size="16" aria-hidden="true" />
              <span>{{ l.previous }}</span>
            </button>
            <button
              class="emr-button emr-button--ghost"
              type="button"
              [attr.aria-disabled]="(locked || m.search.page * m.search.pageSize >= m.search.total) ? 'true' : null"
              (click)="pageChanged(m.search.page + 1)"
            >
              <span>{{ l.next }}</span>
              <ng-icon name="heroChevronRight" size="16" aria-hidden="true" />
            </button>
          </div>
        }
      }

      @for (binding of m.bindings; track binding.id) {
        <div class="emr-terminology-binding">
          <div>
            <span class="emr-eyebrow">{{ l.selectedConcept }}</span>
            <strong>{{ binding.concept?.display ?? binding.valueSetCanonical ?? binding.id }}</strong>
            <span>
              {{ binding.concept?.code ?? '' }}{{ binding.concept ? ' · ' + binding.concept.system : '' }}{{ binding.valueSetCanonical ? ' · ' + binding.valueSetCanonical : '' }}
            </span>
          </div>
          <div class="emr-terminology-binding__controls">
            <label>
              {{ l.bindingStrength }}
              <select
                class="emr-select"
                [value]="binding.strength ?? 'preferred'"
                [attr.aria-disabled]="locked ? 'true' : null"
                (mousedown)="guardReadOnlySelect($event, locked)"
                (keydown)="guardReadOnlySelectKey($event, locked)"
                (change)="strengthChanged(binding, $event)"
              >
                @for (opt of l.strengthOptions; track opt.value) {
                  <option [value]="opt.value" [selected]="opt.value === (binding.strength ?? 'preferred')">{{ opt.label }}</option>
                }
              </select>
            </label>
            @if (m.role === 'classification-mapping') {
              <label>
                {{ l.relationship }}
                <select
                  class="emr-select"
                  [value]="binding.mappingRelationship ?? 'related-to'"
                  [attr.aria-disabled]="locked ? 'true' : null"
                  (mousedown)="guardReadOnlySelect($event, locked)"
                  (keydown)="guardReadOnlySelectKey($event, locked)"
                  (change)="relationshipChanged(binding, $event)"
                >
                  @for (opt of l.relationshipOptions; track opt.value) {
                    <option [value]="opt.value" [selected]="opt.value === (binding.mappingRelationship ?? 'related-to')">{{ opt.label }}</option>
                  }
                </select>
              </label>
            }
            <button
              class="emr-button emr-button--ghost"
              type="button"
              data-emr-print="hide"
              [attr.aria-disabled]="locked ? 'true' : null"
              (click)="removeBinding(binding)"
            >
              <ng-icon name="heroTrash" size="16" aria-hidden="true" />
              <span>{{ l.remove }}</span>
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;container-type:inline-size;max-width:100%}
    .emr-authoring-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px;min-width:0;max-width:100%;font-family:var(--emr-font-family);color:var(--emr-text)}
    .emr-authoring-card__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap}
    .emr-authoring-card h3{margin:2px 0 0;color:var(--emr-text);font-size:var(--emr-text-lg)}
    .emr-eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .emr-authoring-grid{display:grid;grid-template-columns:minmax(110px,150px) minmax(0,1fr);gap:10px 12px;align-items:center}
    .emr-search-row{display:flex;gap:8px;min-width:0;flex-wrap:wrap}
    .emr-search-row .emr-control{min-width:140px;flex:1}
    .emr-control,.emr-select,.emr-button{min-height:var(--emr-control-height,44px)}
    .emr-button{min-width:44px;display:inline-flex;align-items:center;gap:6px}
    .emr-button[aria-disabled="true"],.emr-select[aria-disabled="true"],.emr-terminology-result[aria-disabled="true"]{cursor:not-allowed;opacity:.55}
    .emr-authoring-status{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-authoring-message{margin:14px 0 0;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised);color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-authoring-message--error{background:var(--emr-danger-soft);color:var(--emr-danger);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
    .emr-terminology-results{display:grid;gap:6px;margin-top:14px;max-height:270px;overflow:auto}
    .emr-terminology-result{width:100%;min-height:44px;padding:9px 11px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);color:var(--emr-text);text-align:left;cursor:pointer;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .emr-terminology-result:hover,.emr-terminology-result:focus-visible{border-color:var(--emr-primary);background:var(--emr-surface-raised)}
    .emr-terminology-result__main{display:grid;gap:2px;min-width:0}
    .emr-terminology-result__main span,.emr-terminology-result__meta{font-size:var(--emr-text-sm);color:var(--emr-text-muted);overflow-wrap:anywhere}
    .emr-terminology-result__meta{text-align:right}
    .emr-authoring-pagination{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:10px;font-size:var(--emr-text-sm);color:var(--emr-text-muted);flex-wrap:wrap}
    .emr-authoring-pagination span{margin-right:auto}
    .emr-terminology-binding{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:14px;padding:12px;border-radius:8px;background:var(--emr-surface-raised);border:1px solid var(--emr-border);flex-wrap:wrap}
    .emr-terminology-binding>div:first-child{display:grid;gap:3px;min-width:0}
    .emr-terminology-binding>div:first-child>span:last-child{font-size:var(--emr-text-sm);color:var(--emr-text-muted);overflow-wrap:anywhere}
    .emr-terminology-binding__controls{display:flex;align-items:end;gap:10px;flex-wrap:wrap}
    .emr-terminology-binding__controls label{display:grid;gap:4px;font-size:var(--emr-text-xs);color:var(--emr-text-muted)}
    .emr-terminology-binding__controls .emr-select{min-height:var(--emr-control-height,44px)}
    @container (max-width: 720px){
      .emr-authoring-card{padding:14px}
      .emr-authoring-grid{grid-template-columns:1fr;gap:6px}
      .emr-search-row{display:grid;grid-template-columns:1fr}
      .emr-terminology-result{display:grid;gap:4px}
      .emr-terminology-result__meta{text-align:left}
      .emr-terminology-binding{display:grid;align-items:stretch}
      .emr-terminology-binding__controls{justify-content:space-between}
    }
    @media (max-width: 640px){
      .emr-authoring-card{padding:14px}
      .emr-authoring-grid{grid-template-columns:1fr;gap:6px}
      .emr-terminology-result{display:grid;gap:4px}
      .emr-terminology-result__meta{text-align:left}
      .emr-terminology-binding{display:grid;align-items:stretch}
    }
    :host-context(.emr-print) [data-emr-print="hide"]{display:none !important}
    :host-context(.emr-print) .emr-terminology-results{max-height:none !important;overflow:visible !important}
    @media print{
      [data-emr-print="hide"]{display:none !important}
      .emr-terminology-results{max-height:none !important;overflow:visible !important}
    }
  `],
})
export class EmrTerminologySearchComponent {
  readonly model = input.required<TerminologySearchViewModel>();
  readonly headingId = input<string>('emr-terminology-heading');
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrTerminologySearchLabels>>({});

  readonly intent = output<TerminologySearchIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  protected readonly text = computed(() => ({ ...TERMINOLOGY_SEARCH_DEFAULTS, ...this.labels() }));
  protected readonly effectiveReadOnly = computed(() => !!this.model().readOnly);
  protected readonly resolvedHeadingId = computed(() =>
    resolveAuthoringId(this.idPrefix(), this.headingId().trim() || 'emr-terminology-heading'),
  );
  protected readonly roleLabel = computed(
    () => this.text().roleLabels[this.model().role] ?? this.model().role,
  );
  protected readonly placeholder = computed(() =>
    this.model().role === 'unit'
      ? this.text().searchUcumPlaceholder
      : `Search ${this.roleLabel().toLowerCase()}`,
  );

  sourceControlId(): string {
    return `${this.resolvedHeadingId()}-source`;
  }

  queryControlId(): string {
    return `${this.resolvedHeadingId()}-query`;
  }

  guardReadOnlySelect(event: Event, locked: boolean): void {
    if (locked) event.preventDefault();
  }

  guardReadOnlySelectKey(event: KeyboardEvent, locked: boolean): void {
    if (locked && [' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }
  }

  sourceChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.effectiveReadOnly()) {
      select.value = this.model().search?.sourceId ?? '';
      return;
    }
    const sourceId = select.value;
    const source = this.model().sources.find(s => s.id === sourceId);
    if (sourceId && source && !source.available) {
      select.value = this.model().search?.sourceId ?? '';
      return;
    }
    if (sourceId) {
      this.intent.emit({ type: 'terminologySearchOpened', role: this.model().role, sourceId });
    }
  }

  queryChanged(event: Event): void {
    if (this.effectiveReadOnly() || !this.model().search?.sourceId) return;
    this.intent.emit({
      type: 'terminologyQueryChanged',
      role: this.model().role,
      query: (event.target as HTMLInputElement).value,
    });
  }

  searchRequested(): void {
    const m = this.model();
    if (this.effectiveReadOnly() || !m.search?.sourceId || m.search?.loading) return;
    this.intent.emit({ type: 'terminologySearchRequested', role: m.role });
  }

  retry(): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'terminologyRetryRequested', role: this.model().role });
  }

  pageChanged(page: number): void {
    const m = this.model();
    if (this.effectiveReadOnly() || !m.search) return;
    if (page < 1 || (page > m.search.page && m.search.page * m.search.pageSize >= m.search.total)) return;
    this.intent.emit({ type: 'terminologyPageChanged', role: m.role, page });
  }

  selectConcept(concept: TerminologyConcept): void {
    if (this.effectiveReadOnly() || concept.active === false) return;
    const role = this.model().role;
    this.intent.emit({
      type: 'terminologyConceptSelected',
      role,
      concept,
      strength: 'preferred',
      mappingRelationship: role === 'classification-mapping' ? 'related-to' : undefined,
    });
  }

  strengthChanged(binding: TerminologyBinding, event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.effectiveReadOnly()) {
      select.value = binding.strength ?? 'preferred';
      return;
    }
    const strength = select.value as TerminologyBindingStrength;
    if (binding.concept) {
      this.intent.emit({
        type: 'terminologyConceptSelected',
        role: this.model().role,
        concept: binding.concept,
        strength,
        mappingRelationship: binding.mappingRelationship,
      });
    }
  }

  relationshipChanged(binding: TerminologyBinding, event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.effectiveReadOnly()) {
      select.value = binding.mappingRelationship ?? 'related-to';
      return;
    }
    const mappingRelationship = select.value as TerminologyMappingRelationship;
    if (binding.concept) {
      this.intent.emit({
        type: 'terminologyConceptSelected',
        role: this.model().role,
        concept: binding.concept,
        strength: binding.strength,
        mappingRelationship,
      });
    }
  }

  removeBinding(binding: TerminologyBinding): void {
    if (this.effectiveReadOnly()) return;
    this.intent.emit({ type: 'terminologyBindingRemoved', bindingId: binding.id });
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
