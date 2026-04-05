<script>
	export let key;

	import { __currentPage } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';

	const [chapter, verse] = key.split(':').map(Number);
	const isLastVerse = verse === quranMetaData[chapter]?.verses;
</script>

<!-- Show the bottom border in all cases except when on a division page and it is the last verse -->
{#if !(['juz', 'hizb'].includes($__currentPage) && isLastVerse)}
	<div class="border-b {window.theme('border')}"></div>
{/if}
