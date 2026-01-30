<script>
	export let chapter = 1;

	import { chapterHeaderCodes } from '$data/quranMeta';
	import { chapterHeaderFontLink } from '$data/websiteSettings';
	import { loadFont } from '$utils/loadFont';
	import { __currentPage } from '$utils/stores';

	// Dynamically load header font
	loadFont('chapter-headers', chapterHeaderFontLink).then(() => {
		document.querySelectorAll('.header').forEach((element) => element.classList.remove('invisible'));
	});
</script>

{#if $__currentPage === 'mushaf'}
	<div style="font-family: chapter-headers" class="header invisible leading-base pt-4 md:pt-8 pb-6 text-[28vw] md:text-[195px] lg:text-[195px]">{chapterHeaderCodes[chapter]}</div>
{:else}
	<div style="font-family: chapter-headers; line-height: 0;" class="header invisible leading-tight pt-4 md:pt-8 pb-10 text-[27vw] md:text-[195px] lg:text-[195px] text-center">{chapterHeaderCodes[chapter]}</div>
{/if}
