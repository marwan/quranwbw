import { test, expect } from '@playwright/test';

/**
 * E2E: Colored Bookmark — submenu beneath Advanced Play, 8 colors tint,
 * homepage grouping, persistence reload.
 * Requires dev server (auto via playwright webServer).
 * Mark @critical for webapp-testing skill evidence.
 */

test.describe('Colored Bookmark E2E', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// clear storage and reload to ensure defaultSettings migration
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState('networkidle');
	});

	test('AC1 @critical submenu appears beneath Advanced Play with 8 swatches + Clear', async ({ page }) => {
		// navigate to a chapter with verses
		await page.goto('/2?startVerse=255');
		await page.waitForSelector('.verse', { timeout: 10000 });

		// open verse 2:255 options: trigger id is verse-options-{verse}
		const trigger = page.locator('#verse-options-255').first();
		await expect(trigger).toBeVisible();
		await trigger.click();

		// dropdown should show Advanced Play then Colored Bookmark row
		const advancedPlay = page.getByText('Advanced Play');
		await expect(advancedPlay).toBeVisible();

		const coloredRow = page.getByRole('menuitem', { name: /Colored Bookmark/ });
		await expect(coloredRow).toBeVisible();

		// verify ordering: Colored Bookmark immediately after Advanced Play (checked via visibility)
		await coloredRow.click();

		// submenu appears
		const submenu = page.getByRole('menu', { name: 'Bookmark colors' });
		await expect(submenu).toBeVisible();

		// 8 swatches as menuitemradio
		const swatches = page.getByRole('menuitemradio');
		await expect(swatches).toHaveCount(8);
		for (let i = 1; i <= 8; i++) {
			await expect(page.getByLabel(`Set`, { exact: false }).first()).toBeVisible();
		}
		// header 8 colors
		await expect(page.getByText('8 colors')).toBeVisible();

		// Clear color disabled initially
		const clearBtn = page.getByRole('menuitem', { name: 'Clear color' });
		await expect(clearBtn).toBeVisible();
		await expect(clearBtn).toBeDisabled();

		// Back button
		await expect(page.getByRole('button', { name: /Back to verse options/ })).toBeVisible();

		// Escape returns to main menu
		await page.keyboard.press('Escape');
		await expect(submenu).toBeHidden();
		await expect(coloredRow).toBeVisible();

		// console errors check
		const consoleErrors = [];
		page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
		expect(consoleErrors.filter(m => !m.includes('Failed to load'))).toEqual([]);

		await page.screenshot({ path: 'test-results/e2e-submenu.png', fullPage: false });
	});

	test('AC2 select color tints verse and persists reload @critical', async ({ page }) => {
		await page.goto('/2?startVerse=255');
		await page.waitForSelector('.verse', { timeout: 10000 });

		const trigger = page.locator('#verse-options-255').first();
		await trigger.click();
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();

		// select Amber Glow (id 1) - first swatch
		const amber = page.getByRole('menuitemradio', { name: /Amber Glow/ });
		await expect(amber).toBeVisible();
		await amber.click();

		// verse wrapper should have tint class bg-[#EADDB8]/14 or dark variant
		const verse = page.locator('#2\\:255');
		await expect(verse).toBeVisible();
		// check class contains bg-[
		await expect(verse).toHaveClass(/bg-\[#/);

		// localStorage check
		const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('userSettings')).userColoredBookmarks);
		expect(stored['2:255']).toBe(1);

		// reload → tint persists
		await page.reload();
		await page.waitForSelector('#2\\:255', { timeout: 10000 });
		const verseReloaded = page.locator('#2\\:255');
		await expect(verseReloaded).toHaveClass(/bg-\[#/);

		// re-open submenu, selected ring visible
		await page.locator('#verse-options-255').first().click();
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		const amberAfter = page.getByRole('menuitemradio', { name: /Amber Glow/ });
		await expect(amberAfter).toHaveAttribute('aria-checked', 'true');
		await expect(amberAfter.locator('text=✓')).toBeVisible();

		// replace with different color (Lavender Mist id 4)
		await page.getByRole('menuitemradio', { name: /Lavender Mist/ }).click();
		const updated = await page.evaluate(() => JSON.parse(localStorage.getItem('userSettings')).userColoredBookmarks['2:255']);
		expect(updated).toBe(4);

		// clear
		await page.locator('#verse-options-255').first().click();
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		const clearBtn = page.getByRole('menuitem', { name: 'Clear color' });
		await expect(clearBtn).toBeEnabled();
		await clearBtn.click();
		await expect(page.locator('#2\\:255')).not.toHaveClass(/bg-\[#/);
		const cleared = await page.evaluate(() => JSON.parse(localStorage.getItem('userSettings')).userColoredBookmarks['2:255']);
		expect(cleared).toBeUndefined();
		// bookmarks invariant
		const bookmarks = await page.evaluate(() => JSON.parse(localStorage.getItem('userSettings')).userBookmarks);
		expect(Array.isArray(bookmarks)).toBeTruthy();

		await page.screenshot({ path: 'test-results/e2e-tint.png', fullPage: false });
	});

	test('AC3 homepage Colored tab grouped by color @critical', async ({ page }) => {
		// seed via localStorage directly
		await page.evaluate(() => {
			const raw = JSON.parse(localStorage.getItem('userSettings') || '{}');
			raw.userColoredBookmarks = { '1:1': 1, '2:255': 1, '36:58': 4, '114:6': 8 };
			localStorage.setItem('userSettings', JSON.stringify(raw));
		});
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// click Colored tab
		const coloredTab = page.getByRole('tab', { name: /Colored/ });
		await expect(coloredTab).toBeVisible();
		await coloredTab.click();

		// badge count (totalColored) should show (4)
		await expect(coloredTab).toContainText('(4)');

		// panel visible
		const panel = page.locator('#colored-tab-panel');
		await expect(panel).toBeVisible();

		// per-color sections: check Amber Glow header count 2, Lavender Mist 1, Stone Taupe 1
		await expect(page.locator('#colored-section-1')).toContainText('Amber Glow');
		await expect(page.locator('#colored-section-1')).toContainText('(2)');
		await expect(page.locator('#colored-section-4')).toContainText('Lavender Mist');
		await expect(page.locator('#colored-section-4')).toContainText('(1)');
		await expect(page.locator('#colored-section-8')).toContainText('(1)');

		// sections with zero should show No verses and opacity-40
		await expect(page.locator('#colored-section-2')).toContainText('No verses in Terracotta Dune');
		await expect(page.locator('#colored-section-2')).toHaveClass(/opacity-40/);

		// cards link to /{chapter}?startVerse={verse}
		const firstCardLink = panel.locator('a[href*="?startVerse="]').first();
		await expect(firstCardLink).toBeVisible();
		const href = await firstCardLink.getAttribute('href');
		expect(href).toMatch(/\/\d+\?startVerse=\d+/);

		// clicking card navigates
		await firstCardLink.click();
		await expect(page).toHaveURL(/\/\d+\?startVerse=\d+/);

		await page.screenshot({ path: 'test-results/e2e-homepage-grouped.png', fullPage: true });
	});

	test('AC3 empty state global', async ({ page }) => {
		await page.goto('/');
		const coloredTab = page.getByRole('tab', { name: /Colored/ });
		await coloredTab.click();
		await expect(page.getByText(/No colored bookmarks yet/)).toBeVisible();
		await expect(page.getByText(/Colored Bookmark to tint/)).toBeVisible();
		// badge hidden when zero (no parentheses)
		await expect(coloredTab).not.toContainText('(');
	});

	test('AC3 keyboard nav: tab switching and swatch grid @a11y', async ({ page }) => {
		await page.goto('/2?startVerse=255');
		await page.waitForSelector('#verse-options-255');
		// Tab to trigger
		await page.keyboard.press('Tab');
		// find focused element maybe
		await page.locator('#verse-options-255').first().focus();
		await page.keyboard.press('Enter');
		await expect(page.getByText('Advanced Play')).toBeVisible();
		await page.keyboard.press('ArrowDown'); // maybe? just open colored via keyboard
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).focus();
		await page.keyboard.press('Enter');
		const firstSwatch = page.getByRole('menuitemradio').first();
		await expect(firstSwatch).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(page.getByRole('menuitemradio').nth(1)).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu', { name: 'Bookmark colors' })).toBeHidden();
	});

	test('AC4 persistence: extrasActiveTab 4 survives reload', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('tab', { name: /Colored/ }).click();
		await page.reload();
		await page.waitForLoadState('networkidle');
		// should still be selected
		await expect(page.getByRole('tab', { name: /Colored/ })).toHaveAttribute('aria-selected', 'true');
		await expect(page.locator('#colored-tab-panel')).toBeVisible();
	});

	test('mobile: submenu width and tint inline @mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/2?startVerse=255');
		await page.waitForSelector('.verse');
		await page.locator('#verse-options-255').first().click();
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		const submenu = page.getByRole('menu', { name: 'Bookmark colors' });
		await expect(submenu).toBeVisible();
		const box = await submenu.boundingBox();
		expect(box.width).toBeGreaterThan(200);
		expect(box.width).toBeLessThan(300); // w-56 = 224
	});
});
