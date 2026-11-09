'use client';

import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  EmrButton, EmrCheckbox, EmrColumns, EmrDateInput, EmrDateTimeInput, EmrNumberInput, EmrPairedInput, EmrQuantityInput,
  EmrRadioGroup, EmrRow, EmrSelect, EmrTextInput, EmrTimeInput, EmrToggle, useEmrTheme,
} from '../../src';
import type { GallerySection } from './types';

const sexOptions = [{ value: 'f', label: 'Female' }, { value: 'm', label: 'Male' }, { value: 'o', label: 'Other' }];
const referralPriorityOptions = [
  { value: 'routine', label: 'Routine (within 4 weeks)' },
  { value: 'soon', label: 'Soon (within 7 days)' },
  { value: 'urgent', label: 'Urgent (within 24 hours)' },
];
const eyeOptions = [{ value: 'OD', label: 'Right eye (OD)' }, { value: 'OS', label: 'Left eye (OS)' }, { value: 'OU', label: 'Both eyes (OU)' }];
const units = [{ value: 'mmHg', label: 'mmHg' }, { value: 'kPa', label: 'kPa' }];

function ButtonAndSelectDemo() {
  const [eye, setEye] = useState<string | null>('OD');
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <EmrButton variant="primary" label="Primary action" onPress={() => {}} />
        <EmrButton variant="outline" label="Outline action" onPress={() => {}} />
        <EmrButton variant="ghost" label="Ghost action" onPress={() => {}} />
        <EmrButton variant="primary" small label="Small button" onPress={() => {}} />
        <EmrButton variant="outline" disabled label="Disabled" onPress={() => {}} />
      </View>
      <View style={{ maxWidth: 280 }}>
        <EmrSelect label="Target eye" options={eyeOptions} value={eye} onChange={setEye} />
      </View>
    </View>
  );
}

function RowAlignmentDemo() {
  const [drug, setDrug] = useState<string | null>('Moxifloxacin 0.5%');
  const [dose, setDose] = useState<number | null>(1);
  const [visitDate, setVisitDate] = useState<string | null>('2026-03-05');
  const [visitTime, setVisitTime] = useState<string | null>('09:30');
  return (
    <EmrColumns count={4} gap={16}>
      <EmrTextInput label="Medication" required value={drug} onValueChange={setDrug} />
      <EmrNumberInput label="Drops per dose" mode="integer" min={1} max={10} value={dose} onValueChange={setDose} />
      <EmrDateInput label="Start date" value={visitDate} onValueChange={setVisitDate} />
      <EmrTimeInput label="First dose time" value={visitTime} onValueChange={setVisitTime} />
    </EmrColumns>
  );
}

function TextDemo() {
  const [a, setA] = useState<string | null>('Synthetic note');
  const [b, setB] = useState<string | null>(null);
  return (
    <EmrColumns count={3} gap={16}>
      <EmrTextInput label="Chief complaint" hint="Free text" value={a} onValueChange={setA} />
      <EmrTextInput label="Required, read-only" required readOnly value="Fixed value" onValueChange={() => {}} />
      <EmrTextInput label="Disabled" disabled value="Locked" onValueChange={() => {}} />
      <EmrTextInput label="With error" required error="This field is required." value={b} onValueChange={setB} />
      <EmrTextInput label="With warning" warning="Unusually long entry." value={b} onValueChange={setB} />
    </EmrColumns>
  );
}

function NumberDemo() {
  const [n, setN] = useState<number | null>(7.5);
  const [i, setI] = useState<number | null>(3);
  const [sph, setSph] = useState<number | null>(-1.25);
  return (
    <EmrColumns count={3} gap={16}>
      <EmrNumberInput label="Decimal (− / + step 0.5)" min={0} max={20} step={0.5} hint="Range 0 to 20" value={n} onValueChange={setN} />
      <EmrNumberInput label="Dioptre (− / + step 0.25)" min={-20} max={20} step={0.25} unit="D" value={sph} onValueChange={setSph} />
      <EmrNumberInput label="Integer (− / + step 1)" mode="integer" min={0} max={10} value={i} onValueChange={setI} />
      <EmrNumberInput label="Read-only" readOnly value={12.5} onValueChange={() => {}} />
      <EmrNumberInput label="Error" error="Out of range." value={99} onValueChange={() => {}} />
    </EmrColumns>
  );
}

function DateDemo() {
  const [d, setD] = useState<string | null>('2026-03-05');
  const [y, setY] = useState<string | null>('2026-03-05');
  const [ym, setYm] = useState<string | null>('2026-03');
  const [yr, setYr] = useState<string | null>('2026');
  return (
    <EmrColumns count={3} gap={16}>
      <EmrDateInput label="Full date (dd-mm-yyyy)" hint="Type or click 📅" value={d} onValueChange={setD} />
      <EmrDateInput label="ISO order (yyyy-mm-dd)" displayFormat="yyyy-mm-dd" value={y} onValueChange={setY} />
      <EmrDateInput label="Year-Month (mm-yyyy)" precision="month" hint={`ISO value: ${ym ?? 'null'}`} value={ym} onValueChange={setYm} />
      <EmrDateInput label="Year only (yyyy)" precision="year" hint={`ISO value: ${yr ?? 'null'}`} value={yr} onValueChange={setYr} />
      <EmrDateInput label="Read-only" readOnly value="2026-12-31" onValueChange={() => {}} />
      <EmrDateInput label="Error" error="Date is in the future." value="2030-01-01" onValueChange={() => {}} />
    </EmrColumns>
  );
}

function TimeDemo() {
  const [t, setT] = useState<string | null>('08:30');
  const [ts, setTs] = useState<string | null>('08:30:45');
  return (
    <EmrColumns count={3} gap={16}>
      <EmrTimeInput label="Time (hh:mm)" hint={`Value: ${t ?? 'null'}`} value={t} onValueChange={setT} />
      <EmrTimeInput label="Time with seconds (hh:mm:ss)" precision="second" hint={`Value: ${ts ?? 'null'}`} value={ts} onValueChange={setTs} />
      <EmrTimeInput label="Read-only" readOnly value="23:59" onValueChange={() => {}} />
      <EmrTimeInput label="Error" error="Not a valid time." value={null} onValueChange={() => {}} />
    </EmrColumns>
  );
}

function DateTimeDemo() {
  const [v, setV] = useState<string | null>('2026-03-05T08:30:00Z');
  const [vs, setVs] = useState<string | null>('2026-03-05T08:30:45Z');
  return (
    <EmrColumns count={2} gap={16}>
      <EmrDateTimeInput label="Date & Time (hh:mm)" hint={`UTC: ${v ?? 'none'}`} value={v} onValueChange={setV} />
      <EmrDateTimeInput label="Date & Time with seconds (hh:mm:ss)" timePrecision="second" hint={`UTC: ${vs ?? 'none'}`} value={vs} onValueChange={setVs} />
      <EmrDateTimeInput label="Read-only" readOnly value="2026-12-31T23:59:00Z" onValueChange={() => {}} />
      <EmrDateTimeInput label="Error" error="Both date and time are needed." value={null} onValueChange={() => {}} />
    </EmrColumns>
  );
}

function QuantityDemo() {
  const [n, setN] = useState<number | null>(16);
  const [u, setU] = useState<string | null>('mmHg');
  return (
    <EmrColumns count={3} gap={16}>
      <EmrQuantityInput label="IOP" units={units} value={n} unit={u} onValueChange={setN} onUnitChange={setU} />
      <EmrQuantityInput label="Read-only" readOnly units={units} value={21} unit="kPa" onValueChange={() => {}} onUnitChange={() => {}} />
      <EmrQuantityInput label="Error" error="Above range." units={units} value={80} unit="mmHg" onValueChange={() => {}} onUnitChange={() => {}} />
    </EmrColumns>
  );
}

function PairedDemo() {
  const [od, setOd] = useState<string | null>('6/6');
  const [os, setOs] = useState<string | null>('6/9');
  return (
    <EmrColumns count={3} gap={16}>
      <EmrPairedInput label="Visual acuity" firstLabel="OD" secondLabel="OS" firstValue={od} secondValue={os}
        onFirstValueChange={setOd} onSecondValueChange={setOs} />
      <EmrPairedInput label="Read-only, custom separator" separator="|" readOnly firstLabel="OD" secondLabel="OS"
        firstValue="14" secondValue="16" onFirstValueChange={() => {}} onSecondValueChange={() => {}} />
      <EmrPairedInput label="Error" error="Enter both eyes." firstLabel="OD" secondLabel="OS" firstValue="6/6" secondValue={null}
        onFirstValueChange={() => {}} onSecondValueChange={() => {}} />
    </EmrColumns>
  );
}

function CheckboxDemo() {
  const t = useEmrTheme();
  const [a, setA] = useState<boolean | null>(true);
  const [b, setB] = useState<boolean | null>(false);
  const [c, setC] = useState<boolean | null>(true);
  const [d, setD] = useState<boolean | null>(false);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: '600' }}>Horizontal (equal-width columns)</Text>
        <EmrRow columns={3}>
          <EmrCheckbox label="Diabetic" value={a} onValueChange={setA} />
          <EmrCheckbox label="Hypertensive" value={b} onValueChange={setB} />
          <EmrCheckbox label="One-eyed patient" value={c} onValueChange={setC} />
        </EmrRow>
      </View>
      <View style={{ gap: 6, maxWidth: 360 }}>
        <Text style={{ color: t.text, fontSize: t.textSm, fontWeight: '600' }}>Vertically stacked (equal width)</Text>
        <EmrRow single>
          <EmrCheckbox label="Patient consents to procedure" value={a} onValueChange={setA} />
          <EmrCheckbox label="Pupil dilated (Tropicamide)" value={d} onValueChange={setD} />
          <EmrCheckbox label="Read-only checked" readOnly value onValueChange={() => {}} />
          <EmrCheckbox label="Disabled" disabled value={false} onValueChange={() => {}} />
          <EmrCheckbox label="With error" error="Consent is required." value={false} onValueChange={() => {}} />
        </EmrRow>
      </View>
    </View>
  );
}

function ToggleDemo() {
  const [a, setA] = useState<boolean | null>(true);
  const [b, setB] = useState<boolean | null>(false);
  return (
    <EmrRow columns={3}>
      <EmrToggle label="Dilated" value={a} onValueChange={setA} />
      <EmrToggle label="Contact lens worn" hint="Off by default." value={b} onValueChange={setB} />
      <EmrToggle label="Read-only on" readOnly value onValueChange={() => {}} />
      <EmrToggle label="Disabled" disabled value={false} onValueChange={() => {}} />
      <EmrToggle label="With warning" warning="Confirm with patient." value onValueChange={() => {}} />
    </EmrRow>
  );
}

function RadioDemo() {
  const [v, setV] = useState<string | null>('f');
  const [prio, setPrio] = useState<string | null>('soon');
  return (
    <EmrColumns count={2} gap={16}>
      <EmrRadioGroup label="Sex (horizontal equal-width)" orientation="horizontal" columns={3} options={sexOptions} value={v} onValueChange={setV} />
      <EmrRadioGroup label="Referral priority (vertical equal-width)" orientation="vertical" options={referralPriorityOptions} value={prio} onValueChange={setPrio} />
      <EmrRadioGroup label="Read-only" readOnly orientation="horizontal" columns={3} options={sexOptions} value="m" onValueChange={() => {}} />
      <EmrRadioGroup label="Error" required error="Choose one." orientation="horizontal" columns={3} options={sexOptions} value={null} onValueChange={() => {}} />
    </EmrColumns>
  );
}

export const gallery: GallerySection[] = [
  { id: 'row-alignment', title: 'Row alignment (4 mixed fields in one row)', render: RowAlignmentDemo },
  { id: 'buttons-select', title: 'EmrButton & EmrSelect', render: ButtonAndSelectDemo },
  { id: 'number-input', title: 'EmrNumberInput (− / + stepper, integer & decimal)', render: NumberDemo },
  { id: 'date-input', title: 'EmrDateInput (Full date, Year-Month, Year only)', render: DateDemo },
  { id: 'time-input', title: 'EmrTimeInput (hh:mm & hh:mm:ss)', render: TimeDemo },
  { id: 'datetime-input', title: 'EmrDateTimeInput (hh:mm & hh:mm:ss)', render: DateTimeDemo },
  { id: 'text-input', title: 'EmrTextInput', render: TextDemo },
  { id: 'quantity-input', title: 'EmrQuantityInput', render: QuantityDemo },
  { id: 'paired-input', title: 'EmrPairedInput (OD / OS)', render: PairedDemo },
  { id: 'checkbox', title: 'EmrCheckbox (Horizontal & Vertical equal-width)', render: CheckboxDemo },
  { id: 'radio-group', title: 'EmrRadioGroup (Horizontal & Vertical equal-width, zero text shift)', render: RadioDemo },
  { id: 'toggle', title: 'EmrToggle', render: ToggleDemo },
];
