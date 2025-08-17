<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import { staticEndpoint } from '$data/websiteSettings';
	import { __lexiconModalVisible, __wordRoot } from '$utils/stores';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';

	let lexiconData;

	$: {
		lexiconData = (async () => {
			// getting indexes file
			const indexesResponse = await fetch(`${staticEndpoint}/lexicon/indexes.json`);
			const indexesData = await indexesResponse.json();

			if (indexesData[$__wordRoot] === undefined) return 'No data for this word.';

			const lexiconFile = indexesData[$__wordRoot].file;
			const lexiconIndex = indexesData[$__wordRoot].index;

			// getting lexicon data for the root
			const lexiconResponse = await fetch(`${staticEndpoint}/lexicon/${lexiconFile}.json`);
			const lexiconData = await lexiconResponse.json();

			return lexiconData[lexiconIndex];
		})();
	}
</script>

<Modal title={$__wordRoot} id="lexiconModal" bind:open={$__lexiconModalVisible} class="!rounded-b-none md:!rounded-3xl theme" bodyClass="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain" headerClass="flex justify-between items-center p-6 rounded-t-3xl text-black theme-grayscale" classFooter="rounded-b-3xl flex flex-row justify-between" size="lg" position="bottom" center outsideclose>
	{#await lexiconData}
		<Spinner />
	{:then lexiconData}
		<div class="text-sm text-black flex flex-col space-y-6">
			<div class="flex flex-col space-y-4">
				{@html lexiconData}
			</div>
		</div>
	{:catch error}
		<ErrorLoadingData center="false" {error} />
	{/await}
</Modal>
