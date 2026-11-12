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
      await route.fulfill({ path: join('dist/gh-pages', asset.endsWith('/') || !asset ? asset + 'index.html' : asset) });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });

  for (const [route, selector] of [
    ['', '#gallery-controller-matrix-example'],
    ['lit/', '#controller-matrix-example'],
  ]) {
    await page.goto('http://emr.test/emr-ui/' + route);
    const example = page.locator(selector);
    const rightEye = example.getByRole('textbox', { name: 'Optic disc, Right eye (OD)', exact: true });
    const leftEye = example.getByRole('textbox', { name: 'Optic disc, Left eye (OS)', exact: true });

    await expect(rightEye).toHaveValue('');
    await expect(leftEye).toHaveValue('Supplied OS finding');
    await rightEye.fill('Synthetic OD finding');
    await rightEye.blur();
    await expect(example.getByText('Accepted OD: Synthetic OD finding', { exact: true })).toBeVisible();
    await expect(rightEye).toHaveValue('Synthetic OD finding');
    await expect(leftEye).toHaveValue('Supplied OS finding');

    await leftEye.fill('Synthetic OS edit');
    await leftEye.blur();
    await expect(example.getByText('Accepted OS: Synthetic OS edit', { exact: true })).toBeVisible();
    await expect(rightEye).toHaveValue('Synthetic OD finding');
  }
  expect(errors).toEqual([]);
  console.log('React and Lit both rendered controller-accepted OD and OS edits.');
} finally {
  await browser.close();
}
