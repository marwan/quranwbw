<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Checkbox from '$ui/FlowbiteSvelte/forms/Checkbox.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __verseKey, __copyShareVerseModalVisible, __verseTranslations } from '$utils/stores';
	import { disabledClasses, linkClasses, buttonClasses, selectedRadioOrCheckboxClasses } from '$data/commonClasses';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { createLink } from '$utils/createLink';
	import { staticEndpoint } from '$data/websiteSettings';
	import { downloadTextFile } from '$utils/downloadTextFile';
	import { getVerseText } from '$utils/getVerseText';

	// CSS classes for radio buttons
	const radioClasses = `inline-flex justify-between items-center py-2 px-4 w-full ${window.theme('bgMain')} rounded-lg border-2 ${window.theme('border')} cursor-pointer ${window.theme('checked')} ${window.theme('hover')}`;

	// Selectable font types for copy/share
	const fontTypes = {
		4: {
			id: 4,
			name: 'Uthmani'
		},
		7: {
			id: 7,
			name: 'Indopak'
		}
	};

	// Options
	let copyType = 1;
	let textType = 1;
	let fontType = 4;
	let includeKey = true;
	let includeTranslationNames = true;
	let includeFootNotes = false;
	let includeLink = true;
	let fetchingData = false;
	let generatedVerseData = '';
	let websiteLink = '';

	// Extract chapter number from verse key
	$: [chapter, verse] = $__verseKey.split(':').map(Number);

	// Shareable link
	$: websiteLink = `https://quranwbw.com/${chapter}/${verse}`;

	// Reset the generated data variable whenever any of the option changes
	$: if ($__copyShareVerseModalVisible || $__verseKey || copyType || textType || fontType || includeKey || includeTranslationNames || includeFootNotes || includeLink || fetchingData) {
		generatedVerseData = '';
	}

	// Function to fetch data from Quran.com's API
	async function fetchVerseData() {
		fetchingData = true;

		const params = {
			raw: true,
			from: $__verseKey,
			to: $__verseKey,
			footnote: includeFootNotes,
			translator_name: includeTranslationNames
		};

		// Append mushaf param if Arabic text was selected
		if ([1, 3].includes(textType)) params.mushaf = fontType;

		// Append translation param if translation was selected
		if ([2, 3].includes(textType)) params.translations = $__verseTranslations.toString();

		const api = `https://quran.com/api/proxy/content/api/qdc/verses/advanced_copy?` + new URLSearchParams(params);
		const response = await fetch(api);
		const data = await response.json();
		fetchingData = false;

		return data.result;
	}

	// Function to manipulate the fetched string data
	function manipulateString(result, includeKey, includeLink, quranMetaData, chapter, $__verseKey) {
		// Replace all line breaks despite their counts with just 2
		result = replaceLineBreaks(result);

		// Replace the 2 line breaks in authors name with just 1
		result = result.replace(/\n\n—/g, '\n—');

		// Replace sup tags with brackets
		result = result.replace(/<sup.*?>/g, '[').replace(/<\/sup>/g, ']');

		// Replace verse key with complete name
		if (includeKey) {
			result = detectAndReplaceVerseKey(result, `${quranMetaData[chapter || 1].transliteration}, ${$__verseKey}`);
		} else {
			result = detectAndReplaceVerseKey(result, '');
			result = result.replace(/\n\n/, '');
		}

		// Include link if selected
		if (includeLink) result += `\n\n${websiteLink}`;

		return result;
	}

	// Function to detect verse key (e.g. 1:1) and replace them with complete names
	function detectAndReplaceVerseKey(inputString, replaceWith) {
		const regex = /\b\d{1,3}:\d{1,3}\b/g;
		return inputString.replace(regex, replaceWith);
	}

	// Function to replace all line breaks despite their counts with just 2
	function replaceLineBreaks(inputString) {
		let updatedString = inputString.replace(/^\n+/, '');
		updatedString = updatedString.replace(/\n+$/, '');
		const regex = /(\n)+/g;
		updatedString = updatedString.replace(regex, '\n\n');
		return updatedString;
	}

	// Open share menu
	function shareVerse() {
		if (navigator.share) {
			navigator.share({
				title: generatedVerseData,
				text: generatedVerseData
			});
		}
	}

	// Function to fetch, process and return the final data
	async function processAndCopyVerseData() {
		if (copyType === 1) {
			generatedVerseData = getVerseText($__verseKey);
		} else if (copyType === 2) {
			generatedVerseData = websiteLink;
		} else if (copyType === 3) {
			const verseData = await fetchVerseData();
			const manipulatedData = manipulateString(verseData, includeKey, includeLink, quranMetaData, chapter, $__verseKey);
			generatedVerseData = manipulatedData;
		}

		navigator.clipboard.writeText(generatedVerseData);
	}
</script>

<Modal id="copyShareVerseModal" bind:open={$__copyShareVerseModalVisible} transitionParams={getModalTransition('bottom')} size="xs" class="!rounded-b-none md:!rounded-3xl !theme" bodyClass="p-6" placement="center" position="bottom" outsideclose>
	<!-- Modal content -->
	<h3 id="modal-title" class="mb-2 text-xl font-medium">{quranMetaData[chapter || 1].transliteration}, {$__verseKey}</h3>

	<div class="max-h-[70vh] overflow-y-scroll w-full pr-2">
		<!-- Copy Type -->
		<div class="flex flex-col space-y-4 py-4">
			<span class="text-sm">Type</span>
			<div class="flex flex-row space-x-2">
				<div class="flex items-center">
					<Radio bind:group={copyType} value={1} custom>
						<div class="{radioClasses} {copyType === 1 && selectedRadioOrCheckboxClasses}">
							<div class="w-full">Text</div>
						</div>
					</Radio>
				</div>
				<div class="flex items-center">
					<Radio bind:group={copyType} value={2} custom>
						<div class="{radioClasses} {copyType === 2 && selectedRadioOrCheckboxClasses}">
							<div class="w-full">Link</div>
						</div>
					</Radio>
				</div>
				<div class="flex items-center">
					<Radio bind:group={copyType} value={3} custom>
						<div class="{radioClasses} {copyType === 3 && selectedRadioOrCheckboxClasses}">
							<div class="w-full">Advanced</div>
						</div>
					</Radio>
				</div>
			</div>

			<!-- Type Description -->
			{#if copyType !== 3}
				<span class="flex flex-col space-y-3 text-xs opacity-70">
					{#if copyType === 1}
						<span>Copy the Arabic text of the {term('verse')} only.</span>
					{:else if copyType === 2}
						<span>Copy the website link of the {term('verse')} only.</span>
					{/if}
				</span>
			{/if}
		</div>

		<!-- If Advanced -->
		{#if copyType === 3}
			<div class="flex flex-col">
				<!-- Main Options -->
				<div class="flex flex-col">
					<!-- Arabic/Translation/Both -->
					<div class="flex flex-col space-y-4 py-4 border-t {window.theme('border')}">
						<span class="text-sm">Text</span>
						<div class="flex flex-row space-x-2">
							<div class="flex items-center">
								<Radio bind:group={textType} value={1} custom>
									<div class="{radioClasses} {textType === 1 && selectedRadioOrCheckboxClasses}">
										<div class="w-full">Arabic</div>
									</div>
								</Radio>
							</div>
							<div class="flex items-center">
								<Radio bind:group={textType} value={2} custom>
									<div class="{radioClasses} {textType === 2 && selectedRadioOrCheckboxClasses}">
										<div class="w-full">Translation</div>
									</div>
								</Radio>
							</div>
							<div class="flex items-center">
								<Radio bind:group={textType} value={3} custom>
									<div class="{radioClasses} {textType === 3 && selectedRadioOrCheckboxClasses}">
										<div class="w-full">Both</div>
									</div>
								</Radio>
							</div>
						</div>
					</div>

					<!-- Font Type -->
					{#if textType !== 2}
						<div class="flex flex-col space-y-4 py-4 border-t {window.theme('border')}">
							<span class="text-sm">Font</span>
							<div class="flex flex-row space-x-2">
								{#each Object.entries(fontTypes) as [id, font]}
									<Radio bind:group={fontType} value={font.id} custom>
										<div class="{radioClasses} {fontType === font.id && selectedRadioOrCheckboxClasses}">
											<div class="w-full">{font.name}</div>
										</div>
									</Radio>
								{/each}
							</div>

							<!-- Font Links -->
							<span class="flex flex-col space-y-3 text-xs opacity-70">
								<span>You may download the {fontTypes[fontType].name} font from {@html createLink(`${staticEndpoint}/fonts/Archives/${fontTypes[fontType].name}.zip?version=1`, 'here')}.</span>
							</span>
						</div>
					{/if}
				</div>

				<!-- Other Options -->
				<div class="flex flex-col space-y-2 py-4 border-t {window.theme('border')}">
					<Checkbox checked={includeKey} on:click={() => (includeKey = !includeKey)} class="space-x-2 pb-2 font-normal {window.theme('bgMain')}">
						<span>Include {term('chapter')} Name & {term('verse')} Key</span>
					</Checkbox>

					{#if textType === 2 || textType === 3}
						<Checkbox checked={includeTranslationNames} on:click={() => (includeTranslationNames = !includeTranslationNames)} class="space-x-2 pb-2 font-normal {window.theme('bgMain')}">
							<span>Include Author Names</span>
						</Checkbox>

						<Checkbox checked={includeFootNotes} on:click={() => (includeFootNotes = !includeFootNotes)} class="space-x-2 pb-2 font-normal {window.theme('bgMain')}">
							<span>Include Footnotes</span>
						</Checkbox>
					{/if}

					<Checkbox checked={includeLink} on:click={() => (includeLink = !includeLink)} class="space-x-2 pb-2 font-normal {window.theme('bgMain')}">
						<span>Include Website Link</span>
					</Checkbox>
				</div>
			</div>
		{/if}

		{#if generatedVerseData !== ''}
			<div class="text-xs opacity-70 mb-6 text-left">
				{#if copyType === 1 || copyType === 3}
					<span>Text copied to clipboard.</span>
					<button on:click={downloadTextFile(`quran-${chapter}-${verse}`, generatedVerseData)} class={linkClasses}>Click here to download it as a file.</button>
				{:else}
					<span>Link copied to clipboard.</span>
				{/if}
			</div>
		{/if}

		<div class="flex flex-row">
			<button class="w-full {buttonClasses} {fetchingData && disabledClasses}" on:click={processAndCopyVerseData}>{fetchingData ? 'Please wait...' : 'Copy'}</button>
			<!-- <button class="w-full mr-2 {buttonClasses} {fetchingData && disabledClasses}" on:click={shareVerse}>Share</button> -->
		</div>
	</div>
</Modal>
