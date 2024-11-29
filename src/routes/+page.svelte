<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { createCheckoutSession, handlePaymentStatus } from '$lib/utils/payment';
	import { SignedIn, SignedOut, UserButton } from 'svelte-clerk';
	import Icon from '@iconify/svelte';
	import StatusModal from '$lib/components/StatusModal.svelte';
	import { handleSignIn } from '$lib/utils/auth';

	let showModal = false;
	let modalMessage = '';
	let modalType: 'success' | 'error' = 'success';

	async function handleBuy() {
		const result = await createCheckoutSession();
		if (result.error) {
			showModal = true;
			modalType = 'error';
			modalMessage = result.error;
		}
	}

	onMount(() => {
		const paymentStatus = $page.url.searchParams.get('payment');
		const status = handlePaymentStatus(paymentStatus);

		if (status) {
			showModal = true;
			modalType = status.type as 'success' | 'error';
			modalMessage = status.message;

			// Clean up the URL
			window.history.replaceState({}, '', '/');
		}
	});

	function handleModalClose() {
		showModal = false;
	}
</script>

<div class="flex h-screen w-full flex-col items-center justify-center p-4">
	<div
		class="relative flex h-full w-full flex-col items-center justify-center rounded-2xl bg-neutral-800 text-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
	>
		<!-- Auth UI Components -->
		<SignedIn>
			<div class="absolute right-4 top-4">
				<UserButton afterSignOutUrl="/" />
			</div>
		</SignedIn>

		<!-- Main Content -->
		<div class="flex flex-col items-center space-y-4">
			<!-- Logo and Tagline -->
			<img src="/img/blockrok_logo.png" alt="Blockrok" class="h-32" />
			<p class="text-xl font-medium">The World's Largest Memecoin Asset Manager</p>

			<!-- Action Buttons -->
			<SignedOut>
				<button
					class="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-gray-100 transition-colors hover:bg-green-600"
					on:click={handleSignIn}
				>
					<Icon icon="lucide:credit-card" class="h-5 w-5" />
					<div>Login</div>
				</button>
			</SignedOut>

			<SignedIn>
				<button
					class="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-gray-100 transition-colors hover:bg-green-600"
					on:click={handleBuy}
				>
					<Icon icon="lucide:credit-card" class="h-5 w-5" />
					<div>Buy</div>
				</button>
			</SignedIn>
		</div>

		<!-- Footer -->
		<div class="absolute bottom-0 mb-8 flex items-center gap-2 px-4 py-2 font-medium text-gray-100">
			<div>Learn More</div>
			<Icon icon="lucide:arrow-down" class="h-5 w-5" />
		</div>
	</div>
</div>

<StatusModal show={showModal} message={modalMessage} type={modalType} onClose={handleModalClose} />
