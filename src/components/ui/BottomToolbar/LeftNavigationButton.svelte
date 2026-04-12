<script>
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import ChevronLeft from '$svgs/ChevronLeft.svelte';
	import { __chapterNumber, __currentPage, __pageNumber } from '$utils/stores';
	import { disabledClasses } from '$data/commonClasses';
	import { term } from '$utils/terminologies';

	let linkHref;
	let linkText;
	let linkDisabled;

	$: {
		if ($__currentPage === 'chapter') {
			// Set properties for chapter navigation (left to right)
			linkHref = $__chapterNumber - 1;
			linkText = `Previous ${term('chapter')}`;
			linkDisabled = $__chapterNumber === 1;
		} else if ($__currentPage === 'mushaf') {
			// Set properties for mushaf navigation (right to left)
			linkHref = `page?id=${$__pageNumber + 1}`;
			linkText = 'Next Page';
			linkDisabled = $__pageNumber === 604;
		}
	}
</script>

<!-- previous chapter / next page -->
<a href="/{linkHref}" class="inline-flex flex-col items-center justify-center px-5 rounded-s-full group {window.theme('hover')} {linkDisabled ? disabledClasses : 'opacity-100'}">
	<ChevronLeft size={7} />
	<span class="sr-only">{linkText}</span>
</a>
<Tooltip arrow={false} type="light" class="w-max hidden md:block font-normal">{linkText}</Tooltip>
