import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { SECRET_STRIPE_KEY, WEBHOOK_SECRET } from '$env/static/private';

const stripe = new Stripe(SECRET_STRIPE_KEY, {
	apiVersion: '2024-11-20.acacia'
});

export async function POST({ request }) {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return json({ error: 'No signature' }, { status: 400 });
	}

	try {
		const event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);

		switch (event.type) {
			case 'checkout.session.completed':
				const session = event.data.object;
				// Handle successful payment
				// You can store the payment info in your database here
				console.log('Payment successful:', session);
				break;

			default:
				console.log(`Unhandled event type ${event.type}`);
		}

		return json({ received: true });
	} catch (err) {
		console.error('Webhook error:', err);
		return json({ error: 'Webhook error' }, { status: 400 });
	}
}
