// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { registerL4PrivacyIdentityElements, type EmrConsentCaptureElement, type EmrSharingGrantsElement, type EmrLinkCardsElement, type EmrDraftRecordListElement, type EmrMergeCompareElement, type EmrContactAttemptFormElement, type EmrRightsRequestsElement, type EmrAccessLogElement, type EmrIdentifierCheckPromptElement, type EmrConsentReviewElement } from './l4-privacy-identity.js';

registerL4PrivacyIdentityElements();
const patient = { name: 'Example', ageLabel: '30 years', sexLabel: 'X', identifiers: [] };
const button = (el: HTMLElement, label: string) => [...el.shadowRoot!.querySelectorAll('button')].find(b => b.textContent?.trim() === label)!;
const events = (el: HTMLElement) => { const values: unknown[] = []; el.addEventListener('intent', e => values.push((e as CustomEvent).detail)); return values; };

describe('Lit privacy and identity surfaces', () => {
  it('renders consent choices without allowing essential or locked decisions', async () => {
    const el = document.createElement('emr-consent-capture') as EmrConsentCaptureElement;
    el.model = { notice: {title:'Notice', sections:[], version:'v1', languageLabel:'English'}, languageOptions:[], selectedLanguage:'en', categories:[{id:'c',label:'Use',mode:'per_purpose',purposes:[{id:'e',label:'Care',description:'Care',essential:true},{id:'p',label:'Research',description:'Research',essential:false,locked:true}]}], givenByOptions:[], methodOptions:[], canSubmit:false };
    const intents = events(el); document.body.append(el);
    try { await el.updateComplete; expect(el.shadowRoot!.textContent).toContain('Essential'); expect(el.shadowRoot!.querySelectorAll('input[type=radio]')).toHaveLength(2); expect(el.shadowRoot!.querySelector('fieldset')!.disabled).toBe(true); expect(button(el, 'Submit')).toBeUndefined(); expect(intents).toEqual([]); } finally { el.remove(); }
  });
  it('shows only permitted grant actions and emits controlled confirmation', async () => {
    const el = document.createElement('emr-sharing-grants') as EmrSharingGrantsElement;
    el.model = {state:'ready', grants:[{id:'g',recipientLabel:'Hospital',purposeLabel:'Care',dataScope:['Reports'],validFromLabel:'Today',statusBadge:{label:'Active',tone:'info'},canRevoke:false}], pendingRevoke:{grantId:'g',title:'Confirm',body:'Proceed?',confirmLabel:'Yes',cancelLabel:'No'}};
    const intents = events(el); document.body.append(el);
    try { await el.updateComplete; expect(button(el,'Revoke')).toBeUndefined(); el.model={...el.model!,grants:el.model!.grants.map(g => ({...g,canRevoke:true}))}; await el.updateComplete; button(el,'Yes').click(); expect(intents).toEqual([{type:'revokeConfirmed',grantId:'g'}]); } finally { el.remove(); }
  });
  it('forwards identifier child events once and blocks locked input', async () => {
    const el = document.createElement('emr-link-cards') as EmrLinkCardsElement;
    el.model = {patient,entry:{label:'Card',value:''},cards:[],canSubmit:false};
    const intents = events(el); document.body.append(el);
    try { await el.updateComplete; const child = el.shadowRoot!.querySelector('emr-identifier-entry')!; await child.updateComplete; const input = child.shadowRoot!.querySelector('input')!; input.value='123'; input.dispatchEvent(new Event('input',{bubbles:true})); expect(intents).toEqual([{type:'entryChanged',raw:'123'}]); el.model={...el.model!,entry:{label:'Card',value:'',readOnly:true}}; await el.updateComplete; child.dispatchEvent(new CustomEvent('intent',{detail:{type:'scanRequested'},bubbles:true,composed:true})); expect(intents).toHaveLength(1); } finally { el.remove(); }
  });
  it('honours draft capabilities and does not confirm until supplied a pending state', async () => {
    const el = document.createElement('emr-draft-record-list') as EmrDraftRecordListElement;
    el.model={state:'ready',rows:[{id:'d',title:'Draft',updatedAtLabel:'Today',stateBadge:{label:'Draft',tone:'info'},canOpen:true,canMove:false,canDiscard:true}]};
    const intents=events(el); document.body.append(el);
    try { await el.updateComplete; expect(button(el,'Move to another patient')).toBeUndefined(); button(el,'Discard').click(); expect(intents).toEqual([{type:'discardRequested',id:'d'}]); el.model={...el.model!,pendingDiscard:{id:'d',title:'Discard?',body:'Confirm',confirmLabel:'Discard now',cancelLabel:'Keep'}}; await el.updateComplete; button(el,'Discard now').click(); expect(intents[1]).toEqual({type:'discardConfirmed',id:'d'}); } finally { el.remove(); }
  });
  it('emits merge and contact actions with supplied identifiers', async () => {
    const merge=document.createElement('emr-merge-compare') as EmrMergeCompareElement;
    merge.model={sources:[{...patient,id:'a'},{...patient,id:'b'}],rows:[{id:'name',label:'Name',values:{a:'A',b:'B'},differs:true}],canConfirm:false};
    const mi=events(merge); document.body.append(merge);
    const contact=document.createElement('emr-contact-attempt-form') as EmrContactAttemptFormElement;
    contact.model={reasonLabel:'Follow up',numberOptions:[{id:'n',label:'Test number'}],selectedNumber:'n',channelOptions:[],outcomeOptions:[],canSubmit:false}; const ci=events(contact); document.body.append(contact);
    try { await Promise.all([merge.updateComplete,contact.updateComplete]); merge.shadowRoot!.querySelectorAll('input')[2]!.dispatchEvent(new Event('change')); expect(mi).toEqual([{type:'fieldChosen',rowId:'name',sourceId:'a'}]); button(contact,'Call').click(); expect(ci).toEqual([{type:'callRequested',numberId:'n'}]); expect(button(contact,'Save attempt')).toBeUndefined(); } finally { merge.remove(); contact.remove(); }
  });
  it('renders rights draft and emits description changes without mutation', async () => {
    const el=document.createElement('emr-rights-requests') as EmrRightsRequestsElement;
    el.model={state:'ready',requests:[],draft:{kindOptions:[],descriptionLabel:'Description',canAttach:false,canSubmit:false}};
    const intents=events(el); document.body.append(el);
    try { await el.updateComplete; const area=el.shadowRoot!.querySelector('textarea')!; area.value='Please correct'; area.dispatchEvent(new Event('input')); expect(intents).toEqual([{type:'descriptionChanged',value:'Please correct'}]); expect(el.model.draft!.description).toBeUndefined(); expect(button(el,'Submit')).toBeUndefined(); } finally { el.remove(); }
  });
  it('limits identifier actions to the supplied outcome and capability', async () => {
    const el=document.createElement('emr-identifier-check-prompt') as EmrIdentifierCheckPromptElement;
    el.model={identifier:{label:'ID',display:'123'},outcome:'blocked',findings:[{id:'f',kind:'on_other_patient',message:'Existing record',evidence:[],candidate:{...patient,id:'p'}}],canConfirm:true,canAddAsAdditional:true,canReplaceExisting:true};
    const intents=events(el); document.body.append(el);
    try { await el.updateComplete; expect(button(el,'Confirm')).toBeUndefined(); expect(button(el,'Add as additional')).toBeUndefined(); button(el,'Merge').click(); expect(intents).toEqual([{type:'mergeRequested',candidateId:'p'}]); el.model={...el.model!,outcome:'warnings',canConfirm:false}; await el.updateComplete; expect(button(el,'Merge')).toBeUndefined(); const checkbox=el.shadowRoot!.querySelector('input')!; checkbox.dispatchEvent(new Event('change')); expect(intents[1]).toEqual({type:'findingAcknowledged',findingId:'f'}); } finally { el.remove(); }
  });
  it('emits access concern and retry only in the appropriate list state', async () => {
    const el=document.createElement('emr-access-log') as EmrAccessLogElement;
    el.model={state:'ready',canLoadMore:false,entries:[{id:'a',atLabel:'Today',actorLabel:'Clinician',actionLabel:'Viewed',dataLabel:'Report',canReportConcern:true}]};
    const intents=events(el); document.body.append(el);
    try { await el.updateComplete; button(el,'Report concern').click(); expect(intents).toEqual([{type:'concernRequested',entryId:'a'}]); el.model={...el.model!,state:'error',message:'Unavailable'}; await el.updateComplete; expect(button(el,'Report concern')).toBeUndefined(); button(el,'Retry').click(); expect(intents[1]).toEqual({type:'retryRequested'}); } finally { el.remove(); }
  });
  it('requires supplied confirmation for consent withdrawal and rights withdrawal', async () => {
    const consent=document.createElement('emr-consent-review') as EmrConsentReviewElement;
    consent.model={patient,noticeVersionLabel:'v1',categories:[{id:'c',label:'Care',purposes:[{id:'p',label:'Purpose',essential:false,statusBadge:{label:'Active',tone:'info'},canWithdraw:true,canGrant:false}]}]};
    const ci=events(consent); document.body.append(consent);
    const rights=document.createElement('emr-rights-requests') as EmrRightsRequestsElement;
    rights.model={state:'ready',requests:[{id:'r',kind:'access',kindLabel:'Access',submittedAtLabel:'Today',statusBadge:{label:'Pending',tone:'info'},canWithdraw:true}]};
    const ri=events(rights); document.body.append(rights);
    try { await Promise.all([consent.updateComplete,rights.updateComplete]); button(consent,'Withdraw').click(); button(rights,'Withdraw').click(); expect(ci).toEqual([{type:'withdrawRequested',purposeId:'p'}]); expect(ri).toEqual([{type:'withdrawRequested',requestId:'r'}]); consent.model={...consent.model!,pendingWithdrawal:{purposeId:'p',title:'Confirm',body:'Continue?',confirmLabel:'Confirm withdrawal',cancelLabel:'Keep'}}; rights.model={...rights.model!,pendingWithdrawal:{requestId:'r',title:'Confirm',body:'Continue?',confirmLabel:'Confirm withdrawal',cancelLabel:'Keep'}}; await Promise.all([consent.updateComplete,rights.updateComplete]); button(consent,'Confirm withdrawal').click(); button(rights,'Keep').click(); expect(ci[1]).toEqual({type:'withdrawConfirmed',purposeId:'p'}); expect(ri[1]).toEqual({type:'withdrawDismissed'}); } finally { consent.remove(); rights.remove(); }
  });

  it('ignores stale confirmation and dismissal when pending state or capability changes', async () => {
    const el = document.createElement('emr-sharing-grants') as EmrSharingGrantsElement;
    el.model = {state:'ready',grants:[{id:'g',recipientLabel:'Hospital',purposeLabel:'Care',dataScope:[],validFromLabel:'Today',statusBadge:{label:'Active',tone:'info'},canRevoke:true}],pendingRevoke:{grantId:'g',title:'Confirm',body:'Proceed?',confirmLabel:'Yes',cancelLabel:'No'}};
    const intents=events(el); document.body.append(el);
    try {
      await el.updateComplete;
      const yes=button(el,'Yes'), no=button(el,'No');
      el.model={...el.model!,pendingRevoke:undefined};
      yes.click(); no.click();
      expect(intents).toEqual([]);
      el.model={...el.model!,pendingRevoke:{grantId:'g',title:'Confirm',body:'Proceed?',confirmLabel:'Yes',cancelLabel:'No'},grants:el.model!.grants.map(g=>({...g,canRevoke:false}))};
      yes.click();
      expect(intents).toEqual([]);
    } finally { el.remove(); }
  });

});
