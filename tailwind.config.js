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
