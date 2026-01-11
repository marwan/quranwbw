import { test, expect } from '@playwright/test';
import { simulateOffline, storageResetInit, mockStaticData, warmChapterCache } from '../utils/testUtils';

test.describe.configure({ mode: 'serial' });

test('offline mode renders chapter from cache', async ({ page }) => {
	await storageResetInit(page);
	await mockStaticData(page);

	// Warm cache by visiting chapter first
	await warmChapterCache(page, 1);

	await simulateOffline(page);

	await expect(page.locator('#chapter-block')).toBeVisible({ timeout: 10000 });
	await expect(page.locator('#verses-block .verse').first()).toBeVisible({ timeout: 20000 });
});
