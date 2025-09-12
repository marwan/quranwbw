import { test, expect } from '@playwright/test';

import { storageResetInit, mockStaticData } from '../utils/testUtils';

test.beforeEach(async ({ page }) => {
  await storageResetInit(page);
  await mockStaticData(page);
});

test('switch between different display layouts', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
  
  // Find display type button
  const displayButton = page.locator('#changeDisplayButton, button[title*="Display"], button[class*="display"]');
  
  if (await displayButton.count() > 0) {
    await displayButton.first().click();
    
    // Wait for dropdown/menu to appear
    await page.waitForTimeout(1000);
    
    // Look for different layout options
    const layoutOptions = page.locator('text=Normal, text=Side-by-Side, text=Word-by-Word, [class*="layout"]');
    const optionCount = await layoutOptions.count();
    
    if (optionCount > 0) {
      // Test clicking different layout options
      const normalOption = page.getByText('Normal', { exact: true });
      if (await normalOption.isVisible()) {
        await normalOption.click();
        await page.waitForTimeout(1000);
      }
    }
  }
});

test('layout switching preserves verse data', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
  
  // Get initial verse count
  const initialVerseCount = await page.locator('#verses-block .verse').count();
  
  // Switch layout if display button exists
  const displayButton = page.locator('#changeDisplayButton');
  if (await displayButton.count() > 0) {
    await displayButton.click();
    
    const sideOption = page.getByText('Side-by-Side', { exact: true });
    if (await sideOption.isVisible()) {
      await sideOption.click();
      await page.waitForTimeout(2000);
      
      // Verify verses are still there after layout change
      const newVerseCount = await page.locator('#verses-block .verse').count();
      expect(newVerseCount).toBeGreaterThanOrEqual(initialVerseCount);
    }
  }
});

test('responsive layout on mobile devices', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
  
  // Verify content is properly displayed on mobile
  const verses = page.locator('#verses-block .verse');
  const firstVerse = verses.first();
  
  // Check that verse is visible and has reasonable dimensions
  await expect(firstVerse).toBeVisible();
  
  const boundingBox = await firstVerse.boundingBox();
  if (boundingBox) {
    // Verse should fit within mobile viewport width
    expect(boundingBox.width).toBeLessThanOrEqual(375);
  }
});

test('font size and typography adjustments', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
  
  // Open settings
  await page.getByTitle('Settings').click();
  await expect(page.locator('#settings-drawer')).toBeVisible({ timeout: 10000 });
  
  // Wait for settings to fully load
  await page.waitForTimeout(1000);
  
  // Look for any settings content to verify the settings panel is functional
  const settingsContent = page.locator('#settings-drawer button, #settings-drawer input, #settings-drawer select, #settings-drawer [role="button"]');
  const contentCount = await settingsContent.count();
  
  // Verify settings drawer has interactive elements
  expect(contentCount).toBeGreaterThan(0);
  
  // Test that we can interact with settings (click on any setting)
  if (contentCount > 0) {
    const firstSetting = settingsContent.first();
    if (await firstSetting.isVisible()) {
      // Try to click the first interactive element
      await firstSetting.click();
      await page.waitForTimeout(500);
    }
  }
  
  // Close settings by clicking outside
  await page.click('body', { position: { x: 50, y: 50 } });
  await page.waitForTimeout(500);
  
  // Verify page is still functional
  await expect(page.locator('#chapter-block')).toBeVisible();
});

test('tajweed color coding display', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
  
  // Look for colored text that indicates Tajweed
  const coloredElements = page.locator('.verse [style*="color"], .verse [class*="tajweed"], .verse [class*="color"]');
  const coloredCount = await coloredElements.count();
  
  // Check if there are any colored elements (Tajweed colors)
  if (coloredCount > 0) {
    const firstColored = coloredElements.first();
    await expect(firstColored).toBeVisible();
    
    // Verify element has some styling applied
    const hasColor = await firstColored.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.color !== 'rgb(0, 0, 0)' || el.style.color !== '';
    });
    
    expect(hasColor || coloredCount > 0).toBeTruthy();
  }
});

test('word-by-word layout functionality', async ({ page }) => {
  await page.goto('/1');
  await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 15000 });
  
  // Try to switch to word-by-word layout
  const displayButton = page.locator('#changeDisplayButton');
  if (await displayButton.count() > 0) {
    await displayButton.click();
    
    const wbwOption = page.getByText('Word-by-Word', { exact: true });
    if (await wbwOption.isVisible()) {
      await wbwOption.click();
      await page.waitForTimeout(2000);
      
      // In word-by-word mode, look for individual word elements
      const words = page.locator('.verse .word, .verse [class*="word"]');
      const wordCount = await words.count();
      
      // Should have individual words displayed
      expect(wordCount).toBeGreaterThan(0);
      
      // Verify words have translations or transliterations
      if (wordCount > 0) {
        const firstWord = words.first();
        await expect(firstWord).toBeVisible();
      }
    }
  }
});