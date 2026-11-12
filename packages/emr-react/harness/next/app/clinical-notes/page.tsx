'use client';

import { ClinicalNoteDemo } from '../../../gallery/clinical-note-workspace';
import { EmrThemeProvider } from '../../../../src/theme';

export default function ClinicalNotesPage() {
  return (
    <EmrThemeProvider>
      <main id="clinical-note-demo" style={{ maxWidth: 1120, margin: '0 auto', padding: 16 }}>
        <ClinicalNoteDemo onPrint={() => window.print()} />
      </main>
    </EmrThemeProvider>
  );
}
