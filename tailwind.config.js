/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

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
				xs: '400px'
			}
		}
	},
	plugins: [require('flowbite/plugin'), require('tailwind-scrollbar')]
};
