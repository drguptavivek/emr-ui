import '@angular/compiler';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { chromium, expect } from '@playwright/test';
import { EmrSsrHostComponent } from './ssr-host.mjs';

const html = await renderApplication(
  context => bootstrapApplication(EmrSsrHostComponent, { providers: [provideClientHydration()] }, context),
  { document: '<!doctype html><html><body><emr-ssr-host></emr-ssr-host></body></html>', url: 'http://localhost/', allowedHosts: ['localhost'] }
);

for (const expected of ['role="dialog"', 'SSR document', 'Synthetic document page', 'Patient encounters', 'Fundus findings (controller example)', 'Optic disc, Right eye (OD)', 'Optic disc, Left eye (OS)', 'Supplied OS finding', 'Create an EMR field', 'SSR reusable template', 'SSR PAC checklist', 'ngh="']) {
  if (!html.includes(expected)) throw new Error(`SSR output is missing ${expected}`);
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'emr-hydration-'));
const browserBundle = join(temporaryDirectory, 'hydration-client.js');
try {
  await build({ entryPoints: [new URL('./hydration-client.mjs', import.meta.url).pathname], bundle: true, format: 'iife', platform: 'browser', outfile: browserBundle });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', error => consoleErrors.push(String(error)));
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ path: browserBundle });
    await page.waitForFunction(() => globalThis.__emrHydrated === true || Boolean(globalThis.__emrHydrationError), null, { timeout: 10_000 }).catch(async error => {
      const flags = await page.evaluate(() => ({ hydrated: globalThis.__emrHydrated, error: globalThis.__emrHydrationError }));
      throw new Error(`Client hydration did not settle: ${String(error)}; flags=${JSON.stringify(flags)}; console=${consoleErrors.join('\n')}`);
    });
    const hydrationError = await page.evaluate(() => globalThis.__emrHydrationError ?? null);
    if (hydrationError) throw new Error(`Client hydration failed: ${hydrationError}`);
    if (consoleErrors.some(message => /NG05\d\d|hydration mismatch/i.test(message))) {
      throw new Error(`Client hydration reported an Angular mismatch: ${consoleErrors.join('\n')}`);
    }
    const timelineButton = page.locator('.emr-timeline__button').first();
    await timelineButton.focus();
    if (!(await timelineButton.evaluate(element => element === document.activeElement))) throw new Error('Hydrated timeline is not focusable');

    const fundus = page.locator('emr-specialty-exam-matrix');
    const matrix = page.locator('emr-clinical-matrix').getByRole('table');
    const rightMatrixCell = matrix.getByRole('textbox', { name: 'Optic disc, Right eye (OD)' });
    const leftMatrixCell = matrix.getByRole('textbox', { name: 'Optic disc, Left eye (OS)' });
    await expect(rightMatrixCell).toHaveValue('');
    await expect(leftMatrixCell).toHaveValue('Supplied OS finding');
    // Restore the DOM value after the event so only a new model can render the accepted value.
    await rightMatrixCell.evaluate(input => {
      const previous = input.value;
      input.value = 'Controller accepted OD finding';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.value = previous;
    });
    await expect(rightMatrixCell).toHaveValue('Controller accepted OD finding');
    const accepted = page.locator('#matrix-values');
    await expect(accepted.getByText('Accepted OD: Controller accepted OD finding', { exact: true })).toBeVisible();
    await expect(accepted.getByText('Accepted OS: Supplied OS finding', { exact: true })).toBeVisible();
    await expect(leftMatrixCell).toHaveValue('Supplied OS finding');
    await leftMatrixCell.fill('Controller accepted OS edit');
    await expect(accepted.getByText('Accepted OS: Controller accepted OS edit', { exact: true })).toBeVisible();
    await expect(rightMatrixCell).toHaveValue('Controller accepted OD finding');

    await fundus.getByRole('button', { name: 'Dermatology', exact: true }).dispatchEvent('click');
    const region = fundus.getByRole('button', { name: /Face & Neck/ });
    await region.dispatchEvent('click');
    await expect(region).toHaveAttribute('aria-pressed', 'true');
    await fundus.getByRole('button', { name: 'Pediatrics', exact: true }).dispatchEvent('click');
    await fundus.getByRole('button', { name: '+ 1 kg', exact: true }).dispatchEvent('click');
    await expect(fundus.getByText(/Weight: 13 kg/)).toBeVisible();
    await fundus.getByRole('button', { name: 'Ophthalmology', exact: true }).dispatchEvent('click');

    const rightDisc = fundus.getByRole('textbox', { name: 'Optic disc, Right eye (OD)' });
    await expect(rightDisc).toHaveValue('');
    await rightDisc.fill('Unaccepted finding');
    await expect(page.locator('#fundus-intent')).toHaveText(JSON.stringify({
      type: 'ophthalmicCellChanged', rowId: 'disc', eye: 'od', value: 'Unaccepted finding',
    }));
    await rightDisc.blur();
    await expect(rightDisc).toHaveValue('');
    await rightDisc.fill('Unsaved before lock');
    await page.getByRole('button', { name: 'Lock fundus exam' }).dispatchEvent('click');
    await expect(fundus.getByRole('textbox')).toHaveCount(0);
    await expect(fundus).toContainText('Supplied left finding');
    await expect(fundus).not.toContainText('Unsaved before lock');
    await fundus.getByRole('button', { name: 'Oncology', exact: true }).dispatchEvent('click');
    const dose = fundus.getByRole('button', { name: '80%', exact: true });
    await expect(dose).toBeDisabled();
    await dose.dispatchEvent('click');
    await expect(page.locator('#fundus-intent')).toHaveText(JSON.stringify({ type: 'specialtyChanged', specialty: 'oncology' }));

    const decrease = page.locator('emr-prescribing-table').getByRole('button', { name: 'Decrease dose for row 1' });
    await expect(decrease).toBeDisabled();
    await decrease.dispatchEvent('click');
    await expect(page.locator('#prescribing-intent')).toHaveText('');

  } finally {
    await browser.close();
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
