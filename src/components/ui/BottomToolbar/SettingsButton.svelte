<script>
	import SettingsFilled from '$svgs/SettingsFilled.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { __settingsDrawerHidden } from '$utils/stores';
</script>

<button type="button" title="Settings" on:click={() => ($__settingsDrawerHidden = false)} class="inline-flex flex-col items-center justify-center px-5 group hover:bg-theme-accent/5" data-umami-event="Toolbar Settings Button">
	<SettingsFilled size={5} />
	<span class="sr-only">Settings</span>
</button>
<Tooltip arrow={false} type="light" class="hidden md:block font-normal">Settings</Tooltip>
