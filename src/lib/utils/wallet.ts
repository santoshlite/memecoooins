import { Keypair, Connection } from '@solana/web3.js';
import { PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import {
	getOrCreateAssociatedTokenAccount,
	createTransferInstruction,
	getAssociatedTokenAddress
} from '@solana/spl-token';
import memecoinsList from '$lib/data/memecoins_list.json';
import { PrismaClient } from '@prisma/client';
import type { Memecoin } from '$lib/interfaces/utils';
import { encrypt, decrypt } from '$lib/utils/encryption';

const amount = 50;

export async function transferUSDCToUser(userPublicKey: string, amount: number) {
	const response = await fetch('/api/fund-user-wallet', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			userWalletAddress: userPublicKey,
			amount
		})
	});

	const data = await response.json();

	if (!response.ok || !data.success) {
		throw new Error(data.error || 'Failed to fund wallet');
	} else {
		console.log('Wallet funded successfully:', {
			userPublicKey,
			txSignature: data.signature
		});
	}
}

export async function performSwaps(
	encryptedPrivateKey: string,
	amount: number,
	memecoins: Memecoin[],
	clerkId: string,
	fetch: Function
) {
	const response = await fetch('/api/swap', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			encryptedPrivateKey,
			amount,
			memecoins,
			clerkId
		})
	});

	const data = await response.json();

	if (!response.ok || !data.success) {
		throw new Error(data.error || 'Failed to perform swaps');
	} else {
		console.log('Swap performed successfully');
		console.log('RECEIVED', data.memecoinsReceived);
		return { portfolio: data.portfolio, netWorthHistory: data.netWorthHistory };
	}
}

// Function to create a new wallet and fund it with USDC
export async function walletSetup(clerkId: string, fetch: Function) {
	// Step 1: Generate a new wallet for the user
	const userKeypair = Keypair.generate();
	const userPublicKey = userKeypair.publicKey.toString();
	const userPrivateKey = Array.from(userKeypair.secretKey)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// console.log('private key', userPrivateKey);
	const encryptedPrivateKey = await encrypt(userPrivateKey, fetch);

	// console.log('encrypted Private key', encryptedPrivateKey);

	// Save wallet data to database
	const response = await fetch('/api/save-wallet', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			clerkId,
			publicKey: userPublicKey,
			encryptedPrivateKey: encryptedPrivateKey
		})
	});

	if (!response.ok) {
		throw new Error('Failed to save wallet');
	}

	// Step 2: Transfer USDC and wait for proper confirmation
	// const fundingResult = await transferUSDCToUser(userPublicKey, amount);
	// console.log('Funding transaction:', fundingResult);

	// console.log('waiting 1 min real quick...');
	// await new Promise((resolve) => setTimeout(resolve, 60000)); // 2 minutes

	// Step 3 & 4: Now proceed with swaps
	const { portfolio, netWorthHistory } = await performSwaps(
		encryptedPrivateKey,
		amount,
		memecoinsList as Memecoin[],
		clerkId as string,
		fetch
	);

	return {
		portfolio,
		netWorthHistory
	};
}

export async function redeemWallet(clerkId: string) {
	try {
		const response = await fetch('/api/redeem', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ clerkId })
		});

		const data = await response.json();

		if (!response.ok || !data.success) {
			throw new Error(data.error || 'Failed to redeem wallet');
		}

		return {
			privateKey: data.privateKey
		};
	} catch (error) {
		console.error('Error in redeem process:', error);
		throw new Error(error instanceof Error ? error.message : 'Failed to redeem wallet');
	}
}
