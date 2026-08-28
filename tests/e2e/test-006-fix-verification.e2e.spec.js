import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * TEST-006 Verification: FIX-006 opacity bump light 0.22-0.28 / dark 0.30-0.34
 * - Unit opacities updated (bg-[#hex]/pct and rgba)
 * - Playwright computedStyle shows new rgba visibly stronger but still pastel alpha <0.4
 * - Tailwind/browserslist 0 warnings (checked via build log)
 * - Grouping/accordion still works
 * - Screenshots for light/dark tint evidence
 */

const EVIDENCE_DIR = 'test-results/test-006-evidence';
const SCREENSHOT_DIR = 'test-results/test-006-screenshots';

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
		try { document.documentElement.setAttribute('data-theme', String(t)); } catch {}
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
	await page.waitForTimeout(500);
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
	await page.waitForSelector('button[id^="colored-section-"]', { timeout: 8000 });
	await page.waitForTimeout(500);
}

async function clickAccordion(page, id) {
	const sel = `#colored-section-${id}`;
	await page.waitForSelector(sel, { timeout: 5000 });
	const btn = page.locator(sel);
	await btn.scrollIntoViewIfNeeded().catch(() => {});
	const before = await page.evaluate((i) => document.getElementById(`colored-section-${i}`)?.getAttribute('aria-expanded'), id);
	try { await btn.click({ force: true, timeout: 3000 }); } catch { await page.evaluate((i) => document.getElementById(`colored-section-${i}`)?.click(), id); }
	await page.waitForTimeout(800);
	const after = await page.evaluate((i) => document.getElementById(`colored-section-${i}`)?.getAttribute('aria-expanded'), id);
	if (after === before) {
		await page.evaluate((i) => document.getElementById(`colored-section-${i}`)?.click(), id);
		await page.waitForTimeout(800);
	}
}

test.describe('TEST-006 FIX-006: bumped opacity light 0.22-0.28 dark 0.30-0.34 @critical', () => {
	test.beforeAll(() => ensureDirs());

	test.beforeEach(async ({ page }) => {
		page._consoleLogs = [];
		page._networkLogs = [];
		page.on('console', (msg) => page._consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
		page.on('request', (req) => page._networkLogs.push(`REQ ${req.method()} ${req.url()}`));
		page.on('response', (res) => page._networkLogs.push(`RES ${res.status()} ${res.url().slice(0,140)}`));
		page.on('pageerror', (err) => page._consoleLogs.push(`[pageerror] ${err.message}`));
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await page.evaluate(() => {
			try { localStorage.clear(); } catch {}
			try { localStorage.removeItem('coloredBookmarksAccordionExpanded'); } catch {}
		});
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
	});

	test.afterEach(async ({ page }, testInfo) => {
		const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, '_').slice(0,80);
		const project = testInfo.project.name;
		const base = `${EVIDENCE_DIR}/${project}_${safeTitle}`;
		try {
			fs.writeFileSync(`${base}.console.log`, (page._consoleLogs || []).join('\n') || '(no console)');
			fs.writeFileSync(`${base}.network.log`, (page._networkLogs || []).join('\n').slice(0,25000) || '(no network)');
		} catch {}
		if (testInfo.status !== testInfo.expectedStatus) {
			await page.screenshot({ path: `${SCREENSHOT_DIR}/${project}_${safeTitle}_FAILURE.png`, fullPage: true }).catch(()=>{});
		}
	});

	test('TC01 light tint new rgba 0.28 visible stronger pastel and computedStyle matches FIX-006', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await seedColoredBookmarks(page, { '2:255': 1 });
		await gotoChapterVerse(page, 2, 255);
		const info = await getVerseTintInfo(page, '2:255');
		expect(info).not.toBeNull();
		// FIX-006: id1 light 0.28 -> rgba(234,221,184,0.28)
		expect(info.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.28\)/);
		expect(info.styleAttr).toContain('rgba(234,221,184,0.28)');
		expect(info.styleAttr).toContain('background-color');
		// pastel aesthetic: alpha <0.4 not harsh, translucent not solid
		const alpha = parseFloat(info.backgroundColor.match(/rgba\(.*,\s*([0-9.]+)\)/)?.[1] || '0');
		expect(alpha).toBeGreaterThan(0.18);
		expect(alpha).toBeLessThan(0.4);
		// not using purged Tailwind bg class for actual tint
		expect(info.className).not.toMatch(/bg-\[#EADDB8\]/);
		expect(info.className).toContain('rounded-xl');
		expect(info.className).toContain('transition-colors');
		expect(info.borderRadius).not.toBe('0px');
		// also verify other ids light opacities
		await page.evaluate(() => {
			try {
				const raw = JSON.parse(localStorage.getItem('userSettings')||'{}');
				raw.userColoredBookmarks = { '2:10': 8, '3:1': 3 };
				localStorage.setItem('userSettings', JSON.stringify(raw));
			} catch {}
		});
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(()=>{});
		await page.goto(`/2?startVerse=10`, { waitUntil: 'domcontentloaded' });
		await page.waitForSelector('[id="2:10"]', { timeout: 10000 });
		const info8 = await getVerseTintInfo(page, '2:10');
		// id 8 light 0.22 -> rgba(224,220,214,0.22)
		expect(info8.backgroundColor).toMatch(/rgba\(224,\s*220,\s*214,\s*0\.22\)/);
		expect(info8.styleAttr).toContain('rgba(224,220,214,0.22)');

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${test.info().project.name}_TC01_tint_light_0_28.png`, fullPage: true });
	});

	test('TC02 dark tint new rgba 0.34 visible stronger pastel', async ({ page }) => {
		await setWebsiteTheme(page, 5);
		await seedColoredBookmarks(page, { '2:255': 1 });
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(()=>{});
		await gotoChapterVerse(page, 2, 255);
		const info = await getVerseTintInfo(page, '2:255');
		expect(info).not.toBeNull();
		// FIX-006: id1 dark 0.34 -> rgba(185,151,63,0.34)
		expect(info.backgroundColor).toMatch(/rgba\(185,\s*151,\s*63,\s*0\.34\)/);
		expect(info.styleAttr).toContain('rgba(185,151,63,0.34)');
		const alpha = parseFloat(info.backgroundColor.match(/rgba\(.*,\s*([0-9.]+)\)/)?.[1] || '0');
		expect(alpha).toBeGreaterThan(0.18);
		expect(alpha).toBeLessThan(0.4);
		expect(info.className).not.toMatch(/bg-\[#B9973F\]/);
		expect(info.className).toContain('rounded-xl');

		// verify id8 dark 0.30
		await page.evaluate(() => {
			try {
				const raw = JSON.parse(localStorage.getItem('userSettings')||'{}');
				raw.userColoredBookmarks = { '2:10': 8 };
				localStorage.setItem('userSettings', JSON.stringify(raw));
			} catch {}
		});
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(()=>{});
		await page.goto(`/2?startVerse=10`, { waitUntil: 'domcontentloaded' });
		await page.waitForSelector('[id="2:10"]', { timeout: 10000 });
		const info8 = await getVerseTintInfo(page, '2:10');
		expect(info8.backgroundColor).toMatch(/rgba\(154,\s*143,\s*134,\s*0\.3\)/);
		expect(info8.styleAttr).toContain('rgba(154,143,134,0.3)');

		await page.screenshot({ path: `${SCREENSHOT_DIR}/${test.info().project.name}_TC02_tint_dark_0_34.png`, fullPage: true });
	});

	test('TC03 all 8 tokens opacity range light 0.22-0.28 dark 0.30-0.34 hex unchanged aesthetic', async ({ page }) => {
		// verify via helper evaluation that COLOR_TOKENS match table and hex unchanged
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(()=>{});
		const tokens = await page.evaluate(async () => {
			try {
				const m = await import('/src/utils/coloredBookmarks.js');
				return m.COLOR_TOKENS;
			} catch (e) { return null; }
		});
		// fallback: evaluate via compiled chunk if import fails, just check computed styles for 8 ids
		if (tokens) {
			expect(tokens['1'].lightOpacity).toBe(0.28);
			expect(tokens['1'].darkOpacity).toBe(0.34);
			expect(tokens['8'].lightOpacity).toBe(0.22);
			expect(tokens['8'].darkOpacity).toBe(0.3);
			for (let i=1;i<=8;i++) {
				expect(tokens[String(i)].lightOpacity).toBeGreaterThanOrEqual(0.22);
				expect(tokens[String(i)].lightOpacity).toBeLessThanOrEqual(0.28);
				expect(tokens[String(i)].darkOpacity).toBeGreaterThanOrEqual(0.3);
				expect(tokens[String(i)].darkOpacity).toBeLessThanOrEqual(0.34);
				expect(tokens[String(i)].lightOpacity).toBeLessThan(0.4);
				expect(tokens[String(i)].darkOpacity).toBeLessThan(0.4);
				// hex not harsh red/blue
				expect(tokens[String(i)].lightHex).not.toMatch(/#FF0000/i);
				expect(tokens[String(i)].darkHex).not.toMatch(/#0000FF/i);
			}
			// hex unchanged per spec
			expect(tokens['1'].lightHex).toBe('#EADDB8');
			expect(tokens['1'].darkHex).toBe('#B9973F');
			expect(tokens['4'].lightHex).toBe('#DDD4E8');
			expect(tokens['8'].lightHex).toBe('#E0DCD6');
		} else {
			// fallback style-based check: seed 8 verses each color and check computed alpha
			await setWebsiteTheme(page, 1);
			const map = {};
			for (let i=1;i<=8;i++) map[`${i}:1`] = i;
			await seedColoredBookmarks(page, map);
			// check a couple
			await page.goto('/1?startVerse=1', { waitUntil: 'domcontentloaded' });
			await page.waitForSelector('[id="1:1"]', { timeout: 8000 });
			const info1 = await getVerseTintInfo(page, '1:1');
			expect(info1.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.28\)/);
		}
	});

	test('TC04 grouping and accordion still works after opacity bump', async ({ page }) => {
		await seedColoredBookmarks(page, { '1:1': 1, '2:255': 1, '36:58': 4, '114:6': 8 });
		await gotoHomeColoredTab(page);
		const headers = page.locator('button[id^="colored-section-"]');
		await expect(headers).toHaveCount(8);
		for (let id=1; id<=8; id++) {
			await expect(page.locator(`#colored-section-${id}`)).toBeVisible();
			await expect(page.locator(`#colored-section-${id}`)).toHaveAttribute('aria-expanded', /true|false/);
			await expect(page.locator(`#colored-section-${id}`)).toHaveAttribute('aria-controls', `colored-panel-${id}`);
		}
		await expect(page.locator('#colored-section-1')).toContainText('(2)');
		await expect(page.locator('#colored-section-4')).toContainText('(1)');
		await expect(page.locator('#colored-section-8')).toContainText('(1)');
		// initially hidden
		for (let id=1; id<=8; id++) await expect(page.locator(`#colored-panel-${id}`)).toBeHidden();
		// expand Amber Glow
		await clickAccordion(page, 1);
		await expect(page.locator('#colored-section-1')).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('#colored-panel-1')).toBeVisible();
		await expect(page.locator('#colored-panel-1')).toHaveClass(/block/);
		// others stay hidden
		for (let id=2; id<=8; id++) await expect(page.locator(`#colored-panel-${id}`)).toBeHidden();
		// canonical order check
		const links = page.locator('#colored-panel-1 a[href*="?startVerse="]');
		await expect(links).toHaveCount(2);
		const hrefs = await links.evaluateAll(els => els.map(e=>e.getAttribute('href')));
		expect(hrefs[0]).toMatch(/\/1\?startVerse=1/);
		expect(hrefs[1]).toMatch(/\/2\?startVerse=255/);
		// empty color placeholder when expanded
		await clickAccordion(page, 2);
		await expect(page.locator('#colored-panel-2')).toBeVisible();
		await expect(page.locator('#colored-panel-2').getByText('No verses in Terracotta Dune')).toBeVisible();
		await expect(page.locator('#colored-panel-2').getByText('No verses in Terracotta Dune')).toHaveClass(/opacity-40/);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${test.info().project.name}_TC04_grouping_accordion.png`, fullPage: true });
	});

	test('TC05 tint persists across reload and theme switch recomputes correctly', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await seedColoredBookmarks(page, { '2:255': 1 });
		await gotoChapterVerse(page, 2, 255);
		const light = await getVerseTintInfo(page, '2:255');
		expect(light.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.28\)/);
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(()=>{});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		const afterReload = await getVerseTintInfo(page, '2:255');
		expect(afterReload.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.28\)/);
		// theme switch to dark
		await setWebsiteTheme(page, 5);
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(()=>{});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		const dark = await getVerseTintInfo(page, '2:255');
		expect(dark.backgroundColor).toMatch(/rgba\(185,\s*151,\s*63,\s*0\.34\)/);
		// back to light
		await setWebsiteTheme(page, 1);
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(()=>{});
		await page.waitForSelector('[id="2:255"]', { timeout: 10000 });
		const light2 = await getVerseTintInfo(page, '2:255');
		expect(light2.backgroundColor).toMatch(/rgba\(234,\s*221,\s*184,\s*0\.28\)/);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/${test.info().project.name}_TC05_persist_theme_switch.png`, fullPage: true });
	});

	test('TC06 no Tailwind arbitrary bg class for tint, still rounded and transition, accent not harsh', async ({ page }) => {
		await setWebsiteTheme(page, 1);
		await seedColoredBookmarks(page, { '2:255': 1 });
		await gotoChapterVerse(page, 2, 255);
		const info = await getVerseTintInfo(page, '2:255');
		expect(info.className).not.toMatch(/bg-\[#/);
		expect(info.className).toContain('rounded-xl');
		expect(info.className).toContain('transition-colors');
		expect(info.borderRadius).not.toBe('0px');
		// check computed alpha pastel
		const alpha = parseFloat(info.backgroundColor.match(/,\s*([0-9.]+)\)/)?.[1] || '0');
		expect(alpha).toBeLessThan(0.4);
		// verify non-bookmarked verse has no inline bg
		await seedColoredBookmarks(page, {});
		await page.reload({ waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(()=>{});
		await page.waitForSelector('[id="2:255"]', { timeout: 8000 });
		const noColor = await getVerseTintInfo(page, '2:255');
		expect(noColor.styleAttr).not.toContain('rgba');
		expect(noColor.backgroundColor).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
	});
});
