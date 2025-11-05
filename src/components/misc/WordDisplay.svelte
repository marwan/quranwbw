<script>
	import { playWordAudio } from '$utils/audioController';

	export let word;
	export let wordKey;
</script>

<button
	class="flex flex-col space-y-1 sm:space-y-2 md:space-y-4 mx-auto items-center mb-3 md:mb-8 pt-1 md:pt-4"
	on:click={() => playWordAudio({ key: wordKey })}
>
	<span class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl arabic-font-1">{word.word_arabic}</span>
	<span class="text-sm md:text-base">{word.word_transliteration}</span>
</button>
