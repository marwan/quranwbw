<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { __tajweedRulesModalVisible, __currentPage, __chapterNumber } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { staticEndpoint, cdnStaticDataUrls } from '$data/websiteSettings';
	import { linkClasses } from '$data/commonClasses';
	import { createLink } from '$utils/createLink';
	import { fetchAndCacheJson } from '$utils/fetchData';

	const modalTitle = `${term('tajweed')} Rules`;
	let tajweedRulesData;

	$: if ($__currentPage || $__chapterNumber) __tajweedRulesModalVisible.set(false);

	$: {
		if ($__tajweedRulesModalVisible) {
			tajweedRulesData = (async () => {
				return await fetchAndCacheJson(cdnStaticDataUrls.tajweedRules, 'other');
			})();
		}
	}

	// Take an input of a string with keys (eg: "2:27:7, 2:17:9") and convert each key to a hyperlink
	function replaceKeysWithLinks(keys) {
		const keysSplit = keys.split(', ');
		const keysLinks = [];

		for (let i = 0; i <= keysSplit.length - 1; i++) {
			keysLinks.push(`<a class='${linkClasses}' href='/${keysSplit[i].split(':')[0]}/${keysSplit[i].split(':')[1]}'>${keysSplit[i]}</a>`);
		}

		return keysLinks.join(', ');
	}
</script>

<Modal id="tajweedRulesModal" bind:open={$__tajweedRulesModalVisible} transitionParams={getModalTransition('bottom')} position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium flex-shrink-0">{modalTitle}</h3>

	<div class="flex-1 min-h-0 overflow-y-auto overscroll-contain w-full pr-2">
		{#await tajweedRulesData}
			<Spinner inline={true} />
		{:then data}
			<table class="w-full text-sm text-left rtl:text-right">
				<thead class="text-xs uppercase bg-theme-accent/5">
					<tr>
						<th scope="col" class="px-6 py-3 w-fit"> Icon </th>
						<th scope="col" class="pl-2 pr-6 py-3"> Description </th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(data.data) as [_, value]}
						<tr class="bg-theme-bg border-b border-theme-accent/20 hover:bg-theme-accent/5">
							<td class="py-4 w-fit tajweed-rules text-2xl text-center align-top theme-palette-tajweed"> {value.code} </td>
							<td class="pl-2 pr-6 py-4">
								<div class="flex flex-col space-y-2">
									<span class="font-bold">{value.title} </span>

									{#if value.description !== null}
										<span class="opacity-70">{@html value.description.replace(/\r\n/g, '<br/>')}</span>
									{/if}

									{#if value.examples !== null}
										<span class="opacity-70">Examples: {@html replaceKeysWithLinks(value.examples)}</span>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- links to PDF files -->
			<div class="mt-4 text-xs">
				To learn the correct pronunciation of Arabic alphabets, please refer to
				{@html createLink(`${staticEndpoint}/tajweed/Makharij%20Al%20Huroof.pdf`, 'Makharij Al Huroof')}.
			</div>
		{:catch error}
			<ErrorLoadingData center="false" {error} />
		{/await}
	</div>
</Modal>
