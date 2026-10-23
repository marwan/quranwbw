<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Range from '$ui/FlowbiteSvelte/forms/Range.svelte';
	import CloseButton from '$ui/FlowbiteSvelte/utils/CloseButton.svelte';
	import { __settingsModalVisible, __currentPage } from '$utils/stores';
	import { getModalTransition } from '$utils/getModalTransition';

	// CSS classes (same as the drawer)
	const settingsBlockClasses = 'space-y-2 py-6';
	const selectorClasses = 'w-32 border border-theme-accent/20 text-left rounded-3xl focus:border-theme-accent focus:ring-theme-accent focus-within:ring-2 block p-2.5 truncate text-sm';
	const settingsDescriptionClasses = 'mb-6 text-xs opacity-70';
	const toggleBtnClasses = 'relative w-14 h-7 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[""] after:absolute after:top-0.5 after:start-[4px] after:border after:rounded-full after:h-6 after:w-6 after:transition-all bg-theme-accent/15 after:bg-theme-bg after:border-theme-bg peer-checked:bg-theme-accent';
	const rangeClasses = 'appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full bg-theme-accent/15 [&::-webkit-slider-thumb]:!bg-theme-accent';

	// Placeholder sections and settings (type: toggle | select | range)
	const sections = [
		{
			id: 'display',
			name: 'Display',
			items: [
				{ id: 'theme', type: 'select', name: 'Theme', description: 'An assortment of website themes to please your vision.' },
				{ id: 'wideLayout', type: 'toggle', name: 'Wide Website Layout', description: 'Enable this to use a wider layout (extra large width). Best for larger screens.' }
			]
		},
		{
			id: 'font',
			name: 'Font',
			items: [
				{ id: 'quranFont', type: 'select', name: 'Quran Font', description: 'Multiple Quranic fonts to choose from depending on your mushaf or region preference.' },
				{ id: 'arabicSize', type: 'range', name: 'Arabic Word Size', min: 1, max: 12, description: 'Adjust the size of the Arabic words.' }
			]
		},
		{
			id: 'translation',
			name: 'Translation & Tafsir',
			items: [
				{ id: 'wordTranslation', type: 'select', name: 'Word Translation', description: 'Word translation which will be displayed under the Arabic word text.' },
				{ id: 'verseTranslation', type: 'select', name: 'Verse Translation', description: 'Verse translations from multiple authors and languages.' }
			]
		},
		{
			id: 'audio',
			name: 'Audio',
			items: [
				{ id: 'reciter', type: 'select', name: 'Verse Reciter', description: "The reciter's voice that will play when you choose to listen to a verse." },
				{ id: 'playbackSpeed', type: 'range', name: 'Playback Speed', min: 1, max: 7, description: 'Adjust how fast the recitation plays.' },
				{ id: 'autoScroll', type: 'toggle', name: 'Auto-Scroll to Highlighted Words', description: 'Automatically scroll to the highlighted words while listening to the recitation.' }
			]
		},
		{
			id: 'misc',
			name: 'Miscellaneous',
			items: [
				{ id: 'englishTerms', type: 'toggle', name: 'English Terminologies', description: 'Switch between the English and Arabic terminologies used on the website.' },
				{ id: 'morphologyOnClick', type: 'toggle', name: 'Word Morphology On Click', description: 'Show morphology on word click, instead of playing audio.' }
			]
		}
	];

	// Placeholder option list for the select sub-page
	const placeholderOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6'];

	// Placeholder values (not connected to real stores)
	let values = {
		theme: 'Option 1',
		quranFont: 'Option 1',
		wordTranslation: 'Option 1',
		verseTranslation: 'Option 1',
		reciter: 'Option 1',
		wideLayout: false,
		autoScroll: true,
		englishTerms: false,
		morphologyOnClick: false,
		arabicSize: 5,
		playbackSpeed: 4
	};

	let activeSectionId = sections[0].id;
	let mobileView = 'nav'; // 'nav' | 'content' (only matters below md)
	let individualSetting = null; // the select item currently open in the right pane
	let contentElement;

	$: activeSection = sections.find((section) => section.id === activeSectionId);

	// Close the modal whenever the page changes
	$: if ($__currentPage) $__settingsModalVisible = false;

	// Reset to the section list when the modal is closed
	$: if (!$__settingsModalVisible) {
		mobileView = 'nav';
		individualSetting = null;
	}

	// Always start at the top when the section or sub-page changes
	$: if (contentElement && (activeSectionId || individualSetting)) contentElement.scrollTop = 0;

	function selectSection(id) {
		activeSectionId = id;
		individualSetting = null;
		mobileView = 'content';
	}

	function selectOption(option) {
		values[individualSetting.id] = option;
		individualSetting = null;
	}
</script>

<Modal bind:open={$__settingsModalVisible} id="settingsModal" transitionParams={getModalTransition('bottom')} size="xl" class="!rounded-b-none md:!rounded-3xl h-[90vh] md:h-[600px] max-h-[90vh] flex flex-col" bodyClass="p-0 flex flex-col flex-1 min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<!-- header -->
	<div class="flex flex-row items-center justify-between flex-shrink-0 px-6 border-b-2 border-theme-accent/20">
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

		<CloseButton on:click={() => ($__settingsModalVisible = false)} class="rounded-3xl" />
	</div>

	<div class="flex flex-row flex-1 min-h-0">
		<!-- section nav (left) -->
		<nav class="{mobileView === 'content' ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-64 flex-shrink-0 md:border-r-2 border-theme-accent/20 overflow-y-auto p-4 space-y-1" aria-label="Settings sections">
			{#each sections as section}
				<button class="flex flex-row items-center justify-between w-full text-left text-base px-4 py-3 rounded-3xl border border-transparent hover:bg-theme-accent/5 {activeSectionId === section.id ? 'md:bg-theme-accent/15 md:font-medium' : ''}" aria-current={activeSectionId === section.id ? 'page' : undefined} on:click={() => selectSection(section.id)}>
					<span>{section.name}</span>
					<span class="md:hidden opacity-70" aria-hidden="true">›</span>
				</button>
			{/each}
		</nav>

		<!-- settings (right) -->
		<div bind:this={contentElement} class="{mobileView === 'nav' ? 'hidden' : 'flex'} md:flex flex-col flex-1 min-w-0 overflow-y-auto px-6 pb-6">
			{#if individualSetting}
				<!-- individual-setting (selector sub-page) -->
				<div id="individual-setting">
					<div class="flex z-30 top-0 sticky bg-theme-bg border-b-2 border-theme-accent/20 mb-4">
						<button class="inline-flex items-center my-4 text-xl font-semibold" on:click={() => (individualSetting = null)}>⟵ Back</button>
					</div>

					<h3 class="block mb-4 font-medium text-xl">{individualSetting.name}</h3>

					<div class="flex flex-col space-y-2">
						{#each placeholderOptions as option}
							<button class="text-left text-base p-3 rounded-3xl border {values[individualSetting.id] === option ? 'border-theme-accent bg-theme-accent/15' : 'border-theme-accent/20 hover:bg-theme-accent/5'}" on:click={() => selectOption(option)}>{option}</button>
						{/each}
					</div>
				</div>
			{:else}
				<!-- section settings -->
				<div id="{activeSection.id}-settings-block" class="py-5">
					<h3 class="hidden md:block mb-2 font-medium text-xl">{activeSection.name}</h3>

					<div class="flex flex-col flex-wrap text-base">
						{#each activeSection.items as item, index}
							{#if index > 0}
								<div class="border-b border-theme-accent/20"></div>
							{/if}

							<div id="{item.id}-setting" class={settingsBlockClasses}>
								{#if item.type === 'select'}
									<div class="flex flex-row justify-between items-center space-x-4">
										<div class="block">{item.name}</div>
										<button class={selectorClasses} on:click={() => (individualSetting = item)}>{values[item.id]}</button>
									</div>
								{:else if item.type === 'toggle'}
									<div class="flex flex-row justify-between items-center space-x-4">
										<span class="block">{item.name}</span>
										<label class="inline-flex items-center cursor-pointer">
											<input type="checkbox" class="sr-only peer" bind:checked={values[item.id]} />
											<div class={toggleBtnClasses}></div>
										</label>
									</div>
								{:else if item.type === 'range'}
									<div class="flex flex-col justify-between space-y-4">
										<span class="block">{item.name} ({values[item.id]})</span>
										<div class="flex flex-col space-y-2 rounded-3xl w-full" role="group">
											<Range min={item.min} max={item.max} bind:value={values[item.id]} class={rangeClasses} />
										</div>
									</div>
								{/if}

								<p class={settingsDescriptionClasses}>{item.description}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</Modal>
