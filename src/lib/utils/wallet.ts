import { Keypair, Connection } from '@solana/web3.js';
import { PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token';
import memecoinsList from '$lib/data/memecoins_list.json';
import { PrismaClient } from '@prisma/client';
import type { MemecoinWithAllocation } from '$lib/interfaces/utils';

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
	userWalletPrivateKey: Uint8Array,
	memecoinsWithAllocation: MemecoinWithAllocation[],
    clerkId: string
) {
	const response = await fetch('/api/swap', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			userWalletPrivateKey,
			memecoinsWithAllocation,
            clerkId
		})
	});

	const data = await response.json();

	if (!response.ok || !data.success) {
		throw new Error(data.error || 'Failed to perform swaps');
	} else {
		console.log('Swap performed successfully');
		console.log('RECEIVED', data.memecoinsReceived);
	}
}

export function generateSolanaWallet() {
	const keypair = Keypair.generate();
	const publicKey = keypair.publicKey.toString();

	// Convert Uint8Array to hex string without using Buffer
	const privateKey = Array.from(keypair.secretKey)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// Store securely
	if (window?.isSecureContext) {
		const encryptedPrivateKey = btoa(privateKey);
		sessionStorage.setItem('walletPrivateKey', encryptedPrivateKey);
	}

	return { publicKey };
}

export function getStoredWallet(): Uint8Array | null {
	const encryptedPrivateKey = sessionStorage.getItem('walletPrivateKey');
	if (!encryptedPrivateKey) return null;

	const privateKeyHex = atob(encryptedPrivateKey);
	// Convert hex string back to Uint8Array
	const privateKeyBytes = new Uint8Array(
		privateKeyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
	);

	return privateKeyBytes;
}

function allocateUSDC(totalAmount: number, numAllocations: number, minAllocation: number) {
	// Ensure there's enough totalAmount to meet the minimum allocation requirement
	if (totalAmount < numAllocations * minAllocation) {
		throw new Error('Total amount is insufficient to meet the minimum allocation requirement.');
	}

	// Initialize allocations with the minimum allocation
	const allocations = Array(numAllocations).fill(minAllocation);
	let remainingAmount = totalAmount - numAllocations * minAllocation;

	// Generate random weights for allocations
	const weights = Array(numAllocations)
		.fill(0)
		.map(() => Math.random());
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

	// Allocate the remaining amount based on weights
	for (let i = 0; i < numAllocations; i++) {
		allocations[i] += parseFloat(((weights[i] / totalWeight) * remainingAmount).toFixed(2));
	}

	// Ensure total allocations match totalAmount due to rounding errors
	let allocationSum = allocations.reduce((sum, value) => parseFloat((sum + value).toFixed(2)), 0);
	let diff = parseFloat((totalAmount - allocationSum).toFixed(2));

	// Adjust allocations to fix rounding differences
	for (let i = 0; diff !== 0 && i < allocations.length; i++) {
		const adjustment = diff > 0 ? 0.01 : -0.01;
		allocations[i] = parseFloat((allocations[i] + adjustment).toFixed(2));
		diff = parseFloat(
			(totalAmount - allocations.reduce((sum, value) => sum + value, 0)).toFixed(2)
		);
	}

	return allocations;
}

// Function to create a new wallet and fund it with USDC
export async function walletSetup(clerkId: string) {
	// Step 1: Generate a new wallet for the user
	const userKeypair = Keypair.generate();
	const userPublicKey = userKeypair.publicKey.toString();
	const amount = 0.5; // worth of memecoins

	// Step 2: Transfer right amount of USDC to the user's wallet
	await transferUSDCToUser(userPublicKey, amount);

	// Step 3: Generate random portfolio of memecoins given the amount of USDC
	const shuffledMemecoins = [...memecoinsList];

	for (let i = shuffledMemecoins.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledMemecoins[i], shuffledMemecoins[j]] = [shuffledMemecoins[j], shuffledMemecoins[i]];
	}

	const selectedMemecoins = shuffledMemecoins.slice(0, 4);

	const allocations = allocateUSDC(amount, selectedMemecoins.length, 0.1);

	// given memecoinslist take json object and add allocation field to each object
	const memecoinsWithAllocation = selectedMemecoins.map((memecoin, index) => ({
		...memecoin,
		allocation: allocations[index]
	}));

	// Step 4: Execute the transactions using Jupiter API
	const userWalletPrivateKey = getStoredWallet();
	if (!userWalletPrivateKey) {
		throw new Error('User wallet private key not found');
	} else {
		await performSwaps(userWalletPrivateKey, memecoinsWithAllocation as MemecoinWithAllocation[], clerkId as string);
	}
}
