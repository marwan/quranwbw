/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

// removing old colors
delete colors.lightBlue;
delete colors.warmGray;
delete colors.trueGray;
delete colors.coolGray;
delete colors.blueGray;

export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'!./src/utils/parseURL.js'
	],
	darkMode: 'selector',
	theme: {
		extend: {
			colors: {
				// Theme-aware colors using CSS variables
				'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
				'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
				'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
				
				'bg-primary': 'rgb(var(--color-bg-primary) / <alpha-value>)',
				'bg-secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
				'bg-surface': 'rgb(var(--color-bg-surface) / <alpha-value>)',
				
				'accent-primary': 'rgb(var(--color-accent-primary) / <alpha-value>)',
				'accent-secondary': 'rgb(var(--color-accent-secondary) / <alpha-value>)',
				
				'quran-text': 'rgb(var(--color-quran-text) / <alpha-value>)',
				'verse-highlight': 'rgb(var(--color-verse-highlight) / <alpha-value>)',
				'chapter-header': 'rgb(var(--color-chapter-header) / <alpha-value>)',
				
				'button-primary': 'rgb(var(--color-button-primary) / <alpha-value>)',
				'button-hover': 'rgb(var(--color-button-hover) / <alpha-value>)',
				'link': 'rgb(var(--color-link) / <alpha-value>)',
				
				'border': 'rgb(var(--color-border) / <alpha-value>)',
				'divider': 'rgb(var(--color-divider) / <alpha-value>)',

				// Legacy colors for backward compatibility
				...colors,
				lightGray: '#ebebeb'
			},
			screens: {
				xs: '400px'
			}
		}
	},
	plugins: [require('flowbite/plugin'), require('tailwind-scrollbar')]
};
