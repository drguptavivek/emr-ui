import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import type {
  ConsentCaptureViewModel,
  ConsentCaptureIntent,
  ConsentReviewViewModel,
  ConsentReviewIntent,
  ConsentReceiptViewModel,
  ConsentStatusViewModel,
  SharingGrantsViewModel,
  SharingGrantsIntent,
  AccessLogViewModel,
  AccessLogIntent,
  RightsRequestsViewModel,
  RightsRequestsIntent,
  PrivacyCentreViewModel,
  PrivacyCentreIntent,
  PatientIdentityViewModel,
  PatientIdentityIntent,
  IdentifierCheckViewModel,
  IdentifierCheckIntent,
  LinkCardsViewModel,
  LinkCardsIntent,
  ContactAttemptViewModel,
  ContactAttemptIntent,
  ContactAttemptSummaryView,
  ContactAttemptSummaryIntent,
  MergeCompareViewModel,
  MergeCompareIntent,
  DraftRecordListViewModel,
  DraftRecordListIntent,
  EmrBadge,
  PendingConfirmation,
  IdentifierEntryIntent,
} from '@drguptavivek/emr-controller';
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement } from './foundations.js';
import { registerL2Elements } from './l2-fields.js';

const badge = (b?: EmrBadge) =>
  b
    ? html`<span class=${`emr-badge emr-badge--${b.tone}`} aria-label=${b.assistiveText || b.label}
        >${b.label}</span
      >`
    : nothing;
const identity = (m: PatientIdentityViewModel) =>
  html`<div>
    <strong>${m.name}</strong> ${m.ageLabel} ${m.sexLabel}
    ${m.identifiers.map((i) => html`<div>${i.label}: ${i.display} ${badge(i.statusBadge)}</div>`)}
    ${m.phone ? html`<div>${m.phone}</div>` : nothing}${m.centreName
      ? html`<div>${m.centreName}</div>`
      : nothing}
    ${m.lastVisitDate ? html`<div>${m.lastVisitDate}</div>` : nothing}${m.aliases?.map(
      (a) => html`<div>${a}</div>`,
    )}
  </div>`;
const inputValue = (e: Event) => (e.target as HTMLInputElement).value;
const selection = (
  label: string,
  options: readonly { id: string; label: string }[],
  selected: string | undefined,
  change: (id: string) => void,
) =>
  html` <label
    >${label}<select
      class="emr-control"
      .value=${live(selected ?? '')}
      @change=${(e: Event) => change(inputValue(e))}
    >
      <option value="" disabled ?selected=${!selected}>Select</option>
      ${options.map((o) => html`<option value=${o.id} ?selected=${o.id === selected}>${o.label}</option>`)}
    </select>
  </label>`;
const confirmation = (p: PendingConfirmation, confirm: () => void, dismiss: () => void) =>
  html`<div role="group" aria-label=${p.title} class="emr-card">
    <strong>${p.title}</strong>
    <p>${p.body}</p>
    <button type="button" class="emr-btn" @click=${confirm}>${p.confirmLabel}</button>
    <button type="button" class="emr-btn" @click=${dismiss}>${p.cancelLabel}</button>
  </div>`;
const stateMessage = (state: string, message?: string) =>
  state === 'ready'
    ? nothing
    : html`<p role="status">
        ${message || (state === 'loading' ? 'Loading…' : state === 'empty' ? 'No records' : 'Unable to load')}
      </p>`;

export class EmrConsentCaptureElement extends EmrModelElement<ConsentCaptureViewModel, ConsentCaptureIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const decision = (id: string, value: string | undefined, locked: boolean, category: boolean) =>
      html`<fieldset ?disabled=${locked}>
        <legend>Decision</legend>
        ${(['granted', 'refused'] as const).map(
          (d) =>
            html`<label>
              <input
                type="radio"
                name=${`${category ? 'category' : 'purpose'}-${id}`}
                .checked=${live(value === d)}
                @change=${() =>
                  this.send(
                    category
                      ? { type: 'categoryDecided', id, decision: d }
                      : { type: 'purposeDecided', id, decision: d },
                  )}
              />${d === 'granted' ? 'Grant' : 'Refuse'}</label
            >`,
        )}
      </fieldset>`;
    return this.panel(
      'Consent',
      html` ${selection('Language', m.languageOptions, m.selectedLanguage, (id) =>
          this.send({ type: 'languageSelected', id }),
        )}
        <h4>${m.notice.title}</h4>
        <p>${m.notice.version} · ${m.notice.languageLabel}</p>
        ${m.notice.sections.map(
          (s) =>
            html`<section>
              <strong>${s.heading}</strong>
              <p>${s.body}</p>
            </section>`,
        )}
        ${m.categories.map(
          (c) =>
            html`<section>
              <h4>${c.label}</h4>
              <p>${c.description}</p>
              ${c.mode === 'whole' && c.purposes.some((p) => !p.essential)
                ? decision(c.id, c.decision, !!c.locked, true)
                : nothing}
              ${c.purposes.map(
                (p) =>
                  html`<div>
                    <strong>${p.label}</strong>
                    <p>${p.description}</p>
                    ${p.essential
                      ? html`<span>Essential</span>`
                      : c.mode === 'per_purpose'
                        ? decision(p.id, p.decision, !!p.locked, false)
                        : nothing}
                  </div>`,
              )}
            </section>`,
        )}
        ${selection('Given by', m.givenByOptions, m.selectedGivenBy, (id) =>
          this.send({ type: 'givenBySelected', id }),
        )}
        ${m.guardian
          ? html`<label
                >Guardian name<input
                  class="emr-control"
                  .value=${live(m.guardian.name ?? '')}
                  ?required=${m.guardian.required}
                  @input=${(e: Event) =>
                    this.send({
                      type: 'guardianChanged',
                      name: inputValue(e),
                      relationship: m.guardian?.relationship,
                    })}
                />
              </label>
              <span role="status">${m.guardian.nameError}</span>
              <label
                >Relationship<input
                  class="emr-control"
                  .value=${live(m.guardian.relationship ?? '')}
                  ?required=${m.guardian.required}
                  @input=${(e: Event) =>
                    this.send({
                      type: 'guardianChanged',
                      name: m.guardian?.name,
                      relationship: inputValue(e),
                    })}
                />
              </label>
              <span role="status">${m.guardian.relationshipError}</span>`
          : nothing}
        ${selection('Method', m.methodOptions, m.selectedMethod, (id) => {
          const option = m.methodOptions.find((o) => o.id === id);
          if (option) this.send({ type: 'methodSelected', id: option.id });
        })}
        ${m.selectedMethod === 'signature'
          ? html`${m.capture?.signatureLabel}
            ${this.action('Capture signature', { type: 'signatureRequested' })}`
          : nothing}
        ${m.selectedMethod === 'thumbprint'
          ? html`${m.capture?.thumbprintLabel}
            ${this.action('Capture thumbprint', { type: 'thumbprintRequested' })}`
          : nothing}
        ${m.selectedMethod === 'verbal_attested' && m.attestation
          ? html`<div>
              <strong>${m.attestation.title}</strong>
              <p>${m.attestation.statement}</p>
              ${m.attestation.signatories.map(
                (s) => html`<p>${s.displayName} · ${s.roleLabel} ${badge(s.status)} ${s.signedAtLabel}</p>`,
              )}
              <p>${m.attestation.error}</p>
              ${m.attestation.canSign && !m.attestation.readOnly
                ? this.action(m.attestation.signLabel || 'Confirm attestation', {
                    type: 'attestationConfirmed',
                  })
                : nothing}
            </div>`
          : nothing}
        ${m.submitError ? html`<p role="alert">${m.submitError}</p>` : nothing}
        <div class="emr-actions">
          ${m.canSubmit ? this.action('Submit', { type: 'submitRequested' }) : nothing}${this.action(
            'Cancel',
            { type: 'cancelled' },
          )}
        </div>`,
    );
  }
}
export class EmrConsentReviewElement extends EmrModelElement<ConsentReviewViewModel, ConsentReviewIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Consent review',
      html`${identity(m.patient)}
        <p>${m.noticeVersionLabel}</p>
        ${m.message ? html`<p role="status">${m.message.text}</p>` : nothing}
        ${m.categories.map(
          (c) =>
            html`<section>
              <h4>${c.label}</h4>
              <p>${c.description}</p>
              ${c.purposes.map(
                (p) =>
                  html`<div>
                    <strong>${p.label}</strong> ${badge(p.statusBadge)}
                    <p>${p.description}</p>
                    <p>${p.decidedAtLabel} ${p.methodLabel} ${p.givenByLabel}</p>
                    ${p.essential ? html`<span>Essential</span>` : nothing}
                    ${p.canWithdraw
                      ? this.action('Withdraw', { type: 'withdrawRequested', purposeId: p.id })
                      : nothing}${p.canGrant
                      ? this.action('Grant', { type: 'grantRequested', purposeId: p.id })
                      : nothing}
                    ${p.contact
                      ? html`<fieldset>
                            <legend>Contact channels</legend>
                            ${p.contact.channels.map(
                              (c) =>
                                html`<label>
                                  <input
                                    type="checkbox"
                                    .checked=${live(c.selected)}
                                    @change=${() =>
                                      this.send({ type: 'channelToggled', purposeId: p.id, channelId: c.id })}
                                  />${c.label}</label
                                >`,
                            )}
                          </fieldset>
                          <label
                            >${p.contact.preferredNumberLabel}<input
                              class="emr-control"
                              .value=${live(p.contact.preferredNumber ?? '')}
                              @input=${(e: Event) =>
                                this.send({
                                  type: 'preferredNumberChanged',
                                  purposeId: p.id,
                                  value: inputValue(e),
                                })}
                            />
                          </label>
                          <span role="status">${p.contact.preferredNumberError}</span>`
                      : nothing}
                  </div>`,
              )}
            </section>`,
        )}
        ${this.action('Receipt', { type: 'receiptRequested' })}${this.action('Cancel', {
          type: 'cancelled',
        })}${m.pendingWithdrawal
          ? confirmation(
              m.pendingWithdrawal,
              () => {
                const id = m.pendingWithdrawal!.purposeId;
                if (
                  this.model?.pendingWithdrawal?.purposeId === id &&
                  this.model.categories.some((c) => c.purposes.some((p) => p.id === id && p.canWithdraw))
                )
                  this.send({ type: 'withdrawConfirmed', purposeId: id });
              },
              () => {
                if (this.model?.pendingWithdrawal?.purposeId === m.pendingWithdrawal!.purposeId)
                  this.send({ type: 'withdrawDismissed' });
              },
            )
          : nothing}`,
    );
  }
}
export class EmrConsentReceiptElement extends EmrModelElement<ConsentReceiptViewModel, never> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title,
      html`<strong>${m.patientName}</strong>${m.identifiers.map(
          (i) => html`<div>${i.label}: ${i.display}</div>`,
        )}
        <p>${m.dateLabel} · ${m.noticeVersionLabel}</p>
        ${m.categories.map(
          (c) =>
            html`<section>
              <h4>${c.label}</h4>
              ${c.purposes.map(
                (p) => html`<div>${p.label}: ${p.decisionLabel} ${badge(p.statusBadge)}</div>`,
              )}
            </section>`,
        )}
        <p>${m.howToChange}</p>
        <p>${m.footer}</p>`,
    );
  }
}
export class EmrConsentStatusBadgeElement extends EmrModelElement<
  ConsentStatusViewModel,
  { type: 'consentDetailsRequested' }
> {
  @property({ type: Boolean }) interactive = false;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const content = html`${badge(m.badge)} ${m.detail}`;
    return this.interactive
      ? html`<button
          type="button"
          class="emr-btn emr-btn--ghost"
          @click=${() => {
            if (this.interactive && this.model) this.send({ type: 'consentDetailsRequested' });
          }}
        >
          ${content}
        </button>`
      : html`<span role="status">${content}</span>`;
  }
}
export class EmrSharingGrantsElement extends EmrModelElement<SharingGrantsViewModel, SharingGrantsIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Sharing grants',
      html`${m.notice ? html`<p role="status">${m.notice.text}</p>` : nothing}${m.filters
        ? selection('Filter', m.filters, m.selectedFilter, (id) => this.send({ type: 'filterSelected', id }))
        : nothing}${stateMessage(m.state, m.message)}${m.state === 'error'
        ? this.action('Retry', { type: 'retryRequested' })
        : nothing}
      ${m.state === 'ready'
        ? m.grants.map(
            (g) =>
              html`<article>
                <h4>${g.recipientLabel} ${badge(g.statusBadge)}</h4>
                <p>${g.recipientTypeLabel} ${g.purposeLabel}</p>
                <p>${g.dataScope.join(', ')}</p>
                <p>${g.recordsPeriodLabel} ${g.validFromLabel} ${g.validToLabel}</p>
                <p>${g.grantedAtLabel} ${g.grantedByLabel}</p>
                ${this.action('Details', { type: 'grantSelected', id: g.id })}${g.canRevoke
                  ? this.action('Revoke', { type: 'revokeRequested', grantId: g.id })
                  : nothing}
              </article>`,
          )
        : nothing}
      ${m.pendingRevoke
        ? confirmation(
            m.pendingRevoke,
            () => {
              const id = m.pendingRevoke!.grantId;
              if (
                this.model?.pendingRevoke?.grantId === id &&
                this.model.grants.some((g) => g.id === id && g.canRevoke)
              )
                this.send({ type: 'revokeConfirmed', grantId: id });
            },
            () => {
              if (this.model?.pendingRevoke?.grantId === m.pendingRevoke!.grantId)
                this.send({ type: 'revokeDismissed' });
            },
          )
        : nothing}`,
    );
  }
}
export class EmrAccessLogElement extends EmrModelElement<AccessLogViewModel, AccessLogIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Access log',
      html`${m.periodOptions
        ? selection('Period', m.periodOptions, m.selectedPeriod, (id) =>
            this.send({ type: 'periodSelected', id }),
          )
        : nothing}${stateMessage(m.state, m.message)}${m.state === 'error'
        ? this.action('Retry', { type: 'retryRequested' })
        : nothing}
      ${m.state === 'ready'
        ? m.entries.map(
            (e) =>
              html`<article>
                <strong>${e.actionLabel}</strong> ${badge(e.badge)}
                <p>${e.atLabel} · ${e.actorLabel} ${e.actorRoleLabel} ${e.organisationLabel}</p>
                <p>${e.dataLabel} ${e.purposeLabel}</p>
                ${this.action('Details', { type: 'entrySelected', id: e.id })}${e.canReportConcern
                  ? this.action('Report concern', { type: 'concernRequested', entryId: e.id })
                  : nothing}
              </article>`,
          )
        : nothing}
      ${m.canLoadMore ? this.action('Load more', { type: 'loadMoreRequested' }) : nothing}`,
    );
  }
}
export class EmrRightsRequestsElement extends EmrModelElement<RightsRequestsViewModel, RightsRequestsIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const d = m.draft;
    return this.panel(
      'Rights requests',
      html`${m.notice ? html`<p role="status">${m.notice.text}</p>` : nothing}${stateMessage(
        m.state,
        m.message,
      )}${m.state === 'error' ? this.action('Retry', { type: 'retryRequested' }) : nothing}${m.state ===
      'ready'
        ? m.requests.map(
            (r) =>
              html`<article>
                <strong>${r.kindLabel}</strong> ${badge(r.statusBadge)}
                <p>${r.submittedAtLabel} ${r.dueLabel}</p>
                <p>${r.summary}</p>
                <p>${r.responseText}</p>
                ${this.action('Details', { type: 'requestSelected', id: r.id })}${r.canWithdraw
                  ? this.action('Withdraw', { type: 'withdrawRequested', requestId: r.id })
                  : nothing}
              </article>`,
          )
        : nothing}
      ${!d
        ? this.action('New request', { type: 'newRequestStarted' })
        : html`${selection('Request type', d.kindOptions, d.kind, (id) => {
              const option = d.kindOptions.find((o) => o.id === id);
              if (option) this.send({ type: 'kindSelected', kind: option.id });
            })}${d.kindOptions.find((o) => o.id === d.kind)?.description}
            <p>${d.guidance}</p>
            <label
              >${d.descriptionLabel}<textarea
                class="emr-control"
                .value=${live(d.description ?? '')}
                @input=${(e: Event) => this.send({ type: 'descriptionChanged', value: inputValue(e) })}
              >
              </textarea>
            </label>
            <span role="status">${d.descriptionError}</span>
            ${d.nominee
              ? (['name', 'relationship', 'contact'] as const).map(
                  (k) =>
                    html`<label
                        >${k}<input
                          class="emr-control"
                          .value=${live(d.nominee?.[k] ?? '')}
                          @input=${(e: Event) =>
                            this.send({
                              type: 'nomineeChanged',
                              name: d.nominee?.name,
                              relationship: d.nominee?.relationship,
                              contact: d.nominee?.contact,
                              [k]: inputValue(e),
                            })}
                        />
                      </label>
                      <span role="status">${d.nominee?.[`${k}Error`]}</span>`,
                )
              : nothing}
            <p>${d.attachmentsLabel}</p>
            ${d.canAttach ? this.action('Attach', { type: 'attachRequested' }) : nothing}
            <p role="status">${d.submitError}</p>
            ${d.canSubmit ? this.action('Submit', { type: 'draftSubmitted' }) : nothing}${this.action(
              'Cancel',
              { type: 'draftCancelled' },
            )}`}
      ${m.pendingWithdrawal
        ? confirmation(
            m.pendingWithdrawal,
            () => {
              const id = m.pendingWithdrawal!.requestId;
              if (
                this.model?.pendingWithdrawal?.requestId === id &&
                this.model.requests.some((r) => r.id === id && r.canWithdraw)
              )
                this.send({ type: 'withdrawConfirmed', requestId: id });
            },
            () => {
              if (this.model?.pendingWithdrawal?.requestId === m.pendingWithdrawal!.requestId)
                this.send({ type: 'withdrawDismissed' });
            },
          )
        : nothing}`,
    );
  }
}
export class EmrPrivacyCentreElement extends EmrModelElement<PrivacyCentreViewModel, PrivacyCentreIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.title,
      html`<nav aria-label="Privacy sections">
          ${m.sections.map(
            (s) =>
              html`<button
                type="button"
                class="emr-btn"
                aria-current=${s.id === m.activeSection ? 'page' : nothing}
                @click=${() => this.send({ type: 'sectionSelected', id: s.id })}
              >
                ${s.label}
              </button>`,
          )}
        </nav>
        ${m.tiles.map(
          (t) =>
            html`<button
              type="button"
              class="emr-btn"
              @click=${() => this.send({ type: 'tileSelected', key: t.key })}
            >
              ${t.label}: ${t.value} ${t.sub} ${badge(t.status)}
            </button>`,
        )}
        <p>${m.contactText}</p>`,
    );
  }
}
export class EmrPatientIdentityCardElement extends EmrModelElement<
  PatientIdentityViewModel,
  PatientIdentityIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Patient identity',
      html`${identity(m)}${m.alerts?.map(
        (a) =>
          html`<div role="status">
            ${a.text}
            ${a.actionLabel
              ? this.action(a.actionLabel, { type: 'alertActionRequested', id: a.id })
              : nothing}
          </div>`,
      )}${m.addableSystems?.map((s) =>
        this.action(`Add ${s.label}`, { type: 'addIdentifierRequested', system: s.system }),
      )}${this.action('Confirm', { type: 'confirmRequested' })}${this.action('Not this patient', {
        type: 'notThisPatientRequested',
      })}`,
    );
  }
}
export class EmrIdentifierCheckPromptElement extends EmrModelElement<
  IdentifierCheckViewModel,
  IdentifierCheckIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Identifier check',
      html`<p>${m.identifier.label}: ${m.identifier.display}</p>
        <p>${m.outcome}</p>
        ${m.findings.map(
          (f) =>
            html`<article>
              <strong>${f.message}</strong>${f.evidence.map(
                (e) => html`<div>${e.label}: ${e.value}</div>`,
              )}${f.candidate
                ? html`${identity(f.candidate)}${m.outcome === 'blocked'
                    ? this.action('Merge', { type: 'mergeRequested', candidateId: f.candidate.id })
                    : nothing}`
                : nothing}${m.outcome === 'warnings'
                ? html`<label>
                    <input
                      type="checkbox"
                      .checked=${live(!!f.acknowledged)}
                      @change=${() => this.send({ type: 'findingAcknowledged', findingId: f.id })}
                    />I have reviewed this</label
                  >`
                : nothing}
            </article>`,
        )}${m.outcome !== 'blocked' && m.canConfirm
          ? this.action('Confirm', { type: 'confirmRequested' })
          : nothing}${m.outcome !== 'blocked' && m.canAddAsAdditional
          ? this.action('Add as additional', { type: 'addAsAdditional' })
          : nothing}${m.outcome !== 'blocked' && m.canReplaceExisting
          ? this.action('Replace existing', { type: 'replaceExisting' })
          : nothing}${m.outcome === 'blocked'
          ? this.action('Re-enter', { type: 'reenterRequested' })
          : nothing}${this.action('Cancel', { type: 'cancelled' })}`,
    );
  }
}
export class EmrLinkCardsElement extends EmrModelElement<LinkCardsViewModel, LinkCardsIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Link cards',
      html`${identity(m.patient)}<emr-identifier-entry
          .model=${m.entry}
          @intent=${(e: CustomEvent<IdentifierEntryIntent>) => {
            e.stopPropagation();
            if (this.model?.entry.readOnly) return;
            if (e.detail.type === 'valueChanged') {
              this.send({ type: 'entryChanged', raw: e.detail.raw });
            } else {
              this.send(e.detail);
            }
          }}
        >
        </emr-identifier-entry
        >${!m.entry.readOnly ? this.action('Add card', { type: 'cardEntered' }) : nothing}
        ${m.cards.map(
          (c) =>
            html`<article>
              <strong>${c.display}</strong> ${badge(c.statusBadge)}
              <p>${c.message}</p>
              ${c.warnings?.map((w) => html`<p>${w}</p>`)}${c.state === 'on_other_patient' && c.candidate
                ? html`${identity(c.candidate)}${this.action('Same patient', {
                    type: 'sameConfirmed',
                    id: c.id,
                  })}${this.action('Different patient', { type: 'notSameConfirmed', id: c.id })}`
                : nothing}<label>
                <input
                  type="radio"
                  name="primary-card"
                  .checked=${live(m.primaryCardId === c.id)}
                  @change=${() => this.send({ type: 'primarySelected', id: c.id })}
                />Primary card</label
              >${this.action('Remove', { type: 'cardRemoved', id: c.id })}
            </article>`,
        )}
        <p role="status">${m.submitError}</p>
        ${m.canSubmit ? this.action('Submit', { type: 'submitRequested' }) : nothing}${this.action('Cancel', {
          type: 'cancelled',
        })}`,
    );
  }
}
export class EmrContactAttemptFormElement extends EmrModelElement<
  ContactAttemptViewModel,
  ContactAttemptIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      m.reasonLabel,
      html`${selection('Number', m.numberOptions, m.selectedNumber, (id) =>
          this.send({ type: 'numberSelected', id }),
        )}${m.selectedNumber
          ? this.action('Call', { type: 'callRequested', numberId: m.selectedNumber })
          : nothing}${selection('Channel', m.channelOptions, m.selectedChannel, (id) =>
          this.send({ type: 'channelSelected', id }),
        )}<label>
          <input
            type="checkbox"
            .checked=${live(m.reached ?? false)}
            @change=${(e: Event) =>
              this.send({ type: 'reachedChanged', reached: (e.target as HTMLInputElement).checked })}
          />Reached the patient</label
        >${selection('Outcome', m.outcomeOptions, m.selectedOutcome, (id) =>
          this.send({ type: 'outcomeSelected', id }),
        )}
        <p>${m.consequence}</p>
        <label
          >Next action date<input
            type="date"
            class="emr-control"
            .value=${live(m.nextActionDate ?? '')}
            @input=${(e: Event) => this.send({ type: 'nextActionDateChanged', date: inputValue(e) || null })}
          />
        </label>
        <span role="status">${m.nextActionDateError}</span>
        <label
          >Note<textarea
            class="emr-control"
            .value=${live(m.note ?? '')}
            @input=${(e: Event) => this.send({ type: 'noteChanged', note: inputValue(e) })}
          >
          </textarea>
        </label>
        <p role="status">${m.submitError}</p>
        ${m.canSubmit ? this.action('Save attempt', { type: 'submitRequested' }) : nothing}${this.action(
          'Cancel',
          { type: 'cancelled' },
        )}`,
    );
  }
}
export class EmrContactAttemptSummaryElement extends EmrModelElement<
  ContactAttemptSummaryView,
  ContactAttemptSummaryIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`${badge(m.statusBadge)} ${m.text}
    ${this.action('Log attempt', { type: 'logAttemptRequested' })}`;
  }
}
export class EmrMergeCompareElement extends EmrModelElement<MergeCompareViewModel, MergeCompareIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Compare records',
      html`<fieldset>
          <legend>Surviving record</legend>
          ${m.sources.map(
            (s) =>
              html`<div>
                ${identity(s)}<label>
                  <input
                    type="radio"
                    name="survivor"
                    .checked=${live(m.survivorSourceId === s.id)}
                    @change=${() => this.send({ type: 'survivorChosen', sourceId: s.id })}
                  />Keep ${s.label || s.name}</label
                >
              </div>`,
          )}
        </fieldset>
        ${m.rows.map(
          (r) =>
            html`<fieldset>
              <legend>${r.label} · ${r.differs ? 'Differs' : 'Same'}</legend>
              ${m.sources.map(
                (s) =>
                  html`<div>
                    ${s.label || s.name}:
                    ${r.values[s.id] ?? ''}${r.differs
                      ? html`<label>
                          <input
                            type="radio"
                            name=${`row-${r.id}`}
                            .checked=${live(r.chosenSourceId === s.id)}
                            @change=${() => this.send({ type: 'fieldChosen', rowId: r.id, sourceId: s.id })}
                          />Use ${s.label || s.name} value for ${r.label}</label
                        >`
                      : nothing}
                  </div>`,
              )}
            </fieldset>`,
        )}${m.canConfirm ? this.action('Confirm merge', { type: 'mergeConfirmed' }) : nothing}${this.action(
          'Reject',
          { type: 'rejected' },
        )}${this.action('Cancel', { type: 'cancelled' })}`,
    );
  }
}
export class EmrDraftRecordListElement extends EmrModelElement<
  DraftRecordListViewModel,
  DraftRecordListIntent
> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(
      'Draft records',
      html`${stateMessage(m.state, m.message)}${m.state === 'error'
        ? this.action('Retry', { type: 'retryRequested' })
        : nothing}${m.state === 'ready'
        ? m.rows.map(
            (r) =>
              html`<article>
                <strong>${r.title}</strong> ${badge(r.stateBadge)}
                <p>${r.subtitle} ${r.patientLabel}</p>
                <p>Updated: ${r.updatedAtLabel}</p>
                ${r.canOpen ? this.action('Open', { type: 'rowOpened', id: r.id }) : nothing}${r.canMove
                  ? this.action('Move to another patient', { type: 'moveToPatientRequested', id: r.id })
                  : nothing}${r.canDiscard
                  ? this.action('Discard', { type: 'discardRequested', id: r.id })
                  : nothing}
              </article>`,
          )
        : nothing}
      ${m.pendingDiscard
        ? confirmation(
            m.pendingDiscard,
            () => {
              const id = m.pendingDiscard!.id;
              if (
                this.model?.pendingDiscard?.id === id &&
                this.model.rows.some((r) => r.id === id && r.canDiscard)
              )
                this.send({ type: 'discardConfirmed', id });
            },
            () => {
              if (this.model?.pendingDiscard?.id === m.pendingDiscard!.id)
                this.send({ type: 'discardDismissed' });
            },
          )
        : nothing}`,
    );
  }
}

export function registerL4PrivacyIdentityElements(): void {
  registerL2Elements();
  defineEmrElement('emr-consent-capture', EmrConsentCaptureElement);
  defineEmrElement('emr-consent-review', EmrConsentReviewElement);
  defineEmrElement('emr-consent-receipt', EmrConsentReceiptElement);
  defineEmrElement('emr-consent-status-badge', EmrConsentStatusBadgeElement);
  defineEmrElement('emr-sharing-grants', EmrSharingGrantsElement);
  defineEmrElement('emr-access-log', EmrAccessLogElement);
  defineEmrElement('emr-rights-requests', EmrRightsRequestsElement);
  defineEmrElement('emr-privacy-centre', EmrPrivacyCentreElement);
  defineEmrElement('emr-patient-identity-card', EmrPatientIdentityCardElement);
  defineEmrElement('emr-identifier-check-prompt', EmrIdentifierCheckPromptElement);
  defineEmrElement('emr-link-cards', EmrLinkCardsElement);
  defineEmrElement('emr-contact-attempt-form', EmrContactAttemptFormElement);
  defineEmrElement('emr-contact-attempt-summary', EmrContactAttemptSummaryElement);
  defineEmrElement('emr-merge-compare', EmrMergeCompareElement);
  defineEmrElement('emr-draft-record-list', EmrDraftRecordListElement);
}
