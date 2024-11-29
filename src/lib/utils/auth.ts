import { useClerkContext } from 'svelte-clerk';

export function handleSignIn() {
	const ctx = useClerkContext();
	ctx.clerk?.openSignIn({
		redirectUrl: window.location.href
	});
}
