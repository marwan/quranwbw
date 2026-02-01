<script>
	import PlaySolid from '$svgs/PlaySolid.svelte';
	import Pause from '$svgs/Pause.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { __audioSettings } from '$utils/stores';
	import { playVerseAudio, setVersesToPlay, resetAudioSettings } from '$utils/audioController';
	import { checkOnlineAndAlert } from '$utils/serviceWorkerHandler';

	// quick play from first verse of page till the max chapter verses
	async function audioHandler() {
		if (!(await checkOnlineAndAlert())) return;

		$__audioSettings.language = 'arabic';
		$__audioSettings.playBoth = false;

		if ($__audioSettings.isPlaying) {
			resetAudioSettings({ location: 'end' });
		} else {
			setVersesToPlay({ allVersesOnPage: true });

			playVerseAudio({
				key: `${window.versesToPlayArray[0]}`,
				timesToRepeat: 1,
				language: 'arabic'
			});
		}
	}
</script>

<!-- play/pause button -->
<div class="flex items-center justify-center">
	<button type="button" title={$__audioSettings.isPlaying ? 'Pause' : 'Play'} on:click={() => audioHandler()} class="inline-flex flex-col items-center justify-center w-12 h-12 rounded-full group {window.theme('input')} {window.theme('bgSecondaryDark')}" data-umami-event="Toolbar Play Button">
		<span><svelte:component this={$__audioSettings.isPlaying ? Pause : PlaySolid} size={5} /></span>
		<span class="sr-only">{$__audioSettings.isPlaying ? 'Pause' : 'Play'}</span>

		<!-- show badge when a verse is playing -->
		{#if $__audioSettings.isPlaying && $__audioSettings.audioType === 'verse'}
			<div class="absolute inline-flex items-center justify-center z-30 text-xs px-2 rounded-3xl -top-3 border {window.theme('bgMain')} {window.theme('border')}">{$__audioSettings.playingKey}</div>
		{/if}
	</button>
</div>
<Tooltip arrow={false} type="light" class="hidden md:block font-normal">{$__audioSettings.isPlaying ? 'Pause' : 'Play'}</Tooltip>
