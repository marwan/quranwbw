/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';
import flowbitePlugin from 'flowbite/plugin';
import tailwindScrollbar from 'tailwind-scrollbar';

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
	plugins: [flowbitePlugin, tailwindScrollbar]
};
