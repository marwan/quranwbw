<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import Input from '$ui/FlowbiteSvelte/forms/Input.svelte';
	import Search from '$svgs/Search.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { buttonClasses, disabledClasses, selectedRadioOrCheckboxClasses } from '$data/commonClasses';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { compareAyahs, gameWordTranslations, parseAyahKey } from '../utils/guessTheWordOptions';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let wordTranslation = 1;
	export let range = null;
	// Chapter of the ayah on screen, used to suggest a range when there is none yet.
	export let currentChapter = 1;

	const dispatch = createEventDispatcher();

	// CSS classes for radio buttons and dropdown items (same as the audio modal)
	const radioClasses = 'inline-flex justify-between items-center py-2 px-4 w-full bg-theme-bg rounded-lg border-2 border-theme-accent/20 cursor-pointer peer-checked:border-2 peer-checked:border-theme-accent hover:bg-theme-accent/5';
	const dropdownItemClasses = 'flex flex-row items-center space-x-2 font-normal rounded-3xl hover:bg-theme-accent/5';

	// Edits stay in a draft until Start, so closing the window changes nothing.
	let draftLanguage;
	let mode;
	let fromChapter, fromVerse, toChapter, toVerse;

	// Open state and search text of each dropdown
	let fromChapterDropdownOpen = false;
	let fromVerseDropdownOpen = false;
	let toChapterDropdownOpen = false;
	let toVerseDropdownOpen = false;
	let fromChapterSearch = '';
	let fromVerseSearch = '';
	let toChapterSearch = '';
	let toVerseSearch = '';

	// One block, so the reset is checked before `wasOpen` is updated (separate statements get reordered).
	let wasOpen = false;
	$: {
		if (open && !wasOpen) resetDraft();
		wasOpen = open;
	}

	// Fills the draft from the current settings every time the modal opens
	function resetDraft() {
		draftLanguage = wordTranslation;
		mode = range ? 'range' : 'whole';
		const chapter = range?.from.chapter ?? currentChapter;
		fromChapter = chapter;
		fromVerse = range?.from.verse ?? 1;
		toChapter = range?.to.chapter ?? chapter;
		toVerse = range?.to.verse ?? quranMetaData[chapter].verses;
		fromChapterSearch = fromVerseSearch = toChapterSearch = toVerseSearch = '';
	}

	// List of whole numbers from first to last, e.g. numbersBetween(3, 5) gives [3, 4, 5]
	function numbersBetween(first, last) {
		return Array.from({ length: Math.max(last - first + 1, 0) }, (_, index) => first + index);
	}

	// Chapter label shown in buttons and lists, e.g. "2. Al-Baqarah"
	function chapterName(chapter) {
		return `${chapter}. ${quranMetaData[chapter].transliteration}`;
	}

	// Chapters from `first` to 114 that match the search text (by number or name)
	function chaptersMatching(first, search) {
		const text = search.trim().toLowerCase();
		return numbersBetween(first, 114).filter((chapter) => chapterName(chapter).toLowerCase().includes(text));
	}

	// Verses from `first` to the end of the chapter that match the search text
	function versesMatching(first, chapter, search) {
		return numbersBetween(first, quranMetaData[chapter].verses).filter((verse) => String(verse).includes(search.trim()));
	}

	// If "from" ended up after "till", move "till" up to "from" so the range is never backwards
	function keepRangeValid() {
		if (compareAyahs({ chapter: fromChapter, verse: fromVerse }, { chapter: toChapter, verse: toVerse }) > 0) {
			toChapter = fromChapter;
			toVerse = fromVerse;
		}
	}

	// Picking a new "from" chapter starts at its first verse
	function selectFromChapter(chapter) {
		fromChapter = chapter;
		fromVerse = 1;
		fromChapterDropdownOpen = false;
		fromChapterSearch = '';
		keepRangeValid();
	}

	function selectFromVerse(verse) {
		fromVerse = verse;
		fromVerseDropdownOpen = false;
		fromVerseSearch = '';
		keepRangeValid();
	}

	// Picking a new "till" chapter ends at its last verse
	function selectToChapter(chapter) {
		toChapter = chapter;
		toVerse = quranMetaData[chapter].verses;
		toChapterDropdownOpen = false;
		toChapterSearch = '';
	}

	function selectToVerse(verse) {
		toVerse = verse;
		toVerseDropdownOpen = false;
		toVerseSearch = '';
	}

	$: draftFrom = parseAyahKey(`${fromChapter}:${fromVerse}`);
	$: draftTo = parseAyahKey(`${toChapter}:${toVerse}`);
	// Start is only allowed for the whole Quran, or for a valid range that does not go backwards
	$: canStart = mode === 'whole' || (draftFrom && draftTo && compareAyahs(draftFrom, draftTo) <= 0);

	// Sends the chosen settings to the parent and closes the modal
	function start() {
		if (!canStart) return;
		dispatch('apply', { wordTranslation: Number(draftLanguage), range: mode === 'range' ? { from: draftFrom, to: draftTo } : null });
		open = false;
	}
</script>

<Modal id="guessTheWordSettings" bind:open transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl !theme max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" placement="center" position="bottom" outsideclose>
	<h3 class="mb-2 text-xl font-medium flex-shrink-0">Game Settings</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<div class="flex flex-col">
			<!-- word-by-word language options -->
			<div class="flex flex-col space-y-4 py-4">
				<span class="text-sm">Language</span>
				<div class="flex flex-row space-x-2">
					{#each gameWordTranslations as { id, language }}
						<div class="flex items-center">
							<Radio bind:group={draftLanguage} value={id} custom>
								<div class="{radioClasses} {draftLanguage === id && selectedRadioOrCheckboxClasses}">
									<div class="w-full">{language}</div>
								</div>
							</Radio>
						</div>
					{/each}
				</div>
			</div>

			<!-- range options -->
			<div class="flex flex-col space-y-4 py-4 border-t border-theme-accent/20">
				<span class="text-sm">Range</span>
				<div class="flex flex-row space-x-2">
					<!-- whole quran -->
					<div class="flex items-center min-w-fit">
						<Radio bind:group={mode} value="whole" custom>
							<div class="{radioClasses} {mode === 'whole' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">Whole Quran</div>
							</div>
						</Radio>
					</div>
					<!-- custom range -->
					<div class="flex items-center min-w-fit">
						<Radio bind:group={mode} value="range" custom>
							<div class="{radioClasses} {mode === 'range' && selectedRadioOrCheckboxClasses}">
								<div class="w-full">Custom</div>
							</div>
						</Radio>
					</div>
				</div>

				{#if mode === 'range'}
					<!-- from/till options -->
					<div class="flex flex-col space-y-3">
						<!-- from -->
						<div class="grid grid-cols-[2.5rem_minmax(0,7fr)_minmax(0,3fr)] items-center gap-x-2">
							<span class="w-10 text-sm">From</span>

							<!-- from chapter dropdown -->
							<div class="min-w-0">
								<button class="{buttonClasses} w-full !justify-start text-left text-sm truncate">{chapterName(fromChapter)}</button>
								<Dropdown bind:open={fromChapterDropdownOpen} class="w-max">
									<!-- sticky search box -->
									<div class="p-2 sticky top-0 z-10">
										<Input type="text" bind:value={fromChapterSearch} autocomplete="off" placeholder="{term('chapter')} name or #" size="md" class="bg-transparent rounded-3xl px-4 w-48 placeholder:text-theme-accent/50">
											<Search slot="left" size={6} classes="pt-1 {fromChapterSearch.length > 0 && 'hidden'}" />
										</Input>
									</div>
									<!-- scrollable list -->
									<div class="max-h-52 overflow-y-auto my-2 px-2">
										{#each chaptersMatching(1, fromChapterSearch) as chapter}
											<DropdownItem class={dropdownItemClasses} on:click={() => selectFromChapter(chapter)}>{chapterName(chapter)}</DropdownItem>
										{/each}
									</div>
								</Dropdown>
							</div>

							<!-- from verse dropdown -->
							<div class="min-w-0">
								<button class="{buttonClasses} w-full text-sm truncate">{term('verse')} {fromVerse}</button>
								<Dropdown bind:open={fromVerseDropdownOpen} class="w-max">
									<div class="p-2 sticky top-0 z-10">
										<Input type="text" inputmode="numeric" bind:value={fromVerseSearch} autocomplete="off" placeholder="{term('verse')} #" size="md" class="bg-transparent rounded-3xl px-4 w-32 placeholder:text-theme-accent/50">
											<Search slot="left" size={6} classes="pt-1 {fromVerseSearch.length > 0 && 'hidden'}" />
										</Input>
									</div>
									<div class="max-h-52 overflow-y-auto my-2 px-2">
										{#each versesMatching(1, fromChapter, fromVerseSearch) as verse}
											<DropdownItem class={dropdownItemClasses} on:click={() => selectFromVerse(verse)}>{term('verse')} {verse}</DropdownItem>
										{/each}
									</div>
								</Dropdown>
							</div>
						</div>

						<!-- till (only offers ayahs that come after "from") -->
						<div class="grid grid-cols-[2.5rem_minmax(0,7fr)_minmax(0,3fr)] items-center gap-x-2">
							<span class="w-10 text-sm">Till</span>

							<!-- till chapter dropdown -->
							<div class="min-w-0">
								<button class="{buttonClasses} w-full !justify-start text-left text-sm truncate">{chapterName(toChapter)}</button>
								<Dropdown bind:open={toChapterDropdownOpen} class="w-max">
									<div class="p-2 sticky top-0 z-10">
										<Input type="text" bind:value={toChapterSearch} autocomplete="off" placeholder="{term('chapter')} name or #" size="md" class="bg-transparent rounded-3xl px-4 w-48 placeholder:text-theme-accent/50">
											<Search slot="left" size={6} classes="pt-1 {toChapterSearch.length > 0 && 'hidden'}" />
										</Input>
									</div>
									<div class="max-h-52 overflow-y-auto my-2 px-2">
										{#each chaptersMatching(fromChapter, toChapterSearch) as chapter}
											<DropdownItem class={dropdownItemClasses} on:click={() => selectToChapter(chapter)}>{chapterName(chapter)}</DropdownItem>
										{/each}
									</div>
								</Dropdown>
							</div>

							<!-- till verse dropdown -->
							<div class="min-w-0">
								<button class="{buttonClasses} w-full text-sm truncate">{term('verse')} {toVerse}</button>
								<Dropdown bind:open={toVerseDropdownOpen} class="w-max">
									<div class="p-2 sticky top-0 z-10">
										<Input type="text" inputmode="numeric" bind:value={toVerseSearch} autocomplete="off" placeholder="{term('verse')} #" size="md" class="bg-transparent rounded-3xl px-4 w-32 placeholder:text-theme-accent/50">
											<Search slot="left" size={6} classes="pt-1 {toVerseSearch.length > 0 && 'hidden'}" />
										</Input>
									</div>
									<div class="max-h-52 overflow-y-auto my-2 px-2">
										<!-- inside the same chapter, only verses from the "from" verse onwards -->
										{#each versesMatching(toChapter === fromChapter ? fromVerse : 1, toChapter, toVerseSearch) as verse}
											<DropdownItem class={dropdownItemClasses} on:click={() => selectToVerse(verse)}>{term('verse')} {verse}</DropdownItem>
										{/each}
									</div>
								</Dropdown>
							</div>
						</div>
					</div>

					<span class="text-xs opacity-70">The {term('verse')}s are played in order, then start over from the first one.</span>
				{:else}
					<span class="text-xs opacity-70">{term('verse')}s from the whole Quran, in random order.</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="flex-shrink-0 mt-4">
		<button on:click={start} disabled={!canStart} class="w-full {buttonClasses} {!canStart && disabledClasses}">Start</button>
	</div>
</Modal>
