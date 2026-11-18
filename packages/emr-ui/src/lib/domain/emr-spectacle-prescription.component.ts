import { NgIf, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type {
  KaleidoscopeIopReading,
  KaleidoscopeSlitLampRow,
  SpectaclePrescriptionField,
  SpectaclePrescriptionFieldType,
  SpectaclePrescriptionIntent,
  SpectaclePrescriptionViewModel,
  VaChartType,
} from '@drguptavivek/emr-controller';

export const VA_CHART_OPTIONS: readonly { id: VaChartType; label: string; quickLines: readonly string[] }[] = [
  { id: 'snellen-6m', label: 'Snellen 6m (6/6)', quickLines: ['6/5', '6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM'] },
  { id: 'snellen-20ft', label: 'Snellen 20ft (20/20)', quickLines: ['20/15', '20/20', '20/30', '20/40', '20/60', '20/80', '20/120', '20/200', 'CF', 'HM'] },
  { id: 'logmar', label: 'LogMAR (0.00)', quickLines: ['-0.10', '0.00', '+0.18', '+0.30', '+0.48', '+0.60', '+0.78', '+1.00', '+1.90', '+2.30'] },
  { id: 'etdrs', label: 'ETDRS (85 Letters)', quickLines: ['90L', '85L', '76L', '70L', '61L', '55L', '46L', '35L', 'CF', 'HM'] },
  { id: 'decimal', label: 'Decimal (1.0)', quickLines: ['1.2', '1.0', '0.67', '0.50', '0.33', '0.25', '0.17', '0.10', 'CF', 'HM'] },
];

export function resolveLogMarBadgeText(_rawVa: string, explicitLogMar?: string): string | null {
  return explicitLogMar ? `LogMAR ${explicitLogMar}` : null;
}

@Component({
  selector: 'emr-spectacle-prescription',
  standalone: true,
  imports: [NgIf, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="emr-spectacle" [attr.aria-labelledby]="domId('heading')">
      <header class="emr-spectacle__header">
        <div class="emr-spectacle__header-main">
          <p class="emr-spectacle__eyebrow">Ophthalmology</p>
          <h2 [id]="domId('heading')">{{ model.label }}</h2>
          @if (model.description) { <p>{{ model.description }}</p> }
          <div class="emr-spectacle__va-switcher" role="group" aria-label="VA Chart Type">
            <span class="emr-spectacle__va-label">VA Chart Type:</span>
            @for (opt of vaChartOptions; track opt.id) {
              <button
                type="button"
                class="emr-spectacle__chip"
                [class.emr-spectacle__chip--active]="activeChartType() === opt.id"
                [attr.aria-pressed]="activeChartType() === opt.id"
                (click)="changeVaChartType(opt.id)"
              >{{ opt.label }}</button>
            }
          </div>
        </div>
        @if (model.readOnly) {
          <span class="emr-spectacle__status">Read only</span>
        } @else {
          <div class="emr-spectacle__header-actions">
            <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="copyEye('od', 'os')">Copy OD → OS</button>
            <button type="button" class="emr-button emr-button--small emr-button--outline" (click)="copyEye('os', 'od')">Copy OS → OD</button>
            @if (model.slitLampRows?.length) {
              <button type="button" class="emr-button emr-button--small emr-button--ghost" (click)="macroNormal('ou')">✓ OU Normal (WNL)</button>
            }
          </div>
        }
      </header>

      @if (model.iopReadings) {
        <div class="emr-spectacle__iop-bar" role="group" aria-label="IOP Tonometry and Pachymetry">
          @for (eye of model.eyes; track eye.id) {
            @if (iopForEye(eye.id); as iop) {
              <div class="emr-spectacle__iop-card">
                <div class="emr-spectacle__iop-info">
                  <div class="emr-spectacle__iop-head">
                    <span class="emr-spectacle__iop-title">{{ eyeAccessibleLabel(eye) }} · IOP Tonometry</span>
                    <span class="emr-badge emr-tone-info">{{ iop.methodLabel }}</span>
                  </div>
                  <div class="emr-spectacle__iop-reading">
                    <strong class="emr-spectacle__iop-val">{{ iop.valueLabel }}</strong>
                    @if (iop.deltaLabel) { <span class="emr-spectacle__iop-delta">{{ iop.deltaLabel }}</span> }
                  </div>
                  @if (iop.pachymetryLabel || iop.timeLabel) {
                    <div class="emr-spectacle__iop-meta">
                      {{ iop.pachymetryLabel ?? '' }}@if (iop.timeLabel) { {{ iop.pachymetryLabel ? '· ' : '' }}{{ iop.timeLabel }} }
                    </div>
                  }
                </div>
                @if (iop.flag) {
                  <span class="emr-badge" [class]="'emr-badge emr-tone-' + iop.flag.tone">{{ iop.flag.label }}</span>
                }
              </div>
            }
          }
        </div>
      }

      @if (model.errors && errorCount()) {
        <div class="emr-spectacle__errors" role="alert">
          <strong>Review prescription entries</strong>
          <ul>
            @for (entry of errorEntries(); track entry[0]) { <li>{{ entry[1] }}</li> }
          </ul>
        </div>
      }

      <div class="emr-spectacle__table-wrap">
        <table class="emr-spectacle__table">
          <caption class="emr-spectacle__caption">Spectacle prescription by eye</caption>
          <thead>
            <tr>
              <th scope="col">Eye</th>
              @for (field of model.fields; track field.id) {
                <th scope="col">{{ field.label }}@if (field.unit) { <span class="emr-spectacle__unit">({{ field.unit }})</span> }</th>
              }
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            @for (eye of model.eyes; track eye.id) {
              <tr>
                <th scope="row">{{ eyeAccessibleLabel(eye) }}</th>
                @for (field of model.fields; track field.id) {
                  <td>
                    @if (isReadOnly(field)) {
                      <div class="emr-spectacle__readonly-wrap">
                        <span class="emr-spectacle__value">{{ value(eye.id, field.id) || '—' }}</span>
                        @if (isVaField(field) && logMarBadge(eye.id); as badgeText) {
                          <span class="emr-spectacle__logmar" [attr.aria-label]="'LogMAR equivalent for ' + eyeAccessibleLabel(eye) + ': ' + badgeText">{{ badgeText }}</span>
                        }
                      </div>
                    } @else {
                      <ng-container *ngTemplateOutlet="cell; context: { eye, field }" />
                    }
                  </td>
                }
                <td>
                  @if (isReadOnly()) {
                    <span class="emr-spectacle__value">{{ note(eye.id) || '—' }}</span>
                  } @else {
                    <input class="emr-control" [id]="notesId(eye.id)" [value]="note(eye.id)" [attr.aria-label]="'Notes for ' + eyeAccessibleLabel(eye)" [attr.aria-describedby]="messageIds(eye.id, 'notes')" [attr.aria-invalid]="hasError(eye.id, 'notes')" (focus)="focus(eye.id, 'notes')" (input)="notesChanged(eye.id, $event)" />
                    @if (warning(eye.id, 'notes')) { <span class="emr-spectacle__warning" [id]="warningId(eye.id, 'notes')">{{ warning(eye.id, 'notes') }}</span> }
                    @if (hasError(eye.id, 'notes')) { <span class="emr-spectacle__error" [id]="errorId(eye.id, 'notes')">{{ error(eye.id, 'notes') }}</span> }
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="emr-spectacle__mobile">
        @for (eye of model.eyes; track eye.id) {
          <fieldset>
            <legend>{{ eyeAccessibleLabel(eye) }}</legend>
            @for (field of model.fields; track field.id) {
              <div class="emr-spectacle__mobile-field">
                <label [for]="cellId(eye.id, field.id, true)">{{ field.label }}@if (field.unit) { <span class="emr-spectacle__unit">({{ field.unit }})</span> }</label>
                @if (isReadOnly(field)) {
                  <div class="emr-spectacle__readonly-wrap">
                    <span class="emr-spectacle__value">{{ value(eye.id, field.id) || '—' }}</span>
                    @if (isVaField(field) && logMarBadge(eye.id); as badgeText) {
                      <span class="emr-spectacle__logmar" [attr.aria-label]="'LogMAR equivalent for ' + eyeAccessibleLabel(eye) + ': ' + badgeText">{{ badgeText }}</span>
                    }
                  </div>
                } @else {
                  <ng-container *ngTemplateOutlet="cell; context: { eye, field, mobile: true }" />
                }
              </div>
            }
            <div class="emr-spectacle__mobile-field">
              <label [for]="notesId(eye.id, true)">Notes</label>
              @if (isReadOnly()) {
                <span class="emr-spectacle__value">{{ note(eye.id) || '—' }}</span>
              } @else {
                <input class="emr-control" [id]="notesId(eye.id, true)" [value]="note(eye.id)" [attr.aria-label]="'Notes for ' + eyeAccessibleLabel(eye)" [attr.aria-describedby]="messageIds(eye.id, 'notes', true)" [attr.aria-invalid]="hasError(eye.id, 'notes')" (focus)="focus(eye.id, 'notes')" (input)="notesChanged(eye.id, $event)" />
                @if (warning(eye.id, 'notes')) { <span class="emr-spectacle__warning" [id]="warningId(eye.id, 'notes', true)">{{ warning(eye.id, 'notes') }}</span> }
                @if (hasError(eye.id, 'notes')) { <span class="emr-spectacle__error" [id]="errorId(eye.id, 'notes', true)">{{ error(eye.id, 'notes') }}</span> }
              }
            </div>
          </fieldset>
        }
      </div>

      @if (model.slitLampRows?.length) {
        <div class="emr-spectacle__slitlamp">
          <div class="emr-spectacle__slitlamp-head">
            <strong class="emr-spectacle__slitlamp-title">Kaleidoscope Slit-Lamp &amp; Anterior/Posterior Segment Exam (OD | Structure | OS)</strong>
            @if (!model.readOnly) {
              <div class="emr-spectacle__slitlamp-actions">
                <button type="button" class="emr-button emr-button--small emr-button--ghost" (click)="macroNormal('od')">✓ OD Normal</button>
                <button type="button" class="emr-button emr-button--small emr-button--ghost" (click)="macroNormal('os')">✓ OS Normal</button>
                <button type="button" class="emr-button emr-button--small emr-button--ghost" (click)="macroNormal('ou')">✓ Both Eyes WNL</button>
              </div>
            }
          </div>
          @for (slRow of model.slitLampRows!; track slRow.id) {
            <div class="emr-spectacle__slitlamp-row">
              <div class="emr-spectacle__slitlamp-col">
                @if (slRow.modifiedOd) {
                  <span class="emr-spectacle__mod-dot" aria-label="Modified OD finding"></span>
                }
                <input
                  class="emr-control"
                  type="text"
                  [value]="slRow.odValue"
                  [disabled]="!!model.readOnly"
                  [attr.aria-label]="'Right eye (OD) ' + slRow.label"
                  (input)="slitLampInput(slRow.id, 'od', $event)"
                />
                @if (!model.readOnly) {
                  <div class="emr-spectacle__quick-row">
                    @for (qf of slRow.quickFindings; track qf) {
                      <button
                        type="button"
                        class="emr-spectacle__micro-chip"
                        [class.emr-spectacle__micro-chip--active]="slRow.odValue === qf"
                        (click)="setSlitLampQuick(slRow.id, 'od', qf)"
                      >{{ qf }}</button>
                    }
                  </div>
                }
              </div>

              <div class="emr-spectacle__slitlamp-center">
                <strong class="emr-spectacle__slitlamp-struct">{{ slRow.label }}</strong>
                @if (!model.readOnly) {
                  <div class="emr-spectacle__quick-row">
                    <button
                      type="button"
                      class="emr-spectacle__micro-chip emr-spectacle__micro-chip--primary"
                      [attr.aria-label]="'Set ' + slRow.label + ' normal for both eyes'"
                      (click)="macroNormal('ou', slRow.id)"
                    >WNL</button>
                    <button
                      type="button"
                      class="emr-spectacle__micro-chip"
                      [attr.aria-label]="'Copy ' + slRow.label + ' from OD to OS'"
                      (click)="copySlitLampEye('od', 'os', slRow.id)"
                    >OD→OS</button>
                  </div>
                }
              </div>

              <div class="emr-spectacle__slitlamp-col">
                @if (slRow.modifiedOs) {
                  <span class="emr-spectacle__mod-dot" aria-label="Modified OS finding"></span>
                }
                <input
                  class="emr-control"
                  type="text"
                  [value]="slRow.osValue"
                  [disabled]="!!model.readOnly"
                  [attr.aria-label]="'Left eye (OS) ' + slRow.label"
                  (input)="slitLampInput(slRow.id, 'os', $event)"
                />
                @if (!model.readOnly) {
                  <div class="emr-spectacle__quick-row">
                    @for (qf of slRow.quickFindings; track qf) {
                      <button
                        type="button"
                        class="emr-spectacle__micro-chip"
                        [class.emr-spectacle__micro-chip--active]="slRow.osValue === qf"
                        (click)="setSlitLampQuick(slRow.id, 'os', qf)"
                      >{{ qf }}</button>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <ng-template #cell let-eye="eye" let-field="field" let-mobile="mobile">
        <div class="emr-spectacle__cell-inner">
          <div class="emr-spectacle__control-row">
            <select *ngIf="field.type === 'select'" class="emr-select" [id]="cellId(eye.id, field.id, mobile)" [value]="value(eye.id, field.id)" [disabled]="field.disabled" [attr.aria-label]="field.label + ' for ' + eyeAccessibleLabel(eye)" [attr.aria-describedby]="messageIds(eye.id, field.id, mobile)" [attr.aria-invalid]="hasError(eye.id, field.id)" (focus)="focus(eye.id, field.id)" (change)="cellChanged(eye.id, field.id, $event)"><option value="" [selected]="!value(eye.id, field.id)">Select</option>@for (option of field.options ?? []; track option.value) { <option [value]="option.value" [selected]="option.value === value(eye.id, field.id)" [disabled]="option.disabled">{{ option.label }}</option> }</select>
            <input *ngIf="field.type !== 'select'" class="emr-control" [id]="cellId(eye.id, field.id, mobile)" type="text" [inputMode]="inputMode(field.type)" [placeholder]="field.placeholder ?? ''" [value]="value(eye.id, field.id)" [disabled]="field.disabled" [attr.aria-label]="field.label + ' for ' + eyeAccessibleLabel(eye)" [attr.aria-describedby]="messageIds(eye.id, field.id, mobile)" [attr.aria-invalid]="hasError(eye.id, field.id)" (focus)="focus(eye.id, field.id)" (input)="cellChanged(eye.id, field.id, $event)" />
            @if (isVaField(field) && logMarBadge(eye.id); as badgeText) {
              <span class="emr-spectacle__logmar" [attr.aria-label]="'LogMAR equivalent for ' + eyeAccessibleLabel(eye) + ': ' + badgeText">{{ badgeText }}</span>
            }
          </div>
          @if (isVaField(field) && !isReadOnly(field) && !field.disabled) {
            <div class="emr-spectacle__quick-row">
              @for (line of activeQuickLines(); track line) {
                <button
                  type="button"
                  class="emr-spectacle__micro-chip"
                  [class.emr-spectacle__micro-chip--active]="value(eye.id, field.id) === line"
                  [attr.aria-label]="'Set ' + eyeAccessibleLabel(eye) + ' visual acuity to ' + line"
                  (click)="setVaQuickLine(eye.id, field.id, line)"
                >{{ line }}</button>
              }
            </div>
          }
          @if (canStepDiopter(field) || canStepAxis(field)) {
            <div class="emr-spectacle__stepper-row">
              <button
                type="button"
                class="emr-spectacle__step-btn"
                [attr.aria-label]="'Decrease ' + field.label + ' for ' + eyeAccessibleLabel(eye)"
                (click)="stepCell(eye.id, field, -1)"
              >{{ canStepAxis(field) ? '−5°' : '−0.25' }}</button>
              <button
                type="button"
                class="emr-spectacle__step-btn"
                [attr.aria-label]="'Increase ' + field.label + ' for ' + eyeAccessibleLabel(eye)"
                (click)="stepCell(eye.id, field, 1)"
              >{{ canStepAxis(field) ? '+5°' : '+0.25' }}</button>
            </div>
          }
          @if (warning(eye.id, field.id)) { <span class="emr-spectacle__warning" [id]="warningId(eye.id, field.id, mobile)">{{ warning(eye.id, field.id) }}</span> }
          @if (hasError(eye.id, field.id)) { <span class="emr-spectacle__error" [id]="errorId(eye.id, field.id, mobile)">{{ error(eye.id, field.id) }}</span> }
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text)}
    .emr-spectacle{border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:18px;display:grid;gap:14px}
    .emr-spectacle__header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
    .emr-spectacle__header-main{flex:1;min-width:240px}
    .emr-spectacle__header-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
    .emr-spectacle h2{margin:2px 0 5px;font-size:var(--emr-text-lg)}
    .emr-spectacle__header p:not(.emr-spectacle__eyebrow){margin:0;color:var(--emr-text-muted);font-size:var(--emr-text-md)}
    .emr-spectacle__eyebrow{margin:0 0 4px;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .emr-spectacle__status{border:1px solid var(--emr-border);border-radius:999px;padding:5px 9px;color:var(--emr-text-muted);font-size:var(--emr-text-xs);white-space:nowrap}
    .emr-spectacle__va-switcher{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px}
    .emr-spectacle__va-label{color:var(--emr-text-muted);font-size:var(--emr-text-xs);font-weight:700}
    .emr-spectacle__chip{padding:4px 8px;border-radius:6px;border:1px solid var(--emr-border);background:var(--emr-surface-soft);color:var(--emr-text);font-size:var(--emr-text-xs);cursor:pointer;font-family:inherit}
    .emr-spectacle__chip--active{border-color:var(--emr-primary);background:var(--emr-primary-soft);color:var(--emr-primary-contrast);font-weight:700}
    .emr-spectacle__iop-bar{display:flex;flex-wrap:wrap;gap:10px;padding:12px;border-radius:8px;border:1px solid var(--emr-border);background:var(--emr-surface-soft)}
    .emr-spectacle__iop-card{flex:1;min-width:240px;padding:10px;border-radius:8px;border:1px solid var(--emr-border);background:var(--emr-surface);display:flex;justify-content:space-between;align-items:center;gap:8px}
    .emr-spectacle__iop-info{display:grid;gap:2px}
    .emr-spectacle__iop-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .emr-spectacle__iop-title{color:var(--emr-text-muted);font-size:var(--emr-text-xs);font-weight:700}
    .emr-spectacle__iop-reading{display:flex;align-items:baseline;gap:8px}
    .emr-spectacle__iop-val{color:var(--emr-text);font-size:var(--emr-text-xl);font-weight:700;font-family:var(--emr-font-mono)}
    .emr-spectacle__iop-delta{color:var(--emr-success);font-size:var(--emr-text-xs);font-weight:700;font-family:var(--emr-font-mono)}
    .emr-spectacle__iop-meta{color:var(--emr-text-muted);font-size:var(--emr-text-2xs)}
    .emr-spectacle__table-wrap{overflow-x:auto}
    .emr-spectacle__table{width:100%;border-collapse:separate;border-spacing:0;min-width:700px}
    .emr-spectacle__caption{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
    .emr-spectacle th,.emr-spectacle td{padding:10px;border-bottom:1px solid var(--emr-border);text-align:left;vertical-align:top}
    .emr-spectacle thead th{background:var(--emr-surface-raised);color:var(--emr-text-muted);font-size:var(--emr-text-xs);font-weight:700}
    .emr-spectacle tbody th{font-size:var(--emr-text-md);white-space:nowrap}
    .emr-spectacle td{min-width:130px}
    .emr-spectacle .emr-control,.emr-spectacle .emr-select{width:100%;min-width:110px}
    .emr-spectacle__cell-inner{display:grid;gap:4px}
    .emr-spectacle__control-row,.emr-spectacle__readonly-wrap{display:flex;align-items:center;gap:6px}
    .emr-spectacle__logmar{padding:5px 8px;border-radius:6px;border:1px solid var(--emr-primary-border);background:var(--emr-primary-soft);color:var(--emr-primary-contrast);font-size:var(--emr-text-xs);font-family:var(--emr-font-mono);font-weight:700;white-space:nowrap}
    .emr-spectacle__quick-row{display:flex;flex-wrap:wrap;gap:4px}
    .emr-spectacle__micro-chip{padding:2px 6px;border-radius:4px;border:1px solid var(--emr-border);background:var(--emr-surface-soft);color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-family:var(--emr-font-mono);font-weight:700;cursor:pointer}
    .emr-spectacle__micro-chip--active,.emr-spectacle__micro-chip--primary{border-color:var(--emr-primary);background:var(--emr-primary-soft);color:var(--emr-primary-contrast)}
    .emr-spectacle__stepper-row{display:flex;gap:4px}
    .emr-spectacle__step-btn{flex:1;padding:2px 6px;border-radius:4px;border:1px solid var(--emr-border);background:var(--emr-surface-soft);color:var(--emr-text);font-size:var(--emr-text-2xs);font-family:var(--emr-font-mono);font-weight:700;cursor:pointer;text-align:center}
    .emr-spectacle__unit,.emr-spectacle__short{display:block;color:var(--emr-text-muted);font-size:var(--emr-text-2xs);font-weight:400}
    .emr-spectacle__value{display:block;min-height:44px;padding:11px 0}
    .emr-spectacle__error,.emr-spectacle__warning{display:block;margin-top:4px;font-size:var(--emr-text-xs)}
    .emr-spectacle__error{color:var(--emr-danger)}
    .emr-spectacle__warning{color:var(--emr-warning)}
    .emr-spectacle__errors{padding:10px 12px;border-radius:8px;background:var(--emr-danger-soft);color:var(--emr-danger);font-size:var(--emr-text-sm)}
    .emr-spectacle__errors ul{margin:5px 0 0;padding-left:20px}
    .emr-spectacle__slitlamp{border:1px solid var(--emr-border);border-radius:8px;overflow:hidden}
    .emr-spectacle__slitlamp-head{padding:10px 12px;background:var(--emr-surface-raised);border-bottom:1px solid var(--emr-border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
    .emr-spectacle__slitlamp-title{font-size:var(--emr-text-sm);font-weight:700}
    .emr-spectacle__slitlamp-actions{display:flex;flex-wrap:wrap;gap:6px}
    .emr-spectacle__slitlamp-row{display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--emr-border);background:var(--emr-surface)}
    .emr-spectacle__slitlamp-row:nth-child(even){background:var(--emr-surface-soft)}
    .emr-spectacle__slitlamp-row:last-child{border-bottom:0}
    .emr-spectacle__slitlamp-col{flex:1;display:grid;gap:4px;position:relative;min-width:160px}
    .emr-spectacle__slitlamp-center{width:164px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}
    .emr-spectacle__slitlamp-struct{font-size:var(--emr-text-sm);font-weight:700}
    .emr-spectacle__mod-dot{position:absolute;top:-4px;right:-4px;width:8px;height:8px;border-radius:4px;background:var(--emr-primary);z-index:2}
    .emr-spectacle__mobile{display:none}
    .emr-spectacle__mobile-field{display:grid;gap:5px;margin-top:12px}
    .emr-spectacle__mobile-field label{color:var(--emr-text-muted);font-size:var(--emr-text-sm);font-weight:600}
    @media(max-width:720px){
      .emr-spectacle{padding:14px}
      .emr-spectacle__table-wrap{display:none}
      .emr-spectacle__mobile{display:grid;gap:12px}
      .emr-spectacle__mobile fieldset{margin:0;padding:12px;border:1px solid var(--emr-border);border-radius:9px}
      .emr-spectacle__mobile legend{padding:0 6px;font-weight:700}
      .emr-spectacle__mobile .emr-control,.emr-spectacle__mobile .emr-select{width:100%}
      .emr-spectacle__slitlamp-row{flex-direction:column;align-items:stretch}
      .emr-spectacle__slitlamp-center{width:100%}
    }
  `],
})
export class EmrSpectaclePrescriptionComponent {
  @Input({ required: true }) model!: SpectaclePrescriptionViewModel;
  @Input() idPrefix = '';
  @Output() readonly intent = new EventEmitter<SpectaclePrescriptionIntent>();

  protected readonly vaChartOptions = VA_CHART_OPTIONS;

  activeChartType(): VaChartType {
    return this.model.vaChartType ?? 'snellen-6m';
  }

  activeQuickLines(): readonly string[] {
    const opt = VA_CHART_OPTIONS.find((c) => c.id === this.activeChartType()) ?? VA_CHART_OPTIONS[0]!;
    return opt.quickLines.slice(0, 6);
  }

  changeVaChartType(chartType: VaChartType): void {
    this.intent.emit({ type: 'vaChartTypeChanged', chartType });
  }

  isVaField(field: SpectaclePrescriptionField): boolean {
    return field.id === 'visual-acuity' || field.id.toLowerCase().includes('va');
  }

  logMarBadge(eyeId: string): string | null {
    return resolveLogMarBadgeText('', this.model.logMarEquivalents?.[eyeId]);
  }

  canStepDiopter(field: SpectaclePrescriptionField): boolean {
    return !this.isReadOnly(field) && !field.disabled && field.type === 'decimal';
  }

  canStepAxis(field: SpectaclePrescriptionField): boolean {
    return !this.isReadOnly(field) && !field.disabled && field.id === 'axis';
  }

  stepCell(eyeId: string, field: SpectaclePrescriptionField, direction: -1 | 1): void {
    if (this.isReadOnly(field) || field.disabled) return;
    const delta = (this.canStepAxis(field) ? 5 : 0.25) * direction;
    this.intent.emit({ type: 'cellStepped', eyeId, fieldId: field.id, delta });
  }

  setVaQuickLine(eyeId: string, fieldId: string, value: string): void {
    if (!this.isReadOnly()) {
      this.intent.emit({ type: 'cellEditRequested', eyeId, fieldId, value });
    }
  }

  copyEye(fromEyeId: string, toEyeId: string): void {
    if (!this.isReadOnly()) {
      this.intent.emit({ type: 'copyEyeRequested', fromEyeId, toEyeId });
    }
  }

  iopForEye(eyeId: string): KaleidoscopeIopReading | undefined {
    return this.model.iopReadings?.[eyeId];
  }

  macroNormal(scope: 'ou' | 'od' | 'os', rowId?: string): void {
    if (!this.isReadOnly()) {
      this.intent.emit(rowId ? { type: 'slitLampMacroNormalRequested', scope, rowId } : { type: 'slitLampMacroNormalRequested', scope });
    }
  }

  copySlitLampEye(fromEyeId: 'od' | 'os', toEyeId: 'od' | 'os', rowId?: string): void {
    if (!this.isReadOnly()) {
      this.intent.emit(rowId ? { type: 'slitLampCopyEyeRequested', fromEyeId, toEyeId, rowId } : { type: 'slitLampCopyEyeRequested', fromEyeId, toEyeId });
    }
  }

  slitLampInput(rowId: string, eyeId: 'od' | 'os', event: Event): void {
    if (!this.isReadOnly()) {
      this.intent.emit({ type: 'slitLampChanged', rowId, eyeId, value: (event.target as HTMLInputElement).value });
    }
  }

  setSlitLampQuick(rowId: string, eyeId: 'od' | 'os', value: string): void {
    if (!this.isReadOnly()) {
      this.intent.emit({ type: 'slitLampChanged', rowId, eyeId, value });
    }
  }

  isReadOnly(field?: SpectaclePrescriptionField): boolean { return !!this.model.readOnly || !!field?.readOnly; }
  value(eyeId: string, fieldId: string): string { return this.model.values[eyeId]?.[fieldId] ?? ''; }
  note(eyeId: string): string { return this.model.notes?.[eyeId] ?? ''; }
  domId(suffix: string): string { return `${this.idPrefix || this.model.id}-${suffix}`; }
  eyeAccessibleLabel(eye: { label: string; shortLabel?: string }): string { return eye.shortLabel ? `${eye.label} (${eye.shortLabel})` : eye.label; }
  cellId(eyeId: string, fieldId: string, mobile = false): string { return this.domId(`${eyeId}-${fieldId}${mobile ? '-mobile' : ''}`); }
  notesId(eyeId: string, mobile = false): string { return this.domId(`${eyeId}-notes${mobile ? '-mobile' : ''}`); }
  errorId(eyeId: string, fieldId: string, mobile = false): string { return this.domId(`${eyeId}-${fieldId}${mobile ? '-mobile' : ''}-error`); }
  warningId(eyeId: string, fieldId: string, mobile = false): string { return this.domId(`${eyeId}-${fieldId}${mobile ? '-mobile' : ''}-warning`); }
  error(eyeId: string, fieldId: string): string { return this.model.errors?.[`${eyeId}.${fieldId}`] ?? ''; }
  hasError(eyeId: string, fieldId: string): boolean { return !!this.error(eyeId, fieldId); }
  warning(eyeId: string, fieldId: string): string { return this.model.warnings?.[`${eyeId}.${fieldId}`] ?? ''; }
  messageIds(eyeId: string, fieldId: string, mobile = false): string | null {
    const ids = [this.warning(eyeId, fieldId) ? this.warningId(eyeId, fieldId, mobile) : '', this.hasError(eyeId, fieldId) ? this.errorId(eyeId, fieldId, mobile) : ''].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }
  errorCount(): number { return Object.values(this.model.errors ?? {}).filter(Boolean).length; }
  errorEntries(): [string, string][] { return Object.entries(this.model.errors ?? {}).filter((entry): entry is [string, string] => !!entry[1]); }
  inputMode(type: SpectaclePrescriptionFieldType): 'text' | 'decimal' | 'numeric' { return type === 'decimal' ? 'decimal' : type === 'integer' ? 'numeric' : 'text'; }
  focus(eyeId: string, fieldId: string): void { this.intent.emit({ type: 'cellFocused', eyeId, fieldId }); }
  cellChanged(eyeId: string, fieldId: string, event: Event): void { if (!this.isReadOnly()) this.intent.emit({ type: 'cellEditRequested', eyeId, fieldId, value: (event.target as HTMLInputElement | HTMLSelectElement).value }); }
  notesChanged(eyeId: string, event: Event): void { if (!this.isReadOnly()) this.intent.emit({ type: 'notesEditRequested', eyeId, value: (event.target as HTMLInputElement).value }); }
}
