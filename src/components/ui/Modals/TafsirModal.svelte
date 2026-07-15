<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ArabicVerseWords from '$display/verses/ArabicVerseWords.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __tafsirModalVisible, __verseKey, __verseTafsir } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { selectableTafsirs } from '$data/selectableTafsirs';
	import { term } from '$utils/terminologies';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { tafsirDataUrls } from '$data/websiteSettings';

	let tafsirData;

	$: selectedTafsirId = $__verseTafsir || 30;
	$: selectedTafsir = selectableTafsirs[selectedTafsirId];
	$: [chapter, verse] = $__verseKey.split(':').map(Number);

	// Re-fetch when the modal opens or the chapter/tafsir selection changes
	$: if ($__tafsirModalVisible && selectedTafsir && chapter) {
		tafsirData = loadTafsirData(selectedTafsir, selectedTafsirId, chapter);
	}

	// CSS classes for tafsir text; RTL + larger font for Arabic/Urdu tafsirs
	$: tafsirTextClasses = `
		flex flex-col space-y-4
		${['Arabic', 'Urdu'].includes(selectedTafsir.language) && 'direction-rtl text-lg'}
		${selectedTafsir.font}
	`;

	// Scroll to top when navigating to a different verse
	$: if ($__tafsirModalVisible && verse) {
		try {
			const tafsirModal = document.getElementById('tafsirModal');
			if (tafsirModal) {
				tafsirModal.getElementsByTagName('div')[1].scrollTop = 0;
			}
		} catch (error) {
			console.warn(error);
		}
	}

	// Normalizes line breaks: blank lines become paragraph breaks, single newlines become <br />
	function formatTafsir(text) {
		return String(text ?? '')
			.trim()
			.replace(/\r\n?/g, '\n')
			.replace(/\n[ \t]*\n+/g, '<br /><br />')
			.replace(/\n/g, '<br />');
	}

	// Fetches the chapter JSON and returns a normalized { ayahs: [...] } object
	async function loadTafsirData(selectedTafsir, selectedTafsirId, chapter) {
		if (!selectedTafsir) {
			throw new Error(`Unknown tafsir selected: ${selectedTafsirId}`);
		}

		const baseUrl = tafsirDataUrls[selectedTafsir.url];

		if (!baseUrl) {
			throw new Error(`Missing tafsir data URL for provider: ${selectedTafsir.url}`);
		}

		const url = `${baseUrl}/${selectedTafsir.slug}/${chapter}.json`;
		const data = await fetchAndCacheJson(url, 'tafsir');

		return { ayahs: normalizeTafsirAyahs(data, selectedTafsir.name) };
	}

	// Supports both flat array and { ayahs: [...] } / { ayahs: {...} } response shapes
	function normalizeTafsirAyahs(data, tafsirName) {
		if (Array.isArray(data)) return data;

		if (data && typeof data === 'object') {
			if (Array.isArray(data.ayahs)) return data.ayahs;
			if (data.ayahs && typeof data.ayahs === 'object') return Object.values(data.ayahs);
		}

		throw new Error(`Unexpected response shape for tafsir: ${tafsirName}`);
	}

	// Returns the tafsir entry for the given chapter:verse, or undefined if not found
	function findTafsirForVerse(ayahs, chapter, verse) {
		return ayahs.find((item) => Number(item?.surah) === chapter && Number(item?.ayah) === verse);
	}
</script>

<Modal
	bind:open={$__tafsirModalVisible}
	title="{quranMetaData[chapter].transliteration}, {chapter}:{verse}"
	id="tafsirModal"
	class="rounded-b-none! md:rounded-3xl!"
	bodyClass="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain border-t-0!"
	headerClass="flex justify-between items-center p-6 rounded-t-3xl"
	classFooter="rounded-b-3xl flex flex-row justify-between border-t-0!"
	size="lg"
	position="bottom"
	center
	outsideclose
>
	<div class="flex flex-col space-y-4">
		{#key verse}
			{#await tafsirData}
				<Spinner inline={true} />
			{:then data}
				{@const tafsir = findTafsirForVerse(data.ayahs, chapter, verse)}
				<div class="py-4">
					<ArabicVerseWords key="{chapter}:{verse}" />
				</div>

				<div class="text-sm flex flex-col space-y-6">
					<div class="flex flex-col space-y-4">
						<div class={tafsirTextClasses}>
							{#if tafsir?.text}
								{@html formatTafsir(tafsir.text)}
							{:else}
								<ErrorLoadingData center="false" error={new Error(`No tafsir found for ${chapter}:${verse}`)} />
							{/if}
						</div>
					</div>
				</div>
			{:catch error}
				<ErrorLoadingData center="false" {error} />
			{/await}
		{/key}
	</div>

	<svelte:fragment slot="footer">
		{#key verse}
			{#await tafsirData then}
				<div class="grid grid-cols-2 gap-4 w-full">
					<button class="text-sm {buttonClasses} {verse > 1 ? 'visible' : 'invisible'} w-fit justify-self-start" on:click={() => (verse = verse - 1)}>Previous {term('verse')}</button>
					<button class="text-sm {buttonClasses} {verse < quranMetaData[chapter].verses ? 'visible' : 'invisible'} w-fit justify-self-end" on:click={() => (verse = verse + 1)}>Next {term('verse')}</button>
				</div>
			{/await}
		{/key}
	</svelte:fragment>
</Modal>
