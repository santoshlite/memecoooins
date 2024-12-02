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
	export let hasRedeemed: boolean;
	export let onRedeem: () => void;

	let showConfirmation = !hasRedeemed;
	let privateKey = '';
	let copied = false;
	let loading = false;
	let justRedeemed = false;

	$: if (!show) {
		showConfirmation = true;
	}

	async function handleConfirm() {
		try {
			const result = await redeemWallet(clerkId);
			privateKey = result.privateKey;
			showConfirmation = false;
			justRedeemed = true;
			onRedeem();
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

	async function handleRevealAll() {
		loading = true;
		try {
			const result = await redeemWallet(clerkId);
			privateKey = result.privateKey;
			showConfirmation = false;
			justRedeemed = true;
			onRedeem();
		} finally {
			loading = false;
		}
	}

	// Calculate total net worth
	$: totalNetWorth = netWorthHistory?.length
		? netWorthHistory[netWorthHistory.length - 1]?.netWorth || 0
		: 0;
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		transition:fade
		on:click={handleBackdropClick}
	>
		<div class="relative mx-4 max-h-[90vh] w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
			<!-- Close button -->
			<button class="absolute right-4 top-4" on:click={onClose}>
				<Icon icon="mdi:close" class="h-6 w-6" />
			</button>

			<!-- Scrollable content -->
			<div class="mt-8 max-h-[calc(90vh-120px)] overflow-y-auto">
				<!-- <div class="flex items-center justify-between bg-[#012bf4] px-4 py-2">
					<span class="text-white"
						>{showConfirmation ? '🎮 &nbsp; END GAME' : '🎉 &nbsp;  REVEAL'}</span
					>
					<div class="flex gap-2">
						<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
						<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
						<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
					</div>
				</div> -->

				<div class=" bg-white p-8">
					{#if !hasRedeemed && showConfirmation}
						<!-- Confirmation Screen - Only show if not redeemed -->
						<div class="space-y-8 text-center">
							<h2 class="text-4xl font-black">Ready to cash out your mystery bag?</h2>

							<div class="rounded-lg border-2 border-black bg-[#ffe502] p-6">
								<p class="text-2xl font-bold">
									You'll finally discover which memecoins are hiding in your mystery bag, plus get
									your wallet's private key.
								</p>
								<p class="mt-4 font-mono text-gray-500">⚠️ This action cannot be undone! ⚠️</p>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<button
									on:click={onClose}
									class="rounded-lg border-2 border-black bg-[#012bf4] px-6 py-4 text-white shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
								>
									🚀 &nbsp; KEEP HODLING
								</button>
								<button
									on:click={handleRevealAll}
									disabled={loading}
									class="rounded-lg border-2 border-black bg-[#012bf4] px-6 py-4 text-white shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
								>
									{#if loading}
										<div class="flex items-center gap-2 text-center">
											<div
												class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
											></div>
											Loading...
										</div>
									{:else}
										🔎 REVEAL ALL
									{/if}
								</button>
							</div>
						</div>
					{:else}
						<!-- Reveal Content -->
						<div class="space-y-8">
							<div class="mb-8 text-center">
								<p class="mb-2 text-xl text-gray-600">Your Ending Balance</p>
								<p class="text-5xl font-black text-[#012bf4]">
									${formatNumber(netWorthHistory[0]?.netWorth || 0)}
								</p>
							</div>
							<div class="space-y-12">
								{#each portfolio as item, index}
									{@const coin = coins.find((c) => c.id === item.id)}
									{@const worth = lastNetWorth[item.id]}
									<div class="relative">
										<div class="flex items-center justify-between">
											<div>
												<div class="flex items-center gap-4">
													<img
														src={coin?.metadata?.image?.thumb || '/fallback-coin.png'}
														alt={coin?.id}
														class="h-12 w-12 rounded-full"
													/>
													<div>
														<h3 class="text-2xl text-[#012bf4]">{coin?.id || 'Unknown Coin'}</h3>
														<p class="text-3xl font-black leading-tight">
															{formatNumber(item.amount)} coins
														</p>
													</div>
												</div>
											</div>
											<p class="text-3xl font-black text-[#012bf4]">
												${formatNumber(worth)}
											</p>
										</div>
									</div>

									{#if index !== portfolio.length - 1}
										<div
											class="my-8 w-full border-0 border-b-4 border-dotted border-[#012bf4]"
										></div>
									{/if}
								{/each}
							</div>

							<!-- Private Key Section -->
							<div class="rounded-lg border-2 border-black bg-[#ffe502] p-6">
								<p class="mb-4 text-2xl font-bold">🔑 Your Private Key:</p>
								<p class="mb-4 text-lg font-bold text-red-600">
									⚠️ WARNING: Copy and save this key immediately! For security purposes, it will not
									be shown again.
								</p>

								<div class="flex gap-2">
									<code
										class="flex-1 overflow-x-auto rounded-lg border-2 border-black bg-white p-4 font-mono"
									>
										{privateKey}
									</code>
									<button
										on:click={copyToClipboard}
										class="rounded-lg border-2 border-black bg-[#012bf4] px-4 text-white transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
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
								class="block rounded-lg border-2 border-black bg-[#012bf4] p-4 text-white shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
							>
								<div class="flex items-center gap-2">
									<Icon icon="lucide:book-open" class="h-5 w-5" />
									<span class="text-xl font-bold">Learn how to access your wallet →</span>
								</div>
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
