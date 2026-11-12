'use client';

import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { createClinicalNoteDemo } from '../../../../examples/clinical-notes/clinical-note.fixture';
import { EmrClinicalNoteWorkspace } from '../../src/l4-clinical-note';
import { EmrButton } from '../../src/primitives';
import { useEmrTheme } from '../../src/theme';
import { useControllerState } from '../../src/use-controller';
import type { GallerySection } from './types';

const settings = [
  { id: 'opd', label: 'OPD consultation' },
  { id: 'ipd', label: 'IPD progress note' },
  { id: 'ot', label: 'OT operative note' },
] as const;

type Setting = typeof settings[number]['id'];
type DemoController = ReturnType<typeof createClinicalNoteDemo>;
const screenOnly = Platform.OS === 'web' ? { dataSet: { emrNoteInteractive: '' } } : {};

function DemoNote({ controller, onPrint }: { controller: DemoController; onPrint?: () => void }) {
  const model = useControllerState(controller);
  return (
    <>
      {onPrint && model.current ? (
        <View {...screenOnly}><EmrButton label="Print signed note" variant="outline" onPress={onPrint} /></View>
      ) : null}
      <EmrClinicalNoteWorkspace model={model} onIntent={intent => controller.dispatch(intent)} />
    </>
  );
}

export function ClinicalNoteDemo({ onPrint }: { onPrint?: () => void }) {
  const [controllers, setControllers] = useState<Record<Setting, DemoController>>();
  const [setting, setSetting] = useState<Setting>('opd');
  const [role, setRole] = useState<'author' | 'reviewer' | 'clinician'>('author');
  const theme = useEmrTheme();

  useEffect(() => {
    const next = {
      opd: createClinicalNoteDemo('opd'),
      ipd: createClinicalNoteDemo('ipd'),
      ot: createClinicalNoteDemo('ot'),
    };
    setControllers(next);
    return () => Object.values(next).forEach(controller => controller.destroy());
  }, []);

  function selectSetting(next: Setting) {
    controllers?.[next].selectActor('author');
    setRole('author');
    setSetting(next);
  }

  const controller = controllers?.[setting];
  function selectRole(next: typeof role) {
    controller?.selectActor(next);
    setRole(next);
  }

  return (
    <View style={{ gap: 12 }}>
      <View {...screenOnly} style={{ gap: 8 }}>
        <Text style={{ color: theme.textMuted }}>Synthetic clinical records. Signatures and edits are simulated for this session.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {settings.map(item => (
            <EmrButton key={item.id} label={item.label} variant={setting === item.id ? 'primary' : 'outline'}
              onPress={() => selectSetting(item.id)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <EmrButton label="Note author" variant={role === 'author' ? 'primary' : 'outline'} onPress={() => selectRole('author')} />
          {setting === 'ipd' ? (
            <EmrButton label="Consultant reviewer" variant={role === 'reviewer' ? 'primary' : 'outline'} onPress={() => selectRole('reviewer')} />
          ) : null}
          <EmrButton label="Read-only clinician" variant={role === 'clinician' ? 'primary' : 'outline'} onPress={() => selectRole('clinician')} />
        </View>
      </View>
      {controller ? <DemoNote key={setting} controller={controller} onPrint={onPrint} /> : null}
    </View>
  );
}

export const clinicalNoteGallery: GallerySection = {
  id: 'clinical-note-workspace',
  title: 'Clinical note workspace · OPD, IPD and OT',
  render: () => <ClinicalNoteDemo />,
};
