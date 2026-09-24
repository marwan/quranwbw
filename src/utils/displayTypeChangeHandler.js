import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { __currentPage, __lastRead, __audioSettings } from '$utils/stores';
import { updateSettings } from '$utils/updateSettings';
import { getPageOfVerse, keepAudioAcrossNavigation, prepareQueueForChapterView } from '$utils/audioController';

export function displayTypeChangeHandler(displayId) {
        const nonMushafModes = [1, 2, 3, 4, 5, 7];
        const mushafMode = [6];

        if (nonMushafModes.includes(displayId)) {
                handleNonMushafMode(displayId);
        } else if (mushafMode.includes(displayId)) {
                handleMushafMode();
        }
}

// The verse being played right now, or null when no verse audio is playing (or paused)
function getPlayingVerseKey() {
        const { isPlaying, audioType, playingKey } = get(__audioSettings);
        return isPlaying && audioType === 'verse' && playingKey ? playingKey : null;
}

function handleNonMushafMode(displayId) {
        if (get(__currentPage) === 'mushaf') {
                const playingKey = getPlayingVerseKey();
                let key;

                if (playingKey) {
                        // Leaving Mushaf while verse audio plays: open the playing verse and let the audio carry on
                        key = playingKey;
                        prepareQueueForChapterView();
                        keepAudioAcrossNavigation();
                } else {
                        key = document.querySelector('.word').id;
                }

                const [chapter, verse] = key.split(':');
                goto(`/${chapter}/${verse}`);
        }

        updateSettings({ type: 'displayType', value: displayId });
}

async function handleMushafMode() {
        const playingKey = getPlayingVerseKey();

        let targetPage = get(__lastRead).page;

        // Verse audio is playing (or paused): open the page of that verse so playback stays in view.
        // The queue carries on and the Mushaf follows it page by page.
        if (playingKey) {
                targetPage = (await getPageOfVerse(playingKey)) ?? targetPage;
                keepAudioAcrossNavigation();
        }

        goto(`/page?id=${targetPage}`);
}
