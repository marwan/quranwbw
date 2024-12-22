<script>
	import party from 'party-js';
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __changelogModalVisible } from '$utils/stores';
	import { linkClasses } from '$data/commonClasses';
	import { websitechangelog } from '$data/changelog';

	$: if ($__changelogModalVisible) {
		// confettis for the update? why not!
		setTimeout(function () {
			party.confetti(document.body, {
				count: 80,
				spread: 100,
				size: 2
			});
		}, 200);
	}
</script>

<Modal id="changelogModal" bind:open={$__changelogModalVisible} size="md" class="rounded-3xl" bodyClass="p-6" dialogClass="fixed top-0 start-0 end-0 h-[-webkit-fill-available] md:inset-0 md:h-full z-50 w-full p-4 flex" center outsideclose>
	<div class="flex flex-col space-y-4">
		<div class="flex flex-col space-y-2">
			<div class="font-medium text-lg">Update {websitechangelog[0].version} <span class="opacity-70">({websitechangelog[0].date})</span></div>
			<div class="flex flex-col space-y-4 text-sm max-h-[60vh] overflow-y-scroll pr-2">
				{#each websitechangelog[0].description as description}
					<span>{@html description}</span>
				{/each}

				{#if websitechangelog[0].updates}
					<a class={linkClasses} href="/changelog">View Highlights & Explore All Our Updates Here!</a>
				{:else}
					<a class={linkClasses} href="/changelog">Explore All Our Updates Here!</a>
				{/if}
			</div>
		</div>
	</div>
</Modal>
