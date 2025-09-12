import { test, expect } from '@playwright/test';
import { storageResetInit, mockStaticData } from '../utils/testUtils';


test.beforeEach(async ({ page }) => {
  await storageResetInit(page);
  await mockStaticData(page);
});

test('open morphology modal from verse options', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Options' }).first().click();

  const morphItem = page.getByText(/Morphology|Word Morphology/i).first();
  await morphItem.click({ trial: true }).catch(() => {});
  await morphItem.click().catch(() => {});

  const modal = page.locator('[role="dialog"], #morphology-modal');
  await expect(modal).toBeVisible({ timeout: 10000 });
});

test('open tafsir modal from verse options', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Options' }).first().click();

  const tafsirItem = page.getByText(/Tafsir|Exegesis/i).first();
  await tafsirItem.click({ trial: true }).catch(() => {});
  await tafsirItem.click().catch(() => {});

  const modal = page.locator('[role="dialog"], #tafsir-modal');
  await expect(modal).toBeVisible({ timeout: 10000 });
});
