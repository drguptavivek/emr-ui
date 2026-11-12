'use client';

import { useState, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  ClinicalAssessmentStatus,
  ClinicalFieldDefinition,
  ClinicalFieldState,
  ClinicalFieldValue,
  EmrCodedValue,
  EmrFieldDefinition,
  EmrFieldState,
} from '@drguptavivek/emr-controller';
import { EmrDateTimeText, EmrTypedText, NumberInput, ThemedInput, Unsupported } from './inputs-core';
import { EmrCheckbox, EmrRadioGroup, EmrToggle } from './l1-inputs';
import { EmrLikert, EmrSearchSelect, EmrVas } from './l1-interactive';
import { EmrCheckboxGroup, EmrNumericStepper, EmrSearchInput, EmrSegmentedControl, EmrTextarea } from './l1-new-inputs';
import { EmrTreeSelect } from './l1-tree';
import { EmrMaskedInput, EmrOtpInput, EmrSlider } from './l1-wave2-formatted';
import { EmrCombobox, EmrTagInput } from './l1-wave2-inputs';
import {
  EmrAttachmentField,
  EmrImageField,
  EmrPartialDateField,
  EmrScaleField,
  EmrSignatureCaptureField,
} from './l2-contract-fields';
import { AssessmentStatusStrip, EmrFieldFrame } from './l2-field-frame';
import { EmrCodedInput } from './l2-fields';
import { buildScaleAnchors } from './l2-fields.logic';
import { useEmrLabels } from './labels';
import { EmrOptionChip, EmrRow, EmrSelect } from './primitives';
import {
  coerceAttachmentRefs,
  coerceCodedValues,
  coercePartialDate,
  coerceSignatureStrokes,
  coerceUploadedImages,
  isQuantity,
  normalizeTypedField,
  textOf,
  toggled,
} from './typed-field.logic';

export { EmrFieldFrame } from './l2-field-frame';

/** Selects with more options than this render as a dropdown instead of chips unless overridden by `widget`. */
const DROPDOWN_ABOVE = 6;

/** What a custom renderer receives — the React twin of Angular's EmrCustomFieldContext. */
export interface EmrCustomFieldProps {
  definition: ClinicalFieldDefinition;
  model?: ClinicalFieldState;
  controlId: string;
  readOnly: boolean;
  onValueChange: (value: ClinicalFieldValue) => void;
}

/**
 * A custom renderer. Set `framed = true` on one that draws its own label and messages (e.g. a component built
 * on EmrFieldFrame such as EmrBarcodeScanField): the form then skips its frame so the label is not shown twice.
 */
export type EmrCustomRenderer = ComponentType<EmrCustomFieldProps> & { framed?: boolean };
export type EmrCustomRenderers = Readonly<Record<string, EmrCustomRenderer>>;

export interface EmrTypedFieldProps {
  definition: ClinicalFieldDefinition | EmrFieldDefinition;
  model?: ClinicalFieldState | EmrFieldState;
  controlId: string;
  readOnly?: boolean;
  labelHidden?: boolean;
  customRenderers?: EmrCustomRenderers;
  onValueChange: (value: ClinicalFieldValue) => void;
  onStatusChange?: (status: ClinicalAssessmentStatus | undefined) => void;
  onFocus?: () => void;
}

/**
 * L2 schema-driven field dispatcher.
 * Supports both legacy `ClinicalFieldDefinition` / `ClinicalFieldState` and unified
 * `EmrFieldDefinition` / `EmrFieldState`, dispatching all `EmrValueType` and `EmrWidgetHint` combinations.
 */
export function EmrTypedField({
  definition,
  model,
  controlId,
  readOnly = false,
  labelHidden,
  customRenderers = {},
  onValueChange,
  onStatusChange,
  onFocus,
}: EmrTypedFieldProps) {
  const labels = useEmrLabels();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const f = normalizeTypedField(definition, model, readOnly, DROPDOWN_ABOVE);
  const hasMessage = Boolean(f.error || f.warning || f.info || f.hint || f.messages.length > 0);
  const handleStatus = (next: ClinicalAssessmentStatus | undefined) => {
    onStatusChange?.(next);
  };

  const inputProps = {
    id: controlId,
    'aria-labelledby': labelHidden ? undefined : `${controlId}-label`,
    'aria-describedby': hasMessage ? `${controlId}-message` : undefined,
    invalid: Boolean(f.error),
    accessibilityLabel: f.required ? `${f.label}, ${labels.required}` : f.label,
    accessibilityHint: f.error ?? f.warning ?? f.hint,
    // Read-only never becomes disabled: a disabled control leaves the tab order and is unannounceable.
    readOnly: f.readOnly,
    editable: !f.disabled && !f.readOnly,
    placeholder: f.placeholder,
    onFocus,
  } as const;

  let control: React.ReactNode;
  let selfFramed = false;
  let handlesOwnStatus = false;

  switch (f.dispatchKind) {
    case 'textarea': {
      selfFramed = true;
      control = (
        <EmrTextarea
          controlId={controlId}
          label={f.label}
          labelHidden={labelHidden}
          rows={f.rows}
          placeholder={f.placeholder}
          hint={f.hint}
          error={f.error}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          value={textOf(f.value) || null}
          onFocus={onFocus}
          onValueChange={v => onValueChange(v ?? '')}
        />
      );
      break;
    }

    case 'search-input': {
      control = (
        <EmrSearchInput
          controlId={controlId}
          label={f.label}
          labelHidden
          placeholder={f.placeholder}
          readOnly={f.readOnly}
          disabled={f.disabled}
          value={textOf(f.value) || null}
          onValueChange={v => {
            onFocus?.();
            onValueChange(v ?? '');
          }}
        />
      );
      break;
    }

    case 'number-input': {
      const currentUnit = f.valueType === 'quantity' ? (isQuantity(f.value) ? f.value.unit : f.unit ?? '') : undefined;
      control = (
        <NumberInput
          {...inputProps}
          integer={f.valueType === 'integer'}
          min={f.min}
          max={f.max}
          step={f.step}
          value={f.value}
          unit={f.valueType === 'quantity' ? f.unit : undefined}
          onNumber={n =>
            onValueChange(f.valueType === 'quantity' ? { value: n, unit: currentUnit ?? '' } : n)
          }
        />
      );
      break;
    }

    case 'numeric-stepper': {
      const numericVal = typeof f.value === 'number' ? f.value : isQuantity(f.value) ? f.value.value : null;
      const currentUnit = f.valueType === 'quantity' ? (isQuantity(f.value) ? f.value.unit : f.unit ?? '') : undefined;
      control = (
        <EmrNumericStepper
          controlId={controlId}
          label={f.label}
          labelHidden
          value={numericVal}
          min={f.min}
          max={f.max}
          step={f.step}
          precision={f.valueType === 'integer' ? 0 : f.precision}
          unit={f.unit}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={n => {
            onFocus?.();
            onValueChange(f.valueType === 'quantity' ? { value: n, unit: currentUnit ?? '' } : n);
          }}
        />
      );
      break;
    }

    case 'likert': {
      const numericVal = typeof f.value === 'number' ? f.value : null;
      control = (
        <EmrLikert
          label={f.label}
          min={f.min ?? 0}
          max={f.max ?? 10}
          anchors={buildScaleAnchors(f.min ?? 0, f.max ?? 10, f.anchors)}
          value={numericVal}
          tone={numericVal !== null ? f.optionTones?.[numericVal] : undefined}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={v => {
            onFocus?.();
            onValueChange(v);
          }}
        />
      );
      break;
    }

    case 'vas': {
      const numericVal = typeof f.value === 'number' ? f.value : null;
      control = (
        <EmrVas
          label={f.label}
          min={f.min ?? 0}
          max={f.max ?? 100}
          step={f.step}
          anchors={buildScaleAnchors(f.min ?? 0, f.max ?? 100, f.anchors)}
          value={numericVal}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={v => {
            onFocus?.();
            onValueChange(v);
          }}
        />
      );
      break;
    }

    case 'scale-field': {
      selfFramed = true;
      handlesOwnStatus = true;
      const numericVal = typeof f.value === 'number' ? f.value : null;
      control = (
        <EmrScaleField
          controlId={controlId}
          model={{
            definition: f.contractDefinition,
            label: f.label,
            variant: f.widget === 'vas' ? 'vas' : 'likert',
            value: numericVal,
            min: f.min ?? 0,
            max: f.max ?? (f.widget === 'vas' ? 100 : 10),
            step: f.step,
            anchors: f.anchors,
            optionTones: f.optionTones,
            status: f.status,
            statusOptions: f.statusOptions,
            hint: f.hint,
            messages: f.messages,
            required: f.required,
            readOnly: f.readOnly || f.disabled,
          }}
          onIntent={intent => {
            onFocus?.();
            if (intent.type === 'valueChangeRequested') onValueChange(intent.value);
            else handleStatus(intent.status);
          }}
        />
      );
      break;
    }

    case 'checkbox': {
      selfFramed = true;
      control = (
        <EmrCheckbox
          controlId={controlId}
          label={f.label}
          checked={f.value === true}
          hint={f.hint}
          warning={f.warning}
          error={f.error}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onFocus={onFocus}
          onCheckedChange={checked => onValueChange(checked)}
        />
      );
      break;
    }

    case 'toggle': {
      selfFramed = true;
      control = (
        <EmrToggle
          controlId={controlId}
          label={f.label}
          checked={f.value === true}
          hint={f.hint}
          warning={f.warning}
          error={f.error}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onFocus={onFocus}
          onCheckedChange={checked => onValueChange(checked)}
        />
      );
      break;
    }

    case 'boolean-segmented': {
      control = (
        <EmrSegmentedControl
          controlId={controlId}
          ariaLabel={f.label}
          options={[
            { value: 'true', label: labels.yes },
            { value: 'false', label: labels.no },
          ]}
          value={f.value === true ? 'true' : f.value === false ? 'false' : null}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={next => {
            onFocus?.();
            onValueChange(next === 'true' ? true : next === 'false' ? false : null);
          }}
        />
      );
      break;
    }

    case 'boolean-chip': {
      control = (
        <EmrRow>
          <EmrOptionChip
            label={labels.yes}
            multiple
            selected={f.value === true}
            readOnly={f.readOnly}
            disabled={f.disabled}
            onPress={() => {
              onFocus?.();
              onValueChange(f.value !== true);
            }}
          />
        </EmrRow>
      );
      break;
    }

    case 'date':
    case 'time': {
      const mode = f.dispatchKind === 'time' ? 'time' : labels.dateFormat;
      control = (
        <EmrTypedText
          {...inputProps}
          mode={mode}
          placeholder={f.placeholder ?? (mode === 'time' ? 'hh:mm' : mode)}
          value={textOf(f.value) || null}
          onValueChange={onValueChange}
        />
      );
      break;
    }

    case 'datetime': {
      control = (
        <EmrDateTimeText
          value={textOf(f.value) || null}
          format={labels.dateFormat}
          label={f.label}
          dateLabel={labels.dateLabel}
          timeLabel={labels.timeLabel}
          invalid={Boolean(f.error)}
          readOnly={f.readOnly}
          editable={!f.disabled}
          onFocus={onFocus}
          onValueChange={onValueChange}
        />
      );
      break;
    }

    case 'partial-date': {
      selfFramed = true;
      handlesOwnStatus = true;
      control = (
        <EmrPartialDateField
          controlId={controlId}
          model={{
            label: f.label,
            value: coercePartialDate(f.value),
            status: f.status,
            statusOptions: f.statusOptions,
            hint: f.hint,
            messages: f.messages,
            required: f.required,
            readOnly: f.readOnly || f.disabled,
          }}
          onIntent={intent => {
            onFocus?.();
            if (intent.type === 'valueChangeRequested') onValueChange(intent.value);
            else if (intent.type === 'statusChangeRequested') handleStatus(intent.status);
          }}
        />
      );
      break;
    }

    case 'select-dropdown': {
      control = (
        <EmrSelect
          label={f.label}
          options={f.options}
          value={typeof f.value === 'string' ? f.value : null}
          placeholder={f.placeholder}
          invalid={Boolean(f.error)}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onChange={value => {
            onFocus?.();
            onValueChange(value);
          }}
        />
      );
      break;
    }

    case 'radio-group': {
      selfFramed = true;
      control = (
        <EmrRadioGroup
          controlId={controlId}
          label={f.label}
          labelHidden={labelHidden}
          options={f.options}
          value={typeof f.value === 'string' ? f.value : null}
          hint={f.hint}
          warning={f.warning}
          error={f.error}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onFocus={onFocus}
          onValueChange={v => onValueChange(v)}
        />
      );
      break;
    }

    case 'segmented-control': {
      control = (
        <EmrSegmentedControl
          controlId={controlId}
          ariaLabel={f.label}
          options={f.options}
          value={typeof f.value === 'string' ? f.value : null}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={v => {
            onFocus?.();
            onValueChange(v);
          }}
        />
      );
      break;
    }

    case 'search-select':
    case 'multiselect-search': {
      const multiple = f.dispatchKind === 'multiselect-search';
      const filtered = searchQuery.trim()
        ? f.options.filter(o => o.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        : f.options;
      const selectedValues = multiple
        ? Array.isArray(f.value)
          ? (f.value as readonly string[])
          : []
        : typeof f.value === 'string'
          ? [f.value]
          : [];
      const selectedOpts = f.options.filter(o => selectedValues.includes(o.value));
      control = (
        <EmrSearchSelect
          label={f.label}
          labelHidden
          placeholder={f.placeholder}
          query={searchQuery}
          options={filtered}
          selected={selectedOpts}
          multiple={multiple}
          open={searchOpen}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onQueryChange={q => {
            setSearchQuery(q);
            setSearchOpen(true);
          }}
          onSearchRequested={() => setSearchOpen(true)}
          onOpenRequested={() => {
            onFocus?.();
            setSearchOpen(true);
          }}
          onCloseRequested={() => setSearchOpen(false)}
          onOptionSelect={val => {
            onFocus?.();
            if (multiple) {
              onValueChange(toggled(f.value, val));
            } else {
              onValueChange(val);
              setSearchOpen(false);
            }
          }}
          onRemoveRequested={val => {
            onValueChange(multiple ? toggled(f.value, val) : null);
          }}
        />
      );
      break;
    }

    case 'select-chips':
    case 'multiselect-chips': {
      const multiple = f.dispatchKind === 'multiselect-chips';
      control = (
        <View
          role={multiple ? 'group' : 'radiogroup'}
          aria-labelledby={labelHidden ? undefined : `${controlId}-label`}
          accessibilityLabel={f.label}
        >
          <EmrRow>
            {f.options.map(option => {
              const selected = multiple
                ? Array.isArray(f.value) && (f.value as readonly string[]).includes(option.value)
                : f.value === option.value;
              return (
                <EmrOptionChip
                  key={option.value}
                  label={option.label}
                  selected={selected}
                  multiple={multiple}
                  readOnly={f.readOnly}
                  disabled={f.disabled || option.disabled}
                  onPress={() => {
                    onFocus?.();
                    onValueChange(multiple ? toggled(f.value, option.value) : selected ? null : option.value);
                  }}
                />
              );
            })}
          </EmrRow>
        </View>
      );
      break;
    }

    case 'checkbox-group': {
      selfFramed = true;
      const arr = Array.isArray(f.value) ? (f.value as readonly string[]) : [];
      control = (
        <EmrCheckboxGroup
          controlId={controlId}
          label={f.label}
          labelHidden={labelHidden}
          options={f.options}
          value={arr}
          hint={f.hint}
          error={f.error}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={next => {
            onFocus?.();
            onValueChange(next);
          }}
        />
      );
      break;
    }

    case 'coded-choice': {
      const system =
        f.contractDefinition?.contract.terminology.find(b => b.role === 'answer-value-set')?.valueSetCanonical ??
        'urn:emr:local';
      const codedList = coerceCodedValues(f.value);
      const currentCode = codedList[0]?.code ?? (typeof f.value === 'string' ? f.value : null);
      const pickCode = (code: string | null) => {
        onFocus?.();
        if (!code) {
          onValueChange(null);
          return;
        }
        const opt = f.options.find(o => o.value === code);
        const concept: EmrCodedValue = { system, code, display: opt?.label ?? code };
        onValueChange(concept);
      };
      if (f.widget === 'segmented') {
        control = (
          <EmrSegmentedControl
            controlId={controlId}
            ariaLabel={f.label}
            options={f.options}
            value={currentCode}
            readOnly={f.readOnly}
            disabled={f.disabled}
            onValueChange={pickCode}
          />
        );
      } else if (f.widget === 'select') {
        control = (
          <EmrSelect
            label={f.label}
            options={f.options}
            value={currentCode}
            invalid={Boolean(f.error)}
            readOnly={f.readOnly}
            disabled={f.disabled}
            onChange={pickCode}
          />
        );
      } else {
        control = (
          <View role="radiogroup" aria-label={f.label}>
            <EmrRow>
              {f.options.map(opt => (
                <EmrOptionChip
                  key={opt.value}
                  label={opt.label}
                  selected={currentCode === opt.value}
                  readOnly={f.readOnly}
                  disabled={f.disabled || opt.disabled}
                  onPress={() => pickCode(currentCode === opt.value ? null : opt.value)}
                />
              ))}
            </EmrRow>
          </View>
        );
      }
      break;
    }

    case 'coded-input': {
      selfFramed = true;
      handlesOwnStatus = true;
      const codedDef: EmrFieldDefinition = f.contractDefinition ?? {
        schemaVersion: '1.0',
        contract: {
          linkId: f.id,
          valueType: 'coded',
          cardinality: { min: f.required ? 1 : 0, max: 1 },
          terminology: [],
          validation: [],
        },
        presentation: {
          label: f.label,
          hint: f.hint,
          placeholder: f.placeholder,
          assessmentStatusOptions: f.statusOptions,
        },
      };
      const isMultiple = codedDef.contract.cardinality.max === null || codedDef.contract.cardinality.max > 1;
      const concepts = coerceCodedValues(f.value);
      const system =
        codedDef.contract.terminology.find(b => b.role === 'answer-value-set')?.valueSetCanonical ?? 'urn:emr:local';
      const candidateConcepts: EmrCodedValue[] = f.options
        .filter(o => !searchQuery.trim() || o.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        .map(o => ({ system, code: o.value, display: o.label }));

      control = (
        <EmrCodedInput
          model={{
            definition: codedDef,
            value: isMultiple ? concepts : (concepts[0] ?? null),
            status: f.status,
            query: searchQuery,
            options: candidateConcepts,
            loading: false,
            open: searchOpen,
            emptyMessage: 'No matching concepts',
            messages: f.messages,
            readOnly: f.readOnly || f.disabled,
          }}
          onIntent={intent => {
            onFocus?.();
            switch (intent.type) {
              case 'queryChangeRequested':
                setSearchQuery(intent.query);
                setSearchOpen(true);
                break;
              case 'openRequested':
              case 'searchRequested':
                setSearchOpen(true);
                break;
              case 'closeRequested':
                setSearchOpen(false);
                break;
              case 'conceptSelected':
                if (isMultiple) {
                  const exists = concepts.some(
                    c => c.system === intent.concept.system && c.code === intent.concept.code,
                  );
                  onValueChange(exists ? concepts : [...concepts, intent.concept]);
                } else {
                  onValueChange(intent.concept);
                  setSearchOpen(false);
                }
                break;
              case 'conceptRemoveRequested':
                if (isMultiple) {
                  onValueChange(concepts.filter(c => !(c.system === intent.system && c.code === intent.code)));
                } else {
                  onValueChange(null);
                }
                break;
              case 'statusChangeRequested':
                handleStatus(intent.status);
                break;
            }
          }}
        />
      );
      break;
    }

    case 'attachment-field': {
      selfFramed = true;
      handlesOwnStatus = true;
      const currentItems = coerceAttachmentRefs(f.value);
      control = (
        <EmrAttachmentField
          controlId={controlId}
          model={{
            label: f.label,
            items: currentItems,
            multiple: f.contractDefinition ? f.contractDefinition.contract.cardinality.max !== 1 : true,
            status: f.status,
            statusOptions: f.statusOptions,
            hint: f.hint,
            messages: f.messages,
            required: f.required,
            readOnly: f.readOnly || f.disabled,
          }}
          onIntent={intent => {
            onFocus?.();
            if (intent.type === 'filesSelected') {
              const added = intent.files.map((file, idx) => ({
                id: `${controlId}-att-${currentItems.length + idx + 1}`,
                title: file.name,
                contentType: file.mimeType,
                sizeBytes: file.sizeBytes,
              }));
              onValueChange([...currentItems, ...added]);
            } else if (intent.type === 'itemRemoveRequested') {
              onValueChange(currentItems.filter(item => item.id !== intent.id));
            } else if (intent.type === 'statusChangeRequested') {
              handleStatus(intent.status);
            }
          }}
        />
      );
      break;
    }

    case 'signature-capture': {
      selfFramed = true;
      const strokes = coerceSignatureStrokes(f.value);
      control = (
        <EmrSignatureCaptureField
          controlId={controlId}
          model={{
            label: f.label,
            strokes,
            hint: f.hint,
            messages: f.messages,
            required: f.required,
            readOnly: f.readOnly || f.disabled,
          }}
          onIntent={intent => {
            onFocus?.();
            if (intent.type === 'strokeAdded') {
              onValueChange([...strokes, intent.stroke]);
            } else {
              onValueChange([]);
            }
          }}
        />
      );
      break;
    }

    case 'tree-select': {
      selfFramed = true;
      const isMultiple = f.valueType === 'multiselect';
      const arr = Array.isArray(f.value) ? (f.value as readonly string[]) : [];
      const single = typeof f.value === 'string' ? f.value : null;
      control = (
        <EmrTreeSelect
          controlId={controlId}
          label={labelHidden ? undefined : f.label}
          nodes={f.treeNodes}
          multiple={isMultiple}
          value={single}
          values={arr}
          placeholder={f.placeholder}
          hint={f.hint}
          error={f.error}
          warning={f.warning}
          info={f.info}
          messages={f.messages}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={next => {
            onFocus?.();
            onValueChange(next);
          }}
          onValuesChange={next => {
            onFocus?.();
            onValueChange(next);
          }}
        />
      );
      break;
    }

    case 'combobox': {
      selfFramed = true;
      control = (
        <EmrCombobox
          controlId={controlId}
          label={labelHidden ? undefined : f.label}
          options={f.options}
          value={typeof f.value === 'string' ? f.value : null}
          placeholder={f.placeholder}
          hint={f.hint}
          error={f.error}
          warning={f.warning}
          info={f.info}
          messages={f.messages}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={next => {
            onFocus?.();
            onValueChange(next);
          }}
        />
      );
      break;
    }

    case 'tag-input': {
      selfFramed = true;
      const arr = Array.isArray(f.value)
        ? (f.value as readonly string[])
        : typeof f.value === 'string' && f.value.trim()
          ? [f.value.trim()]
          : [];
      control = (
        <EmrTagInput
          controlId={controlId}
          label={labelHidden ? undefined : f.label}
          values={arr}
          suggestions={f.options.map(o => o.label)}
          placeholder={f.placeholder}
          hint={f.hint}
          error={f.error}
          warning={f.warning}
          info={f.info}
          messages={f.messages}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValuesChange={next => {
            onFocus?.();
            onValueChange(next);
          }}
        />
      );
      break;
    }

    case 'image-upload': {
      selfFramed = true;
      handlesOwnStatus = true;
      const currentImages = coerceUploadedImages(f.value);
      control = (
        <EmrImageField
          controlId={controlId}
          disabled={f.disabled}
          model={{
            label: f.label,
            items: currentImages,
            multiple: f.contractDefinition ? f.contractDefinition.contract.cardinality.max !== 1 : true,
            status: f.status,
            statusOptions: f.statusOptions,
            hint: f.hint,
            messages: f.messages,
            required: f.required,
            readOnly: f.readOnly || f.disabled,
          }}
          onIntent={intent => {
            onFocus?.();
            if (intent.type === 'itemsChangeRequested') {
              onValueChange(intent.items as unknown as ClinicalFieldValue);
            } else if (intent.type === 'itemRemoveRequested') {
              onValueChange(
                currentImages.filter(it => it.id !== intent.id) as unknown as ClinicalFieldValue,
              );
            } else if (intent.type === 'statusChangeRequested') {
              handleStatus(intent.status);
            }
          }}
        />
      );
      break;
    }

    case 'slider': {
      selfFramed = true;
      const numericVal = typeof f.value === 'number' ? f.value : isQuantity(f.value) ? f.value.value : null;
      const currentUnit = f.valueType === 'quantity' ? (isQuantity(f.value) ? f.value.unit : f.unit ?? '') : undefined;
      control = (
        <EmrSlider
          controlId={controlId}
          label={labelHidden ? undefined : f.label}
          value={numericVal}
          min={f.min ?? 0}
          max={f.max ?? 100}
          step={f.step}
          unit={f.unit}
          hint={f.hint}
          error={f.error}
          warning={f.warning}
          info={f.info}
          messages={f.messages}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={next => {
            onFocus?.();
            if (next === null) onValueChange(null);
            else onValueChange(f.valueType === 'quantity' ? { value: next, unit: currentUnit ?? '' } : next);
          }}
        />
      );
      break;
    }

    case 'masked': {
      selfFramed = true;
      control = (
        <EmrMaskedInput
          controlId={controlId}
          label={labelHidden ? undefined : f.label}
          mask={f.mask ?? '999-99-9999'}
          value={textOf(f.value) || null}
          placeholder={f.placeholder}
          hint={f.hint}
          error={f.error}
          warning={f.warning}
          info={f.info}
          messages={f.messages}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={next => {
            onFocus?.();
            onValueChange(next ?? '');
          }}
        />
      );
      break;
    }

    case 'otp': {
      selfFramed = true;
      control = (
        <EmrOtpInput
          controlId={controlId}
          label={labelHidden ? undefined : f.label}
          value={textOf(f.value)}
          length={f.max && f.max >= 1 && f.max <= 12 ? f.max : 6}
          hint={f.hint}
          error={f.error}
          warning={f.warning}
          info={f.info}
          messages={f.messages}
          required={f.required}
          readOnly={f.readOnly}
          disabled={f.disabled}
          onValueChange={next => {
            onFocus?.();
            onValueChange(next);
          }}
        />
      );
      break;
    }

    case 'custom': {
      const Custom = f.customRendererKey ? customRenderers[f.customRendererKey] : undefined;
      selfFramed = Boolean(Custom?.framed);
      control = Custom ? (
        <Custom
          definition={f.legacyDefinition}
          model={f.legacyState}
          controlId={controlId}
          readOnly={f.readOnly}
          onValueChange={onValueChange}
        />
      ) : (
        <Unsupported text={labels.unregisteredRenderer(f.customRendererKey ?? f.id)} />
      );
      break;
    }

    default: {
      control = (
        <ThemedInput
          {...inputProps}
          placeholder={f.placeholder}
          value={textOf(f.value)}
          onChangeText={onValueChange}
        />
      );
    }
  }

  const statusBlock = !handlesOwnStatus ? (
    <AssessmentStatusStrip
      fieldLabel={f.label}
      status={f.status}
      statusOptions={f.statusOptions}
      readOnly={f.readOnly}
      disabled={f.disabled}
      onStatusChange={handleStatus}
    />
  ) : null;

  if (selfFramed) {
    return (
      <View style={styles.frame}>
        {control}
        {statusBlock}
      </View>
    );
  }

  return (
    <EmrFieldFrame
      label={f.label}
      labelHidden={labelHidden}
      controlId={controlId}
      required={f.required}
      hint={f.hint}
      info={f.info}
      warning={f.warning}
      error={f.error}
      messages={f.messages}
    >
      {control}
      {statusBlock}
    </EmrFieldFrame>
  );
}

const styles = StyleSheet.create({
  frame: { gap: 6, minWidth: 0 },
});
