<script>
	export let key;

	import { __currentPage, __displayType } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';

	const [chapter, verse] = key.split(':').map(Number);
	const isLastVerse = verse === quranMetaData[chapter]?.verses;
</script>

<!-- Show the bottom border in all cases except when on the 'juz' page AND it is the last verse -->
{#if !($__currentPage === 'juz' && isLastVerse)}
	<div class="border-b {window.theme('border')}"></div>
{/if}
