<script lang="ts">
	import Icon from '@iconify/svelte';

	export let show = false;
	export let message = '';
	export let type: 'success' | 'error' = 'success';
	export let onClose: () => void;
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="rounded-lg bg-neutral-800 p-6 shadow-lg">
			<div class="flex flex-col items-center gap-4">
				<Icon
					icon={type === 'success' ? 'lucide:check-circle' : 'lucide:x-circle'}
					class="h-12 w-12 {type === 'success' ? 'text-green-500' : 'text-red-500'}"
				/>
				<p class="text-center text-gray-100">{message}</p>
				<button
					class="rounded-lg bg-neutral-700 px-4 py-2 text-gray-100 hover:bg-neutral-600"
					on:click={onClose}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
