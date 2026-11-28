// Delays calling `method` until `delay` ms have passed since the last call (e.g. for scroll events)
export function debounce(method, delay) {
	clearTimeout(method._tId);
	method._tId = setTimeout(function () {
		method();
	}, delay);
}
