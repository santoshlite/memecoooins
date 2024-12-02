// update-db.js

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch'; // For Node.js versions below 18
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

async function updateCoinPrices() {
	try {
		const coins = await prisma.coin.findMany({
			where: {
				active: true
			}
		});
		console.log(`Found ${coins.length} active coins to update`);

		const batchSize = 250;
		const batches = [];
		for (let i = 0; i < coins.length; i += batchSize) {
			batches.push(coins.slice(i, i + batchSize));
		}
		console.log(`Split coins into ${batches.length} batches of ${batchSize}`);

		for (const [index, batch] of batches.entries()) {
			console.log(`Processing batch ${index + 1}/${batches.length} (${batch.length} coins)`);
			const coinIds = batch.map((coin) => coin.id).join(',');
			const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`;

			const response = await fetch(url, {
				headers: {
					accept: 'application/json',
					'x-cg-demo-api-key': COINGECKO_API_KEY || ''
				}
			});

			if (!response.ok) {
				throw new Error('Failed to fetch prices from CoinGecko');
			}

			const prices = await response.json();

			const updates = batch
				.filter((coin) => prices[coin.id]?.usd)
				.map((coin) =>
					prisma.coin.update({
						where: { id: coin.id },
						data: {
							current_price: prices[coin.id].usd,
							last_price_update: new Date()
						}
					})
				);

			if (updates.length > 0) {
				await prisma.$transaction(updates);
				console.log(`Updated prices for ${updates.length} coins in batch ${index + 1}`);
			} else {
				console.log(`No valid prices found for batch ${index + 1}`);
			}

			if (index < batches.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limit delay
			}
		}
	} catch (error) {
		console.error('Error updating coin prices:', error);
		throw error;
	}
}

async function updateUserNetWorth() {
	try {
		const [users, coins] = await Promise.all([
			prisma.user.findMany({
				where: {
					portfolio: {
						not: '[]'
					}
				}
			}),
			prisma.coin.findMany({
				select: {
					id: true,
					current_price: true
				}
			})
		]);
		console.log(`Found ${users.length} users with portfolios to update`);
		console.log(`Loaded ${coins.length} coin prices for calculations`);

		const coinPrices = new Map(coins.map((coin) => [coin.id, coin.current_price || 0]));

		const userBatchSize = 50;
		const userBatches = [];
		for (let i = 0; i < users.length; i += userBatchSize) {
			userBatches.push(users.slice(i, i + userBatchSize));
		}
		console.log(`Split users into ${userBatches.length} batches of ${userBatchSize}`);

		for (const [index, userBatch] of userBatches.entries()) {
			console.log(
				`Processing user batch ${index + 1}/${userBatches.length} (${userBatch.length} users)`
			);
			await prisma.$transaction(
				userBatch.map((user) => {
					const portfolio = user.portfolio || [];
					const coinsWorth = {};
					const netWorth = portfolio.reduce((total, holding) => {
						const worth = (coinPrices.get(holding.id) || 0) * holding.quantity;
						coinsWorth[holding.id] = worth;
						return total + worth;
					}, 0);

					const history = user.netWorthHistory || [];
					history.push({ netWorth, coinsWorth });
					if (history.length > 24) history.shift();

					return prisma.user.update({
						where: { id: user.id },
						data: {
							netWorthHistory: history,
							lastNetWorthUpdate: new Date()
						}
					});
				})
			);
			console.log(`Updated net worth for batch ${index + 1}`);
		}
	} catch (error) {
		console.error('Error updating user net worth:', error);
		throw error;
	}
}

async function main() {
	const startTime = new Date();
	try {
		console.log('Starting database update...', new Date().toISOString());
		await updateCoinPrices();
		console.log('Coin prices updated successfully.');
		await updateUserNetWorth();
		console.log('User net worth updated successfully.');
		const duration = (new Date() - startTime) / 1000;
		console.log(`Database update completed in ${duration.toFixed(2)} seconds.`);
	} catch (error) {
		console.error('An error occurred during the database update:', error);
		process.exit(1); // Exit with failure
	} finally {
		await prisma.$disconnect();
	}
}

main();
