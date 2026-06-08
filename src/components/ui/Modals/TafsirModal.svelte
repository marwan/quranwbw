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
	const tafsirLogPrefix = '[tafsir-modal]';

	$: selectedTafsirId = $__verseTafsir || 30;
	$: selectedTafsir = selectableTafsirs[selectedTafsirId];
	$: [chapter, verse] = $__verseKey.split(':').map(Number);

	$: {
		if ($__tafsirModalVisible && selectedTafsir && chapter) {
			tafsirData = loadTafsirData(selectedTafsir, selectedTafsirId, chapter);
		}
	}

	// CSS classes for Tafsir text based on selected Tafsir language
	$: tafsirTextClasses = `
		flex flex-col space-y-4
		${['Arabic', 'Urdu'].includes(selectedTafsir.language) && 'direction-rtl text-lg'}
		${selectedTafsir.font}
	`;

	// Scroll to top if verse changes
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

	// Replaces each newline (\n) with a configurable number of <br /> tags for HTML rendering
	function formatTafsir(text) {
		const lineBreak = '<br />';
		const paragraphBreak = '<br /><br />';

		return String(text ?? '')
			.trim()
			.replace(/\r\n?/g, '\n')
			.replace(/\n[ \t]*\n+/g, paragraphBreak)
			.replace(/\n/g, lineBreak);
	}

	async function loadTafsirData(selectedTafsir, selectedTafsirId, chapter) {
		if (!selectedTafsir) {
			throw new Error(`Unknown tafsir selected: ${selectedTafsirId}`);
		}

		const baseUrl = tafsirDataUrls[selectedTafsir.url];

		if (!baseUrl) {
			throw new Error(`Missing tafsir data URL for provider ${selectedTafsir.url}`);
		}

		const url = `${baseUrl}/${selectedTafsir.slug}/${chapter}.json`;
		const context = {
			chapter,
			selectedTafsirId,
			tafsirName: selectedTafsir.name,
			slug: selectedTafsir.slug,
			url
		};

		console.info(`${tafsirLogPrefix} loading`, context);

		try {
			const data = await fetchAndCacheJson(url, 'tafsir');
			const ayahs = normalizeTafsirAyahs(data, context);

			console.info(`${tafsirLogPrefix} loaded`, {
				...context,
				responseShape: getTafsirResponseShape(data),
				ayahsCount: ayahs.length,
				firstAyahKeys: ayahs[0] && typeof ayahs[0] === 'object' ? Object.keys(ayahs[0]) : null
			});

			return { ayahs };
		} catch (error) {
			console.warn(`${tafsirLogPrefix} failed`, {
				...context,
				error
			});
			throw error;
		}
	}

	function normalizeTafsirAyahs(data, context) {
		if (Array.isArray(data)) {
			return data;
		}

		if (data && typeof data === 'object') {
			if (Array.isArray(data.ayahs)) {
				return data.ayahs;
			}

			if (data.ayahs && typeof data.ayahs === 'object') {
				return Object.values(data.ayahs);
			}
		}

		const responseShape = getTafsirResponseShape(data);
		console.warn(`${tafsirLogPrefix} unexpected response shape`, {
			...context,
			responseShape,
			data
		});

		throw new Error(`Unexpected tafsir response shape for ${context.tafsirName}. Expected an array or an object with ayahs, received ${responseShape.type}.`);
	}

	function getTafsirResponseShape(data) {
		if (Array.isArray(data)) {
			return {
				type: 'array',
				length: data.length,
				firstItemKeys: data[0] && typeof data[0] === 'object' ? Object.keys(data[0]) : null
			};
		}

		if (data && typeof data === 'object') {
			return {
				type: 'object',
				keys: Object.keys(data).slice(0, 10),
				ayahsType: Array.isArray(data.ayahs) ? 'array' : typeof data.ayahs,
				ayahsLength: Array.isArray(data.ayahs) ? data.ayahs.length : undefined
			};
		}

		return {
			type: typeof data,
			value: data
		};
	}

	function findTafsirForVerse(ayahs, chapter, verse) {
		return ayahs.find((tafsir) => Number(tafsir?.surah) === chapter && Number(tafsir?.ayah) === verse);
	}

	function createMissingTafsirError(chapter, verse) {
		return new Error(`No tafsir text found for ${chapter}:${verse} in ${selectedTafsir?.name || 'the selected tafsir'}.`);
	}
</script>

<Modal
	bind:open={$__tafsirModalVisible}
	title="{quranMetaData[chapter].transliteration}, {chapter}:{verse}"
	id="tafsirModal"
	class="!rounded-b-none md:!rounded-3xl"
	bodyClass="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain !border-t-0"
	headerClass="flex justify-between items-center p-6 rounded-t-3xl"
	classFooter="rounded-b-3xl flex flex-row justify-between !border-t-0"
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
							{#if tafsir}
								{#if tafsir.text}
									{@html formatTafsir(tafsir.text)}
								{:else}
									<ErrorLoadingData center="false" error={createMissingTafsirError(chapter, verse)} />
								{/if}
							{:else}
								<ErrorLoadingData center="false" error={createMissingTafsirError(chapter, verse)} />
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
