<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import MorphologyView from '$src/routes/morphology/[key]/MorphologyView.svelte';
	import ExternalLink from '$svgs/ExternalLink.svelte';
	import { __morphologyModalVisible, __morphologyKey } from '$utils/stores';
	import { resetAudioSettings } from '$utils/audioController';
	import { getModalTransition } from '$utils/getModalTransition';
	import { page } from '$app/stores';

	$: wordKeyData = { key: $__morphologyKey };
	$: if ($page.url.href) __morphologyModalVisible.set(false);
	$: if ($__morphologyModalVisible) resetAudioSettings();
</script>

<Modal bind:open={$__morphologyModalVisible} id="morphologyModal" transitionParams={getModalTransition('bottom')} size="lg" class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6" position="bottom" center outsideclose>
	<div class="flex flex-row space-x-2">
		<h3 id="modal-title" class="mb-6 text-xl font-medium">Word {$__morphologyKey}</h3>
		<a href="/morphology/{$__morphologyKey}" class="inline-flex mt-[-2px] mb-6 p-2 rounded-full items-center {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}" on:click={() => window.umami.track('Full View Morphology Button')}>
			<ExternalLink size={4} />
		</a>
	</div>

	<div class="max-h-[70vh] min-h-[70vh] overflow-y-scroll w-full pr-2"><MorphologyView data={wordKeyData} /></div>
</Modal>
