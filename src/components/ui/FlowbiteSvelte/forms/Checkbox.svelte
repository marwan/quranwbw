<script>
	import { getContext } from 'svelte';
	import { labelClass, inputClass } from './Radio.svelte';
	import Label from './Label.svelte';
	// properties forwarding
	export let color = 'primary';
	export let custom = false;
	export let inline = false;
	export let group = [];
	export let value = 'on';
	export let checked = undefined;
	export let spacing = $$slots.default ? 'me-2' : '';
	// tinted if put in component having its own background
	let background = getContext('background');
	// react on external group changes
	function init(_, _group) {
		if (checked === undefined) checked = _group.includes(value);
		onChange();
		return {
			update(_group) {
				checked = _group.includes(value);
			}
		};
	}
	function onChange() {
		// There's a bug in Svelte and bind:group is not working with wrapped checkbox
		// This workaround is taken from:
		// https://svelte.dev/repl/de117399559f4e7e9e14e2fc9ab243cc?version=3.12.1
		const index = group.indexOf(value);
		if (checked === undefined) checked = index >= 0;
		if (checked) {
			if (index < 0) {
				group.push(value);
				group = group;
			}
		} else {
			if (index >= 0) {
				group.splice(index, 1);
				group = group;
			}
		}
	}
</script>

<Label class={labelClass(inline, $$props.class)} show={$$slots.default}>
	<input use:init={group} type="checkbox" bind:checked on:keyup on:keydown on:keypress on:focus on:blur on:click on:mouseover on:mouseenter on:mouseleave on:paste on:change={onChange} on:change {value} {...$$restProps} class={inputClass(custom, color, true, background, spacing, $$slots.default || $$props.class)} />
	<slot />
</Label>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let color: FormColorType = 'primary';
@prop export let custom: boolean = false;
@prop export let inline: boolean = false;
@prop export let group: (string | number)[] = [];
@prop export let value: string | number = 'on';
@prop export let checked: boolean | undefined = undefined;
@prop export let spacing: string = $$slots.default ? 'me-2' : '';
-->
