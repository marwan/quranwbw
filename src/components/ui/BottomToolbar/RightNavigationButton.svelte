<script>
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import ChevronRight from '$svgs/ChevronRight.svelte';
	import { __chapterNumber, __currentPage, __pageNumber } from '$utils/stores';
	import { disabledClasses } from '$data/commonClasses';
	import { term } from '$utils/terminologies';

	let linkHref;
	let linkText;
	let linkDisabled;

	$: {
		if ($__currentPage === 'chapter') {
			// Set properties for next chapter navigation (left to right)
			linkHref = $__chapterNumber + 1;
			linkText = `Next ${term('chapter')}`;
			linkDisabled = $__chapterNumber === 114;
		} else if ($__currentPage === 'mushaf') {
			// Set properties for previous page navigation (right to left)
			linkHref = `page?id=${$__pageNumber - 1}`;
			linkText = 'Previous Page';
			linkDisabled = $__pageNumber === 1;
		}
	}
</script>

<!-- next chapter / previous page -->
<a href="/{linkHref}" class="inline-flex flex-col items-center justify-center px-5 rounded-e-full group {window.theme('hover')} {linkDisabled ? disabledClasses : 'opacity-100'}">
	<ChevronRight size={7} />
	<span class="sr-only">{linkText}</span>
</a>
<Tooltip arrow={false} type="light" class="w-max hidden md:block font-normal">{linkText}</Tooltip>
