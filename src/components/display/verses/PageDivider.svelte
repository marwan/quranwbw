<script>
	export let key;

	import { pageNumberKeys, juzNumberKeys } from '$data/quranMeta';
	import { hizbNumberKeys } from '$data/hizbMeta';
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

	$: dividerItems = [];

	$: if (['chapter', 'juz', 'hizb'].includes($__currentPage)) {
		const items = [];
		const pageIndex = pageNumberKeys.indexOf(key);
		const juzIndex = juzNumberKeys.indexOf(key);
		const hizbIndex = hizbNumberKeys.indexOf(key);

		if (pageIndex > -1) items.push(`Page ${pageIndex + 1}`);
		if (juzIndex > -1) items.push(`${term('juz')} ${juzIndex + 1}`);
		if (hizbIndex > -1) items.push(`${term('hizb')} ${hizbIndex + 1}`);

		dividerItems = items;
	} else {
		dividerItems = [];
	}
</script>

<!-- if the current key is the start of a page, juz, or hizb -->
{#if dividerItems.length > 0}
	<div class={dividerClasses}>
		{#each dividerItems as item, index}
			<span>{item}</span>
			{#if index < dividerItems.length - 1}
				<span class="px-1 opacity-30">&#8226;</span>
			{/if}
		{/each}
	</div>
{/if}
