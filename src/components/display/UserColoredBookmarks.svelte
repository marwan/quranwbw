<script>
	import ColoredBookmarkCard from '$display/ColoredBookmarkCard.svelte';
	import ScrollableFadeContainer from '$display/ScrollableFadeContainer.svelte';
	import { __userColoredBookmarks, __websiteTheme } from '$utils/stores';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { term } from '$utils/terminologies';
	import { COLOR_TOKENS, isDarkTheme } from '$utils/coloredBookmarks';
	import { isValidVerseKey } from '$utils/validateKey';
	import { onMount } from 'svelte';

	export let cardGridClasses;
	export let cardInnerClasses;

	let fullQuranTextData = null;
	let forceCloseDropdowns = 0;

	$: isDark = isDarkTheme($__websiteTheme);

	// Derived grouping — reactive on $__userColoredBookmarks
	$: coloredMap = $__userColoredBookmarks ?? {};
	$: {
		// trigger fetch when there is at least one colored bookmark
		const hasAny = Object.keys(coloredMap).length > 0;
		if (hasAny && !fullQuranTextData) loadQuranData();
	}

	$: byColor = (() => {
		const result = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
		for (const [k, v] of Object.entries(coloredMap)) {
			const n = Number(v);
			if (!isValidVerseKey(k)) continue;
			if (!(n >= 1 && n <= 8)) continue;
			result[n].push(k);
		}
		const cmp = (a, b) => {
			const [ca, va] = a.split(':').map(Number);
			const [cb, vb] = b.split(':').map(Number);
			if (ca !== cb) return ca - cb;
			return va - vb;
		};
		for (let i = 1; i <= 8; i++) result[i].sort(cmp);
		return result;
	})();

	$: totalColored = Object.keys(coloredMap).filter((k) => {
		const v = Number(coloredMap[k]);
		return isValidVerseKey(k) && v >= 1 && v <= 8;
	}).length;

	$: isEmpty = totalColored === 0;

	async function loadQuranData() {
		try {
			fullQuranTextData = await fetchAndCacheJson(cdnStaticDataUrls.fullQuranUthmani, 'other');
		} catch (error) {
			console.warn(error);
		}
	}

	function handleScroll() {
		forceCloseDropdowns += 1;
	}

	const orderedIds = [1, 2, 3, 4, 5, 6, 7, 8];

	// Accordion expanded state — persisted locally, default collapsed for all
	const STORAGE_KEY = 'coloredBookmarksAccordionExpanded';
	function loadExpanded() {
		try {
			if (typeof localStorage === 'undefined') return {};
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return {};
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
		} catch (e) {
			void e;
		}
		return {};
	}
	function saveExpanded(map) {
		try {
			if (typeof localStorage === 'undefined') return;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
		} catch (e) {
			void e;
		}
	}

	let expanded = loadExpanded();

	// Ensure expanded keys are booleans 1..8
	$: isExpanded = (id) => !!expanded[id];

	function toggleExpanded(id) {
		const next = { ...expanded, [id]: !expanded[id] };
		expanded = next;
		saveExpanded(next);
	}

	function handleHeaderKeydown(event, id) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleExpanded(id);
		}
	}

	// Initialize defaults if no saved state: default collapsed for all (verses hidden until expanded)
	// We keep collapsed even for colors with entries to satisfy "hidden until expanded".
	// If user has never interacted, expanded stays {} (all false). No auto-expand.
	onMount(() => {
		// re-load in case SSR had empty and client has stored value
		const stored = loadExpanded();
		if (Object.keys(stored).length > 0) expanded = stored;
	});
</script>

<ScrollableFadeContainer containerId="colored-bookmark-cards" onScrollAction={handleScroll}>
	{#if isEmpty}
		<div class="flex flex-col justify-start text-xs md:text-sm opacity-70 px-2 space-y-2 mb-2" role="status" aria-live="polite">
			<span class="leading-relaxed">
				No colored bookmarks yet. Open a {term('verse')}’s ⋮ menu → <span class="font-semibold">Colored Bookmark</span> to tint {term('verses')} for study.
			</span>
		</div>
	{/if}
	<div class="flex flex-col space-y-2">
		{#each orderedIds as id}
			{@const token = COLOR_TOKENS[id]}
			{@const verses = byColor[id]}
			{@const count = verses.length}
			{@const accentHex = isDark ? token.darkHex : token.lightHex}
			<section aria-labelledby="colored-section-{id}" class="border-b border-theme-accent/10 last:border-b-0">
				<h3 class="m-0">
					<button
						id="colored-section-{id}"
						type="button"
						class="flex w-full items-center gap-2 py-2.5 px-1 text-left sticky top-0 bg-theme-bg/90 backdrop-blur z-[1] hover:bg-theme-accent/5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg"
						aria-expanded={isExpanded(id)}
						aria-controls="colored-panel-{id}"
						on:click={() => toggleExpanded(id)}
						on:keydown={(e) => handleHeaderKeydown(e, id)}
					>
						<span class="w-3 h-3 rounded-full border border-theme-accent/20 shrink-0" style="background-color: {accentHex}" aria-hidden="true"></span>
						<span class="text-xs font-semibold flex-1">{token.name}</span>
						<span class="text-xs opacity-60">({count})</span>
						<svg
							class="w-4 h-4 opacity-60 transition-transform duration-200 shrink-0 {isExpanded(id) ? 'rotate-180' : ''}"
							aria-hidden="true"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
				</h3>

				<div
					id="colored-panel-{id}"
					role="region"
					aria-labelledby="colored-section-{id}"
					class="{isExpanded(id) ? 'block' : 'hidden'} mt-1 pb-2"
				>
					{#if count === 0}
						<div class="text-xs opacity-50 px-1 py-1 opacity-40">No verses in {token.name}</div>
					{:else}
						<div class="{cardGridClasses} grid-cols-2 md:!grid-cols-4 mt-1">
							{#each verses as bookmark (bookmark)}
								<ColoredBookmarkCard {bookmark} {fullQuranTextData} {cardInnerClasses} forceClose={forceCloseDropdowns} colorId={id} />
							{/each}
						</div>
					{/if}
				</div>
			</section>
		{/each}
	</div>
</ScrollableFadeContainer>
