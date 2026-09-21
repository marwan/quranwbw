<script>
	import { onMount } from 'svelte';
	import { registerAudioElement } from '$utils/audioController';

	// The single <audio> element used for all verse and word playback. It lives in this
	// component (not app.html) so the controller can own its lifecycle and receive the node
	// via registerAudioElement() instead of querying the DOM. Mounted outside the {#key}
	// block in +layout.svelte so it survives navigation. (Reactive telemetry bindings —
	// currentTime/duration — will be added with the feature that consumes them.)
	let player;

	onMount(() => registerAudioElement(player));
</script>

<!-- id="player" retained as a safety net for the controller's querySelector fallback -->
<audio id="player" bind:this={player}></audio>
