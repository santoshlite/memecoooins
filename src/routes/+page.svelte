<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createCheckoutSession, handlePaymentStatus } from '$lib/utils/payment';
	import { SignedIn, SignedOut, UserButton } from 'svelte-clerk';
	import Icon from '@iconify/svelte';
	import StatusModal from '$lib/components/StatusModal.svelte';
	import { handleAuth } from '$lib/utils/auth';

	let showModal = false;
	let modalMessage = '';
	let modalType: 'success' | 'error' = 'success';

	const handleSignIn = handleAuth('signIn');
	const handleSignUp = handleAuth('signUp');

	let glitchText = '$50, A WALLET, AND 24 HOURS TO CHANGE YOUR FATE';
	const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

	function glitchCharacter(text: string, position: number) {
		const chars = text.split('');
		chars[position] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
		return chars.join('');
	}

	let glitchInterval: ReturnType<typeof setInterval>;

	export let data;

	const hasPortfolio = data.hasPortfolio;

	function viewWallet() {
		goto('/wallet');
	}

	async function handleBuy() {
		const result = await createCheckoutSession();
		if (result.error) {
			showModal = true;
			modalType = 'error';
			modalMessage = result.error;
		}
	}

	function handleModalClose() {
		showModal = false;
	}

	onMount(() => {
		// Handle payment status
		const paymentStatus = $page.url.searchParams.get('payment');
		if (paymentStatus) {
			const status = handlePaymentStatus(paymentStatus);
			if (status) {
				showModal = true;
				modalType = status.type as 'success' | 'error';
				modalMessage = status.message;
				goto('/', { replaceState: true });
			}
		}

		// Handle buy trigger after login
		const trigger = $page.url.searchParams.get('trigger');
		if (trigger === 'buy') {
			handleBuy();
			goto('/', { replaceState: true });
		}

		// Glitch text effect
		glitchInterval = setInterval(() => {
			const position = Math.floor(Math.random() * glitchText.length);
			const originalChar = glitchText[position];
			glitchText = glitchCharacter(glitchText, position);
			setTimeout(() => {
				const chars = glitchText.split('');
				chars[position] = originalChar;
				glitchText = chars.join('');
			}, 100);
		}, 2000);

		return () => {
			clearInterval(glitchInterval);
		};
	});
</script>

<svelte:head>
	<title>MEMECOOOINS | Get Your Random Mememcoin Crypto Wallet Now | Limited Edition</title>
</svelte:head>

<div
	class="min-h-screen bg-[#d3c0fe] bg-[linear-gradient(to_right,#aba2fd_1px,transparent_1px),linear-gradient(to_bottom,#aba2fd_1px,transparent_1px)] bg-[size:48px_48px] p-4 sm:p-8"
>
	<!-- User Controls -->
	<div class="mx-auto mb-4 max-w-2xl">
		<SignedOut>
			<div class="flex justify-end">
				<button
					class="flex items-center gap-2 rounded-lg border-2 border-black bg-[#012bf4] px-4 py-2 text-white shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-[#0025d9]"
					on:click={handleSignIn}
				>
					<Icon icon="lucide:log-in" class="h-4 w-4" />
					<span class="font-semibold">LOGIN</span>
				</button>
			</div>
		</SignedOut>
		<SignedIn>
			<div class="flex justify-end">
				<UserButton afterSignOutUrl="/" />
			</div>
		</SignedIn>
	</div>

	<!-- Logo Window -->
	<div
		class="mx-auto mb-8 max-w-2xl overflow-hidden rounded-lg border-2 border-black shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-1 hover:rotate-1 hover:scale-[1.02]"
	>
		<div class="flex items-center justify-between bg-[#012bf4] px-4 py-2">
			<span class="flex-grow"></span>
			<div class="flex gap-2">
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
			</div>
		</div>
		<div class="border-t-2 border-black bg-white p-8 text-center">
			<img src="/img/memecoooins_logo.png" class="mx-auto h-auto w-96" alt="logo" />
			<p class="font-vt323 mt-2 text-gray-600">made by trust me bro™</p>
		</div>
	</div>

	<!-- Game Status Window -->
	<div
		class="mx-auto mb-8 max-w-2xl overflow-hidden rounded-lg border-2 border-black shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:translate-y-1 hover:rotate-1"
	>
		<div class="flex items-center justify-between bg-[#012bf4] px-4 py-2">
			<span class="font-light text-white">Our offer</span>
			<div class="flex gap-2">
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
			</div>
		</div>
		<div class="border-t-2 border-black bg-[#ffe502] p-8 text-center">
			<h2 class="text-3xl font-bold">$50, A WALLET, AND 24 HOURS TO CHANGE YOUR FATE</h2>
			<SignedOut>
				<div class="relative w-full">
					<button
						class="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#012bf4] px-6 py-3 text-xl font-bold text-white hover:bg-[#0025d9]"
						on:click={handleSignUp}
					>
						GET A WALLET
					</button>
				</div>
			</SignedOut>

			<SignedIn>
				{#if hasPortfolio}
					<button
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#012bf4] px-6 py-3 text-xl font-bold text-white hover:bg-[#0025d9]"
						on:click={viewWallet}
					>
						CHECK MY WALLET
					</button>
				{:else}
					<button
						class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#012bf4] px-6 py-3 text-xl font-bold text-white hover:bg-[#0025d9]"
						on:click={handleBuy}
					>
						GET A MY WALLET
					</button>
				{/if}
			</SignedIn>
		</div>
	</div>

	<!-- How It Works Window -->
	<div
		class="mx-auto mb-8 max-w-2xl overflow-hidden rounded-lg border-2 border-black shadow-[-8px_8px_0px_0px_rgba(166,168,239,0.5)] transition-transform hover:-translate-y-1 hover:-rotate-1"
	>
		<div class="flex items-center justify-between bg-[#012bf4] px-4 py-2">
			<span class="text-white">How it works</span>
			<div class="flex gap-2">
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
				<div class="h-3 w-3 rounded-full bg-[#031a94]"></div>
			</div>
		</div>
		<div class="border-t-2 border-black bg-white p-8">
			<div class="space-y-12">
				<div class="relative">
					<h3 class="mb-4 text-2xl text-[#012bf4]">Step 1</h3>
					<p class="text-4xl font-black leading-tight">GET A MYSTERY BAG OF MEMECOINS WORTH $50</p>
					<p class="mt-4 font-mono text-gray-500">
						Note: you won't be able to see what's inside, that's the fun part.
					</p>
				</div>

				<div class="my-8 w-full border-0 border-b-4 border-dotted border-[#012bf4]"></div>

				<div class="relative">
					<h3 class="mb-4 text-2xl text-[#012bf4]">Step 2</h3>
					<p class="text-4xl font-black leading-tight">WATCH YOUR BALANCE UPDATE EVERY HOUR</p>
					<p class="mt-4 font-mono text-gray-500">
						Your portfolio balance will be updated every hour. It may moon, it may crash.
					</p>
				</div>

				<div class="my-8 w-full border-0 border-b-4 border-dotted border-[#012bf4]"></div>

				<div class="relative">
					<h3 class="mb-4 text-2xl text-[#012bf4]">Step 3</h3>
					<p class="text-4xl font-black leading-tight">CASH OUT OR KEEP RIDING THE WAVE</p>
					<p class="mt-4 font-mono text-gray-500">
						The choice is yours. Cash out anytime to get your wallet's private key and full access.
						After 24 hours, your wallet will be automatically redeemed.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<StatusModal show={showModal} message={modalMessage} type={modalType} onClose={handleModalClose} />
