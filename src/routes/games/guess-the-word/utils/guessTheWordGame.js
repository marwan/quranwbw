import { fetchWordData } from '$utils/fetchData';
import { buildQuizData, shuffleArray } from './guessTheWordSet';

// Fetches every word of the Quran in the chosen translation language, turns it into quiz data
// (ayahs + a flat list of words) and returns it with the words in random order.
export async function fetchQuizData(wordTranslation = 1) {
	const data = buildQuizData(await fetchWordData(1, wordTranslation, 1));
	// Shuffle only the flat word list (used for picking wrong options); the ayahs keep their order.
	return { ...data, words: shuffleArray(data.words) };
}
