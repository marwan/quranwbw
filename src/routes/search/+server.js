import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const query = url.searchParams.get('query');
	if (!query) return json({ error: 'Missing query' }, { status: 400 });

	try {
		const res = await fetch(`https://api.kalimat.dev/search?query=${query}&numResults=50`, {
			headers: {
				'x-api-key': process.env.PRIVATE_KALIMAT_API_KEY
			}
		});

		if (!res.ok) {
			const errorText = await res.text();
			console.error('Kalimat API Error:', errorText);
			return json({ error: errorText }, { status: res.status });
		}

		const data = await res.json();
		return json(data);
	} catch (error) {
		console.error('Server fetch error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
