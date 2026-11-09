import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type {
  EmrBarChartModel,
  EmrChartIntent,
  EmrFunnelChartModel,
  EmrNodePath,
  EmrPickedFile,
  EmrRecordChangeKind,
  EmrRecordDiffIntent,
  EmrRecordDiffModel,
  EmrUploadQueueIntent,
  EmrUploadQueueModel,
} from '@drguptavivek/emr-controller';

const DEFAULT_RECORD_DIFF_LABELS = {
  before: 'Before',
  after: 'After',
  empty: 'No changes.',
};
export type EmrRecordDiffLabels = typeof DEFAULT_RECORD_DIFF_LABELS;

const FALLBACK_KIND: Record<EmrRecordChangeKind, string> = {
  added: '+ Added',
  removed: '− Removed',
  changed: '~ Changed',
};

export function pathBreadcrumb(path: EmrNodePath): string {
  return path.map((s) => (typeof s === 'number' ? String(s + 1) : s)).join(' › ');
}

const DEFAULT_UPLOAD_QUEUE_LABELS = {
  dropHint: 'Drag files here, or',
  browse: 'Choose files',
  queue: 'Queued files',
  empty: 'No files queued.',
  remove: 'Remove',
  retry: 'Retry',
  publish: 'Publish',
  progress: 'Upload progress',
  progressValue: '{percent}% uploaded',
};
export type EmrUploadQueueLabels = typeof DEFAULT_UPLOAD_QUEUE_LABELS;

const DEFAULT_CHART_LABELS = {
  showTable: 'Show as table',
  hideTable: 'Hide table',
  noData: 'No data',
  categoryColumn: 'Category',
  stepColumn: 'Step',
  valueColumn: 'Value',
  conversionColumn: 'Conversion',
  legend: 'Legend',
};
export type EmrChartLabels = typeof DEFAULT_CHART_LABELS;

let nextRecordsId = 0;

/**
 * L4 Record diff viewer: renders a controller-supplied audit/version diff grouped into sections.
 */
@Component({
  selector: 'emr-record-diff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <div class="emr-rd">
      @if (m.title) { <h2 class="emr-rd__title">{{ m.title }}</h2> }
      @if (m.summaryLabel) { <p class="emr-rd__muted">{{ m.summaryLabel }}</p> }
      @if (m.sections.length === 0) { <p class="emr-rd__muted">{{ l.empty }}</p> }
      @for (s of m.sections; track s.id) {
        <section class="emr-rd__card" [attr.aria-label]="s.label">
          <h3 class="emr-rd__section-title">{{ s.label }}</h3>
          <div class="emr-rd__list">
            @for (c of s.changes; track c.id) {
              @let badge = kindBadge(c.kind);
              <button
                type="button"
                class="emr-rd__change"
                (click)="intent.emit({ type: 'changeSelected', id: c.id })"
              >
                <span class="emr-rd__head">
                  <span class="emr-rd__head-main">
                    <strong class="emr-rd__label">{{ c.label }}</strong>
                    <span class="emr-rd__path">{{ breadcrumb(c.path) }}</span>
                  </span>
                  <span class="emr-badge" [class]="'emr-badge emr-tone-' + badge.tone">{{ badge.label }}</span>
                </span>
                @if (c.before !== undefined || c.after !== undefined) {
                  <span class="emr-rd__sides">
                    @if (c.before !== undefined) {
                      <span class="emr-rd__side">
                        <strong class="emr-rd__caption">{{ l.before }}</strong>
                        <span class="emr-rd__value" [class.emr-rd__value--struck]="c.kind === 'removed'">{{ c.before }}</span>
                      </span>
                    }
                    @if (c.after !== undefined) {
                      <span class="emr-rd__side">
                        <strong class="emr-rd__caption">{{ l.after }}</strong>
                        <span class="emr-rd__value">{{ c.after }}</span>
                      </span>
                    }
                  </span>
                }
              </button>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-rd, .emr-rd__list { display: grid; gap: 10px; min-width: 0; }
    .emr-rd__title { margin: 0; font-size: var(--emr-text-lg); font-weight: var(--emr-weight-bold); }
    .emr-rd__section-title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-rd__muted { margin: 0; font-size: var(--emr-text-sm); color: var(--emr-text-muted); }
    .emr-rd__card {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
    }
    .emr-rd__change {
      width: 100%;
      display: grid;
      gap: 8px;
      min-height: var(--emr-control-height);
      padding: 10px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
      color: var(--emr-text);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
    }
    .emr-rd__change:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-rd__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .emr-rd__head-main { display: grid; gap: 2px; flex: 1; min-width: 0; }
    .emr-rd__label { font-size: var(--emr-text-md); font-weight: var(--emr-weight-semibold); }
    .emr-rd__path { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-rd__sides { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .emr-rd__side { display: grid; gap: 2px; }
    .emr-rd__caption { font-size: var(--emr-text-xs); color: var(--emr-text-muted); font-weight: var(--emr-weight-bold); }
    .emr-rd__value { font-size: var(--emr-text-sm); overflow-wrap: anywhere; }
    .emr-rd__value--struck { text-decoration: line-through; }
  `],
})
export class EmrRecordDiffComponent {
  readonly model = input.required<EmrRecordDiffModel>();
  readonly labels = input<Partial<EmrRecordDiffLabels>>({});
  readonly intent = output<EmrRecordDiffIntent>();

  protected readonly text = computed(() => ({ ...DEFAULT_RECORD_DIFF_LABELS, ...this.labels() }));
  protected readonly breadcrumb = pathBreadcrumb;

  protected kindBadge(kind: EmrRecordChangeKind) {
    return this.model().kindBadges?.[kind] ?? { label: FALLBACK_KIND[kind], tone: 'neutral' as const };
  }
}

/**
 * L4 Upload queue (shared surface contract): dropzone, queued items with progress, retry/remove, and publish.
 */
@Component({
  selector: 'emr-upload-queue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <section class="emr-uq" [attr.aria-label]="m.label">
      <div
        class="emr-uq__dropzone"
        [class.emr-uq__dropzone--over]="dragOver()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragOver.set(false)"
        (drop)="onDrop($event)"
      >
        <span>{{ l.dropHint }}</span>
        <input
          #fileInput
          class="emr-sr-only"
          type="file"
          [id]="uid + '-input'"
          [attr.accept]="m.accept ?? null"
          [attr.multiple]="m.multiple ? '' : null"
          [attr.aria-label]="m.label"
          [attr.aria-describedby]="m.acceptDescription ? uid + '-desc' : null"
          tabindex="-1"
          (change)="onInputChange($event)"
        />
        <button type="button" class="emr-button emr-button--outline" (click)="fileInput.click()">
          {{ l.browse }}
        </button>
        @if (m.acceptDescription) {
          <span class="emr-uq__desc" [id]="uid + '-desc'">{{ m.acceptDescription }}</span>
        }
      </div>

      <ul class="emr-uq__list" [attr.aria-label]="l.queue">
        @if (m.items.length === 0) {
          <li class="emr-uq__empty">{{ l.empty }}</li>
        }
        @for (item of m.items; track item.id) {
          @let pct = clampProgress(item.progress);
          <li class="emr-uq__item">
            <div class="emr-uq__row">
              <strong class="emr-uq__name">{{ item.name }}</strong>
              <span class="emr-uq__size">{{ item.sizeLabel }}</span>
              <span class="emr-badge" [class]="'emr-badge emr-tone-' + item.status.tone" role="status">
                {{ item.status.label }}
              </span>
              @if (item.error) {
                <button
                  type="button"
                  class="emr-button emr-button--small emr-button--outline"
                  (click)="intent.emit({ type: 'retryRequested', id: item.id })"
                >
                  {{ l.retry }}
                </button>
              }
              <button
                type="button"
                class="emr-button emr-button--small emr-button--ghost"
                [attr.aria-label]="l.remove + ' ' + item.name"
                (click)="intent.emit({ type: 'removeRequested', id: item.id })"
              >
                {{ l.remove }}
              </button>
            </div>
            @if (pct !== undefined) {
              <progress
                class="emr-uq__progress"
                [value]="pct"
                max="100"
                [attr.aria-label]="l.progress + ': ' + item.name"
                [attr.aria-valuetext]="progressText(pct)"
              ></progress>
            }
            @if (item.error) {
              <div class="emr-uq__error" role="alert">{{ item.error }}</div>
            }
          </li>
        }
      </ul>

      <div>
        <button
          type="button"
          class="emr-button"
          [disabled]="!m.canPublish"
          (click)="m.canPublish && intent.emit({ type: 'publishRequested' })"
        >
          {{ l.publish }}
        </button>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-uq { display: grid; gap: 12px; font-size: var(--emr-text-sm); }
    .emr-uq__dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      border-radius: 8px;
      border: 2px dashed var(--emr-border);
      background: var(--emr-surface-soft);
    }
    .emr-uq__dropzone--over {
      border-color: var(--emr-primary);
      background: var(--emr-primary-soft);
    }
    .emr-uq__desc { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-uq__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .emr-uq__empty { color: var(--emr-text-muted); }
    .emr-uq__item {
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      padding: 10px;
      background: var(--emr-surface);
      display: grid;
      gap: 6px;
    }
    .emr-uq__row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .emr-uq__name { flex: 1 1 160px; overflow-wrap: anywhere; }
    .emr-uq__size { color: var(--emr-text-muted); }
    .emr-uq__progress { width: 100%; accent-color: var(--emr-primary); }
    .emr-uq__error { color: var(--emr-danger); }
  `],
})
export class EmrUploadQueueComponent {
  readonly model = input.required<EmrUploadQueueModel>();
  readonly labels = input<Partial<EmrUploadQueueLabels>>({});
  readonly intent = output<EmrUploadQueueIntent>();

  protected readonly uid = `emr-uq-${++nextRecordsId}`;
  protected readonly dragOver = signal(false);
  protected readonly text = computed(() => ({ ...DEFAULT_UPLOAD_QUEUE_LABELS, ...this.labels() }));

  protected clampProgress(p?: number): number | undefined {
    return p === undefined ? undefined : Math.min(100, Math.max(0, p));
  }

  protected progressText(pct: number): string {
    return this.text().progressValue.replace('{percent}', String(Math.round(pct)));
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const list = event.dataTransfer?.files ?? null;
    this.emitFiles(list);
  }

  protected onInputChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.emitFiles(inputEl.files);
    inputEl.value = '';
  }

  private emitFiles(list: FileList | null): void {
    if (!list || list.length === 0) return;
    const files: EmrPickedFile[] = Array.from(list)
      .slice(0, this.model().multiple ? undefined : 1)
      .map((file) => ({ name: file.name, size: file.size, type: file.type, file }));
    if (files.length > 0) {
      this.intent.emit({ type: 'filesPicked', files });
    }
  }
}

/**
 * L4 Bar chart: renders grouped or single-series bars with pattern/color distinction, legend, and accessible table toggle.
 */
@Component({
  selector: 'emr-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <figure class="emr-chart">
      <figcaption class="emr-chart__title">{{ m.title }}</figcaption>
      @if (m.description) {
        <p class="emr-chart__desc">{{ m.description }}</p>
      }

      <div class="emr-chart__bars" role="group" [attr.aria-label]="m.title">
        @for (c of m.categories; track c.id) {
          <div class="emr-chart__cat">
            <strong class="emr-chart__cat-label">{{ c.label }}</strong>
            @for (s of m.series; track s.id; let si = $index) {
              @let val = s.values[c.id];
              @let txt = valueText(si, c.id);
              @if (val !== undefined) {
                <button
                  type="button"
                  class="emr-chart__bar-btn"
                  [attr.aria-label]="c.label + ', ' + s.label + ': ' + txt"
                  (click)="intent.emit({ type: 'categorySelected', categoryId: c.id, seriesId: s.id })"
                >
                  @if (m.series.length > 1) {
                    <span class="emr-chart__series-label">{{ s.label }}</span>
                  }
                  <span class="emr-chart__track">
                    <span
                      class="emr-chart__fill"
                      [attr.data-series]="si % 5"
                      [style.width.%]="barPercent(val)"
                    ></span>
                  </span>
                  <span class="emr-chart__val">{{ txt }}</span>
                </button>
              } @else {
                <div class="emr-chart__bar-row">
                  @if (m.series.length > 1) {
                    <span class="emr-chart__series-label">{{ s.label }}</span>
                  }
                  <span class="emr-chart__no-data">{{ l.noData }}</span>
                </div>
              }
            }
          </div>
        }
      </div>

      <ul class="emr-chart__legend" [attr.aria-label]="l.legend">
        @for (s of m.series; track s.id; let si = $index) {
          <li class="emr-chart__legend-item">
            <span class="emr-chart__swatch" [attr.data-series]="si % 5" aria-hidden="true"></span>
            <span>{{ s.label }}</span>
          </li>
        }
      </ul>

      <button
        type="button"
        class="emr-button emr-button--small emr-button--outline"
        [attr.aria-pressed]="showTable()"
        (click)="toggleTable()"
      >
        {{ showTable() ? l.hideTable : l.showTable }}
      </button>

      @if (showTable()) {
        <div class="emr-chart__table-wrap">
          <table class="emr-chart__table">
            <caption class="emr-sr-only">{{ m.title }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ l.categoryColumn }}</th>
                @for (s of m.series; track s.id) {
                  <th scope="col">{{ s.label }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (c of m.categories; track c.id) {
                <tr>
                  <th scope="row">{{ c.label }}</th>
                  @for (s of m.series; track s.id; let si = $index) {
                    <td>{{ valueText(si, c.id) }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </figure>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-chart { margin: 0; display: grid; gap: 10px; font-size: var(--emr-text-sm); }
    .emr-chart__title { font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-chart__desc { margin: 0; color: var(--emr-text-muted); }
    .emr-chart__bars {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
    }
    .emr-chart__cat { display: grid; gap: 4px; }
    .emr-chart__cat-label { font-size: var(--emr-text-sm); font-weight: var(--emr-weight-semibold); }
    .emr-chart__bar-btn, .emr-chart__bar-row {
      width: 100%;
      min-height: var(--emr-control-height);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 6px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--emr-text);
      font-family: inherit;
      font-size: var(--emr-text-sm);
      text-align: left;
    }
    .emr-chart__bar-btn { cursor: pointer; }
    .emr-chart__bar-btn:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-chart__series-label { min-width: 84px; font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-chart__track {
      flex: 1;
      height: 18px;
      border-radius: 4px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface-soft);
      overflow: hidden;
      display: flex;
      align-items: center;
    }
    .emr-chart__fill { display: block; height: 100%; border-radius: 3px; background: var(--emr-primary); }
    .emr-chart__fill[data-series="1"], .emr-chart__swatch[data-series="1"] { background: var(--emr-warning); }
    .emr-chart__fill[data-series="2"], .emr-chart__swatch[data-series="2"] { background: var(--emr-success); }
    .emr-chart__fill[data-series="3"], .emr-chart__swatch[data-series="3"] { background: var(--emr-info); }
    .emr-chart__fill[data-series="4"], .emr-chart__swatch[data-series="4"] { background: var(--emr-danger); }
    .emr-chart__val { min-width: 52px; font-weight: var(--emr-weight-medium); }
    .emr-chart__no-data { font-style: italic; color: var(--emr-text-muted); }
    .emr-chart__legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 16px; }
    .emr-chart__legend-item { display: inline-flex; align-items: center; gap: 6px; }
    .emr-chart__swatch { width: 14px; height: 14px; border-radius: 2px; background: var(--emr-primary); }
    .emr-chart__table-wrap { overflow-x: auto; border: 1px solid var(--emr-border); border-radius: 6px; }
    .emr-chart__table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-sm); }
    .emr-chart__table th, .emr-chart__table td { padding: 6px 10px; border-bottom: 1px solid var(--emr-border); text-align: left; }
    .emr-chart__table thead th { background: var(--emr-surface-slate); font-weight: var(--emr-weight-semibold); }
  `],
})
export class EmrBarChartComponent {
  readonly model = input.required<EmrBarChartModel>();
  readonly labels = input<Partial<EmrChartLabels>>({});
  readonly intent = output<EmrChartIntent>();

  protected readonly showTable = signal(false);
  protected readonly text = computed(() => ({ ...DEFAULT_CHART_LABELS, ...this.labels() }));
  protected readonly scaleMax = computed(() => {
    const m = this.model();
    const vals = m.series.flatMap((s) => Object.values(s.values).filter((v): v is number => typeof v === 'number'));
    return Math.max(1, m.maxValue ?? 0, ...vals);
  });

  protected barPercent(v: number | null | undefined): number {
    return Math.min(100, Math.max(2, ((v ?? 0) / this.scaleMax()) * 100));
  }

  protected valueText(si: number, cid: string): string {
    const s = this.model().series[si];
    const v = s?.values[cid];
    if (typeof v !== 'number') return this.text().noData;
    return s.valueLabels?.[cid] ?? String(v);
  }

  protected toggleTable(): void {
    this.showTable.update((v) => !v);
  }
}

/**
 * L4 Funnel chart: renders sequential stage conversion bars with value/conversion labels and accessible table toggle.
 */
@Component({
  selector: 'emr-funnel-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <figure class="emr-funnel">
      <figcaption class="emr-funnel__title">{{ m.title }}</figcaption>
      @if (m.description) {
        <p class="emr-funnel__desc">{{ m.description }}</p>
      }

      <div class="emr-funnel__steps" role="group" [attr.aria-label]="m.title">
        @for (s of m.steps; track s.id) {
          <button
            type="button"
            class="emr-funnel__step-btn"
            [attr.aria-label]="stepAria(s)"
            (click)="intent.emit({ type: 'stepSelected', stepId: s.id })"
          >
            <span class="emr-funnel__label">{{ s.label }}</span>
            <span class="emr-funnel__track">
              <span class="emr-funnel__bar" [style.width.%]="stepPercent(s.value)"></span>
            </span>
            <span class="emr-funnel__meta">
              <strong>{{ s.valueLabel }}</strong>
              @if (s.conversionLabel) {
                <span class="emr-funnel__conv">{{ s.conversionLabel }}</span>
              }
            </span>
          </button>
        }
      </div>

      <button
        type="button"
        class="emr-button emr-button--small emr-button--outline"
        [attr.aria-pressed]="showTable()"
        (click)="toggleTable()"
      >
        {{ showTable() ? l.hideTable : l.showTable }}
      </button>

      @if (showTable()) {
        <div class="emr-funnel__table-wrap">
          <table class="emr-funnel__table">
            <caption class="emr-sr-only">{{ m.title }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ l.stepColumn }}</th>
                <th scope="col">{{ l.valueColumn }}</th>
                <th scope="col">{{ l.conversionColumn }}</th>
              </tr>
            </thead>
            <tbody>
              @for (s of m.steps; track s.id) {
                <tr>
                  <th scope="row">{{ s.label }}</th>
                  <td>{{ s.valueLabel }}</td>
                  <td>{{ s.conversionLabel ?? '' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </figure>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-funnel { margin: 0; display: grid; gap: 10px; font-size: var(--emr-text-sm); }
    .emr-funnel__title { font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-funnel__desc { margin: 0; color: var(--emr-text-muted); }
    .emr-funnel__steps {
      display: grid;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--emr-border);
      border-radius: 8px;
      background: var(--emr-surface);
    }
    .emr-funnel__step-btn {
      width: 100%;
      min-height: var(--emr-control-height);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--emr-text);
      font-family: inherit;
      font-size: var(--emr-text-sm);
      text-align: left;
      cursor: pointer;
    }
    .emr-funnel__step-btn:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-funnel__label { min-width: 120px; font-weight: var(--emr-weight-medium); }
    .emr-funnel__track {
      flex: 1 1 180px;
      height: 22px;
      border-radius: 4px;
      border: 1px solid var(--emr-border);
      background: var(--emr-surface-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .emr-funnel__bar { display: block; height: 100%; border-radius: 3px; background: var(--emr-primary); }
    .emr-funnel__meta { display: grid; gap: 2px; min-width: 96px; }
    .emr-funnel__conv { font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-funnel__table-wrap { overflow-x: auto; border: 1px solid var(--emr-border); border-radius: 6px; }
    .emr-funnel__table { width: 100%; border-collapse: collapse; font-size: var(--emr-text-sm); }
    .emr-funnel__table th, .emr-funnel__table td { padding: 6px 10px; border-bottom: 1px solid var(--emr-border); text-align: left; }
    .emr-funnel__table thead th { background: var(--emr-surface-slate); font-weight: var(--emr-weight-semibold); }
  `],
})
export class EmrFunnelChartComponent {
  readonly model = input.required<EmrFunnelChartModel>();
  readonly labels = input<Partial<EmrChartLabels>>({});
  readonly intent = output<EmrChartIntent>();

  protected readonly showTable = signal(false);
  protected readonly text = computed(() => ({ ...DEFAULT_CHART_LABELS, ...this.labels() }));
  protected readonly maxStepValue = computed(() => Math.max(1, ...this.model().steps.map((s) => s.value)));

  protected stepPercent(v: number): number {
    return Math.min(100, Math.max(4, (v / this.maxStepValue()) * 100));
  }

  protected stepAria(s: EmrFunnelChartModel['steps'][number]): string {
    return [s.label, s.valueLabel, s.conversionLabel].filter(Boolean).join(', ');
  }

  protected toggleTable(): void {
    this.showTable.update((v) => !v);
  }
}
