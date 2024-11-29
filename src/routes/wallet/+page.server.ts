import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.auth.userId) {
		throw redirect(303, '/');
	}
	return {
		// Add any data you want to load for the wallet page
	};
};
