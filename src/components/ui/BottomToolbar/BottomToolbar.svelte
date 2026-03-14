<script>
	import BottomToolbarButtons from '$ui/BottomToolbar/BottomToolbarButtons.svelte';
	import ChevronLeft from '$svgs/ChevronLeft.svelte';
	import ChevronRight from '$svgs/ChevronRight.svelte';
	import AudioButton from '$ui/BottomToolbar/AudioButton.svelte';
	import { __currentPage, __bottomToolbarVisible, __audioSettings } from '$utils/stores';
	import { playPreviousVerse, playNextVerse } from '$utils/audioController';

	$: toolbarOuterClasses = `print:hidden ${['home', 'chapter', 'mushaf'].includes($__currentPage) ? 'block' : 'hidden'}`;
	$: toolbarInnerClasses = `fixed z-20 w-full h-16 max-w-xs md:max-w-lg shadow-md -translate-x-1/2 rounded-full bottom-4 left-1/2 border ${window.theme('border')} ${window.theme('bgMain')} ${$__bottomToolbarVisible ? 'block' : 'hidden'}`;
</script>

{#if $__currentPage !== 'home'}
	<div id="bottom-toolbar" class={toolbarOuterClasses}>
		<div class={toolbarInnerClasses}>
			{#if $__audioSettings.isPlaying}
				<div class="grid h-full max-w-md grid-cols-3 mx-auto">
					<button on:click={() => playPreviousVerse()} class="inline-flex flex-col items-center justify-center px-5 rounded-e-full group {window.theme('hover')}">
						<ChevronLeft size={7} />
					</button>
					<AudioButton />
					<button on:click={() => playNextVerse()} class="inline-flex flex-col items-center justify-center px-5 rounded-e-full group {window.theme('hover')}">
						<ChevronRight size={7} />
					</button>
				</div>
			{:else}
				<div class="grid h-full max-w-lg grid-cols-5 mx-auto">
					<BottomToolbarButtons />
				</div>
			{/if}
		</div>
	</div>
{/if}
