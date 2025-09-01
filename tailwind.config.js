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
				// Theme-aware colors using CSS variables - corrected structure
				text: {
					primary: 'rgba(var(--color-text-primary), <alpha-value>)',
					secondary: 'rgba(var(--color-text-secondary), <alpha-value>)',
					muted: 'rgba(var(--color-text-muted), <alpha-value>)',
				},
				
				bg: {
					primary: 'rgba(var(--color-bg-primary), <alpha-value>)',
					secondary: 'rgba(var(--color-bg-secondary), <alpha-value>)',
					surface: 'rgba(var(--color-bg-surface), <alpha-value>)',
					hover: 'rgba(var(--color-bg-hover), <alpha-value>)',
					'secondary-dark': 'rgba(var(--color-bg-secondary-dark), <alpha-value>)',
				},
				
				accent: {
					primary: 'rgba(var(--color-accent-primary), <alpha-value>)',
					secondary: 'rgba(var(--color-accent-secondary), <alpha-value>)',
				},
				
				border: {
					primary: 'rgba(var(--color-border), <alpha-value>)',
					secondary: 'rgba(var(--color-border-secondary), <alpha-value>)',
				},

				input: {
					primary: 'rgba(var(--color-input-primary), <alpha-value>)',
				},
				
				// Quran-specific colors
				'quran-text': 'rgba(var(--color-quran-text), <alpha-value>)',
				'verse-highlight': 'rgba(var(--color-verse-highlight), <alpha-value>)',
				'chapter-header': 'rgba(var(--color-chapter-header), <alpha-value>)',
				
				// Interactive elements
				'button-primary': 'rgba(var(--color-button-primary), <alpha-value>)',
				'button-hover': 'rgba(var(--color-button-hover), <alpha-value>)',
				'link': 'rgba(var(--color-link), <alpha-value>)',
				
				'divider': 'rgba(var(--color-divider), <alpha-value>)',

				// Legacy colors for backward compatibility
				...colors,
				lightGray: '#ebebeb'
			},
			fill: {
				'accent-primary': 'rgba(var(--color-accent-primary), <alpha-value>)',
				'accent-secondary': 'rgba(var(--color-accent-secondary), <alpha-value>)',
				'text-primary': 'rgba(var(--color-text-primary), <alpha-value>)',
				'text-secondary': 'rgba(var(--color-text-secondary), <alpha-value>)',
			},
			stroke: {
				'accent-primary': 'rgba(var(--color-accent-primary), <alpha-value>)',
				'accent-secondary': 'rgba(var(--color-accent-secondary), <alpha-value>)',
				'text-primary': 'rgba(var(--color-text-primary), <alpha-value>)',
				'text-secondary': 'rgba(var(--color-text-secondary), <alpha-value>)',
			},
			screens: {
				xs: '400px'
			}
		}
	},
	plugins: [require('flowbite/plugin'), require('tailwind-scrollbar')]
};
