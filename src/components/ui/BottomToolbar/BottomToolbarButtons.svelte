<script>
	import LeftNavigationButton from '$ui/BottomToolbar/LeftNavigationButton.svelte';
	import RightNavigationButton from '$ui/BottomToolbar/RightNavigationButton.svelte';
	import DisplayChangeButton from '$ui/BottomToolbar/DisplayChangeButton.svelte';
	import AudioButton from '$ui/BottomToolbar/AudioButton.svelte';
	import SettingsButton from '$ui/BottomToolbar/SettingsButton.svelte';
	import MushafMinimalMode from '$ui/BottomToolbar/MushafMinimalMode.svelte';
	import { __currentPage } from '$utils/stores';
</script>

<LeftNavigationButton />
<DisplayChangeButton />
<AudioButton />
{#if $__currentPage === 'mushaf'}
	<MushafMinimalMode />
{:else}
	<SettingsButton />
{/if}
<RightNavigationButton />
