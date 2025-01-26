<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import MorphologyView from '$src/routes/morphology/[key]/MorphologyView.svelte';
	import { __morphologyModalVisible, __morphologyKey } from '$utils/stores';
	import { getModalTransition } from '$utils/getModalTransition';
	import { page } from '$app/stores';

	$: wordKeyData = {
		key: $__morphologyKey
	};

	$: if ($page.url.href) __morphologyModalVisible.set(false);
</script>

<Modal bind:open={$__morphologyModalVisible} id="morphologyModal" transitionParams={getModalTransition('bottom')} size="lg" class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-6 text-xl font-medium">Word {$__morphologyKey}</h3>
	<div class="max-h-[70vh] overflow-y-scroll w-full pr-2"><MorphologyView data={wordKeyData} /></div>
</Modal>
