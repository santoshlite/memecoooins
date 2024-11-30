import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/database';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.auth.userId) {
		throw redirect(303, '/');
	}

	const user = await prisma.user.findUnique({
		where: { clerkId: locals.auth.userId }
	});

	return {
		user
	};
};