<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import SingleArabicVerse from '$display/verses/SingleArabicVerse.svelte';
	import { errorLoadingDataMessage } from '$data/websiteSettings';
	import { quranMetaData } from '$data/quranMeta';
	import { __tafsirModalVisible, __verseKey, __verseTafsir } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { selectableTafsirs } from '$data/selectableTafsirs';
	import { term } from '$utils/terminologies';

	let tafsirData;

	// URLs for fetching Tafsir data
	const tafsirUrls = {
		1: 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir',
		2: 'https://static.quranwbw.com/data/v4/tafsirs'
	};

	// Reactive variables for selected Tafsir and verse details
	$: selectedTafirId = $__verseTafsir || 30;
	$: chapter = Number($__verseKey.split(':')[0]);
	$: verse = Number($__verseKey.split(':')[1]);

	// Load Tafsir data when the modal is visible
	$: {
		if ($__tafsirModalVisible) {
			tafsirData = loadTafsirData();
		}
	}

	// Function to load Tafsir data
	async function loadTafsirData() {
		try {
			const selectedTafsir = selectableTafsirs[selectedTafirId];
			const response = await fetch(`${tafsirUrls[selectedTafsir.url]}/${selectedTafsir.slug}/${chapter}.json`);
			const data = await response.json();
			return data.ayahs;
		} catch (error) {
			console.error(errorLoadingDataMessage);
			return [];
		}
	}

	// CSS classes for Tafsir text based on selected Tafsir language
	$: tafsirTextClasses = `
		flex flex-col space-y-4
		${['Arabic', 'Urdu'].includes(selectableTafsirs[selectedTafirId].language) && 'direction-rtl text-lg'}
		${selectableTafsirs[selectedTafirId].font}
	`;

	// Scroll to top if verse changes
	$: {
		if ($__tafsirModalVisible && verse) {
			try {
				const tafsirModal = document.getElementById('tafsirModal');
				if (tafsirModal) {
					tafsirModal.getElementsByTagName('div')[1].scrollTop = 0;
				}
			} catch (error) {
				// Ignore errors
				console.error(error);
			}
		}
	}
</script>

<Modal
	bind:open={$__tafsirModalVisible}
	title="{quranMetaData[chapter].transliteration}, {chapter}:{verse}"
	id="tafsirModal"
	class="!rounded-b-none md:!rounded-3xl"
	bodyClass="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain border {window.theme('border')}"
	headerClass="flex justify-between items-center p-6 rounded-t-3xl"
	classFooter="rounded-b-3xl flex flex-row justify-between"
	size="lg"
	position="bottom"
	center
	outsideclose
>
	<div class="flex flex-col space-y-4">
		{#key verse}
			<div class="py-4">
				<SingleArabicVerse key="{chapter}:{verse}" />
			</div>
		{/key}

		{#await tafsirData}
			<Spinner />
		{:then tafsirData}
			<div class="text-sm flex flex-col space-y-6">
				<div class="flex flex-col space-y-4">
					<div class={tafsirTextClasses}>
						{#each Object.entries(tafsirData) as [id, tafsir]}
							{#if tafsir.surah === chapter && tafsir.ayah === verse}
								{@html tafsir.text.replace(/[\n]/g, '<br /><br />')}
							{/if}
						{/each}
					</div>
				</div>
			</div>
		{:catch error}
			<p>{errorLoadingDataMessage}</p>
		{/await}
	</div>

	<svelte:fragment slot="footer">
		<div class="grid grid-cols-2 gap-4 w-full">
			<button class="text-sm {buttonClasses} {verse > 1 ? 'visible' : 'invisible'} w-fit justify-self-start" on:click={() => (verse = verse - 1)}>Previous {term('verse')}</button>
			<button class="text-sm {buttonClasses} {verse < quranMetaData[chapter].verses ? 'visible' : 'invisible'} w-fit justify-self-end" on:click={() => (verse = verse + 1)}>Next {term('verse')}</button>
		</div>
	</svelte:fragment>
</Modal>
