import '@angular/compiler';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  EmrClinicalMatrixComponent,
  EmrDocumentViewerComponent,
  EmrFieldGeneratorComponent,
  EmrPacChecklistComponent,
  EmrPrescribingTableComponent,
  EmrRightFlyoutComponent,
  EmrSpecialtyExamMatrixComponent,
  EmrTemplateComposerComponent,
  EmrTimelineComponent
} from '../dist/emr-ui/fesm2022/drguptavivek-emr-ui.mjs';
import { ClinicalMatrixController, derivePreview } from '../packages/emr-controller/dist/index.js';
import { matrixSchema, matrixValues } from '../examples/clinical-matrix/fixture.ts';
import { makeSpecialtyExamFixture, reduceSpecialtyExamFixture } from '../packages/emr-react/harness/gallery/specialty-exam.fixture.ts';

export class EmrSsrHostComponent {
  matrixController = new ClinicalMatrixController(matrixSchema, matrixValues);
  matrixState = signal(this.matrixController.getSnapshot());
  matrixSnapshot = this.matrixState.asReadonly();

  constructor() {
    const unsubscribe = this.matrixController.subscribe(state => this.matrixState.set(state));
    inject(DestroyRef).onDestroy(() => {
      unsubscribe();
      this.matrixController.destroy();
    });
  }

  events = [{ id: 'enc-1', occurredAt: '2026-08-19T09:00:00Z', dateLabel: '19 Aug 2026', title: 'Review', kindId: 'encounter' }];
  kinds = [{ id: 'encounter', label: 'Encounter', tone: 'info' }];
  reusableField = { schemaVersion: '1.0', id: 'ssr-weight', revision: 1, label: 'Weight', type: 'quantity', required: true, repeats: false, unit: 'kg', unitSystem: 'UCUM', unitCode: 'kg', validationRules: [], terminologyBindings: [] };
  fieldGenerator = { draft: this.reusableField, sources: [], terminologySearches: {}, validationErrors: {}, saving: false, dirty: false };
  templateDefinition = { schemaVersion: '1.0', id: 'ssr-general-examination', revision: 1, title: 'SSR reusable template', locale: 'en-IN', status: 'draft', sections: [{ id: 'general', label: 'General examination', fields: [{ id: 'weight-placement', sourceFieldId: this.reusableField.id, sourceFieldRevision: this.reusableField.revision, field: this.reusableField }] }] };
  templateComposer = { template: this.templateDefinition, fieldLibrary: [this.reusableField], fieldLibraryQuery: '', selectedSectionId: 'general', preview: derivePreview(this.templateDefinition), loading: false, saving: false, dirty: false };
  pac = { instanceId: 'ssr-pac', title: 'SSR PAC checklist', context: [{ id: 'procedure', label: 'Procedure', value: 'Synthetic procedure' }], form: { schema: { id: 'ssr-pac-form', label: 'PAC form', sections: [{ id: 'history', label: 'History', blocks: [{ id: 'history-note', label: 'History note', type: 'text' }] }] }, fields: { 'history-note': { value: 'Controller supplied' } }, repeatableGroups: {} }, actions: [{ id: 'save', label: 'Save draft', tone: 'secondary' }] };
  documentViewer = { instanceId: 'ssr-viewer', open: true, currentDocument: { documentId: 'doc-1', title: 'SSR document', fileName: 'ssr-page.png', categoryLabel: 'Clinical', folderLabel: 'Encounter', createdAtLabel: '19 Aug 2026', kind: 'image', pageCount: 1 }, documentIndex: 0, documentCount: 1, pageIndex: 0, page: { assetId: 'asset-1', documentId: 'doc-1', pageIndex: 0, pageLabel: 'Page 1', rasterUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', altText: 'Synthetic document page' }, loading: false, canPreviousDocument: false, canNextDocument: false, canPreviousPage: false, canNextPage: false };
  fundusExam = {
    ...makeSpecialtyExamFixture(),
    ophthalmicRows: [{
      id: 'disc', segment: 'Posterior Segment', structureLabel: 'Optic disc',
      odValue: '', osValue: 'Supplied left finding', normalDefault: '', quickChips: [],
    }],
  };
  fundusIntent = '';
  prescribingIntent = '';
  prescribing = { slotDefinitions: [], rows: [{
    id: 'blank-rx', drugName: '', strength: '', form: 'other', formLabel: '', route: '',
    doseAmount: null, slots: [], unitLabel: '', durationCount: null, durationUnit: 'days', foodRelation: '', instructions: '',
  }] };

  recordFundusIntent(intent) {
    this.fundusIntent = JSON.stringify(intent);
    if (intent.type !== 'ophthalmicCellChanged') {
      this.fundusExam = reduceSpecialtyExamFixture(this.fundusExam, intent);
    }
  }

  dispatchMatrixIntent(intent) {
    this.matrixController.dispatch(intent);
  }

  lockFundusExam() {
    this.fundusExam = { ...this.fundusExam, readOnly: true };
  }

  closedDocumentViewer = { ...this.documentViewer, instanceId: 'ssr-viewer-closed', open: false };
}

Component({
  selector: 'emr-ssr-host',
  standalone: true,
  imports: [EmrClinicalMatrixComponent, EmrDocumentViewerComponent, EmrFieldGeneratorComponent, EmrPacChecklistComponent, EmrPrescribingTableComponent, EmrRightFlyoutComponent, EmrSpecialtyExamMatrixComponent, EmrTemplateComposerComponent, EmrTimelineComponent],
  template: `
    <emr-right-flyout [open]="true" title="Review orders"><p>Controller-supplied panel content</p></emr-right-flyout>
    <emr-timeline orientation="horizontal" [events]="events" [kinds]="kinds" selectedId="enc-1" />
    <emr-clinical-matrix [definition]="matrixSnapshot().schema" [model]="matrixSnapshot().values" (intent)="dispatchMatrixIntent($event)" />
    <output id="matrix-values">
      <span>Accepted OD: {{ matrixSnapshot().values.disc.cells.od.value ?? '' }}</span>
      <span>Accepted OS: {{ matrixSnapshot().values.disc.cells.os.value ?? '' }}</span>
    </output>
    <emr-specialty-exam-matrix [model]="fundusExam" (intent)="recordFundusIntent($event)" />
    <output id="fundus-intent">{{ fundusIntent }}</output>
    <button type="button" (click)="lockFundusExam()">Lock fundus exam</button>
    <emr-prescribing-table [model]="prescribing" (intent)="prescribingIntent = $event.type" />
    <output id="prescribing-intent">{{ prescribingIntent }}</output>
    <emr-field-generator [model]="fieldGenerator" />
    <emr-template-composer [model]="templateComposer" />
    <emr-pac-checklist [model]="pac" />
    <emr-document-viewer [model]="documentViewer" />
    <emr-document-viewer [model]="closedDocumentViewer" />
  `
})(EmrSsrHostComponent);
