import { get } from 'svelte/store';
import { quranMetaData } from '$data/quranMeta';
import { __reciter, __translationReciter, __playbackSpeed, __audioSettings, __audioModalVisible, __currentPage, __chapterNumber, __timestampData, __keysToFetch } from '$utils/stores';
import { wordsAudioURL } from '$data/websiteSettings';
import { selectableReciters, selectableTranslationReciters, selectablePlaybackSpeeds } from '$data/options';
import { fetchTimestampData } from '$utils/fetchData';
import { scrollSmoothly } from '$utils/scrollSmoothly';

// Getting the audio element
let audio = document.querySelector('#player');

// Function to play verse audio, either one time, or multiple times
export async function playVerseAudio(props) {
	const audioSettings = get(__audioSettings);
	const [playChapter, playVerse] = props.key.split(':').map(Number);
	let playBoth = false;

	// Reset audio settings and fetch timestamp data for wbw highlighting
	resetAudioSettings();
	await fetchTimestampData(playChapter);

	// Defaulting the language to Arabic
	if (props.language === undefined) props.language = 'arabic';

	// If the user has opted to play both languages:
	// set current play language to Arabic and playBoth to true, so it can be used when the current audio has ended
	if (props.language === 'both') {
		props.language = 'arabic';
		playBoth = true;
	}

	// For debugging purposes, needs not be removed
	console.log('playing', '-', props.key, '-', props.language);

	const verseReciterKey = Object.keys(selectableReciters).find((item) => selectableReciters[item].id === get(__reciter));
	const reciterAudioUrl = props.language === 'arabic' ? selectableReciters[verseReciterKey].url : selectableTranslationReciters[get(__translationReciter)].url;
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

	// Attach word highlighting function for supported reciters
	if (props.language === 'arabic' && selectableReciters[verseReciterKey].timestampSlug) {
		audio.addEventListener('timeupdate', wordHighlighter);
	}

	// Scroll to the playing verse
	try {
		scrollSmoothly(document.getElementById(`${audioSettings.playingKey}`).offsetTop - 75, 500);
	} catch (error) {
		// ...
	}

	audio.onended = async function () {
		audio.removeEventListener('timeupdate', wordHighlighter);
		const previousLanguage = props.language;

		if (playBoth && previousLanguage === 'arabic') {
			return playVerseAudio({ key: `${props.key}`, timesToRepeat: +props.timesToRepeat, language: 'translation' });
		}

		if (audioSettings.timesRepeated <= audioSettings.timesToRepeat - 2) {
			console.log('repeating verse: ', `${props.key}`);
			audioSettings.timesRepeated++;
			return playVerseAudio({ key: `${props.key}`, timesToRepeat: +props.timesToRepeat, language: 'arabic' });
		}

		audioSettings.timesRepeated = 0;

		if (window.versesToPlayArray?.length > 0) {
			const index = window.versesToPlayArray.indexOf(audioSettings.playingKey);
			if (index > -1) window.versesToPlayArray.splice(index, 1);

			if (window.versesToPlayArray.length > 0) {
				return playVerseAudio({ key: `${window.versesToPlayArray[0]}`, timesToRepeat: +props.timesToRepeat, language: audioSettings.language });
			}
		}

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

// Function to update audio settings
export function updateAudioSettings(event) {
	const audioSettings = get(__audioSettings);
	const { id, value, valueAsNumber } = event.target;

	try {
		switch (id) {
			case 'startVerse':
				audioSettings.startVerse = +value;
				break;
			case 'endVerse':
				audioSettings.endVerse = +value;
				break;
			case 'timesToRepeat':
				audioSettings.timesToRepeat = valueAsNumber;
				break;
		}
	} catch (error) {
		console.error(error);
	}

	if (audioSettings.endVerse < audioSettings.startVerse || audioSettings.endVerse === undefined) {
		audioSettings.endVerse = audioSettings.startVerse;
	}

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
			audioSettings.timesRepeated = 0;
			window.versesToPlayArray = [];
		}

		__audioSettings.set(audioSettings);
		audio.removeEventListener('timeupdate', wordHighlighter);

		document.querySelectorAll('.word').forEach((element) => {
			element.classList.remove('bg-black/5');
		});
	} catch (error) {
		console.log(error);
	}
}

// Show audio modal with key
export function showAudioModal(key) {
	resetAudioSettings();
	initializeAudioSettings(key);
	__audioModalVisible.set(true);
}

// Word audio controller
export function wordAudioController(props) {
	const audioSettings = get(__audioSettings);
	const verseReciterKey = Object.keys(selectableReciters).find((item) => selectableReciters[item].id === get(__reciter));
	const timestampSlug = selectableReciters[verseReciterKey].timestampSlug;

	if (audioSettings.isPlaying && audioSettings.audioType === 'verse' && timestampSlug) {
		const verseTimestamp = get(__timestampData).data[`${props.chapter}:${props.verse}`][timestampSlug];
		const wordTimestamp = verseTimestamp.split('|')[props.key.split(':')[2]];

		return (audio.currentTime = wordTimestamp);
	}

	props.type === 'end' ? showAudioModal(`${props.chapter}:${props.verse}`) : playWordAudio({ key: props.key });
}

// Highlight words during audio playback based on timestamps
function wordHighlighter() {
	const audioSettings = get(__audioSettings);

	try {
		// Get the total number of words in the verse
		const wordsInVerse = getWordsInVerse(audioSettings.playingKey);

		// Retrieve verse timestamp data fetched in playVerseAudio function
		const verseReciterKey = Object.keys(selectableReciters).find((item) => selectableReciters[item].id === get(__reciter));
		const timestampSlug = selectableReciters[verseReciterKey].timestampSlug;
		const verseTimestamp = get(__timestampData).data[audioSettings.playingKey][timestampSlug];

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
	} catch (error) {
		// Error handling
		console.error('wordHighlighter error:', error);
	}
}

// Generate an array of verses to play
export function setVersesToPlay(props) {
	window.versesToPlayArray = [];

	// If the verses were provided in an array, just use those
	if (props?.verses) {
		for (const key of props.verses) {
			window.versesToPlayArray.push(key);
		}
	}

	// Handle play action based on the current page and options
	else if (props?.allVersesOnPage) {
		if (get(__currentPage) === 'mushaf') {
			// For mushaf page
			const wordsOnPage = document.getElementsByClassName('word');
			for (const wordElement of wordsOnPage) {
				const verseKey = `${wordElement.id.split(':')[0]}:${wordElement.id.split(':')[1]}`;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}
		} else if (get(__currentPage) === 'chapter') {
			// For chapter page
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
			// For other pages (supplications, bookmarks)
			const versesOnPage = document.getElementsByClassName('verse');
			for (const verseElement of versesOnPage) {
				const verseKey = verseElement.id;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}
		}
	} else {
		// Handle play action from verse options/modal
		if (get(__currentPage) === 'mushaf' && props.audioRange === 'playFromHere') {
			// For playFromHere, non-chapter page
			const key = `${props.chapter}:${props.startVerse}`;
			const wordsOnPage = document.getElementsByClassName('word');

			for (const wordElement of wordsOnPage) {
				const verseKey = `${wordElement.id.split(':')[0]}:${wordElement.id.split(':')[1]}`;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}

			// Remove all verses before the specified key
			const startIndex = window.versesToPlayArray.indexOf(key);
			window.versesToPlayArray = window.versesToPlayArray.slice(startIndex);
		} else {
			// For chapter page, supplications, bookmarks
			for (let verse = props.startVerse; verse <= props.endVerse; verse++) {
				const verseKey = `${props.chapter}:${verse}`;
				if (!window.versesToPlayArray.includes(verseKey)) {
					window.versesToPlayArray.push(verseKey);
				}
			}
		}
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
	// Split the key into chapter and verse
	const [chapter, verse] = key.split(':');
	// Destructure audio settings
	const { audioRange, startVerse } = get(__audioSettings);
	// Get the total number of verses in the chapter
	const versesInChapter = quranMetaData[chapter].verses;
	// Check if the current page is a special one (supplications, bookmarks, juz)
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

	// Main switch statement to handle different audio ranges
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
			setVersesToPlay({ location: 'verseOptionsOrModal', chapter, startVerse, endVerse: versesInChapter });
			break;
		default:
			// Handle invalid audioRange values
			console.error('Invalid audioRange:', audioRange);
	}
}
