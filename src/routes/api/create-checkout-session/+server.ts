import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { SECRET_STRIPE_KEY, DOMAIN } from '$env/static/private';
import { error } from '@sveltejs/kit';

const stripe = new Stripe(SECRET_STRIPE_KEY, {
	apiVersion: '2024-11-20.acacia'
});

export async function POST({ locals }) {
	// Check if user is authenticated
	if (!locals.auth?.userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Create a Checkout Session with Stripe
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			mode: 'payment',
			line_items: [
				{
					price_data: {
						currency: 'usd',
						product_data: {
							name: 'Random Memecoin Wallet',
							images: [
								'https://i.ibb.co/nn6YtSj/random-wallet.webp'
							]
						},
						unit_amount: 5000 // Amount in cents ($50)
					},
					quantity: 1
				}
			],
			client_reference_id: locals.auth.userId, // Add user ID to track who made the purchase
			success_url: `${DOMAIN}/wallet`,
			cancel_url: `${DOMAIN}`
		});

		return json({ id: session.id });
	} catch (error) {
		console.error('Error creating checkout session:', error);
		return json({ error: 'Unable to create checkout session' }, { status: 500 });
	}
}
