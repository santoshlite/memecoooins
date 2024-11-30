<script lang="ts">
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { walletSetup } from '$lib/utils/wallet';

	export let data;
	const { user } = data;
	console.log('user', data.user);
</script>

<ProtectedRoute>
	<div class="p-4">
		<h1>Wallet Page</h1>
		{#if user}
			<p>Portfolio: {JSON.stringify(user.portfolio)}</p>

			<button
				class="rounded-lg bg-neutral-800 px-4 py-2 font-medium text-gray-100 transition-colors hover:bg-neutral-700"
				on:click={() => walletSetup(user.clerkId)}
			>
				click to setup wallet
			</button>
		{/if}
	</div>
</ProtectedRoute>
