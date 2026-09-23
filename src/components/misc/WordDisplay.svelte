<script>
	import { playWordAudio } from '$utils/audioController';

	export let word;
	export let wordKey;
</script>

<button
	class="flex max-w-full flex-col space-y-4 md:space-y-6 mx-auto items-center mb-6 md:mb-8 px-3 py-4 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent"
	aria-label={'Listen to ' + (word.word_transliteration || word.word_arabic)}
	on:click={() => playWordAudio({ key: wordKey })}
>
	<span class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl arabic-font-1" lang="ar" dir="rtl">{word.word_arabic}</span>
	<span class="text-sm md:text-base">{word.word_transliteration}</span>
</button>
