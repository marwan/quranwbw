import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * TEST-004 Verification: FIX-004
 * (1) Verse background tint now uses inline rgba (background-color: rgba(r,g,b,opacity)) and is visible — check computedStyle backgroundColor for light rgba(234,221,184,0.14) and dark rgba(185,151,63,0.18) on verse id 2:255, plus rounded tint and persistence across reload and theme switch; ensure not using Tailwind bg class for background.
 * (2) Per-color collapsible menus — homepage Colored tab shows 8 headers each as button[aria-expanded][aria-controls], clicking expands only that color's panel (role=region hidden/block), empty shows placeholder when expanded, counts correct, keyboard Enter/Space toggles, state persists in localStorage, global empty still handled.
 * Desktop chromium + mobile Pixel5, light/dark. Capture screenshots, console/network logs, build grep logs.
 */

const EVIDENCE_DIR = 'test-results/test-004-evidence';
const SCREENSHOT_DIR = 'test-results/test-004-screenshots';

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

async function seedColoredBookmarks(page, map) {
	await page.evaluate((m) => {
		const raw = JSON.parse(localStorage.getItem('userSettings') || '{}');
		raw.userColoredBookmarks = m;
		localStorage.setItem('userSettings', JSON.stringify(raw));
	}, map);
}

async function getVerseTintInfo(page, verseId = '2:255') {
	return await page.evaluate((vid) => {
		const el = document.getElementById(vid);
		if (!el) return null;
		const cs = getComputedStyle(el);
		return {
			backgroundColor: cs.backgroundColor,
			borderRadius: cs.borderRadius,
			className: el.className,
			styleAttr: el.getAttribute('style') || '',
			inlineBg: el.style.backgroundColor
		};
	}, verseId);
}

async function gotoChapterVerse(page, chapter = 2, verse = 255) {
	await page.goto(`/${chapter}?startVerse=${verse}`, { waitUntil: 'domcontentloaded' });
	await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
	await page.waitForSelector(`[id="2:255"]`, { timeout: 15000 });
	await page.waitForTimeout(400);
}

async function gotoHomeColoredTab(page) {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await page.waitForLoadState('networkidle').catch(() => {});
	await page.waitForTimeout(800);
	const coloredTab = page.getByRole('tab', { name: /Colored/ });
	await expect(coloredTab).toBeVisible({ timeout: 8000 });
	await coloredTab.click();
	await expect(page.locator('#colored-tab-panel')).toBeVisible();
	await page.waitForTimeout(800);
	// ensure accordion headers rendered and hydration complete
	await page.waitForSelector('button[id^="colored-section-"]', { timeout: 8000 });
	await page.waitForTimeout(1000);
}

async function clickAccordion(page, id) {
	const sel = `#colored-section-${id}`;
	await page.waitForSelector(sel, { timeout: 5000 });
	const btn = page.locator(sel);
	await btn.scrollIntoViewIfNeeded().catch(() => {});
	const before = await page.evaluate((i) => document.getElementById(`colored-section-${i}`)?.getAttribute('aria-expanded'), id);
	// try Playwright click, fallback to evaluate
	try {
		await btn.click({ force: true, timeout: 3000 });
	} catch {
		await page.evaluate((i) => document.getElementById(`colored-section-${i}`)?.click(), id);
	}
	await page.waitForTimeout(800);
	// debug: log aria-expanded after click
	const after = await page.evaluate((i) => document.getElementById(`colored-section-${i}`)?.getAttribute('aria-expanded'), id);
	// if value unchanged, try evaluate click again (handles focus/transition race)
	if (after === before) {
		await page.evaluate((i) => document.getElementById(`colored-section-${i}`)?.click(), id);
		await page.waitForTimeout(800);
	}
}

test.describe('TEST-004 FIX-004: inline rgba tint + per-color collapsible accordion @critical', () => {
	test.beforeAll(() => ensureDirs());

	test.beforeEach(async ({ page }) => {
		page._consoleLogs = [];
		page._networkLogs = [];
		page.on('console', (msg) => {
			const entry = `[${msg.type()}] ${msg.text()}`;
			page._consoleLogs.push(entry);
		});
		page.on('request', (req) => page._networkLogs.push(`REQ ${req.method()} ${req.url()}`));
		page.on('response', (res) => page._networkLogs.push(`RES ${res.status()} ${res.url().slice(0, 140)}`));
		page.on('pageerror', (err) => page._consoleLogs.push(`[pageerror] ${err.message}`));

		await page.goto('/', { waitUntil: 'domcontentloaded' });
		// clear both storages
		await page.evaluate(() => {
			try { localStorage.clear(); } catch {}
			try { localStorage.removeItem('coloredBookmarksAccordionExpanded'); } catch {}
		});
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
	});

	test.afterEach(async ({ page }, testInfo) => {
		const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 80);
		const project = testInfo.project.name;
		const base = `${EVIDENCE_DIR}/${project}_${safeTitle}`;
		try {
			fs.writeFileSync(`${base}.console.log`, (page._consoleLogs || []).join('\n') || '(no console)');
			fs.writeFileSync(`${base}.network.log`, (page._networkLogs || []).join('\n').slice(0, 25000) || '(no network)');
		} catch {}
		if (testInfo.status !== testInfo.expectedStatus) {
			await page.screenshot({ path: `${SCREENSHOT_DIR}/${project}_${safeTitle}_FAILURE.png`, fullPage: true }).catch(() => {});
		}
	});

	// ---- 1. Verse tint inline rgba ----

	test('TC01 verse tint light rgba visible, rounded, no Tailwind bg class (light theme)', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await seedColoredBookmarks(page, { '2:255': 1 });
		await gotoChapterVerse(page, 2, 255);
		const info = await getVerseTintInfo(page, '2:255');
		expect(info).not.toBeNull();
		// light amber glow: #EADDB8 opacity 0.14 -> rgba(234,221,184,0.14)
		// computedStyle adds spaces: rgba(234, 221, 184, 0.14)
		expect(info.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.14\)/);
		expect(info.styleAttr).toContain('rgba(234,221,184,0.14)');
		expect(info.styleAttr).toContain('background-color');
		// not using Tailwind bg class
		expect(info.className).not.toMatch(/bg-\[#/);
		expect(info.className).not.toContain('bg-[#EADDB8]');
		// rounded tint
		expect(info.className).toContain('rounded-xl');
		expect(info.className).toContain('transition-colors');
		// borderRadius visible
		expect(info.borderRadius).not.toBe('0px');
		// inline style present
		expect(info.inlineBg).toMatch(/rgba/);

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC01_tint_light.png` });
		const errors = (page._consoleLogs || []).filter((l) => l.includes('[error]') && !l.includes('Failed to load'));
		expect(errors).toEqual([]);
	});

	test('TC02 verse tint dark rgba visible, rounded, no Tailwind bg class (dark theme)', async ({ page }) => {
		await setWebsiteTheme(page, 5);
		await seedColoredBookmarks(page, { '2:255': 1 });
		// need reload after theme change to rehydrate stores
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await gotoChapterVerse(page, 2, 255);
		const info = await getVerseTintInfo(page, '2:255');
		expect(info).not.toBeNull();
		// dark amber: #B9973F opacity 0.18 -> rgba(185,151,63,0.18)
		expect(info.backgroundColor).toMatch(/rgba\(185,\s*151,\s*63,\s*0\.18\)/);
		expect(info.styleAttr).toContain('rgba(185,151,63,0.18)');
		expect(info.className).not.toMatch(/bg-\[#/);
		expect(info.className).toContain('rounded-xl');
		expect(info.borderRadius).not.toBe('0px');

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC02_tint_dark.png` });
	});

	test('TC03 verse tint persists across reload (light)', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await seedColoredBookmarks(page, { '2:255': 1 });
		await gotoChapterVerse(page, 2, 255);
		const before = await getVerseTintInfo(page, '2:255');
		expect(before.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.14\)/);

		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		const after = await getVerseTintInfo(page, '2:255');
		expect(after.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.14\)/);
		expect(after.styleAttr).toContain('rgba(234,221,184,0.14)');
		expect(after.className).not.toMatch(/bg-\[#/);

		// verify localStorage still has it
		const stored = await page.evaluate(() => {
			try { return JSON.parse(localStorage.getItem('userSettings')).userColoredBookmarks['2:255']; } catch { return null; }
		});
		expect(stored).toBe(1);

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC03_tint_persist_reload.png` });
	});

	test('TC04 verse tint theme switch recomputes rgba light->dark', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await seedColoredBookmarks(page, { '2:255': 1 });
		await gotoChapterVerse(page, 2, 255);
		const light = await getVerseTintInfo(page, '2:255');
		expect(light.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.14\)/);

		// switch to dark
		await setWebsiteTheme(page, 5);
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		const dark = await getVerseTintInfo(page, '2:255');
		expect(dark.backgroundColor).toMatch(/rgba\(185,\s*151,\s*63,\s*0\.18\)/);
		expect(dark.styleAttr).toContain('rgba(185,151,63,0.18)');
		expect(dark.className).not.toMatch(/bg-\[#/);

		// switch back to light
		await setWebsiteTheme(page, 1);
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		const light2 = await getVerseTintInfo(page, '2:255');
		expect(light2.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.14\)/);

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC04_tint_theme_switch.png` });
	});

	test('TC04b verse without color has no inline background', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await seedColoredBookmarks(page, {});
		await gotoChapterVerse(page, 2, 255);
		const info = await getVerseTintInfo(page, '2:255');
		expect(info).not.toBeNull();
		// no rgba
		expect(info.styleAttr).not.toContain('rgba');
		// transparent background (rgba 0,0,0,0 or empty)
		expect(info.backgroundColor).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
		expect(info.className).not.toMatch(/bg-\[#/);
	});

	// ---- 2. Per-color collapsible menus ----

	test('TC05 homepage Colored tab shows 8 headers each as button[aria-expanded][aria-controls]', async ({ page }) => {
		// seed with some data to check counts, but headers should exist even when empty — test both
		await seedColoredBookmarks(page, { '1:1': 1, '2:255': 1, '36:58': 4, '114:6': 8 });
		await gotoHomeColoredTab(page);

		// 8 headers
		const headers = page.locator('button[id^="colored-section-"]');
		await expect(headers).toHaveCount(8);

		for (let id = 1; id <= 8; id++) {
			const btn = page.locator(`#colored-section-${id}`);
			await expect(btn).toBeVisible();
			await expect(btn).toHaveAttribute('aria-expanded', /true|false/);
			await expect(btn).toHaveAttribute('aria-controls', `colored-panel-${id}`);
			// ensure tag is button
			await expect(btn).toHaveJSProperty('tagName', 'BUTTON');

			const panel = page.locator(`#colored-panel-${id}`);
			await expect(panel).toHaveAttribute('role', 'region');
			await expect(panel).toHaveAttribute('aria-labelledby', `colored-section-${id}`);
		}

		// counts: Amber Glow (1) should have (2), Lavender (4) (1), Stone Taupe (8) (1), others 0
		await expect(page.locator('#colored-section-1')).toContainText('(2)');
		await expect(page.locator('#colored-section-4')).toContainText('(1)');
		await expect(page.locator('#colored-section-8')).toContainText('(1)');
		await expect(page.locator('#colored-section-2')).toContainText('(0)');

		// panels hidden initially (all collapsed default {})
		for (let id = 1; id <= 8; id++) {
			await expect(page.locator(`#colored-panel-${id}`)).toHaveClass(/hidden/);
			// not visible when hidden
			await expect(page.locator(`#colored-panel-${id}`)).toBeHidden();
		}

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC05_8_headers_collapsed.png`, fullPage: true });
	});

	test('TC06 clicking expands only that color panel, others stay collapsed, placeholder hidden until expanded', async ({ page }) => {
		await seedColoredBookmarks(page, { '1:1': 1, '2:255': 1, '36:58': 4 });
		await gotoHomeColoredTab(page);

		// initially all hidden
		for (let id = 1; id <= 8; id++) await expect(page.locator(`#colored-panel-${id}`)).toBeHidden();

		// click Amber Glow (id 1)
		await clickAccordion(page, 1);
		const btn1 = page.locator('#colored-section-1');
		await expect(btn1).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('#colored-panel-1')).toHaveClass(/block/);
		await expect(page.locator('#colored-panel-1')).toBeVisible();
		// others stay hidden
		for (let id = 2; id <= 8; id++) {
			await expect(page.locator(`#colored-section-${id}`)).toHaveAttribute('aria-expanded', 'false');
			await expect(page.locator(`#colored-panel-${id}`)).toHaveClass(/hidden/);
			await expect(page.locator(`#colored-panel-${id}`)).toBeHidden();
		}
		// Amber panel should have cards (2)
		const amberCards = page.locator('#colored-panel-1 a[href*="?startVerse="]');
		await expect(amberCards).toHaveCount(2);

		// Empty color (id 2) still hidden — placeholder not visible when collapsed
		await expect(page.locator('#colored-panel-2')).toBeHidden();
		const emptyPlaceholderInsideHidden = page.locator('#colored-panel-2').getByText('No verses in Terracotta Dune');
		// hidden panel's placeholder is not visible (hidden parent)
		await expect(emptyPlaceholderInsideHidden).toBeHidden();

		// expand empty color 2
		await clickAccordion(page, 2);
		const btn2 = page.locator('#colored-section-2');
		await expect(btn2).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('#colored-panel-2')).toHaveClass(/block/);
		await expect(page.locator('#colored-panel-2')).toBeVisible();
		// placeholder now visible
		await expect(page.locator('#colored-panel-2').getByText('No verses in Terracotta Dune')).toBeVisible();
		// check placeholder opacity classes (opacity-40)
		const placeholder = page.locator('#colored-panel-2').getByText('No verses in Terracotta Dune');
		await expect(placeholder).toHaveClass(/opacity-40/);

		// Amber still expanded (independence)
		await expect(page.locator('#colored-panel-1')).toBeVisible();
		await expect(btn1).toHaveAttribute('aria-expanded', 'true');

		// clicking again collapses
		await clickAccordion(page, 1);
		await expect(btn1).toHaveAttribute('aria-expanded', 'false');
		await expect(page.locator('#colored-panel-1')).toHaveClass(/hidden/);
		await expect(page.locator('#colored-panel-1')).toBeHidden();

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC06_expand_only_one.png`, fullPage: true });
	});

	test('TC07 keyboard Enter/Space toggles, focus visible', async ({ page }) => {
		await seedColoredBookmarks(page, { '2:255': 1 });
		await gotoHomeColoredTab(page);

		const btn1 = page.locator('#colored-section-1');
		await btn1.scrollIntoViewIfNeeded();
		await btn1.focus();
		await expect(btn1).toBeFocused();

		// Enter should toggle — use element press for reliability
		await btn1.press('Enter');
		await page.waitForTimeout(400);
		await expect(btn1).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('#colored-panel-1')).toBeVisible();

		await btn1.press('Enter');
		await page.waitForTimeout(400);
		await expect(btn1).toHaveAttribute('aria-expanded', 'false');
		await expect(page.locator('#colored-panel-1')).toBeHidden();

		// Space should toggle
		await btn1.focus();
		await btn1.press(' ');
		await page.waitForTimeout(400);
		await expect(btn1).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('#colored-panel-1')).toBeVisible();

		await btn1.press(' ');
		await page.waitForTimeout(400);
		await expect(btn1).toHaveAttribute('aria-expanded', 'false');
		await expect(page.locator('#colored-panel-1')).toBeHidden();

		// Tab cycles through 8 headers
		await btn1.focus();
		for (let i = 1; i < 8; i++) {
			await page.keyboard.press('Tab');
			await page.waitForTimeout(100);
			const nextBtn = page.locator(`#colored-section-${i + 1}`);
			await expect(nextBtn).toBeFocused();
		}
	});

	test('TC08 state persists in localStorage across reload', async ({ page }) => {
		await seedColoredBookmarks(page, { '1:1': 1, '2:255': 1 });
		await gotoHomeColoredTab(page);

		// expand 1 and 4
		await clickAccordion(page, 1);
		await clickAccordion(page, 4);
		await expect(page.locator('#colored-panel-1')).toBeVisible();
		await expect(page.locator('#colored-panel-4')).toBeVisible();

		// check localStorage
		const stored = await page.evaluate(() => {
			try { return JSON.parse(localStorage.getItem('coloredBookmarksAccordionExpanded')); } catch { return null; }
		});
		expect(stored).toEqual(expect.objectContaining({ '1': true, '4': true }));

		// reload — keep colored tab active via homepageLayoutPreferences or re-click
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		// ensure we are on home and colored tab visible; click if not active
		const coloredTab = page.getByRole('tab', { name: /Colored/ });
		await coloredTab.click().catch(() => {});
		await page.waitForTimeout(500);
		await expect(page.locator('#colored-tab-panel')).toBeVisible();
		await page.waitForSelector('button[id^="colored-section-"]');
		await page.waitForTimeout(500);
		// After reload, expanded state should be restored
		await expect(page.locator('#colored-panel-1')).toBeVisible({ timeout: 8000 });
		await expect(page.locator('#colored-section-1')).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('#colored-panel-4')).toBeVisible();
		// others still hidden
		await expect(page.locator('#colored-panel-2')).toBeHidden();

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC08_persist_localStorage.png`, fullPage: true });
	});

	test('TC09 counts correct per color, canonical order preserved', async ({ page }) => {
		await seedColoredBookmarks(page, { '36:58': 4, '2:255': 1, '1:1': 1, '114:6': 1, '2:10': 1 });
		await gotoHomeColoredTab(page);

		// total badge
		const coloredTab = page.getByRole('tab', { name: /Colored/ });
		await expect(coloredTab).toContainText('(5)');

		// per color
		await expect(page.locator('#colored-section-1')).toContainText('(4)');
		await expect(page.locator('#colored-section-4')).toContainText('(1)');
		await expect(page.locator('#colored-section-8')).toContainText('(0)');

		// expand Amber and check canonical order: 1:1, 2:10, 2:255, 114:6 (chapter*1000+verse)
		await clickAccordion(page, 1);
		const links = page.locator('#colored-panel-1 a[href*="?startVerse="]');
		await expect(links).toHaveCount(4);
		const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
		// canonical: 1:1 -> /1?startVerse=1, 2:10 -> /2?startVerse=10, 2:255 -> /2?startVerse=255, 114:6 -> /114?startVerse=6
		expect(hrefs[0]).toMatch(/\/1\?startVerse=1/);
		expect(hrefs[1]).toMatch(/\/2\?startVerse=10/);
		expect(hrefs[2]).toMatch(/\/2\?startVerse=255/);
		expect(hrefs[3]).toMatch(/\/114\?startVerse=6/);
	});

	test('TC10 global empty still handled with 8 headers always rendered', async ({ page }) => {
		await seedColoredBookmarks(page, {});
		// ensure localStorage accordion cleared
		await page.evaluate(() => { try { localStorage.removeItem('coloredBookmarksAccordionExpanded'); } catch {} });
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});

		await gotoHomeColoredTab(page);

		// global empty message
		await expect(page.getByText(/No colored bookmarks yet/)).toBeVisible();
		await expect(page.getByText(/Colored Bookmark to tint/)).toBeVisible();
		await expect(page.locator('#colored-tab-panel').getByRole('status')).toBeVisible();

		// badge hidden when zero (no parentheses)
		const coloredTab = page.getByRole('tab', { name: /Colored/ });
		await expect(coloredTab).not.toContainText('(');

		// 8 headers still visible
		const headers = page.locator('button[id^="colored-section-"]');
		await expect(headers).toHaveCount(8);
		for (let id = 1; id <= 8; id++) {
			await expect(page.locator(`#colored-section-${id}`)).toBeVisible();
			await expect(page.locator(`#colored-section-${id}`)).toContainText('(0)');
			await expect(page.locator(`#colored-panel-${id}`)).toBeHidden();
		}

		// expand one empty shows placeholder
		await clickAccordion(page, 3);
		await expect(page.locator('#colored-panel-3')).toBeVisible();
		await expect(page.locator('#colored-panel-3').getByText('No verses in Rose Ash')).toBeVisible();
		await expect(page.locator('#colored-panel-3').getByText('No verses in Rose Ash')).toHaveClass(/opacity-40/);

		// collapse again hides placeholder (hidden parent)
		await clickAccordion(page, 3);
		await expect(page.locator('#colored-panel-3')).toBeHidden();

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${page.context.name ?? 'chromium'}_TC10_global_empty.png`, fullPage: true });
	});

	test('TC11 chevron rotates on expand, header sticky and rounded', async ({ page }) => {
		await seedColoredBookmarks(page, { '2:255': 1 });
		await gotoHomeColoredTab(page);

		const btn = page.locator('#colored-section-1');
		const chevron = btn.locator('svg');
		await expect(chevron).toBeVisible();
		// initially no rotate-180
		await expect(chevron).not.toHaveClass(/rotate-180/);

		await clickAccordion(page, 1);
		await expect(chevron).toHaveClass(/rotate-180/);
		// header has sticky and rounded
		await expect(btn).toHaveClass(/sticky/);
		await expect(btn).toHaveClass(/rounded-lg/);

		await clickAccordion(page, 1);
		await expect(chevron).not.toHaveClass(/rotate-180/);
	});
});
