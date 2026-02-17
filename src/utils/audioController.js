/* eslint-disable no-inner-declarations */
/* eslint-disable svelte/no-inner-declarations */
import { get } from 'svelte/store';
import { quranMetaData } from '$data/quranMeta';
import { __reciter, __translationReciter, __playbackSpeed, __audioSettings, __audioModalVisible, __currentPage, __chapterNumber, __keysToFetch, __displayType, __verseWordBlocks } from '$utils/stores';
import { wordsAudioURL } from '$data/websiteSettings';
import { selectableReciters, selectableTranslationReciters, selectablePlaybackSpeeds, selectableAudioDelays } from '$data/options';
// import { fetchAndCacheJson } from '$utils/fetchData';

// Hardcoded reciter ID for chapter-based audio (will be made dynamic later)
const CHAPTER_AUDIO_RECITER_ID = 7;
const CHAPTER_AUDIO_BASE_URL = 'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/';

// Getting the audio element
let audio = document.querySelector('#player');
let lastPlayedKey = null;

// Cache for timestamp data per chapter
const timestampCache = new Map();

function isConsecutiveArabicVerse(nextKey) {
	const audioSettings = get(__audioSettings);
	if (!audioSettings.playingKey || audioSettings.audioType !== 'verse') return false;

	const [currentChapter, currentVerse] = audioSettings.playingKey.split(':').map(Number);
	const [nextChapter, nextVerse] = nextKey.split(':').map(Number);

	return currentChapter === nextChapter && nextVerse === currentVerse + 1;
}

export function pauseOrResumeAudio() {
	const audioSettings = get(__audioSettings);

	if (audioSettings.audioType !== 'verse') return;

	if (!audio.paused) {
		audio.pause();
		audioSettings.audioIsPaused = true;
	} else {
		audio.play();
		audioSettings.audioIsPaused = false;
	}

	__audioSettings.set(audioSettings);
}

// Function to play verse audio, either one time or multiple times
export async function playVerseAudio(props) {
	const audioSettings = get(__audioSettings);
	const [playChapter, playVerse] = props.key.split(':').map(Number);
	let playBoth = false;

	const isSeamlessContinuation = props.language === 'arabic' && isConsecutiveArabicVerse(props.key);
	if (!isSeamlessContinuation) resetAudioSettings();

	// Default language to Arabic
	if (props.language === undefined) props.language = 'arabic';

	// Handle playing both languages
	if (props.language === 'both') {
		props.language = 'arabic';
		playBoth = true;
	}

	console.log('playing', '-', props.key, '-', props.language);

	const reciter = selectableReciters[get(__reciter)];

	// For Arabic audio, use chapter-based audio file
	if (props.language === 'arabic') {
		// Fetch timestamp data for the chapter
		const timestampData = await fetchChapterTimestampData(playChapter);

		if (!timestampData) {
			console.error('Failed to fetch timestamp data for chapter', playChapter);
			resetAudioSettings({ location: 'end' });
			return;
		}

		// Find the verse timing data
		const verseTiming = timestampData.verse_timings.find((v) => v.verse_key === props.key);

		if (!verseTiming) {
			console.error('Verse timing not found for', props.key);
			resetAudioSettings({ location: 'end' });
			return;
		}

		const currentAudioSrc = audio.src;
		const chapterAudioUrl = `${CHAPTER_AUDIO_BASE_URL}/${playChapter}.mp3`;
		const wasPaused = audioSettings.audioIsPaused;

		if (!currentAudioSrc.includes(`/${playChapter}.mp3`)) {
			audio.src = chapterAudioUrl;
			audio.load();
			audio.currentTime = verseTiming.timestamp_from / 1000;
		}

		// Only seek if not a seamless continuation or resuming from pause
		if (!isSeamlessContinuation && !wasPaused) {
			audio.currentTime = verseTiming.timestamp_from / 1000;
		}

		audio.playbackRate = selectablePlaybackSpeeds[get(__playbackSpeed)].speed;
		if (!isSeamlessContinuation) audio.play();

		audioSettings.audioIsPaused = false;

		// Attach progress tracker for chapter audio
		audio.removeEventListener('timeupdate', trackAudioProgress);
		audio.addEventListener('timeupdate', trackAudioProgress);

		audioSettings.isPlaying = true;
		audioSettings.playingKey = props.key;
		audioSettings.audioType = 'verse';
		audioSettings.currentVerseTiming = verseTiming;
		audioSettings.currentChapterTimestamps = timestampData;

		// Attach word highlighting function for supported reciters
		if (reciter.wbw) {
			audio.addEventListener('timeupdate', wordHighlighter);
		}

		// Scroll to the playing verse
		if (!reciter.wbw || (get(__displayType) === 7 && !get(__verseWordBlocks)[audioSettings.playingKey])) {
			scrollElementIntoView(audioSettings.playingKey);
		}

		// Monitor when the verse ends (not the entire chapter)
		audio.ontimeupdate = function () {
			const currentTimeMs = audio.currentTime * 1000;

			// Check if we've reached the end of the current verse
			if (currentTimeMs >= verseTiming.timestamp_to) {
				audio.removeEventListener('timeupdate', wordHighlighter);
				handleVerseEnd();
			}
		};

		async function handleVerseEnd() {
			const previousLanguage = props.language;

			// Determine the delay based on audioDelay settings
			const delaySetting = audioSettings.audioDelay;
			const delay = selectableAudioDelays[delaySetting]?.milliseconds || 0;
			const isAudioLengthDelay = delaySetting === Math.max(...Object.keys(selectableAudioDelays).map(Number));
			const calculatedDelay = isAudioLengthDelay ? verseTiming.duration : delay;

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
		}
	} else {
		// Translation audio remains verse-by-verse
		const reciterAudioUrl = selectableTranslationReciters[get(__translationReciter)].url;
		const currentVerseFileName = `${String(playChapter).padStart(3, '0')}${String(playVerse).padStart(3, '0')}.mp3`;
		const nextVerseFileName = `${String(playChapter).padStart(3, '0')}${String(playVerse + 1).padStart(3, '0')}.mp3`;

		// Prefetch the next verse audio
		fetch(`${reciterAudioUrl}/${nextVerseFileName}`);

		audio.src = `${reciterAudioUrl}/${currentVerseFileName}`;
		audio.currentTime = 0;
		audio.load();
		audio.playbackRate = selectablePlaybackSpeeds[get(__playbackSpeed)].speed;
		audio.play();

		audioSettings.isPlaying = true;
		audioSettings.playingKey = props.key;
		audioSettings.audioType = 'verse';

		audio.onended = async function () {
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
	}

	__audioSettings.set(audioSettings);
}

// Function to play word audio
export async function playWordAudio(props) {
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

// Fetch timestamps for word-by-word highlighting (chapter-based)
async function fetchChapterTimestampData(chapter) {
	// Check if we already have this chapter's data cached
	if (timestampCache.has(chapter)) {
		return timestampCache.get(chapter);
	}

	try {
		const targetUrl = `https://quran.com/api/proxy/content/api/qdc/audio/reciters/${CHAPTER_AUDIO_RECITER_ID}/audio_files?chapter=${chapter}&segments=true`;
		const response = await fetch(`https://api.quranwbw.com/v2/qurancom-proxy?url=${encodeURIComponent(targetUrl)}`);

		if (!response.ok) {
			throw new Error(`Failed to fetch timestamp data: ${response.status}`);
		}

		const data = await response.json();

		if (!data.audio_files || data.audio_files.length === 0) {
			throw new Error('No audio files found in response');
		}

		const audioFileData = data.audio_files[0];

		// Cache the data
		timestampCache.set(chapter, audioFileData);

		return audioFileData;
	} catch (error) {
		console.error('Error fetching chapter timestamp data:', error);
		return null;
	}
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

		// Reset paused state and tracking
		audioSettings.audioIsPaused = false;
		audioSettings.audioElapsed = 0;
		audioSettings.audioDuration = 0;

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
		const timestampData = audioSettings.currentChapterTimestamps;

		if (!timestampData) {
			console.error('Chapter timestamp data not available');
			return;
		}

		const verseKey = `${props.chapter}:${props.verse}`;
		const verseTiming = timestampData.verse_timings.find((v) => v.verse_key === verseKey);

		if (!verseTiming || !verseTiming.segments) {
			console.error('Verse timing or segments not found for', verseKey);
			return;
		}

		const wordIndex = parseInt(props.key.split(':')[2]) - 1; // Convert to 0-based index

		if (wordIndex >= 0 && wordIndex < verseTiming.segments.length) {
			const [, wordStartTime] = verseTiming.segments[wordIndex];
			audio.currentTime = wordStartTime / 1000; // Convert milliseconds to seconds
		}

		return;
	}

	props.type === 'end' ? showAudioModal(`${props.chapter}:${props.verse}`) : playWordAudio({ key: props.key });
}

// Highlight words during audio playback based on timestamps
async function wordHighlighter() {
	const audioSettings = get(__audioSettings);

	try {
		if (!audioSettings.currentVerseTiming || !audioSettings.currentVerseTiming.segments) {
			return;
		}

		const currentTimeMs = audio.currentTime * 1000;
		const segments = audioSettings.currentVerseTiming.segments;

		// Find which word is currently being spoken based on timestamp
		for (let i = 0; i < segments.length; i++) {
			const [wordNumber, startTime, endTime] = segments[i];

			// If current time is within this word's timestamp range
			if (currentTimeMs >= startTime && currentTimeMs < endTime) {
				const newWordKey = `${audioSettings.playingKey}:${wordNumber}`;

				if (audioSettings.playingWordKey !== newWordKey) {
					audioSettings.playingWordKey = newWordKey;
					__audioSettings.set(audioSettings);

					if (lastPlayedKey !== newWordKey) {
						scrollElementIntoView(newWordKey);
						lastPlayedKey = newWordKey;
					}
				}
				break;
			}
		}
	} catch (error) {
		console.warn('Word highlighter error:', error);
	}
}

function trackAudioProgress() {
	const audioSettings = get(__audioSettings);
	const newElapsed = Math.floor(audio.currentTime); // floor to whole seconds

	if (!isNaN(audio.duration)) {
		audioSettings.audioDuration = audio.duration;
	}

	// Only update store if the second has changed
	if (newElapsed !== Math.floor(audioSettings.audioElapsed)) {
		audioSettings.audioElapsed = audio.currentTime;
		__audioSettings.set(audioSettings);
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
	const { audioType, timesToRepeat, language } = get(__audioSettings);
	if (audioType === 'verse') {
		playVerseAudio({
			key: `${window.versesToPlayArray[0]}`,
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
		case 'playFromHere':
			// Call helper function to set verses to play from the current key onwards
			setPlayFromHere();
			break;
		case 'playRange':
			// Set verses to play from the startVerse to the end of the chapter
			setVersesToPlay({ location: 'verseOptionsOrModal', chapter, startVerse, endVerse: endVerse });
			break;
	}
}

// Fetch timestamps for word-by-word highlighting (kept for compatibility, but now uses chapter-based data)
async function fetchTimestampData() {
	const audioSettings = get(__audioSettings);
	const [chapter] = audioSettings.playingKey.split(':').map(Number);

	return await fetchChapterTimestampData(chapter);
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
		console.warn(error);
	}
}
