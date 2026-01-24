import { get } from 'svelte/store';
import { quranMetaData } from '$data/quranMeta';
import { __reciter, __translationReciter, __playbackSpeed, __audioSettings, __audioModalVisible, __currentPage, __chapterNumber, __keysToFetch, __displayType, __verseWordBlocks } from '$utils/stores';
import { staticEndpoint, wordsAudioURL } from '$data/websiteSettings';
import { selectableReciters, selectableTranslationReciters, selectablePlaybackSpeeds, selectableAudioDelays } from '$data/options';
import { fetchAndCacheJson } from '$utils/fetchData';

// Getting the audio element
let audio = document.querySelector('#player');
let lastPlayedKey = null;

// Function to play verse audio, either one time or multiple times
export async function playVerseAudio(props) {
	const audioSettings = get(__audioSettings);
	const [playChapter, playVerse] = props.key.split(':').map(Number);
	const { startTime, startingWordKey } = props;
	let playBoth = false;

	if (audio === null) audio = document.querySelector('#player');
	resetAudioSettings();

	// Default language to Arabic
	if (props.language === undefined) props.language = 'arabic';

	// Handle playing both languages
	if (props.language === 'both') {
		props.language = 'arabic';
		playBoth = true;
	}

	console.log('playing', '-', props.key, '-', props.language);

	const reciter = selectableReciters[get(__reciter)];
	const reciterAudioUrl = props.language === 'arabic' ? reciter.url : selectableTranslationReciters[get(__translationReciter)].url;
	const currentVerseFileName = `${String(playChapter).padStart(3, '0')}${String(playVerse).padStart(3, '0')}.mp3`;
	const nextVerseFileName = `${String(playChapter).padStart(3, '0')}${String(playVerse + 1).padStart(3, '0')}.mp3`;

	// Prefetch the next verse audio
	fetch(`${reciterAudioUrl}/${nextVerseFileName}`);

	audio.src = `${reciterAudioUrl}/${currentVerseFileName}`;
	audio.currentTime = 0;
	audio.load();
	audio.playbackRate = selectablePlaybackSpeeds[get(__playbackSpeed)].speed;
	audio.play();

	if (startTime !== undefined && startTime !== null) {
		const seekToStartTime = () => {
			try {
				audio.currentTime = startTime;
			} catch (error) {
				console.warn('Unable to seek to start time:', error);
			}
		};

		if (audio.readyState >= 1) {
			seekToStartTime();
		} else {
			audio.addEventListener('loadedmetadata', seekToStartTime, { once: true });
		}
	}

	audioSettings.isPlaying = true;
	audioSettings.playingKey = props.key;
	audioSettings.audioType = 'verse';
	audioSettings.playingWordKey = startingWordKey || null;

	// Attach word highlighting function for supported reciters
	if (props.language === 'arabic' && reciter.wbw) {
		await fetchTimestampData();
		audio.addEventListener('timeupdate', wordHighlighter);
	}

	// Scroll to the playing verse
	if (!reciter.wbw || (get(__displayType) === 7 && !get(__verseWordBlocks)[audioSettings.playingKey])) {
		scrollElementIntoView(audioSettings.playingKey);
	}

	audio.onended = async function () {
		audio.removeEventListener('timeupdate', wordHighlighter);
		const previousLanguage = props.language;

		// Determine the delay based on audioDelay settings
		const delaySetting = audioSettings.audioDelay;
		const delay = selectableAudioDelays[delaySetting]?.milliseconds || 0;
		const isAudioLengthDelay = delaySetting === Math.max(...Object.keys(selectableAudioDelays).map(Number));
		const calculatedDelay = isAudioLengthDelay ? (audio.duration || 0) * 1000 : delay;

		// Play translation if needed
		if (playBoth && previousLanguage === 'arabic') {
			return playVerseAudio({
				key: `${props.key}`,
				timesToRepeat: +props.timesToRepeat,
				language: 'translation'
			});
		}

		// Delay before repeating
		if (calculatedDelay > 0) {
			console.log(`Applying delay: ${calculatedDelay}ms`);
			await new Promise((resolve) => setTimeout(resolve, calculatedDelay));
		}

		// If there are more verses to play, continue
		if (window.versesToPlayArray?.length > 0) {
			const index = window.versesToPlayArray.indexOf(audioSettings.playingKey);
			if (index > -1) {
				window.versesToPlayArray.splice(index, 1);
			}

			if (window.versesToPlayArray.length > 0) {
				return playVerseAudio({
					key: `${window.versesToPlayArray[0]}`,
					timesToRepeat: +props.timesToRepeat,
					language: audioSettings.language
				});
			}
		}

		// Reset settings after playback ends
		resetAudioSettings({ location: 'end' });
	};

	__audioSettings.set(audioSettings);
}

// Function to play word audio
export function playWordAudio(props) {
	resetAudioSettings();

	const audioSettings = get(__audioSettings);
	const [wordChapter, wordVerse, wordNumber = 1] = props.key.split(':').map(Number);
	const currentWordFileName = `${wordChapter}/${String(wordChapter).padStart(3, '0')}_${String(wordVerse).padStart(3, '0')}_${String(wordNumber).padStart(3, '0')}.mp3`;
	const nextWordFileName = `${wordChapter}/${String(wordChapter).padStart(3, '0')}_${String(wordVerse).padStart(3, '0')}_${String(wordNumber + 1).padStart(3, '0')}.mp3`;
	const currentAudioType = audioSettings.audioType;

	// Prefetch the next word audio
	fetch(`${wordsAudioURL}/${nextWordFileName}?version=2`);

	audio.src = `${wordsAudioURL}/${currentWordFileName}?version=2`;
	audio.currentTime = 0;
	audio.load();
	audio.playbackRate = selectablePlaybackSpeeds[get(__playbackSpeed)].speed;
	audio.play();

	audioSettings.isPlaying = true;
	audioSettings.audioType = 'word';
	audioSettings.playingKey = `${wordChapter}:${wordVerse}`;
	audioSettings.playingWordKey = `${props.key}`;

	// For debugging purposes, needs not be removed
	console.log('playing word', '-', audioSettings.playingWordKey);

	audio.onended = function () {
		if (props.playAllWords && wordNumber < getWordsInVerse(audioSettings.playingKey)) {
			return playWordAudio({ key: `${wordChapter}:${wordVerse}:${wordNumber + 1}`, playAllWords: true });
		}
		resetAudioSettings({ location: 'end' });
		audioSettings.audioType = currentAudioType;
	};

	__audioSettings.set(audioSettings);
}

// Initialize audio settings based on key
export function initializeAudioSettings(key) {
	const audioSettings = get(__audioSettings);

	audioSettings.playingKey = key;
	[audioSettings.playingChapter, audioSettings.playingVerse] = key.split(':').map(Number);
	__audioSettings.set(audioSettings);

	const chapterTotalVerses = quranMetaData[audioSettings.playingChapter].verses;

	audioSettings.startVerse = audioSettings.playingVerse;

	if (audioSettings.endVerse > chapterTotalVerses) {
		audioSettings.endVerse = chapterTotalVerses;
	}
	if (audioSettings.endVerse < audioSettings.startVerse) {
		audioSettings.endVerse = audioSettings.startVerse;
	}

	audioSettings.audioType = audioSettings.audioType ?? 'verse';
	audioSettings.audioRange = audioSettings.audioRange ?? 'playThisVerse';
}

// Reset audio settings
export function resetAudioSettings(props) {
	const audioSettings = get(__audioSettings);

	try {
		if (audio === null) audio = document.querySelector('#player');

		audio.pause();
		audio.currentTime = 0;
		audioSettings.isPlaying = false;
		audioSettings.playingWordKey = null;

		if (props?.location === 'end') {
			window.versesToPlayArray = [];
		}

		__audioSettings.set(audioSettings);
		audio.removeEventListener('timeupdate', wordHighlighter);

		document.querySelectorAll('.word').forEach((element) => {
			element.classList.remove('bg-black/5');
		});
	} catch (error) {
		console.warn(error);
	}
}

// Show audio modal with key
export function showAudioModal(key) {
	resetAudioSettings();
	initializeAudioSettings(key);
	fetchTimestampData();
	__audioModalVisible.set(true);
}

// Word audio controller
export async function wordAudioController(props) {
	const audioSettings = get(__audioSettings);
	const reciter = selectableReciters[get(__reciter)];

	if (audioSettings.isPlaying && audioSettings.audioType === 'verse' && reciter.wbw) {
		const wordIndex = Number(props.key.split(':')[2]);
		const wordTimestamp = await getWordTimestamp(props.chapter, props.verse, wordIndex, reciter.id);

		if (wordTimestamp !== null && wordTimestamp !== undefined) {
			if (audio === null) audio = document.querySelector('#player');
			if (audio) {
				audio.currentTime = wordTimestamp;
			}
			return;
		}
	}

	props.type === 'end' ? showAudioModal(`${props.chapter}:${props.verse}`) : playWordAudio({ key: props.key });
}

async function getWordTimestamp(chapter, verse, word, reciterId) {
	try {
		if (reciterId === undefined || reciterId === null || word === undefined) return null;

		const timestampData = await fetchTimestampData();
		const verseTimestamp = timestampData?.data?.[chapter]?.[verse]?.[reciterId];
		if (!verseTimestamp) return null;

		// word keys are 1-indexed, timestamp data is 0-indexed
		const index = Math.max(0, Number(word) - 1);
		const timestamp = parseFloat(verseTimestamp.split('|')[index]);
		return Number.isNaN(timestamp) ? null : timestamp;
	} catch (error) {
		console.warn('getWordTimestamp error:', error);
		return null;
	}
}

export async function playVerseFromWord(wordKey) {
	try {
		if (!wordKey) return;

		const [chapter, verse, word] = wordKey.split(':').map(Number);
		if (!Number.isFinite(chapter) || !Number.isFinite(verse) || !Number.isFinite(word)) return;

		const audioSettings = get(__audioSettings);
		const reciter = selectableReciters[get(__reciter)];
		const reciterId = reciter?.id;
		const hasTimestampSupport = Boolean(reciter?.wbw);

		if (audioSettings.isPlaying && audioSettings.audioType === 'verse' && hasTimestampSupport) {
			const wordTimestamp = await getWordTimestamp(chapter, verse, word, reciterId);
			if (wordTimestamp !== null && wordTimestamp !== undefined) {
				if (audio === null) audio = document.querySelector('#player');
				if (audio) {
					audio.currentTime = wordTimestamp;
				}
				return;
			}
		}

		const wordTimestamp = hasTimestampSupport ? await getWordTimestamp(chapter, verse, word, reciterId) : null;
		const canSeekToWord = hasTimestampSupport && wordTimestamp !== null && wordTimestamp !== undefined;

		window.versesToPlayArray = [`${chapter}:${verse}`];

		return playVerseAudio({
			key: `${chapter}:${verse}`,
			timesToRepeat: audioSettings.timesToRepeat || 1,
			language: 'arabic',
			startTime: canSeekToWord ? wordTimestamp : undefined,
			startingWordKey: canSeekToWord ? `${chapter}:${verse}:${word}` : null
		});
	} catch (error) {
		console.warn('playVerseFromWord error:', error);
	}
}

// Play verses in word-count chunks with pauses
export async function playWordCountVerses() {
	try {
		const audioSettings = get(__audioSettings);
		if (!window.versesToPlayArray || window.versesToPlayArray.length === 0) return;

		const reciter = selectableReciters[get(__reciter)];
		const wordsPerPause = clampWordCountSize(audioSettings.wordCountSize);
		const pauseDelaySetting = audioSettings.wordCountDelay ?? 1;
		const pauseDelay = selectableAudioDelays[pauseDelaySetting]?.milliseconds || 0;

		audioSettings.wordCountSize = wordsPerPause;
		audioSettings.wordCountDelay = pauseDelaySetting;
		audioSettings.language = 'arabic';
		__audioSettings.set(audioSettings);

		// Fall back to normal playback if timestamps are unavailable
		if (!reciter?.wbw) {
			console.warn('Word Count mode requires a reciter with word timestamps. Falling back to normal playback.');
			return playVerseAudio({
				key: `${window.versesToPlayArray[0]}`,
				timesToRepeat: audioSettings.timesToRepeat || 1,
				language: 'arabic'
			});
		}

		resetAudioSettings();
		if (audio === null) audio = document.querySelector('#player');
		audio.onended = null;

		while (window.versesToPlayArray.length > 0) {
			const currentKey = window.versesToPlayArray[0];
			const played = await playVerseInChunks({
				key: currentKey,
				reciter,
				wordsPerPause,
				pauseDelay
			});
			window.versesToPlayArray.shift();

			if (!played) break;

			const verseDelay = calculateDelay(audioSettings.audioDelay, audio?.duration || 0);
			if (verseDelay > 0 && window.versesToPlayArray.length > 0) {
				await new Promise((resolve) => setTimeout(resolve, verseDelay));
			}
		}
	} catch (error) {
		console.warn('playWordCountVerses error:', error);
	} finally {
		resetAudioSettings({ location: 'end' });
	}
}

// Chunk a single verse using word timestamps
async function playVerseInChunks({ key, reciter, wordsPerPause, pauseDelay }) {
	try {
		if (!key || !reciter) return false;

		const [chapter, verse] = key.split(':').map(Number);
		const timestampData = await fetchTimestampData();
		const verseTimestamp = timestampData?.data?.[chapter]?.[verse]?.[reciter.id];
		if (!verseTimestamp) return false;

		const wordTimestamps = verseTimestamp
			.split('|')
			.map((timestamp) => parseFloat(timestamp))
			.filter((timestamp) => !Number.isNaN(timestamp));
		if (wordTimestamps.length === 0) return false;

		const chunkBoundaries = [];
		for (let i = 0; i < wordTimestamps.length; i += wordsPerPause) {
			const startTime = i === 0 ? 0 : wordTimestamps[i];
			const nextStartTime = wordTimestamps[i + wordsPerPause] ?? null;
			chunkBoundaries.push({
				startTime,
				nextStartTime,
				startWordIndex: i + 1
			});
		}

		resetAudioSettings();
		if (audio === null) audio = document.querySelector('#player');
		audio.onended = null;

		const audioSettings = get(__audioSettings);
		audioSettings.playingKey = key;
		audioSettings.playingChapter = chapter;
		audioSettings.playingVerse = verse;
		audioSettings.audioType = 'verse';
		audioSettings.isPlaying = true;
		audioSettings.playingWordKey = `${chapter}:${verse}:${chunkBoundaries[0].startWordIndex}`;
		__audioSettings.set(audioSettings);

		const reciterAudioUrl = reciter.url;
		const currentVerseFileName = `${String(chapter).padStart(3, '0')}${String(verse).padStart(3, '0')}.mp3`;
		audio.src = `${reciterAudioUrl}/${currentVerseFileName}`;
		audio.currentTime = chunkBoundaries[0].startTime || 0;
		audio.playbackRate = selectablePlaybackSpeeds[get(__playbackSpeed)].speed;
		audio.load();

		if (audio.readyState < 1) {
			await new Promise((resolve) => audio.addEventListener('loadedmetadata', resolve, { once: true }));
		}

		audio.addEventListener('timeupdate', wordHighlighter);

		return await new Promise((resolve) => {
			let chunkIndex = 0;
			let boundaryListener = null;

			const cleanupListeners = () => {
				if (boundaryListener) {
					audio.removeEventListener('timeupdate', boundaryListener);
					boundaryListener = null;
				}
				audio.removeEventListener('ended', handleEnded);
			};

			const handleEnded = () => {
				cleanupListeners();
				chunkIndex += 1;
				if (chunkIndex >= chunkBoundaries.length) {
					return resolve(true);
				}
				setTimeout(playChunk, pauseDelay);
			};

			const playChunk = () => {
				if (chunkIndex >= chunkBoundaries.length) {
					cleanupListeners();
					return resolve(true);
				}

				const chunk = chunkBoundaries[chunkIndex];
				audioSettings.playingWordKey = `${chapter}:${verse}:${chunk.startWordIndex}`;
				__audioSettings.set(audioSettings);

				const nextBoundary = chunk.nextStartTime;
				audio.currentTime = chunk.startTime || 0;

				if (boundaryListener) {
					audio.removeEventListener('timeupdate', boundaryListener);
					boundaryListener = null;
				}
				audio.removeEventListener('ended', handleEnded);
				audio.addEventListener('ended', handleEnded, { once: true });

				if (nextBoundary !== null) {
					boundaryListener = () => {
						if (audio.currentTime >= nextBoundary) {
							audio.pause();
							audio.removeEventListener('ended', handleEnded);
							if (boundaryListener) {
								audio.removeEventListener('timeupdate', boundaryListener);
								boundaryListener = null;
							}
							setTimeout(() => {
								chunkIndex += 1;
								playChunk();
							}, pauseDelay);
						}
					};
					audio.addEventListener('timeupdate', boundaryListener);
				}

				audio.play().catch((error) => {
					console.warn('playWordCount chunk error:', error);
					cleanupListeners();
					resolve(false);
				});
			};

			playChunk();
		});
	} catch (error) {
		console.warn('playVerseInChunks error:', error);
		return false;
	}
}

// Highlight words during audio playback based on timestamps
async function wordHighlighter() {
	const audioSettings = get(__audioSettings);

	try {
		// Get the total number of words in the verse
		const wordsInVerse = getWordsInVerse(audioSettings.playingKey);

		// Retrieve verse timestamp data fetched in playVerseAudio function
		const [chapter, verse] = audioSettings.playingKey.split(':').map(Number);
		const reciterId = selectableReciters[get(__reciter)].id;
		const timestampData = await fetchTimestampData();
		const verseTimestamp = timestampData.data[chapter][verse][reciterId];

		// Loop through all the words to highlight them
		for (let word = 0; word < wordsInVerse; word++) {
			const wordTimestamp = verseTimestamp.split('|')[word];

			// If the word timestamp is lower than the current audio time, update playingWordKey
			if (wordTimestamp < audio.currentTime) {
				audioSettings.playingWordKey = `${audioSettings.playingKey}:${word + 1}`;
			}
		}

		// Update the audio settings
		__audioSettings.set(audioSettings);

		if (audioSettings.playingWordKey && lastPlayedKey !== audioSettings.playingWordKey) {
			scrollElementIntoView(audioSettings.playingWordKey);
			lastPlayedKey = audioSettings.playingWordKey;
		}
	} catch (error) {
		console.warn('wordHighlighter error:', error);
	}
}

// Generate an array of verses to play
export function setVersesToPlay(props) {
	const audioSettings = get(__audioSettings);

	window.versesToPlayArray = [];

	// If the verses were provided in an array, just use those
	if (props?.verses) {
		for (const key of props.verses) {
			window.versesToPlayArray.push(key);
		}
	} else if (props?.allVersesOnPage) {
		if (get(__currentPage) === 'mushaf') {
			const wordsOnPage = document.getElementsByClassName('word');
			for (const wordElement of wordsOnPage) {
				const verseKey = `${wordElement.id.split(':')[0]}:${wordElement.id.split(':')[1]}`;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}
		} else if (get(__currentPage) === 'chapter') {
			const versesOnPage = document.getElementsByClassName('verse');
			const startVerse = Number(versesOnPage[0].id.split(':')[1]);
			const endVerse = quranMetaData[get(__chapterNumber)].verses;

			for (let verse = startVerse; verse <= endVerse; verse++) {
				const verseKey = `${get(__chapterNumber)}:${verse}`;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}
		} else {
			const versesOnPage = document.getElementsByClassName('verse');
			for (const verseElement of versesOnPage) {
				const verseKey = verseElement.id;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}
		}
	} else {
		if (get(__currentPage) === 'mushaf' && props.audioRange === 'playFromHere') {
			const key = `${props.chapter}:${props.startVerse}`;
			const wordsOnPage = document.getElementsByClassName('word');

			for (const wordElement of wordsOnPage) {
				const verseKey = `${wordElement.id.split(':')[0]}:${wordElement.id.split(':')[1]}`;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}

			const startIndex = window.versesToPlayArray.indexOf(key);
			window.versesToPlayArray = window.versesToPlayArray.slice(startIndex);
		} else {
			for (let verse = props.startVerse; verse <= props.endVerse; verse++) {
				const verseKey = `${props.chapter}:${verse}`;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}
		}
	}

	// Apply repeat logic at the end for consistency
	if (audioSettings.repeatType === 'repeatRange' && audioSettings.timesToRepeat > 1 && get(__audioModalVisible) === true) {
		const originalSet = [...window.versesToPlayArray];
		for (let i = 1; i < audioSettings.timesToRepeat; i++) {
			window.versesToPlayArray.push(...originalSet);
		}
	}

	if (audioSettings.repeatType === 'repeatVerse' && audioSettings.timesToRepeat > 1 && get(__audioModalVisible) === true) {
		const newArray = [];
		for (const verseKey of window.versesToPlayArray) {
			for (let i = 0; i < audioSettings.timesToRepeat; i++) {
				newArray.push(verseKey);
			}
		}
		window.versesToPlayArray = newArray;
	}

	console.log('versesToPlayArray', window.versesToPlayArray);
}

function calculateDelay(delaySetting, durationSeconds) {
	const delayConfig = selectableAudioDelays[delaySetting];
	if (!delayConfig) return 0;
	const audioLengthDelayId = Math.max(...Object.keys(selectableAudioDelays).map(Number));
	return delaySetting === audioLengthDelayId ? (durationSeconds || 0) * 1000 : delayConfig.milliseconds || 0;
}

function clampWordCountSize(size) {
	const parsed = Number(size);
	if (Number.isNaN(parsed)) return 1;
	return Math.min(10, Math.max(1, parsed));
}

// Get the total number of words in the verse based on the current mode
function getWordsInVerse(key) {
	const isMushafPage = get(__currentPage) === 'mushaf';
	const [chapter, verse] = key.split(':');

	if (isMushafPage) {
		const pageData = JSON.parse(localStorage.getItem('pageData'));
		return Number(pageData[key].meta.words);
	} else {
		const wordData = document.querySelector(`.verse-${chapter}-${verse}`).dataset.words;
		return Number(wordData);
	}
}

// Handler for verse play button and the play button in audio modal
export function playButtonHandler(key) {
	const audioSettings = get(__audioSettings);
	const { audioType, timesToRepeat, language, audioRange } = audioSettings;
	const firstVerseKey = window.versesToPlayArray?.[0] || key;

	if (audioRange === 'wordCount' && audioType === 'verse') {
		playWordCountVerses();
	} else if (audioType === 'verse') {
		playVerseAudio({
			key: `${firstVerseKey}`,
			timesToRepeat: timesToRepeat,
			language: language
		});
	} else if (audioType === 'word') {
		playWordAudio({
			key: `${key}:1`,
			playAllWords: true
		});
	}

	__audioModalVisible.set(false);
}

// This function prepares the verses to play based on the provided key (chapter and verse).
// It handles different audio range options and adapts its behavior according to the current page context.
// Note: This function only prepares the verses to play.
// The actual setting of verses to play in a global array is handled by another function called setVersesToPlay.
export function prepareVersesToPlay(key) {
	const [chapter, verse] = key.split(':');
	const { audioRange, startVerse, endVerse } = get(__audioSettings);
	const versesInChapter = quranMetaData[chapter].verses;
	const isSpecialPage = ['supplications', 'bookmarks', 'juz'].includes(get(__currentPage));

	// Helper function to set verses to play starting from the current key
	const setPlayFromHere = () => {
		if (isSpecialPage) {
			const removeKeysBefore = (string, key) => string.split(',').slice(string.split(',').indexOf(key)).join(',');
			const updatedKeys = removeKeysBefore(get(__keysToFetch), key).split(',');
			setVersesToPlay({ verses: updatedKeys });
		} else {
			setVersesToPlay({ location: 'verseOptionsOrModal', chapter, startVerse: verse, endVerse: versesInChapter, audioRange: 'playFromHere' });
		}
	};

	switch (audioRange) {
		case 'playThisVerse':
			// Set verses to play for the current verse only
			setVersesToPlay({ location: 'verseOptionsOrModal', chapter, startVerse: verse, endVerse: verse });
			break;
		case 'wordCount':
			// Play the selected verses in word-count chunks
			setVersesToPlay({ location: 'verseOptionsOrModal', chapter, startVerse, endVerse });
			break;
		case 'playFromHere':
			// Call helper function to set verses to play from the current key onwards
			setPlayFromHere();
			break;
		case 'playRange':
			// Set verses to play from the startVerse to the end of the chapter
			setVersesToPlay({ location: 'verseOptionsOrModal', chapter, startVerse, endVerse: endVerse });
			break;
		default:
			// Handle invalid audioRange values
			console.error('Invalid audioRange:', audioRange);
	}
}

// Fetch timestamps for word-by-word highlighting
async function fetchTimestampData() {
	return await fetchAndCacheJson(`${staticEndpoint}/timestamps/timestamps.json?version=2`, 'other');
}

function scrollElementIntoView(id) {
	try {
		if (!id) return;
		const element = document.getElementById(String(id));
		if (!element) return;

		element.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
	} catch (error) {
		console.warn('scrollElementIntoView error:', error);
	}
}
