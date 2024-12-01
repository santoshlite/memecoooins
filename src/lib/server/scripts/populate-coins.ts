import { populateCoins } from '../migrations/populate-coins';
import { prisma } from '../database';

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