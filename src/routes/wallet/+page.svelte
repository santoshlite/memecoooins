<script lang="ts">
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	
	export let data;
	const { user } = data;
</script>

<ProtectedRoute>
	<div class="p-4">
		<h1>Wallet Page</h1>
		{#if user}
			<p>Portfolio: {JSON.stringify(user.portfolio)}</p>
		{/if}
	</div>
</ProtectedRoute>
