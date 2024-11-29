import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [
		sveltekit(),
		nodePolyfills({
			include: ['buffer', 'crypto'],
			globals: {
				Buffer: true,
				global: true,
				process: true
			}
		})
	]
});
