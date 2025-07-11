/* eslint-disable no-undef */
// function to toggle the modals because for some reason the default Flowbite behaviour does not work so nicely
// https://stackoverflow.com/questions/77071906/flowbite-modal-backdrop-not-hide-when-close-with-function
export function toggleModal(modal, action) {
	const element = new Modal(document.getElementById(modal));

	// if the modal is hidden
	if (action === 'show') element.show();
	// if the modal is visible
	else if (action === 'hide') {
		element.hide();
		try {
			document.querySelector('body > div[modal-backdrop]').remove(); // remove the backdrop
		} catch (error) {
			console.warn(error);
		}
	}
}
