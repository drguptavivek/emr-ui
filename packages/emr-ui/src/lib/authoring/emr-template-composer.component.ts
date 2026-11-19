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
  EhrTemplateSection,
  TemplateComposerIntent,
  TemplateComposerViewModel,
} from '@drguptavivek/emr-controller';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroCheck,
  heroChevronDown,
  heroChevronUp,
  heroPlus,
  heroTrash,
} from '@ng-icons/heroicons/outline';
import {
  AUTHORING_TEMPLATE_STATUS_OPTIONS,
  TEMPLATE_COMPOSER_DEFAULTS,
  resolveAuthoringId,
  type EmrTemplateComposerLabels,
} from './emr-authoring.logic';
import { EmrFieldLibraryPickerComponent } from './emr-field-library-picker.component';
import { EmrTemplatePreviewComponent } from './emr-template-preview.component';

@Component({
  selector: 'emr-template-composer',
  standalone: true,
  imports: [EmrFieldLibraryPickerComponent, EmrTemplatePreviewComponent, NgIcon],
  providers: [
    ...provideIcons({
      heroCheck,
      heroChevronDown,
      heroChevronUp,
      heroPlus,
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
      class="emr-template-composer"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.data-emr-print]="'expand'"
    >
      <header class="emr-template-composer__header">
        <div>
          <p class="emr-template-eyebrow">{{ l.eyebrow }}</p>
          <h1 [id]="resolvedHeadingId()">{{ m.template.title || l.untitledTemplate }}</h1>
          <p>{{ l.subtitle }}</p>
        </div>
        <div class="emr-template-composer__actions">
          <span class="emr-template-status" role="status">{{ m.dirty ? l.unsavedChanges : m.template.status }}</span>
          <button
            class="emr-button emr-button--primary"
            type="button"
            data-emr-print="hide"
            [attr.aria-disabled]="(locked || m.saving) ? 'true' : null"
            (click)="saveRequested()"
          >
            <ng-icon name="heroCheck" size="16" aria-hidden="true" />
            <span>{{ m.saving ? l.saving : l.saveTemplate }}</span>
          </button>
        </div>
      </header>

      @if (m.error) {
        <p class="emr-template-note emr-template-note--error" role="alert">{{ m.error }}</p>
      }

      <section class="emr-template-card" [attr.aria-labelledby]="id('identity-heading')">
        <div class="emr-template-card__heading">
          <div>
            <p class="emr-template-eyebrow">{{ l.metadataEyebrow }}</p>
            <h2 [id]="id('identity-heading')">{{ l.metadataHeading }}</h2>
          </div>
          <span class="emr-template-meta">Schema {{ m.template.schemaVersion }} · Revision {{ m.template.revision }}</span>
        </div>
        <div class="emr-template-grid">
          <label class="emr-template-label" [for]="id('template-title')">{{ l.titleLabel }}</label>
          <input
            class="emr-control"
            [id]="id('template-title')"
            [value]="m.template.title"
            [readonly]="locked"
            (input)="patchTemplate('title', textVal($event))"
          />
          <label class="emr-template-label" [for]="id('template-description')">{{ l.descriptionLabel }}</label>
          <textarea
            class="emr-control"
            [id]="id('template-description')"
            rows="2"
            [value]="m.template.description ?? ''"
            [readonly]="locked"
            (input)="patchTemplate('description', textVal($event))"
          ></textarea>
          <label class="emr-template-label" [for]="id('template-locale')">{{ l.localeLabel }}</label>
          <input
            class="emr-control"
            [id]="id('template-locale')"
            [value]="m.template.locale"
            [readonly]="locked"
            (input)="patchTemplate('locale', textVal($event))"
          />
          <label class="emr-template-label" [for]="id('template-status')">{{ l.statusLabel }}</label>
          <select
            class="emr-select"
            [id]="id('template-status')"
            [value]="m.template.status"
            [attr.aria-disabled]="locked ? 'true' : null"
            (mousedown)="guardReadOnlySelect($event, locked)"
            (keydown)="guardReadOnlySelectKey($event, locked)"
            (change)="statusChanged($event)"
          >
            @for (opt of statusOptions; track opt.value) {
              <option [value]="opt.value" [selected]="opt.value === m.template.status">{{ opt.label }}</option>
            }
          </select>
        </div>
      </section>

      <div class="emr-template-composer__layout">
        <aside class="emr-template-composer__sidebar">
          <section class="emr-template-card" [attr.aria-labelledby]="id('sections-heading')">
            <div class="emr-template-card__heading">
              <div>
                <p class="emr-template-eyebrow">{{ l.structureEyebrow }}</p>
                <h2 [id]="id('sections-heading')">{{ l.sectionsHeading }}</h2>
              </div>
              <span class="emr-template-meta">{{ m.template.sections.length }}</span>
            </div>
            <div class="emr-template-add-section" data-emr-print="hide">
              <input
                class="emr-control"
                [attr.aria-label]="l.newSectionPlaceholder"
                [value]="newSectionLabel"
                [readonly]="locked"
                [placeholder]="l.newSectionPlaceholder"
                (input)="newSectionLabelChanged($event)"
              />
              <button
                class="emr-button emr-button--outline"
                type="button"
                [attr.aria-disabled]="(locked || !newSectionLabel.trim()) ? 'true' : null"
                (click)="addSection()"
              >
                <ng-icon name="heroPlus" size="16" aria-hidden="true" />
                <span>{{ l.addSection }}</span>
              </button>
            </div>
            <nav class="emr-template-sections" [attr.aria-label]="l.sectionsNavLabel">
              @for (section of m.template.sections; track section.id; let index = $index) {
                <div
                  class="emr-template-section"
                  [class.emr-template-section--selected]="section.id === m.selectedSectionId"
                >
                  <button
                    class="emr-template-section__select"
                    type="button"
                    [attr.aria-current]="section.id === m.selectedSectionId ? 'true' : null"
                    (click)="emit({ type: 'sectionSelected', sectionId: section.id })"
                  >
                    <strong>{{ section.label }}</strong>
                    <span>{{ section.fields.length }} {{ section.fields.length === 1 ? 'field' : 'fields' }}</span>
                  </button>
                  <div class="emr-template-section__actions" data-emr-print="hide">
                    <button
                      class="emr-button emr-button--ghost emr-button--small"
                      type="button"
                      [attr.aria-label]="'Move ' + section.label + ' up'"
                      [attr.aria-disabled]="(locked || index === 0) ? 'true' : null"
                      (click)="moveSection(section.id, 'up', index === 0)"
                    >
                      <ng-icon name="heroChevronUp" size="16" aria-hidden="true" />
                      <span>{{ l.moveUp }}</span>
                    </button>
                    <button
                      class="emr-button emr-button--ghost emr-button--small"
                      type="button"
                      [attr.aria-label]="'Move ' + section.label + ' down'"
                      [attr.aria-disabled]="(locked || index === m.template.sections.length - 1) ? 'true' : null"
                      (click)="moveSection(section.id, 'down', index === m.template.sections.length - 1)"
                    >
                      <ng-icon name="heroChevronDown" size="16" aria-hidden="true" />
                      <span>{{ l.moveDown }}</span>
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="emr-template-note">{{ l.noSections }}</p>
              }
            </nav>
          </section>

          <emr-field-library-picker
            [model]="fieldLibraryModel()"
            [headingId]="id('field-library-heading')"
            [idPrefix]="idPrefix()"
            (intent)="emit($event)"
          />
        </aside>

        <main class="emr-template-composer__main">
          @if (selectedSection(); as section) {
            <section class="emr-template-card" [attr.aria-labelledby]="id('section-editor-heading')">
              <div class="emr-template-card__heading">
                <div>
                  <p class="emr-template-eyebrow">{{ l.selectedSectionEyebrow }}</p>
                  <h2 [id]="id('section-editor-heading')">{{ section.label }}</h2>
                </div>
                <button
                  class="emr-button emr-button--danger emr-button--small"
                  type="button"
                  data-emr-print="hide"
                  [attr.aria-disabled]="locked ? 'true' : null"
                  (click)="removeSection(section.id)"
                >
                  <ng-icon name="heroTrash" size="16" aria-hidden="true" />
                  <span>{{ l.removeSection }}</span>
                </button>
              </div>
              <div class="emr-template-grid">
                <label class="emr-template-label" [for]="id('section-label-' + section.id)">{{ l.sectionLabelLabel }}</label>
                <input
                  class="emr-control"
                  [id]="id('section-label-' + section.id)"
                  [value]="section.label"
                  [readonly]="locked"
                  (input)="patchSection(section, 'label', textVal($event))"
                />
                <label class="emr-template-label" [for]="id('section-description-' + section.id)">{{ l.sectionDescriptionLabel }}</label>
                <textarea
                  class="emr-control"
                  [id]="id('section-description-' + section.id)"
                  rows="2"
                  [value]="section.description ?? ''"
                  [readonly]="locked"
                  (input)="patchSection(section, 'description', textVal($event))"
                ></textarea>
              </div>
              <div class="emr-template-placements" role="list" [attr.aria-label]="l.placementsListLabel">
                @for (placement of section.fields; track placement.id; let index = $index) {
                  <article
                    class="emr-template-placement"
                    role="listitem"
                    [class.emr-template-placement--selected]="placement.id === m.selectedPlacementId"
                  >
                    <button
                      class="emr-template-placement__select"
                      type="button"
                      [attr.aria-current]="placement.id === m.selectedPlacementId ? 'true' : null"
                      (click)="emit({ type: 'placementSelected', sectionId: section.id, placementId: placement.id })"
                    >
                      <strong>{{ placement.field.label }}</strong>
                      <span>
                        {{ placement.field.type }} · {{ placement.field.id }}{{ placement.field.terminologyBindings.length ? ' · ' + l.terminologyBound : '' }}
                      </span>
                    </button>
                    <div class="emr-template-placement__actions" data-emr-print="hide">
                      <button
                        class="emr-button emr-button--ghost emr-button--small"
                        type="button"
                        [attr.aria-label]="'Move ' + placement.field.label + ' up'"
                        [attr.aria-disabled]="(locked || index === 0) ? 'true' : null"
                        (click)="moveField(section.id, placement.id, 'up', index === 0)"
                      >
                        <ng-icon name="heroChevronUp" size="16" aria-hidden="true" />
                        <span>{{ l.moveUp }}</span>
                      </button>
                      <button
                        class="emr-button emr-button--ghost emr-button--small"
                        type="button"
                        [attr.aria-label]="'Move ' + placement.field.label + ' down'"
                        [attr.aria-disabled]="(locked || index === section.fields.length - 1) ? 'true' : null"
                        (click)="moveField(section.id, placement.id, 'down', index === section.fields.length - 1)"
                      >
                        <ng-icon name="heroChevronDown" size="16" aria-hidden="true" />
                        <span>{{ l.moveDown }}</span>
                      </button>
                      <button
                        class="emr-button emr-button--ghost emr-button--small"
                        type="button"
                        [attr.aria-label]="'Remove ' + placement.field.label"
                        [attr.aria-disabled]="locked ? 'true' : null"
                        (click)="removeField(section.id, placement.id)"
                      >
                        <ng-icon name="heroTrash" size="16" aria-hidden="true" />
                        <span>{{ l.remove }}</span>
                      </button>
                    </div>
                  </article>
                } @empty {
                  <p class="emr-template-note">{{ l.noFieldsInSection }}</p>
                }
              </div>
            </section>
          } @else {
            <div class="emr-template-card">
              <p class="emr-template-note">{{ l.selectSectionPrompt }}</p>
            </div>
          }

          <emr-template-preview
            [model]="m"
            [headingId]="id('preview-heading')"
            [idPrefix]="idPrefix()"
            (intent)="emit($event)"
          />
        </main>
      </div>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);container-type:inline-size;max-width:100%}
    .emr-template-composer{display:grid;gap:16px;font-family:var(--emr-font-family);min-width:0;max-width:100%}
    .emr-template-composer__header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap}
    .emr-template-composer h1{margin:2px 0 7px;font-size:var(--emr-text-2xl)}
    .emr-template-composer__header p:not(.emr-template-eyebrow){max-width:800px;margin:0;color:var(--emr-text-muted);line-height:1.45}
    .emr-template-composer__actions{display:flex;align-items:center;gap:12px;white-space:nowrap;flex-wrap:wrap}
    .emr-template-status,.emr-template-meta{color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-template-card{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px;min-width:0}
    .emr-template-card__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap}
    .emr-template-card h2{margin:2px 0 0;font-size:var(--emr-text-lg)}
    .emr-template-eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .emr-template-grid{display:grid;grid-template-columns:minmax(120px,150px) minmax(0,1fr);gap:10px 12px;align-items:center}
    .emr-template-label{color:var(--emr-text-muted);font-size:var(--emr-text-sm);font-weight:600}
    .emr-control,.emr-select,.emr-button{min-height:var(--emr-control-height,44px)}
    .emr-button{min-width:44px;display:inline-flex;align-items:center;gap:6px}
    .emr-button[aria-disabled="true"],.emr-select[aria-disabled="true"]{cursor:not-allowed;opacity:.55}
    .emr-template-composer__layout{display:grid;grid-template-columns:minmax(270px,340px) minmax(0,1fr);gap:16px;align-items:start}
    .emr-template-composer__sidebar,.emr-template-composer__main{display:grid;gap:16px;min-width:0}
    .emr-template-add-section{display:flex;gap:8px;flex-wrap:wrap}
    .emr-template-add-section .emr-control{min-width:140px;flex:1}
    .emr-template-sections{display:grid;gap:7px;margin-top:14px}
    .emr-template-section{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px;border:1px solid var(--emr-border);border-radius:9px;background:var(--emr-surface-raised);padding:5px}
    .emr-template-section--selected{border-color:var(--emr-primary)}
    .emr-template-section__select,.emr-template-placement__select{display:grid;gap:3px;min-width:0;min-height:var(--emr-control-height,44px);padding:8px;border:0;background:transparent;color:var(--emr-text);text-align:left;cursor:pointer}
    .emr-template-section__select span,.emr-template-placement__select span{color:var(--emr-text-muted);font-size:var(--emr-text-2xs);overflow-wrap:anywhere}
    .emr-template-section__actions,.emr-template-placement__actions{display:flex;gap:2px;align-items:center;flex-wrap:wrap}
    .emr-template-placements{display:grid;gap:7px;margin-top:18px}
    .emr-template-placement{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:5px;border:1px solid var(--emr-border);border-radius:9px;background:var(--emr-surface-raised)}
    .emr-template-placement--selected{border-color:var(--emr-primary)}
    .emr-template-note{margin:0;padding:10px 12px;border-radius:8px;background:var(--emr-surface-raised);color:var(--emr-text-muted);font-size:var(--emr-text-sm)}
    .emr-template-note--error{background:var(--emr-danger-soft);color:var(--emr-danger)}
    @container (max-width: 720px){
      .emr-template-composer__layout{grid-template-columns:1fr}
      .emr-template-composer__header,.emr-template-card__heading{display:grid;gap:9px}
      .emr-template-composer__actions{justify-content:space-between}
      .emr-template-card{padding:14px}
      .emr-template-grid{grid-template-columns:1fr;gap:6px}
      .emr-template-section,.emr-template-placement{grid-template-columns:1fr}
      .emr-template-section__actions,.emr-template-placement__actions{justify-content:flex-start}
    }
    @media (max-width: 960px){
      .emr-template-composer__layout{grid-template-columns:1fr}
    }
    @media (max-width: 640px){
      .emr-template-composer__header,.emr-template-card__heading{display:grid;gap:9px}
      .emr-template-composer__actions{justify-content:space-between}
      .emr-template-card{padding:14px}
      .emr-template-grid{grid-template-columns:1fr;gap:6px}
      .emr-template-section,.emr-template-placement{grid-template-columns:1fr}
      .emr-template-section__actions,.emr-template-placement__actions{justify-content:flex-start;flex-wrap:wrap}
    }
    :host-context(.emr-print) [data-emr-print="hide"]{display:none !important}
    @media print{[data-emr-print="hide"]{display:none !important}}
  `],
})
export class EmrTemplateComposerComponent {
  readonly model = input.required<TemplateComposerViewModel>();
  readonly headingId = input<string>('emr-template-composer-heading');
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrTemplateComposerLabels>>({});

  readonly intent = output<TemplateComposerIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  readonly statusOptions = AUTHORING_TEMPLATE_STATUS_OPTIONS;
  newSectionLabel = '';

  protected readonly text = computed(() => ({ ...TEMPLATE_COMPOSER_DEFAULTS, ...this.labels() }));
  protected readonly effectiveReadOnly = computed(() => !!this.model().readOnly);
  protected readonly resolvedHeadingId = computed(() =>
    resolveAuthoringId(this.idPrefix(), this.headingId().trim() || 'emr-template-composer-heading'),
  );
  protected readonly selectedSection = computed<EhrTemplateSection | undefined>(() => {
    const m = this.model();
    return m.template.sections.find(section => section.id === m.selectedSectionId);
  });
  protected readonly fieldLibraryModel = computed(() => {
    const m = this.model();
    return {
      fields: m.fieldLibrary,
      query: m.fieldLibraryQuery,
      selectedSectionId: m.selectedSectionId,
      readOnly: this.effectiveReadOnly(),
    };
  });

  id(suffix: string): string {
    return `${this.resolvedHeadingId()}-${suffix}`;
  }

  textVal(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  guardReadOnlySelect(event: Event, locked: boolean): void {
    if (locked) event.preventDefault();
  }

  guardReadOnlySelectKey(event: KeyboardEvent, locked: boolean): void {
    if (locked && [' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }
  }

  emit(intent: TemplateComposerIntent): void {
    if (
      !this.effectiveReadOnly() ||
      intent.type === 'sectionSelected' ||
      intent.type === 'placementSelected'
    ) {
      this.intent.emit(intent);
    }
  }

  saveRequested(): void {
    if (this.effectiveReadOnly() || this.model().saving) return;
    this.emit({ type: 'saveRequested' });
  }

  patchTemplate<K extends 'title' | 'description' | 'locale' | 'status'>(key: K, value: string): void {
    if (this.effectiveReadOnly()) return;
    this.emit({
      type: 'templatePatched',
      changes: { [key]: value } as TemplateComposerIntent extends { type: 'templatePatched'; changes: infer C }
        ? C
        : never,
    });
  }

  statusChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.effectiveReadOnly()) {
      select.value = this.model().template.status;
      return;
    }
    this.patchTemplate('status', select.value);
  }

  patchSection(section: EhrTemplateSection, key: 'label' | 'description', value: string): void {
    if (this.effectiveReadOnly()) return;
    this.emit({ type: 'sectionPatched', sectionId: section.id, changes: { [key]: value } });
  }

  newSectionLabelChanged(event: Event): void {
    if (this.effectiveReadOnly()) return;
    this.newSectionLabel = this.textVal(event);
  }

  addSection(): void {
    const label = this.newSectionLabel.trim();
    if (!label || this.effectiveReadOnly()) return;
    this.emit({ type: 'sectionAdded', section: { id: '', label, fields: [] } });
    this.newSectionLabel = '';
  }

  moveSection(sectionId: string, direction: 'up' | 'down', atEdge: boolean): void {
    if (this.effectiveReadOnly() || atEdge) return;
    this.emit({ type: 'sectionMoved', sectionId, direction });
  }

  removeSection(sectionId: string): void {
    if (this.effectiveReadOnly()) return;
    this.emit({ type: 'sectionRemoved', sectionId });
  }

  moveField(sectionId: string, placementId: string, direction: 'up' | 'down', atEdge: boolean): void {
    if (this.effectiveReadOnly() || atEdge) return;
    this.emit({ type: 'fieldMoved', sectionId, placementId, direction });
  }

  removeField(sectionId: string, placementId: string): void {
    if (this.effectiveReadOnly()) return;
    this.emit({ type: 'fieldRemoved', sectionId, placementId });
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
