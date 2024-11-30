import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/database';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.auth.userId) {
		throw redirect(303, '/');
	}

	const user = await prisma.user.findUnique({
		where: { clerkId: locals.auth.userId }
	});

	if (!user) {
		throw redirect(303, '/');
	}

	// Get the user's portfolio with current prices
	const portfolio = user.portfolio ?? [];
	const coins = await prisma.coin.findMany({
		where: {
			id: {
				in: (portfolio as Array<{ id: string }>).map((item) => item.id)
			}
		}
	});

	// Combine portfolio quantities with current prices
	const portfolioWithPrices = (portfolio as Array<{ id: string }>).map(item => {
		const coin = coins.find((c) => c.id === item.id);
		return {
			...item,
			currentPrice: coin?.current_price ?? null,
			name: coin?.name ?? '',
			symbol: coin?.symbol ?? ''
		};
	});

	return {
		user: {
			...user,
			portfolio: portfolioWithPrices
		}
	};
};