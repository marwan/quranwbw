<script>
	import { onMount } from 'svelte';
	import { selectableThemes, selectableFontTypes } from '$data/options';
	import { __fontType } from '$utils/stores';
	import { isValidVerseKey } from '$utils/validateKey';

	// ---------------------------------------------------------------------------
	// This page only shows controls and one iframe per theme.
	// Each iframe loads the real site components (see ./frame/+page.svelte), so nothing here is copied from
	// app.html, app.css, WordsBlock, Bismillah, ChapterHeader, etc. Whatever changes there shows up here automatically.
	// ---------------------------------------------------------------------------

	// number of theme blocks shown side by side
	const columnCount = 1;

	// route of the single theme page that is loaded inside every iframe
	const frameRoute = '/dev/appearance-preview/frame';

	// returns a readable label for an entry of the options file, falls back to the id
	// (change the property names here if your options use different ones)
	const getLabel = (optionEntry, fallbackId) => optionEntry?.name ?? optionEntry?.title ?? optionEntry?.label ?? `#${fallbackId}`;

	// every theme, font type and display type defined in the options file, so new ones appear automatically
	const themeOptions = Object.entries(selectableThemes).filter(([, entry]) => entry);
	const fontTypeOptions = Object.entries(selectableFontTypes).filter(([, entry]) => entry);

	// the only two display types the preview needs
	const displayTypeOptions = [
		{ id: 1, label: 'Word By Word' },
		{ id: 2, label: 'Normal' }
	];

	// ---------------------------------------------------------------------------
	// State
	// ---------------------------------------------------------------------------

	// start with whatever the user currently has selected in the real app
	let fontType = Number($__fontType);
	let displayType = 1;

	// verse shown in every block, chapter 2 is the default because the real site skips the bismillah on chapter 1 and 9
	let verseKey = '2:1';
	let verseKeyInput = verseKey;
	let isVerseKeyInvalid = false;

	// height of each iframe, reported by the iframe itself
	let frameHeights = {};

	// ---------------------------------------------------------------------------
	// Iframe handling
	// ---------------------------------------------------------------------------

	// builds the iframe url for a theme, the iframe reads everything from the query string
	$: getFrameUrl = (themeId) =>
		`${frameRoute}?${new URLSearchParams({
			theme: themeId,
			fontType,
			displayType,
			verseKey,
			showWordTranslations: 1
		})}`;

	// applies the typed verse key when it is valid
	function applyVerseKey() {
		isVerseKeyInvalid = !isValidVerseKey(verseKeyInput);
		if (!isVerseKeyInvalid) verseKey = verseKeyInput;
	}

	// every iframe reports its content height so it can be sized without inner scrollbars
	function handleFrameMessage(event) {
		// only accept messages from our own origin
		if (event.origin !== window.location.origin) return;
		if (event.data?.type !== 'appearance-preview-height') return;

		frameHeights = { ...frameHeights, [event.data.themeId]: event.data.height };
	}

	onMount(() => {
		window.addEventListener('message', handleFrameMessage);
		return () => window.removeEventListener('message', handleFrameMessage);
	});
</script>

<div class="p-4 space-y-4">
	<!-- back to homepage -->
	<a href="/" class="inline-block text-sm underline">← Back to homepage</a>

	<!-- controls -->
	<div class="flex-col space-y-2 flex-wrap items-center gap-2 text-sm">
		<span class="font-semibold">Font type:</span>
		<div>
			{#each fontTypeOptions as [fontTypeId, fontTypeEntry]}
				<button class="px-3 py-1 m-1 rounded-lg border {fontType === Number(fontTypeId) ? 'bg-black text-white' : ''}" on:click={() => (fontType = Number(fontTypeId))}>{fontTypeId} · {getLabel(fontTypeEntry, fontTypeId)}</button>
			{/each}
		</div>
	</div>

	<div class="flex-col space-y-2 flex-wrap items-center gap-2 text-sm">
		<span class="font-semibold">Display:</span>
		<div>
			{#each displayTypeOptions as displayTypeOption}
				<button class="px-3 py-1 m-1 rounded-lg border {displayType === displayTypeOption.id ? 'bg-black text-white' : ''}" on:click={() => (displayType = displayTypeOption.id)}>{displayTypeOption.id} · {displayTypeOption.label}</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-4 text-sm">
		<label class="flex items-center gap-2">
			<span class="font-semibold">Verse:</span>
			<input type="text" class="border rounded-lg px-2 py-1 w-24" bind:value={verseKeyInput} on:change={applyVerseKey} />
		</label>
	</div>

	<!-- one iframe per theme -->
	<div class="grid gap-4" style="grid-template-columns: repeat({columnCount}, minmax(0, 1fr))">
		{#each themeOptions as [themeId, themeEntry] (themeId)}
			<div class="rounded-2xl border overflow-hidden">
				<div class="text-xs px-3 py-1 opacity-70">theme-{themeId} · {getLabel(themeEntry, themeId)}</div>

				<!-- lazy loading, because every iframe loads the whole app -->
				<iframe title="theme-{themeId}" src={getFrameUrl(themeId)} loading="lazy" class="w-full block" style="height: {frameHeights[themeId] ?? 400}px; border: 0;"></iframe>
			</div>
		{/each}
	</div>
</div>
