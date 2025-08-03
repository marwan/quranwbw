const option = 1;

export function getWebsiteWidth() {
	if (option === 1) return 'max-w-screen-lg';
	else if (option === 2) return 'max-w-screen-xl';
}
