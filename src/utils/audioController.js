import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { quranMetaData } from '$data/quranMeta';
import { __reciter, __translationReciter, __playbackSpeed, __audioSettings, __audioModalVisible, __currentPage, __chapterNumber, __pageNumber, __keysToFetch, __displayType, __verseWordBlocks } from '$utils/stores';
import { staticEndpoint, wordsAudioURL } from '$data/websiteSettings';
import { selectableReciters, selectableTranslationReciters, selectablePlaybackSpeeds, selectableAudioDelays } from '$data/options';
import { fetchAndCacheJson } from '$utils/fetchData';
import { getSegmentKeys } from '$utils/getSegmentKeys';
import { checkOnlineAndAlert } from '$utils/offlineModeHandler';
import { updateSettings } from '$utils/updateSettings';

// <audio> element used for all verse and word playback.
// NOTE: do not read this directly — always go through getAudioElement(),
// because this module can be evaluated before #player exists in the DOM.
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

// True while waiting between two verses (delay, silent assisted replay or page change)
let inGap = false;

// Promise resolvers waiting for resume, used to hold the queue while paused
let resumeWaiters = [];

// Playback state saved while the audio modal is open, so cancelling the modal can restore it
let modalSnapshot = null;

// The audio type the user chose (verse or word), kept aside while word audio temporarily sets it to 'word'
let savedAudioType = null;

// 'ended' handler of the audio that is currently loaded, so a reset can detach it
// and an interrupted playback can never fire later on top of a newer one
let activeEndedHandler = null;

// The audio error listener only needs to be attached once
let errorListenerAttached = false;

// True when the queue covers a whole Mushaf page, so playback may carry on to the next page
let continueToNextPage = false;

// Invalidates a pending Mushaf page change when the user starts something else meanwhile
let pageTurnId = 0;

// BUGFIX: lazily resolve (and cache) the <audio> element instead of relying on the
// module-load-time query. Previously only pauseAudio/resumeAudio/resetAudioSettings
// rechecked for a null audio, so if #player wasn't mounted yet when this module
// first ran, playVerseAudio/playWordAudio/attachErrorListener/wordAudioController
// would keep failing (or the error listener would simply never get attached).
function getAudioElement() {
        if (!audio || !audio.isConnected) audio = document.querySelector('#player');
        return audio;
}

// Save the current verse and position so playing the same verse again can continue from there
function saveAudioResumePosition() {
        const player = getAudioElement();
        const settings = get(__audioSettings);

        if (!player || settings.audioType !== 'verse' || !settings.playingKey || player.ended || !Number.isFinite(player.currentTime)) {
                return;
        }

        // Write onto the shared settings object instead of a copy. Callers such as
        // resetAudioSettings() and playVerseAudio() hold a reference to it and call
        // __audioSettings.set() later, which would otherwise overwrite the saved position.
        const updatedSettings = Object.assign(settings, {
                resumeKey: settings.playingKey,
                resumeTime: player.currentTime
        });

        updateSettings({
                type: 'audioSettings',
                value: updatedSettings
        });
}

// Forget the saved position once that verse has finished, so it starts from the beginning next time
function clearAudioResumePosition(key) {
        const settings = get(__audioSettings);

        if (settings.resumeKey !== key) return;

        updateSettings({
                type: 'audioSettings',
                value: {
                        ...settings,
                        resumeKey: null,
                        resumeTime: 0
                }
        });
}

// Function to play verse audio, either one time or multiple times
export async function playVerseAudio(props) {
        audio = getAudioElement();

        const audioSettings = get(__audioSettings);
        const [playChapter, playVerse] = props.key.split(':').map(Number);
        let playBoth = false;

        // A new playback cancels any Mushaf page change that is still pending
        pageTurnId++;

        // Verse played outside of a prepared queue can't continue onto another page
        if (!window.versesToPlayArray?.includes(props.key)) continueToNextPage = false;

        // A word-click jump is a new playback position.
        // Do not save the old verse as the resume position.
        resetAudioSettings({
                preserveResume: !props.startWord
        });
        attachErrorListener();

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

        // Tag this request with a unique ID to detect if a newer request has superseded it
        const requestId = ++activeAudioRequestId;

        // When started by clicking a word, begin the verse from that word instead of from the start
        let startTime = 0;
        if (props.startWord && props.language === 'arabic' && reciter.wbw) {
                const timestampData = await fetchTimestampData();
                const timestamps = timestampData.data[playChapter][playVerse][reciter.id].split('|');
                startTime = Number(timestamps[props.startWord - 1]) || 0;
        }

        const audioUrl = await getAudioUrl(`${reciterAudioUrl}/${currentVerseFileName}`);

        // If URL is missing (e.g. offline + not cached), abort before touching the player state
        if (!audioUrl) return;

        // If a newer audio request was made while we were awaiting, discard this result
        if (requestId !== activeAudioRequestId) {
                // Clean up the blob URL to avoid memory leaks if one was created
                if (audioUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(audioUrl);
                }
                return;
        }

        // Release the previous blob URL from memory before switching to the new one
        if (lastBlobUrl) {
                URL.revokeObjectURL(lastBlobUrl);
        }

        // Track the new blob URL so we can revoke it later when moving to the next verse
        lastBlobUrl = audioUrl?.startsWith('blob:') ? audioUrl : null;

        // Continue from the saved position if this same verse was paused or interrupted earlier
        const savedSettings = get(__audioSettings);

        const shouldResume = !props.startWord && savedSettings.resumeKey === props.key && Number(savedSettings.resumeTime) > 0;

        audio.src = audioUrl;
        audio.load();

        if (shouldResume) {
                audio.addEventListener('loadedmetadata', function resumeFromSavedPosition() {
                        audio.removeEventListener('loadedmetadata', resumeFromSavedPosition);

                        if (requestId === activeAudioRequestId && savedSettings.resumeTime < audio.duration) {
                                audio.currentTime = savedSettings.resumeTime;
                        }
                });
        }

        audio.playbackRate = selectablePlaybackSpeeds[get(__playbackSpeed)].speed;

        // BUGFIX: setting audio.currentTime immediately after load() can be silently
        // ignored in some browsers because metadata isn't available yet (readyState
        // is still HAVE_NOTHING), which made "play from clicked word" sometimes start
        // from 0 instead. load() already resets position to 0, so we only need to act
        // when a specific startTime was requested, and we wait for loadedmetadata first.
        if (startTime) {
                audio.addEventListener('loadedmetadata', function applyStartTime() {
                        audio.removeEventListener('loadedmetadata', applyStartTime);
                        // Bail out if a newer request superseded this one while we waited
                        if (requestId === activeAudioRequestId) audio.currentTime = startTime;
                });
        }

        audio.play().catch((error) => console.warn(error));

        audioSettings.isPlaying = true;
        audioSettings.isPaused = false;
        audioSettings.playingKey = props.key;
        audioSettings.audioType = 'verse';

        // Attach word highlighting function for supported reciters
        if (props.language === 'arabic' && reciter.wbw) {
                await fetchTimestampData();

                // A newer playback started while the timestamps were loading
                if (requestId !== activeAudioRequestId) return;

                // Only cache a real count, a failed lookup returns 0
                const wordCount = getWordsInVerse(props.key);
                if (wordCount) wordsInVerseCache[props.key] = wordCount;

                audio.addEventListener('timeupdate', wordHighlighter);
        }

        // Scroll to the playing verse
        if (!reciter.wbw || (get(__displayType) === 7 && !get(__verseWordBlocks)[audioSettings.playingKey])) {
                scrollElementIntoView(audioSettings.playingKey);
        }

        // In Mushaf, open the verse's page if it is not on screen (e.g. playback carried over from another display type)
        if (get(__currentPage) === 'mushaf') followVerseInMushaf(props.key, requestId);

        // Use a named handler instead of audio.onended so it can be explicitly removed
        // after firing, preventing handlers from stacking up across repeated plays
        const onEndedHandler = async function () {
                // Remove both listeners immediately to prevent any chance of double-firing
                audio.removeEventListener('ended', onEndedHandler);
                audio.removeEventListener('timeupdate', wordHighlighter);
                if (activeEndedHandler === onEndedHandler) activeEndedHandler = null;

                // A newer playback or a reset happened since this verse started, so this handler is out of date
                if (requestId !== activeAudioRequestId) return;

                // The verse finished on its own, so there is nothing left to resume
                clearAudioResumePosition(props.key);

                // The verse finished on its own, so there is nothing left to resume for it
                if (audioSettings.resumeKey === props.key) {
                        audioSettings.resumeKey = null;
                        audioSettings.resumeTime = 0;
                        updateSettings({ type: 'audioSettings', value: audioSettings });
                }

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
                inGap = true;

                if (assistedHighlightsEnabled) {
                        await playAssistedHighlights(audioLengthSpeed, requestId);
                } else if (calculatedDelay > 0) {
                        await new Promise((resolve) => setTimeout(resolve, calculatedDelay));
                }

                // If the user paused during the delay, hold the queue here until resume
                await waitIfPaused();
                inGap = false;

                // A stop or a newer request during the delay cancels the rest of the queue
                if (requestId !== activeAudioRequestId) return;

                // If there are more verses queued, remove the verse that just finished (by its
                // own key, not the possibly-stale audioSettings.playingKey) and immediately
                // start playing the next one in the list
                if (window.versesToPlayArray?.length > 0) {
                        const endedKey = props.key;
                        const queue = window.versesToPlayArray;

                        const index = queue.indexOf(endedKey);
                        if (index > -1) queue.splice(index, 1);

                        if (queue.length > 0) {
                                return playVerseAudio({
                                        key: queue[0],
                                        timesToRepeat: +props.timesToRepeat,
                                        language: audioSettings.language
                                });
                        }
                }

                // Whole Mushaf page finished: carry on with the next page instead of stopping
                if (continueToNextPage && (await playNextMushafPage(props.key))) return;

                // No more verses to play — reset everything back to the default state
                resetAudioSettings({ location: 'end' });
        };

        audio.addEventListener('ended', onEndedHandler);
        activeEndedHandler = onEndedHandler;

        __audioSettings.set(audioSettings);
}

// Function to play word audio
export async function playWordAudio(props) {
        audio = getAudioElement();

        // A new playback cancels any Mushaf page change that is still pending
        pageTurnId++;

        resetAudioSettings();
        attachErrorListener();

        const audioSettings = get(__audioSettings);
        const [wordChapter, wordVerse, wordNumber = 1] = props.key.split(':').map(Number);
        const currentWordFileName = `${wordChapter}/${String(wordChapter).padStart(3, '0')}_${String(wordVerse).padStart(3, '0')}_${String(wordNumber).padStart(3, '0')}.mp3`;
        const nextWordFileName = `${wordChapter}/${String(wordChapter).padStart(3, '0')}_${String(wordVerse).padStart(3, '0')}_${String(wordNumber + 1).padStart(3, '0')}.mp3`;

        // Try prefetching next audio file only if there are more words in the verse
        try {
                if (wordNumber < getWordsInVerse(`${wordChapter}:${wordVerse}`)) {
                        getAudioUrl(`${wordsAudioURL}/${nextWordFileName}?version=2`, false);
                }
        } catch (error) {
                console.warn(error);
        }

        // Tag this request with a unique ID to detect if a newer request has superseded it
        const requestId = ++activeAudioRequestId;
        const audioUrl = await getAudioUrl(`${wordsAudioURL}/${currentWordFileName}?version=2`);

        // If URL is missing (e.g. offline + not cached), abort before touching the player state
        if (!audioUrl) return;

        // If a newer audio request was made while we were awaiting, discard this result
        if (requestId !== activeAudioRequestId) {
                // Clean up the blob URL to avoid memory leaks if one was created
                if (audioUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(audioUrl);
                }
                return;
        }

        // Release the previous blob URL from memory before switching to the new one
        if (lastBlobUrl) {
                URL.revokeObjectURL(lastBlobUrl);
        }

        // Track the new blob URL so we can revoke it later when moving to the next word
        lastBlobUrl = audioUrl?.startsWith('blob:') ? audioUrl : null;

        audio.src = audioUrl;
        audio.currentTime = 0;
        audio.load();
        audio.playbackRate = selectablePlaybackSpeeds[get(__playbackSpeed)].speed;
        audio.play().catch((error) => console.warn(error));

        audioSettings.isPlaying = true;
        audioSettings.isPaused = false;

        // 'word' is only a temporary type while word audio plays. The user's own choice is kept aside
        // and put back by resetAudioSettings, even if the word audio gets interrupted.
        savedAudioType = audioSettings.audioType ?? 'verse';
        audioSettings.audioType = 'word';
        audioSettings.playingKey = `${wordChapter}:${wordVerse}`;
        audioSettings.playingWordKey = `${props.key}`;

        // For debugging purposes, needs not be removed
        console.log('playing word', '-', audioSettings.playingWordKey);

        // Use a named handler instead of audio.onended so it can be explicitly removed
        // after firing, preventing handlers from stacking up across repeated plays
        const onEndedHandler = function () {
                // Remove the listener immediately to prevent any chance of double-firing
                audio.removeEventListener('ended', onEndedHandler);
                if (activeEndedHandler === onEndedHandler) activeEndedHandler = null;

                // If playAllWords is enabled and there are still more words left in this
                // verse, automatically advance to and play the next word
                if (props.playAllWords && wordNumber < getWordsInVerse(audioSettings.playingKey)) {
                        return playWordAudio({ key: `${wordChapter}:${wordVerse}:${wordNumber + 1}`, playAllWords: true });
                }

                // No more words to play — reset everything back to the default state
                // (this also puts the user's audio type back)
                resetAudioSettings({ location: 'end' });
        };

        audio.addEventListener('ended', onEndedHandler);
        activeEndedHandler = onEndedHandler;

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

        // Put back the user's audio type if word audio had switched it to 'word'
        if (savedAudioType !== null) {
                audioSettings.audioType = savedAudioType;
                savedAudioType = null;
        }

        try {
                audio = getAudioElement();

                // Detach the ended handler of the playback being stopped
                if (activeEndedHandler) {
                        audio.removeEventListener('ended', activeEndedHandler);
                        activeEndedHandler = null;
                }

                // Remember the interrupted verse only when resume preservation is enabled.
                // A word-click jump to a different verse passes preserveResume: false so the
                // verse being interrupted is not saved as a place to resume later.
                if (props?.preserveResume !== false && audio && audioSettings.audioType === 'verse' && audioSettings.isPlaying && !audio.ended && audio.currentTime > 0) {
                        saveAudioResumePosition();
                }

                // A new word-click jump must not inherit the previous verse's resume point.
                if (props?.preserveResume === false) {
                        audioSettings.resumeKey = null;
                        audioSettings.resumeTime = 0;
                }

                // Stop playback and reset position
                audio.pause();
                audio.currentTime = 0;
                audioSettings.isPlaying = false;
                audioSettings.isPaused = false;
                audioSettings.playingWordKey = null;

                // Clear pause state and release anything waiting on resume
                // (waiters bail out on their own because the request id changes below)
                inGap = false;
                releaseWaiters();

                // If reset was triggered at the end of a playlist, clear the verses queue
                if (props?.location === 'end') {
                        window.versesToPlayArray = [];
                        continueToNextPage = false;
                }

                // Invalidate any in-flight audio requests so they get discarded when they resolve
                activeAudioRequestId++;

                // Release the current blob URL from memory
                if (lastBlobUrl) {
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

// If the audio fails to load or play, drop the session instead of leaving the buttons stuck on "Pause"
function attachErrorListener() {
        audio = getAudioElement();
        if (errorListenerAttached || !audio) return;

        audio.addEventListener('error', () => {
                console.warn('[Audio] Failed to play', audio.error);
                resetAudioSettings({ location: 'end' });
        });

        errorListenerAttached = true;
}

// Resolves immediately unless paused, otherwise waits until resume or reset
function waitIfPaused() {
        if (!get(__audioSettings).isPaused) return Promise.resolve();
        return new Promise((resolve) => resumeWaiters.push(resolve));
}

// Wake up everything that is waiting for resume
function releaseWaiters() {
        resumeWaiters.forEach((resolve) => resolve());
        resumeWaiters = [];
}

// Pause the current audio and keep its position
export function pauseAudio() {
        audio = getAudioElement();

        const audioSettings = get(__audioSettings);
        if (!audioSettings.isPlaying || audioSettings.isPaused) return;

        // currentTime stays on the audio element, so resume continues from the same spot
        saveAudioResumePosition();
        audio.pause();

        audioSettings.isPaused = true;
        __audioSettings.set(audioSettings);
}

// Continue from the paused position without rebuilding the queue
export async function resumeAudio() {
        audio = getAudioElement();

        const audioSettings = get(__audioSettings);
        if (!audioSettings.isPlaying || !audioSettings.isPaused) return;

        audioSettings.isPaused = false;
        __audioSettings.set(audioSettings);

        // Paused between two verses: no audio to resume, just let the queue move on
        if (inGap) return releaseWaiters();

        try {
                // Bare play(): no src change, no currentTime reset
                await audio.play();
        } catch (error) {
                console.warn(error);
                resetAudioSettings();
        }
}

// One-call toggle for buttons and keyboard shortcuts
export function toggleAudioPause() {
        get(__audioSettings).isPaused ? resumeAudio() : pauseAudio();
}

// Show audio modal with key.
// If something is playing, it is paused (not reset) and continues from the same point
// when the modal is closed without starting anything new.
export function showAudioModal(key) {
        const audioSettings = get(__audioSettings);

        // Word audio (savedAudioType is set) is short, only a verse session is worth keeping
        const isVerseSession = audioSettings.isPlaying && savedAudioType === null;

        if (isVerseSession && !modalSnapshot) {
                modalSnapshot = {
                        requestId: activeAudioRequestId,
                        pausedByModal: !audioSettings.isPaused,
                        queue: [...(window.versesToPlayArray || [])],
                        continueToNextPage,
                        playingKey: audioSettings.playingKey,
                        playingChapter: audioSettings.playingChapter,
                        playingVerse: audioSettings.playingVerse,
                        startVerse: audioSettings.startVerse,
                        endVerse: audioSettings.endVerse
                };

                pauseAudio();
        } else if (!isVerseSession) {
                resetAudioSettings();
        }

        initializeAudioSettings(key);
        fetchTimestampData();
        __audioModalVisible.set(true);
}

// Called when the audio modal closes: bring back the session it interrupted
function restoreAfterModal() {
        if (!modalSnapshot) return;

        const snapshot = modalSnapshot;
        modalSnapshot = null;

        // Playback was started or reset from the modal, so there is nothing to restore
        if (snapshot.requestId !== activeAudioRequestId) return;

        const audioSettings = get(__audioSettings);
        audioSettings.playingKey = snapshot.playingKey;
        audioSettings.playingChapter = snapshot.playingChapter;
        audioSettings.playingVerse = snapshot.playingVerse;
        audioSettings.startVerse = snapshot.startVerse;
        audioSettings.endVerse = snapshot.endVerse;
        __audioSettings.set(audioSettings);

        window.versesToPlayArray = snapshot.queue;
        continueToNextPage = snapshot.continueToNextPage;

        // Only resume if it was the modal that paused it
        if (snapshot.pausedByModal) resumeAudio();
}

// Word audio controller
export async function wordAudioController(props) {
        audio = getAudioElement();

        const audioSettings = get(__audioSettings);
        const reciter = selectableReciters[get(__reciter)];
        const [chapter, verse, wordNumber] = props.key.split(':').map(Number);

        // Check if verse audio is actually playing.
        // This prevents stopped audio from being treated as active verse playback.
        const isActuallyPlaying = audioSettings.isPlaying && !audio.paused && !audio.ended && audioSettings.audioType === 'verse' && reciter.wbw;

        // While verse audio is actively playing, clicking a word jumps to its timestamp.
        if (isActuallyPlaying) {
                const clickedVerseKey = `${chapter}:${verse}`;

                // Word of the currently playing verse
                if (audioSettings.playingKey === clickedVerseKey) {
                        const timestampData = await fetchTimestampData();
                        const timestamps = timestampData.data[chapter][verse][reciter.id].split('|');
                        const wordTimestamp = Number(timestamps[wordNumber - 1]);

                        if (Number.isFinite(wordTimestamp)) {
                                audio.currentTime = wordTimestamp;
                                return;
                        }
                }

                // Word of another verse
                else if (wordNumber) {
                        const queue = [...(window.versesToPlayArray || [])];
                        const clickedIndex = queue.indexOf(clickedVerseKey);

                        if (clickedIndex > -1) {
                                // The clicked verse already exists in the queue.
                                // Continue from the clicked verse and discard earlier items.
                                window.versesToPlayArray = queue.slice(clickedIndex);
                        } else {
                                // The clicked verse is not in the current queue.
                                // Build a continuous sequence from the clicked verse
                                // through the last queued verse in the same chapter.
                                const [clickedChapter, clickedVerse] = clickedVerseKey.split(':').map(Number);

                                const sameChapterVerses = queue
                                        .map((key) => key.split(':').map(Number))
                                        .filter(([chapter]) => chapter === clickedChapter)
                                        .map(([, verse]) => verse);

                                const lastQueuedVerse = sameChapterVerses.length ? Math.max(...sameChapterVerses) : clickedVerse;

                                const newQueue = [];

                                // Include every verse between the clicked verse and the last queued verse.
                                for (let verse = clickedVerse; verse <= lastQueuedVerse; verse++) {
                                        newQueue.push(`${clickedChapter}:${verse}`);
                                }

                                // Preserve queued verses from other chapters.
                                for (const key of queue) {
                                        if (!newQueue.includes(key) && !key.startsWith(`${clickedChapter}:`)) {
                                                newQueue.push(key);
                                        }
                                }

                                window.versesToPlayArray = newQueue;
                        }

                        // Start from the clicked word.
                        // resetAudioSettings() will not preserve the previous resume point.
                        return playVerseAudio({
                                key: clickedVerseKey,
                                startWord: wordNumber,
                                timesToRepeat: audioSettings.timesToRepeat,
                                language: audioSettings.language
                        });
                }
        }

        // When verse audio is not actively playing, play ONLY the clicked word.
        if (props.type === 'end') {
                showAudioModal(`${chapter}:${verse}`);
        } else {
                return playWordAudio({ key: props.key, playAllWords: false });
        }
}

// Replay the verse that just finished with the audio muted
// So word highlight plays at the delay's speed
async function playAssistedHighlights(speed, requestId) {
        audio = getAudioElement();
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
                // whose timestamp has been passed by the current audio position.
                // BUGFIX: explicit Number() conversion — relying on JS's implicit
                // string-to-number coercion in `<` worked, but was fragile if a
                // timestamp entry was ever missing/undefined.
                for (let word = 0; word < wordsInVerse; word++) {
                        if (Number(timestamps[word]) < audio.currentTime) {
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
        continueToNextPage = false;

        // If the verses were provided in an array, just use those
        if (props?.verses) {
                for (const key of props.verses) {
                        window.versesToPlayArray.push(key);
                }
        } else if (props?.allVersesOnPage) {
                if (get(__currentPage) === 'mushaf') {
                        // Whole Mushaf page: playback may carry on to the next page
                        continueToNextPage = true;

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
                        // Play from here to the end of the Mushaf page: playback may carry on to the next page
                        continueToNextPage = true;

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

        // Page-wide play (chapter, juz, hizb, mushaf, bookmarks...) continues from the saved verse
        // if it is on this page. Explicit choices like "play this verse" keep the verse the user picked.
        if (props?.allVersesOnPage) {
                const resumeIndex = window.versesToPlayArray.indexOf(audioSettings.resumeKey);
                if (audioSettings.resumeKey && resumeIndex > 0) {
                        window.versesToPlayArray = window.versesToPlayArray.slice(resumeIndex);
                }
        }

        // Keep the saved verse inside the current playback playlist.
        // Works for chapters, juz, hizb and mushaf.
        const savedResumeKey = audioSettings.resumeKey;

        if (savedResumeKey && window.versesToPlayArray.length > 0) {
                const resumeIndex = window.versesToPlayArray.indexOf(savedResumeKey);

                if (resumeIndex > 0) {
                        window.versesToPlayArray = window.versesToPlayArray.slice(resumeIndex);
                }
        }

        // The "Verse Range" repeat type can only be chosen with the Custom range (the modal hides it otherwise),
        // but the last choice stays saved. Every other range must repeat each verse, so a stale 'repeatRange'
        // from an earlier Custom session can't turn "From Here" into "repeat the whole set once at the end".
        const repeatType = audioSettings.audioRange === 'playRange' ? audioSettings.repeatType : 'repeatVerse';

        // Apply repeat logic at the end for consistency.
        // A repeat sequence is meant to stay where it is, so it never moves on to the next page.
        if (repeatType === 'repeatRange' && audioSettings.timesToRepeat > 1 && get(__audioModalVisible) === true) {
                continueToNextPage = false;

                const originalSet = [...window.versesToPlayArray];
                for (let i = 1; i < audioSettings.timesToRepeat; i++) {
                        window.versesToPlayArray.push(...originalSet);
                }
        }

        if (repeatType === 'repeatVerse' && audioSettings.timesToRepeat > 1 && get(__audioModalVisible) === true) {
                continueToNextPage = false;

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

// Get the total number of words in the verse based on the current mode.
// Falls back to the last known count if the layout changed while audio was playing.
function getWordsInVerse(key) {
        const [chapter, verse] = key.split(':');

        try {
                if (get(__currentPage) === 'mushaf') {
                        const pageData = JSON.parse(localStorage.getItem('pageData'));
                        return Number(pageData[key].meta.words);
                }

                return Number(document.querySelector(`.verse-${chapter}-${verse}`).dataset.words);
        } catch (error) {
                return wordsInVerseCache[key] ?? 0;
        }
}

// Starts audio playback for a verse or word, depending on the user's audio type setting.
// Called by the verse play button and the play button in the audio modal.
export function playButtonHandler(key = null) {
        const audioSettings = get(__audioSettings);
        const { audioType, timesToRepeat, language } = audioSettings;

        // Play from the first verse in the queue
        if (audioType === 'verse') {
                const queue = window.versesToPlayArray || [];

                if (queue.length === 0) return;

                const resumeKey = audioSettings.resumeKey;
                const resumeIndex = queue.indexOf(resumeKey);

                // Start from the saved verse if it is part of the queue, otherwise from the first verse
                const playKey = resumeIndex >= 0 ? queue[resumeIndex] : queue[0];

                if (resumeIndex > 0) {
                        window.versesToPlayArray = queue.slice(resumeIndex);
                }

                playVerseAudio({
                        key: playKey,
                        timesToRepeat,
                        language
                });
        }

        // Play all words starting from word 1 of the given key
        else if (audioType === 'word' && key) {
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

// Current Mushaf page number, read from the URL first
function getMushafPageNumber() {
        const match = window.location.pathname.match(/\/page\/(\d+)/);
        return match ? Number(match[1]) : Number(get(__pageNumber)) || null;
}

// Poll until a condition is true, or give up after the timeout
function waitFor(condition, timeout = 8000, interval = 100) {
        return new Promise((resolve) => {
                const startedAt = Date.now();

                const check = () => {
                        if (condition()) return resolve(true);
                        if (Date.now() - startedAt > timeout) return resolve(false);
                        setTimeout(check, interval);
                };

                check();
        });
}

// Open the next Mushaf page and keep playing from its first verse.
// Returns false when there is nothing to continue with (so the caller ends playback),
// and true when it took over or was cancelled by the user starting something else.
async function playNextMushafPage(lastKey) {
        const currentPage = getMushafPageNumber();

        // Only continue if the verse that just finished belongs to the page being shown
        const lastVerseIsOnScreen = !!document.querySelector(`.word[id^="${lastKey}:"]`);

        if (get(__currentPage) !== 'mushaf' || !currentPage || currentPage >= 604 || !lastVerseIsOnScreen) return false;

        const turnId = ++pageTurnId;
        const previousFirstWordId = document.querySelector('.word')?.id;

        // Treated like the gap between verses, so pause and resume keep working during the page change
        inGap = true;

        try {
                await goto(`/page/${currentPage + 1}`);

                // Wait until the new page's words are on screen
                const pageIsReady = await waitFor(() => {
                        const firstWord = document.querySelector('.word');
                        return get(__currentPage) === 'mushaf' && firstWord && firstWord.id !== previousFirstWordId;
                });

                // Small buffer so the rest of the page finishes rendering
                if (pageIsReady) await new Promise((resolve) => setTimeout(resolve, 150));

                // Hold here if the user paused while the page was loading
                await waitIfPaused();

                // The user started something else meanwhile, leave it alone
                if (turnId !== pageTurnId) return true;

                if (!pageIsReady) return false;

                // Build the queue from the new page
                setVersesToPlay({ allVersesOnPage: true });

                // A verse that started on the previous page has already played in full
                if (window.versesToPlayArray[0] === lastKey) window.versesToPlayArray.shift();

                if (window.versesToPlayArray.length === 0) return false;

                const { timesToRepeat, language } = get(__audioSettings);

                playVerseAudio({
                        key: `${window.versesToPlayArray[0]}`,
                        timesToRepeat,
                        language
                });

                return true;
        } catch (error) {
                console.warn(error);
                return false;
        } finally {
                if (turnId === pageTurnId) inGap = false;
        }
}

// Verse key -> Mushaf page number, built once from the page segment keys
let verseToPageMap = null;

// Timestamp until which a page change is an intentional display change that must not stop the audio
let keepAudioUntil = 0;

// Call right before navigating for a display change while verse audio is playing
export function keepAudioAcrossNavigation() {
        keepAudioUntil = Date.now() + 3000;
}

// Used by the layout: true when the current page change should leave the audio alone
export function shouldKeepAudioOnNavigation() {
        const { isPlaying, audioType } = get(__audioSettings);
        return Date.now() < keepAudioUntil && isPlaying && audioType === 'verse';
}

// Leaving Mushaf: a whole-page queue would stop at the end of that page, because only Mushaf turns pages.
// Make it run from the playing verse to the end of its chapter instead. Ranges and repeats are left alone.
export function prepareQueueForChapterView() {
        const key = get(__audioSettings).playingKey;
        if (!continueToNextPage || !key) return;

        const [chapter, verse] = key.split(':').map(Number);
        const queue = [];

        for (let nextVerse = verse; nextVerse <= quranMetaData[chapter].verses; nextVerse++) {
                queue.push(`${chapter}:${nextVerse}`);
        }

        window.versesToPlayArray = queue;
        continueToNextPage = false;
}

// Find the Mushaf page a verse starts on (null if it can't be found)
export async function getPageOfVerse(key) {
        try {
                if (!verseToPageMap) {
                        const pages = await getSegmentKeys('page');
                        const map = new Map();

                        for (const [page, keys] of Object.entries(pages)) {
                                if (typeof keys !== 'string') continue;

                                for (const verseKey of keys.split(',')) {
                                        // A verse spanning two pages is listed on both, keep the first (its starting page)
                                        if (!map.has(verseKey)) map.set(verseKey, Number(page));
                                }
                        }

                        verseToPageMap = map;
                }

                return verseToPageMap.get(key) ?? null;
        } catch (error) {
                console.warn(error);
                return null;
        }
}

// While in Mushaf, make sure the verse that is starting to play is on screen.
// The queue is left untouched, so ranges and repeats keep working, only the page follows the audio.
async function followVerseInMushaf(key, requestId) {
        try {
                const isOnScreen = () => !!document.querySelector(`.word[id^="${key}:"]`);

                if (isOnScreen()) return;

                const turnId = pageTurnId;
                const targetPage = await getPageOfVerse(key);

                if (!targetPage || targetPage === getMushafPageNumber()) return;

                // A newer playback or page change started while looking the page up
                if (requestId !== activeAudioRequestId || turnId !== pageTurnId) return;

                if (isOnScreen()) return;

                await goto(`/page?id=${targetPage}`);
        } catch (error) {
                console.warn(error);
        }
}

// When the audio modal is closed (cancel, outside click or play), restore or drop the saved session
__audioModalVisible.subscribe((visible) => {
        if (!visible) restoreAfterModal();
});
