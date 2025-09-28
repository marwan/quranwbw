<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __confirmationAlertModal } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { getModalTransition } from '$utils/getModalTransition';
	import { resetConfirmationAlertModal } from '$utils/confirmationAlertHandler';

	$: if ($__confirmationAlertModal) {
		const initiatedByElement = document.getElementById($__confirmationAlertModal.initiatedBy);
		const presentationOverlay = document.getElementById('presentation');

		if ($__confirmationAlertModal.visible) {
			if (initiatedByElement) initiatedByElement.classList.add('invisible');
			if (presentationOverlay) presentationOverlay.classList.add('invisible');
		} else {
			if (initiatedByElement) initiatedByElement.classList.remove('invisible');
			if (presentationOverlay) presentationOverlay.classList.remove('invisible');

			resetConfirmationAlertModal();
		}
	}
</script>

<Modal id="confirmationAlertModal" bind:open={$__confirmationAlertModal.visible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl z-[21]" bodyClass="p-6" position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium">
		{$__confirmationAlertModal.type === 'confirm' ? 'Confirmation' : 'Alert'}
	</h3>

	<div class="flex flex-col">
		<p>{$__confirmationAlertModal.message}</p>

		<div class="flex flex-row gap-2 mt-6">
			{#if $__confirmationAlertModal.type === 'confirm'}
				<button
					class="w-full {buttonClasses}"
					on:click={() => {
						$__confirmationAlertModal.onConfirm?.();
						$__confirmationAlertModal.visible = false;
					}}
				>
					Confirm
				</button>
			{/if}

			<button class="w-full {buttonClasses}" on:click={() => ($__confirmationAlertModal.visible = false)}> {$__confirmationAlertModal.type === 'confirm' ? 'Cancel' : 'Got it'} </button>
		</div>
	</div>
</Modal>
