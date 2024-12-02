import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/database';
import { PRIVATE_ENCRYPTION_KEY } from '$env/static/private';

export async function POST({ request }) {
	try {
		const { clerkId, publicKey, encryptedPrivateKey } = await request.json();

		if (!clerkId || !publicKey || !encryptedPrivateKey) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		const updatedUser = await prisma.user.update({
			where: { clerkId },
			data: {
				walletAddress: publicKey,
				encryptedPrivatekey: encryptedPrivateKey
			}
		});

		return json({ success: true, walletAddress: updatedUser.walletAddress });
	} catch (error) {
		console.error('Error saving wallet:', error);
		return json({ success: false, error: 'Failed to save wallet' }, { status: 500 });
	}
}
