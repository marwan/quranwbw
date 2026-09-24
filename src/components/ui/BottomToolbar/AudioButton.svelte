<script>
        import PlaySolid from '$svgs/PlaySolid.svelte';
        import PauseSolid from '$svgs/PauseSolid.svelte';
        import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
        import { playButtonHandler, setVersesToPlay, toggleAudioPause } from '$utils/audioController';
        import { __currentPage, __audioSettings, __fullVersesDisplayKeys } from '$utils/stores';
        import { checkOnlineAndAlert } from '$utils/offlineModeHandler';

        // Pause icon only while audio is actually playing; idle and paused both show Play
        $: isActivelyPlaying = $__audioSettings.isPlaying && !$__audioSettings.isPaused;
        $: buttonLabel = !$__audioSettings.isPlaying ? 'Play' : $__audioSettings.isPaused ? 'Resume' : 'Pause';

        // Idle: start from the first verse on the page. Playing: pause. Paused: resume.
        async function audioHandler() {
                // Pause/resume works on audio that is already loaded, so no online check is needed
                if ($__audioSettings.isPlaying) return toggleAudioPause();

                if (!(await checkOnlineAndAlert())) return;

                // For juz/hizb pages, restrict playback to verses within that section
                if (['juz', 'hizb'].includes($__currentPage)) {
                        const allKeys = $__fullVersesDisplayKeys.split(',');

                        // Same behaviour as chapters: start from the first verse that is actually on screen
                        // (e.g. the last read verse), not from the very beginning of the juz/hizb.
                        const firstRenderedKey = document.getElementsByClassName('verse')[0]?.id;
                        const startIndex = firstRenderedKey ? allKeys.indexOf(firstRenderedKey) : -1;

                        setVersesToPlay({ verses: startIndex > 0 ? allKeys.slice(startIndex) : allKeys });
                }
                // For all other pages, play every verse visible on the page
                else {
                        setVersesToPlay({ allVersesOnPage: true });
                }

                // Begin playback from the first verse (verse or word mode, per user settings)
                playButtonHandler(window.versesToPlayArray[0]);
        }
</script>

<!-- play/pause/resume button -->
<div class="flex items-center justify-center">
        <button type="button" title={buttonLabel} on:click={() => audioHandler()} class="inline-flex flex-col items-center justify-center w-12 h-12 rounded-full group focus:border-theme-accent focus:ring-theme-accent bg-theme-accent/15" data-umami-event="Toolbar Play Button">
                <span><svelte:component this={isActivelyPlaying ? PauseSolid : PlaySolid} size={5} /></span>
                <span class="sr-only">{buttonLabel}</span>

                <!-- show badge when a verse is playing or paused -->
                {#if $__audioSettings.isPlaying && $__audioSettings.audioType === 'verse'}
                        <div class="absolute inline-flex items-center justify-center z-30 text-xs px-2 rounded-3xl -top-3 border bg-theme-bg border-theme-accent/20">{$__audioSettings.playingKey}</div>
                {/if}
        </button>
</div>
<Tooltip arrow={false} type="light" class="hidden md:block font-normal">{buttonLabel}</Tooltip>
