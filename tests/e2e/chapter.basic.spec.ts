import { test, expect } from '@playwright/test';
import { storageResetInit, mockStaticData } from '../utils/testUtils';

test.beforeEach(async ({ page }) => {
  await storageResetInit(page);
  await mockStaticData(page);
});

test('load chapter 1 and render first verse', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
});

test('change display type from toolbar button', async ({ page }) => {
  await page.goto('/1');
  const displayBtn = page.locator('#changeDisplayButton');
  await displayBtn.click();
  const normalOption = page.getByText('Normal', { exact: true });
  await normalOption.waitFor();
  await normalOption.click();
  await expect(page.locator('#verses-block .verse').first()).toBeVisible();
});

test('open settings drawer', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  
  await page.getByTitle('Settings').click();
  await expect(page.locator('#settings-drawer')).toBeVisible({ timeout: 10000 });
  
  const settingsContent = page.locator('#settings-drawer button, #settings-drawer input, #settings-drawer select');
  const contentCount = await settingsContent.count();
  expect(contentCount).toBeGreaterThan(0);
});
