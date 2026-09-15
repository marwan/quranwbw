import { get } from 'svelte/store';
import { quranMetaData } from '$data/quranMeta';
import { __reciter, __translationReciter, __playbackSpeed, __audioSettings, __audioModalVisible, __currentPage, __chapterNumber, __keysToFetch, __displayType, __verseWordBlocks, __playback } from '$utils/stores';
import { staticEndpoint, wordsAudioURL } from '$data/websiteSettings';
import { selectableReciters, selectableTranslationReciters, selectablePlaybackSpeeds, selectableAudioDelays } from '$data/options';
import { fetchAndCacheJson } from '$utils/fetchData';
import { checkOnlineAndAlert } from '$utils/offlineModeHandler';

// <audio> element used for all verse and word playback. Owned by AudioPlayer.svelte and
// handed to this module via registerAudioElement() on mount, so it is null until then —
// don't query the DOM at module load (the element no longer lives in app.html).
let audio = null;

// Tracks the last highlighted word to avoid redundant scrolls
let lastPlayedKey = null;

// Stores the active blob URL so it can be revoked to prevent memory leaks
let lastBlobUrl = null;

// Incrementing token to invalidate outdated async audio requests
let activeAudioRequestId = 0;

// Cached timestamp data to avoid repeated fetches during playback
let cachedTimestampData = null;

// Cache word counts per verse to avoid repeated reads in hot loops
let wordsInVerseCache = {};

// Prevents overlapping executions of the wordHighlighter handler
let isHighlighting = false;

// Receives the shared <audio> node from AudioPlayer.svelte on mount, so the rest of this
// module can drive playback without querying the DOM for #player.
export function registerAudioElement(element) {
	audio = element;
}

// Shared loader for verse and word playback: fetches (or pulls from cache) the audio at
// `url`, swaps it into the shared element, and starts playback. Callers always run
// resetAudioSettings() first (which detaches + revokes the previous blob), so there is no
// stale src to collide with. Returns false when the request is aborted (offline/uncached) or
// superseded by a newer one, so the caller can bail before touching playback state.
async function loadAndPlay(url) {
	const requestId = ++activeAudioRequestId;
	const audioUrl = await getAudioUrl(url);

	if (!audioUrl) return false;

	// A newer request superseded this one while awaiting — discard the now-orphan blob
	if (requestId !== activeAudioRequestId) {
		if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
		return false;
	}

	// Track the blob so resetAudioSettings can revoke it once this verse/word is done
	lastBlobUrl = audioUrl.startsWith('blob:') ? audioUrl : null;

	audio.src = audioUrl;
	audio.currentTime = 0;
	audio.load();
	audio.playbackRate = selectablePlaybackSpeeds[get(__playbackSpeed)].speed;
	audio.play();
	return true;
}

// Function to play verse audio, either one time or multiple times
export async function playVerseAudio(props) {
	const audioSettings = get(__audioSettings);
	const [playChapter, playVerse] = props.key.split(':').map(Number);
	let playBoth = false;

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

	// Prefetch next verse audio in the background so it's ready when needed
	if (playVerse < quranMetaData[playChapter].verses) {
		getAudioUrl(`${reciterAudioUrl}/${nextVerseFileName}`, false);
	}

	// Load + start; bail if offline/uncached or superseded by a newer request
	if (!(await loadAndPlay(`${reciterAudioUrl}/${currentVerseFileName}`))) return;

	audioSettings.playingKey = props.key;
	audioSettings.audioType = 'verse';
	__playback.set('playing');

	// Attach word highlighting function for supported reciters
	if (props.language === 'arabic' && reciter.wbw) {
		await fetchTimestampData();
		wordsInVerseCache[props.key] = getWordsInVerse(props.key);
		audio.addEventListener('timeupdate', wordHighlighter);
	}

	// Scroll to the playing verse
	if (!reciter.wbw || (get(__displayType) === 7 && !get(__verseWordBlocks)[audioSettings.playingKey])) {
		scrollElementIntoView(audioSettings.playingKey);
	}

	// Use a named handler instead of audio.onended so it can be explicitly removed
	// after firing, preventing handlers from stacking up across repeated plays
	const onEndedHandler = async function () {
		// Remove both listeners immediately to prevent any chance of double-firing
		audio.removeEventListener('ended', onEndedHandler);
		audio.removeEventListener('timeupdate', wordHighlighter);

		const previousLanguage = props.language;

		// Calculate the delay between verses based on the user's audioDelay setting.
		// Audio length delay options wait for as long as the recitation would take at the chosen speed
		const delayOption = selectableAudioDelays[audioSettings.audioDelay];
		const audioLengthSpeed = delayOption?.audioLengthSpeed;
		const calculatedDelay = audioLengthSpeed ? ((audio.duration || 0) * 1000) / audioLengthSpeed : delayOption?.milliseconds || 0;

		// With audio length delay the verse is replayed silently
		// words lighting up guide the reader
		const assistedHighlightsEnabled = audioLengthSpeed && audioSettings.assistedHighlightsDuringDelay && reciter.wbw && props.language === 'arabic';

		// If playing both languages, immediately follow Arabic with the translation
		// before applying any delay or advancing to the next verse
		if (playBoth && previousLanguage === 'arabic') {
			return playVerseAudio({
				key: `${props.key}`,
				timesToRepeat: +props.timesToRepeat,
				language: 'translation'
			});
		}

		// Wait for the configured delay before moving to the next verse
		if (assistedHighlightsEnabled) {
			await playAssistedHighlights(audioLengthSpeed, requestId);

			// A stop or a newer request during the silent replay cancels the rest of the queue
			if (requestId !== activeAudioRequestId) return;
		} else if (calculatedDelay > 0) {
			await new Promise((resolve) => setTimeout(resolve, calculatedDelay));
		}

		// If there are more verses queued, remove the one that just finished
		// and immediately start playing the next one in the list
		if (window.versesToPlayArray?.length > 0) {
			const index = window.versesToPlayArray.indexOf(audioSettings.playingKey);
			if (index > -1) window.versesToPlayArray.splice(index, 1);

			if (window.versesToPlayArray.length > 0) {
				return playVerseAudio({
					key: `${window.versesToPlayArray[0]}`,
					timesToRepeat: +props.timesToRepeat,
					language: audioSettings.language
				});
			}
		}

		// No more verses to play — reset everything back to the default state
		resetAudioSettings({ location: 'end' });
	};

	audio.addEventListener('ended', onEndedHandler);

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

	// Try prefetching next audio file only if there are more words in the verse
	try {
		if (wordNumber < getWordsInVerse(`${wordChapter}:${wordVerse}`)) {
			getAudioUrl(`${wordsAudioURL}/${nextWordFileName}?version=2`, false);
		}
	} catch (error) {
		console.warn(error);
	}

	// Load + start; bail if offline/uncached or superseded by a newer request
	if (!(await loadAndPlay(`${wordsAudioURL}/${currentWordFileName}?version=2`))) return;

	audioSettings.audioType = 'word';
	audioSettings.playingKey = `${wordChapter}:${wordVerse}`;
	audioSettings.playingWordKey = `${props.key}`;
	__playback.set('playing');

	// For debugging purposes, needs not be removed
	console.log('playing word', '-', audioSettings.playingWordKey);

	// Use a named handler instead of audio.onended so it can be explicitly removed
	// after firing, preventing handlers from stacking up across repeated plays
	const onEndedHandler = function () {
		// Remove the listener immediately to prevent any chance of double-firing
		audio.removeEventListener('ended', onEndedHandler);

		// If playAllWords is enabled and there are still more words left in this
		// verse, automatically advance to and play the next word
		if (props.playAllWords && wordNumber < getWordsInVerse(audioSettings.playingKey)) {
			return playWordAudio({ key: `${wordChapter}:${wordVerse}:${wordNumber + 1}`, playAllWords: true });
		}

		// No more words to play — reset everything back to the default state
		// and restore the audio type that was active before word playback started
		resetAudioSettings({ location: 'end' });
		audioSettings.audioType = currentAudioType;
	};

	audio.addEventListener('ended', onEndedHandler);

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

		// Stop playback and reset position
		audio.pause();
		audio.currentTime = 0;
		audioSettings.playingWordKey = null;
		__playback.set('idle');

		// If reset was triggered at the end of a playlist, clear the verses queue
		if (props?.location === 'end') {
			window.versesToPlayArray = [];
		}

		// Invalidate any in-flight audio requests so they get discarded when they resolve
		activeAudioRequestId++;

		// Detach the blob from the element BEFORE revoking it, so the element is never left
		// pointing at a revoked URL — that dangling reference is what logged ERR_FILE_NOT_FOUND
		// when advancing or stopping mid-playback.
		if (lastBlobUrl) {
			audio.removeAttribute('src');
			audio.load();
			URL.revokeObjectURL(lastBlobUrl);
			lastBlobUrl = null;
		}

		// Persist the updated audio state
		__audioSettings.set(audioSettings);

		// Stop word highlighting and clear any active highlights
		audio.removeEventListener('timeupdate', wordHighlighter);
		document.querySelectorAll('.word').forEach((element) => {
			element.classList.remove('bg-black/5');
		});

		// Clear cached word counts to prevent stale data between playback sessions
		wordsInVerseCache = {};
	} catch (error) {
		console.warn(error);
	}
}

// Pause WITHOUT tearing anything down — keeps src, currentTime, the queue, the blob, and
// the ended/timeupdate listeners intact, so resuming continues seamlessly. Internal: the UI
// goes through togglePlayPause().
function pause() {
	if (!audio) return;
	audio.pause();
	__playback.set('paused');
}

// Resume from the exact paused position — no refetch or seek, the element still holds the
// decoded audio. play() is imperative so we can catch the autoplay/abort rejection.
function resume() {
	if (!audio) return;
	audio.play().catch((error) => console.warn(error));
	__playback.set('playing');
}

// Toggle pause/resume for the current session. Does nothing when idle — starting a fresh
// session (building the queue) is the caller's responsibility.
export function togglePlayPause() {
	const status = get(__playback);
	if (status === 'playing') pause();
	else if (status === 'paused') resume();
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
	const chapter = +props.key.split(':')[0];
	const verse = +props.key.split(':')[1];

	if (get(__playback) !== 'idle' && audioSettings.audioType === 'verse' && reciter.wbw) {
		const timestampData = await fetchTimestampData();
		const verseTimestamp = timestampData.data[chapter][verse][reciter.id];
		const wordTimestamp = verseTimestamp.split('|')[props.key.split(':')[2]];

		return (audio.currentTime = wordTimestamp);
	}

	props.type === 'end' ? showAudioModal(`${chapter}:${verse}`) : playWordAudio({ key: props.key });
}

// Replay the verse that just finished with the audio muted
// So word highlight plays at the delay's speed 
async function playAssistedHighlights(speed, requestId) {
	const originalPlaybackRate = audio.playbackRate;

	try {
		const audioSettings = get(__audioSettings);
		audioSettings.playingWordKey = null;
		__audioSettings.set(audioSettings);

		audio.muted = true;
		audio.currentTime = 0;
		audio.playbackRate = speed;
		audio.addEventListener('timeupdate', wordHighlighter);
		await audio.play();

		// Resolve on pause as well as ended, otherwise stopping mid-replay would leave
		// this promise hanging and the player muted
		await new Promise((resolve) => {
			if (audio.paused || audio.ended) return resolve();

			const onDone = () => {
				audio.removeEventListener('ended', onDone);
				audio.removeEventListener('pause', onDone);
				resolve();
			};

			audio.addEventListener('ended', onDone);
			audio.addEventListener('pause', onDone);
		});
	} catch (error) {
		console.warn(error);
	} finally {
		audio.removeEventListener('timeupdate', wordHighlighter);
		audio.muted = false;
		audio.playbackRate = originalPlaybackRate;

		// Leave no word highlighted going into the next verse
		if (requestId === activeAudioRequestId) {
			const settings = get(__audioSettings);
			settings.playingWordKey = null;
			__audioSettings.set(settings);
		}
	}
}

// Highlight the currently playing word during verse audio playback.
async function wordHighlighter() {
	if (isHighlighting) return;
	isHighlighting = true;

	const audioSettings = get(__audioSettings);

	try {
		// Get word count and timestamp data for the currently playing verse
		const wordsInVerse = getWordsInVerse(audioSettings.playingKey);
		const [chapter, verse] = audioSettings.playingKey.split(':').map(Number);
		const reciterId = selectableReciters[get(__reciter)].id;

		// cachedTimestampData is pre-populated in playVerseAudio before this
		// listener is attached, so no async fetch is needed here
		const verseTimestamp = cachedTimestampData.data[chapter][verse][reciterId];
		const timestamps = verseTimestamp.split('|');

		// Walk through each word and update playingWordKey to the latest word
		// whose timestamp has been passed by the current audio position
		for (let word = 0; word < wordsInVerse; word++) {
			if (timestamps[word] < audio.currentTime) {
				audioSettings.playingWordKey = `${audioSettings.playingKey}:${word + 1}`;
			}
		}

		__audioSettings.set(audioSettings);

		// Scroll the newly active word into view if auto-scroll is on and the word has changed
		if (audioSettings.wbwAutoScrollEnabled && audioSettings.playingWordKey && lastPlayedKey !== audioSettings.playingWordKey) {
			scrollElementIntoView(audioSettings.playingWordKey);
			lastPlayedKey = audioSettings.playingWordKey;
		}
	} catch (error) {
		console.warn(error);
	} finally {
		// Always release the guard so the next timeupdate event can run
		isHighlighting = false;
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

// Starts audio playback for a verse or word, depending on the user's audio type setting.
// Called by the verse play button and the play button in the audio modal.
export function playButtonHandler(key = null) {
	const { audioType, timesToRepeat, language } = get(__audioSettings);

	// Play from the first verse in the queue
	if (audioType === 'verse') {
		playVerseAudio({
			key: `${window.versesToPlayArray[0]}`,
			timesToRepeat,
			language
		});
	}

	// Play all words starting from word 1 of the given key
	else if (audioType === 'word') {
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
	const isSpecialPage = ['supplications', 'bookmarks', 'juz', 'hizb'].includes(get(__currentPage));

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

// Fetch timestamps for word by word highlighting
async function fetchTimestampData() {
	if (cachedTimestampData) return cachedTimestampData;
	cachedTimestampData = await fetchAndCacheJson(`${staticEndpoint}/timestamps/timestamps.json?version=2`, 'other');
	return cachedTimestampData;
}

// Fetch audio and cache it in the Cache API.
// returnBlob=true  → cache + return a Blob URL for immediate playback
// returnBlob=false → cache only, no Blob URL returned (used for prefetching)
async function getAudioUrl(url, returnBlob = true) {
	try {
		const cache = await caches.open('quranwbw-audio-cache');

		let response = await cache.match(url);

		// If not cached, fetch from network and store for future use
		if (!response) {
			// Guard against fetching while offline — shows an alert to the user if offline
			if (!(await checkOnlineAndAlert())) return;

			console.log('[AudioCache] Fetching:', url);
			response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch audio: ${response.status}`);
			}

			// Clone before caching since response body can only be consumed once
			await cache.put(url, response.clone());
		} else {
			console.log('[AudioCache] Using cached:', url);
		}

		// Prefetch calls stop here — no need to create a Blob URL
		if (!returnBlob) return;

		// Convert response to a Blob URL so the audio element can play it
		const blob = await response.blob();
		return URL.createObjectURL(blob);
	} catch (error) {
		// Fall back to the raw URL if anything goes wrong
		console.warn('[AudioCache] Error:', error);
		return url;
	}
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
