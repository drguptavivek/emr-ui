import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('http://emr.test/emr-ui/**', async route => {
    const asset = new URL(route.request().url()).pathname.slice('/emr-ui/'.length);
    try {
      const file = !asset || asset.endsWith('/') ? asset + 'index.html' : asset;
      await route.fulfill({ path: join('dist/gh-pages', file) });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });

  await page.goto('http://emr.test/emr-ui/');
  const glaucoma = page.locator('#gallery-glaucoma-follow-up');
  const right = glaucoma.getByRole('textbox', { name: 'Optic disc, right eye (OD)' });
  const left = glaucoma.getByRole('textbox', { name: 'Optic disc, left eye (OS)' });
  const followUp = glaucoma.getByRole('textbox', { name: 'Follow-up owner and plan' });
  await expect(glaucoma.getByText('Draft · Revision 0')).toBeVisible();
  await expect(glaucoma.getByText('Earlier: 76 µm')).toBeVisible();
  await right.fill('Synthetic OD exam');
  await left.fill('Synthetic OS exam');
  await followUp.fill('Synthetic clinic team to review');
  await glaucoma.getByRole('button', { name: /^Acknowledge OCT/ }).click();
  await expect(glaucoma.getByRole('button', { name: /Synthetic patient B/ })).toBeDisabled();
  await glaucoma.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(glaucoma.getByText('Draft · Revision 1', { exact: true })).toBeVisible();
  await right.fill('Discard this change');
  await glaucoma.getByRole('button', { name: 'Discard unsaved edits' }).click();
  await expect(right).toHaveValue('Synthetic OD exam');
  await glaucoma.getByRole('button', { name: /Synthetic patient B/ }).click();
  await expect(right).toHaveValue('');
  await expect(left).toHaveValue('');
  await expect(glaucoma.getByText('OCT retinal nerve fibre layer — OD')).toHaveCount(0);

  await page.reload();
  await expect(right).toHaveValue('Synthetic OD exam');
  await expect(left).toHaveValue('Synthetic OS exam');
  await expect(followUp).toHaveValue('Synthetic clinic team to review');
  await expect(glaucoma.getByText('Result acknowledged', { exact: true })).toHaveCount(1);
  await glaucoma.getByRole('button', { name: 'Sign synthetic note' }).click();
  await expect(glaucoma.getByText('Signed · Revision 2')).toBeVisible();
  await expect(right).not.toBeEditable();
  await expect(left).not.toBeEditable();
  await expect(glaucoma.getByRole('button', { name: 'Save draft', exact: true })).toBeDisabled();

  const original = glaucoma.locator('#glaucoma-signed-revision-2');
  const oct = glaucoma.locator('#glaucoma-result-a-result-oct');
  const acknowledge = oct.getByRole('button', { name: /^Acknowledge OCT/ });
  await expect(original.getByText('OD examination: Synthetic OD exam')).toBeVisible();
  await expect(original.getByText('Average RNFL: 74 µm')).toBeVisible();
  await expect(original.getByText(/OCT.*Report revision 1.*Acknowledged at signing/)).toBeVisible();
  await expect(acknowledge).toBeDisabled();
  await glaucoma.getByRole('button', { name: 'Publish synthetic OCT correction' }).click();
  await expect(oct.getByText('Report revision 2 · Corrected')).toBeVisible();
  await expect(oct.getByText('71 µm', { exact: true })).toBeVisible();
  await expect(oct.getByText('Awaiting acknowledgement')).toBeVisible();
  await expect(glaucoma.getByText('Signed · Revision 2')).toBeVisible();
  await expect(right).not.toBeEditable();
  await acknowledge.click();
  await expect(oct.getByText('Result acknowledged')).toBeVisible();
  await page.reload();
  await expect(oct.getByText('Report revision 2 · Corrected')).toBeVisible();
  await expect(oct.getByText('Result acknowledged')).toBeVisible();

  const startAmendment = glaucoma.getByRole('button', { name: 'Start amendment' });
  await expect(startAmendment).toBeDisabled();
  await glaucoma.getByRole('textbox', { name: 'Amendment reason' }).fill('Clarify synthetic OD entry');
  await startAmendment.click();
  await expect(glaucoma.getByText('Draft · Revision 3')).toBeVisible();
  await expect(glaucoma.getByText('Amendment of signed revision 2. Reason: Clarify synthetic OD entry')).toBeVisible();
  await expect(left).toHaveValue('Synthetic OS exam');
  await right.fill('Amended synthetic OD exam');
  await glaucoma.getByRole('button', { name: 'Sign synthetic note' }).click();
  await expect(glaucoma.getByText('Signed · Revision 4')).toBeVisible();
  await page.reload();
  await expect(right).toHaveValue('Amended synthetic OD exam');
  await expect(right).not.toBeEditable();
  await expect(original.getByText('OD examination: Synthetic OD exam')).toBeVisible();
  await expect(original.getByText(/OCT.*Report revision 1.*Acknowledged at signing/)).toBeVisible();
  await expect(glaucoma.locator('#glaucoma-signed-revision-4').getByText('OD examination: Amended synthetic OD exam')).toBeVisible();

  const dropdown = page.locator('#gallery-hierarchy-search-select');
  const query = dropdown.getByRole('combobox', { name: 'Search hierarchical catalogue' });
  await query.fill('CBC');
  const match = dropdown.getByRole('option', { name: /Complete blood count/i });
  await expect(match).toContainText('Laboratory › Haematology');
  await match.click();
  await expect(dropdown.getByRole('button', { name: /Remove Complete blood count/i })).toBeVisible();
  await query.fill('zzz-no-match');
  await expect(dropdown.getByText(/no match/i)).toBeVisible();
  await expect(match).toHaveCount(0);

  const reactExam = page.locator('#gallery-l4-specialty-exam-matrix');
  await reactExam.getByRole('button', { name: /Dermatology/i }).click();
  const reactRegion = reactExam.getByRole('button', { name: /Face & Neck/ });
  await reactRegion.click();
  await expect(reactRegion).toHaveAttribute('aria-pressed', 'true');
  await reactExam.getByRole('button', { name: 'Lock fixture' }).click();
  await expect(reactRegion).toBeDisabled();
  await reactExam.getByRole('button', { name: /Oncology/i }).click();
  await expect(reactExam.getByRole('button', { name: /^80%/ })).toBeDisabled();
  await expect(reactExam.getByText('Fixture haematology reviewed')).toBeVisible();

  const reactRx = page.locator('#gallery-prescribing-table-composer');
  await reactRx.getByRole('button', { name: '+ Add medicine row', exact: true }).click();
  await expect(reactRx.getByRole('button', { name: 'Decrease dose quantity for medicine', exact: true })).toBeDisabled();

  await page.goto('http://emr.test/emr-ui/lit/');
  const litExam = page.locator('emr-specialty-exam-matrix');
  await litExam.getByRole('button', { name: /Pediatrics/i }).click();
  await litExam.getByRole('button', { name: '+ 1 kg', exact: true }).click();
  await expect(litExam.getByText(/Weight: 13 kg/)).toBeVisible();
  await litExam.getByRole('button', { name: /Dermatology/i }).click();
  const litRegion = litExam.getByRole('button', { name: /Face & Neck/ });
  await litRegion.click();
  await expect(litRegion).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Lock fixture' }).click();
  await expect(litRegion).toBeDisabled();
  await litExam.getByRole('button', { name: /Oncology/i }).click();
  await expect(litExam.getByRole('button', { name: '80%', exact: true })).toBeDisabled();

  const rx = page.locator('emr-prescribing-table');
  const medicine = rx.getByRole('textbox', { name: 'Row 1 medicine name' });
  await medicine.fill('Salbutamol');
  await rx.getByRole('button', { name: /Salbutamol MDI.*RXN-745679/ }).click();
  await expect(medicine).toHaveValue('Salbutamol MDI');
  await expect(rx.locator('tbody tr').first()).toContainText('SOS');
  await medicine.fill('zz-no-fixture-match');
  await expect(rx.getByText('No formulary results.')).toBeVisible();
  await expect(rx.getByRole('button', { name: /RXN-745679/ })).toHaveCount(0);
  await rx.getByRole('button', { name: '+ Add medicine row', exact: true }).click();
  const decrease = rx.getByRole('button', { name: 'Decrease dose for row 4', exact: true });
  await expect(decrease).toBeDisabled();
  await decrease.dispatchEvent('click');
  expect(await rx.evaluate(element => element.model.rows[3].doseAmount)).toBeNull();
  expect(errors).toEqual([]);
  console.log('Verified synthetic glaucoma draft, signature, correction, and amendment workflows, specialty locking, and repository-backed formulary search.');
} finally {
  await browser.close();
}
