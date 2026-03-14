import { selectableThemes } from '$data/options';

// This function takes an array of color code pairs and generates a structured JSON object with theme data for each pair.
// Each theme includes various CSS class strings for different UI elements, such as background, text, border, icons, etc..., using the provided color codes.
function generateThemes() {
	const themes = {};
	const websiteColors = {};
	const cssStyles = [];
	const normalFontPaletteStyles = [];
	const tajweedFontPaletteStyles = [];
	const headerPaletteStyles = [];
	const checkboxStyles = [];
	const markdownStyles = [];

	// Titles
	cssStyles.push(`/* Scrollbar Colors */`);
	checkboxStyles.push(`/* Checkbox Colors */`);
	normalFontPaletteStyles.push(`/* Uthmani V4 Fonts - Normal Palettes */`);
	tajweedFontPaletteStyles.push(`/* Uthmani V4 Fonts - Tajweed Palettes */`);
	headerPaletteStyles.push(`/* Mushaf Header Palettes */`);
	markdownStyles.push(`/* Markdown Colors */`);

	Object.keys(selectableThemes).forEach((key) => {
		const { color1, color2, color3, name } = selectableThemes[key];
		const themeIndex = Number(key);

		themes[themeIndex] = {
			themeName: name,
			bgMain: `bg-[${color1}]`,
			bgSecondary: `bg-[${color2}]`,
			bgSecondaryLight: `bg-[${color2}]/5`,
			bgSecondaryDark: `bg-[${color2}]/15`,
			bgSecondaryExtraDark: `bg-[${color2}]/20`,
			text: `text-[${color3 !== undefined ? color3 : color2}]`,
			textSecondary: `text-[${color2}]`,
			textBgColor: `text-[${color1}]`,
			border: `border-[${color2}]/20`,
			borderDark: `!border-[${color2}]`,
			icon: `${color2}`,
			input: `focus:border-[${color2}] focus:ring-[${color2}]`,
			checked: `peer-checked:border-2 peer-checked:border-[${color2}] peer-checked:border-[${color2}]`,
			toggle: `bg-[${color2}]/15 after:bg-[${color1}] after:border-[${color1}] peer-checked:bg-[${color2}]`,
			slider: `bg-[${color2}]/10 [&::-webkit-slider-thumb]:!bg-[${color2}]`,
			hover: `hover:bg-[${color2}]/5`,
			hoverBorder: `border border-transparent hover:border-[${color2}]`,
			via: `via-[${color2}]`,
			placeholder: `placeholder:text-[${color2}]/50`
		};

		websiteColors[themeIndex] = `bg-[${color1}]`;

		const cssComment = `/* ${selectableThemes[themeIndex].name} */`;

		cssStyles.push(`html.theme-${themeIndex} ::-webkit-scrollbar-thumb { background: ${color2}; } ${cssComment}`);
		checkboxStyles.push(`.theme-${themeIndex} [type='checkbox'], .theme-${themeIndex} [type='checkbox']:checked { background-color: transparent; border-color: ${color2} }`);
		checkboxStyles.push(
			`.theme-${themeIndex} [type='checkbox']:checked { background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 507.506 507.506' fill='%23${color2.substring(1)}'><g><path d='M163.865,436.934c-14.406,0.006-28.222-5.72-38.4-15.915L9.369,304.966c-12.492-12.496-12.492-32.752,0-45.248l0,0 c12.496-12.492,32.752-12.492,45.248,0l109.248,109.248L452.889,79.942c12.496-12.492,32.752-12.492,45.248,0l0,0 c12.492,12.496,12.492,32.752,0,45.248L202.265,421.019C192.087,431.214,178.271,436.94,163.865,436.934z'/></g></svg>"); } ${cssComment}`
		);
		normalFontPaletteStyles.push(`.theme-${themeIndex} .theme-palette-normal { font-palette: --palette${selectableThemes[themeIndex].paletteNormal}; } ${cssComment}`);
		tajweedFontPaletteStyles.push(`.theme-${themeIndex} .theme-palette-tajweed { font-palette: --palette${selectableThemes[themeIndex].paletteTajweed}; } ${cssComment}`);
		headerPaletteStyles.push(`.theme-${themeIndex} .header { font-palette: --palette${selectableThemes[themeIndex].paletteHeader}; } ${cssComment}`);
		markdownStyles.push(`.theme-${themeIndex} .markdown hr { @apply border-[${color2}]/20; } ${cssComment}`);
		markdownStyles.push(`.theme-${themeIndex} .markdown a { @apply text-[${color2}]; } ${cssComment}`);
		markdownStyles.push(`.theme-${themeIndex} .markdown h3 { @apply text-[${color2}]; } ${cssComment}`);
	});

	window.websiteColors = websiteColors;

	// log all results
	console.log(themes);
	console.log(window.websiteColors);
	console.log(cssStyles.join('\n'));
	console.log(checkboxStyles.join('\n'));
	console.log(normalFontPaletteStyles.join('\n'));
	console.log(tajweedFontPaletteStyles.join('\n'));
	console.log(headerPaletteStyles.join('\n'));
	console.log(markdownStyles.join('\n'));
}

window.generateThemes = generateThemes;
