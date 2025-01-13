// Function to make the API call to log the clicked element
export async function interactionLogger(element) {
	try {
		await fetch('https://interaction-logger.quranwbw.com/click', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ element })
		});
	} catch (error) {
		// ...
	}
}
