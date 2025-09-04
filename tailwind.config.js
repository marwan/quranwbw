/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.{html,js,svelte,ts}',
        '!./src/utils/parseURL.js'
    ],
    darkMode: 'selector',
    theme: {
        extend: {
            // Keep only what themes currently provide and the app uses
            colors: {
                accent: {
                    primary: 'rgba(var(--color-accent-primary), <alpha-value>)',
                    secondary: 'rgba(var(--color-accent-secondary), <alpha-value>)'
                }
            },
            fill: {
                'accent-primary': 'rgba(var(--color-accent-primary), <alpha-value>)'
            },
            stroke: {
                'accent-primary': 'rgba(var(--color-accent-primary), <alpha-value>)'
            }
        }
    },
    plugins: [require('flowbite/plugin')],
};
