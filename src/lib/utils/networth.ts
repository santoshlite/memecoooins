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

export async function updateUserNetWorth() {
  try {
    // Get all users with portfolios
    const users = await prisma.user.findMany({
      where: {
        portfolio: {
          not: "[]"
        }
      }
    });

    // Get all coins with their current prices
    const coins = await prisma.coin.findMany({
      select: {
        id: true,
        current_price: true
      }
    });

    // Create a map of coin prices for faster lookup
    const coinPrices = new Map(
      coins.map(coin => [coin.id, coin.current_price || 0])
    );

    for (const user of users) {
      // Parse the portfolio JSON
      let portfolio = user.portfolio as Array<{
        quantity: number;
        id: string;
      }>;

      // Calculate coins worth and total net worth
      const coinsWorth: { [key: string]: number } = {};
      const netWorth = portfolio.reduce((total, holding) => {
        const price = coinPrices.get(holding.id) || 0;
        const worth = price * holding.quantity;
        coinsWorth[holding.id] = worth;
        return total + worth;
      }, 0);

      // Parse existing history and add new entry
      const history = user.netWorthHistory as Array<{
        netWorth: number;
        coinsWorth: { [key: string]: number };
      }>;
      history.push({ netWorth, coinsWorth });

      // Keep only last 24 entries (24 hours of history)
      if (history.length > 24) {
        // TODO: Should automatically sell the wallet!!!
        history.shift();
      }

      // Update user with new net worth history
      await prisma.user.update({
        where: { id: user.id },
        data: {
          netWorthHistory: history,
          lastNetWorthUpdate: new Date()
        }
      });
    }

    console.log('Successfully updated user net worth histories');
  } catch (error) {
    console.error('Error updating user net worth:', error);
  }
}

export async function runCronJobs() {
  try {
    console.log('Starting cron jobs...');
    await updateCoinPrices();
    console.log('Updated coin prices');
    await updateUserNetWorth();
    console.log('Updated user net worth');
    console.log('Completed cron jobs successfully');
  } catch (error) {
    console.error('Error in cron jobs:', error);
  }
}