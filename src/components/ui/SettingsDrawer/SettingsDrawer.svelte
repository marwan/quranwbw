<script>
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
	import Drawer from '$ui/FlowbiteSvelte/drawer/Drawer.svelte';
	import Range from '$ui/FlowbiteSvelte/forms/Range.svelte';
	import CloseButton from '$ui/FlowbiteSvelte/utils/CloseButton.svelte';
	import ResetSettings from '$svgs/ResetSettings.svelte';

	import {
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
		__settingsDrawerHidden,
		__wakeLockEnabled,
		__englishTerminology,
		__hideNonDuaPart,
		__playButtonsFunctionality,
		__wordMorphologyOnClick
	} from '$utils/stores';

	import { selectableDisplays, selectableFontTypes, selectableThemes, selectableWordTranslations, selectableWordTransliterations, selectableVerseTransliterations, selectableReciters, selectablePlaybackSpeeds, selectableTooltipOptions, selectableFontSizes, fontSizePresets, selectableVersePlayButtonOptions } from '$data/options';

	import { updateSettings } from '$utils/updateSettings';
	import { resetSettings } from '$utils/resetSettings';
	import { disabledClasses, buttonClasses, linkClasses } from '$data/commonClasses';
	import { selectableTafsirs } from '$data/selectableTafsirs';
	import { sineIn } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { term } from '$utils/terminologies';
	import { getTailwindBreakpoint } from '$utils/getTailwindBreakpoint';

	// Components mapping for individual settings
	const individualSettingsComponents = {
		'website-theme': WebsiteThemeSelector,
		'display-type': DisplayTypeSelector,
		'word-tooltip': WordTooltipSelector,
		'quran-font': QuranFontSelector,
		'word-translation': WordTranslationSelector,
		'word-transliteration': WordTransliterationSelector,
		'verse-translation': VerseTranslationSelector,
		'verse-transliteration': VerseTransliterationSelector,
		'verse-tafsir': VerseTafsirSelector,
		'verse-reciter': VerseReciterSelector,
		'verse-play-button': VersePlayButtonSelector
	};

	// Transition parameters for drawer
	const transitionParamsRight = {
		x: 320,
		duration: 200,
		easing: sineIn
	};

	// CSS classes
	const settingsBlockClasses = 'space-y-2 py-6';
	const selectorClasses = `w-32 border ${window.theme('border')} text-left rounded-3xl ${window.theme('input')} focus-within:ring-2 block p-2.5 truncate text-sm`;
	const settingsDescriptionClasses = 'mb-6 text-xs opacity-70';
	const toggleBtnClasses = `relative w-14 h-7 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[""] after:absolute after:top-0.5 after:start-[4px] after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${window.theme('toggle')}`;
	const rangeClasses = `appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full ${window.theme('slider')}`;

	let settingsDrawerOpacity = 'opacity-100';
	let settingsDrawerBackground = `${window.theme('bgMain')}`;
	let individualSettingsComponent;
	let mainSettingsScrollPos = 0;
	let showAllSettings = true;
	let showIndividualSetting = false;
	let totalVerseTransliterationsSelected = 0;
	let arabicWordSizeValue = fontSizePresets.indexOf(JSON.parse($__userSettings).displaySettings.fontSizes.arabicText);
	let wordTranlationTransliterationSizeValue = fontSizePresets.indexOf(JSON.parse($__userSettings).displaySettings.fontSizes.wordTranslationText);
	let verseTranlationTransliterationSizeValue = fontSizePresets.indexOf(JSON.parse($__userSettings).displaySettings.fontSizes.verseTranslationText);
	let playbackSpeedValue = JSON.parse($__userSettings).audioSettings.playbackSpeed;

	// Update settings when sliders are changed
	$: updateSettings({ type: 'arabicText', value: selectableFontSizes[arabicWordSizeValue].value });
	$: updateSettings({ type: 'wordTranslationText', value: selectableFontSizes[wordTranlationTransliterationSizeValue].value });
	$: updateSettings({ type: 'verseTranslationText', value: selectableFontSizes[verseTranlationTransliterationSizeValue].value });
	$: updateSettings({ type: 'playbackSpeed', value: playbackSpeedValue });

	// Calculate maximum allowed font size based on breakpoint
	$: maxFontSizeAllowed = ['default', 'sm'].includes(getTailwindBreakpoint()) ? 9 : 12;

	// Get keys
	$: wordTransliterationKey = Object.keys(selectableWordTransliterations).find((item) => selectableWordTransliterations[item].id === $__wordTransliteration);

	// Hide settings drawer and go back to main settings on certain conditions
	$: if ($__currentPage || $__settingsDrawerHidden) goBackToMainSettings();

	// Count total selected verse transliterations
	$: {
		totalVerseTransliterationsSelected = $__verseTranslations.filter((item) => selectableVerseTransliterations.includes(item)).length;
	}

	// Basic browser and platform detection
	const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
	const isMac = navigator.platform.toUpperCase().includes('MAC');
	const isIOS = /(iPhone|iPod|iPad)/i.test(navigator.platform);

	// Go back to main settings and restore scroll position
	function goBackToMainSettings() {
		showAllSettings = true;
		showIndividualSetting = false;

		// Scroll to last known position
		setTimeout(() => {
			try {
				document.getElementById('settings-drawer').scrollTop = mainSettingsScrollPos;
			} catch (error) {
				console.warn(error);
			}
		}, 0);
	}

	// Navigate to an individual setting component
	function gotoIndividualSetting(type) {
		mainSettingsScrollPos = document.getElementById('settings-drawer').scrollTop;
		showAllSettings = false;
		showIndividualSetting = true;
		individualSettingsComponent = individualSettingsComponents[type];

		// Scroll to the individual setting view
		setTimeout(() => {
			try {
				document.getElementById('individual-setting').scrollIntoView();
			} catch (error) {
				console.warn(error);
			}
		}, 0);
	}

	// Handle mouse enter event to show font size sliders
	function onMouseEnter(selector) {
		document.querySelectorAll('.fontSizeSliders').forEach((element) => {
			element.classList.remove(`${window.theme('bgMain')}`, 'opacity-100');
			element.classList.add('opacity-0', 'pointer-events-none');
		});

		settingsDrawerOpacity = 'opacity-0';
		settingsDrawerBackground = 'bg-transparent';
		document.querySelector('.settings-backdrop').classList.add('opacityyy-10');

		const selectedElement = document.getElementById(selector);
		selectedElement.classList.remove('opacity-0', 'pointer-events-none');
		selectedElement.classList.add('opacity-100', `${window.theme('bgMain')}`, 'rounded-3xl', 'shadow-lg', 'px-2');
	}

	// Handle mouse leave event to hide font size sliders
	function onMouseLeave() {
		document.querySelectorAll('.fontSizeSliders').forEach((element) => {
			element.classList.remove(`${window.theme('bgMain')}`, 'opacity-0', 'rounded-3xl', 'shadow-lg', 'px-2', 'pointer-events-none');
			element.classList.add('opacity-100');
		});

		settingsDrawerOpacity = 'opacity-100';
		settingsDrawerBackground = `${window.theme('bgMain')}`;
		document.querySelector('.settings-backdrop').classList.remove('opacityyy-10');
	}
</script>

<!-- settings drawer -->
<Drawer placement="right" transitionType="fly" transitionParams={transitionParamsRight} bind:hidden={$__settingsDrawerHidden} class="w-full md:w-1/2 lg:w-[430px] md:rounded-tl-3xl md:rounded-bl-3xl pt-0 {settingsDrawerBackground}" id="settings-drawer">
	<!-- all-settings -->
	{#if showAllSettings}
		<div id="all-settings">
			<div class="flex z-30 top-0 sticky {window.theme('bgMain')} border-b-2 {window.theme('border')} mb-4 {settingsDrawerOpacity}">
				<h5 id="drawer-label" class="inline-flex items-center my-4 text-3xl font-semibold">Settings</h5>
				<CloseButton on:click={() => ($__settingsDrawerHidden = true)} class="my-4 rounded-3xl" />
			</div>

			<!-- display-settings-block -->
			<div id="display-settings-block" class="py-5 {settingsDrawerOpacity}">
				<h3 class="block mb-2 font-medium text-xl">Display</h3>

				<div class="flex flex-col flex-wrap text-base">
					<!-- website-theme-setting -->
					<div id="website-theme-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">Theme</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('website-theme')}>{selectableThemes[$__websiteTheme].name}</button>
						</div>
						<p class={settingsDescriptionClasses}>An assortment of website themes to please your vision.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- display-type-setting -->
					<div id="display-type-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">Display Type</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('display-type')}>{selectableDisplays[$__displayType].displayName}</button>
						</div>
						<p class={settingsDescriptionClasses}>Different {term('verse')} layouts that you can choose from.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- word-tooltip-setting -->
					<div id="word-tooltip-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">Word Tooltip</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('word-tooltip')}>{selectableTooltipOptions[$__wordTooltip].name}</button>
						</div>
						<p class={settingsDescriptionClasses}>Choose what is displayed when you hover a word.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- word-translation-toggle-setting -->
					<div id="word-translation-toggle-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<span class="block">Word Translation</span>

							<label class="inline-flex items-center cursor-pointer {$__wordTransliterationEnabled === false && disabledClasses}">
								<input type="checkbox" value="" class="sr-only peer" checked={$__wordTranslationEnabled} on:click={(event) => updateSettings({ type: 'wordTranslationEnabled', value: event.target.checked })} />
								<div class={toggleBtnClasses}></div>
							</label>
						</div>
						<p class={settingsDescriptionClasses}>Toggle the word translation which is shown below the Arabic word.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- word-transliteration-toggle-setting -->
					<div id="word-transliteration-toggle-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
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
						<div class="border-b {window.theme('border')}"></div>

						<!-- prevent-sleep-toggle-setting -->
						<div id="prevent-sleep-toggle-setting" class={settingsBlockClasses}>
							<div class="flex flex-row justify-between items-center">
								<span class="block">Prevent Sleep</span>
								<label class="inline-flex items-center cursor-pointer">
									<input type="checkbox" value="" class="sr-only peer" checked={$__wakeLockEnabled} on:click={(event) => __wakeLockEnabled.set(event.target.checked)} data-umami-event="Toggle Prevent Sleep" />
									<div class={toggleBtnClasses}></div>
								</label>
							</div>
							<p class={settingsDescriptionClasses}>Enabling this option will prevent your screen from dimming or sleeping. Please note that you will need to manually enable this option for each session.</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- font-settings-block -->
			<div id="font-settings-block" class="py-5 border-t-2 {window.theme('border')}">
				<h3 class="block mb-2 font-medium text-xl {settingsDrawerOpacity}">Font</h3>

				<div class="flex flex-col flex-wrap text-base">
					<!-- quran-font-setting -->
					<div id="quran-font-setting" class="{settingsBlockClasses} {settingsDrawerOpacity}">
						<div class="flex flex-row justify-between items-center">
							<div class="block">Quran Font</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('quran-font')}>{selectableFontTypes[$__fontType].type} - {selectableFontTypes[$__fontType].font}</button>
						</div>
						<p class={settingsDescriptionClasses}>Multiple Quranic fonts to choose from depending on your mushaf or region preference.</p>

						<!-- note for Firefox users on Apple devices -->
						{#if [2, 3].includes($__fontType)}
							{#if (isIOS && isFirefox) || (isMac && isFirefox)}
								<p class={settingsDescriptionClasses}><span class="font-semibold">Important Note: </span>The Mushaf fonts you have selected may not be fully compatible with Firefox on Apple devices. For the best experience, please use Safari or Chrome.</p>
							{/if}
						{/if}
					</div>

					<div class="border-b {window.theme('border')} {settingsDrawerOpacity}"></div>

					<!-- arabic-word-size-setting -->
					<div id="arabic-word-size-setting" class="fontSizeSliders {settingsBlockClasses} {$__currentPage === 'mushaf' && disabledClasses}">
						<div class="flex flex-col justify-between space-y-4">
							<span class="block">Arabic Word Size ({selectableFontSizes[arabicWordSizeValue].value.split('-')[1]})</span>
							<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group" on:mouseenter={() => onMouseEnter('arabic-word-size-setting')} on:mouseleave={() => onMouseLeave()}>
								<Range min="1" max={maxFontSizeAllowed} bind:value={arabicWordSizeValue} class={rangeClasses} />
							</div>
						</div>
					</div>

					<div class="border-b {window.theme('border')} {settingsDrawerOpacity}"></div>

					<!-- word-translation-size-setting . -->
					<div id="word-translation-size-setting" class="fontSizeSliders {settingsBlockClasses} {$__currentPage === 'mushaf' && disabledClasses}">
						<div class="flex flex-col justify-between space-y-4">
							<span class="block">Word Translation/Transliteration Size ({selectableFontSizes[wordTranlationTransliterationSizeValue].value.split('-')[1]})</span>
							<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group" on:mouseenter={() => onMouseEnter('word-translation-size-setting')} on:mouseleave={() => onMouseLeave()}>
								<Range min="1" max={maxFontSizeAllowed} bind:value={wordTranlationTransliterationSizeValue} class={rangeClasses} />
							</div>
						</div>
					</div>

					<div class="border-b {window.theme('border')} {settingsDrawerOpacity}"></div>

					<!-- verse-translation-size-setting -->
					<div id="verse-translation-size-setting" class="fontSizeSliders {settingsBlockClasses} {$__currentPage === 'mushaf' && disabledClasses}">
						<div class="flex flex-col justify-between space-y-4">
							<span class="block">{term('verse')} Translation/Transliteration Size ({selectableFontSizes[verseTranlationTransliterationSizeValue].value.split('-')[1]})</span>
							<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group" on:mouseenter={() => onMouseEnter('verse-translation-size-setting')} on:mouseleave={() => onMouseLeave()}>
								<Range min="1" max={maxFontSizeAllowed} bind:value={verseTranlationTransliterationSizeValue} class={rangeClasses} />
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- translation-settings-block -->
			<div id="translation-settings-block" class="py-5 border-t-2 {window.theme('border')} {settingsDrawerOpacity}">
				<h3 class="block mb-2 font-medium text-xl">Translation, Transliteration & {term('tafsir')}</h3>

				<div class="flex flex-col flex-wrap text-base">
					<!-- word-translation-setting -->
					<div id="word-translation-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">Word Translation</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('word-translation')}>{selectableWordTranslations[$__wordTranslation].language}</button>
						</div>
						<p class={settingsDescriptionClasses}>Word translation which will be displaced under the Arabic word text.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- word-transliteration-setting -->
					<div id="word-transliteration-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">Word Transliteration</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('word-transliteration')}>{selectableWordTransliterations[wordTransliterationKey].language}</button>
						</div>
						<p class={settingsDescriptionClasses}>Word transliteration of various types.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- verse-translation-setting -->
					<div id="verse-translation-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">{term('verse')} Translation</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-translation')}>{$__verseTranslations.length - totalVerseTransliterationsSelected} selected</button>
						</div>
						<p class={settingsDescriptionClasses}>{term('verse')} translations from multiple authors and languages.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- verse-transliteration-setting -->
					<div id="verse-transliteration-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">{term('verse')} Transliteration</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-transliteration')}>{totalVerseTransliterationsSelected} selected</button>
						</div>
						<p class={settingsDescriptionClasses}>{term('verse')} transliteration of various types.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- tafsir-setting -->
					<div id="tafsir-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">{term('tafsir')}</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-tafsir')}>{selectableTafsirs[$__verseTafsir].name}</button>
						</div>
						<p class={settingsDescriptionClasses}>{term('verse')} {term('tafsir')} from multiple authors and languages.</p>
					</div>
				</div>
			</div>

			<!-- audio-settings-block -->
			<div id="audio-settings-block" class="py-5 border-t-2 {window.theme('border')} {settingsDrawerOpacity}">
				<h3 class="block mb-2 font-medium text-xl">Audio</h3>

				<div class="flex flex-col flex-wrap text-base">
					<!-- verse-reciter-setting -->
					<div id="verse-reciter-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">{term('verse')} Reciter</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-reciter')}>{selectableReciters[$__reciter].reciter}</button>
						</div>
						<p class={settingsDescriptionClasses}>The reciter's voice that will play when you choose to listen to an {term('verse')}.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- playback-speed-setting -->
					<div id="playback-speed-setting" class={settingsBlockClasses}>
						<div class="flex flex-col justify-between space-y-4">
							<span class="block">Playback Speed (x{selectablePlaybackSpeeds[playbackSpeedValue].speed})</span>
							<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group">
								<Range min="1" max="7" bind:value={playbackSpeedValue} class={rangeClasses} />
							</div>
						</div>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- verse-play-button-setting -->
					<div id="verse-play-button-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<div class="block">{term('verse')} Play Button</div>
							<button class={selectorClasses} on:click={() => gotoIndividualSetting('verse-play-button')}>{selectableVersePlayButtonOptions[$__playButtonsFunctionality.verse].name}</button>
						</div>
						<p class={settingsDescriptionClasses}>Select what happens when you click on the play button for a {term('verse')}.</p>
					</div>
				</div>
			</div>

			<!-- miscellaneous-settings-block -->
			<div id="miscellaneous-settings-block" class="py-5 border-t-2 {window.theme('border')} {settingsDrawerOpacity}">
				<h3 class="block mb-2 font-medium text-xl">Miscellaneous</h3>

				<div class="flex flex-col flex-wrap text-base">
					<!-- verse-reciter-setting -->
					<div id="verse-reciter-setting" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<span class="block">English Terminologies</span>
							<label class="inline-flex items-center cursor-pointer">
								<input type="checkbox" value="" class="sr-only peer" checked={$__englishTerminology} on:click={(event) => updateSettings({ type: 'englishTerminology', value: event.target.checked })} data-umami-event="Toggle English Terminology" />
								<div class={toggleBtnClasses}></div>
							</label>
						</div>
						<p class={settingsDescriptionClasses}>Switch between the English and Arabic terminologies used on the website.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- non-dua-part-toggle -->
					<div id="non-dua-part-toggle" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<span class="block">Hide Non-{term('supplications')} Words</span>
							<label class="inline-flex items-center cursor-pointer">
								<input type="checkbox" value="" class="sr-only peer" checked={$__hideNonDuaPart} on:click={(event) => updateSettings({ type: 'hideNonDuaPart', value: event.target.checked })} data-umami-event="Toggle Non-Dua Words" />
								<div class={toggleBtnClasses}></div>
							</label>
						</div>
						<p class={settingsDescriptionClasses}>Show/hide the non-{term('supplications')} words in the {term('supplications')} page.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- show-morphology-on-word-click-toggle -->
					<div id="show-morphology-on-word-click" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<span class="block">Word Morphology On Click</span>
							<label class="inline-flex items-center cursor-pointer">
								<input type="checkbox" value="" class="sr-only peer" checked={$__wordMorphologyOnClick} on:click={(event) => updateSettings({ type: 'wordMorphologyOnClick', value: event.target.checked })} data-umami-event="Toggle Morphology On Click" />
								<div class={toggleBtnClasses}></div>
							</label>
						</div>
						<p class={settingsDescriptionClasses}>Show morphology on word click, instead of playing audio.</p>
					</div>

					<div class="border-b {window.theme('border')}"></div>

					<!-- reset-setting-button -->
					<div id="reset-setting-button" class={settingsBlockClasses}>
						<div class="flex flex-row justify-between items-center">
							<span class="block">Reset Settings</span>
							<button
								on:click={() => {
									const userResponse = confirm('Are you sure you want to reset settings? This action cannot be reversed.');
									if (userResponse) {
										resetSettings();
									}
								}}
								class="text-sm {buttonClasses}"
							>
								<ResetSettings />
							</button>
						</div>
						<p class={settingsDescriptionClasses}>Reset all website settings to default without affecting your bookmarks or notes.</p>
					</div>
				</div>
			</div>

			<!-- website build version & timestamp -->
			<div class="flex flex-col justify-center border-t {window.theme('border')} py-6 space-y-4 text-center {settingsDrawerOpacity}">
				<!-- svelte-ignore missing-declaration -->
				<a class="{linkClasses} text-xs" target="_blank" href="https://github.com/marwan/quranwbw/commit/{__APP_VERSION__.split(' ')[0]}">Build {__APP_VERSION__}</a>
			</div>
		</div>
	{/if}

	<!-- individual-setting -->
	{#if showIndividualSetting}
		<div id="individual-setting" transition:fly={{ duration: 150, x: 0, easing: sineIn }}>
			<div class="flex z-30 top-0 sticky {window.theme('bgMain')} border-b-2 {window.theme('border')} mb-4">
				<button id="drawer-label" class="inline-flex items-center my-4 text-3xl font-semibold" on:click={() => goBackToMainSettings()}>← Back</button>
				<CloseButton on:click={() => ($__settingsDrawerHidden = true)} class="my-4 rounded-3xl" />
			</div>

			<svelte:component this={individualSettingsComponent} />
		</div>
	{/if}
</Drawer>
