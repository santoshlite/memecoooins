<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createCheckoutSession, handlePaymentStatus } from '$lib/utils/payment';
	import { SignedIn, SignedOut, UserButton } from 'svelte-clerk';
	import Icon from '@iconify/svelte';
	import StatusModal from '$lib/components/StatusModal.svelte';
	import { createSignInHandler } from '$lib/utils/auth';

	let showModal = false;
	let modalMessage = '';
	let modalType: 'success' | 'error' = 'success';

	const handleSignIn = createSignInHandler();

	let glitchText = "$49, A WALLET, AND 24 HOURS TO CHANGE YOUR FATE";
	const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

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
	<title>🚀 Blockrok - Your Memecoin Adventure</title>
	<meta name="description" content="$49, a wallet, and 24 hours to change your fate. Memecoins inside. Moon or bust." />
</svelte:head>

<div class="meme-bg min-h-screen text-white">
	<div class="w-full min-h-screen flex flex-col items-center justify-center p-4">
		<!-- Logo -->
		<div class="w-96 h-40">
			<img src="/img/blockrok_logo.png" alt="BlockROK" class="w-full h-full object-contain" />
		</div>
		<p class="font-vt323 text-center mt-2 text-gray-400 text-lg sm:text-xl mb-8">
			trust me bro™
		</p>

		<!-- Auth UI Components -->
		<SignedIn>
			<div class="absolute right-4 top-4">
				<UserButton afterSignOutUrl="/" />
			</div>
		</SignedIn>

		<!-- Hero Section -->
		<div class="cyber-card w-full max-w-4xl p-6 sm:p-12 rounded-xl text-center mb-8 relative overflow-hidden">
			<div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse-slow"></div>
			<h1 class="glitch-text text-xl sm:text-3xl md:text-4xl mb-6">
				{glitchText}
			</h1>
			<p class="font-vt323 text-xl sm:text-2xl text-purple-400 mb-4">
				MEMECOINS INSIDE. MOON OR BUST. YOU IN?
			</p>

			<!-- Action Buttons -->
			<SignedOut>
				<button
					class="cyber-card p-6 mt-4 hover:scale-105 transition-all duration-300 w-full max-w-lg mx-auto group relative overflow-hidden flex items-center gap-2 justify-center"
					on:click={handleSignIn}
				>
					<div class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 group-hover:from-green-500/20 group-hover:to-blue-500/20 transition-all duration-500"></div>
					<Icon icon="lucide:user" class="h-5 w-5" />
					<p class="font-vt323 text-2xl sm:text-3xl text-green-400 group-hover:text-green-300 transition-colors relative z-10">
						Login to Start Your Journey
					</p>
				</button>
			</SignedOut>

			<SignedIn>
				<button
					class="cyber-card p-6 mt-4 hover:scale-105 transition-all duration-300 w-full max-w-lg mx-auto group relative overflow-hidden flex items-center gap-2 justify-center"
					on:click={hasPortfolio ? viewWallet : handleBuy}
				>
					<div class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 group-hover:from-green-500/20 group-hover:to-blue-500/20 transition-all duration-500"></div>
					<Icon icon={hasPortfolio ? "lucide:wallet" : "lucide:credit-card"} class="h-5 w-5" />
					<p class="font-vt323 text-2xl sm:text-3xl text-green-400 group-hover:text-green-300 transition-colors relative z-10">
						{hasPortfolio ? 'View My Wallet' : 'Buy Now'}
					</p>
				</button>
			</SignedIn>
		</div>

		<!-- How It Works -->
		<div class="cyber-card w-full max-w-4xl p-6 sm:p-12 rounded-xl relative overflow-hidden">
			<div class="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 animate-pulse-slow"></div>

			<h2 class="font-press-start-2p text-lg sm:text-xl mb-6 text-center">HOW IT WORKS</h2>
			<p class="font-vt323 text-lg sm:text-xl mb-8 text-center text-purple-300">
				Welcome to Blockrok, where the rules are simple and the stakes are spicy. Buy a wallet preloaded with
				$50 in random memecoins, then pick your poison:
			</p>

			<!-- Options Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
				<!-- Option 1 -->
				<div class="cyber-card p-6 rounded-xl relative group">
					<div class="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 group-hover:from-green-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
					<h3 class="font-press-start-2p text-sm sm:text-base mb-4 text-green-400">OPTION 01: LET IT RIDE</h3>
					<p class="font-vt323 text-base sm:text-lg mb-4">
						No peeking allowed. Your wallet balance updates every hour, but what's inside? A mystery. Will
						it moon? Will it sink? Only one way to find out: vibe it out and watch the numbers dance.
					</p>
				</div>

				<!-- Option 2 -->
				<div class="cyber-card p-6 rounded-xl relative group">
					<div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
					<h3 class="font-press-start-2p text-sm sm:text-base mb-4 text-purple-400">OPTION 02: CASH OUT</h3>
					<p class="font-vt323 text-base sm:text-lg mb-4">
						Play it safe, sigma. Hit the redeem button, convert all those memecoins into USDC, and unlock
						the full wallet. No mystery, just straight-up decisions.
					</p>
				</div>
			</div>

			<!-- The Twist -->
			<div class="cyber-card p-6 rounded-xl text-center relative overflow-hidden group">
				<div class="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 group-hover:from-red-500/10 group-hover:to-orange-500/10 transition-all duration-500"></div>
				<h3 class="font-press-start-2p text-sm sm:text-base mb-4 text-red-400">THE TWIST</h3>
				<p class="font-vt323 text-lg sm:text-xl">
					You've got 24 hours to make a call. This isn't just a wallet; it's a test. Your move.
				</p>
			</div>
		</div>
	</div>
</div>

<StatusModal show={showModal} message={modalMessage} type={modalType} onClose={handleModalClose} />