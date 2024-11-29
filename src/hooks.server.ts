import { withClerkHandler } from 'svelte-clerk/server';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const protectedPaths = ['/wallet'];

const protectedRouteHandler: Handle = async ({ event, resolve }) => {
	const isProtectedPath = protectedPaths.some((path) => event.url.pathname.startsWith(path));

	if (isProtectedPath && !event.locals.auth?.userId) {
		throw redirect(303, '/');
	}

	return resolve(event);
};

export const handle = sequence(withClerkHandler(), protectedRouteHandler);
