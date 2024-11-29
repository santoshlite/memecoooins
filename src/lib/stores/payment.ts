import { loadStripe } from '@stripe/stripe-js';
import { PUBLIC_STRIPE_KEY } from '$env/static/public';
import { goto } from '$app/navigation';

export async function createCheckoutSession() {
	try {
		const response = await fetch('/create-checkout-session', {
			method: 'POST'
		});

		const { id, error } = await response.json();
		if (error) {
			return { error: 'Failed to create checkout session' };
		}

		const stripe = await loadStripe(PUBLIC_STRIPE_KEY);
		if (!stripe) {
			return { error: 'Payment system unavailable' };
		}

		const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: id });
		if (stripeError) {
			return { error: stripeError.message || 'Payment failed' };
		}

		return { success: true };
	} catch (error) {
		return { error: 'An unexpected error occurred' };
	}
}

export function handlePaymentStatus(status: string | null) {
	if (status === 'cancelled') {
		return { type: 'error', message: 'Payment was cancelled' };
	} else if (status === 'success') {
		return { type: 'success', message: 'Payment successful! Redirecting to wallet...' };
	}
	return null;
}
