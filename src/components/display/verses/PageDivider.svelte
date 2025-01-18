<script>
	export let key;

	import { pageNumberKeys, juzNumberKeys } from '$data/quranMeta';
	import { __currentPage, __displayType } from '$utils/stores';
	import { selectableDisplays } from '$data/options';
	import { term } from '$utils/terminologies';

	const dividerClasses = `
		flex flex-row justify-center text-center mx-auto w-full mt-8 
		${selectableDisplays[`${$__displayType}`].continuous ? 'mb-4' : 'mb-1'} 
		py-2 px-4 text-sm rounded-full
		${window.theme('hoverBorder')}
		${window.theme('bgSecondaryLight')}
	`;
</script>

<!-- if the current key is the start of a page or juz  -->
{#if $__currentPage === 'chapter'}
	{#if pageNumberKeys.includes(key) || juzNumberKeys.includes(key)}
		<div class={dividerClasses}>
			{#if pageNumberKeys.includes(key)}
				{@const pageIndex = pageNumberKeys.indexOf(key) + 1}
				Page {pageIndex}
			{/if}
			{#if pageNumberKeys.includes(key) && juzNumberKeys.includes(key)}
				<span class="px-1 opacity-70">/</span>
			{/if}
			{#if juzNumberKeys.includes(key)}
				{@const juzIndex = juzNumberKeys.indexOf(key) + 1}
				{term('juz')}
				{juzIndex}
			{/if}
		</div>
	{/if}
{/if}
