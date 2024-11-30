<script lang="ts">
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	
	export let data;
	const { portfolio } = data;
</script>

<ProtectedRoute>
	<div class="p-4">
		<h1>Wallet Page</h1>
		<p>Portfolio: {JSON.stringify(portfolio)}</p>
	</div>
</ProtectedRoute>
