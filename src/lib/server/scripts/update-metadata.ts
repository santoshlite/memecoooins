import { updateCoinsMetadata } from '../migrations/update-coins-metadata';
import { prisma } from '../database';

async function main() {
  try {
    console.log('Starting to update coin metadata...');
    await updateCoinsMetadata();
    console.log('Successfully updated coin metadata!');
  } catch (error) {
    console.error('Error updating coin metadata:', error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

main();