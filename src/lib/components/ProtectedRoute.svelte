<script lang="ts">
	import { SignedIn, SignedOut } from 'svelte-clerk';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// Additional client-side checks if needed
	});
</script>

<SignedIn>
	{@render children()}
</SignedIn>

<SignedOut>
	{goto('/')}
</SignedOut>
