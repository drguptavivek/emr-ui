import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const libRoot = join(process.cwd(), 'packages/emr-ui/src/lib');
const readLib = (rel: string): string => readFileSync(join(libRoot, rel), 'utf8');
const publicApi = readFileSync(join(process.cwd(), 'packages/emr-ui/src/public-api.ts'), 'utf8');

function listTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listTsFiles(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [full] : [];
  });
}

describe('L1 primitives and L2 clinical fields contracts', () => {
  it('uses zero runtime imports from @drguptavivek/emr-controller across L1 and L2', () => {
    const files = [...listTsFiles(join(libRoot, 'primitives')), ...listTsFiles(join(libRoot, 'fields'))];
    expect(files.length).toBeGreaterThan(20);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(
        text,
        `${relative(process.cwd(), file)} must only use import type from @drguptavivek/emr-controller`,
      ).not.toMatch(/import\s+(?!type\b)[^;]*from\s+['"]@drguptavivek\/emr-controller['"]/);
    }
  });

  it('migrates all L1 primitives to signal input()/output<T>() with unique SSR-safe fallback IDs and labelHidden support', () => {
    const l1Files = [
      'primitives/emr-button.component.ts',
      'primitives/emr-inputs.component.ts',
      'primitives/emr-choice.component.ts',
      'primitives/emr-feedback.component.ts',
      'primitives/emr-search-select.component.ts',
      'primitives/emr-tabs.component.ts',
      'primitives/emr-likert.component.ts',
      'primitives/emr-vas.component.ts',
      'primitives/emr-card-layout.component.ts',
      'primitives/emr-textarea.component.ts',
      'primitives/emr-action-controls.component.ts',
      'primitives/emr-specialized-inputs.component.ts',
      'primitives/emr-pagination.component.ts',
      'primitives/emr-overlays.component.ts',
      'primitives/emr-status-indicators.component.ts',
    ];
    for (const rel of l1Files) {
      const src = readLib(rel);
      expect(src, rel).not.toMatch(/@Input\(|@Output\(|EventEmitter/);
    }

    const inputsSrc = readLib('primitives/emr-inputs.component.ts');
    expect(inputsSrc).toMatch(/emptyToNull/);
    expect(inputsSrc).toMatch(/wireFormat\s*=\s*input<'utc'\s*\|\s*'local'>\('utc'\)/);
    expect(inputsSrc).toMatch(/precision\s*=\s*input<'day'\s*\|\s*'month'\s*\|\s*'year'>\('day'\)/);
    expect(inputsSrc).toMatch(/showSteppers\s*=\s*input\(false/);
    expect(inputsSrc).toMatch(/labelHidden\s*=\s*input\(false/);

    const choiceSrc = readLib('primitives/emr-choice.component.ts');
    const [checkboxPart, togglePart] = choiceSrc.split("selector: 'emr-toggle'");
    expect(checkboxPart).toMatch(/mixed\s*=\s*input\(false/);
    expect(checkboxPart).toMatch(/\[indeterminate\]="mixed\(\)"/);
    expect(togglePart).toMatch(/role="switch"/);
    expect(togglePart).not.toMatch(/\bmixed\b/);

    const searchSelect = readLib('primitives/emr-search-select.component.ts');
    expect(searchSelect).toMatch(/readonly\s+queryChange\s*=\s*output<string>\(\)/);
    expect(searchSelect).toMatch(/readonly\s+queryChanged\s*=\s*output<string>\(\)/);
    expect(searchSelect).toMatch(/readonly\s+readOnly\s*=\s*input\(false/);

    const tabs = readLib('primitives/emr-tabs.component.ts');
    expect(tabs).toMatch(/readonly\s+tabChange\s*=\s*output<string>\(\)/);
    expect(tabs).toMatch(/readonly\s+tabChanged\s*=\s*output<string>\(\)/);
    expect(tabs).toMatch(/readonly\s+readOnly\s*=\s*input\(false/);

    const feedback = readLib('primitives/emr-feedback.component.ts');
    expect(feedback).toMatch(/selector:\s*'emr-toast'/);
    expect(feedback).toMatch(/export class EmrToastComponent/);

    const shell = readLib('domain/emr-mobile-and-web-shell.component.ts');
    expect(shell).toMatch(/export\s*\{\s*EmrToastComponent\s*\}\s*from\s*'\.\.\/primitives\/emr-feedback\.component'/);
    expect(shell).toMatch(/CdkTrapFocus/);
    expect(shell).toMatch(/cdkTrapFocus/);
  });

  it('implements all 16 new L1 primitive components and exports them from public-api.ts', () => {
    const allNewL1 = [
      ['primitives/emr-textarea.component.ts', 'emr-textarea', 'EmrTextareaComponent'],
      ['primitives/emr-action-controls.component.ts', 'emr-icon-button', 'EmrIconButtonComponent'],
      ['primitives/emr-action-controls.component.ts', 'emr-segmented-control', 'EmrSegmentedControlComponent'],
      ['primitives/emr-action-controls.component.ts', 'emr-checkbox-group', 'EmrCheckboxGroupComponent'],
      ['primitives/emr-specialized-inputs.component.ts', 'emr-search-input', 'EmrSearchInputComponent'],
      ['primitives/emr-specialized-inputs.component.ts', 'emr-password-input', 'EmrPasswordInputComponent'],
      ['primitives/emr-specialized-inputs.component.ts', 'emr-numeric-stepper', 'EmrNumericStepperComponent'],
      ['primitives/emr-specialized-inputs.component.ts', 'emr-file-trigger', 'EmrFileTriggerComponent'],
      ['primitives/emr-pagination.component.ts', 'emr-pagination', 'EmrPaginationComponent'],
      ['primitives/emr-overlays.component.ts', 'emr-dialog', 'EmrDialogComponent'],
      ['primitives/emr-overlays.component.ts', 'emr-popover', 'EmrPopoverComponent'],
      ['primitives/emr-overlays.component.ts', 'emr-tooltip', 'EmrTooltipComponent'],
      ['primitives/emr-status-indicators.component.ts', 'emr-progress-bar', 'EmrProgressBarComponent'],
      ['primitives/emr-status-indicators.component.ts', 'emr-spinner', 'EmrSpinnerComponent'],
      ['primitives/emr-status-indicators.component.ts', 'emr-skeleton', 'EmrSkeletonComponent'],
      ['primitives/emr-status-indicators.component.ts', 'emr-avatar', 'EmrAvatarComponent'],
    ] as const;

    for (const [file, selector, className] of allNewL1) {
      const src = readLib(file);
      expect(src, selector).toContain(`selector: '${selector}'`);
      expect(src, className).toContain(`export class ${className}`);
    }

    expect(readLib('primitives/emr-overlays.component.ts')).toMatch(/CdkTrapFocus/);
    expect(publicApi).toContain('./lib/primitives/emr-textarea.component');
    expect(publicApi).toContain('./lib/primitives/emr-action-controls.component');
    expect(publicApi).toContain('./lib/primitives/emr-specialized-inputs.component');
    expect(publicApi).toContain('./lib/primitives/emr-pagination.component');
    expect(publicApi).toContain('./lib/primitives/emr-overlays.component');
    expect(publicApi).toContain('./lib/primitives/emr-status-indicators.component');
  });

  it('hardens EmrFieldFrame, EmrTypedField, EmrCodedInput, and EmrIdentifierEntry', () => {
    const frame = readLib('fields/emr-field-frame.component.ts');
    expect(frame).toMatch(/readonly\s+messages\s*=\s*input<readonly\s+EmrValidationMessage\[\]>\(\[\]\)/);
    expect(frame).toMatch(/readonly\s+info\s*=\s*input<string>\(\)/);
    // Hint is rendered unconditionally before error/warning/messages, never hidden in an @else branch
    expect(frame).not.toMatch(/@else\s+if\s*\(hint\(\)\)/);

    const typed = readLib('fields/emr-typed-field.component.ts');
    expect(typed).not.toMatch(/@Input\(|@Output\(|EventEmitter/);
    expect(typed).toMatch(/readonly\s+definition\s*=\s*input\.required<ClinicalFieldDefinition\s*\|\s*EmrFieldDefinition>\(\)/);
    expect(typed).toMatch(/readonly\s+model\s*=\s*input<ClinicalFieldState\s*\|\s*EmrFieldState>\(\)/);
    expect(typed).toMatch(/describedBy\s*=\s*computed\(\(\)\s*=>\s*\(this\.hasMessage\(\)\s*\?\s*this\.messageId\(\)\s*:\s*null\)\)/);

    const coded = readLib('fields/emr-coded-input.component.ts');
    expect(coded).not.toMatch(/@Input\(|@Output\(|EventEmitter/);
    expect(coded).toMatch(/status:\s*raw\s*\?\s*raw\s*:\s*undefined/);
    expect(coded).toMatch(/syncStatusSelect/);

    const identifier = readLib('fields/emr-identifier-entry.component.ts');
    expect(identifier).toMatch(/export\s+type\s+EmrIdentifierEntryEvent\s*=\s*IdentifierEntryIntent;/);
    expect(identifier).toMatch(/syncDom/);
  });

  it('implements all 13 new L2 clinical field components and exports them from public-api.ts', () => {
    const allNewL2 = [
      ['fields/emr-contract-fields.component.ts', 'emr-scale-field', 'EmrScaleFieldComponent'],
      ['fields/emr-contract-fields.component.ts', 'emr-partial-date-field', 'EmrPartialDateFieldComponent'],
      ['fields/emr-contract-fields.component.ts', 'emr-attachment-field', 'EmrAttachmentFieldComponent'],
      ['fields/emr-contract-fields.component.ts', 'emr-paired-field', 'EmrPairedFieldComponent'],
      ['fields/emr-contract-fields.component.ts', 'emr-duration-input', 'EmrDurationInputComponent'],
      ['fields/emr-contract-fields.component.ts', 'emr-range-field', 'EmrRangeFieldComponent'],
      ['fields/emr-contract-fields.component.ts', 'emr-signature-capture-field', 'EmrSignatureCaptureFieldComponent'],
      ['fields/emr-clinical-fields.component.ts', 'emr-phone-input', 'EmrPhoneInputComponent'],
      ['fields/emr-clinical-fields.component.ts', 'emr-address-field', 'EmrAddressFieldComponent'],
      ['fields/emr-clinical-fields.component.ts', 'emr-macro-text-field', 'EmrMacroTextFieldComponent'],
      ['fields/emr-specialty-fields.component.ts', 'emr-laterality-field', 'EmrLateralityFieldComponent'],
      ['fields/emr-specialty-fields.component.ts', 'emr-visual-acuity-field', 'EmrVisualAcuityFieldComponent'],
      ['fields/emr-specialty-fields.component.ts', 'emr-refraction-field', 'EmrRefractionFieldComponent'],
    ] as const;

    for (const [file, selector, className] of allNewL2) {
      const src = readLib(file);
      expect(src, selector).toContain(`selector: '${selector}'`);
      expect(src, className).toContain(`export class ${className}`);
      expect(src, className).not.toMatch(/@Input\(|@Output\(|EventEmitter/);
    }

    const contractFields = readLib('fields/emr-contract-fields.component.ts');
    expect(contractFields).not.toContain('<canvas');
    expect(contractFields).toContain('emr-signature-pad');

    expect(publicApi).toContain('./lib/fields/emr-contract-fields.component');
    expect(publicApi).toContain('./lib/fields/emr-clinical-fields.component');
    expect(publicApi).toContain('./lib/fields/emr-specialty-fields.component');
  });
});
