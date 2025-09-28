import { get } from 'svelte/store';
import { __confirmationAlertModal } from '$utils/stores';

export function showConfirm(message, initiatedBy = null, onConfirm) {
	__confirmationAlertModal.set({
		visible: true,
		type: 'confirm',
		message: message,
		initiatedBy: initiatedBy,
		onConfirm: onConfirm
	});
}

export function showAlert(message, initiatedBy = null) {
	__confirmationAlertModal.set({
		visible: true,
		type: 'alert',
		message: message,
		initiatedBy: initiatedBy,
		onConfirm: null
	});
}

export function resetConfirmationAlertModal() {
	__confirmationAlertModal.set(get(__confirmationAlertModal));
}
