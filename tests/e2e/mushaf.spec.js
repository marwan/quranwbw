import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Same CSS as the toHaveScreenshot stylePath (hides navbar/toolbar), reused for the attached screenshots
const SCREENSHOT_CSS = readFileSync(new URL('./screenshot.css', import.meta.url), 'utf8');

// A spread of pages covering the main layout cases:
// 1, 2: Al-Fatiha and the start of Al-Baqarah (centered lines, special spacing)
// 49, 50: end of Al-Baqarah and start of Al-Imran
// 187: At-Tawbah header without bismillah
// 255: mid-page surah header + bismillah + centered line
// 604: last page, three short surahs with headers
const MUSHAF_PAGES = [1, 2, 49, 50, 187, 255, 604];

// Runs in the browser. Words, chapter headers and bismillah are rendered with
// fonts loaded at runtime through the FontFace API, and words can become visible
// before their font has finished loading, so wait until every inline font family
// used inside the page has a loaded FontFace.
function mushafPageReady() {
	const root = document.querySelector('[data-testid="mushaf-page"]');
	if (!root || root.querySelectorAll('.word').length === 0) return false;
	if (root.querySelector('.v4-words.invisible, .header.invisible, .bismillah.invisible')) return false;

	const normalize = (family) => family.replace(/["']/g, '').trim();
	const loadedFamilies = new Set([...document.fonts].filter((face) => face.status === 'loaded').map((face) => normalize(face.family)));
	const usedFamilies = new Set([...root.querySelectorAll('[style*="font-family"]')].map((el) => normalize(el.style.fontFamily)));

	return document.fonts.status === 'loaded' && [...usedFamilies].every((family) => loadedFamilies.has(family));
}

test.beforeEach(async ({ page }) => {
	// Keep analytics out of test runs
	await page.route(/rybbit\.quranwbw\.com/, (route) => route.abort());

	// Pin the display settings that affect the Mushaf rendering (theme, font type, tooltips)
	await page.addInitScript(() => {
		if (!localStorage.getItem('userSettings')) {
			localStorage.setItem('userSettings', JSON.stringify({ displaySettings: { websiteTheme: 1, fontType: 2, wordTooltip: 1 } }));
		}
	});
});

for (const pageNumber of MUSHAF_PAGES) {
	test(`mushaf page ${pageNumber}`, async ({ page }) => {
		await page.goto(`/page?id=${pageNumber}`);

		const mushafPage = page.getByTestId('mushaf-page');
		await expect(mushafPage).toBeVisible();

		await page.waitForFunction(mushafPageReady, null, { timeout: 20_000 });

		// Let the browser paint with the freshly loaded fonts
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

		const snapshotName = `page-${String(pageNumber).padStart(3, '0')}.png`;
		await expect(mushafPage).toHaveScreenshot(snapshotName);

		// On failure Playwright already attaches expected/actual/diff images. On success, also keep
		// the rendered page so every CI run produces screenshots that can be inspected in the artifact.
		const renderedPath = test.info().outputPath(snapshotName);
		await mushafPage.screenshot({ path: renderedPath, animations: 'disabled', caret: 'hide', scale: 'css', style: SCREENSHOT_CSS });
		await test.info().attach(`rendered-${snapshotName}`, { path: renderedPath, contentType: 'image/png' });
	});
}
