#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { quranMetaData } from '../src/data/quranMeta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const baseURL = 'https://quranwbw.com';
const sitemapDir = path.join(__dirname, '../static');
const LAST_TOPIC_ID = 1857;

// Ensure output dir exists
if (!fs.existsSync(sitemapDir)) {
    fs.mkdirSync(sitemapDir, { recursive: true });
}

// Helpers
const escapeXml = (str) =>
    String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const entry = (loc, p = 0.8, freq = 'monthly', lastmod) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${freq}</changefreq>
    <priority>${p}</priority>
  </url>
`;

const write = (name, content) => {
    const file = path.join(sitemapDir, name);
    fs.writeFileSync(file, content);
    return file;
};

const today = new Date().toISOString().split('T')[0];

// Routes
const staticRoutes = [
    ['/', 1.0],
    ['/duas', 0.9],
    ['/topics', 0.7],
    ['/morphology', 0.7],
    ['/supplications', 0.5],
    ['/games', 0.2],
    ['/about', 0.2],
];

const chapters = Array.from({ length: 114 }, (_, i) => `/${i + 1}`);
const juz = Array.from({ length: 30 }, (_, i) => `/juz?id=${i + 1}`);
const hizb = Array.from({ length: 60 }, (_, i) => `/hizb?id=${i + 1}`);
const topics = Array.from({ length: LAST_TOPIC_ID }, (_, i) => `/topics?id=${i + 1}`);

// Generate verses for each surah
const verses = [];
for (let chapterId = 1; chapterId <= 114; chapterId++) {
    const surah = quranMetaData[chapterId];
    if (surah && surah.verses) {
        for (let verseNum = 1; verseNum <= surah.verses; verseNum++) {
            verses.push(`/${chapterId}?startVerse=${verseNum}`);
        }
    }
}

// Build sitemap file
const buildSitemap = (name, routes) => {
    const body = routes
        .map((r) => {
            if (typeof r === 'string') {
                return entry(baseURL + r);
            }
            return entry(baseURL + r[0], r[1]);
        })
        .join('\n');

    const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        body +
        `\n</urlset>`;

    write(name, xml);
    return routes.length;
};

// Generate
console.log('Generating sitemaps...');

const counts = {
    static: buildSitemap(
        'sitemap-static.xml',
        staticRoutes.map(([p, pr]) => [p, pr])
    ),
    chapters: buildSitemap('sitemap-chapters.xml', chapters),
    divisions: buildSitemap('sitemap-divisions.xml', [...juz, ...hizb]),
    verses: buildSitemap('sitemap-verses.xml', verses),
    topics: buildSitemap('sitemap-topics.xml', topics),
};

// Index
const indexFiles = [
    'sitemap-static.xml',
    'sitemap-chapters.xml',
    'sitemap-divisions.xml',
    'sitemap-verses.xml',
    'sitemap-topics.xml',
];

const indexXml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    indexFiles
        .map(
            (f) => `
  <sitemap>
    <loc>${baseURL}/static/${f}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
        )
        .join('\n') +
    `\n</sitemapindex>`;

write('sitemap-index.xml', indexXml);

write('sitemap.xml', indexXml);

console.log('Done');
console.log(counts);