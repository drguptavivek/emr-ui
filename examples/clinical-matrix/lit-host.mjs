import { ClinicalMatrixController } from '../../packages/emr-controller/dist/clinical-matrix.controller.js';
import { matrixSchema, matrixValues } from './fixture.ts';

export { registerAllEmrElements } from '../../packages/emr-elements/dist/index.js';

export function mountClinicalMatrixExample(matrix, acceptedRight, acceptedLeft) {
  const controller = new ClinicalMatrixController(matrixSchema, matrixValues);
  const unsubscribe = controller.subscribe(({ schema, values }) => {
    matrix.definition = schema;
    matrix.model = values;
    acceptedRight.textContent = 'Accepted OD: ' + (values.disc.cells.od.value ?? '');
    acceptedLeft.textContent = 'Accepted OS: ' + (values.disc.cells.os.value ?? '');
  });

  const onIntent = (event) => {
    if (event.composedPath()[0] === matrix) controller.dispatch(event.detail);
  };
  matrix.addEventListener('intent', onIntent);

  return () => {
    matrix.removeEventListener('intent', onIntent);
    unsubscribe();
    controller.destroy();
  };
}
