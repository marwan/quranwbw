<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __tajweedRulesModalVisible, __currentPage, __chapterNumber } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { staticEndpoint } from '$data/websiteSettings';
	import { linkClasses } from '$data/commonClasses';
	import { createLink } from '$utils/createLink';
	import { tajweedRulings } from '$data/tajweedRulings';
	import { _ } from 'svelte-i18n';

	const modalTitle = `${term('tajweed')} Rules`;
	const rulesList = Object.entries(tajweedRulings);

	$: if ($__currentPage || $__chapterNumber) __tajweedRulesModalVisible.set(false);

	// Take an input of a string with keys (eg: "2:27:7, 2:17:9") and convert each key to a hyperlink
	function replaceKeysWithLinks(keys) {
		const keysSplit = keys.split(', ');
		const keysLinks = [];

		for (let i = 0; i <= keysSplit.length - 1; i++) {
			keysLinks.push(`<a class='${linkClasses}' href='/${keysSplit[i].split(':')[0]}/${keysSplit[i].split(':')[1]}'>${keysSplit[i]}</a>`);
		}

		return keysLinks.join(', ');
	}

	const formatMultiline = (text) => text?.replace(/\r?\n/g, '<br/>');
</script>

<Modal bind:open={$__tajweedRulesModalVisible} title={modalTitle} transitionParams={getModalTransition('bottom')} class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain !border-t-0" headerClass="flex justify-between items-center p-6 rounded-t-3xl" position="bottom" center outsideclose>
	<table class="w-full text-sm text-left rtl:text-right">
		<thead class="text-xs uppercase {window.theme('bgSecondaryLight')}">
			<tr>
				<th scope="col" class="px-6 py-3 w-fit"> Icon </th>
				<th scope="col" class="pl-2 pr-6 py-3"> Description </th>
			</tr>
		</thead>
		<tbody>
			{#each rulesList as [ruleId, value]}
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {window.theme('hover')}">
					<td class="py-4 w-fit tajweed-rules text-2xl text-center align-top theme-palette-tajweed"> {value.code} </td>
					<td class="pl-2 pr-6 py-4">
						<div class="flex flex-col space-y-2">
							<span class="font-bold">{$_(`tajweed.rules.${ruleId}.title`)}</span>

							{#if value.hasDescription}
								<span class="opacity-70">{@html formatMultiline($_(`tajweed.rules.${ruleId}.description`))}</span>
							{/if}

							{#if value.examples}
								<span class="opacity-70">
									Examples: {@html replaceKeysWithLinks(value.examples)}
								</span>
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
</Modal>
