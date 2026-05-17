<script>
	import PageHead from '$misc/PageHead.svelte';
	import markdown from './ABOUT.md?raw';

	import { __currentPage } from '$utils/stores';
	import { marked } from 'marked';

	// Parse the markdown into HTML
	const html = marked.parse(markdown);

	__currentPage.set('about');

	let description = 'QuranWBW.com is your companion for reading, listening to, and learning the Holy Quran, word by word. With features like word audios, Tajweed colors, and transliteration, you can delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.';
</script>

<PageHead title={'About'} {description} />

<div class="markdown mx-auto">
	{@html html}
</div>
