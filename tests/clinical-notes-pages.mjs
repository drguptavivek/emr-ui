import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch();
const errors = [];

async function openPage(path, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('http://emr.test/emr-ui/**', async route => {
    const asset = new URL(route.request().url()).pathname.slice('/emr-ui/'.length);
    const file = !asset || asset.endsWith('/') ? asset + 'index.html' : asset;
    try {
      await route.fulfill({ path: join('dist/gh-pages', file) });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });
  await page.goto(`http://emr.test/emr-ui/${path}`);
  return page;
}

function action(note, name) {
  return note.getByRole('button', { name, exact: true });
}

try {
  const gallery = await openPage('', 1440);
  await expect(gallery.locator('#gallery-clinical-note-workspace').getByRole('button', { name: 'OPD consultation' })).toBeVisible();
  await gallery.close();
  const page = await openPage('clinical-notes/', 1440);
  const note = page.locator('#clinical-note-demo');
  await expect(note.getByRole('heading', { name: 'Consultation note', exact: true })).toBeVisible();
  await note.getByRole('textbox', { name: 'Plan', exact: true }).fill('Review the symptom diary at follow-up.');
  await action(note, 'Review note').click();
  await expect(note.getByText('Review the symptom diary at follow-up.', { exact: true })).toBeVisible();
  await action(note, 'Sign note').click();
  await expect(note.getByRole('status').filter({ hasText: /Signed.*v1/ })).toBeVisible();
  await action(note, 'Add telephone addendum').click();
  await note.getByRole('textbox', { name: 'Telephone update' }).fill('Patient reports symptoms have settled.');
  await action(note, 'Review addendum').click();
  await action(note, 'Sign addendum').click();
  await expect(note.getByText('Patient reports symptoms have settled.', { exact: true }).first()).toBeVisible();

  await action(note, 'IPD progress note').click();
  await expect(note.getByRole('status').filter({ hasText: /Awaiting co-signature/ })).toBeVisible();
  await expect(action(note, 'Co-sign note')).toHaveCount(0);
  await action(note, 'Consultant reviewer').click();
  await action(note, 'Review for co-signature').click();
  await action(note, 'Co-sign note').click();
  await expect(note.getByText(/^Co-signed by /).first()).toBeVisible();

  await action(note, 'OT operative note').click();
  await action(note, 'Amend signed note').click();
  await expect(note.getByText('Gallbladder sent to pathology.', { exact: true }).first()).toBeVisible();
  await note.getByRole('textbox', { name: 'Reason for amendment' }).fill('Verified against the theatre register.');
  await note.getByRole('textbox', { name: 'Specimen', exact: true }).fill('Specimen label verified against the theatre register.');
  await action(note, 'Review amendment').click();
  await action(note, 'Sign amendment').click();
  await action(note, 'Compare 1 with 2').click();
  await expect(note.getByRole('heading', { name: 'Changed sections' })).toBeVisible();
  await expect(note.getByText('Gallbladder sent to pathology.', { exact: true })).toBeVisible();
  await expect(note.getByText('Specimen label verified against the theatre register.', { exact: true }).first()).toBeVisible();

  await page.evaluate(() => { window.print = () => document.body.setAttribute('data-printed', 'yes'); });
  await action(note, 'Print signed note').click();
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'yes');
  await page.emulateMedia({ media: 'print' });
  await expect(note.getByRole('heading', { name: 'Changed sections' })).toBeHidden();
  await expect(note.getByText('Specimen label verified against the theatre register.', { exact: true }).first()).toBeVisible();
  await expect(note.getByText(/^Signed by /).first()).toBeVisible();

  const mobile = await openPage('lit/', 390);
  await mobile.locator('#btn-theme').click();
  await expect(mobile.locator('html')).toHaveClass('emr-theme-dark');
  const lit = mobile.locator('#clinical-note-example');
  await lit.getByLabel('Care setting').selectOption('ot');
  await action(lit, 'Amend signed note').click();
  await lit.getByRole('textbox', { name: 'Reason for amendment' }).fill('Document the verified specimen label.');
  await lit.getByRole('textbox', { name: 'Specimen', exact: true }).fill('Label verified.');
  await action(lit, 'Review amendment').click();
  await action(lit, 'Sign amendment').click();
  await action(lit, 'Compare 1 with 2').click();
  await expect(lit.getByRole('heading', { name: 'Changed sections' })).toBeVisible();
  await expect(lit.getByText('Label verified.', { exact: true }).first()).toBeVisible();

  const angular = await openPage('storybook/iframe.html?id=emr-notes-clinical-note-workspace--operating-theatre-amendment&viewMode=story', 1280);
  const angularNote = angular.locator('emr-clinical-note-workspace');
  await expect(angularNote.getByRole('heading', { name: 'Operative note', exact: true })).toBeVisible();
  await expect(angularNote.getByText('Container label verified against theatre register.', { exact: true })).toHaveCount(2);
  await angular.emulateMedia({ media: 'print' });
  await expect(angularNote.getByRole('heading', { name: 'Changed sections' })).toBeHidden();
  await expect(angularNote.getByText(/^Signed by: Dr A. Rao/)).toBeVisible();

  expect(errors).toEqual([]);
  console.log('Clinical notes passed in Chromium for OPD addendum, IPD co-signature, OT amendment, React print, mobile Lit and Angular Storybook.');
} finally {
  await browser.close();
}
