import { useClerkContext } from 'svelte-clerk';

export function createSignInHandler() {
	const ctx = useClerkContext();

	return () => {
		ctx.clerk?.openSignIn({
			forceRedirectUrl: window.location.origin + '?trigger=buy'
		});
	};
}
