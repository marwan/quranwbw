import { get } from 'svelte/store';
import { __confirmationAlertModal } from '$utils/stores';

// Opens the confirmation modal with the given message and runs onConfirm when the user confirms
export function showConfirm(message, initiatedBy = null, onConfirm) {
	__confirmationAlertModal.set({
		visible: true,
		type: 'confirm',
		message: message,
		initiatedBy: initiatedBy,
		onConfirm: onConfirm
	});
}

// Opens the modal in alert mode with the given message (no confirm action)
export function showAlert(message, initiatedBy = null) {
	__confirmationAlertModal.set({
		visible: true,
		type: 'alert',
		message: message,
		initiatedBy: initiatedBy,
		onConfirm: null
	});
}

// Re-sets the modal store to its current value so subscribers are notified
export function resetConfirmationAlertModal() {
	__confirmationAlertModal.set(get(__confirmationAlertModal));
}
