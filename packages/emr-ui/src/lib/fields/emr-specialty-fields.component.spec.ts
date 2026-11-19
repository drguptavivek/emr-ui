import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const specialtySrc = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/fields/emr-specialty-fields.component.ts'),
  'utf8',
);

const segSrc = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/primitives/emr-action-controls.component.ts'),
  'utf8',
);

const choiceSrc = readFileSync(
  join(process.cwd(), 'packages/emr-ui/src/lib/primitives/emr-choice.component.ts'),
  'utf8',
);

const [lateralitySection, afterLaterality = ''] = specialtySrc.split('// 12. EmrVisualAcuityFieldComponent');
const [visualAcuitySection, refractionSection = ''] = afterLaterality.split('// 13. EmrRefractionFieldComponent');

describe('EmrLateralityFieldComponent contract', () => {
  it('uses type-only controller imports and exposes all canonical L2 inputs and outputs without disabled', () => {
    expect(specialtySrc).not.toMatch(
      /import\s+(?!type\b)[^;]*from\s+['"]@drguptavivek\/emr-controller['"]/,
    );
    expect(lateralitySection).toContain("selector: 'emr-laterality-field'");
    for (const inputName of [
      'model',
      'definition',
      'controlId',
      'headingId',
      'labelHidden',
      'layout',
      'showMetadata',
      'readOnly',
      'size',
      'clearable',
    ]) {
      expect(lateralitySection).toMatch(new RegExp(`readonly\\s+${inputName}\\s*=\\s*input`));
    }
    for (const outputName of ['intent', 'cleared', 'focused', 'blurred']) {
      expect(lateralitySection).toMatch(new RegExp(`readonly\\s+${outputName}\\s*=\\s*output<`));
    }
    expect(lateralitySection).not.toMatch(/readonly\s+disabled\s*=\s*input/);
  });

  it('composes EmrFieldFrame (labelNamesControl=false), EmrSegmentedControl (-control, no duplicate alert), and EmrCheckbox (-confirm)', () => {
    expect(lateralitySection).toContain('[labelNamesControl]="false"');
    expect(lateralitySection).toContain("[controlId]=\"resolvedId() + '-control'\"");
    expect(lateralitySection).toContain('[ariaLabelledBy]="groupLabelledBy()"');
    expect(lateralitySection).toContain('[ariaDescribedBy]="describedBy()"');
    expect(lateralitySection).toContain('[allowDeselect]="false"');
    expect(lateralitySection).toContain('[clearable]="resolvedClearable()"');
    expect(lateralitySection).toContain('[invalid]="vs.groupHasError"');
    expect(lateralitySection).toContain('[hasWarning]="vs.groupHasWarning"');
    expect(lateralitySection).toContain("[controlId]=\"resolvedId() + '-confirm'\"");
    expect(lateralitySection).toContain('[invalid]="vs.confirmationHasError"');
    expect(lateralitySection).toContain('[hasWarning]="vs.confirmationHasWarning"');
    // No ad-hoc text-only Clear button outside EmrSegmentedControl
    expect(lateralitySection).not.toContain('emr-button--ghost');
    // Zero duplicate error binding on segmented control
    expect(lateralitySection).not.toContain('[error]="');
    // Forwards 6-state status changes
    expect(lateralitySection).toContain("ev.type === 'statusChangeRequested'");
  });

  it('supports ariaLabelledBy, ariaDescribedBy, hasWarning, and lg size on L1 EmrSegmentedControlComponent & EmrCheckboxComponent', () => {
    expect(segSrc).toContain('readonly ariaLabelledBy = input');
    expect(segSrc).toContain('readonly ariaDescribedBy = input');
    expect(segSrc).toContain('readonly hasWarning = input');
    expect(segSrc).toContain("emr-segmented--lg");
    expect(segSrc).toContain('validationState().hasWarning && warning()');

    expect(choiceSrc).toContain('readonly invalid = input');
    expect(choiceSrc).toContain('readonly hasWarning = input');
    expect(choiceSrc).toContain('readonly ariaDescribedBy = input');
  });
});

describe('EmrVisualAcuityFieldComponent contract', () => {
  it('exposes all canonical L2 inputs and outputs without disabled or native selects', () => {
    expect(visualAcuitySection).toContain("selector: 'emr-visual-acuity-field'");
    for (const inputName of [
      'model',
      'definition',
      'controlId',
      'headingId',
      'labelHidden',
      'layout',
      'showMetadata',
      'readOnly',
      'size',
      'clearable',
    ]) {
      expect(visualAcuitySection).toMatch(new RegExp(`readonly\\s+${inputName}\\s*=\\s*input`));
    }
    for (const outputName of ['intent', 'focused', 'blurred']) {
      expect(visualAcuitySection).toMatch(new RegExp(`readonly\\s+${outputName}\\s*=\\s*output<`));
    }
    expect(visualAcuitySection).not.toMatch(/readonly\s+disabled\s*=\s*input/);
    expect(visualAcuitySection).not.toContain('<select');
  });

  it('delegates frame/status to EmrFieldFrame and composes EmrSegmentedControl, EmrSelect, and eye badge', () => {
    expect(visualAcuitySection).toContain('[labelNamesControl]="false"');
    expect(visualAcuitySection).toContain("ev.type === 'statusChangeRequested'");
    expect(visualAcuitySection).toContain('icon="eye"');
    expect(visualAcuitySection).toContain("[controlId]=\"resolvedId() + '-notation'\"");
    expect(visualAcuitySection).toContain("[controlId]=\"resolvedId() + '-correction'\"");
    expect(visualAcuitySection).toContain("[controlId]=\"resolvedId() + '-value'\"");
    expect(visualAcuitySection).toContain("[controlId]=\"resolvedId() + '-pinhole'\"");
    expect(visualAcuitySection).toContain('[tabularNums]="true"');
    expect(visualAcuitySection).toContain('[invalid]="pv.valueHasError"');
    expect(visualAcuitySection).toContain('[invalid]="pv.pinholeHasError"');
    expect(visualAcuitySection).toContain('[hasWarning]="pv.valueHasWarning"');
    expect(visualAcuitySection).toContain('[hasWarning]="pv.pinholeHasWarning"');
    expect(visualAcuitySection).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
  });
});

describe('EmrRefractionFieldComponent contract', () => {
  it('exposes all canonical L2 inputs and outputs without disabled or native selects', () => {
    expect(refractionSection).toContain("selector: 'emr-refraction-field'");
    for (const inputName of [
      'model',
      'definition',
      'controlId',
      'headingId',
      'labelHidden',
      'layout',
      'showMetadata',
      'readOnly',
      'size',
      'clearable',
    ]) {
      expect(refractionSection).toMatch(new RegExp(`readonly\\s+${inputName}\\s*=\\s*input`));
    }
    for (const outputName of ['intent', 'focused', 'blurred']) {
      expect(refractionSection).toMatch(new RegExp(`readonly\\s+${outputName}\\s*=\\s*output<`));
    }
    expect(refractionSection).not.toMatch(/readonly\s+disabled\s*=\s*input/);
    expect(refractionSection).not.toContain('<select');
  });

  it('delegates frame/status to EmrFieldFrame, binds badge labels, uses unique sub-IDs, and keeps 0 color literals', () => {
    expect(refractionSection).toContain('[labelNamesControl]="false"');
    expect(refractionSection).toContain("ev.type === 'statusChangeRequested'");
    expect(refractionSection).toContain('[label]="m.eye"');
    expect(refractionSection).toContain('icon="eye"');
    expect(refractionSection).toContain('[label]="m.formattedSummary"');
    expect(refractionSection).toContain("resolvedId() + '-' + part.key");
    expect(refractionSection).toContain('role="spinbutton"');
    expect(refractionSection).toContain('[attr.aria-invalid]="part.validation.hasError ? \'true\' : null"');
    expect(refractionSection).toContain('[attr.data-warning]="!part.validation.hasError && part.validation.hasWarning ? \'true\' : null"');
    expect(refractionSection).toContain("type: 'clearRequested'");
    expect(refractionSection).toContain('minmax(196px, 1fr)');
    expect(refractionSection).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
  });
});
