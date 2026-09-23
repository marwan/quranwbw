import { fetchWordData } from './fetchData';
import { buildQuizData, shuffleArray } from './guessTheWordSet';

export async function fetchQuizData() {
	const data = buildQuizData(await fetchWordData(1, 1, 1));
	return { ...data, words: shuffleArray(data.words) };
}
