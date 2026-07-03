import { test, expect } from '@playwright/test';

test('UI renders core sections', async ({ page, baseURL }) => {
  const base = baseURL || 'http://localhost:4173';
  await page.goto(base + '/');
  await expect(page.getByRole('heading', { name: /VoiceFlow Pro UI Components/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Voice Recording/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Language Selection/i })).toBeVisible();
});