<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage, __websiteTheme, __changelogModalVisible } from '$utils/stores';
	import { websitechangelog } from '$data/changelog';
	import { buttonClasses } from '$data/commonClasses';

	$: if ($__currentPage) __changelogModalVisible.set(false);

	__currentPage.set('changelog');
</script>

<PageHead title={'Changelog'} />

<div class="flex flex-col space-y-6 text-sm">
	<div id="changelog-list" class="text-sm">
		{#each Object.entries(websitechangelog) as [key, changelog]}
			<div class="py-6 space-y-2 border-b {window.theme('border')}">
				<div id="changelog-title" class="font-medium text-lg">
					<span>
						Update {changelog.version}

						{#if changelog.title}
							- {changelog.title}
						{/if}
					</span>

					{#if changelog.date !== null}
						<span class="opacity-70">({changelog.date})</span>
					{/if}
				</div>
				<div id="changelog-description" class="flex flex-col space-y-4">
					{#each changelog.description as description}
						<span>{@html description}</span>
					{/each}
				</div>

				{#if changelog.updates !== undefined}
					<div id="changelog-updates">
						<ul class="list-disc ml-5 space-y-2 pt-2">
							{#each changelog.updates as update}
								<li>{@html update}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="flex justify-center">
		<a class="{buttonClasses} w-fit" href="https://github.com/marwan/quranwbw" target="_blank">View Our Github Repository {@html '&#x2192;'}</a>
	</div>
</div>
