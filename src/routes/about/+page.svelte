<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage } from '$utils/stores';
	import { linkClasses } from '$data/commonClasses';
	import { createLink } from '$utils/createLink';

	const creditlinks = [
		{
			text: 'Dr. Shehnaz Shaikh, Ms. Kausar Khatri',
			href: 'http://emuslim.com/Quran/Translation_English.asp',
			description: 'for their English',
			additionalLinks: [
				{
					text: 'Dr. Farhat Hashmi',
					href: 'https://www.farhathashmi.com',
					description: 'for her Urdu word by word compilation'
				}
			]
		},
		{
			text: 'Quran.com',
			href: 'https://quran.com',
			description: 'for their API'
		},
		{
			text: 'Tafsir Center for Quranic Studies',
			href: 'https://tafsir.net/',
			description: 'via',
			additionalLinks: [
				{
					text: 'Wahy App',
					href: 'https://web.wahy.net/',
					description: 'for granting us special permission to use their word by word audio files'
				}
			]
		},
		{
			text: 'King Fahd Glorious Quran Printing Complex',
			href: 'http://qurancomplex.gov.sa/',
			description: 'for their Quran text*'
		},
		{
			text: 'Tanzil.net',
			href: 'http://tanzil.net/trans/',
			description: 'for their collection of Quranic resources'
		},
		{
			text: 'EveryAyah.com',
			href: 'http://everyayah.com',
			description: '/',
			additionalLinks: [
				{
					text: 'QuranCentral.com',
					href: 'https://qurancentral.com',
					description: '/ '
				},
				{
					text: 'QuranicAudio.com',
					href: 'https://quranicaudio.com',
					description: 'for their collection of Quranic audios'
				}
			]
		},
		{
			text: 'Ayman Siddiqui',
			href: 'https://zoopernet.com',
			description: 'for all the help including providing various website data and fonts & website testing'
		},
		{
			text: 'Collin Fair',
			href: 'https://github.com/cpfair',
			description: 'for his word timestamps for Quranic audios'
		},
		{
			text: 'Usman Pervez (IslamOne android app)',
			href: 'https://play.google.com/store/apps/details?id=com.atq.quranemajeedapp.org.islamone&hl=en',
			description: 'for various data like Urdu WBW and Tafhim-ul-Quran'
		},
		{
			text: 'Greentech Apps (Al Quran Tafsir & by Word app)',
			href: 'https://gtaf.org',
			description: 'for their English, Indonesian, Bangla, Chinese**, Malayalam*** and Divehi words database and corpus data'
		},
		{
			text: 'Dr. Kais Dukes',
			href: 'https://github.com/kaisdukes',
			description: 'for his morphological description of the Quranic words'
		},
		{
			text: 'Ata Rafi',
			href: 'https://www.typemybook.com/download/complete-quran-kareem-text/',
			description: 'for sharing the IndoPak text originally by',
			additionalLinks: [
				{
					text: 'InPage™',
					href: 'http://inpage.com/',
					description: ''
				}
			]
		},
		{
			text: 'Azrul Azwar (Quran WbW iOS app)',
			href: 'https://apps.apple.com/us/app/quran-word-by-word/id588198510',
			description: 'for the words databases in many different languages'
		},
		{
			text: 'CSALT',
			href: 'http://csalt.itu.edu.pk/urdufont/index.html',
			description: 'for their Mehr Nastaliq Urdu font'
		},
		{
			text: 'Al-Huda International',
			href: 'https://www.alhudapk.com/products/hindi-section.html',
			description: 'for their Hindi word by word PDF files'
		},
		{
			text: 'Quran411.com',
			href: 'https://www.quran411.com/',
			description: 'for their English transliteration originally by M.A.H. Eliyasee'
		},
		{
			text: 'SoundVision.com',
			href: 'https://www.soundvision.com/article/a-thematic-introduction-to-the-surahs-of-the-qur-an',
			description: 'for their thematic introduction to the surahs of the Quran'
		},
		{
			text: 'TamililQuran.com',
			href: 'http://www.tamililquran.com/',
			description: 'for their Tamil word by word database originally by',
			additionalLinks: [
				{
					text: 'Darul Huda',
					href: 'https://www.darulhuda.net/',
					description: ''
				}
			]
		},
		{
			text: 'Al Quran Cloud',
			href: 'https://alquran.cloud/',
			description: 'and',
			additionalLinks: [
				{
					text: 'Fawaz Ahmed',
					href: 'https://github.com/fawazahmed0',
					description: 'for their Quran translations API'
				}
			]
		},
		{
			text: 'Dr. Usama Nonnenmacher',
			href: 'https://drusaman.github.io/',
			description: 'for his excellent work on the French word by word data'
		},
		{
			text: 'Spark (spa5k)',
			href: 'https://github.com/spa5k/tafsir_api',
			description: 'for his Tafsir API'
		},
		{
			text: 'Quran Pro',
			href: 'https://quran-pro.com/',
			description: 'for their pictures of different reciters'
		},
		{
			text: 'Flaticon',
			href: 'https://www.flaticon.com/uicons/',
			description: 'for their great range of interface icons'
		},
		{
			text: 'Quranic Universal Library (QUL)',
			href: 'https://qul.tarteel.ai/',
			description: 'for their Persian words database'
		}
	];

	__currentPage.set('about');
</script>

<PageHead title={'About'} />

<div class="theme">
	<div class="my-6 space-y-4 pb-4">
		<div class="flex flex-col space-y-6text-sm">
			<div id="about-start" class="flex flex-col space-y-6 text-center">
				<div class="text-md md:text-xl font-medium italic w-4/5 mx-auto">
					"Indeed, this (book) is a reminder, so he who wills may take to his Lord a way. And you do not will except that Allah wills. Indeed, Allah is ever Knowing and Wise."
					{@html createLink('/76/29-30', '(76:29-30)')}
				</div>

				<i class="text-sm">In the name of Allah and prayers & blessings be upon His messenger, Muhammad (<span style="font-style: initial; font-weight: normal;">ﷺ</span>).</i>
			</div>

			<div id="about-website" class="flex flex-col space-y-4 mt-8 text-sm">
				<span>QuranWBW.com is your companion for reading, listening to, and learning the Holy Quran, word by word. With features like word audios, Tajweed colors, and transliteration, you can delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.</span>

				<span>
					This website is a passion project, not a full-time endeavor. For issues, suggestions, or contributions, please visit our
					{@html createLink('https://github.com/marwan/quranwbw', 'GitHub repository')} or contact us at via
					{@html createLink('mailto:quranwbw@gmail.com', 'email')}. You can also join our {@html createLink('https://chat.whatsapp.com/CtrbWUB4GTyDdZWXWujVSl', 'WhatsApp group')} for updates.
				</span>
			</div>

			<div id="website-credits" class="flex flex-col space-y-4 mt-6 text-sm">
				<span>QuranWBW.com owes its existence to the contributions of the following remarkable individuals and organizations:</span>

				<ul class="list-disc ml-5 space-y-2">
					{#each creditlinks as link}
						<li>
							<a class={linkClasses} target="_blank" rel="noreferrer" href={link.href}>{link.text}</a>
							{link.description}
							{#if link.additionalLinks}
								{#each link.additionalLinks as sublink}
									<a class={linkClasses} target="_blank" rel="noreferrer" href={sublink.href}>{sublink.text}</a> {sublink.description}
								{/each}
							{/if}
						</li>
					{/each}
				</ul>

				<span>All data used on this website belongs to their respective owners and authors. Permission must be obtained from them before copying any content.</span>

				<div class="border-b {window.theme('border')}"></div>

				<span class="text-xs opacity-70"
					>*The Mushaf fonts are developed by and are a property of {@html createLink('https://qurancomplex.gov.sa/', 'King Fahad Glorious Quran Printing Complex')} based in Madinah, Saudi Arabia. Tajweed Colors are based on {@html createLink('https://easyquran.com/ar/', 'Tajweed Quran (Easy Quran) Mushaf by Dar-Al-Marifa')}
					developed by Dr. Eng. Taha Subhi, Damascus - Syria. Tajweed Color Font Features on King Fahad Glorious Quran Printing Complex V4 Mushaf fonts invented and developed by
					{@html createLink('https://zoopernet.com', 'Ayman Siddiqui')}
					and co-developed by team : Rania, Amena, Naveed Ahmed, Mohammed Zahid, Tooba and Anza for Sadaqa-e-jaria (non-commercial) purposes only. Permitted to develop with prior permissions secured from King Fahad Glorious Quran Printing Complex and Dar-Al-Marifa by
					{@html createLink('https://quran.com', 'Quran.com')} (Quran Foundation) team.</span
				>

				<span class="text-xs opacity-70">
					**We express our heartfelt gratitude to everyone who contributed to the Chinese word-by-word Quran translation, particularly Brother Ma Zhiren for his meticulous translation work completed in 2014, Brother Adam Voo from Malaysia and Brother Usama Nonnenmacher for digitalizing the data, and Brothers Max Ma from Canada and Suleyman Abdullah from China for their collaboration. May Allah
					reward them all abundantly in this world and the hereafter. We pray that Allah blesses our Chinese brothers and sisters through the Quran app.
				</span>

				<span class="text-xs opacity-70"
					>***Original sources for the Malayalam translations are
					{@html createLink('https://amanithafseer.com', 'Amani Thafseer')}
					and
					{@html createLink('https://www.lalithasaram.net/', 'Lalithasaram')}
					For the Amani Thafseer translation, Brother Usama Nonnenmacher assisted in formatting the data and adjusting word splitting where knowledge of Malayalam was not required. Brother Ameen Abdussalam, whom he collaborated with via the Amani Thafseer team, provided crucial support for cases needing Malayalam expertise. Regarding the Lalithasaram translation, minimal adjustments were necessary
					beyond converting the format from an SQL file to a standard database file.</span
				>
			</div>
		</div>
	</div>
</div>
