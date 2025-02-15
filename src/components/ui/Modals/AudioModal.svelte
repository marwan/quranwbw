<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Checkbox from '$ui/FlowbiteSvelte/forms/Checkbox.svelte';
	import VerseReciterSelector from '$ui/SettingsDrawer/VerseReciterSelector.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __currentPage, __chapterNumber, __audioSettings, __userSettings, __audioModalVisible, __keysToFetch, __settingsSelectorModal, __reciter, __translationReciter } from '$utils/stores';
	import { updateAudioSettings, prepareVersesToPlay, playButtonHandler } from '$utils/audioController';
	import { disabledClasses, buttonClasses, selectedRadioOrCheckboxClasses } from '$data/commonClasses';
	import { selectableReciters, selectableTranslationReciters } from '$data/options';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { updateSettings } from '$utils/updateSettings';
	import { defaultSettings } from '$src/hooks.client';

	// CSS classes for radio buttons
	const radioClasses = `inline-flex justify-between items-center py-2 px-4 w-full ${window.theme('bgMain')} rounded-lg border-2 ${window.theme('border')} cursor-pointer ${window.theme('checked')} ${window.theme('hover')}`;
	let invalidStartVerse = false;
	let invalidEndVerse = false;
	let invalidTimesToRepeat = false;

	// Update settings and validate verses when audio modal is visible
	$: if ($__audioModalVisible) {
		const thisChapter = $__audioSettings.playingKey.split(':')[0];
		const versesInChapter = quranMetaData[thisChapter].verses;
		const { startVerse, endVerse, timesToRepeat } = $__audioSettings;

		// Set verses to play based on audio range setting
		prepareVersesToPlay($__audioSettings.playingKey);

		// Initialize endVerse as startVerse if undefined
		$__audioSettings.endVerse ??= startVerse;

		// Validate verse and repeat times
		invalidStartVerse = startVerse < 1 || startVerse > versesInChapter;
		invalidEndVerse = endVerse < 1 || endVerse > versesInChapter || endVerse < startVerse;
		invalidTimesToRepeat = timesToRepeat < 1 || timesToRepeat > 20 || isNaN(timesToRepeat);
	}

	// Allow only "playThisVerse" option for non-chapter pages
	$: if ($__currentPage !== 'chapter' && $__audioSettings.audioRange === 'playRange') {
		$__audioSettings.audioRange = 'playThisVerse';
	}

	// If the audio settings had to be remembered, get them from localStorage whenever the page is loaded
	if ($__audioSettings.rememberSettings) {
		savedPlaySettingsHandler('get');
	}

	// If the audio settings had to be remembered, set them in localStorage whenever the a change is made
	$: if ($__audioSettings && $__audioSettings.rememberSettings === true) {
		savedPlaySettingsHandler('set');
	}

	// $: console.log($__audioSettings);

	// This function manages the saving, retrieving, and resetting of audio settings in the $__audioSettings object.
	// It takes an action parameter that determines whether to get ('get'), set ('set'), or reset to default ('default') the audio settings.
	function savedPlaySettingsHandler(action) {
		const audioSettings = $__audioSettings;
		const savedSettings = $__audioSettings.savedPlaySettings || {};

		const assignSettings = (source, target) => {
			Object.assign(target, {
				audioType: source.audioType,
				audioRange: source.audioRange,
				language: source.language,
				timesToRepeat: source.timesToRepeat
			});
		};

		if (action === 'get') {
			if (Object.keys(savedSettings).length === 0) {
				savedPlaySettingsHandler('set');
			}
			assignSettings(savedSettings, audioSettings);
		} else if (action === 'set') {
			assignSettings(audioSettings, savedSettings);
		} else if (action === 'default') {
			assignSettings(defaultSettings.audioSettings, audioSettings);
			delete audioSettings.savedPlaySettings;
		}

		updateSettings({ type: 'audioSettings', value: audioSettings });
	}

	// This function toggles the rememberSettings property within the $__audioSettings object.
	// Depending on the new state, it calls savedPlaySettingsHandler to either save or reset the audio settings.
	function toggleRememberSettings() {
		const rememberSettings = $__audioSettings.rememberSettings;
		const newSetting = !rememberSettings;
		const settingType = newSetting ? 'set' : 'default';

		$__audioSettings.rememberSettings = newSetting;
		savedPlaySettingsHandler(settingType);
	}
</script>

<Modal id="audioModal" bind:open={$__audioModalVisible} transitionParams={getModalTransition('bottom')} size="xs" class="!rounded-b-none md:!rounded-3xl !theme" bodyClass="p-6" placement="center" position="bottom" outsideclose>
	<!-- Modal content -->
	<h3 id="modal-title" class="mb-2 text-xl font-medium">{quranMetaData[$__audioSettings.playingChapter || 1].transliteration}, {$__audioSettings.playingKey}</h3>

	<div class="max-h-[70vh] overflow-y-scroll w-full pr-2">
		<div class="flex flex-col">
			<!-- play type options -->
			<div class="flex flex-col space-y-4 py-4">
				<span class="text-sm">Play</span>
				<div class="flex flex-row space-x-2">
					<!-- play verse -->
					<div class="flex items-center">
						<Radio bind:group={$__audioSettings.audioType} value="verse" custom>
							<div class="{radioClasses} {$__audioSettings.audioType === 'verse' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">{term('verse')}</div>
							</div>
						</Radio>
					</div>
					<!-- play word -->
					<div class="flex items-center">
						<Radio bind:group={$__audioSettings.audioType} value="word" custom>
							<div class="{radioClasses} {$__audioSettings.audioType === 'word' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">Words</div>
							</div>
						</Radio>
					</div>
				</div>

				{#if $__audioSettings.audioType === 'word'}
					<span class="flex flex-col space-y-3 text-xs pt-2 opacity-70">
						<span>This feature allows you to hear each word in the {term('verse')} individually. To listen to specific words, simply click on them. Please note, this option plays the words sequentially without accounting for the connecting silent letters between them. For a seamless and accurate recitation, it is recommended to play the entire {term('verse')}.</span>
					</span>
				{/if}
			</div>

			<!-- language options -->
			<div id="recitation-language-block" class="flex flex-col space-y-4 py-4 border-t {window.theme('border')} {$__audioSettings.audioType === 'word' ? 'hidden' : null}">
				<span class="text-sm">Language</span>
				<div class="flex flex-row space-x-2">
					<!-- play arabic only -->
					<div class="flex items-center">
						<Radio bind:group={$__audioSettings.language} value="arabic" custom>
							<div class="{radioClasses} {$__audioSettings.language === 'arabic' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">Arabic</div>
							</div>
						</Radio>
					</div>
					<!-- play translation only -->
					<div class="flex items-center">
						<Radio bind:group={$__audioSettings.language} value="translation" custom>
							<div class="{radioClasses} {$__audioSettings.language === 'translation' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">Translation</div>
							</div>
						</Radio>
					</div>
					<!-- play both -->
					<div class="flex items-center">
						<Radio bind:group={$__audioSettings.language} value="both" custom>
							<div class="{radioClasses} {$__audioSettings.language === 'both' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">Both</div>
							</div>
						</Radio>
					</div>
				</div>
			</div>

			<!-- reciter selectors -->
			<div id="reciter-selecter-block" class="flex flex-col space-y-4 py-4 border-t {window.theme('border')} {$__audioSettings.audioType === 'word' ? 'hidden' : null}">
				<span class="text-sm">Audio</span>
				<div class="flex flex-row {$__audioSettings.language === 'both' && 'space-x-2'}">
					<!-- verse reciter -->
					<div class="flex items-center w-fit truncate {['arabic', 'both'].includes($__audioSettings.language) ? 'block' : 'hidden'}">
						<button class="{radioClasses} {window.theme('borderDark')} truncate" on:click={() => __settingsSelectorModal.set({ component: VerseReciterSelector, visible: true, title: 'Reciter' })}>
							<div class="text-sm font-semibold truncate">{selectableReciters[$__reciter].reciter}</div>
						</button>
					</div>
					<!-- translation reciter -->
					<div class="flex items-center w-fit truncate {['translation', 'both'].includes($__audioSettings.language) ? 'block' : 'hidden'}">
						<button class="{radioClasses} {window.theme('borderDark')} truncate" on:click={() => __settingsSelectorModal.set({ component: VerseReciterSelector, visible: true, title: 'Reciter' })}>
							<div class="text-sm font-semibold truncate">{selectableTranslationReciters[$__translationReciter].reciter}</div>
						</button>
					</div>
				</div>
			</div>

			<!-- range options -->
			<div id="single-or-range-block" class="flex flex-col space-y-4 py-4 border-t {window.theme('border')} {$__audioSettings.audioType === 'word' ? 'hidden' : null}">
				<span class="text-sm">Range</span>
				<div class="flex flex-row space-x-2">
					<!-- play this verse -->
					<div class="flex items-center min-w-fit {!['chapter', 'mushaf', 'supplications', 'bookmarks', 'juz'].includes($__currentPage) && disabledClasses}">
						<Radio bind:group={$__audioSettings.audioRange} value="playThisVerse" custom>
							<div class="{radioClasses} {$__audioSettings.audioRange === 'playThisVerse' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">This {term('verse')}</div>
							</div>
						</Radio>
					</div>
					<!-- play from here -->
					<div class="flex items-center min-w-fit {!['chapter', 'mushaf', 'supplications', 'bookmarks', 'juz'].includes($__currentPage) && disabledClasses}">
						<Radio bind:group={$__audioSettings.audioRange} value="playFromHere" custom>
							<div class="{radioClasses} {$__audioSettings.audioRange === 'playFromHere' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">From Here</div>
							</div>
						</Radio>
					</div>
					<!-- play range -->
					<div class="flex items-center min-w-fit {!['chapter'].includes($__currentPage) && disabledClasses}">
						<Radio bind:group={$__audioSettings.audioRange} value="playRange" custom>
							<div class="{radioClasses} {$__audioSettings.audioRange === 'playRange' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">Custom</div>
							</div>
						</Radio>
					</div>
				</div>
			</div>

			<!-- audio range options -->
			{#if $__currentPage === 'chapter' && $__audioSettings.audioType === 'verse'}
				<div id="audio-range-options" class={$__audioSettings.audioRange === 'playRange' ? 'block' : 'hidden'}>
					<!-- from / till -->
					<div class="flex flex-col space-y-4 py-4 border-t {window.theme('border')}">
						<!-- <span class="text-xs  ">Select the range of verses or words to be played.</span> -->
						<div class="flex flex-row space-x-4">
							<div class="flex flex-row space-x-2">
								<span class="m-auto text-sm mr-2">From {term('verse')}</span>
								<input type="number" min="1" max={quranMetaData[$__chapterNumber].verses} bind:value={$__audioSettings.startVerse} id="startVerse" on:change={updateAudioSettings} aria-describedby="helper-text-explanation" class="bg-transparent w-16 text-xs rounded-3xl border {window.theme('border')} {window.theme('input')} {window.theme('placeholder')} block p-2.5 mb-0" placeholder="start" />
							</div>
							<div class="flex flex-row space-x-2">
								<span class="m-auto text-sm mr-2">Till {term('verse')}</span>
								<input
									type="number"
									min={$__audioSettings.startVerse}
									max={quranMetaData[$__chapterNumber].verses}
									bind:value={quranMetaData[$__chapterNumber].verses}
									id="endVerse"
									on:change={updateAudioSettings}
									aria-describedby="helper-text-explanation"
									class="bg-transparent w-16 text-xs rounded-3xl border {window.theme('border')} {window.theme('input')} {window.theme('placeholder')} {window.theme('placeholder')} block p-2.5 mb-0"
									placeholder="end"
								/>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- repeat times -->
		{#if $__audioSettings.audioType === 'verse'}
			<div class="flex flex-col space-y-4 py-4 border-t {window.theme('border')}">
				<div class="flex flex-row space-x-4">
					<div class="flex flex-row space-x-2">
						<span class="m-auto text-sm mr-2">Repeat each {term($__audioSettings.audioType)}</span>
						<input id="timesToRepeat" type="number" bind:value={$__audioSettings.timesToRepeat} min="1" max="20" on:change={updateAudioSettings} class="bg-transparent w-16 text-xs rounded-3xl border {window.theme('border')} {window.theme('input')} block p-2.5 mb-0" />
						<span class="m-auto text-sm">{$__audioSettings.timesToRepeat > 1 ? 'times' : 'time'} </span>
					</div>
				</div>
			</div>
		{/if}

		<Checkbox checked={$__audioSettings.rememberSettings} on:click={() => toggleRememberSettings()} class="space-x-2 pb-2 font-normal {window.theme('bgMain')}">
			<span>Remember Settings</span>
		</Checkbox>

		<div class="mt-4">
			<button on:click={() => playButtonHandler($__audioSettings.playingKey)} class="w-full {buttonClasses} {invalidStartVerse || invalidEndVerse || invalidTimesToRepeat ? disabledClasses : null}">Play</button>
		</div>
	</div>
</Modal>
