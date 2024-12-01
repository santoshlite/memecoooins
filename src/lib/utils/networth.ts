import { prisma } from '$lib/server/database';
import { COINGECKO_API_KEY } from '$env/static/private';

export async function updateCoinPrices() {
  try {
    const coins = await prisma.coin.findMany();
    
    const batchSize = 250;
    const batches = [];
    for (let i = 0; i < coins.length; i += batchSize) {
      batches.push(coins.slice(i, i + batchSize));
    }

    await Promise.all(batches.map(async (batch, index) => {
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

      // Create an array of valid update operations first
      const updates = batch
        .filter(coin => prices[coin.id]?.usd)
        .map(coin => 
          prisma.coin.update({
            where: { id: coin.id },
            data: {
              current_price: prices[coin.id].usd,
              last_price_update: new Date()
            }
          })
        );

      // Only run transaction if there are updates
      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }

      if (index < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }));
  } catch (error) {
    console.error('Error updating coin prices:', error);
  }
}

export async function updateUserNetWorth() {
  try {
    // Fetch users and coins in parallel
    const [users, coins] = await Promise.all([
      prisma.user.findMany({
        where: {
          portfolio: {
            not: "[]"
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

    const coinPrices = new Map(
      coins.map(coin => [coin.id, coin.current_price || 0])
    );

    // Batch update users in chunks
    const userBatchSize = 50;
    const userBatches = [];
    for (let i = 0; i < users.length; i += userBatchSize) {
      userBatches.push(users.slice(i, i + userBatchSize));
    }

    await Promise.all(userBatches.map(async (userBatch) => {
      await prisma.$transaction(
        userBatch.map(user => {
          const portfolio = user.portfolio as Array<{ quantity: number; id: string; }>;
          const coinsWorth: { [key: string]: number } = {};
          const netWorth = portfolio.reduce((total, holding) => {
            const worth = (coinPrices.get(holding.id) || 0) * holding.quantity;
            coinsWorth[holding.id] = worth;
            return total + worth;
          }, 0);

          const history = user.netWorthHistory as Array<{
            netWorth: number;
            coinsWorth: { [key: string]: number };
          }>;
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
    }));
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