<script>
	export let verseTranslationID;
	export let verseTranslation;
	export let value;

	import CrossSolid from '$svgs/CrossSolid.svelte';
	import { __userSettings, __verseTranslations, __currentPage } from '$utils/stores';
	import { selectableVerseTranslations, rightToLeftVerseTranslations } from '$data/options';

	// Retrieve URL parameters
	const params = new URLSearchParams(window.location.search);
	const searchQuery = params.get('query') === null ? '' : params.get('query');

	const translationFootnoteClasses = `hidden my-2 footnote-block px-2 py-2 border-2 ${window.theme('border')} rounded-2xl footnote-${value.meta.chapter}-${value.meta.verse}-${verseTranslationID}`;
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

		// Fetch footnote
		const response = await fetch(`https://api.qurancdn.com/api/qdc/foot_notes/${footnoteId}`);
		const data = await response.json();
		footnoteText = data.foot_note.text;
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
		return rightToLeftVerseTranslations.includes(selectableVerseTranslations[id].resource_id);
	}

	// Function to highlight the searched text in verse text
	function highlightSearchedText(searchQuery, verseText) {
		const regex = new RegExp(`(?<!<[^>]*)\\b(${searchQuery})\\b(?![^<]*>)`, 'gi');
		const result = verseText.replace(regex, (match) => `<b>${match}</b>`);
		return result;
	}

	// Function to modify the verse text
	function verseTextModifier(verseText) {
		let updatedVerseText = verseText;

		// If query parameter was set (from the search page), highlight the query in the verse translation
		if (params.get('query') !== null) {
			updatedVerseText = highlightSearchedText(searchQuery, updatedVerseText);
		}

		updatedVerseText = updatedVerseText.replace(/<sup/g, `<sup onclick='supClick(this)' title='Show footnote' data-chapter='${value.meta.chapter}' data-verse='${value.meta.verse}' data-translation=${verseTranslationID} class='${footnoteSupClasses}'`);
		return updatedVerseText;
	}

	// function detectVersesInFootnote(footnote) {
	// 	const regex = /\d{0,9}(:\d{0,9})*/g;
	// 	let matches = footnote.match(regex);
	// 	matches = matches.filter(function (e) {
	// 		return e;
	// 	});
	// 	if (matches.length > 0) console.log(matches);
	// }

	window.supClick = supClick;
</script>

<div class="flex flex-col print:break-inside-avoid">
	<span class="{isTranslationRTL(verseTranslation.resource_id) && 'direction-rtl'} {selectableVerseTranslations[verseTranslation.resource_id].font}">
		{@html verseTextModifier(verseTranslation.text)}
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
		<div class="text {isTranslationRTL(verseTranslation.resource_id) && 'direction-rtl'} {selectableVerseTranslations[verseTranslation.resource_id].font}">...</div>
	</div>

	<!-- show translaton author name only if more than 1 was selected -->
	{#if $__verseTranslations.length > 1}
		<span class="opacity-70 {isTranslationRTL(verseTranslation.resource_id) && 'direction-rtl'}">&mdash; {selectableVerseTranslations[verseTranslation.resource_id].resource_name}</span>
	{/if}
</div>
