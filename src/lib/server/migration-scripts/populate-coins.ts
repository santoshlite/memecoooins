import { prisma } from '../database';
import memecoinsList from '$lib/data/memecoins_list.json';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

export async function populateCoins() {
	// Filter out coins without solana_contract_address and log them
	const validCoins = memecoinsList.filter((coin) => {
		if (!coin.solana_contract_address) {
			console.log(`Missing solana_contract_address for coin: ${coin.name} (${coin.id})`);
			return false;
		}
		return true;
	});

	console.log(`Found ${validCoins.length} valid coins out of ${memecoinsList.length} total coins`);

	// Process coins in batches of 100
	const batchSize = 100;
	const batches = [];
	for (let i = 0; i < validCoins.length; i += batchSize) {
		batches.push(validCoins.slice(i, i + batchSize));
	}

	console.log(`Split into ${batches.length} batches of up to ${batchSize} coins each`);

	// Process each batch
	for (let i = 0; i < batches.length; i++) {
		const batch = batches[i];
		console.log(`Processing batch ${i + 1}/${batches.length}`);

		try {
			// Get prices for the batch
			const coinIds = batch.map((coin) => coin.id).join(',');
			const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_last_updated_at=true`;

			const response = await fetch(url, {
				headers: {
					accept: 'application/json',
					'x-cg-demo-api-key': COINGECKO_API_KEY || ''
				}
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch prices: ${response.status} ${response.statusText}`);
			}

			const prices = await response.json();

			// Prepare coins data with prices
			const coinsData = batch.map((coin) => ({
				id: coin.id,
				symbol: coin.symbol,
				name: coin.name,
				solana_contract_address: coin.solana_contract_address,
				current_price: prices[coin.id]?.usd ?? null,
				last_price_update: prices[coin.id]?.last_updated_at
					? new Date(prices[coin.id].last_updated_at * 1000)
					: new Date()
			}));

			// Insert batch into database
			const result = await prisma.coin.createMany({
				data: coinsData,
				skipDuplicates: true
			});

			console.log(`Inserted ${result.count} coins from batch ${i + 1}`);

			// Wait between batches to respect rate limits
			if (i < batches.length - 1) {
				console.log('Waiting 1.5s before next batch...');
				await new Promise((resolve) => setTimeout(resolve, 1500));
			}
		} catch (error) {
			console.error(`Error processing batch ${i + 1}:`, error);
			// Continue with next batch instead of stopping completely
			continue;
		}
	}

	console.log('Finished populating coins');
}

async function main() {
	try {
		console.log('Starting to populate coins...');
		await populateCoins();
		console.log('Successfully populated coins!');
	} catch (error) {
		console.error('Error populating coins:', error);
	} finally {
		await prisma.$disconnect();
		process.exit();
	}
}

main();
