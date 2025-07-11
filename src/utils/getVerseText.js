// Function to get the Arabic verse text
export function getVerseText(key) {
	try {
		const [chapter, verse] = key.split(':').map(Number);
		const words = document.querySelectorAll(`.verse-${chapter}-${verse} .arabicText`);
		let wordsArray = [];

		// Join all the words
		words.forEach((word) => {
			wordsArray.push(word.innerText);
		});

		return wordsArray.join(' ');
	} catch (error) {
		console.warn(error);
		return key;
	}
}
