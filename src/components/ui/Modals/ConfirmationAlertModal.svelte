<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __confirmationAlertModal } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { getModalTransition } from '$utils/getModalTransition';

	$: if ($__confirmationAlertModal) {
		const initiatedByElement = document.getElementById($__confirmationAlertModal.initiatedBy);
		const presentationOverlay = document.getElementById('presentation');

		if ($__confirmationAlertModal.visible) {
			if (initiatedByElement) initiatedByElement.classList.add('invisible');
			if (presentationOverlay) presentationOverlay.classList.add('invisible');
		} else {
			if (initiatedByElement) initiatedByElement.classList.remove('invisible');
			if (presentationOverlay) presentationOverlay.classList.remove('invisible');

			// Reset modal properties
			$__confirmationAlertModal.message = '';
			$__confirmationAlertModal.onConfirm = null;
			$__confirmationAlertModal.initiatedBy = null;
		}
	}
</script>

<Modal id="confirmationAlertModal" bind:open={$__confirmationAlertModal.visible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl z-[21]" bodyClass="p-6" position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium">Confirmation</h3>

	<div class="flex flex-col space-between">
		<div>{$__confirmationAlertModal.message}</div>

		<div class="flex flex-row">
			<button
				class="w-full mr-2 mt-6 {buttonClasses}"
				on:click={() => {
					if ($__confirmationAlertModal.onConfirm) {
						$__confirmationAlertModal.onConfirm();
					}
					$__confirmationAlertModal.visible = false;
				}}
			>
				Confirm
			</button>

			<button
				class="w-full mt-6 {buttonClasses}"
				on:click={() => {
					$__confirmationAlertModal.visible = false;
				}}
			>
				Cancel
			</button>
		</div>
	</div>
</Modal>
