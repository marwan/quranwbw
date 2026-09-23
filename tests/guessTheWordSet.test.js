import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceQuestion, advanceWord, buildQuizData, buildWordQuestion, createAyahSession, normalizeTranslation, recordWordOutcome, startNextAyah } from '../src/utils/guessTheWordSet.js';

const word = (number, translation, arabic = 'كَلِمَة' + number, ayah = '1:1') => ({
	word_key: ayah + ':' + number,
	word_arabic: arabic,
	word_english: translation,
	word_transliteration: 'kalima'
});
const ayah = (key, length) => ({
	key, chapter: +key.split(':')[0], verse: +key.split(':')[1],
	words: Array.from({ length }, (_, index) => word(index + 1, 'meaning ' + index, undefined, key))
});
const identityRandom = () => 0.999;
const finishAyah = (session, outcome = 'correct') => {
	while (!session.isComplete) session = advanceWord(recordWordOutcome(session, outcome));
	return session;
};

test('a question has four distinct, nonempty answers and the specified correct word', () => {
	const words = [word(1, 'Clay'), word(2, ' clay '), word(3, 'Water'), word(4, 'Fire'), word(5, 'Earth')];
	const result = buildWordQuestion(words[0], words, [], () => 0);
	assert.equal(result.wordSet.length, 4);
	assert.equal(new Set(result.wordSet.map((option) => option.word_key)).size, 4);
	assert.equal(new Set(result.wordSet.map(normalizeTranslation)).size, 4);
	assert.equal(result.wordSet[result.correctAnswerIndex], words[0]);
});

test('the next ayah word is still asked if it appeared in the previous question', () => {
	const words = Array.from({ length: 10 }, (_, index) => word(index + 1, 'meaning ' + index));
	const previousKeys = words.slice(0, 4).map((entry) => entry.word_key);
	const result = buildWordQuestion(words[1], words, previousKeys, () => 0);
	assert.equal(result.wordSet[result.correctAnswerIndex], words[1]);
	assert.ok(result.wordSet.every((entry) => entry === words[1] || !previousKeys.includes(entry.word_key)));
});

test('small datasets can reuse distractors without duplicating the correct answer', () => {
	const words = Array.from({ length: 4 }, (_, index) => word(index + 1, 'meaning ' + index));
	const result = buildWordQuestion(words[0], words, words.map((entry) => entry.word_key), () => 0);
	assert.equal(result.wordSet.length, 4);
	assert.equal(new Set(result.wordSet.map(normalizeTranslation)).size, 4);
});

test('blank and malformed entries cannot become distractors', () => {
	const words = [word(1, 'Clay'), null, word(2, '   '), word(3, 'clay'), word(4, 'Water', ''), word(5, 'Fire'), word(6, 'Earth'), word(7, 'Air')];
	const result = buildWordQuestion(words[0], words, [], () => 0);
	assert.ok(result.wordSet.every((entry) => entry.word_arabic && normalizeTranslation(entry)));
	assert.equal(new Set(result.wordSet.map(normalizeTranslation)).size, 4);
	assert.throws(() => buildWordQuestion(null, words), /no available translation/);
});

test('different translations of identical Arabic cannot compete in the same question', () => {
	const words = [word(1, 'from', 'مِنْ'), word(2, 'of', 'مِنْ'), word(3, 'water'), word(4, 'fire'), word(5, 'earth')];
	const result = buildWordQuestion(words[0], words, [], () => 0);
	assert.equal(new Set(result.wordSet.map((entry) => entry.word_arabic)).size, 4);
});

test('insufficient answer data produces a recoverable error', () => {
	assert.throws(() => buildWordQuestion(word(1, 'One'), []), /No translated words/);
	const words = [word(1, 'One'), word(2, 'one'), word(3, 'Two'), word(4, 'Three')];
	assert.throws(() => buildWordQuestion(words[0], words), /four distinct/);
});

test('data preparation preserves numeric ayah and word order and excludes incomplete ayahs', () => {
	const data = buildQuizData({
		arabicWordData: { 2: { 10: [['ج', 'د']], 2: [['ا', 'ب']], 3: [['ه', 'و']], 4: null } },
		translationWordData: { 2: { 10: [['earth', 'fire']], 2: [['water', 'air']], 3: [['clay', '']] } }
	});
	assert.deepEqual(data.ayahs.map((entry) => entry.key), ['2:2', '2:10']);
	assert.deepEqual(data.ayahs[0].words.map((entry) => entry.word_key), ['2:2:1', '2:2:2']);
	assert.equal(data.words.length, 5);
	assert.throws(() => buildQuizData({}), /unavailable/);
	assert.throws(() => buildQuizData({ arabicWordData: {}, translationWordData: {} }), /not enough/);
});

test('a new session starts at word one, with a manageable opening ayah when available', () => {
	const source = [ayah('1:1', 20), ayah('1:2', 4), ayah('1:3', 1)];
	const session = createAyahSession(source, identityRandom);
	assert.equal(session.deck[0].key, '1:2');
	assert.equal(session.wordIndex, 0);
	assert.deepEqual(session.outcomes, []);
	assert.equal(session.isComplete, false);
	assert.deepEqual(source.map((entry) => entry.key), ['1:1', '1:2', '1:3']);
});

test('correct, wrong, and skipped words all advance exactly one position in the same ayah', () => {
	let session = createAyahSession([ayah('1:1', 4), ayah('1:2', 3)], identityRandom);
	const originalKey = session.deck[session.ayahIndex].key;
	for (const [index, outcome] of ['correct', 'wrong', 'skipped'].entries()) {
		assert.equal(session.wordIndex, index);
		session = advanceWord(recordWordOutcome(session, outcome));
		assert.equal(session.wordIndex, index + 1);
		assert.equal(session.deck[session.ayahIndex].key, originalKey);
		assert.equal(session.isComplete, false);
	}
	assert.deepEqual(session.outcomes, ['correct', 'wrong', 'skipped']);
});

test('a repeated Arabic word in an ayah is practiced at both positions', () => {
	const repeated = ayah('55:13', 3);
	repeated.words[2] = { ...repeated.words[0], word_key: '55:13:3' };
	let session = createAyahSession([repeated], identityRandom);
	const visited = [];
	while (!session.isComplete) {
		visited.push(session.deck[0].words[session.wordIndex].word_key);
		session = advanceWord(recordWordOutcome(session, 'correct'));
	}
	assert.deepEqual(visited, ['55:13:1', '55:13:2', '55:13:3']);
});

test('an unanswered word cannot be advanced and an outcome cannot be counted twice', () => {
	let session = createAyahSession([ayah('1:1', 3)]);
	assert.equal(advanceWord(session), session);
	session = recordWordOutcome(session, 'correct');
	assert.equal(recordWordOutcome(session, 'wrong'), session);
	session = advanceWord(session);
	assert.equal(advanceWord(session), session);
	assert.deepEqual(session.outcomes, ['correct']);
});

test('the final word marks the boundary before the deck advances', () => {
	const session = createAyahSession([ayah('1:1', 3), ayah('2:1', 1)], identityRandom);
	assert.equal(startNextAyah(session), session);
	const complete = finishAyah(session);
	assert.equal(complete.isComplete, true);
	assert.equal(complete.ayahIndex, 0);
	assert.equal(complete.wordIndex, 2);
	assert.equal(advanceWord(complete), complete);
	assert.equal(recordWordOutcome(complete, 'wrong'), complete);
	const next = startNextAyah(complete);
	assert.equal(next.deck[next.ayahIndex].key, '2:1');
	assert.equal(next.wordIndex, 0);
	assert.equal(next.isComplete, false);
	assert.deepEqual(next.outcomes, []);
});

test('a one-word ayah reaches completion correctly even when skipped', () => {
	const complete = finishAyah(createAyahSession([ayah('2:1', 1)]), 'skipped');
	assert.equal(complete.isComplete, true);
	assert.deepEqual(complete.outcomes, ['skipped']);
});

test('every ayah is played before reshuffling and deck rollover avoids an immediate repeat', () => {
	let session = createAyahSession([ayah('1:1', 3), ayah('1:2', 3), ayah('1:3', 3)], identityRandom);
	const visited = [];
	for (let index = 0; index < 3; index++) {
		visited.push(session.deck[session.ayahIndex].key);
		session = finishAyah(session);
		if (index < 2) session = startNextAyah(session);
	}
	assert.equal(new Set(visited).size, 3);
	const next = startNextAyah(session, () => 0.5);
	assert.notEqual(next.deck[0].key, visited[2]);
	assert.equal(next.wordIndex, 0);
	assert.equal(next.outcomes.length, 0);
});

test('a single-ayah dataset can restart without stale answers', () => {
	const complete = finishAyah(createAyahSession([ayah('1:1', 1)]));
	const next = startNextAyah(complete);
	assert.equal(next.deck[0].key, '1:1');
	assert.equal(next.isComplete, false);
	assert.deepEqual(next.outcomes, []);
});

test('correct, wrong, and skipped final words flow directly into the next ayah', () => {
	for (const outcome of ['correct', 'wrong', 'skipped']) {
		let session = createAyahSession([ayah('1:1', 3), ayah('1:2', 3)], identityRandom);
		const initialSession = session;
		assert.equal(advanceQuestion(session), session);
		for (let index = 0; index < 3; index++) {
			session = advanceQuestion(recordWordOutcome(session, outcome));
			assert.equal(session.isComplete, false);
		}
		assert.equal(session.deck[session.ayahIndex].key, '1:2');
		assert.equal(session.wordIndex, 0);
		assert.deepEqual(session.outcomes, []);
		assert.deepEqual(initialSession.outcomes, []);
	}
});

test('automatic advancement handles one-word ayahs and deck rollover', () => {
	let session = createAyahSession([ayah('2:1', 1), ayah('3:1', 1)], identityRandom);
	session = advanceQuestion(recordWordOutcome(session, 'skipped'), identityRandom);
	assert.equal(session.deck[session.ayahIndex].key, '3:1');
	session = advanceQuestion(recordWordOutcome(session, 'correct'), identityRandom);
	assert.equal(session.deck[session.ayahIndex].key, '2:1');
	assert.equal(session.wordIndex, 0);
	assert.deepEqual(session.outcomes, []);
	assert.equal(session.isComplete, false);
});
