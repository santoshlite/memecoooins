<script lang="ts">
	import { fade } from 'svelte/transition';
	import Icon from '@iconify/svelte';
    import { redeemWallet } from '$lib/utils/wallet';

    export let clerkId: string;
	export let show = false;
	export let onClose: () => void;
	export let portfolio: Array<{ id: string; quantity: number }> = [];
	export let netWorthHistory: Array<{ netWorth: number; coinsWorth: Record<string, number> }> = [];
	export let coins: Array<{ id: string; metadata: any }> = [];

	let showConfirmation = true;
	let privateKey = '';
	let copied = false;

	$: if (!show) {
		showConfirmation = true;
	}

    async function handleConfirm() {
    try {
        const result = await redeemWallet(clerkId);
        privateKey = result.privateKey;
        showConfirmation = false;
    } catch (error) {
        console.error('Failed to redeem wallet:', error);
        // You might want to show an error message to the user here
    }
}

	$: lastNetWorth = netWorthHistory?.length 
		? netWorthHistory[netWorthHistory.length - 1]?.coinsWorth || {}
		: {};

	// Helper function for formatting numbers
	function formatNumber(num: number | undefined): string {
		if (num === undefined || isNaN(num)) return '0.00';
		return num.toLocaleString(undefined, { 
			minimumFractionDigits: 2,
			maximumFractionDigits: 2 
		});
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(privateKey);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// Close modal when clicking outside
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Close on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
		transition:fade
		on:click={handleBackdropClick}
	>
		<div
			class="cyber-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-gray-900 p-6"
			transition:fade
		>
			{#if showConfirmation}
				<!-- Confirmation Screen -->
				<div class="text-center space-y-6">
					<h2 class="font-vt323 text-3xl mb-4 glitch-text">🎮 END GAME CONFIRMATION 🎮</h2>
					
					<p class="font-press-start-2p text-lg mb-8 text-purple-400">
						Ready to cash out your mystery bag?
					</p>
					
					<div class="cyber-card p-6 rounded-xl mb-6 relative overflow-hidden">
						<div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse-slow"></div>
						<p class="font-vt323 text-xl mb-4">
							This will reveal all your memecoins and provide your wallet's private key.
						</p>
						<p class="font-press-start-2p text-sm text-yellow-400">
							⚠️ This action cannot be undone! ⚠️
						</p>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<button
							on:click={onClose}
							class="cyber-card py-4 px-6 rounded-xl font-press-start-2p text-sm hover:text-red-400 transition-all"
						>
                        🚀 KEEP HODLING
						</button>
                        <button
							on:click={handleConfirm}
							class="cyber-card py-4 px-6 rounded-xl font-press-start-2p text-sm hover:text-green-400 transition-all"
						>
                        🔎 REVEAL ALL
						</button>
					</div>
				</div>
			{:else}
				<!-- Existing Reveal Content -->
				<div class="mb-6 flex items-center justify-between">
					<h2 class="font-vt323 text-2xl text-white">🎉 Your Mystery Bag Revealed!</h2>
					<button on:click={onClose} class="text-gray-400 hover:text-white">
						<Icon icon="lucide:x" class="h-6 w-6" />
					</button>
				</div>

				<!-- Portfolio List -->
				<div class="mb-8 space-y-4">
					{#each portfolio as item}
						{@const coin = coins.find((c) => c.id === item.id)}
						{@const worth = lastNetWorth[item.id]}
						<div class="cyber-card flex items-center gap-4 rounded-lg p-4">
							<img
								src={coin?.metadata?.image?.thumb || '/fallback-coin.png'}
								alt={coin?.id}
								class="h-12 w-12 rounded-full"
							/>
							<div class="flex-1">
								<p class="font-vt323 text-xl text-purple-400">
									{coin?.id || 'Unknown Coin'}
								</p>
								<div class="flex items-center justify-between">
									<p class="font-press-start-2p text-sm text-gray-400">
										{formatNumber(item.amount)} coins
									</p>
									<p class="font-press-start-2p text-sm text-green-400">
										${formatNumber(worth)}
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Private Key Section -->
				<div class="cyber-card mb-6 rounded-lg p-4">
					<p class="font-vt323 mb-2 text-lg">🔑 Your Private Key:</p>
					<div class="flex gap-2">
						<code class="flex-1 overflow-x-auto rounded bg-black/50 p-2 font-mono text-sm text-gray-100">
							{privateKey}
						</code>
						<button
							on:click={copyToClipboard}
							class="cyber-card rounded px-3 py-2 hover:text-purple-400"
						>
							<Icon icon={copied ? 'lucide:check' : 'lucide:copy'} class="h-5 w-5" />
						</button>
					</div>
				</div>

				<!-- Instructions Link -->
				<a
					href="https://phantom.app/learn/blog/import-and-manage-multiple-wallets-with-phantom#importing-your-accounts-to-phantom"
					target="_blank"
					rel="noopener noreferrer"
					class="cyber-card block rounded-lg p-4 transition-colors hover:text-purple-400"
				>
					<div class="flex items-center gap-2">
						<Icon icon="lucide:book-open" class="h-5 w-5" />
						<span class="font-vt323 text-lg"> Learn how to access your wallet → </span>
					</div>
				</a>
			{/if}
		</div>
	</div>
{/if}
