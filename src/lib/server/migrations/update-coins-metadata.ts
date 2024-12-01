import { prisma } from '../database';
import dotenv from 'dotenv';
import { Prisma } from '@prisma/client';

dotenv.config();
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

export async function updateCoinsMetadata() {
  // Get all coins from database that need metadata update
  const coins = await prisma.coin.findMany({
    where: {
      metadata: {
        equals: Prisma.DbNull,
      },
    },
  });

  console.log(`Found ${coins.length} coins that need metadata updates`);

  // Process one coin at a time with delay
  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    console.log(`Processing coin ${i + 1}/${coins.length}: ${coin.name}`);

    try {
      // Fetch detailed coin data
      const detailUrl = `https://api.coingecko.com/api/v3/coins/${coin.id}`;
      const detailResponse = await fetch(detailUrl, {
        headers: {
          'accept': 'application/json',
          'x-cg-demo-api-key': COINGECKO_API_KEY || ''
        }
      });

      if (!detailResponse.ok) {
        throw new Error(`Failed to fetch metadata: ${detailResponse.status} ${detailResponse.statusText}`);
      }

      const detailData = await detailResponse.json();
      const metadata = {
        description: detailData.description,
        image: detailData.image,
        market_data: detailData.market_data,
        links: detailData.links,
        community_data: detailData.community_data,
        developer_data: detailData.developer_data,
        public_notice: detailData.public_notice,
        categories: detailData.categories,
        platforms: detailData.platforms
      };

      // Update coin with metadata
      await prisma.coin.update({
        where: { id: coin.id },
        data: { metadata }
      });

      console.log(`Updated metadata for ${coin.name}`);

      // Wait 2.5 seconds between requests (roughly 24 requests per minute)
      console.log('Waiting 2.5s before next request...');
      await new Promise(resolve => setTimeout(resolve, 2500));

    } catch (error) {
      console.error(`Error updating metadata for ${coin.name}:`, error);
      // Wait a bit longer if there's an error (might be rate limiting)
      console.log('Error occurred, waiting 5s before continuing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }
  }

  console.log('Finished updating coin metadata');
}