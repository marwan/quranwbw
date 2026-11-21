import { fetchWordData } from '$utils/fetchData';
import { buildQuizData, shuffleArray } from './guessTheWordSet';

export async function fetchQuizData(wordTranslation = 1) {
	const data = buildQuizData(await fetchWordData(1, wordTranslation, 1));
	return { ...data, words: shuffleArray(data.words) };
}
