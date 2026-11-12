import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { AttestationIntent, ConsentCaptureIntent, ConsentCaptureViewModel, ConsentDecision } from '@drguptavivek/emr-controller';
import { EmrAttestationComponent } from '../fields/emr-attestation.component';
import { EmrTextInputComponent } from '../primitives/emr-inputs.component';

/** English fallbacks for built-in strings; every one is overridable through the `labels` input. */
const DEFAULT_LABELS = {
  agreeToAll: 'Agree to all',
  requiredForCare: 'Required for care',
  language: 'Language',
  purposes: 'Purposes',
  givenBy: 'Given by',
  method: 'Method',
  guardianName: 'Guardian name',
  guardianRelationship: 'Relationship to patient',
  captureSignature: 'Capture signature',
  captureThumbprint: 'Capture thumbprint',
  submit: 'Submit',
  cancel: 'Cancel',
  noticeVersion: 'Notice version'
};
export type EmrConsentCaptureLabels = typeof DEFAULT_LABELS;

export interface ConsentDecidableRow {
  readonly key: string;
  readonly kind: 'category' | 'purpose';
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly decision?: ConsentDecision;
  readonly locked?: boolean;
}

let nextId = 0;

/**
 * L4 consent capture. Renders the notice, unified Purposes checkbox list with "Agree to all", who is giving consent
 * and how it is evidenced; the app decides every rule (essential purposes, guardian need, canSubmit).
 * Inputs: `model` (required), optional `labels` overrides, `idPrefix` for unique ids when several are on a page.
 * Output: one `intent` stream. Nothing is pre-ticked except essential purposes (read-only).
 */
@Component({
  selector: 'emr-consent-capture',
  standalone: true,
  imports: [EmrAttestationComponent, EmrTextInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @let l = text();
    <div class="cc">
      <fieldset class="cc__group">
        <legend class="emr-field__label">{{ l.language }}</legend>
        <div class="cc__row">
          @for (o of m.languageOptions; track o.id) {
            <label class="emr-radio"><input type="radio" [name]="idPrefix() + '-lang'" [checked]="o.id === m.selectedLanguage"
              (change)="intent.emit({ type: 'languageSelected', id: o.id })" /><span>{{ o.label }}</span></label>
          }
        </div>
      </fieldset>

      <section class="cc__notice-wrap" [attr.aria-labelledby]="idPrefix() + '-notice'">
        <h2 class="cc__title" [id]="idPrefix() + '-notice'">{{ m.notice.title }}</h2>
        <div class="cc__notice" role="region" tabindex="0" [attr.aria-labelledby]="idPrefix() + '-notice'">
          @for (s of m.notice.sections; track $index) {
            <h3 class="cc__heading">{{ s.heading }}</h3>
            <p class="cc__body">{{ s.body }}</p>
          }
        </div>
        <p class="cc__muted">{{ l.noticeVersion }} {{ m.notice.version }} · {{ m.notice.languageLabel }}</p>
      </section>

      <section class="cc__card" [attr.aria-labelledby]="idPrefix() + '-purposes'">
        <h3 class="cc__title" [id]="idPrefix() + '-purposes'">{{ l.purposes }}</h3>
        @if (openRows().length) {
          <label class="emr-checkbox cc__check-row">
            <input
              type="checkbox"
              [checked]="allGranted()"
              [indeterminate]="someGranted()"
              [attr.aria-checked]="someGranted() ? 'mixed' : allGranted()"
              (change)="toggleAll()"
            />
            <span class="cc__check-text"><strong>{{ l.agreeToAll }}</strong></span>
          </label>
        }
        @for (p of essentialPurposes(); track p.id) {
          <div class="cc__check-item">
            <label class="emr-checkbox cc__check-row">
              <input
                type="checkbox"
                checked
                disabled
                [attr.aria-describedby]="idPrefix() + '-ess-' + p.id"
              />
              <span class="cc__check-text"><strong>{{ p.label }}</strong></span>
            </label>
            <p class="cc__muted cc__hint" [id]="idPrefix() + '-ess-' + p.id">{{ l.requiredForCare }}. {{ p.description }}</p>
          </div>
        }
        @for (r of decidableRows(); track r.key) {
          <div class="cc__check-item">
            <label class="emr-checkbox cc__check-row">
              <input
                type="checkbox"
                [checked]="r.decision === 'granted'"
                [disabled]="!!r.locked"
                [attr.aria-describedby]="r.hint ? idPrefix() + '-hint-' + r.id : null"
                (change)="onRowCheck(r, $event)"
              />
              <span class="cc__check-text"><strong>{{ r.label }}</strong></span>
            </label>
            @if (r.hint) {
              <p class="cc__muted cc__hint" [id]="idPrefix() + '-hint-' + r.id">{{ r.hint }}</p>
            }
          </div>
        }
      </section>

      <fieldset class="cc__group">
        <legend class="emr-field__label">{{ l.givenBy }}</legend>
        <div class="cc__row">
          @for (o of m.givenByOptions; track o.id) {
            <label class="emr-radio"><input type="radio" [name]="idPrefix() + '-by'" [checked]="o.id === m.selectedGivenBy"
              (change)="intent.emit({ type: 'givenBySelected', id: o.id })" /><span>{{ o.label }}</span></label>
          }
        </div>
      </fieldset>

      @if (m.guardian; as g) {
        <div class="cc__stack">
          <emr-text-input [controlId]="idPrefix() + '-g-name'" [label]="l.guardianName" [required]="g.required" [value]="g.name ?? ''" [error]="g.nameError ?? ''"
            (valueChange)="intent.emit({ type: 'guardianChanged', name: $event ?? '' })" />
          <emr-text-input [controlId]="idPrefix() + '-g-rel'" [label]="l.guardianRelationship" [required]="g.required" [value]="g.relationship ?? ''" [error]="g.relationshipError ?? ''"
            (valueChange)="intent.emit({ type: 'guardianChanged', relationship: $event ?? '' })" />
        </div>
      }

      <fieldset class="cc__group">
        <legend class="emr-field__label">{{ l.method }}</legend>
        <div class="cc__row">
          @for (o of m.methodOptions; track o.id) {
            <label class="emr-radio"><input type="radio" [name]="idPrefix() + '-method'" [checked]="o.id === m.selectedMethod"
              (change)="intent.emit({ type: 'methodSelected', id: o.id })" /><span>{{ o.label }}</span></label>
          }
        </div>
      </fieldset>

      @switch (m.selectedMethod) {
        @case ('signature') {
          <div class="cc__stack">
            <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'signatureRequested' })">{{ l.captureSignature }}</button>
            @if (m.capture?.signatureLabel; as status) { <p class="cc__muted" role="status">{{ status }}</p> }
          </div>
        }
        @case ('thumbprint') {
          <div class="cc__stack">
            <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'thumbprintRequested' })">{{ l.captureThumbprint }}</button>
            @if (m.capture?.thumbprintLabel; as status) { <p class="cc__muted" role="status">{{ status }}</p> }
          </div>
        }
        @case ('verbal_attested') {
          @if (m.attestation) { <emr-attestation [model]="m.attestation" (intent)="attested($event)" /> }
        }
      }

      <div class="cc__actions" data-emr-print="hide">
        @if (m.canSubmit) {
          <button class="emr-button" type="button" (click)="intent.emit({ type: 'submitRequested' })">{{ l.submit }}</button>
        } @else if (m.submitError) {
          <p class="cc__error" role="alert">{{ m.submitError }}</p>
        }
        <button class="emr-button emr-button--outline" type="button" (click)="intent.emit({ type: 'cancelled' })">{{ l.cancel }}</button>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family)}
    .cc,.cc__stack{display:grid;gap:16px;min-width:0}
    .cc__stack{gap:8px}
    .cc__group{margin:0;padding:0;border:0;min-width:0;display:grid;gap:4px}
    .cc__row{display:flex;flex-wrap:wrap;gap:4px 16px}
    .cc__title{margin:0;font-size:var(--emr-text-lg);font-weight:var(--emr-weight-bold)}
    .cc__heading{margin:0;font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .cc__body{margin:0;font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .cc__muted{margin:0;font-size:var(--emr-text-sm);color:var(--emr-text-muted);overflow-wrap:anywhere}
    .cc__notice{max-height:20rem;overflow-y:auto;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);display:grid;gap:8px}
    .cc__notice:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .cc__card{display:grid;gap:8px;padding:12px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);break-inside:avoid}
    .cc__check-item{display:grid;gap:2px}
    .cc__check-row{min-height:44px;align-items:center}
    .cc__check-text{font-size:var(--emr-text-md);overflow-wrap:anywhere}
    .cc__hint{padding-left:32px}
    .cc__error{margin:0;padding:8px 12px;border:1px solid var(--emr-danger);border-radius:8px;background:var(--emr-danger-soft);font-size:var(--emr-text-md)}
    .cc__actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    /* Print: the whole notice must reach the paper, never a clipped scroll box. */
    :host-context(.emr-print) .cc__notice{max-height:none;overflow:visible}
    @media print{.cc__notice{max-height:none;overflow:visible}}
  `]
})
export class EmrConsentCaptureComponent {
  readonly model = input.required<ConsentCaptureViewModel>();
  readonly labels = input<Partial<EmrConsentCaptureLabels>>({});
  readonly idPrefix = input(`emr-consent-capture-${++nextId}`);
  readonly intent = output<ConsentCaptureIntent>();

  readonly text = computed(() => ({ ...DEFAULT_LABELS, ...this.labels() }));

  readonly essentialPurposes = computed(() =>
    this.model().categories.flatMap((c) => c.purposes.filter((p) => p.essential))
  );

  readonly decidableRows = computed<readonly ConsentDecidableRow[]>(() =>
    this.model().categories.flatMap((c): readonly ConsentDecidableRow[] => {
      const choosable = c.purposes.filter((p) => !p.essential);
      if (!choosable.length) return [];
      return c.mode === 'whole'
        ? [{
            key: `c:${c.id}`,
            kind: 'category' as const,
            id: c.id,
            label: c.label,
            hint: [c.description, ...choosable.map((p) => p.label)].filter(Boolean).join(' · '),
            decision: c.decision,
            locked: c.locked,
          }]
        : choosable.map((p) => ({
            key: `p:${p.id}`,
            kind: 'purpose' as const,
            id: p.id,
            label: p.label,
            hint: p.description,
            decision: p.decision,
            locked: p.locked,
          }));
    })
  );

  readonly openRows = computed(() => this.decidableRows().filter((r) => !r.locked));
  readonly allGranted = computed(() => {
    const open = this.openRows();
    return open.length > 0 && open.every((r) => r.decision === 'granted');
  });
  readonly someGranted = computed(() => {
    const open = this.openRows();
    return !this.allGranted() && open.some((r) => r.decision === 'granted');
  });

  decided(kind: 'category' | 'purpose', id: string, decision: ConsentDecision): void {
    this.intent.emit(kind === 'category' ? { type: 'categoryDecided', id, decision } : { type: 'purposeDecided', id, decision });
  }

  onRowCheck(row: ConsentDecidableRow, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.decided(row.kind, row.id, checked ? 'granted' : 'refused');
  }

  toggleAll(): void {
    const nextDecision: ConsentDecision = this.allGranted() ? 'refused' : 'granted';
    for (const r of this.openRows()) {
      this.decided(r.kind, r.id, nextDecision);
    }
  }

  attested(i: AttestationIntent): void {
    if (i.type === 'signRequested') this.intent.emit({ type: 'attestationConfirmed' });
  }
}
