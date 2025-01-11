<script>
	import BottomToolbarButtons from '$ui/BottomToolbar/BottomToolbarButtons.svelte';
	import { __currentPage, __bottomToolbarVisible } from '$utils/stores';

	$: toolbarOuterClasses = `print:hidden ${['home', 'chapter', 'mushaf'].includes($__currentPage) ? 'block' : 'hidden'}`;
	$: toolbarInnerClasses = `fixed z-20 w-full h-16 max-w-xs md:max-w-lg shadow-md -translate-x-1/2 rounded-full bottom-4 left-1/2 border ${window.theme('border')} ${window.theme('bgMain')} ${$__bottomToolbarVisible ? 'block' : 'hidden'}`;
</script>

{#if $__currentPage !== 'home'}
	<div id="bottom-toolbar" class={toolbarOuterClasses}>
		<div class={toolbarInnerClasses}>
			<div class="grid h-full max-w-lg grid-cols-5 mx-auto">
				<BottomToolbarButtons />
			</div>
		</div>
	</div>
{/if}
