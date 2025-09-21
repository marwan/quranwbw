/** @type { import("eslint").Linter.Config } */
module.exports = {
	root: true,
	extends: ['eslint:recommended', 'plugin:svelte/recommended', 'prettier'],
	plugins: ['unused-imports'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	globals: {
		__APP_VERSION__: 'readonly'
	},
	overrides: [
	{
		files: ['tests/**/*.ts', 'playwright.config.ts'],
		parser: '@typescript-eslint/parser',
		parserOptions: {
		project: './tsconfig.playwright.json',
		tsconfigRootDir: __dirname
		},
		plugins: ['@typescript-eslint'],
		extends: ['plugin:@typescript-eslint/recommended'],
		rules: {
		'@typescript-eslint/no-explicit-any': 'off'
		}
	}
	],
	rules: {
		'no-unused-vars': 'off',
		'svelte/no-at-html-tags': 'off',

		// Enable better unused import/var detection
		'unused-imports/no-unused-imports': 'error',
		'unused-imports/no-unused-vars': [
			'warn',
			{
				vars: 'all',
				varsIgnorePattern: '^_',
				args: 'after-used',
				argsIgnorePattern: '^_'
			}
		]
	}
};
