/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';
import flowbitePlugin from 'flowbite/plugin';
import tailwindScrollbar from 'tailwind-scrollbar';
import log from 'tailwindcss/lib/util/log.js';

// Omit deprecated aliases renamed in Tailwind v2.2+ (lightBlue→sky etc) to silence warns; behavior identical
// Tailwind's colors getters warn on access, so temporarily silence log.warn during destructure
const _origWarn = log.default?.warn;
if (log.default && _origWarn) log.default.warn = () => {};
const { lightBlue: _lightBlue, warmGray: _warmGray, trueGray: _trueGray, coolGray: _coolGray, blueGray: _blueGray, ...supportedColors } = colors;
if (log.default && _origWarn) log.default.warn = _origWarn;

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'selector',
	theme: {
		extend: {
			colors: {
				...supportedColors,

				// These three entries cover ALL themes
				theme: {
					bg: 'rgb(var(--theme-bg-rgb) / <alpha-value>)',
					accent: 'rgb(var(--theme-accent-rgb) / <alpha-value>)',
					text: 'rgb(var(--theme-text-rgb) / <alpha-value>)'
				}
			},
			screens: {
				xs: '400px'
			}
		}
	},
	plugins: [flowbitePlugin, tailwindScrollbar]
};
