<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { generateSolanaWallet } from '$lib/utils/wallet';
	
	export let onClose: () => void;
	
	let walletAddress: string;
	
	onMount(() => {
		if (typeof window !== 'undefined') {
			const { publicKey } = generateSolanaWallet();
			walletAddress = publicKey;
		}
	});

	function copyToClipboard(text: string) {
		if (typeof navigator !== 'undefined') {
			navigator.clipboard.writeText(text);
		}
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
	<div class="relative flex h-[90vh] w-[90vw] flex-col rounded-lg bg-[#1d1f25] md:flex-row">
		<button
			class="absolute right-2 top-2 rounded-full bg-gray-200 p-2"
			on:click={onClose}
		>
			<Icon icon="lucide:x" class="h-5 w-5 text-gray-700" />
		</button>
		<div
			class="flex w-1/2 flex-col items-start justify-start overflow-y-auto rounded-l-lg px-10 py-5 text-gray-50"
		>
			<div class="text-xl font-medium mb-4">Instructions</div>

			<div class="flex flex-col gap-2">
				<div>1. Enter the amount you wish to deposit.</div>
				<div>
					2. Choose <span class="font-semibold">USDC</span> as the receiving token on the
					<span class="font-semibold">Solana</span> network.
				</div>
				<div class="flex flex-col gap-2">
					<div>
						3. Things will look like the image below. Click <span class="font-semibold">Buy Now</span> to
						complete the transaction.
					</div>
					<img
						src="/img/instructions/1.png"
						alt="Click on &quot;Buy Now&quot;"
						class="rounded-lg border-2 border-neutral-800"
					/>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<div class="flex items-center gap-2">
						4. Now paste the following address (it's your wallet):
					</div>
					<div class="flex items-center gap-2">
						<span class="font-mono text-gray-100 bg-neutral-800 rounded-md px-1 py-0.5">{walletAddress}</span>
						<button
							class="rounded-lg p-1.5 hover:bg-neutral-900"
							on:click={() => copyToClipboard(walletAddress)}
							title="Copy to clipboard"
						>
							<Icon icon="lucide:copy" class="h-4 w-4 text-gray-600" />
						</button>
					</div>
				</div>
			</div>

			<br />
		</div>
		<iframe src="https://global.transak.com/" title="Deposit" class="h-full w-1/2 rounded-r-lg"></iframe>
	</div>
</div>