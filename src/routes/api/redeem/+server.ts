import { json } from '@sveltejs/kit';
import { decrypt } from '$lib/utils/encryption';
import { prisma } from '$lib/server/database';

export async function POST({ request, fetch }) {
	try {
		const { clerkId } = await request.json();

		// Get user and their encrypted key
		const user = await prisma.user.findUnique({
			where: { clerkId }
		});

		if (!user || !user.encryptedPrivatekey) {
			throw new Error('User or wallet not found');
		}

		if (user.hasRedeemed) {
			throw new Error('Wallet has already been redeemed');
		}

		// Decrypt the private key
		const decryptedPrivateKey = await decrypt(user.encryptedPrivatekey, fetch);

		// Mark wallet as redeemed
		await prisma.user.update({
			where: { clerkId },
			data: { hasRedeemed: true }
		});

		return json({
			success: true,
			privateKey: decryptedPrivateKey
		});
	} catch (error) {
		console.error('Redeem failed:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
