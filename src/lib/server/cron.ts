import { prisma } from '$lib/server/database';
import { COINGECKO_API_KEY } from '$env/static/private';

export async function updateCoinPrices() {
  try {
    // Get all coins
    const coins = await prisma.coin.findMany();
    
    // Create batches of 100 coins (CoinGecko API limit)
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < coins.length; i += batchSize) {
      batches.push(coins.slice(i, i + batchSize));
    }

    // Update prices for each batch
    for (const batch of batches) {
      const coinIds = batch.map((coin) => coin.id).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`;

      const response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'x-cg-demo-api-key': COINGECKO_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prices from CoinGecko');
      }

      const prices = await response.json();

      // Update prices in database
      for (const coin of batch) {
        if (prices[coin.id]?.usd) {
          await prisma.coin.update({
            where: { id: coin.id },
            data: {
              current_price: prices[coin.id].usd,
              last_price_update: new Date()
            }
          });
        }
      }

      // Wait 1.5 seconds between batches to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } catch (error) {
    console.error('Error updating coin prices:', error);
  }
}