import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'selector',
	theme: {
		extend: {
			colors: {
				...colors,
				lightGray: '#ebebeb'
			},
			screens: {
				xs: '374px'
			}
		}
	},
	plugins: [require('flowbite/plugin'), require('tailwind-scrollbar')]
};
