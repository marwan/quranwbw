import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = process.cwd();

function walk(dir, fileList = []) {
	const files = fs.readdirSync(dir, { withFileTypes: true });

	for (const file of files) {
		const fullPath = path.join(dir, file.name);

		if (file.isDirectory()) {
			walk(fullPath, fileList);
		} else {
			const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

			fileList.push(`'/${relativePath}'`);
		}
	}

	return fileList;
}

const files = walk(baseDir);

// Print in JS-array-friendly format
console.log('[');
console.log(files.join(',\n'));
console.log(']');
