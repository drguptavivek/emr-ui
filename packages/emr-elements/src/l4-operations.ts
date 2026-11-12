import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type {
  PatientListViewModel,
  PatientListIntent,
  TimelineEvent,
  TimelineKindDefinition,
  TimelineIntent,
  NavItem,
  LeftNavIntent,
  RightFlyoutIntent,
  EmrAppShellModel,
  EmrAppShellIntent,
  DocumentUploadQueueViewModel,
  DocumentUploadIntent,
  PatientDocumentsViewModel,
  PatientDocumentsIntent,
  DocumentViewerViewModel,
  DocumentViewerIntent,
  HierarchyOrderViewModel,
  HierarchyOrderIntent,
  HierarchyNode,
  SelectedOrder,
  OrderDetailsIntent,
  FavouritesViewModel,
  FavouritesIntent,
  WorkQueueViewModel,
  WorkQueueIntent,
  EmrArrivalLinkerModel,
  EmrArrivalLinkerIntent,
  EmrSpectacleDeliveryModel,
  EmrSpectacleDeliveryIntent,
  EmrBookedNotDeliveredModel,
  EmrBookedNotDeliveredIntent,
  EmrCataractEpisode,
  EmrCataractEpisodeIntent,
  EmrPatientHistoryModel,
  EmrPatientHistoryIntent,
  EmrRecordDiffModel,
  EmrRecordDiffIntent,
  EmrUploadQueueModel,
  EmrUploadQueueIntent,
  PatientIdentityViewModel,
} from '@drguptavivek/emr-controller';
import { defineEmrElement } from './foundations.js';
import { EmrModelElement } from './controlled-rendering.js';

const identity = (patient: PatientIdentityViewModel) =>
  html`<p>
    <strong>${patient.name}</strong> · ${patient.ageLabel} · ${patient.sexLabel}
    ${patient.identifiers.map(
      (i) => html`<span>${i.label}: ${i.display} </span>`,
    )}
  </p>`;
/** Accept web, blob, or raster-only data URLs for authorized previews. */
function rasterSource(value: string): string | undefined {
  if (
    /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/]*={0,2}$/i.test(value)
  )
    return value;
  try {
    const url = new URL(value, 'https://localhost');
    return ['http:', 'https:', 'blob:'].includes(url.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}
const status = (loading?: boolean, error?: string) =>
  html`${loading ? html`<p role="status">Loading…</p>` : nothing}${error
    ? html`<p role="alert">${error}</p>`
    : nothing}`;

export class EmrPatientListElement extends EmrModelElement<
  PatientListViewModel,
  PatientListIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Patients',
      html` <form
          @submit=${(e: Event) => {
            e.preventDefault();
            this.send({ type: 'searchRequested' });
          }}
        >
          <label
            >Search
            <input
              .value=${m.query}
              @input=${(e: Event) =>
                this.send({
                  type: 'queryChanged',
                  query: (e.target as HTMLInputElement).value,
                })} /></label
          ><button>Search</button>
        </form>
        ${status(m.loading, m.error)}${m.error
          ? this.action('Retry', { type: 'retryRequested' })
          : nothing}
        <ul>
          ${m.rows.map(
            (r) =>
              html`<li>
                <button
                  type="button"
                  aria-current=${r.patientId === m.selectedPatientId
                    ? 'true'
                    : 'false'}
                  @click=${() =>
                    this.send({
                      type: 'patientSelected',
                      patientId: r.patientId,
                    })}
                >
                  ${r.displayName} · ${r.primaryIdentifier} · ${r.ageLabel} ·
                  ${r.sexLabel} · ${r.careSettingLabel} · ${r.locationLabel}
                  ${r.queueLabel ?? ''} ${r.status?.label ?? ''}</button
                >${r.alerts?.map((a) => html`<span>${a.label}</span>`)}
              </li>`,
          )}
        </ul>
        <p>Page ${m.page} · ${m.total} patients</p>
        ${this.action(
          'Previous',
          { type: 'pageChanged', page: m.page - 1 },
          () => m.page > 1,
        )}
        ${this.action(
          'Next',
          { type: 'pageChanged', page: m.page + 1 },
          () => m.page * m.pageSize < m.total,
        )}`,
    );
  }
}

export class EmrTimelineElement extends EmrModelElement<
  {
    events: readonly TimelineEvent[];
    kinds: readonly TimelineKindDefinition[];
    selectedId?: string;
  },
  TimelineIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Timeline',
      html`<ol>
        ${m.events.map(
          (e) =>
            html`<li>
              <button
                type="button"
                aria-current=${e.id === m.selectedId ? 'true' : 'false'}
                @click=${() =>
                  this.send({ type: 'eventSelected', eventId: e.id })}
              >
                ${e.dateLabel} ·
                ${m.kinds.find((k) => k.id === e.kindId)?.label ?? e.kindId} ·
                ${e.title} ${e.summary ?? ''}
              </button>
            </li>`,
        )}
      </ol>`,
    );
  }
}

export class EmrLeftNavElement extends EmrModelElement<
  {
    title?: string;
    items: readonly NavItem[];
    activeId?: string;
    expandedIds: readonly string[];
    collapsed?: boolean;
  },
  LeftNavIntent
> {
  private items(items: readonly NavItem[]): TemplateResult {
    const m = this.model!;
    return html`<ul>
      ${items.map(
        (i) =>
          html`<li>
            <button
              type="button"
              ?disabled=${!!i.disabled}
              aria-current=${i.id === m.activeId ? 'page' : nothing}
              aria-expanded=${i.children?.length
                ? String(m.expandedIds.includes(i.id))
                : nothing}
              @click=${() =>
                this.send(
                  i.children?.length
                    ? {
                        type: 'itemExpansionRequested',
                        itemId: i.id,
                        expanded: !m.expandedIds.includes(i.id),
                      }
                    : { type: 'itemSelected', itemId: i.id },
                )}
            >
              ${i.label} ${i.badge?.label ?? ''}</button
            >${i.children?.length && m.expandedIds.includes(i.id)
              ? this.items(i.children)
              : nothing}
          </li>`,
      )}
    </ul>`;
  }
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<nav aria-label=${m.title ?? 'Navigation'}>
      ${this.items(m.items)}
    </nav>`;
  }
}
export class EmrAppShellElement extends EmrModelElement<
  EmrAppShellModel,
  EmrAppShellIntent
> {
  static override styles = [
    ...EmrModelElement.styles,
    css`
      :host {
        display: block;
      }
      .shell {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
      }
      header {
        grid-column: 1/-1;
      }
      main {
        min-width: 0;
      }
      nav[hidden] {
        display: block;
      }
      @media (max-width: 700px) {
        .shell {
          display: block;
        }
        nav[hidden] {
          display: none;
        }
      }
    `,
  ];
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const s = m.topBar.search;
    return html`<div class="shell">
      <header>
        <button
          type="button"
          @click=${() => this.send({ type: 'navToggleRequested' })}
        >
          Menu
        </button>
        <strong>${m.topBar.title ?? ''}</strong> <slot name="top-bar"></slot
        ><label
          >Search
          <input
            .value=${s.query}
            @focus=${() => this.send({ type: 'searchOpenRequested' })}
            @input=${(e: Event) =>
              this.send({
                type: 'queryChanged',
                query: (e.target as HTMLInputElement).value,
              })} /></label
        >${s.open
          ? html`${status(s.loading)}${s.groups.map(
              (g) =>
                html`<div>
                  <strong>${g.label}</strong>${g.results.map(
                    (r) =>
                      html`<button
                        type="button"
                        @click=${() =>
                          this.send({
                            type: 'resultSelected',
                            groupId: g.id,
                            id: r.id,
                          })}
                      >
                        ${r.label} ${r.sub ?? ''} ${r.badge?.label ?? ''}
                      </button>`,
                  )}
                </div>`,
            )}${this.action('Close search', { type: 'searchCloseRequested' })}`
          : nothing}${m.topBar.userLabel
          ? this.action(m.topBar.userLabel, { type: 'menuRequested' })
          : nothing}
      </header>
      <nav ?hidden=${!m.navOpen}>
        <emr-left-nav
          .model=${m.nav}
          @intent=${(e: CustomEvent<EmrAppShellIntent>) => {
            e.stopPropagation();
            this.send(e.detail);
          }}
        ></emr-left-nav
        ><slot name="navigation"></slot>
      </nav>
      <main><slot></slot></main>
      <aside><slot name="aside"></slot></aside>
    </div>`;
  }
}
export class EmrRightFlyoutElement extends EmrModelElement<
  { open: boolean; title?: string; showBack?: boolean; showFooter?: boolean },
  RightFlyoutIntent
> {
  override render() {
    const m = this.model;
    if (!m?.open) return nothing;
    return html`<section
      role="dialog"
      aria-label=${m.title ?? 'Panel'}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === 'Escape') this.send({ type: 'closeRequested' });
      }}
    >
      <header>
        ${m.showBack ? this.action('Back', { type: 'backRequested' }) : nothing}
        <h2>${m.title ?? 'Panel'}</h2>
        ${this.action('Close', { type: 'closeRequested' })}
      </header>
      <slot></slot>${m.showFooter
        ? html`<footer><slot name="footer"></slot></footer>`
        : nothing}
    </section>`;
  }
}
export class EmrDocumentUploadQueueElement extends EmrModelElement<
  DocumentUploadQueueViewModel,
  DocumentUploadIntent
> {
  @property({ attribute: false }) sourceTokenFactory?: (file: File) => string;
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.label,
      html`<p>${m.acceptDescription ?? ''}</p>
        <label
          >Add files
          <input
            type="file"
            ?multiple=${!!m.multiple}
            ?disabled=${!!m.disabled || !this.sourceTokenFactory}
            @change=${(e: Event) => {
              const factory = this.sourceTokenFactory;
              if (!factory || this.model?.disabled) return;
              const input = e.target as HTMLInputElement;
              const files = Array.from(input.files ?? []).map((f) => ({
                fileName: f.name,
                size: f.size,
                mediaType: f.type,
                sourceToken: factory(f),
              }));
              if (files.length) this.send({ type: 'filesSelected', files });
              input.value = '';
            }} /></label
        >${status(false, m.error)}
        <ul>
          ${m.candidates.map(
            (c) =>
              html`<li>
                ${c.fileName} · ${c.sizeLabel} · ${c.mediaTypeLabel} ·
                ${c.statusLabel}
                ${c.progress !== undefined
                  ? html`<progress max="100" value=${c.progress}></progress>`
                  : nothing}
                ${c.error ?? ''}
                ${c.status === 'error'
                  ? this.action(
                      'Retry',
                      { type: 'candidateRetryRequested', candidateId: c.id },
                      () => !this.model?.disabled,
                    )
                  : nothing}
                ${c.status === 'processing' || c.status === 'ready'
                  ? this.action(
                      'Cancel',
                      { type: 'candidateCancelRequested', candidateId: c.id },
                      () => !this.model?.disabled,
                    )
                  : nothing}
                ${this.action(
                  'Remove',
                  { type: 'candidateRemoveRequested', candidateId: c.id },
                  () => !this.model?.disabled,
                )}
              </li>`,
          )}
        </ul>`,
    );
  }
}
export class EmrPatientDocumentsElement extends EmrModelElement<
  PatientDocumentsViewModel,
  PatientDocumentsIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.label,
      html`<label
          >Search
          <input
            .value=${m.query}
            @input=${(e: Event) =>
              this.send({
                type: 'queryChanged',
                query: (e.target as HTMLInputElement).value,
              })} /></label
        >${(['category', 'folder'] as const).map(
          (key) =>
            html`<label
              >${key}<select
                .value=${m[key] ?? 'all'}
                @change=${(e: Event) =>
                  this.send(
                    key === 'category'
                      ? {
                          type: 'categoryChanged',
                          category: (e.target as HTMLSelectElement).value,
                        }
                      : {
                          type: 'folderChanged',
                          folder: (e.target as HTMLSelectElement).value,
                        },
                  )}
              >
                <option
                  value="all"
                  ?selected=${!m[`${key}Options`]?.some(
                    (o) => o.value === m[key] && !o.disabled,
                  )}
                  .selected=${!m[`${key}Options`]?.some(
                    (o) => o.value === m[key] && !o.disabled,
                  )}
                >
                  All
                </option>
                ${m[`${key}Options`]?.map(
                  (o) =>
                    html`<option
                      value=${o.value}
                      ?selected=${o.value === m[key] && !o.disabled}
                      .selected=${o.value === m[key] && !o.disabled}
                      ?disabled=${!!o.disabled}
                    >
                      ${o.label}
                    </option>`,
                )}
              </select></label
            >`,
        )}<label
          >Sort
          <select
            .value=${`${m.sort?.field ?? 'createdAt'}:${m.sort?.direction ?? 'desc'}`}
            @change=${(e: Event) => {
              const value = (e.target as HTMLSelectElement).value;
              const choices = {
                'createdAt:desc': ['createdAt', 'desc'],
                'createdAt:asc': ['createdAt', 'asc'],
                'title:asc': ['title', 'asc'],
                'title:desc': ['title', 'desc'],
                'folder:asc': ['folder', 'asc'],
                'folder:desc': ['folder', 'desc'],
              } as const;
              const choice = choices[value as keyof typeof choices];
              if (choice)
                this.send({
                  type: 'sortChanged',
                  field: choice[0],
                  direction: choice[1],
                });
            }}
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="title:asc">Title A to Z</option>
            <option value="title:desc">Title Z to A</option>
            <option value="folder:asc">Folder A to Z</option>
            <option value="folder:desc">Folder Z to A</option>
          </select></label
        >${status(m.loading, m.error)}${m.error
          ? this.action('Retry', { type: 'retryRequested' })
          : nothing}
        <ul>
          ${m.documents.map(
            (d) =>
              html`<li>
                <button
                  type="button"
                  @click=${() =>
                    this.send({ type: 'documentSelected', documentId: d.id })}
                >
                  ${d.title} · ${d.categoryLabel} · ${d.folderLabel} ·
                  ${d.createdAtLabel} · ${d.fileName} · ${d.sizeLabel}
                  ${d.status?.label ?? ''}
                </button>
                ${d.canPreview
                  ? this.action('Preview', {
                      type: 'previewRequested',
                      documentId: d.id,
                    })
                  : nothing}
                ${d.canDownload
                  ? this.action('Download', {
                      type: 'downloadRequested',
                      documentId: d.id,
                    })
                  : nothing}
                ${d.canDelete
                  ? this.action('Delete', {
                      type: 'deleteRequested',
                      documentId: d.id,
                    })
                  : nothing}
              </li>`,
          )}
        </ul>
        <p>Page ${m.page} · ${m.total} documents</p>
        ${this.action(
          'Previous',
          { type: 'pageChanged', page: m.page - 1 },
          () => m.page > 1,
        )}
        ${this.action(
          'Next',
          { type: 'pageChanged', page: m.page + 1 },
          () => m.page * m.pageSize < m.total,
        )}`,
    );
  }
}
export class EmrDocumentViewerElement extends EmrModelElement<
  DocumentViewerViewModel,
  DocumentViewerIntent
> {
  override render() {
    const m = this.model;
    if (!m?.open) return nothing;
    const p = m.page;
    const src = p ? rasterSource(p.rasterUrl) : undefined;
    return this.panel(
      m.currentDocument?.title ?? 'Document viewer',
      html`${this.action('Close', { type: 'closeRequested' })}${status(
          m.loading,
          m.error,
        )}${m.error
          ? this.action('Retry', { type: 'retryRequested' })
          : nothing}
        <p>
          ${m.currentDocument?.fileName ?? ''} · ${m.documentIndex + 1} /
          ${m.documentCount}
        </p>
        ${p && src
          ? html`<img
              alt=${p.altText}
              src=${src}
              @error=${() =>
                this.send({ type: 'rasterLoadFailed', assetId: p.assetId })}
            />`
          : p
            ? html`<p role="alert">Preview unavailable.</p>
                ${this.action('Retry', { type: 'retryRequested' })}`
            : nothing}
        <p>Page ${m.pageIndex + 1} / ${m.currentDocument?.pageCount ?? 0}</p>
        ${this.action(
          'Previous document',
          { type: 'previousDocumentRequested' },
          () => !!this.model?.canPreviousDocument,
        )}
        ${this.action(
          'Next document',
          { type: 'nextDocumentRequested' },
          () => !!this.model?.canNextDocument,
        )}
        ${this.action(
          'Previous page',
          { type: 'previousPageRequested' },
          () => !!this.model?.canPreviousPage,
        )}
        ${this.action(
          'Next page',
          { type: 'nextPageRequested' },
          () => !!this.model?.canNextPage,
        )}`,
    );
  }
}
export class EmrHierarchyOrderPickerElement extends EmrModelElement<
  HierarchyOrderViewModel,
  HierarchyOrderIntent
> {
  private nodes(nodes: readonly HierarchyNode[]): TemplateResult {
    return html`<ul>
      ${nodes.map(
        (n) =>
          html`<li>
            ${n.kind === 'group'
              ? this.action(
                  `${n.expanded ? '−' : '+'} ${n.label}`,
                  {
                    type: 'nodeExpansionRequested',
                    nodeId: n.id,
                    expanded: !n.expanded,
                  },
                  () => !n.disabled,
                )
              : html`<span>${n.label} ${n.code ?? ''}</span>`}
            ${n.loading ? 'Loading…' : ''}
            ${n.kind === 'group' && n.selectable
              ? this.action(
                  'Preview group',
                  { type: 'groupPreviewRequested', nodeId: n.id },
                  () => !n.disabled,
                )
              : nothing}
            ${n.kind === 'item' && n.selectable
              ? this.action(
                  'Add',
                  { type: 'itemAddRequested', nodeId: n.id },
                  () => !n.disabled,
                )
              : nothing}${n.expanded && n.children
              ? this.nodes(n.children)
              : nothing}
          </li>`,
      )}
    </ul>`;
  }
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title,
      html`<form
          @submit=${(e: Event) => {
            e.preventDefault();
            this.send({ type: 'searchRequested' });
          }}
        >
          <label
            >Search
            <input
              .value=${m.query}
              @input=${(e: Event) =>
                this.send({
                  type: 'queryChanged',
                  query: (e.target as HTMLInputElement).value,
                })} /></label
          ><button>Search</button>
        </form>
        ${status(m.loading, m.error)}${m.error
          ? this.action('Retry', { type: 'retryRequested' })
          : nothing}${this.nodes(m.roots)}${m.preview
          ? html`<section>
              <h4>${m.preview.groupLabel}</h4>
              <ul>
                ${m.preview.items.map(
                  (i) =>
                    html`<li>
                      ${i.label}
                      ${m.preview?.duplicateIds.includes(i.catalogueId)
                        ? '(duplicate)'
                        : ''}
                    </li>`,
                )}
              </ul>
              ${this.action('Add group', {
                type: 'groupAddConfirmed',
                groupId: m.preview.groupId,
              })}
              ${this.action('Dismiss', { type: 'groupPreviewDismissed' })}
            </section>`
          : nothing}
        <h4>Selected orders</h4>
        ${m.selected.map(
          (o) =>
            html`<div>
              ${o.label}
              ${this.action('Remove', {
                type: 'orderRemoveRequested',
                orderId: o.id,
              })}${Object.entries(o.details ?? {}).map(
                ([field, value]) =>
                  html`<label
                    >${field}${typeof value === 'boolean'
                      ? html`<input
                          type="checkbox"
                          .checked=${value}
                          @change=${(e: Event) =>
                            this.send({
                              type: 'orderDetailChanged',
                              orderId: o.id,
                              field,
                              value: (e.target as HTMLInputElement).checked,
                            })}
                        />`
                      : html`<input
                          .value=${String(value ?? '')}
                          @change=${(e: Event) =>
                            this.send({
                              type: 'orderDetailChanged',
                              orderId: o.id,
                              field,
                              value: (e.target as HTMLInputElement).value,
                            })}
                        />`}</label
                  >`,
              )}
            </div>`,
        )}`,
    );
  }
}
export class EmrOrderDetailsElement extends EmrModelElement<
  SelectedOrder,
  OrderDetailsIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.label,
      html`<p>${m.kind} ${m.code ?? ''}</p>
        ${Object.entries(m.details ?? {}).map(
          ([field, value]) =>
            html`<label
                >${field}${typeof value === 'boolean'
                  ? html`<input
                      type="checkbox"
                      .checked=${value}
                      @change=${(e: Event) =>
                        this.send({
                          type: 'detailChangeRequested',
                          orderId: m.id,
                          field,
                          value: (e.target as HTMLInputElement).checked,
                        })}
                    />`
                  : html`<input
                      .value=${String(value ?? '')}
                      @change=${(e: Event) =>
                        this.send({
                          type: 'detailChangeRequested',
                          orderId: m.id,
                          field,
                          value: (e.target as HTMLInputElement).value,
                        })}
                    />`}</label
              >${m.errors?.[field]
                ? html`<span role="alert">${m.errors[field]}</span>`
                : nothing}`,
        )}${this.action('Remove', { type: 'removeRequested', orderId: m.id })}`,
    );
  }
}
export class EmrFavouritesPanelElement extends EmrModelElement<
  FavouritesViewModel,
  FavouritesIntent
> {
  override render() {
    const m = this.model;
    if (!m?.open) return nothing;
    return this.panel(
      'Favourites',
      html`${this.action('Close', { type: 'closed' })}${status(
        m.loading,
        m.error,
      )}${m.error
        ? this.action('Retry', { type: 'retryRequested' })
        : nothing}${(
        ['medication', 'laboratory', 'radiology', 'combination'] as const
      ).map((kind) =>
        this.action(kind, { type: 'tabChanged', kind }),
      )}${m.mode === 'list'
        ? html`<label
              >Search
              <input
                .value=${m.query}
                @input=${(e: Event) =>
                  this.send({
                    type: 'queryChanged',
                    query: (e.target as HTMLInputElement).value,
                  })} /></label
            >${this.action('Create', {
              type: 'createRequested',
              kind: m.activeKind,
            })}
            <ul>
              ${m.items.map(
                (i, index) =>
                  html`<li>
                    ${i.name} · ${i.summary ?? ''}
                    ${this.action('Apply', {
                      type: 'applyRequested',
                      id: i.id,
                    })}
                    ${this.action('Edit', { type: 'editRequested', id: i.id })}
                    ${this.action('Delete', {
                      type: 'deleteRequested',
                      id: i.id,
                    })}
                    ${this.action(
                      'Move up',
                      { type: 'moveRequested', id: i.id, direction: 'up' },
                      () => index > 0,
                    )}
                    ${this.action(
                      'Move down',
                      { type: 'moveRequested', id: i.id, direction: 'down' },
                      () => index < m.items.length - 1,
                    )}
                  </li>`,
              )}
            </ul>`
        : html`${this.action('Back', { type: 'backRequested' })}${m.mode ===
            'editor' && m.editor
            ? html`<label
                  >Name
                  <input
                    .value=${m.editor.name}
                    @input=${(e: Event) =>
                      this.send({
                        type: 'editorNameChanged',
                        name: (e.target as HTMLInputElement).value,
                      })}
                /></label>
                <ul>
                  ${m.editor.orderTemplates.map(
                    (o) =>
                      html`<li>
                        ${o.label}
                        ${this.action('Remove', {
                          type: 'editorOrdersChanged',
                          orders: m.editor!.orderTemplates.filter(
                            (x) => x.id !== o.id,
                          ),
                        })}
                      </li>`,
                  )}
                </ul>
                ${this.action('Save', { type: 'saveRequested' })}`
            : html`<ul>
                ${m.applyIssues?.map(
                  (i) =>
                    html`<li>${i.label} · ${i.reason} ${i.detail ?? ''}</li>`,
                )}
              </ul>`}`}`,
    );
  }
}
export class EmrWorkQueueElement extends EmrModelElement<
  WorkQueueViewModel,
  WorkQueueIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title,
      html`${status(m.loading, m.error)}${m.error
          ? this.action('Retry', { type: 'retryRequested' })
          : nothing}${this.action('Refresh', { type: 'refreshRequested' })}
        <p>${m.updatedLabel ?? ''}</p>
        ${!m.stations.length
          ? html`<p>${m.emptyMessage}</p>`
          : nothing}${m.stations.map(
          (s) =>
            html`<section>
              <h4>${s.label} · ${s.countLabel}</h4>
              ${this.action(
                'Call next',
                { type: 'callNextRequested', stationId: s.id },
                () => !!this.model && !this.model.readOnly && s.canCallNext,
              )}${!s.cards.length ? html`<p>${m.emptyMessage}</p>` : nothing}
              <ul>
                ${s.cards.map(
                  (c) =>
                    html`<li>
                      <button
                        type="button"
                        aria-current=${c.id === m.selectedCardId
                          ? 'true'
                          : 'false'}
                        @click=${() =>
                          this.send({ type: 'cardSelected', cardId: c.id })}
                      >
                        ${c.tokenLabel} · ${c.displayName} ·
                        ${c.primaryIdentifier} · ${c.ageSexLabel ?? ''} ·
                        ${c.waitLabel} ${c.priority?.label ?? ''}
                        ${c.flags?.map((f) => f.label).join(', ') ?? ''}
                        ${c.nextStepLabel ?? ''}
                      </button>
                      ${this.action('Open patient', {
                        type: 'patientOpenRequested',
                        patientId: c.patientId,
                      })}<label
                        >Move to
                        <select
                          ?disabled=${!!m.readOnly || !!c.readOnly}
                          @change=${(e: Event) => {
                            const stationId = (e.target as HTMLSelectElement)
                              .value;
                            if (
                              stationId &&
                              !this.model?.readOnly &&
                              !c.readOnly
                            )
                              this.send({
                                type: 'moveRequested',
                                cardId: c.id,
                                stationId,
                              });
                          }}
                        >
                          <option value="">Select</option>
                          ${m.moveTargets.map(
                            (o) =>
                              html`<option
                                value=${o.value}
                                ?disabled=${!!o.disabled}
                              >
                                ${o.label}
                              </option>`,
                          )}
                        </select></label
                      >
                    </li>`,
                )}
              </ul>
            </section>`,
        )}`,
    );
  }
}
export class EmrArrivalLinkerElement extends EmrModelElement<
  EmrArrivalLinkerModel,
  EmrArrivalLinkerIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Arrival',
      html`${identity(m.patient)}<label
          >Purpose
          <select
            .value=${m.selectedPurpose ?? ''}
            @change=${(e: Event) =>
              this.send({
                type: 'purposeSelected',
                id: (e.target as HTMLSelectElement).value,
              })}
          >
            <option value="">Select</option>
            ${m.purposeOptions.map(
              (o) => html`<option value=${o.id}>${o.label}</option>`,
            )}
          </select></label
        >
        <ul>
          ${m.openReferrals.map(
            (r) =>
              html`<li>
                <label
                  ><input
                    type="checkbox"
                    .checked=${m.selectedReferralIds.includes(r.id)}
                    @change=${() =>
                      this.send({ type: 'referralToggled', id: r.id })}
                  />${r.date} · ${r.centreName} · ${r.purpose} ·
                  ${r.daysSinceAdviceLabel} ${r.flags.join(', ')}
                  ${r.overdueBadge?.label ?? ''} ${r.visitCountLabel ?? ''}
                  ${r.nextDueLabel ?? ''}</label
                >
              </li>`,
          )}
        </ul>
        <label
          ><input
            type="checkbox"
            .checked=${m.noReferral}
            @change=${() => this.send({ type: 'noReferralToggled' })}
          />No referral</label
        >${m.uhid
          ? html`<label
                >UHID
                <input
                  .value=${m.uhid.value ?? ''}
                  @input=${(e: Event) =>
                    this.send({
                      type: 'uhidChanged',
                      raw: (e.target as HTMLInputElement).value,
                    })}
              /></label>
              <p>
                ${m.uhid.existing?.display ?? ''}
                ${m.uhid.normalisedValue ?? ''} ${m.uhid.warning ?? ''}
                ${m.uhid.error ?? ''}
              </p>
              ${this.action('Scan', { type: 'scanRequested' })}
              ${this.action('Use UHID', {
                type: 'uhidProvided',
                raw: m.uhid.value ?? '',
              })}
              ${this.action('Skip UHID', { type: 'uhidSkipped' })}`
          : nothing}${this.action(
          'Submit',
          { type: 'submitRequested' },
          () => !!this.model?.canSubmit,
        )}
        ${this.action('Cancel', { type: 'cancelled' })}`,
    );
  }
}
export class EmrSpectacleDeliveryElement extends EmrModelElement<
  EmrSpectacleDeliveryModel,
  EmrSpectacleDeliveryIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Spectacle delivery',
      html`${identity(m.patient)}
        <ul>
          ${m.bookings.map(
            (b) =>
              html`<li>
                <label
                  ><input
                    type="checkbox"
                    .checked=${m.selectedBookingIds.includes(b.id)}
                    @change=${() =>
                      this.send({ type: 'bookingToggled', id: b.id })}
                  />${b.bookedDate} · ${b.type} · ${b.rxSummary} ·
                  ${b.daysOpenLabel} · ${b.paidBadge.label} ·
                  ${b.statusBadge.label}</label
                >
              </li>`,
          )}
        </ul>
        <label
          >Delivery date
          <input
            type="date"
            .value=${m.deliveryDate}
            @change=${(e: Event) =>
              this.send({
                type: 'deliveryDateChanged',
                iso: (e.target as HTMLInputElement).value || null,
              })} /></label
        >${this.action(
          'Submit',
          { type: 'submitRequested' },
          () => !!this.model?.canSubmit,
        )}
        ${this.action('Cancel', { type: 'cancelled' })}`,
    );
  }
}
export class EmrBookedNotDeliveredListElement extends EmrModelElement<
  EmrBookedNotDeliveredModel,
  EmrBookedNotDeliveredIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const update = (
      key: 'centreId' | 'bookedFrom' | 'bookedTo',
      value: string,
    ) =>
      this.send({
        type: 'filterChanged',
        centreId: m.filters.selectedCentreId,
        bookedFrom: m.filters.bookedFrom,
        bookedTo: m.filters.bookedTo,
        [key]: value || undefined,
      });
    return this.panel(
      'Booked not delivered',
      html`<label
          >Centre
          <select
            .value=${m.filters.selectedCentreId ?? ''}
            @change=${(e: Event) =>
              update('centreId', (e.target as HTMLSelectElement).value)}
          >
            <option value="">All</option>
            ${m.filters.centreOptions.map(
              (o) => html`<option value=${o.id}>${o.label}</option>`,
            )}
          </select></label
        >${(['bookedFrom', 'bookedTo'] as const).map(
          (k) =>
            html`<label
              >${k === 'bookedFrom' ? 'From' : 'To'}
              <input
                type="date"
                .value=${m.filters[k] ?? ''}
                @change=${(e: Event) =>
                  update(k, (e.target as HTMLInputElement).value)}
            /></label>`,
        )}
        <p role=${m.state === 'error' ? 'alert' : 'status'}>
          ${m.message ?? (m.state === 'loading' ? 'Loading…' : '')}
        </p>
        ${m.state === 'error'
          ? this.action('Retry', { type: 'retryRequested' })
          : nothing}
        <ul>
          ${m.rows.map(
            (r) =>
              html`<li>
                <button
                  type="button"
                  @click=${() =>
                    this.send({ type: 'rowSelected', bookingId: r.bookingId })}
                >
                  ${r.patientName} · ${r.primaryIdentifier} · ${r.centreName} ·
                  ${r.bookedDate} · ${r.daysOpenLabel} · ${r.type} ·
                  ${r.paidBadge.label} ${r.overdueBadge?.label ?? ''}</button
                >${r.phone
                  ? this.action(`Call ${r.phone}`, {
                      type: 'callRequested',
                      phone: r.phone,
                    })
                  : nothing}
              </li>`,
          )}
        </ul>
        <p>${m.pagingSummaryLabel}</p>
        ${this.action(
          'Previous',
          { type: 'pageChanged', page: m.page - 1 },
          () => m.page > 1,
        )}
        ${this.action(
          'Next',
          { type: 'pageChanged', page: m.page + 1 },
          () => m.page < m.pageCount,
        )}`,
    );
  }
}
export class EmrCataractEpisodeCardElement extends EmrModelElement<
  EmrCataractEpisode,
  EmrCataractEpisodeIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Cataract episode',
      html`<p>
          ${m.eye ?? ''} · ${m.statusBadge.label} · Admission
          ${m.admissionDate ?? '—'} · Surgery ${m.sxDate ?? '—'}
        </p>
        <ol>
          ${m.stages.stages.map(
            (s) =>
              html`<li>
                ${s.label} ${s.status?.label ?? ''} ${s.description ?? ''}
                ${s.id === m.stages.activeId ? '(current)' : ''}
              </li>`,
          )}
        </ol>
        <ul>
          ${m.followups.map(
            (f) =>
              html`<li>${f.label} · ${f.due} · ${f.statusBadge.label}</li>`,
          )}
        </ul>
        ${this.action('Open', { type: 'openRequested', id: m.id })}
        ${m.canCompleteSurgery
          ? this.action(
              'Complete surgery',
              { type: 'completeSurgeryRequested', id: m.id },
              () => !!this.model?.canCompleteSurgery,
            )
          : nothing}
        ${m.canAddFollowup
          ? this.action(
              'Add follow-up',
              { type: 'addFollowupRequested', id: m.id },
              () => !!this.model?.canAddFollowup,
            )
          : nothing}`,
    );
  }
}
export class EmrPatientHistoryTimelineElement extends EmrModelElement<
  EmrPatientHistoryModel,
  EmrPatientHistoryIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const s = m.summary;
    return this.panel(
      'Patient history',
      html`${identity(m.patient)}${status(m.loading)}${s.lastSpectacleRx
          ? html`<p>
              Last spectacle prescription: ${s.lastSpectacleRx.date} ·
              ${s.lastSpectacleRx.type ?? ''} ·
              ${s.lastSpectacleRx.statusBadge.label} · RE
              ${Object.values(s.lastSpectacleRx.re).join(' / ')} · LE
              ${Object.values(s.lastSpectacleRx.le).join(' / ')}
            </p>`
          : nothing}${s.lastGlaucomaScreen
          ? html`<p>
              Glaucoma: ${s.lastGlaucomaScreen.date} · IOP
              ${s.lastGlaucomaScreen.iopRe ?? '—'} /
              ${s.lastGlaucomaScreen.iopLe ?? '—'} · CDR
              ${s.lastGlaucomaScreen.cdrRe ?? '—'} /
              ${s.lastGlaucomaScreen.cdrLe ?? '—'} ·
              ${s.lastGlaucomaScreen.decision ?? ''}
            </p>`
          : nothing}${s.lastDrScreen
          ? html`<p>
              DR: ${s.lastDrScreen.date} · ${s.lastDrScreen.gradeRe ?? '—'} /
              ${s.lastDrScreen.gradeLe ?? '—'} ·
              ${s.lastDrScreen.maculopathyRe ?? '—'} /
              ${s.lastDrScreen.maculopathyLe ?? '—'} ·
              ${s.lastDrScreen.decision ?? ''}
            </p>`
          : nothing}
        <h4>Referrals</h4>
        ${s.openReferrals.map((r) =>
          this.action(
            `${r.date} · ${r.centreName} · ${r.purpose} · ${r.statusBadge.label} ${r.flags.join(', ')} ${r.visitCountLabel ?? ''} ${r.nextDueLabel ?? ''}`,
            { type: 'referralSelected', id: r.id },
          ),
        )}
        <h4>Bookings</h4>
        ${s.openBookings.map((b) =>
          this.action(
            `${b.date} · ${b.type} · ${b.paidBadge.label} · ${b.daysOpenLabel} ${b.overdueBadge?.label ?? ''}`,
            { type: 'bookingSelected', id: b.id },
          ),
        )}
        <h4>Episodes</h4>
        ${s.openEpisodes.map((e) =>
          this.action(`${e.eye ?? ''} ${e.statusBadge.label}`, {
            type: 'episodeSelected',
            id: e.id,
          }),
        )}
        <h4>Visits</h4>
        <ol>
          ${m.visits.map(
            (v) =>
              html`<li>
                ${this.action(
                  `${v.date} · ${v.centreName} · ${v.teamName} · ${v.pvaRe ?? ''} / ${v.pvaLe ?? ''} · ${v.diagnosis ?? ''} · ${v.advice ?? ''}`,
                  { type: 'visitSelected', id: v.id },
                )}
              </li>`,
          )}
        </ol>`,
    );
  }
}
export class EmrRecordDiffElement extends EmrModelElement<
  EmrRecordDiffModel,
  EmrRecordDiffIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title ?? 'Record changes',
      html`<p>${m.summaryLabel ?? ''}</p>
        ${m.sections.map(
          (s) =>
            html`<section>
              <h4>${s.label}</h4>
              <ul>
                ${s.changes.map(
                  (c) =>
                    html`<li>
                      <button
                        type="button"
                        @click=${() =>
                          this.send({ type: 'changeSelected', id: c.id })}
                      >
                        ${c.label} · ${m.kindBadges?.[c.kind]?.label ?? c.kind}
                        · Before: ${c.before ?? '—'} · After: ${c.after ?? '—'}
                      </button>
                    </li>`,
                )}
              </ul>
            </section>`,
        )}`,
    );
  }
}
export class EmrUploadQueueElement extends EmrModelElement<
  EmrUploadQueueModel,
  EmrUploadQueueIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.label,
      html`<p>${m.acceptDescription ?? ''}</p>
        <label
          >Add files
          <input
            type="file"
            accept=${m.accept ?? ''}
            ?multiple=${!!m.multiple}
            @change=${(e: Event) => {
              const input = e.target as HTMLInputElement;
              const files = Array.from(input.files ?? []).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
                file,
              }));
              if (files.length) this.send({ type: 'filesPicked', files });
              input.value = '';
            }}
        /></label>
        <ul>
          ${m.items.map(
            (i) =>
              html`<li>
                ${i.name} · ${i.sizeLabel} · ${i.status.label}
                ${i.progress !== undefined
                  ? html`<progress max="100" value=${i.progress}></progress>`
                  : nothing}
                ${i.error ?? ''}
                ${i.error
                  ? this.action('Retry', { type: 'retryRequested', id: i.id })
                  : nothing}
                ${this.action('Remove', { type: 'removeRequested', id: i.id })}
              </li>`,
          )}
        </ul>
        ${this.action(
          'Publish',
          { type: 'publishRequested' },
          () => !!this.model?.canPublish,
        )}`,
    );
  }
}

export function registerL4OperationsElements(): void {
  defineEmrElement('emr-patient-list', EmrPatientListElement);
  defineEmrElement('emr-timeline', EmrTimelineElement);
  defineEmrElement('emr-left-nav', EmrLeftNavElement);
  defineEmrElement('emr-app-shell', EmrAppShellElement);
  defineEmrElement('emr-right-flyout', EmrRightFlyoutElement);
  defineEmrElement('emr-document-upload-queue', EmrDocumentUploadQueueElement);
  defineEmrElement('emr-patient-documents', EmrPatientDocumentsElement);
  defineEmrElement('emr-document-viewer', EmrDocumentViewerElement);
  defineEmrElement(
    'emr-hierarchy-order-picker',
    EmrHierarchyOrderPickerElement,
  );
  defineEmrElement('emr-order-details', EmrOrderDetailsElement);
  defineEmrElement('emr-favourites-panel', EmrFavouritesPanelElement);
  defineEmrElement('emr-work-queue', EmrWorkQueueElement);
  defineEmrElement('emr-arrival-linker', EmrArrivalLinkerElement);
  defineEmrElement('emr-spectacle-delivery', EmrSpectacleDeliveryElement);
  defineEmrElement(
    'emr-booked-not-delivered-list',
    EmrBookedNotDeliveredListElement,
  );
  defineEmrElement('emr-cataract-episode-card', EmrCataractEpisodeCardElement);
  defineEmrElement(
    'emr-patient-history-timeline',
    EmrPatientHistoryTimelineElement,
  );
  defineEmrElement('emr-record-diff', EmrRecordDiffElement);
  defineEmrElement('emr-upload-queue', EmrUploadQueueElement);
}
