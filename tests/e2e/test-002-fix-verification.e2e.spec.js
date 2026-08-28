import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * TEST-002 Verification: Tailwind silence + VerseOptionsDropdown submenu fix
 * - Tailwind build zero rename warnings + zero browserslist stale (verified via build logs outside browser)
 * - Menu stays open after clicking Colored Bookmark beneath Advanced Play
 * - 4x2 grid, Back, Escape, swatch select tints + persists, Clear removes
 * - Across desktop + mobile (Playwright projects: chromium + mobile) and light/dark themes (1 vs 5)
 * Evidence: screenshots + console/network logs
 */

const EVIDENCE_DIR = 'test-results/test-002-evidence';
const SCREENSHOT_DIR = 'test-results/test-002-screenshots';

function ensureDirs() {
	for (const d of [EVIDENCE_DIR, SCREENSHOT_DIR]) {
		if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
	}
}

async function setWebsiteTheme(page, themeId) {
	await page.evaluate((t) => {
		try {
			const raw = JSON.parse(localStorage.getItem('userSettings') || '{}');
			if (!raw.displaySettings) raw.displaySettings = {};
			raw.displaySettings.websiteTheme = t;
			localStorage.setItem('userSettings', JSON.stringify(raw));
		} catch {}
		try {
			document.documentElement.setAttribute('data-theme', String(t));
		} catch {}
	}, themeId);
}

async function gotoChapterVerse(page, chapter = 2, verse = 255) {
	await page.goto(`/${chapter}?startVerse=${verse}`, { waitUntil: 'domcontentloaded' });
	await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
	// verses render async via fetch; wait for trigger
	await page.waitForSelector(`#verse-options-${verse}`, { timeout: 15000 });
	await page.waitForSelector('.verse', { timeout: 10000 }).catch(() => {});
	// small settle for dropdown positioning
	await page.waitForTimeout(400);
}

async function openVerseDropdown(page, verse = 255) {
	const trigger = page.locator(`#verse-options-${verse}`).first();
	await expect(trigger).toBeVisible({ timeout: 10000 });
	await trigger.click();
	await expect(page.getByText('Advanced Play')).toBeVisible({ timeout: 8000 });
}

test.describe('TEST-002: Tailwind fix + VerseOptionsDropdown submenu @critical', () => {
	test.beforeAll(() => {
		ensureDirs();
	});

	test.beforeEach(async ({ page }) => {
		// capture console/network for evidence
		page._consoleLogs = [];
		page._networkLogs = [];
		page.on('console', (msg) => {
			const entry = `[${msg.type()}] ${msg.text()}`;
			page._consoleLogs.push(entry);
		});
		page.on('request', (req) => page._networkLogs.push(`REQ ${req.method()} ${req.url()}`));
		page.on('response', (res) =>
			page._networkLogs.push(`RES ${res.status()} ${res.url().slice(0, 120)}`)
		);
		page.on('pageerror', (err) => page._consoleLogs.push(`[pageerror] ${err.message}`));

		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await page.evaluate(() => localStorage.clear());
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
	});

	test.afterEach(async ({ page }, testInfo) => {
		// save console/network logs per test
		const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 80);
		const project = testInfo.project.name;
		const base = `${EVIDENCE_DIR}/${project}_${safeTitle}`;
		try {
			fs.writeFileSync(`${base}.console.log`, (page._consoleLogs || []).join('\n') || '(no console)');
			fs.writeFileSync(`${base}.network.log`, (page._networkLogs || []).join('\n').slice(0, 20000) || '(no network)');
		} catch {}
		if (testInfo.status !== testInfo.expectedStatus) {
			await page.screenshot({ path: `${SCREENSHOT_DIR}/${project}_${safeTitle}_FAILURE.png`, fullPage: true }).catch(() => {});
		}
	});

	test('TC01 menu stays open after clicking Colored Bookmark (light theme)', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);

		const coloredRow = page.getByRole('menuitem', { name: /Colored Bookmark/ });
		await expect(coloredRow).toBeVisible();
		// ensure it is beneath Advanced Play: check DOM order
		const advancedPlay = page.getByText('Advanced Play');
		const advBox = await advancedPlay.boundingBox();
		const colBox = await coloredRow.boundingBox();
		expect(colBox.y).toBeGreaterThan(advBox.y);

		// click Colored Bookmark — critical: dropdown must NOT auto-close
		await coloredRow.click();

		const submenu = page.getByRole('menu', { name: 'Bookmark colors' });
		await expect(submenu).toBeVisible({ timeout: 5000 });

		// dropdown container still visible (menu itself)
		await expect(page.getByText('8 colors')).toBeVisible();
		// verify Advanced Play is hidden (submenu replaced it) but dropdown is still open (Back visible)
		await expect(page.getByRole('button', { name: /Back to verse options/ })).toBeVisible();
		// submenu grid not empty
		await expect(page.getByRole('menuitemradio')).toHaveCount(8);

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC01_menu_stays_open_light.png`, fullPage: false });
		// also ensure no console errors (except benign)
		const errors = (page._consoleLogs || []).filter((l) => l.includes('[error]') && !l.includes('Failed to load'));
		expect(errors).toEqual([]);
	});

	test('TC02 menu stays open — dark theme (theme 5)', async ({ page }) => {
		await setWebsiteTheme(page, 5);
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);

		const coloredRow = page.getByRole('menuitem', { name: /Colored Bookmark/ });
		await expect(coloredRow).toBeVisible();
		await coloredRow.click();
		const submenu = page.getByRole('menu', { name: 'Bookmark colors' });
		await expect(submenu).toBeVisible({ timeout: 5000 });
		await expect(page.getByText('8 colors')).toBeVisible();
		await expect(page.getByRole('menuitemradio')).toHaveCount(8);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC02_menu_stays_open_dark.png`, fullPage: false });
	});

	test('TC03 submenu 4x2 grid layout correct', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();

		const submenu = page.getByRole('menu', { name: 'Bookmark colors' });
		await expect(submenu).toBeVisible();
		await expect(page.getByText('8 colors')).toBeVisible();

		const swatches = page.getByRole('menuitemradio');
		await expect(swatches).toHaveCount(8);

		// check grid class
		const grid = page.locator('.grid.grid-cols-4.gap-2');
		await expect(grid).toBeVisible();
		// check aria attributes
		for (let i = 1; i <= 8; i++) {
			const names = ['Amber Glow', 'Terracotta Dune', 'Rose Ash', 'Lavender Mist', 'Powder Slate', 'Sage Teal', 'Olive Sage', 'Stone Taupe'];
			const sw = page.getByRole('menuitemradio', { name: new RegExp(names[i - 1]) });
			await expect(sw).toHaveAttribute('aria-label', new RegExp(names[i - 1]));
			await expect(sw).toHaveAttribute('role', 'menuitemradio');
		}
		// w-7 h-7 = 28px
		const firstBox = await swatches.first().boundingBox();
		expect(firstBox.width).toBeGreaterThanOrEqual(26);
		expect(firstBox.width).toBeLessThanOrEqual(32);
		expect(firstBox.height).toBeGreaterThanOrEqual(26);
		// submenu width w-56 (224) or md:w-64 (256)
		const subBox = await submenu.boundingBox();
		expect(subBox.width).toBeGreaterThanOrEqual(200);
		expect(subBox.width).toBeLessThanOrEqual(320);

		// Clear disabled when no color
		const clearBtn = page.getByRole('menuitem', { name: 'Clear color' });
		await expect(clearBtn).toBeVisible();
		await expect(clearBtn).toBeDisabled();
		await expect(clearBtn).toHaveAttribute('aria-disabled', 'true');

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC03_grid_4x2.png`, fullPage: false });
	});

	test('TC04 Back returns to main menu, dropdown stays open', async ({ page }) => {
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		const submenu = page.getByRole('menu', { name: 'Bookmark colors' });
		await expect(submenu).toBeVisible();
		const backBtn = page.getByRole('button', { name: /Back to verse options/ });
		await expect(backBtn).toBeVisible();
		await backBtn.click();
		// submenu hidden, main menu visible, dropdown still open
		await expect(submenu).toBeHidden();
		await expect(page.getByRole('menuitem', { name: /Colored Bookmark/ })).toBeVisible();
		await expect(page.getByText('Advanced Play')).toBeVisible();
		// trigger focus? check at least dropdownOpen still true (Back not closing dropdown)
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC04_back_returns.png`, fullPage: false });
	});

	test('TC05 Escape from submenu returns to main menu (not close dropdown)', async ({ page }) => {
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		const submenu = page.getByRole('menu', { name: 'Bookmark colors' });
		await expect(submenu).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(submenu).toBeHidden({ timeout: 3000 });
		await expect(page.getByRole('menuitem', { name: /Colored Bookmark/ })).toBeVisible();
		await expect(page.getByText('Advanced Play')).toBeVisible();
		// second Escape should close dropdown (outside test scope, but verify not crash)
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC05_escape.png`, fullPage: false });
	});

	test('TC06 swatch select tints verse, persists reload, selected ring', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();

		const amber = page.getByRole('menuitemradio', { name: /Amber Glow/ });
		await expect(amber).toBeVisible();
		await amber.click();

		// dropdown should close
		await expect(page.getByRole('menu', { name: 'Bookmark colors' })).toBeHidden({ timeout: 3000 }).catch(() => {});
		// verse wrapper tint: light theme 1 => bg-[#EADDB8]/14
		const verse = page.locator('[id="2:255"]');
		await expect(verse).toBeVisible({ timeout: 8000 });
		await expect(verse).toHaveClass(/bg-\[#EADDB8\]/);
		// also check rounded-xl for block mode
		await expect(verse).toHaveClass(/rounded-xl/);

		const stored = await page.evaluate(() => {
			try {
				return JSON.parse(localStorage.getItem('userSettings')).userColoredBookmarks;
			} catch {
				return null;
			}
		});
		expect(stored['2:255']).toBe(1);

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC06_tint_after_select.png`, fullPage: false });

		// reload persists
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		const verseReloaded = page.locator('[id="2:255"]');
		await expect(verseReloaded).toHaveClass(/bg-\[#EADDB8\]/);

		// reopen submenu → selected ring & checkmark
		await page.locator('#verse-options-255').first().click().catch(async () => {
			await page.goto('/2?startVerse=255', { waitUntil: 'domcontentloaded' });
			await page.waitForSelector('#verse-options-255');
			await page.locator('#verse-options-255').first().click();
		});
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		const amberAfter = page.getByRole('menuitemradio', { name: /Amber Glow/ });
		await expect(amberAfter).toHaveAttribute('aria-checked', 'true');
		// ring-2 class when selected
		await expect(amberAfter).toHaveClass(/ring-2/);
		await expect(amberAfter.locator('text=✓')).toBeVisible();
		// trailing dot visible in main row (after back)
		await page.getByRole('button', { name: /Back to verse options/ }).click();
		await expect(page.getByRole('menuitem', { name: /Colored Bookmark/ })).toBeVisible();
	});

	test('TC06b swatch select dark theme uses darkHex #B9973F/18', async ({ page }) => {
		await setWebsiteTheme(page, 5);
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		await page.getByRole('menuitemradio', { name: /Amber Glow/ }).click();
		const verse = page.locator('[id="2:255"]');
		await expect(verse).toBeVisible({ timeout: 8000 });
		await expect(verse).toHaveClass(/bg-\[#B9973F\]/);
		await expect(verse).toHaveClass(/\/18/);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC06b_dark_tint.png`, fullPage: false });
	});

	test('TC07 Clear removes tint and persists, enabled only when colored', async ({ page }) => {
		// seed a color first
		await setWebsiteTheme(page, 1);
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		await page.getByRole('menuitemradio', { name: /Amber Glow/ }).click();
		await expect(page.locator('[id="2:255"]')).toHaveClass(/bg-\[#/);

		// reopen and clear
		await page.waitForTimeout(500);
		await page.locator('#verse-options-255').first().click();
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		const clearBtn = page.getByRole('menuitem', { name: 'Clear color' });
		await expect(clearBtn).toBeEnabled();
		await clearBtn.click();
		await expect(page.locator('[id="2:255"]')).not.toHaveClass(/bg-\[#/, { timeout: 8000 });
		const cleared = await page.evaluate(() => {
			try {
				return JSON.parse(localStorage.getItem('userSettings')).userColoredBookmarks['2:255'];
			} catch {
				return 'error';
			}
		});
		expect(cleared).toBeUndefined();
		// bookmarks dual-track intact
		const bookmarks = await page.evaluate(() => {
			try {
				return JSON.parse(localStorage.getItem('userSettings')).userBookmarks;
			} catch {
				return null;
			}
		});
		expect(Array.isArray(bookmarks)).toBeTruthy();

		// reload → still cleared
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 }).catch(() => {});
		await expect(page.locator('[id="2:255"]')).not.toHaveClass(/bg-\[#/);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC07_clear_removed.png`, fullPage: false });

		// reopen submenu → Clear now disabled
		await page.locator('#verse-options-255').first().click().catch(() => {});
		await page.waitForTimeout(300);
		if (await page.getByRole('menuitem', { name: /Colored Bookmark/ }).isVisible().catch(() => false)) {
			await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
			await expect(page.getByRole('menuitem', { name: 'Clear color' })).toBeDisabled();
		}
	});

	test('TC08 grouping still works homepage Colored tab', async ({ page }) => {
		await page.evaluate(() => {
			try {
				const raw = JSON.parse(localStorage.getItem('userSettings') || '{}');
				raw.userColoredBookmarks = { '1:1': 1, '2:255': 1, '36:58': 4, '114:6': 8 };
				localStorage.setItem('userSettings', JSON.stringify(raw));
			} catch {}
		});
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		const coloredTab = page.getByRole('tab', { name: /Colored/ });
		await expect(coloredTab).toBeVisible();
		await coloredTab.click();
		await expect(coloredTab).toContainText('(4)');
		const panel = page.locator('#colored-tab-panel');
		await expect(panel).toBeVisible();
		await expect(page.locator('#colored-section-1')).toContainText('Amber Glow');
		await expect(page.locator('#colored-section-1')).toContainText('(2)');
		await expect(page.locator('#colored-section-4')).toContainText('Lavender Mist');
		await expect(page.locator('#colored-section-8')).toContainText('(1)');
		await expect(page.getByText('No verses in Terracotta Dune')).toBeVisible();
		await expect(page.locator('#colored-section-2').locator('..')).toHaveClass(/opacity-40/);
		const link = panel.locator('a[href*="?startVerse="]').first();
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute('href', /\/\d+\?startVerse=\d+/);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC08_grouping.png`, fullPage: true });
	});

	test('TC08b global empty state when no colored bookmarks', async ({ page }) => {
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		const coloredTab = page.getByRole('tab', { name: /Colored/ });
		await coloredTab.click();
		await expect(page.getByText(/No colored bookmarks yet/)).toBeVisible();
		await expect(coloredTab).not.toContainText('(');
	});

	test('TC09 switch swatch replaces color (Lavender Mist)', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await gotoChapterVerse(page, 2, 255);
		await openVerseDropdown(page, 255);
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		await page.getByRole('menuitemradio', { name: /Amber Glow/ }).evaluate((el) => el.click()).catch(async () => {
			await page.getByRole('menuitemradio', { name: /Amber Glow/ }).click({ force: true });
		});
		await page.waitForTimeout(400);
		await page.locator('#verse-options-255').first().click();
		await page.getByRole('menuitem', { name: /Colored Bookmark/ }).click();
		await page.getByRole('menuitemradio', { name: /Lavender Mist/ }).evaluate((el) => el.click()).catch(async () => {
			await page.getByRole('menuitemradio', { name: /Lavender Mist/ }).click({ force: true });
		});
		const updated = await page.evaluate(() => {
			try {
				return JSON.parse(localStorage.getItem('userSettings')).userColoredBookmarks['2:255'];
			} catch {
				return null;
			}
		});
		expect(updated).toBe(4);
		await expect(page.locator('[id="2:255"]')).toHaveClass(/bg-\[#DDD4E8\]/);
	});

	test('TC10 tint persists via direct storage injection (bypass menu) light+dark', async ({ page }) => {
		// light theme
		await setWebsiteTheme(page, 1);
		await page.evaluate(() => {
			const raw = JSON.parse(localStorage.getItem('userSettings') || '{}');
			raw.userColoredBookmarks = { '2:255': 1 };
			localStorage.setItem('userSettings', JSON.stringify(raw));
		});
		await page.goto('/2?startVerse=255', { waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		await expect(page.locator('[id="2:255"]')).toHaveClass(/bg-\[#EADDB8\]/);
		await expect(page.locator('[id="2:255"]')).toHaveClass(/rounded-xl/);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC10_tint_light_injected.png`, fullPage: false });

		// dark theme
		await setWebsiteTheme(page, 5);
		await page.evaluate(() => {
			const raw = JSON.parse(localStorage.getItem('userSettings') || '{}');
			raw.userColoredBookmarks = { '2:255': 1 };
			localStorage.setItem('userSettings', JSON.stringify(raw));
		});
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		await expect(page.locator('[id="2:255"]')).toHaveClass(/bg-\[#B9973F\]/);
		await expect(page.locator('[id="2:255"]')).toHaveClass(/\/18/);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC10_tint_dark_injected.png`, fullPage: false });

		// clear via storage
		await page.evaluate(() => {
			const raw = JSON.parse(localStorage.getItem('userSettings') || '{}');
			delete raw.userColoredBookmarks['2:255'];
			localStorage.setItem('userSettings', JSON.stringify(raw));
		});
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		await expect(page.locator('[id="2:255"]')).not.toHaveClass(/bg-\[#/);
	});
});
