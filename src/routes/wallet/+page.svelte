<script lang="ts">
	// Import necessary libraries
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import html2canvas from 'html2canvas';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import PortfolioRevealModal from '$lib/components/PortfolioRevealModal.svelte';

	// Exported variables and initial data
	export let data;

	// Countdown components state
	let nextUpdateTimeLeft = 0;
	let autoRedeemTimeLeft = 0;
	let interval: NodeJS.Timeout;

	// Canvas and Chart variables
	let canvas: HTMLCanvasElement;
	let chart: Chart;

	// Reactive declarations using server data
	$: portfolioData = data.portfolioData;
	$: networthHistory = portfolioData?.netWorthHistory || [];
	$: netWorthChange = getNetWorthChange(networthHistory);
	$: statusMessage = getStatusMessage(netWorthChange);
	$: isPositive = netWorthChange > 0;
	$: currentNetWorth = networthHistory?.length
		? (networthHistory[networthHistory.length - 1]?.netWorth ?? 0)
		: 0;

	let showRevealModal = false;
	let localHasRedeemed = data.user.hasRedeemed;
	let showConfirmation = !localHasRedeemed;

	// Lifecycle hooks
	onMount(() => {
		updateCountdowns();
		interval = setInterval(updateCountdowns, 1000);

		const ctx = canvas.getContext('2d');
		if (ctx) {
			chart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: Array.from({ length: networthHistory.length }, (_, i) => `Hour ${i + 1}`),
					datasets: [
						{
							label: 'Net Worth',
							data: networthHistory.map((h) => h.netWorth),
							borderColor: '#012bf4',
							backgroundColor: 'rgba(1, 43, 244, 0.1)',
							borderWidth: 3,
							tension: 0.4,
							fill: true,
							pointBackgroundColor: '#031a94',
							pointBorderColor: '#fff',
							pointHoverRadius: 8,
							pointHoverBackgroundColor: '#ffe502'
						}
					]
				},
				options: {
					responsive: true,
					animation: {
						duration: 2000,
						easing: 'easeInOutQuart'
					},
					plugins: {
						legend: {
							display: false
						}
					},
					scales: {
						y: {
							grid: {
								color: 'rgba(171, 162, 253, 0.2)',
								lineWidth: 1,
								drawBorder: false
							},
							ticks: {
								color: '#012bf4',
								font: {
									family: 'Degular',
									size: 14
								}
							}
						},
						x: {
							grid: {
								color: 'rgba(171, 162, 253, 0.2)',
								lineWidth: 1,
								drawBorder: false
							},
							ticks: {
								color: '#012bf4',
								font: {
									family: 'Degular',
									size: 14
								}
							}
						}
					}
				}
			});
		}
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
		if (chart) chart.destroy();
	});

	// Functions
	function updateCountdowns() {
		nextUpdateTimeLeft = calculateTimeLeft(portfolioData.nextCheckTime);
		autoRedeemTimeLeft = calculateTimeLeft(portfolioData.redeemTime);
	}

	function calculateTimeLeft(targetTime: number) {
		const now = new Date().getTime();
		const difference = targetTime - now;
		return Math.max(0, Math.floor(difference / 1000));
	}

	function formatTime(seconds: number) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
			2,
			'0'
		)}:${String(remainingSeconds).padStart(2, '0')}`;
	}

	function getNetWorthChange(history: Array<{ netWorth: number; coinsWorth: object }>) {
		if (!history?.length || history.length < 2) return 0;
		const latest = history[history.length - 1]?.netWorth ?? 0;
		const previous = history[history.length - 2]?.netWorth ?? 0;
		return latest - previous;
	}

	function getStatusMessage(change: number) {
		if (change > 50) {
			return 'Absolutely crushing it! 🚀';
		} else if (change > 25) {
			return 'Looking good! 📈';
		} else if (change > 0) {
			return 'Slow and steady wins the race! 🐢';
		} else {
			return 'HODL strong! 💎';
		}
	}

	async function sharePortfolio(portfolioId: string) {
		try {
			// Capture the portfolio section
			const element = document.querySelector('.max-w-4xl');
			if (!element) throw new Error('Portfolio element not found');

			const canvas = await html2canvas(element as HTMLElement, {
				backgroundColor: '#000', // Match your background
				scale: 2 // Higher quality
			});

			// Convert canvas to blob
			const blob = await new Promise<Blob>((resolve) => {
				canvas.toBlob((blob) => {
					resolve(blob!);
				}, 'image/png');
			});

			// Download the image
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = 'portfolio.png';
			link.click();
			URL.revokeObjectURL(link.href);
		} catch (error) {
			console.error('Error sharing portfolio:', error);
			alert('Failed to download portfolio. Please try again.');
		}
	}

	function handleBack() {
		goto('/');
	}

	function handleRedeem() {
		localHasRedeemed = true;
	}
</script>

<svelte:head>
	<title>MEMEMCOOOINS | Portfolio Dashboard</title>
	<meta name="description" content="Your crypto portfolio tracker" />
</svelte:head>

<div
	class="min-h-screen bg-[#d3c0fe] bg-[linear-gradient(to_right,#aba2fd_1px,transparent_1px),linear-gradient(to_bottom,#aba2fd_1px,transparent_1px)] bg-[size:48px_48px] p-4 sm:p-8"
>
	<div class="mx-auto max-w-4xl">
		<!-- Back Button -->
		<div class="mb-8 flex items-center justify-between">
			<button
				on:click={handleBack}
				class="flex items-center gap-2 rounded-lg border-2 border-black bg-[#012bf4] px-4 py-2 text-white shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
			>
				<Icon icon="lucide:arrow-left" class="h-5 w-5" />
				<span class="hidden font-semibold sm:inline">BACK</span>
			</button>
		</div>

		{#if localHasRedeemed}
			<div class="cyber-window mx-auto mb-8">
				<div class="window-header bg-red-600">
					<div class="window-dots">
						<div class="dot"></div>
						<div class="dot"></div>
						<div class="dot"></div>
					</div>
					<span class="mx-4 text-white">⚠️ &nbsp; Wallet Status</span>
				</div>
				<div class="window-content bg-yellow-300 p-6 text-center">
					<div class="flex items-center justify-center gap-3">
						<Icon icon="lucide:alert-triangle" class="h-6 w-6 text-red-600" />
						<p class="font-press-start-2p text-lg text-red-600">
							You've already redeemed your wallet! Nothing to do here :/
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Timers Window -->
		{#if !localHasRedeemed}
			<div
				class="mx-auto mb-8 overflow-hidden rounded-lg border-2 border-black shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:rotate-1"
			>
				<div class="flex items-center justify-between bg-[#012bf4] px-4 py-2">
					<span class="text-white">⏰ &nbsp; Timers</span>
					<div class="flex gap-2">
						<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
						<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
						<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
					</div>
				</div>
				<div class="grid grid-cols-1 gap-6 border-t-2 border-black bg-[#ffe502] p-8 md:grid-cols-2">
					<!-- Next Update Timer -->
					<div
						class="rounded-lg border-2 border-black bg-white p-6 text-center shadow-[4px_4px_0px_0px_rgba(166,168,239,0.2)]"
					>
						<h3 class="mb-4 text-xl">NEXT UPDATE IN</h3>
						<p class="text-4xl font-bold text-[#012bf4]">{formatTime(nextUpdateTimeLeft)}</p>
					</div>

					<!-- Auto Redeem Timer -->
					<div
						class="rounded-lg border-2 border-black bg-white p-6 text-center shadow-[4px_4px_0px_0px_rgba(166,168,239,0.2)]"
					>
						<h3 class="mb-4 text-xl">AUTO-REDEEM IN</h3>
						<p class="text-4xl font-bold text-[#012bf4]">{formatTime(autoRedeemTimeLeft)}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Portfolio Status Window -->
		<div
			class="mx-auto mb-8 overflow-hidden rounded-lg border-2 border-black shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between bg-[#012bf4] px-4 py-2">
				<span class="text-white">💰 &nbsp; BAG STATUS</span>
				<div class="flex gap-2">
					<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
					<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
					<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
				</div>
			</div>
			<div class="border-t-2 border-black bg-white p-8">
				<div class="mb-8 flex items-center justify-between">
					<h2 class="font-vt323 text-3xl">Current Worth</h2>
					{#if currentNetWorth !== null}
						<p class="text-5xl font-bold text-[#012bf4]">${currentNetWorth.toLocaleString()}</p>
					{:else}
						<p class="text-xl text-gray-500">Waiting for first update...</p>
					{/if}
				</div>

				<div class="space-y-12">
					{#each portfolioData?.coins ?? [] as coin, index}
						<div class="relative">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="mb-2 text-2xl text-[#012bf4]">Mystery Coin #{index + 1}</h3>
									<p class="text-3xl font-black leading-tight">
										{(coin?.amount ?? 0).toLocaleString()} coins
									</p>
									<!-- <p class="mt-4 font-mono text-gray-500">Current value in USD</p> -->
								</div>
								<p class="text-3xl font-black text-neutral-600">
									${(
										portfolioData.netWorthHistory[portfolioData.netWorthHistory.length - 1]
											?.coinsWorth?.[coin.id] ?? 0
									).toLocaleString()}
								</p>
							</div>
						</div>

						{#if index !== portfolioData?.coins.length - 1}
							<div class="my-2 w-full border-0 border-b-4 border-dotted border-[#012bf4]"></div>
						{/if}
					{/each}
				</div>
			</div>
		</div>

		<!-- Chart Window -->
		<div
			class="mx-auto mb-8 overflow-hidden rounded-lg border-2 border-black shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between bg-[#012bf4] px-4 py-2">
				<span class="text-white">📈 &nbsp; Performance</span>
				<div class="flex gap-2">
					<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
					<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
					<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
				</div>
			</div>
			<div class="border-t-2 border-black bg-white p-8">
				{#if networthHistory.length > 0}
					<canvas bind:this={canvas}></canvas>
				{:else}
					<p class="text-center text-2xl text-gray-500">📊 Waiting for first update...</p>
				{/if}
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
			<button
				on:click={() => sharePortfolio(portfolioData.id)}
				class="rounded-lg text-lg border-2 border-black bg-[#012bf4] px-6 py-4 text-white shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
			>
				🔗 SHARE THE SAUCE
			</button>

			{#if localHasRedeemed}
				<button
					on:click={() => {
						showRevealModal = true;
						showConfirmation = false;
					}}
					class="rounded-lg text-lg border-2 border-black bg-[#012bf4] px-6 py-4 text-white shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
				>
					🔍 VIEW REVEALED COINS
				</button>
			{:else}
				<button
					on:click={() => (showRevealModal = true)}
					class="rounded-lg text-lg border-2 border-black bg-[#012bf4] px-6 py-4 text-white shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
				>
					💸 CASH OUT
				</button>
			{/if}
		</div>
	</div>
</div>

<PortfolioRevealModal
	show={showRevealModal}
	onClose={() => (showRevealModal = false)}
	portfolio={portfolioData?.coins || []}
	netWorthHistory={networthHistory}
	coins={data.coins}
	clerkId={data.user.clerkId}
	hasRedeemed={localHasRedeemed}
	onRedeem={handleRedeem}
	skipConfirmation={localHasRedeemed}
/>
