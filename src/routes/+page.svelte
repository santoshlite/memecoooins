<script lang="ts">
	import Icon from '@iconify/svelte';
	import { SignedIn, SignedOut, UserButton, useClerkContext } from 'svelte-clerk';
	
	const ctx = useClerkContext();

	function handleSignIn() {
		ctx.clerk?.openSignIn({
			redirectUrl: window.location.href
		});
	}
</script>

<div class="flex h-screen w-full flex-col items-center justify-center p-4">
	<div
		class="relative flex h-full w-full flex-col items-center justify-center rounded-2xl bg-neutral-800 text-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
	>
		<div class="flex flex-col items-center space-y-4">
			<img src="/img/blockrok_logo.png" alt="Blockrok" class="h-32" />
			<p class="text-xl font-medium">The World's Largest Memecoin Asset Manager</p>

			<SignedOut>
				<button
					class="hover:bg-green-600 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-gray-100 transition-colors"
					on:click={handleSignIn}
				>
					<Icon icon="lucide:credit-card" class="h-5 w-5" />
					<div>Login</div>
				</button>
			</SignedOut>

			<!-- <SignedIn>
				<UserButton />
			</SignedIn> -->
		</div>

		<div class="absolute bottom-0 mb-8 flex items-center gap-2 px-4 py-2 font-medium text-gray-100">
			<div>Learn More</div>
			<Icon icon="lucide:arrow-down" class="h-5 w-5" />
		</div>
	</div>
</div>


