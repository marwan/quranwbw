<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Range from '$ui/FlowbiteSvelte/forms/Range.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import WebsiteThemeSelector from '$ui/SettingsDrawer/WebsiteThemeSelector.svelte';
	import DisplayTypeSelector from '$ui/SettingsDrawer/DisplayTypeSelector.svelte';
	import WordTooltipSelector from '$ui/SettingsDrawer/WordTooltipSelector.svelte';
	import QuranFontSelector from '$ui/SettingsDrawer/QuranFontSelector.svelte';
	import WordTranslationSelector from '$ui/SettingsDrawer/WordTranslationSelector.svelte';
	import WordTransliterationSelector from '$ui/SettingsDrawer/WordTransliterationSelector.svelte';
	import VerseTranslationSelector from '$ui/SettingsDrawer/VerseTranslationSelector.svelte';
	import VerseTransliterationSelector from '$ui/SettingsDrawer/VerseTransliterationSelector.svelte';
	import VerseTafsirSelector from '$ui/SettingsDrawer/VerseTafsirSelector.svelte';
	import VerseReciterSelector from '$ui/SettingsDrawer/VerseReciterSelector.svelte';
	import VersePlayButtonSelector from '$ui/SettingsDrawer/VersePlayButtonSelector.svelte';
	import ResetSettings from '$svgs/ResetSettings.svelte';
	import Import from '$svgs/Import.svelte';
	import Export from '$svgs/Export.svelte';
	import Copy from '$svgs/Copy.svelte';

	import {
		__settingsModalVisible,
		__currentPage,
		__fontType,
		__displayType,
		__websiteTheme,
		__wordTranslation,
		__wordTransliteration,
		__wordTranslationEnabled,
		__wordTransliterationEnabled,
		__verseTranslations,
		__verseTafsir,
		__reciter,
		__userSettings,
		__wordTooltip,
		__wakeLockEnabled,
		__englishTerminology,
		__hideNonDuaPart,
		__playButtonsFunctionality,
		__wordMorphologyOnClick,
		__wideWesbiteLayoutEnabled,
		__signLanguageModeEnabled,
		__audioSettings
	} from '$utils/stores';

	import { selectableDisplays, selectableFontTypes, selectableThemes, selectableWordTranslations, selectableWordTransliterations, selectableVerseTranslations, selectableReciters, selectablePlaybackSpeeds, selectableTooltipOptions, selectableFontSizes, selectableVersePlayButtonOptions } from '$data/options';

	import { getModalTransition } from '$utils/getModalTransition';
	import { updateSettings } from '$utils/updateSettings';
	import { resetSettings } from '$utils/resetSettings';
	import { disabledClasses, buttonClasses, linkClasses } from '$data/commonClasses';
	import { selectableTafsirs } from '$data/selectableTafsirs';
	import { sineIn } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { term } from '$utils/terminologies';
	import { getTailwindBreakpoint } from '$utils/getTailwindBreakpoint';
	import { importSettings, exportSettings } from '$utils/settingsManager';
	import { showConfirm, showAlert } from '$utils/confirmationAlertHandler';
	import { checkOnlineAndAlert } from '$utils/offlineModeHandler';

	// Components mapping for individual settings ([component, check internet first (true/false)])
	const individualSettingsComponents = {
		'website-theme': [WebsiteThemeSelector, false],
		'display-type': [DisplayTypeSelector, false],
		'word-tooltip': [WordTooltipSelector, false],
		'quran-font': [QuranFontSelector, false],
		'word-translation': [WordTranslationSelector, false],
		'word-transliteration': [WordTransliterationSelector, false],
		'verse-translation': [VerseTranslationSelector, false],
		'verse-transliteration': [VerseTransliterationSelector, false],
		'verse-tafsir': [VerseTafsirSelector, true],
		'verse-reciter': [VerseReciterSelector, true],
		'verse-play-button': [VersePlayButtonSelector, true]
	};

	// Id passed to the confirm/alert helpers (same as the modal id below)
	const dialogTargetId = 'settings-modal';

	// CSS classes
	const settingsBlockClasses = 'space-y-2';
	const selectorClasses = 'w-32 border border-theme-accent/20 text-left rounded-3xl focus:border-theme-accent focus:ring-theme-accent focus-within:ring-2 block p-2.5 truncate text-sm';
	const settingsDescriptionClasses = 'mb-6 text-xs opacity-70';
	const toggleBtnClasses = 'relative w-14 h-7 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[""] after:absolute after:top-0.5 after:start-[4px] after:border after:rounded-full after:h-6 after:w-6 after:transition-all bg-theme-accent/15 after:bg-theme-bg after:border-theme-bg peer-checked:bg-theme-accent';
	const rangeClasses = 'appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full bg-theme-accent/15 [&::-webkit-slider-thumb]:!bg-theme-accent';

	// Sections (name = nav/mobile header label, title = heading in the right pane)
	function getSections() {
		return [
			{ id: 'display', name: 'Display', title: 'Display' },
			{ id: 'font', name: 'Font', title: 'Font' },
			{ id: 'translation', name: `Translation & ${term('tafsir')}`, title: `Translation, Transliteration & ${term('tafsir')}` },
			{ id: 'audio', name: 'Audio', title: 'Audio' },
			{ id: 'misc', name: 'Miscellaneous', title: 'Miscellaneous' }
		];
	}

	let individualSettingsComponent = null; // set while a selector sub-page is open in the right pane
	let mainSettingsScrollPos = 0;
	let contentElement;
	let fileInput;
	let activeSectionId = 'display';
	let mobileView = 'nav'; // 'nav' | 'content' (only matters below md)
	let totalVerseTransliterationsSelected = 0;
	let arabicWordSizeValue = getFontSizeIdByClass(JSON.parse($__userSettings).displaySettings.fontSizes.arabicText);
	let wordTranlationTransliterationSizeValue = getFontSizeIdByClass(JSON.parse($__userSettings).displaySettings.fontSizes.wordTranslationText);
	let verseTranlationTransliterationSizeValue = getFontSizeIdByClass(JSON.parse($__userSettings).displaySettings.fontSizes.verseTranslationText);
	let playbackSpeedValue = JSON.parse($__userSettings).audioSettings.playbackSpeed;

	// Rebuild section labels when the terminology changes
	$: sections = getSections($__englishTerminology);
	$: activeSection = sections.find((section) => section.id === activeSectionId);

	// Update settings when sliders are changed
	$: updateSettings({ type: 'arabicText', value: selectableFontSizes[arabicWordSizeValue].value });
	$: updateSettings({ type: 'wordTranslationText', value: selectableFontSizes[wordTranlationTransliterationSizeValue].value });
	$: updateSettings({ type: 'verseTranslationText', value: selectableFontSizes[verseTranlationTransliterationSizeValue].value });
	$: updateSettings({ type: 'playbackSpeed', value: playbackSpeedValue });

	// Calculate maximum allowed font size based on breakpoint
	$: maxFontSizeAllowed = ['default', 'sm'].includes(getTailwindBreakpoint()) ? 9 : 12;

	// Get keys
	$: wordTransliterationKey = Object.keys(selectableWordTransliterations).find((item) => selectableWordTransliterations[item].id === $__wordTransliteration);

	// Close the modal whenever the page changes
	$: if ($__currentPage) $__settingsModalVisible = false;

	// Reset to the section list when the modal is closed
	$: if (!$__settingsModalVisible) {
		mobileView = 'nav';
		individualSettingsComponent = null;
	}

	// Start at the top when the section changes
	$: if (contentElement && activeSectionId) contentElement.scrollTop = 0;

	// Build a Set of all transliteration resource IDs (language_id === 11115)
	const transliterationIdSet = new Set(
		Object.values(selectableVerseTranslations)
			.filter((item) => item.language_id === 11115)
			.map((item) => item.resource_id)
	);

	// Count how many selected verse translations are transliterations
	$: totalVerseTransliterationsSelected = $__verseTranslations.filter((id) => transliterationIdSet.has(id)).length;

	function selectSection(id) {
		activeSectionId = id;
		individualSettingsComponent = null;
		mobileView = 'content';
	}

	// Close the selector sub-page and restore scroll position
	function goBackToMainSettings() {
		individualSettingsComponent = null;

		setTimeout(() => {
			if (contentElement) contentElement.scrollTop = mainSettingsScrollPos;
		}, 0);
	}

	// Open an individual setting component in the right pane
	async function gotoIndividualSetting(type) {
		// For certain settings, check internet connection first
		if (individualSettingsComponents[type][1] === true) {
			if (!(await checkOnlineAndAlert())) return;
		}

		mainSettingsScrollPos = contentElement.scrollTop;
		individualSettingsComponent = individualSettingsComponents[type][0];

		setTimeout(() => {
			if (contentElement) contentElement.scrollTop = 0;
		}, 0);
	}

	function getFontSizeIdByClass(className) {
		for (const key in selectableFontSizes) {
			if (selectableFontSizes[key].value === className) {
				return Number(key);
			}
		}
		return null;
	}

	function triggerImport() {
		fileInput.click();
	}

	function handleFileChange(event) {
		const file = event.target.files[0];
		if (file) {
			showConfirm('Are you sure you want to import settings? This will overwrite your current preferences.', dialogTargetId, () => {
				importSettings(file);
				event.target.value = ''; // reset so the same file can be chosen again
			});
		}
	}

	// copies userSettings localStorage value to clipboard
	async function copySettings() {
		const settings = localStorage.getItem('userSettings');
		try {
			await navigator.clipboard.writeText(settings);
			showAlert('Settings copied to clipboard.', dialogTargetId);
			window.rybbit?.event('Copy Settings Button');
		} catch (error) {
			showAlert('Failed to copy settings. Please try again.', dialogTargetId);
			console.error('Failed to copy settings:', error);
			window.rybbit?.error(error);
		}
	}
</script>

<Modal bind:open={$__settingsModalVisible} id="settings-modal" transitionParams={getModalTransition('bottom')} size="xl" class="!rounded-b-none md:!rounded-3xl h-[90vh] md:h-[600px] max-h-[90vh] flex flex-col" bodyClass="p-0 flex flex-col flex-1 min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<!-- header -->
	<div class="flex flex-row items-center justify-between flex-shrink-0 px-6 border-theme-accent/20">
		<div class="flex flex-row items-center space-x-2">
			<!-- back to section list, small screens only -->
			{#if mobileView === 'content'}
				<button class="md:hidden my-4 text-2xl font-semibold" aria-label="Back to settings sections" on:click={() => (mobileView = 'nav')}>⟵</button>
			{/if}

			<h5 id="modal-title" class="my-4 text-2xl md:text-3xl font-semibold">
				<span class="md:hidden">{mobileView === 'content' ? activeSection.name : 'Settings'}</span>
				<span class="hidden md:inline">Settings</span>
			</h5>
		</div>
	</div>

	<div class="flex flex-row flex-1 min-h-0">
		<!-- section nav (left) -->
		<nav class="{mobileView === 'content' ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-64 flex-shrink-0 border-theme-accent/20 overflow-y-auto p-4" aria-label="Settings sections">
			<div class="space-y-1">
				{#each sections as section}
					<button class="flex flex-row items-center justify-between w-full text-left text-base px-4 py-3 rounded-3xl border border-transparent hover:bg-theme-accent/5 {activeSectionId === section.id ? 'md:bg-theme-accent/15' : ''}" aria-current={activeSectionId === section.id ? 'page' : undefined} on:click={() => selectSection(section.id)}>
						<span>{section.name}</span>
						<span class="md:hidden opacity-70" aria-hidden="true">›</span>
					</button>
				{/each}
			</div>

			<!-- website build version & timestamp -->
			<div class="mt-auto pt-6 text-center">
				<!-- svelte-ignore missing-declaration -->
				<a class="{linkClasses} text-xs" target="_blank" href="https://github.com/marwan/quranwbw/commit/{__APP_VERSION__.split(' ')[0]}">Build {__APP_VERSION__}</a>
			</div>
		</nav>

		<!-- settings (right) -->
		<div bind:this={contentElement} class="{mobileView === 'nav' ? 'hidden' : 'flex'} md:flex flex-col flex-1 min-w-0 overflow-y-auto px-6 pb-6">
			{#if individualSettingsComponent}
				<!-- individual-setting (selector stays open until Back is clicked) -->
				<div id="individual-setting" in:fly={{ duration: 150, x: 0, easing: sineIn }}>
					<div class="flex z-30 top-0 sticky bg-theme-bg border-b-2 border-theme-accent/20 mb-4">
						<button class="inline-flex items-center my-4 text-xl font-semibold" on:click={goBackToMainSettings}>⟵ Back</button>
					</div>

					<svelte:component this={individualSettingsComponent} />
				</div>
			{:else}
				<div id="{activeSection.id}-settings-block" class="py-5">
					<!-- <h3 class="hidden md:block mb-2 font-medium text-xl">{activeSection.title}</h3> -->

					<div class="flex flex-col flex-wrap text-base">
						<!-- display settings -->
						{#if activeSectionId === 'display'}
							<!-- website-theme-setting -->
							<div id="website-theme-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">Theme</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('website-theme')}>{selectableThemes[$__websiteTheme].name}</button>
								</div>
								<p class={settingsDescriptionClasses}>An assortment of website themes to please your vision.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- display-type-setting -->
							<div id="display-type-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">Display Type</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('display-type')}>{selectableDisplays[$__displayType].displayName}</button>
								</div>
								<p class={settingsDescriptionClasses}>Different {term('verse')} layouts that you can choose from.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- word-tooltip-setting -->
							<div id="word-tooltip-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">Word Tooltip</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('word-tooltip')}>{selectableTooltipOptions[$__wordTooltip].name}</button>
								</div>
								<p class={settingsDescriptionClasses}>Choose what is displayed when you hover a word.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- word-translation-toggle-setting -->
							<div id="word-translation-toggle-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Word Translation</span>

									<label class="inline-flex items-center cursor-pointer {$__wordTransliterationEnabled === false && disabledClasses}">
										<input type="checkbox" value="" class="sr-only peer" checked={$__wordTranslationEnabled} on:click={(event) => updateSettings({ type: 'wordTranslationEnabled', value: event.target.checked })} />
										<div class={toggleBtnClasses}></div>
									</label>
								</div>
								<p class={settingsDescriptionClasses}>Toggle the word translation which is shown below the Arabic word.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- word-transliteration-toggle-setting -->
							<div id="word-transliteration-toggle-setting" class="{settingsBlockClasses} {$__signLanguageModeEnabled && disabledClasses}">
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Word Transliteration</span>
									<label class="inline-flex items-center cursor-pointer {$__wordTranslationEnabled === false && disabledClasses}">
										<input type="checkbox" value="" class="sr-only peer" checked={$__wordTransliterationEnabled} on:click={(event) => updateSettings({ type: 'wordTransliterationEnabled', value: event.target.checked })} />
										<div class={toggleBtnClasses}></div>
									</label>
								</div>
								<p class={settingsDescriptionClasses}>Toggle the word transliteration which is shown below the Arabic word.</p>
							</div>

							<!-- prevent sleep toggle, only show if the browser supports it  -->
							{#if 'wakeLock' in navigator}
								<div class="border-b border-theme-accent/20 my-6"></div>

								<!-- prevent-sleep-toggle-setting -->
								<div id="prevent-sleep-toggle-setting" class={settingsBlockClasses}>
									<div class="flex flex-row justify-between items-center space-x-4">
										<span class="block">Prevent Sleep</span>
										<label class="inline-flex items-center cursor-pointer">
											<input type="checkbox" value="" class="sr-only peer" checked={$__wakeLockEnabled} on:click={(event) => __wakeLockEnabled.set(event.target.checked)} data-rybbit-event="Toggle Prevent Sleep" />
											<div class={toggleBtnClasses}></div>
										</label>
									</div>
									<p class={settingsDescriptionClasses}>Enabling this option will prevent your screen from dimming or sleeping. Please note that you will need to manually enable this option for each session.</p>
								</div>
							{/if}

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- wide-website-layout-setting -->
							<div id="wide-website-layout-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Wide Website Layout</span>
									<label class="inline-flex items-center cursor-pointer {$__wordTranslationEnabled === false && disabledClasses}">
										<input type="checkbox" value="" class="sr-only peer" checked={$__wideWesbiteLayoutEnabled} on:click={(event) => updateSettings({ type: 'wideWesbiteLayoutEnabled', value: event.target.checked })} />
										<div class={toggleBtnClasses}></div>
									</label>
								</div>
								<p class={settingsDescriptionClasses}>Enable this to use a wider layout (extra large width). Best for larger screens.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- arabic-sign-language-setting -->
							<div id="arabic-sign-language-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Arabic Sign Language</span>
									<label class="inline-flex items-center cursor-pointer {$__wordTranslationEnabled === false && disabledClasses}">
										<input type="checkbox" value="" class="sr-only peer" checked={$__signLanguageModeEnabled} on:click={(event) => updateSettings({ type: 'signLanguageModeEnabled', value: event.target.checked })} />
										<div class={toggleBtnClasses}></div>
									</label>
								</div>
								<p class={settingsDescriptionClasses}>Enable this to switch the Quran view to Arabic Sign Language mode. The Indonesian Isep Misbah Digital font will be used, and some options will be disabled.</p>
							</div>

							<!-- font settings -->
						{:else if activeSectionId === 'font'}
							<!-- quran-font-setting -->
							<div id="quran-font-setting" class="{settingsBlockClasses} {$__signLanguageModeEnabled && disabledClasses}">
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">Quran Font</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('quran-font')}>{selectableFontTypes[$__fontType].type} - {selectableFontTypes[$__fontType].font}</button>
								</div>
								<p class={settingsDescriptionClasses}>Multiple Quranic fonts to choose from depending on your mushaf or region preference.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- arabic-word-size-setting -->
							<div id="arabic-word-size-setting" class="{settingsBlockClasses} {$__currentPage === 'mushaf' && disabledClasses}">
								<div class="flex flex-col justify-between space-y-4">
									<span class="block">Arabic Word Size ({selectableFontSizes[arabicWordSizeValue].value.split('-')[1]})</span>
									<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group">
										<Range min="1" max={maxFontSizeAllowed} bind:value={arabicWordSizeValue} class={rangeClasses} />
									</div>
								</div>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- word-translation-size-setting -->
							<div id="word-translation-size-setting" class="{settingsBlockClasses} {$__currentPage === 'mushaf' && disabledClasses}">
								<div class="flex flex-col justify-between space-y-4">
									<span class="block">
										{$__signLanguageModeEnabled ? 'Sign Language Icon Size' : 'Word Translation/Transliteration Size'}
										({selectableFontSizes[wordTranlationTransliterationSizeValue].value.split('-')[1]})
									</span>
									<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group">
										<Range min="1" max={maxFontSizeAllowed} bind:value={wordTranlationTransliterationSizeValue} class={rangeClasses} />
									</div>
								</div>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- verse-translation-size-setting -->
							<div id="verse-translation-size-setting" class="{settingsBlockClasses} {$__currentPage === 'mushaf' && disabledClasses}">
								<div class="flex flex-col justify-between space-y-4">
									<span class="block">{term('verse')} Translation/Transliteration Size ({selectableFontSizes[verseTranlationTransliterationSizeValue].value.split('-')[1]})</span>
									<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group">
										<Range min="1" max={maxFontSizeAllowed} bind:value={verseTranlationTransliterationSizeValue} class={rangeClasses} />
									</div>
								</div>
							</div>

							<!-- translation, transliteration & tafsir settings -->
						{:else if activeSectionId === 'translation'}
							<!-- word-translation-setting -->
							<div id="word-translation-setting" class="{settingsBlockClasses} {$__signLanguageModeEnabled && disabledClasses}">
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">Word Translation</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('word-translation')}>{selectableWordTranslations[$__wordTranslation].language}</button>
								</div>
								<p class={settingsDescriptionClasses}>Word translation which will be displaced under the Arabic word text.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- word-transliteration-setting -->
							<div id="word-transliteration-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">Word Transliteration</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('word-transliteration')}>{selectableWordTransliterations[wordTransliterationKey].language}</button>
								</div>
								<p class={settingsDescriptionClasses}>Word transliteration of various types.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- verse-translation-setting -->
							<div id="verse-translation-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">{term('verse')} Translation</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-translation')}>{$__verseTranslations.length - totalVerseTransliterationsSelected} selected</button>
								</div>
								<p class={settingsDescriptionClasses}>{term('verse')} translations from multiple authors and languages.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- verse-transliteration-setting -->
							<div id="verse-transliteration-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">{term('verse')} Transliteration</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-transliteration')}>{totalVerseTransliterationsSelected} selected</button>
								</div>
								<p class={settingsDescriptionClasses}>{term('verse')} transliteration of various types.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- tafsir-setting -->
							<div id="tafsir-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">{term('tafsir')}</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-tafsir')}>{selectableTafsirs[$__verseTafsir].name}</button>
								</div>
								<p class={settingsDescriptionClasses}>{term('verse')} {term('tafsir')} from multiple authors and languages.</p>
							</div>

							<!-- audio settings -->
						{:else if activeSectionId === 'audio'}
							<!-- verse-reciter-setting -->
							<div id="verse-reciter-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">{term('verse')} Reciter</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-reciter')}>{selectableReciters[$__reciter].reciter}</button>
								</div>
								<p class={settingsDescriptionClasses}>The reciter's voice that will play when you choose to listen to a {term('verse')}.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- playback-speed-setting -->
							<div id="playback-speed-setting" class={settingsBlockClasses}>
								<div class="flex flex-col justify-between space-y-4">
									<span class="block">Playback Speed (x{selectablePlaybackSpeeds[playbackSpeedValue].speed})</span>
									<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group">
										<Range min="1" max={Object.keys(selectablePlaybackSpeeds).length} bind:value={playbackSpeedValue} class={rangeClasses} />
									</div>
								</div>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- verse-play-button-setting -->
							<div id="verse-play-button-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<div class="block">{term('verse')} Play Button</div>
									<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-play-button')}>{selectableVersePlayButtonOptions[$__playButtonsFunctionality.verse].name}</button>
								</div>
								<p class={settingsDescriptionClasses}>Select what happens when you click on the play button for a {term('verse')}.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- wbw-autoscroll-setting -->
							<div id="wbw-autoscroll-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Auto-Scroll to Highlighted Words</span>
									<label class="inline-flex items-center cursor-pointer">
										<input type="checkbox" class="sr-only peer" bind:checked={$__audioSettings.wbwAutoScrollEnabled} on:change={() => updateSettings({ type: 'audioSettings', value: $__audioSettings })} data-rybbit-event="Toggle WBW Auto Scroll" />
										<div class={toggleBtnClasses}></div>
									</label>
								</div>
								<p class={settingsDescriptionClasses}>Automatically scroll to the highlighted words while listening to the recitation. This option only works with reciters that support word by word highlighting.</p>
							</div>

							<!-- miscellaneous settings -->
						{:else if activeSectionId === 'misc'}
							<!-- english-terminology-setting -->
							<div id="english-terminology-setting" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">English Terminologies</span>
									<label class="inline-flex items-center cursor-pointer">
										<input type="checkbox" value="" class="sr-only peer" checked={$__englishTerminology} on:click={(event) => updateSettings({ type: 'englishTerminology', value: event.target.checked })} data-rybbit-event="Toggle English Terminology" />
										<div class={toggleBtnClasses}></div>
									</label>
								</div>
								<p class={settingsDescriptionClasses}>Switch between the English and Arabic terminologies used on the website.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- non-dua-part-toggle -->
							<div id="non-dua-part-toggle" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Hide Non-{term('supplications')} Words</span>
									<label class="inline-flex items-center cursor-pointer">
										<input type="checkbox" value="" class="sr-only peer" checked={$__hideNonDuaPart} on:click={(event) => updateSettings({ type: 'hideNonDuaPart', value: event.target.checked })} data-rybbit-event="Toggle Non-Dua Words" />
										<div class={toggleBtnClasses}></div>
									</label>
								</div>
								<p class={settingsDescriptionClasses}>Show/hide the non-{term('supplications')} words in the {term('supplications')} page.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- show-morphology-on-word-click-toggle -->
							<div id="show-morphology-on-word-click" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Word Morphology On Click</span>
									<label class="inline-flex items-center cursor-pointer">
										<input type="checkbox" value="" class="sr-only peer" checked={$__wordMorphologyOnClick} on:click={(event) => updateSettings({ type: 'wordMorphologyOnClick', value: event.target.checked })} data-rybbit-event="Toggle Morphology On Click" />
										<div class={toggleBtnClasses}></div>
									</label>
								</div>
								<p class={settingsDescriptionClasses}>Show morphology on word click, instead of playing audio.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- import-export-settings -->
							<div id="import-export-settings" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Backup & Restore</span>

									<div class="flex flex-row space-x-2">
										<button class="text-sm space-x-2 {buttonClasses}" on:click={exportSettings}>
											<Export />
											<span>Backup</span>
										</button>
										<Tooltip arrow={false} type="light" placement="top" class="z-30 hidden md:block font-normal">Backup</Tooltip>

										<button class="text-sm space-x-2 {buttonClasses}" on:click={triggerImport}>
											<Import />
											<span>Restore</span>
										</button>
										<Tooltip arrow={false} type="light" placement="top" class="z-30 hidden md:block font-normal">Restore</Tooltip>
										<input type="file" bind:this={fileInput} on:change={handleFileChange} style="display: none;" />
									</div>
								</div>
								<p class={settingsDescriptionClasses}>Keep your settings safe. Export a copy now or import one to restore your preferences.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- copy-settings -->
							<div id="copy-settings" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Copy Settings</span>

									<button class="text-sm space-x-2 {buttonClasses}" on:click={copySettings}>
										<Copy />
										<span>Copy</span>
									</button>
									<Tooltip arrow={false} type="light" placement="top" class="z-30 hidden md:block font-normal">Copy</Tooltip>
								</div>
								<p class={settingsDescriptionClasses}>Copy your settings as JSON to the clipboard.</p>
							</div>

							<div class="border-b border-theme-accent/20 my-6"></div>

							<!-- reset-setting-button -->
							<div id="reset-setting-button" class={settingsBlockClasses}>
								<div class="flex flex-row justify-between items-center space-x-4">
									<span class="block">Reset Settings</span>
									<button class="text-sm space-x-2 {buttonClasses}" on:click={() => showConfirm('This action will permanently erase all locally stored data for this website, including settings, bookmarks, notes, offline files, and cache. This cannot be undone.', dialogTargetId, () => resetSettings())}>
										<ResetSettings />
										<span>Reset</span>
									</button>
									<Tooltip arrow={false} type="light" placement="top" class="z-30 hidden md:block font-normal">Reset</Tooltip>
								</div>
								<p class={settingsDescriptionClasses}>Resets the website to a clean state by removing all saved settings, bookmarks, notes, offline data, and cached files from this device.</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</Modal>
