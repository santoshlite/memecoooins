import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/database';

export const load: PageServerLoad = async ({ locals, depends }) => {
	depends('portfolio:status');

	if (!locals.auth.userId) {
		throw redirect(303, '/');
	}

	let retryCount = 0;
	let user;

	while (retryCount < 3) {
		user = await prisma.user.findUnique({
			where: { clerkId: locals.auth.userId }
		});

		if (!user) {
			throw redirect(303, '/');
		}

		if (user.hasPaid && user.portfolio && Object.keys(user.portfolio).length > 0) {
			break;
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
		retryCount++;
	}

	if (!user.hasPaid) {
		throw redirect(303, '/');
	}

	const portfolio = user.portfolio ?? {};

	console.log('user', user);

	if (Object.keys(portfolio).length === 0) {
		return {
			user: {
				...user,
				portfolio: {}
			}
		};
	}


	const coins = await prisma.coin.findMany({
		where: {
			id: {
				in: (portfolio as Array<{ id: string }>).map((item) => item.id)
			}
		}
	});


	const portfolioCoins = (portfolio as Array<{ id: string; quantity: number }>).map((item) => {
		return {
			id: item.id,
			amount: item.quantity
		};
	});

	const netWorthHistory =
		(user.netWorthHistory as Array<{
			netWorth: number;
			coinsWorth: Record<string, number>;
		}>) ?? [];

	const now = new Date();
	const nextHour = new Date(now);
	nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
	const nextCheckTime = nextHour.getTime();

	const redeemTime = user.portfolioCreatedAt
		? new Date(user.portfolioCreatedAt).getTime() + 24 * 60 * 60 * 1000
		: 0;

	return {
		portfolioData: {
			id: user.id,
			coins: portfolioCoins,
			nextCheckTime,
			redeemTime,
			netWorthHistory,
			hasPaid: user.hasPaid,
		},
		coins: coins, // full coin row for the coins in the user's portfolio
		user: user
	};
};
