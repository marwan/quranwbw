/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'selector',
	theme: {
		extend: {
			colors: {
				...colors,
				lightGray: '#ebebeb',
				// These two entries cover ALL themes
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
	plugins: [require('flowbite/plugin'), require('tailwind-scrollbar')]
};
