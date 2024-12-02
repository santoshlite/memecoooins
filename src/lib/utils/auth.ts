import { useClerkContext } from 'svelte-clerk';

export function handleAuth(type: 'signIn' | 'signUp') {
	const ctx = useClerkContext();

	return () => {
		if (type === 'signUp') {
			ctx.clerk?.openSignIn({
				redirectUrl: window.location.origin + '?trigger=buy'
			});
		} else {
			ctx.clerk?.openSignIn({
				redirectUrl: window.location.origin + '/wallet'
			});
		}
	};
}
