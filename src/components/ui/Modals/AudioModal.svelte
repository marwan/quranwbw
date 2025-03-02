<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Checkbox from '$ui/FlowbiteSvelte/forms/Checkbox.svelte';
	import VerseReciterSelector from '$ui/SettingsDrawer/VerseReciterSelector.svelte';
	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import Input from '$ui/FlowbiteSvelte/forms/Input.svelte';
	import Search from '$svgs/Search.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __currentPage, __chapterNumber, __audioSettings, __userSettings, __audioModalVisible, __keysToFetch, __settingsSelectorModal, __reciter, __translationReciter } from '$utils/stores';
	import { prepareVersesToPlay, playButtonHandler } from '$utils/audioController';
	import { disabledClasses, buttonClasses, selectedRadioOrCheckboxClasses } from '$data/commonClasses';
	import { selectableReciters, selectableTranslationReciters, selectableAudioDelays } from '$data/options';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { updateSettings } from '$utils/updateSettings';
	import { defaultSettings } from '$src/hooks.client';

	// CSS classes for radio buttons
	const radioClasses = `inline-flex justify-between items-center py-2 px-4 w-full ${window.theme('bgMain')} rounded-lg border-2 ${window.theme('border')} cursor-pointer ${window.theme('checked')} ${window.theme('hover')}`;
	const dropdownItemClasses = `flex flex-row items-center space-x-2 font-normal rounded-3xl ${window.theme('hover')}`;
	let invalidStartVerse = false;
	let invalidEndVerse = false;
	let invalidTimesToRepeat = false;
	let startVerseDropdownOpen = false;
	let endVerseDropdownOpen = false;
	let timesToRepeatDropdownOpen = false;
	let audioDelayDropdownOpen = false;
	let startVerseSearch = ''; // Holds search input for start verse
	let endVerseSearch = ''; // Holds search input for end verse
	$: versesInChapter = quranMetaData[$__chapterNumber].verses;

	// Update settings and validate verses when audio modal is visible
	$: if ($__audioModalVisible) {
		window.versesToPlayArray = []; // clear verses just in case

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

	// Default to verse repeat
	if ($__audioSettings.repeatType === undefined) {
		$__audioSettings.repeatType = 'repeatVerse';
	}

	// Default to no delay
	if ($__audioSettings.audioDelay === undefined) {
		$__audioSettings.audioDelay = 1;
	}

	// Default to repeat 1 time
	if ($__audioSettings.timesToRepeat === undefined) {
		$__audioSettings.timesToRepeat = 1;
	}

	// For any page other than chapter page, default to verse repeat
	$: if ($__currentPage !== 'chapter') {
		$__audioSettings.repeatType = 'repeatVerse';
	}

	// If the audio settings had to be remembered, set them in localStorage whenever the a change is made
	$: if ($__audioSettings && $__audioSettings.rememberSettings === true) {
		savedPlaySettingsHandler('set');
	}

	// Properly set the max verses allowed
	$: if ($__chapterNumber && $__audioSettings.endVerse > versesInChapter) {
		$__audioSettings.endVerse = versesInChapter;
	}

	// Update the end verse whenever the audio modal opens
	$: if ($__audioModalVisible) {
		$__audioSettings.endVerse = versesInChapter;
	}

	// End verse checks
	$: if ($__audioSettings.endVerse < $__audioSettings.startVerse) {
		$__audioSettings.endVerse = $__audioSettings.startVerse;
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
				language: source.language,
				audioRange: source.audioRange,
				timesToRepeat: source.timesToRepeat,
				audioDelay: source.audioDelay
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

<Modal id="audioModal" bind:open={$__audioModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl !theme" bodyClass="p-6" placement="center" position="bottom" outsideclose>
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

			<!-- repeat type options -->
			{#if $__audioSettings.audioRange === 'playRange'}
				<div id="repeat-type-block" class="flex flex-col space-y-4 py-4 border-t {window.theme('border')} {$__audioSettings.audioType === 'word' ? 'hidden' : null}">
					<span class="text-sm">Repeat</span>
					<div class="flex flex-row space-x-2">
						<!-- repeat each verse -->
						<div class="flex items-center min-w-fit {!['chapter', 'mushaf', 'supplications', 'bookmarks', 'juz'].includes($__currentPage) && disabledClasses}">
							<Radio bind:group={$__audioSettings.repeatType} value="repeatVerse" custom>
								<div class="{radioClasses} {$__audioSettings.repeatType === 'repeatVerse' && selectedRadioOrCheckboxClasses}">
									<div class="w-full">Each {term('verse')}</div>
								</div>
							</Radio>
						</div>
						<!-- repeat whole range -->
						<div class="flex items-center min-w-fit {!['chapter', 'mushaf', 'supplications', 'bookmarks', 'juz'].includes($__currentPage) && disabledClasses}">
							<Radio bind:group={$__audioSettings.repeatType} value="repeatRange" custom>
								<div class="{radioClasses} {$__audioSettings.repeatType === 'repeatRange' && selectedRadioOrCheckboxClasses}">
									<div class="w-full">{term('verse')} Range</div>
								</div>
							</Radio>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- from/till verse options -->
		{#if $__currentPage === 'chapter' && $__audioSettings.audioType === 'verse'}
			<div id="audio-range-options" class={$__audioSettings.audioRange === 'playRange' ? 'block' : 'hidden'}>
				<div class="flex flex-col space-y-4 py-4 border-t {window.theme('border')}">
					<div class="flex flex-row space-x-4">
						<!-- Start Verse Dropdown -->
						<div class="flex flex-row space-x-2">
							<span class="m-auto text-sm">From</span>

							<button class="{buttonClasses} text-sm">
								<div>{term('verse')} {$__audioSettings.startVerse}</div>
							</button>
							<Dropdown bind:open={startVerseDropdownOpen} class="w-max">
								<!-- Sticky Search Box -->
								<div class="p-2 sticky top-0 z-10">
									<Input type="number" bind:value={startVerseSearch} autocomplete="off" placeholder="{term('verse')} #" size="md" class="bg-transparent rounded-3xl px-4 max-w-32 {window.theme('placeholder')}">
										<Search slot="left" size={6} classes="pt-1 {startVerseSearch.length > 0 && 'hidden'}" />
									</Input>
								</div>

								<!-- Scrollable List -->
								<div class="max-h-52 overflow-y-auto my-2 px-2">
									{#each Array.from({ length: versesInChapter }, (_, i) => i + 1).filter((v) => v.toString().includes(startVerseSearch)) as verse}
										<DropdownItem
											class={dropdownItemClasses}
											on:click={() => {
												$__audioSettings.startVerse = verse;
												startVerseDropdownOpen = !startVerseDropdownOpen;
											}}
										>
											{term('verse')}
											{verse}
										</DropdownItem>
									{/each}
								</div>
							</Dropdown>
						</div>

						<!-- End Verse Dropdown -->
						<div class="flex flex-row space-x-2">
							<span class="m-auto text-sm">Till</span>

							<button class="{buttonClasses} text-sm">
								<div>{term('verse')} {$__audioSettings.endVerse}</div>
							</button>
							<Dropdown bind:open={endVerseDropdownOpen} class="w-max">
								<!-- Sticky Search Box -->
								<div class="p-2 sticky top-0 z-10">
									<Input type="number" bind:value={endVerseSearch} autocomplete="off" placeholder="{term('verse')} #" size="md" class="bg-transparent rounded-3xl px-4 max-w-32 {window.theme('placeholder')}">
										<Search slot="left" size={6} classes="pt-1 {endVerseSearch.length > 0 && 'hidden'}" />
									</Input>
								</div>

								<!-- Scrollable List -->
								<div class="max-h-52 overflow-y-auto my-2 px-2">
									{#each Array.from({ length: quranMetaData[$__chapterNumber].verses - $__audioSettings.startVerse + 1 }, (_, i) => i + $__audioSettings.startVerse).filter((v) => v.toString().includes(endVerseSearch)) as verse}
										<DropdownItem
											class={dropdownItemClasses}
											on:click={() => {
												$__audioSettings.endVerse = verse;
												endVerseDropdownOpen = !endVerseDropdownOpen;
											}}
										>
											{term('verse')}
											{verse}
										</DropdownItem>
									{/each}
								</div>
							</Dropdown>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if $__audioSettings.audioType === 'verse'}
			<div class="flex flex-col space-y-4 py-4 border-t {window.theme('border')}">
				<div class="flex flex-row space-x-4">
					<!-- repeat times -->
					<div class="flex flex-row space-x-2">
						<span class="m-auto text-sm"> Repeat </span>

						<button class="{buttonClasses} text-sm">
							<div>{$__audioSettings.timesToRepeat} {$__audioSettings.timesToRepeat > 1 ? 'times' : 'time'}</div>
						</button>
						<Dropdown bind:open={timesToRepeatDropdownOpen} class="max-h-52 overflow-y-auto my-2 px-2">
							{#each Array.from({ length: 20 }, (_, i) => i + 1) as n}
								<DropdownItem
									class={dropdownItemClasses}
									on:click={() => {
										$__audioSettings.timesToRepeat = n;
										timesToRepeatDropdownOpen = !timesToRepeatDropdownOpen;
									}}>{n} {n > 1 ? 'times' : 'time'}</DropdownItem
								>
							{/each}
						</Dropdown>
					</div>

					<!-- repeat delay -->
					<div class="flex flex-row space-x-2">
						<span class="m-auto text-sm">Delay </span>

						<button class="{buttonClasses} text-sm">
							<div>{selectableAudioDelays[$__audioSettings.audioDelay].name}</div>
						</button>
						<Dropdown bind:open={audioDelayDropdownOpen} class="max-h-52 overflow-y-auto my-2 px-2">
							{#each Object.values(selectableAudioDelays) as delay}
								<DropdownItem
									class={dropdownItemClasses}
									on:click={() => {
										$__audioSettings.audioDelay = delay.id;
										audioDelayDropdownOpen = !audioDelayDropdownOpen;
									}}>{delay.name}</DropdownItem
								>
							{/each}
						</Dropdown>
					</div>
				</div>
			</div>
		{/if}

		<Checkbox checked={$__audioSettings.rememberSettings} on:click={() => toggleRememberSettings()} class="space-x-2 pb-6 font-normal {window.theme('bgMain')}">
			<span>Remember Settings</span>
		</Checkbox>
	</div>

	<div>
		<button on:click={() => playButtonHandler($__audioSettings.playingKey)} class="w-full {buttonClasses} {invalidStartVerse || invalidEndVerse || invalidTimesToRepeat ? disabledClasses : null}">Play</button>
	</div>
</Modal>
