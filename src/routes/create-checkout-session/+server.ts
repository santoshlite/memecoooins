import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { SECRET_STRIPE_KEY, DOMAIN } from '$env/static/private';

const stripe = new Stripe(SECRET_STRIPE_KEY, {
	apiVersion: '2024-11-20.acacia'
});

export async function POST() {
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
								'https://d1fvq72qdoyrow.cloudfront.net/674a123adaf7a700113efc24/650a3fdd-d79e-436b-8400-4a8820270405---image-removebg-preview_11_1-transformed.png?Expires=1732994322&Key-Pair-Id=K30Q3TNPY13FGE&Signature=xH8xwsOw0l~hsDLGfBvdLOavYvsSE~IE2BnY0t2IPZlRL17Fo6MFcf4sKILbFHz6XZOz5NnvnA~F6pzYUO9~fmmVJcahQ-5d133JobQhDeuVIhZ494JzwNF8iWfMuxqr6A2pKQvPVDMZS2tYoM1Zlj9ejRkk1d4ylCWX3yQB17aV48wEOCb3BevoiDLzNSzn8V1d1h8Nfg17Pb~XgbGlPf0S6CJ27XmI9LXk9qRL2a~l6uC1cYAGFAMP8JqfdxZ2L5zMladlfHvjYRyJGPVOLUSNw9D86aDT0WgBwdIjmAUKmyjAOHD1E6KycTLWMO5BtjcbWbvLpSbmxEtDmZu5rQ__'
							]
						},
						unit_amount: 5000 // Amount in cents ($50)
					},
					quantity: 1
				}
			],
			success_url: `${DOMAIN}/success`,
			cancel_url: `${DOMAIN}/cancel`
		});

		return json({ id: session.id });
	} catch (error) {
		console.error('Error creating checkout session:', error);
		return json({ error: 'Unable to create checkout session' }, { status: 500 });
	}
}
