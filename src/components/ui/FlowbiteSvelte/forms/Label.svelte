<script>
	import { twMerge } from 'tailwind-merge';
	export let color = 'gray';
	export let defaultClass = 'text-sm rtl:text-right font-medium block';
	export let show = true;
	let node;
	const colorClasses = {
		gray: '',
		green: '',
		red: '',
		disabled: ''
	};
	// function checkDisabled(node: HTMLLabelElement) {
	$: {
		const control = node?.control;
		color = control?.disabled ? 'disabled' : color;
	}
	$: labelClass = twMerge(defaultClass, colorClasses[color], $$props.class);
</script>

{#if show}
	<label bind:this={node} {...$$restProps} class={labelClass}><slot /></label>
{:else}
	<slot />
{/if}
