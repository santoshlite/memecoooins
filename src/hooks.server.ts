import { withClerkHandler } from 'svelte-clerk/server';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { prisma } from '$lib/server/database';
import { createClerkClient } from '@clerk/express';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const protectedPaths = ['/wallet'];

const userHandler: Handle = async ({ event, resolve }) => {
	if (event.locals.auth?.userId) {
		const user = await clerk.users.getUser(event.locals.auth.userId);
		const email = user.emailAddresses[0]?.emailAddress || '';

		await prisma.user.upsert({
			where: { clerkId: event.locals.auth.userId },
			update: {},
			create: {
				clerkId: event.locals.auth.userId,
				email: email,
				portfolio: {}
			}
		});
	}

	return resolve(event);
};

const protectedRouteHandler: Handle = async ({ event, resolve }) => {
	const isProtectedPath = protectedPaths.some((path) => event.url.pathname.startsWith(path));

	if (isProtectedPath && !event.locals.auth?.userId) {
		throw redirect(303, '/');
	}

	return resolve(event);
};

export const handle = sequence(withClerkHandler(), userHandler, protectedRouteHandler);
