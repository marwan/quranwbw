<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { __websiteTheme } from '$utils/stores';
	import { selectableThemes, themeColors } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { buttonClasses, selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { onMount } from 'svelte';

	let bgHex = '#ffffff';
	let accentHex = '#b1901f';
	let textHex = '#b1901f';

	onMount(() => {
		const saved = localStorage.getItem('customTheme');
		if (saved) {
			const { bg, accent, text } = JSON.parse(saved);
			bgHex = rgbChannelsToHex(bg);
			accentHex = rgbChannelsToHex(accent);
			textHex = rgbChannelsToHex(text);
		}
	});

	function hexToRgbChannels(hex) {
		const h = hex.replace('#', '');
		const bigint = parseInt(h, 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return `${r} ${g} ${b}`;
	}

	function rgbChannelsToHex(channels) {
		const [r, g, b] = channels.split(' ').map(Number);
		return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
	}

	function saveCustomTheme() {
		localStorage.setItem(
			'customTheme',
			JSON.stringify({
				bg: hexToRgbChannels(bgHex),
				accent: hexToRgbChannels(accentHex),
				text: hexToRgbChannels(textHex)
			})
		);

		// Set theme to "custom" (id: 999)
		updateSettings({ type: 'websiteTheme', value: 999 });
		location.reload();
	}
</script>

<div class="flex flex-col space-y-4">
	<!-- Custom Theme Section -->
	<div class="flex flex-col space-y-4">
		<div class="text-md font-medium">Custom Theme</div>

		<div class="flex flex-col space-y-2 md:flex-row md:space-x-2">
			<label class="flex flex-col space-y-2">
				<span class="text-sm">Background color</span>
				<input type="color" bind:value={bgHex} class="h-10 w-full" />
			</label>

			<label class="flex flex-col space-y-2">
				<span class="text-sm">Accent color</span>
				<input type="color" bind:value={accentHex} class="h-10 w-full" />
			</label>

			<label class="flex flex-col space-y-2">
				<span class="text-sm">Text color</span>
				<input type="color" bind:value={textHex} class="h-10 w-full" />
			</label>
		</div>

		<button class={buttonClasses} on:click={saveCustomTheme}> Apply custom theme </button>
	</div>

	<div class="border-b border-theme-accent/20"></div>

	<div class="grid gap-3 w-full">
		{#each themeColors as color}
			<div class="flex flex-col space-y-2 pb-6">
				<div id="color-name" class="text-md font-medium capitalize">{color}</div>
				<div id="color-list" class="space-y-3">
					{#each Object.entries(selectableThemes) as [_, theme]}
						{#if theme.color === color && theme.id !== 999}
							<Radio name="websiteTheme" bind:group={$__websiteTheme} value={theme.id} on:change={(event) => updateSettings({ type: 'websiteTheme', value: +event.target.value })} custom>
								<div class="{individualRadioClasses} {$__websiteTheme === theme.id && selectedRadioOrCheckboxClasses}">
									<!-- <div class="flex flex-row pr-2">
									<div class="w-4 h-8 rounded-l-full {window.theme('bgMain', theme.id)}"></div>
									<div class="w-4 h-8 rounded-r-full {window.theme('bgSecondary', theme.id)}"></div>
								</div> -->
									<div class="w-full">{theme.name}</div>

									{#if $__websiteTheme === theme.id}
										<Check size={5} />
									{/if}
								</div>
							</Radio>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
