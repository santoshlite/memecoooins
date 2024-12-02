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
	<title>🚀 MEMECOOINS - Your Memecoin Adventure</title>
</svelte:head>

<div 
  class="min-h-screen p-8 bg-[#d3c0fe] bg-[linear-gradient(to_right,#aba2fd_1px,transparent_1px),linear-gradient(to_bottom,#aba2fd_1px,transparent_1px)] bg-[size:48px_48px]"
>	<!-- Logo Window -->
	<div class="cyber-window mx-auto mb-8 max-w-2xl">
		<div class="window-header">
			<div class="window-dots">
				<div class="dot"></div>
				<div class="dot"></div>
				<div class="dot"></div>
			</div>
		</div>
		<div class="window-content bg-white p-8 text-center">
			<h1 class="glitch-text text-5xl font-bold tracking-wider">
				MEME<span class="text-yellow-400">COOO</span>INS
			</h1>
			<p class="font-vt323 mt-2 text-gray-600">trust me bro™</p>
		</div>
	</div>

	<!-- Game Status Window -->
	<div class="cyber-window mx-auto mb-8 max-w-xl">
		<div class="window-header bg-blue-600">
			<div class="window-dots">
				<div class="dot"></div>
				<div class="dot"></div>
				<div class="dot"></div>
			</div>
			<span class="text-white">Game Status</span>
		</div>
		<div class="bg-[#ffe502] p-8 text-center">
			<h2 class="text-3xl font-bold">
				$50, A WALLET, AND 24 HOURS TO CHANGE YOUR FATE
			</h2>
			<SignedOut>
				<button
					class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#012bf4] px-6 py-3 text-white hover:bg-blue-700"
					on:click={handleSignUp}
				>
					GET THE WALLET
				</button>
			</SignedOut>

            <SignedIn>
				<button
					class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#012bf4] px-6 py-3 text-white hover:bg-blue-700"
					on:click={viewWallet}
				>
					CHECK MY WALLET
				</button>
			</SignedIn>
		</div>
	</div>

	<!-- How It Works Window -->
	<div class="cyber-window mx-auto mb-8 max-w-2xl">
		<div class="window-header bg-blue-600">
			<div class="window-dots">
				<div class="dot"></div>
				<div class="dot"></div>
				<div class="dot"></div>
			</div>
			<span class="text-white">How it works...</span>
		</div>
		<div class="window-content bg-white p-8">
			<div class="space-y-8">
				<div class="step">
					<h3 class="text-xl font-bold text-blue-600">Step 1</h3>
					<p class="text-lg">GET A MYSTERY BAG OF MEMECOINS WORTH $50</p>
				</div>
				<div class="step">
					<h3 class="text-xl font-bold text-blue-600">Step 2</h3>
					<p class="text-lg">WATCH YOUR BALANCE UPDATE EVERY HOUR</p>
				</div>
				<div class="step">
					<h3 class="text-xl font-bold text-blue-600">Step 3</h3>
					<p class="text-lg">CASH OUT OR KEEP RIDING THE WAVE</p>
				</div>
			</div>
		</div>
	</div>
</div>

<StatusModal show={showModal} message={modalMessage} type={modalType} onClose={handleModalClose} />
