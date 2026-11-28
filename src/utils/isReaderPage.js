const readerPages = ['chapter', 'mushaf', 'juz', 'hizb'];

// Checks whether the given page name is one of the reader pages
export function isReaderPage(page) {
	return readerPages.includes(page);
}
