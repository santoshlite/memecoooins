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

	// Get the user's portfolio
	const portfolio = user.portfolio ?? [];
	const coins = await prisma.coin.findMany({
		where: {
			id: {
				in: (portfolio as Array<{ id: string }>).map((item) => item.id)
			}
		}
	});

	// Map portfolio with amount only, using real coin IDs
	const portfolioCoins = (portfolio as Array<{ id: string; quantity: number }>).map((item) => {
		return {
			id: item.id,
			amount: item.quantity
		};
	});

	// Get latest net worth from history - add null check
	const netWorthHistory = (user.netWorthHistory as Array<{ 
		netWorth: number;
		coinsWorth: Record<string, number>;
	}>) ?? [];

	// Calculate next hourly check time (rounded to next hour)
	const now = new Date();
	const nextHour = new Date(now);
	nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
	const nextCheckTime = nextHour.getTime();

	// Calculate redeem time (24 hours from portfolio creation)
	const redeemTime = user.portfolioCreatedAt 
		? new Date(user.portfolioCreatedAt).getTime() + (24 * 60 * 60 * 1000)
		: 0;

	return {
		portfolioData: {
			id: user.id,
			coins: portfolioCoins,
			nextCheckTime,
			redeemTime,
			netWorthHistory,
			hasPaid: user.hasPaid
		}
	};
};