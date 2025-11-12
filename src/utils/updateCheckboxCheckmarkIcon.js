const CHECKMARK_VIEWBOX = '0 0 507.506 507.506';
const FALLBACK_PATH =
	'M163.865,436.934c-14.406,0.006-28.222-5.72-38.4-15.915L9.369,304.966c-12.492-12.496-12.492-32.752,0-45.248l0,0 c12.496-12.492,32.752-12.492,45.248,0l109.248,109.248L452.889,79.942c12.496-12.492,32.752-12.492,45.248,0l0,0 c12.492,12.496,12.492,32.752,0,45.248L202.265,421.019C192.087,431.214,178.271,436.94,163.865,436.934z';
const FALLBACK_COLOR = [212, 175, 55]; // matches default theme accent

const clampChannel = (value) => {
	const numeric = Number(value);
	if (Number.isNaN(numeric)) return 0;
	return Math.max(0, Math.min(255, Math.round(numeric)));
};

const toHex = (value) => clampChannel(value).toString(16).padStart(2, '0');

const parseRgbTuple = (value) => {
	if (!value) return null;
	const matches = value.match(/-?\d+(\.\d+)?/g);
	if (!matches || matches.length < 3) return null;
	return matches.slice(0, 3).map(Number);
};

const tupleToHex = (tuple) => `#${tuple.map(toHex).join('')}`;

export function updateCheckboxCheckmarkIcon(root = typeof document !== 'undefined' ? document.documentElement : null) {
	if (typeof window === 'undefined' || !root) return;

	const styles = getComputedStyle(root);
	let path = styles.getPropertyValue('--checkbox-checkmark-path').trim();
	if (!path) path = FALLBACK_PATH;

	const accentSecondary = styles.getPropertyValue('--color-accent-secondary').trim();
	const accentPrimary = styles.getPropertyValue('--color-accent-primary').trim();
	const accentTuple = parseRgbTuple(accentSecondary) || parseRgbTuple(accentPrimary) || FALLBACK_COLOR;
	const colorHex = tupleToHex(accentTuple);

	const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${CHECKMARK_VIEWBOX}'><path fill='${colorHex}' d='${path}'/></svg>`;
	const dataUri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
	root.style.setProperty('--checkbox-checkmark-icon', dataUri);
}

export default updateCheckboxCheckmarkIcon;
