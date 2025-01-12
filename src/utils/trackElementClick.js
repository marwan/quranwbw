// Function to make the API call to track the clicked element
export async function trackElementClick(elementId) {
	try {
		await fetch('https://event-tracker.quranwbw.com/click', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ element: elementId })
		});
	} catch (error) {
		// ...
	}
}
