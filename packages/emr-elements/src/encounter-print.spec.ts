// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { EmrEncounterSummaryPrintElement } from './l4-domain.js';
import type { EncounterSummaryPrintViewModel } from '@drguptavivek/emr-controller';

it('renders supplied discharge sections and preserves controlled document actions', async () => {
  if (!customElements.get('test-encounter-print')) customElements.define('test-encounter-print', EmrEncounterSummaryPrintElement);
  const el = document.createElement('test-encounter-print') as EmrEncounterSummaryPrintElement;
  el.model = {
    documentMode:'ipd-discharge',facilityName:'Facility',facilityDepartment:'Eye care',encounterDateLabel:'Today',encounterId:'E1',patientName:'Example',patientAgeSex:'30',patientIdentifiers:[{label:'Record',value:'A1'}],careSettingLabel:'Ward',allergiesSummary:['Allergy A'],chronicConditionsSummary:['Condition A'],vitalsSummary:[{label:'Pulse',value:'80'}],
    diagnoses:[{id:'d',code:'D1',label:'Diagnosis A',status:'confirmed'}],historySummary:[{code:'H1',value:'History A'}],examinationSummary:[{code:'E1',value:'Exam A'}],pacsKeyFindingsSummary:['Finding A'],prescriptions:[],
    investigations:[{id:'i',category:'Lab / Pathology',code:'I1',name:'Test A',priority:'Routine',indication:'Indication A',status:'Ordered'}],treatmentAdvises:['Advice A'],
    crossConsultations:[{id:'c',careSetting:'ipd',targetSpecialty:'Specialty A',targetConsultant:'Clinician A',urgency:'Routine',reasonForConsult:'Reason A',clinicalQuestion:'Question A',locationOrClinic:'Ward A',status:'Requested'}],followUpDateLabel:'Follow-up A',prescriberName:'Clinician',prescriberRegNo:'R1',
  } satisfies EncounterSummaryPrintViewModel;
  const intents: unknown[] = []; el.addEventListener('intent', e => intents.push((e as CustomEvent).detail)); document.body.append(el);
  try {
    await el.updateComplete;
    for (const value of ['A1','Ward','Allergy A','Condition A','Pulse','Diagnosis A','History A','Exam A','Finding A','Test A','Advice A','Question A','Follow-up A','R1']) expect(el.shadowRoot!.textContent).toContain(value);
    el.shadowRoot!.querySelector<HTMLButtonElement>('.print-toolbar button')!.click();
    expect(intents).toEqual([{type:'documentModeChanged',mode:'opd-rx'}]);
    expect(el.model.documentMode).toBe('ipd-discharge');
  } finally { el.remove(); }
});
