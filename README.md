<br />
<div align="center">
  <a target="_blank" href="https://quranwbw.com"><img src="https://raw.githubusercontent.com/marwan/quranwbw/main/static/images/banner.png?v=2"></a>
  <br />
</div>

## About

QuranWBW.com is your companion for reading, listening to, and learning the Holy Quran, word-by-word. With features like word audios, Tajweed colors, and transliteration, you can delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.

This website is a passion project, not a full-time endeavor. For issues, suggestions, or contributions, please visit our [GitHub repository](https://github.com/marwan/quranwbw) or contact us via [email](mailto:quranwbw@gmail.com). You can also join our [WhatsApp group](https://chat.whatsapp.com/CtrbWUB4GTyDdZWXWujVSl) for updates.

## Stack & Architecture

QuranWBW’s frontend is built with [Svelte](https://svelte.dev/), delivering a fast, lightweight, and highly reactive user experience.

Unlike many Quran-related websites, QuranWBW does not rely on any real-time external APIs, by this we mean APIs hosted on a server that fetch custom data from a database on-demand.
Instead, we use pre-generated static JSON files containing all the required Quran data.
These files are generated locally, uploaded, and served via our private CDN at `static.quranwbw.com`.

This CDN is hosted on Cloudflare and is optimized for speed and reliability. It contains:

- Complete Quran data files (verses, translations, morphology, etc.)
- Crucial metadata and indexing information
- Mushaf fonts and supporting assets
- Translation files in multiple languages

We use the following external services and resources to power QuranWBW:

- `audios.quranwbw.com` – Dedicated Cloudflare CDN hosting all word-by-word audio files for fast, on-demand playback.
- [Tafsir API by spa5k](https://github.com/spa5k/tafsir_api) – External open-source static API providing various tafsir texts.
- [Kalimat API](https://www.kalimat.dev/) – AI-powered semantic search via a real-time API.

## Our Data

QuranWBW uses its very own data to give you that awesome word-by-word experience. We're always working to make it even better and bigger!

If you're looking for Quranic data for your own projects, a great place to start is the [Quranic Universal Library (QUL)](https://qul.tarteel.ai/). It's a cool spot with lots of info!

But if QUL doesn't have what you need, or you're curious about our data, just get in touch. We'll do our best to help you out.

## Development & Deployment

Ready to dive in and contribute or just run the project locally? Here's how:

### Local Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/marwan/quranwbw.git
    cd quranwbw
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will typically be accessible at `http://localhost:5173`.

### Styling with Tailwind CSS

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling. If you make any changes to styles (especially within `.html`, `.svelte` files, or the Tailwind configuration), you’ll need to regenerate the CSS by running:

```bash
npm run css
```

This command will build the updated CSS file, minify it for production, and also live monitor for any further CSS changes so they are compiled automatically.

### Deployment

This SvelteKit project can be deployed to various hosting providers.
It is currently hosted on Cloudflare Pages, but it can also be deployed to other platforms such as Vercel, Netlify, or any service that supports SvelteKit adapters.

## Contribution

QuranWBW welcomes your involvement! Whether you'd like to:

- Add or suggest new features
- Report bugs
- Or simply use the website and share your feedback

Your contributions help make QuranWBW even better\!
