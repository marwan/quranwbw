import { __bottomAlert } from '$utils/stores';

let hideTimeout = null;

export function showToast(message, { duration = 3000 } = {}) {
	if (!message) return;

	__bottomAlert.set({
		visible: true,
		message
	});

	if (hideTimeout) clearTimeout(hideTimeout);
	hideTimeout = setTimeout(() => {
		__bottomAlert.update((state) => ({
			...state,
			visible: false
		}));
	}, duration);
}
