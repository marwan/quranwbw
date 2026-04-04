<script>
	import { twMerge } from 'tailwind-merge';
	export let items = [];
	export let value = undefined;
	export let placeholder = 'Choose option ...';
	export let underline = false;
	export let size = 'md';
	export let defaultClass = `border border-theme-accent/20 rounded-lg focus:border-theme-accent focus:ring-theme-accent`;
	export let underlineClass = `bg-transparent border-0 border-b-2 border-theme-accent/20 appearance-none focus:border-theme-accent focus:ring-theme-accent peer`;
	const common = 'block w-full';
	const sizes = {
		sm: 'text-sm p-2',
		md: 'text-sm p-2.5',
		lg: 'text-base py-3 px-4'
	};
	let selectClass;
	$: selectClass = twMerge(common, underline ? underlineClass : defaultClass, sizes[size], underline && '!px-0', $$props.class);
</script>

<select {...$$restProps} bind:value class={selectClass} on:change on:contextmenu on:input>
	{#if placeholder}
		<option disabled selected value="">{placeholder}</option>
	{/if}

	{#each items as { value, name }}
		<option {value}>{name}</option>
	{:else}
		<slot />
	{/each}
</select>
