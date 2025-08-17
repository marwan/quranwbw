<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Checkbox from '$ui/FlowbiteSvelte/forms/Checkbox.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __verseKey, __copyShareVerseModalVisible, __verseTranslationData } from '$utils/stores';
	import { linkClasses, buttonClasses, selectedRadioOrCheckboxClasses } from '$data/commonClasses';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { selectableVerseTranslations } from '$data/options';

	// CSS classes for radio buttons
	const radioClasses = `inline-flex justify-between items-center py-2 px-4 w-full ${window.theme('bgMain')} rounded-lg border-2 ${window.theme('border')} cursor-pointer ${window.theme('checked')} ${window.theme('hover')}`;

	// Options
	let copyType = 1;
	let textType = 1;
	let includeKey = true;
	let includeTranslationNames = true;
	let includeFootNotes = false;
	let includeLink = true;
	let generatedVerseData = '';
	let websiteLink = '';

	// Extract chapter number from verse key
	$: [chapter, verse] = $__verseKey.split(':').map(Number);

	// Shareable link
	$: websiteLink = `https://quranwbw.com/${chapter}/${verse}`;

	// Reset the generated data variable whenever any of the option changes
	$: if ($__copyShareVerseModalVisible || $__verseKey || copyType || textType || includeKey || includeTranslationNames || includeFootNotes || includeLink) {
		generatedVerseData = '';
	}

	function getVerseArabicText(key) {
		try {
			const [chapter, verse] = key.split(':').map(Number);
			const words = document.querySelectorAll(`.verse-${chapter}-${verse} .arabicText`);
			let wordsArray = [];

			// Join all the words
			words.forEach((word) => {
				wordsArray.push(word.innerText);
			});

			return wordsArray.join(' ');
		} catch (error) {
			console.warn(error);
			return key;
		}
	}

	function getVerseTranslationText(key, includeTranslationNames = true, includeFootnotes = true) {
		const allTranslations = [];
		let output = '';
		let footnoteCounter = 1;
		const allFootnotes = [];

		// Collect translations
		for (const translationId in $__verseTranslationData) {
			const translation = $__verseTranslationData[translationId];
			if (translation && translation[key]) {
				allTranslations.push({
					translationId,
					authorName: selectableVerseTranslations[translationId].resource_name,
					text: translation[key].text,
					footnotes: translation[key].footnotes || null
				});
			}
		}

		// Format output
		for (const entry of allTranslations) {
			// Replace <sup foot_note=X>Y</sup> with [N]
			let text = entry.text.replace(/<sup[^>]*?>\d+<\/sup>/g, () => `[${footnoteCounter++}]`);

			// Remove remaining HTML tags
			text = text.replace(/<[^>]+>/g, '');

			output += text;

			if (includeTranslationNames) {
				output += `\n— ${entry.authorName}`;
			}

			output += `\n\n`;

			// Add footnotes
			if (includeFootnotes && entry.footnotes) {
				for (const footnote of entry.footnotes) {
					const cleanFootnote = footnote.replace(/<[^>]+>/g, '').trim();
					output += `[${allFootnotes.length + 1}] ${cleanFootnote}\n\n`;
					allFootnotes.push(cleanFootnote);
				}
			}
		}

		return output.trim();
	}

	function advancedCopy(key, textType, includeKey, includeTranslationNames, includeFootNotes, includeLink) {
		let results = '';
		const [chapter] = key.split(':');

		// Add verse key on top
		if (includeKey) {
			results += `${quranMetaData[chapter].transliteration}, ${key}\n\n`;
		}

		// Get Arabic and/or translation text
		const arabicText = getVerseArabicText(key);
		const translationText = getVerseTranslationText(key, includeTranslationNames, includeFootNotes);

		if (textType === 1) {
			// Only Arabic
			results += `${arabicText}\n\n`;
		} else if (textType === 2) {
			// Only translation
			results += `${translationText}\n\n`;
		} else if (textType === 3) {
			// Both Arabic and translation
			results += `${arabicText}\n\n${translationText}\n\n`;
		}

		// Add website link at the end
		if (includeLink) {
			results += websiteLink;
		}

		return results.trim();
	}

	async function processAndCopyVerseData() {
		if (copyType === 1) {
			generatedVerseData = getVerseArabicText($__verseKey);
		} else if (copyType === 2) {
			generatedVerseData = websiteLink;
		} else if (copyType === 3) {
			generatedVerseData = advancedCopy($__verseKey, textType, includeKey, includeTranslationNames, includeFootNotes, includeLink);
		}

		console.log(generatedVerseData);
		navigator.clipboard.writeText(generatedVerseData);
	}

	// function to download any text/string as a text file
	function downloadTextFile(name, data) {
		const link = document.createElement('a');
		const file = new Blob([data], { type: 'text/plain' });
		link.href = URL.createObjectURL(file);
		link.download = `${name}.txt`;
		link.click();
		URL.revokeObjectURL(link.href);
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
					<button on:click={downloadTextFile(`quran-${chapter}-${verse}`, generatedVerseData)} class={linkClasses} data-umami-event="Download Verse File Button">Click here to download it as a file.</button>
				{:else}
					<span>Link copied to clipboard.</span>
				{/if}
			</div>
		{/if}

		<div class="flex flex-row">
			<button class="w-full {buttonClasses}" on:click={processAndCopyVerseData} data-umami-event="Copy Verse Button">Copy</button>
		</div>
	</div>
</Modal>
