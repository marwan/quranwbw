import { get } from 'svelte/store';
import { __userColoredBookmarks } from '$utils/stores';
import { isValidVerseKey } from '$utils/validateKey';

// Palette tokens — design-spec §3.2 (8 colors) — FIX-006: bumped opacity for visibility, hex unchanged
export const COLOR_TOKENS = {
	1: { id: 1, name: 'Amber Glow', lightHex: '#EADDB8', darkHex: '#B9973F', lightOpacity: 0.28, darkOpacity: 0.34 },
	2: { id: 2, name: 'Terracotta Dune', lightHex: '#E6D0C0', darkHex: '#C07A5A', lightOpacity: 0.26, darkOpacity: 0.32 },
	3: { id: 3, name: 'Rose Ash', lightHex: '#E5D1D1', darkHex: '#B07A7A', lightOpacity: 0.24, darkOpacity: 0.3 },
	4: { id: 4, name: 'Lavender Mist', lightHex: '#DDD4E8', darkHex: '#8E7AAE', lightOpacity: 0.26, darkOpacity: 0.32 },
	5: { id: 5, name: 'Powder Slate', lightHex: '#D2DDE5', darkHex: '#7A9AB5', lightOpacity: 0.26, darkOpacity: 0.32 },
	6: { id: 6, name: 'Sage Teal', lightHex: '#D1E0DD', darkHex: '#7AA89B', lightOpacity: 0.24, darkOpacity: 0.3 },
	7: { id: 7, name: 'Olive Sage', lightHex: '#D9E0C9', darkHex: '#8FA67A', lightOpacity: 0.24, darkOpacity: 0.3 },
	8: { id: 8, name: 'Stone Taupe', lightHex: '#E0DCD6', darkHex: '#9A8F86', lightOpacity: 0.22, darkOpacity: 0.3 }
};

export const VALID_COLOR_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8]);

const DARK_THEMES = new Set([5, 6, 7, 8, 9]);

export function isValidColorId(v) {
	const n = Number(v);
	return Number.isInteger(n) && VALID_COLOR_IDS.has(n);
}

export function isDarkTheme(websiteTheme) {
	return DARK_THEMES.has(Number(websiteTheme));
}

function normalizeVerseKey(key) {
	if (typeof key !== 'string') return null;
	const trimmed = key.trim();
	if (!trimmed) return null;
	const parts = trimmed.split(':');
	if (parts.length !== 2) return null;
	const ch = Number(parts[0]);
	const vs = Number(parts[1]);
	if (!Number.isInteger(ch) || !Number.isInteger(vs)) return null;
	return `${ch}:${vs}`;
}

function canonicalCompare(a, b) {
	const [ca, va] = a.split(':').map(Number);
	const [cb, vb] = b.split(':').map(Number);
	if (ca !== cb) return ca - cb;
	return va - vb;
}

function readMap() {
	try {
		const store = get(__userColoredBookmarks);
		if (store && typeof store === 'object' && !Array.isArray(store)) return store;
	} catch {
		// store not yet initialized (SSR or early)
	}
	// fallback to localStorage directly
	try {
		const raw = localStorage.getItem('userSettings');
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		const map = parsed?.userColoredBookmarks;
		if (map && typeof map === 'object' && !Array.isArray(map)) return map;
	} catch {
		// ignore
	}
	return {};
}

// Public helpers — api-spec §7

export function getColorForVerse(key) {
	if (!key || typeof key !== 'string') return null;
	const normalized = normalizeVerseKey(key);
	if (!normalized) return null;
	if (!isValidVerseKey(normalized)) return null;
	const map = readMap();
	const val = map[normalized];
	if (val == null) return null;
	const n = Number(val);
	return isValidColorId(n) ? n : null;
}

export function getVersesByColor(colorId) {
	const n = Number(colorId);
	if (!isValidColorId(n)) return [];
	const map = readMap();
	const out = [];
	for (const [k, v] of Object.entries(map)) {
		if (Number(v) === n && isValidVerseKey(k)) out.push(k);
	}
	out.sort(canonicalCompare);
	return out;
}

export function getColoredBookmarksGrouped() {
	const map = readMap();
	const byColor = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
	const all = [];
	for (const [k, v] of Object.entries(map)) {
		const n = Number(v);
		if (!isValidVerseKey(k)) continue;
		if (!isValidColorId(n)) continue;
		all.push(k);
		byColor[n].push(k);
	}
	all.sort(canonicalCompare);
	for (let i = 1; i <= 8; i++) byColor[i].sort(canonicalCompare);
	const counts = {
		total: all.length,
		byColor: {
			1: byColor[1].length,
			2: byColor[2].length,
			3: byColor[3].length,
			4: byColor[4].length,
			5: byColor[5].length,
			6: byColor[6].length,
			7: byColor[7].length,
			8: byColor[8].length
		}
	};
	return { byColor, all, counts, isEmpty: all.length === 0 };
}

export function getTotalColoredCount() {
	return getColoredBookmarksGrouped().counts.total;
}

export function getPerColorCounts() {
	return getColoredBookmarksGrouped().counts.byColor;
}

export function hasColor(key) {
	return getColorForVerse(key) !== null;
}

export function getAllColoredKeysSorted() {
	return getColoredBookmarksGrouped().all;
}

export function hexToRgb(hex) {
	if (!hex || typeof hex !== 'string') return null;
	let h = hex.trim().replace(/^#/, '');
	if (h.length === 3) h = h.split('').map((c) => c + c).join('');
	if (h.length !== 6) return null;
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
	return { r, g, b };
}

export function getVerseTintStyle(colorId, websiteTheme) {
	const n = Number(colorId);
	if (!isValidColorId(n)) return '';
	const token = COLOR_TOKENS[n];
	const isDark = isDarkTheme(websiteTheme);
	const hex = isDark ? token.darkHex : token.lightHex;
	const opacity = isDark ? token.darkOpacity : token.lightOpacity;
	const rgb = hexToRgb(hex);
	if (!rgb) return '';
	return `background-color: rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})`;
}

// Tint class helpers — design-spec §3.2 / §4.2
// Deprecated: Tailwind arbitrary bg-[#hex]/pct is purged at runtime — use getVerseTintStyle instead.
// Kept for backward compatibility / tests but verse wrappers must use style attribute.
export function getVerseTintClasses(colorId, websiteTheme) {
	const n = Number(colorId);
	if (!isValidColorId(n)) return '';
	const token = COLOR_TOKENS[n];
	const isDark = isDarkTheme(websiteTheme);
	const hex = isDark ? token.darkHex : token.lightHex;
	const opacity = isDark ? token.darkOpacity : token.lightOpacity;
	// opacity *100 for Tailwind slash syntax (e.g. 0.14 -> 14)
	// Use non-integer safe: Math.round(opacity*100)
	const pct = Math.round(opacity * 100);
	return `bg-[${hex}]/${pct}`;
}

// Full tint wrapper classes to apply to verse container
// isInline = true for Continuous (inline) wrapper, false for block modes
// NOTE: FIX-004 — wrappers now use inline style via getVerseTintStyle to avoid Tailwind purge.
// This helper is kept for backward compatibility / tests but should not be used for runtime bg.
export function getVerseTintWrapperClasses(colorId, websiteTheme, isInline = false) {
	if (!colorId) return '';
	const bg = getVerseTintClasses(colorId, websiteTheme);
	if (!bg) return '';
	if (isInline) {
		// box-decoration-clone ensures multi-line inline tint clones per line
		return `${bg} rounded-lg px-1.5 py-1 box-decoration-clone transition-colors duration-200`;
	}
	return `${bg} rounded-xl transition-colors duration-200`;
}

// Border accent for cards (solid token at full opacity border)
export function getCardBorderColor(colorId, websiteTheme) {
	const n = Number(colorId);
	if (!isValidColorId(n)) return '';
	const token = COLOR_TOKENS[n];
	const isDark = isDarkTheme(websiteTheme);
	return isDark ? token.darkHex : token.lightHex;
}

// Alias map for api-spec §3.1 color param (not needed in helper but exported for updateSettings reuse)
export const COLOR_ALIAS_MAP = {
	amber: 1,
	amberglow: 1,
	'amber-glow': 1,
	terracotta: 2,
	dune: 2,
	terracottadune: 2,
	'terracotta-dune': 2,
	rose: 3,
	roseash: 3,
	'rose-ash': 3,
	lavender: 4,
	mist: 4,
	lavendermist: 4,
	'lavender-mist': 4,
	slate: 5,
	powder: 5,
	powderslate: 5,
	'powder-slate': 5,
	sage: 6,
	teal: 6,
	sageteal: 6,
	'sage-teal': 6,
	olive: 7,
	olivesage: 7,
	'olive-sage': 7,
	stone: 8,
	taupe: 8,
	stonetaupe: 8,
	'stone-taupe': 8
};

export function resolveColorAlias(input) {
	if (input == null) return null;
	const s = String(input).trim().toLowerCase();
	if (/^[1-8]$/.test(s)) return Number(s);
	if (COLOR_ALIAS_MAP[s] != null) return COLOR_ALIAS_MAP[s];
	const n = Number(s);
	if (isValidColorId(n)) return n;
	return null;
}
