import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { SECRET_STRIPE_KEY, WEBHOOK_SECRET } from '$env/static/private';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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
		console.log(event.type);
		switch (event.type) {
			case 'checkout.session.completed':
				const session = event.data.object;

				// Hardcoded portfolio update
				// Adding some sample memecoins to the user's portfolio
				const portfolioUpdate = [
					{ id: 'bonk', quantity: 500 },
					{ id: 'mother-iggy', quantity: 500 },
					{ id: 'boba-oppa', quantity: 250 }
				];
				const portfolioCreatedAt = new Date();

				// Update user's portfolio in database
				await prisma.user.update({
					where: {
						clerkId: session.client_reference_id!
					},
					data: {
						portfolio: portfolioUpdate,
						portfolioCreatedAt: portfolioCreatedAt,
						hasPaid: true
					}
				});

				console.log('Portfolio updated for user:', session.client_reference_id);
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
