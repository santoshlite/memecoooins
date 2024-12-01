import { prisma } from '../database';
import activeMemecoins from '$lib/data/active_memecoins.json';

export async function updateCoinsActiveStatus() {
  // Create a Set of coin IDs from the active memecoins list for faster lookups
  const currentCoinsSet = new Set(activeMemecoins.map(coin => coin.id));

  // Get all coins from database
  const dbCoins = await prisma.coin.findMany({
    select: {
      id: true,
      name: true,
      active: true
    }
  });

  console.log(`Found ${dbCoins.length} coins in database`);

  // Find coins that need to be activated
  const coinsToActivate = dbCoins.filter(coin => currentCoinsSet.has(coin.id));

  console.log(`Found ${coinsToActivate.length} coins that need to be activated`);

  // Update coins in batches
  const batchSize = 50;
  for (let i = 0; i < coinsToActivate.length; i += batchSize) {
    const batch = coinsToActivate.slice(i, i + batchSize);
    
    try {
      await prisma.coin.updateMany({
        where: {
          id: {
            in: batch.map(coin => coin.id)
          }
        },
        data: {
          active: true
        }
      });

      console.log(`Activated coins ${i + 1} to ${Math.min(i + batchSize, coinsToActivate.length)}`);
    } catch (error) {
      console.error(`Error activating batch starting at ${i}:`, error);
    }
  }

  console.log('Finished updating coin active status');
}

async function main() {
  try {
    console.log('Starting to update coin active status...');
    await updateCoinsActiveStatus();
    console.log('Successfully updated coin active status!');
  } catch (error) {
    console.error('Error updating coin active status:', error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

main();