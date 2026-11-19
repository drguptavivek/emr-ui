import { ChangeDetectionStrategy, Component, Directive, computed, input, output } from '@angular/core';
import type {
  ClinicalListIntent,
  ClinicalListViewModel,
  EmrClinicalListHeadingLevel,
  EmrClinicalListLabels,
} from '@drguptavivek/emr-controller';
import { EmrClinicalListComponent } from '../structures/emr-clinical-list.component';
import { resolveClinicalListHeadingId } from '../structures/emr-clinical-list.logic';

@Directive()
abstract class DomainClinicalListBase {
  readonly model = input.required<ClinicalListViewModel>();
  readonly headingId = input<string>();
  readonly headingLevel = input<EmrClinicalListHeadingLevel>(2);
  readonly labels = input<Partial<EmrClinicalListLabels>>({});

  readonly intent = output<ClinicalListIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();
}

@Component({
  selector: 'emr-medication-list',
  standalone: true,
  imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list
    [model]="resolvedModel()"
    [headingId]="resolvedHeadingId()"
    [headingLevel]="headingLevel()"
    [labels]="labels()"
    (intent)="intent.emit($event)"
    (focused)="focused.emit()"
    (blurred)="blurred.emit()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrMedicationListComponent extends DomainClinicalListBase {
  protected readonly resolvedHeadingId = computed(() =>
    resolveClinicalListHeadingId(this.headingId(), 'emr-medication-list-title'),
  );
  protected readonly resolvedModel = computed<ClinicalListViewModel>(() => {
    const m = this.model();
    return { ...m, title: m.title ?? this.labels().title ?? 'Medications' };
  });
}

@Component({
  selector: 'emr-allergy-list',
  standalone: true,
  imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list
    [model]="resolvedModel()"
    [headingId]="resolvedHeadingId()"
    [headingLevel]="headingLevel()"
    [labels]="labels()"
    (intent)="intent.emit($event)"
    (focused)="focused.emit()"
    (blurred)="blurred.emit()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrAllergyListComponent extends DomainClinicalListBase {
  protected readonly resolvedHeadingId = computed(() =>
    resolveClinicalListHeadingId(this.headingId(), 'emr-allergy-list-title'),
  );
  protected readonly resolvedModel = computed<ClinicalListViewModel>(() => {
    const m = this.model();
    return { ...m, title: m.title ?? this.labels().title ?? 'Allergies' };
  });
}

@Component({
  selector: 'emr-chronic-disease-list',
  standalone: true,
  imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list
    [model]="resolvedModel()"
    [headingId]="resolvedHeadingId()"
    [headingLevel]="headingLevel()"
    [labels]="labels()"
    (intent)="intent.emit($event)"
    (focused)="focused.emit()"
    (blurred)="blurred.emit()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrChronicDiseaseListComponent extends DomainClinicalListBase {
  protected readonly resolvedHeadingId = computed(() =>
    resolveClinicalListHeadingId(this.headingId(), 'emr-chronic-list-title'),
  );
  protected readonly resolvedModel = computed<ClinicalListViewModel>(() => {
    const m = this.model();
    return { ...m, title: m.title ?? this.labels().title ?? 'Chronic diseases' };
  });
}

@Component({
  selector: 'emr-personal-history-list',
  standalone: true,
  imports: [EmrClinicalListComponent],
  template: `<emr-clinical-list
    [model]="resolvedModel()"
    [headingId]="resolvedHeadingId()"
    [headingLevel]="headingLevel()"
    [labels]="labels()"
    (intent)="intent.emit($event)"
    (focused)="focused.emit()"
    (blurred)="blurred.emit()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmrPersonalHistoryListComponent extends DomainClinicalListBase {
  protected readonly resolvedHeadingId = computed(() =>
    resolveClinicalListHeadingId(this.headingId(), 'emr-history-list-title'),
  );
  protected readonly resolvedModel = computed<ClinicalListViewModel>(() => {
    const m = this.model();
    return { ...m, title: m.title ?? this.labels().title ?? 'Significant personal history' };
  });
}
