import { buildClerkProps } from 'svelte-clerk/server';
import type { RequestEvent } from '@sveltejs/kit';

export const load = async ({ locals }: RequestEvent) => {
	return {
		...buildClerkProps(locals.auth)
	};
};