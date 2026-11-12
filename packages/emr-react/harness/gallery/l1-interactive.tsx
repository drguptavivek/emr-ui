'use client';

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AsyncSearchController, hierarchySearchOptions, type AsyncSearchState, type EmrOption, type HierarchyNode, type TimeAxisViewModel } from '@drguptavivek/emr-controller';
import { EmrLikert, EmrSearchSelect, EmrStageStepper, EmrTabs, EmrTimeAxis, EmrVas } from '../../src';
import type { GallerySection } from './types';

const TABS: EmrOption[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'vitals', label: 'Vitals' },
  { value: 'locked', label: 'Locked', disabled: true },
  { value: 'notes', label: 'Notes' },
];

function TabsDemo() {
  const [active, setActive] = useState('summary');
  return <EmrTabs tabs={TABS} active={active} onTabChange={setActive} ariaLabel="Demo sections" />;
}

const CATALOG: EmrOption[] = [
  { value: 'a', label: 'Sample item A', description: 'Synthetic description' },
  { value: 'b', label: 'Sample item B' },
  { value: 'c', label: 'Sample item C (unavailable)', disabled: true },
  { value: 'd', label: 'Sample item D' },
];

function SearchDemo() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const options = CATALOG.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const toggle = (v: string) => setPicked(p => (p.includes(v) ? p.filter(x => x !== v) : [...p, v]));
  return (
    <EmrSearchSelect label="Find items" multiple query={query} options={options} open={open}
      selected={CATALOG.filter(o => picked.includes(o.value))}
      onQueryChange={setQuery} onSearchRequested={() => setOpen(true)} onOpenRequested={() => setOpen(true)} onCloseRequested={() => setOpen(false)}
      onOptionSelect={toggle} onRemoveRequested={toggle} />
  );
}

const HIERARCHICAL_CATALOG: readonly HierarchyNode[] = [{
  id: 'laboratory', label: 'Laboratory', kind: 'group', selectable: false, children: [{
    id: 'chemistry', label: 'Clinical chemistry', kind: 'group', selectable: false, children: [
      { id: 'glucose', label: 'Serum glucose', code: 'GLU', kind: 'item', selectable: true },
      { id: 'creatinine', label: 'Serum creatinine', code: 'CREAT', kind: 'item', selectable: true },
    ],
  }, {
    id: 'haematology', label: 'Haematology', kind: 'group', selectable: false, children: [
      { id: 'cbc', label: 'Complete blood count', code: 'CBC', kind: 'item', selectable: true },
    ],
  }],
}];

function HierarchySearchDemo() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AsyncSearchState<EmrOption>>({ query: '', options: [], selected: [], loading: false, page: 1, pageSize: 20, total: 0 });
  const controller = useRef<AsyncSearchController<EmrOption> | null>(null);
  useEffect(() => {
    const instance = new AsyncSearchController<EmrOption>({
      search: async ({ query, page, pageSize }) => {
        const matches = hierarchySearchOptions(HIERARCHICAL_CATALOG, query);
        return { items: matches.slice((page - 1) * pageSize, page * pageSize), total: matches.length };
      },
    }, undefined, { debounceMs: 200 });
    controller.current = instance;
    const unsubscribe = instance.subscribe(setState);
    return () => { unsubscribe(); instance.destroy(); controller.current = null; };
  }, []);
  return <EmrSearchSelect label="Search hierarchical catalogue" multiple query={state.query} options={state.options} selected={state.selected}
    open={open} loading={state.loading} error={state.error}
    onQueryChange={query => { setOpen(true); controller.current?.dispatch({ type: 'queryChanged', query }); }}
    onSearchRequested={() => { setOpen(true); controller.current?.dispatch({ type: 'searchRequested' }); }}
    onOpenRequested={() => { setOpen(true); controller.current?.dispatch({ type: 'searchRequested' }); }}
    onCloseRequested={() => setOpen(false)}
    onOptionSelect={value => {
      const option = state.options.find(item => item.value === value);
      if (option && !option.disabled && !state.selected.some(item => item.value === value)) {
        controller.current?.dispatch({ type: 'selectionChanged', selected: [...state.selected, option] });
      }
      setOpen(false);
    }}
    onRemoveRequested={value => controller.current?.dispatch({ type: 'selectionChanged', selected: state.selected.filter(item => item.value !== value) })} />;
}

function LikertDemo() {
  const [value, setValue] = useState<number | null>(7);
  return (
    <EmrLikert label="Sample score" min={0} max={10} value={value} onValueChange={setValue} tone={value !== null && value >= 7 ? 'danger' : 'info'}
      anchors={[{ value: 0, label: 'None' }, { value: 10, label: 'Worst' }]} hint="Choose one point on the scale" />
  );
}

function VasDemo() {
  const [h, setH] = useState<number | null>(4.3);
  const [v, setV] = useState<number | null>(65);
  return (
    <View style={{ gap: 20 }}>
      <EmrVas label="Horizontal 0–10 (continuous 0.1 step)" min={0} max={10} step={0.1} majorInterval={1} minorInterval={0.5} value={h} onValueChange={setH}
        valueText={h === null ? undefined : `${h} out of 10`} anchors={[{ value: 0, label: 'None (0.0)' }, { value: 10, label: 'Worst (10.0)' }]} />
      <EmrVas label="Vertical 0–100" orientation="vertical" step={1} value={v} onValueChange={setV} valueText={v === null ? undefined : `${v} out of 100`}
        anchors={[{ value: 0, label: 'Worst' }, { value: 100, label: 'Best' }]} />
    </View>
  );
}

const STAGES = [
  { id: 'referred', label: 'Referred', status: { label: 'Done', tone: 'success' as const } },
  { id: 'accepted', label: 'Accepted', description: 'Awaiting slot', status: { label: 'Pending', tone: 'warning' as const } },
  { id: 'seen', label: 'Seen' },
];

function StepperDemo() {
  const [active, setActive] = useState('accepted');
  return (
    <>
      <EmrStageStepper stages={STAGES} activeId={active} onStageSelect={setActive} />
      <EmrStageStepper stages={STAGES} activeId={active} readOnly orientation="vertical" ariaLabel="Referral progress" />
    </>
  );
}

const TICKS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

function TimeAxisDemo() {
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | undefined>('t1');
  const [step, setStep] = useState('60');
  const model: TimeAxisViewModel = {
    id: 'demo-axis', title: 'Chart window',
    ticks: TICKS.slice(offset, offset + 5).map((label, i) => ({ id: `t${offset + i}`, label, sublabel: 'Day 1', current: offset + i === 3 })),
    selectedTickId: selected, selectedStepId: step,
    steps: [{ id: '60', label: 'Hourly' }, { id: '30', label: '30 min' }],
    canShiftEarlier: offset > 0, canShiftLater: offset + 5 < TICKS.length,
  };
  return (
    <EmrTimeAxis model={model} onIntent={i => {
      if (i.type === 'tickSelected') setSelected(i.tickId);
      else if (i.type === 'shiftEarlierRequested') setOffset(o => Math.max(0, o - 1));
      else if (i.type === 'shiftLaterRequested') setOffset(o => o + 1);
      else setStep(i.stepId);
    }} />
  );
}

export const gallery: GallerySection[] = [
  { id: 'tabs', title: 'EmrTabs', render: () => <TabsDemo /> },
  { id: 'search-select', title: 'EmrSearchSelect', render: () => <SearchDemo /> },
  { id: 'hierarchy-search-select', title: 'EmrSearchSelect — hierarchical catalogue', render: () => <HierarchySearchDemo /> },
  { id: 'likert', title: 'EmrLikert', render: () => <LikertDemo /> },
  { id: 'vas', title: 'EmrVas', render: () => <VasDemo /> },
  { id: 'stage-stepper', title: 'EmrStageStepper', render: () => <StepperDemo /> },
  { id: 'time-axis', title: 'EmrTimeAxis', render: () => <TimeAxisDemo /> },
];
