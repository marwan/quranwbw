<script>
	export let page;

	// Track the previously loaded FontFace so we can remove it before adding a new one
	let previousFontFace = null;

	async function handleFontUpload(e) {
		const file = e.target.files[0];
		if (!file) return;

		const url = URL.createObjectURL(file);

		// The mushaf word font family for this page is "p{page}" (e.g. "p77")
		const fontFamily = `p${page}`;

		// Remove the previously uploaded dev font if any
		if (previousFontFace) {
			document.fonts.delete(previousFontFace);
			previousFontFace = null;
		}

		// Create a new FontFace with the blob URL and load it
		const fontFace = new FontFace(fontFamily, `url(${url})`, {
			weight: 'normal',
			style: 'normal'
		});

		await fontFace.load();

		// Add to the document font set — this takes priority over stylesheet-declared fonts
		document.fonts.add(fontFace);
		previousFontFace = fontFace;
	}
</script>

<div class="flex justify-center mt-4 mb-20">
	<div class="max-w-3xl md:max-w-[40rem] border border-theme-accent/20 rounded-lg p-3 shadow text-xs mb-12">
		<p class="mb-2">Upload font for page {page}</p>
		<input type="file" accept=".woff2" on:change={handleFontUpload} />
	</div>
</div>
