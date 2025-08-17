<script>
	export let value;

	import CrossSolid from '$svgs/CrossSolid.svelte';
	import Skeleton from '$ui/FlowbiteSvelte/skeleton/Skeleton.svelte';
	import { __currentPage, __verseTranslations, __verseTranslationData, __userSettings } from '$utils/stores';
	import { fetchVerseTranslationData } from '$utils/fetchData';
	import { selectableVerseTranslations } from '$data/options';

	$: fontSizes = JSON.parse($__userSettings).displaySettings.fontSizes;
	$: verseTranslationClasses = `verseTranslationText flex flex-col space-y-4 leading-normal ${fontSizes.verseTranslationText}`;

	// Fetch verse translations for pages other than chapter (reactive)
	$: if ($__currentPage !== 'chapter') fetchVerseTranslationData({ reRenderWhenTheseUpdates: $__verseTranslations });

	// Retrieve URL parameters
	const params = new URLSearchParams(window.location.search);
	const searchQuery = params.get('query') === null ? '' : params.get('query');

	const footnoteSupClasses = `ml-1 mt-1 px-2 py-1 rounded-full font-semibold cursor-pointer system-font ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;

	let footnoteId;
	let footnoteChapter;
	let footnoteVerse;
	let footnoteTranslation;
	let footnoteText = 'loading...';
	let footnoteNumber = '...';

	async function supClick(event) {
		footnoteText = 'loading...';
		footnoteId = +event.getAttribute('foot_note');
		footnoteChapter = +event.getAttribute('data-chapter');
		footnoteVerse = +event.getAttribute('data-verse');
		footnoteTranslation = +event.getAttribute('data-translation');
		footnoteNumber = +event.innerText;

		const footnotes = $__verseTranslationData?.[footnoteTranslation]?.[`${footnoteChapter}:${footnoteVerse}`]?.footnotes;
		footnoteText = footnotes?.[footnoteId - 1] || 'Footnote not available.';

		window.umami.track('Verse Footnote Button');
	}

	$: {
		if (footnoteId !== undefined) {
			const selector = `.footnote-${footnoteChapter}-${footnoteVerse}-${footnoteTranslation}`;
			const footnoteBlock = document.querySelector(selector);
			const footnoteBlockNumber = footnoteBlock.querySelector('.footnote-header .title .footnote-number');
			const footnoteBlockText = footnoteBlock.querySelector('.text');

			// Update the footnote number, text, and unhide this verse's footnote block
			footnoteBlockNumber.innerText = footnoteNumber;
			footnoteBlockText.innerHTML = footnoteText;
			footnoteBlock.classList.remove('hidden');
			footnoteBlock.classList.add('block');
		}
	}

	function hideFootnote(chapter, verse, translation) {
		const selector = `.footnote-${chapter}-${verse}-${translation}`;
		const footnoteBlocks = document.querySelectorAll(selector);

		footnoteBlocks.forEach((element) => {
			element.classList.remove('block');
			element.classList.add('hidden');
		});
	}

	function isTranslationRTL(id) {
		return selectableVerseTranslations[id]?.is_rtl === true;
	}

	// Function to highlight the searched text in verse text
	function highlightSearchedText(searchQuery, verseText) {
		const regex = new RegExp(`(?<!<[^>]*)\\b(${searchQuery})\\b(?![^<]*>)`, 'gi');
		const result = verseText.replace(regex, (match) => `<b>${match}</b>`);
		return result;
	}

	// Function to modify the verse text
	function verseTextModifier(verseText, verseTranslationID) {
		let updatedVerseText = verseText.text;

		// If query parameter was set (from the search page), highlight the query in the verse translation
		if (params.get('query') !== null) {
			updatedVerseText = highlightSearchedText(searchQuery, updatedVerseText);
		}

		updatedVerseText = updatedVerseText.replace(/<sup/g, `<sup onclick='supClick(this)' title='Show footnote' data-chapter='${value.meta.chapter}' data-verse='${value.meta.verse}' data-translation=${verseTranslationID} class='${footnoteSupClasses}'`);
		return updatedVerseText;
	}

	window.supClick = supClick;
</script>

{#if $__verseTranslations.length > 0}
	<div class={verseTranslationClasses} data-fontSize={fontSizes.verseTranslationText}>
		{#if $__verseTranslationData}
			{#each $__verseTranslations as verseTranslationID}
				{@const verseKey = `${value.meta.chapter}:${value.meta.verse}`}
				{#if $__verseTranslationData[verseTranslationID] && $__verseTranslationData[verseTranslationID][verseKey]}
					{@const verseTranslation = $__verseTranslationData[verseTranslationID][verseKey]}
					{@const translationFootnoteClasses = `hidden my-2 footnote-block px-2 py-2 border-2 ${window.theme('border')} rounded-2xl footnote-${value.meta.chapter}-${value.meta.verse}-${verseTranslationID}`}

					<div class="flex flex-col print:break-inside-avoid">
						<span class="{isTranslationRTL(verseTranslationID) && 'direction-rtl'} {selectableVerseTranslations[verseTranslationID].font}">
							{@html verseTextModifier(verseTranslation, verseTranslationID)}
						</span>

						<!-- translation footnotes -->
						<div class={translationFootnoteClasses}>
							<div class="footnote-header flex flex-row justify-between font-semibold">
								<div class="title">
									<span>Footnote #</span>
									<span class="footnote-number">...</span>
								</div>

								<!-- close footnote button -->
								<button on:click={() => hideFootnote(value.meta.chapter, value.meta.verse, verseTranslationID)} title="Close footnote"><CrossSolid size={6} /></button>
							</div>
							<div class="text {isTranslationRTL(verseTranslationID) && 'direction-rtl'} {selectableVerseTranslations[verseTranslationID].font}">...</div>
						</div>

						<!-- show translaton author name only if more than 1 was selected -->
						{#if $__verseTranslations.length > 1}
							<span class="opacity-70 {isTranslationRTL(verseTranslationID) && 'direction-rtl'}">&mdash; {selectableVerseTranslations[verseTranslationID].resource_name}</span>
						{/if}
					</div>
				{/if}
			{/each}
		{:else}
			<Skeleton size="xxl" class="mb-2.5" />
		{/if}
	</div>
{/if}
