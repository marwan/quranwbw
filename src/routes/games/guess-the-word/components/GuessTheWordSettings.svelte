<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Select from '$ui/FlowbiteSvelte/forms/Select.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { selectableWordTranslations } from '$data/options';
	import { buttonClasses, disabledClasses, selectedRadioOrCheckboxClasses } from '$data/commonClasses';
	import { getModalTransition } from '$utils/getModalTransition';
	import { compareAyahs, parseAyahKey } from '../utils/guessTheWordOptions';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let wordTranslation = 1;
	export let range = null;
	// Chapter of the ayah on screen, used to suggest a range when there is none yet.
	export let currentChapter = 1;

	const dispatch = createEventDispatcher();
	const radioClasses = 'inline-flex justify-between items-center py-2 px-4 w-full bg-theme-bg rounded-lg border-2 border-theme-accent/20 cursor-pointer peer-checked:border-2 peer-checked:border-theme-accent hover:bg-theme-accent/5';
	const fieldClasses = 'bg-theme-bg text-theme-text';

	const languageItems = Object.values(selectableWordTranslations)
		.map(({ id, language }) => ({ value: id, name: language }))
		.sort((a, b) => a.name.localeCompare(b.name));
	const chapterItems = Array.from({ length: 114 }, (_, index) => ({ value: index + 1, name: `${index + 1}. ${quranMetaData[index + 1].transliteration}` }));
	const versesIn = (chapter) => Array.from({ length: quranMetaData[chapter].verses }, (_, index) => ({ value: index + 1, name: String(index + 1) }));

	// Edits stay in a draft until Start, so closing the window changes nothing.
	let draftLanguage;
	let mode;
	let fromChapter, fromVerse, toChapter, toVerse;
	// One block, so the reset is checked before `wasOpen` is updated (separate statements get reordered).
	let wasOpen = false;
	$: {
		if (open && !wasOpen) resetDraft();
		wasOpen = open;
	}

	function resetDraft() {
		draftLanguage = wordTranslation;
		mode = range ? 'range' : 'whole';
		const chapter = range?.from.chapter ?? currentChapter;
		fromChapter = chapter;
		fromVerse = range?.from.verse ?? 1;
		toChapter = range?.to.chapter ?? chapter;
		toVerse = range?.to.verse ?? quranMetaData[chapter].verses;
	}

	// Keep each ayah number inside its surah when the surah changes.
	$: if (fromChapter && fromVerse > quranMetaData[fromChapter].verses) fromVerse = quranMetaData[fromChapter].verses;
	$: if (toChapter && toVerse > quranMetaData[toChapter].verses) toVerse = quranMetaData[toChapter].verses;

	$: draftFrom = parseAyahKey(`${fromChapter}:${fromVerse}`);
	$: draftTo = parseAyahKey(`${toChapter}:${toVerse}`);
	$: rangeError = mode === 'range' && draftFrom && draftTo && compareAyahs(draftFrom, draftTo) > 0 ? 'The last ayah must come after the first one.' : '';
	$: canStart = mode === 'whole' || (draftFrom && draftTo && !rangeError);

	function start() {
		if (!canStart) return;
		dispatch('apply', { wordTranslation: Number(draftLanguage), range: mode === 'range' ? { from: draftFrom, to: draftTo } : null });
		open = false;
	}
</script>

<Modal id="guessTheWordSettings" bind:open transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl !theme max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" placement="center" position="bottom" outsideclose>
	<h3 class="mb-2 text-xl font-medium flex-shrink-0">Game settings</h3>

	<form class="flex flex-col min-h-0" on:submit|preventDefault={start}>
		<div class="flex-1 min-h-0 overflow-y-auto">
			<!-- word-by-word language -->
			<div class="flex flex-col space-y-3 py-4">
				<label for="game-language" class="text-sm">Word meanings in</label>
				<Select id="game-language" items={languageItems} bind:value={draftLanguage} placeholder="" class={fieldClasses} />
			</div>

			<!-- ayahs to practice -->
			<fieldset class="flex flex-col space-y-4 py-4 border-t border-theme-accent/20">
				<legend class="sr-only">Ayahs</legend>
				<span class="text-sm" aria-hidden="true">Ayahs</span>
				<div class="flex flex-row space-x-2">
					<div class="flex items-center">
						<Radio bind:group={mode} value="whole" custom>
							<div class="{radioClasses} {mode === 'whole' && selectedRadioOrCheckboxClasses}"><div class="w-full">Whole Quran</div></div>
						</Radio>
					</div>
					<div class="flex items-center">
						<Radio bind:group={mode} value="range" custom>
							<div class="{radioClasses} {mode === 'range' && selectedRadioOrCheckboxClasses}"><div class="w-full">Ayah range</div></div>
						</Radio>
					</div>
				</div>

				{#if mode === 'range'}
					<div class="grid grid-cols-[auto_minmax(0,1fr)_5.5rem] items-center gap-x-2 gap-y-3">
						<label for="range-from-chapter" class="text-sm">From</label>
						<Select id="range-from-chapter" aria-label="First surah" items={chapterItems} bind:value={fromChapter} placeholder="" class={fieldClasses} />
						<Select id="range-from-verse" aria-label="First ayah" items={versesIn(fromChapter)} bind:value={fromVerse} placeholder="" class={fieldClasses} />

						<label for="range-to-chapter" class="text-sm">Till</label>
						<Select id="range-to-chapter" aria-label="Last surah" items={chapterItems} bind:value={toChapter} placeholder="" class={fieldClasses} />
						<Select id="range-to-verse" aria-label="Last ayah" items={versesIn(toChapter)} bind:value={toVerse} placeholder="" class={fieldClasses} />
					</div>
					{#if rangeError}
						<p class="text-xs" role="alert">{rangeError}</p>
					{:else}
						<p class="text-xs opacity-70">The ayahs are played in order, then start over from the first one.</p>
					{/if}
				{:else}
					<p class="text-xs opacity-70">Ayahs from the whole Quran, in random order.</p>
				{/if}
			</fieldset>
		</div>

		<button type="submit" class="mt-4 w-full flex-shrink-0 {buttonClasses} {!canStart && disabledClasses}" disabled={!canStart}>Start</button>
	</form>
</Modal>
