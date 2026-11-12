import type { ClinicalMatrixSchema, ClinicalMatrixValues } from '../../packages/emr-controller/src/models.js';

export const matrixSchema: ClinicalMatrixSchema = {
  id: 'controller-matrix-example',
  label: 'Fundus findings (controller example)',
  columns: [
    { id: 'od', label: 'Right eye (OD)' },
    { id: 'os', label: 'Left eye (OS)' },
  ],
  rows: [{ id: 'disc', label: 'Optic disc', type: 'text' }],
};

export const matrixValues: ClinicalMatrixValues = {
  disc: {
    cells: { od: { value: null }, os: { value: 'Supplied OS finding' } },
    remark: '',
  },
};
