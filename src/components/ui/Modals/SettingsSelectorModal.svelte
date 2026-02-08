<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __settingsSelectorModal } from '$utils/stores';
	import { getModalTransition } from '$utils/getModalTransition';
</script>

<Modal id="settingsSelectorModal" bind:open={$__settingsSelectorModal.visible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-6 text-xl font-medium flex-shrink-0">
		{$__settingsSelectorModal.title}
	</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<svelte:component this={$__settingsSelectorModal.component} />
	</div>
</Modal>
