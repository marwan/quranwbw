// import node built-ins for reading files and building paths
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// directory to scan
const srcDir = 'src';

// file types to check
const fileExtensions = ['.svelte', '.js', '.ts', '.html', '.css'];

// tailwind utilities that accept a color (e.g. text-, bg-, border-)
const utilityPrefixes = 'bg|text|border|ring|ring-offset|outline|divide|placeholder|fill|stroke|from|via|to|accent|caret|decoration|shadow';

// default tailwind palette names
const paletteColors = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

// matches prefix + color + shade, e.g. text-gray-500
// \b also catches variants like dark:text-gray-500 or hover:bg-blue-600
const colorPattern = new RegExp(`\\b(${utilityPrefixes})-(${paletteColors})-\\d{2,3}\\b`, 'g');

// lines containing this marker are skipped
const ignoreMarker = 'lint-ignore';

// recursively collect all files with a checked extension
function getFiles(dir) {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);

		// go deeper into folders
		if (statSync(path).isDirectory()) return getFiles(path);

		// keep only files with a matching extension
		return fileExtensions.includes(extname(path)) ? [path] : [];
	});
}

// total number of violations found
let failureCount = 0;

for (const file of getFiles(srcDir)) {
	const lines = readFileSync(file, 'utf8').split('\n');

	lines.forEach((line, index) => {
		// skip lines explicitly marked as allowed
		if (line.includes(ignoreMarker)) return;

		// report every hardcoded color found on this line
		for (const match of line.matchAll(colorPattern)) {
			failureCount++;

			// GitHub annotation format, shows inline on the PR
			console.log(`::error file=${file},line=${index + 1}::Hardcoded Tailwind color "${match[0]}"`);
		}
	});
}

// fail the workflow if anything was found
if (failureCount > 0) {
	console.error(`\nFound ${failureCount} hardcoded Tailwind color(s). Use theme colors instead.`);
	process.exit(1);
}

console.log('No hardcoded Tailwind colors found.');
