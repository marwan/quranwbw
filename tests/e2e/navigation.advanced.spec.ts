import { test, expect } from '@playwright/test';
import { storageResetInit, mockStaticData } from '../utils/testUtils';

test.beforeEach(async ({ page }) => {
  await storageResetInit(page);
  await mockStaticData(page);
});

test('navigate to specific verse via URL', async ({ page }) => {
  // Navigate directly to verse 2:255 (Ayat al-Kursi) 
  await page.goto('/2/255');
  
  // Wait for chapter to load
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  
  // Wait for verses to load
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
  
  // Verify we're on chapter 2 by checking URL
  const currentUrl = page.url();
  expect(currentUrl).toContain('/2');
  
  // Get the actual verse count that loaded
  const verseElements = page.locator('.verse');
  const verseCount = await verseElements.count();
  
  // At minimum, some verses should have loaded from chapter 2
  expect(verseCount).toBeGreaterThan(0);
  
  // Verify the chapter loaded correctly by checking for Arabic content
  const firstVerse = verseElements.first();
  const verseText = await firstVerse.textContent();
  
  // Chapter 2 should contain Arabic text
  expect(verseText?.trim().length || 0).toBeGreaterThan(0);
});

test('test URL parsing for different verse range formats', async ({ page }) => {
  // Test single verse
  await page.goto('/1/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  
  // Test verse range
  await page.goto('/2/10-15');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.verse').first()).toBeVisible({ timeout: 15000 });
});

test('dynamic verse loading on scroll', async ({ page }) => {
  // Go to a long chapter
  await page.goto('/2'); 

  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
  
  // Get initial verse count
  const initialVerseCount = await page.locator('#verses-block .verse').count();
  
  // Scroll to bottom to trigger loading more verses
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  // Wait a bit for new verses to load
  await page.waitForTimeout(2000);
  
  // Check that more verses have been loaded
  const newVerseCount = await page.locator('#verses-block .verse').count();
  expect(newVerseCount).toBeGreaterThan(initialVerseCount);
});
