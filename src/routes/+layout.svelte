<script lang="ts">
	import { ClerkProvider } from 'svelte-clerk';
	import { onMount } from 'svelte';
	import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
	import '../app.css';
	let { children } = $props();

	onMount(() => {
		// Ensure Buffer is available globally
		if (typeof window !== 'undefined' && !window.Buffer) {
			window.Buffer = Buffer;
		}
	});
</script>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
	{@render children()}
</ClerkProvider>
