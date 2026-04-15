<script>
	import EyeFilled from '$svgs/EyeFilled.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import DisplayTypeSelector from '$ui/SettingsDrawer/DisplayTypeSelector.svelte';
	import { __settingsSelectorModal } from '$utils/stores';
</script>

<button id="changeDisplayButton" type="button" title="Display Type" class="inline-flex flex-col items-center justify-center px-5 relative inline-flex items-center group hover:bg-theme-accent/5" on:click={() => __settingsSelectorModal.set({ component: DisplayTypeSelector, visible: true, title: 'Display Type' })} data-umami-event="Toolbar Display Change Button">
	<EyeFilled size={5} />
	<span class="sr-only">Display Type</span>
</button>
<Tooltip triggeredBy="#changeDisplayButton" arrow={false} type="light" class="hidden md:block font-normal">Display Type</Tooltip>
