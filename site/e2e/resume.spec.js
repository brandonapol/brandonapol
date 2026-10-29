import { test, expect } from '@playwright/test';

test('skip link goes to the plain résumé', async ({ page }) => {
  await page.goto('./');
  await page.locator('#skip').click();
  await expect(page).toHaveURL(/resume\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Brandon Apol');
  await expect(page.getByRole('heading', { name: /Senior Site Reliability Engineer/ })).toBeVisible();
  await expect(page.getByRole('link', { name: '← back to the office' })).toHaveAttribute('href', './');
});

test('résumé page keeps the phone number and email off the public site', async ({ page }) => {
  await page.goto('./resume.html');
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/\d{3}-\d{3}-\d{4}/);
  expect(text).not.toMatch(/@gmail\.com/);
});
