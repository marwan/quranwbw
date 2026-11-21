const readerPages = ['chapter', 'mushaf', 'juz', 'hizb'];

export function isReaderPage(page) {
	return readerPages.includes(page);
}
