import { ClinicalNoteWorkspaceController, type ClinicalNoteScenario } from './clinical-note.controller';

export function createClinicalNoteDemo(scenario: ClinicalNoteScenario, now?: () => string): ClinicalNoteWorkspaceController {
  let minute = 50;
  const formatter = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  });
  return new ClinicalNoteWorkspaceController(scenario, now ?? (() => {
    const time = new Date(Date.UTC(2026, 10, 11, 10, minute++));
    return `${formatter.format(time)} IST`;
  }));
}
